import React from "react";
import { View, Text } from "@react-pdf/renderer";
import { docStyles } from "../pdf/documentStyles";
import { formatCurrencyForPdf } from "../utils/formatCurrency";
import type { DocumentItem } from "../types";
import type { TotalsResult } from "../types";

type ItemsTableProps = {
  items: DocumentItem[];
  totals: TotalsResult;
  currency?: string;
  /** When "quotation", show only SL no, Description, Price/pc (no totals). */
  variant?: "invoice" | "quotation";
};

export function ItemsTable({ items, totals, currency = "INR", variant = "invoice" }: ItemsTableProps) {
  const { lineItems } = totals;

  if (variant === "quotation") {
    return (
      <View style={docStyles.table}>
        <View style={docStyles.tableHeader}>
          <Text style={[docStyles.colQuotNum, docStyles.tableHeaderText]}>SL no</Text>
          <Text style={[docStyles.colQuotDesc, docStyles.tableHeaderText]}>Description</Text>
          <Text style={[docStyles.colQuotPrice, docStyles.tableHeaderText]}>Price/pc</Text>
        </View>
        {items.map((item, i) => (
          <View
            key={i}
            style={i % 2 === 1 ? [docStyles.tableRow, docStyles.tableRowAlt] : docStyles.tableRow}
          >
            <Text style={[docStyles.colQuotNum, docStyles.cellMuted]}>{i + 1}</Text>
            <Text style={[docStyles.colQuotDesc, docStyles.cellBold]}>{item.name}</Text>
            <Text style={[docStyles.colQuotPrice, docStyles.right]}>
              {item.rateMax != null
                ? `${formatCurrencyForPdf(item.rate, currency)} – ${formatCurrencyForPdf(item.rateMax, currency)}`
                : formatCurrencyForPdf(item.rate, currency)}
            </Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={docStyles.table}>
      <View style={docStyles.tableHeader}>
        <Text style={[docStyles.colNum, docStyles.tableHeaderText]}>#</Text>
        <Text style={[docStyles.colItem, docStyles.tableHeaderText]}>Item Description</Text>
        <Text style={[docStyles.colQty, docStyles.tableHeaderText]}>Qty</Text>
        <Text style={[docStyles.colUnitRate, docStyles.tableHeaderText]}>Unit Rate</Text>
        <Text style={[docStyles.colGst, docStyles.tableHeaderText]}>GST</Text>
        <Text style={[docStyles.colAmount, docStyles.tableHeaderText]}>Amount</Text>
      </View>
      {items.map((item, i) => {
        const line = lineItems[i];
        const lineTotal = line?.lineTotal ?? 0;
        const qtyUnit = `${item.quantity} ${item.unit || "pcs"}`;
        return (
          <View
            key={i}
            style={i % 2 === 1 ? [docStyles.tableRow, docStyles.tableRowAlt] : docStyles.tableRow}
          >
            <Text style={[docStyles.colNum, docStyles.cellMuted]}>{i + 1}</Text>
            <Text style={[docStyles.colItem, docStyles.cellBold]}>{item.name}</Text>
            <Text style={[docStyles.colQty, docStyles.cellMuted]}>{qtyUnit}</Text>
            <Text style={[docStyles.colUnitRate, docStyles.right]}>
              {item.rateMax != null
                ? `${formatCurrencyForPdf(item.rate, currency)} – ${formatCurrencyForPdf(item.rateMax, currency)}`
                : formatCurrencyForPdf(item.rate, currency)}
            </Text>
            <Text style={[docStyles.colGst, docStyles.right]}>{Number(item.gstPercent)}%</Text>
            <Text style={[docStyles.colAmount, docStyles.right, docStyles.cellBold]}>{formatCurrencyForPdf(lineTotal, currency)}</Text>
          </View>
        );
      })}
    </View>
  );
}
