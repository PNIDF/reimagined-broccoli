export const categoryLabels = {
  courses: "Courses",
  loisirs: "Loisirs",
  transport: "Transport",
  logement: "Logement",
  sante: "Santé",
  salaire: "Salaire",
  restaurant: "Restaurant",
  shopping: "Shopping",
  factures: "Factures",
  autre: "Autre",
};

export function monthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function previousMonthKey() {
  const now = new Date();
  return monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
}

export function monthLabelFromKey(key) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
}

export function formatEur(n) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(Number(n) || 0);
}

export function isValidMonthKey(key) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(key);
}