"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Users,
  CheckCircle2,
  TrendingUp,
  Search,
  PlusCircle,
  ArrowRight,
  Copy,
  Check,
  ChevronRight,
  Sparkles,
  BarChart3,
  Layers,
  Clock
} from "lucide-react";
import { getJobsOverview, JobsOverviewResponse, JobItemWithMetrics } from "@/lib/api";

export default function JobsOverviewPage() {
  const [data, setData] = useState<JobsOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getJobsOverview();
      setData(res);
    } catch (err: any) {
      console.error("Failed to load jobs:", err);
      setError("Unable to connect to the backend server. Please verify backend service status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopyLink = (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/apply/${jobId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(jobId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredJobs = data?.jobs.filter((j) =>
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    j.seniority_level.toLowerCase().includes(search.toLowerCase())
  ) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium">Loading Jobs Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <div className="bg-slate-900/80 border border-red-500/30 rounded-2xl p-8 max-w-md text-center backdrop-blur-xl space-y-4">
          <div className="w-12 h-12 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full flex items-center justify-center mx-auto">
            !
          </div>
          <h3 className="text-lg font-bold text-white">Error Loading Jobs</h3>
          <p className="text-slate-400 text-sm">{error}</p>
          <button
            onClick={loadData}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/20"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            Job Openings Dashboard
            <span className="text-xs bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2.5 py-1 rounded-full font-semibold">
              Live Metrics
            </span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Monitor active requisitions, pipeline conversion rates, and AI match scores.
          </p>
        </div>
        <Link
          href="/dashboard/jobs/new"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-600/25 transition-all text-sm group"
        >
          <PlusCircle className="w-4 h-4 transition-transform group-hover:rotate-90" />
          Create Job Position
        </Link>
      </div>

      {/* Top KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Active Openings */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden group hover:border-indigo-500/50 transition-all shadow-lg shadow-black/20">
          <div className="absolute top-0 right-0 p-4 text-indigo-500/10 group-hover:text-indigo-500/20 transition-colors">
            <Briefcase className="w-16 h-16" />
          </div>
          <div className="flex items-center gap-3 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Briefcase className="w-4 h-4" />
            </div>
            Active Openings
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {data?.total_active_jobs || 0}
          </div>
          <div className="mt-2 text-xs text-emerald-400 font-medium flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+2 new this week</span>
          </div>
        </div>

        {/* Card 2: Total Applied */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden group hover:border-violet-500/50 transition-all shadow-lg shadow-black/20">
          <div className="absolute top-0 right-0 p-4 text-violet-500/10 group-hover:text-violet-500/20 transition-colors">
            <Users className="w-16 h-16" />
          </div>
          <div className="flex items-center gap-3 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <Users className="w-4 h-4" />
            </div>
            Total Candidates
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {data?.total_candidates_applied || 0}
          </div>
          <div className="mt-2 text-xs text-slate-400 font-medium">
            Across all active positions
          </div>
        </div>

        {/* Card 3: Completion Rate */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden group hover:border-emerald-500/50 transition-all shadow-lg shadow-black/20">
          <div className="absolute top-0 right-0 p-4 text-emerald-500/10 group-hover:text-emerald-500/20 transition-colors">
            <CheckCircle2 className="w-16 h-16" />
          </div>
          <div className="flex items-center gap-3 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            Interview Completion
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {data?.completion_rate_percentage || 0}%
          </div>
          <div className="mt-2 text-xs text-emerald-400 font-medium">
            High candidate engagement
          </div>
        </div>

        {/* Card 4: Avg Match Score */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden group hover:border-amber-500/50 transition-all shadow-lg shadow-black/20">
          <div className="absolute top-0 right-0 p-4 text-amber-500/10 group-hover:text-amber-500/20 transition-colors">
            <Sparkles className="w-16 h-16" />
          </div>
          <div className="flex items-center gap-3 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            Avg. Match Score
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {data?.platform_avg_match_score || 0}%
          </div>
          <div className="mt-2 text-xs text-amber-400 font-medium">
            Qdrant dense similarity index
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/40 border border-slate-800 p-4 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search job title or seniority..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 text-sm rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <div className="text-xs text-slate-400 font-medium">
          Showing <span className="text-white font-bold">{filteredJobs.length}</span> of{" "}
          <span className="text-white font-bold">{data?.jobs.length || 0}</span> positions
        </div>
      </div>

      {/* Jobs Grid / List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredJobs.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center">
            <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white">No Job Positions Found</h3>
            <p className="text-slate-400 text-sm mt-1 max-w-md mx-auto">
              Create your first AI-grounded job opening to start accepting candidates and running simulations.
            </p>
            <Link
              href="/dashboard/jobs/new"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold mt-4 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              Create Position
            </Link>
          </div>
        ) : (
          filteredJobs.map((job: JobItemWithMetrics) => (
            <div
              key={job.id}
              className="bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 rounded-2xl p-6 transition-all shadow-md hover:shadow-indigo-500/5 group relative"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                {/* Left info */}
                <div className="space-y-2 max-w-xl">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      ● Active
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      Created {job.created_at}
                    </span>
                    <span className="text-xs text-indigo-400 font-semibold px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                      {job.seniority_level}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">
                    {job.title}
                  </h3>

                  {/* Extracted skills tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {job.skills.slice(0, 5).map((skill, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2.5 py-1 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/50"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.skills.length > 5 && (
                      <span className="text-xs px-2 py-1 rounded-md bg-slate-800/40 text-slate-400 border border-slate-800">
                        +{job.skills.length - 5} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Middle: Visual Recruitment Funnel */}
                <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl space-y-2 min-w-[280px]">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
                    <span>Recruitment Funnel</span>
                    <span className="text-amber-400 font-bold">{job.avg_match_score}% Match Avg</span>
                  </div>

                  {/* Funnel Progress Bar */}
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${(job.completed_count / (job.applied_count || 1)) * 100}%` }}
                      className="bg-emerald-500 h-full"
                      title="Completed"
                    />
                    <div
                      style={{
                        width: `${
                          ((job.invited_count - job.completed_count) / (job.applied_count || 1)) * 100
                        }%`
                      }}
                      className="bg-indigo-500 h-full"
                      title="Invited"
                    />
                    <div
                      style={{
                        width: `${
                          ((job.applied_count - job.invited_count) / (job.applied_count || 1)) * 100
                        }%`
                      }}
                      className="bg-slate-700 h-full"
                      title="Applied"
                    />
                  </div>

                  {/* Funnel Counter Breakdown */}
                  <div className="grid grid-cols-3 text-center gap-2 pt-1 text-xs">
                    <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                      <div className="text-slate-400 font-medium">Applied</div>
                      <div className="text-white font-bold text-sm">{job.applied_count}</div>
                    </div>
                    <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                      <div className="text-indigo-400 font-medium">Invited</div>
                      <div className="text-white font-bold text-sm">{job.invited_count}</div>
                    </div>
                    <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                      <div className="text-emerald-400 font-medium">Completed</div>
                      <div className="text-white font-bold text-sm">{job.completed_count}</div>
                    </div>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-3 self-end lg:self-center">
                  <button
                    onClick={(e) => handleCopyLink(job.id, e)}
                    className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/50 transition-colors text-xs font-semibold flex items-center gap-1.5"
                    title="Copy Application URL"
                  >
                    {copiedId === job.id ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>

                  <Link
                    href={`/dashboard/jobs/${job.id}`}
                    className="inline-flex items-center gap-2 bg-indigo-600/90 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-semibold transition-all text-xs shadow-md shadow-indigo-600/20"
                  >
                    <span>View Pipeline</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
