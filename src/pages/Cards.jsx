import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import BankCard from "@/components/BankCard";
import CardForm from "@/components/CardForm";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Eye, EyeOff, Snowflake, ShieldCheck, Ban, Pencil, CreditCard as CreditCardIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

const statusConfig = {
  active: { label: "Active", color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  frozen: { label: "Gelée", color: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  blocked: { label: "Bloquée", color: "bg-rose-100 text-rose-700", dot: "bg-rose-500" },
};

export default function Cards() {
  const [cards, setCards] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revealAll, setRevealAll] = useState(false);
  const [flippedId, setFlippedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editCard, setEditCard] = useState(null);
  const { toast } = useToast();

  const load = async () => {
    const [cs, accs] = await Promise.all([
      base44.entities.Card.list(),
      base44.entities.Account.list(),
    ]);
    setCards(cs);
    setAccounts(accs);
  };

  useEffect(() => {
    (async () => {
      try {
        await load();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const accountMap = React.useMemo(() => {
    const m = {};
    accounts.forEach((a) => (m[a.id] = a));
    return m;
  }, [accounts]);

  const updateStatus = async (card, status) => {
    try {
      await base44.entities.Card.update(card.id, { status });
      await load();
      toast({ title: `Carte ${statusConfig[status].label.toLowerCase()}` });
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
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
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">Cartes bancaires</h1>
          <p className="text-slate-500 text-sm mt-1">Personnalisez et sécurisez vos cartes</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setRevealAll((r) => !r)}>
            {revealAll ? <EyeOff className="w-4 h-4 mr-1.5" /> : <Eye className="w-4 h-4 mr-1.5" />}
            {revealAll ? "Masquer" : "Révéler"}
          </Button>
          <Button onClick={() => { setEditCard(null); setShowForm(true); }} className="bg-slate-900 hover:bg-slate-800">
            <Plus className="w-4 h-4 mr-1.5" /> Nouvelle carte
          </Button>
        </div>
      </div>

      {cards.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <CreditCardIcon className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium">Aucune carte pour le moment</p>
            <p className="text-sm text-slate-400 mt-1 mb-5">Créez votre première carte bancaire.</p>
            <Button onClick={() => { setEditCard(null); setShowForm(true); }} className="bg-slate-900 hover:bg-slate-800">
              <Plus className="w-4 h-4 mr-1.5" /> Créer une carte
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {cards.map((card) => {
            const acc = accountMap[card.account_id];
            const st = statusConfig[card.status];
            return (
              <div key={card.id} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Card visual */}
                <div className="space-y-3">
                  <div className="max-w-sm">
                    <BankCard
                      card={card}
                      reveal={revealAll}
                      flipped={flippedId === card.id}
                      onFlip={(f) => setFlippedId(f ? card.id : null)}
                    />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn("inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium", st.color)}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", st.dot)} />
                      {st.label}
                    </span>
                    {card.is_virtual && (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 font-medium">Virtuelle</span>
                    )}
                    {card.contactless && (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">Sans contact</span>
                    )}
                  </div>
                </div>

                {/* Details & actions */}
                <Card>
                  <CardContent className="p-5 space-y-4">
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide">Compte rattaché</p>
                      <p className="text-sm font-medium text-slate-900 mt-0.5">{acc?.name || "—"}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-50">
                      <div>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Numéro</p>
                        <p className="text-sm font-mono text-slate-900 mt-0.5">
                          {revealAll ? card.card_number : `•••• •••• •••• ${card.card_number?.slice(-4)}`}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> CVV</p>
                        <p className="text-sm font-mono text-slate-900 mt-0.5">{revealAll ? card.cvv : "•••"}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-400">Expiration</p>
                        <p className="text-sm font-mono text-slate-900 mt-0.5">{card.expiry}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-400">Réseau</p>
                        <p className="text-sm font-medium text-slate-900 mt-0.5 uppercase">{card.network}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-50">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateStatus(card, card.status === "frozen" ? "active" : "frozen")}
                        disabled={card.status === "blocked"}
                      >
                        <Snowflake className="w-3.5 h-3.5 mr-1.5" />
                        {card.status === "frozen" ? "Dégeler" : "Geler"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateStatus(card, card.status === "blocked" ? "active" : "blocked")}
                        className={card.status === "blocked" ? "" : "text-rose-600 hover:text-rose-700"}
                      >
                        <Ban className="w-3.5 h-3.5 mr-1.5" />
                        {card.status === "blocked" ? "Débloquer" : "Bloquer"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setEditCard(card); setShowForm(true); }}
                      >
                        <Pencil className="w-3.5 h-3.5 mr-1.5" /> Personnaliser
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <CardForm
          accounts={accounts}
          card={editCard}
          onClose={() => setShowForm(false)}
          onSaved={async () => {
            setShowForm(false);
            setEditCard(null);
            await load();
          }}
        />
      )}
    </div>
  );
}