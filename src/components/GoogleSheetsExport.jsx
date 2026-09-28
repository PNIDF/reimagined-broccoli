import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { haptic, HAPTICS } from "@/lib/haptics";
import { Sheet, Link2, Loader2, ExternalLink, Unlink, Sparkles } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const GOOGLE_SHEETS_CONNECTOR_ID = "6a9bb0f62038a27c841e20be";

export default function GoogleSheetsExport() {
  const { toast } = useToast();
  const [connected, setConnected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("month");
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [exporting, setExporting] = useState(false);
  const [autoExporting, setAutoExporting] = useState(false);
  const [result, setResult] = useState(null);
  const popupRef = useRef(null);
  const [autoExport, setAutoExport] = useState(() => localStorage.getItem("gs_auto_export") === "true");

  const currentPeriod = mode === "year" ? String(year) : month;
  const autoKey = `gs_last_auto_${currentPeriod}`;

  // Rule 2: reusable fetch doubles as connection check and data loader.
  const checkConnection = async () => {
    try {
      await base44.functions.invoke("exportTransactionsToSheets", { check: true });
      setConnected(true);
    } catch {
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  // Rule 1: check auth first, then detect connection status.
  useEffect(() => {
    base44.auth.isAuthenticated().then((authed) => {
      if (authed) checkConnection();
      else setLoading(false);
    });
  }, []);

  // Rule 3: open OAuth popup, poll for close, then re-fetch.
  const handleConnect = async () => {
    haptic(HAPTICS.light);
    try {
      const url = await base44.connectors.connectAppUser(GOOGLE_SHEETS_CONNECTOR_ID);
      const popup = window.open(url, "_blank");
      popupRef.current = popup;
      const timer = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          checkConnection();
        }
      }, 500);
    } catch (e) {
      haptic(HAPTICS.error);
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    }
  };

  const handleDisconnect = async () => {
    haptic(HAPTICS.light);
    try {
      await base44.connectors.disconnectAppUser(GOOGLE_SHEETS_CONNECTOR_ID);
      setConnected(false);
      setResult(null);
      haptic(HAPTICS.success);
      toast({ title: "Déconnecté", description: "Votre compte Google Sheets a été déconnecté." });
    } catch (e) {
      haptic(HAPTICS.error);
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    }
  };

  const runExport = async (payload) => {
    const res = await base44.functions.invoke("exportTransactionsToSheets", payload);
    setResult(res.data);
    haptic(HAPTICS.success);
    toast({ title: "Export terminé", description: `${res.data.count} transactions exportées.` });
    return res.data;
  };

  const handleExport = async () => {
    haptic(HAPTICS.light);
    setExporting(true);
    setResult(null);
    try {
      const payload = mode === "year" ? { year: String(year) } : { month };
      await runExport(payload);
    } catch (e) {
      haptic(HAPTICS.error);
      toast({ variant: "destructive", title: "Erreur d'export", description: e.message });
    } finally {
      setExporting(false);
    }
  };

  const toggleAutoExport = (enabled) => {
    haptic(HAPTICS.light);
    setAutoExport(enabled);
    localStorage.setItem("gs_auto_export", String(enabled));
    if (!enabled) {
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith("gs_last_auto_")) localStorage.removeItem(k);
      });
    }
    toast({
      title: enabled ? "Export automatique activé" : "Export automatique désactivé",
      description: enabled
        ? "Vos transactions seront exportées automatiquement à l'ouverture de cette page."
        : "L'export automatique est désactivé.",
    });
  };

  // Auto-export: trigger once per period when enabled and connected.
  useEffect(() => {
    if (!autoExport || connected !== true || loading) return;
    if (localStorage.getItem(autoKey)) return;
    (async () => {
      setAutoExporting(true);
      try {
        const payload = mode === "year" ? { year: String(year) } : { month };
        await runExport(payload);
        localStorage.setItem(autoKey, "1");
      } catch (e) {
        // Silent fail — user will see manual export error if they retry.
      } finally {
        setAutoExporting(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoExport, connected, loading, currentPeriod]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Sheet className="w-4 h-4" /> Export Google Sheets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Exportez vos transactions par mois ou par année vers un tableur Google Sheets pour garder une trace externe de vos finances.
        </p>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" /> Vérification de la connexion…
          </div>
        ) : connected === false ? (
          <Button onClick={handleConnect} className="h-11">
            <Link2 className="w-4 h-4" /> Connecter mon compte Google
          </Button>
        ) : (
          <>
            <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Compte Google connecté
            </div>
            <div className="space-y-2">
              <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5">
                <button
                  type="button"
                  onClick={() => { haptic(HAPTICS.light); setMode("month"); }}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${mode === "month" ? "bg-primary text-primary-foreground" : "text-slate-600 dark:text-slate-300"}`}
                >Par mois</button>
                <button
                  type="button"
                  onClick={() => { haptic(HAPTICS.light); setMode("year"); }}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${mode === "year" ? "bg-primary text-primary-foreground" : "text-slate-600 dark:text-slate-300"}`}
                >Par année</button>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {mode === "month" ? "Mois à exporter" : "Année à exporter"}
                </label>
                {mode === "month" ? (
                  <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-full sm:w-48" />
                ) : (
                  <Input type="number" min="2000" max="2100" value={year} onChange={(e) => setYear(e.target.value)} className="w-full sm:w-48" />
                )}
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 p-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Export automatique</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Exporte la période en cours à l'ouverture de cette page.
                  </p>
                </div>
              </div>
              <Switch checked={autoExport} onCheckedChange={toggleAutoExport} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleExport} disabled={exporting || autoExporting} className="h-11">
                {exporting || autoExporting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Export en cours…</>
                ) : (
                  <><Sheet className="w-4 h-4" /> Exporter vers Google Sheets</>
                )}
              </Button>
              <Button onClick={handleDisconnect} variant="outline" className="h-11">
                <Unlink className="w-4 h-4" /> Déconnecter
              </Button>
            </div>
            {result && (
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950 p-3 text-sm">
                <p className="text-emerald-700 dark:text-emerald-300 font-medium">
                  {result.count} transactions exportées pour {result.period}.
                </p>
                <a href={result.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 underline mt-1">
                  Ouvrir le tableur <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}