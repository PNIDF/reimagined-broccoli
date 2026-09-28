import React, { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency, categoryLabels, categoryColors } from "@/lib/bank";
import { Plus, Pencil, Trash2, Bell, Mail, Send } from "lucide-react";
import BudgetForm from "@/components/BudgetForm";

const categoryHex = {
  courses: "#10b981", loisirs: "#8b5cf6", transport: "#3b82f6", logement: "#f59e0b",
  sante: "#f43f5e", restaurant: "#f97316", shopping: "#ec4899", factures: "#64748b", autre: "#94a3b8",
};

export default function Budgets() {
  const { toast } = useToast();
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
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

  const spendingByCategory = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear(), m = now.getMonth() + 1;
    const map = {};
    transactions.forEach((t) => {
      if (t.amount >= 0) return;
      const d = new Date(t.date);
      if (d.getFullYear() !== y || d.getMonth() + 1 !== m) return;
      const cat = t.category || "autre";
      if (!map[cat]) map[cat] = 0;
      map[cat] += Math.abs(t.amount);
    });
    return map;
  }, [transactions]);

  const exceededCount = budgets.filter((b) => (spendingByCategory[b.category] || 0) > b.limit_amount).length;

  const handleDelete = async (id) => {
    await base44.entities.Budget.delete(id);
    toast({ title: "Budget supprimé" });
    loadData();
  };

  const handleSendAlerts = async () => {
    setSending(true);
    try {
      const res = await base44.functions.invoke("checkBudgetAlerts", {});
      if (res.data.alerts.length === 0) {
        toast({ title: "Aucun seuil dépassé", description: "Tous vos budgets sont respectés ce mois-ci 👍" });
      } else if (res.data.sent) {
        toast({ title: "Alertes envoyées", description: `${res.data.alerts.length} alerte(s) envoyée(s) par email à ${res.data.email}` });
      } else {
        toast({ title: `${res.data.alerts.length} seuil(s) dépassé(s)`, description: "Aucun email envoyé (alertes email désactivées)." });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
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
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">Budgets & Alertes</h1>
          <p className="text-slate-500 text-sm mt-1">Définissez des seuils par catégorie et recevez une alerte en cas de dépassement.</p>
        </div>
        <div className="flex gap-2">
          {exceededCount > 0 && (
            <Button variant="outline" onClick={handleSendAlerts} disabled={sending}>
              <Send className="w-4 h-4" /> {sending ? "Envoi…" : `Envoyer ${exceededCount} alerte(s)`}
            </Button>
          )}
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="w-4 h-4" /> Seuil
          </Button>
        </div>
      </div>

      {exceededCount > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
          <Bell className="w-5 h-5 text-rose-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-rose-900">{exceededCount} seuil(s) dépassé(s) ce mois-ci</p>
            <p className="text-xs text-rose-600 mt-0.5">Cliquez sur « Envoyer » pour recevoir une alerte par email récapitulative.</p>
          </div>
        </div>
      )}

      {budgets.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500 mb-4">Aucun seuil défini pour le moment.</p>
            <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
              <Plus className="w-4 h-4" /> Définir mon premier seuil
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((b) => {
            const spent = spendingByCategory[b.category] || 0;
            const pct = b.limit_amount > 0 ? Math.min((spent / b.limit_amount) * 100, 100) : 0;
            const exceeded = spent > b.limit_amount;
            return (
              <Card key={b.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: categoryHex[b.category] }} />
                      <span className="text-sm font-medium text-slate-900">{categoryLabels[b.category]}</span>
                      {b.alert_email !== false && <Mail className="w-3.5 h-3.5 text-slate-400" />}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(b); setFormOpen(true); }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-500 hover:text-rose-600" onClick={() => handleDelete(b.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-2xl font-semibold text-slate-900">{formatCurrency(spent)}</span>
                    <span className="text-sm text-slate-400">/ {formatCurrency(b.limit_amount)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: exceeded ? "#f43f5e" : categoryHex[b.category] }}
                    />
                  </div>
                  <p className={`text-xs mt-2 ${exceeded ? "text-rose-500 font-medium" : "text-slate-400"}`}>
                    {exceeded
                      ? `Dépassé de ${formatCurrency(spent - b.limit_amount)}`
                      : `${Math.round(pct)}% du budget utilisé`}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <BudgetForm open={formOpen} onClose={() => setFormOpen(false)} onSaved={loadData} editing={editing} />
    </div>
  );
}