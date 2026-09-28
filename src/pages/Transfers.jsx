import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { queryClientInstance } from "@/lib/query-client";
import { queryKeys, useAccounts } from "@/lib/queries";
import { formatCurrency, validateIban, formatIban } from "@/lib/bank";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeftRight, Check, AlertCircle, Building2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { haptic, HAPTICS } from "@/lib/haptics";

export default function Transfers() {
  const { data: accounts = [], isLoading: loading } = useAccounts();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [label, setLabel] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [mode, setMode] = useState("internal");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [beneficiaryIban, setBeneficiaryIban] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (accounts.length > 0 && !from) setFrom(accounts[0].id);
    if (accounts.length > 1 && !to) setTo(accounts[1].id);
  }, [accounts, from, to]);

  const fromAccount = accounts.find((a) => a.id === from);
  const amountNum = parseFloat(amount) || 0;
  const insufficient = fromAccount && amountNum > fromAccount.balance;
  const sameAccount = from && to && from === to;
  const ibanCheck = beneficiaryIban ? validateIban(beneficiaryIban) : { valid: true, error: null };
  const externalReady = beneficiaryName.trim() && beneficiaryIban.trim() && ibanCheck.valid;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!from || !amountNum || !label) return;

    if (mode === "external") {
      if (!beneficiaryName.trim() || !beneficiaryIban.trim()) {
        haptic(HAPTICS.error);
        toast({ title: "Renseignez le bénéficiaire et son IBAN", variant: "destructive" });
        return;
      }
      if (!ibanCheck.valid) {
        haptic(HAPTICS.error);
        toast({ title: ibanCheck.error, variant: "destructive" });
        return;
      }
    } else {
      if (!to) return;
      if (sameAccount) {
        haptic(HAPTICS.error);
        toast({ title: "Sélectionnez deux comptes différents", variant: "destructive" });
        return;
      }
    }
    if (insufficient) {
      haptic(HAPTICS.error);
      toast({ title: "Solde insuffisant", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const now = new Date().toISOString();
    const toAcc = mode === "internal" ? accounts.find((a) => a.id === to) : null;

    const transactions = mode === "external"
      ? [{
          account_id: from,
          label: `Virement vers ${beneficiaryName}`,
          amount: -amountNum,
          type: "debit",
          category: "autre",
          date: now,
          merchant: label,
          status: "validee",
        }]
      : [
          {
            account_id: from,
            label: `Virement vers ${toAcc?.name}`,
            amount: -amountNum,
            type: "debit",
            category: "autre",
            date: now,
            merchant: label,
            status: "validee",
          },
          {
            account_id: to,
            label: `Virement de ${fromAccount?.name}`,
            amount: amountNum,
            type: "credit",
            category: "autre",
            date: now,
            merchant: label,
            status: "validee",
          },
        ];

    const accountUpdates = mode === "external"
      ? [{ id: from, balance: fromAccount.balance - amountNum }]
      : [
          { id: from, balance: fromAccount.balance - amountNum },
          { id: to, balance: toAcc.balance + amountNum },
        ];

    // Snapshot for rollback
    const prevTxs = queryClientInstance.getQueryData(queryKeys.transactions);
    const prevAccs = queryClientInstance.getQueryData(queryKeys.accounts);
    // Optimistic update — balances and listings update instantly
    queryClientInstance.setQueryData(queryKeys.transactions, (old = []) => [...transactions, ...old]);
    queryClientInstance.setQueryData(queryKeys.accounts, (old = []) =>
      old.map((a) => {
        const upd = accountUpdates.find((u) => u.id === a.id);
        return upd ? { ...a, balance: upd.balance } : a;
      })
    );
    try {
      await Promise.all(transactions.map((tx) => base44.entities.Transaction.create(tx)));
      await Promise.all(accountUpdates.map((u) => base44.entities.Account.update(u.id, { balance: u.balance })));

      queryClientInstance.invalidateQueries(queryKeys.transactions);
      queryClientInstance.invalidateQueries(queryKeys.accounts);
      haptic(HAPTICS.success);
      setSuccess(true);
      setAmount("");
      setLabel("");
      if (mode === "external") {
        setBeneficiaryName("");
        setBeneficiaryIban("");
      }
      setTimeout(() => setSuccess(false), 3000);
      // Déclenche la vérification des alertes de solde après le virement.
      base44.functions.invoke("checkBalanceAlerts", {}).then((res) => {
        if (res?.data?.sent) {
          toast({ title: "Alerte solde envoyée", description: "Un compte est passé sous son seuil — vérifiez vos emails." });
        }
      }).catch(() => {});
    } catch (err) {
      // Rollback optimistic changes
      queryClientInstance.setQueryData(queryKeys.transactions, prevTxs);
      queryClientInstance.setQueryData(queryKeys.accounts, prevAccs);
      haptic(HAPTICS.error);
      toast({ title: "Erreur lors du virement", variant: "destructive" });
    } finally {
      setSubmitting(false);
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
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">Virement</h1>
        <p className="text-slate-500 text-sm mt-1">Transférez de l'argent entre vos comptes</p>
      </div>

      {accounts.length < 1 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">Aucun compte disponible</p>
            <p className="text-sm text-slate-400 mt-1">Ouvrez un compte pour effectuer des virements.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-slate-400" /> Nouveau virement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => setMode("internal")}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition ${
                    mode === "internal" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-500"
                  }`}
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" /> Entre mes comptes
                </button>
                <button
                  type="button"
                  onClick={() => setMode("external")}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition ${
                    mode === "external" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-500"
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" /> Autre banque
                </button>
              </div>

              <div className="space-y-2">
                <Label>Compte à débiter</Label>
                <Select value={from} onValueChange={setFrom}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name} · {formatCurrency(a.balance, a.currency)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fromAccount && (
                  <p className="text-xs text-slate-500">Solde disponible : {formatCurrency(fromAccount.balance, fromAccount.currency)}</p>
                )}
              </div>

              {mode === "internal" ? (
                <div className="space-y-2">
                  <Label>Compte à créditer</Label>
                  <Select value={to} onValueChange={setTo}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="ben-name">Nom du bénéficiaire</Label>
                    <Input
                      id="ben-name"
                      placeholder="Ex. Jean Dupont"
                      value={beneficiaryName}
                      onChange={(e) => setBeneficiaryName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ben-iban">IBAN du bénéficiaire</Label>
                    <div className="relative">
                      <Input
                        id="ben-iban"
                        placeholder="FR76 1234 5678 ..."
                        value={beneficiaryIban}
                        onChange={(e) => setBeneficiaryIban(formatIban(e.target.value))}
                        className={`font-mono pr-10 ${
                          beneficiaryIban && !ibanCheck.valid ? "border-rose-400 focus-visible:ring-rose-400" : ""
                        } ${ibanCheck.valid && beneficiaryIban ? "border-emerald-400 focus-visible:ring-emerald-400" : ""}`}
                      />
                      {ibanCheck.valid && beneficiaryIban && (
                        <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500 pointer-events-none" />
                      )}
                    </div>
                    {beneficiaryIban && !ibanCheck.valid && (
                      <p className="text-xs text-rose-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {ibanCheck.error}
                      </p>
                    )}
                    {ibanCheck.valid && beneficiaryIban && (
                      <p className="text-xs text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> IBAN valide — Pays {ibanCheck.country} · Clé {ibanCheck.checkDigits} (mod 97 ✓)
                      </p>
                    )}
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="amount">Montant (€)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                {insufficient && (
                  <p className="text-xs text-rose-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Solde insuffisant pour ce virement.
                  </p>
                )}
                {mode === "internal" && sameAccount && (
                  <p className="text-xs text-rose-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Sélectionnez deux comptes différents.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="label">Motif du virement</Label>
                <Input
                  id="label"
                  placeholder="Ex. Loyer, remboursement..."
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                disabled={submitting || !amountNum || !label || insufficient || (mode === "internal" ? (sameAccount || !to) : !externalReady)}
                className="w-full h-12 text-base bg-slate-900 hover:bg-slate-800"
              >
                {submitting ? "Traitement..." : success ? (
                  <span className="flex items-center gap-1.5"><Check className="w-4 h-4" /> Virement effectué</span>
                ) : "Effectuer le virement"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}