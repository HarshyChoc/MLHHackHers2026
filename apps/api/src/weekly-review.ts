import type { Habit, WeeklyReview, WeeklyHabitStat } from "@goalcoach/shared";
import type { HabitLog } from "./types.js";

const ONE_DAY_MS = 1000 * 60 * 60 * 24;

export function getWeekStart(inputDate: string): string {
  const date = new Date(`${inputDate}T00:00:00.000Z`);
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + diff);
  return date.toISOString().slice(0, 10);
}

function targetCountForHabit(habit: Habit): number {
  const cadence = String((habit.frequency as { cadence?: string }).cadence ?? "daily");
  if (cadence === "daily") {
    return 7;
  }
  if (cadence === "weekdays") {
    return 5;
  }
  if (cadence === "x_per_week") {
    const value = Number((habit.frequency as { times_per_week?: number }).times_per_week ?? 3);
    return Number.isFinite(value) ? Math.min(14, Math.max(1, value)) : 3;
  }
  if (cadence === "specific_days") {
    const days = (habit.frequency as { days_of_week?: number[] }).days_of_week ?? [];
    return Math.max(1, Math.min(7, days.length));
  }
  return 5;
}

function recommendationForRate(rate: number): WeeklyHabitStat["recommendation"] {
  if (rate >= 0.85) {
    return "increase";
  }
  if (rate < 0.5) {
    return "simplify";
  }
  return "keep";
}

export function generateWeeklyReview(params: {
  userId: string;
  weekStart: string;
  habits: Habit[];
  logs: HabitLog[];
}): WeeklyReview {
  const weekStartDate = new Date(`${params.weekStart}T00:00:00.000Z`);
  const weekEndDate = new Date(weekStartDate.getTime() + 6 * ONE_DAY_MS);

  const logsInWeek = params.logs.filter((log) => {
    const logDate = new Date(`${log.date_local}T00:00:00.000Z`);
    return logDate >= weekStartDate && logDate <= weekEndDate;
  });

  const completion_stats = params.habits.map((habit) => {
    const target_count = targetCountForHabit(habit);
    const done_count = logsInWeek.filter((log) => log.habit_id === habit.id && log.status === "done").length;
    const completion_rate = target_count > 0 ? Math.min(1, done_count / target_count) : 0;
    return {
      habit_id: habit.id,
      title: habit.title,
      completion_rate,
      done_count,
      target_count,
      recommendation: recommendationForRate(completion_rate)
    };
  });

  const wins = completion_stats
    .filter((stat) => stat.completion_rate >= 0.85)
    .map((stat) => `${stat.title}: strong consistency (${Math.round(stat.completion_rate * 100)}%)`);

  const misses = completion_stats
    .filter((stat) => stat.completion_rate < 0.5)
    .map((stat) => `${stat.title}: below target (${Math.round(stat.completion_rate * 100)}%)`);

  const blockers = misses.length > 0 ? ["Timing friction or competing priorities impacted execution."] : [];

  const fixes = completion_stats.map((stat) => {
    if (stat.recommendation === "increase") {
      return `${stat.title}: increase difficulty by 10-20% or add one tiny progression`;
    }
    if (stat.recommendation === "simplify") {
      return `${stat.title}: reduce difficulty and simplify execution window`;
    }
    return `${stat.title}: keep current load, optimize timing`;
  });

  return {
    user_id: params.userId,
    week_start_date: params.weekStart,
    completion_stats,
    wins,
    misses,
    blockers,
    fixes,
    summary: "Weekly review generated from observed habit logs.",
    week_focus: misses.length > 0 ? "Remove friction and protect execution windows." : "Sustain momentum and increase challenge slightly.",
    pending_plan_changes: completion_stats.map((stat) => ({
      change_type: stat.recommendation === "increase" ? "habit_update" : stat.recommendation === "simplify" ? "habit_update" : "schedule_update",
      target_id: stat.habit_id,
      summary:
        stat.recommendation === "increase"
          ? `Increase ${stat.title} difficulty by one step.`
          : stat.recommendation === "simplify"
            ? `Simplify ${stat.title} cadence or reduce friction.`
            : `Keep ${stat.title}, but tweak execution timing.`,
      patch: {
        recommendation: stat.recommendation
      }
    })),
    status: "pending_approval",
    generated_at: new Date().toISOString(),
    approved_at: null
  };
}
