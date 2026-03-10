// ─── OpenRouter LLM Integration ─────────────────────────────────────────────
// LLM used ONLY for:
// 1. Resume writing improvement (phrasing quality)
// 2. Generating optimized resume content
// NOT used for skill extraction, keyword comparison, or scoring.

import type { Improvement, ResumeBuilderInput, GeneratedResume, LaTeXResumeData } from "@/types";
import { extractSkills, normalizeSkill } from "@/lib/skill-extractor";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

function getModel(): string {
  return process.env.OPENROUTER_MODEL || "meta-llama/llama-3.1-70b-instruct";
}

function getApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY environment variable is not set.");
  return key;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Call OpenRouter chat completion API.
 */
async function callOpenRouter(messages: ChatMessage[], maxTokens = 4096): Promise<string> {
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "AI Resume Intelligence Platform",
    },
    body: JSON.stringify({
      model: getModel(),
      messages,
      temperature: 0.7,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  
  // Log finish reason for debugging truncation
  const finishReason = data.choices?.[0]?.finish_reason;
  if (finishReason === "length") {
    console.warn("[OpenRouter] Response was truncated due to max_tokens limit");
  }
  
  return content;
}

/**
 * Generate resume writing improvements.
 * The LLM analyzes writing quality and suggests stronger phrasing.
 * It does NOT fabricate achievements — only transforms existing content.
 */
export async function generateImprovements(
  sections: Record<string, string>
): Promise<Improvement[]> {
  const improvements: Improvement[] = [];

  // Process each non-empty section
  for (const [sectionName, content] of Object.entries(sections)) {
    if (!content || content.trim().length < 20) continue;
    if (sectionName === "contact") continue;

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `You are a professional resume writing consultant. Your task is to analyze the writing quality of resume content and suggest improvements.

Rules you MUST follow:
- Only analyze the text provided. Do not fabricate or invent any achievements, numbers, or experiences.
- Focus on improving phrasing, using stronger action verbs, and encouraging quantified impact statements.
- Suggest improvements for describing: performance improvements, system efficiency, latency reductions, scalability improvements, and throughput improvements — but ONLY if the original text already references these topics.
- Each suggestion must transform the existing bullet point or sentence into a stronger version.
- Return your response as a valid JSON array of objects with these fields: "original" (the original text), "suggestion" (your improved version), "reason" (brief explanation of the improvement).
- If the writing quality is already strong, return an empty array: []
- Return ONLY the JSON array, no other text.`,
      },
      {
        role: "user",
        content: `Analyze the writing quality of this "${sectionName}" section and suggest improvements:\n\n${content}`,
      },
    ];

    try {
      const response = await callOpenRouter(messages);
      const parsed = parseImprovementResponse(response, sectionName);
      improvements.push(...parsed);
    } catch (error) {
      console.error(`Error generating improvements for ${sectionName}:`, error);
    }
  }

  return improvements;
}

/**
 * Parse the LLM response for improvements.
 */
function parseImprovementResponse(
  response: string,
  section: string
): Improvement[] {
  try {
    // Extract JSON from response (handle potential markdown wrapping)
    let jsonStr = response.trim();
    const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (item: Record<string, unknown>) =>
          typeof item.original === "string" &&
          typeof item.suggestion === "string" &&
          typeof item.reason === "string" &&
          item.original.trim().length > 0 &&
          item.suggestion.trim().length > 0
      )
      .map((item: Record<string, string>) => ({
        section,
        original: item.original,
        suggestion: item.suggestion,
        reason: item.reason,
      }));
  } catch {
    return [];
  }
}

/**
 * Generate a tailored resume based on user input and job description.
 * Uses expert resume writing prompt — does NOT fabricate experience.
 */
