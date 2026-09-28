import React from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { Wallet, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useTheme } from "@/components/ThemeProvider";
import { Moon, Sun } from "lucide-react";

export default function PublicLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur pt-safe-top">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold tracking-tight text-slate-900 dark:text-white">Nimbus</span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link to="/about" className="px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition">
              À propos
            </Link>
            <Link to="/contact" className="px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition">
              Contact
            </Link>
            <Link to="/privacy" className="px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition">
              Confidentialité
            </Link>
            <button
              onClick={toggle}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
              aria-label="Basculer le thème"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {user ? (
              <button
                onClick={() => navigate("/")}
                className="ml-1 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-1.5 text-sm font-medium hover:opacity-90 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Tableau de bord
              </button>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="ml-1 inline-flex items-center rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-1.5 text-sm font-medium hover:opacity-90 transition"
              >
                Se connecter
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 mt-12 pb-safe-bottom">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm text-slate-500 dark:text-slate-400">© {new Date().getFullYear()} PNIDF — Nimbus</span>
          </div>
          <nav className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
            <Link to="/about" className="hover:text-slate-900 dark:hover:text-white transition">À propos</Link>
            <Link to="/contact" className="hover:text-slate-900 dark:hover:text-white transition">Contact</Link>
            <Link to="/privacy" className="hover:text-slate-900 dark:hover:text-white transition">Confidentialité</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}