import { NextRequest, NextResponse } from "next/server";
import { saveQA } from "@/lib/supabase";

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
