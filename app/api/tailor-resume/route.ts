import { NextResponse } from "next/server";
import { generateLaTeXResumeData } from "@/lib/openrouter";
import { generateLaTeX, compileLaTeXToPDF } from "@/lib/latex-generator";
import { extractSkills } from "@/lib/skill-extractor";
import { analyzeJobDescription } from "@/lib/jd-analyzer";
import { computeEmbedding, cosineSimilarity } from "@/lib/similarity-engine";
import type { ResumeData, JobDescriptionData } from "@/types";

export const maxDuration = 120;

/**
 * Rank JD keywords by semantic importance using sentence transformer embeddings.
 */
async function rankKeywordsByImportance(
  keywords: string[],
  jobDescription: string
): Promise<{ keyword: string; score: number }[]> {
  if (keywords.length === 0) return [];

  try {
    const jdEmbedding = await computeEmbedding(jobDescription);
    const ranked: { keyword: string; score: number }[] = [];
    for (const keyword of keywords) {
      const kwEmbedding = await computeEmbedding(keyword);
      const score = cosineSimilarity(jdEmbedding, kwEmbedding);
      ranked.push({ keyword, score });
    }
    ranked.sort((a, b) => b.score - a.score);
    return ranked;
  } catch (error) {
    console.error("Keyword ranking error:", error);
    return keywords.map((k) => ({ keyword: k, score: 0 }));
  }
}

/**
 * Extract a name from the contact section of the resume.
 * Heuristic: first non-empty line that looks like a name.
 */
function extractName(resumeData: ResumeData): string {
  const contact = resumeData.sections.contact || "";
  const rawLines = resumeData.rawText.split("\n").filter((l) => l.trim());

  // Try the first line of contact section
  if (contact) {
    const contactLines = contact.split("\n").filter((l) => l.trim());
    for (const line of contactLines) {
      const cleaned = line.trim();
      // A name typically has 2-4 words, no special characters like @ or http
      if (
        cleaned.length > 2 &&
        cleaned.length < 60 &&
        !cleaned.includes("@") &&
        !cleaned.includes("http") &&
        !cleaned.includes("+") &&
        /^[A-Za-z\s.\-']+$/.test(cleaned)
      ) {
        return cleaned;
      }
    }
  }

  // Fallback: try the very first line of the resume
  for (const line of rawLines.slice(0, 5)) {
    const cleaned = line.trim();
    if (
      cleaned.length > 2 &&
      cleaned.length < 60 &&
      !cleaned.includes("@") &&
      !cleaned.includes("http") &&
      !cleaned.includes("+") &&
      /^[A-Za-z\s.\-']+$/.test(cleaned)
    ) {
      return cleaned;
    }
  }

  return "Candidate";
}

/**
 * Extract email from resume raw text.
 */
function extractEmail(text: string): string {
  const match = text.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
  return match ? match[0] : "";
}

/**
 * Extract phone from resume raw text.
 */
function extractPhone(text: string): string {
  const match = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/);
  return match ? match[0].trim() : "";
}

/**
 * Extract GitHub/LinkedIn URLs from resume raw text.
 */
function extractUrls(text: string): { github: string; linkedin: string; portfolio: string } {
  const githubMatch = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[\w-]+/i);
  const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+/i);
  const portfolioMatch = text.match(/(?:https?:\/\/)?(?:www\.)?(?!github\.com|linkedin\.com)[\w-]+\.(?:dev|io|com|me|xyz|tech|app)(?:\/[\w-]*)*/i);

  return {
    github: githubMatch ? githubMatch[0] : "",
    linkedin: linkedinMatch ? linkedinMatch[0] : "",
    portfolio: portfolioMatch ? portfolioMatch[0] : "",
  };
}

/**
 * POST /api/tailor-resume
 * Takes parsed resume data + JD data from the analysis flow
 * and generates a tailored, ATS-optimized LaTeX PDF resume.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { resumeData, jdData } = body as {
      resumeData: ResumeData;
      jdData: JobDescriptionData;
    };

    if (!resumeData || !jdData) {
      return NextResponse.json(
        { error: "Resume data and job description data are required." },
        { status: 400 }
      );
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "OpenRouter API key is not configured." },
        { status: 500 }
      );
    }

    // Convert parsed resume sections into ResumeBuilderInput format
    const name = extractName(resumeData);
    const email = extractEmail(resumeData.rawText);
    const phone = extractPhone(resumeData.rawText);
    const urls = extractUrls(resumeData.rawText);

    const builderInput = {
      name,
      email,
      phone,
      github: urls.github,
      linkedin: urls.linkedin,
      portfolio: urls.portfolio,
      summary: resumeData.sections.summary || "",
      skills: resumeData.sections.skills || resumeData.extractedSkills.join(", "),
      experience: resumeData.sections.experience || "",
      education: resumeData.sections.education || "",
      projects: resumeData.sections.projects || "",
      courses: resumeData.sections.certifications || "",
      certifications: resumeData.sections.certifications || "",
      jobDescription: jdData.rawText,
    };

    // ── Step 1: Extract ATS keywords from JD ──
    const jdAnalyzed = analyzeJobDescription(jdData.rawText);
    const jdSkills = extractSkills(jdData.rawText);

    const allKeywords = [
      ...new Set([
        ...jdSkills,
        ...jdAnalyzed.requiredSkills,
        ...jdAnalyzed.technologies,
        ...jdAnalyzed.tools,
      ]),
    ];

    // ── Step 2: Rank keywords by semantic importance ──
    const rankedKeywords = await rankKeywordsByImportance(
      allKeywords,
      jdData.rawText
    );

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
    const structuredData = await generateLaTeXResumeData(
      builderInput,
      allKeywords,
      { highPriority, mediumPriority, lowPriority }
    );

    // ── Step 4: Render into LaTeX ──
    const latexCode = generateLaTeX(structuredData);

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
        structuredData,
        atsKeywords: allKeywords,
      },
    });
  } catch (error: unknown) {
    console.error("Tailor resume error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate tailored resume.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
