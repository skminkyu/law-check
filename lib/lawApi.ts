const LAW_BASE_URL = "https://www.law.go.kr/DRF";
const OC = process.env.LAW_API_OC || "lawcheck";

export interface LawSearchResult {
  법령명: string;
  법령ID: string;
  법령종류: string;
  공포일자: string;
  시행일자: string;
}

export interface LawArticle {
  조문내용: string;
  조문번호: string;
  조문제목?: string;
}

// 관련 법령 목록 (행정처분 기준이 있는 법령들)
export const LAW_MAP: Record<string, string[]> = {
  화장품: ["화장품법", "화장품법 시행규칙"],
  식품표시광고: ["식품 등의 표시·광고에 관한 법률", "식품 등의 표시·광고에 관한 법률 시행규칙"],
  건강기능식품: ["건강기능식품에 관한 법률", "건강기능식품에 관한 법률 시행규칙"],
  식품위생: ["식품위생법", "식품위생법 시행규칙"],
  의약외품: ["약사법", "약사법 시행규칙"],
  의료기기: ["의료기기법", "의료기기법 시행규칙"],
};

// 법령 검색
export async function searchLaw(query: string): Promise<LawSearchResult[]> {
  const url = `${LAW_BASE_URL}/lawSearch.do?OC=${OC}&target=law&query=${encodeURIComponent(query)}&display=5&type=JSON`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`법령 검색 실패: ${res.status}`);
  const data = await res.json();
  const laws = data?.LawSearch?.law;
  if (!laws) return [];
  return (Array.isArray(laws) ? laws : [laws]).map((l: Record<string, string>) => ({
    법령명: l["법령명한글"] || l["법령명"],
    법령ID: l["법령ID"],
    법령종류: l["법령종류명"],
    공포일자: l["공포일자"],
    시행일자: l["시행일자"],
  }));
}

// 시행규칙 검색 (행정처분 별표 포함)
export async function searchAdmRule(query: string): Promise<LawSearchResult[]> {
  const url = `${LAW_BASE_URL}/lawSearch.do?OC=${OC}&target=admrul&query=${encodeURIComponent(query)}&display=5&type=JSON`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  const rules = data?.LawSearch?.law;
  if (!rules) return [];
  return (Array.isArray(rules) ? rules : [rules]).map((l: Record<string, string>) => ({
    법령명: l["법령명한글"] || l["법령명"],
    법령ID: l["법령ID"],
    법령종류: l["법령종류명"],
    공포일자: l["공포일자"],
    시행일자: l["시행일자"],
  }));
}

// 법령 본문 조회 (MST로)
export async function getLawText(lawId: string): Promise<string> {
  const url = `${LAW_BASE_URL}/lawService.do?OC=${OC}&target=law&MST=${lawId}&type=JSON`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`법령 본문 조회 실패: ${res.status}`);
  const data = await res.json();
  return JSON.stringify(data);
}

// 법령 본문 조회 (법령명으로)
export async function getLawTextByName(lawName: string): Promise<string> {
  const url = `${LAW_BASE_URL}/lawService.do?OC=${OC}&target=law&query=${encodeURIComponent(lawName)}&type=JSON`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`법령 본문 조회 실패: ${res.status}`);
  const text = await res.text();
  return text;
}

// 행정규칙 본문 조회 (법령명으로)
export async function getAdmRuleTextByName(lawName: string): Promise<string> {
  const url = `${LAW_BASE_URL}/lawService.do?OC=${OC}&target=admrul&query=${encodeURIComponent(lawName)}&type=JSON`;
  const res = await fetch(url);
  if (!res.ok) return "";
  const text = await res.text();
  return text;
}

// 카테고리별 관련 법령명 반환
export function getLawNamesForCategory(category: string): string[] {
  return LAW_MAP[category] || [];
}
