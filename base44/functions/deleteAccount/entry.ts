import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = user.id;

    // Wipe all user-owned data
    await base44.asServiceRole.entities.Account.deleteMany({ created_by_id: userId });
    await base44.asServiceRole.entities.Transaction.deleteMany({ created_by_id: userId });
    await base44.asServiceRole.entities.Card.deleteMany({ created_by_id: userId });
    await base44.asServiceRole.entities.Budget.deleteMany({ created_by_id: userId });

    // Attempt to remove the user record itself (may not be permitted by the platform)
    let userDeleted = false;
    try {
      await base44.asServiceRole.entities.User.delete(userId);
      userDeleted = true;
    } catch (e) {
      // Auth account removal handled by the platform; data is already erased.
    }

    return Response.json({
      success: true,
      userDeleted,
      message: "Vos données ont été supprimées. Vous allez être déconnecté."
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}