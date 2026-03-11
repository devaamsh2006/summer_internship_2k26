"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ScoreGauge } from "@/components/dashboard/score-gauge";
import {
  Wand2,
  Loader2,
  Download,
  ArrowUpRight,
  CheckCircle2,
  FileText,
} from "lucide-react";
import type {
  ResumeData,
  JobDescriptionData,
  ATSAnalysis,
} from "@/types";

interface TailoredResumeProps {
  resumeData: ResumeData;
  jdData: JobDescriptionData;
  originalAtsScore: number;
}

type TailorStep = "idle" | "generating" | "rescoring" | "done" | "error";

export function TailoredResume({
  resumeData,
  jdData,
  originalAtsScore,
}: TailoredResumeProps) {
  const [step, setStep] = useState<TailorStep>("idle");
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [newAtsAnalysis, setNewAtsAnalysis] = useState<ATSAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setStep("generating");
    setError(null);

    try {
      // Step 1: Generate the tailored resume PDF
      const tailorResponse = await fetch("/api/tailor-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeData, jdData }),
      });

      const tailorResult = await tailorResponse.json();
      if (!tailorResponse.ok) {
        throw new Error(tailorResult.error || "Failed to generate tailored resume.");
      }

      const pdf = tailorResult.data?.pdf;
      if (!pdf) {
        throw new Error("PDF generation failed. LaTeX compilation may not be available.");
      }
      setPdfBase64(pdf);

      // Step 2: Re-score the generated resume by building a synthetic ResumeData
      // from the structured data returned by the API
      setStep("rescoring");
      const structured = tailorResult.data.structuredData;
      const generatedText = [
        structured.name,
        structured.email,
        structured.phone,
        ...structured.skills.map((s: { category: string; items: string }) => `${s.category}: ${s.items}`),
        ...structured.projects.map((p: { name: string; description: string; bullets?: string[]; technologies: string }) =>
          `${p.name} ${p.description} ${(p.bullets || []).join(" ")} ${p.technologies}`
        ),
        ...structured.experience.map((e: { title: string; bullets: string[] }) =>
          `${e.title} ${e.bullets.join(" ")}`
        ),
        ...structured.education.map((e: { degree: string; institution: string; year: string; detail: string }) =>
          `${e.degree} ${e.institution} ${e.year} ${e.detail}`
        ),
        ...structured.courses,
        ...structured.achievements,
      ].join("\n");

      const newResumeData: ResumeData = {
        rawText: generatedText,
        sections: {
          contact: `${structured.name}\n${structured.email}\n${structured.phone}`,
          summary: "",
          skills: structured.skills
            .map((s: { category: string; items: string }) => `${s.category}: ${s.items}`)
            .join("\n"),
          experience: structured.experience
            .map((e: { title: string; bullets: string[] }) =>
              `${e.title}\n${e.bullets.map((b: string) => `• ${b}`).join("\n")}`
            )
            .join("\n\n"),
          projects: structured.projects
            .map((p: { name: string; description: string; bullets?: string[]; technologies: string }) =>
              `${p.name}\n${p.description}\n${(p.bullets || []).map((b: string) => `• ${b}`).join("\n")}\nTechnologies: ${p.technologies}`
            )
            .join("\n\n"),
          education: structured.education
            .map((e: { degree: string; institution: string; year: string; detail: string }) =>
              `${e.degree}, ${e.institution} ${e.year} ${e.detail}`
            )
            .join("\n"),
          certifications: structured.achievements.join("\n"),
        },
        extractedSkills: tailorResult.data.atsKeywords || [],
        fileName: "tailored-resume.pdf",
      };

      const matchResponse = await fetch("/api/match-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeData: newResumeData, jdData }),
      });

      const matchResult = await matchResponse.json();
      if (matchResponse.ok && matchResult.data) {
        setNewAtsAnalysis(matchResult.data.atsAnalysis);
      }

      setStep("done");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStep("error");
    }
  };

  const handleDownload = useCallback(() => {
    if (!pdfBase64) return;
    const byteCharacters = atob(pdfBase64);
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
  }, [pdfBase64]);

  const scoreDiff = newAtsAnalysis
    ? newAtsAnalysis.score - originalAtsScore
    : 0;

  return (
    <div className="space-y-6">
      {/* Idle state: show CTA */}
      {step === "idle" && (
        <motion.div
          className="text-center py-10 space-y-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white mb-2">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Generate a Tailored Resume
          </h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            We&apos;ll use your uploaded resume and the job description to generate
            an ATS-optimized PDF with enhanced descriptions, better keywords,
            and professional formatting.
          </p>
          <Button
            size="lg"
            onClick={handleGenerate}
            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            Generate Tailored Resume
          </Button>
        </motion.div>
      )}

      {/* Generating state */}
      {(step === "generating" || step === "rescoring") && (
        <motion.div
          className="text-center py-10 space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto" />
          <p className="text-sm text-gray-600">
            {step === "generating"
              ? "Generating your ATS-optimized resume..."
              : "Re-scoring your tailored resume..."}
          </p>
          <p className="text-xs text-gray-400">
            This may take a minute — we&apos;re enhancing every section.
          </p>
        </motion.div>
      )}

      {/* Error state */}
      {step === "error" && (
        <motion.div
          className="text-center py-10 space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600 max-w-md mx-auto">
            {error}
          </div>
          <Button variant="outline" onClick={() => setStep("idle")}>
            Try Again
          </Button>
        </motion.div>
      )}

      {/* Done state: show results */}
      {step === "done" && (
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Score comparison */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="flex flex-col items-center">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Original ATS Score
              </p>
              <ScoreGauge score={originalAtsScore} label="Original" size={140} />
            </div>

            <div className="flex flex-col items-center">
              <ArrowUpRight
                className={`w-8 h-8 ${
                  scoreDiff > 0 ? "text-emerald-500" : "text-gray-300"
                }`}
              />
              {scoreDiff > 0 && (
                <span className="text-sm font-bold text-emerald-600 mt-1">
                  +{scoreDiff} points
                </span>
              )}
            </div>

            <div className="flex flex-col items-center">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Tailored ATS Score
              </p>
              <ScoreGauge
                score={newAtsAnalysis?.score ?? 0}
                label="Tailored"
                size={140}
              />
            </div>
          </div>

          {/* Improvement highlight */}
          {scoreDiff > 0 && (
            <motion.div
              className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <p className="text-sm text-emerald-700">
                Your tailored resume scores <strong>{scoreDiff} points higher</strong> on
                ATS compatibility. The enhanced descriptions and keyword optimization
                make your resume significantly more likely to pass automated screening.
              </p>
            </motion.div>
          )}

          {/* ATS breakdown for new resume */}
          {newAtsAnalysis && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ScoreCard
                label="Keyword Presence"
                value={newAtsAnalysis.keywordPresence}
              />
              <ScoreCard
                label="Keyword Density"
                value={newAtsAnalysis.keywordDensity}
              />
              <ScoreCard
                label="Readability"
                value={newAtsAnalysis.readabilityScore}
              />
              <ScoreCard
                label="Formatting"
                value={newAtsAnalysis.formattingScore}
              />
            </div>
          )}

          {/* Download buttons */}
          <div className="flex justify-center gap-4 pt-2">
            <Button
              size="lg"
              onClick={handleDownload}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Tailored Resume (PDF)
            </Button>
            <Button variant="outline" size="lg" onClick={() => {
              setStep("idle");
              setPdfBase64(null);
              setNewAtsAnalysis(null);
            }}>
              Regenerate
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function ScoreCard({ label, value }: { label: string; value: number }) {
  const rounded = Math.round(value);
  const color =
    rounded >= 80
      ? "text-emerald-600 bg-emerald-50"
      : rounded >= 60
      ? "text-indigo-600 bg-indigo-50"
      : rounded >= 40
      ? "text-amber-600 bg-amber-50"
      : "text-red-600 bg-red-50";

  return (
    <div className={`p-3 rounded-lg text-center ${color}`}>
      <p className="text-2xl font-bold">{rounded}%</p>
      <p className="text-xs mt-0.5 opacity-75">{label}</p>
    </div>
  );
}
