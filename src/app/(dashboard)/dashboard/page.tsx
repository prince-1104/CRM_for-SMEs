import Link from "next/link";
import { getTenant } from "@/lib/auth";
import {
  getCachedDashboardStats,
  getCachedRevenueChartData,
  getCachedInvoiceByAmountChartData,
  getRecentInvoices,
} from "@/lib/dashboard-stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { InvoiceByAmountChart } from "@/components/dashboard/invoice-by-amount-chart";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  FileText,
  Wallet,
  FileCheck,
  PiggyBank,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/** Fallback when database is unreachable (e.g. Neon paused or network issue). */
const FALLBACK_STATS = {
  totalInvoices: 0,
  totalClients: 0,
  totalProducts: 0,
  totalRevenue: 0,
  monthlyRevenue: 0,
  previousMonthRevenue: 0,
  revenueTrend: 0,
  pending: 0,
  paidThisMonth: 0,
  upcomingCount: 0,
};

function last6MonthsLabels(): { label: string; revenue: number }[] {
  const now = new Date();
  const out: { label: string; revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      label: d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
      revenue: 0,
    });
  }
  return out;
}

const FALLBACK_CHART = last6MonthsLabels();
const FALLBACK_INVOICE_BY_AMOUNT = [
  { status: "Draft", amount: 0 },
  { status: "Sent", amount: 0 },
  { status: "Paid", amount: 0 },
  { status: "Overdue", amount: 0 },
];

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

export default async function DashboardPage() {
  const tenant = await getTenant();
  if (!tenant) return null;

  let stats = FALLBACK_STATS;
  let chartData = FALLBACK_CHART;
  let invoiceByAmountData = FALLBACK_INVOICE_BY_AMOUNT;
  let recentInvoices: Awaited<ReturnType<typeof getRecentInvoices>> = [];
  let dbError = false;

  try {
    const [s, c, i, r] = await Promise.all([
      getCachedDashboardStats(tenant.organizationId),
      getCachedRevenueChartData(tenant.organizationId),
      getCachedInvoiceByAmountChartData(tenant.organizationId),
      getRecentInvoices(tenant.organizationId, 10),
    ]);
    stats = s;
    chartData = c;
    invoiceByAmountData = i;
    recentInvoices = r;
  } catch {
    dbError = true;
  }

  const {
    totalInvoices,
    pending,
    paidThisMonth,
    upcomingCount,
  } = stats;

  const userName = tenant.name ?? tenant.email ?? "there";

  return (
    <div className="space-y-8">
      {dbError && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            Database is temporarily unavailable. Data below may be empty. Check your connection or try again later.
          </span>
        </div>
      )}
      {/* Welcome — Invoize style */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-background to-background p-6 sm:p-8">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Welcome {userName}!
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here’s what’s happening with your business.
          </p>
        </div>
        {/* Subtle decorative background */}
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-primary/10 blur-2xl" />
      </div>

      {/* Overview — 4 KPI cards */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Overview</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-xl border bg-card shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-primary/10 p-2">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">{totalInvoices}</p>
              <p className="text-sm font-medium text-muted-foreground">Total Invoice</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border bg-card shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Wallet className="h-4 w-4 text-primary" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">
                {formatCurrency(pending)}
              </p>
              <p className="text-sm font-medium text-muted-foreground">Outstanding Amounts</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border bg-card shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-primary/10 p-2">
                  <FileCheck className="h-4 w-4 text-primary" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">
                {formatCurrency(paidThisMonth)}
              </p>
              <p className="text-sm font-medium text-muted-foreground">Paid this month</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border bg-card shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-primary/10 p-2">
                  <PiggyBank className="h-4 w-4 text-primary" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">{upcomingCount}</p>
              <p className="text-sm font-medium text-muted-foreground">Upcoming</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Charts — Cashflow summary + Invoice by Amount */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-xl border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Cashflow summary</CardTitle>
            <p className="text-xs text-muted-foreground">Last 6 Months</p>
          </CardHeader>
          <CardContent>
            <RevenueChart data={chartData} />
          </CardContent>
        </Card>
        <Card className="rounded-xl border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Invoice by Amount</CardTitle>
            <p className="text-xs text-muted-foreground">By status</p>
          </CardHeader>
          <CardContent>
            <InvoiceByAmountChart data={invoiceByAmountData} />
          </CardContent>
        </Card>
      </div>

      {/* Invoices table — Invoize style */}
      <Card className="rounded-xl border bg-card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">Invoices</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/invoices" className="inline-flex items-center gap-1">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {recentInvoices.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No invoices yet. Create your first invoice to get started.
            </p>
          ) : (
            <>
              {/* Mobile View */}
              <div className="divide-y divide-border sm:hidden">
                {recentInvoices.map((inv) => (
                  <div key={inv.id} className="p-4 hover:bg-muted/10 transition-colors space-y-2">
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/dashboard/invoices/${inv.id}`}
                        className="font-semibold text-primary hover:underline"
                      >
                        {inv.invoiceNumber}
                      </Link>
                      <StatusPill status={inv.status} dueDate={inv.dueDate} />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Client:</span>
                      <span className="font-medium text-foreground">{inv.client?.name ?? "—"}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-semibold text-foreground tabular-nums">
                        {formatCurrency(Number(inv.grandTotal))}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                      <span>Issued: {formatDate(inv.invoiceDate)}</span>
                      {inv.dueDate && <span>Due: {formatDate(inv.dueDate)}</span>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View */}
              <div className="overflow-x-auto rounded-b-xl hidden sm:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left p-3 font-medium text-muted-foreground w-10">
                        <input type="checkbox" className="rounded border-input" aria-label="Select all" />
                      </th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Invoice#</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Client</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Issue Date</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Due Date</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Amount</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentInvoices.map((inv) => (
                      <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="p-3">
                          <input type="checkbox" className="rounded border-input" aria-label={`Select ${inv.invoiceNumber}`} />
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
                        <td className="p-3 text-muted-foreground">{formatDate(inv.invoiceDate)}</td>
                        <td className="p-3 text-muted-foreground">
                          {inv.dueDate ? formatDate(inv.dueDate) : "—"}
                        </td>
                        <td className="p-3 text-right font-medium tabular-nums">
                          {formatCurrency(Number(inv.grandTotal))}
                        </td>
                        <td className="p-3">
                          <StatusPill status={inv.status} dueDate={inv.dueDate} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
