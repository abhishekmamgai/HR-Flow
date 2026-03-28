import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 10 },
  header: { marginBottom: 20, borderBottomWidth: 1, borderBottomColor: "#eee", paddingBottom: 10 },
  title: { fontSize: 20, fontWeight: "bold", color: "#1a1a1a" },
  subtitle: { fontSize: 12, color: "#666", marginTop: 4 },
  section: { marginVertical: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  label: { color: "#666" },
  value: { fontWeight: "bold" },
  totalRow: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#eee", flexDirection: "row", justifyContent: "space-between" },
  netSalary: { fontSize: 16, fontWeight: "bold", color: "#10b981" },
});

type Props = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  entry: any;
  companyName: string;
};

export function PayslipPDF({ entry, companyName }: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{companyName}</Text>
          <Text style={styles.subtitle}>Payslip for {entry.month}/{entry.year}</Text>
        </View>

        <View style={styles.section}>
          <Text style={{ fontSize: 14, fontWeight: "bold", marginBottom: 10 }}>Employee Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{entry.employees?.first_name} {entry.employees?.last_name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Employee Code:</Text>
            <Text style={styles.value}>{entry.employees?.employee_code}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ fontSize: 14, fontWeight: "bold", marginBottom: 10 }}>Earnings</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Gross Earnings:</Text>
            <Text style={styles.value}>{entry.gross_earnings.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ fontSize: 14, fontWeight: "bold", marginBottom: 10 }}>Deductions</Text>
          <View style={styles.row}>
            <Text style={styles.label}>PF:</Text>
            <Text style={styles.value}>{entry.pf_deduction.toLocaleString()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>ESI:</Text>
            <Text style={styles.value}>{entry.esi_deduction.toLocaleString()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>TDS:</Text>
            <Text style={styles.value}>{entry.tds_deduction.toLocaleString()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>LOP:</Text>
            <Text style={styles.value}>{entry.lop_deduction.toLocaleString()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Professional Tax:</Text>
            <Text style={styles.value}>{entry.professional_tax.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.totalRow}>
          <Text style={{ fontSize: 14, fontWeight: "bold" }}>Net Salary</Text>
          <Text style={styles.netSalary}>INR {entry.net_salary.toLocaleString()}</Text>
        </View>
      </Page>
    </Document>
  );
}
