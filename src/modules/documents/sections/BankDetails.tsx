import React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";
import type { BankDetails as BankDetailsType } from "../types";

// ─── Colour tokens (Premium Theme) ─────────────────────────────────────────────
const BOX_BG = "#faf5ff"; // Violet 50/100 light
const BORDER_COLOR = "#e9d5ff"; // Violet 200
const LEFT_BORDER_COLOR = "#7c3aed"; // Violet 600
const TEXT_DARK = "#0f172a"; // Slate 900
const LABEL_COLOR = "#64748b"; // Slate 500
const DIVIDER_COLOR = "#e9d5ff"; // Violet 200
const VALUE_HIGHLIGHT = "#7c3aed"; // Violet 600

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  paymentSection: {
    marginTop: 16,
    marginBottom: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: BOX_BG,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderLeftWidth: 3,
    borderLeftColor: LEFT_BORDER_COLOR,
    borderRadius: 6,
  },

  paymentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  paymentIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: LEFT_BORDER_COLOR,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  paymentIconText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#ffffff",
  },

  paymentHeaderText: {
    flexDirection: "column",
  },
  paymentTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: VALUE_HIGHLIGHT,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  paymentSubtitle: {
    fontSize: 8,
    color: LABEL_COLOR,
    marginTop: 2,
  },

  paymentDivider: {
    width: "100%",
    height: 1,
    backgroundColor: DIVIDER_COLOR,
    marginTop: 6,
    marginBottom: 8,
  },

  paymentGridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  paymentColumn: {
    width: "48%",
    flexDirection: "column",
  },
  paymentFieldBlock: {
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 7,
    fontWeight: "bold",
    color: LABEL_COLOR,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  paymentValue: {
    fontSize: 9.5,
    fontWeight: "bold",
    color: TEXT_DARK,
  },
  paymentValueHighlight: {
    fontSize: 9.5,
    fontWeight: "bold",
    color: VALUE_HIGHLIGHT,
  },
});

type BankDetailsProps = {
  bank: BankDetailsType;
};

export function BankDetails({ bank }: BankDetailsProps) {
  const isRawOnly = bank.rawText && !bank.bankName && !bank.accountName;

  return (
    <View style={styles.paymentSection} wrap={false}>
      <View style={styles.paymentHeader}>
        <View style={styles.paymentIcon}>
          <Text style={styles.paymentIconText}>₹</Text>
        </View>
        <View style={styles.paymentHeaderText}>
          <Text style={styles.paymentTitle}>PAYMENT INFORMATION</Text>
          <Text style={styles.paymentSubtitle}>Bank Transfer or UPI accepted</Text>
        </View>
      </View>

      <View style={styles.paymentDivider} />

      {isRawOnly ? (
        <View style={styles.paymentFieldBlock}>
          <Text style={styles.paymentLabel}>PAYMENT DETAILS</Text>
          <Text style={styles.paymentValue}>{bank.rawText}</Text>
        </View>
      ) : (
        <View style={styles.paymentGridRow}>
          <View style={styles.paymentColumn}>
            <View style={styles.paymentFieldBlock}>
              <Text style={styles.paymentLabel}>ACCOUNT NAME</Text>
              <Text style={styles.paymentValue}>{bank.accountName || "—"}</Text>
            </View>
            <View style={styles.paymentFieldBlock}>
              <Text style={styles.paymentLabel}>ACCOUNT NUMBER</Text>
              <Text style={styles.paymentValueHighlight}>{bank.accountNumber || "—"}</Text>
            </View>
            <View style={styles.paymentFieldBlock}>
              <Text style={styles.paymentLabel}>ACCOUNT TYPE</Text>
              <Text style={styles.paymentValue}>{bank.accountType || "—"}</Text>
            </View>
          </View>

          <View style={styles.paymentColumn}>
            <View style={styles.paymentFieldBlock}>
              <Text style={styles.paymentLabel}>BANK</Text>
              <Text style={styles.paymentValue}>{bank.bankName || "—"}</Text>
            </View>
            <View style={styles.paymentFieldBlock}>
              <Text style={styles.paymentLabel}>IFSC CODE</Text>
              <Text style={styles.paymentValueHighlight}>{bank.ifsc || "—"}</Text>
            </View>
            <View style={styles.paymentFieldBlock}>
              <Text style={styles.paymentLabel}>UPI ID</Text>
              <Text style={styles.paymentValueHighlight}>{bank.upiId || "—"}</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
