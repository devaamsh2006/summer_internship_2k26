// ─── Resume Parser ──────────────────────────────────────────────────────────
// Rule-based resume parsing for PDF and DOCX files.
// Section detection uses deterministic heuristics — no LLM.

import type { ResumeData, ResumeSections } from "@/types";
import { extractSkills } from "./skill-extractor";

// ─── Section Header Patterns ────────────────────────────────────────────────

const SECTION_PATTERNS: Record<keyof ResumeSections, RegExp[]> = {
  contact: [
    /^(?:contact\s*(?:info(?:rmation)?)?|personal\s*(?:info(?:rmation)?|details))/im,
  ],
  summary: [
    /^(?:(?:professional\s+)?summary|(?:career\s+)?objective|profile|about\s*(?:me)?|overview)/im,
  ],
  skills: [
    /^(?:(?:technical\s+|core\s+|key\s+)?skills|technologies|tech\s*stack|competencies|proficiencies|areas\s*of\s*expertise)/im,
  ],
  experience: [
    /^(?:(?:work\s+|professional\s+)?experience|employment\s*(?:history)?|work\s*history|career\s*history)/im,
  ],
  projects: [
    /^(?:(?:key\s+|selected\s+|notable\s+)?projects|portfolio|personal\s*projects)/im,
  ],
  education: [
    /^(?:education(?:al\s*background)?|academic\s*(?:background|qualifications)|qualifications|degrees?)/im,
  ],
  certifications: [
    /^(?:certifications?|licenses?\s*(?:and|&)\s*certifications?|accreditations?|professional\s*development|awards?\s*(?:and|&)\s*certifications?)/im,
  ],
};

/**
 * Parse PDF buffer to text.
 */
export async function parsePDF(buffer: Buffer): Promise<string> {
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(buffer);
  return data.text || "";
}

/**
 * Parse DOCX buffer to text.
 */
export async function parseDOCX(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value || "";
}

/**
 * Parse a resume file (PDF or DOCX) and return structured data.
 */
export async function parseResumeFile(
  buffer: Buffer,
  fileName: string
): Promise<ResumeData> {
  const ext = fileName.toLowerCase().split(".").pop();

  let rawText: string;
  if (ext === "pdf") {
    rawText = await parsePDF(buffer);
  } else if (ext === "docx" || ext === "doc") {
    rawText = await parseDOCX(buffer);
  } else {
    throw new Error(`Unsupported file format: ${ext}. Use PDF or DOCX.`);
  }

  rawText = cleanText(rawText);
  const sections = splitIntoSections(rawText);
  const extractedSkills = extractSkills(rawText);

  return {
    rawText,
    sections,
    extractedSkills,
    fileName,
  };
}

/**
 * Clean extracted text.
 */
function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/ {3,}/g, "  ")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

/**
 * Split resume text into sections using rule-based header detection.
 */
function splitIntoSections(text: string): ResumeSections {
  const lines = text.split("\n");
  const sectionBoundaries: Array<{
    section: keyof ResumeSections;
    lineIndex: number;
  }> = [];

  // Find section headers
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.length === 0 || line.length > 80) continue;

    // Check if line looks like a header
    const isLikelyHeader =
      line === line.toUpperCase() || // ALL CAPS
      /^[A-Z][a-zA-Z\s&/]+$/.test(line) || // Title Case
      /^#{1,3}\s/.test(line) || // Markdown-style
      /^[A-Z][A-Z\s&/]+:?\s*$/.test(line); // CAPS with optional colon

    if (!isLikelyHeader && line.split(" ").length > 6) continue;

    for (const [section, patterns] of Object.entries(SECTION_PATTERNS)) {
      for (const pattern of patterns) {
        // Remove common decorations before matching
        const cleanedLine = line
          .replace(/^[─━▪•\-*=|:>]+\s*/, "")
          .replace(/\s*[─━▪•\-*=|:]+$/, "")
          .replace(/^#+\s*/, "")
          .trim();

        if (pattern.test(cleanedLine)) {
          sectionBoundaries.push({
            section: section as keyof ResumeSections,
            lineIndex: i,
          });
          break;
        }
      }
    }
  }

  // Sort by line index
  sectionBoundaries.sort((a, b) => a.lineIndex - b.lineIndex);

  // Extract section content
  const sections: ResumeSections = {
    skills: "",
    experience: "",
    projects: "",
    education: "",
    certifications: "",
    summary: "",
    contact: "",
  };

  for (let i = 0; i < sectionBoundaries.length; i++) {
    const current = sectionBoundaries[i];
    const nextLineIndex =
      i + 1 < sectionBoundaries.length
        ? sectionBoundaries[i + 1].lineIndex
        : lines.length;

    const sectionLines = lines.slice(current.lineIndex + 1, nextLineIndex);
    const content = sectionLines.join("\n").trim();
    sections[current.section] = content;
  }

  // If no sections detected, try to infer from content
  if (sectionBoundaries.length === 0) {
    sections.summary = text;
  }

  // If contact section is empty, try to extract from first few lines
  if (!sections.contact) {
    const firstLines = lines.slice(0, Math.min(5, lines.length)).join("\n");
    const emailMatch = firstLines.match(
      /[\w.+-]+@[\w-]+\.[\w.-]+/
    );
    const phoneMatch = firstLines.match(
      /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/
    );
    if (emailMatch || phoneMatch) {
      sections.contact = firstLines.trim();
    }
  }

  return sections;
}
