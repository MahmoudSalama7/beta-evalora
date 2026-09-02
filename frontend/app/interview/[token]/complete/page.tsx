"use client";

import React from "react";


import { CheckCircle2, ShieldCheck, HeartHandshake, ArrowRight } from "lucide-react";

export default function CandidateCompletionPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-md w-full text-center space-y-6 relative z-10">
        {/* Animated Checkmark Circle */}
        <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-2xl shadow-emerald-500/20 animate-bounce">
          <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
        </div>

        {/* Header Text */}
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-white">Interview Completed!</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Thank you for participating in the technical assessment. Your responses have been successfully recorded and submitted to the hiring team.
          </p>
        </div>

        {/* Confirmation Card */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-2xl backdrop-blur-xl text-left">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-slate-200">Submission Recorded</p>
              <p className="text-[11px] text-slate-400">Confirmation Token ID: eval-sub-9823-ok</p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-400">
            <p className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Hiring team notified via HR portal.
            </p>
            <p className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Next steps will be communicated via email.
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          You may now safely close this browser window.
        </p>
      </div>
    </div>
  );
}