export async function generateResume(
  input: ResumeBuilderInput
): Promise<GeneratedResume> {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `You are an expert technical resume writer specialized in software engineering resumes.

Your task is to generate a professional, ATS-optimized resume using ONLY the information provided by the user.

CRITICAL RULES:
- Do NOT fabricate experience.
- Do NOT invent technologies not provided.
- Do NOT invent companies or internships.
- Do NOT invent metrics.
- However, improve wording to emphasize: technical impact, system performance, scalability improvements, efficiency improvements, and engineering contribution.
- If quantitative metrics are not explicitly given, encourage measurable descriptions without inventing numbers.

RESUME STRUCTURE (use these exact section headers):

HEADER:
Full Name
Email | Phone | GitHub | LinkedIn | Portfolio
(Only include contact items that are provided. Omit any that are empty.)

PROFESSIONAL SUMMARY:
Write a concise 3–4 line summary describing: technical strengths, primary technologies, development focus areas, and problem-solving ability. Avoid generic phrases.

TECHNICAL SKILLS:
Group skills into categories: Programming Languages, Web Technologies, Machine Learning & Data, Databases, Developer Tools. List technologies concisely. Only include categories that have skills.

PROJECT EXPERIENCE:
For each project:
- Project Name | Tech Stack
- Write 3–5 bullet points describing: system functionality, technical architecture, engineering challenges, performance optimizations, technical contributions.
- Each bullet point should emphasize engineering impact and problem solved.
- Start bullet points with strong action verbs.
- Do NOT include filler phrases like "responsible for".

EDUCATION:
Degree | Institution | Year
Include academic achievements such as GPA if provided.

COURSES / CERTIFICATIONS:
List relevant courses and certifications concisely.

FORMATTING RULES:
- Return the resume in structured markdown using clear section headers.
- Use consistent bullet formatting.
- Ensure the resume fits within 1 page for early-career candidates.
- Avoid unnecessary spacing or decorative characters.
- Use clean bullet points. Each bullet must contain a clear engineering contribution.

STYLE GUIDELINES:
- The resume must sound like it belongs to a strong engineering candidate.
- Focus on: problem solving, system design, technical execution, software engineering practices.
- Avoid generic student language.

OUTPUT FORMAT:
Return your response as a valid JSON object with a "sections" field containing these keys:
- "header": The name and contact line(s)
- "summary": The professional summary paragraph
- "skills": The grouped technical skills
- "experience": All project experience with bullet points
- "education": Education details
- "courses": Courses listed (if provided)
- "certifications": Certifications listed (if provided)

Each section value should be a formatted string ready for display. If a section has no content, use an empty string.
Return ONLY the JSON object, no other text.`,
    },
    {
      role: "user",
      content: buildGenerationPrompt(input),
    },
  ];

  const response = await callOpenRouter(messages);
  return parseGeneratedResume(response);
}

/**
 * Build the generation prompt from user input.
 */
function buildGenerationPrompt(input: ResumeBuilderInput): string {
  const parts: string[] = [];

  parts.push(`Generate a tailored, ATS-optimized resume for the following job description:\n${input.jobDescription}`);
  parts.push(`\nCandidate Information:`);

  if (input.name) parts.push(`Name: ${input.name}`);
  if (input.email) parts.push(`Email: ${input.email}`);
  if (input.phone) parts.push(`Phone: ${input.phone}`);
  if (input.github) parts.push(`GitHub: ${input.github}`);
  if (input.linkedin) parts.push(`LinkedIn: ${input.linkedin}`);
  if (input.portfolio) parts.push(`Portfolio: ${input.portfolio}`);
  if (input.summary) parts.push(`Professional Summary: ${input.summary}`);
  if (input.skills) parts.push(`Skills: ${input.skills}`);
  if (input.experience) parts.push(`Experience:\n${input.experience}`);
  if (input.education) parts.push(`Education:\n${input.education}`);
  if (input.projects) parts.push(`Projects:\n${input.projects}`);
  if (input.courses) parts.push(`Courses:\n${input.courses}`);
  if (input.certifications) parts.push(`Certifications:\n${input.certifications}`);

  return parts.join("\n");
}

