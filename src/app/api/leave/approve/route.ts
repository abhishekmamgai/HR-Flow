import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCompanyContext } from "@/lib/auth/company-context";
import { requireAdmin } from "@/lib/auth/require-admin";

const schema = z.object({
  leave_id: z.string().uuid(),
  status: z.enum(["approved", "rejected", "withdrawn"]),
  rejection_reason: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const ctx = await requireAdmin(); // Ensures user is admin/hr
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const supabase = await createClient();
    const { companyId } = await getCompanyContext();

    // Fetch the leave
    const { data: leave, error: fetchErr } = await supabase
      .from("leaves")
      .select("*")
      .eq("id", parsed.data.leave_id)
      .eq("company_id", companyId)
      .single();

    if (fetchErr || !leave) return NextResponse.json({ error: "Leave not found" }, { status: 404 });
    if (leave.status !== "pending") return NextResponse.json({ error: "Leave already processed" }, { status: 400 });

    const from = new Date(leave.from_date);
    const to = new Date(leave.to_date);
    const requestedDays = Math.ceil((to.getTime() - from.getTime()) / (86400000)) + 1;
    const year = from.getFullYear();

    // Fetch the balance
    const { data: balance, error: balErr } = await supabase
      .from("leave_balances")
      .select("id, used, pending")
      .eq("company_id", companyId)
      .eq("employee_id", leave.employee_id)
      .eq("leave_type_id", leave.leave_type_id)
      .eq("year", year)
      .single();

    if (balErr || !balance) return NextResponse.json({ error: "Balance not found" }, { status: 400 });

    let newPending = balance.pending - requestedDays;
    let newUsed = balance.used;
    if (newPending < 0) newPending = 0;

    if (parsed.data.status === "approved") {
      newUsed += requestedDays;
    }

    // Update balance
    const { error: updBalErr } = await supabase
      .from("leave_balances")
      .update({ pending: newPending, used: newUsed })
      .eq("id", balance.id);

    if (updBalErr) throw updBalErr;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update: any = {
      status: parsed.data.status,
      approved_by: ctx.userId,
    };

    if (parsed.data.rejection_reason) {
      update.rejection_reason = parsed.data.rejection_reason;
    }

    const { error } = await supabase
      .from("leaves")
      .update(update)
      .eq("id", parsed.data.leave_id)
      .eq("company_id", companyId);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Approval failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
