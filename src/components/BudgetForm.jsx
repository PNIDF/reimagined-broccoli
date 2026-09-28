import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { categoryLabels } from "@/lib/bank";

const categories = ["courses", "loisirs", "transport", "logement", "sante", "restaurant", "shopping", "factures", "autre"];

export default function BudgetForm({ open, onClose, onSaved, editing }) {
  const { toast } = useToast();
  const [category, setCategory] = useState("courses");
  const [limit, setLimit] = useState("");
  const [alertEmail, setAlertEmail] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setCategory(editing.category);
      setLimit(String(editing.limit_amount));
      setAlertEmail(editing.alert_email !== false);
    } else {
      setCategory("courses");
      setLimit("");
      setAlertEmail(true);
    }
  }, [editing, open]);

  const handleSubmit = async () => {
    const limitNum = parseFloat(limit);
    if (!limitNum || limitNum <= 0) {
      toast({ variant: "destructive", title: "Seuil invalide", description: "Entrez un montant supérieur à 0." });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await base44.entities.Budget.update(editing.id, { category, limit_amount: limitNum, alert_email: alertEmail });
      } else {
        await base44.entities.Budget.create({ category, limit_amount: limitNum, alert_email: alertEmail });
      }
      toast({ title: editing ? "Budget mis à jour" : "Budget créé" });
      onSaved();
      onClose();
    } catch (e) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Modifier le seuil" : "Définir un seuil budgétaire"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Catégorie</Label>
            <Select value={category} onValueChange={setCategory} disabled={!!editing}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{categoryLabels[c]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Seuil mensuel (€)</Label>
            <Input type="number" min="0" step="0.01" value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="ex: 300" />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Alerte par email</p>
              <p className="text-xs text-slate-500">Recevoir un email quand le seuil est dépassé</p>
            </div>
            <Switch checked={alertEmail} onCheckedChange={setAlertEmail} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Enregistrement…" : editing ? "Mettre à jour" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}