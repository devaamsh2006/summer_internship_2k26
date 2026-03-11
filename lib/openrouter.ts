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
- Take the candidate's raw input and REWRITE it with professional phrasing, strong action verbs, and ATS-friendly language. NEVER return the user's original text as-is.
- Reorganize sections so the most JD-relevant content appears first.
- Naturally weave ATS keywords into project descriptions, experience bullets, and skill listings — but ONLY if the candidate's actual background supports it.
- For each project: write a concise one-line "description" summary, then generate 3-5 ENHANCED bullet points in a "bullets" array. Each bullet must be a professionally rewritten, expanded version of the candidate's input — describing the technical approach, architecture, and engineering patterns used. The bullets must NOT be copies of the user's text.
- For each experience entry: rewrite bullets using action verbs (Engineered, Architected, Implemented, Developed, Optimized, Deployed, Automated, Integrated) to emphasize technical impact.
- For skills: group into logical categories (Languages, Frameworks, Databases, Tools, etc.) with JD-relevant skills listed first in each category.

KEYWORD INJECTION STRATEGY:
- For CRITICAL keywords: ensure they appear at least once in skills, project descriptions, or experience bullets.
- For IMPORTANT keywords: include them where the candidate's experience naturally aligns.
- Do NOT stuff keywords artificially. Every keyword must fit naturally in context.
- If the candidate doesn't have experience with a keyword, DO NOT add it.
- NEVER place security/auth keywords (like Authentication, Authorization, OAuth, JWT, RBAC) into soft skills. These are TECHNICAL concepts and belong in technical skills or should be woven into project/experience descriptions.
- NEVER place methodology keywords (like Agile, Scrum, CI/CD, Microservices, TDD) into soft skills. Place them in a methodologies or tools category.

