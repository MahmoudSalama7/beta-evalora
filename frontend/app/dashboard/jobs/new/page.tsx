"use client";

import React, { useState } from "react";


import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  FileText,
  UploadCloud,
  Sliders,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  X,
  Loader2,
  ArrowRight,
  Database,
  Layers
} from "lucide-react";
import { createJob, JobData } from "@/lib/api";

export default function CreateJobPage() {
  const router = useRouter();
  
  // Form State
  const [title, setTitle] = useState("Senior Full-Stack Engineer");
  const [seniority, setSeniority] = useState("Senior");
  const [description, setDescription] = useState(
    `We are looking for a Senior Full-Stack Engineer with 4+ years of experience in Python, FastAPI, React, and Async PostgreSQL. You will design scalable AI-driven interview services and integrate Qdrant vector databases for RAG question generation.`
  );
  const [files, setFiles] = useState<File[]>([]);
  
  // Rubric Sliders State
  const [techWeight, setTechWeight] = useState(40);
  const [problemWeight, setProblemWeight] = useState(30);
  const [commWeight, setCommWeight] = useState(30);

  // Status & Live Extraction Preview State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<JobData | null>(null);

  const handleFileDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selected]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      
      files.forEach((file) => {
        formData.append("resources", file);
      });

      const res = await createJob(formData);
      setExtractedData(res);
    } catch (err: any) {
      setError(err.message || "Failed to create job position");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-emerald-400" /> Create New Job Position
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Paste plain text Job Description, upload optional grounding reference PDFs for RAG context, and configure rubric criteria.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column (2 Cols) */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          {/* Job Details Card */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h2 className="text-base font-semibold text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" /> 1. Position Details & Plain Text JD
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Job Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g. Senior Python Developer"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Seniority Level</label>
                <select
                  value={seniority}
                  onChange={(e) => setSeniority(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="Junior">Junior</option>
                  <option value="Mid-Level">Mid-Level</option>
                  <option value="Senior">Senior</option>
                  <option value="Lead / Principal">Lead / Principal</option>
                </select>
              </div>
            </div>

            {/* Plain Text Description Textarea */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Job Description Plain Text (NOT a file uploader) *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={6}
                placeholder="Paste raw text job description here..."
                className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 leading-relaxed font-mono"
              />
            </div>
          </div>

          {/* RAG PDF Resources Uploader */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h2 className="text-base font-semibold text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-emerald-400" /> 2. Grounding Reference Materials (PDFs/Docs)
            </h2>
            
            <div className="border-2 border-dashed border-slate-800 hover:border-emerald-500/40 rounded-xl p-6 text-center transition-colors bg-slate-950/50 relative">
              <input
                type="file"
                multiple
                accept=".pdf,.txt,.doc,.docx"
                onChange={handleFileDrop}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <UploadCloud className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-semibold text-slate-200">Drag & drop grounding PDFs here or click to browse</p>
              <p className="text-xs text-slate-500 mt-1">Upload technical guidelines, architecture docs, or rubric references for Qdrant RAG</p>
            </div>

            {files.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-xs font-semibold text-slate-400">Attached Materials ({files.length}):</p>
                <div className="flex flex-wrap gap-2">
                  {files.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg text-xs text-slate-200 border border-slate-700">
                      <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="truncate max-w-[180px]">{file.name}</span>
                      <button type="button" onClick={() => removeFile(idx)} className="text-slate-400 hover:text-rose-400">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Rubric Criteria Sliders */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h2 className="text-base font-semibold text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" /> 3. Assessment Rubric Weightings
            </h2>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                  <span>Technical Competency</span>
                  <span className="text-emerald-400">{techWeight}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="80"
                  value={techWeight}
                  onChange={(e) => setTechWeight(Number(e.target.value))}
                  className="w-full accent-emerald-500 bg-slate-950 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                  <span>Problem Solving & Architecture</span>
                  <span className="text-teal-400">{problemWeight}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="80"
                  value={problemWeight}
                  onChange={(e) => setProblemWeight(Number(e.target.value))}
                  className="w-full accent-teal-500 bg-slate-950 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                  <span>Communication & Clarity</span>
                  <span className="text-cyan-400">{commWeight}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="80"
                  value={commWeight}
                  onChange={(e) => setCommWeight(Number(e.target.value))}
                  className="w-full accent-cyan-500 bg-slate-950 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Processing & Extracting Metadata...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 fill-current" /> Create Job & Extract LLM Metadata
              </>
            )}
          </button>
        </form>

        {/* Live Extraction Preview Card (1 Col) */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 sticky top-24 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" /> Live LLM Extraction Preview
              </h3>
              {extractedData && (
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                  Extracted
                </span>
              )}
            </div>

            {extractedData ? (
              <div className="space-y-4 text-xs">
                <div>
                  <p className="text-slate-400 font-semibold mb-1">Parsed Position:</p>
                  <p className="font-bold text-slate-100 text-sm">{extractedData.title}</p>
                  <p className="text-emerald-400 font-medium">{extractedData.seniority_level} Level</p>
                </div>

                <div>
                  <p className="text-slate-400 font-semibold mb-1">Extracted Skills ({extractedData.skills.length}):</p>
                  <div className="flex flex-wrap gap-1.5">
                    {extractedData.skills.map((skill, idx) => (
                      <span key={idx} className="px-2 py-1 rounded-md bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-slate-400 font-semibold mb-1">Technical Requirements:</p>
                  <ul className="space-y-1 text-slate-300 list-disc list-inside">
                    {extractedData.technical_requirements.map((req, idx) => (
                      <li key={idx} className="truncate">{req}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-slate-400 font-semibold mb-1">Core Responsibilities:</p>
                  <ul className="space-y-1 text-slate-300 list-disc list-inside">
                    {extractedData.core_responsibilities.map((resp, idx) => (
                      <li key={idx} className="truncate">{resp}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5 font-semibold text-xs">
                      <Database className="w-4 h-4 text-emerald-400" /> Qdrant Knowledge Base:
                    </span>
                    <span className="font-extrabold text-emerald-400 text-sm bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                      {extractedData.indexed_chunks} Chunks Indexed
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Text description & reference materials chunked, embedded with 768-dim dense vectors, and stored under <code className="text-indigo-400">job_id</code> payload tag for multi-tenant isolation.
                  </p>
                  <Link
                    href={`/dashboard/jobs/${extractedData.id}`}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-lg transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 text-xs group"
                  >
                    <span>View Position Pipeline & Qdrant Grounding</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 space-y-3">
                <FileText className="w-10 h-10 mx-auto opacity-30" />
                <p className="text-xs">Submit the form to view real-time LLM structured skill extraction and Qdrant chunking breakdown.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
