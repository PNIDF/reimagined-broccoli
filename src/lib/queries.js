import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export const queryKeys = {
  accounts: ["accounts"],
  transactions: ["transactions"],
  templates: ["templates"],
};

export function useAccounts() {
  return useQuery({
    queryKey: queryKeys.accounts,
    queryFn: () => base44.entities.Account.list(),
  });
}

export function useTransactions() {
  return useQuery({
    queryKey: queryKeys.transactions,
    queryFn: () => base44.entities.Transaction.list("-date", 500),
  });
}

export function useTemplates() {
  return useQuery({
    queryKey: queryKeys.templates,
    queryFn: () => base44.entities.TransactionTemplate.list("-created_date", 100),
  });
}