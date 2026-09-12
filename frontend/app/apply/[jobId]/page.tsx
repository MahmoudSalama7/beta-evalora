"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  User,
  Mail,
  Building2,
  FileText,
  Clock,
  ShieldCheck,
  AlertCircle,
  UploadCloud,
  X
} from "lucide-react";
import { getJob, applyForJob, JobData } from "@/lib/api";

export default function CandidateJobApplyPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  const [job, setJob] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);


  // Job description expand state
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  useEffect(() => {
    async function loadJobData() {
      try {
        setLoading(true);
        setError(null);
        const data = await getJob(jobId);
        setJob(data);
      } catch (err: any) {
        console.error("Failed to load job details:", err);
        setError(err.message || "Job position not found.");
      } finally {
        setLoading(false);
      }
    }
    if (jobId) {
      loadJobData();
    }
  }, [jobId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await applyForJob(jobId, name.trim(), email.trim(), resumeFile);
      // Redirect candidate to interview room check screen

      router.push(`/interview/${res.invite_token}/check`);
    } catch (err: any) {
      console.error("Failed to submit application:", err);
      setError(err.message || "Failed to submit application. Please try again.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium">Loading Job Position...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 max-w-md text-center backdrop-blur-xl space-y-4">
          <div className="w-12 h-12 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Job Position Not Found</h3>
          <p className="text-slate-400 text-sm">{error || "This job requisition may have been closed or removed."}</p>
          <Link
            href="/"
            className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30">
              <Briefcase className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-lg text-white tracking-tight">
              Evalora <span className="text-indigo-400">Careers</span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>AI-Assisted Candidate Screening</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Job Details (2 Cols on Large) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Box */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-xl space-y-4 shadow-xl">
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {job.seniority_level || "Mid-Senior"}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Actively Recruiting
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                {job.title}
              </h1>

              {/* Required Skills Badges */}
              {job.skills && job.skills.length > 0 && (
                <div className="pt-2">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    Key Skill Tags
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-lg bg-slate-800/90 text-slate-200 border border-slate-700/60 text-xs font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Description Box with Expand / Shrink */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-xl space-y-4 shadow-xl relative">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                Job Description
              </h2>

              <div className="relative">
                <p
                  className={`text-slate-300 text-sm leading-relaxed whitespace-pre-wrap transition-all duration-300 ${
                    !descriptionExpanded ? "line-clamp-4 max-h-36 overflow-hidden" : ""
                  }`}
                >
                  {job.description}
                </p>

                {/* Fade effect when collapsed */}
                {!descriptionExpanded && (
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-900/90 to-transparent pointer-events-none" />
                )}
              </div>

              {/* Expand / Shrink Toggle Button */}
              <button
                type="button"
                onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-xs font-bold pt-2 transition-colors focus:outline-none"
              >
                {descriptionExpanded ? (
                  <>
                    <span>Show Less</span>
                    <ChevronUp className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>Read Full Job Description</span>
                    <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* Technical Requirements & Responsibilities */}
            {(job.technical_requirements?.length > 0 || job.core_responsibilities?.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Requirements */}
                {job.technical_requirements?.length > 0 && (
                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl space-y-3 shadow-xl">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Technical Requirements
                    </h3>
                    <ul className="space-y-2 text-xs text-slate-300">
                      {job.technical_requirements.map((req, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-emerald-400 font-bold">•</span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Responsibilities */}
                {job.core_responsibilities?.length > 0 && (
                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl space-y-3 shadow-xl">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-indigo-400" />
                      Core Responsibilities
                    </h3>
                    <ul className="space-y-2 text-xs text-slate-300">
                      {job.core_responsibilities.map((resp, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-indigo-400 font-bold">•</span>
                          <span>{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Candidate Application Card */}
          <div className="lg:col-span-1 sticky top-24">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-2xl space-y-6 shadow-2xl relative overflow-hidden">
              {/* Background gradient accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

              <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight">
                  Apply Now
                </h2>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                  Enter your details to register and launch your live AI technical screening session.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="jane.doe@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Candidate Resume Upload (PDF) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Resume / CV (PDF / Doc)</span>
                    <span className="text-[10px] text-indigo-400 font-normal">AI Match Scoring</span>
                  </label>
                  <div className="border border-dashed border-slate-800 hover:border-indigo-500/50 rounded-xl p-3.5 text-center transition-colors bg-slate-950/80 relative">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setResumeFile(e.target.files[0]);
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    {resumeFile ? (
                      <div className="flex items-center justify-between text-xs text-indigo-300 bg-indigo-950/40 p-2 rounded-lg border border-indigo-500/30">
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                          <span className="truncate max-w-[180px] font-medium">{resumeFile.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setResumeFile(null);
                          }}
                          className="text-slate-400 hover:text-rose-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                        <UploadCloud className="w-4 h-4 text-indigo-400" />
                        <span>Upload Resume PDF (Drag & drop or click)</span>
                      </div>
                    )}
                  </div>
                </div>


                {error && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-xl">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 text-sm group"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Initializing AI Interview...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit & Start AI Interview</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>

              <div className="border-t border-slate-800/80 pt-4 text-center">
                <p className="text-[11px] text-slate-500">
                  By clicking submit, you agree to participate in an AI-assisted video evaluation session.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        © 2026 Evalora Platform. Powered by Qdrant Vector Engine & FastAPI.
      </footer>
    </div>
  );
}
