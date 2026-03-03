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

    const cookieStore = await cookies();
    let sessionId = cookieStore.get("sessionId")?.value;

    const isNewSession = !sessionId;

    if (!sessionId) {
      sessionId = crypto.randomUUID();
    }

    const flowiseUrl =
      mode === "QUIZ"
        ? process.env.FLOWISE_QUIZ_URL
        : process.env.FLOWISE_RAG_URL;

    if (!flowiseUrl) {
      throw new Error("Flowise URL nicht konfiguriert.");
    }

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

    const response = NextResponse.json({
      text: data.text ?? data.response ?? "Keine Antwort erhalten.",
    });

    // 🔥 WICHTIG: Cookie setzen wenn neu
    if (isNewSession) {
      response.cookies.set("sessionId", sessionId, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });
    }

    return response;

  } catch (err) {
    console.error("API ERROR:", err);
    return NextResponse.json(
      { text: "Interner Serverfehler." },
      { status: 500 }
    );
  }
}