// ─── OpenRouter LLM Integration ─────────────────────────────────────────────
// LLM used ONLY for:
// 1. Resume writing improvement (phrasing quality)
// 2. Generating optimized resume content
// NOT used for skill extraction, keyword comparison, or scoring.

import type { Improvement, ResumeBuilderInput, GeneratedResume, LaTeXResumeData } from "@/types";

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
async function callOpenRouter(messages: ChatMessage[]): Promise<string> {
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
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
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
 * Generate structured resume data tailored to a job description,
 * with ATS keyword optimization and LLM validation.
 *
 * Pipeline:
 * 1. Extract JD keywords (deterministic via skill taxonomy + n-grams)
 * 2. LLM generates tailored resume content with keyword injection
 * 3. LLM validates the resume for completeness, ATS compliance, keyword coverage
 * 4. Returns validated, ATS-optimized structured data
 */
export async function generateLaTeXResumeData(
  input: ResumeBuilderInput,
  jdKeywords?: string[]
): Promise<LaTeXResumeData> {
  // Step 1: Generate tailored resume with keyword-aware prompt
  const keywordList = jdKeywords && jdKeywords.length > 0
    ? jdKeywords
    : [];

  const generationMessages: ChatMessage[] = [
    {
      role: "system",
      content: buildATSSystemPrompt(keywordList),
    },
    {
      role: "user",
      content: buildLaTeXPrompt(input, keywordList),
    },
  ];

  const rawResponse = await callOpenRouter(generationMessages);
  const resumeData = parseLaTeXResumeData(rawResponse, input);

  // Step 2: Validate with LLM — check completeness and ATS optimization
  const validated = await validateResumeWithLLM(resumeData, input, keywordList);

  return validated;
}

/**
 * Build the ATS-focused system prompt with keyword awareness.
 */
function buildATSSystemPrompt(keywords: string[]): string {
  const keywordSection = keywords.length > 0
    ? `\nATS KEYWORDS EXTRACTED FROM JOB DESCRIPTION (you MUST naturally incorporate as many as possible into the resume content — skills, project descriptions, experience bullets):
${keywords.join(", ")}
`
    : "";

  return `You are a world-class resume writer specializing in ATS-optimized technical resumes.

Your task: Take the candidate's EXISTING information and produce a COMPLETE, fully structured resume tailored to the target job description.

ABSOLUTE RULES:
- NEVER fabricate experience, companies, internships, or metrics the candidate didn't provide.
- NEVER invent technologies or skills the candidate didn't mention.
- You MUST include ALL sections the candidate provided data for: name, contact, education, skills, projects, experience, courses, achievements, extra-curricular.
- If the candidate provided projects, you MUST include ALL projects with detailed descriptions.
- If the candidate provided experience, you MUST include ALL experience entries with detailed bullets.
- Use strong action verbs: Engineered, Architected, Implemented, Developed, Built, Optimized, Designed, Deployed, Integrated, Automated.
- Emphasize technical impact: scalability, performance, reliability, user experience, system design.
- Each project description MUST be a meaningful one-line summary of what was built and its purpose.
- Each project MUST have 2-4 detailed bullet points in the description field separated by semicolons.
${keywordSection}
TAILORING STRATEGY:
1. SKILLS: Reorder categories so JD-relevant ones come first. Within each category, JD-matching skills come first.
2. PROJECTS: Most JD-relevant project first. Rewrite descriptions to emphasize JD-matching aspects.
3. EXPERIENCE: Rewrite bullets to highlight JD-matching skills and outcomes.
4. COURSES: Most JD-relevant courses listed first.
5. KEYWORDS: Naturally weave the ATS keywords into project descriptions, experience bullets, and skill lists. Do NOT stuff keywords artificially.

You MUST return a valid JSON object with this EXACT structure (all fields required):
{
  "name": "Full Name",
  "location": "City, State/Country",
  "phone": "Phone number",
  "email": "email@example.com",
  "links": [{"label": "LinkedIn", "url": "https://..."}, {"label": "GitHub", "url": "https://..."}],
  "education": [
    {"degree": "Degree title", "institution": "University", "year": "2023-2027", "detail": "CGPA: X.XX (if provided)"}
  ],
  "skills": [
    {"category": "Category Name", "items": "Skill1, Skill2, Skill3"}
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "Detailed description of what was built, its purpose, and engineering impact",
      "technologies": "Tech1, Tech2, Tech3",
      "githubUrl": "https://github.com/... (if provided)"
    }
  ],
  "experience": [
    {
      "title": "Role or Activity Title",
      "bullets": ["Detailed achievement 1", "Detailed achievement 2"]
    }
  ],
  "courses": ["Course 1 - Platform", "Course 2 - Platform"],
  "achievements": ["Achievement 1", "Achievement 2"],
  "extraCurricular": ["Activity 1 - Organization", "Activity 2"]
}

Return ONLY the JSON object. No markdown, no explanation, no extra text.`;
}

/**
 * Build the user prompt with all candidate information and keywords.
 */
function buildLaTeXPrompt(input: ResumeBuilderInput, keywords: string[]): string {
  const parts: string[] = [];

  parts.push(`=== TARGET JOB DESCRIPTION ===`);
  parts.push(input.jobDescription);

  if (keywords.length > 0) {
    parts.push(`\n=== EXTRACTED ATS KEYWORDS ===`);
    parts.push(keywords.join(", "));
  }

  parts.push(`\n=== CANDIDATE INFORMATION (use ALL of this) ===`);

  if (input.name) parts.push(`Full Name: ${input.name}`);
  if (input.email) parts.push(`Email: ${input.email}`);
  if (input.phone) parts.push(`Phone: ${input.phone}`);
  if (input.github) parts.push(`GitHub: ${input.github}`);
  if (input.linkedin) parts.push(`LinkedIn: ${input.linkedin}`);
  if (input.portfolio) parts.push(`Portfolio: ${input.portfolio}`);

  if (input.education) {
    parts.push(`\n--- Education ---`);
    parts.push(input.education);
  }

  if (input.skills) {
    parts.push(`\n--- Skills ---`);
    parts.push(input.skills);
  }

  if (input.projects) {
    parts.push(`\n--- Projects (INCLUDE ALL) ---`);
    parts.push(input.projects);
  }

  if (input.experience) {
    parts.push(`\n--- Experience (INCLUDE ALL) ---`);
    parts.push(input.experience);
  }

  if (input.summary) {
    parts.push(`\n--- Professional Summary ---`);
    parts.push(input.summary);
  }

  if (input.courses) {
    parts.push(`\n--- Courses ---`);
    parts.push(input.courses);
  }

  if (input.certifications) {
    parts.push(`\n--- Certifications / Achievements ---`);
    parts.push(input.certifications);
  }

  parts.push(`\n=== INSTRUCTIONS ===`);
  parts.push(`Generate the COMPLETE resume JSON with ALL sections populated from the candidate data above.`);
  parts.push(`Every project and experience entry MUST be included. Do not skip any.`);
  parts.push(`Naturally incorporate ATS keywords from the job description into descriptions and bullets.`);

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
    const response = await callOpenRouter(messages);
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
