import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = createAdminClient();

    const results: any = {};

    // Inspect payroll_entries
    const { data: entries, error: entriesError } = await supabase
      .from("payroll_entries")
      .select("*")
      .limit(1);
    
    results.payroll_entries = {
      exists: !entriesError || entriesError.code !== 'PGRST116',
      error: entriesError?.message,
      columns: entries && entries.length > 0 ? Object.keys(entries[0]) : null
    };

    // Inspect payroll_runs
    const { data: runs, error: runsError } = await supabase
      .from("payroll_runs")
      .select("*")
      .limit(1);
    
    results.payroll_runs = {
      exists: !runsError || (runsError.code !== 'PGRST116' && !runsError.message.includes('not found')),
      error: runsError?.message,
      columns: runs && runs.length > 0 ? Object.keys(runs[0]) : null
    };

    // Inspect employees
    const { data: emps, error: empsError } = await supabase
      .from("employees")
      .select("*")
      .limit(1);
    
    results.employees = {
      exists: !empsError,
      error: empsError?.message,
      columns: emps && emps.length > 0 ? Object.keys(emps[0]) : null
    };

    return NextResponse.json(results);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
