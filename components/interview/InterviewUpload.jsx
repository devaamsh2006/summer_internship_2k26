"use client";

import { useState } from "react";
import { Loader2, UploadCloud } from "lucide-react";
import InterviewResults from "@/components/interview/InterviewResults";

export default function InterviewUpload({
  resumeMatchScore = null,
  initialResumeMatchScore = null,
}) {
  const resolvedResumeMatchScore =
    resumeMatchScore ?? initialResumeMatchScore;
  const [videoFile, setVideoFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [interviewResult, setInterviewResult] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!videoFile) {
      setError("Please select a video file before submitting.");
      return;
    }

    try {
      setError("");
      setIsUploading(true);

      const formData = new FormData();
      formData.append("video", videoFile);

      const response = await fetch("/api/interview/upload", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Interview analysis failed.");
      }

      setInterviewResult(payload);
    } catch (submitError) {
      setInterviewResult(null);
      setError(submitError instanceof Error ? submitError.message : "Unexpected upload error.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-xl font-semibold text-slate-900">Interview Video Analysis</h2>
        <p className="mt-2 text-sm text-slate-600">
          Upload your interview recording to evaluate posture, facial expressions, fluency, and sentiment.
        </p>

        <div className="mt-6 space-y-3">
          <label htmlFor="interview-video" className="text-sm font-medium text-slate-800">
            Video File
          </label>
          <input
            id="interview-video"
            type="file"
            accept=".mp4,.avi,.webm,video/mp4,video/x-msvideo,video/webm"
            onChange={(event) => setVideoFile(event.target.files?.[0] || null)}
            className="block w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-slate-800 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-slate-700"
          />
          {videoFile ? (
            <p className="text-xs text-slate-500">Selected: {videoFile.name}</p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={isUploading}
          className="mt-6 inline-flex items-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading & Analyzing
            </>
          ) : (
            <>
              <UploadCloud className="mr-2 h-4 w-4" />
              Upload Interview Video
            </>
          )}
        </button>

        {isUploading ? (
          <p className="mt-4 text-sm text-indigo-700">
            Analyzing posture, expressions & speech (~2 mins)...
          </p>
        ) : null}

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      </form>

      {interviewResult ? (
        <InterviewResults
          interviewData={interviewResult}
          initialResumeMatchScore={resolvedResumeMatchScore}
        />
      ) : null}
    </section>
  );
}
