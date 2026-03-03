import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { message, mode } = await req.json();

    if (!message || !mode) {
      return NextResponse.json(
        { text: "Ungültige Anfrage." },
        { status: 400 }
      );
    }

    // 🔹 Session Handling (stabil pro User)
    const cookieStore = cookies();
    let sessionId = cookieStore.get("sessionId")?.value;

    if (!sessionId) {
      sessionId = crypto.randomUUID();
    }

    // 🔹 Flow Routing
    const flowiseUrl =
      mode === "QUIZ"
        ? process.env.FLOWISE_QUIZ_URL
        : process.env.FLOWISE_RAG_URL;

    if (!flowiseUrl) {
      throw new Error("Flowise URL nicht konfiguriert.");
    }

    // 🔹 Request an Flowise
    const flowiseRes = await fetch(flowiseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: message,
        overrideConfig: {
          sessionId: sessionId,
        },
      }),
    });

    if (!flowiseRes.ok) {
      throw new Error("Flowise Antwortfehler");
    }

    const data = await flowiseRes.json();

    return NextResponse.json({
      text: data.text ?? data.response ?? "Keine Antwort erhalten.",
    });

  } catch (err) {
    console.error("API ERROR:", err);
    return NextResponse.json(
      { text: "Interner Serverfehler." },
      { status: 500 }
    );
  }
}