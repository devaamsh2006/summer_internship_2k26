// ─── OpenRouter LLM Integration ─────────────────────────────────────────────
// LLM used ONLY for:
// 1. Resume writing improvement (phrasing quality)
// 2. Generating optimized resume content
// NOT used for skill extraction, keyword comparison, or scoring.

import type { Improvement, ResumeBuilderInput, GeneratedResume } from "@/types";

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
 * The LLM structures and phrases the content — it does NOT fabricate experience.
 */
export async function generateResume(
  input: ResumeBuilderInput
): Promise<GeneratedResume> {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `You are a professional resume writer. Generate a structured, well-written resume based ONLY on the information provided by the user.

Rules you MUST follow:
- Use ONLY the information provided. Do not fabricate any experience, skills, achievements, or qualifications.
- Structure the resume with clear sections: Header, Summary, Skills, Experience, Education, Projects, Certifications.
- Use strong action verbs and professional language.
- Align the phrasing with the job description requirements where the user's actual experience matches.
- If a section has no content provided, omit it entirely.
- Return your response as a valid JSON object with a "sections" field containing: "header", "summary", "skills", "experience", "education", "projects", "certifications".
- Each section value should be a formatted string ready for display.
- Return ONLY the JSON object, no other text.`,
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

  parts.push(`Generate a tailored resume for the following job description:\n${input.jobDescription}`);
  parts.push(`\nCandidate Information:`);

  if (input.name) parts.push(`Name: ${input.name}`);
  if (input.email) parts.push(`Email: ${input.email}`);
  if (input.phone) parts.push(`Phone: ${input.phone}`);
  if (input.summary) parts.push(`Professional Summary: ${input.summary}`);
  if (input.skills) parts.push(`Skills: ${input.skills}`);
  if (input.experience) parts.push(`Experience:\n${input.experience}`);
  if (input.education) parts.push(`Education:\n${input.education}`);
  if (input.projects) parts.push(`Projects:\n${input.projects}`);
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
        experience: sections.experience || "",
        education: sections.education || "",
        projects: sections.projects || "",
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
        certifications: "",
      },
    };
  }
}
