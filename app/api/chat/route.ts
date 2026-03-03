import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    const flowiseRes = await fetch(process.env.FLOWISE_API_URL!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: message,
        chatHistory: [],
      }),
    });

    const data = await flowiseRes.json();

    // Flowise liefert text zurück
    return NextResponse.json({
      text: data.text ?? "Keine Antwort erhalten.",
    });

  } catch (err) {
    console.error("API ERROR:", err);
    return NextResponse.json(
      { text: "Interner Serverfehler." },
      { status: 500 }
    );
  }
}