/**
 * Parse the generated resume response.
 */
function parseGeneratedResume(response: string): GeneratedResume {
  try {
    let jsonStr = response.trim();
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const parsed = JSON.parse(jsonStr);
    const sections = parsed.sections || parsed;

    const result: GeneratedResume = {
      content: "",
      sections: {
        header: sections.header || "",
        summary: sections.summary || "",
        skills: sections.skills || "",
        experience: sections.experience || sections.projects || "",
        education: sections.education || "",
        projects: sections.projects || "",
        courses: sections.courses || "",
        certifications: sections.certifications || "",
      },
    };

    // Build full content string
    const contentParts: string[] = [];
    for (const [key, value] of Object.entries(result.sections)) {
      if (value && value.trim()) {
        contentParts.push(value);
      }
    }
    result.content = contentParts.join("\n\n");

    return result;
  } catch {
    // If JSON parsing fails, treat the whole response as content
    return {
      content: response,
      sections: {
        header: "",
        summary: "",
        skills: "",
        experience: "",
        education: "",
        projects: "",
        courses: "",
        certifications: "",
      },
    };
  }
}

// ─── LaTeX Resume Data Generation (Full ATS Pipeline) ───────────────────────

/**
 * Priority-ranked keywords from sentence transformer scoring.
 */
interface RankedKeywordTiers {
  highPriority: string[];
  mediumPriority: string[];
  lowPriority: string[];
}

/**
 * Generate structured resume data tailored to a job description,
 * with ATS keyword optimization using sentence transformers + LLM.
 *
 * Pipeline:
 * 1. Sentence transformers rank JD keywords by semantic importance
 * 2. LLM generates tailored resume using ONLY the candidate's actual data
 * 3. LLM naturally weaves ranked ATS keywords into descriptions
 * 4. LLM validates completeness and keyword coverage
 */
export async function generateLaTeXResumeData(
  input: ResumeBuilderInput,
  jdKeywords?: string[],
  rankedTiers?: RankedKeywordTiers
): Promise<LaTeXResumeData> {
  const keywordList = jdKeywords && jdKeywords.length > 0 ? jdKeywords : [];

  const generationMessages: ChatMessage[] = [
    {
      role: "system",
      content: buildATSSystemPrompt(keywordList, rankedTiers),
    },
    {
      role: "user",
      content: buildLaTeXPrompt(input, keywordList, rankedTiers),
    },
  ];

  // Use higher token limit — full resume JSON needs more space
  const rawResponse = await callOpenRouter(generationMessages, 8192);
  console.log("[ResumeGen] LLM raw response length:", rawResponse.length);
  const resumeData = parseLaTeXResumeData(rawResponse, input);
  console.log("[ResumeGen] Parsed projects:", resumeData.projects.length, "skills:", resumeData.skills.length);

  // Validate with LLM — check completeness and ATS keyword coverage
  const validated = await validateResumeWithLLM(resumeData, input, keywordList);

  // Deterministic post-processing: ensure ATS keywords actually appear in the resume
  const final = injectMissingKeywords(validated, keywordList, input);
  console.log("[ResumeGen] Final skills categories:", final.skills.length);

  return final;
}

/**
 * Build the ATS-focused system prompt with ranked keyword tiers.
 */
