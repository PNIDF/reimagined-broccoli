import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatCurrency, categoryLabels } from "@/lib/bank";

// Couleurs hex par catégorie (cohérentes avec categoryColors)
const CATEGORY_HEX = {
  courses: "#10b981",
  loisirs: "#8b5cf6",
  transport: "#3b82f6",
  logement: "#f59e0b",
  sante: "#f43f5e",
  salaire: "#22c55e",
  restaurant: "#f97316",
  shopping: "#ec4899",
  factures: "#64748b",
  autre: "#9ca3af",
};

export default function CategoryDonut({ transactions }) {
  const data = React.useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const spending = {};
    transactions.forEach((t) => {
      if (!t.amount || t.amount >= 0) return;
      const d = new Date(t.date);
      if (d.getFullYear() !== year || d.getMonth() !== month) return;
      const cat = t.category || "autre";
      spending[cat] = (spending[cat] || 0) + Math.abs(t.amount);
    });
    return Object.entries(spending)
      .map(([cat, value]) => ({
        name: categoryLabels[cat] || "Autre",
        value: Math.round(value * 100) / 100,
        color: CATEGORY_HEX[cat] || CATEGORY_HEX.autre,
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div>
      {data.length === 0 ? (
        <div className="h-56 flex items-center justify-center text-sm text-slate-400">
          Aucune dépense ce mois-ci.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={230}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
              formatter={(v) => formatCurrency(v)}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11 }}
              formatter={(value, entry) => (
                <span className="text-slate-600">
                  {value} · {formatCurrency(entry.payload?.value || 0)}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
      {total > 0 && (
        <p className="text-center text-xs text-slate-400 -mt-1">
          Total dépenses ce mois : <span className="font-semibold text-slate-700">{formatCurrency(total)}</span>
        </p>
      )}
    </div>
  );
}