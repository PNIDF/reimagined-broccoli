import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { formatCurrency, categoryLabels } from "@/lib/bank";
import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp, FileDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTransactions } from "@/lib/queries";
import { generateExpensePdf } from "@/lib/generateExpensePdf";

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

export default function Stats() {
  const { data: transactions = [], isLoading: loading } = useTransactions();
  const [currentMonth, setCurrentMonth] = useState(monthKey(new Date()));
  const [generating, setGenerating] = useState(false);

  const handleDownloadPdf = () => {
    if (byCategory.length === 0) return;
    setGenerating(true);
    try {
      generateExpensePdf({ monthKey: currentMonth, byCategory, totalSpent, totalIncome, variation });
    } catch (e) {
      // ignore
    } finally {
      setTimeout(() => setGenerating(false), 400);
    }
  };

  const shiftMonth = (delta) => {
    const [y, m] = currentMonth.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setCurrentMonth(monthKey(d));
  };

  const monthData = useMemo(() => {
    const [y, m] = currentMonth.split("-").map(Number);
    return transactions
      .filter((t) => {
        const d = new Date(t.date);
        return d.getFullYear() === y && d.getMonth() + 1 === m;
      });
  }, [transactions, currentMonth]);

  const byCategory = useMemo(() => {
    const map = {};
    monthData.forEach((t) => {
      if (t.amount >= 0) return; // only expenses
      const cat = t.category || "autre";
      if (!map[cat]) map[cat] = 0;
      map[cat] += Math.abs(t.amount);
    });
    return Object.entries(map)
      .map(([cat, value]) => ({ name: categoryLabels[cat] || cat, category: cat, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value);
  }, [monthData]);

  const totalSpent = byCategory.reduce((s, c) => s + c.value, 0);
  const totalIncome = monthData.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);

  // Previous month comparison
  const [py, pm] = currentMonth.split("-").map(Number);
  const prevKey = monthKey(new Date(py, pm - 2, 1));
  const prevSpent = useMemo(() => {
    const [yy, mm] = prevKey.split("-").map(Number);
    return transactions
      .filter((t) => {
        const d = new Date(t.date);
        return d.getFullYear() === yy && d.getMonth() + 1 === mm && t.amount < 0;
      })
      .reduce((s, t) => s + Math.abs(t.amount), 0);
  }, [transactions, prevKey]);

  const variation = prevSpent > 0 ? ((totalSpent - prevSpent) / prevSpent) * 100 : 0;

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
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">Statistiques</h1>
          <p className="text-slate-500 text-sm mt-1">Suivez votre budget mensuel par catégorie</p>
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
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPdf}
            disabled={generating || byCategory.length === 0}
            className="ml-1"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            PDF
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-slate-500">Dépenses du mois</p>
            <p className="text-2xl font-semibold text-slate-900 mt-1">{formatCurrency(totalSpent)}</p>
            {prevSpent > 0 && (
              <p className={cn("text-xs mt-1 flex items-center gap-1", variation > 0 ? "text-rose-500" : "text-emerald-600")}>
                {variation > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {variation > 0 ? "+" : ""}{variation.toFixed(1)}% vs mois précédent
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-slate-500">Revenus du mois</p>
            <p className="text-2xl font-semibold text-emerald-600 mt-1">{formatCurrency(totalIncome)}</p>
            <p className="text-xs text-slate-400 mt-1">Entrées totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-slate-500">Solde net</p>
            <p className={cn("text-2xl font-semibold mt-1", totalIncome - totalSpent >= 0 ? "text-emerald-600" : "text-rose-500")}>
              {formatCurrency(totalIncome - totalSpent)}
            </p>
            <p className="text-xs text-slate-400 mt-1">Revenus - dépenses</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Donut chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Répartition par catégorie</CardTitle>
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
                    <Pie
                      data={byCategory}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={100}
                      paddingAngle={2}
                    >
                      {byCategory.map((entry) => (
                        <Cell key={entry.category} fill={categoryHex[entry.category] || "#94a3b8"} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                      formatter={(v) => formatCurrency(v)}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 11 }}
                    />
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

        {/* Category breakdown */}
        <Card>
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
                  <div key={c.category} className="py-2.5 border-b border-slate-50 last:border-0">
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
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: categoryHex[c.category] }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}