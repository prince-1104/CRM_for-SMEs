import { z } from "zod";

/**
 * Parse a rate value that may be a plain number or a range string like "200-300".
 * Returns { rate, rateMax, rateText } where rateMax/rateText are set only for ranges.
 */
export function parseRateInput(value: unknown): { rate: number; rateMax?: number; rateText?: string } {
  if (typeof value === "number") return { rate: value };
  if (typeof value === "string") {
    const trimmed = value.trim();
    // Match range patterns: "200-300", "200 - 300", "200–300" (en-dash)
    const rangeMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)$/);
    if (rangeMatch) {
      const low = parseFloat(rangeMatch[1]);
      const high = parseFloat(rangeMatch[2]);
      const [min, max] = low <= high ? [low, high] : [high, low];
      return { rate: min, rateMax: max, rateText: trimmed };
    }
    const num = parseFloat(trimmed);
    if (!Number.isNaN(num)) return { rate: num };
  }
  return { rate: 0 };
}

export const invoiceItemSchema = z.object({
  productId: z.string().optional(),
  name: z.string().min(1, "Item name required"),
  description: z.string().optional(),
  quantity: z.number().positive(),
  unit: z.string().default("pcs"),
  rate: z.number().min(0),
  rateMax: z.number().min(0).optional(),
  rateText: z.string().optional(),
  gstPercent: z.number().min(0).max(100),
});
// amount = quantity * rate; gstAmount computed server-side

/**
 * Preprocess items array: parse rate strings (e.g. "200-300") into rate/rateMax/rateText.
 * This runs before Zod validation so the schema always sees numeric rate values.
 */
function preprocessItems(items: unknown): unknown {
  if (!Array.isArray(items)) return items;
  return items.map((item: unknown) => {
    if (typeof item !== "object" || item === null) return item;
    const obj = item as Record<string, unknown>;
    // If rate is already a number and no rateText, pass through
    if (typeof obj.rate === "number" && !obj.rateText) return obj;
    // Parse rate (could be a string from text input)
    const rateInput = obj.rateText ?? obj.rate;
    const parsed = parseRateInput(rateInput);
    return {
      ...obj,
      rate: parsed.rate,
      rateMax: parsed.rateMax ?? obj.rateMax,
      rateText: parsed.rateText ?? obj.rateText,
    };
  });
}

export const createInvoiceSchema = z
  .object({
    documentType: z.enum(["invoice", "quotation"]).optional().default("invoice"),
    clientId: z.string().optional(),
    invoiceDate: z.string().min(1),
    dueDate: z.string().optional(),
    notes: z.string().optional(),
    terms: z.string().optional(),
    deliveryCharges: z.preprocess(
      (v) => (v === "" || v == null || Number.isNaN(v) ? undefined : v),
      z.number().min(0).optional()
    ),
    advancePayment: z.preprocess(
      (v) => (v === "" || v == null || Number.isNaN(v) ? undefined : v),
      z.number().min(0).optional()
    ),
    items: z.preprocess(preprocessItems, z.array(invoiceItemSchema).min(1, "At least one item required")),
  })
  .refine(
    (data) =>
      data.documentType !== "invoice" ||
      (typeof data.clientId === "string" && data.clientId.trim().length > 0),
    { message: "Client required", path: ["clientId"] }
  );

export const updateInvoiceSchema = z.object({
  clientId: z.string().min(1, "Client required").optional(),
  invoiceDate: z.string().optional(),
  dueDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  terms: z.string().optional().nullable(),
  deliveryCharges: z.preprocess(
    (v) => (v === "" || v == null || Number.isNaN(v) ? undefined : v),
    z.number().min(0).optional()
  ),
  advancePayment: z.preprocess(
    (v) => (v === "" || v == null || Number.isNaN(v) ? undefined : v),
    z.number().min(0).optional()
  ),
  items: z.preprocess(
    (v) => (v === undefined ? undefined : preprocessItems(v)),
    z.array(invoiceItemSchema).min(1, "At least one item required").optional()
  ),
});

export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
