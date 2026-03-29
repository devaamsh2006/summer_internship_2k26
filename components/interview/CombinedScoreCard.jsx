"use client";

import dynamic from "next/dynamic";

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

function scoreColor(score) {
  if (score >= 70) {
    return "bg-emerald-500";
  }
  if (score >= 50) {
    return "bg-amber-500";
  }
  return "bg-rose-500";
}

function recommendationStyles(recommendation) {
  if (recommendation.includes("Strong Hire")) {
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  }
  if (recommendation.includes("Consider")) {
    return "bg-amber-100 text-amber-800 border-amber-200";
  }
  return "bg-rose-100 text-rose-800 border-rose-200";
}

function ProgressRow({ label, value }) {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0));

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm text-slate-700">
        <span>{label}</span>
        <span className="font-semibold text-slate-900">{safeValue}</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full ${scoreColor(safeValue)} transition-all duration-500`}
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}

export default function CombinedScoreCard({ data }) {
  const combined = Math.max(0, Math.min(100, Number(data?.combined_score) || 0));
  const resume = Math.max(0, Math.min(100, Number(data?.resume_match_score) || 0));
  const interview = Math.max(0, Math.min(100, Number(data?.interview_score) || 0));
  const recommendation = data?.final_recommendation || "Consider ⚠️";

  const chartData = [
    {
      name: "Combined",
      value: combined,
      fill: combined >= 70 ? "#10b981" : combined >= 50 ? "#f59e0b" : "#ef4444",
    },
  ];

  const handleDownload = () => {
    const report = {
      generated_at: new Date().toISOString(),
      combined_score: combined,
      resume_match_score: resume,
      interview_score: interview,
      final_recommendation: recommendation,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "interview-combined-report.json";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    URL.revokeObjectURL(url);
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="text-lg font-semibold text-slate-900">Final Combined Evaluation</h4>
        <span
          className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${recommendationStyles(recommendation)}`}
        >
          {recommendation}
        </span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px] lg:items-center">
        <div className="space-y-4">
          <ProgressRow label="Resume Match Score" value={resume} />
          <ProgressRow label="Interview Score" value={interview} />

          <button
            type="button"
            onClick={handleDownload}
            className="mt-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Download Report
          </button>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              data={chartData}
              innerRadius="55%"
              outerRadius="100%"
              startAngle={90}
              endAngle={-270}
              barSize={24}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar dataKey="value" cornerRadius={12} background clockWise />
              <text
                x="50%"
                y="45%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-slate-500 text-sm"
              >
                Combined Score
              </text>
              <text
                x="50%"
                y="58%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-slate-900 text-4xl font-bold"
              >
                {combined}
              </text>
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
