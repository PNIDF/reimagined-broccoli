import React, { useState } from "react";
import { formatCurrency, formatDate, categoryLabels, categoryColors } from "@/lib/bank";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, TrendingUp, TrendingDown, Filter, List, Calendar, BarChart3, ArrowUpDown, ArrowUp, ArrowDown, PieChart as PieChartIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import TransactionForm from "@/components/TransactionForm";
import TransactionsCalendar from "@/components/TransactionsCalendar";
import MonthlyRecap from "@/components/MonthlyRecap";
import CategoryDonut from "@/components/CategoryDonut";
import { useAccounts, useTransactions } from "@/lib/queries";
import PullToRefresh from "@/components/PullToRefresh";

export default function Transactions() {
  const { data: accounts = [], isLoading: loadingAccounts, refetch: refetchAccounts } = useAccounts();
  const { data: transactions = [], isLoading: loadingTransactions, refetch: refetchTransactions } = useTransactions();
  const loading = loadingAccounts || loadingTransactions;
  const [search, setSearch] = useState("");
  const [filterAccount, setFilterAccount] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useState("list");
  const [sortBy, setSortBy] = useState("date");
  const [sortDir, setSortDir] = useState("desc");

  const accountMap = React.useMemo(() => {
    const m = {};
    accounts.forEach((a) => (m[a.id] = a));
    return m;
  }, [accounts]);

  const filtered = transactions.filter((t) => {
    if (filterAccount !== "all" && t.account_id !== filterAccount) return false;
    if (filterCategory !== "all" && t.category !== filterCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!t.label?.toLowerCase().includes(q) && !t.merchant?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortBy === "amount") cmp = (a.amount || 0) - (b.amount || 0);
    else if (sortBy === "label") cmp = (a.label || "").localeCompare(b.label || "");
    else cmp = new Date(a.date || 0) - new Date(b.date || 0);
    return sortDir === "asc" ? cmp : -cmp;
  });

  const totalIn = filtered.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalOut = filtered.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={async () => { await Promise.all([refetchAccounts(), refetchTransactions()]); }}>
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">Transactions</h1>
          <p className="text-slate-500 text-sm mt-1">Historique de vos opérations</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
            <button
              onClick={() => setView("list")}
              className={cn("flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-medium transition", view === "list" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-700")}
            >
              <List className="w-3.5 h-3.5" /> Liste
            </button>
            <button
              onClick={() => setView("calendar")}
              className={cn("flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-medium transition", view === "calendar" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-700")}
            >
              <Calendar className="w-3.5 h-3.5" /> Calendrier
            </button>
            <button
              onClick={() => setView("recap")}
              className={cn("flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-medium transition", view === "recap" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-700")}
            >
              <BarChart3 className="w-3.5 h-3.5" /> Récap
            </button>
            <button
              onClick={() => setView("report")}
              className={cn("flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-medium transition", view === "report" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-700")}
            >
              <PieChartIcon className="w-3.5 h-3.5" /> Rapport
            </button>
          </div>
          <Button onClick={() => setShowForm(true)} className="bg-slate-900 hover:bg-slate-800">
            <Plus className="w-4 h-4 mr-1.5" /> Nouvelle transaction
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-emerald-600 rotate-180" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total entrées</p>
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
              <p className="text-xs text-slate-500">Total sorties</p>
              <p className="text-lg font-semibold text-rose-600">{formatCurrency(totalOut)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Rechercher une transaction..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterAccount} onValueChange={setFilterAccount}>
              <SelectTrigger className="sm:w-48">
                <SelectValue placeholder="Compte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les comptes</SelectItem>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="sm:w-44">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {Object.entries(categoryLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setSortDir(v === "amount" ? "desc" : (v === "label" ? "asc" : "desc")); }}>
                <SelectTrigger className="sm:w-40">
                  <ArrowUpDown className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Trier par date</SelectItem>
                  <SelectItem value="amount">Trier par montant</SelectItem>
                  <SelectItem value="label">Trier par libellé</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                className="h-9 w-9"
                title={sortDir === "asc" ? "Croissant" : "Décroissant"}
              >
                {sortDir === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View */}
      {view === "calendar" ? (
        <Card>
          <CardContent className="p-4 sm:p-6">
            <TransactionsCalendar transactions={filtered} accountMap={accountMap} />
          </CardContent>
        </Card>
      ) : view === "recap" ? (
        <MonthlyRecap transactions={filtered} />
      ) : view === "report" ? (
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="mb-3">
              <h2 className="text-base font-semibold text-slate-900">Dépenses par catégorie</h2>
              <p className="text-xs text-slate-500">Répartition de vos dépenses ce mois-ci</p>
            </div>
            <CategoryDonut transactions={filtered} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            {sorted.length === 0 ? (
              <p className="text-sm text-slate-400 py-16 text-center">Aucune transaction trouvée.</p>
            ) : (
              <div className="divide-y divide-slate-50">
                {sorted.map((t) => {
                  const acc = accountMap[t.account_id];
                  return (
                    <div key={t.id} className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${t.amount > 0 ? "bg-emerald-50" : "bg-slate-100"}`}>
                          {t.amount > 0 ? (
                            <TrendingDown className="w-4 h-4 text-emerald-600 rotate-180" />
                          ) : (
                            <TrendingUp className="w-4 h-4 text-slate-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{t.label}</p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {t.merchant ? `${t.merchant} · ` : ""}{acc?.name || "Compte"} · {formatDate(t.date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full ${categoryColors[t.category] || categoryColors.autre}`}>
                          {categoryLabels[t.category] || "Autre"}
                        </span>
                        <p className={`text-sm font-semibold ${t.amount > 0 ? "text-emerald-600" : "text-slate-900"}`}>
                          {t.amount > 0 ? "+" : ""}{formatCurrency(t.amount)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {showForm && (
        <TransactionForm
          accounts={accounts}
          onClose={() => setShowForm(false)}
          onSaved={() => setShowForm(false)}
        />
      )}
    </div>
    </PullToRefresh>
  );
}