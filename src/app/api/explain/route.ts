import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({ task: z.string().min(8).max(1200), resource: z.string().min(3).max(300), amountUsd: z.number().positive().max(10_000) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid explanation request" }, { status: 400 });
  if (!process.env.GROQ_API_KEY) return NextResponse.json({ configured: false, note: "Deterministic policy remains active; optional explanation is not configured." });
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    temperature: 0.1,
    max_tokens: 180,
    messages: [
      { role: "system", content: "Explain payment necessity and risk in plain language. Never authorize or deny payment. Return concise JSON with necessity, risk, and note." },
      { role: "user", content: JSON.stringify(parsed.data) },
    ],
    response_format: { type: "json_object" },
  });
  return NextResponse.json({ configured: true, analysis: JSON.parse(completion.choices[0]?.message?.content ?? "{}") });
}
