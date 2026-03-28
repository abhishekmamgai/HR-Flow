import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { employee_code, password } = await request.json();

    if (!employee_code || !password) {
      return NextResponse.json({ error: "Employee ID and password are required" }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const supabase = await createClient();

    // 1. Find employee by code (use adminClient to bypass RLS)
    const { data: employee, error: empError } = await adminClient
      .from("employees")
      .select("email, user_id, first_login, first_name")
      .eq("employee_code", employee_code)
      .single();

    if (empError || !employee) {
      return NextResponse.json({ error: "Employee ID not found" }, { status: 404 });
    }

    // 2. Sign in with Supabase Auth (use user client to set cookies)
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: employee.email,
      password: password,
    });

    if (loginError) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }

    // 3. Determine redirect based on first_login
    const redirect = employee.first_login ? "/change-password" : "/employee/dashboard";

    return NextResponse.json({
      success: true,
      first_login: employee.first_login,
      redirect,
      name: employee.first_name,
    });
  } catch (err) {
    console.error("❌ Employee login error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
