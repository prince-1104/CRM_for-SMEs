import React from "react";
import { View, Text } from "@react-pdf/renderer";
import { documentStyles } from "../styles";
import { formatCurrency } from "../utils/formatCurrency";
import type { DocumentItem } from "../types";
import type { TotalsResult } from "../types";

const ROWS_PER_PAGE = 12;

type ItemsTableProps = {
  items: DocumentItem[];
  totals: TotalsResult;
  currency?: string;
};

export function ItemsTable({ items, totals, currency = "INR" }: ItemsTableProps) {
  const { lineItems } = totals;
  const rows = items.map((item, i) => ({
    ...item,
    index: i + 1,
    amount: lineItems[i]?.amount ?? 0,
    gstAmount: lineItems[i]?.gstAmount ?? 0,
    lineTotal: lineItems[i]?.lineTotal ?? 0,
  }));

  return (
    <>
      <View style={documentStyles.table}>
        <View style={documentStyles.tableHeader}>
          <Text style={[documentStyles.colIndex, documentStyles.right, documentStyles.headerText]}>#</Text>
          <Text style={[documentStyles.colItem, documentStyles.headerText]}>Item</Text>
          <Text style={[documentStyles.colQty, documentStyles.right, documentStyles.headerText]}>Qty</Text>
          <Text style={[documentStyles.colUnit, documentStyles.headerText]}>Unit</Text>
          <Text style={[documentStyles.colRate, documentStyles.right, documentStyles.headerText]}>Rate</Text>
          <Text style={[documentStyles.colGst, documentStyles.right, documentStyles.headerText]}>GST %</Text>
          <Text style={[documentStyles.colAmount, documentStyles.right, documentStyles.headerText]}>Amount</Text>
        </View>
        {rows.map((row, i) => (
          <View
            key={i}
            style={
              i % 2 === 1
                ? [documentStyles.tableRow, documentStyles.tableRowAlt]
                : documentStyles.tableRow
            }
          >
            <Text style={[documentStyles.colIndex, documentStyles.right]}>{row.index}</Text>
            <Text style={documentStyles.colItem}>{row.name}</Text>
            <Text style={[documentStyles.colQty, documentStyles.right]}>{row.quantity}</Text>
            <Text style={documentStyles.colUnit}>{row.unit}</Text>
            <Text style={[documentStyles.colRate, documentStyles.right]}>
              {row.rateMax != null
                ? `${formatCurrency(row.rate, currency)} – ${formatCurrency(row.rateMax, currency)}`
                : formatCurrency(row.rate, currency)}
            </Text>
            <Text style={[documentStyles.colGst, documentStyles.right]}>{Number(row.gstPercent)}%</Text>
            <Text style={[documentStyles.colAmount, documentStyles.right]}>
              {formatCurrency(row.lineTotal, currency)}
            </Text>
          </View>
        ))}
      </View>
    </>
  );
}
