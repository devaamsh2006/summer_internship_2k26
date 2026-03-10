// ─── ATS Compatibility Analyzer ─────────────────────────────────────────────
// Deterministic analysis of resume structure and ATS compatibility.
// No LLM — all checks are rule-based.

import type { ResumeData, JobDescriptionData, ATSAnalysis } from "@/types";

const REQUIRED_SECTIONS = [
  "contact",
  "summary",
  "skills",
  "experience",
  "education",
] as const;

const OPTIONAL_SECTIONS = ["projects", "certifications"] as const;

/**
 * Analyze ATS compatibility of a resume against a job description.
 */
export function analyzeATSCompatibility(
  resumeData: ResumeData,
  jdData: JobDescriptionData
): ATSAnalysis {
  const sectionCompleteness = checkSectionCompleteness(resumeData);
  const keywordPresence = computeKeywordPresence(resumeData, jdData);
  const keywordDensity = computeKeywordDensity(resumeData, jdData);
  const readabilityScore = computeReadability(resumeData.rawText);
  const formattingScore = computeFormattingScore(resumeData);
  const suggestions = generateSuggestions(
    resumeData,
    jdData,
    sectionCompleteness,
    keywordPresence,
    readabilityScore,
    formattingScore
  );

  // Compute composite ATS score
  const sectionScore = computeSectionScore(sectionCompleteness);
  const score = Math.round(
    sectionScore * 0.25 +
      keywordPresence * 0.30 +
      keywordDensity * 0.15 +
      readabilityScore * 0.15 +
      formattingScore * 0.15
  );

  return {
    score: Math.min(100, Math.max(0, score)),
    sectionCompleteness,
    keywordPresence,
    keywordDensity,
    readabilityScore,
    formattingScore,
    suggestions,
  };
}

/**
 * Check which required sections are present.
 */
function checkSectionCompleteness(
  resumeData: ResumeData
): Record<string, boolean> {
  const completeness: Record<string, boolean> = {};

  for (const section of REQUIRED_SECTIONS) {
    const content = resumeData.sections[section]?.trim();
    completeness[section] = Boolean(content && content.length > 10);
  }

  for (const section of OPTIONAL_SECTIONS) {
    const content = resumeData.sections[section]?.trim();
    completeness[section] = Boolean(content && content.length > 10);
  }

  return completeness;
}

/**
 * Compute section completeness score.
 */
function computeSectionScore(
  completeness: Record<string, boolean>
): number {
  let score = 0;
  let total = 0;

  for (const section of REQUIRED_SECTIONS) {
    total += 1;
    if (completeness[section]) score += 1;
  }

  // Optional sections add bonus
  for (const section of OPTIONAL_SECTIONS) {
    if (completeness[section]) score += 0.3;
    total += 0.3;
  }

  return total > 0 ? (score / total) * 100 : 0;
}

/**
 * Compute what percentage of JD keywords appear in the resume.
 */
function computeKeywordPresence(
  resumeData: ResumeData,
  jdData: JobDescriptionData
): number {
  if (jdData.requiredSkills.length === 0) return 0;

  const resumeTextLower = resumeData.rawText.toLowerCase();
  let matchCount = 0;

  for (const skill of jdData.requiredSkills) {
    const lower = skill.toLowerCase();
    if (resumeTextLower.includes(lower)) {
      matchCount++;
    }
  }

  return Math.round((matchCount / jdData.requiredSkills.length) * 100);
}

/**
 * Compute keyword density (how well keywords are distributed).
 */
function computeKeywordDensity(
  resumeData: ResumeData,
  jdData: JobDescriptionData
): number {
  if (jdData.requiredSkills.length === 0) return 0;

  const words = resumeData.rawText.toLowerCase().split(/\s+/).length;
  if (words === 0) return 0;

  let keywordOccurrences = 0;
  const resumeTextLower = resumeData.rawText.toLowerCase();

  for (const skill of jdData.requiredSkills) {
    const lower = skill.toLowerCase();
    const escaped = lower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matches = resumeTextLower.match(new RegExp(escaped, "g"));
    if (matches) keywordOccurrences += matches.length;
  }

  // Ideal density: 2-5% of total words
  const density = (keywordOccurrences / words) * 100;

  if (density >= 2 && density <= 5) return 100;
  if (density >= 1 && density < 2) return 70;
  if (density > 5 && density <= 8) return 70;
  if (density > 0 && density < 1) return 40;
  if (density > 8) return 30;
  return 0;
}

