"use client";

import { motion } from "framer-motion";

interface ScoreGaugeProps {
  score: number;
  label: string;
  size?: number;
}

export function ScoreGauge({ score, label, size = 180 }: ScoreGaugeProps) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (Math.min(100, Math.max(0, score)) / 100) * circumference;
  const center = size / 2;

  const getColor = (value: number) => {
    if (value >= 80) return { stroke: "#10b981", text: "text-emerald-600", bg: "from-emerald-500 to-green-500" };
    if (value >= 60) return { stroke: "#6366f1", text: "text-indigo-600", bg: "from-indigo-500 to-violet-500" };
    if (value >= 40) return { stroke: "#f59e0b", text: "text-amber-600", bg: "from-amber-500 to-orange-500" };
    return { stroke: "#ef4444", text: "text-red-600", bg: "from-red-500 to-rose-500" };
  };

  const color = getColor(score);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-gray-100"
          />
          {/* Progress circle */}
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className={`text-3xl font-bold ${color.text}`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            {score}
          </motion.span>
          <span className="text-xs text-gray-400 mt-0.5">/ 100</span>
        </div>
      </div>
      <span className="text-sm font-medium text-gray-700 mt-3">{label}</span>
    </div>
  );
}
