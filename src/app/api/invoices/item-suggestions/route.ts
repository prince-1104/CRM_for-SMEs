import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/auth";

/**
 * GET /api/invoices/item-suggestions?q=...
 * Returns unique item names used in past invoices and quotations for autocomplete.
 */
export async function GET(req: NextRequest) {
  try {
    const tenant = await requireTenant();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() ?? "";

    // Fetch distinct item names with their most recent rate, gstPercent, and unit
    const items = await prisma.invoiceItem.findMany({
      where: {
        invoice: {
          organizationId: tenant.organizationId,
          deletedAt: null,
        },
        ...(q
          ? { name: { contains: q, mode: "insensitive" as const } }
          : {}),
      },
      select: {
        name: true,
        rate: true,
        gstPercent: true,
        unit: true,
        invoice: {
          select: {
            createdAt: true,
          },
        },
      },
      orderBy: {
        invoice: {
          createdAt: "desc",
        },
      },
      take: 200,
    });

    // Deduplicate by name, keeping the most recent entry
    const seen = new Map<string, { name: string; rate: number; gstPercent: number; unit: string }>();
    for (const item of items) {
      const key = item.name.toLowerCase();
      if (!seen.has(key)) {
        seen.set(key, {
          name: item.name,
          rate: Number(item.rate),
          gstPercent: Number(item.gstPercent),
          unit: item.unit,
        });
      }
    }

    return Response.json(Array.from(seen.values()).slice(0, 50));
  } catch (e) {
    if ((e as Error).message === "Unauthorized")
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
