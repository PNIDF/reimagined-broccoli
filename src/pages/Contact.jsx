import React, { useState } from "react";
import { Mail, MessageSquare, User, Send, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

export default function Contact() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setSending(true);
    try {
      await base44.functions.invoke("sendContactMessage", { name, email, message });
      setSent(true);
      setName(""); setEmail(""); setMessage("");
      toast({ title: "Message envoyé", description: "Nous vous répondrons dans les plus brefs délais." });
    } catch (err) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
          Contactez-nous
        </h1>
        <p className="mt-2 text-lg text-slate-500 dark:text-slate-400">
          Une question, une suggestion ou besoin d'aide ? Écrivez-nous.
        </p>
      </div>

      {sent && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 p-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-emerald-900 dark:text-emerald-200">Message bien reçu !</p>
            <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-0.5">Nous vous répondrons par email dans les plus brefs délais.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
            <Mail className="w-5 h-5 text-indigo-500 mb-2" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Email</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Notre équipe support répond du lundi au samedi.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
            <MessageSquare className="w-5 h-5 text-indigo-500 mb-2" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Support</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Décrivez votre demande dans le formulaire ci-contre et nous reviendrons vers vous rapidement.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="space-y-2">
            <Label htmlFor="c-name">Nom</Label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Votre nom" className="pl-9" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-email">Email</Label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input id="c-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" className="pl-9" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-message">Message</Label>
            <textarea
              id="c-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Décrivez votre demande..."
              rows={5}
              required
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <Button type="submit" disabled={sending || !name || !email || !message} className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100">
            {sending ? "Envoi…" : (<><Send className="w-4 h-4" /> Envoyer</>)}
          </Button>
        </form>
      </div>
    </div>
  );
}