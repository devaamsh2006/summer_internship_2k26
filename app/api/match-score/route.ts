import { NextResponse } from "next/server";
import type { ResumeData, JobDescriptionData } from "@/types";
import { computeMatchResult, detectMissingSkills } from "@/lib/matching-engine";
import { analyzeATSCompatibility } from "@/lib/ats-analyzer";
import { analyzeKeywords } from "@/lib/keyword-optimizer";
import { computeStrengthScore } from "@/lib/scoring";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { resumeData, jdData } = body as {
      resumeData: ResumeData;
      jdData: JobDescriptionData;
    };

    if (!resumeData || !jdData) {
      return NextResponse.json(
        { error: "Both resume data and job description data are required." },
        { status: 400 }
      );
    }

    // 1. Compute semantic match results (uses Sentence Transformers)
    const matchResult = await computeMatchResult(resumeData, jdData);

    // 2. Detect missing skills (deterministic)
    const missingSkills = detectMissingSkills(resumeData, jdData);

    // 3. Analyze ATS compatibility (deterministic)
    const atsAnalysis = analyzeATSCompatibility(resumeData, jdData);

    // 4. Analyze keywords (deterministic)
    const keywordAnalysis = analyzeKeywords(resumeData, jdData);

    // 5. Compute strength score (deterministic)
    const strengthScore = computeStrengthScore(
      resumeData,
      jdData,
      matchResult,
      keywordAnalysis
    );

    return NextResponse.json({
      success: true,
      data: {
        matchResult,
        missingSkills,
        atsAnalysis,
        keywordAnalysis,
        strengthScore,
      },
    });
  } catch (error: unknown) {
    console.error("Match scoring error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to compute match score.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
