"use client";

import {
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { SectionScores } from "@/types";

interface RadarChartProps {
  sectionScores: SectionScores;
}

export function RadarChartComponent({ sectionScores }: RadarChartProps) {
  const data = [
    { subject: "Skills", score: sectionScores.skills, fullMark: 100 },
    { subject: "Experience", score: sectionScores.experience, fullMark: 100 },
    { subject: "Projects", score: sectionScores.projects, fullMark: 100 },
    { subject: "Education", score: sectionScores.education, fullMark: 100 },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsRadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
        <PolarGrid
          stroke="#e2e8f0"
          strokeDasharray="3 3"
        />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: "#64748b", fontSize: 12 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fill: "#94a3b8", fontSize: 10 }}
          tickCount={5}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "rgba(255,255,255,0.95)",
            border: "1px solid rgba(99,102,241,0.2)",
            borderRadius: "12px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          }}
          formatter={(value: number) => [`${value}%`, "Score"]}
        />
        <Radar
          name="Match Score"
          dataKey="score"
          stroke="#6366f1"
          fill="#6366f1"
          fillOpacity={0.2}
          strokeWidth={2}
        />
      </RechartsRadarChart>
    </ResponsiveContainer>
  );
}
