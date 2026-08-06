import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { BUILTIN_BROADCAST_CASES } from "@/lib/broadcastCasesData";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { violation } = await req.json();
    if (!violation) {
      return NextResponse.json({ error: "위반 내용을 입력해주세요." }, { status: 400 });
    }

    const caseExamples = BUILTIN_BROADCAST_CASES.slice(0, 20)
      .map(
        (c, i) =>
          `사례 ${i + 1}. [의결: ${c.decision}]\n프로그램: ${c.program}\n위반내용: ${c.violation.substring(0, 200)}\n관련규정: ${c.regulation}`
      )
      .join("\n\n");

    const systemPrompt = `당신은 방송통신심의위원회의 「상품소개 및 판매방송 심의에 관한 규정」 전문가입니다.
아래 과거 심의 사례들을 바탕으로, 새로운 위반 내용에 대해 어떤 규정이 적용되고 어떤 의결이 예상되는지 분석하세요.

의결 유형:
- 문제없음: 규정 위반이 없거나 경미한 경우
- 의견제시: 개선이 필요하나 제재까지는 아닌 경우
- 권고: 규정 위반이 있으나 경미한 경우
- 주의: 규정 위반이 명확한 경우
- 의견진술: 중대한 위반으로 당사자 의견진술이 필요한 경우
- 경고: 심각한 위반
- 과태료/과징금: 법적 제재가 필요한 경우

과거 심의 사례:
${caseExamples}

분석 형식 (반드시 아래 형식으로 답변):
**예상 관련 규정:** [조항명과 번호]
**예상 의결:** [의결 유형]
**근거:** [유사 사례 및 판단 이유]
**유사 사례:** [가장 유사한 과거 사례 1-2개]`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `다음 위반 내용에 대해 예상 규정 적용과 의결을 분석해주세요:\n\n${violation}`,
        },
      ],
    });

    const analysis = response.content[0].type === "text" ? response.content[0].text : "";
    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("broadcast-predict error:", error);
    return NextResponse.json({ error: "분석 실패" }, { status: 500 });
  }
}
