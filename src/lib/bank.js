import React from "react";

export function formatCurrency(value, currency = "EUR") {
  const locale = currency === "EUR" ? "fr-FR" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value || 0);
}

// Longueurs IBAN normalisées par code pays (ISO 13616)
const IBAN_LENGTHS = {
  FR: 27, MC: 27, DE: 22, AT: 20, BE: 16, BG: 22, CY: 28, HR: 21, DK: 18,
  ES: 24, EE: 20, FI: 18, GB: 22, GI: 23, GR: 27, HU: 28, IE: 22, IS: 26,
  IT: 27, LV: 21, LI: 21, LT: 20, LU: 20, MT: 31, NL: 18, PL: 28, PT: 25,
  CZ: 24, RO: 24, SM: 27, SK: 24, SI: 19, SE: 24, CH: 21, TR: 26,
};

/**
 * Valide un IBAN (format, longueur par pays, clé de contrôle modulo 97).
 * @param {string} iban
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateIban(iban) {
  if (!iban) return { valid: true, error: null, country: null, checkDigits: null }; // IBAN optionnel
  const clean = iban.replace(/\s+/g, "").toUpperCase();
  if (!/^[A-Z0-9]+$/.test(clean)) {
    return { valid: false, error: "Caractères non autorisés dans l'IBAN.", country: null, checkDigits: null };
  }
  const country = clean.slice(0, 2);
  const checkDigits = clean.slice(2, 4);
  const expected = IBAN_LENGTHS[country];
  if (expected && clean.length !== expected) {
    return { valid: false, error: `Un IBAN ${country} doit comporter ${expected} caractères.`, country, checkDigits };
  }
  if (!expected && (clean.length < 15 || clean.length > 34)) {
    return { valid: false, error: "Longueur d'IBAN non reconnue.", country, checkDigits };
  }
  // Clé de contrôle : déplacer les 4 premiers caractères à la fin, convertir lettres
  const rearranged = clean.slice(4) + clean.slice(0, 4);
  const expanded = rearranged.replace(/[A-Z]/g, (c) => c.charCodeAt(0) - 55);
  // Calcul du modulo 97 sur la grande chaîne
  let remainder = 0;
  for (let i = 0; i < expanded.length; i++) {
    remainder = (remainder * 10 + Number(expanded[i])) % 97;
  }
  if (remainder !== 1) {
    return { valid: false, error: `Clé de contrôle invalide (mod 97 = ${remainder}, attendu 1).`, country, checkDigits };
  }
  return { valid: true, error: null, country, checkDigits };
}

export function formatIban(iban) {
  if (!iban) return "";
  return iban.replace(/\s+/g, "").replace(/(.{4})/g, "$1 ").trim();
}

export function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

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

export const categoryColors = {
  courses: "bg-emerald-100 text-emerald-700",
  loisirs: "bg-violet-100 text-violet-700",
  transport: "bg-blue-100 text-blue-700",
  logement: "bg-amber-100 text-amber-700",
  sante: "bg-rose-100 text-rose-700",
  salaire: "bg-green-100 text-green-700",
  restaurant: "bg-orange-100 text-orange-700",
  shopping: "bg-pink-100 text-pink-700",
  factures: "bg-slate-100 text-slate-700",
  autre: "bg-gray-100 text-gray-600",
};