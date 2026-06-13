import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/auth";
import { updateInvoiceSchema } from "@/lib/validations/invoice";
import { gstFromTaxable } from "@/lib/utils";
import { Decimal } from "@prisma/client/runtime/library";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenant = await requireTenant();
    const { id } = await params;
    const invoice = await prisma.invoice.findFirst({
      where: { id, organizationId: tenant.organizationId, deletedAt: null },
      include: { items: true, client: true, organization: true, payments: true },
    });
    if (!invoice) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(invoice);
  } catch (e) {
    if ((e as Error).message === "Unauthorized")
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenant = await requireTenant();
    const { id } = await params;
    const existing = await prisma.invoice.findFirst({
      where: { id, organizationId: tenant.organizationId, deletedAt: null },
      include: { items: true },
    });
    if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const parsed = updateInvoiceSchema.safeParse(body);
    if (!parsed.success)
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );

    const data = parsed.data;
    let subtotal = Number(existing.subtotal);
    let totalGst = Number(existing.totalGst);
    let deliveryCharges = existing.deliveryCharges != null ? Number(existing.deliveryCharges) : 0;
    let advancePayment = existing.advancePayment != null ? Number(existing.advancePayment) : 0;

    if (data.items && data.items.length > 0) {
      subtotal = 0;
      totalGst = 0;
      const itemsData = data.items.map((item, i) => {
        const amount = item.quantity * item.rate;
        const { totalGst: gstAmount } = gstFromTaxable(amount, item.gstPercent);
        subtotal += amount;
        totalGst += gstAmount;
        return {
          productId: item.productId ?? null,
          name: item.name,
          description: item.description ?? null,
          quantity: new Decimal(item.quantity),
          unit: item.unit,
          rate: new Decimal(item.rate),
          rateMax: item.rateMax != null ? new Decimal(item.rateMax) : null,
          rateText: item.rateText ?? null,
          amount: new Decimal(amount),
          gstPercent: new Decimal(item.gstPercent),
          gstAmount: new Decimal(gstAmount),
          sortOrder: i,
        };
      });
      await prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });
      await prisma.invoiceItem.createMany({
        data: itemsData.map((item) => ({
          invoiceId: id,
          ...item,
        })),
      });
    }

    if (data.deliveryCharges !== undefined) deliveryCharges = data.deliveryCharges ?? 0;
    if (data.advancePayment !== undefined) advancePayment = data.advancePayment ?? 0;
    const grandTotal = Math.max(0, subtotal + totalGst + deliveryCharges - advancePayment);

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        ...(data.clientId !== undefined && { clientId: data.clientId }),
        ...(data.invoiceDate !== undefined && { invoiceDate: new Date(data.invoiceDate) }),
        ...(data.dueDate !== undefined && {
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
        }),
        ...(data.notes !== undefined && { notes: data.notes || null }),
        ...(data.terms !== undefined && { terms: data.terms || null }),
        ...(data.deliveryCharges !== undefined && {
          deliveryCharges: deliveryCharges > 0 ? new Decimal(deliveryCharges) : null,
        }),
        ...(data.advancePayment !== undefined && {
          advancePayment: advancePayment > 0 ? new Decimal(advancePayment) : null,
        }),
        ...(data.items && data.items.length > 0 && {
          subtotal: new Decimal(subtotal),
          totalGst: new Decimal(totalGst),
        }),
        grandTotal: new Decimal(grandTotal),
      },
      include: { items: true, client: true },
    });

    return Response.json(invoice);
  } catch (e) {
    if ((e as Error).message === "Unauthorized")
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenant = await requireTenant();
    const { id } = await params;
    const existing = await prisma.invoice.findFirst({
      where: { id, organizationId: tenant.organizationId, deletedAt: null },
    });
    if (!existing) return Response.json({ error: "Not found" }, { status: 404 });
    await prisma.invoice.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return Response.json({ ok: true });
  } catch (e) {
    if ((e as Error).message === "Unauthorized")
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
