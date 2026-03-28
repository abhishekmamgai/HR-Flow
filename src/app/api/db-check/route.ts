import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = createAdminClient();
    const results: any = {};

    const { data: runs } = await supabase.from("payroll_runs").select("*").limit(5);
    results.payroll_runs = runs;

    const { data: entries } = await supabase.from("payroll_entries").select("*").limit(5);
    results.payroll_entries_count = entries?.length;

    return NextResponse.json(results);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
