const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/api/v1/ws";

export interface JobData {
  id: string;
  title: string;
  description: string;
  skills: string[];
  technical_requirements: string[];
  seniority_level: string;
  core_responsibilities: string[];
  indexed_chunks: number;
  message: string;
}

export interface CandidateView {
  id: string;
  job_id: string;
  candidate_id: string;
  status: string;
  current_question?: string | null;
  message: string;
}

export interface TurnReport {
  turn_index: number;
  question: string;
  candidate_answer?: string | null;
  technical_score?: number | null;
  clarity_score?: number | null;
  covered_points?: string[] | null;
  missing_points?: string[] | null;
  summary?: string | null;
}

export interface HRReport {
  interview_id: string;
  job_id: string;
  candidate_id: string;
  job_title?: string;
  status: string;
  overall_technical_score: number;
  overall_clarity_score: number;
  turns: TurnReport[];
  summary: string;
}


export async function createJob(formData: FormData): Promise<JobData> {
  const response = await fetch(`${API_BASE}/jobs`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: "Failed to create job" }));
    throw new Error(err.detail || "Failed to create job");
  }

  return response.json();
}

export async function getJob(jobId: string): Promise<JobData> {
  const response = await fetch(`${API_BASE}/jobs/${jobId}`);
  if (!response.ok) {
    throw new Error("Job not found");
  }
  return response.json();
}

export async function createInterview(jobId: string, candidateId: string): Promise<CandidateView> {
  const response = await fetch(`${API_BASE}/interviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ job_id: jobId, candidate_id: candidateId }),
  });

  if (!response.ok) {
    throw new Error("Failed to initialize interview");
  }

  return response.json();
}

export async function getCandidateInterview(interviewId: string): Promise<CandidateView> {
  const response = await fetch(`${API_BASE}/interviews/${interviewId}`);
  if (!response.ok) {
    throw new Error("Interview not found");
  }
  return response.json();
}

export async function getHRReport(interviewId: string): Promise<HRReport> {
  const response = await fetch(`${API_BASE}/interviews/${interviewId}/report`);
  if (!response.ok) {
    throw new Error("Failed to load HR interview report");
  }
  return response.json();
}

export function getWebSocketUrl(interviewId: string): string {
  return `${WS_BASE}/interview/${interviewId}`;
}
