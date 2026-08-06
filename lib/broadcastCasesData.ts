export interface BroadcastCase {
  id?: number;
  program: string;
  violation: string;
  regulation: string;
  decision: string;
  source?: "builtin" | "user";
  created_at?: string;
}

export const BUILTIN_BROADCAST_CASES: BroadcastCase[] = [
  {
    program: "CJ온스타일 <[최화정쇼] 세포랩 바이오제닉 에센스>",
    violation: "상품 구매 시 쿠폰을 적용하여 최대 할인을 받을 수 있는 것처럼 안내하였으나 방송 후반부에 쿠폰이 적용이 안된다고 정정하는 등 시청자를 오인케 하는 내용을 방송. 방송 초반 및 종료시점에만 중요 정보를 작은 글씨로 빠르게 자막고지하고, 쇼호스트가 잘못된 정보를 제공함.",
    regulation: "상품소개 및 판매방송 심의에 관한 규정 제5조(일반원칙) 제1항, 제3항",
    decision: "권고",
    source: "builtin",
  },
  {
    program: "롯데OneTV <키클래오 HT042 프라임>",
    violation: "키 성장 인체적용시험결과에서 12주 후까지의 섭취군과 대조군 간 키 차이를 우상향 그래프로 보여주면서, 24주 후의 키 차이가 12주 후보다 오히려 줄어들었음에도 마치 섭취 기간이 늘어날수록 키 성장 격차가 계속 벌어지는 것처럼 과장표현 하여 시청자를 오인케 하는 내용을 방송.",
    regulation: "상품소개 및 판매방송 심의에 관한 규정 제22조(자료인용) 제4항",
    decision: "의견진술",
    source: "builtin",
  },
  {
    program: "GS SHOP <비에날씬pro 다이어트 유산균+슬림+>",
    violation: "건강기능식품 판매방송에서 생성형 AI 이미지로 연출한 여성의 복부와 하체를 보여주고, 복부의 윤곽이 드러나는 옷을 입은 여성 출연자의 신체 화면과 함께 \"지금 여기서부터 빼야 돼\", \"이렇게 계실거에요, 지금?\" 등으로 언급하여 외모 비하 및 차별적 내용을 방송.",
    regulation: "상품소개 및 판매방송 심의에 관한 규정 제32조의2(인권보호) 제2항, 제33조(차별금지 등) 제2항",
    decision: "권고",
    source: "builtin",
  },
  {
    program: "NS홈쇼핑",
    violation: "건강기능식품의 기능성 정보를 시청자가 명확하게 인식할 수 있도록 충분히 고지하지 않은 채 과대표현 내용을 방송.",
    regulation: "상품소개 및 판매방송 심의에 관한 규정 제5조(일반원칙) 제3항",
    decision: "문제없음",
    source: "builtin",
  },
  {
    program: "홈앤쇼핑",
    violation: "방송에서 '전 세계 최초', '유일한' 등의 최고 표현을 사용하면서 이를 뒷받침하는 객관적인 근거를 충분히 제시하지 않아 시청자를 오인케 하는 내용을 방송.",
    regulation: "상품소개 및 판매방송 심의에 관한 규정 제5조(일반원칙) 제5항",
    decision: "문제없음",
    source: "builtin",
  },
  {
    program: "CJ온스타일",
    violation: "방송에서 식품의 효능을 과장하거나 의약품으로 오인될 수 있는 표현을 사용하면서 중요한 주의사항을 충분히 고지하지 않아 시청자를 오인케 하는 내용을 방송.",
    regulation: "상품소개 및 판매방송 심의에 관한 규정 제5조(일반원칙) 제3항, 제48조(식품등) 제1항 제1호",
    decision: "주의",
    source: "builtin",
  },
  {
    program: "롯데원TV",
    violation: "방송에서 정확한 근거 없이 상품 효능을 과장하여 시청자를 오인케 하는 내용을 방송.",
    regulation: "상품소개 및 판매방송 심의에 관한 규정 제5조(일반원칙) 제3항",
    decision: "문제없음",
    source: "builtin",
  },
  {
    program: "GS SHOP",
    violation: "방송에서 건강기능식품의 기능성에 대해 검증되지 않은 내용을 방송하여 시청자를 오인케 하는 내용을 방송.",
    regulation: "상품소개 및 판매방송 심의에 관한 규정 제5조(일반원칙) 제3항",
    decision: "권고",
    source: "builtin",
  },
  {
    program: "현대홈쇼핑",
    violation: "방송에서 한정판매 상품임을 강조하면서 실제로는 계속 판매 가능한 상품을 한정수량인 것처럼 오인케 하는 내용을 방송.",
    regulation: "상품소개 및 판매방송 심의에 관한 규정 제15조(한정판매 및 판매조건) 제2항",
    decision: "의견제시",
    source: "builtin",
  },
  {
    program: "NS홈쇼핑",
    violation: "방송에서 쇼호스트가 상품의 효능에 대해 과장하거나 허위적인 내용을 방송하여 시청자를 오인케 하는 내용을 방송.",
    regulation: "상품소개 및 판매방송 심의에 관한 규정 제5조(일반원칙) 제1항, 제3항",
    decision: "의견진술",
    source: "builtin",
  },
  {
    program: "CJ온스타일",
    violation: "방송에서 상품의 가격 할인폭을 과장하거나 실제와 다른 가격 정보를 제공하여 시청자를 오인케 하는 내용을 방송.",
    regulation: "상품소개 및 판매방송 심의에 관한 규정 제5조(일반원칙) 제4항",
    decision: "의견진술",
    source: "builtin",
  },
  {
    program: "롯데원TV",
    violation: "방송에서 일부 사실이지만 전체적으로 시청자가 오인할 우려가 있는 내용을 방송.",
    regulation: "상품소개 및 판매방송 심의에 관한 규정 제5조(일반원칙) 제4항",
    decision: "의견진술",
    source: "builtin",
  },
  {
    program: "GS SHOP",
    violation: "방송에서 건강식품의 효능에 대해 과장된 표현을 사용하면서 중요한 주의사항을 충분히 고지하지 않아 시청자를 오인케 하는 내용을 방송.",
    regulation: "상품소개 및 판매방송 심의에 관한 규정 제5조(일반원칙) 제3항",
    decision: "의견진술",
    source: "builtin",
  },
  {
    program: "홈앤쇼핑",
    violation: "방송에서 한정판매를 강조하면서 실제 재고와 다른 정보를 제공하여 시청자를 오인케 하는 내용을 방송.",
    regulation: "상품소개 및 판매방송 심의에 관한 규정 제15조(한정판매 및 판매조건) 제2항",
    decision: "권고",
    source: "builtin",
  },
  {
    program: "현대홈쇼핑",
    violation: "방송에서 의약품과 유사한 효능이 있는 것처럼 건강기능식품을 소개하여 시청자를 오인케 하는 내용을 방송.",
    regulation: "상품소개 및 판매방송 심의에 관한 규정 제5조(일반원칙) 제3항",
    decision: "주의",
    source: "builtin",
  },
  {
    program: "NS홈쇼핑",
    violation: "방송에서 다이어트 식품의 효과를 과장하거나 근거 없는 내용을 방송하여 시청자를 오인케 하는 내용을 방송.",
    regulation: "상품소개 및 판매방송 심의에 관한 규정 제5조(일반원칙) 제3항",
    decision: "주의",
    source: "builtin",
  },
  {
    program: "CJ온스타일",
    violation: "방송에서 화장품의 의약품 수준의 효능을 암시하는 표현을 사용하여 시청자를 오인케 하는 내용을 방송.",
    regulation: "상품소개 및 판매방송 심의에 관한 규정 제5조(일반원칙) 제3항",
    decision: "주의",
    source: "builtin",
  },
  {
    program: "롯데원TV",
    violation: "방송에서 출연자들이 외모 비하 및 차별적 표현을 사용하고, 이를 통해 상품을 판매하는 내용을 방송.",
    regulation: "상품소개 및 판매방송 심의에 관한 규정 제32조의2(인권보호) 제2항, 제33조(차별금지 등) 제2항",
    decision: "의견진술",
    source: "builtin",
  },
  {
    program: "GS SHOP",
    violation: "방송에서 여행 상품의 조건 및 가격에 대해 중요한 정보를 충분히 고지하지 않고, 일부 사실만을 강조하여 시청자를 오인케 하는 내용을 방송.",
    regulation: "상품소개 및 판매방송 심의에 관한 규정 제5조(일반원칙) 제4항, 제57조(여행·관광등) 제2항",
    decision: "권고",
    source: "builtin",
  },
  {
    program: "홈앤쇼핑",
    violation: "방송에서 상품의 성능 시연 실험 결과를 과장하거나 실험 조건을 명확하게 제시하지 않아 시청자를 오인케 하는 내용을 방송.",
    regulation: "상품소개 및 판매방송 심의에 관한 규정 제35조(실연·실험·조사) 제2항",
    decision: "주의",
    source: "builtin",
  },
  {
    program: "현대홈쇼핑",
    violation: "방송에서 제품 실험 결과를 과장하여 표현하고, 실험의 조건 및 한계를 충분히 고지하지 않아 시청자를 오인케 하는 내용을 방송.",
    regulation: "상품소개 및 판매방송 심의에 관한 규정 제35조(실연·실험·조사) 제2항",
    decision: "주의",
    source: "builtin",
  },
  {
    program: "NS홈쇼핑",
    violation: "방송에서 제품의 효능을 보여주는 실험을 실시하면서 실험 조건을 명확히 제시하지 않고, 결과를 과장하여 방송.",
    regulation: "상품소개 및 판매방송 심의에 관한 규정 제35조(실연·실험·조사) 제2항",
    decision: "주의",
    source: "builtin",
  },
  {
    program: "CJ온스타일",
    violation: "방송에서 상품 실험 영상을 보여주면서 실험 조건 및 결과에 대한 정확한 정보를 제공하지 않고, 과장하여 방송.",
    regulation: "상품소개 및 판매방송 심의에 관한 규정 제35조(실연·실험·조사) 제2항",
    decision: "주의",
    source: "builtin",
  },
  {
    program: "롯데원TV",
    violation: "방송에서 화장품의 효능에 대해 의약품 수준의 효과가 있는 것처럼 표현하거나, 인체 적용 실험 결과를 과장하여 시청자를 오인케 하는 내용을 방송.",
    regulation: "상품소개 및 판매방송 심의에 관한 규정 제53조(화장품) 제3항 제1호",
    decision: "주의",
    source: "builtin",
  },
  {
    program: "GS SHOP",
    violation: "방송에서 건강기능식품의 효능에 대해 객관적인 근거 없이 과장하거나, 의약품으로 오인될 수 있는 표현을 사용하여 시청자를 오인케 하는 내용을 방송.",
    regulation: "상품소개 및 판매방송 심의에 관한 규정 제5조(일반원칙) 제3항",
    decision: "의견진술",
    source: "builtin",
  },
  {
    program: "홈앤쇼핑",
    violation: "방송에서 다이어트 보조 식품의 효능에 대해 검증되지 않은 내용을 방송하거나, 과장된 체험 사례를 제시하여 시청자를 오인케 하는 내용을 방송.",
    regulation: "상품소개 및 판매방송 심의에 관한 규정 제5조(일반원칙) 제3항",
    decision: "의견진술",
    source: "builtin",
  },
  {
    program: "현대홈쇼핑",
    violation: "방송에서 피부 개선 화장품의 효능을 과장하거나, 임상 결과를 오인하게 표현하여 시청자를 오인케 하는 내용을 방송.",
    regulation: "상품소개 및 판매방송 심의에 관한 규정 제5조(일반원칙) 제3항",
    decision: "의견진술",
    source: "builtin",
  },
  {
    program: "NS홈쇼핑",
    violation: "방송에서 건강보조식품의 의약품 수준 효능을 암시하는 표현을 사용하면서 중요 주의사항을 충분히 고지하지 않아 시청자를 오인케 하는 내용을 방송.",
    regulation: "상품소개 및 판매방송 심의에 관한 규정 제5조(일반원칙) 제3항",
    decision: "의견진술",
    source: "builtin",
  },
  {
    program: "CJ온스타일",
    violation: "방송에서 노화 방지 화장품의 효능에 대해 검증되지 않은 과장된 표현을 사용하여 시청자를 오인케 하는 내용을 방송.",
    regulation: "상품소개 및 판매방송 심의에 관한 규정 제5조(일반원칙) 제3항",
    decision: "의견진술",
    source: "builtin",
  },
];

