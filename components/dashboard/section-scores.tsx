"use client";

import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import type { SectionScores } from "@/types";

interface SectionScoresProps {
  sectionScores: SectionScores;
}

const sectionConfig: Record<
  keyof SectionScores,
  { label: string; color: string }
> = {
  skills: { label: "Skills", color: "from-indigo-500 to-violet-500" },
  experience: { label: "Experience", color: "from-blue-500 to-cyan-500" },
  projects: { label: "Projects", color: "from-violet-500 to-purple-500" },
  education: { label: "Education", color: "from-emerald-500 to-teal-500" },
};

export function SectionScoresDisplay({
  sectionScores,
}: SectionScoresProps) {
  return (
    <div className="space-y-4">
      {(Object.entries(sectionScores) as [keyof SectionScores, number][]).map(
        ([key, value], i) => {
          const config = sectionConfig[key];
          return (
            <motion.div
              key={key}
              className="space-y-1.5"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {config.label}
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {value}%
                </span>
              </div>
              <Progress value={value} className="h-2.5" />
            </motion.div>
          );
        }
      )}
    </div>
  );
}
