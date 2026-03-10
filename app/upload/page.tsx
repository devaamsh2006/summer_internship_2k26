"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ResumeUpload } from "@/components/upload/resume-upload";
import { JDInput } from "@/components/upload/jd-input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2, Sparkles, ArrowRight } from "lucide-react";
import type { ResumeData, JobDescriptionData } from "@/types";

export default function UploadPage() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("resume", file);

      const response = await fetch("/api/parse-resume", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to parse resume.");
      }

      setResumeData(result.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to parse resume.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!resumeData || !jobDescription.trim()) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      // Step 1: Analyze job description
      const jdResponse = await fetch("/api/analyze-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription }),
      });

      const jdResult = await jdResponse.json();
      if (!jdResponse.ok) {
        throw new Error(jdResult.error || "Failed to analyze job description.");
      }

      const jdData: JobDescriptionData = jdResult.data;

      // Step 2: Compute match scores
      const matchResponse = await fetch("/api/match-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeData, jdData }),
      });

      const matchResult = await matchResponse.json();
      if (!matchResponse.ok) {
        throw new Error(matchResult.error || "Failed to compute match score.");
      }

      // Store results in sessionStorage for the dashboard
      const analysisData = {
        resumeData,
        jdData,
        ...matchResult.data,
      };
      sessionStorage.setItem(
        "analysisResult",
        JSON.stringify(analysisData)
      );

      // Navigate to dashboard
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Analysis failed. Please try again."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const canAnalyze = resumeData && jobDescription.trim().length >= 20;

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 min-h-screen">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Analyze Your Resume
            </h1>
            <p className="text-gray-500">
              Upload your resume and paste the job description for AI-powered
              analysis
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Resume Upload */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-lg">Resume</CardTitle>
                  <CardDescription>
                    Upload your resume in PDF or DOCX format
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResumeUpload
                    onFileSelect={handleFileSelect}
                    isUploading={isUploading}
                    uploadedFileName={resumeData?.fileName}
                  />

                  {/* Show extracted skills */}
                  {resumeData && resumeData.extractedSkills.length > 0 && (
                    <motion.div
                      className="mt-4 p-3 rounded-lg bg-indigo-50/50 border border-indigo-100"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                    >
                      <p className="text-xs font-medium text-indigo-600 mb-1.5">
                        Detected Skills ({resumeData.extractedSkills.length})
                      </p>
                      <p className="text-xs text-gray-500">
                        {resumeData.extractedSkills.join(", ")}
                      </p>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Job Description */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-lg">Job Description</CardTitle>
                  <CardDescription>
                    Paste the complete job posting
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <JDInput
                    value={jobDescription}
                    onChange={setJobDescription}
                    disabled={isAnalyzing}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Error display */}
          {error && (
            <motion.div
              className="mt-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {error}
            </motion.div>
          )}

          {/* Analyze button */}
          <motion.div
            className="mt-8 flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              size="xl"
              onClick={handleAnalyze}
              disabled={!canAnalyze || isAnalyzing}
              className="min-w-[250px]"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 w-5 h-5" />
                  Run AI Analysis
                  <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  );
}
