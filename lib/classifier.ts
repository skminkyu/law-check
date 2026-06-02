// 사용자 질문에서 법령 카테고리를 분류
export type LawCategory =
  | "화장품"
  | "식품표시광고"
  | "건강기능식품"
  | "식품위생"
  | "의약외품"
  | "의료기기"
  | "unknown";

export function classifyCategory(question: string): LawCategory {
  const q = question;

  if (/화장품/.test(q)) return "화장품";
  if (/의료기기/.test(q)) return "의료기기";
  if (/의약외품/.test(q)) return "의약외품";
  if (/건강기능식품|건기식/.test(q)) return "건강기능식품";
  if (/식품.*표시.*광고|표시.*광고.*식품|표시광고/.test(q)) return "식품표시광고";
  if (/식품위생|식품|음식|음료|주류/.test(q)) return "식품위생";

  return "unknown";
}

export const CATEGORY_LABELS: Record<LawCategory, string> = {
  화장품: "화장품법",
  식품표시광고: "식품 등의 표시·광고에 관한 법률",
  건강기능식품: "건강기능식품에 관한 법률",
  식품위생: "식품위생법",
  의약외품: "약사법(의약외품)",
  의료기기: "의료기기법",
  unknown: "해당 법령 없음",
};

// 행정처분 관련 키워드 매핑
export const ENFORCEMENT_DECREE_MAP: Record<LawCategory, string[]> = {
  화장품: ["화장품법 시행규칙"],
  식품표시광고: ["식품 등의 표시·광고에 관한 법률 시행규칙"],
  건강기능식품: ["건강기능식품에 관한 법률 시행규칙"],
  식품위생: ["식품위생법 시행규칙"],
  의약외품: ["약사법 시행규칙"],
  의료기기: ["의료기기법 시행규칙"],
  unknown: [],
};
