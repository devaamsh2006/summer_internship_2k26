"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ResumeForm } from "@/components/builder/resume-form";
import { ResumePreview } from "@/components/builder/resume-preview";
import type { ResumeBuilderInput } from "@/types";

export default function BuilderPage() {
  const [latexPdfBase64, setLatexPdfBase64] = useState<string | null>(null);
  const [atsKeywords, setAtsKeywords] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (input: ResumeBuilderInput) => {
    setIsGenerating(true);
    setError(null);
    setLatexPdfBase64(null);
    setAtsKeywords([]);

    try {
      const response = await fetch("/api/generate-latex", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to generate resume.");
      }

      setLatexPdfBase64(result.data.pdf || null);
      setAtsKeywords(result.data.atsKeywords || []);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to generate resume."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = useCallback(() => {
    if (!latexPdfBase64) return;
    const byteCharacters = atob(latexPdfBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tailored-resume.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }, [latexPdfBase64]);



  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 min-h-screen">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              AI Resume Builder
            </h1>
            <p className="text-gray-500">
              Generate a tailored resume aligned with your target job
            </p>
          </motion.div>

          {error && (
            <motion.div
              className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {error}
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Your Information</CardTitle>
                  <CardDescription>
                    Enter your details. The AI will structure and phrase your
                    content — it will not fabricate experience.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResumeForm
                    onGenerate={handleGenerate}
                    isGenerating={isGenerating}
                  />
                </CardContent>
              </Card>
            </motion.div>

            {/* Preview */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Generated Resume</CardTitle>
                  <CardDescription>
                    Preview and export your tailored resume
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResumePreview
                    latexPdfBase64={latexPdfBase64}
                    atsKeywords={atsKeywords}
                    onDownloadPDF={handleDownloadPDF}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
