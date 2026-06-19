"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import { MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";

type Invoice = {
  id: string;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date | null;
  grandTotal: { toString(): string };
  status: string;
  client: { name: string } | null;
};

function StatusPill({ status, dueDate }: { status: string; dueDate?: Date | null }) {
  const now = new Date();
  const isOverdue = dueDate && new Date(dueDate) < now && !["paid", "draft"].includes(status);
  const displayStatus = isOverdue ? "Overdue" : status.charAt(0).toUpperCase() + status.slice(1);
  const variant = isOverdue
    ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
    : status === "paid"
    ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400"
    : "bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variant}`}>
      {displayStatus}
    </span>
  );
}

export default function InvoicesList({
  invoices,
  page,
  totalPages,
  total,
  status,
}: {
  invoices: Invoice[];
  page: number;
  totalPages: number;
  total: number;
  status: string;
}) {
  const router = useRouter();
  const statuses = ["", "draft", "sent", "unpaid", "partial", "paid"];
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<{ single: string | null; bulk: boolean }>({
    single: null,
    bulk: false,
  });
  const [deleting, setDeleting] = useState(false);

  const allIds = invoices.map((inv) => inv.id);
  const isAllSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id));

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (isAllSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(allIds));
  }, [isAllSelected, allIds]);

  async function handleDeleteSingle(id: string) {
    setDeleting(true);
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json();
        alert(j.error ?? "Failed to delete");
        return;
      }
      setDeleteConfirm({ single: null, bulk: false });
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  async function handleBulkDelete() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/invoices/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) {
        const j = await res.json();
        alert(j.error ?? "Failed to delete");
        return;
      }
      setDeleteConfirm({ single: null, bulk: false });
      setSelectedIds(new Set());
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Status filter pills — scrollable on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 items-center">
        {statuses.map((s) => (
          <Button
            key={s || "all"}
            variant={status === s ? "default" : "outline"}
            size="sm"
            className="rounded-lg shrink-0"
            onClick={() => router.push(`/dashboard/invoices?status=${s}&page=1`)}
          >
            {s || "All"}
          </Button>
        ))}
        {selectedIds.size > 0 && (
          <Button
            variant="destructive"
            size="sm"
            className="rounded-lg shrink-0"
            onClick={() => setDeleteConfirm({ single: null, bulk: true })}
          >
            Delete selected ({selectedIds.size})
          </Button>
        )}
      </div>
      {invoices.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">No invoices yet.</p>
      ) : (
        <>
          {/* Mobile: card layout */}
          <div className="space-y-3 sm:hidden">
            {invoices.map((inv) => (
              <Link
                key={inv.id}
                href={`/dashboard/invoices/${inv.id}`}
                className="block rounded-xl border bg-card p-4 hover:bg-muted/20 transition-colors active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-primary">{inv.invoiceNumber}</p>
                    <p className="text-sm text-foreground mt-0.5">{inv.client?.name ?? "—"}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-medium tabular-nums">{formatCurrency(Number(inv.grandTotal))}</p>
                    <StatusPill status={inv.status} dueDate={inv.dueDate} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatDate(inv.invoiceDate)}
                  {inv.dueDate && ` · Due: ${formatDate(inv.dueDate)}`}
                </p>
              </Link>
            ))}
          </div>

          {/* Desktop: table layout */}
          <div className="rounded-xl border overflow-hidden hidden sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-3 font-medium text-muted-foreground w-10">
                    <input
                      type="checkbox"
                      className="rounded border-input"
                      aria-label="Select all"
                      checked={isAllSelected}
                      onChange={toggleAll}
                    />
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Invoice#</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Client</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden lg:table-cell">Issue Date</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden lg:table-cell">Due Date</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Amount</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-right p-3 font-medium text-muted-foreground w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        className="rounded border-input"
                        aria-label={`Select ${inv.invoiceNumber}`}
                        checked={selectedIds.has(inv.id)}
                        onChange={() => toggleOne(inv.id)}
                      />
                    </td>
                    <td className="p-3">
                      <Link
                        href={`/dashboard/invoices/${inv.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="p-3 text-foreground">{inv.client?.name ?? "—"}</td>
                    <td className="p-3 text-muted-foreground hidden lg:table-cell">{formatDate(inv.invoiceDate)}</td>
                    <td className="p-3 text-muted-foreground hidden lg:table-cell">
                      {inv.dueDate ? formatDate(inv.dueDate) : "—"}
                    </td>
                    <td className="p-3 text-right font-medium tabular-nums">
                      {formatCurrency(Number(inv.grandTotal))}
                    </td>
                    <td className="p-3">
                      <StatusPill status={inv.status} dueDate={inv.dueDate} />
                    </td>
                    <td className="p-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/invoices/${inv.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/invoices/${inv.id}/edit`}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteConfirm({ single: inv.id, bulk: false })}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ConfirmDialog
            open={deleteConfirm.single !== null}
            onOpenChange={(open) => !open && setDeleteConfirm((p) => ({ ...p, single: null }))}
            title="Delete invoice?"
            description="This action cannot be undone."
            confirmLabel="Delete"
            variant="destructive"
            loading={deleting}
            onConfirm={() => {
              if (deleteConfirm.single) handleDeleteSingle(deleteConfirm.single);
            }}
          />
          <ConfirmDialog
            open={deleteConfirm.bulk}
            onOpenChange={(open) => !open && setDeleteConfirm((p) => ({ ...p, bulk: false }))}
            title="Delete selected invoices?"
            description={`You are about to delete ${selectedIds.size} invoice(s). This cannot be undone.`}
            confirmLabel="Delete all"
            variant="destructive"
            loading={deleting}
            onConfirm={handleBulkDelete}
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Page {page} of {totalPages} ({total} total)</span>
            <div className="flex gap-2">
              {page > 1 && (
                <Button variant="outline" size="sm" className="rounded-lg" asChild>
                  <Link href={`/dashboard/invoices?page=${page - 1}${status ? `&status=${status}` : ""}`}>
                    Previous
                  </Link>
                </Button>
              )}
              {page < totalPages && (
                <Button variant="outline" size="sm" className="rounded-lg" asChild>
                  <Link href={`/dashboard/invoices?page=${page + 1}${status ? `&status=${status}` : ""}`}>
                    Next
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
