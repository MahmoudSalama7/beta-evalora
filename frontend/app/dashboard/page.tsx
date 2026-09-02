"use client";

import Link from "next/link";


import { PlusCircle, Users, Video, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <div className="p-8 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-950 border border-emerald-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> AI Interview Simulation & Evaluation Platform
          </div>
          <h1 className="text-3xl font-extrabold text-white">Welcome to Evalora Dashboard</h1>
          <p className="text-slate-400 max-w-2xl text-sm leading-relaxed">
            Create AI-grounded technical assessments, automatically ingest job descriptions & PDF grounding materials, send magic interview links, and review audit reports.
          </p>
          <div className="pt-2 flex flex-wrap gap-4">
            <Link
              href="/dashboard/jobs/new"
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" /> Create New Job Position
            </Link>
            <Link
              href="/dashboard/candidates"
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-all border border-slate-700 flex items-center gap-2"
            >
              <Users className="w-4 h-4 text-emerald-400" /> View Candidate Directory
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/30 transition-all group space-y-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
            <PlusCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-100 group-hover:text-emerald-400 transition-colors">1. Job Creation</h3>
            <p className="text-slate-400 text-xs mt-1">Paste plain-text JD and upload PDF reference materials for Qdrant RAG grounding.</p>
          </div>
          <Link href="/dashboard/jobs/new" className="inline-flex items-center text-xs font-semibold text-emerald-400 hover:underline gap-1">
            Create Job <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/30 transition-all group space-y-4">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400 border border-teal-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-100 group-hover:text-teal-400 transition-colors">2. Magic Link Dispatch</h3>
            <p className="text-slate-400 text-xs mt-1">Filter candidates by match score and generate unique single-use interview links.</p>
          </div>
          <Link href="/dashboard/candidates" className="inline-flex items-center text-xs font-semibold text-teal-400 hover:underline gap-1">
            Manage Candidates <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/30 transition-all group space-y-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-100 group-hover:text-cyan-400 transition-colors">3. Interview Reports</h3>
            <p className="text-slate-400 text-xs mt-1">Audit complete turn-by-turn video, interactive transcript seeking, and HR scorecards.</p>
          </div>
          <Link href="/dashboard/interviews/demo/report" className="inline-flex items-center text-xs font-semibold text-cyan-400 hover:underline gap-1">
            View Audit Report <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
