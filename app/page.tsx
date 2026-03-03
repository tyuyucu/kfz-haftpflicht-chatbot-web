"use client";

import { useState } from "react";

export default function Home() {
  const [mode, setMode] = useState<"QUIZ" | "LERNEN" | "SPARRING">("LERNEN");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [loading, setLoading] = useState(false);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setLoading(true);

    const payload = `[MODE:${mode}] ${text}`;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: payload }),
      });

      const data = await res.json();

      // Flowise liefert oft: { text: "..."} oder { answer: "..."} je nach Setup
      const answer =
        data?.text ?? data?.answer ?? data?.response ?? JSON.stringify(data);

      setMessages((m) => [...m, { role: "assistant", text: String(answer) }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "Fehler: Anfrage fehlgeschlagen." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
        Kfz-Haftpflicht Chatbot
      </h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {(["LERNEN", "QUIZ", "SPARRING"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #444",
              background: mode === m ? "#222" : "transparent",
              color: "inherit",
              cursor: "pointer",
            }}
          >
            {m}
          </button>
        ))}
      </div>

      <div
        style={{
          border: "1px solid #333",
          borderRadius: 12,
          padding: 12,
          minHeight: 320,
          marginBottom: 12,
          overflow: "auto",
          whiteSpace: "pre-wrap",
        }}
      >
        {messages.length === 0 ? (
          <div style={{ opacity: 0.7 }}>
            Tippe eine Frage und sende sie. Modus wird als Prefix mitgeschickt.
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <b>{msg.role === "user" ? "Du" : "Bot"}:</b> {msg.text}
            </div>
          ))
        )}
        {loading && <div style={{ opacity: 0.7 }}>Antwort lädt…</div>}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Deine Frage…"
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #444",
            background: "transparent",
            color: "inherit",
          }}
        />
        <button
          onClick={send}
          disabled={loading}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #444",
            background: "#222",
            color: "inherit",
            cursor: "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          Senden
        </button>
      </div>
    </main>
  );
}