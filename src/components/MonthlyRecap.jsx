import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, categoryLabels, categoryColors } from "@/lib/bank";
import { cn } from "@/lib/utils";
import { ChevronDown, PiggyBank } from "lucide-react";

function monthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key) {
  const [y, m] = key.split("-");
  return new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
}

/**
 * Recap view: cumulative income & expenses by category for each month.
 * @param {Array} transactions
 */
export default function MonthlyRecap({ transactions }) {
  const [expanded, setExpanded] = useState(null);

  const months = useMemo(() => {
    const map = {};
    transactions.forEach((t) => {
      if (!t.date) return;
      const key = monthKey(new Date(t.date));
      if (!map[key]) map[key] = { key, in: 0, out: 0, byCat: {} };
      const m = map[key];
      if (t.amount > 0) {
        m.in += t.amount;
      } else if (t.amount < 0) {
        m.out += Math.abs(t.amount);
      }
      const cat = t.category || "autre";
      if (!m.byCat[cat]) m.byCat[cat] = { in: 0, out: 0 };
      if (t.amount > 0) m.byCat[cat].in += t.amount;
      else m.byCat[cat].out += Math.abs(t.amount);
    });
    return Object.values(map)
      .map((m) => ({
        ...m,
        net: m.in - m.out,
        savingRate: m.in > 0 ? ((m.in - m.out) / m.in) * 100 : 0,
        cats: Object.entries(m.byCat)
          .map(([cat, v]) => ({ cat, ...v, net: v.in - v.out }))
          .sort((a, b) => b.out + b.in - (a.out + a.in)),
      }))
      .sort((a, b) => (a.key < b.key ? 1 : -1));
  }, [transactions]);

  const totals = useMemo(() => {
    const inAll = months.reduce((s, m) => s + m.in, 0);
    const outAll = months.reduce((s, m) => s + m.out, 0);
    return { in: inAll, out: outAll, net: inAll - outAll, savingRate: inAll > 0 ? ((inAll - outAll) / inAll) * 100 : 0 };
  }, [months]);

  if (months.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-sm text-slate-400">
          Aucune donnée mensuelle à afficher.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Global savings summary */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center">
              <PiggyBank className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">Synthèse épargne</p>
              <p className="text-xs text-slate-500">Sur {months.length} mois</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <p className="text-xs text-slate-500">Entrées</p>
              <p className="text-base font-semibold text-emerald-600">{formatCurrency(totals.in)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Sorties</p>
              <p className="text-base font-semibold text-rose-600">{formatCurrency(totals.out)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Épargne nette</p>
              <p className={cn("text-base font-semibold", totals.net >= 0 ? "text-emerald-600" : "text-rose-500")}>
                {formatCurrency(totals.net)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Taux d'épargne</p>
              <p className={cn("text-base font-semibold", totals.savingRate >= 0 ? "text-emerald-600" : "text-rose-500")}>
                {totals.savingRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Per-month breakdown */}
      {months.map((m) => {
        const open = expanded === m.key;
        const maxBar = Math.max(m.in, m.out, 1);
        return (
          <Card key={m.key}>
            <CardContent className="p-0">
              <button
                onClick={() => setExpanded(open ? null : m.key)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50/50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-700 capitalize">
                    {monthLabel(m.key).slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 capitalize">{monthLabel(m.key)}</p>
                    <p className="text-xs text-slate-500">{m.cats.length} catégories</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className={cn("text-sm font-semibold", m.net >= 0 ? "text-emerald-600" : "text-rose-500")}>
                      {m.net >= 0 ? "+" : ""}{formatCurrency(m.net)}
                    </p>
                    <p className="text-[11px] text-slate-400">épargne · {m.savingRate.toFixed(0)}%</p>
                  </div>
                  <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", open && "rotate-180")} />
                </div>
              </button>

              {/* Mini bars */}
              <div className="px-4 pb-3 space-y-2">
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-emerald-600 w-14">Entrées</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(m.in / maxBar) * 100}%` }} />
                  </div>
                  <span className="text-slate-700 font-medium w-20 text-right">{formatCurrency(m.in)}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-rose-500 w-14">Sorties</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-rose-500" style={{ width: `${(m.out / maxBar) * 100}%` }} />
                  </div>
                  <span className="text-slate-700 font-medium w-20 text-right">{formatCurrency(m.out)}</span>
                </div>
              </div>

              {/* Expanded category detail */}
              {open && (
                <div className="border-t border-slate-100 divide-y divide-slate-50">
                  {m.cats.map((c) => (
                    <div key={c.cat} className="flex items-center justify-between p-3 px-4">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={cn("text-[10px] px-2 py-0.5 rounded-full", categoryColors[c.cat] || categoryColors.autre)}>
                          {categoryLabels[c.cat] || "Autre"}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        {c.in > 0 && <span className="text-emerald-600">+{formatCurrency(c.in)}</span>}
                        {c.out > 0 && <span className="text-rose-500">−{formatCurrency(c.out)}</span>}
                        <span className={cn("font-medium w-20 text-right", c.net >= 0 ? "text-slate-900" : "text-rose-500")}>
                          {c.net >= 0 ? "+" : ""}{formatCurrency(c.net)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}