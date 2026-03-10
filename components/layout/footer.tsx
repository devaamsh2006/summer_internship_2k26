import { Brain } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white/50 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-indigo-500" />
          <span className="text-sm text-gray-500">
            AI Resume Intelligence Platform
          </span>
        </div>
        <p className="text-xs text-gray-400">
          Powered by Sentence Transformers &amp; Llama via OpenRouter
        </p>
      </div>
    </footer>
  );
}
