export type CompanyUserRole = "super_admin" | "company_admin" | "hr_manager" | "employee";

export type EmployeeStatus = "active" | "on_leave" | "terminated" | "notice_period";

export type AttendanceStatus =
  | "PRESENT"
  | "HALF_DAY"
  | "LATE"
  | "EARLY_OUT"
  | "ABSENT"
  | "ON_LEAVE"
  | "HOLIDAY"
  | "WEEKEND";

export type LeaveStatus = "pending" | "approved" | "rejected" | "withdrawn";

export type CompanyUserRow = {
  company_id: string;
  user_id: string;
  role: CompanyUserRole;
};

export type DepartmentRow = {
  id: string;
  company_id: string;
  name: string;
};

export type EmployeeRow = {
  id: string;
  company_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  designation: string | null;
  department_id: string | null;
  status: EmployeeStatus;
  employment_type: string | null;
  date_of_joining: string | null;
  profile_photo_url: string | null;
  face_embedding: number[] | null;
  face_consent_given: boolean | null;
  employee_code: string | null;
  first_login: boolean;
  base_salary: number;
  hra: number;
  allowances: number;
  tds_annual_projected: number;
  professional_tax: number;
  department_name?: string | null;
};

export type AttendanceRow = {
  id: string;
  company_id: string;
  employee_id: string;
  date: string;
  status: AttendanceStatus;
  check_in: string | null;
  check_out: string | null;
  total_hours: number | null;
};

export type PayrollEntryRow = {
  id: string;
  company_id: string;
  employee_id: string;
  month: number;
  year: number;
  gross_earnings: number;
  pf_deduction: number;
  esi_deduction: number;
  tds_deduction: number;
  lop_deduction: number;
  professional_tax: number;
  other_deductions: number;
  total_deductions: number;
  net_salary: number;
  days_present: number;
  total_working_days: number;
};

// Matches public.leave_types table
export type LeaveTypeRow = {
  id: string;
  company_id: string;
  name: string;
  code: string;
  total_days: number;
  paid: boolean;
};

// Matches public.leave_balances table
export type LeaveBalanceRow = {
  id: string;
  company_id: string;
  employee_id: string;
  leave_type_id: string;
  year: number;
  total: number;
  used: number;
  pending: number;
};

// Matches public.leaves table
export type LeaveRow = {
  id: string;
  company_id: string;
  employee_id: string;
  leave_type_id: string;
  from_date: string;
  to_date: string;
  reason: string | null;
  status: LeaveStatus;
  approved_by: string | null;
  rejection_reason: string | null;
  created_at: string;
};
