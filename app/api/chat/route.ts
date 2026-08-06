import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { classifyCategory, CATEGORY_LABELS, ENFORCEMENT_DECREE_MAP, LawCategory } from "@/lib/classifier";
import { searchLaw, getLawTextByName } from "@/lib/lawApi";
import { getRelevantKnowledge } from "@/lib/qaKnowledge";
import { getDispositionData } from "@/lib/dispositionData";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `당신은 SK스토아 품질관리팀(QA)의 법규 자문 챗봇입니다.
다음 두 가지 지식을 활용해 답변합니다:
1. SK스토아 QA 가이드북 내용 (서류QA 기준, 표시 기준, QA 업무 절차 등)
2. 국가 법령 데이터 (행정처분 기준, 관련 법령 조문)

답변 원칙:
- SK스토아 QA 가이드북 내용이 제공된 경우, 해당 내용을 우선적으로 활용해 답변하세요.
- 행정처분 기준 질문에는 반드시 1차·2차·3차 처분을 표로 정리하세요.
- 서류 기준, 표시 기준, QA 절차 질문에는 가이드북 내용을 구체적으로 인용하세요.
- 항상 한국어로 답변하세요.

⚠️ 조문 내용 답변 원칙 (최우선 준수):
- 시스템 컨텍스트에 "행정처분 기준 (법령 내장 데이터)" 섹션이 제공됩니다.
- 해당 섹션에 조문 전문(제X조 내용)이 포함되어 있으면, 그 내용을 그대로 인용하여 답변하세요.
- 절대로 "조문 내용이 포함되어 있지 않다", "확인이 어렵다", "외부에서 확인하라"고 답변하지 마세요.
- 조문 번호(제5조 등)를 질문받으면 내장 데이터에서 해당 조문을 찾아 전문을 제공하세요.
- 예: "제5조(일반원칙) ① 상품소개 및 판매방송은..." 형식으로 원문을 직접 인용하세요.

행정처분 기준 답변 형식:
**위반 행위:** [내용]
**근거 법령:** [법령명 조항]

| 구분 | 처분 내용 |
|------|----------|
| 1차 위반 | |
| 2차 위반 | |
| 3차 위반 | |`;

export async function POST(req: NextRequest) {
  try {
    const { messages, forcedCategory } = await req.json();
    const lastMessage = messages[messages.length - 1].content as string;

    const category: LawCategory = forcedCategory || classifyCategory(lastMessage);
    const categoryLabel = CATEGORY_LABELS[category];
    const lawNames = category !== "unknown" ? ENFORCEMENT_DECREE_MAP[category] : [];

    // 1. SK스토아 QA 가이드북에서 관련 내용 추출
    const qaKnowledge = getRelevantKnowledge(lastMessage);

    // 2. 국가법령 API 조회
    let lawContext = "";
    if (lawNames.length > 0) {
      try {
        const searchResults = await searchLaw(lawNames[0]);
        if (searchResults.length > 0) {
          const lawText = await getLawTextByName(lawNames[0]);
          const truncated = lawText.substring(0, 10000);
          lawContext = `\n\n=== 국가법령 데이터: ${lawNames[0]} ===\n${truncated}`;
        }
      } catch (e) {
        console.error(`법령 API 오류: ${e}`);
      }
    }

    const contextNote = category !== "unknown"
      ? `\n\n[분류된 법령 카테고리: ${categoryLabel}]`
      : "";

    const dispositionContext = category !== "unknown" ? getDispositionData(category) : "";
    const fullSystem = SYSTEM_PROMPT + contextNote + dispositionContext + qaKnowledge + lawContext;

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: fullSystem,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const assistantMessage = response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ message: assistantMessage, category, categoryLabel });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
