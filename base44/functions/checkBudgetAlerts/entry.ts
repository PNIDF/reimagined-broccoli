import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const categoryLabels = {
  courses: "Courses", loisirs: "Loisirs", transport: "Transport",
  logement: "Logement", sante: "Santé", restaurant: "Restaurant",
  shopping: "Shopping", factures: "Factures", autre: "Autre"
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const budgets = await base44.entities.Budget.list();
    if (!budgets || budgets.length === 0) {
      return Response.json({ alerts: [], message: "Aucun budget défini" });
    }

    // Current month transactions
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const txs = await base44.entities.Transaction.list("-date", 500);

    const spending = {};
    txs.forEach((t) => {
      if (t.amount >= 0) return;
      const d = new Date(t.date);
      if (d.getFullYear() !== year || d.getMonth() + 1 !== month) return;
      const cat = t.category || "autre";
      if (!spending[cat]) spending[cat] = 0;
      spending[cat] += Math.abs(t.amount);
    });

    const alerts = [];
    const WARNING_THRESHOLD = 0.8;
    for (const b of budgets) {
      const spent = spending[b.category] || 0;
      const pct = b.limit_amount > 0 ? spent / b.limit_amount : 0;
      if (pct >= WARNING_THRESHOLD) {
        const isOverrun = spent > b.limit_amount;
        alerts.push({
          category: b.category,
          categoryLabel: categoryLabels[b.category] || b.category,
          spent: Math.round(spent * 100) / 100,
          limit: b.limit_amount,
          overrun: isOverrun ? Math.round((spent - b.limit_amount) * 100) / 100 : 0,
          pct: Math.round(pct * 100),
          level: isOverrun ? "overrun" : "warning",
          alert_email: b.alert_email !== false
        });
      }
    }

    let sent = false;
    const emailAlerts = alerts.filter((a) => a.alert_email);
    if (emailAlerts.length > 0 && user.email) {
      const monthLabel = now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
      const warnings = emailAlerts.filter((a) => a.level === "warning");
      const overruns = emailAlerts.filter((a) => a.level === "overrun");
      const lines = emailAlerts
        .map((a) => {
          if (a.level === "overrun") {
            return `• ${a.categoryLabel} : ${a.spent}€ dépensés pour un seuil de ${a.limit}€ (dépassement de ${a.overrun}€, ${a.pct}% du budget)`;
          }
          return `• ${a.categoryLabel} : ${a.spent}€ dépensés (${a.pct}% du seuil de ${a.limit}€) — approche du plafond`;
        })
        .join("\n");
      const subjectParts = [];
      if (warnings.length) subjectParts.push(`${warnings.length} approche(s) de plafond`);
      if (overruns.length) subjectParts.push(`${overruns.length} seuil(s) dépassé(s)`);
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        subject: `⚠️ Alerte budget — ${subjectParts.join(", ")} en ${monthLabel}`,
        body: `Bonjour,\n\nVoici l'état de vos budgets pour ce mois-ci :\n\n${lines}\n\nPensez à ajuster vos dépenses ou vos seuils dans l'application.\n\n— PNIDF`
      });
      sent = true;
    }

    return Response.json({ alerts, sent, email: user.email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}