function buildATSSystemPrompt(keywords: string[], rankedTiers?: RankedKeywordTiers): string {
  let keywordSection = "";

  if (rankedTiers && (rankedTiers.highPriority.length > 0 || rankedTiers.mediumPriority.length > 0)) {
    keywordSection = `
ATS KEYWORDS (ranked by importance using sentence-transformer semantic analysis):

CRITICAL KEYWORDS (must appear in resume — these are the highest-scoring terms for ATS screening):
${rankedTiers.highPriority.length > 0 ? rankedTiers.highPriority.join(", ") : "None identified"}

IMPORTANT KEYWORDS (should appear where naturally relevant):
${rankedTiers.mediumPriority.length > 0 ? rankedTiers.mediumPriority.join(", ") : "None identified"}

SUPPLEMENTARY KEYWORDS (include if the candidate has experience with them):
${rankedTiers.lowPriority.length > 0 ? rankedTiers.lowPriority.join(", ") : "None identified"}
`;
  } else if (keywords.length > 0) {
    keywordSection = `
ATS KEYWORDS FROM JOB DESCRIPTION (incorporate naturally into the resume):
${keywords.join(", ")}
`;
  }

  return `You are an expert ATS resume optimizer. You take a candidate's REAL information and restructure it into a professional, ATS-optimized resume tailored to a specific job description.

CRITICAL RULES — NEVER VIOLATE THESE:
1. USE ONLY THE CANDIDATE'S ACTUAL DATA. Never fabricate companies, internships, projects, metrics, or skills.
2. DO NOT copy content from any template or example. The output must be unique to this candidate.
3. INCLUDE EVERY project, experience entry, education entry, and course the candidate provided. Do not drop or skip any.
4. The candidate's NAME, EMAIL, PHONE, GITHUB, LINKEDIN must be used exactly as provided.

YOUR JOB IS TO:
- Take the candidate's raw input and REWRITE it with professional phrasing, strong action verbs, and ATS-friendly language.
- Reorganize sections so the most JD-relevant content appears first.
- Naturally weave ATS keywords into project descriptions, experience bullets, and skill listings — but ONLY if the candidate's actual background supports it.
- For each project: write a clear one-line summary of what was built and WHY it matters, then list the technologies used.
- For each experience entry: rewrite bullets using action verbs (Engineered, Architected, Implemented, Developed, Optimized, Deployed, Automated, Integrated) to emphasize technical impact.
- For skills: group into logical categories (Languages, Frameworks, Databases, Tools, etc.) with JD-relevant skills listed first in each category.

KEYWORD INJECTION STRATEGY:
- For CRITICAL keywords: ensure they appear at least once in skills, project descriptions, or experience bullets.
- For IMPORTANT keywords: include them where the candidate's experience naturally aligns.
- Do NOT stuff keywords artificially. Every keyword must fit naturally in context.
- If the candidate doesn't have experience with a keyword, DO NOT add it.
${keywordSection}

OUTPUT FORMAT — Return a valid JSON object with this EXACT structure:
{
  "name": "Candidate's actual name",
  "location": "City, State (if provided)",
  "phone": "Phone (exactly as provided)",
  "email": "Email (exactly as provided)",
  "links": [{"label": "LinkedIn", "url": "..."}, {"label": "GitHub", "url": "..."}],
  "education": [
    {"degree": "Actual degree", "institution": "Actual university", "year": "Actual years", "detail": "CGPA if provided"}
  ],
  "skills": [
    {"category": "Category", "items": "Skill1, Skill2, Skill3 (from candidate's actual skills, reordered for JD relevance)"}
  ],
  "projects": [
    {
      "name": "Candidate's actual project name",
      "description": "Rewritten professional description of what was built, engineering approach, and impact",
      "technologies": "Actual tech stack used",
      "githubUrl": "Actual GitHub URL if provided"
    }
  ],
  "experience": [
    {
      "title": "Candidate's actual role/activity",
      "bullets": ["Rewritten impactful bullet 1", "Rewritten impactful bullet 2"]
    }
  ],
  "courses": ["Actual course 1", "Actual course 2"],
  "achievements": ["Actual achievement 1", "Actual achievement 2"],
  "extraCurricular": ["Actual activity 1"]
}

Return ONLY the JSON. No markdown wrapping, no explanation.`;
}

/**
 * Build the user prompt with all candidate information and ranked keywords.
 */
