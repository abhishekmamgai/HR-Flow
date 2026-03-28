import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCompanyContext } from "@/lib/auth/company-context";

export async function GET(request: NextRequest) {
  try {
    const { companyId } = await getCompanyContext();
    const supabase = await createClient();

    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    if (!month || !year) {
      return NextResponse.json(
        { error: "Month and year required" },
        { status: 400 }
      );
    }

    // Get payroll run
    const { data: run } = await supabase
      .from("payroll_runs")
      .select("*")
      .eq("company_id", companyId)
      .eq("month", parseInt(month))
      .eq("year", parseInt(year))
      .single();

    // Get all entries for this month
    const { data: entries } = await supabase
      .from("payroll_entries")
      .select("*, employees(first_name, last_name, designation, departments(name))")
      .eq("company_id", companyId)
      .eq("month", parseInt(month))
      .eq("year", parseInt(year))
      .order("created_at", { ascending: false });

    return NextResponse.json({
      run: run || null,
      entries: entries || []
    });
  } catch (error) {
    console.error("Error fetching payroll:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch payroll" },
      { status: 500 }
    );
  }
}
