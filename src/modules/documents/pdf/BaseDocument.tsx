import React from "react";
import { Document, Page, View, Text } from "@react-pdf/renderer";
import { docStyles } from "./documentStyles";
import { DocumentHeader } from "../sections/DocumentHeader";
import { PartyDetails } from "../sections/PartyDetails";
import { ItemsTable } from "../sections/ItemsTable";
import { TotalsBlock } from "../sections/TotalsBlock";
import { AmountInWords } from "../sections/AmountInWords";
import { NotesTerms } from "../sections/NotesTerms";
import { BankDetails } from "../sections/BankDetails";
import { calculateTotals } from "../utils/calculateTotals";
import type { DocumentData } from "../types";

type BaseDocumentProps = {
  data: DocumentData;
  /** Document title (e.g. "Invoice", "Quotation"). */
  title: string;
  toLabel: string;
  /** Quotation only: validity text (e.g. "This quotation is valid for 15 days."). */
  validityText?: string;
  /** Optional company tagline (e.g. "Uniform Suppliers · Kolkata"). */
  companyTagline?: string;
  /** When false, omit grand total, subtotal, amount in words (e.g. for quotations). */
  showTotals?: boolean;
  /** "quotation" = table with SL no, Description, Price/pc only. */
  itemsTableVariant?: "invoice" | "quotation";
  /** When false, hide status badge (e.g. "Unpaid") — for quotations. */
  showStatus?: boolean;
  /** When false, hide payment/bank details — for quotations. */
  showPaymentInfo?: boolean;
};

function getStatus(watermark?: string): string {
  if (watermark === "PAID") return "Paid";
  if (watermark === "DRAFT") return "Draft";
  return "Unpaid";
}

export function BaseDocument({
  data,
  title,
  toLabel,
  validityText,
  companyTagline,
  showTotals = true,
  itemsTableVariant = "invoice",
  showStatus = false,
  showPaymentInfo = true,
}: BaseDocumentProps) {
  const totals = calculateTotals(data.items);
  const currency = data.currency ?? "INR";
  const status = getStatus(data.watermark);

  return (
    <Document>
      <Page size="A4" style={docStyles.page}>
        <View style={docStyles.topBar} />
        <DocumentHeader
          title={title}
          documentNumber={data.documentNumber}
          date={data.date}
          companyName={data.company.name}
          companyAddress={data.company.address || undefined}
          companyEmail={data.company.email}
          companyPhone={data.company.phone}
          companyTagline={companyTagline}
          status={showStatus ? status : undefined}
        />
        <View style={docStyles.accentRule} />
        <PartyDetails billedBy={data.company} billedTo={data.client} toLabel={toLabel} />

        <View style={docStyles.content}>
          <ItemsTable
            items={data.items}
            totals={totals}
            currency={currency}
            variant={itemsTableVariant}
          />
          {showTotals && (
            <>
              <TotalsBlock
                totals={totals}
                deliveryCharges={data.deliveryCharges}
                advancePayment={data.advancePayment}
                currency={currency}
              />
              <AmountInWords
                totals={totals}
                deliveryCharges={data.deliveryCharges}
                advancePayment={data.advancePayment}
              />
            </>
          )}
          {validityText && (
            <View style={docStyles.validity}>
              <Text>{validityText}</Text>
            </View>
          )}
          <NotesTerms notes={data.notes} terms={data.terms} />
          {showPaymentInfo && data.bankDetails && <BankDetails bank={data.bankDetails} />}
        </View>

        <View style={docStyles.footer} fixed>
          <Text style={docStyles.footerNote}>
            Thank you for your business.
          </Text>
          <Text style={docStyles.footerBrand}>{data.company.name}</Text>
          <Text
            style={docStyles.pageNumber}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
