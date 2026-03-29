import { NextResponse } from "next/server";

const INTERVIEW_SERVICE_URL = process.env.INTERVIEW_SERVICE_URL || "http://localhost:5001";

export async function POST(request) {
  try {
    const body = await request.json();
    const { job_description, resume_text } = body;

    if (!job_description || !resume_text) {
      return NextResponse.json(
        { error: "job_description and resume_text are required" },
        { status: 400 }
      );
    }

    // Forward request to Python microservice
    const response = await fetch(`${INTERVIEW_SERVICE_URL}/generate-questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        job_description,
        resume_text,
      }),
      timeout: 30000, // 30 second timeout
    });

    if (!response.ok) {
      if (response.status === 503) {
        return NextResponse.json(
          {
            error: "Interview service unavailable. Make sure interview_service.py is running on port 5001",
          },
          { status: 503 }
        );
      }
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error in generate-questions route:", error);

    // Check if it's a connection error (Python service down)
    if (
      error instanceof TypeError &&
      (error.message.includes("fetch failed") ||
        error.message.includes("ECONNREFUSED"))
    ) {
      return NextResponse.json(
        {
          error: "Interview service unavailable. Make sure interview_service.py is running on port 5001",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate interview questions" },
      { status: 500 }
    );
  }
}

/**
 * Extract technical keywords from text
 * @param {string} text - Input text to analyze
 * @returns {string[]} - Array of extracted keywords
 */
function extractKeywords(text) {
  const techSkills = [
    "javascript",
    "typescript",
    "react",
    "next.js",
    "node.js",
    "python",
    "java",
    "c#",
    "sql",
    "mongodb",
    "postgresql",
    "aws",
    "docker",
    "kubernetes",
    "git",
    "rest api",
    "graphql",
    "html",
    "css",
    "tailwind",
    "vue",
    "angular",
    "express",
    "django",
    "flask",
    "fastapi",
    "microservices",
    "agile",
    "scrum",
    "ci/cd",
    "devops",
    "machine learning",
    "data analysis",
    "tensorflow",
    "pytorch",
  ];

  const lowerText = text.toLowerCase();
  return techSkills.filter((skill) => lowerText.includes(skill));
}

/**
 * Generate interview questions based on job description and keywords
 * @param {string} jobDescription - Job description text
 * @param {string[]} jdKeywords - Keywords from job description
 * @param {string[]} resumeKeywords - Keywords from resume
 * @returns {string[]} - Array of interview questions
 */
function generateInterviewQuestions(jobDescription, jdKeywords, resumeKeywords) {
  const questions = [];

  // Question 1: Experience with required technology
  if (jdKeywords.length > 0) {
    const topSkill = jdKeywords[0];
    questions.push(
      `Can you walk me through your experience with ${topSkill}? Tell me about a specific project where you used it.`
    );
  } else {
    questions.push(
      "Can you tell me about a recent project that demonstrates your technical expertise?"
    );
  }

  // Question 2: Skills alignment
  if (resumeKeywords.length > 2) {
    questions.push(
      `I noticed you have experience with ${resumeKeywords.slice(0, 2).join(" and ")}. How have you used these skills to solve business problems?`
    );
  } else {
    questions.push(
      "How have you applied your technical skills to solve real-world business challenges?"
    );
  }

  // Question 3: Problem-solving
  questions.push(
    "Tell me about a time when you encountered a difficult technical problem. How did you approach solving it?"
  );

  // Question 4: Teamwork
  questions.push(
    "Can you describe your experience working in a team environment? How do you handle code reviews and feedback?"
  );

  // Question 5: Job-specific skills
  if (jobDescription.toLowerCase().includes("lead") || jobDescription.toLowerCase().includes("senior")) {
    questions.push(
      "Share an example of when you led a project or mentored other team members. What was the outcome?"
    );
  } else {
    questions.push(
      "What is one area of software development you'd like to improve or learn more about, and why?"
    );
  }

  // Question 6: Motivation
  questions.push(
    `Based on this role and our company, why are you interested in this position? How does it align with your career goals?`
  );

  // Question 7: Growth mindset
  questions.push(
    "Tell me about a time when you had to learn a new technology or framework quickly. How did you approach it?"
  );

  return questions.slice(0, 6); // Return top 6 questions
}
