"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { FileDown, FileText } from "lucide-react";
import type { GeneratedResume } from "@/types";

interface ResumePreviewProps {
  resume: GeneratedResume | null;
  onExportPDF: () => void;
  onExportDOCX: () => void;
  isExporting: boolean;
}

export function ResumePreview({
  resume,
  onExportPDF,
  onExportDOCX,
  isExporting,
}: ResumePreviewProps) {
  if (!resume) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FileText className="w-16 h-16 text-gray-200 mb-4" />
        <h3 className="text-lg font-medium text-gray-400">
          Resume Preview
        </h3>
        <p className="text-sm text-gray-300 mt-1">
          Fill in your details and generate to see a preview
        </p>
      </div>
    );
  }

  const sections = [
    { key: "header", label: "" },
    { key: "summary", label: "Professional Summary" },
    { key: "skills", label: "Skills" },
    { key: "experience", label: "Experience" },
    { key: "education", label: "Education" },
    { key: "projects", label: "Projects" },
    { key: "certifications", label: "Certifications" },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Export buttons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onExportPDF}
          disabled={isExporting}
        >
          <FileDown className="w-4 h-4 mr-1.5" />
          Export PDF
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onExportDOCX}
          disabled={isExporting}
        >
          <FileDown className="w-4 h-4 mr-1.5" />
          Export DOCX
        </Button>
      </div>

      {/* Resume preview */}
      <motion.div
        className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 space-y-6 max-h-[70vh] overflow-y-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {sections.map(({ key, label }) => {
          const content = resume.sections[key];
          if (!content || !content.trim()) return null;

          return (
            <div key={key}>
              {label && (
                <h2 className="text-base font-bold text-indigo-700 uppercase tracking-wider border-b border-indigo-100 pb-1 mb-3">
                  {label}
                </h2>
              )}
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {content}
              </div>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
