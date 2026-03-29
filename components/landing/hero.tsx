"use client";

import { motion } from "framer-motion";
import { ArrowRight, Brain, FileSearch, Target, Sparkles, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-violet-50/50 to-blue-50" />
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-200/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-violet-200/25 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-200/15 rounded-full blur-[60px] animate-pulse" style={{ animationDelay: "0.5s" }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/70 backdrop-blur-sm border border-indigo-200/50 mb-8 shadow-sm">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-semibold text-indigo-700">
              AI-Powered Resume Intelligence
            </span>
          </div>
        </motion.div>

        <motion.h1
          className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          <span className="gradient-text">
            Land Your Dream Job
          </span>
          <br />
          <span className="text-gray-900">With AI Precision</span>
        </motion.h1>

        <motion.p
          className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Upload your resume, paste a job description, and get instant AI-driven
          analysis with semantic matching, ATS scoring, and personalized
          improvement suggestions.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <Link href="/upload">
            <Button size="xl" className="group shadow-xl shadow-indigo-500/20 hover:shadow-2xl hover:shadow-indigo-500/30 transition-shadow">
              Analyze Your Resume
              <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <Link href="/practice-interview">
            <Button size="xl" variant="outline" className="backdrop-blur-sm border-2 hover:bg-indigo-50/50 transition-colors">
              <Mic className="mr-2 w-5 h-5" />
              Practice Interview
            </Button>
          </Link>
        </motion.div>

        {/* Feature highlights */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-4 gap-5 mt-20"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          {[
            {
              icon: FileSearch,
              title: "Smart Parsing",
              desc: "PDF & DOCX parsing with section detection",
            },
            {
              icon: Brain,
              title: "Semantic Matching",
              desc: "AI-powered skill similarity analysis",
            },
            {
              icon: Target,
              title: "ATS Optimization",
              desc: "Compatibility scoring & keyword analysis",
            },
            {
              icon: Mic,
              title: "Interview Prep",
              desc: "AI-powered mock interviews with feedback",
            },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              className="group p-6 rounded-2xl premium-card hover:shadow-xl hover:shadow-indigo-100/30 transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 + i * 0.1 }}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-indigo-500/25">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-500">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
