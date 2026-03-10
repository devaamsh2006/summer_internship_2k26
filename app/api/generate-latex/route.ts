import { NextResponse } from "next/server";
import { generateLaTeXResumeData } from "@/lib/openrouter";
import { generateLaTeX, compileLaTeXToPDF } from "@/lib/latex-generator";
import { extractSkills } from "@/lib/skill-extractor";
import { analyzeJobDescription } from "@/lib/jd-analyzer";
import { computeEmbedding, cosineSimilarity } from "@/lib/similarity-engine";
import type { ResumeBuilderInput } from "@/types";

export const maxDuration = 120;

/**
 * Use sentence transformers to rank JD keywords by semantic importance.
 * Compares each keyword's embedding against the full JD embedding,
 * so keywords that best represent the JD's core meaning rank highest.
 */
async function rankKeywordsByImportance(
  keywords: string[],
  jobDescription: string
): Promise<{ keyword: string; score: number }[]> {
  if (keywords.length === 0) return [];

  try {
    // Get the JD embedding as the reference vector
    const jdEmbedding = await computeEmbedding(jobDescription);

    // Compute each keyword's similarity to the full JD
    const ranked: { keyword: string; score: number }[] = [];
    for (const keyword of keywords) {
      const kwEmbedding = await computeEmbedding(keyword);
      const score = cosineSimilarity(jdEmbedding, kwEmbedding);
      ranked.push({ keyword, score });
    }

    // Sort by importance (highest similarity to JD = most important)
    ranked.sort((a, b) => b.score - a.score);
    return ranked;
  } catch (error) {
    console.error("Keyword ranking error:", error);
    // Fallback: return all keywords unranked
    return keywords.map((k) => ({ keyword: k, score: 0 }));
  }
}

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

    // ── Step 1: Extract ATS keywords from JD (deterministic taxonomy) ──
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

    // ── Step 2: Rank keywords by semantic importance using sentence transformers ──
    const rankedKeywords = await rankKeywordsByImportance(
      allKeywords,
      input.jobDescription
    );

    // Split into priority tiers for the LLM
    const highPriority = rankedKeywords
      .filter((k) => k.score >= 0.4)
      .map((k) => k.keyword);
    const mediumPriority = rankedKeywords
      .filter((k) => k.score >= 0.25 && k.score < 0.4)
      .map((k) => k.keyword);
    const lowPriority = rankedKeywords
      .filter((k) => k.score < 0.25)
      .map((k) => k.keyword);

    // ── Step 3: Generate ATS-optimized resume via LLM ──
    const resumeData = await generateLaTeXResumeData(input, allKeywords, {
      highPriority,
      mediumPriority,
      lowPriority,
    });

    // ── Step 4: Render structured data into LaTeX ──
    const latexCode = generateLaTeX(resumeData);

    // ── Step 5: Compile LaTeX to PDF ──
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
        rankedKeywords: rankedKeywords.slice(0, 30),
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
