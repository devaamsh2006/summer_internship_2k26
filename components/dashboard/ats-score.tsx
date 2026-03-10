"use client";

import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Shield } from "lucide-react";
import type { ATSAnalysis } from "@/types";

interface ATSScoreProps {
  atsAnalysis: ATSAnalysis;
}

export function ATSScore({ atsAnalysis }: ATSScoreProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-indigo-600";
    if (score >= 40) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-5">
      {/* Main score */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-500" />
          <span className={`text-3xl font-bold ${getScoreColor(atsAnalysis.score)}`}>
            {atsAnalysis.score}
          </span>
          <span className="text-sm text-gray-400">/ 100</span>
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-3">
        <ScoreBar label="Keyword Presence" value={atsAnalysis.keywordPresence} />
        <ScoreBar label="Keyword Density" value={atsAnalysis.keywordDensity} />
        <ScoreBar label="Readability" value={atsAnalysis.readabilityScore} />
        <ScoreBar label="Formatting" value={atsAnalysis.formattingScore} />
      </div>

      {/* Section Completeness */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Section Completeness
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(atsAnalysis.sectionCompleteness).map(
            ([section, present]) => (
              <div
                key={section}
                className="flex items-center gap-1.5 text-sm"
              >
                {present ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                )}
                <span
                  className={
                    present ? "text-gray-700" : "text-gray-400"
                  }
                >
                  {section.charAt(0).toUpperCase() + section.slice(1)}
                </span>
              </div>
            )
          )}
        </div>
      </div>

      {/* Suggestions */}
      {atsAnalysis.suggestions.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Suggestions
          </h4>
          <ul className="space-y-1.5">
            {atsAnalysis.suggestions.map((suggestion, i) => (
              <motion.li
                key={i}
                className="text-xs text-gray-500 flex items-start gap-1.5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                <span className="text-indigo-400 mt-0.5">•</span>
                {suggestion}
              </motion.li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ScoreBar({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-xs font-medium text-gray-700">{value}%</span>
      </div>
      <Progress value={value} className="h-1.5" />
    </div>
  );
}
