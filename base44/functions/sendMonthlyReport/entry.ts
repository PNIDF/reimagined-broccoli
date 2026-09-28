import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import {
  categoryLabels,
  monthLabelFromKey,
  previousMonthKey,
  formatEur,
  isValidMonthKey,
} from '../../shared/bankUtils.ts';

const MAX_USERS = 500;

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildReportHtml({ user, month, monthLabel, totalSpent, totalIncome, netSavings, byCategory, budgetLines, topTx, accounts }) {
  const spentCount = topTx._spentCount || 0;
  const incomeCount = topTx._incomeCount || 0;
  const savingsBalance = accounts
    .filter((a) => a.type === 'epargne')
    .reduce((s, a) => s + (Number(a.balance) || 0), 0);

  const catRows = byCategory
    .map((c) => {
      const pct = totalSpent > 0 ? Math.round((c.value / totalSpent) * 100) : 0;
      return `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #eef2f7;">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${c.color};margin-right:8px;vertical-align:middle;"></span>
            <span style="color:#334155;font-weight:500;">${escapeHtml(c.label)}</span>
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #eef2f7;text-align:right;color:#0f172a;font-weight:600;">${formatEur(c.value)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eef2f7;text-align:right;color:#94a3b8;font-size:13px;">${pct}%</td>
        </tr>`;
    })
    .join('');

  const budgetRows = budgetLines
    .map((b) => {
      const barColor = b.over ? '#e11d48' : b.pct >= 80 ? '#f59e0b' : '#10b981';
      return `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #eef2f7;color:#334155;font-weight:500;">${escapeHtml(b.categoryLabel)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eef2f7;text-align:right;color:#0f172a;font-weight:600;">${formatEur(b.spent)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eef2f7;text-align:right;color:#64748b;">${formatEur(b.limit_amount)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eef2f7;text-align:right;">
            <span style="display:inline-block;min-width:90px;">
              <span style="display:block;font-size:12px;color:${barColor};font-weight:600;margin-bottom:4px;">${b.pct}%${b.over ? ' ⚠' : ''}</span>
              <span style="display:block;height:6px;border-radius:999px;background:#e2e8f0;overflow:hidden;">
                <span style="display:block;height:100%;width:${Math.min(100, b.pct)}%;background:${barColor};"></span>
              </span>
            </span>
          </td>
        </tr>`;
    })
    .join('') || `<tr><td colspan="4" style="padding:18px 12px;color:#94a3b8;text-align:center;">Aucun budget défini.</td></tr>`;

  const txRows = topTx
    .map((t) => {
      const positive = Number(t.amount) > 0;
      return `
        <tr>
          <td style="padding:9px 12px;border-bottom:1px solid #eef2f7;color:#0f172a;font-weight:500;">${escapeHtml(t.label)}</td>
          <td style="padding:9px 12px;border-bottom:1px solid #eef2f7;color:#94a3b8;font-size:13px;">${escapeHtml(categoryLabels[t.category] || 'Autre')}</td>
          <td style="padding:9px 12px;border-bottom:1px solid #eef2f7;text-align:right;font-weight:600;color:${positive ? '#059669' : '#0f172a'};">${positive ? '+' : ''}${formatEur(t.amount)}</td>
        </tr>`;
    })
    .join('') || `<tr><td colspan="3" style="padding:18px 12px;color:#94a3b8;text-align:center;">Aucune transaction ce mois-ci.</td></tr>`;

  const netColor = netSavings >= 0 ? '#059669' : '#e11d48';
  const firstName = (user.full_name || '').split(' ')[0];

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,0.08);">

        <tr><td style="background:linear-gradient(135deg,#1e293b,#0f172a);padding:28px 32px;">
          <p style="margin:0;color:#94a3b8;font-size:12px;letter-spacing:1px;text-transform:uppercase;">Rapport financier</p>
          <p style="margin:6px 0 0;color:#ffffff;font-size:22px;font-weight:600;text-transform:capitalize;">${escapeHtml(monthLabel)}</p>
          <p style="margin:4px 0 0;color:#cbd5e1;font-size:13px;">Bonjour${firstName ? ' ' + escapeHtml(firstName) : ''}, voici la synthèse de votre mois.</p>
        </td></tr>

        <tr><td style="padding:24px 32px 8px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="33%" style="padding:14px;background:#f8fafc;border-radius:12px;border:1px solid #eef2f7;">
                <p style="margin:0;color:#64748b;font-size:12px;">Dépenses</p>
                <p style="margin:6px 0 0;color:#0f172a;font-size:20px;font-weight:700;">${formatEur(totalSpent)}</p>
                <p style="margin:2px 0 0;color:#94a3b8;font-size:11px;">${spentCount} transaction(s)</p>
              </td>
              <td width="34%" style="padding:14px;background:#f8fafc;border-radius:12px;border:1px solid #eef2f7;">
                <p style="margin:0;color:#64748b;font-size:12px;">Revenus</p>
                <p style="margin:6px 0 0;color:#059669;font-size:20px;font-weight:700;">${formatEur(totalIncome)}</p>
                <p style="margin:2px 0 0;color:#94a3b8;font-size:11px;">${incomeCount} entrée(s)</p>
              </td>
              <td width="33%" style="padding:14px;background:#f8fafc;border-radius:12px;border:1px solid #eef2f7;">
                <p style="margin:0;color:#64748b;font-size:12px;">Épargne nette</p>
                <p style="margin:6px 0 0;color:${netColor};font-size:20px;font-weight:700;">${formatEur(netSavings)}</p>
                <p style="margin:2px 0 0;color:#94a3b8;font-size:11px;">Épargne totale : ${formatEur(savingsBalance)}</p>
              </td>
            </tr>
          </table>
        </td></tr>

        <tr><td style="padding:20px 32px 6px;">
          <p style="margin:0 0 10px;color:#0f172a;font-size:15px;font-weight:600;">Budgets</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <thead>
              <tr>
                <th align="left" style="padding:8px 12px;color:#94a3b8;font-size:11px;text-transform:uppercase;font-weight:600;">Catégorie</th>
                <th align="right" style="padding:8px 12px;color:#94a3b8;font-size:11px;text-transform:uppercase;font-weight:600;">Dépensé</th>
                <th align="right" style="padding:8px 12px;color:#94a3b8;font-size:11px;text-transform:uppercase;font-weight:600;">Seuil</th>
                <th align="right" style="padding:8px 12px;color:#94a3b8;font-size:11px;text-transform:uppercase;font-weight:600;">Progression</th>
              </tr>
            </thead>
            <tbody>${budgetRows}</tbody>
          </table>
        </td></tr>

        <tr><td style="padding:20px 32px 6px;">
          <p style="margin:0 0 10px;color:#0f172a;font-size:15px;font-weight:600;">Répartition des dépenses</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <thead>
              <tr>
                <th align="left" style="padding:8px 12px;color:#94a3b8;font-size:11px;text-transform:uppercase;font-weight:600;">Catégorie</th>
                <th align="right" style="padding:8px 12px;color:#94a3b8;font-size:11px;text-transform:uppercase;font-weight:600;">Montant</th>
                <th align="right" style="padding:8px 12px;color:#94a3b8;font-size:11px;text-transform:uppercase;font-weight:600;">Part</th>
              </tr>
            </thead>
            <tbody>${catRows || `<tr><td colspan="3" style="padding:18px 12px;color:#94a3b8;text-align:center;">Aucune dépense ce mois-ci.</td></tr>`}</tbody>
          </table>
        </td></tr>

        <tr><td style="padding:20px 32px 28px;">
          <p style="margin:0 0 10px;color:#0f172a;font-size:15px;font-weight:600;">Principales transactions</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <thead>
              <tr>
                <th align="left" style="padding:8px 12px;color:#94a3b8;font-size:11px;text-transform:uppercase;font-weight:600;">Libellé</th>
                <th align="left" style="padding:8px 12px;color:#94a3b8;font-size:11px;text-transform:uppercase;font-weight:600;">Catégorie</th>
                <th align="right" style="padding:8px 12px;color:#94a3b8;font-size:11px;text-transform:uppercase;font-weight:600;">Montant</th>
              </tr>
            </thead>
            <tbody>${txRows}</tbody>
          </table>
        </td></tr>

        <tr><td style="padding:18px 32px;background:#f8fafc;border-top:1px solid #eef2f7;">
          <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">— PNIDF · Rapport généré automatiquement —</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function buildAndSendForUser(base44, user, month, serviceMode) {
  const ec = serviceMode ? base44.asServiceRole.entities : base44.entities;
  const filter = { created_by_id: user.id };

  const [accounts, transactions, budgets] = await Promise.all([
    ec.Account.filter(filter),
    ec.Transaction.filter(filter),
    ec.Budget.filter(filter),
  ]);

  const [y, m] = month.split('-').map(Number);
  const monthTx = (transactions || []).filter((t) => {
    const d = new Date(t.date);
    return d.getFullYear() === y && d.getMonth() + 1 === m;
  });

  const totalSpent = monthTx
    .filter((t) => Number(t.amount) < 0)
    .reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
  const totalIncome = monthTx
    .filter((t) => Number(t.amount) > 0)
    .reduce((s, t) => s + Number(t.amount), 0);
  const netSavings = totalIncome - totalSpent;

  const catMap = {};
  monthTx.forEach((t) => {
    if (Number(t.amount) >= 0) return;
    const c = t.category || 'autre';
    catMap[c] = (catMap[c] || 0) + Math.abs(Number(t.amount));
  });
  const byCategory = Object.entries(catMap)
    .map(([cat, value]) => ({
      category: cat,
      label: categoryLabels[cat] || cat,
      value: Math.round(value * 100) / 100,
      color: categoryColor(cat),
    }))
    .sort((a, b) => b.value - a.value);

  const budgetLines = (budgets || []).map((b) => {
    const spent = catMap[b.category] || 0;
    const pct = b.limit_amount > 0 ? Math.round((spent / b.limit_amount) * 100) : 0;
    return {
      category: b.category,
      categoryLabel: categoryLabels[b.category] || b.category,
      spent: Math.round(spent * 100) / 100,
      limit_amount: b.limit_amount,
      pct,
      over: spent > b.limit_amount,
    };
  });

  const topTx = [...monthTx]
    .sort((a, b) => Math.abs(Number(b.amount)) - Math.abs(Number(a.amount)))
    .slice(0, 8);
  topTx._spentCount = monthTx.filter((t) => Number(t.amount) < 0).length;
  topTx._incomeCount = monthTx.filter((t) => Number(t.amount) > 0).length;

  const monthLabel = monthLabelFromKey(month);
  const html = buildReportHtml({
    user,
    month,
    monthLabel,
    totalSpent,
    totalIncome,
    netSavings,
    byCategory,
    budgetLines,
    topTx,
    accounts: accounts || [],
  });

  const plainBody = `Bonjour,

Voici votre rapport financier pour ${monthLabel}.

Dépenses : ${formatEur(totalSpent)}
Revenus : ${formatEur(totalIncome)}
Épargne nette : ${formatEur(netSavings)}

Consultez le détail dans l'application PNIDF.

— PNIDF`;

  await base44.asServiceRole.integrations.Core.SendEmail({
    to: user.email,
    subject: `📊 Votre rapport financier — ${monthLabel}`,
    html,
    text: plainBody,
  });

  return {
    sent: true,
    txCount: monthTx.length,
    accounts: (accounts || []).length,
    budgets: (budgets || []).length,
  };
}

