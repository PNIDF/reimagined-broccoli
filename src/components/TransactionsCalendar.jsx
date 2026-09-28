import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, X } from "lucide-react";
import { formatCurrency, formatDate, categoryLabels, categoryColors } from "@/lib/bank";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function toKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function TransactionsCalendar({ transactions, accountMap }) {
  const [cursor, setCursor] = useState(startOfMonth(new Date()));
  const [selected, setSelected] = useState(null);

  // Group transactions by day key
  const byDay = useMemo(() => {
    const map = {};
    transactions.forEach((t) => {
      if (!t.date) return;
      const d = new Date(t.date);
      const key = toKey(d);
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [transactions]);

  // Build the 6-week grid (42 cells) starting on Monday
  const grid = useMemo(() => {
    const first = startOfMonth(cursor);
    const startOffset = (first.getDay() + 6) % 7; // Monday = 0
    const start = new Date(first);
    start.setDate(first.getDate() - startOffset);

    const cells = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = toKey(d);
      const items = byDay[key] || [];
      const income = items.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
      const expense = items.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
      cells.push({ date: d, key, items, income, expense, net: income - expense });
    }
    return cells;
  }, [cursor, byDay]);

  const monthLabel = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(cursor);

  const today = new Date();
  const selectedItems = selected ? byDay[toKey(selected)] || [] : [];

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold capitalize text-slate-900">{monthLabel}</h3>
          <p className="text-xs text-slate-500">Cliquez sur un jour pour voir le détail</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            className="w-9 h-9 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center transition"
            aria-label="Mois précédent"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>
          <button
            onClick={() => { setCursor(startOfMonth(new Date())); setSelected(new Date()); }}
            className="px-3 h-9 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-600 transition"
          >
            Aujourd'hui
          </button>
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            className="w-9 h-9 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center transition"
            aria-label="Mois suivant"
          >
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-[11px] font-medium text-slate-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {grid.map((cell) => {
          const inMonth = cell.date.getMonth() === cursor.getMonth();
          const isToday = sameDay(cell.date, today);
          const isSelected = selected && sameDay(cell.date, selected);
          const hasItems = cell.items.length > 0;
          return (
            <button
              key={cell.key}
              onClick={() => setSelected(cell.date)}
              className={cn(
                "relative aspect-square sm:aspect-[4/3] rounded-lg border p-1 sm:p-2 flex flex-col items-center justify-start transition text-left",
                inMonth ? "bg-white border-slate-100" : "bg-slate-50/40 border-transparent",
                isSelected ? "ring-2 ring-indigo-500 border-indigo-500" : "",
                hasItems && inMonth ? "hover:border-slate-300" : ""
              )}
            >
              <span
                className={cn(
                  "text-xs sm:text-sm font-medium",
                  inMonth ? (isToday ? "text-indigo-600" : "text-slate-700") : "text-slate-300"
                )}
              >
                {cell.date.getDate()}
              </span>

              {hasItems && inMonth && (
                <div className="mt-1 flex flex-col items-center gap-0.5 w-full">
                  {cell.income > 0 && (
                    <span className="text-[9px] sm:text-[10px] font-semibold text-emerald-600 leading-none truncate max-w-full">
                      +{formatCurrency(cell.income)}
                    </span>
                  )}
                  {cell.expense > 0 && (
                    <span className="text-[9px] sm:text-[10px] font-semibold text-rose-500 leading-none truncate max-w-full">
                      −{formatCurrency(cell.expense)}
                    </span>
                  )}
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {cell.items.slice(0, 3).map((t, i) => (
                      <span
                        key={i}
                        className={cn("w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full", t.amount > 0 ? "bg-emerald-500" : "bg-rose-400")}
                      />
                    ))}
                  </div>
                </div>
              )}

              {isToday && !isSelected && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-indigo-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Revenu
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Dépense
        </span>
      </div>

      {/* Selected day detail */}
      {selected && (
        <div className="rounded-xl border border-slate-100 bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-slate-500">Détail du</p>
              <p className="text-sm font-semibold text-slate-900 capitalize">{formatDate(selected)}</p>
            </div>
            <button onClick={() => setSelected(null)} className="p-1 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          {selectedItems.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">Aucune transaction ce jour-là.</p>
          ) : (
            <div className="space-y-2">
              {selectedItems.map((t) => {
                const acc = accountMap[t.account_id];
                return (
                  <div key={t.id} className="flex items-center justify-between gap-3 py-2 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0", t.amount > 0 ? "bg-emerald-50" : "bg-slate-100")}>
                        {t.amount > 0 ? <TrendingDown className="w-3.5 h-3.5 text-emerald-600 rotate-180" /> : <TrendingUp className="w-3.5 h-3.5 text-slate-500" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{t.label}</p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {acc?.name || "Compte"}{t.merchant ? ` · ${t.merchant}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={cn("hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full", categoryColors[t.category] || categoryColors.autre)}>
                        {categoryLabels[t.category] || "Autre"}
                      </span>
                      <p className={cn("text-sm font-semibold", t.amount > 0 ? "text-emerald-600" : "text-slate-900")}>
                        {t.amount > 0 ? "+" : ""}{formatCurrency(t.amount)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div className="flex items-center justify-between pt-2 text-xs">
                <span className="text-slate-500">Net du jour</span>
                <span className={cn("font-semibold", selectedItems.reduce((s, t) => s + t.amount, 0) >= 0 ? "text-emerald-600" : "text-rose-500")}>
                  {formatCurrency(selectedItems.reduce((s, t) => s + t.amount, 0))}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}