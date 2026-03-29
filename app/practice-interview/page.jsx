"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ChevronRight, ChevronDown, Upload, FileText, Sparkles, Clock, Mic, Video, CheckCircle2, AlertCircle, RotateCcw, Download, BarChart3, ArrowRight, Eye } from "lucide-react";

const RadarChart = dynamic(() => import("recharts").then((m) => m.RadarChart), { ssr: false });
const PolarAngleAxis = dynamic(() => import("recharts").then((m) => m.PolarAngleAxis), { ssr: false });
const PolarRadiusAxis = dynamic(() => import("recharts").then((m) => m.PolarRadiusAxis), { ssr: false });
const Radar = dynamic(() => import("recharts").then((m) => m.Radar), { ssr: false });
const PolarGrid = dynamic(() => import("recharts").then((m) => m.PolarGrid), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false });

const STAGES = ["setup", "interview", "analysis", "results"];
const STAGE_LABELS = { setup: "Setup", interview: "Interview", analysis: "Analysis", results: "Results" };
const STAGE_ICONS = { setup: Sparkles, interview: Video, analysis: BarChart3, results: CheckCircle2 };

/* ─── Stepper ───────────────────────────────────────────────── */
function StepIndicator({ currentStage }) {
  const ci = STAGES.indexOf(currentStage);
  return (
    <div className="mb-10">
      <div className="flex items-center justify-center gap-3">
        {STAGES.map((s, i) => {
          const Icon = STAGE_ICONS[s];
          const done = i < ci, active = i === ci;
          return (
            <div key={s} className="flex items-center">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-500 ${
                active ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 scale-105"
                : done ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-gray-100 text-gray-400 border border-gray-200"
              }`}>
                {done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                <span className="hidden sm:inline">{STAGE_LABELS[s]}</span>
              </div>
              {i < STAGES.length - 1 && (
                <div className={`mx-2 h-0.5 w-8 rounded transition-colors duration-500 ${i < ci ? "bg-emerald-300" : "bg-gray-200"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Setup Stage ───────────────────────────────────────────── */
function SetupStage({ onNext, resumeFile, setResumeFile, jdText, setJdText }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const isJdValid = jdText.trim().length >= 50;
  const isResumeSelected = !!resumeFile;

  const handleGenerateQuestions = async () => {
    if (!isJdValid || !isResumeSelected) { setError("Please complete both fields."); return; }
    setError(""); setIsLoading(true);
    try {
      const resumeBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(resumeFile);
      });
      const response = await fetch("/api/interview/generate-questions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_description: jdText, resume_text: resumeBase64 }),
      });
      if (!response.ok) { const d = await response.json(); throw new Error(d.error || "Failed"); }
      const data = await response.json();
      onNext(data.questions || []);
    } catch (err) { setError(err instanceof Error ? err.message : "Unexpected error."); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 mb-4">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">AI-Powered Interview Prep</span>
        </div>
        <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">Prepare Your Interview</h2>
        <p className="mt-3 text-gray-500 max-w-lg mx-auto">Share your target job description and resume. Our AI generates <span className="font-semibold text-gray-700">personalized questions</span> tailored to your role.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* JD */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-bold text-gray-800">
            <FileText className="w-4 h-4 text-indigo-500" /> Job Description <span className="text-red-500">*</span>
          </label>
          <textarea value={jdText} onChange={(e) => setJdText(e.target.value)}
            placeholder="Paste the full job description here..."
            rows={12}
            className="block w-full rounded-2xl border-2 border-gray-200 bg-gray-50/50 px-5 py-4 text-sm focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:outline-none transition-all duration-300 resize-none" />
          <p className={`text-xs font-semibold ${isJdValid ? "text-emerald-600" : "text-amber-500"}`}>
            {isJdValid ? "✓" : "○"} {jdText.length} / 50 characters minimum
          </p>
        </div>
        {/* Resume */}
        <div className="flex flex-col space-y-3">
          <label className="flex items-center gap-2 text-sm font-bold text-gray-800">
            <Upload className="w-4 h-4 text-violet-500" /> Your Resume <span className="text-red-500">*</span>
          </label>
          <div className={`flex-1 rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 cursor-pointer ${
            resumeFile ? "border-emerald-300 bg-emerald-50/50" : "border-gray-300 bg-gray-50/30 hover:border-indigo-300 hover:bg-indigo-50/30"
          }`}>
            <input id="resume-upload" type="file" accept=".pdf,.docx" onChange={(e) => setResumeFile(e.target.files?.[0] || null)} className="hidden" />
            <label htmlFor="resume-upload" className="flex cursor-pointer flex-col items-center gap-3">
              {resumeFile ? (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center"><CheckCircle2 className="w-7 h-7 text-emerald-600" /></div>
                  <p className="text-sm font-bold text-emerald-700">{resumeFile.name}</p>
                  <p className="text-xs text-gray-400">Click to change</p>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center"><Upload className="w-7 h-7 text-gray-400" /></div>
                  <p className="text-sm font-semibold text-gray-600">Drop your resume here</p>
                  <p className="text-xs text-gray-400">PDF or DOCX</p>
                </>
              )}
            </label>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: "💻", title: "Technical Qs", desc: "Based on JD skills" },
          { icon: "🎯", title: "Behavioral Qs", desc: "STAR format" },
          { icon: "🔍", title: "AI Analysis", desc: "8 evaluation metrics" },
        ].map((f) => (
          <div key={f.title} className="premium-card rounded-2xl p-5 text-center">
            <span className="text-2xl">{f.icon}</span>
            <p className="text-sm font-bold text-gray-800 mt-2">{f.title}</p>
            <p className="text-xs text-gray-500 mt-1">{f.desc}</p>
          </div>
        ))}
      </div>

      {error && <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}

      <button onClick={handleGenerateQuestions} disabled={!isJdValid || !isResumeSelected || isLoading}
        className={`w-full rounded-2xl px-6 py-4 text-base font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
          isJdValid && isResumeSelected && !isLoading
            ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-500/25 hover:shadow-2xl hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98]"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
        }`}>
        {isLoading ? (<><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating questions...</>) : (<>Generate Questions & Start <ArrowRight className="w-5 h-5" /></>)}
      </button>
    </div>
  );
}

/* ─── Interview Stage ───────────────────────────────────────── */
function InterviewStage({ onNext, onBack, questions = [] }) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [recordings, setRecordings] = useState({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [permissionError, setPermissionError] = useState("");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const recordingChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationIdRef = useRef(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [canClickNext, setCanClickNext] = useState(false);
  const timerIntervalRef = useRef(null);

  const interviewQuestions = questions.length > 0 ? questions : [
    { id: 1, question: "Tell me about yourself and your experience.", type: "intro", time_limit: 60 },
    { id: 2, question: "What technical skills are most relevant to this role?", type: "technical", time_limit: 90 },
    { id: 3, question: "Walk me through a technical project you are most proud of.", type: "technical", time_limit: 90 },
    { id: 4, question: "Tell me about a time you faced a difficult challenge at work.", type: "behavioral", time_limit: 120 },
    { id: 5, question: "Describe a time you worked in a team to deliver under pressure.", type: "behavioral", time_limit: 120 },
    { id: 6, question: "Do you have any questions for us?", type: "closing", time_limit: 60 },
  ];

  const currentQuestion = interviewQuestions[questionIndex];
  const timeLimit = currentQuestion.time_limit || 60;

  // Cleanup all media resources
  const cleanupMedia = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try { mediaRecorderRef.current.stop(); } catch(e) {}
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch(e) {}
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => { track.stop(); track.enabled = false; });
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => {
    const requestPermissions = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false },
        });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        try {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          audioContextRef.current = audioContext;
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 256;
          const createSource = audioContext.createMediaStreamSource?.bind(audioContext);
          if (createSource) { createSource(stream).connect(analyser); analyserRef.current = analyser; }
        } catch(e) {}
        setIsRecording(true);
      } catch (err) {
        let msg = "Camera and microphone permissions are required.";
        if (err?.name === "NotAllowedError") msg = "You denied camera/mic access. Reload and select 'Allow'.";
        else if (err?.name === "NotFoundError") msg = "No camera or mic detected.";
        else if (err?.name === "NotReadableError") msg = "Camera/mic in use by another app.";
        setPermissionError(msg);
      }
    };
    requestPermissions();
    return cleanupMedia;
  }, [cleanupMedia]);

  useEffect(() => {
    if (!isRecording || !streamRef.current) return;
    recordingChunksRef.current = [];
    setTimeLeft(timeLimit);
    setCanClickNext(false);

    const utterance = new SpeechSynthesisUtterance(currentQuestion.question);
    utterance.rate = 0.9; utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);

    let mimeType = "video/webm";
    if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = "video/webm;codecs=vp9";
    if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = "video/webm;codecs=vp8";
    if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = "";

    const mr = new MediaRecorder(streamRef.current, { mimeType });
    mr.ondataavailable = (e) => { if (e.data.size > 0) recordingChunksRef.current.push(e.data); };
    mr.onstop = () => { setRecordings((p) => ({ ...p, [questionIndex]: new Blob(recordingChunksRef.current, { type: mr.mimeType }) })); };
    mr.start(); mediaRecorderRef.current = mr;

    let elapsed = 0;
    timerIntervalRef.current = setInterval(() => {
      elapsed += 1;
      const rem = Math.max(0, timeLimit - elapsed);
      setTimeLeft(rem);
      if (rem === 0) { clearInterval(timerIntervalRef.current); handleAutoNext(); }
      if (elapsed >= 10) setCanClickNext(true);
    }, 1000);

    visualizeAudio();

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (mr && mr.state !== "inactive") mr.stop();
    };
  }, [questionIndex, isRecording, timeLimit]);

  const visualizeAudio = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current, ctx = canvas.getContext("2d"), analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const draw = () => {
      animationIdRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const barW = canvas.width / dataArray.length;
      let x = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const h = (dataArray[i] / 255) * canvas.height;
        const gradient = ctx.createLinearGradient(0, canvas.height - h, 0, canvas.height);
        gradient.addColorStop(0, `hsl(${250 - (i/dataArray.length)*80}, 80%, 65%)`);
        gradient.addColorStop(1, `hsl(${250 - (i/dataArray.length)*80}, 90%, 45%)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - h, barW - 1, h);
        x += barW;
      }
    };
    draw();
  };

  const handleAutoNext = () => {
    if (mediaRecorderRef.current?.state !== "inactive") try { mediaRecorderRef.current.stop(); } catch(e) {}
    if (questionIndex < interviewQuestions.length - 1) setQuestionIndex(questionIndex + 1);
    else handleFinish();
  };

  const handleManualNext = () => {
    if (mediaRecorderRef.current?.state !== "inactive") try { mediaRecorderRef.current.stop(); } catch(e) {}
    if (questionIndex < interviewQuestions.length - 1) setQuestionIndex(questionIndex + 1);
    else handleFinish();
  };

  const handleFinish = async () => {
    // Clean up media immediately
    cleanupMedia();
    // Transition to analysis stage immediately - don't wait for API
    onNext({ per_question: [], overall: { posture_score: 50, facial_score: 50, fluency_score: 50, sentiment_score: 50, answer_relevance_score: 50, response_score: 50, interview_score: 55, recommendation: "Analyzing...", recommendation_message: "Processing your responses..." } });
    
    // Make API call in background
    try {
      const formData = new FormData();
      Object.entries(recordings).forEach(([qid, blob]) => {
        const i = parseInt(qid);
        formData.append(`recording_${i}`, blob, `question_${i}.webm`);
      });
      formData.append("questions", JSON.stringify(interviewQuestions));
      const response = await fetch("/api/interview/analyze-all", { method: "POST", body: formData });
      if (!response.ok) throw new Error("Failed to analyze interview");
      // Update with real results when they arrive
      const result = await response.json();
      onNext(result);
    } catch (error) {
      console.error("Analysis error:", error);
      onNext({ per_question: [], overall: { posture_score: 0, facial_score: 0, fluency_score: 0, sentiment_score: 0, answer_relevance_score: 0, response_score: 0, interview_score: 0, recommendation: "Error", recommendation_message: "Failed to analyze" } });
    }
  };

  const timerPercent = (timeLeft / timeLimit) * 100;

  if (permissionError) {
    return (
      <div className="text-center space-y-6 py-8 animate-fade-in">
        <div className="w-20 h-20 mx-auto rounded-full bg-red-100 flex items-center justify-center"><AlertCircle className="w-10 h-10 text-red-500" /></div>
        <h3 className="text-xl font-bold text-gray-900">{permissionError}</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto">Camera and microphone access is required for the interview practice.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => { setPermissionError(""); location.reload(); }} className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg">Try Again</button>
          <button onClick={onBack} className="rounded-xl border-2 border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">Go Back</button>
        </div>
      </div>
    );
  }

  const getTypeColor = (type) => {
    const map = { intro: "bg-emerald-100 text-emerald-700 border-emerald-200", technical: "bg-blue-100 text-blue-700 border-blue-200", behavioral: "bg-purple-100 text-purple-700 border-purple-200", closing: "bg-amber-100 text-amber-700 border-amber-200" };
    return map[type] || map.closing;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">Interview in Progress</h2>
          <p className="text-sm text-gray-500 mt-1">Answer clearly — your response is being recorded & analyzed.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 border border-red-200">
          <div className="w-2.5 h-2.5 bg-red-500 rounded-full recording-dot" />
          <span className="text-xs font-bold text-red-700">RECORDING</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* LEFT: Question + Controls */}
        <div className="lg:col-span-2 space-y-4">
          {/* Question Card */}
          <div className="premium-card rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-gray-900 text-white text-xs font-bold">Q{questionIndex + 1}/{interviewQuestions.length}</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getTypeColor(currentQuestion.type)}`}>{currentQuestion.type}</span>
              {currentQuestion.tip && <span className="text-xs text-gray-400 italic">💡 {currentQuestion.tip}</span>}
            </div>
            <h3 className="text-xl font-bold text-gray-900 leading-relaxed">{currentQuestion.question}</h3>
          </div>

          {/* Timer */}
          <div className="premium-card rounded-2xl p-4 space-y-2">
            <div className="flex justify-between text-sm font-bold">
              <span className="text-gray-600 flex items-center gap-1.5"><Clock className="w-4 h-4" />Time Left</span>
              <span className={timerPercent <= 33 ? "text-red-600" : timerPercent <= 66 ? "text-amber-600" : "text-emerald-600"}>{timeLeft}s</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-1000 ${timerPercent <= 33 ? "bg-gradient-to-r from-red-500 to-red-400" : timerPercent <= 66 ? "bg-gradient-to-r from-amber-500 to-amber-400" : "bg-gradient-to-r from-emerald-500 to-emerald-400"}`}
                style={{ width: `${timerPercent}%` }} />
            </div>
          </div>

          {/* Next Button */}
          <button onClick={handleManualNext} disabled={!canClickNext}
            className={`w-full rounded-2xl px-6 py-4 text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
              canClickNext ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]" : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}>
            {!canClickNext && <Clock className="w-4 h-4" />}
            {questionIndex < interviewQuestions.length - 1 ? "Next Question" : "Finish Interview 🎉"}
          </button>

          {/* Question List */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Questions</p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {interviewQuestions.map((q, i) => {
                const done = i < questionIndex, current = i === questionIndex;
                return (
                  <div key={i} className={`text-xs p-3 rounded-xl transition-all duration-300 border ${
                    current ? "bg-gray-900 text-white border-gray-800 shadow-md" : done ? "bg-emerald-50 text-gray-700 border-emerald-200" : "bg-gray-50 text-gray-400 border-gray-100"
                  }`}>
                    <div className="flex items-center gap-2">
                      {done ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : current ? <div className="w-2 h-2 bg-red-400 rounded-full recording-dot" /> : <div className="w-2 h-2 bg-gray-300 rounded-full" />}
                      <span className="font-bold">Q{i + 1}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${current ? "bg-white/20" : done ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-400"}`}>{q.type}</span>
                    </div>
                    {!current && <p className="mt-1 line-clamp-1 opacity-70">{q.question}</p>}
                  </div>
                );
              })}
            </div>
          </div>

          <button onClick={onBack} className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">← Back to Setup</button>
        </div>

        {/* RIGHT: Camera + Audio */}
        <div className="lg:col-span-3 space-y-4">
          <div className="relative rounded-2xl overflow-hidden bg-black shadow-2xl shadow-black/20">
            <video ref={videoRef} autoPlay playsInline muted className="w-full aspect-video bg-black object-cover" />
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 border-3 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
                  <p className="text-white font-semibold">Analyzing your interview...</p>
                </div>
              </div>
            )}
            {!isAnalyzing && (
              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full glass-dark">
                <div className="w-2 h-2 bg-red-500 rounded-full recording-dot" />
                <span className="text-white text-xs font-semibold">REC</span>
              </div>
            )}
          </div>
          <div className="rounded-2xl overflow-hidden shadow-lg">
            <canvas ref={canvasRef} width={600} height={80} className="w-full h-20 rounded-2xl" />
          </div>
          <div className="premium-card rounded-2xl p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <Mic className="w-4 h-4 text-indigo-500" />
              <p className="text-sm font-semibold text-gray-700">AI is listening — speak clearly</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const ANALYSIS_STAGES = ["Processing Audio", "Analyzing Expressions", "Evaluating Fluency", "Assessing Posture", "Calculating Sentiment", "Measuring Relevance", "Creating Report"];

