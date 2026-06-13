/**
 * Data contract for invoice and quotation document generation.
 */

export type DocumentItem = {
  name: string;
  quantity: number;
  unit: string;
  rate: number;
  /** Upper bound when rate is a range (e.g. 200-300 → rate=200, rateMax=300) */
  rateMax?: number;
  /** Original rate input text (e.g. "200-300"), present only for range rates */
  rateText?: string;
  gstPercent: number;
};

/** Alias for document engine usage. */
export type Item = DocumentItem;

export type Party = {
  name: string;
  address: string;
  email?: string;
  phone?: string;
  gstin?: string;
};

export type BankDetails = {
  accountName: string;
  accountNumber: string;
  ifsc: string;
  bankName: string;
  accountType?: string;
  upiId?: string;
  /** When parsing failed, show this raw text in the payment section. */
  rawText?: string;
};

export type DocumentData = {
  /** Document number (e.g. INV-00001). */
  documentNumber: string;
  date: string;
  company: Party;
  client: Party;
  items: DocumentItem[];
  notes?: string;
  terms?: string;
  bankDetails?: BankDetails;
  logoUrl?: string;
  /** Invoice-only: delivery charges, advance payment. */
  deliveryCharges?: number;
  advancePayment?: number;
  watermark?: string;
  currency?: string;
};

/** Backward compatibility: docNumber maps to documentNumber. */
export type LegacyDocumentData = Omit<DocumentData, "documentNumber"> & { docNumber?: string };

export type TotalsResult = {
  subtotal: number;
  lineItems: { amount: number; gstAmount: number; lineTotal: number }[];
  totalGst: number;
  totalGST: number;
  grandTotal: number;
};
