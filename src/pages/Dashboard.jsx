import React from "react";
import { formatCurrency, formatDate, categoryLabels, categoryColors } from "@/lib/bank";
import { useAccounts, useTransactions } from "@/lib/queries";
import PullToRefresh from "@/components/PullToRefresh";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, ArrowUpRight, Wallet, PiggyBank, CreditCard } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { Link } from "react-router-dom";
import BudgetAlerts from "@/components/BudgetAlerts";
import CategoryDonut from "@/components/CategoryDonut";

export default function Dashboard() {
  const { data: accounts = [], isLoading: loadingAccounts, refetch: refetchAccounts } = useAccounts();
  const { data: transactions = [], isLoading: loadingTransactions, refetch: refetchTransactions } = useTransactions();
  const loading = loadingAccounts || loadingTransactions;

  const totalBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const totalAssets = accounts.filter((a) => a.type !== "credits").reduce((s, a) => s + (a.balance || 0), 0);
  const savings = accounts.filter((a) => a.type === "epargne").reduce((s, a) => s + (a.balance || 0), 0);

  // Build monthly chart from transactions
  const monthlyData = React.useMemo(() => {
    const months = {};
    transactions.forEach((t) => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!months[key]) months[key] = { month: key, entrees: 0, sorties: 0 };
      if (t.amount > 0) months[key].entrees += t.amount;
      else months[key].sorties += Math.abs(t.amount);
    });
    return Object.values(months).sort((a, b) => a.month.localeCompare(b.month)).slice(-6).map((m) => ({
      ...m,
      label: new Date(m.month + "-01").toLocaleDateString("fr-FR", { month: "short" }),
    }));
  }, [transactions]);

  const recentTx = transactions.slice(0, 6);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={async () => { await Promise.all([refetchAccounts(), refetchTransactions()]); }}>
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">Bonjour 👋</h1>
        <p className="text-slate-500 text-sm mt-1">Voici un aperçu de vos finances aujourd'hui.</p>
      </div>

      <BudgetAlerts />

      {/* Balance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-300">Solde total</p>
              <Wallet className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-semibold mt-2">{formatCurrency(totalBalance)}</p>
            <p className="text-[11px] text-slate-400 mt-1">{accounts.length} compte{accounts.length > 1 ? "s" : ""}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">Actifs</p>
              <PiggyBank className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-semibold mt-2 text-slate-900">{formatCurrency(totalAssets)}</p>
            <p className="text-[11px] text-slate-400 mt-1">Comptes courants & épargne</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">Épargne</p>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-semibold mt-2 text-slate-900">{formatCurrency(savings)}</p>
            <p className="text-[11px] text-slate-400 mt-1">Comptes d'épargne</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Flux financiers</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-sm text-slate-400">
                Pas encore de données à afficher.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gEntrees" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gSorties" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}€`} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                    formatter={(v) => formatCurrency(v)}
                  />
                  <Area type="monotone" dataKey="entrees" stroke="#10b981" strokeWidth={2} fill="url(#gEntrees)" name="Entrées" />
                  <Area type="monotone" dataKey="sorties" stroke="#f43f5e" strokeWidth={2} fill="url(#gSorties)" name="Sorties" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Répartition des dépenses par catégorie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Dépenses par catégorie</CardTitle>
            <p className="text-[11px] text-slate-400">Mois en cours</p>
          </CardHeader>
          <CardContent>
            <CategoryDonut transactions={transactions} />
          </CardContent>
        </Card>

        {/* Accounts list */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Mes comptes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {accounts.length === 0 && (
              <p className="text-sm text-slate-400 py-6 text-center">Aucun compte pour le moment.</p>
            )}
            {accounts.map((a) => (
              <Link
                key={a.id}
                to="/accounts"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition border border-slate-100"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: a.color || "#0f172a" }}
                  >
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{a.name}</p>
                    <p className="text-[11px] text-slate-400">{a.iban || "—"} · {a.currency}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">{formatCurrency(a.balance, a.currency)}</p>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 ml-auto mt-0.5" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent transactions */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Transactions récentes</CardTitle>
          <Link to="/transactions" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
            Tout voir
          </Link>
        </CardHeader>
        <CardContent className="space-y-1">
          {recentTx.length === 0 && (
            <p className="text-sm text-slate-400 py-6 text-center">Aucune transaction récente.</p>
          )}
          {recentTx.map((t) => (
            <div key={t.id} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${t.amount > 0 ? "bg-emerald-50" : "bg-slate-100"}`}>
                  {t.amount > 0 ? (
                    <TrendingDown className="w-4 h-4 text-emerald-600 rotate-180" />
                  ) : (
                    <TrendingUp className="w-4 h-4 text-slate-500" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{t.label}</p>
                  <p className="text-[11px] text-slate-400">
                    {t.merchant ? `${t.merchant} · ` : ""}{formatDate(t.date)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full ${categoryColors[t.category] || categoryColors.autre}`}>
                  {categoryLabels[t.category] || "Autre"}
                </span>
                <p className={`text-sm font-semibold ${t.amount > 0 ? "text-emerald-600" : "text-slate-900"}`}>
                  {t.amount > 0 ? "+" : ""}{formatCurrency(t.amount)}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
    </PullToRefresh>
  );
}