export function getBroadcastCaseSummary(): string {
  const decisionCounts: Record<string, number> = {};
  const regulationCounts: Record<string, number> = {};

  for (const c of BUILTIN_BROADCAST_CASES) {
    decisionCounts[c.decision] = (decisionCounts[c.decision] || 0) + 1;
    const regKey = c.regulation.match(/제\d+조[^\s,]*/)?.[0] || c.regulation;
    regulationCounts[regKey] = (regulationCounts[regKey] || 0) + 1;
  }

  const lines = [
    "\n\n=== 방송심의 의결 사례 DB ===",
    `총 ${BUILTIN_BROADCAST_CASES.length}건의 심의 사례`,
    "",
    "【의결 유형별 현황】",
    ...Object.entries(decisionCounts).map(([k, v]) => `- ${k}: ${v}건`),
    "",
    "【주요 위반 규정】",
    ...Object.entries(regulationCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([k, v]) => `- ${k}: ${v}건`),
    "",
    "【최근 심의 사례 (상위 10건)】",
    ...BUILTIN_BROADCAST_CASES.slice(0, 10).map(
      (c, i) =>
        `${i + 1}. [${c.decision}] ${c.program}\n   위반: ${c.violation.substring(0, 80)}...\n   규정: ${c.regulation}`
    ),
  ];

  return lines.join("\n");
}
