import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

function getSupabase() {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error("Supabase 환경 변수가 설정되지 않았습니다.");
    _supabase = createClient(url, key);
  }
  return _supabase;
}

export interface QARecord {
  id?: number;
  category: string;
  question: string;
  answer: string;
  tags?: string[];
  created_at?: string;
  created_by?: string;
  is_verified?: boolean;
}

export async function saveQA(record: QARecord) {
  const { data, error } = await getSupabase()
    .from("qa_records")
    .insert([record])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function searchQA(query: string, category?: string) {
  let req = getSupabase()
    .from("qa_records")
    .select("*")
    .textSearch("question", query, { type: "websearch" })
    .order("created_at", { ascending: false })
    .limit(5);
  if (category && category !== "unknown" && category !== "all") {
    req = req.eq("category", category);
  }
  const { data, error } = await req;
  if (error) return [];
  return data as QARecord[];
}

export async function getAllQA(category?: string) {
  let req = getSupabase()
    .from("qa_records")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (category && category !== "unknown" && category !== "all") {
    req = req.eq("category", category);
  }
  const { data, error } = await req;
  if (error) return [];
  return data as QARecord[];
}
