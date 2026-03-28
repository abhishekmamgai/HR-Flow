import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCompanyContext } from "@/lib/auth/company-context";

const BUCKET = "profiles";
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { companyId } = await getCompanyContext();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file || !file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Invalid image file" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large (max 2MB)" }, { status: 400 });
    }

    const ext = file.name.split(".").pop() || "jpg";
    const path = `${companyId}/${crypto.randomUUID()}.${ext}`;

    const buf = await file.arrayBuffer();
    const { error } = await supabase.storage.from(BUCKET).upload(path, buf, {
      contentType: file.type,
      upsert: false,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return NextResponse.json({ data: { url: urlData.publicUrl }, error: null });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
