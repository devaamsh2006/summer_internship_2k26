// ─── Job Description Analyzer ───────────────────────────────────────────────
// Rule-based JD parsing. Deterministic extraction of skills and requirements.

import type { JobDescriptionData } from "@/types";
import { extractSkills, SKILL_TAXONOMY } from "./skill-extractor";

// ─── Tool & Technology Categories ───────────────────────────────────────────

const TOOL_KEYWORDS = new Set([
  "jira",
  "confluence",
  "slack",
  "trello",
  "asana",
  "linear",
  "notion",
  "monday.com",
  "clickup",
  "basecamp",
  "miro",
  "postman",
  "insomnia",
  "vs code",
  "visual studio",
  "intellij",
  "eclipse",
  "xcode",
  "android studio",
  "sublime",
  "vim",
  "emacs",
  "datadog",
  "splunk",
  "grafana",
  "new relic",
  "sentry",
  "pagerduty",
  "opsgenie",
  "sonarqube",
  "coveralls",
  "codecov",
]);

// ─── Experience Requirement Patterns ────────────────────────────────────────

const EXPERIENCE_PATTERNS = [
  /(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)/gi,
  /(?:minimum|at\s+least|min)\s*(\d+)\s*(?:years?|yrs?)/gi,
  /(\d+)\s*(?:-|to)\s*(\d+)\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)/gi,
  /(?:senior|lead|principal|staff)\s+(?:level|position|role)/gi,
  /(?:entry[\s-]level|junior|mid[\s-]level|senior|lead|principal|staff|architect)/gi,
  /(?:bachelor|master|phd|doctorate|bs|ms|ba|ma|mba)\s*(?:'?s?)?\s*(?:degree|in)/gi,
];

/**
 * Analyze a job description and extract structured data.
 * Fully deterministic — no LLM.
 */
export function analyzeJobDescription(text: string): JobDescriptionData {
  if (!text || text.trim().length === 0) {
    return {
      rawText: "",
      requiredSkills: [],
      technologies: [],
      tools: [],
      experienceRequirements: [],
    };
  }

  const cleanedText = text.trim();
  const requiredSkills = extractSkills(cleanedText);

  // Separate technologies from tools
  const technologies: string[] = [];
  const tools: string[] = [];

  for (const skill of requiredSkills) {
    if (TOOL_KEYWORDS.has(skill.toLowerCase())) {
      tools.push(skill);
    } else {
      technologies.push(skill);
    }
  }

  // Also scan for tools that may not be in the skill taxonomy
  const lowerText = cleanedText.toLowerCase();
  for (const tool of TOOL_KEYWORDS) {
    const escaped = tool.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(
      `(?:^|[\\s,;|/()\\[\\]{}])${escaped}(?:$|[\\s,;|/()\\[\\]{}])`,
      "i"
    );
    if (pattern.test(lowerText)) {
      const normalized =
        tool.charAt(0).toUpperCase() + tool.slice(1);
      if (!tools.includes(normalized) && !tools.map(t => t.toLowerCase()).includes(tool)) {
        tools.push(normalized);
      }
    }
  }

  const experienceRequirements = extractExperienceRequirements(cleanedText);

  return {
    rawText: cleanedText,
    requiredSkills,
    technologies,
    tools,
    experienceRequirements,
  };
}

/**
 * Extract experience requirements from JD text.
 */
function extractExperienceRequirements(text: string): string[] {
  const requirements: string[] = [];
  const lines = text.split(/[.\n]/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    for (const pattern of EXPERIENCE_PATTERNS) {
      // Reset lastIndex for global patterns
      pattern.lastIndex = 0;
      const match = pattern.exec(trimmed);
      if (match) {
        // Get the full sentence/line containing the match
        requirements.push(trimmed);
        break;
      }
    }
  }

  // Deduplicate
  return [...new Set(requirements)];
}

/**
 * Extract required vs preferred skills from JD sections.
 */
export function categorizeRequirements(text: string): {
  required: string[];
  preferred: string[];
} {
  const lower = text.toLowerCase();

  // Find "required" and "preferred/nice to have" sections
  const requiredPatterns = [
    /(?:required|must\s+have|essential|mandatory|minimum)\s*(?:qualifications?|skills?|requirements?)?\s*[:]/gi,
  ];
  const preferredPatterns = [
    /(?:preferred|nice\s+to\s+have|bonus|desired|optional|plus)\s*(?:qualifications?|skills?|requirements?)?\s*[:]/gi,
  ];

  let requiredStart = -1;
  let preferredStart = -1;

  for (const pattern of requiredPatterns) {
    pattern.lastIndex = 0;
    const match = pattern.exec(lower);
    if (match) {
      requiredStart = match.index + match[0].length;
      break;
    }
  }

  for (const pattern of preferredPatterns) {
    pattern.lastIndex = 0;
    const match = pattern.exec(lower);
    if (match) {
      preferredStart = match.index + match[0].length;
      break;
    }
  }

  // If we found sections, extract skills from each
  if (requiredStart >= 0 && preferredStart >= 0) {
    const boundary = Math.min(requiredStart, preferredStart);
    const requiredSection =
      requiredStart < preferredStart
        ? text.slice(requiredStart, preferredStart)
        : text.slice(requiredStart);
    const preferredSection =
      preferredStart < requiredStart
        ? text.slice(preferredStart, requiredStart)
        : text.slice(preferredStart);

    return {
      required: extractSkills(requiredSection),
      preferred: extractSkills(preferredSection),
    };
  }

  // Default: all skills as required
  return {
    required: extractSkills(text),
    preferred: [],
  };
}
