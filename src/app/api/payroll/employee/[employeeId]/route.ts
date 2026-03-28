import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCompanyContext } from "@/lib/auth/company-context";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  try {
    const { companyId, userId } = await getCompanyContext();
    const { employeeId } = await params;

    const supabase = await createClient();

    // Verify employee belongs to company and is the current user or admin
    const { data: employee, error: empError } = await supabase
      .from("employees")
      .select("id, user_id")
      .eq("id", employeeId)
      .eq("company_id", companyId)
      .single();

    if (empError || !employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    // Get all payslips for employee
    const { data: payslips } = await supabase
      .from("payroll_entries")
      .select("*")
      .eq("employee_id", employeeId)
      .eq("company_id", companyId)
      .order("year", { ascending: false })
      .order("month", { ascending: false });

    return NextResponse.json({
      payslips: payslips || []
    });
  } catch (error) {
    console.error("Error fetching payslips:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch payslips" },
      { status: 500 }
    );
  }
}
