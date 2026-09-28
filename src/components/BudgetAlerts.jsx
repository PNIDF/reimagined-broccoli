import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency, categoryLabels } from "@/lib/bank";
import { Bell, Send, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

const categoryHex = {
  courses: "#10b981", loisirs: "#8b5cf6", transport: "#3b82f6", logement: "#f59e0b",
  sante: "#f43f5e", restaurant: "#f97316", shopping: "#ec4899", factures: "#64748b", autre: "#94a3b8",
};

export default function BudgetAlerts() {
  const { toast } = useToast();
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadData = async () => {
    try {
      const [buds, txs] = await Promise.all([
        base44.entities.Budget.list(),
        base44.entities.Transaction.list("-date", 500),
      ]);
      setBudgets(buds);
      setTransactions(txs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const exceeded = budgets.filter((b) => {
    const now = new Date();
    const spent = transactions
      .filter((t) => {
        if (t.amount >= 0 || t.category !== b.category) return false;
        const d = new Date(t.date);
        return d.getFullYear() === now.getFullYear() && d.getMonth() + 1 === now.getMonth() + 1;
      })
      .reduce((s, t) => s + Math.abs(t.amount), 0);
    return spent > b.limit_amount;
  }).map((b) => {
    const spent = transactions
      .filter((t) => {
        if (t.amount >= 0 || t.category !== b.category) return false;
        const d = new Date(t.date);
        return d.getFullYear() === new Date().getFullYear() && d.getMonth() + 1 === new Date().getMonth() + 1;
      })
      .reduce((s, t) => s + Math.abs(t.amount), 0);
    return { ...b, spent };
  });

  const handleSendAlerts = async () => {
    setSending(true);
    try {
      const res = await base44.functions.invoke("checkBudgetAlerts", {});
      if (res.data.alerts.length === 0) {
        toast({ title: "Aucun seuil dépassé" });
      } else if (res.data.sent) {
        toast({ title: "Alertes envoyées", description: `Email envoyé à ${res.data.email}` });
      } else {
        toast({ title: `${res.data.alerts.length} seuil(s) dépassé(s)` });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    } finally {
      setSending(false);
    }
  };

  if (loading || exceeded.length === 0) return null;

  return (
    <Card className="border-rose-200">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2 text-rose-600">
          <AlertTriangle className="w-4 h-4" /> Alertes budgétaires
        </CardTitle>
        <Button size="sm" variant="outline" onClick={handleSendAlerts} disabled={sending}>
          <Send className="w-3.5 h-3.5" /> {sending ? "Envoi…" : "M'alerter"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {exceeded.map((b) => (
          <div key={b.id} className="flex items-center justify-between py-1.5 border-b border-rose-50 last:border-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: categoryHex[b.category] }} />
              <span className="text-sm font-medium text-slate-700">{categoryLabels[b.category]}</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-rose-600">{formatCurrency(b.spent)}</span>
              <span className="text-xs text-slate-400 ml-1">/ {formatCurrency(b.limit_amount)}</span>
            </div>
          </div>
        ))}
        <Link to="/budgets" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium block pt-1">
          Gérer mes budgets →
        </Link>
      </CardContent>
    </Card>
  );
}