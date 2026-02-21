import type {
  CommitmentItem,
  DashboardTodayResponse,
  Goal,
  Habit,
  HabitLogStatus,
  WeeklyReview
} from "@goalcoach/shared";

export interface ConsentFlags {
  calls_opt_in: boolean;
  transcription_opt_in: boolean;
  storage_opt_in: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  timezone: string;
  phone_e164: string | null;
  phone_verified: boolean;
  consent_flags: ConsentFlags;
  preferences?: Record<string, unknown>;
}

export interface HabitLog {
  id: string;
  user_id: string;
  habit_id: string;
  date_local: string;
  status: HabitLogStatus;
  value: number | null;
  note: string | null;
  source: "manual" | "chat_auto" | "call_tool";
  created_at: string;
}

export interface RetryPolicy {
  max_attempts: number;
  retry_delay_minutes: number;
}

export interface Schedule {
  id: string;
  user_id: string;
  type: "call" | "chat";
  windows: Array<Record<string, unknown>>;
  cadence: Record<string, unknown>;
  retry_policy: RetryPolicy;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  thread_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface Blocker {
  id: string;
  user_id: string;
  blocker_text: string;
  severity: "low" | "medium" | "high";
  created_at: string;
}

export interface CheckinEvent {
  id: string;
  user_id: string;
  scheduled_at_utc: string;
  type: "call" | "chat";
  status: "scheduled" | "in_progress" | "completed" | "failed";
  attempt_count: number;
}

export interface CallSession {
  id: string;
  user_id: string;
  checkin_event_id: string;
  status: "completed" | "failed" | "no_answer";
  started_at: string;
  ended_at: string;
  transcript: string;
}

export interface CallOutcome {
  call_session_id: string;
  completed_habits: string[];
  missed_habits: string[];
  blockers: string[];
  commitments: string[];
  recap_text: string;
}

export interface DbState {
  users: Map<string, UserProfile>;
  goals: Map<string, Goal>;
  habits: Map<string, Habit>;
  habitLogs: Map<string, HabitLog>;
  schedules: Map<string, Schedule>;
  messages: Map<string, ChatMessage>;
  weeklyReviews: Map<string, WeeklyReview>;
  commitments: Map<string, CommitmentItem & { user_id: string }>;
  blockers: Map<string, Blocker>;
  checkinEvents: Map<string, CheckinEvent>;
  callSessions: Map<string, CallSession>;
  callOutcomes: Map<string, CallOutcome>;
  recapsByUserId: Map<string, string>;
  rollingSummaryByUserId: Map<string, string>;
  memoryProfileByUserId: Map<string, Record<string, unknown>>;
}

export interface AuthSessionResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: Omit<UserProfile, "password_hash">;
}

export interface AppContext {
  db: DbState;
  toolApiKey: string;
}

export interface TodayPlan {
  date_local: string;
  habits: DashboardTodayResponse["habits_today"];
  commitments: CommitmentItem[];
}
