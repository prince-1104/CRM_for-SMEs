import { getTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate, amountInWords } from "@/lib/utils";
import { PaymentInfoDisplay } from "@/components/invoice/payment-info-display";
import QuotationActions from "./quotation-actions";

export default async function QuotationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const tenant = await getTenant();
  if (!tenant) return null;
  const { id } = await params;
  const quotation = await prisma.invoice.findFirst({
    where: {
      id,
      organizationId: tenant.organizationId,
      deletedAt: null,
      documentType: "quotation",
    },
    include: { items: true, client: true, organization: true },
  });
  if (!quotation) notFound();

  const subtotal = Number(quotation.subtotal);
  const totalGst = Number(quotation.totalGst);
  const grandTotal = Number(quotation.grandTotal);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/quotations">← Quotations</Link>
          </Button>
          <h1 className="text-2xl font-bold">{quotation.invoiceNumber}</h1>
          <span className="text-muted-foreground">Quotation</span>
        </div>
        <div className="flex items-center gap-2">
          <QuotationActions quotationId={id} docNumber={quotation.invoiceNumber} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>From</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p className="font-medium">{quotation.organization.name}</p>
            {quotation.organization.address && <p className="text-muted-foreground">{quotation.organization.address}</p>}
            {quotation.organization.gstNumber && <p>GSTIN: {quotation.organization.gstNumber}</p>}
            {quotation.organization.email && (
              <p><a href={`mailto:${quotation.organization.email}`} className="text-primary hover:underline">{quotation.organization.email}</a></p>
            )}
            {quotation.organization.phone && (
              <p><a href={`tel:${quotation.organization.phone}`} className="text-primary hover:underline">{quotation.organization.phone}</a></p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quotation to</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            {quotation.client ? (
              <>
                <p className="font-medium">{quotation.client.name}</p>
                {(quotation.client.billingAddress || quotation.client.shippingAddress) && (
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Address: </span>
                    {quotation.client.billingAddress || quotation.client.shippingAddress}
                  </p>
                )}
                {quotation.client.gstin && <p>GSTIN: {quotation.client.gstin}</p>}
                {quotation.client.email && (
                  <p><a href={`mailto:${quotation.client.email}`} className="text-primary hover:underline">{quotation.client.email}</a></p>
                )}
                {quotation.client.phone && (
                  <p><a href={`tel:${quotation.client.phone}`} className="text-primary hover:underline">{quotation.client.phone}</a></p>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">—</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Items</CardTitle>
          <p className="text-sm text-muted-foreground">
            Date: {formatDate(quotation.invoiceDate)}
            {quotation.dueDate && ` · Valid until: ${formatDate(quotation.dueDate)}`}
          </p>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3">Item</th>
                  <th className="text-right p-3">Qty</th>
                  <th className="text-right p-3">Rate</th>
                  <th className="text-right p-3">Amount</th>
                  <th className="text-right p-3">GST %</th>
                  <th className="text-right p-3">CGST</th>
                  <th className="text-right p-3">SGST</th>
                  <th className="text-right p-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {quotation.items
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((item) => {
                    const amt = Number(item.amount);
                    const gst = Number(item.gstAmount);
                    const half = gst / 2;
                    const hasRange = item.rateMax != null;
                    const rateDisplay = hasRange
                      ? `₹${Number(item.rate).toFixed(2)} – ₹${Number(item.rateMax).toFixed(2)}`
                      : `₹${Number(item.rate).toFixed(2)}`;
                    // For range: compute high-end amount for display
                    const highAmt = hasRange ? Number(item.quantity) * Number(item.rateMax) : amt;
                    const highGst = hasRange ? Math.round((highAmt * Number(item.gstPercent)) / 100 * 100) / 100 : gst;
                    const amountDisplay = hasRange
                      ? `₹${amt.toFixed(2)} – ₹${highAmt.toFixed(2)}`
                      : `₹${amt.toFixed(2)}`;
                    const totalDisplay = hasRange
                      ? `₹${(amt + gst).toFixed(2)} – ₹${(highAmt + highGst).toFixed(2)}`
                      : `₹${(amt + gst).toFixed(2)}`;
                    return (
                      <tr key={item.id} className="border-b">
                        <td className="p-3">{item.name}</td>
                        <td className="p-3 text-right">{Number(item.quantity)}</td>
                        <td className="p-3 text-right whitespace-nowrap">{rateDisplay}</td>
                        <td className="p-3 text-right whitespace-nowrap">{amountDisplay}</td>
                        <td className="p-3 text-right">{Number(item.gstPercent)}%</td>
                        <td className="p-3 text-right">₹{half.toFixed(2)}</td>
                        <td className="p-3 text-right">₹{half.toFixed(2)}</td>
                        <td className="p-3 text-right whitespace-nowrap">{totalDisplay}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-right space-y-1">
            <p>Subtotal: {formatCurrency(subtotal)}</p>
            <p>Total GST: {formatCurrency(totalGst)}</p>
            <p className="font-bold text-lg">Grand total: {formatCurrency(grandTotal)}</p>
            <p className="text-muted-foreground text-xs mt-2">
              In words: {amountInWords(grandTotal)}
            </p>
          </div>
        </CardContent>
      </Card>

      {(quotation.notes || quotation.terms) && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Notes / Terms</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {quotation.notes && <p>{quotation.notes}</p>}
            {quotation.terms && <p className="mt-2">{quotation.terms}</p>}
          </CardContent>
        </Card>
      )}

      {(quotation.organization.bankDetails || quotation.organization.upiId) && (
        <PaymentInfoDisplay
          bankDetails={quotation.organization.bankDetails}
          upiId={quotation.organization.upiId}
          settingsUrl="/dashboard/settings"
        />
      )}
    </div>
  );
}