function categoryColor(cat) {
  const map = {
    courses: '#10b981', loisirs: '#8b5cf6', transport: '#3b82f6',
    logement: '#f59e0b', sante: '#f43f5e', salaire: '#22c55e',
    restaurant: '#f97316', shopping: '#ec4899', factures: '#64748b',
    autre: '#94a3b8',
  };
  return map[cat] || '#94a3b8';
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    let payload = {};
    try {
      payload = await req.json() || {};
    } catch (e) {
      payload = {};
    }

    let targetMonth = payload.month && isValidMonthKey(payload.month)
      ? payload.month
      : previousMonthKey();

    let targetUsers;
    let serviceMode = false;

    if (payload.all === true) {
      serviceMode = true;
      targetUsers = await base44.asServiceRole.entities.User.list();
    } else if (payload.userId) {
      serviceMode = true;
      try {
        const u = await base44.asServiceRole.entities.User.get(payload.userId);
        targetUsers = u ? [u] : [];
      } catch (e) {
        targetUsers = [];
      }
    } else {
      const me = await base44.auth.me();
      if (!me) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      targetUsers = [me];
    }

    targetUsers = (targetUsers || []).slice(0, MAX_USERS);

    const results = [];
    for (const user of targetUsers) {
      if (!user.email) {
        results.push({ user: user.id, skipped: 'no email' });
        continue;
      }
      try {
        const res = await buildAndSendForUser(base44, user, targetMonth, serviceMode);
        results.push({ user: user.id, email: user.email, ...res });
      } catch (err) {
        results.push({ user: user.id, email: user.email, error: err.message });
      }
    }

    return Response.json({
      month: targetMonth,
      monthLabel: monthLabelFromKey(targetMonth),
      count: targetUsers.length,
      results,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}