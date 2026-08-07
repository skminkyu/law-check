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

type TabType = "chat" | "history" | "broadcast";

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

  // Broadcast cases state
  const [broadcastCases, setBroadcastCases] = useState<{ program: string; broadcast_date?: string; violation: string; regulation: string; decision: string; source?: string }[]>([]);
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [broadcastSearch, setBroadcastSearch] = useState("");
  const [broadcastDecision, setBroadcastDecision] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ program: "", violation: "", regulation: "", decision: "권고" });
  const [addLoading, setAddLoading] = useState(false);
  const [showPredict, setShowPredict] = useState(false);
  const [predictInput, setPredictInput] = useState("");
  const [predictResult, setPredictResult] = useState("");
  const [predictLoading, setPredictLoading] = useState(false);
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

  const LOCAL_QA_KEY = "userQAHistory";

  function getLocalQA() {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_QA_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function saveLocalQA(item: { category: string; question: string; answer: string; id: string; created_at: string }) {
    try {
      const existing = getLocalQA();
      localStorage.setItem(LOCAL_QA_KEY, JSON.stringify([item, ...existing]));
    } catch { /* storage unavailable */ }
  }

  async function saveMessage(msg: Message, question: string) {
    if (!msg.id || savedIds.has(msg.id)) return;
    setSavingId(msg.id);
    try {
      const localItem = {
        id: msg.id,
        category: msg.category || "unknown",
        question,
        answer: msg.content,
        created_at: new Date().toISOString(),
      };
      saveLocalQA(localItem);

      const res = await fetch("/api/save-qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: msg.category || "unknown",
          question,
          answer: msg.content,
        }),
      });
      if (!res.ok) {
        console.warn("Supabase 저장 실패, localStorage에만 저장됨");
      }
      setSavedIds((prev) => new Set([...prev, msg.id!]));
    } catch {
      setSavedIds((prev) => new Set([...prev, msg.id!]));
    } finally {
      setSavingId(null);
    }
  }

  function deleteLocalQA(id: string | number) {
    try {
      const existing = getLocalQA();
      localStorage.setItem(LOCAL_QA_KEY, JSON.stringify(existing.filter((i: { id: string | number }) => i.id !== id)));
    } catch { /* storage unavailable */ }
  }

  async function deleteHistory(id: string | number) {
    deleteLocalQA(id);
    try {
      await fetch(`/api/save-qa?id=${id}`, { method: "DELETE" });
    } catch { /* ignore API errors */ }
    setHistoryItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const params = new URLSearchParams();
      if (historySearch) params.set("q", historySearch);
      if (historyCategory !== "all") params.set("category", historyCategory);
      const res = await fetch(`/api/search-qa?${params}`);
      const data = await res.json();
      const apiResults: typeof historyItems = data.results || [];

      const localItems: typeof historyItems = getLocalQA();
      const q = (historySearch || "").toLowerCase();
      const extra = localItems.filter((lc) => {
        if (apiResults.some((ar) => ar.id === lc.id)) return false;
        if (historyCategory !== "all" && lc.category !== historyCategory) return false;
        if (q && !lc.question?.toLowerCase().includes(q) && !lc.answer?.toLowerCase().includes(q)) return false;
        return true;
      });

      setHistoryItems([...apiResults, ...extra]);
    } catch {
      setHistoryItems(getLocalQA());
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    if (activeTab === "history") loadHistory();
    if (activeTab === "broadcast") loadBroadcastCases();
  }, [activeTab, historyCategory]);

  const LOCAL_CASES_KEY = "userBroadcastCases";

  function getLocalCases() {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_CASES_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function saveLocalCase(c: { program: string; violation: string; regulation: string; decision: string }) {
    try {
      const existing: typeof broadcastCases = getLocalCases();
      const newCase = { ...c, source: "user" as const, id: `local_${Date.now()}` };
      localStorage.setItem(LOCAL_CASES_KEY, JSON.stringify([newCase, ...existing]));
    } catch { /* storage unavailable */ }
  }

  async function loadBroadcastCases() {
    setBroadcastLoading(true);
    try {
      const params = new URLSearchParams();
      if (broadcastSearch) params.set("q", broadcastSearch);
      if (broadcastDecision !== "all") params.set("decision", broadcastDecision);
      const res = await fetch(`/api/broadcast-cases?${params}`);
      const data = await res.json();
      const apiCases: typeof broadcastCases = data.cases || [];

      // Merge localStorage cases, skipping duplicates already returned by API
      const localCases: typeof broadcastCases = getLocalCases();
      const extra = localCases.filter(
        (lc) => !apiCases.some((ac) => ac.program === lc.program && ac.violation === lc.violation)
      );
      const q = (broadcastSearch || "").toLowerCase();
      const filtered = extra.filter((c) => {
        if (q && !c.violation.toLowerCase().includes(q) && !c.program.toLowerCase().includes(q) && !c.regulation.toLowerCase().includes(q)) return false;
        if (broadcastDecision !== "all" && c.decision !== broadcastDecision) return false;
        return true;
      });

      setBroadcastCases([...apiCases, ...filtered]);
    } catch {
      // API 실패 시 localStorage만으로 표시
      setBroadcastCases(getLocalCases());
    } finally {
      setBroadcastLoading(false);
    }
  }

  async function addBroadcastCase() {
    if (!addForm.program || !addForm.violation || !addForm.regulation || !addForm.decision) return;
    setAddLoading(true);
    try {
      // localStorage에 먼저 저장 (Supabase 성패와 무관하게 보존)
      saveLocalCase(addForm);
      await fetch("/api/broadcast-cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      setAddForm({ program: "", violation: "", regulation: "", decision: "권고" });
      setShowAddForm(false);
      loadBroadcastCases();
    } catch {
      alert("저장 실패");
    } finally {
      setAddLoading(false);
    }
  }

  async function predictDecision() {
    if (!predictInput.trim()) return;
    setPredictLoading(true);
    setPredictResult("");
    try {
      const res = await fetch("/api/broadcast-predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ violation: predictInput }),
      });
      const data = await res.json();
      setPredictResult(data.analysis || data.error || "분석 실패");
    } catch {
      setPredictResult("네트워크 오류");
    } finally {
      setPredictLoading(false);
    }
  }

  const getLastUserMessage = (idx: number): string => {
    for (let i = idx - 1; i >= 0; i--) {
      if (messages[i].role === "user") return messages[i].content;
    }
    return "";
  };

  return (
    <div className="flex flex-col bg-gray-50" style={{ height: "100dvh" }}>
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
            <button
              onClick={() => setActiveTab("broadcast")}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${activeTab === "broadcast" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              📺 방송심의
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

      {/* Broadcast Tab */}
      {activeTab === "broadcast" && (
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="max-w-3xl mx-auto space-y-4">
            {/* Predict panel */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-indigo-800">🔮 의결 예측</h2>
                <button onClick={() => setShowPredict(!showPredict)} className="text-xs text-indigo-600 hover:text-indigo-800">
                  {showPredict ? "닫기" : "위반내용 입력하여 예측"}
                </button>
              </div>
              {showPredict && (
                <div className="space-y-2">
                  <textarea
                    value={predictInput}
                    onChange={(e) => setPredictInput(e.target.value)}
                    placeholder="위반 내용을 입력하세요. 예: 쇼호스트가 건강기능식품을 소개하면서 의약품 수준의 효능을 암시하는 표현을 사용하였고..."
                    rows={4}
                    className="w-full border border-indigo-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                  <button
                    onClick={predictDecision}
                    disabled={!predictInput.trim() || predictLoading}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-40"
                  >
                    {predictLoading ? "분석 중..." : "예측 분석"}
                  </button>
                  {predictResult && (
                    <div className="bg-white border border-indigo-200 rounded-lg p-3 mt-2 prose prose-sm max-w-none [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-gray-200 [&_th]:bg-gray-50 [&_th]:p-2 [&_td]:border [&_td]:border-gray-200 [&_td]:p-2 text-gray-800 overflow-visible">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{predictResult}</ReactMarkdown>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Search & filter */}
            <div className="flex gap-2">
              <input
                type="text"
                value={broadcastSearch}
                onChange={(e) => setBroadcastSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") loadBroadcastCases(); }}
                placeholder="방송사, 위반내용, 규정 검색..."
                className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <select
                value={broadcastDecision}
                onChange={(e) => { setBroadcastDecision(e.target.value); }}
                className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="all">전체 의결</option>
                {["문제없음", "의견제시", "권고", "주의", "의견진술", "경고"].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <button onClick={loadBroadcastCases} className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700">검색</button>
            </div>

            {/* Add case button */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">총 {broadcastCases.length}건</p>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="text-xs bg-white border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700"
              >
                + 사례 추가
              </button>
            </div>

            {/* Add form */}
            {showAddForm && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
                <h3 className="text-sm font-semibold text-gray-800">새 심의 사례 추가</h3>
                <input
                  placeholder="프로그램명 (방송사 + 프로그램명)"
                  value={addForm.program}
                  onChange={(e) => setAddForm({ ...addForm, program: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <textarea
                  placeholder="주요 위반내용"
                  value={addForm.violation}
                  onChange={(e) => setAddForm({ ...addForm, violation: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  placeholder="관련 규정 (예: 제5조(일반원칙) 제3항)"
                  value={addForm.regulation}
                  onChange={(e) => setAddForm({ ...addForm, regulation: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <select
                  value={addForm.decision}
                  onChange={(e) => setAddForm({ ...addForm, decision: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {["문제없음", "의견제시", "권고", "주의", "의견진술", "경고", "과태료", "과징금"].map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button onClick={addBroadcastCase} disabled={addLoading}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-40">
                    {addLoading ? "저장 중..." : "저장"}
                  </button>
                  <button onClick={() => setShowAddForm(false)} className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">취소</button>
                </div>
              </div>
            )}

            {/* Cases list */}
            {broadcastLoading ? (
              <div className="text-center py-12 text-gray-400 text-sm">불러오는 중...</div>
            ) : broadcastCases.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">검색 결과가 없습니다.</div>
            ) : (
              <div className="space-y-3">
                {broadcastCases.map((c, i) => {
                  const decisionColor: Record<string, string> = {
                    "문제없음": "bg-green-100 text-green-700",
                    "의견제시": "bg-blue-100 text-blue-700",
                    "권고": "bg-yellow-100 text-yellow-700",
                    "주의": "bg-orange-100 text-orange-700",
                    "의견진술": "bg-red-100 text-red-700",
                    "경고": "bg-red-200 text-red-800",
                  };
                  return (
                    <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{c.program}</p>
                          {c.broadcast_date && <p className="text-xs text-gray-400 mt-0.5">{c.broadcast_date}</p>}
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${decisionColor[c.decision] || "bg-gray-100 text-gray-600"}`}>
                            {c.decision}
                          </span>
                          {c.source === "user" && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">직접입력</span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-indigo-600 font-medium mb-1">{c.regulation}</p>
                      <details className="cursor-pointer">
                        <summary className="text-xs text-gray-500 hover:text-gray-700">위반 내용 보기</summary>
                        <p className="mt-2 text-xs text-gray-600 leading-relaxed">{c.violation}</p>
                      </details>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
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
                      <button
                        onClick={() => deleteHistory(item.id)}
                        className="ml-auto text-xs text-red-400 hover:text-red-600 px-2 py-0.5 rounded hover:bg-red-50 transition-colors"
                      >
                        삭제
                      </button>
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
