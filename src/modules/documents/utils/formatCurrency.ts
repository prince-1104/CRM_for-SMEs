import numeral from "numeral";

const DEFAULT_CURRENCY = "INR";
const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

/** PDF-safe symbols (Helvetica often lacks ₹ and renders it as ¹). */
const CURRENCY_SYMBOLS_PDF: Record<string, string> = {
  INR: "Rs. ",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

/**
 * Format a number as currency for display in documents.
 * Uses numeral for consistent formatting; symbol from currency code.
 */
export function formatCurrency(
  value: number,
  currency: string = DEFAULT_CURRENCY
): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency + " ";
  return symbol + numeral(value).format("0,0.00");
}

/**
 * PDF-safe currency format. Use in @react-pdf/renderer only.
 * Uses "Rs. " for INR to avoid ₹ rendering as ¹ in default PDF fonts.
 */
export function formatCurrencyForPdf(
  value: number,
  currency: string = DEFAULT_CURRENCY,
  excludeSymbol: boolean = false
): string {
  if (excludeSymbol) {
    return numeral(value).format("0,0.00");
  }
  const symbol = CURRENCY_SYMBOLS_PDF[currency] ?? currency + " ";
  return symbol + numeral(value).format("0,0.00");
}

/**
 * Get PDF-safe currency symbol.
 */
export function getPdfCurrencySymbol(
  currency: string = DEFAULT_CURRENCY
): string {
  return (CURRENCY_SYMBOLS_PDF[currency] ?? currency).trim();
}