function buildLaTeXPrompt(input: ResumeBuilderInput, keywords: string[], rankedTiers?: RankedKeywordTiers): string {
  const parts: string[] = [];

  parts.push(`=== TARGET JOB DESCRIPTION ===`);
  parts.push(input.jobDescription);

  if (rankedTiers && rankedTiers.highPriority.length > 0) {
    parts.push(`\n=== ATS KEYWORDS (ranked by sentence-transformer importance) ===`);
    parts.push(`CRITICAL (must include): ${rankedTiers.highPriority.join(", ")}`);
    if (rankedTiers.mediumPriority.length > 0) {
      parts.push(`IMPORTANT (include where relevant): ${rankedTiers.mediumPriority.join(", ")}`);
    }
    if (rankedTiers.lowPriority.length > 0) {
      parts.push(`SUPPLEMENTARY (include if applicable): ${rankedTiers.lowPriority.join(", ")}`);
    }
  } else if (keywords.length > 0) {
    parts.push(`\n=== ATS KEYWORDS ===`);
    parts.push(keywords.join(", "));
  }

  parts.push(`\n=== CANDIDATE'S ACTUAL INFORMATION (use ONLY this data — do NOT fabricate anything) ===`);

  parts.push(`\nName: ${input.name}`);
  if (input.email) parts.push(`Email: ${input.email}`);
  if (input.phone) parts.push(`Phone: ${input.phone}`);
  if (input.github) parts.push(`GitHub: ${input.github}`);
  if (input.linkedin) parts.push(`LinkedIn: ${input.linkedin}`);
  if (input.portfolio) parts.push(`Portfolio: ${input.portfolio}`);

  if (input.education) {
    parts.push(`\n--- Education (include ALL entries exactly as provided) ---`);
    parts.push(input.education);
  }

  if (input.skills) {
    parts.push(`\n--- Skills (these are the candidate's ACTUAL skills — reorder for JD relevance but do NOT add skills they don't have) ---`);
    parts.push(input.skills);
  }

  if (input.projects) {
    parts.push(`\n--- Projects (include EVERY project — rewrite descriptions professionally with ATS keywords woven in) ---`);
    parts.push(input.projects);
  }

  if (input.experience) {
    parts.push(`\n--- Experience (include ALL entries — rewrite bullets with action verbs and ATS keywords) ---`);
    parts.push(input.experience);
  }

  if (input.summary) {
    parts.push(`\n--- Professional Summary ---`);
    parts.push(input.summary);
  }

  if (input.courses) {
    parts.push(`\n--- Courses (include ALL, reorder by JD relevance) ---`);
    parts.push(input.courses);
  }

  if (input.certifications) {
    parts.push(`\n--- Certifications / Achievements ---`);
    parts.push(input.certifications);
  }

  parts.push(`\n=== INSTRUCTIONS ===`);
  parts.push(`1. Generate the resume JSON using ONLY the candidate data above.`);
  parts.push(`2. Every project and experience entry MUST be included — do not skip any.`);
  parts.push(`3. Naturally incorporate the CRITICAL and IMPORTANT ATS keywords into descriptions and bullets.`);
  parts.push(`4. Reorder skills and projects so JD-relevant ones appear first.`);
  parts.push(`5. Use strong action verbs and quantify impact where the candidate's data supports it.`);
  parts.push(`6. Do NOT copy content from any template — generate unique content from this candidate's data.`);

  return parts.join("\n");
}

/**
 * Validate and refine resume data using LLM.
 * Checks: completeness, keyword coverage, ATS compliance.
 */
