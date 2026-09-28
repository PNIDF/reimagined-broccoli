import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { formatCurrency } from "@/lib/bank";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, CreditCard, Wallet, PiggyBank, Download, MoreVertical, Pencil, Trash2 } from "lucide-react";
import AccountForm from "@/components/AccountForm";
import AccountWizard from "@/components/AccountWizard";
import { useAccounts, queryKeys } from "@/lib/queries";
import { queryClientInstance } from "@/lib/query-client";
import PullToRefresh from "@/components/PullToRefresh";
import { generateRibPdf } from "@/lib/generateRibPdf";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";

const typeLabels = {
  courant: "Compte courant",
  epargne: "Compte épargne",
  credits: "Crédit",
};

const typeIcons = {
  courant: Wallet,
  epargne: PiggyBank,
  credits: CreditCard,
};

export default function Accounts() {
  const { data: accounts = [], isLoading: loading, refetch } = useAccounts();
  const [showForm, setShowForm] = useState(false);
  const [editAccount, setEditAccount] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [user, setUser] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const handleDownloadRib = (account) => {
    generateRibPdf({ account, holderName: user?.full_name });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const prevAccs = queryClientInstance.getQueryData(queryKeys.accounts);
    const prevTxs = queryClientInstance.getQueryData(queryKeys.transactions);
    queryClientInstance.setQueryData(queryKeys.accounts, (old = []) => old.filter((a) => a.id !== deleteTarget.id));
    queryClientInstance.setQueryData(queryKeys.transactions, (old = []) => old.filter((t) => t.account_id !== deleteTarget.id));
    try {
      await base44.entities.Transaction.deleteMany({ account_id: deleteTarget.id });
      await base44.entities.Card.deleteMany({ account_id: deleteTarget.id });
      await base44.entities.Account.delete(deleteTarget.id);
      queryClientInstance.invalidateQueries(queryKeys.accounts);
      queryClientInstance.invalidateQueries(queryKeys.transactions);
      toast({ title: "Compte supprimé" });
      setDeleteTarget(null);
    } catch (err) {
      queryClientInstance.setQueryData(queryKeys.accounts, prevAccs);
      queryClientInstance.setQueryData(queryKeys.transactions, prevTxs);
      toast({ title: "Erreur lors de la suppression", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={refetch}>
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">Comptes</h1>
          <p className="text-slate-500 text-sm mt-1">Gérez vos comptes bancaires</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-slate-900 hover:bg-slate-800">
          <Plus className="w-4 h-4 mr-1.5" /> Ouvrir un compte
        </Button>
      </div>

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium">Aucun compte pour le moment</p>
            <p className="text-sm text-slate-400 mt-1 mb-5">Ouvrez votre premier compte pour commencer.</p>
            <Button onClick={() => setShowForm(true)} className="bg-slate-900 hover:bg-slate-800">
              <Plus className="w-4 h-4 mr-1.5" /> Ouvrir un compte
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {accounts.map((a) => {
            const Icon = typeIcons[a.type] || Wallet;
            return (
              <Card key={a.id} className="overflow-hidden border-0 shadow-sm" >
                <div
                  className="p-5 text-white relative"
                  style={{ background: `linear-gradient(135deg, ${a.color || "#0f172a"}, ${a.color || "#0f172a"}dd)` }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-white/70">{typeLabels[a.type] || "Compte"}</p>
                      <p className="text-lg font-semibold mt-1">{a.name}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Icon className="w-6 h-6 text-white/60" />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="text-white/70 hover:text-white p-1 -mr-1 rounded-md">
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditAccount(a)}>
                            <Pencil className="w-4 h-4 mr-2" /> Modifier
                          </DropdownMenuItem>
                          {a.iban && (
                            <DropdownMenuItem onClick={() => handleDownloadRib(a)}>
                              <Download className="w-4 h-4 mr-2" /> Télécharger le RIB
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setDeleteTarget(a)} className="text-rose-600">
                            <Trash2 className="w-4 h-4 mr-2" /> Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <div className="mt-8">
                    {a.card_number ? (
                      <p className="font-mono text-sm tracking-widest text-white/80">
                        •••• {a.card_number}
                      </p>
                    ) : (
                      <p className="font-mono text-xs text-white/60">{a.iban || "—"}</p>
                    )}
                  </div>
                </div>
                <CardContent className="p-5 bg-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500">Solde disponible</p>
                      <p className="text-xl font-semibold text-slate-900 mt-0.5">
                        {formatCurrency(a.balance, a.currency)}
                      </p>
                    </div>
                    {a.iban && (
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide">IBAN</p>
                        <p className="text-xs font-mono text-slate-600 mt-0.5">
                          {a.iban.length > 14 ? `${a.iban.slice(0, 4)} •••• ${a.iban.slice(-4)}` : a.iban}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {showForm && (
        <AccountWizard
          onClose={() => setShowForm(false)}
          onSaved={() => setShowForm(false)}
        />
      )}

      {editAccount && (
        <AccountForm
          account={editAccount}
          onClose={() => setEditAccount(null)}
          onSaved={() => setEditAccount(null)}
        />
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le compte ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera le compte « {deleteTarget?.name} » ainsi que toutes les transactions et cartes associées. Cette opération est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {deleting ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </PullToRefresh>
  );
}