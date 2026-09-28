import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link, useOutlet } from "react-router-dom";
import { LayoutDashboard, CreditCard, ArrowLeftRight, Wallet, Menu, X, IdCard, PieChart, Bell, Moon, Sun, Settings, ChevronLeft, Calendar as CalendarIcon, FileText, Info, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/lib/AuthContext";
import { AnimatePresence, motion } from "framer-motion";

const navItems = [
  { label: "Tableau de bord", path: "/", icon: LayoutDashboard },
  { label: "Comptes", path: "/accounts", icon: Wallet },
  { label: "Cartes", path: "/cards", icon: IdCard },
  { label: "Transactions", path: "/transactions", icon: CreditCard },
  { label: "Statistiques", path: "/stats", icon: PieChart },
  { label: "Budgets", path: "/budgets", icon: Bell },
  { label: "Calendrier", path: "/calendar", icon: CalendarIcon },
  { label: "Virements", path: "/transfers", icon: ArrowLeftRight },
  { label: "Rapport mensuel", path: "/report", icon: FileText },
  { label: "Réglages", path: "/settings", icon: Settings },
  { label: "À propos", path: "/about", icon: Info },
  { label: "Contact", path: "/contact", icon: Mail },
];

const bottomNavItems = [
  { label: "Accueil", path: "/", icon: LayoutDashboard },
  { label: "Transactions", path: "/transactions", icon: CreditCard },
  { label: "Virements", path: "/transfers", icon: ArrowLeftRight },
  { label: "Comptes", path: "/accounts", icon: Wallet },
  { label: "Cartes", path: "/cards", icon: IdCard },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const { user } = useAuth();
  const isDark = theme === "dark";
  const outlet = useOutlet();

  // Google Ads — bootstrap gtag (chargé une seule fois)
  useEffect(() => {
    if (typeof window === "undefined" || window.__gads_loaded) return;
    window.__gads_loaded = true;
    window.dataLayer = window.dataLayer || [];
    const inIframe = (() => { try { return window.self !== window.top; } catch { return true; } })();
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
      if (inIframe) {
        try {
          const args = Array.prototype.slice.call(arguments);
          const cmd = args[0];
          window.parent.postMessage({
            type: 'base44_gtag_event',
            event: {
              source: 'gtag',
              timestamp: new Date().toLocaleTimeString(),
              command: cmd,
              params: args.slice(1),
              type: cmd === 'event' ? (args[1] || 'event') : cmd,
            },
          }, '*');
        } catch (_e) { /* relay must not break gtag */ }
      }
    };
    const s = document.createElement('script');
    s.src = 'https://www.googletagmanager.com/gtag/js?id=AW-18442661591';
    s.async = true;
    document.head.appendChild(s);
    window.gtag('js', new Date());
    window.gtag('config', 'AW-18442661591', { send_page_view: false });
  }, []);

  // Google Ads — conversion SIGNUP (déclenchée à la première connexion après inscription)
  useEffect(() => {
    if (typeof window === "undefined" || !user || !user.id) return;
    const createdDate = String(user.created_date || '');
    const createdDateUtc = /(?:Z|[+-]\d{2}:?\d{2})$/.test(createdDate)
        ? createdDate
        : createdDate + 'Z';
    const createdAtMs = Date.parse(createdDateUtc);
    const isNewSignup = Number.isFinite(createdAtMs) &&
        Date.now() - createdAtMs < 24 * 60 * 60 * 1000;
    const key = '_aw_signup_fired_AW-18442661591/4qWbCJC9k_McENfdktpE_' + user.id;
    if (!isNewSignup || localStorage.getItem(key)) return;
    let tries = 0;
    const fire = () => {
      if (!window.gtag) { if (tries++ < 20) setTimeout(fire, 250); return; }
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, '1');
      window.gtag('event', 'conversion', {
        send_to: 'AW-18442661591/4qWbCJC9k_McENfdktpE',
        transaction_id: user.id,
      });
    };
    fire();
  }, [user]);

  const isActive = (path) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const rootPaths = ['/', '/accounts', '/transfers', '/cards', '/transactions'];
  const isRootTab = rootPaths.includes(location.pathname);
  const isHome = location.pathname === "/";
  const currentLabel = navItems.find((n) => isActive(n.path))?.label || "";

  const ThemeToggle = ({ className }) => (
    <button
      onClick={toggle}
      className={cn("w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5 transition", className)}
    >
      <span className="flex items-center gap-3">
        {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
        {isDark ? "Mode clair" : "Mode sombre"}
      </span>
      <span className={cn("w-9 h-5 rounded-full relative transition", isDark ? "bg-indigo-500" : "bg-slate-600")}>
        <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all", isDark ? "left-4" : "left-0.5")} />
      </span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-64 flex-col bg-slate-900 text-slate-200 fixed inset-y-0 left-0 z-40">
        <div className="px-6 py-7 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-white tracking-tight">Nimbus</p>
            <p className="text-[11px] text-slate-400 -mt-0.5">Banque en ligne</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
                  active
                    ? "bg-white/10 text-white font-medium"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon className="w-[18px] h-[18px]" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-4 pb-2">
          <ThemeToggle />
        </div>
        <div className="p-4">
          <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-4 text-white">
            <p className="text-xs text-indigo-100">Conseiller dédié</p>
            <p className="text-sm font-medium mt-1">Disponible 7j/7</p>
            <button className="mt-3 w-full bg-white/15 hover:bg-white/25 transition rounded-lg py-1.5 text-xs font-medium">
              Contacter
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar with safe area + dynamic back button */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 bg-slate-900 text-white pt-safe-top pl-safe-left pr-safe-right">
        <div className="h-14 px-3 flex items-center justify-between">
          {isRootTab ? (
            isHome ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold tracking-tight">Nimbus</span>
              </div>
            ) : (
              <span className="font-medium text-sm truncate">{currentLabel}</span>
            )
          ) : (
            <div className="flex items-center gap-1 min-w-0">
              <button onClick={() => navigate(-1)} className="p-2.5 -ml-2 shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg active:bg-white/10 transition" aria-label="Retour">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="font-medium text-sm truncate">{currentLabel}</span>
            </div>
          )}
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={toggle} className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg active:bg-white/10 transition" aria-label="Basculer le thème">
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button onClick={() => setOpen(true)} className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg active:bg-white/10 transition" aria-label="Menu">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 inset-y-0 w-72 bg-slate-900 text-slate-200 flex flex-col pt-safe-top pl-safe-left">
            <div className="px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <p className="font-semibold text-white">Nimbus</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-2 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
                      active ? "bg-white/10 text-white font-medium" : "text-slate-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <Icon className="w-[18px] h-[18px]" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="p-3 border-t border-white/10 pb-safe-bottom">
              <ThemeToggle />
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-64 min-h-screen mobile-main">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {outlet}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom navigation (mobile) */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-900 border-t border-white/10 pb-safe-bottom pl-safe-left pr-safe-right">
        <div className="h-16 flex items-center justify-around">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={(e) => {
                  if (active) {
                    e.preventDefault();
                    if (location.pathname !== item.path) {
                      navigate(item.path, { replace: true });
                    }
                  }
                }}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-4 min-h-[56px] min-w-[64px] rounded-xl transition-colors active:scale-95",
                  active ? "text-indigo-400" : "text-slate-400"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}