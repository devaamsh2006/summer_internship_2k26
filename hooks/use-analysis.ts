"use client";

import { useState, useCallback } from "react";
import type {
  ResumeData,
  JobDescriptionData,
  AnalysisResult,
} from "@/types";

type AnalysisStep =
  | "idle"
  | "parsing"
  | "analyzing-jd"
  | "matching"
  | "improving"
  | "complete"
  | "error";

interface UseAnalysisReturn {
  step: AnalysisStep;
  error: string | null;
  resumeData: ResumeData | null;
  parseResume: (file: File) => Promise<ResumeData | null>;
  runAnalysis: (
    resumeData: ResumeData,
    jobDescription: string
  ) => Promise<void>;
}

export function useAnalysis(): UseAnalysisReturn {
  const [step, setStep] = useState<AnalysisStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);

  const parseResume = useCallback(
    async (file: File): Promise<ResumeData | null> => {
      setStep("parsing");
      setError(null);

      try {
        const formData = new FormData();
        formData.append("resume", file);

        const response = await fetch("/api/parse-resume", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error);

        setResumeData(result.data);
        setStep("idle");
        return result.data;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to parse resume.";
        setError(message);
        setStep("error");
        return null;
      }
    },
    []
  );

  const runAnalysis = useCallback(
    async (resume: ResumeData, jobDescription: string) => {
      setError(null);

      try {
        // Step 1: Analyze JD
        setStep("analyzing-jd");
        const jdRes = await fetch("/api/analyze-jd", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobDescription }),
        });
        const jdResult = await jdRes.json();
        if (!jdRes.ok) throw new Error(jdResult.error);
        const jdData: JobDescriptionData = jdResult.data;

        // Step 2: Match score
        setStep("matching");
        const matchRes = await fetch("/api/match-score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resumeData: resume, jdData }),
        });
        const matchResult = await matchRes.json();
        if (!matchRes.ok) throw new Error(matchResult.error);

        // Store complete analysis
        const analysisData = {
          resumeData: resume,
          jdData,
          ...matchResult.data,
        };
        sessionStorage.setItem(
          "analysisResult",
          JSON.stringify(analysisData)
        );

        setStep("complete");
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Analysis failed.";
        setError(message);
        setStep("error");
      }
    },
    []
  );

  return {
    step,
    error,
    resumeData,
    parseResume,
    runAnalysis,
  };
}
