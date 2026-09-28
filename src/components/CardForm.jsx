import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ResponsiveSelect from "@/components/ResponsiveSelect";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";

const gradients = [
  { label: "Ardoise", value: "linear-gradient(135deg, #1e293b, #0f172a)" },
  { label: "Océan", value: "linear-gradient(135deg, #0369a1, #0c4a6e)" },
  { label: "Violet", value: "linear-gradient(135deg, #6d28d9, #4c1d95)" },
  { label: "Émeraude", value: "linear-gradient(135deg, #047857, #064e3b)" },
  { label: "Corail", value: "linear-gradient(135deg, #be123c, #881337)" },
  { label: "Ambre", value: "linear-gradient(135deg, #b45309, #78350f)" },
  { label: "Nuit", value: "linear-gradient(135deg, #312e81, #1e1b4b)" },
  { label: "Minuit", value: "linear-gradient(135deg, #0f172a, #334155)" },
];

function randomDigits(n) {
  let s = "";
  for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 10);
  return s;
}

export default function CardForm({ accounts, card, onClose, onSaved }) {
  const isEdit = !!card;
  const [account_id, setAccountId] = useState(card?.account_id || accounts[0]?.id || "");
  const [holder_name, setHolderName] = useState(card?.holder_name || "");
  const [card_number, setCardNumber] = useState(card?.card_number || "");
  const [expiry, setExpiry] = useState(card?.expiry || "");
  const [cvv, setCvv] = useState(card?.cvv || "");
  const [network, setNetwork] = useState(card?.network || "visa");
  const [gradient, setGradient] = useState(card?.gradient || gradients[0].value);
  const [is_virtual, setIsVirtual] = useState(card?.is_virtual || false);
  const [contactless, setContactless] = useState(card?.contactless !== false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const generate = () => {
    setCardNumber(`4${randomDigits(15)}`);
    setCvv(randomDigits(3));
    const now = new Date();
    const expMonth = String(now.getMonth() + 1).padStart(2, "0");
    const expYear = String((now.getFullYear() + 4) % 100).padStart(2, "0");
    setExpiry(`${expMonth}/${expYear}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!account_id || !holder_name || !card_number || !expiry || !cvv) return;
    setSubmitting(true);
    try {
      const payload = {
        account_id, holder_name, card_number, expiry, cvv, network, gradient, is_virtual, contactless,
      };
      if (isEdit) {
        await base44.entities.Card.update(card.id, payload);
        toast({ title: "Carte mise à jour" });
      } else {
        await base44.entities.Card.create(payload);
        toast({ title: "Carte créée" });
      }
      onSaved();
    } catch (err) {
      toast({ title: "Erreur", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier la carte" : "Nouvelle carte bancaire"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Compte associé</Label>
            {accounts.length === 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
                <p className="text-amber-800 font-medium">Aucun compte disponible</p>
                <p className="text-amber-600 text-xs mt-0.5">Créez d'abord un compte pour pouvoir associer une carte.</p>
                <Link to="/accounts" onClick={onClose} className="inline-flex items-center gap-1 text-amber-700 font-medium underline mt-2">
                  Créer un compte →
                </Link>
              </div>
            ) : (
              <ResponsiveSelect
                value={account_id}
                onValueChange={setAccountId}
                options={accounts.map((a) => ({ value: a.id, label: a.name }))}
                placeholder="Sélectionner un compte"
                title="Compte associé"
              />
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-holder">Titulaire</Label>
            <Input id="c-holder" value={holder_name} onChange={(e) => setHolderName(e.target.value.toUpperCase())} placeholder="JEAN DUPONT" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Réseau</Label>
              <ResponsiveSelect
                value={network}
                onValueChange={setNetwork}
                options={[{value: "visa", label: "Visa"}, {value: "mastercard", label: "Mastercard"}, {value: "amex", label: "Amex"}]}
                title="Réseau"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-expiry">Expiration (MM/AA)</Label>
              <Input id="c-expiry" value={expiry} onChange={(e) => setExpiry(e.target.value)} placeholder="09/29" maxLength={5} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="c-number">Numéro (16 chiffres)</Label>
              <Input id="c-number" value={card_number} onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ""))} maxLength={16} placeholder="4..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-cvv">CVV</Label>
              <Input id="c-cvv" value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))} maxLength={3} placeholder="123" />
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={generate} className="w-full">
            Générer numéro / CVV / expiration
          </Button>

          <div className="space-y-2">
            <Label>Visuel (dégradé)</Label>
            <div className="grid grid-cols-4 gap-2">
              {gradients.map((g) => (
                <button
                  key={g.label}
                  type="button"
                  onClick={() => setGradient(g.value)}
                  title={g.label}
                  className={`h-10 rounded-lg transition ${gradient === g.value ? "ring-2 ring-offset-2 ring-slate-900" : "ring-1 ring-slate-200"}`}
                  style={{ background: g.value }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
            <div>
              <p className="text-sm font-medium">Carte virtuelle</p>
              <p className="text-xs text-slate-400">Sans support physique</p>
            </div>
            <Switch checked={is_virtual} onCheckedChange={setIsVirtual} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
            <div>
              <p className="text-sm font-medium">Sans contact</p>
              <p className="text-xs text-slate-400">Paiement NFC</p>
            </div>
            <Switch checked={contactless} onCheckedChange={setContactless} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={submitting || accounts.length === 0} className="bg-slate-900 hover:bg-slate-800">
              {submitting ? "Enregistrement..." : isEdit ? "Enregistrer" : "Créer la carte"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}