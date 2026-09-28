import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, categoryLabels, categoryColors } from "@/lib/bank";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Clock, CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAccounts, useTransactions } from "@/lib/queries";

const WEEK_DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function monthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key) {
  const [y, m] = key.split("-");
  return new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
}

function dayKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function Calendar() {
  const { data: accounts = [], isLoading: loadingAccounts } = useAccounts();
  const { data: transactions = [], isLoading: loadingTransactions } = useTransactions();
  const loading = loadingAccounts || loadingTransactions;
  const [currentMonth, setCurrentMonth] = useState(monthKey(new Date()));
  const [selectedDay, setSelectedDay] = useState(dayKey(new Date()));

  const accountMap = useMemo(() => {
    const m = {};
    accounts.forEach((a) => (m[a.id] = a));
    return m;
  }, [accounts]);

  const shiftMonth = (delta) => {
    const [y, m] = currentMonth.split("-").map(Number);
    setCurrentMonth(monthKey(new Date(y, m - 1 + delta, 1)));
  };

  // Group transactions by day for current month
  const byDay = useMemo(() => {
    const [y, m] = currentMonth.split("-").map(Number);
    const map = {};
    transactions.forEach((t) => {
      const d = new Date(t.date);
      if (d.getFullYear() === y && d.getMonth() + 1 === m) {
        const k = dayKey(d);
        if (!map[k]) map[k] = [];
        map[k].push(t);
      }
    });
    return map;
  }, [transactions, currentMonth]);

  // Build calendar grid (Monday-based)
  const grid = useMemo(() => {
    const [y, m] = currentMonth.split("-").map(Number);
    const first = new Date(y, m - 1, 1);
    const startOffset = (first.getDay() + 6) % 7; // Monday=0
    const start = new Date(y, m - 1, 1 - startOffset);
    const days = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentMonth]);

  const [cy, cm] = currentMonth.split("-").map(Number);
  const todayKey = dayKey(new Date());

  // Month totals
  const monthTx = useMemo(
    () => Object.values(byDay).flat(),
    [byDay]
  );
  const totalIn = monthTx.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalOut = monthTx.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  // Upcoming (planned / future) expenses this month
  const upcoming = useMemo(
    () =>
      monthTx.filter((t) => {
        const dk = dayKey(new Date(t.date));
        return dk >= todayKey && t.status === "en_attente";
      }),
    [monthTx, todayKey]
  );
  const upcomingTotal = upcoming.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  const selectedTx = (byDay[selectedDay] || []).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

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
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">Calendrier</h1>
          <p className="text-slate-500 text-sm mt-1">Anticipez vos dépenses prévues et passées</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { setCurrentMonth(monthKey(new Date())); setSelectedDay(dayKey(new Date())); }}>
            Aujourd'hui
          </Button>
          <Button variant="outline" size="icon" onClick={() => shiftMonth(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium text-slate-700 min-w-[140px] text-center capitalize">
            {monthLabel(currentMonth)}
          </span>
          <Button variant="outline" size="icon" onClick={() => shiftMonth(1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-emerald-600 rotate-180" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Revenus</p>
              <p className="text-lg font-semibold text-emerald-600">{formatCurrency(totalIn)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Dépenses</p>
              <p className="text-lg font-semibold text-rose-600">{formatCurrency(totalOut)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
              <CircleDot className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Solde net</p>
              <p className={cn("text-lg font-semibold", totalIn - totalOut >= 0 ? "text-emerald-600" : "text-rose-500")}>
                {formatCurrency(totalIn - totalOut)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500">À venir</p>
              <p className="text-lg font-semibold text-amber-600">{formatCurrency(upcomingTotal)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Calendar grid */}
        <Card className="lg:col-span-2">
          <CardContent className="p-3 sm:p-4">
            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEK_DAYS.map((d) => (
                <div key={d} className="text-center text-[11px] font-medium text-slate-400 py-2">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {grid.map((d) => {
                const k = dayKey(d);
                const inMonth = d.getMonth() + 1 === cm && d.getFullYear() === cy;
                const isToday = k === todayKey;
                const isSelected = k === selectedDay;
                const isFuture = k > todayKey;
                const dayTx = byDay[k] || [];
                const dayIn = dayTx.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
                const dayOut = dayTx.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
                const hasPlanned = dayTx.some((t) => t.status === "en_attente");

                return (
                  <button
                    key={k}
                    onClick={() => setSelectedDay(k)}
                    className={cn(
                      "relative min-h-[64px] sm:min-h-[84px] rounded-lg p-1.5 text-left transition-all border",
                      inMonth ? "bg-white" : "bg-slate-50/50",
                      isSelected
                        ? "border-indigo-400 ring-1 ring-indigo-400"
                        : "border-transparent hover:border-slate-200",
                      isFuture && inMonth && "bg-indigo-50/30"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "text-xs font-medium",
                          !inMonth && "text-slate-300",
                          inMonth && isToday && "bg-indigo-600 text-white rounded-full w-5 h-5 flex items-center justify-center",
                          inMonth && !isToday && "text-slate-700"
                        )}
                      >
                        {d.getDate()}
                      </span>
                      {hasPlanned && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Opération prévue" />
                      )}
                    </div>

                    {dayTx.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {dayTx.slice(0, 2).map((t) => (
                          <div
                            key={t.id}
                            className={cn(
                              "text-[10px] leading-tight rounded px-1 py-0.5 truncate",
                              t.amount > 0
                                ? "text-emerald-700 bg-emerald-50"
                                : "text-slate-600 bg-slate-100",
                              t.status === "en_attente" && "border border-dashed border-amber-300"
                            )}
                          >
                            {t.amount > 0 ? "+" : "−"}
                            {formatCurrency(Math.abs(t.amount))}
                          </div>
                        ))}
                        {dayTx.length > 2 && (
                          <p className="text-[10px] text-slate-400 px-1">+{dayTx.length - 2}</p>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-50 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> Opération prévue
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded border border-dashed border-amber-300 bg-slate-100" /> En attente
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-indigo-50/60 border border-indigo-100" /> À venir
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Day detail */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base capitalize">
              {selectedDay
                ? new Date(selectedDay).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })
                : "Sélectionnez un jour"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedTx.length === 0 ? (
              <p className="text-sm text-slate-400 py-12 text-center">Aucune transaction ce jour.</p>
            ) : (
              <div className="space-y-2">
                {selectedTx.map((t) => {
                  const acc = accountMap[t.account_id];
                  const planned = t.status === "en_attente";
                  return (
                    <div
                      key={t.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border",
                        planned ? "border-dashed border-amber-300 bg-amber-50/40" : "border-slate-100 bg-white"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={cn(
                            "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0",
                            t.amount > 0 ? "bg-emerald-50" : "bg-slate-100"
                          )}
                        >
                          {t.amount > 0 ? (
                            <TrendingDown className="w-4 h-4 text-emerald-600 rotate-180" />
                          ) : (
                            <TrendingUp className="w-4 h-4 text-slate-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{t.label}</p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {acc?.name || "Compte"}
                            {planned && <span className="text-amber-600"> · Prévue</span>}
                          </p>
                          {t.category && (
                            <span
                              className={cn(
                                "inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full",
                                categoryColors[t.category] || categoryColors.autre
                              )}
                            >
                              {categoryLabels[t.category] || "Autre"}
                            </span>
                          )}
                        </div>
                      </div>
                      <p
                        className={cn(
                          "text-sm font-semibold flex-shrink-0",
                          t.amount > 0 ? "text-emerald-600" : "text-slate-900"
                        )}
                      >
                        {t.amount > 0 ? "+" : ""}
                        {formatCurrency(t.amount)}
                      </p>
                    </div>
                  );
                })}

                <div className="pt-2 mt-2 border-t border-slate-50 flex items-center justify-between text-sm">
                  <span className="text-slate-500">Solde du jour</span>
                  <span
                    className={cn(
                      "font-semibold",
                      selectedTx.reduce((s, t) => s + t.amount, 0) >= 0 ? "text-emerald-600" : "text-rose-500"
                    )}
                  >
                    {formatCurrency(selectedTx.reduce((s, t) => s + t.amount, 0))}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}