async function validateResumeWithLLM(
  data: LaTeXResumeData,
  input: ResumeBuilderInput,
  keywords: string[]
): Promise<LaTeXResumeData> {
  // Build a summary of what we have
  const resumeSummary = JSON.stringify(data, null, 2);

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `You are a resume quality assurance expert. You will receive a structured resume JSON that was generated for a specific job description.

Your task is to REVIEW and IMPROVE it, then return the corrected version.

CHECK FOR:
1. COMPLETENESS: Every section must have content if the original candidate data had it. Missing sections = FAIL.
2. KEYWORD COVERAGE: The resume must naturally contain these ATS keywords where relevant: ${keywords.join(", ")}
3. DESCRIPTION QUALITY: Each project must have a meaningful description (not just the name). Each experience must have detailed bullets.
4. SKILL ORGANIZATION: Skills must be grouped logically with JD-relevant categories first.
5. NO FABRICATION: Do not add skills, projects, or experience the candidate didn't provide.

If the resume is already complete and well-optimized, return it as-is.
If improvements are needed, make them and return the corrected JSON.

Return ONLY the corrected JSON object with the same structure. No explanation.`,
    },
    {
      role: "user",
      content: `Job Description:\n${input.jobDescription}\n\nOriginal Candidate Data:\nName: ${input.name}\nSkills: ${input.skills}\nProjects: ${input.projects}\nExperience: ${input.experience}\nEducation: ${input.education}\nCourses: ${input.courses}\nCertifications: ${input.certifications}\n\nGenerated Resume JSON to validate:\n${resumeSummary}`,
    },
  ];

  try {
    const response = await callOpenRouter(messages, 8192);
    const validated = parseLaTeXResumeData(response, input);

    // Ensure validated version doesn't lose data — merge with original if needed
    return mergeResumeData(data, validated);
  } catch {
    // If validation fails, return the original
    return data;
  }
}

/**
 * Merge two resume data objects, preferring the validated version
 * but falling back to original for any missing arrays.
 */
function mergeResumeData(
  original: LaTeXResumeData,
  validated: LaTeXResumeData
): LaTeXResumeData {
  return {
    name: validated.name || original.name,
    location: validated.location || original.location,
    phone: validated.phone || original.phone,
    email: validated.email || original.email,
    links: validated.links.length > 0 ? validated.links : original.links,
    education: validated.education.length > 0 ? validated.education : original.education,
    skills: validated.skills.length > 0 ? validated.skills : original.skills,
    projects: validated.projects.length > 0 ? validated.projects : original.projects,
    experience: validated.experience.length > 0 ? validated.experience : original.experience,
    courses: validated.courses.length > 0 ? validated.courses : original.courses,
    achievements: validated.achievements.length > 0 ? validated.achievements : original.achievements,
    extraCurricular: validated.extraCurricular.length > 0 ? validated.extraCurricular : original.extraCurricular,
  };
}

/**
 * Parse the LLM response into LaTeXResumeData with robust fallbacks.
 */
function parseLaTeXResumeData(
  response: string,
  input: ResumeBuilderInput
): LaTeXResumeData {
  try {
    let jsonStr = response.trim();
    // Extract JSON from potential markdown wrapping
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const parsed = JSON.parse(jsonStr);

    return {
      name: parsed.name || input.name || "",
      location: parsed.location || "",
      phone: parsed.phone || input.phone || "",
      email: parsed.email || input.email || "",
      links: Array.isArray(parsed.links) ? parsed.links : buildFallbackLinks(input),
      education: Array.isArray(parsed.education) ? parsed.education : [],
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      experience: Array.isArray(parsed.experience) ? parsed.experience : [],
      courses: Array.isArray(parsed.courses) ? parsed.courses : [],
      achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
      extraCurricular: Array.isArray(parsed.extraCurricular) ? parsed.extraCurricular : [],
    };
  } catch {
    return {
      name: input.name || "",
      location: "",
      phone: input.phone || "",
      email: input.email || "",
      links: buildFallbackLinks(input),
      education: [],
      skills: [],
      projects: [],
      experience: [],
      courses: [],
      achievements: [],
      extraCurricular: [],
    };
  }
}

/**
 * Build fallback link list from input fields.
 */
function buildFallbackLinks(input: ResumeBuilderInput): { label: string; url: string }[] {
  const links: { label: string; url: string }[] = [];
  if (input.linkedin) links.push({ label: "LinkedIn", url: input.linkedin });
  if (input.github) links.push({ label: "GitHub", url: input.github });
  if (input.portfolio) links.push({ label: "Portfolio", url: input.portfolio });
  return links;
}