PROJECT DESCRIPTION ENHANCEMENT (THIS IS CRITICAL — DO NOT JUST COPY THE USER'S TEXT):
- You MUST rewrite and ENHANCE every project description. NEVER copy the candidate's text verbatim.
- For each project, generate 3-5 detailed bullet points in the "bullets" array that expand on the original description.
- Each bullet point must start with a strong action verb (Engineered, Architected, Implemented, Developed, Optimized, Deployed, Automated, Integrated, Designed, Built, Configured, Streamlined).
- Transform vague descriptions into specific technical contributions: describe WHAT was built, HOW it was architected, WHAT patterns/technologies were used, and WHAT engineering challenges were addressed.
- Naturally weave ATS-relevant keywords into the bullets by describing how those technologies were actually applied in the project.
- If the candidate wrote "built a chat app using React and Node", you should expand this into multiple bullets describing: the real-time architecture, state management approach, API design, database schema decisions, deployment strategy, etc.
- The "description" field should be a concise one-line summary. The real enhanced content goes in "bullets".
- Do NOT invent metrics, performance numbers, or specific quantitative results. Instead, describe the technical approach and engineering impact qualitatively.
- Focus on WHAT was built, HOW it was architected, and WHAT engineering challenges were solved.
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
      "description": "A concise one-line summary of what the project does and its purpose",
      "bullets": [
        "Enhanced bullet 1: Describe a key technical contribution using strong action verbs and ATS keywords",
        "Enhanced bullet 2: Explain the architecture, design decisions, or engineering approach used",
        "Enhanced bullet 3: Highlight a specific technical challenge solved or optimization made",
        "Enhanced bullet 4: Describe integration patterns, API design, or system components built"
      ],
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
  parts.push(`3. Naturally incorporate the CRITICAL and IMPORTANT ATS keywords into project bullets and experience bullets by describing HOW those technologies were used.`);
  parts.push(`4. Reorder skills and projects so JD-relevant ones appear first.`);
  parts.push(`5. Use strong action verbs. Describe technical approaches and engineering impact qualitatively — do NOT invent specific numbers or metrics.`);
  parts.push(`6. Do NOT copy content from any template — generate unique content from this candidate's data.`);
  parts.push(`7. NEVER place technical keywords (Authentication, Authorization, OAuth, JWT, CI/CD, Agile, etc.) in soft skills. These belong in technical skill categories or project descriptions.`);
  parts.push(`8. CRITICAL: For each project, generate 3-5 ENHANCED bullet points in a "bullets" array. Do NOT just copy the user's project description. REWRITE and EXPAND each project with professional, detailed technical descriptions using strong action verbs. The bullets should describe architecture, engineering approach, technical challenges solved, and how JD-relevant technologies were applied.`);
  parts.push(`9. The "description" field for projects should be a concise one-line summary. The detailed enhanced content goes in "bullets".`);

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
3. PROJECT BULLET QUALITY: Each project MUST have 3-5 detailed, enhanced bullet points in its "bullets" array. If any project has empty or missing bullets, GENERATE them. Bullets must NOT be copies of the user's original text — they must be professionally enhanced with action verbs and ATS-relevant terminology.
4. DESCRIPTION QUALITY: Each experience must have detailed bullets.
5. SKILL ORGANIZATION: Skills must be grouped logically with JD-relevant categories first.
6. NO FABRICATION: Do not add skills, projects, or experience the candidate didn't provide. But DO enhance and expand the DESCRIPTIONS of existing items.

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
  // For projects, prefer the version with more bullet content
  let mergedProjects = validated.projects.length > 0 ? validated.projects : original.projects;
  if (validated.projects.length > 0 && original.projects.length > 0) {
    mergedProjects = validated.projects.map((vp, i) => {
      const op = original.projects[i];
      if (!op) return vp;
      // Prefer whichever has more bullets (enhanced content)
      const vBullets = vp.bullets && vp.bullets.length > 0 ? vp.bullets : [];
      const oBullets = op.bullets && op.bullets.length > 0 ? op.bullets : [];
      return {
        ...vp,
        bullets: vBullets.length >= oBullets.length ? vBullets : oBullets,
      };
    });
  }

  return {
    name: validated.name || original.name,
    location: validated.location || original.location,
    phone: validated.phone || original.phone,
    email: validated.email || original.email,
    links: validated.links.length > 0 ? validated.links : original.links,
    education: validated.education.length > 0 ? validated.education : original.education,
    skills: validated.skills.length > 0 ? validated.skills : original.skills,
    projects: mergedProjects,
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
      projects: Array.isArray(parsed.projects) ? parsed.projects.map((p: Record<string, unknown>) => ({
        name: p.name || "",
        description: p.description || "",
        bullets: Array.isArray(p.bullets) ? p.bullets : [],
        technologies: p.technologies || "",
        githubUrl: p.githubUrl || "",
      })) : [],
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
    ...data.projects.map((p) => `${p.name} ${p.description} ${p.technologies} ${(p.bullets || []).join(" ")}`),
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
    projects: data.projects.map((p) => ({ ...p, bullets: [...(p.bullets || [])] })),
    experience: data.experience.map((e) => ({ ...e, bullets: [...e.bullets] })),
  };

  // Category pattern mapping: keyword type → regex patterns to match category names
  const CATEGORY_PATTERNS: Record<string, RegExp> = {
    language: /language|programming/i,
    framework: /web|framework|frontend|backend|librar|technolog/i,
    database: /database|data(?!.*science)|storage/i,
    tool: /tool|devops|cloud|build|infra|developer/i,
    security: /security|auth|web.*technolog|tool|developer/i,
    concept: /concept|methodolog|practice|architect|developer/i,
    testing: /test|quality|developer.*tool|tool/i,
    cloud_service: /cloud|aws|azure|gcp|devops|infra|tool/i,
    data_science: /data.*science|ml|ai|machine|analytic|data/i,
  };

  // New category names to create if no existing category matches
  const NEW_CATEGORY_NAMES: Record<string, string> = {
    language: "Programming Languages",
    framework: "Frameworks & Libraries",
    database: "Databases",
    tool: "Developer Tools",
    security: "Security & Authentication",
    concept: "Methodologies & Concepts",
    testing: "Testing",
    cloud_service: "Cloud Services",
    data_science: "Data Science & ML",
  };

  // Inject each keyword into the best matching skill category
  const remainingKeywords: string[] = [];
  for (const keyword of missingKeywords) {
    const kwLower = keyword.toLowerCase();
    let injected = false;
    const kwType = classifyKeyword(keyword);

    // Try to find the best skill category for this keyword
    for (const skillCat of result.skills) {
      const catLower = skillCat.category.toLowerCase();
      const itemsLower = skillCat.items.toLowerCase();

      // Skip if already in this category
      if (itemsLower.includes(kwLower)) {
        injected = true;
        break;
      }

      // Match keyword to category using its classified type
      const pattern = kwType !== "unknown" ? CATEGORY_PATTERNS[kwType] : null;
      if (pattern && pattern.test(catLower)) {
        skillCat.items += `, ${keyword}`;
        injected = true;
        break;
      }
    }

    if (!injected) {
      remainingKeywords.push(keyword);
    }
  }

  // For remaining keywords, group by type and add to matching categories or create new ones
  if (remainingKeywords.length > 0) {
    // Group by classification
    const grouped: Record<string, string[]> = {};
    for (const kw of remainingKeywords) {
      const kwType = classifyKeyword(kw);
      if (!grouped[kwType]) grouped[kwType] = [];
      grouped[kwType].push(kw);
    }

    // For each group, try to find an existing category or create one
    for (const [kwType, kws] of Object.entries(grouped)) {
      if (kws.length === 0) continue;

      const pattern = CATEGORY_PATTERNS[kwType];
      const existingCat = pattern
        ? result.skills.find((s) => pattern.test(s.category))
        : null;

      if (existingCat) {
        for (const kw of kws) {
          if (!existingCat.items.toLowerCase().includes(kw.toLowerCase())) {
            existingCat.items += `, ${kw}`;
          }
        }
      } else if (kwType !== "unknown") {
        // Create a new category for this type
        const newCatName = NEW_CATEGORY_NAMES[kwType] || "Technical Skills";
        // Check if we just created this category in a previous iteration
        const justCreated = result.skills.find(
          (s) => s.category === newCatName
        );
        if (justCreated) {
          for (const kw of kws) {
            if (!justCreated.items.toLowerCase().includes(kw.toLowerCase())) {
              justCreated.items += `, ${kw}`;
            }
          }
        } else {
          result.skills.push({ category: newCatName, items: kws.join(", ") });
        }
      } else {
        // Unknown type: try to find the most relevant category by checking
        // if any existing category's items contain related keywords
        let bestCat: typeof result.skills[0] | null = null;
        for (const skillCat of result.skills) {
          const catLower = skillCat.category.toLowerCase();
          // Skip soft skills — never inject technical keywords here
          if (/soft\s*skill|interpersonal|communication/i.test(catLower)) continue;
          // Prefer "Technical Skills" or "Developer Tools" as catch-all
          if (/technical|developer|tool/i.test(catLower)) {
            bestCat = skillCat;
            break;
          }
        }
        if (bestCat) {
          for (const kw of kws) {
            if (!bestCat.items.toLowerCase().includes(kw.toLowerCase())) {
              bestCat.items += `, ${kw}`;
            }
          }
        } else if (result.skills.length > 0) {
          // Last resort: find first non-soft-skills category
          const safeCat = result.skills.find(
            (s) => !/soft\s*skill|interpersonal|communication/i.test(s.category)
          );
          if (safeCat) {
            for (const kw of kws) {
              if (!safeCat.items.toLowerCase().includes(kw.toLowerCase())) {
                safeCat.items += `, ${kw}`;
              }
            }
          } else {
            result.skills.push({ category: "Technical Skills", items: kws.join(", ") });
          }
        } else {
          result.skills.push({ category: "Technical Skills", items: kws.join(", ") });
        }
      }
    }
  }

  return result;
}

