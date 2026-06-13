import type { Invoice, Client, Organization, InvoiceItem } from "@prisma/client";
import type { DocumentData, DocumentItem, Party, BankDetails } from "./types";

type InvoiceWithRelations = Invoice & {
  items: InvoiceItem[];
  client: Client | null;
  organization: Organization;
};

function mapParty(org: Organization): Party {
  return {
    name: org.name,
    address: org.address ?? "",
    email: org.email ?? undefined,
    phone: org.phone ?? undefined,
    gstin: org.gstNumber ?? undefined,
  };
}

function mapClient(client: Client): Party {
  return {
    name: client.name,
    address: client.billingAddress || client.shippingAddress || "",
    email: client.email ?? undefined,
    phone: client.phone ?? undefined,
    gstin: client.gstin ?? undefined,
  };
}

function mapItems(items: InvoiceItem[]): DocumentItem[] {
  return items
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => ({
      name: item.name,
      quantity: Number(item.quantity),
      unit: item.unit,
      rate: Number(item.rate),
      rateMax: item.rateMax != null ? Number(item.rateMax) : undefined,
      rateText: item.rateText ?? undefined,
      gstPercent: Number(item.gstPercent),
    }));
}

function normalizeKey(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, "");
}

// Longer/more specific prefixes first so "IFSC Code" matches before "IFSC", "Bank Name" before "Bank"
const BANK_LABELS: { prefix: string; key: string }[] = [
  { prefix: "account name", key: "accountname" },
  { prefix: "account holder", key: "accountname" },
  { prefix: "account number", key: "accountnumber" },
  { prefix: "account no", key: "accountnumber" },
  { prefix: "acc no", key: "accountnumber" },
  { prefix: "account type", key: "accounttype" },
  { prefix: "ifsc code", key: "ifsc" },
  { prefix: "ifsc", key: "ifsc" },
  { prefix: "bank name", key: "bankname" },
  { prefix: "bank", key: "bankname" },
];

/** Parse organization.bankDetails. Supports "Label: Value", "Label\tValue" (tab), "Label  Value" (2+ spaces), or "Label Value" (known labels) per line. */
function parseBankDetails(bankDetails: string | null): BankDetails | undefined {
  if (!bankDetails?.trim()) return undefined;
  const lines = bankDetails.split(/\r?\n/).filter(Boolean);
  const map: Record<string, string> = {};
  for (const line of lines) {
    const trimmed = line.trim();
    const colonMatch = trimmed.match(/^([^:]+):\s*(.*)$/);
    if (colonMatch) {
      map[normalizeKey(colonMatch[1])] = colonMatch[2].trim();
      continue;
    }
    const tabMatch = trimmed.match(/^([^\t]+)\t+(.*)$/);
    if (tabMatch) {
      map[normalizeKey(tabMatch[1])] = tabMatch[2].trim();
      continue;
    }
    const doubleSpaceMatch = trimmed.match(/^(.+?)\s{2,}(.+)$/);
    if (doubleSpaceMatch) {
      map[normalizeKey(doubleSpaceMatch[1])] = doubleSpaceMatch[2].trim();
      continue;
    }
    // Single space: check known labels (e.g. "Account Name Mohan Prasad")
    const lower = trimmed.toLowerCase();
    for (const { prefix, key } of BANK_LABELS) {
      if (lower === prefix) continue;
      if (lower.startsWith(prefix + " ")) {
        map[key] = trimmed.slice(prefix.length).trim();
        break;
      }
    }
  }
  const accountName = map["accountname"];
  const accountNumber = map["accountnumber"] ?? map["accountno"];
  const ifsc = map["ifsc"] ?? map["ifsccode"];
  const bankName = map["bank"] ?? map["bankname"];
  const accountType = map["accounttype"];
  const hasAnyBank = !!(accountName || accountNumber || ifsc || bankName);
  if (!hasAnyBank) return undefined;
  return {
    accountName: accountName ?? "",
    accountNumber: accountNumber ?? "",
    ifsc: ifsc ?? "",
    bankName: bankName ?? "",
    accountType: accountType ?? undefined,
    upiId: undefined,
  };
}

/** Build bank object for BankDetails. Always pass a full shape; use "—" only per-field when value is missing. */
function buildBankDetails(
  parsed: ReturnType<typeof parseBankDetails> | undefined,
  upiId: string | null | undefined
): BankDetails {
  const empty = "";
  return {
    accountName: parsed?.accountName ?? empty,
    accountNumber: parsed?.accountNumber ?? empty,
    ifsc: parsed?.ifsc ?? empty,
    bankName: parsed?.bankName ?? empty,
    accountType: parsed?.accountType ?? undefined,
    upiId: upiId ?? undefined,
  };
}

export function mapInvoiceToDocumentData(invoice: InvoiceWithRelations): DocumentData {
  const org = invoice.organization;
  const bankParsed = parseBankDetails(org.bankDetails);
  let bankDetails: BankDetails | undefined;
  if (org.bankDetails?.trim() || org.upiId) {
    bankDetails = buildBankDetails(bankParsed, org.upiId);
  }

  return {
    documentNumber: invoice.invoiceNumber,
    date:
      typeof invoice.invoiceDate === "string"
        ? invoice.invoiceDate
        : new Date(invoice.invoiceDate).toISOString().slice(0, 10),
    company: mapParty(org),
    client: invoice.client ? mapClient(invoice.client) : { name: "—", address: "" },
    items: mapItems(invoice.items),
    notes: invoice.notes ?? undefined,
    terms: invoice.terms ?? undefined,
    bankDetails,
    logoUrl: org.logo ?? undefined,
    deliveryCharges: invoice.deliveryCharges != null ? Number(invoice.deliveryCharges) : undefined,
    advancePayment: invoice.advancePayment != null ? Number(invoice.advancePayment) : undefined,
    watermark: invoice.status === "paid" ? "PAID" : invoice.status === "draft" ? "DRAFT" : undefined,
    currency: "INR",
  };
}
