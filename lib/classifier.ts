export type LawCategory =
  | "화장품"
  | "식품표시광고"
  | "건강기능식품"
  | "식품위생"
  | "의약외품"
  | "의료기기"
  | "unknown";

export const CATEGORIES: { id: LawCategory; label: string; emoji: string; color: string }[] = [
  { id: "화장품", label: "화장품", emoji: "💄", color: "bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100" },
  { id: "식품표시광고", label: "식품 표시·광고", emoji: "🏷️", color: "bg-green-50 border-green-200 text-green-700 hover:bg-green-100" },
  { id: "건강기능식품", label: "건강기능식품", emoji: "💊", color: "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100" },
  { id: "식품위생", label: "식품위생", emoji: "🍽️", color: "bg-lime-50 border-lime-200 text-lime-700 hover:bg-lime-100" },
  { id: "의약외품", label: "의약외품", emoji: "🧴", color: "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100" },
  { id: "의료기기", label: "의료기기", emoji: "🏥", color: "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100" },
];

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

export const CATEGORY_COLORS: Record<string, string> = {
  화장품: "bg-pink-100 text-pink-700",
  식품표시광고: "bg-green-100 text-green-700",
  건강기능식품: "bg-emerald-100 text-emerald-700",
  식품위생: "bg-lime-100 text-lime-700",
  의약외품: "bg-blue-100 text-blue-700",
  의료기기: "bg-purple-100 text-purple-700",
  unknown: "bg-gray-100 text-gray-600",
};

// 카테고리별 참조 법령 (행정처분 기준)
export const ENFORCEMENT_DECREE_MAP: Record<LawCategory, string[]> = {
  화장품: ["화장품법 시행규칙"],
  식품표시광고: ["식품 등의 표시·광고에 관한 법률 시행규칙"],
  건강기능식품: ["건강기능식품에 관한 법률 시행규칙"],
  식품위생: ["식품위생법 시행규칙"],
  의약외품: ["약사법 시행규칙"],
  의료기기: ["의료기기법 시행규칙"],
  unknown: [],
};

// 카테고리별 예시 질문
export const EXAMPLE_QUESTIONS: Record<LawCategory | "all", string[]> = {
  all: [
    "화장품 1차 포장에 표시사항을 기재하지 않으면?",
    "건강기능식품 허위광고 행정처분 기준은?",
    "식품 표시광고 위반 시 처분은?",
    "의료기기 허가 없이 판매하면?",
    "의약외품 표시 위반 1차·2차·3차 처분은?",
  ],
  화장품: [
    "화장품 1차 포장 표시사항 미기재 행정처분은?",
    "기능성화장품 심사 없이 판매하면?",
    "화장품 제조업 등록 없이 제조하면?",
    "화장품 광고 위반 시 처분 기준은?",
  ],
  식품표시광고: [
    "식품 표시사항 미기재 행정처분은?",
    "허위·과장 광고 위반 처분 기준은?",
    "영양성분 표시 오류 시 행정처분은?",
    "식품 원산지 허위 표시 처분은?",
  ],
  건강기능식품: [
    "건강기능식품 허위광고 1차·2차·3차 처분은?",
    "기능성 표시 위반 행정처분은?",
    "건강기능식품 제조업 위반 처분은?",
    "인정받지 않은 기능성 표방 시 처분은?",
  ],
  식품위생: [
    "식품위생법 위반 영업정지 기준은?",
    "유통기한 경과 식품 판매 시 처분은?",
    "식품 이물 혼입 행정처분 기준은?",
    "영업허가 없이 식품 제조 시 처분은?",
  ],
  의약외품: [
    "의약외품 표시 위반 행정처분은?",
    "의약외품 허가 없이 판매하면?",
    "의약외품 광고 기준 위반 처분은?",
    "의약외품 제조 위반 시 처분 기준은?",
  ],
  의료기기: [
    "의료기기 허가 없이 판매하면?",
    "의료기기 표시 위반 행정처분은?",
    "의료기기 광고 위반 처분 기준은?",
    "의료기기 제조업 허가 없이 제조 시?",
  ],
  unknown: [],
};
