import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { queryClientInstance } from "@/lib/query-client";
import { queryKeys } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ResponsiveSelect from "@/components/ResponsiveSelect";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { categoryLabels, categoryColors } from "@/lib/bank";
import { useToast } from "@/components/ui/use-toast";
import { useTemplates } from "@/lib/queries";
import TemplateManagerModal from "@/components/TemplateManager";
import { BookmarkPlus, Settings2, Check, Wallet, ArrowRight } from "lucide-react";

export default function TransactionForm({ accounts, onClose, onSaved }) {
  const navigate = useNavigate();
  const [account_id, setAccountId] = useState(accounts[0]?.id || "");
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("debit");
  const [category, setCategory] = useState("autre");
  const [merchant, setMerchant] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [activeTemplateId, setActiveTemplateId] = useState(null);
  const { toast } = useToast();
  const { data: templates = [] } = useTemplates();

  const applyTemplate = (t) => {
    setLabel(t.label || "");
    setAmount(t.amount ? String(t.amount) : "");
    setType(t.type || "debit");
    setCategory(t.category || "autre");
    setMerchant(t.merchant || "");
    if (t.account_id) setAccountId(t.account_id);
    setActiveTemplateId(t.id);
    toast({ title: "Modèle appliqué", description: t.label });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!account_id || !label || !amount || !date) return;
    setSubmitting(true);
    const amt = parseFloat(amount) || 0;
    const signedAmount = type === "debit" ? -Math.abs(amt) : Math.abs(amt);
    const newTx = {
      id: `opt-${Date.now()}`,
      account_id,
      label,
      amount: signedAmount,
      type,
      category,
      merchant,
      date: new Date(date).toISOString(),
      status: "validee",
    };
    // Snapshot for rollback
    const prevTxs = queryClientInstance.getQueryData(queryKeys.transactions);
    const prevAccs = queryClientInstance.getQueryData(queryKeys.accounts);
    // Optimistic update — instant UI feedback
    queryClientInstance.setQueryData(queryKeys.transactions, (old = []) => [newTx, ...old]);
    queryClientInstance.setQueryData(queryKeys.accounts, (old = []) =>
      old.map((a) => (a.id === account_id ? { ...a, balance: (a.balance || 0) + signedAmount } : a))
    );
    try {
      await base44.entities.Transaction.create({
        account_id, label, amount: signedAmount, type, category, merchant,
        date: newTx.date, status: "validee",
      });
      const acc = accounts.find((a) => a.id === account_id);
      if (acc) {
        await base44.entities.Account.update(account_id, { balance: (acc.balance || 0) + signedAmount });
      }
      queryClientInstance.invalidateQueries(queryKeys.transactions);
      queryClientInstance.invalidateQueries(queryKeys.accounts);
      toast({ title: "Transaction ajoutée" });
      onSaved();
      // Déclenche la vérification des alertes budgétaires et de solde après une dépense.
      if (type === "debit") {
        base44.functions.invoke("checkBudgetAlerts", {}).then((res) => {
          if (res?.data?.sent) {
            toast({ title: "Alerte budget envoyée", description: "Une catégorie atteint 80 % ou dépasse son plafond — vérifiez vos emails." });
          }
        }).catch(() => {});
        base44.functions.invoke("checkBalanceAlerts", {}).then((res) => {
          if (res?.data?.sent) {
            toast({ title: "Alerte solde envoyée", description: "Un compte est passé sous son seuil — vérifiez vos emails." });
          }
        }).catch(() => {});
      }
    } catch (err) {
      // Rollback optimistic changes
      queryClientInstance.setQueryData(queryKeys.transactions, prevTxs);
      queryClientInstance.setQueryData(queryKeys.accounts, prevAccs);
      toast({ title: "Erreur lors de l'ajout", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvelle transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {templates.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5"><BookmarkPlus className="w-3.5 h-3.5" /> Modèles</Label>
                <button type="button" onClick={() => setShowTemplates(true)} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
                  <Settings2 className="w-3 h-3" /> Gérer
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {templates.map((t) => {
                  const catBg = (categoryColors[t.category] || categoryColors.autre).split(" ")[0];
                  const isActive = activeTemplateId === t.id;
                  const isDebit = t.type === "debit";
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => applyTemplate(t)}
                      className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border transition active:scale-95 ${
                        isActive
                          ? "border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                          : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full shrink-0 ${catBg}`} />
                      <span className="truncate max-w-[120px]">{t.label}</span>
                      <span className={`font-medium ${isActive ? "" : isDebit ? "text-rose-500 dark:text-rose-400" : "text-emerald-500 dark:text-emerald-400"}`}>
                        {isDebit ? "−" : "+"}{t.amount}€
                      </span>
                      {isActive && <Check className="w-3 h-3 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {templates.length === 0 && (
            <button type="button" onClick={() => setShowTemplates(true)} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
              <BookmarkPlus className="w-3.5 h-3.5" /> Créer des modèles pour les dépenses récurrentes
            </button>
          )}
          {accounts.length === 0 ? (
            <div className="space-y-2">
              <Label>Compte</Label>
              <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 text-center">
                <Wallet className="w-6 h-6 mx-auto text-slate-400 mb-2" />
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Aucun compte disponible.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Créez un compte pour pouvoir enregistrer une transaction.
                </p>
                <button
                  type="button"
                  onClick={() => { onClose(); navigate("/accounts"); }}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-1.5 text-xs font-medium hover:opacity-90 transition"
                >
                  Créer un compte <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Compte</Label>
              <ResponsiveSelect
                value={account_id}
                onValueChange={setAccountId}
                options={accounts.map((a) => ({ value: a.id, label: a.name }))}
                placeholder="Sélectionner un compte"
                title="Compte"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="t-label">Libellé</Label>
            <Input id="t-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex. Courses Carrefour" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Type</Label>
              <ResponsiveSelect
                value={type}
                onValueChange={setType}
                options={[{value: "debit", label: "Débit"}, {value: "credit", label: "Crédit"}]}
                title="Type"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-amount">Montant (€)</Label>
              <Input id="t-amount" type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <ResponsiveSelect
                value={category}
                onValueChange={setCategory}
                options={Object.entries(categoryLabels).map(([k, v]) => ({ value: k, label: v }))}
                title="Catégorie"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-date">Date</Label>
              <Input id="t-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="t-merchant">Commerçant (optionnel)</Label>
            <Input id="t-merchant" value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder="Ex. Carrefour" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={submitting || !account_id || !label || !amount} className="bg-slate-900 hover:bg-slate-800">
              {submitting ? "Ajout..." : "Ajouter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    {showTemplates && (
      <TemplateManagerModal accounts={accounts} templates={templates} onClose={() => setShowTemplates(false)} />
    )}
    </>
  );
}