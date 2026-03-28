export interface SalaryInput {
  monthly_salary: number;
  total_working_days: number;
  days_present: number;
  days_absent: number;
  lop_days: number;
  performance_bonus?: number;
  overtime_hours?: number;
  state?: string;
}

export interface SalaryBreakdown {
  // Earnings
  basic: number;
  hra: number;
  special_allowance: number;
  conveyance: number;
  medical: number;
  performance_bonus: number;
  overtime_pay: number;
  gross_salary: number;
  // Deductions
  pf_employee: number;
  esi: number;
  professional_tax: number;
  tds: number;
  lop_deduction: number;
  total_deductions: number;
  // Final
  net_salary: number;
  // Meta
  per_day_salary: number;
  effective_days: number;
}

export function calculateSalary(input: SalaryInput): SalaryBreakdown {
  const {
    monthly_salary,
    total_working_days,
    days_present,
    lop_days,
    performance_bonus = 0,
    overtime_hours = 0,
    state = 'delhi'
  } = input;

  // Step 1: Per day salary
  const per_day = monthly_salary / total_working_days;

  // Step 2: LOP deduction
  const lop_deduction = Math.round(per_day * lop_days);

  // Step 3: Salary components
  const basic = Math.round(monthly_salary * 0.40);
  const hra = Math.round(basic * 0.50);
  const conveyance = 1600;
  const medical = 1250;
  const special_allowance = Math.round(
    monthly_salary - basic - hra - conveyance - medical
  );

  // Step 4: Variable earnings
  const overtime_pay = Math.round(
    overtime_hours * (basic / 240) * 2
  );

  // Step 5: Gross
  const gross_salary = Math.round(
    basic + hra + special_allowance + 
    conveyance + medical + 
    performance_bonus + overtime_pay
  );

  // Step 6: Deductions
  const pf_employee = Math.min(Math.round(basic * 0.12), 1800);
  const esi = gross_salary <= 21000 
    ? Math.round(gross_salary * 0.0075) 
    : 0;
  
  const prof_tax_map: Record<string, number> = {
    maharashtra: 200,
    karnataka: 200,
    delhi: 0,
    gujarat: 200,
    default: 0
  };
  const professional_tax = 
    prof_tax_map[state.toLowerCase()] ?? 0;

  const tds = 0; // Simplified, add later
  
  const total_deductions = Math.round(
    pf_employee + esi + professional_tax + 
    tds + lop_deduction
  );

  // Step 7: Net salary
  const net_salary = gross_salary - total_deductions;

  return {
    basic,
    hra,
    special_allowance,
    conveyance,
    medical,
    performance_bonus,
    overtime_pay,
    gross_salary,
    pf_employee,
    esi,
    professional_tax,
    tds,
    lop_deduction,
    total_deductions,
    net_salary,
    per_day_salary: Math.round(per_day),
    effective_days: days_present
  };
}
