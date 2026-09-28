import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json();
    const { name, email, message } = body || {};

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return Response.json({ error: 'Nom invalide' }, { status: 400 });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'Email invalide' }, { status: 400 });
    }
    if (!message || typeof message !== 'string' || message.trim().length < 5 || message.length > 5000) {
      return Response.json({ error: 'Message invalide' }, { status: 400 });
    }

    // Find an admin user to receive the contact message
    const users = await base44.asServiceRole.entities.User.list();
    const admin = users.find((u) => u.role === 'admin') || users[0];
    if (!admin || !admin.email) {
      return Response.json({ error: 'Aucun destinataire configuré' }, { status: 500 });
    }

    const safeName = name.trim().slice(0, 100);
    const safeEmail = email.trim().slice(0, 200);
    const safeMessage = message.trim().slice(0, 5000);

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: admin.email,
      subject: `Nouveau message de contact — ${safeName}`,
      body: `Un nouveau message de contact a été reçu depuis le site Nimbus.\n\nNom: ${safeName}\nEmail: ${safeEmail}\n\nMessage:\n${safeMessage}\n\n— Message automatique depuis le formulaire de contact Nimbus`
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}