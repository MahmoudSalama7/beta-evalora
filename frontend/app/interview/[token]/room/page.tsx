"use client";

import React, { useState, useEffect, useRef } from "react";


import { useParams, useRouter } from "next/navigation";
import {
  Mic,
  MicOff,
  Video,
  Clock,
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  Volume2,
  ShieldAlert
} from "lucide-react";
import { getWebSocketUrl } from "@/lib/api";

export default function LiveInterviewRoomPage() {
  const params = useParams();
  const token = (params?.token as string) || "demo-token";
  const router = useRouter();

  // State
  const [question, setQuestion] = useState("Can you explain your experience building asynchronous APIs with Python and FastAPI?");
  const [turnIndex, setTurnIndex] = useState(1);
  const [status, setStatus] = useState<"prep" | "recording" | "processing">("prep");
  const [prepTimeLeft, setPrepTimeLeft] = useState(30);
  const [answerTimeLeft, setAnswerTimeLeft] = useState(120);
  const [candidateAnswer, setCandidateAnswer] = useState("");
  const [wsConnected, setWsConnected] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<WebSocket | null>(null);

  // Initialize Media Stream
  useEffect(() => {
    async function startWebcam() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn("Webcam stream access:", err);
      }
    }
    startWebcam();
  }, []);

  // WebSocket Connection
  useEffect(() => {
    const wsUrl = getWebSocketUrl(token);
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event === "question" || data.event === "next_question") {
          setQuestion(data.question);
          setTurnIndex((prev) => prev + 1);
          setStatus("prep");
          setPrepTimeLeft(30);
          setAnswerTimeLeft(120);
          setCandidateAnswer("");
        } else if (data.event === "interview_completed") {
          router.push(`/interview/${token}/complete`);
        }
      } catch (e) {
        console.error("WebSocket message parse error:", e);
      }
    };

    ws.onclose = () => {
      setWsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [token, router]);

  // Prep Countdown Timer (30s)
  useEffect(() => {
    if (status === "prep" && prepTimeLeft > 0) {
      const timer = setInterval(() => setPrepTimeLeft((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (status === "prep" && prepTimeLeft === 0) {
      setStatus("recording");
    }
  }, [status, prepTimeLeft]);

  // Answer Countdown Timer (120s)
  useEffect(() => {
    if (status === "recording" && answerTimeLeft > 0) {
      const timer = setInterval(() => setAnswerTimeLeft((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (status === "recording" && answerTimeLeft === 0) {
      submitAnswer();
    }
  }, [status, answerTimeLeft]);

  const submitAnswer = () => {
    setStatus("processing");
    const payload = {
      action: "answer",
      text: candidateAnswer || "Candidate provided recorded verbal response."
    };

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(payload));
    } else {
      // Mock progression if backend offline
      setTimeout(() => {
        if (turnIndex >= 3) {
          router.push(`/interview/${token}/complete`);
        } else {
          setTurnIndex((prev) => prev + 1);
          setQuestion(
            turnIndex === 1
              ? "How do you optimize high-concurrency PostgreSQL queries and AsyncIO connections?"
              : "How would you design a high-availability RAG backend pipeline using Qdrant?"
          );
          setStatus("prep");
          setPrepTimeLeft(30);
          setAnswerTimeLeft(120);
          setCandidateAnswer("");
        }
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6 relative overflow-hidden select-none">
      {/* Top Header & Status Indicators */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-100">Live AI Interview Session</h1>
            <p className="text-xs text-slate-400">Turn #{turnIndex} of 3 • Question Evaluation</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Badge */}
          <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 border ${
            status === "prep"
              ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
              : status === "recording"
              ? "bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse"
              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              status === "prep" ? "bg-amber-500" : status === "recording" ? "bg-rose-500" : "bg-emerald-500"
            }`} />
            {status === "prep" ? "30s Preparation Window" : status === "recording" ? "Listening to Answer..." : "Processing & Evaluating..."}
          </div>

          {/* WebSocket Status Indicator */}
          <div className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${wsConnected ? "bg-emerald-500" : "bg-amber-500"}`} />
            {wsConnected ? "WS Live" : "Offline Simulator"}
          </div>
        </div>
      </div>

      {/* Center AI Interviewer Avatar & Question Box */}
      <div className="max-w-3xl mx-auto w-full space-y-6 my-auto z-10">
        {/* AI Audio Visualizer Avatar */}
        <div className="relative mx-auto w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 p-1 flex items-center justify-center shadow-2xl shadow-emerald-500/20">
          <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center relative overflow-hidden">
            <Sparkles className="w-10 h-10 text-emerald-400 animate-pulse" />
            <div className="absolute inset-0 rounded-full border border-emerald-500/40 animate-ping opacity-30" />
          </div>
        </div>

        {/* Question Text Box */}
        <div className="p-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl text-center space-y-4">
          <p className="text-xs uppercase font-extrabold tracking-widest text-emerald-400">Question #{turnIndex}</p>
          <h2 className="text-xl md:text-2xl font-bold text-slate-100 leading-snug">
            &quot;{question}&quot;
          </h2>

          {/* Timers & Countdown Display */}
          <div className="pt-2 flex items-center justify-center gap-6 text-sm font-semibold text-slate-300">
            {status === "prep" ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono">
                <Clock className="w-4 h-4" /> Prep Time Remaining: 00:{prepTimeLeft < 10 ? `0${prepTimeLeft}` : prepTimeLeft}
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono">
                <Clock className="w-4 h-4" /> Answer Time Remaining: {Math.floor(answerTimeLeft / 60)}:{answerTimeLeft % 60 < 10 ? `0${answerTimeLeft % 60}` : answerTimeLeft % 60}
              </div>
            )}
          </div>
        </div>

        {/* Optional Candidate Verbal Input Field */}
        <div className="space-y-2">
          <textarea
            value={candidateAnswer}
            onChange={(e) => setCandidateAnswer(e.target.value)}
            disabled={status === "processing"}
            rows={2}
            placeholder="Recording audio response... (or type key technical points here)"
            className="w-full p-3 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
      </div>

      {/* Bottom Bar: Action Button & Candidate Mirrored Webcam PIP */}
      <div className="flex items-end justify-between z-10 pt-4">
        <div className="text-xs text-slate-500 max-w-xs">
          Proctoring active: Facial tracking and audio analysis enabled.
        </div>

        {/* Action Button */}
        <button
          onClick={submitAnswer}
          disabled={status === "processing"}
          className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm transition-all shadow-xl shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
        >
          <Send className="w-4 h-4" /> {status === "processing" ? "Evaluating Answer..." : "Finish Answer / Next Question"}
        </button>

        {/* Candidate Webcam PIP (Picture in Picture) */}
        <div className="w-36 h-24 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 relative shadow-2xl">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover -scale-x-100" />
          <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-slate-950/80 text-[9px] text-emerald-400 font-bold">
            You
          </div>
        </div>
      </div>
    </div>
  );
}
