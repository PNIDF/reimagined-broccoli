import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const GOOGLE_SHEETS_CONNECTOR_ID = "6a9bb0f62038a27c841e20be";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body = {};
    try { body = await req.json(); } catch {}

    // Resolve the app user's Google Sheets OAuth connection.
    let accessToken;
    try {
      const conn = await base44.asServiceRole.connectors.getCurrentAppUserConnection(GOOGLE_SHEETS_CONNECTOR_ID);
      accessToken = conn.accessToken;
    } catch (e) {
      return Response.json({ error: "Google Sheets non connecté. Connectez votre compte Google puis réessayez." }, { status: 403 });
    }

    // Lightweight connection check — no export performed.
    if (body.check) {
      return Response.json({ connected: true });
    }

    // Parse requested period: year (YYYY) or month (YYYY-MM). Default to current month.
    const periodMode = (body.year && /^\d{4}$/.test(String(body.year))) ? "year" : "month";
    let year, month;
    if (periodMode === "year") {
      year = Number(body.year);
      month = null;
    } else if (body.month && /^\d{4}-\d{2}$/.test(body.month)) {
      [year, month] = body.month.split("-").map(Number);
    } else {
      const now = new Date();
      year = now.getUTCFullYear();
      month = now.getUTCMonth() + 1;
    }
    const periodLabel = periodMode === "year" ? `${year}` : `${year}-${String(month).padStart(2, "0")}`;

    // Fetch the user's transactions and accounts (user-scoped).
    const transactions = await base44.entities.Transaction.list("-date", 1000);
    const accounts = await base44.entities.Account.list();
    const accountMap = {};
    for (const a of accounts) accountMap[a.id] = a.name || "Compte inconnu";

    // Keep only transactions belonging to the selected period (year or month).
    const filtered = transactions.filter((t) => {
      if (!t.date) return false;
      const d = new Date(t.date);
      if (d.getUTCFullYear() !== year) return false;
      if (periodMode === "month" && (d.getUTCMonth() + 1) !== month) return false;
      return true;
    });

    if (filtered.length === 0) {
      return Response.json({ error: `Aucune transaction trouvée pour ${periodLabel}.` }, { status: 404 });
    }

    // Create a new spreadsheet in the user's Google Drive.
    const title = `Transactions PNIDF - ${periodLabel}`;
    const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
      method: "POST",
      headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ properties: { title } })
    });
    if (!createRes.ok) {
      const errText = await createRes.text();
      return Response.json({ error: "Erreur lors de la création du tableur: " + errText }, { status: 502 });
    }
    const created = await createRes.json();
    const spreadsheetId = created.spreadsheetId;

    // Build the rows (header + one row per transaction).
    const header = ["Date", "Libellé", "Compte", "Montant", "Type", "Catégorie", "Commerçant", "Statut"];
    const rows = filtered.map((t) => {
      const d = new Date(t.date);
      const dateStr = d.toISOString().slice(0, 10);
      return [
        dateStr,
        t.label || "",
        accountMap[t.account_id] || "",
        t.amount,
        t.type || "",
        t.category || "",
        t.merchant || "",
        t.status || ""
      ];
    });
    const values = [header, ...rows];

    // Write all rows starting at A1.
    const range = "A1:H1";
    const writeRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=RAW`, {
      method: "PUT",
      headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ values })
    });
    if (!writeRes.ok) {
      const errText = await writeRes.text();
      return Response.json({ error: "Erreur lors de l'écriture des données: " + errText }, { status: 502 });
    }

    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
    return Response.json({ ok: true, spreadsheetId, url, count: filtered.length, period: periodLabel, mode: periodMode });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}