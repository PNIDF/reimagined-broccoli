import React from "react";
import { Link } from "react-router-dom";
import { Wallet, Shield, Bell, CreditCard, ArrowLeftRight, PieChart } from "lucide-react";

export default function About() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
          À propos de Nimbus
        </h1>
        <p className="mt-2 text-lg text-slate-500 dark:text-slate-400">
          Votre banque personnelle, simplifiée.
        </p>
      </div>

      <div className="prose prose-slate dark:prose-invert max-w-none">
        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
          Nimbus est une plateforme moderne et intuitive de gestion bancaire personnelle,
          conçue pour vous aider à piloter vos finances au quotidien en toute simplicité.
          L'application permet de suivre le solde de vos comptes courants, d'épargne et de
          crédits, de consulter l'historique détaillé de vos transactions, et d'effectuer des
          virements sécurisés entre vos comptes ou vers d'autres banques avec validation IBAN
          intégrée. Vous pouvez gérer vos cartes bancaires, définir des budgets mensuels par
          catégorie de dépenses, et recevoir des alertes automatiques par email lorsqu'un
          seuil est dépassé ou lorsqu'un prélèvement récurrent approche de sa date.
        </p>
        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
          Nimbus s'adresse à toute personne souhaitant mieux comprendre et maîtriser son
          budget personnel — des étudiants aux familles, en passant par les indépendants et
          les actifs. Que vous cherchiez à suivre vos dépenses courantes, à planifier une
          épargne, ou simplement à garder un œil sur le solde de vos comptes, Nimbus met à
          votre disposition des outils clairs et accessibles, sans complexité technique ni
          jargon bancaire. L'application propose également des statistiques visuelles, un
          calendrier des transactions récurrentes, et un rapport mensuel automatisé pour
          vous aider à prendre les bonnes décisions financières.
        </p>
        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
          Conçue et développée par PNIDF, l'application met l'accent sur la clarté, la
          sécurité et une expérience utilisateur fluide, sur mobile comme sur ordinateur.
          Notre mission est de rendre la gestion financière accessible à tous, en offrant
          une vue consolidée et compréhensible de votre argent en un seul endroit. Nous
          croyons que chacun mérite des outils bancaires simples, transparents et respectueux
          de sa vie privée.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { icon: Wallet, title: "Comptes & soldes", desc: "Suivez tous vos comptes en un coup d'œil." },
          { icon: ArrowLeftRight, title: "Virements sécurisés", desc: "Transférez entre comptes ou vers l'extérieur." },
          { icon: CreditCard, title: "Cartes bancaires", desc: "Gérez vos cartes et leurs statuts." },
          { icon: Bell, title: "Alertes intelligentes", desc: "Soyez notifié en cas de dépassement de budget." },
          { icon: PieChart, title: "Statistiques", desc: "Visualisez vos dépenses par catégorie." },
          { icon: Shield, title: "Sécurité", desc: "Vos données sont protégées et privées." },
        ].map((f) => (
          <div key={f.title} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
            <f.icon className="w-5 h-5 text-indigo-500 mb-2" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{f.title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-6 text-white">
        <h2 className="text-lg font-semibold">Une question ?</h2>
        <p className="text-sm text-indigo-100 mt-1">Notre équipe est là pour vous accompagner.</p>
        <Link
          to="/contact"
          className="mt-4 inline-flex items-center rounded-lg bg-white/15 hover:bg-white/25 transition px-4 py-2 text-sm font-medium"
        >
          Nous contacter
        </Link>
      </div>
    </div>
  );
}