import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCompanyContext } from "@/lib/auth/company-context";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { companyId, userId, isAdmin } = await getCompanyContext();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized — admin access required" }, { status: 403 });
    }
    const { runId } = await params;

    const supabase = await createClient();

    // Verify run belongs to company
    const { data: run, error: runError } = await supabase
      .from("payroll_runs")
      .select("*")
      .eq("id", runId)
      .eq("company_id", companyId)
      .single();

    if (runError || !run) {
      return NextResponse.json(
        { error: "Payroll run not found" },
        { status: 404 }
      );
    }

    if (run.status !== "processing") {
      return NextResponse.json(
        { error: `Cannot approve payroll with status: ${run.status}` },
        { status: 400 }
      );
    }

    // Update to approved
    const { error: updateError } = await supabase
      .from("payroll_runs")
      .update({
        status: "approved",
        approved_by: userId,
        approved_at: new Date().toISOString()
      })
      .eq("id", runId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Update all entries to approved
    await supabase
      .from("payroll_entries")
      .update({ status: "approved" })
      .eq("company_id", companyId)
      .eq("month", run.month)
      .eq("year", run.year);

    return NextResponse.json({
      success: true,
      message: "Payroll approved successfully",
      totalAmount: run.total_net
    });
  } catch (error) {
    console.error("Error approving payroll:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to approve payroll" },
      { status: 500 }
    );
  }
}
