"use client";

import { useState } from "react";

type Mode = "QUIZ" | "LERNEN" | "SPARRING";
type ChatMsg = { role: "user" | "assistant"; text: string };

function cleanValue(value: unknown): string | null {
  if (!value) return null;

  let cleaned = String(value);
  cleaned = cleaned.replace(/_/g, " ");
  cleaned = cleaned.trim();

  return cleaned.length > 0 ? cleaned : null;
}

export default function Home() {
  const [mode, setMode] = useState<Mode>("LERNEN");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(false);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          mode,
        }),
      });

      const data = await res.json();

      const answer: string =
        data?.text ??
        data?.answer ??
        data?.response ??
        "Keine Antwort erhalten.";

      let sourcesText = "";

      const rawSources = data?.sources ?? data?.sourceDocuments ?? [];

      if (mode === "LERNEN" && Array.isArray(rawSources) && rawSources.length > 0) {
        const uniqueSources = Array.from(
          new Map(
            rawSources.map((s: any) => {
              const metadata = s?.metadata ?? {};

              const documentName =
                cleanValue(metadata.document) ??
                cleanValue(metadata.source) ??
                cleanValue(metadata.type) ??
                "Dokument";

              const page =
                metadata?.page ??
                metadata?.pageNumber ??
                metadata?.loc?.pageNumber ??
                null;

              const line =
                metadata?.loc?.lines?.from ??
                null;

              const positionLabel =
                page !== null
                  ? `Seite ${page}`
                  : line !== null
                  ? `Zeile ${line}`
                  : "ohne Positionsangabe";

              const key = `${documentName}-${positionLabel}`;

              return [
                key,
                {
                  source: documentName,
                  positionLabel,
                },
              ];
            })
          ).values()
        ).slice(0, 3);

        sourcesText =
          "\n\nQuellen:\n" +
          uniqueSources
            .map((s: any) => `• ${s.source} (${s.positionLabel})`)
            .join("\n");
      }

      setMessages((m) => [
        ...m,
        { role: "assistant", text: answer + sourcesText },
      ]);
    } catch {
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
            Tippe eine Frage und sende sie. (LERNEN zeigt Quellen.)
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <b>{msg.role === "user" ? "Du" : "Bot"}:</b>{" "}
              <span>{msg.text}</span>
            </div>
          ))
        )}

        {loading && <div style={{ opacity: 0.7 }}>Antwortet…</div>}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Deine Nachricht…"
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