/**
 * Deterministic post-processing: ensure ATS keywords appear in the resume.
 * Uses the same taxonomy-based skill extractor to match candidate skills
 * against JD keywords, handling aliases (e.g., "MERN" → React, Node.js, MongoDB, Express).
 */
function injectMissingKeywords(
  data: LaTeXResumeData,
  keywords: string[],
  input: ResumeBuilderInput
): LaTeXResumeData {
  if (!keywords || keywords.length === 0) return data;

  // Serialize the entire resume to lowercase text for keyword presence checking
  const resumeText = [
    ...data.skills.map((s) => `${s.category} ${s.items}`),
    ...data.projects.map((p) => `${p.name} ${p.description} ${p.technologies}`),
    ...data.experience.map((e) => `${e.title} ${e.bullets.join(" ")}`),
    ...data.courses,
    ...data.achievements,
  ]
    .join(" ")
    .toLowerCase();

  // Use taxonomy-based skill extraction on the candidate's FULL input
  // This catches aliases: "MERN Stack" → React, Node.js, MongoDB, Express
  const candidateFullText = [
    input.skills || "",
    input.projects || "",
    input.experience || "",
    input.courses || "",
    input.certifications || "",
    input.jobDescription || "",
  ].join(" ");

  const candidateExtractedSkills = new Set(
    extractSkills(candidateFullText).map((s) => s.toLowerCase())
  );

  // Also add raw candidate text for direct matching
  const candidateRawLower = [
    input.skills || "",
    input.projects || "",
    input.experience || "",
    input.courses || "",
    input.certifications || "",
  ]
    .join(" ")
    .toLowerCase();

  console.log("[ResumeGen] Candidate extracted skills:", [...candidateExtractedSkills].join(", "));

  // Find keywords that are MISSING from the resume
  const missingKeywords: string[] = [];
  for (const keyword of keywords) {
    const kwLower = keyword.toLowerCase();
    const normalizedKw = normalizeSkill(keyword).toLowerCase();

    // Check if keyword (or its normalized form) is already in the resume
    const isInResume =
      resumeText.includes(kwLower) ||
      resumeText.includes(normalizedKw);

    if (isInResume) continue;

    // Check if the candidate has this skill via:
    // 1. Taxonomy extraction (handles aliases like MERN → React, js → JavaScript)
    // 2. Raw text matching
    // 3. JD relevance (keyword came from JD, candidate should have JD-relevant skills)
    const candidateHasSkill =
      candidateExtractedSkills.has(kwLower) ||
      candidateExtractedSkills.has(normalizedKw) ||
      candidateRawLower.includes(kwLower);

    if (candidateHasSkill) {
      missingKeywords.push(keyword);
    }
  }

  if (missingKeywords.length === 0) {
    console.log("[ResumeGen] All keywords already present in resume");
    return data;
  }

  console.log("[ResumeGen] Injecting missing keywords:", missingKeywords.join(", "));

  // Clone the data to avoid mutation
  const result: LaTeXResumeData = {
    ...data,
    skills: data.skills.map((s) => ({ ...s })),
    projects: data.projects.map((p) => ({ ...p })),
    experience: data.experience.map((e) => ({ ...e, bullets: [...e.bullets] })),
  };

  // Inject each keyword into the best matching skill category
  const remainingKeywords: string[] = [];
  for (const keyword of missingKeywords) {
    const kwLower = keyword.toLowerCase();
    let injected = false;

    // Try to find the best skill category for this keyword
    for (const skillCat of result.skills) {
      const catLower = skillCat.category.toLowerCase();
      const itemsLower = skillCat.items.toLowerCase();

      // Skip if already in this category
      if (itemsLower.includes(kwLower)) {
        injected = true;
        break;
      }

      // Match keyword to category
      const belongsHere =
        (isLikelyLanguage(keyword) && /language|programming/i.test(catLower)) ||
        (isLikelyFramework(keyword) && /web|framework|frontend|backend|librar/i.test(catLower)) ||
        (isLikelyDatabase(keyword) && /database|data|storage/i.test(catLower)) ||
        (isLikelyTool(keyword) && /tool|devops|cloud|build|infra/i.test(catLower));

      if (belongsHere) {
        skillCat.items += `, ${keyword}`;
        injected = true;
        break;
      }
    }

    if (!injected) {
      remainingKeywords.push(keyword);
    }
  }

  // For remaining keywords that didn't match any category,
  // add to the most relevant existing category or create one
  if (remainingKeywords.length > 0) {
    // Group remaining by type
    const langKws = remainingKeywords.filter(isLikelyLanguage);
    const fwKws = remainingKeywords.filter(isLikelyFramework);
    const dbKws = remainingKeywords.filter(isLikelyDatabase);
    const toolKws = remainingKeywords.filter(isLikelyTool);
    const otherKws = remainingKeywords.filter(
      (k) => !isLikelyLanguage(k) && !isLikelyFramework(k) && !isLikelyDatabase(k) && !isLikelyTool(k)
    );

    // Helper: add keywords to the first matching category or the last one
    const addToSkills = (kws: string[]) => {
      if (kws.length === 0) return;
      if (result.skills.length > 0) {
        const target = result.skills[result.skills.length - 1];
        for (const kw of kws) {
          if (!target.items.toLowerCase().includes(kw.toLowerCase())) {
            target.items += `, ${kw}`;
          }
        }
      } else {
        result.skills.push({ category: "Technical Skills", items: kws.join(", ") });
      }
    };

    // Try adding to relevant existing categories, or fall back to last one
    for (const [kws, pattern] of [
      [langKws, /language|programming/i],
      [fwKws, /web|framework|frontend|backend/i],
      [dbKws, /database|data/i],
      [toolKws, /tool|devops|cloud/i],
    ] as [string[], RegExp][]) {
      if (kws.length === 0) continue;
      const cat = result.skills.find((s) => pattern.test(s.category));
      if (cat) {
        for (const kw of kws) {
          if (!cat.items.toLowerCase().includes(kw.toLowerCase())) {
            cat.items += `, ${kw}`;
          }
        }
      } else {
        addToSkills(kws);
      }
    }

    addToSkills(otherKws);
  }

  return result;
}

