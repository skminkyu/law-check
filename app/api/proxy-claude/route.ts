import { NextRequest, NextResponse } from "next/server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  try {
    const { apiKey, prompt, model = "claude-sonnet-4-6", max_tokens = 2048 } = await req.json();

    if (!apiKey || !prompt) {
      return NextResponse.json(
        { error: "apiKey와 prompt가 필요합니다." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status, headers: CORS_HEADERS });
    }

    return NextResponse.json(data, { headers: CORS_HEADERS });
  } catch (e) {
    return NextResponse.json(
      { error: String(e) },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