/* ─── Analysis Stage ────────────────────────────────────────── */
function AnalysisStage({ onComplete, analysisResults }) {
  const [progress, setProgress] = useState(0);
  const [label, setLabel] = useState("Initializing...");
  const [isRealDataReady, setIsRealDataReady] = useState(false);

  useEffect(() => {
    // Check if we have real analysis data (not just fallback)
    if (analysisResults?.overall?.recommendation && analysisResults.overall.recommendation !== "Analyzing..." && analysisResults.overall.recommendation !== "Error") {
      setIsRealDataReady(true);
    }
  }, [analysisResults]);

  const startRef = useRef(Date.now());

  useEffect(() => {
    const total = 18000;
    const iv = setInterval(() => {
      const p = Math.min(((Date.now() - startRef.current) / total) * 100, 100);
      setProgress(p);
      setLabel(ANALYSIS_STAGES[Math.min(Math.floor((p / 100) * ANALYSIS_STAGES.length), ANALYSIS_STAGES.length - 1)]);
      if (p >= 100 && isRealDataReady) { 
        clearInterval(iv); 
        setTimeout(() => onComplete?.(), 400); 
      }
    }, 150);
    return () => clearInterval(iv);
  }, [isRealDataReady, onComplete]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] space-y-10 py-12 animate-fade-in">
      <div className="relative w-32 h-32">
        <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="6" />
          <circle cx="50" cy="50" r="45" fill="none" stroke="url(#grad)" strokeWidth="6" strokeLinecap="round" strokeDasharray="283" strokeDashoffset={283 - (283 * progress) / 100} className="transition-all duration-300" />
          <defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor="#8b5cf6" /></linearGradient></defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-extrabold text-gray-900">{Math.round(progress)}%</span>
        </div>
      </div>
      <div className="text-center space-y-3 max-w-sm">
        <h2 className="text-3xl font-extrabold text-gray-900">Analyzing Interview</h2>
        <p className="text-gray-500">Evaluating your responses across multiple dimensions</p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100">
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
          <span className="text-sm font-semibold text-indigo-700">{label}</span>
        </div>
      </div>
      {progress >= 100 && (isRealDataReady ? (
        <div className="animate-pulse">
          <p className="text-sm font-semibold text-indigo-600">✓ Processing complete! Redirecting...</p>
        </div>
      ) : (
        <button onClick={() => onComplete?.()} className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-indigo-500/25 hover:scale-[1.02] transition-all flex items-center gap-2">
          <Eye className="w-5 h-5" /> View Results
        </button>
      ))}
    </div>
  );
}

