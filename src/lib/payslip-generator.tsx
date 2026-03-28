'use client';

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image
} from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#000',
    paddingBottom: 10,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  companyLocation: {
    fontSize: 10,
    color: '#666',
  },
  payslipTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  payslipMonth: {
    fontSize: 10,
    color: '#666',
    textAlign: 'right',
  },
  employeeSection: {
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  employeeRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: 100,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  value: {
    flex: 1,
    fontSize: 10,
    color: '#000',
  },
  salaryTable: {
    marginBottom: 20,
    flexDirection: 'row',
  },
  column: {
    flex: 1,
    marginRight: 10,
  },
  columnTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  salaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 10,
    marginBottom: 5,
    paddingBottom: 3,
  },
  salaryLabel: {
    flex: 1,
  },
  salaryAmount: {
    width: 60,
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 8,
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: '#000',
  },
  netSalarySection: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  netSalaryLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  netSalaryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2ecc71',
  },
  netSalaryWords: {
    fontSize: 9,
    color: '#666',
    marginTop: 5,
  },
  footer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerSection: {
    flex: 1,
    fontSize: 9,
  },
  footerSignature: {
    marginTop: 30,
    borderTopWidth: 1,
    borderTopColor: '#000',
    textAlign: 'center',
  },
  currency: {
    fontFamily: 'Helvetica',
  },
});

interface PayslipData {
  employeeName: string;
  employeeId: string;
  designation: string;
  department: string;
  month: number;
  year: number;
  basic: number;
  hra: number;
  special_allowance: number;
  conveyance: number;
  medical: number;
  performance_bonus: number;
  overtime_pay: number;
  gross_salary: number;
  pf_deduction: number;
  esi_deduction: number;
  professional_tax: number;
  tds: number;
  lop_deduction: number;
  total_deductions: number;
  net_salary: number;
  total_working_days: number;
  days_present: number;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(value);
};

const numberToWords = (num: number): string => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const scales = ['', 'Thousand', 'Lakh', 'Crore'];

  const convert = (n: number): string => {
    if (n === 0) return '';
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
  };

  if (num === 0) return 'Zero';

  let words = '';
  let scaleIndex = 0;

  while (num > 0) {
    if (num % 100 !== 0) {
      words = convert(num % 100) + (scales[scaleIndex] ? ' ' + scales[scaleIndex] : '') + (words ? ' ' + words : '');
    }
    num = Math.floor(num / 100);
    scaleIndex++;
  }

  return words;
};

