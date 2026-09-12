"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Award,
  ShieldAlert,
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  FileDown,
  UserCheck,
  UserX,
  Clock,
  ChevronDown,
  ChevronUp,
  Brain,
  Video,
  AlertTriangle,
  FileCode,
  Volume2
} from "lucide-react";
import { getCandidateAIReport, CandidateReportData, CandidateReportTurn } from "@/lib/api";

export default function CandidateAIReportPage() {
  const params = useParams();
  const jobId = params.id as string;
  const candidateId = params.candidateId as string;

  const [report, setReport] = useState<CandidateReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTurnIdx, setActiveTurnIdx] = useState<number>(0);
  const [expandedTurns, setExpandedTurns] = useState<number[]>([0]);
  const [recruiterStatus, setRecruiterStatus] = useState<"pending" | "shortlisted" | "rejected">("pending");

  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    async function loadReport() {
      try {
        const data = await getCandidateAIReport(jobId, candidateId);
        setReport(data);
      } catch (err) {
        console.error("Failed to load candidate AI report:", err);
      } finally {
        setLoading(false);
      }
    }
    if (jobId && candidateId) loadReport();
  }, [jobId, candidateId]);

  const handleJumpToTimestamp = (seconds: number, turnIdx: number) => {
    setActiveTurnIdx(turnIdx);
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play().catch(() => {});
    }
  };

  const toggleTurnExpand = (turnIdx: number) => {
    if (expandedTurns.includes(turnIdx)) {
      setExpandedTurns(expandedTurns.filter((i) => i !== turnIdx));
    } else {
      setExpandedTurns([...expandedTurns, turnIdx]);
    }
  };

  const getRecommendationBadge = (rec: string) => {
    switch (rec) {
      case "Strong Hire":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-emerald-500/10";
      case "Hire":
        return "bg-teal-500/20 text-teal-300 border-teal-500/40 shadow-teal-500/10";
      case "Needs Review":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-amber-500/10";
      default:
        return "bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-rose-500/10";
    }
  };

  const formatTimestamp = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium">Generating Candidate AI Evaluation Report...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-8 text-center text-white">
        <h2 className="text-xl font-bold">Report Not Found</h2>
        <Link href={`/dashboard/jobs/${jobId}`} className="text-indigo-400 hover:underline text-sm mt-2 inline-block">
          Return to Pipeline
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Back Button */}
      <div>
        <Link
          href={`/dashboard/jobs/${jobId}`}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors font-medium mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Applicants Pipeline
        </Link>
      </div>

      {/* Executive Header */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {report.job_title}
              </span>
              <span className="text-xs text-slate-400 font-medium">{report.candidate_email}</span>
            </div>

            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              {report.candidate_name}
            </h1>
          </div>

          {/* AI Decision & Rating Badges */}
          <div className="flex items-center gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
              <div className="text-xs text-slate-400 font-medium">Overall AI Rating</div>
              <div className="text-3xl font-extrabold text-white tracking-tight flex items-center justify-center gap-1">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                {report.overall_score}
                <span className="text-xs text-slate-500">/100</span>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
              <div className="text-xs text-slate-400 font-medium mb-1">AI Recommendation</div>
              <div className={`px-4 py-1.5 rounded-full text-xs font-extrabold border shadow-lg ${getRecommendationBadge(report.recommendation)}`}>
                {report.recommendation}
              </div>
            </div>
          </div>
        </div>

        {/* Recruiter Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setRecruiterStatus("shortlisted")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                recruiterStatus === "shortlisted"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
              }`}
            >
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Shortlist Candidate</span>
            </button>

            <button
              onClick={() => setRecruiterStatus("rejected")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                recruiterStatus === "rejected"
                  ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
              }`}
            >
              <UserX className="w-4 h-4 text-rose-400" />
              <span>Reject</span>
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
          >
            <FileDown className="w-4 h-4 text-indigo-400" />
            <span>Export Report PDF</span>
          </button>
        </div>
      </div>

      {/* Domain Radar & Proctoring Alert Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {/* Technical Accuracy */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Technical Accuracy</span>
            <Brain className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-white mt-2">{report.technical_score}%</div>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div style={{ width: `${report.technical_score}%` }} className="bg-indigo-500 h-full" />
          </div>
        </div>

        {/* Communication Clarity */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Communication Clarity</span>
            <Volume2 className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-2xl font-extrabold text-white mt-2">{report.communication_score}%</div>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div style={{ width: `${report.communication_score}%` }} className="bg-violet-500 h-full" />
          </div>
        </div>

        {/* Confidence Rating */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Confidence Rating</span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white mt-2">{report.confidence_score}%</div>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div style={{ width: `${report.confidence_score}%` }} className="bg-emerald-500 h-full" />
          </div>
        </div>

        {/* Proctoring Flags */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Proctoring Security</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 space-y-1 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span>Tab Switches:</span>
              <span className={`font-bold ${report.tab_switch_count > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                {report.tab_switch_count}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>Gaze Deviation:</span>
              <span className={`font-bold ${report.gaze_warnings > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                {report.gaze_warnings} warnings
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Synced Player & Interactive Transcript View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Media Player */}
        <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
              <Video className="w-4 h-4 text-indigo-400" />
              <span>Interview Session Recording</span>
            </div>
            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-mono">
              HD WebM / Audio
            </span>
          </div>

          <div className="relative bg-slate-950 rounded-xl overflow-hidden aspect-video border border-slate-800/80 flex items-center justify-center group">
            <video
              ref={videoRef}
              src={report.recording_url || undefined}
              controls
              className="w-full h-full object-cover rounded-xl"
              poster="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80"
            />
          </div>

          <div className="text-xs text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800/60 leading-relaxed">
            💡 <strong className="text-slate-200">Interactive Sync:</strong> Click on any question timestamp on the right transcript to jump the video directly to that response turn.
          </div>
        </div>

        {/* Right Column: Clickable Q&A Transcript */}
        <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
              <FileCode className="w-4 h-4 text-violet-400" />
              <span>Timestamped Interview Transcript ({report.turns.length} turns)</span>
            </div>
          </div>

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-2">
            {report.turns.map((turn, idx) => (
              <div
                key={idx}
                onClick={() => handleJumpToTimestamp(turn.timestamp_seconds, idx)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  activeTurnIdx === idx
                    ? "bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-500/10"
                    : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-semibold mb-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-600/30 text-indigo-300 px-2 py-0.5 rounded font-mono text-[11px]">
                      Turn #{turn.turn_index + 1}
                    </span>
                    <span className="text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {formatTimestamp(turn.timestamp_seconds)}
                    </span>
                  </div>
                  {turn.turn_score !== null && (
                    <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Score: {turn.turn_score}/10
                    </span>
                  )}
                </div>

                <p className="text-sm font-semibold text-white mb-2">
                  Q: {turn.question}
                </p>

                <p className="text-xs text-slate-300 italic bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 leading-relaxed">
                  &ldquo;{turn.candidate_transcript || "No transcript recorded for this turn."}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Question Audit: Expandable Cards with Qdrant Context */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider">
              Deep-Dive Qdrant Ground-Truth & Rubric Audit
            </h2>
          </div>
        </div>

        <div className="space-y-4">
          {report.turns.map((turn, idx) => {
            const isExpanded = expandedTurns.includes(idx);
            return (
              <div
                key={idx}
                className="bg-slate-950/80 border border-slate-800/80 rounded-xl overflow-hidden transition-all"
              >
                {/* Accordion Bar */}
                <div
                  onClick={() => toggleTurnExpand(idx)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-900/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center text-xs font-bold font-mono">
                      Q{idx + 1}
                    </span>
                    <span className="text-sm font-bold text-white">
                      {turn.question}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    {turn.turn_score !== null && (
                      <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                        {turn.turn_score} / 10
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="p-5 border-t border-slate-800/80 space-y-5 bg-slate-900/30">
                    {/* Grid: Candidate Answer vs Qdrant Ground Truth */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Candidate Answer */}
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <span>Candidate Response</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {turn.candidate_transcript}
                        </p>
                      </div>

                      {/* Qdrant Ground Truth */}
                      <div className="bg-slate-950 p-4 rounded-xl border border-indigo-500/30 space-y-2 relative">
                        <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Qdrant Knowledge Base Chunk Context</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {turn.qdrant_ground_truth_context || "Context retrieved from job description and rubric criteria."}
                        </p>
                      </div>
                    </div>

                    {/* Covered vs Missing Criteria */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {/* Covered */}
                      <div className="bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-xl space-y-2">
                        <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Covered Rubric Criteria ({turn.covered_points.length})</span>
                        </div>
                        <ul className="space-y-1 pl-4 list-disc text-emerald-200">
                          {turn.covered_points.map((pt, i) => (
                            <li key={i}>{pt}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Missing */}
                      <div className="bg-rose-950/20 border border-rose-500/30 p-4 rounded-xl space-y-2">
                        <div className="font-bold text-rose-400 flex items-center gap-1.5">
                          <XCircle className="w-4 h-4" />
                          <span>Missed / Incomplete Points ({turn.missing_points.length})</span>
                        </div>
                        <ul className="space-y-1 pl-4 list-disc text-rose-200">
                          {turn.missing_points.map((pt, i) => (
                            <li key={i}>{pt}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
