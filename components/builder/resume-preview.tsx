"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { FileText, Download, Tag } from "lucide-react";

interface ResumePreviewProps {
  latexPdfBase64: string | null;
  atsKeywords: string[];
  onDownloadPDF: () => void;
}

export function ResumePreview({
  latexPdfBase64,
  atsKeywords,
  onDownloadPDF,
}: ResumePreviewProps) {
  const [activeTab, setActiveTab] = useState<"preview" | "keywords">(
    "preview"
  );

  if (!latexPdfBase64 && atsKeywords.length === 0) {
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

  return (
    <div className="space-y-6">
      {/* Tab switcher */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
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

      {/* Download button */}
      {latexPdfBase64 && (
        <div className="flex flex-wrap gap-3">
          <Button size="sm" onClick={onDownloadPDF} className="bg-green-600 hover:bg-green-700 text-white">
            <Download className="w-4 h-4 mr-1.5" />
            Download PDF
          </Button>
        </div>
      )}

      {/* PDF Preview tab */}
      {activeTab === "preview" && latexPdfBase64 && (
        <motion.div
          className="rounded-xl border border-gray-200 shadow-sm overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <iframe
            src={`data:application/pdf;base64,${latexPdfBase64}`}
            className="w-full h-[70vh]"
            title="Resume Preview"
          />
        </motion.div>
      )}

      {activeTab === "preview" && !latexPdfBase64 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText className="w-16 h-16 text-gray-200 mb-4" />
          <h3 className="text-lg font-medium text-gray-400">
            No PDF available
          </h3>
          <p className="text-sm text-gray-300 mt-1">
            Generate your resume to see the preview
          </p>
        </div>
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
