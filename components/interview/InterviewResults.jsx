"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { ChevronDown, ChevronUp, Calculator, Loader2 } from "lucide-react";
import CombinedScoreCard from "@/components/interview/CombinedScoreCard";

const RadialBarChart = dynamic(
  () => import("recharts").then((mod) => mod.RadialBarChart),
  { ssr: false }
);
const RadialBar = dynamic(
  () => import("recharts").then((mod) => mod.RadialBar),
  { ssr: false }
);
const PolarAngleAxis = dynamic(
  () => import("recharts").then((mod) => mod.PolarAngleAxis),
  { ssr: false }
);
const ResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false }
);
const Tooltip = dynamic(
  () => import("recharts").then((mod) => mod.Tooltip),
  { ssr: false }
);
const Legend = dynamic(
  () => import("recharts").then((mod) => mod.Legend),
  { ssr: false }
);

function scoreColor(score) {
  if (score >= 70) {
    return {
      card: "border-emerald-200 bg-emerald-50",
      text: "text-emerald-700",
      ring: "bg-emerald-500",
    };
  }

  if (score >= 50) {
    return {
      card: "border-amber-200 bg-amber-50",
      text: "text-amber-700",
      ring: "bg-amber-500",
    };
  }

  return {
    card: "border-rose-200 bg-rose-50",
    text: "text-rose-700",
    ring: "bg-rose-500",
  };
}

const scoreMeta = [
  { key: "posture_score", label: "Posture" },
  { key: "facial_score", label: "Facial" },
  { key: "fluency_score", label: "Fluency" },
  { key: "sentiment_score", label: "Sentiment" },
];

export default function InterviewResults({
  interviewData,
  initialResumeMatchScore = null,
}) {
  const [showTranscript, setShowTranscript] = useState(false);
  const [resumeScoreInput, setResumeScoreInput] = useState(
    initialResumeMatchScore === null || initialResumeMatchScore === undefined
      ? ""
      : String(initialResumeMatchScore)
  );
  const [combinedResult, setCombinedResult] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState("");

  const cardData = useMemo(
    () =>
      scoreMeta.map((metric) => ({
        ...metric,
        value: Number(interviewData?.[metric.key] || 0),
      })),
    [interviewData]
  );

  const radialData = cardData.map((item) => ({
    name: item.label,
    value: item.value,
    fill: item.value >= 70 ? "#10b981" : item.value >= 50 ? "#f59e0b" : "#ef4444",
  }));

  const handleCalculateCombinedScore = async () => {
    const parsedResume = Number(resumeScoreInput);

    if (!Number.isFinite(parsedResume)) {
      setError("Enter a valid resume match score before calculating.");
      return;
    }

    try {
      setError("");
      setIsCalculating(true);

      const response = await fetch("/api/interview/combined-score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resume_match_score: parsedResume,
          interview_score: Number(interviewData?.interview_score || 0),
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to calculate combined score.");
      }

      setCombinedResult(payload);
    } catch (combinedError) {
      setCombinedResult(null);
      setError(combinedError instanceof Error ? combinedError.message : "Unexpected combined score error.");
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h3 className="text-xl font-semibold text-slate-900">Interview Analysis Results</h3>
        <p className="mt-1 text-sm text-slate-600">
          Visual summary of posture, expression, speaking fluency, and sentiment.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cardData.map((item) => {
          const color = scoreColor(item.value);
          return (
            <div
              key={item.key}
              className={`rounded-xl border p-4 ${color.card}`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-700">{item.label}</p>
                <span className={`h-2 w-2 rounded-full ${color.ring}`} />
              </div>
              <p className={`mt-2 text-3xl font-bold ${color.text}`}>{item.value}</p>
            </div>
          );
        })}
      </div>

      <div className="h-80 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            data={radialData}
            innerRadius="18%"
            outerRadius="95%"
            barSize={14}
            startAngle={180}
            endAngle={-180}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar
              background
              dataKey="value"
              cornerRadius={8}
              clockWise
              label={{ position: "insideStart", fill: "#334155", fontSize: 11 }}
            />
            <Tooltip formatter={(value) => [`${value}/100`, "Score"]} />
            <Legend iconSize={10} layout="horizontal" verticalAlign="bottom" align="center" />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <button
          type="button"
          onClick={() => setShowTranscript((prev) => !prev)}
          className="flex w-full items-center justify-between text-left text-sm font-semibold text-slate-800"
        >
          <span>Transcript</span>
          {showTranscript ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {showTranscript ? (
          <p className="mt-3 max-h-56 overflow-y-auto whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {interviewData?.transcript || "No transcript generated."}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <h4 className="font-semibold text-emerald-800">Strengths</h4>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-emerald-900">
            {(interviewData?.strengths || []).map((item) => (
              <li key={`strength-${item}`}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <h4 className="font-semibold text-rose-800">Areas to Improve</h4>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-rose-900">
            {(interviewData?.areas_to_improve || []).map((item) => (
              <li key={`improve-${item}`}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <label className="space-y-2 text-sm text-slate-700">
            <span className="font-medium">Resume Match Score</span>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={resumeScoreInput}
              onChange={(event) => setResumeScoreInput(event.target.value)}
              className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              placeholder="Enter resume match score"
            />
          </label>

          <button
            type="button"
            onClick={handleCalculateCombinedScore}
            disabled={isCalculating}
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCalculating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <Calculator className="mr-2 h-4 w-4" />
                Calculate Combined Score
              </>
            )}
          </button>
        </div>

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </div>

      {combinedResult ? <CombinedScoreCard data={combinedResult} /> : null}
    </section>
  );
}
