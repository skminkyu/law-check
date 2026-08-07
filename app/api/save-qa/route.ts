import { NextRequest, NextResponse } from "next/server";
import { saveQA } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id 필요" }, { status: 400 });
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: "DB 없음" }, { status: 500 });
  await supabase.from("qa_records").delete().eq("id", id);
  return NextResponse.json({ success: true });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { category, question, answer, created_by } = body;
    if (!question || !answer) {
      return NextResponse.json({ error: "질문과 답변이 필요합니다." }, { status: 400 });
    }
    const record = await saveQA({ category, question, answer, created_by, is_verified: false });
    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error("Save QA error:", error);
    return NextResponse.json({ error: "저장 실패" }, { status: 500 });
  }
}