export const PayslipDocument: React.FC<{ data: PayslipData }> = ({ data }) => {
  const monthName = new Date(data.year, data.month - 1).toLocaleString('default', { month: 'long' });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>ASK TECH PVT LTD</Text>
            <Text style={styles.companyLocation}>New Delhi & Gurgaon</Text>
          </View>
          <View>
            <Text style={styles.payslipTitle}>PAYSLIP</Text>
            <Text style={styles.payslipMonth}>{monthName} {data.year}</Text>
          </View>
        </View>

        {/* Employee Info */}
        <View style={styles.employeeSection}>
          <View style={styles.employeeRow}>
            <Text style={styles.label}>Employee:</Text>
            <Text style={styles.value}>{data.employeeName}</Text>
          </View>
          <View style={styles.employeeRow}>
            <Text style={styles.label}>ID:</Text>
            <Text style={styles.value}>{data.employeeId}</Text>
          </View>
          <View style={styles.employeeRow}>
            <Text style={styles.label}>Designation:</Text>
            <Text style={styles.value}>{data.designation}</Text>
          </View>
          <View style={styles.employeeRow}>
            <Text style={styles.label}>Department:</Text>
            <Text style={styles.value}>{data.department}</Text>
          </View>
          <View style={styles.employeeRow}>
            <Text style={styles.label}>Days Present:</Text>
            <Text style={styles.value}>{data.days_present} / {data.total_working_days}</Text>
          </View>
        </View>

        {/* Earnings & Deductions */}
        <View style={styles.salaryTable}>
          <View style={styles.column}>
            <Text style={styles.columnTitle}>EARNINGS</Text>
            <View style={styles.salaryRow}>
              <Text style={styles.salaryLabel}>Basic</Text>
              <Text style={styles.salaryAmount}>{formatCurrency(data.basic)}</Text>
            </View>
            <View style={styles.salaryRow}>
              <Text style={styles.salaryLabel}>HRA</Text>
              <Text style={styles.salaryAmount}>{formatCurrency(data.hra)}</Text>
            </View>
            <View style={styles.salaryRow}>
              <Text style={styles.salaryLabel}>Special Allowance</Text>
              <Text style={styles.salaryAmount}>{formatCurrency(data.special_allowance)}</Text>
            </View>
            <View style={styles.salaryRow}>
              <Text style={styles.salaryLabel}>Conveyance</Text>
              <Text style={styles.salaryAmount}>{formatCurrency(data.conveyance)}</Text>
            </View>
            <View style={styles.salaryRow}>
              <Text style={styles.salaryLabel}>Medical</Text>
              <Text style={styles.salaryAmount}>{formatCurrency(data.medical)}</Text>
            </View>
            {data.performance_bonus > 0 && (
              <View style={styles.salaryRow}>
                <Text style={styles.salaryLabel}>Performance Bonus</Text>
                <Text style={styles.salaryAmount}>{formatCurrency(data.performance_bonus)}</Text>
              </View>
            )}
            {data.overtime_pay > 0 && (
              <View style={styles.salaryRow}>
                <Text style={styles.salaryLabel}>Overtime</Text>
                <Text style={styles.salaryAmount}>{formatCurrency(data.overtime_pay)}</Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={styles.salaryLabel}>Gross</Text>
              <Text style={styles.salaryAmount}>{formatCurrency(data.gross_salary)}</Text>
            </View>
          </View>

          <View style={styles.column}>
            <Text style={styles.columnTitle}>DEDUCTIONS</Text>
            <View style={styles.salaryRow}>
              <Text style={styles.salaryLabel}>PF</Text>
              <Text style={styles.salaryAmount}>{formatCurrency(data.pf_deduction)}</Text>
            </View>
            <View style={styles.salaryRow}>
              <Text style={styles.salaryLabel}>ESI</Text>
              <Text style={styles.salaryAmount}>{formatCurrency(data.esi_deduction)}</Text>
            </View>
            {data.professional_tax > 0 && (
              <View style={styles.salaryRow}>
                <Text style={styles.salaryLabel}>Prof Tax</Text>
                <Text style={styles.salaryAmount}>{formatCurrency(data.professional_tax)}</Text>
              </View>
            )}
            {data.tds > 0 && (
              <View style={styles.salaryRow}>
                <Text style={styles.salaryLabel}>TDS</Text>
                <Text style={styles.salaryAmount}>{formatCurrency(data.tds)}</Text>
              </View>
            )}
            {data.lop_deduction > 0 && (
              <View style={styles.salaryRow}>
                <Text style={styles.salaryLabel}>LOP</Text>
                <Text style={styles.salaryAmount}>{formatCurrency(data.lop_deduction)}</Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={styles.salaryLabel}>Total</Text>
              <Text style={styles.salaryAmount}>{formatCurrency(data.total_deductions)}</Text>
            </View>
          </View>
        </View>

        {/* Net Salary */}
        <View style={styles.netSalarySection}>
          <View>
            <Text style={styles.netSalaryLabel}>NET SALARY</Text>
            <Text style={styles.netSalaryWords}>
              ({numberToWords(Math.round(data.net_salary))})
            </Text>
          </View>
          <Text style={styles.netSalaryAmount}>{formatCurrency(data.net_salary)}</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerSection}>
            <Text>Authorized Signatory</Text>
            <Text style={styles.footerSignature}></Text>
            <Text>ASK Tech HR Department</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
