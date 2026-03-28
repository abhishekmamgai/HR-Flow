import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adminClient = createAdminClient();

    // 1. Get employee first to get their user_id
    const { data: employee, error: empError } = await adminClient
      .from("employees")
      .select("user_id, employee_code")
      .eq("id", id)
      .single();

    if (empError || !employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const userId = employee.user_id;
    if (!userId) {
      return NextResponse.json({ error: "Employee has no linked Auth user" }, { status: 400 });
    }

    const defaultPass = "AskTech@123";

    // 2. Reset Auth password
    const { error: authError } = await adminClient.auth.admin.updateUserById(
      userId,
      { password: defaultPass }
    );

    if (authError) throw authError;

    // 3. Update employee record to force first_login again
    const { error: updateError } = await adminClient
      .from("employees")
      .update({ 
        first_login: true,
        temp_password: defaultPass,
        password_changed_at: null 
      })
      .eq("id", id);

    if (updateError) throw updateError;

    // 4. Update Auth user metadata
    const { error: metaError } = await adminClient.auth.admin.updateUserById(
      userId,
      { user_metadata: { first_login: true } }
    );

    if (metaError) throw metaError;

    return NextResponse.json({ success: true, message: "Password reset to default" });
  } catch (err) {
    console.error("❌ Reset password error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
