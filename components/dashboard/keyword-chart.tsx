"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { KeywordAnalysis } from "@/types";

interface KeywordChartProps {
  keywordAnalysis: KeywordAnalysis;
}

export function KeywordChart({ keywordAnalysis }: KeywordChartProps) {
  const data = [
    {
      name: "Matched",
      count: keywordAnalysis.matched.length,
      color: "#10b981",
    },
    {
      name: "Missing",
      count: keywordAnalysis.missing.length,
      color: "#ef4444",
    },
    {
      name: "Overused",
      count: keywordAnalysis.overused.length,
      color: "#f59e0b",
    },
  ];

  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barSize={40}>
          <XAxis
            dataKey="name"
            tick={{ fill: "#64748b", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(255,255,255,0.95)",
              border: "1px solid rgba(99,102,241,0.2)",
              borderRadius: "12px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            }}
            formatter={(value: number) => [value, "Keywords"]}
          />
          <Bar dataKey="count" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Keyword lists */}
      <div className="mt-4 space-y-3">
        {keywordAnalysis.matched.length > 0 && (
          <div>
            <span className="text-xs font-medium text-emerald-600">
              Matched:
            </span>
            <p className="text-xs text-gray-500 mt-0.5">
              {keywordAnalysis.matched.join(", ")}
            </p>
          </div>
        )}
        {keywordAnalysis.missing.length > 0 && (
          <div>
            <span className="text-xs font-medium text-red-500">Missing:</span>
            <p className="text-xs text-gray-500 mt-0.5">
              {keywordAnalysis.missing.join(", ")}
            </p>
          </div>
        )}
        {keywordAnalysis.overused.length > 0 && (
          <div>
            <span className="text-xs font-medium text-amber-600">
              Overused:
            </span>
            <p className="text-xs text-gray-500 mt-0.5">
              {keywordAnalysis.overused.join(", ")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
