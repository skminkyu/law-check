import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { classifyCategory, CATEGORY_LABELS, ENFORCEMENT_DECREE_MAP, LawCategory } from "@/lib/classifier";
import { searchLaw, getLawTextByName } from "@/lib/lawApi";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `당신은 한국 식품·화장품·의료기기 분야 법규 전문 자문 챗봇입니다.
다음 법령에 따른 행정처분 기준과 법규를 안내합니다:
- 화장품법 (화장품)
- 식품 등의 표시·광고에 관한 법률 (식품 표시·광고)
- 건강기능식품에 관한 법률 (건강기능식품)
- 식품위생법 (식품위생)
- 약사법 (의약외품)
- 의료기기법 (의료기기)

법령 본문을 제공받으면, 위반 사항에 대한 행정처분 기준을 아래 형식으로 안내하세요:

**위반 행위:** [위반 내용]
**근거 법령:** [법령명 조항]

| 구분 | 처분 내용 |
|------|----------|
| 1차 위반 | |
| 2차 위반 | |
| 3차 위반 | |

행정처분 외에도 표시·광고 기준, 허가·신고 요건 등 법규 일반 질문에도 답변하세요.
처분 내용이 별표에 규정된 경우 별표 내용을 찾아 안내하세요.
항상 한국어로 답변하세요.`;

export async function POST(req: NextRequest) {
  try {
    const { messages, forcedCategory } = await req.json();
    const lastMessage = messages[messages.length - 1].content as string;

    const category: LawCategory = forcedCategory || classifyCategory(lastMessage);
    const categoryLabel = CATEGORY_LABELS[category];
    const lawNames = category !== "unknown" ? ENFORCEMENT_DECREE_MAP[category] : [];

    let lawContext = "";
    if (lawNames.length > 0) {
      try {
        const searchResults = await searchLaw(lawNames[0]);
        if (searchResults.length > 0) {
          const lawText = await getLawTextByName(lawNames[0]);
          const truncated = lawText.substring(0, 15000);
          lawContext = `\n\n[${lawNames[0]} 법령 본문 (일부)]\n${truncated}`;
        }
      } catch {
        lawContext = "";
      }
    }

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

    const assistantMessage = response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ message: assistantMessage, category, categoryLabel });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
