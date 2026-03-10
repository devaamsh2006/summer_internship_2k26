"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import type { MissingSkill } from "@/types";

interface MissingSkillsProps {
  missingSkills: MissingSkill[];
}

const importanceConfig = {
  critical: {
    icon: AlertTriangle,
    badge: "destructive" as const,
    iconColor: "text-red-500",
    label: "Critical",
  },
  important: {
    icon: AlertCircle,
    badge: "warning" as const,
    iconColor: "text-amber-500",
    label: "Important",
  },
  "nice-to-have": {
    icon: Info,
    badge: "info" as const,
    iconColor: "text-blue-400",
    label: "Nice to Have",
  },
};

export function MissingSkillsDisplay({
  missingSkills,
}: MissingSkillsProps) {
  const grouped = {
    critical: missingSkills.filter((s) => s.importance === "critical"),
    important: missingSkills.filter((s) => s.importance === "important"),
    "nice-to-have": missingSkills.filter(
      (s) => s.importance === "nice-to-have"
    ),
  };

  if (missingSkills.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-emerald-600 font-medium">
          No critical missing skills detected!
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Your resume covers the key requirements.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {(
        Object.entries(grouped) as [
          keyof typeof grouped,
          MissingSkill[],
        ][]
      ).map(
        ([level, skills]) =>
          skills.length > 0 && (
            <div key={level}>
              <div className="flex items-center gap-2 mb-2">
                {(() => {
                  const config = importanceConfig[level];
                  const Icon = config.icon;
                  return (
                    <>
                      <Icon className={`w-4 h-4 ${config.iconColor}`} />
                      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        {config.label} ({skills.length})
                      </span>
                    </>
                  );
                })()}
              </div>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, i) => (
                  <motion.div
                    key={skill.skill}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Badge variant={importanceConfig[level].badge}>
                      {skill.skill}
                      {skill.frequency > 1 && (
                        <span className="ml-1 opacity-60">
                          ×{skill.frequency}
                        </span>
                      )}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </div>
          )
      )}
    </div>
  );
}
