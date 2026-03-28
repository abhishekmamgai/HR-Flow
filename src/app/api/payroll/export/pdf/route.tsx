import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCompanyContext } from "@/lib/auth/company-context";
import { renderToStream } from "@react-pdf/renderer";
import { PayslipPDF } from "@/components/payroll/payslip-pdf";
import React from "react";

export async function GET(request: Request) {
  try {
    // Inline admin check for reliability
    const { companyId, isAdmin } = await getCompanyContext();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const entryId = searchParams.get("id");

    if (!entryId) {
      return NextResponse.json({ error: "Entry ID required" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: entry, error: entryError } = await supabase
      .from("payroll_entries")
      .select(`
        *,
        employees (
          *,
          departments(name)
        )
      `)
      .eq("id", entryId)
      .eq("company_id", companyId)
      .single();

    if (entryError || !entry) {
      return NextResponse.json({ error: entryError?.message || "Entry not found" }, { status: 404 });
    }

    const stream = await renderToStream(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <PayslipPDF entry={entry} companyName="ASK Tech Pvt. Ltd." /> as any
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new NextResponse(stream as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=payslip_${entry.month}_${entry.year}.pdf`,
      },
    });
  } catch (err) {
    console.error("Error generating PDF:", err);
    const msg = err instanceof Error ? err.message : "Export failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
