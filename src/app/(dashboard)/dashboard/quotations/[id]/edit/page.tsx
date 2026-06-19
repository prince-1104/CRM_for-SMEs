import { getTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { getCachedClientList, getCachedProductList } from "@/lib/cached-queries";
import { EditQuotationForm } from "./edit-quotation-form";

export default async function EditQuotationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const tenant = await getTenant();
  if (!tenant) return null;
  const { id } = await params;

  const [quotation, clients, products] = await Promise.all([
    prisma.invoice.findFirst({
      where: {
        id,
        organizationId: tenant.organizationId,
        deletedAt: null,
        documentType: "quotation",
      },
      include: { items: true, client: true },
    }),
    getCachedClientList(tenant.organizationId),
    getCachedProductList(tenant.organizationId),
  ]);

  if (!quotation) notFound();

  const items = quotation.items
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => ({
      id: item.id,
      productId: item.productId ?? undefined,
      name: item.name,
      description: item.description ?? undefined,
      quantity: Number(item.quantity),
      unit: item.unit,
      rate: Number(item.rate),
      rateMax: item.rateMax != null ? Number(item.rateMax) : undefined,
      rateText: item.rateText ?? undefined,
      gstPercent: Number(item.gstPercent),
    }));

  return (
    <EditQuotationForm
      quotationId={id}
      quotationNumber={quotation.invoiceNumber}
      initialData={{
        clientId: quotation.clientId ?? "",
        invoiceDate: quotation.invoiceDate.toISOString().slice(0, 10),
        dueDate: quotation.dueDate ? quotation.dueDate.toISOString().slice(0, 10) : "",
        notes: quotation.notes ?? "",
        terms: quotation.terms ?? "",
        items: items.map(({ productId, name, description, quantity, unit, rate, rateMax, rateText, gstPercent }) => ({
          productId,
          name,
          description,
          quantity,
          unit,
          rate,
          rateMax,
          rateText,
          gstPercent,
        })),
      }}
      clients={clients}
      products={products}
    />
  );
}
