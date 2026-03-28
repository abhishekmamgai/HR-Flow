"use client";

import { useState } from "react";
import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 10, color: "#1e293b", backgroundColor: "#ffffff" },

  // Header
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, paddingBottom: 16, borderBottomWidth: 2, borderBottomColor: "#2563eb" },
  companyName: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#1e293b", letterSpacing: 1 },
  companyMeta: { fontSize: 9, color: "#64748b", marginTop: 3 },
  payslipBadge: { backgroundColor: "#2563eb", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 },
  payslipBadgeText: { color: "#ffffff", fontSize: 11, fontFamily: "Helvetica-Bold", letterSpacing: 1 },
  payslipPeriod: { fontSize: 9, color: "#94a3b8", marginTop: 4, textAlign: "right" },

  // Employee Info Grid
  infoGrid: { flexDirection: "row", gap: 0, marginBottom: 20, backgroundColor: "#f8fafc", padding: 14, borderRadius: 6 },
  infoCol: { flex: 1 },
  infoRow: { marginBottom: 8 },
  infoLabel: { fontSize: 8, color: "#94a3b8", fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 0.5 },
  infoValue: { fontSize: 10, color: "#1e293b", fontFamily: "Helvetica-Bold", marginTop: 2 },

  // Table
  tableHeader: { flexDirection: "row", backgroundColor: "#1e293b", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 4, marginBottom: 2 },
  tableHeaderCell: { color: "#94a3b8", fontSize: 8, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 0.5 },
  tableRow: { flexDirection: "row", paddingVertical: 7, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  tableRowAlt: { backgroundColor: "#f8fafc" },
  tableCell: { fontSize: 10, color: "#334155" },
  tableCellBold: { fontSize: 10, color: "#1e293b", fontFamily: "Helvetica-Bold" },
  col1: { flex: 2 },
  col2: { flex: 1, textAlign: "right" },

  // Section Title
  sectionTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, marginTop: 16 },

  // Net Salary Box
  netBox: { backgroundColor: "#eff6ff", borderWidth: 1, borderColor: "#bfdbfe", borderRadius: 8, padding: 16, marginTop: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  netLabel: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#1d4ed8" },
  netAmount: { fontSize: 20, fontFamily: "Helvetica-Bold", color: "#1d4ed8" },
  netWords: { fontSize: 8, color: "#3b82f6", marginTop: 3 },

  // Footer
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#e2e8f0", paddingTop: 10 },
  footerText: { fontSize: 8, color: "#94a3b8" },
  footerBold: { fontSize: 8, color: "#64748b", fontFamily: "Helvetica-Bold" },

  // Status
  lockedBadge: { backgroundColor: "#dcfce7", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, marginTop: 8, alignSelf: "flex-start" },
  lockedText: { color: "#15803d", fontSize: 8, fontFamily: "Helvetica-Bold" },
});

// ─── Number to Words (Indian system) ─────────────────────────────────────────
function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero';
  if (num < 0) return 'Negative ' + numberToWords(-num);

  let words = '';
  if (num >= 10000000) { words += numberToWords(Math.floor(num / 10000000)) + ' Crore '; num %= 10000000; }
  if (num >= 100000) { words += numberToWords(Math.floor(num / 100000)) + ' Lakh '; num %= 100000; }
  if (num >= 1000) { words += numberToWords(Math.floor(num / 1000)) + ' Thousand '; num %= 1000; }
  if (num >= 100) { words += ones[Math.floor(num / 100)] + ' Hundred '; num %= 100; }
  if (num >= 20) { words += tens[Math.floor(num / 10)] + ' '; num %= 10; }
  if (num > 0) words += ones[num] + ' ';

  return words.trim();
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

