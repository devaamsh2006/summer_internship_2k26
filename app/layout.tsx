import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "AI Resume Intelligence Platform",
  description:
    "AI-powered resume analysis with semantic matching, ATS scoring, and personalized improvement suggestions.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
