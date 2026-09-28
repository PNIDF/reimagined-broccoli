import { jsPDF } from "jspdf";
import { formatCurrency, categoryLabels } from "@/lib/bank";

const categoryHex = {
  courses: "#10b981",
  loisirs: "#8b5cf6",
  transport: "#3b82f6",
  logement: "#f59e0b",
  sante: "#f43f5e",
  salaire: "#22c55e",
  restaurant: "#f97316",
  shopping: "#ec4899",
  factures: "#64748b",
  autre: "#94a3b8",
};

function monthLabel(key) {
  const [y, m] = key.split("-");
  return new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

/**
 * Generates and downloads a PDF monthly expense report.
 * @param {Object} params
 * @param {string} params.monthKey - "YYYY-MM"
 * @param {Array} params.byCategory - [{ name, category, value }]
 * @param {number} params.totalSpent
 * @param {number} params.totalIncome
 * @param {number} params.variation - percent vs previous month
 */
export function generateExpensePdf({ monthKey, byCategory, totalSpent, totalIncome, variation }) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = 56;

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42);
  doc.text("Rapport des dépenses", margin, y);
  y += 24;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139);
  doc.text(`Période : ${monthLabel(monthKey)}`, margin, y);
  y += 8;
  doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR")}`, margin, y + 14);
  y += 34;

  // Summary block
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, pageW - margin * 2, 86, 8, 8, "FD");
  const colW = (pageW - margin * 2) / 3;
  const summary = [
    { label: "Dépenses", value: formatCurrency(totalSpent), color: [220, 38, 38] },
    { label: "Revenus", value: formatCurrency(totalIncome), color: [16, 185, 129] },
    { label: "Solde net", value: formatCurrency(totalIncome - totalSpent), color: totalIncome - totalSpent >= 0 ? [16, 185, 129] : [220, 38, 38] },
  ];
  summary.forEach((s, i) => {
    const cx = margin + colW * i + 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(s.label, cx, y + 26);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(...s.color);
    doc.text(s.value, cx, y + 52);
  });
  y += 100;

  if (variation !== 0 && Number.isFinite(variation)) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(variation > 0 ? 220 : 16, variation > 0 ? 38 : 185, variation > 0 ? 38 : 129);
    doc.text(`Variation vs mois précédent : ${variation > 0 ? "+" : ""}${variation.toFixed(1)}%`, margin, y);
    y += 20;
  }

  // Category breakdown
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text("Détail par catégorie", margin, y + 6);
  y += 22;

  // Table header
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, pageW - margin * 2, 28, 6, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text("Catégorie", margin + 16, y + 18);
  doc.text("Montant", pageW - margin - 130, y + 18);
  doc.text("Part", pageW - margin - 40, y + 18);
  y += 36;

  doc.setFont("helvetica", "normal");
  byCategory.forEach((c, idx) => {
    if (y > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y - 16, pageW - margin * 2, 24, "F");
    }
    const hex = categoryHex[c.category] || "#94a3b8";
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    doc.setFillColor(r, g, b);
    doc.circle(margin + 18, y - 4, 4, "F");
    doc.setTextColor(51, 65, 85);
    doc.text(c.name, margin + 30, y);
    doc.setTextColor(15, 23, 42);
    doc.text(formatCurrency(c.value), pageW - margin - 130, y);
    const pct = totalSpent > 0 ? (c.value / totalSpent) * 100 : 0;
    doc.setTextColor(100, 116, 139);
    doc.text(`${pct.toFixed(0)}%`, pageW - margin - 40, y);
    y += 24;
  });

  // Footer
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text("PNIDF — Rapport mensuel de dépenses", margin, doc.internal.pageSize.getHeight() - 20);
    doc.text(`${i} / ${pages}`, pageW - margin - 24, doc.internal.pageSize.getHeight() - 20);
  }

  doc.save(`rapport-depenses-${monthKey}.pdf`);
}