import { randomUUID } from "node:crypto";
import type { Goal, Habit } from "@goalcoach/shared";
import type { AppContext, DbState, UserProfile } from "./types.js";

function nowIso(): string {
  return new Date().toISOString();
}

function buildDefaultUser(): UserProfile {
  return {
    id: randomUUID(),
    email: "demo@goalcoach.app",
    password_hash: "demo-password",
    name: "Demo User",
    timezone: "America/Los_Angeles",
    phone_e164: null,
    phone_verified: false,
    consent_flags: {
      calls_opt_in: true,
      transcription_opt_in: true,
      storage_opt_in: true
    },
    preferences: {
      coaching_style: "mixed"
    }
  };
}

function buildInitialGoal(userId: string): Goal {
  const timestamp = nowIso();
  return {
    id: randomUUID(),
    user_id: userId,
    statement: "Exercise 4x per week",
    motivation: "Increase energy and focus",
    constraints: "Travel on Thursdays",
    target_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45).toISOString().slice(0, 10),
    active: true,
    created_at: timestamp,
    updated_at: timestamp
  };
}

function buildSeedHabit(userId: string, goalId: string): Habit {
  const timestamp = nowIso();
  return {
    id: randomUUID(),
    user_id: userId,
    goal_id: goalId,
    title: "20-minute walk",
    frequency: { cadence: "weekdays" },
    measurement: { type: "duration_minutes", target_value: 20 },
    difficulty_1_to_10: 3,
    default_time_window: { start_local: "07:00", end_local: "09:00" },
    active: true,
    created_at: timestamp,
    updated_at: timestamp
  };
}

export function createAppContext(): AppContext {
  const db: DbState = {
    users: new Map(),
    goals: new Map(),
    habits: new Map(),
    habitLogs: new Map(),
    schedules: new Map(),
    messages: new Map(),
    weeklyReviews: new Map(),
    commitments: new Map(),
    blockers: new Map(),
    checkinEvents: new Map(),
    callSessions: new Map(),
    callOutcomes: new Map(),
    recapsByUserId: new Map(),
    rollingSummaryByUserId: new Map(),
    memoryProfileByUserId: new Map()
  };

  const user = buildDefaultUser();
  db.users.set(user.id, user);

  const goal = buildInitialGoal(user.id);
  db.goals.set(goal.id, goal);

  const habit = buildSeedHabit(user.id, goal.id);
  db.habits.set(habit.id, habit);

  db.memoryProfileByUserId.set(user.id, {
    preferred_checkin_tone: "supportive",
    stable_fact: "Usually misses habits when travel day starts before 7am"
  });

  return {
    db,
    toolApiKey: process.env.TOOL_API_KEY ?? "dev-tool-api-key"
  };
}

export function userWithoutPassword(user: UserProfile): Omit<UserProfile, "password_hash"> {
  const { password_hash: _passwordHash, ...rest } = user;
  return rest;
}

export function pickFirstUserId(db: DbState): string {
  const user = db.users.values().next().value as UserProfile | undefined;
  if (!user) {
    throw new Error("No users in store");
  }
  return user.id;
}
