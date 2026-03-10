import { NextResponse } from "next/server";
import { analyzeJobDescription } from "@/lib/jd-analyzer";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { jobDescription } = body;

    if (!jobDescription || typeof jobDescription !== "string") {
      return NextResponse.json(
        { error: "Job description text is required." },
        { status: 400 }
      );
    }

    if (jobDescription.trim().length < 20) {
      return NextResponse.json(
        { error: "Job description is too short. Please provide a complete posting." },
        { status: 400 }
      );
    }

    const jdData = analyzeJobDescription(jobDescription);

    return NextResponse.json({
      success: true,
      data: jdData,
    });
  } catch (error: unknown) {
    console.error("JD analysis error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to analyze job description.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
