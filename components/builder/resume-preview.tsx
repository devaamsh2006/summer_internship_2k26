"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { FileDown, FileText, FileCode, Copy, Check, Download, Tag } from "lucide-react";
import type { GeneratedResume } from "@/types";

interface ResumePreviewProps {
  resume: GeneratedResume | null;
  latexCode: string | null;
  latexPdfBase64: string | null;
  atsKeywords: string[];
  onExportPDF: () => void;
  onExportDOCX: () => void;
  onExportLatex: () => void;
  onCopyLatex: () => void;
  onDownloadLatexPDF: () => void;
  isExporting: boolean;
}

export function ResumePreview({
  resume,
  latexCode,
  latexPdfBase64,
  atsKeywords,
  onExportPDF,
  onExportDOCX,
  onExportLatex,
  onCopyLatex,
  onDownloadLatexPDF,
  isExporting,
}: ResumePreviewProps) {
  const [activeTab, setActiveTab] = useState<"preview" | "latex" | "keywords">(
    resume ? "preview" : latexCode ? "latex" : "preview"
  );
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopyLatex();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!resume && !latexCode) {
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
    { key: "skills", label: "Technical Skills" },
    { key: "experience", label: "Project Experience" },
    { key: "education", label: "Education" },
    { key: "projects", label: "Projects" },
    { key: "courses", label: "Courses" },
    { key: "certifications", label: "Certifications" },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Tab switcher */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {resume && (
          <button
            onClick={() => setActiveTab("preview")}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === "preview"
                ? "bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Preview
          </button>
        )}
        {latexCode && (
          <button
            onClick={() => setActiveTab("latex")}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === "latex"
                ? "bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            LaTeX Code
          </button>
        )}
        {atsKeywords.length > 0 && (
          <button
            onClick={() => setActiveTab("keywords")}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === "keywords"
                ? "bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            ATS Keywords ({atsKeywords.length})
          </button>
        )}
      </div>

      {/* Export buttons */}
      <div className="flex flex-wrap gap-3">
        {resume && (
          <>
            <Button variant="outline" size="sm" onClick={onExportPDF} disabled={isExporting}>
              <FileDown className="w-4 h-4 mr-1.5" />
              Export PDF
            </Button>
            <Button variant="outline" size="sm" onClick={onExportDOCX} disabled={isExporting}>
              <FileDown className="w-4 h-4 mr-1.5" />
              Export DOCX
            </Button>
          </>
        )}
        {latexPdfBase64 && (
          <Button size="sm" onClick={onDownloadLatexPDF} className="bg-green-600 hover:bg-green-700 text-white">
            <Download className="w-4 h-4 mr-1.5" />
            Download PDF (LaTeX)
          </Button>
        )}
        {latexCode && (
          <>
            <Button variant="outline" size="sm" onClick={onExportLatex}>
              <FileCode className="w-4 h-4 mr-1.5" />
              Download .tex
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? (
                <Check className="w-4 h-4 mr-1.5 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 mr-1.5" />
              )}
              {copied ? "Copied!" : "Copy LaTeX"}
            </Button>
          </>
        )}
      </div>

      {/* Resume preview tab */}
      {activeTab === "preview" && resume && (
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
      )}

      {/* LaTeX code tab */}
      {activeTab === "latex" && latexCode && (
        <motion.div
          className="bg-gray-900 rounded-xl border border-gray-700 shadow-sm max-h-[70vh] overflow-y-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
            <span className="text-xs font-medium text-gray-400">tailored-resume.tex</span>
            {latexPdfBase64 ? (
              <span className="text-xs text-green-400">PDF compiled successfully</span>
            ) : (
              <span className="text-xs text-yellow-400">PDF compilation unavailable — use .tex file with Overleaf</span>
            )}
          </div>
          <pre className="p-4 text-sm text-green-400 font-mono leading-relaxed overflow-x-auto">
            <code>{latexCode}</code>
          </pre>
        </motion.div>
      )}

      {/* ATS Keywords tab */}
      {activeTab === "keywords" && atsKeywords.length > 0 && (
        <motion.div
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-h-[70vh] overflow-y-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              ATS Keywords Extracted from Job Description
            </h3>
            <p className="text-xs text-gray-400">
              These {atsKeywords.length} keywords were extracted and naturally woven into your resume for maximum ATS score.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {atsKeywords.map((keyword, i) => (
              <span
                key={i}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200"
              >
                {keyword}
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
