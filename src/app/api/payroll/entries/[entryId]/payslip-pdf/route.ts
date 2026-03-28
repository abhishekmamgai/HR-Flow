import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCompanyContext } from "@/lib/auth/company-context";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  try {
    const { companyId } = await getCompanyContext();
    const { entryId } = await params;

    const supabase = await createClient();

    // Get the payroll entry
    const { data: entry, error: entryError } = await supabase
      .from("payroll_entries")
      .select("*, employees(first_name, last_name, designation, department_id, departments(name))")
      .eq("id", entryId)
      .eq("company_id", companyId)
      .single();

    if (entryError || !entry) {
      return NextResponse.json(
        { error: "Payroll entry not found" },
        { status: 404 }
      );
    }

    // Check if payslip_url exists and return it
    if (entry.payslip_url) {
      return NextResponse.json({
        exists: true,
        url: entry.payslip_url
      });
    }

    // Return entry data for PDF generation
    return NextResponse.json({
      exists: false,
      entry: entry
    });
  } catch (error) {
    console.error("Error fetching payslip data:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch payslip data" },
      { status: 500 }
    );
  }
}
