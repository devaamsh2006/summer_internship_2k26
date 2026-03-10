// ─── Resume–JD Matching Engine ──────────────────────────────────────────────
// Combines deterministic skill comparison with semantic similarity.
// No LLM — all scoring is computed from embeddings and rules.

import type {
  ResumeData,
  JobDescriptionData,
  MatchResult,
  SectionScores,
  SemanticSkillMatch,
  MissingSkill,
} from "@/types";
import {
  findMissingSkills,
  computeSkillFrequency,
  classifySkillImportance,
  normalizeSkill,
} from "./skill-extractor";
import {
  computeTextSimilarity,
  batchComputeSkillSimilarities,
} from "./similarity-engine";

const PARTIAL_MATCH_THRESHOLD = 0.65;

/**
 * Compute full match result between resume and job description.
 */
export async function computeMatchResult(
  resumeData: ResumeData,
  jdData: JobDescriptionData
): Promise<MatchResult> {
  // 1. Compute section-level similarities using sentence transformers
  const sectionScores = await computeSectionScores(resumeData, jdData);

  // 2. Compute semantic skill matches
  const semanticSkillMatches = await computeSemanticSkillMatches(
    resumeData.extractedSkills,
    jdData.requiredSkills
  );

  // 3. Compute overall score (weighted combination)
  const overallScore = computeOverallScore(sectionScores, semanticSkillMatches);

  return {
    overallScore,
    sectionScores,
    semanticSkillMatches,
  };
}

/**
 * Compute section-level similarity scores.
 */
async function computeSectionScores(
  resumeData: ResumeData,
  jdData: JobDescriptionData
): Promise<SectionScores> {
  const jdText = jdData.rawText;

  const [skillsSim, expSim, projSim, eduSim] = await Promise.all([
    resumeData.sections.skills
      ? computeTextSimilarity(resumeData.sections.skills, jdText)
      : Promise.resolve(0),
    resumeData.sections.experience
      ? computeTextSimilarity(resumeData.sections.experience, jdText)
      : Promise.resolve(0),
    resumeData.sections.projects
      ? computeTextSimilarity(resumeData.sections.projects, jdText)
      : Promise.resolve(0),
    resumeData.sections.education
      ? computeTextSimilarity(resumeData.sections.education, jdText)
      : Promise.resolve(0),
  ]);

  return {
    skills: Math.round(skillsSim * 100),
    experience: Math.round(expSim * 100),
    projects: Math.round(projSim * 100),
    education: Math.round(eduSim * 100),
  };
}

/**
 * Compute semantic skill matches using the similarity engine.
 */
async function computeSemanticSkillMatches(
  resumeSkills: string[],
  jdSkills: string[]
): Promise<SemanticSkillMatch[]> {
  if (resumeSkills.length === 0 || jdSkills.length === 0) return [];

  // First: deterministic exact matching
  const exactMatches = new Set<string>();
  const normalizedResumeSkills = new Map<string, string>();
  const normalizedJdSkills = new Map<string, string>();

  for (const s of resumeSkills) {
    normalizedResumeSkills.set(normalizeSkill(s).toLowerCase(), s);
  }
  for (const s of jdSkills) {
    normalizedJdSkills.set(normalizeSkill(s).toLowerCase(), s);
  }

  const results: SemanticSkillMatch[] = [];

  for (const [normJd, origJd] of normalizedJdSkills) {
    if (normalizedResumeSkills.has(normJd)) {
      const origResume = normalizedResumeSkills.get(normJd)!;
      results.push({
        resumeSkill: origResume,
        jdSkill: origJd,
        similarity: 1.0,
        matchType: "exact",
      });
      exactMatches.add(normJd);
    }
  }

  // Second: semantic matching for non-exact matches
  const unmatchedResume = resumeSkills.filter(
    (s) => !exactMatches.has(normalizeSkill(s).toLowerCase())
  );
  const unmatchedJd = jdSkills.filter(
    (s) => !exactMatches.has(normalizeSkill(s).toLowerCase())
  );

  if (unmatchedResume.length > 0 && unmatchedJd.length > 0) {
    const similarities = await batchComputeSkillSimilarities(
      unmatchedResume,
      unmatchedJd
    );

    // For each JD skill, find the best matching resume skill
    const jdMatched = new Set<string>();
    const resumeMatched = new Set<string>();

    // Sort by similarity descending for greedy matching
    similarities.sort((a, b) => b.similarity - a.similarity);

    for (const sim of similarities) {
      if (jdMatched.has(sim.jdSkill) || resumeMatched.has(sim.resumeSkill))
        continue;

      if (sim.similarity >= PARTIAL_MATCH_THRESHOLD) {
        results.push({
          resumeSkill: sim.resumeSkill,
          jdSkill: sim.jdSkill,
          similarity: Math.round(sim.similarity * 100) / 100,
          matchType: "partial",
        });
        jdMatched.add(sim.jdSkill);
        resumeMatched.add(sim.resumeSkill);
      }
    }

    // Add unmatched JD skills
    for (const jdSkill of unmatchedJd) {
      if (!jdMatched.has(jdSkill)) {
        results.push({
          resumeSkill: "",
          jdSkill,
          similarity: 0,
          matchType: "none",
        });
      }
    }
  }

  return results;
}

/**
 * Compute overall match score from sections and skill matches.
 */
function computeOverallScore(
  sectionScores: SectionScores,
  skillMatches: SemanticSkillMatch[]
): number {
  // Section weights
  const sectionWeight = 0.5;
  const skillWeight = 0.5;

  // Weighted section average
  const sectionAvg =
    sectionScores.skills * 0.35 +
    sectionScores.experience * 0.35 +
    sectionScores.projects * 0.15 +
    sectionScores.education * 0.15;

  // Skill match score
  let skillScore = 0;
  if (skillMatches.length > 0) {
    const totalJdSkills = skillMatches.filter((m) => m.jdSkill).length;
    const matched = skillMatches.filter(
      (m) => m.matchType === "exact" || m.matchType === "partial"
    );
    const matchedScore = matched.reduce((sum, m) => sum + m.similarity * 100, 0);
    skillScore = totalJdSkills > 0 ? matchedScore / totalJdSkills : 0;
  }

  const overall = sectionAvg * sectionWeight + skillScore * skillWeight;
  return Math.round(Math.min(100, Math.max(0, overall)));
}

/**
 * Detect missing skills with importance classification.
 */
export function detectMissingSkills(
  resumeData: ResumeData,
  jdData: JobDescriptionData
): MissingSkill[] {
  const missing = findMissingSkills(
    jdData.requiredSkills,
    resumeData.extractedSkills
  );

  const freqMap = computeSkillFrequency(jdData.rawText, missing);
  const totalSkills = jdData.requiredSkills.length;

  return missing.map((skill) => {
    const frequency = freqMap.get(skill) || 1;
    return {
      skill,
      importance: classifySkillImportance(skill, frequency, totalSkills),
      frequency,
    };
  });
}
