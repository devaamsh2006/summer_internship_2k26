"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScoreGauge } from "@/components/dashboard/score-gauge";
import { RadarChartComponent } from "@/components/dashboard/radar-chart";
import { SkillComparison } from "@/components/dashboard/skill-comparison";
import { KeywordChart } from "@/components/dashboard/keyword-chart";
import { SectionScoresDisplay } from "@/components/dashboard/section-scores";
import { MissingSkillsDisplay } from "@/components/dashboard/missing-skills";
import { ImprovementsDisplay } from "@/components/dashboard/improvements";
import { ATSScore } from "@/components/dashboard/ats-score";
import { TailoredResume } from "@/components/dashboard/tailored-resume";
import { Sparkles, ArrowLeft, Loader2 } from "lucide-react";
import type {
  ResumeData,
  JobDescriptionData,
  MatchResult,
  MissingSkill,
  KeywordAnalysis,
  ATSAnalysis,
  StrengthScore,
  Improvement,
} from "@/types";

interface AnalysisData {
  resumeData: ResumeData;
  jdData: JobDescriptionData;
  matchResult: MatchResult;
  missingSkills: MissingSkill[];
  keywordAnalysis: KeywordAnalysis;
  atsAnalysis: ATSAnalysis;
  strengthScore: StrengthScore;
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<AnalysisData | null>(null);
  const [improvements, setImprovements] = useState<Improvement[]>([]);
  const [isLoadingImprovements, setIsLoadingImprovements] = useState(false);
  const [improvementsLoaded, setImprovementsLoaded] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("analysisResult");
    if (!stored) {
      router.push("/upload");
      return;
    }
    try {
      setData(JSON.parse(stored));
    } catch {
      router.push("/upload");
    }
  }, [router]);

  const handleLoadImprovements = async () => {
    if (!data || improvementsLoaded) return;
    setIsLoadingImprovements(true);

    try {
      const response = await fetch("/api/improve-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections: data.resumeData.sections }),
      });

      const result = await response.json();
      if (response.ok && result.data) {
        setImprovements(result.data.improvements || []);
      }
    } catch (error) {
      console.error("Failed to load improvements:", error);
    } finally {
      setIsLoadingImprovements(false);
      setImprovementsLoaded(true);
    }
  };

  if (!data) {
    return (
      <>
        <Navbar />
        <main className="pt-24 pb-16 min-h-screen">
          <div className="max-w-6xl mx-auto px-6 space-y-6">
            <Skeleton className="h-8 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 min-h-screen">
        <div className="max-w-6xl mx-auto px-6">
          {/* Header */}
          <motion.div
            className="flex items-center justify-between mb-8"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Analysis Dashboard
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {data.resumeData.fileName} — {data.jdData.requiredSkills.length}{" "}
                skills detected in JD
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push("/upload")}
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              New Analysis
            </Button>
          </motion.div>

          {/* Score overview row */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="flex items-center justify-center py-6">
              <ScoreGauge
                score={data.matchResult.overallScore}
                label="Overall Match"
              />
            </Card>
            <Card className="flex items-center justify-center py-6">
              <ScoreGauge
                score={data.strengthScore.overall}
                label="Strength Score"
              />
            </Card>
            <Card className="flex items-center justify-center py-6">
              <ScoreGauge
                score={data.atsAnalysis.score}
                label="ATS Compatibility"
              />
            </Card>
          </motion.div>

          {/* Tabbed content */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 h-11">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
              <TabsTrigger value="keywords">Keywords</TabsTrigger>
              <TabsTrigger value="ats">ATS</TabsTrigger>
              <TabsTrigger value="improvements">Improvements</TabsTrigger>
              <TabsTrigger value="tailored">Tailored Resume</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              <motion.div
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Section Similarity Radar
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadarChartComponent
                      sectionScores={data.matchResult.sectionScores}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Section Scores
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SectionScoresDisplay
                      sectionScores={data.matchResult.sectionScores}
                    />
                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-indigo-50/50 text-center">
                        <p className="text-2xl font-bold text-indigo-600">
                          {data.strengthScore.skillAlignment}%
                        </p>
                        <p className="text-xs text-gray-500">Skill Alignment</p>
                      </div>
                      <div className="p-3 rounded-lg bg-violet-50/50 text-center">
                        <p className="text-2xl font-bold text-violet-600">
                          {data.strengthScore.keywordCoverage}%
                        </p>
                        <p className="text-xs text-gray-500">Keyword Coverage</p>
                      </div>
                      <div className="p-3 rounded-lg bg-blue-50/50 text-center">
                        <p className="text-2xl font-bold text-blue-600">
                          {data.strengthScore.experienceRelevance}%
                        </p>
                        <p className="text-xs text-gray-500">Experience Match</p>
                      </div>
                      <div className="p-3 rounded-lg bg-emerald-50/50 text-center">
                        <p className="text-2xl font-bold text-emerald-600">
                          {data.strengthScore.projectRelevance}%
                        </p>
                        <p className="text-xs text-gray-500">Project Match</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Skills Tab */}
            <TabsContent value="skills">
              <motion.div
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Skill Matching
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SkillComparison
                      matches={data.matchResult.semanticSkillMatches}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Missing Skills
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MissingSkillsDisplay
                      missingSkills={data.missingSkills}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Keywords Tab */}
            <TabsContent value="keywords">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Keyword Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <KeywordChart
                      keywordAnalysis={data.keywordAnalysis}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* ATS Tab */}
            <TabsContent value="ats">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      ATS Compatibility Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ATSScore atsAnalysis={data.atsAnalysis} />
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Improvements Tab */}
            <TabsContent value="improvements">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">
                      AI Writing Improvements
                    </CardTitle>
                    {!improvementsLoaded && (
                      <Button
                        size="sm"
                        onClick={handleLoadImprovements}
                        disabled={isLoadingImprovements}
                      >
                        {isLoadingImprovements ? (
                          <>
                            <Loader2 className="mr-1.5 w-4 h-4 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-1.5 w-4 h-4" />
                            Get AI Suggestions
                          </>
                        )}
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    <ImprovementsDisplay
                      improvements={improvements}
                      isLoading={isLoadingImprovements}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Tailored Resume Tab */}
            <TabsContent value="tailored">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Generate Tailored Resume
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TailoredResume
                      resumeData={data.resumeData}
                      jdData={data.jdData}
                      originalAtsScore={data.atsAnalysis.score}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </>
  );
}
