# AI Resume Intelligence Platform

A production-quality, AI-powered web platform that combines **Deterministic Rule Engines**, **Sentence Transformer Semantic Matching**, and **LLM Reasoning** to analyze, score, and optimize resumes against job descriptions.

## Features

1. **Resume Parsing** — Upload PDF/DOCX resumes and extract structured data with section detection
2. **Job Description Analysis** — Deterministic extraction of required skills, experience levels, and requirements
3. **Match Scoring** — Hybrid scoring combining skill alignment, keyword coverage, experience relevance, and semantic similarity
4. **Skill Gap Detection** — Identifies missing required/preferred skills with importance classification
5. **Keyword Optimization** — Compares resume keywords against JD terms with frequency and density analysis
6. **ATS Compatibility** — Checks section completeness, formatting, readability, and keyword presence
7. **Section-Level Analysis** — Scores individual resume sections against JD requirements
8. **AI-Powered Improvements** — LLM generates actionable writing improvements per section (no fabricated content)
9. **Resume Builder** — Full form-based resume builder with live preview
10. **PDF/DOCX Export** — Download optimized resumes in both formats
11. **Analytics Dashboard** — Interactive charts, radar visualization, and tabbed analysis views

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Animations | Framer Motion |
| Charts | Recharts |
| Database | Supabase (PostgreSQL) |
| Resume Parsing | pdf-parse, mammoth |
| Semantic Matching | @xenova/transformers (all-MiniLM-L6-v2) |
| LLM | OpenRouter API (Llama 3.1 70B) |
| Export | jsPDF, docx, file-saver |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
│  Landing → Upload → Dashboard (5 tabs) → Resume Builder │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│                   API Routes                             │
│  /parse-resume  /analyze-jd  /match-score               │
│  /improve-resume  /generate-resume                      │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│              Hybrid Analysis Engine                       │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Rule Engine   │  │  Sentence    │  │    LLM       │  │
│  │ (Skill/KW    │  │  Transformer │  │  (Writing     │  │
│  │  extraction,  │  │  (Semantic   │  │   quality     │  │
│  │  ATS scoring) │  │   matching)  │  │   only)       │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase project ([create one free](https://supabase.com/dashboard))
- OpenRouter API key ([get one here](https://openrouter.ai/keys))

### Installation

```bash
# Clone and enter the project
cd claude

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

### Configure Environment

Edit `.env` with your values:

```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
OPENROUTER_API_KEY="sk-or-..."
```

### Database Setup

1. Go to your Supabase project dashboard → **SQL Editor**
2. Copy the contents of `supabase/schema.sql`
3. Paste and run it to create the `analyses` and `generated_resumes` tables

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── parse-resume/route.ts     # Resume file parsing
│   │   ├── analyze-jd/route.ts       # Job description analysis
│   │   ├── match-score/route.ts      # Hybrid match scoring
│   │   ├── improve-resume/route.ts   # LLM-powered improvements
│   │   └── generate-resume/route.ts  # LLM resume generation
│   ├── upload/page.tsx               # Upload page
│   ├── dashboard/page.tsx            # Analytics dashboard
│   ├── builder/page.tsx              # Resume builder
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Landing page
│   └── globals.css                   # Global styles
├── components/
│   ├── ui/                           # shadcn/ui components
│   ├── landing/                      # Hero, features
│   ├── upload/                       # File upload, JD input
│   ├── dashboard/                    # Score gauge, charts, etc.
│   ├── builder/                      # Resume form, preview
│   └── layout/                       # Navbar, footer
├── hooks/                            # Custom React hooks
├── lib/
│   ├── skill-extractor.ts            # 150+ skill taxonomy
│   ├── resume-parser.ts              # PDF/DOCX parsing
│   ├── jd-analyzer.ts                # JD requirement extraction
│   ├── similarity-engine.ts          # Sentence transformer embeddings
│   ├── matching-engine.ts            # Hybrid matching logic
│   ├── ats-analyzer.ts               # ATS compatibility checks
│   ├── keyword-optimizer.ts          # Keyword analysis
│   ├── scoring.ts                    # Weighted composite scoring
│   ├── openrouter.ts                 # LLM integration
│   ├── export.ts                     # PDF/DOCX export utilities
│   ├── prisma.ts                     # Supabase client
│   └── utils.ts                      # General utilities
├── supabase/schema.sql               # Database schema (run in Supabase SQL Editor)
├── types/index.ts                    # TypeScript interfaces
└── package.json
```

## How It Works

1. **Upload** your resume (PDF/DOCX) and paste the target job description
2. **Parsing** extracts structured sections from your resume using pattern matching
3. **JD Analysis** identifies required skills, experience levels, and key requirements deterministically
4. **Semantic Matching** uses all-MiniLM-L6-v2 to compute cosine similarity between resume/JD embeddings
5. **Skill Comparison** combines exact matching with semantic similarity (≥0.65 threshold)
6. **Scoring** produces a weighted composite: 35% skill alignment + 25% keyword coverage + 25% experience + 15% projects
7. **ATS Analysis** checks formatting, section completeness, readability (Flesch), and keyword density
8. **Improvements** (optional) — LLM analyzes your actual writing and suggests specific improvements per section
9. **Export** your optimized resume as PDF or DOCX

## Key Design Decisions

- **LLM is restricted** to writing quality feedback and resume content generation only — all analytical scoring is deterministic
- **No fabricated outputs** — the LLM never invents skills, experiences, or metrics
- **Sentence Transformers run locally** via @xenova/transformers (no external API needed for semantic matching)
- **Greedy semantic matching** ensures each JD skill maps to at most one resume skill