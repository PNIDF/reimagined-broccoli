import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const accounts = await base44.entities.Account.list();
    const today = new Date().toISOString().slice(0, 10);

    // Accounts with a threshold defined and balance below it.
    const triggered = accounts.filter((a) =>
      a.alert_threshold != null &&
      a.alert_threshold !== '' &&
      typeof a.balance === 'number' &&
      a.balance < a.alert_threshold
    );

    // Avoid spamming: only one email per account per day.
    const toAlert = triggered.filter((a) => a.last_balance_alert !== today);

    let sent = false;
    if (toAlert.length > 0 && user.email) {
      const lines = toAlert
        .map((a) => `• ${a.name} : solde actuel de ${a.balance.toFixed(2)}€ (seuil d'alerte : ${Number(a.alert_threshold).toFixed(2)}€)`)
        .join("\n");
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        subject: `🔴 Alerte solde — ${toAlert.length} compte(s) sous le seuil défini`,
        body: `Bonjour,\n\nUn ou plusieurs de vos comptes est passé sous le seuil d'alerte que vous avez défini :\n\n${lines}\n\nPensez à réapprovisionner votre compte ou à ajuster le seuil dans l'application.\n\n— PNIDF`
      });
      sent = true;
      // Record today's alert on each account to prevent duplicates.
      await Promise.all(toAlert.map((a) =>
        base44.entities.Account.update(a.id, { last_balance_alert: today })
      ));
    }

    return Response.json({
      triggered: triggered.length,
      sent,
      email: user.email,
      skipped: triggered.length - toAlert.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}