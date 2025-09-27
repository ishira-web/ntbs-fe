import React, { useState, useRef } from "react";
import { MessageCircle, X } from "lucide-react"; // npm install lucide-react

function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const controllerRef = useRef(null);

  async function sendMessage() {
    if (!input.trim()) return;
    const newHistory = [...history, { role: "user", content: input }];
    setHistory(newHistory);
    setInput("");

    setStreaming(true);
    controllerRef.current = new AbortController();

    try {
      const res = await fetch("http://localhost:5000/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controllerRef.current.signal,
        body: JSON.stringify({
          messages: newHistory,
          temperature: 0.3,
          max_tokens: 500,
          stream: true,
        }),
      });

      if (!res.body) {
        setHistory([...newHistory, { role: "assistant", content: "(no response)" }]);
        setStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let partial = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim().startsWith("data:")) continue;
          const payload = line.replace("data:", "").trim();
          if (payload === "[DONE]") continue;

          try {
            const json = JSON.parse(payload);
            const delta = json?.choices?.[0]?.delta?.content ?? "";
            if (delta) {
              partial += delta;
              setHistory((cur) => {
                if (cur.length && cur[cur.length - 1].role === "assistant") {
                  const updated = [...cur];
                  updated[updated.length - 1] = { role: "assistant", content: partial };
                  return updated;
                }
                return [...cur, { role: "assistant", content: partial }];
              });
            }
          } catch {
            // ignore streaming noise
          }
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
      setHistory((cur) => [
        ...cur,
        { role: "assistant", content: "⚠️ Connection error. Please try again." },
      ]);
    }

    setStreaming(false);
  }

  function stopStreaming() {
    controllerRef.current?.abort();
    setStreaming(false);
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 rounded-full bg-blue-600 text-white p-4 shadow-lg hover:bg-blue-700"
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Chat popup */}
      {open && (
        <div className="fixed bottom-20 right-6 w-80 md:w-96 bg-white border rounded-lg shadow-xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between bg-blue-600 text-white px-4 py-2 rounded-t-lg">
            <h2 className="font-semibold text-sm">💊 Health Assistant</h2>
            <button onClick={() => setOpen(false)}><X size={18} /></button>
          </div>

          {/* Chat history */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
            {history.map((m, i) => (
              <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                <div
                  className={`inline-block px-3 py-2 rounded-lg text-sm ${
                    m.role === "user" ? "bg-blue-200" : "bg-green-100"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {streaming && (
              <div className="text-left">
                <div className="inline-block px-3 py-2 rounded-lg bg-green-50 text-sm">...</div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex gap-2 border-t p-2">
            <input
              className="flex-1 border rounded px-2 py-1 text-sm"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a health question..."
            />
            <button
              onClick={sendMessage}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
              disabled={streaming}
            >
              Send
            </button>
            {streaming && (
              <button onClick={stopStreaming} className="px-2 py-1 border rounded text-sm">
                Stop
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default ChatAssistant;
