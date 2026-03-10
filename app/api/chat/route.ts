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

    // Session Cookie lesen
    const cookieStore = await cookies();
    let sessionId = cookieStore.get("sessionId")?.value;

    const isNewSession = !sessionId;

    if (!sessionId) {
      sessionId = crypto.randomUUID();
    }

    // Flow Routing
    let flowiseUrl: string | undefined;

    if (mode === "QUIZ") {
      flowiseUrl = process.env.FLOWISE_QUIZ_URL;
    } 
    else if (mode === "SPARRING") {
      flowiseUrl = process.env.FLOWISE_SPARRING_URL;
    } 
    else {
      flowiseUrl = process.env.FLOWISE_RAG_URL;
    }

    if (!flowiseUrl) {
      throw new Error("Flowise URL nicht konfiguriert.");
    }

    // Anfrage an Flowise
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

    // Flowise Response normalisieren
    const text =
      data?.text ??
      data?.response ??
      data?.answer ??
      "Keine Antwort erhalten.";

    const sources =
      data?.sourceDocuments ??
      data?.json?.sourceDocuments ??
      data?.metadata?.sourceDocuments ??
      [];

    const response = NextResponse.json({
      text,
      sources,
    });

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