import { NextResponse } from "next/server";
import { generateLaTeXResumeData } from "@/lib/openrouter";
import { generateLaTeX, compileLaTeXToPDF } from "@/lib/latex-generator";
import { extractSkills } from "@/lib/skill-extractor";
import { analyzeJobDescription } from "@/lib/jd-analyzer";
import type { ResumeBuilderInput } from "@/types";

export const maxDuration = 120;

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

    // ── Step 1: Extract ATS keywords from JD (deterministic) ──
    const jdData = analyzeJobDescription(input.jobDescription);
    const jdSkills = extractSkills(input.jobDescription);
    
    // Merge all keywords: required skills + technologies + tools
    const allKeywords = [
      ...new Set([
        ...jdSkills,
        ...jdData.requiredSkills,
        ...jdData.technologies,
        ...jdData.tools,
      ]),
    ];

    // ── Step 2: Generate ATS-optimized resume via LLM (with keyword injection + validation) ──
    const resumeData = await generateLaTeXResumeData(input, allKeywords);

    // ── Step 3: Render structured data into LaTeX ──
    const latexCode = generateLaTeX(resumeData);

    // ── Step 4: Compile LaTeX to PDF ──
    let pdfBase64: string | null = null;
    const pdfBuffer = await compileLaTeXToPDF(latexCode);
    if (pdfBuffer) {
      pdfBase64 = pdfBuffer.toString("base64");
    }

    return NextResponse.json({
      success: true,
      data: {
        latex: latexCode,
        pdf: pdfBase64,
        structuredData: resumeData,
        atsKeywords: allKeywords,
        keywordCount: allKeywords.length,
      },
    });
  } catch (error: unknown) {
    console.error("LaTeX generation error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate LaTeX resume.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
