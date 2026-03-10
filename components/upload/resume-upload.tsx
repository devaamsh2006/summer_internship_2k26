"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResumeUploadProps {
  onFileSelect: (file: File) => void;
  isUploading: boolean;
  uploadedFileName?: string;
}

export function ResumeUpload({
  onFileSelect,
  isUploading,
  uploadedFileName,
}: ResumeUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (isValidFile(file)) {
          onFileSelect(file);
        }
      }
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (isValidFile(file)) {
          onFileSelect(file);
        }
      }
    },
    [onFileSelect]
  );

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium text-gray-700">
        Upload Resume (PDF or DOCX)
      </label>

      <motion.div
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer ${
          isDragging
            ? "border-indigo-400 bg-indigo-50/50"
            : uploadedFileName
              ? "border-emerald-300 bg-emerald-50/30"
              : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/20"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <input
          type="file"
          accept=".pdf,.docx,.doc"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />

        <AnimatePresence mode="wait">
          {isUploading ? (
            <motion.div
              key="uploading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center"
            >
              <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin mb-4" />
              <p className="text-sm text-gray-600">Parsing resume...</p>
            </motion.div>
          ) : uploadedFileName ? (
            <motion.div
              key="uploaded"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center"
            >
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3" />
              <p className="text-sm font-medium text-gray-900">
                {uploadedFileName}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Click or drop to replace
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center mb-4">
                <Upload className="w-7 h-7 text-indigo-600" />
              </div>
              <p className="text-sm font-medium text-gray-700 mb-1">
                Drop your resume here or click to browse
              </p>
              <p className="text-xs text-gray-400">
                Supports PDF and DOCX (max 10MB)
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function isValidFile(file: File): boolean {
  const validTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
  ];
  const validExtensions = [".pdf", ".docx", ".doc"];
  const hasValidType = validTypes.includes(file.type);
  const hasValidExt = validExtensions.some((ext) =>
    file.name.toLowerCase().endsWith(ext)
  );
  return (hasValidType || hasValidExt) && file.size <= 10 * 1024 * 1024;
}
