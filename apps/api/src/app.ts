import { randomUUID } from "node:crypto";
import Fastify from "fastify";
import cors from "@fastify/cors";
import type { DashboardTodayResponse, Habit } from "@goalcoach/shared";
import { createAppContext, pickFirstUserId, userWithoutPassword } from "./store.js";
import { generateWeeklyReview, getWeekStart } from "./weekly-review.js";
import type {
  AppContext,
  AuthSessionResponse,
  ChatMessage,
  HabitLog,
  Schedule,
  UserProfile
} from "./types.js";

function nowIso(): string {
  return new Date().toISOString();
}

function todayLocalISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function toSession(user: UserProfile): AuthSessionResponse {
  const access_token = `dev-access::${user.id}`;
  const refresh_token = `dev-refresh::${user.id}`;
  return {
    access_token,
    refresh_token,
    expires_in: 60 * 60,
    user: userWithoutPassword(user)
  };
}

function getUserIdFromAuthHeader(authorization?: string): string | null {
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return null;
  }
  const token = authorization.slice("Bearer ".length).trim();
  if (!token.startsWith("dev-access::")) {
    return null;
  }
  const userId = token.slice("dev-access::".length);
  return userId.length > 0 ? userId : null;
}

function keyForWeeklyReview(userId: string, weekStart: string): string {
  return `${userId}:${weekStart}`;
}

function getUser(ctx: AppContext, userId: string): UserProfile {
  const user = ctx.db.users.get(userId);
  if (!user) {
    throw new Error("Unknown user");
  }
  return user;
}

function getAuthenticatedUser(ctx: AppContext, authorization?: string): UserProfile {
  const explicitUserId = getUserIdFromAuthHeader(authorization);
  if (explicitUserId) {
    const explicitUser = ctx.db.users.get(explicitUserId);
    if (explicitUser) {
      return explicitUser;
    }
  }
  return getUser(ctx, pickFirstUserId(ctx.db));
}

function getActiveGoal(ctx: AppContext, userId: string) {
  return Array.from(ctx.db.goals.values()).find((goal) => goal.user_id === userId && goal.active);
}

function getHabitsForGoal(ctx: AppContext, userId: string, goalId: string): Habit[] {
  return Array.from(ctx.db.habits.values()).filter((habit) => habit.user_id === userId && habit.goal_id === goalId && habit.active);
}

function getLogsForDate(ctx: AppContext, userId: string, dateLocal: string): HabitLog[] {
  return Array.from(ctx.db.habitLogs.values()).filter((log) => log.user_id === userId && log.date_local === dateLocal);
}

function buildDashboard(ctx: AppContext, userId: string, dateLocal: string): DashboardTodayResponse {
  const user = getUser(ctx, userId);
  const goal = getActiveGoal(ctx, userId);
  if (!goal) {
    throw new Error("No active goal");
  }

  const habits = getHabitsForGoal(ctx, userId, goal.id);
  const logsForDate = getLogsForDate(ctx, userId, dateLocal);

  const habits_today = habits.map((habit) => {
    const log = logsForDate.find((entry) => entry.habit_id === habit.id);
    return {
      habit_id: habit.id,
      title: habit.title,
      status: (log?.status ?? "pending") as "pending" | "done" | "partial" | "missed" | "skipped",
      target_window: habit.default_time_window,
      difficulty_1_to_10: habit.difficulty_1_to_10
    };
  });

  const commitments = Array.from(ctx.db.commitments.values())
    .filter((item) => item.user_id === userId && item.status === "open")
    .map((item) => ({
      id: item.id,
      text: item.text,
      due_date_local: item.due_date_local,
      status: item.status
    }));

  const weekStart = getWeekStart(dateLocal);
  const review = ctx.db.weeklyReviews.get(keyForWeeklyReview(userId, weekStart));

  return {
    date_local: dateLocal,
    timezone: user.timezone,
    goal,
    habits_today,
    commitments,
    last_call_recap: ctx.db.recapsByUserId.get(userId) ?? null,
    weekly_focus: review?.week_focus ?? null
  };
}

