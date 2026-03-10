"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Wand2, Loader2, FileCode } from "lucide-react";
import type { ResumeBuilderInput } from "@/types";

interface ResumeFormProps {
  onGenerate: (input: ResumeBuilderInput) => void;
  onGenerateLatex: (input: ResumeBuilderInput) => void;
  isGenerating: boolean;
  isGeneratingLatex: boolean;
}

export function ResumeForm({ onGenerate, onGenerateLatex, isGenerating, isGeneratingLatex }: ResumeFormProps) {
  const [form, setForm] = useState<ResumeBuilderInput>({
    name: "",
    email: "",
    phone: "",
    github: "",
    linkedin: "",
    portfolio: "",
    summary: "",
    skills: "",
    experience: "",
    education: "",
    projects: "",
    courses: "",
    certifications: "",
    jobDescription: "",
  });

  const updateField = (
    field: keyof ResumeBuilderInput,
    value: string
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(form);
  };

  const isValid = form.name.trim() && form.jobDescription.trim();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Contact Info */}
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
          Contact Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              placeholder="John Doe"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              className="bg-white/80"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              className="bg-white/80"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              placeholder="+1 (555) 000-0000"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              className="bg-white/80"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="github">GitHub</Label>
            <Input
              id="github"
              placeholder="github.com/username"
              value={form.github}
              onChange={(e) => updateField("github", e.target.value)}
              className="bg-white/80"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="linkedin">LinkedIn</Label>
            <Input
              id="linkedin"
              placeholder="linkedin.com/in/username"
              value={form.linkedin}
              onChange={(e) => updateField("linkedin", e.target.value)}
              className="bg-white/80"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="portfolio">Portfolio</Label>
            <Input
              id="portfolio"
              placeholder="yourportfolio.com"
              value={form.portfolio}
              onChange={(e) => updateField("portfolio", e.target.value)}
              className="bg-white/80"
            />
          </div>
        </div>
      </motion.div>

      {/* Job Description */}
      <motion.div
        className="space-y-1.5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Label htmlFor="jd">Target Job Description *</Label>
        <Textarea
          id="jd"
          placeholder="Paste the job description you want to tailor your resume for..."
          value={form.jobDescription}
          onChange={(e) => updateField("jobDescription", e.target.value)}
          className="min-h-[120px] bg-white/80"
        />
      </motion.div>

      {/* Summary */}
      <motion.div
        className="space-y-1.5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Label htmlFor="summary">Professional Summary</Label>
        <Textarea
          id="summary"
          placeholder="Brief professional summary highlighting your key strengths..."
          value={form.summary}
          onChange={(e) => updateField("summary", e.target.value)}
          className="min-h-[80px] bg-white/80"
        />
      </motion.div>

      {/* Skills */}
      <motion.div
        className="space-y-1.5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Label htmlFor="skills">Skills</Label>
        <Textarea
          id="skills"
          placeholder="List your skills (e.g., JavaScript, React, Node.js, Python, AWS...)"
          value={form.skills}
          onChange={(e) => updateField("skills", e.target.value)}
          className="min-h-[60px] bg-white/80"
        />
      </motion.div>

      {/* Experience */}
      <motion.div
        className="space-y-1.5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Label htmlFor="experience">Work Experience</Label>
        <Textarea
          id="experience"
          placeholder="Describe your work experience (company, role, dates, and what you built/achieved)..."
          value={form.experience}
          onChange={(e) => updateField("experience", e.target.value)}
          className="min-h-[150px] bg-white/80"
        />
      </motion.div>

      {/* Education */}
      <motion.div
        className="space-y-1.5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Label htmlFor="education">Education</Label>
        <Textarea
          id="education"
          placeholder="Your educational background (degree, institution, year)..."
          value={form.education}
          onChange={(e) => updateField("education", e.target.value)}
          className="min-h-[80px] bg-white/80"
        />
      </motion.div>

      {/* Projects */}
      <motion.div
        className="space-y-1.5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Label htmlFor="projects">Projects</Label>
        <Textarea
          id="projects"
          placeholder="Notable projects (name, tech stack, what it does, your engineering contribution)..."
          value={form.projects}
          onChange={(e) => updateField("projects", e.target.value)}
          className="min-h-[100px] bg-white/80"
        />
      </motion.div>

      {/* Courses */}
      <motion.div
        className="space-y-1.5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32 }}
      >
        <Label htmlFor="courses">Relevant Courses</Label>
        <Textarea
          id="courses"
          placeholder="List relevant coursework (e.g., Data Structures, Machine Learning, Operating Systems)..."
          value={form.courses}
          onChange={(e) => updateField("courses", e.target.value)}
          className="min-h-[60px] bg-white/80"
        />
      </motion.div>

      {/* Certifications */}
      <motion.div
        className="space-y-1.5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Label htmlFor="certifications">Certifications</Label>
        <Textarea
          id="certifications"
          placeholder="Any relevant certifications..."
          value={form.certifications}
          onChange={(e) => updateField("certifications", e.target.value)}
          className="min-h-[60px] bg-white/80"
        />
      </motion.div>

      <div className="flex gap-3">
        <Button
          type="submit"
          size="lg"
          disabled={!isValid || isGenerating || isGeneratingLatex}
          className="flex-1"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 w-5 h-5 animate-spin" />
              Generating Resume...
            </>
          ) : (
            <>
              <Wand2 className="mr-2 w-5 h-5" />
              Generate Resume
            </>
          )}
        </Button>
        <Button
          type="button"
          size="lg"
          variant="outline"
          disabled={!isValid || isGenerating || isGeneratingLatex}
          onClick={() => onGenerateLatex(form)}
          className="flex-1"
        >
          {isGeneratingLatex ? (
            <>
              <Loader2 className="mr-2 w-5 h-5 animate-spin" />
              Generating LaTeX...
            </>
          ) : (
            <>
              <FileCode className="mr-2 w-5 h-5" />
              Generate LaTeX
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