/* ─── Results Stage ─────────────────────────────────────────── */
function ResultsStage({ onRestart, analysisResults, jdText }) {
  const [expanded, setExpanded] = useState({});
  const r = analysisResults || { per_question: [], overall: { posture_score: 50, facial_score: 50, fluency_score: 50, sentiment_score: 50, answer_relevance_score: 50, response_score: 50, interview_score: 55, recommendation: "Pending", recommendation_message: "Results being calculated." } };
  const { per_question, overall } = r;

  const scoreColor = (s) => s >= 80 ? "text-emerald-600" : s >= 70 ? "text-blue-600" : s >= 60 ? "text-amber-600" : "text-red-600";
  const scoreBg = (s) => s >= 80 ? "from-emerald-500 to-emerald-400" : s >= 70 ? "from-blue-500 to-blue-400" : s >= 60 ? "from-amber-500 to-amber-400" : "from-red-500 to-red-400";
  const typeColor = (t) => ({ intro: "bg-emerald-100 text-emerald-700", technical: "bg-blue-100 text-blue-700", behavioral: "bg-purple-100 text-purple-700", closing: "bg-amber-100 text-amber-700" }[t] || "bg-gray-100 text-gray-700");

  const radarData = [
    { subject: "Posture", value: overall?.posture_score ?? 50, fullMark: 100 },
    { subject: "Expression", value: overall?.facial_score ?? 50, fullMark: 100 },
    { subject: "Fluency", value: overall?.fluency_score ?? 50, fullMark: 100 },
    { subject: "Sentiment", value: overall?.sentiment_score ?? 50, fullMark: 100 },
    { subject: "Relevance", value: overall?.answer_relevance_score ?? 50, fullMark: 100 },
  ];

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify({ timestamp: new Date().toISOString(), overall, per_question }, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `interview-report-${Date.now()}.json`; a.click();
  };

  const score = overall?.interview_score ?? 55;

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      {/* Hero Score */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Interview Complete</span>
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900">Your Performance Report</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Score Card */}
        <div className="rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="relative">
            <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Overall Score</p>
            <p className="text-7xl font-black">{score}<span className="text-2xl font-normal text-gray-500">/100</span></p>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden mt-6">
              <div className={`h-full rounded-full bg-gradient-to-r ${scoreBg(score)}`} style={{ width: `${score}%` }} />
            </div>
            <div className="mt-6 px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-center">
              <p className="font-bold text-lg">{overall?.recommendation ?? "Pending"}</p>
              <p className="text-xs text-gray-300 mt-1">{overall?.recommendation_message ?? ""}</p>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="premium-card rounded-3xl p-8 space-y-5">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Performance Breakdown</h3>
          {[
            { label: "Posture & Presence", value: overall?.posture_score ?? 50, icon: "🧍" },
            { label: "Facial Expression", value: overall?.facial_score ?? 50, icon: "😊" },
            { label: "Speech Fluency", value: overall?.fluency_score ?? 50, icon: "🗣️" },
            { label: "Sentiment & Tone", value: overall?.sentiment_score ?? 50, icon: "💭" },
            { label: "Answer Relevance", value: overall?.answer_relevance_score ?? 50, icon: "🎯" },
          ].map((m, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-lg w-8">{m.icon}</span>
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{m.label}</span>
                  <span className={`font-bold ${scoreColor(m.value)}`}>{m.value}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full bg-gradient-to-r ${scoreBg(m.value)} transition-all duration-1000`} style={{ width: `${m.value}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Radar */}
      <div className="premium-card rounded-3xl p-8">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Performance Radar</h2>
        <div className="flex justify-center min-h-96">
          <RadarChart width={500} height={400} data={radarData}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: "#6b7280", fontSize: 13, fontWeight: 600 }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#d1d5db", fontSize: 11 }} />
            <Radar name="Your Score" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.35} strokeWidth={3} />
            <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }} />
          </RadarChart>
        </div>
      </div>

      {/* Per-Question */}
      {per_question?.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-extrabold text-gray-900">Question-by-Question</h2>
          {per_question.map((res, i) => (
            <div key={i} className={`premium-card rounded-2xl overflow-hidden transition-all duration-300 ${expanded[i] ? "shadow-lg" : ""}`}>
              <button onClick={() => setExpanded(p => ({ ...p, [i]: !p[i] }))}
                className="w-full px-6 py-5 flex items-center justify-between gap-4 hover:bg-gray-50/50 transition">
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="px-2.5 py-1 rounded-lg bg-gray-900 text-white text-xs font-bold">Q{i + 1}</span>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${typeColor(res.question_type)}`}>{res.question_type}</span>
                    <span className={`ml-auto text-2xl font-extrabold ${scoreColor(res.response_score)}`}>{res.response_score}%</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800 line-clamp-1">{res.question}</p>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform shrink-0 ${expanded[i] ? "rotate-180" : ""}`} />
              </button>
              {expanded[i] && (
                <div className="border-t border-gray-100 px-6 py-6 space-y-5 bg-gray-50/30">
                  <div className="grid grid-cols-5 gap-3">
                    {[
                      { k: "posture_score", l: "Posture", ic: "🧍" },
                      { k: "facial_score", l: "Expression", ic: "😊" },
                      { k: "fluency_score", l: "Fluency", ic: "🗣️" },
                      { k: "sentiment_score", l: "Sentiment", ic: "💭" },
                      { k: "answer_relevance_score", l: "Relevance", ic: "🎯" },
                    ].map((m) => (
                      <div key={m.k} className="metric-card text-center bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <span className="text-xl">{m.ic}</span>
                        <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">{m.l}</p>
                        <p className={`text-2xl font-extrabold mt-1 ${scoreColor(res[m.k])}`}>{res[m.k]}</p>
                      </div>
                    ))}
                  </div>
                  {res.transcript && (
                    <div className="rounded-xl bg-blue-50/50 border border-blue-100 p-5">
                      <p className="text-xs font-bold text-blue-700 uppercase mb-2">🎤 Your Response</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{res.transcript}</p>
                    </div>
                  )}
                  {res.feedback && (
                    <div className="rounded-xl bg-emerald-50/50 border border-emerald-100 p-5">
                      <p className="text-xs font-bold text-emerald-700 uppercase mb-2">💡 AI Feedback</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{res.feedback}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="grid md:grid-cols-3 gap-4 pt-4">
        <button onClick={handleDownload} className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 font-bold text-white text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
          <Download className="w-5 h-5" /> Download Report
        </button>
        <button onClick={onRestart} className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 font-bold text-white text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
          <RotateCcw className="w-5 h-5" /> Practice Again
        </button>
        <a href="/dashboard" className="flex items-center justify-center gap-2 rounded-2xl border-2 border-gray-200 px-6 py-4 font-bold text-gray-800 text-sm hover:bg-gray-50 hover:scale-[1.02] active:scale-[0.98] transition-all">
          <BarChart3 className="w-5 h-5" /> Dashboard
        </a>
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────── */
export default function PracticeInterviewPage() {
  const [stage, setStage] = useState("setup");
  const [resumeFile, setResumeFile] = useState(null);
  const [jdText, setJdText] = useState("");
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [analysisResults, setAnalysisResults] = useState(null);

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 min-h-screen">
        <div className={`mx-auto px-6 ${stage === "interview" ? "max-w-6xl" : stage === "results" ? "max-w-5xl" : "max-w-3xl"} transition-all duration-500`}>
          <StepIndicator currentStage={stage} />
          <div className="rounded-3xl border border-gray-200/60 bg-white/90 backdrop-blur-sm p-8 shadow-xl shadow-black/[0.03]">
            {stage === "setup" && <SetupStage onNext={(q) => { setGeneratedQuestions(q || []); setStage("interview"); }} resumeFile={resumeFile} setResumeFile={setResumeFile} jdText={jdText} setJdText={setJdText} />}
            {stage === "interview" && <InterviewStage onNext={(d) => { setAnalysisResults(d); setStage("analysis"); }} onBack={() => setStage("setup")} questions={generatedQuestions} />}
            {stage === "analysis" && <AnalysisStage onComplete={() => setStage("results")} analysisResults={analysisResults} />}
            {stage === "results" && <ResultsStage onRestart={() => { setStage("setup"); setResumeFile(null); setJdText(""); setAnalysisResults(null); }} analysisResults={analysisResults} jdText={jdText} />}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
