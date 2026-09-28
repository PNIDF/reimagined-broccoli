import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  Database,
  Cog,
  Clock,
  UserCheck,
  Mail,
  Search,
  ShieldCheck,
  Lock,
  Eye,
  Trash2,
  Download,
  Pencil,
} from "lucide-react";

const SECTIONS = [
  {
    id: "collecte",
    label: "Collecte",
    icon: Database,
    tldr:
      "Nous collectons uniquement les données nécessaires au fonctionnement du service : informations de compte, transactions et préférences.",
    title: "1. Données collectées",
    body: [
      "Dans le cadre de l'utilisation de Nimbus, nous collectons les catégories de données suivantes :",
      "• Identifiants de compte : adresse e-mail, mot de passe (chiffré) et profil utilisateur.",
      "• Données financières : soldes, transactions, modèles récurrents, budgets et cartes bancaires (numéros tronqués).",
      "• Préférences : paramètres de notifications, thème de l'interface et seuils d'alerte.",
      "• Données techniques : journaux de connexion et cookies fonctionnels strictement nécessaires.",
    ],
  },
  {
    id: "traitement",
    label: "Traitement",
    icon: Cog,
    tldr:
      "Vos données servent uniquement à fournir le service de gestion bancaire personnelle, à sécuriser votre compte et à générer vos alertes.",
    title: "2. Finalités du traitement",
    body: [
      "Le traitement de vos données poursuit les finalités suivantes :",
      "• Fournir les fonctionnalités de gestion de comptes, transactions, virements et budgets.",
      "• Détecter les dépassements de seuils et déclencher des alertes par e-mail.",
      "• Assurer la sécurité du compte et prévenir les usages frauduleux.",
      "• Générer des rapports et statistiques agrégés à usage strictement personnel.",
      "Aucune donnée n'est revendue ni partagée à des fins commerciales avec des tiers.",
    ],
  },
  {
    id: "conservation",
    label: "Conservation",
    icon: Clock,
    tldr:
      "Les données sont conservées pendant la durée d'utilisation du service, puis supprimées à votre demande ou après une période d'inactivité.",
    title: "3. Durée de conservation",
    body: [
      "Vos données personnelles sont conservées selon les principes suivants :",
      "• Données de compte : conservées tant que le compte est actif, puis supprimées sur demande.",
      "• Transactions et budgets : conservés tant que le service est utilisé.",
      "• Journaux techniques : conservés 12 mois maximum à des fins de sécurité.",
      "• En cas de suppression de compte, l'ensemble des données associées est effacé sous 30 jours.",
    ],
  },
  {
    id: "droits",
    label: "Droits RGPD",
    icon: UserCheck,
    tldr:
      "Vous disposez d'un droit d'accès, de rectification, de suppression, de portabilité et d'opposition sur vos données personnelles.",
    title: "4. Vos droits RGPD",
    body: [
      "Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :",
      "• Droit d'accès : consulter les données que nous détenons sur vous.",
      "• Droit de rectification : corriger des données inexactes ou incomplètes.",
      "• Droit à l'effacement : demander la suppression de vos données.",
      "• Droit à la portabilité : récupérer vos données dans un format structuré.",
      "• Droit d'opposition : vous opposer au traitement de vos données.",
      "Pour exercer ces droits, contactez-nous via le formulaire de contact ou par e-mail.",
    ],
    actions: [
      { icon: Eye, label: "Accès" },
      { icon: Pencil, label: "Rectification" },
      { icon: Trash2, label: "Effacement" },
      { icon: Download, label: "Portabilité" },
    ],
  },
  {
    id: "contact",
    label: "Contact DPO",
    icon: Mail,
    tldr:
      "Pour toute question relative à vos données personnelles, contactez notre délégué à la protection des données.",
    title: "5. Contact du DPO",
    body: [
      "Pour exercer vos droits ou pour toute question relative au traitement de vos données personnelles, vous pouvez contacter notre Délégué à la Protection des Données :",
      "• Par e-mail : dpo@pnidf.fr",
      "• Via le formulaire : page Contact de l'application.",
      "Nous nous engageons à répondre à toute demande dans un délai maximum d'un mois.",
      "Vous avez également la possibilité d'introduire une réclamation auprès de la CNIL si vous estimez que vos droits ne sont pas respectés.",
    ],
  },
];

export default function Privacy() {
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState("collecte");

  const filteredSections = useMemo(() => {
    if (!query.trim()) return SECTIONS;
    const q = query.toLowerCase();
    return SECTIONS.filter(
      (s) =>
        s.label.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q) ||
        s.body.some((line) => line.toLowerCase().includes(q))
    );
  }, [query]);

  const handleNavClick = (id) => {
    setActiveId(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 px-3 py-1.5 text-xs font-medium text-teal-700 dark:text-teal-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            Conforme RGPD 2024
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Politique de confidentialité
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Dernière mise à jour : 10 septembre 2026
            </p>
          </div>
        </div>
        <div className="mt-5 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrer par mot-clé…"
            className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-10 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Mobile TOC pill bar */}
      <div className="lg:hidden -mx-4 px-4 sticky top-14 z-20 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur py-2">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => handleNavClick(s.id)}
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition ${
                activeId === s.id
                  ? "bg-teal-600 text-white border-teal-600"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
              }`}
            >
              <s.icon className="w-3.5 h-3.5" />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-8 max-w-[1200px]">
        {/* Desktop TOC rail */}
        <aside className="hidden lg:block">
          <nav className="sticky top-8 space-y-1">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => handleNavClick(s.id)}
                className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition border-l-2 ${
                  activeId === s.id
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-teal-600"
                    : "text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <s.icon className="w-4 h-4 shrink-0" />
                {s.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Reader canvas */}
        <div className="space-y-5 max-w-[800px]">
          {filteredSections.length === 0 && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-sm text-slate-500 dark:text-slate-400">
              Aucune section ne correspond à « {query} ».
            </div>
          )}
          {filteredSections.map((s) => (
            <section
              key={s.id}
              id={s.id}
              className="scroll-mt-32 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 border-l-4 border-l-teal-600"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center">
                  <s.icon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{s.title}</h2>
              </div>

              {/* TL;DR callout */}
              <div className="mb-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 px-4 py-3">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-slate-900 dark:text-white">En résumé — </span>
                  {s.tldr}
                </p>
              </div>

              {/* Body */}
              <div className="space-y-1.5">
                {s.body.map((line, i) => (
                  <p key={i} className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {line}
                  </p>
                ))}
              </div>

              {/* Action chips for rights section */}
              {s.actions && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {s.actions.map((a) => (
                    <span
                      key={a.label}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300"
                    >
                      <a.icon className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      {a.label}
                    </span>
                  ))}
                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 text-xs font-medium transition"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Exercer mes droits
                  </Link>
                </div>
              )}
            </section>
          ))}

          {/* Security footer note */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-5 flex items-start gap-3">
            <Lock className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Nimbus applique des mesures techniques et organisationnelles pour protéger vos
              données : chiffrement en transit, accès restreint et isolation par utilisateur.
              Pour toute question, consultez la section <Link to="/contact" className="font-medium text-teal-700 dark:text-teal-400 hover:underline">Contact</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}