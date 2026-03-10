"use client";

import { useState, useCallback, useRef } from "react";

interface UseFileUploadOptions {
  accept?: string[];
  maxSizeMB?: number;
}

interface UseFileUploadReturn {
  file: File | null;
  fileName: string | null;
  fileSize: string | null;
  isDragging: boolean;
  error: string | null;
  handleFile: (file: File) => boolean;
  handleDrop: (e: React.DragEvent) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  reset: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function useFileUpload(
  options: UseFileUploadOptions = {}
): UseFileUploadReturn {
  const {
    accept = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    maxSizeMB = 10,
  } = options;

  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const validateFile = useCallback(
    (f: File): string | null => {
      if (!accept.includes(f.type)) {
        return "Unsupported file format. Please upload a PDF or DOCX file.";
      }
      if (f.size > maxSizeMB * 1024 * 1024) {
        return `File size exceeds ${maxSizeMB}MB limit.`;
      }
      return null;
    },
    [accept, maxSizeMB]
  );

  const handleFile = useCallback(
    (f: File): boolean => {
      const validationError = validateFile(f);
      if (validationError) {
        setError(validationError);
        return false;
      }
      setError(null);
      setFile(f);
      setFileName(f.name);
      setFileSize(formatFileSize(f.size));
      return true;
    },
    [validateFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) handleFile(droppedFile);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected) handleFile(selected);
    },
    [handleFile]
  );

  const reset = useCallback(() => {
    setFile(null);
    setFileName(null);
    setFileSize(null);
    setError(null);
    setIsDragging(false);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  return {
    file,
    fileName,
    fileSize,
    isDragging,
    error,
    handleFile,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleInputChange,
    reset,
    inputRef,
  };
}
