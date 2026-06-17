import knowledgeData from "./qa-knowledge.json";

type KnowledgeSection = {
  pages: number[];
  content: string;
};

type Knowledge = Record<string, KnowledgeSection>;

const knowledge = knowledgeData as Knowledge;

// 질문 키워드 → 관련 섹션 매핑
const KEYWORD_SECTION_MAP: { keywords: RegExp; sections: string[] }[] = [
  {
    keywords: /표시\s*기준|표시사항|라벨|라벨링|성분표시|원산지|혼용률|섬유|의류|다운|화장품\s*표시|식품\s*표시|전기용품\s*표시/,
    sections: ["표시_기준"],
  },
  {
    keywords: /서류|시험성적서|KC인증|인증서|상표|특허|PL보험|QA서류|서류\s*기준|가구|가전|뷰티|생활용품|주방|유아|스포츠|시계|식품\s*서류|침구|패션/,
    sections: ["서류QA_기준"],
  },
  {
    keywords: /암행검사|현장검사|포장\s*기준|샘플링|AQL|시험기관|시험장비|업무\s*FLOW|QA\s*절차|QA\s*업무/,
    sections: ["QA_업무일반"],
  },
  {
    keywords: /SCM|가상품|상품코드|QA의뢰|QA\s*진행|모바일설명서|스마트\s*QA/,
    sections: ["SCM_사용방법"],
  },
  {
    keywords: /자원재활용|분리배출|재활용|포장재|환경부담금|EPR/,
    sections: ["자원재활용법"],
  },
  {
    keywords: /살생물제|살균|살충|소독|바이오사이드/,
    sections: ["살생물제"],
  },
  {
    keywords: /중대시민재해|중대재해|제조물\s*책임|원료\s*안전/,
    sections: ["중대시민재해"],
  },
  {
    keywords: /QA란|QA\s*소개|QA\s*담당자|품질관리팀|담당자|연락처|QA\s*아카이브/,
    sections: ["QA_소개"],
  },
];

export function getRelevantKnowledge(question: string): string {
  const matched = new Set<string>();

  for (const { keywords, sections } of KEYWORD_SECTION_MAP) {
    if (keywords.test(question)) {
      sections.forEach((s) => matched.add(s));
    }
  }

  // 매칭 없으면 서류QA + 표시기준 기본 제공
  if (matched.size === 0) {
    matched.add("서류QA_기준");
    matched.add("표시_기준");
  }

  const parts: string[] = [];
  for (const section of matched) {
    const data = knowledge[section];
    if (data) {
      // 토큰 절약을 위해 섹션당 최대 6000자
      const content = data.content.substring(0, 6000);
      parts.push(`\n\n=== SK스토아 QA 가이드북: ${section.replace(/_/g, " ")} ===\n${content}`);
    }
  }

  return parts.join("\n");
}

export function getAllSectionNames(): string[] {
  return Object.keys(knowledge);
}
