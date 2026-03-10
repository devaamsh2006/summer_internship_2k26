"use client";

import { motion } from "framer-motion";
import { Lightbulb, ArrowRight } from "lucide-react";
import type { Improvement } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

interface ImprovementsProps {
  improvements: Improvement[];
  isLoading: boolean;
}

export function ImprovementsDisplay({
  improvements,
  isLoading,
}: ImprovementsProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (improvements.length === 0) {
    return (
      <div className="text-center py-6">
        <Lightbulb className="w-8 h-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-400">
          No improvements generated yet. Run the analysis to get AI-powered
          writing suggestions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {improvements.map((imp, i) => (
        <motion.div
          key={i}
          className="rounded-xl border border-gray-100 bg-gradient-to-br from-white to-indigo-50/20 p-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
              {imp.section}
            </span>
          </div>

          {/* Original */}
          <div className="mb-3">
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
              Original
            </span>
            <p className="text-sm text-gray-600 mt-0.5 bg-red-50/50 rounded-lg p-2.5 border border-red-100/50">
              {imp.original}
            </p>
          </div>

          <div className="flex justify-center my-2">
            <ArrowRight className="w-4 h-4 text-indigo-300" />
          </div>

          {/* Suggestion */}
          <div className="mb-3">
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
              Improved
            </span>
            <p className="text-sm text-gray-700 mt-0.5 bg-emerald-50/50 rounded-lg p-2.5 border border-emerald-100/50 font-medium">
              {imp.suggestion}
            </p>
          </div>

          {/* Reason */}
          <p className="text-xs text-gray-400 italic">{imp.reason}</p>
        </motion.div>
      ))}
    </div>
  );
}
