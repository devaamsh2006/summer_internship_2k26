// ─── Resume Strength Score ──────────────────────────────────────────────────
// Weighted composite scoring — fully deterministic.

import type {
  ResumeData,
  JobDescriptionData,
  MatchResult,
  KeywordAnalysis,
  StrengthScore,
} from "@/types";

// Score weights
const WEIGHTS = {
  skillAlignment: 0.35,
  keywordCoverage: 0.25,
  experienceRelevance: 0.25,
  projectRelevance: 0.15,
} as const;

/**
 * Compute composite resume strength score.
 */
export function computeStrengthScore(
  resumeData: ResumeData,
  jdData: JobDescriptionData,
  matchResult: MatchResult,
  keywordAnalysis: KeywordAnalysis
): StrengthScore {
  const skillAlignment = computeSkillAlignmentScore(matchResult);
  const keywordCoverage = computeKeywordCoverageScore(keywordAnalysis);
  const experienceRelevance = matchResult.sectionScores.experience;
  const projectRelevance = matchResult.sectionScores.projects;

  const overall = Math.round(
    skillAlignment * WEIGHTS.skillAlignment +
      keywordCoverage * WEIGHTS.keywordCoverage +
      experienceRelevance * WEIGHTS.experienceRelevance +
      projectRelevance * WEIGHTS.projectRelevance
  );

  return {
    overall: Math.min(100, Math.max(0, overall)),
    skillAlignment: Math.min(100, Math.max(0, skillAlignment)),
    keywordCoverage: Math.min(100, Math.max(0, keywordCoverage)),
    experienceRelevance: Math.min(100, Math.max(0, experienceRelevance)),
    projectRelevance: Math.min(100, Math.max(0, projectRelevance)),
  };
}

/**
 * Compute skill alignment score from match results.
 */
function computeSkillAlignmentScore(matchResult: MatchResult): number {
  const matches = matchResult.semanticSkillMatches;
  if (matches.length === 0) return 0;

  const totalJdSkills = matches.filter((m) => m.jdSkill).length;
  if (totalJdSkills === 0) return 0;

  const exactMatches = matches.filter((m) => m.matchType === "exact").length;
  const partialMatches = matches.filter((m) => m.matchType === "partial");
  const partialScore = partialMatches.reduce(
    (sum, m) => sum + m.similarity,
    0
  );

  const score = ((exactMatches + partialScore) / totalJdSkills) * 100;
  return Math.round(score);
}

/**
 * Compute keyword coverage score.
 */
function computeKeywordCoverageScore(keywordAnalysis: KeywordAnalysis): number {
  const total =
    keywordAnalysis.matched.length + keywordAnalysis.missing.length;
  if (total === 0) return 0;

  const coverage = (keywordAnalysis.matched.length / total) * 100;

  // Penalize overused keywords slightly
  const overusePenalty = Math.min(
    keywordAnalysis.overused.length * 3,
    15
  );

  return Math.round(Math.max(0, coverage - overusePenalty));
}
