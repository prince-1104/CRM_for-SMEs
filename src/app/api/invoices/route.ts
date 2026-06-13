import { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/auth";
import { createInvoiceSchema } from "@/lib/validations/invoice";
import { gstFromTaxable } from "@/lib/utils";
import { Decimal } from "@prisma/client/runtime/library";

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  try {
    const tenant = await requireTenant();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const status = searchParams.get("status") ?? undefined;

    const type = searchParams.get("type") ?? undefined;
    const where = {
      organizationId: tenant.organizationId,
      deletedAt: null,
      ...(status ? { status } : {}),
      documentType: type === "quotation" ? "quotation" : "invoice",
    };

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: { client: { select: { name: true } } },
      }),
      prisma.invoice.count({ where }),
    ]);

    return Response.json({
      data: invoices,
      pagination: { page, pageSize: PAGE_SIZE, total, totalPages: Math.ceil(total / PAGE_SIZE) },
    });
  } catch (e) {
    if ((e as Error).message === "Unauthorized")
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenant = await requireTenant();
    const body = await req.json();
    const parsed = createInvoiceSchema.safeParse(body);
    if (!parsed.success)
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );

    const isQuotation = parsed.data.documentType === "quotation";
    const invoiceDate = new Date(parsed.data.invoiceDate);
    const dueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : null;

    const invoice = await prisma.$transaction(
      async (tx) => {
      const updateField = isQuotation ? "quotationNextNumber" : "invoiceNextNumber";
      const org = await tx.organization.update({
        where: { id: tenant.organizationId },
        data: { [updateField]: { increment: 1 } },
        select: {
          invoicePrefix: true,
          invoiceNextNumber: true,
          quotationPrefix: true,
          quotationNextNumber: true,
        },
      });
      const prefix = isQuotation ? org.quotationPrefix : org.invoicePrefix;
      const num = isQuotation ? org.quotationNextNumber : org.invoiceNextNumber;
      const invoiceNumber = `${prefix}-${String(num).padStart(5, "0")}`;

      let subtotal = 0;
      let totalGst = 0;
      const itemsData = parsed.data.items.map((item, i) => {
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
      const deliveryCharges = Number(parsed.data.deliveryCharges) || 0;
      const advancePayment = Number(parsed.data.advancePayment) || 0;
      const grandTotal = subtotal + totalGst + deliveryCharges - advancePayment;

      // Use a single create with nested createMany to keep the transaction fast
      // and avoid extra queries inside the interactive transaction.
      const clientId =
        typeof parsed.data.clientId === "string" && parsed.data.clientId.trim()
          ? parsed.data.clientId.trim()
          : null;
      if (!isQuotation && !clientId)
        throw new Error("Client required");
      return tx.invoice.create({
        data: {
          organizationId: tenant.organizationId,
          ...(clientId != null ? { clientId } : {}),
          documentType: isQuotation ? "quotation" : "invoice",
          invoiceNumber,
          invoiceDate,
          dueDate,
          subtotal: new Decimal(subtotal),
          totalGst: new Decimal(totalGst),
          deliveryCharges: deliveryCharges > 0 ? new Decimal(deliveryCharges) : null,
          advancePayment: advancePayment > 0 ? new Decimal(advancePayment) : null,
          grandTotal: new Decimal(Math.max(0, grandTotal)),
          notes: parsed.data.notes ?? null,
          terms: parsed.data.terms ?? null,
          status: "sent",
          items: {
            createMany: {
              data: itemsData,
            },
          },
        },
        include: { items: true, client: true },
      });
      },
      { timeout: 15000, maxWait: 10000 }
    );

    revalidateTag("invoices");
    revalidateTag("dashboard-stats");

    return Response.json(invoice);
  } catch (e) {
    if ((e as Error).message === "Unauthorized")
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
