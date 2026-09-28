import { jsPDF } from "jspdf";
import { formatIban } from "@/lib/bank";

const typeLabels = {
  courant: "Compte courant",
  epargne: "Compte épargne",
  credits: "Crédit",
};

/**
 * Generates and downloads a RIB (Relevé d'Identité Bancaire) PDF for an account.
 * @param {Object} account - The account entity
 * @param {string} holderName - The account holder's full name
 */
export function generateRibPdf({ account, holderName }) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  let y = 60;

  // Header band
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageW, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42);
  doc.text("Relevé d'Identité Bancaire", margin, y);
  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139);
  doc.text("PNIDF", margin, y + 14);
  y += 38;

  // Titulaire block
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, pageW - margin * 2, 64, 8, 8, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text("Titulaire du compte", margin + 16, y + 24);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text(holderName || account.name || "—", margin + 16, y + 48);
  y += 84;

  // Détails du compte table
  const rows = [
    { label: "Domiciliation", value: "PNIDF" },
    { label: "Type de compte", value: typeLabels[account.type] || "Compte" },
    { label: "Intitulé du compte", value: account.name || "—" },
    { label: "Devise", value: account.currency || "EUR" },
  ];

  rows.forEach((r) => {
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, y, pageW - margin * 2, 36, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(r.label, margin + 16, y + 22);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(r.value, margin + 180, y + 22);
    y += 36;
  });

  y += 12;

  // IBAN block
  doc.setDrawColor(15, 23, 42);
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin, y, pageW - margin * 2, 70, 8, 8, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.text("IBAN", margin + 16, y + 24);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  const iban = formatIban(account.iban) || "—";
  doc.text(iban, margin + 16, y + 50);
  y += 90;

  // BIC note
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text("BIC : PNIDFR22XXX", margin, y);
  y += 16;
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text("Identifiant SWIFT de l'établissement bancaire.", margin, y);

  // Footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(`Émis le ${new Date().toLocaleDateString("fr-FR")}`, margin, pageH - 24);
  doc.text("PNIDF — RIB", pageW - margin - 80, pageH - 24);

  doc.save(`RIB-${(account.name || "compte").replace(/\s+/g, "-")}.pdf`);
}