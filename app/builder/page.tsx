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
import type { ResumeBuilderInput, GeneratedResume } from "@/types";

export default function BuilderPage() {
  const [generatedResume, setGeneratedResume] =
    useState<GeneratedResume | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (input: ResumeBuilderInput) => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to generate resume.");
      }

      setGeneratedResume(result.data);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to generate resume."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportPDF = useCallback(async () => {
    if (!generatedResume) return;
    setIsExporting(true);

    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();

      const margins = { top: 20, left: 20, right: 20 };
      const pageWidth = doc.internal.pageSize.getWidth();
      const maxWidth = pageWidth - margins.left - margins.right;
      let y = margins.top;

      const addText = (text: string, fontSize: number, bold = false) => {
        doc.setFontSize(fontSize);
        if (bold) doc.setFont("helvetica", "bold");
        else doc.setFont("helvetica", "normal");

        const lines = doc.splitTextToSize(text, maxWidth);
        for (const line of lines) {
          if (y > 270) {
            doc.addPage();
            y = margins.top;
          }
          doc.text(line, margins.left, y);
          y += fontSize * 0.5;
        }
        y += 4;
      };

      const sections = [
        { text: generatedResume.sections.header, size: 14, bold: true },
        { text: generatedResume.sections.summary, size: 10, bold: false },
        { text: generatedResume.sections.skills, size: 10, bold: false },
        { text: generatedResume.sections.experience, size: 10, bold: false },
        { text: generatedResume.sections.education, size: 10, bold: false },
        { text: generatedResume.sections.projects, size: 10, bold: false },
        { text: generatedResume.sections.certifications, size: 10, bold: false },
      ];

      for (const section of sections) {
        if (section.text && section.text.trim()) {
          addText(section.text, section.size, section.bold);
        }
      }

      doc.save("tailored-resume.pdf");
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setIsExporting(false);
    }
  }, [generatedResume]);

  const handleExportDOCX = useCallback(async () => {
    if (!generatedResume) return;
    setIsExporting(true);

    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel } =
        await import("docx");
      const { saveAs } = await import("file-saver");

      const children: InstanceType<typeof Paragraph>[] = [];

      const addSection = (text: string, heading?: boolean) => {
        if (!text || !text.trim()) return;
        const lines = text.split("\n");
        for (const line of lines) {
          if (!line.trim()) continue;
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: line,
                  bold: heading,
                  size: heading ? 28 : 22,
                }),
              ],
              heading: heading ? HeadingLevel.HEADING_1 : undefined,
              spacing: { after: 100 },
            })
          );
        }
        children.push(new Paragraph({ text: "" }));
      };

      addSection(generatedResume.sections.header, true);
      addSection(generatedResume.sections.summary);
      addSection(generatedResume.sections.skills);
      addSection(generatedResume.sections.experience);
      addSection(generatedResume.sections.education);
      addSection(generatedResume.sections.projects);
      addSection(generatedResume.sections.certifications);

      const doc = new Document({
        sections: [{ children }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, "tailored-resume.docx");
    } catch (err) {
      console.error("DOCX export failed:", err);
    } finally {
      setIsExporting(false);
    }
  }, [generatedResume]);

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
                    resume={generatedResume}
                    onExportPDF={handleExportPDF}
                    onExportDOCX={handleExportDOCX}
                    isExporting={isExporting}
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
