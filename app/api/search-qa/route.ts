import { NextRequest, NextResponse } from "next/server";
import { searchQA, getAllQA } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";

  try {
    const results = query
      ? await searchQA(query, category)
      : await getAllQA(category);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search QA error:", error);
    return NextResponse.json({ results: [] });
  }
}
