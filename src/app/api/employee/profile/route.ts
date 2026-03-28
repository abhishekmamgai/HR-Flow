import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCompanyContext } from "@/lib/auth/company-context";

export async function GET() {
  try {
    const supabase = await createClient();
    const { companyId, userId } = await getCompanyContext();

    // Get current user's employee record
    const { data: employee, error } = await supabase
      .from("employees")
      .select("*, departments(name)")
      .eq("company_id", companyId)
      .eq("user_id", userId)
      .single();

    if (error || !employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error("Error fetching employee profile:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
