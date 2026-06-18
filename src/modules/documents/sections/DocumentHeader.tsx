import React from "react";
import { View, Text } from "@react-pdf/renderer";
import { docStyles } from "../pdf/documentStyles";
import { formatDateLong } from "../utils/formatDate";

type DocumentHeaderProps = {
  /** Document title (e.g. "Invoice", "Quotation"). */
  title: string;
  documentNumber: string;
  date: string;
  companyName: string;
  companyAddress?: string;
  companyEmail?: string;
  companyPhone?: string;
  /** e.g. "Uniform Suppliers · Kolkata" */
  companyTagline?: string;
  /** Badge text: Paid, Draft, Unpaid. Omit to hide badge (e.g. for quotations). */
  status?: string;
};

export function DocumentHeader({
  title,
  documentNumber,
  date,
  companyName,
  companyAddress,
  companyEmail,
  companyPhone,
  companyTagline,
  status,
}: DocumentHeaderProps) {
  const statusLower = status?.toLowerCase() || "";
  let badgeStyle = docStyles.statusBadgeDraft;
  let badgeTextStyle = docStyles.statusBadgeDraftText;

  if (statusLower === "paid") {
    badgeStyle = docStyles.statusBadgePaid;
    badgeTextStyle = docStyles.statusBadgePaidText;
  } else if (statusLower === "unpaid") {
    badgeStyle = docStyles.statusBadgeUnpaid;
    badgeTextStyle = docStyles.statusBadgeUnpaidText;
  }

  return (
    <View style={docStyles.header}>
      <View style={docStyles.headerLeft}>
        <Text style={docStyles.brandName}>{companyName}</Text>
        {companyTagline && (
          <Text style={docStyles.brandTagline}>{companyTagline}</Text>
        )}
        {companyAddress ? (
          <Text style={docStyles.brandContact}>{companyAddress}</Text>
        ) : null}
        {companyPhone ? (
          <Text style={docStyles.brandContact}>Phone: {companyPhone}</Text>
        ) : null}
        {companyEmail ? (
          <Text style={docStyles.brandContact}>Email: {companyEmail}</Text>
        ) : null}
      </View>
      <View style={docStyles.headerRight}>
        <Text style={docStyles.docTitle}>{title}</Text>
        <Text style={docStyles.docNumber}>{documentNumber}</Text>
        <Text style={docStyles.docDate}>Issued: {formatDateLong(date)}</Text>
        {status != null && status !== "" && (
          <View style={badgeStyle}>
            <Text style={badgeTextStyle}>{status}</Text>
          </View>
        )}
      </View>
    </View>
  );
}
