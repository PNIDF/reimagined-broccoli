import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { queryClientInstance } from "@/lib/query-client";
import { queryKeys } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ResponsiveSelect from "@/components/ResponsiveSelect";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { validateIban, formatIban } from "@/lib/bank";
import { CheckCircle2 } from "lucide-react";

const colors = ["#0f172a", "#1e40af", "#6d28d9", "#be123c", "#047857", "#b45309", "#0369a1"];

export default function AccountForm({ onClose, onSaved, account }) {
  const [name, setName] = useState(account?.name || "");
  const [type, setType] = useState(account?.type || "courant");
  const [iban, setIban] = useState(account?.iban || "");
  const [balance, setBalance] = useState(account?.balance != null ? String(account.balance) : "");
  const [currency, setCurrency] = useState(account?.currency || "EUR");
  const [color, setColor] = useState(account?.color || colors[0]);
  const [cardNumber, setCardNumber] = useState(account?.card_number || "");
  const [alertThreshold, setAlertThreshold] = useState(account?.alert_threshold != null ? String(account.alert_threshold) : "");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const ibanCheck = validateIban(iban);
  const ibanError = iban && !ibanCheck.valid ? ibanCheck.error : null;
  const ibanValid = iban && ibanCheck.valid;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) return;
    if (ibanError) return;
    setSubmitting(true);
    const payload = {
      name, type, iban,
      balance: parseFloat(balance) || 0,
      currency, color, card_number: cardNumber,
      alert_threshold: alertThreshold === "" ? null : parseFloat(alertThreshold),
    };
    const prevAccs = queryClientInstance.getQueryData(queryKeys.accounts);
    if (account) {
      queryClientInstance.setQueryData(queryKeys.accounts, (old = []) =>
        old.map((a) => (a.id === account.id ? { ...a, ...payload } : a))
      );
      try {
        await base44.entities.Account.update(account.id, payload);
        queryClientInstance.invalidateQueries(queryKeys.accounts);
        toast({ title: "Compte modifié" });
        onSaved();
      } catch (err) {
        queryClientInstance.setQueryData(queryKeys.accounts, prevAccs);
        toast({ title: "Erreur lors de la modification", variant: "destructive" });
      } finally {
        setSubmitting(false);
      }
    } else {
      const newAcc = { id: `opt-${Date.now()}`, ...payload };
      queryClientInstance.setQueryData(queryKeys.accounts, (old = []) => [...old, newAcc]);
      try {
        await base44.entities.Account.create(payload);
        queryClientInstance.invalidateQueries(queryKeys.accounts);
        toast({ title: "Compte créé" });
        onSaved();
      } catch (err) {
        queryClientInstance.setQueryData(queryKeys.accounts, prevAccs);
        toast({ title: "Erreur lors de la création", variant: "destructive" });
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{account ? "Modifier le compte" : "Ouvrir un compte"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="a-name">Nom du compte</Label>
            <Input id="a-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Compte principal" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Type</Label>
              <ResponsiveSelect
                value={type}
                onValueChange={setType}
                options={[{value: "courant", label: "Courant"}, {value: "epargne", label: "Épargne"}, {value: "credits", label: "Crédit"}]}
                title="Type de compte"
              />
            </div>
            <div className="space-y-2">
              <Label>Devise</Label>
              <ResponsiveSelect
                value={currency}
                onValueChange={setCurrency}
                options={[{value: "EUR", label: "EUR €"}, {value: "USD", label: "USD $"}, {value: "GBP", label: "GBP £"}]}
                title="Devise"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="a-balance">Solde initial (€)</Label>
            <Input id="a-balance" type="number" step="0.01" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="0,00" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="a-iban">IBAN (optionnel)</Label>
            <div className="relative">
              <Input
                id="a-iban"
                value={iban}
                onChange={(e) => setIban(e.target.value.toUpperCase())}
                onBlur={(e) => setIban(formatIban(e.target.value))}
                placeholder="FR76 1234 5678 ..."
                className={`${ibanError ? "border-red-400 focus-visible:ring-red-400" : ""} ${ibanValid ? "pr-10 border-emerald-400 focus-visible:ring-emerald-400" : ""}`}
              />
              {ibanValid && (
                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500 pointer-events-none" />
              )}
            </div>
            {ibanError && <p className="text-xs text-red-500">{ibanError}</p>}
            {ibanValid && <p className="text-xs text-emerald-600">IBAN valide — Pays {ibanCheck.country} · Clé {ibanCheck.checkDigits} (mod 97 ✓)</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="a-card">4 derniers chiffres de carte (optionnel)</Label>
            <Input id="a-card" maxLength={4} value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="1234" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="a-threshold">Seuil d'alerte solde (€, optionnel)</Label>
            <Input
              id="a-threshold"
              type="number"
              step="0.01"
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(e.target.value)}
              placeholder="Ex. 100"
            />
            <p className="text-xs text-slate-500">Recevez un email si le solde passe sous ce montant.</p>
          </div>
          <div className="space-y-2">
            <Label>Couleur de la carte</Label>
            <div className="flex gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition ${color === c ? "ring-2 ring-offset-2 ring-slate-900" : ""}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={submitting || !name || !!ibanError} className="bg-slate-900 hover:bg-slate-800">
              {submitting ? (account ? "Modification..." : "Création...") : (account ? "Enregistrer" : "Créer le compte")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}