// ─── PDF Document ─────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PayslipDoc = ({ entry }: { entry: any }) => {
  const monthName = new Date(entry.year, entry.month - 1).toLocaleString('default', { month: 'long' });
  const attendance = Math.round((entry.days_present / entry.total_working_days) * 100);

  const earnings = [
    { label: "Basic Salary", amount: Number(entry.gross_earnings) * 0.40 },
    { label: "House Rent Allowance (HRA)", amount: Number(entry.gross_earnings) * 0.20 },
    { label: "Special Allowance", amount: Number(entry.gross_earnings) * 0.40 },
  ];

  const deductions = [
    { label: "Provident Fund (PF @ 12%)", amount: Number(entry.pf_deduction) },
    { label: "ESI (Employee @ 0.75%)", amount: Number(entry.esi_deduction) },
    { label: "Professional Tax", amount: Number(entry.professional_tax) },
    { label: "TDS (Income Tax)", amount: Number(entry.tds_deduction) },
    { label: "Loss of Pay (LOP)", amount: Number(entry.lop_deduction) },
  ].filter(d => d.amount > 0);

  return (
    <Document>
      <Page size="A4" style={S.page}>
        {/* ── Header ── */}
        <View style={S.header}>
          <View>
            <Text style={S.companyName}>ASK TECH PVT LTD</Text>
            <Text style={S.companyMeta}>New Delhi & Gurgaon, India</Text>
            <Text style={S.companyMeta}>CIN: XXXXXXXXXXXXXXX | GST: XXXXXXXXXXXXXXXXX</Text>
            <View style={S.lockedBadge}>
              <Text style={S.lockedText}>✓ OFFICIAL PAYSLIP</Text>
            </View>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <View style={S.payslipBadge}>
              <Text style={S.payslipBadgeText}>PAYSLIP</Text>
            </View>
            <Text style={S.payslipPeriod}>{monthName} {entry.year}</Text>
          </View>
        </View>

        {/* ── Employee Info ── */}
        <View style={S.infoGrid}>
          <View style={S.infoCol}>
            <View style={S.infoRow}>
              <Text style={S.infoLabel}>Employee Name</Text>
              <Text style={S.infoValue}>{entry.employees?.first_name} {entry.employees?.last_name}</Text>
            </View>
            <View style={S.infoRow}>
              <Text style={S.infoLabel}>Designation</Text>
              <Text style={S.infoValue}>{entry.employees?.designation || "—"}</Text>
            </View>
            <View style={S.infoRow}>
              <Text style={S.infoLabel}>Department</Text>
              <Text style={S.infoValue}>{entry.employees?.departments?.name || "—"}</Text>
            </View>
          </View>
          <View style={S.infoCol}>
            <View style={S.infoRow}>
              <Text style={S.infoLabel}>Pay Period</Text>
              <Text style={S.infoValue}>{monthName} {entry.year}</Text>
            </View>
            <View style={S.infoRow}>
              <Text style={S.infoLabel}>Working Days</Text>
              <Text style={S.infoValue}>{entry.total_working_days} days</Text>
            </View>
            <View style={S.infoRow}>
              <Text style={S.infoLabel}>Days Present</Text>
              <Text style={S.infoValue}>{entry.days_present} days ({attendance}% attendance)</Text>
            </View>
          </View>
        </View>

        {/* ── Earnings ── */}
        <Text style={S.sectionTitle}>Earnings</Text>
        <View style={S.tableHeader}>
          <Text style={[S.tableHeaderCell, S.col1]}>Component</Text>
          <Text style={[S.tableHeaderCell, S.col2]}>Amount (₹)</Text>
        </View>
        {earnings.map((row, i) => (
          <View key={i} style={[S.tableRow, i % 2 === 1 ? S.tableRowAlt : {}]}>
            <Text style={[S.tableCell, S.col1]}>{row.label}</Text>
            <Text style={[S.tableCell, S.col2]}>{fmt(row.amount)}</Text>
          </View>
        ))}
        <View style={[S.tableRow, { backgroundColor: "#dbeafe" }]}>
          <Text style={[S.tableCellBold, S.col1]}>Gross Earnings</Text>
          <Text style={[S.tableCellBold, S.col2]}>₹ {fmt(Number(entry.gross_earnings))}</Text>
        </View>

        {/* ── Deductions ── */}
        <Text style={S.sectionTitle}>Deductions</Text>
        <View style={S.tableHeader}>
          <Text style={[S.tableHeaderCell, S.col1]}>Component</Text>
          <Text style={[S.tableHeaderCell, S.col2]}>Amount (₹)</Text>
        </View>
        {deductions.length === 0 ? (
          <View style={S.tableRow}><Text style={S.tableCell}>No deductions this month</Text></View>
        ) : deductions.map((row, i) => (
          <View key={i} style={[S.tableRow, i % 2 === 1 ? S.tableRowAlt : {}]}>
            <Text style={[S.tableCell, S.col1]}>{row.label}</Text>
            <Text style={[S.tableCell, S.col2]}>{fmt(row.amount)}</Text>
          </View>
        ))}
        <View style={[S.tableRow, { backgroundColor: "#fee2e2" }]}>
          <Text style={[S.tableCellBold, S.col1]}>Total Deductions</Text>
          <Text style={[S.tableCellBold, S.col2]}>₹ {fmt(Number(entry.total_deductions))}</Text>
        </View>

        {/* ── Net Salary ── */}
        <View style={S.netBox}>
          <View>
            <Text style={S.netLabel}>NET SALARY PAYABLE</Text>
            <Text style={S.netWords}>Rupees {numberToWords(Math.round(Number(entry.net_salary)))} Only</Text>
          </View>
          <Text style={S.netAmount}>₹ {fmt(Number(entry.net_salary))}</Text>
        </View>

        {/* ── Footer ── */}
        <View style={S.footer}>
          <View>
            <Text style={S.footerBold}>ASK Tech HR Department</Text>
            <Text style={S.footerText}>This is a computer-generated payslip and does not require a signature.</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={S.footerBold}>Generated: {new Date().toLocaleDateString('en-IN')}</Text>
            <Text style={S.footerText}>Confidential — For Employee Use Only</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

// ─── Button Component ─────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DownloadPayslipButton({ entry }: { entry: any }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setLoading(true);
      const blob = await pdf(<PayslipDoc entry={entry} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Payslip_${entry.employees?.first_name}_${entry.employees?.last_name}_${entry.month}_${entry.year}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to generate PDF: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:bg-blue-50 rounded-lg disabled:opacity-40 transition-colors border border-blue-200"
    >
      {loading ? (
        <><span className="w-3 h-3 border border-blue-300 border-t-blue-600 rounded-full animate-spin" /> Generating...</>
      ) : (
        <><span>📄</span> PDF</>
      )}
    </button>
  );
}
