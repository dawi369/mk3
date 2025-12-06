"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Transaction } from "@/lib/billing/types";

interface TransactionTableProps {
  transactions: Transaction[];
  className?: string;
}

const STATUS_STYLES: Record<Transaction["status"], string> = {
  succeeded: "border-green/30 bg-green/10 text-green",
  pending: "border-amber/30 bg-amber/10 text-amber",
  failed: "border-red/30 bg-red/10 text-red",
  refunded: "border-blue/30 bg-blue/10 text-blue",
};

export function TransactionTable({ transactions, className }: TransactionTableProps) {
  if (transactions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn("flex h-32 items-center justify-center rounded-xl border bg-card", className)}
      >
        <p className="text-sm text-muted-foreground">No transactions yet</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("rounded-xl border bg-card", className)}
    >
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[200px]">Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction, index) => (
            <motion.tr
              key={transaction.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="border-b transition-colors hover:bg-muted/50"
            >
              <TableCell className="font-medium">{transaction.description}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn("capitalize", STATUS_STYLES[transaction.status])}
                >
                  {transaction.status}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(transaction.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </TableCell>
              <TableCell className="text-right font-medium">
                {transaction.status === "refunded" && "-"}
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: transaction.currency,
                }).format(transaction.amount / 100)}
              </TableCell>
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </motion.div>
  );
}

/**
 * Placeholder transactions for demo/preview
 */
export const DEMO_TRANSACTIONS: Transaction[] = [
  {
    id: "tx_1",
    date: new Date().toISOString(),
    description: "Pro Plan - Monthly",
    amount: 2900,
    currency: "USD",
    status: "succeeded",
  },
  {
    id: "tx_2",
    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    description: "Pro Plan - Monthly",
    amount: 2900,
    currency: "USD",
    status: "succeeded",
  },
];
