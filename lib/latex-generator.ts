// ─── LaTeX Resume Generator ─────────────────────────────────────────────────
// Converts structured resume data into LaTeX code using the resume document class.
// Produces an ATS-friendly, professionally formatted LaTeX resume.

import fs from "fs";
import path from "path";
import type { LaTeXResumeData } from "@/types";

/**
 * Escape special LaTeX characters in user-provided text.
 * Preserves text that is already LaTeX-safe.
 */
function escapeLatex(text: string): string {
  if (!text) return "";
  return text
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");
}

/**
 * Generate the LaTeX preamble with document class, packages, and header.
 */
function generatePreamble(data: LaTeXResumeData): string {
  const lines: string[] = [];

  lines.push("\\documentclass{resume}");
  lines.push("");
  lines.push("\\usepackage[a4paper,left=0.4in,top=0.35in,right=0.4in,bottom=0.4in]{geometry}");
  lines.push("\\usepackage{hyperref}");
  lines.push("\\usepackage{enumitem}");
  lines.push("\\setlength{\\parskip}{2pt}");
  lines.push("\\setlength{\\itemsep}{2pt}");
  lines.push("\\newcommand{\\tab}[1]{\\hspace{.2667\\textwidth}\\rlap{#1}}");
  lines.push("\\newcommand{\\itab}[1]{\\hspace{0em}\\rlap{#1}}");
  lines.push("");

  // Name
  lines.push(`\\name{${escapeLatex(data.name.toUpperCase())}}`);

  // Address line 1: Location · Phone
  const addressParts: string[] = [];
  if (data.location) addressParts.push(escapeLatex(data.location));
  if (data.phone) addressParts.push(escapeLatex(data.phone));
  if (addressParts.length > 0) {
    lines.push(`\\address{${addressParts.join(" $\\cdot$ ")}}`);
  }

  // Address line 2: Email · Links
  const linkParts: string[] = [];
  if (data.email) {
    linkParts.push(`\\href{mailto:${data.email}}{${escapeLatex(data.email)}}`);
  }
  for (const link of data.links) {
    if (link.url && link.label) {
      linkParts.push(`\\href{${link.url}}{${escapeLatex(link.label)}}`);
    }
  }
  if (linkParts.length > 0) {
    lines.push(`\\address{${linkParts.join(" $\\cdot$ ")}}`);
  }

  return lines.join("\n");
}

/**
 * Generate the Education section.
 */
function generateEducation(entries: LaTeXResumeData["education"]): string {
  if (!entries || entries.length === 0) return "";

  const lines: string[] = [];
  lines.push("%-----------------------------------------");
  lines.push("\\begin{rSection}{Education}");
  lines.push("");

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const degreePart = `\\textbf{${escapeLatex(entry.degree)}}`;
    const instPart = escapeLatex(entry.institution);
    
    if (entry.year) {
      lines.push(`${degreePart}, ${instPart}`);
      lines.push(`\\hfill \\textit{${escapeLatex(entry.year)}}\\\\`);
    } else {
      lines.push(`${degreePart}, ${instPart}\\\\`);
    }
    if (entry.detail) {
      lines.push(`{\\small \\textbf{${escapeLatex(entry.detail)}}}`);
    }
    if (i < entries.length - 1) lines.push("");
  }

  lines.push("");
  lines.push("\\end{rSection}");
  return lines.join("\n");
}

/**
 * Generate the Skills section as a tabular layout.
 */
function generateSkills(skills: LaTeXResumeData["skills"]): string {
  if (!skills || skills.length === 0) return "";

  const lines: string[] = [];
  lines.push("%-----------------------------------------");
  lines.push("\\begin{rSection}{Skills}");
  lines.push("");
  lines.push("\\begin{tabular}{ @{} >{\\bfseries}l @{\\hspace{6ex}} p{13cm} }");

  for (const skill of skills) {
    lines.push(`${escapeLatex(skill.category)} & ${escapeLatex(skill.items)} \\\\`);
  }

  lines.push("\\end{tabular}");
  lines.push("");
  lines.push("\\end{rSection}");
  return lines.join("\n");
}

/**
 * Generate the Projects section with detailed bullet points.
 */
