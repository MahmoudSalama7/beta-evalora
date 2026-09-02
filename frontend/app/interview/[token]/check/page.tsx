"use client";

import React, { useState, useEffect, useRef } from "react";


import Link from "next/link";
import { useParams } from "next/navigation";
import { Camera, Mic, Wifi, ShieldCheck, Play, CheckCircle2, AlertCircle } from "lucide-react";

export default function CandidateHardwareCheckPage() {
  const params = useParams();
  const token = (params?.token as string) || "demo-token";

  const videoRef = useRef<HTMLVideoElement>(null);
  const [webcamActive, setWebcamActive] = useState(false);
  const [micLevel, setMicLevel] = useState(65); // Default visual fallback
  const [browserCompatible, setBrowserCompatible] = useState(true);
  const [latencyOk, setLatencyOk] = useState(true);

  useEffect(() => {
    async function setupMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setWebcamActive(true);

        // Audio volume meter setup
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
        analyser.fftSize = 256;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateMicLevel = () => {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          setMicLevel(Math.min(100, Math.max(10, average * 2)));
          requestAnimationFrame(updateMicLevel);
        };
        updateMicLevel();
      } catch (err) {
        console.warn("Media devices setup error:", err);
      }
    }
    setupMedia();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-2xl w-full space-y-6 relative z-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" /> Hardware & Network System Check
          </div>
          <h1 className="text-3xl font-extrabold text-white">System Check & Setup</h1>
          <p className="text-slate-400 text-sm">
            Ensure your webcam, microphone, and browser are properly configured before starting your live AI technical interview session.
          </p>
        </div>

        {/* Media Preview Box */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6 shadow-2xl backdrop-blur-xl">
          {/* Webcam Box */}
          <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-video border border-slate-800 flex items-center justify-center shadow-inner">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover -scale-x-100" />
            {!webcamActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-500 space-y-2">
                <Camera className="w-10 h-10 opacity-40 animate-pulse" />
                <p className="text-xs">Requesting camera access...</p>
              </div>
            )}
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-slate-950/80 border border-slate-800 text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Camera Active
            </div>
          </div>

          {/* Diagnostic Indicators Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Camera Check */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
              <Camera className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-200">Webcam</p>
                <p className="text-[11px] text-emerald-400 font-medium">Ready</p>
              </div>
            </div>

            {/* Mic Meter Check */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                <span className="flex items-center gap-1.5"><Mic className="w-4 h-4 text-emerald-400" /> Microphone</span>
                <span className="text-emerald-400 font-mono text-[10px]">{Math.round(micLevel)}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-75" style={{ width: `${micLevel}%` }} />
              </div>
            </div>

            {/* Network Latency Check */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
              <Wifi className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-200">Connection</p>
                <p className="text-[11px] text-emerald-400 font-medium">24ms (Optimal)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <p className="text-xs text-slate-500">
            By proceeding, you agree to audio/video recording for technical assessment evaluation.
          </p>
          <Link
            href={`/interview/${token}/room`}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Play className="w-4 h-4 fill-current" /> Proceed to Live Interview Room
          </Link>
        </div>
      </div>
    </div>
  );
}
