// ─── Resume Types ───────────────────────────────────────────────────────────

export interface ResumeSections {
  skills: string;
  experience: string;
  projects: string;
  education: string;
  certifications: string;
  summary: string;
  contact: string;
}

export interface ResumeData {
  rawText: string;
  sections: ResumeSections;
  extractedSkills: string[];
  fileName: string;
}

// ─── Job Description Types ──────────────────────────────────────────────────

export interface JobDescriptionData {
  rawText: string;
  requiredSkills: string[];
  technologies: string[];
  tools: string[];
  experienceRequirements: string[];
}

// ─── Matching Types ─────────────────────────────────────────────────────────

export interface SemanticSkillMatch {
  resumeSkill: string;
  jdSkill: string;
  similarity: number;
  matchType: "exact" | "partial" | "none";
}

export interface SectionScores {
  skills: number;
  experience: number;
  projects: number;
  education: number;
}

export interface MatchResult {
  overallScore: number;
  sectionScores: SectionScores;
  semanticSkillMatches: SemanticSkillMatch[];
}

// ─── Missing Skill Types ────────────────────────────────────────────────────

export interface MissingSkill {
  skill: string;
  importance: "critical" | "important" | "nice-to-have";
  frequency: number;
}

// ─── Keyword Types ──────────────────────────────────────────────────────────

export interface KeywordAnalysis {
  matched: string[];
  missing: string[];
  overused: string[];
}

// ─── ATS Types ──────────────────────────────────────────────────────────────

export interface ATSAnalysis {
  score: number;
  sectionCompleteness: Record<string, boolean>;
  keywordPresence: number;
  keywordDensity: number;
  readabilityScore: number;
  formattingScore: number;
  suggestions: string[];
}

// ─── Improvement Types ──────────────────────────────────────────────────────

export interface Improvement {
  section: string;
  original: string;
  suggestion: string;
  reason: string;
}

// ─── Strength Score Types ───────────────────────────────────────────────────

export interface StrengthScore {
  overall: number;
  skillAlignment: number;
  keywordCoverage: number;
  experienceRelevance: number;
  projectRelevance: number;
}

// ─── Full Analysis Result ───────────────────────────────────────────────────

export interface AnalysisResult {
  resumeData: ResumeData;
  jdData: JobDescriptionData;
  matchResult: MatchResult;
  missingSkills: MissingSkill[];
  keywordAnalysis: KeywordAnalysis;
  atsAnalysis: ATSAnalysis;
  improvements: Improvement[];
  strengthScore: StrengthScore;
}

// ─── Resume Builder Types ───────────────────────────────────────────────────

export interface ResumeBuilderInput {
  name: string;
  email: string;
  phone: string;
  github: string;
  linkedin: string;
  portfolio: string;
  summary: string;
  skills: string;
  experience: string;
  education: string;
  projects: string;
  courses: string;
  certifications: string;
  jobDescription: string;
}

export interface GeneratedResume {
  content: string;
  sections: {
    header: string;
    summary: string;
    skills: string;
    experience: string;
    education: string;
    projects: string;
    courses: string;
    certifications: string;
  };
}

// ─── LaTeX Resume Generator Types ───────────────────────────────────────────

export interface LaTeXEducationEntry {
  degree: string;
  institution: string;
  year: string;
  detail: string; // e.g. "CGPA: 9.13"
}

export interface LaTeXSkillCategory {
  category: string;
  items: string;
}

export interface LaTeXProjectEntry {
  name: string;
  description: string;
  technologies: string;
  githubUrl?: string;
}

export interface LaTeXExperienceEntry {
  title: string;
  bullets: string[];
}

export interface LaTeXResumeData {
  name: string;
  location: string;
  phone: string;
  email: string;
  links: { label: string; url: string }[];
  education: LaTeXEducationEntry[];
  skills: LaTeXSkillCategory[];
  projects: LaTeXProjectEntry[];
  experience: LaTeXExperienceEntry[];
  courses: string[];
  achievements: string[];
  extraCurricular: string[];
}
