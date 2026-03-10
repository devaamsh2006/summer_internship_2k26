"use client";

import { Textarea } from "@/components/ui/textarea";
import { FileText } from "lucide-react";

interface JDInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function JDInput({ value, onChange, disabled }: JDInputProps) {
  return (
    <div className="space-y-4">
      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
        <FileText className="w-4 h-4 text-indigo-500" />
        Paste Job Description
      </label>
      <Textarea
        placeholder="Paste the complete job description here..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="min-h-[250px] bg-white/80 backdrop-blur-sm border-gray-200 focus:border-indigo-300 resize-y text-sm leading-relaxed"
      />
      <p className="text-xs text-gray-400">
        {value.length > 0
          ? `${value.split(/\s+/).filter(Boolean).length} words`
          : "Include the full job posting for best results"}
      </p>
    </div>
  );
}
