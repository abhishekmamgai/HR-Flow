import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCompanyContext } from "@/lib/auth/company-context";

const schema = z.object({
  leave_type_id: z.string().uuid(),
  from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const supabase = await createClient();
    const { companyId, employeeId } = await getCompanyContext();

    if (!employeeId) {
      return NextResponse.json({ error: "No employee record found for your user" }, { status: 403 });
    }

    // Check balance
    const from = new Date(parsed.data.from_date);
    const to = new Date(parsed.data.to_date);
    const requestedDays = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const year = from.getFullYear();

    const { data: balance, error: balError } = await supabase
      .from("leave_balances")
      .select("id, total, used, pending")
      .eq("company_id", companyId)
      .eq("employee_id", employeeId)
      .eq("leave_type_id", parsed.data.leave_type_id)
      .eq("year", year)
      .single();

    if (balError || !balance) {
      return NextResponse.json({ error: "Leave balance not found" }, { status: 400 });
    }

    const available = balance.total - balance.used - balance.pending;
    if (requestedDays > available) {
      return NextResponse.json({ error: `Insufficient balance. Requested: ${requestedDays}, Available: ${available}` }, { status: 400 });
    }

    // Apply leave (Trigger handles pending balance update) -> NO TRIGGER EXISTS, DOING IT MANUALLY
    const { error: leaveError } = await supabase.from("leaves").insert({
      company_id: companyId,
      employee_id: employeeId,
      leave_type_id: parsed.data.leave_type_id,
      from_date: parsed.data.from_date,
      to_date: parsed.data.to_date,
      reason: parsed.data.reason,
      status: "pending",
    });

    if (leaveError) throw leaveError;

    // Manually increment pending balance
    const { error: updError } = await supabase
      .from("leave_balances")
      .update({ pending: balance.pending + requestedDays })
      .eq("id", balance.id);

    if (updError) throw updError;

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Apply leave failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
