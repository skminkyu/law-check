import faqData from "./faqData.json";

export interface FaqEntry {
  id: string;
  year: number;
  category: string;
  source: string;
  question: string;
  answer: string;
}

const entries: FaqEntry[] = faqData as FaqEntry[];

// Simple keyword-based search
export function searchFaq(query: string, maxResults = 3): FaqEntry[] {
  if (!query || entries.length === 0) return [];

  const keywords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 1);

  if (keywords.length === 0) return [];

  const scored = entries.map((e) => {
    const text = (e.question + " " + e.answer).toLowerCase();
    let score = 0;
    for (const kw of keywords) {
      if (e.question.toLowerCase().includes(kw)) score += 3;
      else if (text.includes(kw)) score += 1;
    }
    return { entry: e, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map((s) => s.entry);
}

export function formatFaqContext(entries: FaqEntry[]): string {
  if (entries.length === 0) return "";
  const items = entries.map(
    (e) => `**Q: ${e.question}**\n${e.answer}\n출처: ${e.source}`
  );
  return `\n\n=== 자주하는 질문집 참고 내용 ===\n${items.join("\n\n")}`;
}
