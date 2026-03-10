"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, ArrowLeftRight } from "lucide-react";
import type { SemanticSkillMatch } from "@/types";

interface SkillComparisonProps {
  matches: SemanticSkillMatch[];
}

export function SkillComparison({ matches }: SkillComparisonProps) {
  const exact = matches.filter((m) => m.matchType === "exact");
  const partial = matches.filter((m) => m.matchType === "partial");
  const missing = matches.filter((m) => m.matchType === "none");

  return (
    <div className="space-y-6">
      {/* Exact Matches */}
      {exact.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <h4 className="text-sm font-semibold text-gray-700">
              Exact Matches ({exact.length})
            </h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {exact.map((match, i) => (
              <motion.div
                key={`exact-${i}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
              >
                <Badge variant="success">{match.jdSkill}</Badge>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Partial Matches */}
      {partial.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ArrowLeftRight className="w-4 h-4 text-amber-500" />
            <h4 className="text-sm font-semibold text-gray-700">
              Partial Matches ({partial.length})
            </h4>
          </div>
          <div className="space-y-2">
            {partial.map((match, i) => (
              <motion.div
                key={`partial-${i}`}
                className="flex items-center gap-2 text-sm"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Badge variant="info">{match.resumeSkill}</Badge>
                <span className="text-gray-400">≈</span>
                <Badge variant="warning">{match.jdSkill}</Badge>
                <span className="text-xs text-gray-400">
                  ({Math.round(match.similarity * 100)}%)
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Missing Skills */}
      {missing.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <XCircle className="w-4 h-4 text-red-400" />
            <h4 className="text-sm font-semibold text-gray-700">
              Not Found in Resume ({missing.length})
            </h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {missing.map((match, i) => (
              <motion.div
                key={`missing-${i}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
              >
                <Badge variant="destructive">{match.jdSkill}</Badge>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {matches.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">
          No skill comparison data available.
        </p>
      )}
    </div>
  );
}