function generateProjects(projects: LaTeXResumeData["projects"]): string {
  if (!projects || projects.length === 0) return "";

  const lines: string[] = [];
  lines.push("%-----------------------------------------");
  lines.push("\\begin{rSection}{Projects}");
  lines.push("\\begin{itemize}[leftmargin=*]");
  lines.push("");

  for (const project of projects) {
    // Project name and description
    let projectLine = `\\item`;
    lines.push(projectLine);
    
    let titleLine = `\\textbf{${escapeLatex(project.name)}}`;
    if (project.description) {
      titleLine += ` -- ${escapeLatex(project.description)}`;
    }
    if (project.githubUrl) {
      titleLine += `\n\\hfill \\href{${project.githubUrl}}{[GitHub]}`;
    }
    titleLine += " \\\\";
    lines.push(titleLine);
    
    if (project.technologies) {
      lines.push(`\\textbf{Technologies:} ${escapeLatex(project.technologies)}`);
    }

    // Render enhanced bullet points if available
    if (project.bullets && project.bullets.length > 0) {
      lines.push("\\begin{itemize}[leftmargin=1.5em]");
      for (const bullet of project.bullets) {
        lines.push(`\\item ${escapeLatex(bullet)}`);
      }
      lines.push("\\end{itemize}");
    }
    lines.push("");
  }

  lines.push("\\end{itemize}");
  lines.push("\\end{rSection}");
  return lines.join("\n");
}

/**
 * Generate the Experience section with bullet points.
 */
function generateExperience(entries: LaTeXResumeData["experience"]): string {
  if (!entries || entries.length === 0) return "";

  const lines: string[] = [];
  lines.push("%-----------------------------------------");
  lines.push("\\begin{rSection}{Experience}");
  lines.push("");

  for (const entry of entries) {
    lines.push(`\\textbf{${escapeLatex(entry.title)}}`);
    if (entry.bullets && entry.bullets.length > 0) {
      lines.push("\\begin{itemize}");
      for (const bullet of entry.bullets) {
        lines.push(`\\item ${escapeLatex(bullet)}`);
      }
      lines.push("\\end{itemize}");
    }
    lines.push("");
  }

  lines.push("\\end{rSection}");
  return lines.join("\n");
}

/**
 * Generate a simple list section (Courses, Achievements, Extra-Curricular).
 */
function generateListSection(title: string, items: string[]): string {
  if (!items || items.length === 0) return "";

  const lines: string[] = [];
  lines.push("%-----------------------------------------");
  lines.push(`\\begin{rSection}{${title}}`);
  lines.push("");
  lines.push("\\begin{itemize}");
  for (const item of items) {
    lines.push(`\\item ${escapeLatex(item)}`);
  }
  lines.push("\\end{itemize}");
  lines.push("");
  lines.push("\\end{rSection}");
  return lines.join("\n");
}

/**
 * Generate the complete LaTeX document from structured resume data.
 * Includes all sections: Education, Skills, Projects, Experience, Courses,
 * Achievements, Extra-Curricular.
 */
export function generateLaTeX(data: LaTeXResumeData): string {
  const parts: string[] = [];

  // Preamble
  parts.push(generatePreamble(data));
  parts.push("");
  parts.push("\\begin{document}");

  // All sections in order
  const education = generateEducation(data.education);
  if (education) parts.push("", education);

  const skills = generateSkills(data.skills);
  if (skills) parts.push("", skills);

  const projects = generateProjects(data.projects);
  if (projects) parts.push("", projects);

  const experience = generateExperience(data.experience);
  if (experience) parts.push("", experience);

  const courses = generateListSection("Courses", data.courses);
  if (courses) parts.push("", courses);

  const achievements = generateListSection("Achievements", data.achievements);
  if (achievements) parts.push("", achievements);

  const extraCurricular = generateListSection("Extra-Curricular", data.extraCurricular);
  if (extraCurricular) parts.push("", extraCurricular);

  parts.push("");
  parts.push("\\end{document}");

  return parts.join("\n");
}

/**
 * Compile LaTeX to PDF using the LaTeX Online API.
 * Returns PDF as a Buffer, or null on failure.
 */
export async function compileLaTeXToPDF(latexCode: string): Promise<Buffer | null> {
  try {
    // Read the resume.cls file to bundle with the compilation request
    const clsPath = path.join(process.cwd(), "resume_code", "resume.cls");
    const clsContent = fs.readFileSync(clsPath, "utf-8");

    // Use latex.ytotech.com API for server-side compilation
    const response = await fetch("https://latex.ytotech.com/builds/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        compiler: "pdflatex",
        resources: [
          {
            main: true,
            content: latexCode,
          },
          {
            path: "resume.cls",
            content: clsContent,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("LaTeX compilation failed:", response.status, await response.text());
      return null;
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/pdf")) {
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }

    console.error("LaTeX compilation did not return PDF");
    return null;
  } catch (error) {
    console.error("LaTeX compilation error:", error);
    return null;
  }
}
