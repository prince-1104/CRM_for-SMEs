import { StyleSheet } from "@react-pdf/renderer";

/**
 * Design tokens matching the professional invoice HTML:
 * --ink #1a0933, --paper #fdfbff, --cream #f0ebfa, --accent #9b59f5,
 * --accent-lt #c4a0fb, --muted #7a6a95, --border #d8ccf0, --row-even #f5f1fd
 */
const colors = {
  brandDark: "#2e1065",       // Deep Royal Purple
  brandMedium: "#6d28d9",     // Violet 700
  brandLight: "#d8b4fe",      // Violet 300
  brandSuperLight: "#f5f3ff", // Violet 50 (soft background)
  ink: "#0f172a",             // Slate 900
  muted: "#475569",           // Slate 600
  lightMuted: "#64748b",      // Slate 500
  border: "#cbd5e1",          // Slate 300
  borderLight: "#e2e8f0",     // Slate 200
  white: "#ffffff",
  whiteOpacity70: "rgba(255,255,255,0.7)",
  whiteOpacity50: "rgba(255,255,255,0.5)",
};

export const docStyles = StyleSheet.create({
  page: {
    padding: 0,
    fontSize: 9,
    fontFamily: "Helvetica",
    lineHeight: 1.35,
    color: colors.ink,
    backgroundColor: colors.white,
  },

  // Decorator line at the top of the A4 page
  topBar: {
    height: 4,
    backgroundColor: colors.brandMedium,
  },

  // —— Header (Premium, Rich Purple Banner) ——
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    backgroundColor: colors.brandDark,
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 32,
  },
  headerLeft: { flex: 1 },
  brandName: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.white,
    marginBottom: 4,
  },
  brandTagline: {
    fontSize: 8,
    color: colors.brandLight,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 6,
    fontWeight: "bold",
  },
  brandContact: {
    fontSize: 9,
    color: colors.whiteOpacity70,
    lineHeight: 1.4,
  },
  headerRight: { alignItems: "flex-end" },
  docTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.white,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  docNumber: {
    fontSize: 10,
    color: colors.brandLight,
    letterSpacing: 1,
    fontWeight: "bold",
    marginBottom: 3,
  },
  docDate: {
    fontSize: 9,
    color: colors.whiteOpacity50,
    marginBottom: 6,
  },

  // Status Badges (Clean pills)
  statusBadgePaid: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#a7f3d0", // Green 200
    backgroundColor: "#ecfdf5", // Green 50
  },
  statusBadgePaidText: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#059669", // Green 600
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  statusBadgeUnpaid: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#fecaca", // Red 200
    backgroundColor: "#fef2f2", // Red 50
  },
  statusBadgeUnpaidText: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#dc2626", // Red 600
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  statusBadgeDraft: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0", // Slate 200
    backgroundColor: "#f8fafc", // Slate 50
  },
  statusBadgeDraftText: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#475569", // Slate 600
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  accentRule: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginHorizontal: 32,
  },

  // —— Content wrapper ——
  content: {
    paddingHorizontal: 32,
    paddingTop: 16,
    paddingBottom: 48, // space for fixed footer
  },

  // —— Billed To ——
  billedToSection: {
    paddingHorizontal: 32,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  partyLabel: {
    fontSize: 8,
    fontWeight: "bold",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.lightMuted,
    marginBottom: 6,
  },
  partyName: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.brandDark, // Highlight client name in brand color
    marginBottom: 4,
  },
  partyDetail: {
    fontSize: 9,
    color: colors.muted,
    lineHeight: 1.4,
  },

  // —— Items table (Premium colorful) ——
  table: { marginTop: 16, marginBottom: 16 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.brandMedium, // Solid brand color header
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 0,
  },
  tableHeaderText: {
    fontSize: 8,
    fontWeight: "bold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: colors.white, // Crisp white text on dark background
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  tableRowAlt: { backgroundColor: colors.brandSuperLight }, // Zebra stripes in brand background tint
  colNum: { width: "8%", textAlign: "center" },
  colItem: { width: "32%" },
  colQty: { width: "12%", textAlign: "center" },
  colUnitRate: { width: "16%", textAlign: "right" },
  colGst: { width: "12%", textAlign: "right" },
  colAmount: { width: "20%", textAlign: "right" },
  
  // Quotation: 3 columns only
  colQuotNum: { width: "12%", textAlign: "center" },
  colQuotDesc: { width: "68%" },
  colQuotPrice: { width: "20%", textAlign: "right" },
  right: { textAlign: "right" as const },
  center: { textAlign: "center" as const },
  cellMuted: { color: colors.lightMuted, fontSize: 9 },
  cellBold: { fontWeight: "bold", color: colors.ink },

  // —— Totals ——
  totalsSection: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 16,
  },
  totalsBox: { width: 240 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    borderStyle: "dashed",
    fontSize: 9,
    color: colors.muted,
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 6,
    borderRadius: 4,
    backgroundColor: colors.brandDark, // Deep brand color block
    fontSize: 11,
    fontWeight: "bold",
    color: colors.white,
  },
  grandTotalLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: colors.white,
  },
  grandTotalValue: {
    fontSize: 13,
    fontWeight: "bold",
    color: colors.white,
  },

  // —— Amount in words ——
  wordsBlock: {
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.brandSuperLight,
    borderLeftWidth: 3,
    borderLeftColor: colors.brandMedium,
    borderRadius: 2,
    fontSize: 9,
    color: colors.brandDark,
  },
  wordsBlockStrong: {
    fontWeight: "bold",
    color: colors.brandMedium,
  },

  // —— Notes & Terms ——
  notesTerms: { marginBottom: 16, fontSize: 8.5, color: colors.muted },
  notesTermsLabel: { fontWeight: "bold", color: colors.brandDark, marginBottom: 3 },

  // —— Footer (Fixed at bottom) ——
  footer: {
    position: "absolute",
    bottom: 24,
    left: 32,
    right: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  footerNote: { fontSize: 8, color: colors.lightMuted },
  footerBrand: { fontSize: 9, fontWeight: "bold", color: colors.brandMedium },
  pageNumber: {
    fontSize: 8,
    color: colors.lightMuted,
  },

  validity: { fontSize: 9, color: colors.muted, marginBottom: 8 },
});
