import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (!password || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const supabase = await createClient();
    const adminClient = createAdminClient();

    // 1. Get current session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // 2. Update Auth password AND metadata in one shot so cookies are refreshed
    const { error: authError } = await supabase.auth.updateUser({
      password: password,
      data: { first_login: false }
    });

    if (authError) throw authError;

    // 3. Update employee record first_login status
    const { error: empError } = await adminClient
      .from("employees")
      .update({ 
        first_login: false,
        password_changed_at: new Date().toISOString()
      })
      .eq("user_id", userId);

    if (empError) throw empError;



    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Change password error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
