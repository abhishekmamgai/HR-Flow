import { z } from "zod";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCompanyContext } from "@/lib/auth/company-context";

const schema = z.object({ leave_id: z.string().uuid() });

export async function POST(request: Request) {
  try {
    const ctx = await getCompanyContext();
    if (!ctx.employeeId) {
      return NextResponse.json({ error: "Employee record required" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: leave } = await supabase
      .from("leaves")
      .select("id, from_date, to_date, leave_type_id")
      .eq("id", parsed.data.leave_id)
      .eq("company_id", ctx.companyId)
      .eq("employee_id", ctx.employeeId)
      .eq("status", "pending")
      .maybeSingle();

    if (!leave) {
      return NextResponse.json({ error: "Leave not found or cannot be withdrawn" }, { status: 404 });
    }

    const { error } = await supabase.from("leaves").update({ status: "withdrawn" }).eq("id", leave.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Decrement pending in leave_balances
    const from = new Date(leave.from_date);
    const to = new Date(leave.to_date);
    const days = Math.ceil((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    const { data: lb } = await supabase
      .from("leave_balances")
      .select("id, pending")
      .eq("company_id", ctx.companyId)
      .eq("employee_id", ctx.employeeId)
      .eq("leave_type_id", leave.leave_type_id)
      .eq("year", from.getFullYear())
      .maybeSingle();
    if (lb) {
      await supabase.from("leave_balances").update({ pending: Math.max(0, (lb.pending ?? 0) - days) }).eq("id", lb.id);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
