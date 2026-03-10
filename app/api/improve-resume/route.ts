import { NextResponse } from "next/server";
import { generateImprovements } from "@/lib/openrouter";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sections } = body as { sections: Record<string, string> };

    if (!sections || typeof sections !== "object") {
      return NextResponse.json(
        { error: "Resume sections are required for improvement analysis." },
        { status: 400 }
      );
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "OpenRouter API key is not configured. Set OPENROUTER_API_KEY in your .env file." },
        { status: 500 }
      );
    }

    // LLM-powered writing improvement (the only LLM usage)
    const improvements = await generateImprovements(sections);

    return NextResponse.json({
      success: true,
      data: { improvements },
    });
  } catch (error: unknown) {
    console.error("Improvement generation error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate improvements.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
