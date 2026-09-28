import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useTheme } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";
import { AlertTriangle, Trash2, Monitor, Sun, Moon } from "lucide-react";
import { haptic, HAPTICS } from "@/lib/haptics";
import GoogleSheetsExport from "@/components/GoogleSheetsExport";

export default function Settings() {
  const { toast } = useToast();
  const { mode, setTheme } = useTheme();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== "DELETE") return;
    haptic(HAPTICS.warning);
    setDeleting(true);
    try {
      await base44.functions.invoke("deleteAccount", {});
      haptic(HAPTICS.success);
      toast({ title: "Compte supprimé", description: "Vos données ont été effacées." });
      await base44.auth.logout();
      window.location.href = "/login";
    } catch (e) {
      haptic(HAPTICS.error);
      toast({ variant: "destructive", title: "Erreur", description: e.message });
      setDeleting(false);
    }
  };

  const themeOptions = [
    { value: "system", label: "Système", icon: Monitor },
    { value: "light", label: "Clair", icon: Sun },
    { value: "dark", label: "Sombre", icon: Moon },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Réglages</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Gérez vos préférences et votre compte.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Apparence</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Le thème suit automatiquement vos préférences système par défaut.</p>
          <div className="grid grid-cols-3 gap-2">
            {themeOptions.map((opt) => {
              const Icon = opt.icon;
              const active = mode === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 py-4 min-h-[56px] rounded-xl border transition active:scale-95",
                    active
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400"
                      : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <GoogleSheetsExport />

      <Card className="border-rose-200 dark:border-rose-900">
        <CardHeader><CardTitle className="text-base text-rose-600 dark:text-rose-400">Zone sensible</CardTitle></CardHeader>
        <CardContent>
          {!confirmOpen ? (
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                La suppression de votre compte efface définitivement votre compte utilisateur ainsi que tous vos comptes bancaires, transactions, cartes et budgets associés. Cette action est irréversible et les données seront définitivement effacées.
              </p>
              <Button variant="destructive" className="h-11" onClick={() => { haptic(HAPTICS.light); setConfirmOpen(true); }}>
                <Trash2 className="w-4 h-4" /> Supprimer mon compte
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-2 rounded-lg bg-rose-50 dark:bg-rose-950 p-3">
                <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                <p className="text-xs text-rose-700 dark:text-rose-300">
                  Tapez <span className="font-mono font-bold">DELETE</span> pour confirmer la suppression définitive de votre compte utilisateur et de toutes vos données associées (comptes, transactions, cartes, budgets).
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Confirmation</Label>
                <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="DELETE" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="h-11 flex-1 sm:flex-none" onClick={() => { haptic(HAPTICS.light); setConfirmOpen(false); setConfirmText(""); }}>Annuler</Button>
                <Button variant="destructive" className="h-11 flex-1 sm:flex-none" disabled={confirmText !== "DELETE" || deleting} onClick={handleDelete}>
                  {deleting ? "Suppression…" : "Confirmer la suppression"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}