/**
 * Compute readability score using Flesch-Kincaid approximation.
 */
function computeReadability(text: string): number {
  if (!text || text.trim().length === 0) return 0;

  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const syllables = words.reduce(
    (sum, word) => sum + countSyllables(word),
    0
  );

  if (sentences.length === 0 || words.length === 0) return 0;

  const avgSentenceLength = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;

  // Flesch Reading Ease
  const flesch =
    206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord;

  // Normalize to 0-100 scale (60-80 is ideal for resumes)
  if (flesch >= 60 && flesch <= 80) return 100;
  if (flesch >= 40 && flesch < 60) return 80;
  if (flesch >= 80 && flesch <= 100) return 80;
  if (flesch >= 20 && flesch < 40) return 50;
  if (flesch > 100) return 60;
  return 30;
}

/**
 * Count syllables in a word (approximation).
 */
function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length <= 3) return 1;

  let count = 0;
  const vowels = "aeiouy";
  let prevVowel = false;

  for (const char of w) {
    const isVowel = vowels.includes(char);
    if (isVowel && !prevVowel) count++;
    prevVowel = isVowel;
  }

  // Adjustments
  if (w.endsWith("e") && !w.endsWith("le")) count--;
  if (w.endsWith("ed") && w.length > 4) count--;
  if (count < 1) count = 1;

  return count;
}

/**
 * Check formatting quality.
 */
function computeFormattingScore(resumeData: ResumeData): number {
  let score = 100;
  const text = resumeData.rawText;

  // Check for consistent bullet points
  const bulletLines = text
    .split("\n")
    .filter((l) => /^\s*[•\-*▪►→]\s/.test(l));
  if (bulletLines.length < 3) score -= 15;

  // Check for reasonable length (300-1500 words)
  const wordCount = text.split(/\s+/).length;
  if (wordCount < 200) score -= 25;
  else if (wordCount < 300) score -= 10;
  else if (wordCount > 1500) score -= 10;
  else if (wordCount > 2000) score -= 20;

  // Check line length consistency (no excessively long lines)
  const longLines = text.split("\n").filter((l) => l.trim().length > 150);
  if (longLines.length > 5) score -= 10;

  // Check for special characters that may confuse ATS
  const specialChars = text.match(/[│║╔╗╚╝═─┌┐└┘├┤┬┴┼]/g);
  if (specialChars && specialChars.length > 5) score -= 20;

  // Check for tables/columns (multi-column layouts confuse ATS)
  const tabCount = (text.match(/\t/g) || []).length;
  if (tabCount > 10) score -= 15;

  return Math.max(0, score);
}

/**
 * Generate ATS improvement suggestions.
 */
function generateSuggestions(
  resumeData: ResumeData,
  jdData: JobDescriptionData,
  sectionCompleteness: Record<string, boolean>,
  keywordPresence: number,
  readabilityScore: number,
  formattingScore: number
): string[] {
  const suggestions: string[] = [];

  // Missing sections
  for (const section of REQUIRED_SECTIONS) {
    if (!sectionCompleteness[section]) {
      suggestions.push(
        `Add a "${section.charAt(0).toUpperCase() + section.slice(1)}" section to your resume.`
      );
    }
  }

  // Keyword presence
  if (keywordPresence < 40) {
    suggestions.push(
      "Your resume is missing many keywords from the job description. Consider incorporating relevant terms."
    );
  } else if (keywordPresence < 70) {
    suggestions.push(
      "Some job description keywords are missing from your resume. Adding them could improve ATS matching."
    );
  }

  // Readability
  if (readabilityScore < 60) {
    suggestions.push(
      "Improve readability by using shorter sentences and simpler language."
    );
  }

  // Formatting
  if (formattingScore < 60) {
    suggestions.push(
      "Use a simpler format with standard bullet points. Avoid tables, columns, and special characters."
    );
  }

  // Word count
  const wordCount = resumeData.rawText.split(/\s+/).length;
  if (wordCount < 300) {
    suggestions.push(
      "Your resume appears too short. Consider adding more detail about your experience and skills."
    );
  } else if (wordCount > 1500) {
    suggestions.push(
      "Your resume may be too long. Consider condensing to the most relevant information."
    );
  }

  // Bullet points
  const bulletLines = resumeData.rawText
    .split("\n")
    .filter((l) => /^\s*[•\-*▪►→]\s/.test(l));
  if (bulletLines.length < 3) {
    suggestions.push(
      "Use bullet points to make your experience and achievements more scannable."
    );
  }

  return suggestions;
}
