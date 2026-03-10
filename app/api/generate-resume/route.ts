import { NextResponse } from "next/server";
import { generateResume } from "@/lib/openrouter";
import type { ResumeBuilderInput } from "@/types";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = body as ResumeBuilderInput;

    if (!input.name || !input.jobDescription) {
      return NextResponse.json(
        { error: "Name and job description are required." },
        { status: 400 }
      );
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "OpenRouter API key is not configured. Set OPENROUTER_API_KEY in your .env file." },
        { status: 500 }
      );
    }

    const generatedResume = await generateResume(input);

    return NextResponse.json({
      success: true,
      data: generatedResume,
    });
  } catch (error: unknown) {
    console.error("Resume generation error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate resume.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
