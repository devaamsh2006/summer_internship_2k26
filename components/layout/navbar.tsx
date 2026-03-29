"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Brain, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/upload", label: "Analyze" },
  { href: "/builder", label: "Builder" },
  { href: "/practice-interview", label: "Practice Interview", icon: Mic },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl bg-white/80 border-b border-gray-200/50 shadow-sm shadow-black/[0.02]"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-indigo-500/25">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-lg tracking-tight gradient-text">
            ResumeAI
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300",
                  isActive
                    ? "text-indigo-700"
                    : "text-gray-500 hover:text-gray-900"
                )}
              >
                {isActive && (
                  <motion.div
                    className="absolute inset-0 bg-indigo-50/80 rounded-xl border border-indigo-100"
                    layoutId="navbar-active"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {item.icon && <item.icon className="w-3.5 h-3.5" />}
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
}
