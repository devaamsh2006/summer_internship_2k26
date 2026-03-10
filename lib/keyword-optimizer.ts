// ─── Keyword Optimizer ──────────────────────────────────────────────────────
// Deterministic keyword analysis — no LLM.

import type { ResumeData, JobDescriptionData, KeywordAnalysis } from "@/types";
import { normalizeSkill, extractSkills } from "./skill-extractor";

/**
 * Analyze keyword alignment between resume and job description.
 */
export function analyzeKeywords(
  resumeData: ResumeData,
  jdData: JobDescriptionData
): KeywordAnalysis {
  // Extract keywords from both sources
  const jdKeywords = extractAllKeywords(jdData.rawText);
  const resumeKeywords = extractAllKeywords(resumeData.rawText);

  // Normalize for comparison
  const normalizedResume = new Set(
    resumeKeywords.map((k) => normalizeSkill(k).toLowerCase())
  );
  const normalizedJd = new Set(
    jdKeywords.map((k) => normalizeSkill(k).toLowerCase())
  );

  // Find matched, missing, and overused keywords
  const matched: string[] = [];
  const missing: string[] = [];
  const seenMatched = new Set<string>();
  const seenMissing = new Set<string>();

  for (const keyword of jdKeywords) {
    const normalized = normalizeSkill(keyword).toLowerCase();
    if (normalizedResume.has(normalized)) {
      if (!seenMatched.has(normalized)) {
        matched.push(keyword);
        seenMatched.add(normalized);
      }
    } else {
      if (!seenMissing.has(normalized)) {
        missing.push(keyword);
        seenMissing.add(normalized);
      }
    }
  }

  // Find overused keywords (appear 4+ times in resume)
  const overused = findOverusedKeywords(resumeData.rawText, resumeKeywords);

  return { matched, missing, overused };
}

/**
 * Extract all significant keywords from text.
 * Combines skill taxonomy extraction with n-gram keyword extraction.
 */
function extractAllKeywords(text: string): string[] {
  // Start with taxonomy-based skills
  const taxonomySkills = extractSkills(text);

  // Add significant bigrams and trigrams
  const ngramKeywords = extractSignificantNGrams(text);

  // Combine and deduplicate
  const combined = new Set<string>(taxonomySkills);
  for (const ng of ngramKeywords) {
    combined.add(ng);
  }

  return Array.from(combined);
}

/**
 * Extract significant n-grams from text.
 */
function extractSignificantNGrams(text: string): string[] {
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "up", "about", "into", "over", "after",
    "is", "are", "was", "were", "be", "been", "being", "have", "has",
    "had", "do", "does", "did", "will", "would", "could", "should", "may",
    "might", "can", "shall", "it", "its", "this", "that", "these", "those",
    "i", "me", "my", "we", "our", "you", "your", "he", "she", "they",
    "them", "their", "what", "which", "who", "whom", "how", "when", "where",
    "why", "all", "each", "every", "both", "few", "more", "most", "other",
    "some", "such", "no", "not", "only", "own", "same", "so", "than",
    "too", "very", "just", "because", "as", "until", "while", "if",
    "then", "once", "here", "there", "also", "etc", "e.g", "i.e",
    "work", "working", "worked", "using", "used", "use", "experience",
    "including", "include", "ability", "able", "strong", "knowledge",
    "understanding", "skills", "skill", "team", "role", "position",
    "responsible", "responsibilities", "requirements", "required",
    "preferred", "must", "minimum", "years", "year",
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s\-./+#]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !stopWords.has(w));

  const significantWords = words.filter(
    (w) => !stopWords.has(w) && w.length > 2
  );

  // Extract significant single words (technical terms)
  const singles = significantWords.filter(
    (w) =>
      /^[a-z]+[0-9]+$/.test(w) || // e.g., "python3", "es6"
      /^[a-z]+\.[a-z]+$/.test(w) || // e.g., "node.js"
      w.includes("+") || // e.g., "c++"
      w.includes("#") // e.g., "c#"
  );

  return [...new Set(singles)];
}

/**
 * Find keywords that appear too frequently in the resume.
 */
function findOverusedKeywords(
  text: string,
  keywords: string[]
): string[] {
  const overused: string[] = [];
  const lowerText = text.toLowerCase();

  for (const keyword of keywords) {
    const escaped = keyword
      .toLowerCase()
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    try {
      const matches = lowerText.match(new RegExp(escaped, "g"));
      if (matches && matches.length >= 4) {
        overused.push(keyword);
      }
    } catch {
      continue;
    }
  }

  return overused;
}
