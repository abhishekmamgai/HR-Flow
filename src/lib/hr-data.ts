import { createClient } from "@/lib/supabase/server";
import { getCompanyContext } from "@/lib/auth/company-context";
import type {
  AttendanceRow,
  DepartmentRow,
  EmployeeRow,
  LeaveBalanceRow,
  LeaveRow,
  LeaveTypeRow,
  PayrollEntryRow,
} from "@/lib/db/types";

export async function getDepartments() {
  const supabase = await createClient();
  const { companyId } = await getCompanyContext();

  const { data, error } = await supabase
    .from("departments")
    .select("id, company_id, name")
    .eq("company_id", companyId)
    .order("name", { ascending: true })
    .returns<DepartmentRow[]>();

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getEmployees(search?: string) {
  const supabase = await createClient();
  const { companyId } = await getCompanyContext();

  let query = supabase
    .from("employees")
    .select("*, departments(name)")
    .eq("company_id", companyId)
    .order("first_name", { ascending: true });

  if (search?.trim()) {
    const t = search.trim().replace(/[%_]/g, "");
    const term = `%${t}%`;
    query = query.or(`first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term}`);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  return (data ?? []).map((e) => {
    const row = e as { departments?: { name: string } | { name: string }[] | null };
    const depName = Array.isArray(row.departments) ? row.departments[0]?.name : row.departments?.name;
    const out = { ...e, department_name: depName ?? null };
    delete (out as Record<string, unknown>).departments;
    return out as EmployeeRow & { department_name: string | null };
  });
}

export async function getEmployeeById(id: string) {
  const supabase = await createClient();
  const { companyId } = await getCompanyContext();

  const { data, error } = await supabase
    .from("employees")
    .select("*, departments(name), employee_credentials(temp_password, is_password_changed)")
    .eq("company_id", companyId)
    .eq("id", id)
    .single();

  if (error || !data) throw new Error(error?.message ?? "Employee not found");

  const dep = data as { departments?: { name: string } | { name: string }[] | null };
  const depName = Array.isArray(dep.departments) ? dep.departments[0]?.name : dep.departments?.name;

  return {
    ...data,
    department_name: depName ?? null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

export async function getAttendanceForDate(date: string) {
  const supabase = await createClient();
  const { companyId } = await getCompanyContext();

  const { data, error } = await supabase
    .from("attendance")
    .select("id, company_id, employee_id, date, status, check_in, check_out, total_hours, is_face_verified, employees!fk_attendance_employee(first_name, last_name)")
    .eq("company_id", companyId)
    .eq("date", date)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .returns<any[]>();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getLatestPayrollEntries(limit = 10) {
  const supabase = await createClient();
  const { companyId } = await getCompanyContext();

  const { data, error } = await supabase
    .from("payroll_entries")
    .select("id, company_id, employee_id, month, year, net_salary, gross_earnings, total_deductions, employees!fk_payroll_employee(first_name, last_name, designation)")
    .eq("company_id", companyId)
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .limit(limit)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .returns<any[]>();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getAttendanceForEmployeeMonth(employeeId: string, year: number, month: number) {
  const supabase = await createClient();
  const { companyId } = await getCompanyContext();

  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = new Date(year, month, 0);
  const end = endDate.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("attendance")
    .select("id, date, status, check_in, check_out")
    .eq("company_id", companyId)
    .eq("employee_id", employeeId)
    .gte("date", start)
    .lte("date", end)
    .order("date", { ascending: true })
    .returns<AttendanceRow[]>();

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getLeaveTypes() {
  const supabase = await createClient();
  const { companyId } = await getCompanyContext();

  const { data, error } = await supabase
    .from("leave_types")
    .select("id, company_id, name, code, total_days, paid")
    .eq("company_id", companyId)
    .order("code")
    .returns<LeaveTypeRow[]>();

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getMyLeaveBalances(employeeId: string) {
  const supabase = await createClient();
  const { companyId } = await getCompanyContext();
  const year = new Date().getFullYear();

  const { data, error } = await supabase
    .from("leave_balances")
    .select("*, leave_types!fk_balances_type(name)")
    .eq("company_id", companyId)
    .eq("employee_id", employeeId)
    .eq("year", year);

  if (error) throw new Error(error.message);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []) as any[];
}

export async function getMyLeaves(employeeId: string) {
  const supabase = await createClient();
  const { companyId } = await getCompanyContext();

  const { data, error } = await supabase
    .from("leaves")
    .select("*, leave_types!fk_leaves_type(name, code)")
    .eq("company_id", companyId)
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []) as any[];
}

export async function getPendingLeaves() {
  const supabase = await createClient();
  const { companyId } = await getCompanyContext();

  const { data, error } = await supabase
    .from("leaves")
    .select("id, employee_id, from_date, to_date, reason, status, created_at, employees!fk_leaves_employee(first_name, last_name), leave_types!fk_leaves_type(name, code)")
    .eq("company_id", companyId)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []) as any[];
}

export async function getEmployeeDashboardStats(employeeId: string, today: string) {
  const supabase = await createClient();
  const { companyId } = await getCompanyContext();

  const [attToday, attMonth] = await Promise.all([
    supabase
      .from("attendance")
      .select("status, check_in, check_out, total_hours")
      .eq("company_id", companyId)
      .eq("employee_id", employeeId)
      .eq("date", today)
      .maybeSingle(),
    getAttendanceForEmployeeMonth(employeeId, new Date().getFullYear(), new Date().getMonth() + 1),
  ]);

  const todayStatus = attToday.data?.status ?? null;
  const daysPresent = attMonth.filter((a) => a.status === "PRESENT" || a.status === "HALF_DAY" || a.status === "LATE").length;
  const daysAbsent = attMonth.filter((a) => a.status === "ABSENT").length;
  const daysOnLeave = attMonth.filter((a) => a.status === "ON_LEAVE").length;

  return {
    todayStatus,
    todayCheckIn: attToday.data?.check_in ?? null,
    todayCheckOut: attToday.data?.check_out ?? null,
    todayTotalHours: attToday.data?.total_hours ?? null,
    daysPresent,
    daysAbsent,
    daysOnLeave,
  };
}

export async function getLatestPayrollForEmployee(employeeId: string) {
  const supabase = await createClient();
  const { companyId } = await getCompanyContext();

  const { data } = await supabase
    .from("payroll_entries")
    .select("id, month, year, net_salary")
    .eq("company_id", companyId)
    .eq("employee_id", employeeId)
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}

export async function getDashboardStats(today: string) {
  const { companyId } = await getCompanyContext();
  const supabase = await createClient();

  const [employees, attendance, payrollEntries, pendingCount, activeLeavesToday] = await Promise.all([
    getEmployees(),
    getAttendanceForDate(today),
    getLatestPayrollEntries(200),
    supabase
      .from("leaves")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("status", "pending")
      .then((r) => r.count ?? 0),
    supabase
      .from("leaves")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("status", "approved")
      .lte("from_date", today)
      .gte("to_date", today)
      .then((r) => r.count ?? 0),
  ]);

  const totalEmployees = employees.filter((employee) => employee.status === "active").length;
  const presentToday = attendance.filter((entry) => ["PRESENT", "LATE", "HALF_DAY"].includes(entry.status)).length;
  const onLeaveToday = attendance.filter((entry) => entry.status === "ON_LEAVE").length + activeLeavesToday;
  const lateArrivals = attendance.filter((entry) => entry.status === "LATE").length;
  const monthlyPayrollCost = payrollEntries.reduce((sum, entry) => sum + entry.net_salary, 0);

  return {
    totalEmployees,
    presentToday,
    onLeaveToday,
    lateArrivals,
    monthlyPayrollCost,
    pendingLeaveApprovals: pendingCount,
  };
}
