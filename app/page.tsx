"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  role: "user" | "assistant";
  content: string;
  category?: string;
  categoryLabel?: string;
}

const EXAMPLE_QUESTIONS = [
  "화장품 1차 포장에 표시사항을 기재하지 않으면 행정처분이 어떻게 되나요?",
  "식품 표시광고 위반 시 행정처분 기준이 어떻게 되나요?",
  "건강기능식품 허위광고 행정처분 기준을 알려주세요",
  "의료기기 허가 없이 판매하면 어떤 행정처분을 받나요?",
  "의약외품 표시 위반 시 1차, 2차, 3차 처분은 무엇인가요?",
];

const CATEGORY_COLORS: Record<string, string> = {
  화장품: "bg-pink-100 text-pink-700",
  식품표시광고: "bg-green-100 text-green-700",
  건강기능식품: "bg-emerald-100 text-emerald-700",
  식품위생: "bg-lime-100 text-lime-700",
  의약외품: "bg-blue-100 text-blue-700",
  의료기기: "bg-purple-100 text-purple-700",
  unknown: "bg-gray-100 text-gray-600",
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "안녕하세요! **행정처분 기준 안내 챗봇**입니다.\n\n화장품, 식품, 건강기능식품, 의약외품, 의료기기 관련 **행정처분 기준(1차·2차·3차)**을 안내해 드립니다.\n\n궁금한 위반 사항을 질문해 주세요.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text?: string) {
    const question = text || input.trim();
    if (!question || loading) return;

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: question },
    ];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();

      if (data.error) {
        setMessages([
          ...newMessages,
          { role: "assistant", content: `오류: ${data.error}` },
        ]);
      } else {
        setMessages([
          ...newMessages,
          {
            role: "assistant",
            content: data.message,
            category: data.category,
            categoryLabel: data.categoryLabel,
          },
        ]);
      }
    } catch {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "네트워크 오류가 발생했습니다. 다시 시도해 주세요.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            법
          </div>
          <div>
            <h1 className="text-base font-semibold text-gray-900">
              행정처분 기준 안내 챗봇
            </h1>
            <p className="text-xs text-gray-500">
              화장품 · 식품 · 건강기능식품 · 의약외품 · 의료기기
            </p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2 mt-1 shrink-0">
                  법
                </div>
              )}
              <div
                className={`max-w-[80%] ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm"
                    : "bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-800 shadow-sm"
                }`}
              >
                {msg.role === "assistant" && msg.categoryLabel && msg.category !== "unknown" && (
                  <div className="mb-2">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        CATEGORY_COLORS[msg.category || "unknown"]
                      }`}
                    >
                      {msg.categoryLabel}
                    </span>
                  </div>
                )}
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-gray-200 [&_th]:bg-gray-50 [&_th]:p-2 [&_td]:border [&_td]:border-gray-200 [&_td]:p-2">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2 mt-1 shrink-0">
                법
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1.5 items-center h-5">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Example questions */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2">
          <div className="max-w-3xl mx-auto">
            <p className="text-xs text-gray-400 mb-2">예시 질문</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  className="text-xs bg-white border border-gray-200 text-gray-600 rounded-full px-3 py-1.5 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="max-w-3xl mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="위반 사항을 입력하세요 (예: 화장품 표시사항 미기재 행정처분)"
            className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            disabled={loading}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            전송
          </button>
        </div>
      </div>
    </div>
  );
}
