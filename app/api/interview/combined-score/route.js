function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getRecommendation(score) {
  if (score >= 80) {
    return "Strong Hire ✅";
  }
  if (score >= 60) {
    return "Consider ⚠️";
  }
  return "Not Recommended ❌";
}

export async function POST(request) {
  try {
    const body = await request.json();

    const resumeMatchScore = toNumber(body?.resume_match_score);
    const interviewScore = toNumber(body?.interview_score);

    if (resumeMatchScore === null || interviewScore === null) {
      return Response.json(
        {
          error: "resume_match_score and interview_score must be valid numbers",
        },
        { status: 400 }
      );
    }

    const combined = (resumeMatchScore * 0.5) + (interviewScore * 0.5);
    const combinedScore = Number(combined.toFixed(2));

    return Response.json(
      {
        combined_score: combinedScore,
        resume_match_score: resumeMatchScore,
        interview_score: interviewScore,
        final_recommendation: getRecommendation(combinedScore),
      },
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      {
        error: "Invalid request body",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 }
    );
  }
}
