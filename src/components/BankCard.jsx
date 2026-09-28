import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Wifi } from "lucide-react";

const networkLabels = {
  visa: "VISA",
  mastercard: "Mastercard",
  amex: "AMEX",
};

function formatCardNumber(num, reveal) {
  const digits = (num || "").replace(/\s/g, "");
  if (digits.length < 16) return digits;
  if (reveal) {
    return digits.replace(/(.{4})/g, "$1 ").trim();
  }
  return `•••• •••• •••• ${digits.slice(-4)}`;
}

export default function BankCard({ card, reveal, onFlip, flipped, className }) {
  const [internalFlip, setInternalFlip] = useState(false);
  const isFlipped = flipped !== undefined ? flipped : internalFlip;

  const handleFlip = () => {
    if (onFlip) onFlip(!isFlipped);
    else setInternalFlip((f) => !f);
  };

  return (
    <div className={cn("[perspective:1400px]", className)}>
      <div
        className="relative w-full transition-transform duration-700 [transform-style:preserve-3d]"
        style={{ transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)", aspectRatio: "1.586 / 1" }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 rounded-2xl p-5 text-white shadow-xl [backface-visibility:hidden] flex flex-col justify-between overflow-hidden"
          style={{ background: card.gradient || "linear-gradient(135deg, #1e293b, #0f172a)" }}
        >
          {/* decorative circles */}
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-12 -left-6 w-28 h-28 rounded-full bg-white/5" />

          <div className="relative flex items-start justify-between">
            <div>
              <div className="w-11 h-8 rounded-md bg-gradient-to-br from-yellow-200 to-yellow-400/80 shadow-inner" />
              {card.contactless && <Wifi className="w-4 h-4 text-white/70 mt-2 rotate-90" />}
            </div>
            <span className="text-sm font-bold italic tracking-wide">{networkLabels[card.network] || "VISA"}</span>
          </div>

          <div className="relative">
            <p className="font-mono text-base sm:text-lg tracking-[0.15em] drop-shadow">
              {formatCardNumber(card.card_number, reveal)}
            </p>
          </div>

          <div className="relative flex items-end justify-between">
            <div>
              <p className="text-[9px] uppercase tracking-wider text-white/60">Titulaire</p>
              <p className="text-sm font-medium uppercase tracking-wide">{card.holder_name}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] uppercase tracking-wider text-white/60">Expire</p>
              <p className="text-sm font-mono">{card.expiry}</p>
            </div>
          </div>

          <button
            onClick={handleFlip}
            className="absolute bottom-3 right-3 text-[10px] text-white/40 hover:text-white/80 transition"
            aria-label="Retourner la carte"
          >
            ↻
          </button>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 rounded-2xl text-white shadow-xl [backface-visibility:hidden] [transform:rotateY(180deg)] overflow-hidden"
          style={{ background: card.gradient || "linear-gradient(135deg, #1e293b, #0f172a)" }}
        >
          <div className="h-10 bg-black/80 mt-5" />
          <div className="px-5 mt-5">
            <div className="bg-white/90 h-9 rounded flex items-center justify-end pr-4">
              <span className="font-mono text-slate-900 text-sm tracking-wider">
                {reveal ? card.cvv : "•••"}
              </span>
            </div>
            <p className="text-[9px] text-white/50 mt-1.5">CVV</p>
          </div>
          <div className="px-5 mt-4">
            <p className="text-[10px] text-white/50 leading-relaxed">
              Cette carte est la propriété de la banque. En cas de perte ou de vol, contactez immédiatement le service client.
            </p>
          </div>
          <div className="absolute bottom-4 right-5 text-sm font-bold italic">{networkLabels[card.network]}</div>
          <button
            onClick={handleFlip}
            className="absolute bottom-3 left-3 text-[10px] text-white/40 hover:text-white/80 transition"
            aria-label="Retourner la carte"
          >
            ↻
          </button>
        </div>
      </div>
    </div>
  );
}