// Keyword classification helpers
const LANGUAGES = new Set(["javascript", "typescript", "python", "java", "c++", "c", "c#", "go", "rust", "ruby", "php", "swift", "kotlin", "scala", "r", "matlab", "perl", "dart", "lua", "sql", "html", "css", "shell", "bash"]);
const FRAMEWORKS = new Set(["react", "angular", "vue.js", "vue", "next.js", "nextjs", "nuxt.js", "svelte", "express", "django", "flask", "fastapi", "spring boot", "rails", "laravel", "node.js", "nodejs", "nestjs", ".net", "asp.net", "tailwind css", "bootstrap", "material ui", "react native", "flutter"]);
const DATABASES = new Set(["postgresql", "mysql", "mongodb", "redis", "sqlite", "elasticsearch", "dynamodb", "cassandra", "firebase", "supabase", "neo4j", "mariadb", "sql server"]);
const TOOLS = new Set(["docker", "kubernetes", "jenkins", "github actions", "terraform", "ansible", "nginx", "git", "github", "aws", "azure", "google cloud", "gcp", "heroku", "vercel", "webpack", "vite", "ci/cd", "jira", "postman", "figma"]);

function isLikelyLanguage(kw: string): boolean { return LANGUAGES.has(kw.toLowerCase()); }
function isLikelyFramework(kw: string): boolean { return FRAMEWORKS.has(kw.toLowerCase()); }
function isLikelyDatabase(kw: string): boolean { return DATABASES.has(kw.toLowerCase()); }
function isLikelyTool(kw: string): boolean { return TOOLS.has(kw.toLowerCase()); }
