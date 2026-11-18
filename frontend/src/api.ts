/** API response returned by the logic exercise endpoint. */
export interface LogicResponse {
  task: string;
  result: number[] | string[];
  explanation: string;
}

/** Health state for API dependencies, without exposing credentials or URLs. */
export interface HealthStatus {
  status: "ok" | "degraded";
  database: "ok" | "error";
  sqs: "connected" | "disabled" | "error";
}

/** Minimal normalized assistant response from FastAPI. */
export interface AssistantResponse {
  answer: string;
}

const apiBase = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

export interface Profile {
  name: string;
  headline: string;
  summary: string;
  links: { label: string; url: string }[];
  education: { title: string; organization: string; period: string }[];
  experience: { title: string; organization: string; period: string; details: string[] }[];
  skills: string[];
  languages: { name: string; level: string }[];
  credentials: { id: string; title: string; status: string }[];
  projects: { id: string; title: string; summary: string; stack: string[] }[];
  events: { name: string; summary: string }[];
}

export interface Company {
  id: string;
  name: string;
  areas: string;
  culture: string;
  contacts: string[];
  jobs: string | null;
  linkedin: string | null;
}

export interface JobFair {
  name: string;
  date: string;
  companies: Company[];
}

export type Topic = "cloud" | "data" | "docker" | "databases" | "network" | "security" | "college";

export interface Question {
  prompt: string;
  options: string[];
  correct_index: number;
  explanations: string[];
}

export interface StudyMaterial {
  summary: string;
  questions: Question[];
  flashcards: { front: string; back: string }[];
}

export interface CareerAdvice {
  role: string;
  fit_summary: string;
  matches: string[];
  gaps: string[];
  questions: string[];
  project_ids: string[];
  credential_ids: string[];
  skills: string[];
}

/**
 * Parses JSON API responses and raises a readable error for non-success statuses.
 */
async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
  });

  const body: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail =
      typeof body === "object" &&
      body !== null &&
      "detail" in body &&
      typeof body.detail === "string"
        ? body.detail
        : `Request failed with HTTP ${response.status}`;
    throw new Error(detail);
  }
  return body as T;
}

/**
 * Calls the FastAPI logic engine with a validated exercise request.
 */
export function runLogic(payload: {
  task: "rolling_average";
  scores: number[];
  window_size: number;
} | {
  task: "critical_logs";
  logs: Array<Record<string, string>>;
}): Promise<LogicResponse> {
  return requestJson<LogicResponse>("/api/v1/learning/logic", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/**
 * Reads API, database and optional SQS connectivity from the readiness endpoint.
 */
export function getHealth(): Promise<HealthStatus> {
  return fetch(`${apiBase}/health`, { headers: { Accept: "application/json" } }).then(
    async (response) => {
      const body: unknown = await response.json().catch(() => null);
      if (
        typeof body !== "object" ||
        body === null ||
        !("status" in body) ||
        !("database" in body) ||
        !("sqs" in body)
      ) {
        throw new Error(`Health endpoint returned HTTP ${response.status}`);
      }
      return body as HealthStatus;
    },
  );
}

/**
 * Sends an authenticated study prompt to the backend Gemini adapter.
 */
export function askAssistant(prompt: string, token: string): Promise<AssistantResponse> {
  return requestJson<AssistantResponse>("/api/v1/learning/assistant", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  });
}

/**
 * Exchanges login/register data for a JWT while keeping the API key server-side.
 */
export async function authenticate(
  email: string,
  password: string,
  createAccount: boolean,
): Promise<string> {
  if (createAccount) {
    await requestJson<{ id: number; email: string }>("/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  }

  const form = new URLSearchParams({ username: email, password });
  const response = await requestJson<{ access_token: string }>("/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });
  return response.access_token;
}

export function getProfile(signal?: AbortSignal): Promise<Profile> {
  return requestJson("/api/v1/hub/profile", { signal });
}

export function getJobFair(signal?: AbortSignal): Promise<JobFair> {
  return requestJson("/api/v1/hub/job-fair", { signal });
}

function postWithToken<T>(path: string, token: string, payload: object): Promise<T> {
  return requestJson(path, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function getStudyMaterial(topic: Topic, notes: string, count: number, token: string) {
  return postWithToken<StudyMaterial>("/api/v1/study/generate", token, { topic, notes, count });
}

export function tailorCareer(description: string, companyId: string, token: string) {
  return postWithToken<CareerAdvice>("/api/v1/career/tailor", token, {
    description,
    company_id: companyId || null,
  });
}
