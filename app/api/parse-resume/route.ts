import { NextResponse } from "next/server";
import { parseResumeFile } from "@/lib/resume-parser";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("resume") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided. Upload a PDF or DOCX resume." },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    // Validate file type
    const ext = file.name.toLowerCase().split(".").pop();
    if (!ext || !["pdf", "docx", "doc"].includes(ext)) {
      return NextResponse.json(
        { error: "Unsupported file type. Use PDF or DOCX." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const resumeData = await parseResumeFile(buffer, file.name);

    return NextResponse.json({
      success: true,
      data: resumeData,
    });
  } catch (error: unknown) {
    console.error("Resume parsing error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to parse resume.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
