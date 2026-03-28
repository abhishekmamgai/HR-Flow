import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCompanyContext } from "@/lib/auth/company-context";
import { requireAdmin } from "@/lib/auth/require-admin";

const schema = z.object({
  employee_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(["PRESENT", "HALF_DAY", "LATE", "EARLY_OUT", "ABSENT", "ON_LEAVE", "HOLIDAY", "WEEKEND"]),
  check_in: z.string().optional().nullable(),
  check_out: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const supabase = await createClient();
    const { companyId } = await getCompanyContext();

    const { error } = await supabase
      .from("attendance")
      .upsert({
        company_id: companyId,
        ...parsed.data,
      }, { onConflict: "company_id,employee_id,date" });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Manual update failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
