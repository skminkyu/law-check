"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CATEGORIES, CATEGORY_LABELS, CATEGORY_COLORS, EXAMPLE_QUESTIONS, LawCategory } from "@/lib/classifier";

interface Message {
  role: "user" | "assistant";
  content: string;
  category?: string;
  categoryLabel?: string;
  id?: string;
}

type TabType = "chat" | "history";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("chat");
  const [selectedCategory, setSelectedCategory] = useState<LawCategory | "all">("all");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "안녕하세요! **법규 자문 챗봇**입니다.\n\n위에서 **분야를 선택**하거나 바로 질문해 주세요.\n\n행정처분 기준(1차·2차·3차)과 표시·광고 법규를 안내해 드립니다.",
      id: "welcome",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [historyItems, setHistoryItems] = useState<{ id: number; category: string; question: string; answer: string; created_at: string }[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [historyCategory, setHistoryCategory] = useState<string>("all");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const examples = selectedCategory === "all"
    ? EXAMPLE_QUESTIONS["all"]
    : EXAMPLE_QUESTIONS[selectedCategory] || EXAMPLE_QUESTIONS["all"];

  async function sendMessage(text?: string) {
    const question = text || input.trim();
    if (!question || loading) return;

    const msgId = Date.now().toString();
    const userMsg: Message = { role: "user", content: question, id: `u-${msgId}` };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          forcedCategory: selectedCategory !== "all" ? selectedCategory : undefined,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setMessages([...newMessages, { role: "assistant", content: `오류: ${data.error}`, id: `a-${msgId}` }]);
      } else {
        setMessages([...newMessages, {
          role: "assistant",
          content: data.message,
          category: data.category,
          categoryLabel: data.categoryLabel,
          id: `a-${msgId}`,
        }]);
      }
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "네트워크 오류가 발생했습니다.", id: `a-${msgId}` }]);
    } finally {
      setLoading(false);
    }
  }

  async function saveMessage(msg: Message, question: string) {
    if (!msg.id || savedIds.has(msg.id)) return;
    setSavingId(msg.id);
    try {
      await fetch("/api/save-qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: msg.category || "unknown",
          question,
          answer: msg.content,
        }),
      });
      setSavedIds((prev) => new Set([...prev, msg.id!]));
    } catch {
      alert("저장 실패");
    } finally {
      setSavingId(null);
    }
  }

  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const params = new URLSearchParams();
      if (historySearch) params.set("q", historySearch);
      if (historyCategory !== "all") params.set("category", historyCategory);
      const res = await fetch(`/api/search-qa?${params}`);
      const data = await res.json();
      setHistoryItems(data.results || []);
    } catch {
      setHistoryItems([]);
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    if (activeTab === "history") loadHistory();
  }, [activeTab, historyCategory]);

  const getLastUserMessage = (idx: number): string => {
    for (let i = idx - 1; i >= 0; i--) {
      if (messages[i].role === "user") return messages[i].content;
    }
    return "";
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0">법</div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-gray-900">법규 자문 챗봇</h1>
            <p className="text-xs text-gray-500">행정처분 기준 · 표시광고 · 법규 안내</p>
          </div>
          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("chat")}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${activeTab === "chat" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              💬 질문
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${activeTab === "history" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              📚 사례 DB
            </button>
          </div>
        </div>

        {/* Category selector */}
        {activeTab === "chat" && (
          <div className="max-w-3xl mx-auto px-4 pb-3">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`shrink-0 text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${selectedCategory === "all" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}
              >
                전체
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`shrink-0 text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${selectedCategory === cat.id ? "bg-indigo-600 text-white border-indigo-600" : `bg-white border-gray-200 text-gray-600 hover:bg-gray-50`}`}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Chat Tab */}
      {activeTab === "chat" && (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map((msg, i) => (
                <div key={msg.id || i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2 mt-1 shrink-0">법</div>
                  )}
                  <div className={`max-w-[82%] ${msg.role === "user" ? "bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm" : "bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-800 shadow-sm"}`}>
                    {msg.role === "assistant" && msg.categoryLabel && msg.category !== "unknown" && (
                      <div className="mb-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[msg.category || "unknown"]}`}>
                          {msg.categoryLabel}
                        </span>
                      </div>
                    )}
                    {msg.role === "assistant" ? (
                      <>
                        <div className="prose prose-sm max-w-none [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-gray-200 [&_th]:bg-gray-50 [&_th]:p-2 [&_td]:border [&_td]:border-gray-200 [&_td]:p-2">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                        </div>
                        {msg.id !== "welcome" && (
                          <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-2">
                            <button
                              onClick={() => saveMessage(msg, getLastUserMessage(i))}
                              disabled={savingId === msg.id || savedIds.has(msg.id!)}
                              className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${savedIds.has(msg.id!) ? "bg-green-50 border-green-200 text-green-600" : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600"}`}
                            >
                              {savedIds.has(msg.id!) ? "✓ 사례 저장됨" : savingId === msg.id ? "저장 중..." : "📌 사례 저장"}
                            </button>
                            <span className="text-xs text-gray-400">팀 Q&A DB에 저장</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2 mt-1 shrink-0">법</div>
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
                  {examples.map((q, i) => (
                    <button key={i} onClick={() => sendMessage(q)}
                      className="text-xs bg-white border border-gray-200 text-gray-600 rounded-full px-3 py-1.5 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-colors">
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
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder={selectedCategory !== "all" ? `${CATEGORY_LABELS[selectedCategory]} 관련 질문을 입력하세요` : "법규 관련 질문을 입력하세요"}
                className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={loading}
              />
              <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
                className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                전송
              </button>
            </div>
          </div>
        </>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="max-w-3xl mx-auto">
            {/* Search bar */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") loadHistory(); }}
                placeholder="과거 사례 검색..."
                className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button onClick={loadHistory} className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
                검색
              </button>
            </div>

            {/* Category filter */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              <button onClick={() => setHistoryCategory("all")}
                className={`shrink-0 text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${historyCategory === "all" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-gray-200 text-gray-600"}`}>
                전체
              </button>
              {CATEGORIES.map((cat) => (
                <button key={cat.id} onClick={() => setHistoryCategory(cat.id)}
                  className={`shrink-0 text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${historyCategory === cat.id ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-gray-200 text-gray-600"}`}>
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>

            {historyLoading ? (
              <div className="text-center py-12 text-gray-400 text-sm">불러오는 중...</div>
            ) : historyItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-sm">저장된 사례가 없습니다.</p>
                <p className="text-gray-400 text-xs mt-1">챗봇 답변에서 &quot;📌 사례 저장&quot;을 눌러 DB에 쌓아보세요.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {historyItems.map((item) => (
                  <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[item.category] || "bg-gray-100 text-gray-600"}`}>
                        {CATEGORY_LABELS[item.category as LawCategory] || item.category}
                      </span>
                      <span className="text-xs text-gray-400">{new Date(item.created_at).toLocaleDateString("ko-KR")}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-800 mb-2">Q. {item.question}</p>
                    <details className="cursor-pointer">
                      <summary className="text-xs text-indigo-600 hover:text-indigo-800">답변 보기</summary>
                      <div className="mt-2 pt-2 border-t border-gray-100 prose prose-sm max-w-none [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-gray-200 [&_th]:bg-gray-50 [&_th]:p-2 [&_td]:border [&_td]:border-gray-200 [&_td]:p-2 text-gray-700">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.answer}</ReactMarkdown>
                      </div>
                    </details>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
