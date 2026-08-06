import { NextRequest, NextResponse } from "next/server";
import { BUILTIN_BROADCAST_CASES, BroadcastCase } from "@/lib/broadcastCasesData";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const decision = searchParams.get("decision") || "";

  let userCases: BroadcastCase[] = [];
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data } = await supabase
        .from("broadcast_cases")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (data) userCases = data.map((d: BroadcastCase) => ({ ...d, source: "user" as const }));
    } catch {
      // Supabase table may not exist yet; ignore
    }
  }

  let allCases = [
    ...BUILTIN_BROADCAST_CASES,
    ...userCases,
  ];

  if (q) {
    const lower = q.toLowerCase();
    allCases = allCases.filter(
      (c) =>
        c.violation.toLowerCase().includes(lower) ||
        c.program.toLowerCase().includes(lower) ||
        c.regulation.toLowerCase().includes(lower)
    );
  }
  if (decision && decision !== "all") {
    allCases = allCases.filter((c) => c.decision === decision);
  }

  return NextResponse.json({ cases: allCases, total: allCases.length });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { program, violation, regulation, decision } = body;
    if (!program || !violation || !regulation || !decision) {
      return NextResponse.json({ error: "모든 필드를 입력해주세요." }, { status: 400 });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "DB가 설정되지 않았습니다." }, { status: 500 });
    }

    const { data, error } = await supabase
      .from("broadcast_cases")
      .insert([{ program, violation, regulation, decision }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, case: data });
  } catch (error) {
    console.error("broadcast-cases POST error:", error);
    return NextResponse.json({ error: "저장 실패" }, { status: 500 });
  }
}
