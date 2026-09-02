"use client";

import React, { useState } from "react";


import Link from "next/link";
import {
  Users,
  Search,
  Filter,
  Send,
  ExternalLink,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  Mail,
  Sparkles
} from "lucide-react";

interface Candidate {
  id: string;
  name: string;
  email: string;
  jobTitle: string;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  status: "Applied" | "Link Sent" | "Completed";
  magicLink?: string;
}

const mockCandidates: Candidate[] = [
  {
    id: "c-1",
    name: "Alex Rivera",
    email: "alex.rivera@example.com",
    jobTitle: "Senior Full-Stack Engineer",
    matchScore: 92,
    matchedSkills: ["Python", "FastAPI", "React", "PostgreSQL"],
    missingSkills: ["Kubernetes"],
    status: "Completed",
    magicLink: "http://localhost:3000/interview/demo-token-alex"
  },
  {
    id: "c-2",
    name: "Sarah Chen",
    email: "sarah.chen@example.com",
    jobTitle: "Senior Full-Stack Engineer",
    matchScore: 84,
    matchedSkills: ["Python", "AsyncIO", "React", "TypeScript"],
    missingSkills: ["Qdrant", "Docker"],
    status: "Link Sent",
    magicLink: "http://localhost:3000/interview/demo-token-sarah"
  },
  {
    id: "c-3",
    name: "Marcus Vance",
    email: "marcus.vance@example.com",
    jobTitle: "Lead Data Scientist",
    matchScore: 71,
    matchedSkills: ["Python", "Machine Learning", "PyTorch"],
    missingSkills: ["FastAPI", "RAG", "Qdrant"],
    status: "Applied",
  },
  {
    id: "c-4",
    name: "Elena Rostova",
    email: "elena.rostova@example.com",
    jobTitle: "Senior Full-Stack Engineer",
    matchScore: 54,
    matchedSkills: ["React", "JavaScript"],
    missingSkills: ["Python", "FastAPI", "AsyncIO", "PostgreSQL"],
    status: "Applied",
  }
];

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>(mockCandidates);
  const [searchQuery, setSearchQuery] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [magicLinkModal, setMagicLinkModal] = useState<Candidate | null>(null);

  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesScore = c.matchScore >= minScore;
    return matchesSearch && matchesScore;
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredCandidates.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCandidates.map((c) => c.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const sendMagicLink = (cand: Candidate) => {
    const generatedLink = `${window.location.origin}/interview/${cand.id}-token`;
    setCandidates((prev) =>
      prev.map((item) => (item.id === cand.id ? { ...item, status: "Link Sent", magicLink: generatedLink } : item))
    );
    setMagicLinkModal({ ...cand, status: "Link Sent", magicLink: generatedLink });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(text);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24">
      {/* Page Title & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" /> Candidate Directory & Match Scores
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Review CV match scores, filter by missing skills, and dispatch single-use interview magic links.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
            <span>Total Candidates:</span>
            <span className="font-extrabold text-emerald-400 text-sm">{candidates.length}</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by candidate name or email..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        {/* Minimum Match Score Slider */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 shrink-0">
            <Filter className="w-4 h-4 text-emerald-400" /> Min Match Score:
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="w-36 accent-emerald-500 bg-slate-950 rounded-lg cursor-pointer"
          />
          <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs shrink-0">
            {minScore}%+
          </span>
        </div>
      </div>

      {/* Candidates Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredCandidates.length && filteredCandidates.length > 0}
                    onChange={toggleSelectAll}
                    className="accent-emerald-500 rounded cursor-pointer"
                  />
                </th>
                <th className="p-4">Candidate Name & Email</th>
                <th className="p-4">CV Match Score</th>
                <th className="p-4">Matched Skills</th>
                <th className="p-4">Missing Skills</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCandidates.map((c) => {
                const isSelected = selectedIds.includes(c.id);
                // Badge color based on match score
                const badgeColor =
                  c.matchScore >= 80
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : c.matchScore >= 60
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/30";

                return (
                  <tr key={c.id} className={`hover:bg-slate-800/40 transition-colors ${isSelected ? "bg-emerald-500/5" : ""}`}>
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(c.id)}
                        className="accent-emerald-500 rounded cursor-pointer"
                      />
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-100">{c.name}</p>
                      <p className="text-xs text-slate-500">{c.email}</p>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-lg border font-extrabold text-xs inline-flex items-center gap-1.5 ${badgeColor}`}>
                        {c.matchScore >= 80 ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : c.matchScore >= 60 ? (
                          <AlertTriangle className="w-3.5 h-3.5" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                        {c.matchScore}%
                      </span>
                    </td>
                    <td className="p-4 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {c.matchedSkills.map((s, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 text-[11px] border border-emerald-500/20 font-medium">
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {c.missingSkills.map((s, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-rose-950/40 text-rose-400 text-[11px] border border-rose-500/20 font-medium">
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        c.status === "Completed"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : c.status === "Link Sent"
                          ? "bg-cyan-500/20 text-cyan-400"
                          : "bg-slate-800 text-slate-400"
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => sendMagicLink(c)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors inline-flex items-center gap-1"
                      >
                        <Send className="w-3.5 h-3.5" /> Send Magic Link
                      </button>

                      {c.status === "Completed" && (
                        <Link
                          href="/dashboard/interviews/demo/report"
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors inline-flex items-center gap-1 border border-slate-700"
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-400" /> Open Report
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Batch Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3.5 rounded-2xl bg-slate-900/95 border border-emerald-500/40 shadow-2xl backdrop-blur-xl flex items-center gap-6 z-50 animate-bounce">
          <span className="text-xs font-bold text-slate-200">
            {selectedIds.length} candidate{selectedIds.length > 1 ? "s" : ""} selected
          </span>
          <button
            onClick={() => {
              setCandidates((prev) =>
                prev.map((c) => (selectedIds.includes(c.id) ? { ...c, status: "Link Sent" } : c))
              );
              setSelectedIds([]);
            }}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4" /> Bulk Send Interview Links
          </button>
        </div>
      )}

      {/* Magic Link Modal */}
      {magicLinkModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" /> Magic Link Generated
              </h3>
              <button onClick={() => setMagicLinkModal(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Single-use magic link dispatched to <strong className="text-slate-200">{magicLinkModal.email}</strong>.
            </p>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
              <input
                type="text"
                readOnly
                value={magicLinkModal.magicLink || ""}
                className="bg-transparent text-xs text-emerald-400 font-mono truncate w-full outline-none"
              />
              <button
                onClick={() => copyToClipboard(magicLinkModal.magicLink || "")}
                className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold shrink-0"
              >
                {copiedToken === magicLinkModal.magicLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Link
                href={`/interview/${magicLinkModal.id}-token/check`}
                target="_blank"
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Test Candidate View
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
