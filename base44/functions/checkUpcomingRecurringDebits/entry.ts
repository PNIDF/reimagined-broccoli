import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Computes the next calendar occurrence of a monthly recurring day.
function nextOccurrence(today, day) {
  const y = today.getFullYear();
  const m = today.getMonth();
  const td = today.getDate();
  const dim = new Date(y, m + 1, 0).getDate();
  const targetDay = Math.min(day, dim);
  if (targetDay >= td) {
    return new Date(y, m, targetDay);
  }
  const nextDim = new Date(y, m + 2, 0).getDate();
  return new Date(y, m + 1, Math.min(day, nextDim));
}

function dayDiff(from, to) {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b - a) / 86400000);
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    // Optional window in days (default 3). Passed by the scheduled workflow.
    let daysAhead = 3;
    try {
      const body = await req.json();
      if (body && typeof body.days_ahead === 'number' && body.days_ahead > 0) {
        daysAhead = body.days_ahead;
      }
    } catch (_) { /* no body or invalid JSON: keep default */ }

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    // Determine scope: if a user context exists, alert only that user;
    // otherwise (scheduled run) alert every user via the service role.
    let scopedUserId = null;
    try {
      const me = await base44.auth.me();
      if (me && me.id) scopedUserId = me.id;
    } catch (_) { /* no user context: service-role run for all users */ }

    const templates = await base44.asServiceRole.entities.TransactionTemplate.list();
    const debitTemplates = templates.filter(
      (t) => t.type === 'debit' && typeof t.recurring_day === 'number' && t.recurring_day >= 1 && t.recurring_day <= 31
    );

    // Group by owner (created_by_id).
    const byOwner = new Map();
    for (const t of debitTemplates) {
      const owner = t.created_by_id;
      if (!owner) continue;
      if (scopedUserId && owner !== scopedUserId) continue;
      if (!byOwner.has(owner)) byOwner.set(owner, []);
      byOwner.get(owner).push(t);
    }

    const users = await base44.asServiceRole.entities.User.list();
    const userMap = new Map(users.map((u) => [u.id, u]));

    let sentCount = 0;
    let skippedCount = 0;
    const details = [];

    for (const [ownerId, ownerTemplates] of byOwner) {
      const user = userMap.get(ownerId);
      if (!user || !user.email) continue;

      const upcoming = [];
      const toMark = [];

      for (const t of ownerTemplates) {
        const occ = nextOccurrence(today, t.recurring_day);
        const diff = dayDiff(today, occ);
        const monthKey = occ.toISOString().slice(0, 7);
        if (diff >= 0 && diff <= daysAhead && t.last_alert_period !== monthKey) {
          upcoming.push({ template: t, occ, diff });
          toMark.push({ id: t.id, monthKey });
        } else if (t.last_alert_period === monthKey) {
          skippedCount++;
        }
      }

      if (upcoming.length === 0) continue;

      // Resolve account names for context.
      const accounts = await base44.asServiceRole.entities.Account.filter({ created_by_id: ownerId });
      const accMap = new Map(accounts.map((a) => [a.id, a.name]));

      const lines = upcoming
        .map(({ template: t, occ, diff }) => {
          const accName = t.account_id ? (accMap.get(t.account_id) || '—') : '—';
          const dateStr = occ.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' });
          const dayWord = diff === 0 ? "aujourd'hui" : diff === 1 ? "demain" : `dans ${diff} jours`;
          return `• ${t.label} : ${Number(t.amount).toFixed(2)}€ — le ${dateStr} (${dayWord}) — Compte : ${accName}`;
        })
        .join('\n');

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        subject: `🔔 Prélèvement à venir — ${upcoming.length} échéance(s) dans les ${daysAhead} prochains jours`,
        body: `Bonjour${user.full_name ? ' ' + user.full_name : ''},\n\nVoici les prélèvements récurrents identifiés dans vos modèles qui arrivent à échéance prochainement :\n\n${lines}\n\nAssurez-vous que le solde de vos comptes est suffisant pour couvrir ces prélèvements.\n\n— PNIDF`
      });
      sentCount++;

      // Mark each template as alerted for this occurrence month to avoid duplicates.
      await Promise.all(
        toMark.map(({ id, monthKey }) =>
          base44.asServiceRole.entities.TransactionTemplate.update(id, { last_alert_period: monthKey })
        )
      );

      details.push({ user: user.email, upcoming: upcoming.length });
    }

    return Response.json({
      date: todayStr,
      days_ahead: daysAhead,
      sent: sentCount,
      skipped: skippedCount,
      details
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}