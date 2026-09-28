import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { queryClientInstance } from "@/lib/query-client";
import { queryKeys } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { categoryLabels } from "@/lib/bank";
import { useToast } from "@/components/ui/use-toast";
import { Trash2 } from "lucide-react";

export default function TemplateManager({ accounts, templates, onClose }) {
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("debit");
  const [category, setCategory] = useState("factures");
  const [merchant, setMerchant] = useState("");
  const [recurringDay, setRecurringDay] = useState("");
  const [account_id, setAccountId] = useState(accounts[0]?.id || "");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!label || !amount) return;
    setSubmitting(true);
    try {
      await base44.entities.TransactionTemplate.create({
        label,
        amount: parseFloat(amount),
        type,
        category,
        merchant,
        recurring_day: recurringDay ? parseInt(recurringDay, 10) : undefined,
        account_id: account_id || undefined,
      });
      queryClientInstance.invalidateQueries(queryKeys.templates);
      setLabel("");
      setAmount("");
      setMerchant("");
      setRecurringDay("");
      toast({ title: "Modèle enregistré" });
    } catch (err) {
      toast({ title: "Erreur", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.TransactionTemplate.delete(id);
      queryClientInstance.invalidateQueries(queryKeys.templates);
      toast({ title: "Modèle supprimé" });
    } catch (err) {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modèles de transactions récurrentes</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {templates.length > 0 && (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {templates.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{t.label}</p>
                    <p className="text-xs text-slate-500">
                      {categoryLabels[t.category] || "Autre"} · {t.amount}€ · {t.type === "debit" ? "Débit" : "Crédit"}
                      {t.recurring_day ? ` · le ${t.recurring_day} du mois` : ""}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)} className="h-8 w-8 text-slate-400 hover:text-rose-500">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <form onSubmit={handleCreate} className="space-y-3 border-t border-slate-100 dark:border-slate-700 pt-3">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Nouveau modèle</p>
            <div className="space-y-2">
              <Label htmlFor="tpl-label">Libellé</Label>
              <Input id="tpl-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex. Loyer" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debit">Débit</SelectItem>
                    <SelectItem value="credit">Crédit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tpl-amount">Montant (€)</Label>
                <Input id="tpl-amount" type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Compte par défaut</Label>
                <Select value={account_id} onValueChange={setAccountId}>
                  <SelectTrigger><SelectValue placeholder="Aucun" /></SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="tpl-merchant">Commerçant (optionnel)</Label>
                <Input id="tpl-merchant" value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder="Ex. Free" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tpl-recurring">Jour de prélèvement</Label>
                <Input
                  id="tpl-recurring"
                  type="number"
                  min="1"
                  max="31"
                  value={recurringDay}
                  onChange={(e) => setRecurringDay(e.target.value)}
                  placeholder="Ex. 15"
                />
              </div>
            </div>
            {type === "debit" && (
              <p className="text-xs text-slate-500 -mt-1">
                Renseignez le jour pour activer l'alerte proactive quelques jours avant l'échéance.
              </p>
            )}
            <Button type="submit" disabled={submitting || !label || !amount} className="w-full bg-slate-900 hover:bg-slate-800">
              {submitting ? "Enregistrement..." : "Enregistrer le modèle"}
            </Button>
          </form>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} className="w-full">Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}