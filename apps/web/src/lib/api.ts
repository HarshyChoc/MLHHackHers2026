export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/v1";

async function apiRequest<T>(path: string, init: RequestInit = {}, accessToken?: string): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${await response.text()}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export interface SessionResult {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: {
    id: string;
    email: string;
    name: string;
    timezone: string;
    phone_e164: string | null;
    phone_verified: boolean;
    consent_flags: {
      calls_opt_in: boolean;
      transcription_opt_in: boolean;
      storage_opt_in: boolean;
    };
  };
}

export async function loginDemoUser(): Promise<SessionResult> {
  return apiRequest<SessionResult>("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: "demo@goalcoach.app",
      password: "demo-password"
    })
  });
}

export async function createGoal(
  payload: { statement: string; motivation: string; constraints?: string; target_date: string },
  accessToken: string
): Promise<{ id: string }> {
  return apiRequest("/goals", { method: "POST", body: JSON.stringify(payload) }, accessToken);
}

export async function createHabit(
  payload: {
    goal_id: string;
    title: string;
    difficulty_1_to_10: number;
    frequency: Record<string, unknown>;
    measurement: Record<string, unknown>;
    default_time_window: { start_local: string; end_local: string };
  },
  accessToken: string
): Promise<{ id: string }> {
  return apiRequest("/habits", { method: "POST", body: JSON.stringify(payload) }, accessToken);
}

export async function logHabit(
  payload: { habit_id: string; date_local: string; status: "done" | "partial" | "missed" | "skipped" },
  accessToken: string
): Promise<{ id: string }> {
  return apiRequest("/habit-logs", { method: "POST", body: JSON.stringify(payload) }, accessToken);
}

export async function getActiveGoal(accessToken: string): Promise<{ id: string; statement: string }> {
  return apiRequest("/goals/active", { method: "GET" }, accessToken);
}

export async function getDashboardToday(accessToken: string): Promise<{
  date_local: string;
  habits_today: Array<{ habit_id: string; title: string; status: string }>;
  last_call_recap: string | null;
  weekly_focus: string | null;
}> {
  return apiRequest("/dashboard/today", { method: "GET" }, accessToken);
}

export async function sendChat(
  payload: { thread_id: string; message: string },
  accessToken: string
): Promise<{ assistant_message: string }> {
  return apiRequest("/chat", { method: "POST", body: JSON.stringify(payload) }, accessToken);
}
