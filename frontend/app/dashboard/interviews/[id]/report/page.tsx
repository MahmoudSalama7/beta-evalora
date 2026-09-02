"use client";

import React, { useState, useRef } from "react";


import {
  Award,
  Video,
  Play,
  Pause,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BarChart2,
  ThumbsUp,
  ThumbsDown,
  ShieldCheck,
  RotateCcw
} from "lucide-react";

interface TranscriptItem {
  turnIndex: number;
  question: string;
  answer: string;
  timestamp: number; // in seconds
  technicalScore: number;
  clarityScore: number;
}

const mockTranscript: TranscriptItem[] = [
  {
    turnIndex: 0,
    question: "Can you explain your hands-on experience using Python and FastAPI in production environments?",
    answer: "I have over 4 years of experience building asynchronous APIs with FastAPI and SQLAlchemy 2.0. I implemented dependency injection, custom OAuth2 middleware, and integrated background tasks with Celery and Redis for real-time data ingestion.",
    timestamp: 12,
    technicalScore: 9.2,
    clarityScore: 9.0,
  },
  {
    turnIndex: 1,
    question: "Regarding database performance, how do you approach optimizing high-concurrency PostgreSQL queries and AsyncIO connections?",
    answer: "I utilize connection pooling via AsyncAdapt with pool pre-pinging, index composite columns for frequent lookup queries, and use EXPLAIN ANALYZE to identify sequential scans. In vector search workloads, I enforce strict metadata payload filters.",
    timestamp: 48,
    technicalScore: 8.8,
    clarityScore: 8.5,
  },
  {
    turnIndex: 2,
    question: "How would you design a high-availability RAG backend pipeline using Qdrant vector database?",
    answer: "I would set up AsyncQdrantClient with payload indexes on job_id for multi-tenant isolation, chunk documents semantically with overlap, generate dense embeddings using sentence-transformers, and apply cosine distance thresholding.",
    timestamp: 95,
    technicalScore: 9.0,
    clarityScore: 8.7,
  }
];

export default function InterviewReportPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(12);
  const [activeTurn, setActiveTurn] = useState<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const seekTo = (seconds: number, turnIdx: number) => {
    setCurrentTime(seconds);
    setActiveTurn(turnIdx);
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Top Header Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-950 to-emerald-950/40 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-100">Alex Rivera</h1>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-extrabold flex items-center gap-1">
              <Award className="w-3.5 h-3.5" /> AI Recommendation: Strong Hire
            </span>
          </div>
          <p className="text-xs text-slate-400">Position: Senior Full-Stack Engineer • Assessment Date: Sept 2, 2026</p>
        </div>

        {/* Overall Metric Score Badge */}
        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6">
          <div className="text-center">
            <p className="text-xs font-semibold text-slate-400">Overall Rating</p>
            <p className="text-3xl font-extrabold text-emerald-400">89<span className="text-sm font-normal text-slate-500">/100</span></p>
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-slate-400">Technical Score</p>
            <p className="text-2xl font-extrabold text-slate-200">9.0<span className="text-xs font-normal text-slate-500">/10</span></p>
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-slate-400">Communication</p>
            <p className="text-2xl font-extrabold text-teal-400">8.7<span className="text-xs font-normal text-slate-500">/10</span></p>
          </div>
        </div>
      </div>

      {/* 3-Panel Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel: Video Player with Timeline Markers (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-xl">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-2">
              <Video className="w-4 h-4 text-emerald-400" /> Recorded Session Video
            </h2>

            {/* Video Player Box */}
            <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-video border border-slate-800 group">
              <video
                ref={videoRef}
                poster="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop"
                className="w-full h-full object-cover"
                onTimeUpdate={() => {
                  if (videoRef.current) setCurrentTime(Math.floor(videoRef.current.currentTime));
                }}
              />

              {/* Play Overlay */}
              <button
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500/90 text-slate-950 flex items-center justify-center shadow-lg">
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                </div>
              </button>

              <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-slate-950/80 text-[10px] font-mono text-slate-300">
                00:{currentTime < 10 ? `0${currentTime}` : currentTime} / 02:30
              </div>
            </div>

            {/* Timestamp Markers */}
            <div className="space-y-2 pt-2">
              <p className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-400" /> Timeline Seek Markers:
              </p>
              <div className="space-y-1.5">
                {mockTranscript.map((item) => (
                  <button
                    key={item.turnIndex}
                    onClick={() => seekTo(item.timestamp, item.turnIndex)}
                    className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                      activeTurn === item.turnIndex
                        ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <span className="font-semibold truncate max-w-[180px]">Q{item.turnIndex + 1}: {item.question}</span>
                    <span className="font-mono text-[10px] text-slate-500 shrink-0">00:{item.timestamp}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Proctoring Event Badge */}
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" /> Proctoring Status: Clean (0 Suspicious Events)
            </div>
          </div>
        </div>

        {/* Middle Panel: Interactive Transcript (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 h-full flex flex-col shadow-xl">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-2">
              <Sparkles className="w-4 h-4 text-emerald-400" /> Interactive Transcript
            </h2>

            <div className="space-y-4 overflow-y-auto flex-1 pr-1 max-h-[500px]">
              {mockTranscript.map((t) => {
                const isActive = activeTurn === t.turnIndex;
                return (
                  <div
                    key={t.turnIndex}
                    onClick={() => seekTo(t.timestamp, t.turnIndex)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                      isActive
                        ? "bg-slate-800/90 border-emerald-500/50 shadow-lg shadow-emerald-500/5"
                        : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-400">Turn #{t.turnIndex + 1}</span>
                      <span className="font-mono text-[10px] text-slate-500">Seek 00:{t.timestamp}</span>
                    </div>

                    <p className="text-xs font-semibold text-slate-200">Q: {t.question}</p>
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                      &quot;{t.answer}&quot;
                    </p>

                    <div className="flex items-center gap-3 text-[11px] pt-1">
                      <span className="text-emerald-400 font-semibold">Tech: {t.technicalScore}/10</span>
                      <span className="text-teal-400 font-semibold">Clarity: {t.clarityScore}/10</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Panel: Scorecard Breakdown & LLM Key Strengths (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-2">
              <BarChart2 className="w-4 h-4 text-emerald-400" /> Evaluation Scorecard
            </h2>

            {/* Score Metrics */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                  <span>Technical Competency</span>
                  <span className="text-emerald-400">92%</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[92%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                  <span>Communication & Clarity</span>
                  <span className="text-teal-400">87%</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 w-[87%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                  <span>Confidence & Delivery</span>
                  <span className="text-cyan-400">89%</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 w-[89%]" />
                </div>
              </div>
            </div>

            {/* LLM Key Strengths & Omissions */}
            <div className="space-y-3 pt-2">
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 space-y-1.5">
                <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <ThumbsUp className="w-3.5 h-3.5" /> Key Technical Strengths:
                </p>
                <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                  <li>Deep knowledge of AsyncIO and FastAPI dependency injection</li>
                  <li>Clear multi-tenant Qdrant vector payload indexing approach</li>
                  <li>Proactive query optimization using EXPLAIN ANALYZE</li>
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/20 space-y-1.5">
                <p className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                  <ThumbsDown className="w-3.5 h-3.5" /> Omissions & Missing Knowledge:
                </p>
                <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                  <li>Could elaborate on Kubernetes horizontal pod autoscaling</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
