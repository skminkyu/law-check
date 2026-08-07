import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json({ supabase: false, reason: "환경변수 없음" });
  }

  try {
    const sb = createClient(url, key);
    const { error } = await sb.from("qa_records").select("id").limit(1);
    if (error) return NextResponse.json({ supabase: false, reason: error.message });
    return NextResponse.json({ supabase: true });
  } catch (e) {
    return NextResponse.json({ supabase: false, reason: String(e) });
  }
}
