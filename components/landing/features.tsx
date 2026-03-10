"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  Search,
  FileText,
  Zap,
  Shield,
  Layers,
  TrendingUp,
  PenTool,
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Resume Parsing",
    description:
      "Upload PDF or DOCX resumes. Automatic section detection extracts skills, experience, education, and project details using rule-based heuristics.",
    gradient: "from-indigo-500 to-indigo-600",
  },
  {
    icon: Search,
    title: "Job Description Analysis",
    description:
      "Paste any job description to extract required skills, technologies, tools, and experience requirements using deterministic analysis.",
    gradient: "from-violet-500 to-violet-600",
  },
  {
    icon: BarChart3,
    title: "Semantic Matching",
    description:
      "Sentence Transformer embeddings compute cosine similarity between your resume and the job description for accurate compatibility scoring.",
    gradient: "from-blue-500 to-blue-600",
  },
  {
    icon: Zap,
    title: "Missing Skill Detection",
    description:
      "Deterministic comparison identifies skills present in the job description but missing from your resume, classified by importance.",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: Shield,
    title: "ATS Compatibility",
    description:
      "Analyze resume structure, keyword presence, keyword density, readability, and formatting for maximum ATS compatibility.",
    gradient: "from-emerald-500 to-green-600",
  },
  {
    icon: TrendingUp,
    title: "Keyword Optimization",
    description:
      "Compare resume keywords with job requirements. Identify matched, missing, and overused keywords to optimize your content.",
    gradient: "from-rose-500 to-pink-600",
  },
  {
    icon: Layers,
    title: "Strength Scoring",
    description:
      "Composite scoring based on skill alignment, keyword coverage, experience relevance, and project relevance with weighted metrics.",
    gradient: "from-cyan-500 to-teal-600",
  },
  {
    icon: PenTool,
    title: "AI Resume Builder",
    description:
      "Generate a tailored resume aligned with job requirements. Export as PDF or DOCX. AI improves phrasing without fabricating experience.",
    gradient: "from-purple-500 to-fuchsia-600",
  },
];

export function Features() {
  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-50/30 to-transparent" />
      <div className="relative max-w-6xl mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Comprehensive Analysis Suite
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            A hybrid architecture combining deterministic rule engines, semantic
            transformers, and LLM reasoning for accurate, reliable results.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              className="group relative p-6 rounded-2xl bg-white/70 backdrop-blur-sm border border-white/40 hover:bg-white/90 hover:shadow-xl hover:shadow-indigo-100/30 transition-all duration-300 hover:-translate-y-1"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <div
                className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
              >
                <feature.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
