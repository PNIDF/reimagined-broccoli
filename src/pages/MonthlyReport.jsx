import React, { useEffect, useState, useMemo, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { formatCurrency, formatDate, categoryLabels } from "@/lib/bank";
import { ChevronLeft, ChevronRight, Download, TrendingUp, TrendingDown, FileText, Mail } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import GoogleSheetsExport from "@/components/GoogleSheetsExport";

const categoryHex = {
  courses: "#10b981",
  loisirs: "#8b5cf6",
  transport: "#3b82f6",
  logement: "#f59e0b",
  sante: "#f43f5e",
  salaire: "#22c55e",
  restaurant: "#f97316",
  shopping: "#ec4899",
  factures: "#64748b",
  autre: "#94a3b8",
};

function monthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key) {
  const [y, m] = key.split("-");
  return new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

export default function MonthlyReport() {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(monthKey(new Date()));
  const [sending, setSending] = useState(false);
  const reportRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const [txs, accs] = await Promise.all([
          base44.entities.Transaction.list("-date", 1000),
          base44.entities.Account.list(),
        ]);
        setTransactions(txs);
        setAccounts(accs);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const shiftMonth = (delta) => {
    const [y, m] = currentMonth.split("-").map(Number);
    setCurrentMonth(monthKey(new Date(y, m - 1 + delta, 1)));
  };

  const monthData = useMemo(() => {
    const [y, m] = currentMonth.split("-").map(Number);
    return transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getFullYear() === y && d.getMonth() + 1 === m;
    });
  }, [transactions, currentMonth]);

  const totalSpent = monthData.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalIncome = monthData.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const netSavings = totalIncome - totalSpent;

  const byCategory = useMemo(() => {
    const map = {};
    monthData.forEach((t) => {
      if (t.amount >= 0) return;
      const cat = t.category || "autre";
      map[cat] = (map[cat] || 0) + Math.abs(t.amount);
    });
    return Object.entries(map)
      .map(([cat, value]) => ({ name: categoryLabels[cat] || cat, category: cat, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value);
  }, [monthData]);

  // Évolution de l'épargne sur 6 mois (net cumulé)
  const savingsEvolution = useMemo(() => {
    const [cy, cm] = currentMonth.split("-").map(Number);
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(cy, cm - 1 - i, 1);
      const key = monthKey(d);
      const label = d.toLocaleDateString("fr-FR", { month: "short" });
      const monthTx = transactions.filter((t) => {
        const td = new Date(t.date);
        return monthKey(td) === key;
      });
      const income = monthTx.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
      const spent = monthTx.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
      months.push({ label, net: Math.round((income - spent) * 100) / 100 });
    }
    let cumul = 0;
    return months.map((m) => {
      cumul += m.net;
      return { ...m, cumul: Math.round(cumul * 100) / 100 };
    });
  }, [transactions, currentMonth]);

  const topTransactions = useMemo(
    () => [...monthData].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount)).slice(0, 10),
    [monthData]
  );

  const savingsBalance = accounts.filter((a) => a.type === "epargne").reduce((s, a) => s + (a.balance || 0), 0);

  const handleDownloadPDF = async () => {
    if (!reportRef.current || exporting) return;
    setExporting(true);
    const root = document.documentElement;
    const wasDark = root.classList.contains("dark");
    if (wasDark) root.classList.remove("dark");
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pageWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`rapport-${currentMonth}.pdf`);
    } finally {
      if (wasDark) root.classList.add("dark");
      setExporting(false);
    }
  };

  const handleSendEmail = async () => {
    if (sending) return;
    setSending(true);
    try {
      await base44.functions.invoke("sendMonthlyReport", { month: currentMonth });
      toast({
        title: "Rapport envoyé",
        description: `Un email récapitulatif pour ${monthLabel(currentMonth)} a été envoyé à votre adresse.`,
      });
    } catch (e) {
      toast({
        title: "Échec de l'envoi",
        description: "Le rapport n'a pas pu être envoyé par email. Réessayez plus tard.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            Rapport mensuel
          </h1>
          <p className="text-slate-500 text-sm mt-1">Synthèse de vos dépenses, revenus et épargne — exportable en PDF</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => shiftMonth(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium text-slate-700 min-w-[140px] text-center capitalize">
            {monthLabel(currentMonth)}
          </span>
          <Button variant="outline" size="icon" onClick={() => shiftMonth(1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button onClick={handleDownloadPDF} disabled={exporting} className="ml-1 bg-indigo-600 hover:bg-indigo-700 text-white">
            <Download className="w-4 h-4" />
            {exporting ? "Génération…" : "Télécharger PDF"}
          </Button>
          <Button onClick={handleSendEmail} disabled={sending} variant="outline" className="ml-1 border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
            <Mail className="w-4 h-4" />
            {sending ? "Envoi…" : "Envoyer par email"}
          </Button>
        </div>
      </div>

      <div ref={reportRef} className="bg-white p-1 space-y-6">
        {/* En-tête du rapport */}
        <div className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs text-slate-300 uppercase tracking-wide">Rapport financier</p>
              <p className="text-xl font-semibold mt-1 capitalize">{monthLabel(currentMonth)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-300">Épargne totale</p>
              <p className="text-xl font-semibold mt-1">{formatCurrency(savingsBalance)}</p>
            </div>
          </div>
        </div>

        {/* Cartes synthèse */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-slate-200">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">Dépenses</p>
                <TrendingUp className="w-4 h-4 text-rose-500" />
              </div>
              <p className="text-2xl font-semibold text-slate-900 mt-1">{formatCurrency(totalSpent)}</p>
              <p className="text-xs text-slate-400 mt-1">{monthData.filter((t) => t.amount < 0).length} transactions</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">Revenus</p>
                <TrendingDown className="w-4 h-4 text-emerald-500 rotate-180" />
              </div>
              <p className="text-2xl font-semibold text-emerald-600 mt-1">{formatCurrency(totalIncome)}</p>
              <p className="text-xs text-slate-400 mt-1">{monthData.filter((t) => t.amount > 0).length} entrées</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">Épargne nette</p>
                <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", netSavings >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}>
                  {netSavings >= 0 ? "Positif" : "Négatif"}
                </span>
              </div>
              <p className={cn("text-2xl font-semibold mt-1", netSavings >= 0 ? "text-emerald-600" : "text-rose-500")}>
                {formatCurrency(netSavings)}
              </p>
              <p className="text-xs text-slate-400 mt-1">Revenus - dépenses</p>
            </CardContent>
          </Card>
        </div>

        {/* Évolution de l'épargne */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Évolution de l'épargne (6 mois)</CardTitle>
          </CardHeader>
          <CardContent>
            {savingsEvolution.every((m) => m.cumul === 0) ? (
              <div className="h-64 flex items-center justify-center text-sm text-slate-400">
                Pas assez de données pour afficher l'évolution.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={savingsEvolution} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gEpargne" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}€`} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} formatter={(v) => formatCurrency(v)} />
                  <Area type="monotone" dataKey="cumul" stroke="#6366f1" strokeWidth={2} fill="url(#gEpargne)" name="Épargne cumulée" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Répartition par catégorie */}
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Répartition des dépenses</CardTitle>
            </CardHeader>
            <CardContent>
              {byCategory.length === 0 ? (
                <div className="h-72 flex items-center justify-center text-sm text-slate-400">
                  Aucune dépense ce mois-ci.
                </div>
              ) : (
                <div className="relative">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={byCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={65} outerRadius={100} paddingAngle={2}>
                        {byCategory.map((entry) => (
                          <Cell key={entry.category} fill={categoryHex[entry.category] || "#94a3b8"} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} formatter={(v) => formatCurrency(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute top-[88px] left-1/2 -translate-x-1/2 text-center pointer-events-none">
                    <p className="text-xs text-slate-400">Total</p>
                    <p className="text-lg font-semibold text-slate-900">{formatCurrency(totalSpent)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Détail par catégorie */}
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Détail par catégorie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {byCategory.length === 0 ? (
                <p className="text-sm text-slate-400 py-12 text-center">Aucune dépense à afficher.</p>
              ) : (
                byCategory.map((c) => {
                  const pct = totalSpent > 0 ? (c.value / totalSpent) * 100 : 0;
                  return (
                    <div key={c.category} className="py-2.5 border-b border-slate-100 last:border-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: categoryHex[c.category] }} />
                          <span className="text-sm font-medium text-slate-700">{c.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-slate-900">{formatCurrency(c.value)}</span>
                          <span className="text-xs text-slate-400 ml-2">{pct.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: categoryHex[c.category] }} />
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top transactions */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Principales transactions du mois</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {topTransactions.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">Aucune transaction ce mois-ci.</p>
            ) : (
              topTransactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{t.label}</p>
                    <p className="text-[11px] text-slate-400">
                      {t.merchant ? `${t.merchant} · ` : ""}{formatDate(t.date)} · {categoryLabels[t.category] || "Autre"}
                    </p>
                  </div>
                  <p className={cn("text-sm font-semibold", t.amount > 0 ? "text-emerald-600" : "text-slate-900")}>
                    {t.amount > 0 ? "+" : ""}{formatCurrency(t.amount)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Export Google Sheets (hors zone PDF) */}
      <GoogleSheetsExport />
    </div>
  );
}