// Keyword classification helpers
const LANGUAGES = new Set(["javascript", "typescript", "python", "java", "c++", "c", "c#", "go", "rust", "ruby", "php", "swift", "kotlin", "scala", "r", "matlab", "perl", "dart", "lua", "sql", "html", "css", "shell", "bash"]);
const FRAMEWORKS = new Set(["react", "angular", "vue.js", "vue", "next.js", "nextjs", "nuxt.js", "svelte", "express", "django", "flask", "fastapi", "spring boot", "rails", "laravel", "node.js", "nodejs", "nestjs", ".net", "asp.net", "tailwind css", "bootstrap", "material ui", "react native", "flutter", "redux", "mobx", "zustand", "graphql", "rest api", "trpc", "prisma", "sequelize", "typeorm", "mongoose", "hibernate", "sqlalchemy", "drizzle", "sass", "less", "styled-components", "styled components"]);
const DATABASES = new Set(["postgresql", "mysql", "mongodb", "redis", "sqlite", "elasticsearch", "dynamodb", "cassandra", "firebase", "supabase", "neo4j", "mariadb", "sql server", "couchdb", "memcached"]);
const TOOLS = new Set(["docker", "kubernetes", "jenkins", "github actions", "gitlab ci", "circleci", "terraform", "ansible", "nginx", "git", "github", "gitlab", "bitbucket", "aws", "azure", "google cloud", "gcp", "heroku", "vercel", "netlify", "webpack", "vite", "ci/cd", "jira", "postman", "figma", "helm", "argocd", "prometheus", "grafana", "datadog", "sentry", "splunk", "npm", "yarn", "pnpm", "maven", "gradle", "babel", "esbuild", "rollup", "cloudformation", "aws cdk"]);
const SECURITY = new Set(["authentication", "authorization", "oauth", "oauth2", "jwt", "rbac", "role based access", "owasp", "ssl", "tls", "ssl/tls", "encryption", "openapi", "swagger"]);
const CONCEPTS = new Set(["microservices", "system design", "design patterns", "agile", "scrum", "kanban", "tdd", "test driven development", "devops", "machine learning", "deep learning", "nlp", "natural language processing", "computer vision", "cdn", "content delivery network"]);
const TESTING = new Set(["jest", "mocha", "cypress", "selenium", "playwright", "pytest", "junit", "testing library", "react testing library", "vitest", "storybook"]);
const CLOUD_SERVICES = new Set(["aws lambda", "aws s3", "aws ec2", "aws ecs", "aws eks", "aws rds", "aws sqs", "aws sns", "rabbitmq", "kafka", "apache kafka", "digitalocean", "cloudflare"]);
const DATA_SCIENCE = new Set(["tensorflow", "pytorch", "scikit-learn", "pandas", "numpy", "keras", "jupyter", "apache spark", "hadoop", "tableau", "power bi", "opencv", "langchain", "hugging face"]);