export function createApp() {
  const ctx = createAppContext();
  const app = Fastify({ logger: true });

  app.register(cors, {
    origin: true,
    methods: ["GET", "POST", "PATCH", "OPTIONS"]
  });

  app.get("/health", async () => ({ status: "ok" }));

  app.register(
    async (v1) => {
      v1.post("/auth/register", async (request, reply) => {
        const body = request.body as {
          email: string;
          password: string;
          name: string;
          timezone: string;
          phone_e164?: string | null;
          consent_flags: {
            calls_opt_in: boolean;
            transcription_opt_in: boolean;
            storage_opt_in: boolean;
          };
        };

        const existing = Array.from(ctx.db.users.values()).find((user) => user.email.toLowerCase() === body.email.toLowerCase());
        if (existing) {
          return reply.code(409).send({
            error: {
              code: "CONFLICT",
              message: "Email already exists",
              request_id: request.id
            }
          });
        }

        const user: UserProfile = {
          id: randomUUID(),
          email: body.email,
          password_hash: body.password,
          name: body.name,
          timezone: body.timezone,
          phone_e164: body.phone_e164 ?? null,
          phone_verified: false,
          consent_flags: body.consent_flags,
          preferences: {}
        };

        ctx.db.users.set(user.id, user);
        return reply.code(201).send(toSession(user));
      });

      v1.post("/auth/login", async (request, reply) => {
        const body = request.body as { email: string; password: string };
        const user = Array.from(ctx.db.users.values()).find((candidate) => candidate.email.toLowerCase() === body.email.toLowerCase());
        if (!user || user.password_hash !== body.password) {
          return reply.code(401).send({
            error: {
              code: "UNAUTHORIZED",
              message: "Invalid credentials",
              request_id: request.id
            }
          });
        }

        return reply.send(toSession(user));
      });

      v1.post("/auth/refresh", async (request) => {
        const body = request.body as { refresh_token: string };
        const userId = body.refresh_token?.startsWith("dev-refresh::") ? body.refresh_token.slice("dev-refresh::".length) : pickFirstUserId(ctx.db);
        const user = getUser(ctx, userId);
        return {
          access_token: `dev-access::${user.id}`,
          expires_in: 60 * 60
        };
      });

      v1.post("/auth/logout", async (_request, reply) => reply.code(204).send());

      v1.post("/auth/verify-phone", async (request, reply) => {
        const user = getAuthenticatedUser(ctx, request.headers.authorization);
        const body = request.body as { phone_e164: string; otp_code: string };
        if (body.otp_code.length < 4) {
          return reply.code(401).send({
            error: {
              code: "UNAUTHORIZED",
              message: "Invalid OTP",
              request_id: request.id
            }
          });
        }

        user.phone_e164 = body.phone_e164;
        user.phone_verified = true;
        return { phone_verified: true };
      });

      v1.post("/goals", async (request, reply) => {
        const user = getAuthenticatedUser(ctx, request.headers.authorization);
        const body = request.body as {
          statement: string;
          motivation: string;
          constraints?: string;
          target_date: string;
        };

        for (const goal of ctx.db.goals.values()) {
          if (goal.user_id === user.id) {
            goal.active = false;
          }
        }

        const timestamp = nowIso();
        const goal = {
          id: randomUUID(),
          user_id: user.id,
          statement: body.statement,
          motivation: body.motivation,
          constraints: body.constraints ?? null,
          target_date: body.target_date,
          active: true,
          created_at: timestamp,
          updated_at: timestamp
        };
        ctx.db.goals.set(goal.id, goal);

        return reply.code(201).send(goal);
      });

      v1.get("/goals/active", async (request, reply) => {
        const user = getAuthenticatedUser(ctx, request.headers.authorization);
        const goal = getActiveGoal(ctx, user.id);
        if (!goal) {
          return reply.code(404).send({
            error: {
              code: "NOT_FOUND",
              message: "No active goal",
              request_id: request.id
            }
          });
        }
        return goal;
      });

      v1.post("/habits", async (request, reply) => {
        const user = getAuthenticatedUser(ctx, request.headers.authorization);
        const body = request.body as {
          goal_id: string;
          title: string;
          frequency: Record<string, unknown>;
          measurement: Record<string, unknown>;
          difficulty_1_to_10: number;
          default_time_window: { start_local: string; end_local: string };
          active?: boolean;
        };
        const timestamp = nowIso();

        const habit = {
          id: randomUUID(),
          user_id: user.id,
          goal_id: body.goal_id,
          title: body.title,
          frequency: body.frequency,
          measurement: body.measurement,
          difficulty_1_to_10: body.difficulty_1_to_10,
          default_time_window: body.default_time_window,
          active: body.active ?? true,
          created_at: timestamp,
          updated_at: timestamp
        };

        ctx.db.habits.set(habit.id, habit);
        return reply.code(201).send({ ...habit });
      });

      v1.patch("/habits/:habit_id", async (request, reply) => {
        const user = getAuthenticatedUser(ctx, request.headers.authorization);
        const params = request.params as { habit_id: string };
        const body = request.body as Record<string, unknown>;
        const habit = ctx.db.habits.get(params.habit_id);

        if (!habit || habit.user_id !== user.id) {
          return reply.code(404).send({
            error: {
              code: "NOT_FOUND",
              message: "Habit not found",
              request_id: request.id
            }
          });
        }

        Object.assign(habit, body, { updated_at: nowIso() });
        ctx.db.habits.set(habit.id, habit);
        return habit;
      });

      v1.post("/habit-logs", async (request, reply) => {
        const user = getAuthenticatedUser(ctx, request.headers.authorization);
        const body = request.body as {
          habit_id: string;
          date_local: string;
          status: "done" | "partial" | "missed" | "skipped";
          value?: number | null;
          note?: string | null;
          source?: "manual" | "chat_auto" | "call_tool";
        };

        const log = {
          id: randomUUID(),
          user_id: user.id,
          habit_id: body.habit_id,
          date_local: body.date_local,
          status: body.status,
          value: body.value ?? null,
          note: body.note ?? null,
          source: body.source ?? "manual",
          created_at: nowIso()
        };
        ctx.db.habitLogs.set(log.id, log);
        return reply.code(201).send(log);
      });

      v1.post("/schedules", async (request) => {
        const user = getAuthenticatedUser(ctx, request.headers.authorization);
        const body = request.body as {
          type: "call" | "chat";
          windows: Array<Record<string, unknown>>;
          cadence: Record<string, unknown>;
          retry_policy?: { max_attempts: number; retry_delay_minutes: number };
        };

        const existing = Array.from(ctx.db.schedules.values()).find((item) => item.user_id === user.id && item.type === body.type);
        const timestamp = nowIso();

        const schedule: Schedule = existing
          ? {
              ...existing,
              windows: body.windows,
              cadence: body.cadence,
              retry_policy: body.retry_policy ?? existing.retry_policy,
              updated_at: timestamp
            }
          : {
              id: randomUUID(),
              user_id: user.id,
              type: body.type,
              windows: body.windows,
              cadence: body.cadence,
              retry_policy: body.retry_policy ?? { max_attempts: 1, retry_delay_minutes: 15 },
              created_at: timestamp,
              updated_at: timestamp
            };

        ctx.db.schedules.set(schedule.id, schedule);
        return schedule;
      });

      v1.get("/dashboard/today", async (request, reply) => {
        const user = getAuthenticatedUser(ctx, request.headers.authorization);
        const query = request.query as { date_local?: string };
        const dateLocal = query.date_local ?? todayLocalISO();

        try {
          return buildDashboard(ctx, user.id, dateLocal);
        } catch (_error) {
          return reply.code(404).send({
            error: {
              code: "NOT_FOUND",
              message: "Active goal required to build dashboard",
              request_id: request.id
            }
          });
        }
      });

      v1.post("/chat", async (request) => {
        const user = getAuthenticatedUser(ctx, request.headers.authorization);
        const body = request.body as {
          thread_id: string;
          message: string;
          client_message_id?: string;
          context_overrides?: Record<string, unknown>;
        };

        const userMessage: ChatMessage = {
          id: randomUUID(),
          user_id: user.id,
          thread_id: body.thread_id,
          role: "user",
          content: body.message,
          created_at: nowIso()
        };
        ctx.db.messages.set(userMessage.id, userMessage);

        const actions: Array<{ type: string; payload: Record<string, unknown> }> = [];
        const lowerMessage = body.message.toLowerCase();

        if (lowerMessage.includes("blocker:")) {
          const blockerText = body.message.split(/blocker:/i)[1]?.trim();
          if (blockerText) {
            const blockerId = randomUUID();
            ctx.db.blockers.set(blockerId, {
              id: blockerId,
              user_id: user.id,
              blocker_text: blockerText,
              severity: "medium",
              created_at: nowIso()
            });
            actions.push({ type: "blocker_created", payload: { id: blockerId } });
          }
        }

        if (lowerMessage.includes("commit:")) {
          const commitmentText = body.message.split(/commit:/i)[1]?.trim();
          if (commitmentText) {
            const commitmentId = randomUUID();
            const dueDate = todayLocalISO();
            ctx.db.commitments.set(commitmentId, {
              id: commitmentId,
              user_id: user.id,
              text: commitmentText,
              due_date_local: dueDate,
              status: "open"
            });
            actions.push({ type: "commitment_created", payload: { id: commitmentId } });
          }
        }

        const assistantMessageText = `Coach: I logged your update. Next step: complete one high-impact habit in your next available window.`;
        const assistantMessage: ChatMessage = {
          id: randomUUID(),
          user_id: user.id,
          thread_id: body.thread_id,
          role: "assistant",
          content: assistantMessageText,
          created_at: nowIso()
        };
        ctx.db.messages.set(assistantMessage.id, assistantMessage);

        ctx.db.rollingSummaryByUserId.set(
          user.id,
          `Last message: ${body.message.slice(0, 140)}${body.message.length > 140 ? "..." : ""}`
        );

        const memoryVersion = Array.from(ctx.db.messages.values()).filter((message) => message.user_id === user.id).length;

        return {
          assistant_message: assistantMessageText,
          thread_id: body.thread_id,
          created_at: assistantMessage.created_at,
          actions_executed: actions,
          memory_snapshot_version: memoryVersion
        };
      });

      v1.get("/weekly-reviews/:week_start", async (request) => {
        const user = getAuthenticatedUser(ctx, request.headers.authorization);
        const params = request.params as { week_start: string };
        const weekStart = getWeekStart(params.week_start);
        const storeKey = keyForWeeklyReview(user.id, weekStart);

        let review = ctx.db.weeklyReviews.get(storeKey);
        if (!review) {
          const activeGoal = getActiveGoal(ctx, user.id);
          const habits = activeGoal ? getHabitsForGoal(ctx, user.id, activeGoal.id) : [];
          const logs = Array.from(ctx.db.habitLogs.values()).filter((entry) => entry.user_id === user.id);
          review = generateWeeklyReview({ userId: user.id, weekStart, habits, logs });
          ctx.db.weeklyReviews.set(storeKey, review);
        }

        return review;
      });

      v1.post("/weekly-reviews/:week_start/approve", async (request) => {
        const user = getAuthenticatedUser(ctx, request.headers.authorization);
        const params = request.params as { week_start: string };
        const body = request.body as { decision: "approve" | "reject"; selected_change_ids?: string[] };
        const weekStart = getWeekStart(params.week_start);
        const storeKey = keyForWeeklyReview(user.id, weekStart);

        let review = ctx.db.weeklyReviews.get(storeKey);
        if (!review) {
          const activeGoal = getActiveGoal(ctx, user.id);
          const habits = activeGoal ? getHabitsForGoal(ctx, user.id, activeGoal.id) : [];
          const logs = Array.from(ctx.db.habitLogs.values()).filter((entry) => entry.user_id === user.id);
          review = generateWeeklyReview({ userId: user.id, weekStart, habits, logs });
        }

        const approved = body.decision === "approve";
        const selected = body.selected_change_ids ?? [];
        const appliedCount = approved
          ? selected.length > 0
            ? selected.length
            : review.pending_plan_changes?.length ?? 0
          : 0;

        review.status = approved ? "approved" : "rejected";
        review.approved_at = approved ? nowIso() : null;
        ctx.db.weeklyReviews.set(storeKey, review);

        return {
          status: approved ? "approved" : "rejected",
          applied_changes_count: appliedCount,
          updated_habits: []
        };
      });

      v1.post("/tools/get-context-pack", async (request, reply) => {
        const apiKey = request.headers["x-tool-api-key"];
        if (apiKey !== ctx.toolApiKey) {
          return reply.code(401).send({
            error: {
              code: "UNAUTHORIZED",
              message: "Invalid tool API key",
              request_id: request.id
            }
          });
        }

        const body = request.body as { user_id: string };
        const user = ctx.db.users.get(body.user_id);
        if (!user) {
          return reply.code(404).send({
            error: {
              code: "NOT_FOUND",
              message: "User not found",
              request_id: request.id
            }
          });
        }

        const goal = getActiveGoal(ctx, user.id);
        if (!goal) {
          return reply.code(404).send({
            error: {
              code: "NOT_FOUND",
              message: "Active goal not found",
              request_id: request.id
            }
          });
        }

        const habits = getHabitsForGoal(ctx, user.id, goal.id);
        const schedules = Array.from(ctx.db.schedules.values()).filter((item) => item.user_id === user.id);
        const dateLocal = todayLocalISO();
        const logs = getLogsForDate(ctx, user.id, dateLocal);
        const weekStart = getWeekStart(dateLocal);
        const review = ctx.db.weeklyReviews.get(keyForWeeklyReview(user.id, weekStart));

        return {
          user: userWithoutPassword(user),
          goal,
          active_plan: {
            habits,
            schedule: schedules
          },
          today_status: {
            date_local: dateLocal,
            completed_habit_ids: logs.filter((log) => log.status === "done").map((log) => log.habit_id),
            missed_habit_ids: logs.filter((log) => log.status === "missed").map((log) => log.habit_id),
            commitments_open: Array.from(ctx.db.commitments.values())
              .filter((item) => item.user_id === user.id && item.status === "open")
              .map((item) => ({
                id: item.id,
                text: item.text,
                due_date_local: item.due_date_local,
                status: item.status
              }))
          },
          summaries: {
            last_call_recap: ctx.db.recapsByUserId.get(user.id) ?? null,
            rolling_summary: ctx.db.rollingSummaryByUserId.get(user.id) ?? null,
            weekly_review_summary: review?.summary ?? null
          },
          memory_profile: ctx.db.memoryProfileByUserId.get(user.id) ?? {},
          context_version: Array.from(ctx.db.messages.values()).filter((message) => message.user_id === user.id).length
        };
      });

      v1.post("/tools/get-today-plan", async (request, reply) => {
        const apiKey = request.headers["x-tool-api-key"];
        if (apiKey !== ctx.toolApiKey) {
          return reply.code(401).send({
            error: {
              code: "UNAUTHORIZED",
              message: "Invalid tool API key",
              request_id: request.id
            }
          });
        }

        const body = request.body as { user_id: string };
        const dateLocal = todayLocalISO();

        try {
          const dashboard = buildDashboard(ctx, body.user_id, dateLocal);
          return {
            date_local: dashboard.date_local,
            habits: dashboard.habits_today,
            commitments: dashboard.commitments
          };
        } catch (_error) {
          return reply.code(404).send({
            error: {
              code: "NOT_FOUND",
              message: "Unable to build today plan",
              request_id: request.id
            }
          });
        }
      });

      v1.post("/tools/log-habit", async (request, reply) => {
        const apiKey = request.headers["x-tool-api-key"];
        if (apiKey !== ctx.toolApiKey) {
          return reply.code(401).send({
            error: {
              code: "UNAUTHORIZED",
              message: "Invalid tool API key",
              request_id: request.id
            }
          });
        }

        const body = request.body as {
          user_id: string;
          habit_id: string;
          date_local: string;
          status: "done" | "partial" | "missed" | "skipped";
          note?: string;
        };

        const log = {
          id: randomUUID(),
          user_id: body.user_id,
          habit_id: body.habit_id,
          date_local: body.date_local,
          status: body.status,
          value: null,
          note: body.note ?? null,
          source: "call_tool" as const,
          created_at: nowIso()
        };
        ctx.db.habitLogs.set(log.id, log);
        return reply.code(201).send(log);
      });

      v1.post("/tools/report-blocker", async (request, reply) => {
        const apiKey = request.headers["x-tool-api-key"];
        if (apiKey !== ctx.toolApiKey) {
          return reply.code(401).send({
            error: {
              code: "UNAUTHORIZED",
              message: "Invalid tool API key",
              request_id: request.id
            }
          });
        }

        const body = request.body as {
          user_id: string;
          blocker_text: string;
          severity?: "low" | "medium" | "high";
        };

        const id = randomUUID();
        ctx.db.blockers.set(id, {
          id,
          user_id: body.user_id,
          blocker_text: body.blocker_text,
          severity: body.severity ?? "medium",
          created_at: nowIso()
        });

        return reply.code(201).send({ id });
      });

      v1.post("/tools/set-commitment", async (request, reply) => {
        const apiKey = request.headers["x-tool-api-key"];
        if (apiKey !== ctx.toolApiKey) {
          return reply.code(401).send({
            error: {
              code: "UNAUTHORIZED",
              message: "Invalid tool API key",
              request_id: request.id
            }
          });
        }

        const body = request.body as { user_id: string; commitment_text: string; due_date_local: string };
        const id = randomUUID();
        ctx.db.commitments.set(id, {
          id,
          user_id: body.user_id,
          text: body.commitment_text,
          due_date_local: body.due_date_local,
          status: "open"
        });

        return reply.code(201).send({ id });
      });

      v1.post("/tools/reschedule", async (request, reply) => {
        const apiKey = request.headers["x-tool-api-key"];
        if (apiKey !== ctx.toolApiKey) {
          return reply.code(401).send({
            error: {
              code: "UNAUTHORIZED",
              message: "Invalid tool API key",
              request_id: request.id
            }
          });
        }

        const body = request.body as { user_id: string; scheduled_at_utc: string; reason?: string };
        const checkinEventId = randomUUID();
        ctx.db.checkinEvents.set(checkinEventId, {
          id: checkinEventId,
          user_id: body.user_id,
          scheduled_at_utc: body.scheduled_at_utc,
          type: "call",
          status: "scheduled",
          attempt_count: 0
        });

        return {
          checkin_event_id: checkinEventId,
          scheduled_at_utc: body.scheduled_at_utc
        };
      });

      v1.post("/webhooks/elevenlabs", async (request, reply) => {
        const signature = request.headers["x-elevenlabs-signature"];
        if (!signature) {
          return reply.code(401).send({
            error: {
              code: "UNAUTHORIZED",
              message: "Missing ElevenLabs signature",
              request_id: request.id
            }
          });
        }

        const body = request.body as {
          event_type: "call.completed" | "call.failed" | "call.no_answer";
          call_id: string;
          payload: {
            user_id: string;
            checkin_event_id: string;
            started_at?: string;
            ended_at?: string;
            transcript?: string;
            analysis?: {
              completed_habits?: string[];
              missed_habits?: string[];
              blockers?: string[];
              commitments?: string[];
              recap_text?: string;
            };
          };
        };

        const sessionId = randomUUID();
        const startedAt = body.payload.started_at ?? nowIso();
        const endedAt = body.payload.ended_at ?? nowIso();

        ctx.db.callSessions.set(sessionId, {
          id: sessionId,
          user_id: body.payload.user_id,
          checkin_event_id: body.payload.checkin_event_id,
          status:
            body.event_type === "call.completed" ? "completed" : body.event_type === "call.no_answer" ? "no_answer" : "failed",
          started_at: startedAt,
          ended_at: endedAt,
          transcript: body.payload.transcript ?? ""
        });

        const recapText = body.payload.analysis?.recap_text ?? "Call completed. No recap provided by upstream analysis.";
        ctx.db.callOutcomes.set(sessionId, {
          call_session_id: sessionId,
          completed_habits: body.payload.analysis?.completed_habits ?? [],
          missed_habits: body.payload.analysis?.missed_habits ?? [],
          blockers: body.payload.analysis?.blockers ?? [],
          commitments: body.payload.analysis?.commitments ?? [],
          recap_text: recapText
        });

        ctx.db.recapsByUserId.set(body.payload.user_id, recapText);

        const recapMessage: ChatMessage = {
          id: randomUUID(),
          user_id: body.payload.user_id,
          thread_id: randomUUID(),
          role: "assistant",
          content: `Recap of our call: ${recapText}`,
          created_at: nowIso()
        };
        ctx.db.messages.set(recapMessage.id, recapMessage);

        return reply.code(202).send();
      });

      v1.post("/webhooks/twilio", async (request, reply) => {
        const signature = request.headers["x-twilio-signature"];
        if (!signature) {
          return reply.code(401).send({
            error: {
              code: "UNAUTHORIZED",
              message: "Missing Twilio signature",
              request_id: request.id
            }
          });
        }

        app.log.info({ body: request.body }, "Twilio webhook received");
        return reply.code(202).send();
      });
    },
    { prefix: "/v1" }
  );

  return app;
}
