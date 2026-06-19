"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";

type Quotation = {
  id: string;
  invoiceNumber: string;
  invoiceDate: Date;
  grandTotal: { toString(): string };
  status: string;
  client: { name: string } | null;
};

export default function QuotationsList({
  quotations,
  page,
  totalPages,
  total,
}: {
  quotations: Quotation[];
  page: number;
  totalPages: number;
  total: number;
}) {
  return (
    <div className="space-y-4">
      {quotations.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">No quotations yet. Create your first quotation.</p>
      ) : (
        <>
          {/* Mobile: card layout */}
          <div className="space-y-3 sm:hidden">
            {quotations.map((q) => (
              <Link
                key={q.id}
                href={`/dashboard/quotations/${q.id}`}
                className="block rounded-xl border bg-card p-4 hover:bg-muted/20 transition-colors active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-primary">{q.invoiceNumber}</p>
                    <p className="text-sm text-foreground mt-0.5">{q.client?.name ?? "—"}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-medium tabular-nums">{formatCurrency(Number(q.grandTotal))}</p>
                    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground mt-1">
                      {q.status}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatDate(q.invoiceDate)}
                </p>
              </Link>
            ))}
          </div>

          {/* Desktop: table layout */}
          <div className="rounded-xl border overflow-hidden hidden sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-3 font-medium text-muted-foreground">Number</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Client</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Date</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Amount</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Status</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {quotations.map((q) => (
                  <tr key={q.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="p-3">
                      <Link
                        href={`/dashboard/quotations/${q.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {q.invoiceNumber}
                      </Link>
                    </td>
                    <td className="p-3">{q.client?.name ?? "—"}</td>
                    <td className="p-3 hidden md:table-cell">
                      {formatDate(q.invoiceDate)}
                    </td>
                    <td className="p-3 text-right font-medium tabular-nums">{formatCurrency(Number(q.grandTotal))}</td>
                    <td className="p-3 text-muted-foreground hidden md:table-cell">{q.status}</td>
                    <td className="p-3 text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/quotations/${q.id}`}>View</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Page {page} of {totalPages} ({total} total)</span>
            <div className="flex gap-2">
              {page > 1 && (
                <Button variant="outline" size="sm" className="rounded-lg" asChild>
                  <Link href={`/dashboard/quotations?page=${page - 1}`}>Previous</Link>
                </Button>
              )}
              {page < totalPages && (
                <Button variant="outline" size="sm" className="rounded-lg" asChild>
                  <Link href={`/dashboard/quotations?page=${page + 1}`}>Next</Link>
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