function isLikelyLanguage(kw: string): boolean { return LANGUAGES.has(kw.toLowerCase()); }
function isLikelyFramework(kw: string): boolean { return FRAMEWORKS.has(kw.toLowerCase()); }
function isLikelyDatabase(kw: string): boolean { return DATABASES.has(kw.toLowerCase()); }
function isLikelyTool(kw: string): boolean { return TOOLS.has(kw.toLowerCase()); }
function isLikelySecurity(kw: string): boolean { return SECURITY.has(kw.toLowerCase()); }
function isLikelyConcept(kw: string): boolean { return CONCEPTS.has(kw.toLowerCase()); }
function isLikelyTesting(kw: string): boolean { return TESTING.has(kw.toLowerCase()); }
function isLikelyCloudService(kw: string): boolean { return CLOUD_SERVICES.has(kw.toLowerCase()); }
function isLikelyDataScience(kw: string): boolean { return DATA_SCIENCE.has(kw.toLowerCase()); }

/**
 * Classify a keyword into a skill category type.
 */
function classifyKeyword(kw: string): string {
  if (isLikelyLanguage(kw)) return "language";
  if (isLikelyFramework(kw)) return "framework";
  if (isLikelyDatabase(kw)) return "database";
  if (isLikelyTool(kw)) return "tool";
  if (isLikelySecurity(kw)) return "security";
  if (isLikelyConcept(kw)) return "concept";
  if (isLikelyTesting(kw)) return "testing";
  if (isLikelyCloudService(kw)) return "cloud_service";
  if (isLikelyDataScience(kw)) return "data_science";
  return "unknown";
}
