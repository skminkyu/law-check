import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { classifyCategory, CATEGORY_LABELS, ENFORCEMENT_DECREE_MAP } from "@/lib/classifier";
import { searchLaw, getLawTextByName } from "@/lib/lawApi";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `당신은 한국 행정처분 기준 전문 챗봇입니다.
다음 법령에 따른 행정처분 기준(1차, 2차, 3차 위반 시 처분)을 안내합니다:
- 화장품법 (화장품)
- 식품 등의 표시·광고에 관한 법률 (식품 표시·광고)
- 건강기능식품에 관한 법률 (건강기능식품)
- 식품위생법 (식품위생)
- 약사법 (의약외품)
- 의료기기법 (의료기기)

법령 본문을 제공받으면, 해당 내용에서 위반 사항에 대한 행정처분 기준을 찾아 아래 형식으로 안내하세요:

**위반 행위:** [위반 내용]
**근거 법령:** [법령명 조항]

| 구분 | 처분 내용 |
|------|----------|
| 1차 위반 | |
| 2차 위반 | |
| 3차 위반 | |

처분 내용이 별표에 규정된 경우 별표 내용을 찾아서 안내하세요.
법령 본문에 해당 내용이 없으면 "법령 본문에서 해당 위반 사항의 행정처분 기준을 찾지 못했습니다"라고 안내하고, 일반적인 관련 정보를 제공하세요.
항상 한국어로 답변하세요.`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1].content as string;

    // 카테고리 분류
    const category = classifyCategory(lastMessage);
    const categoryLabel = CATEGORY_LABELS[category];
    const lawNames = category !== "unknown" ? ENFORCEMENT_DECREE_MAP[category] : [];

    // 법령 본문 조회
    let lawContext = "";
    if (lawNames.length > 0) {
      try {
        // 시행규칙 검색 (행정처분 별표 포함)
        const searchResults = await searchLaw(lawNames[0]);
        if (searchResults.length > 0) {
          const lawText = await getLawTextByName(lawNames[0]);
          // JSON에서 핵심 부분만 추출 (토큰 절약)
          const truncated = lawText.substring(0, 15000);
          lawContext = `\n\n[${lawNames[0]} 법령 본문 (일부)]\n${truncated}`;
        }
      } catch {
        lawContext = "";
      }
    }

    // 카테고리 정보를 시스템 메시지에 추가
    const contextNote = category !== "unknown"
      ? `\n\n[분류된 법령 카테고리: ${categoryLabel}]`
      : "\n\n[법령 카테고리를 특정할 수 없습니다. 화장품, 식품, 건강기능식품, 의약외품, 의료기기 중 해당 분야를 질문에 포함해 주세요.]";

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: SYSTEM_PROMPT + contextNote + lawContext,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const assistantMessage = response.content[0].type === "text"
      ? response.content[0].text
      : "";

    return NextResponse.json({
      message: assistantMessage,
      category: category,
      categoryLabel: categoryLabel,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
