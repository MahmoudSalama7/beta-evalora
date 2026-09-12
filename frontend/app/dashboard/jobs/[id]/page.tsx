"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  Users,
  Send,
  Copy,
  Check,
  Sparkles,
  ArrowLeft,
  FileText,
  ShieldCheck,
  CheckSquare,
  Square,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Mail,
  Database,
  Layers
} from "lucide-react";
import {
  getJobDetail,
  getJobCandidates,
  generateInterviewLink,
  JobDetailResponse,
  CandidateData
} from "@/lib/api";

export default function SingleJobPipelinePage() {
  const params = useParams();
  const jobId = params.id as string;

  const [job, setJob] = useState<JobDetailResponse | null>(null);
  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [bulkSending, setBulkSending] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [jobRes, candRes] = await Promise.all([
          getJobDetail(jobId),
          getJobCandidates(jobId)
        ]);
        setJob(jobRes);
        setCandidates(candRes);
      } catch (err) {
        console.error("Failed to load pipeline data:", err);
      } finally {
        setLoading(false);
      }
    }
    if (jobId) loadData();
  }, [jobId]);

  const handleSelectAll = () => {
    if (selectedIds.length === candidates.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(candidates.map((c) => c.candidate_id));
    }
  };

  const handleToggleSelect = (candidateId: string) => {
    if (selectedIds.includes(candidateId)) {
      setSelectedIds(selectedIds.filter((id) => id !== candidateId));
    } else {
      setSelectedIds([...selectedIds, candidateId]);
    }
  };

  const handleSendLink = async (candidateId: string) => {
    setActionLoadingId(candidateId);
    try {
      const res = await generateInterviewLink(jobId, candidateId);
      setCandidates((prev) =>
        prev.map((c) =>
          c.candidate_id === candidateId
            ? { ...c, status: "link_sent", invite_url: res.invite_url }
            : c
        )
      );
    } catch (err) {
      console.error("Failed to send link:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleBulkSend = async () => {
    if (selectedIds.length === 0) return;
    setBulkSending(true);
    try {
      await Promise.all(selectedIds.map((id) => generateInterviewLink(jobId, id)));
      const updatedCands = await getJobCandidates(jobId);
      setCandidates(updatedCands);
      setSelectedIds([]);
    } catch (err) {
      console.error("Failed bulk invite:", err);
    } finally {
      setBulkSending(false);
    }
  };

  const handleCopyInviteLink = (inviteUrl: string, candidateId: string) => {
    navigator.clipboard.writeText(inviteUrl);
    setCopiedId(candidateId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getMatchScoreBadge = (score: number) => {
    if (score >= 80) {
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    } else if (score >= 60) {
      return "bg-amber-500/10 text-amber-400 border-amber-500/30";
    }
    return "bg-rose-500/10 text-rose-400 border-rose-500/30";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "interview_completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            ● Interview Completed
          </span>
        );
      case "link_sent":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            ● Invite Link Sent
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            ● Applied
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium">Loading Candidate Pipeline...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-8 text-center text-white">
        <h2 className="text-xl font-bold">Job Not Found</h2>
        <Link href="/dashboard/jobs" className="text-indigo-400 hover:underline text-sm mt-2 inline-block">
          Return to Jobs Overview
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Back Breadcrumb */}
      <div>
        <Link
          href="/dashboard/jobs"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors font-medium mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to All Jobs
        </Link>
      </div>

      {/* Header Section */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {job.seniority_level}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Created {job.created_at}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              {job.title}
            </h1>
            <div className="max-w-3xl space-y-1 pt-1">
              <div className="relative">
                <p
                  className={`text-slate-300 text-sm leading-relaxed whitespace-pre-wrap transition-all duration-300 ${
                    !descExpanded ? "line-clamp-2 max-h-12 overflow-hidden" : ""
                  }`}
                >
                  {job.description}
                </p>
                {!descExpanded && (
                  <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-slate-900/90 to-transparent pointer-events-none" />
                )}
              </div>
              <button
                type="button"
                onClick={() => setDescExpanded(!descExpanded)}
                className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-xs font-bold transition-colors focus:outline-none"
              >
                {descExpanded ? (
                  <>
                    <span>Shrink Description</span>
                    <ChevronUp className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    <span>Expand Description</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleBulkSend}
              disabled={selectedIds.length === 0 || bulkSending}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg ${
                selectedIds.length > 0
                  ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50"
              }`}
            >
              {bulkSending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>Send Bulk Invites ({selectedIds.length})</span>
            </button>
          </div>
        </div>

        {/* Extracted Skills & Rubric Summary Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800/80 text-xs">
          {/* Skills */}
          <div>
            <div className="text-slate-400 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Extracted Grounding Skills
            </div>
            <div className="flex flex-wrap gap-1.5">
              {job.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60 font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Rubric Weights */}
          <div>
            <div className="text-slate-400 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              AI Rubric Weights & Proctoring
            </div>
            <div className="flex flex-wrap gap-3 text-slate-300">
              <span className="bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
                Technical: <strong className="text-indigo-400">40%</strong>
              </span>
              <span className="bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
                Clarity: <strong className="text-violet-400">30%</strong>
              </span>
              <span className="bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
                Problem Solving: <strong className="text-emerald-400">30%</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Action Sticky Bar if selected */}
      {selectedIds.length > 0 && (
        <div className="bg-indigo-950/80 border border-indigo-500/40 p-4 rounded-xl flex items-center justify-between shadow-xl backdrop-blur-xl animate-fade-in">
          <div className="flex items-center gap-3 text-sm font-semibold text-indigo-200">
            <CheckSquare className="w-5 h-5 text-indigo-400" />
            <span>{selectedIds.length} candidate(s) selected</span>
          </div>
          <button
            onClick={handleBulkSend}
            disabled={bulkSending}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            Send Interview Invitations Now
          </button>
        </div>
      )}

      {/* Candidate Pipeline Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Ranked Candidates ({candidates.length})
            </h2>
          </div>
          <div className="text-xs text-slate-400">
            Sorted by Qdrant CV vs JD Similarity
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/40 text-xs uppercase text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-4 w-10">
                  <button onClick={handleSelectAll} className="text-slate-400 hover:text-white">
                    {selectedIds.length === candidates.length ? (
                      <CheckSquare className="w-4 h-4 text-indigo-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="p-4">Candidate</th>
                <th className="p-4">CV Match Score</th>
                <th className="p-4">Matched / Missing Skills</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {candidates.map((cand) => (
                <tr
                  key={cand.candidate_id}
                  className="hover:bg-slate-800/40 transition-colors group"
                >
                  {/* Select */}
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleSelect(cand.candidate_id)}
                      className="text-slate-400 hover:text-white"
                    >
                      {selectedIds.includes(cand.candidate_id) ? (
                        <CheckSquare className="w-4 h-4 text-indigo-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </td>

                  {/* Candidate Name & Email */}
                  <td className="p-4">
                    <div className="font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {cand.name}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-500" />
                      {cand.email}
                    </div>
                  </td>

                  {/* CV Match Score */}
                  <td className="p-4">
                    <div
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-extrabold text-sm border ${getMatchScoreBadge(
                        cand.match_score
                      )}`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {cand.match_score}%
                    </div>
                  </td>

                  {/* Skills tags */}
                  <td className="p-4 max-w-xs">
                    <div className="space-y-1">
                      <div className="flex flex-wrap gap-1">
                        {cand.matched_skills.slice(0, 3).map((s, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium"
                          >
                            ✓ {s}
                          </span>
                        ))}
                      </div>
                      {cand.missing_skills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {cand.missing_skills.slice(0, 2).map((s, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium"
                            >
                              ✕ {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="p-4">{getStatusBadge(cand.status)}</td>

                  {/* Row Actions */}
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {cand.status === "applied" && (
                        <button
                          onClick={() => handleSendLink(cand.candidate_id)}
                          disabled={actionLoadingId === cand.candidate_id}
                          className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md shadow-indigo-600/20 transition-all"
                        >
                          {actionLoadingId === cand.candidate_id ? (
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          <span>Send Invite</span>
                        </button>
                      )}

                      {cand.status === "link_sent" && (
                        <div className="flex items-center gap-1.5">
                          {cand.invite_url && (
                            <button
                              onClick={() => handleCopyInviteLink(cand.invite_url!, cand.candidate_id)}
                              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold"
                              title="Copy Invite URL"
                            >
                              {copiedId === cand.candidate_id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => handleSendLink(cand.candidate_id)}
                            disabled={actionLoadingId === cand.candidate_id}
                            className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-700 transition-colors"
                          >
                            <RefreshCw className="w-3 h-3 text-slate-400" />
                            <span>Resend</span>
                          </button>
                        </div>
                      )}

                      {cand.status === "interview_completed" && (
                        <Link
                          href={`/dashboard/jobs/${jobId}/candidates/${cand.candidate_id}`}
                          className="inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md shadow-emerald-600/20 transition-all"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View AI Report</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
