import { Brain } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-gray-100/50 bg-gradient-to-b from-white/50 to-gray-50/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
            <Brain className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-600">
            AI Resume Intelligence Platform
          </span>
        </div>
        <p className="text-xs text-gray-400 font-medium">
          Powered by Sentence Transformers &amp; Llama via OpenRouter
        </p>
      </div>
    </footer>
  );
}
