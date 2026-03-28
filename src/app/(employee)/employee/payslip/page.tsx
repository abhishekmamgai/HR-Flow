'use client';

import { useEffect, useState } from 'react';
import { formatCurrencyInr } from '@/lib/format';
import { PayslipDocument } from '@/lib/payslip-generator';
import { PDFDownloadLink } from '@react-pdf/renderer';

interface PayslipEntry {
  id: string;
  month: number;
  year: number;
  gross_salary: number;
  net_salary: number;
  basic: number;
  hra: number;
  special_allowance: number;
  conveyance: number;
  medical: number;
  performance_bonus: number;
  overtime_pay: number;
  pf_deduction: number;
  esi_deduction: number;
  professional_tax: number;
  tds: number;
  lop_deduction: number;
  total_deductions: number;
  days_present: number;
  total_working_days: number;
}

interface EmployeeData {
  id: string;
  first_name: string;
  last_name: string;
  designation: string | null;
  email: string;
  departments?: { name: string };
}

export default function PayslipPage() {
  const [payslips, setPayslips] = useState<PayslipEntry[]>([]);
  const [selectedPayslip, setSelectedPayslip] = useState<PayslipEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);

  const fetchPayslips = async () => {
    try {
      setLoading(true);
      
      // First, get current employee data
      const empRes = await fetch('/api/employee/profile');
      const empData = await empRes.json();
      setEmployeeData(empData);

      // Then fetch payslips
      const res = await fetch(`/api/payroll/employee/${empData.id}`);
      const data = await res.json();
      
      if (res.ok) {
        // Sort payslips by year and month descending
        const sorted = (data.payslips || []).sort((a: PayslipEntry, b: PayslipEntry) => {
          if (b.year !== a.year) return b.year - a.year;
          return b.month - a.month;
        });
        setPayslips(sorted);
        if (sorted.length > 0) {
          setSelectedPayslip(sorted[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching payslips:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayslips();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading payslips...</div>;
  }

  if (!employeeData) {
    return <div className="flex items-center justify-center h-96">Unable to load employee data</div>;
  }

  if (payslips.length === 0) {
    return (
      <div className="space-y-8">
        <header>
          <h1 className="font-display text-4xl font-bold text-slate-800">Payslips</h1>
          <p className="text-slate-500 font-medium">Your salary statements and documents</p>
        </header>
        <div className="surface-card p-12 text-center rounded-xl">
          <p className="text-slate-500">No payslips available yet</p>
        </div>
      </div>
    );
  }

  const payslipData = selectedPayslip ? {
    employeeName: `${employeeData.first_name} ${employeeData.last_name}`,
    employeeId: employeeData.id?.slice(0, 8) || '',
    designation: employeeData.designation || '',
    department: employeeData.departments?.name || '',
    month: selectedPayslip.month,
    year: selectedPayslip.year,
    basic: selectedPayslip.basic,
    hra: selectedPayslip.hra,
    special_allowance: selectedPayslip.special_allowance,
    conveyance: selectedPayslip.conveyance,
    medical: selectedPayslip.medical,
    performance_bonus: selectedPayslip.performance_bonus,
    overtime_pay: selectedPayslip.overtime_pay,
    gross_salary: selectedPayslip.gross_salary,
    pf_deduction: selectedPayslip.pf_deduction,
    esi_deduction: selectedPayslip.esi_deduction,
    professional_tax: selectedPayslip.professional_tax,
    tds: selectedPayslip.tds,
    lop_deduction: selectedPayslip.lop_deduction,
    total_deductions: selectedPayslip.total_deductions,
    net_salary: selectedPayslip.net_salary,
    total_working_days: selectedPayslip.total_working_days,
    days_present: selectedPayslip.days_present,
  } : null;

  const monthName = selectedPayslip 
    ? new Date(selectedPayslip.year, selectedPayslip.month - 1).toLocaleString('default', { month: 'long' })
    : '';

  return (
    <div className="space-y-8">
      {/* Header */}
      <header>
        <h1 className="font-display text-4xl font-bold text-slate-800">Payslips</h1>
        <p className="text-slate-500 font-medium">Your salary statements and documents</p>
      </header>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payslip List */}
        <div className="lg:col-span-1">
          <div className="surface-card rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Recent Payslips</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {payslips.map((payslip) => {
                const monthName = new Date(payslip.year, payslip.month - 1).toLocaleString('default', { month: 'long' });
                const isSelected = selectedPayslip?.id === payslip.id;
                return (
                  <button
                    key={payslip.id}
                    onClick={() => setSelectedPayslip(payslip)}
                    className={`w-full p-4 text-left transition-colors ${
                      isSelected
                        ? 'bg-blue-50 border-l-4 border-l-blue-600'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <p className="font-bold text-slate-800">{monthName} {payslip.year}</p>
                    <p className="text-sm text-slate-600">Net: {formatCurrencyInr(payslip.net_salary)}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Payslip Details */}
        <div className="lg:col-span-2 space-y-4">
          {selectedPayslip && payslipData && (
            <>
              {/* Download Button */}
              <div className="surface-card rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800">{monthName} {selectedPayslip.year}</h3>
                    <p className="text-sm text-slate-600">Payslip for {monthName} {selectedPayslip.year}</p>
                  </div>
                  <PDFDownloadLink
                    document={<PayslipDocument data={payslipData} />}
                    fileName={`Payslip_${employeeData.first_name}_${monthName}_${selectedPayslip.year}.pdf`}
                  >
                    {({ blob, url, loading: pdfLoading, error }) => (
                      <button
                        disabled={pdfLoading}
                        className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        {pdfLoading ? 'Generating...' : '📥 Download PDF'}
                      </button>
                    )}
                  </PDFDownloadLink>
                </div>
              </div>

              {/* Earnings Table */}
              <div className="surface-card rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800">Earnings</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  <div className="px-6 py-3 flex justify-between">
                    <span className="text-slate-600">Basic Salary</span>
                    <span className="font-semibold">{formatCurrencyInr(selectedPayslip.basic)}</span>
                  </div>
                  <div className="px-6 py-3 flex justify-between">
                    <span className="text-slate-600">HRA</span>
                    <span className="font-semibold">{formatCurrencyInr(selectedPayslip.hra)}</span>
                  </div>
                  <div className="px-6 py-3 flex justify-between">
                    <span className="text-slate-600">Special Allowance</span>
                    <span className="font-semibold">{formatCurrencyInr(selectedPayslip.special_allowance)}</span>
                  </div>
                  <div className="px-6 py-3 flex justify-between">
                    <span className="text-slate-600">Conveyance</span>
                    <span className="font-semibold">{formatCurrencyInr(selectedPayslip.conveyance)}</span>
                  </div>
                  <div className="px-6 py-3 flex justify-between">
                    <span className="text-slate-600">Medical</span>
                    <span className="font-semibold">{formatCurrencyInr(selectedPayslip.medical)}</span>
                  </div>
                  {selectedPayslip.performance_bonus > 0 && (
                    <div className="px-6 py-3 flex justify-between">
                      <span className="text-slate-600">Performance Bonus</span>
                      <span className="font-semibold">{formatCurrencyInr(selectedPayslip.performance_bonus)}</span>
                    </div>
                  )}
                  {selectedPayslip.overtime_pay > 0 && (
                    <div className="px-6 py-3 flex justify-between">
                      <span className="text-slate-600">Overtime</span>
                      <span className="font-semibold">{formatCurrencyInr(selectedPayslip.overtime_pay)}</span>
                    </div>
                  )}
                  <div className="px-6 py-3 flex justify-between bg-slate-50 font-bold">
                    <span>Gross Salary</span>
                    <span className="text-green-600">{formatCurrencyInr(selectedPayslip.gross_salary)}</span>
                  </div>
                </div>
              </div>

              {/* Deductions Table */}
              <div className="surface-card rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800">Deductions</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  <div className="px-6 py-3 flex justify-between">
                    <span className="text-slate-600">Provident Fund (PF)</span>
                    <span className="font-semibold text-red-600">{formatCurrencyInr(selectedPayslip.pf_deduction)}</span>
                  </div>
                  {selectedPayslip.esi_deduction > 0 && (
                    <div className="px-6 py-3 flex justify-between">
                      <span className="text-slate-600">ESI</span>
                      <span className="font-semibold text-red-600">{formatCurrencyInr(selectedPayslip.esi_deduction)}</span>
                    </div>
                  )}
                  {selectedPayslip.professional_tax > 0 && (
                    <div className="px-6 py-3 flex justify-between">
                      <span className="text-slate-600">Professional Tax</span>
                      <span className="font-semibold text-red-600">{formatCurrencyInr(selectedPayslip.professional_tax)}</span>
                    </div>
                  )}
                  {selectedPayslip.tds > 0 && (
                    <div className="px-6 py-3 flex justify-between">
                      <span className="text-slate-600">TDS</span>
                      <span className="font-semibold text-red-600">{formatCurrencyInr(selectedPayslip.tds)}</span>
                    </div>
                  )}
                  {selectedPayslip.lop_deduction > 0 && (
                    <div className="px-6 py-3 flex justify-between">
                      <span className="text-slate-600">Loss of Pay (LOP)</span>
                      <span className="font-semibold text-red-600">{formatCurrencyInr(selectedPayslip.lop_deduction)}</span>
                    </div>
                  )}
                  <div className="px-6 py-3 flex justify-between bg-slate-50 font-bold">
                    <span>Total Deductions</span>
                    <span className="text-red-600">{formatCurrencyInr(selectedPayslip.total_deductions)}</span>
                  </div>
                </div>
              </div>

              {/* Net Salary */}
              <div className="surface-card rounded-xl p-6 bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-300">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-slate-700 font-medium">Net Salary (Take Home)</p>
                    <p className="text-xs text-slate-600 mt-1">Days Present: {selectedPayslip.days_present}/{selectedPayslip.total_working_days}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-green-700">{formatCurrencyInr(selectedPayslip.net_salary)}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
