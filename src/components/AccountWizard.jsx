import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { queryClientInstance } from "@/lib/query-client";
import { queryKeys } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ResponsiveSelect from "@/components/ResponsiveSelect";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { validateIban, formatIban, formatCurrency } from "@/lib/bank";
import { CheckCircle2, Wallet, PiggyBank, CreditCard, ArrowLeft, ArrowRight, Check } from "lucide-react";

const colors = ["#0f172a", "#1e40af", "#6d28d9", "#be123c", "#047857", "#b45309", "#0369a1"];

const accountTypes = [
  { value: "courant", label: "Compte courant", icon: Wallet, description: "Pour vos dépenses quotidiennes" },
  { value: "epargne", label: "Compte épargne", icon: PiggyBank, description: "Pour mettre de l'argent de côté" },
  { value: "credits", label: "Crédit", icon: CreditCard, description: "Pour suivre vos crédits" },
];

const steps = ["Type", "Coordonnées", "Détails", "Confirmation"];

function SummaryRow({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`text-sm text-slate-900 dark:text-slate-100 ${mono ? "font-mono" : "font-medium"}`}>{value}</span>
    </div>
  );
}

export default function AccountWizard({ onClose, onSaved }) {
  const [step, setStep] = useState(1);
  const [type, setType] = useState("courant");
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [balance, setBalance] = useState("");
  const [iban, setIban] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [alertThreshold, setAlertThreshold] = useState("");
  const [color, setColor] = useState(colors[0]);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const ibanCheck = validateIban(iban);
  const ibanError = iban && !ibanCheck.valid ? ibanCheck.error : null;
  const ibanValid = iban && ibanCheck.valid;

  const canNext = step === 1 ? true : step === 2 ? !!name : step === 3 ? !ibanError : true;
  const typeLabel = accountTypes.find((t) => t.value === type)?.label || "";

  const handleSubmit = async () => {
    setSubmitting(true);
    const payload = {
      name, type, iban,
      balance: parseFloat(balance) || 0,
      currency, color, card_number: cardNumber,
      alert_threshold: alertThreshold === "" ? null : parseFloat(alertThreshold),
    };
    const newAcc = { id: `opt-${Date.now()}`, ...payload };
    const prevAccs = queryClientInstance.getQueryData(queryKeys.accounts);
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
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ouvrir un compte</DialogTitle>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-3">
          {steps.map((s, i) => {
            const stepNum = i + 1;
            const done = stepNum < step;
            const active = stepNum === step;
            return (
              <React.Fragment key={s}>
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition ${
                    done ? "bg-emerald-500 text-white" : active ? "bg-slate-900 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-400"
                  }`}>
                    {done ? <Check className="w-4 h-4" /> : stepNum}
                  </div>
                  <span className={`text-[10px] ${active ? "text-slate-900 dark:text-slate-100 font-medium" : "text-slate-400"}`}>{s}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 -mt-4 ${stepNum < step ? "bg-emerald-500" : "bg-slate-100 dark:bg-slate-700"}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        <div className="min-h-[180px]">
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-slate-500 mb-2">Quel type de compte souhaitez-vous ouvrir ?</p>
              {accountTypes.map((t) => {
                const Icon = t.icon;
                const selected = type === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition text-left ${
                      selected ? "border-slate-900 dark:border-slate-100 bg-slate-50 dark:bg-slate-800" : "border-slate-100 dark:border-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selected ? "bg-slate-900 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-500"}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 dark:text-slate-100">{t.label}</p>
                      <p className="text-xs text-slate-500">{t.description}</p>
                    </div>
                    {selected && <CheckCircle2 className="w-5 h-5 text-slate-900 dark:text-slate-100" />}
                  </button>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="w-name">Nom du compte</Label>
                <Input id="w-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Compte principal" autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Devise</Label>
                  <ResponsiveSelect
                    value={currency}
                    onValueChange={setCurrency}
                    options={[{value: "EUR", label: "EUR €"}, {value: "USD", label: "USD $"}, {value: "GBP", label: "GBP £"}]}
                    title="Devise"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="w-balance">Solde initial</Label>
                  <Input id="w-balance" type="number" step="0.01" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="0,00" />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="w-iban">IBAN (optionnel)</Label>
                <div className="relative">
                  <Input
                    id="w-iban"
                    value={iban}
                    onChange={(e) => setIban(e.target.value.toUpperCase())}
                    onBlur={(e) => setIban(formatIban(e.target.value))}
                    placeholder="FR76 1234 5678 ..."
                    className={`${ibanError ? "border-red-400 focus-visible:ring-red-400" : ""} ${ibanValid ? "pr-10 border-emerald-400 focus-visible:ring-emerald-400" : ""}`}
                  />
                  {ibanValid && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500 pointer-events-none" />}
                </div>
                {ibanError && <p className="text-xs text-red-500">{ibanError}</p>}
                {ibanValid && <p className="text-xs text-emerald-600">IBAN valide — Pays {ibanCheck.country} · Clé {ibanCheck.checkDigits} (mod 97 ✓)</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="w-card">4 derniers chiffres</Label>
                  <Input id="w-card" maxLength={4} value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="1234" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="w-threshold">Seuil d'alerte (€)</Label>
                  <Input id="w-threshold" type="number" step="0.01" value={alertThreshold} onChange={(e) => setAlertThreshold(e.target.value)} placeholder="Ex. 100" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Couleur de la carte</Label>
                <div className="flex gap-2">
                  {colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full transition ${color === c ? "ring-2 ring-offset-2 ring-slate-900 dark:ring-slate-100" : ""}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="p-4 text-white" style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)` }}>
                  <p className="text-xs text-white/70">{typeLabel}</p>
                  <p className="text-lg font-semibold">{name || "Nom du compte"}</p>
                </div>
                <div className="p-4 space-y-2 bg-white dark:bg-slate-900">
                  <SummaryRow label="Solde initial" value={formatCurrency(parseFloat(balance) || 0, currency)} />
                  <SummaryRow label="Devise" value={currency} />
                  {iban && <SummaryRow label="IBAN" value={iban} mono />}
                  {cardNumber && <SummaryRow label="Carte" value={`•••• ${cardNumber}`} mono />}
                  {alertThreshold && <SummaryRow label="Seuil d'alerte" value={formatCurrency(parseFloat(alertThreshold) || 0, currency)} />}
                </div>
              </div>
              <p className="text-xs text-slate-500 text-center">Vérifiez les informations puis confirmez l'ouverture.</p>
            </div>
          )}
        </div>

        <div className="flex justify-between gap-2 pt-2">
          {step > 1 ? (
            <Button type="button" variant="outline" onClick={() => setStep(step - 1)} disabled={submitting}>
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Retour
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
          )}
          {step < 4 ? (
            <Button type="button" onClick={() => setStep(step + 1)} disabled={!canNext} className="bg-slate-900 hover:bg-slate-800">
              Continuer <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
              {submitting ? "Création..." : "Confirmer l'ouverture"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}