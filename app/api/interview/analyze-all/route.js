import { NextResponse } from "next/server";

const INTERVIEW_SERVICE_URL = process.env.INTERVIEW_SERVICE_URL || "http://localhost:5001";

export async function POST(request) {
  try {
    const formData = await request.formData();
    
    // Get recordings and questions
    const recordings = [];
    let questionsData = [];
    
    // Extract all recordings
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("recording_")) {
        const recordingIndex = parseInt(key.split("_")[1]);
        recordings[recordingIndex] = value;
      } else if (key === "questions") {
        questionsData = JSON.parse(value);
      }
    }

    // Filter out undefined recordings
    const recordingsList = recordings.filter(Boolean);

    if (recordingsList.length === 0) {
      return NextResponse.json(
        { error: "No recordings provided" },
        { status: 400 }
      );
    }

    if (questionsData.length === 0) {
      return NextResponse.json(
        { error: "No questions provided" },
        { status: 400 }
      );
    }

    // Analyze each recording
    const perQuestionResults = [];

    for (let i = 0; i < recordingsList.length; i++) {
      const videoBlob = recordingsList[i];
      const question = questionsData[i];

      if (!question) {
        console.warn(`No question found for recording ${i}`);
        continue;
      }

      try {
        // Create FormData for Python service
        const pyFormData = new FormData();
        const videoFile = new File([videoBlob], `question_${i}.webm`, {
          type: "video/webm",
        });
        pyFormData.append("video", videoFile);
        pyFormData.append("question", question.question || "");
        pyFormData.append("question_type", question.type || "");

        // Forward to Python microservice
        const response = await fetch(
          `${INTERVIEW_SERVICE_URL}/analyze-interview-response`,
          {
            method: "POST",
            body: pyFormData,
            timeout: 120000, // 2 minutes per video
          }
        );

        if (!response.ok) {
          console.error(
            `Failed to analyze recording ${i}:`,
            response.statusText
          );
          perQuestionResults.push({
            question_id: i,
            question: question.question,
            transcript: "",
            posture_score: 0,
            facial_score: 0,
            fluency_score: 0,
            sentiment_score: 0,
            answer_relevance_score: 0,
            response_score: 0,
            feedback: "Failed to analyze response",
            error: true,
          });
          continue;
        }

        const result = await response.json();
        perQuestionResults.push({
          question_id: i,
          ...result,
        });
      } catch (error) {
        console.error(`Error analyzing recording ${i}:`, error);
        perQuestionResults.push({
          question_id: i,
          question: question.question,
          transcript: "",
          posture_score: 0,
          facial_score: 0,
          fluency_score: 0,
          sentiment_score: 0,
          answer_relevance_score: 0,
          response_score: 0,
          feedback: "Error during analysis",
          error: true,
        });
      }
    }

    // Calculate overall scores
    const validResults = perQuestionResults.filter((r) => !r.error);

    const calculateAverage = (key) => {
      if (validResults.length === 0) return 0;
      const sum = validResults.reduce((acc, r) => acc + (r[key] || 0), 0);
      return sum / validResults.length;
    };

    const overallScores = {
      posture_score: Math.round(calculateAverage("posture_score")),
      facial_score: Math.round(calculateAverage("facial_score")),
      fluency_score: Math.round(calculateAverage("fluency_score")),
      sentiment_score: Math.round(calculateAverage("sentiment_score")),
      answer_relevance_score: Math.round(
        calculateAverage("answer_relevance_score")
      ),
      response_score: Math.round(calculateAverage("response_score")),
    };

    // Calculate weighted interview score
    // Weight distribution: 20% posture, 15% facial, 20% fluency, 15% sentiment, 30% answer relevance
    const interviewScore = Math.round(
      0.2 * overallScores.posture_score +
        0.15 * overallScores.facial_score +
        0.2 * overallScores.fluency_score +
        0.15 * overallScores.sentiment_score +
        0.3 * overallScores.answer_relevance_score
    );

    // Generate recommendation
    const getRecommendation = (score) => {
      if (score >= 80)
        return { badge: "Strong Hire ✅", message: "Excellent performance" };
      if (score >= 70)
        return {
          badge: "Consider ⚠️",
          message: "Good performance with room for improvement",
        };
      if (score >= 60)
        return {
          badge: "Not Recommended ❌",
          message: "Needs significant improvement",
        };
      return {
        badge: "Not Recommended ❌",
        message: "Does not meet expectations",
      };
    };

    const recommendation = getRecommendation(interviewScore);

    return NextResponse.json(
      {
        per_question: perQuestionResults,
        overall: {
          ...overallScores,
          interview_score: interviewScore,
          recommendation: recommendation.badge,
          recommendation_message: recommendation.message,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in analyze-all:", error);

    // Return graceful fallback
    return NextResponse.json(
      {
        per_question: [],
        overall: {
          posture_score: 0,
          facial_score: 0,
          fluency_score: 0,
          sentiment_score: 0,
          answer_relevance_score: 0,
          response_score: 0,
          interview_score: 0,
          recommendation: "Error ❌",
          recommendation_message: "Failed to analyze interview",
        },
      },
      { status: 500 }
    );
  }
}
