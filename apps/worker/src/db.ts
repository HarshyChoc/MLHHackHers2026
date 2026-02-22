import pg from "pg";

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/goalcoach";
const useSsl = /sslmode=|supabase\.(co|com)/i.test(databaseUrl);
const rejectUnauthorized =
  (process.env.DATABASE_SSL_REJECT_UNAUTHORIZED ??
    (databaseUrl.includes("pooler.supabase.com") ? "false" : "true")) !== "false";
const poolMax = Number(process.env.WORKER_DATABASE_POOL_MAX ?? process.env.DATABASE_POOL_MAX ?? 2);

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: useSsl ? { rejectUnauthorized } : undefined,
  max: Number.isFinite(poolMax) ? Math.max(1, Math.min(10, Math.trunc(poolMax))) : 2,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000
});

type CheckinRow = {
  id: string;
  user_id: string;
  scheduled_at_utc: string;
  attempt_count: number;
};

type CallScheduleTemplateRow = {
  user_id: string;
  timezone: string;
  windows: Array<Record<string, unknown>>;
};

function addDays(dateInput: string, days: number): string {
  const d = new Date(`${dateInput}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function dateInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function dayOfWeek(dateInput: string): number {
  return new Date(`${dateInput}T00:00:00Z`).getUTCDay();
}

function pickExactTime(windowObj: Record<string, unknown>): string | null {
  const timeLocal = typeof windowObj.time_local === "string" ? windowObj.time_local : null;
  if (timeLocal && /^\d{2}:\d{2}$/.test(timeLocal)) return timeLocal;
  const startLocal = typeof windowObj.start_local === "string" ? windowObj.start_local : null;
  if (startLocal && /^\d{2}:\d{2}$/.test(startLocal)) return startLocal;
  return null;
}

async function toUtcIsoFromLocal(dateLocal: string, timeLocal: string, timeZone: string): Promise<string | null> {
  const row = await pool.query<{ ts: string }>(
    `select (($1 || ' ' || $2)::timestamp at time zone $3)::text as ts`,
    [dateLocal, timeLocal, timeZone]
  );
  const ts = row.rows[0]?.ts;
  if (!ts) return null;
  const parsed = new Date(ts);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

async function createCheckinEventIfMissing(params: {
  userId: string;
  scheduledAtUtc: string;
  type?: "call" | "chat";
}): Promise<boolean> {
  const result = await pool.query<{ inserted: boolean }>(
    `insert into checkin_events (user_id, scheduled_at_utc, type, status, attempt_count)
     select $1, $2::timestamptz, $3, 'scheduled', 0
     where not exists (
       select 1
       from checkin_events
       where user_id = $1
         and type = $3
         and scheduled_at_utc = $2::timestamptz
     )
     returning true as inserted`,
    [params.userId, params.scheduledAtUtc, params.type ?? "call"]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function materializeUpcomingCallCheckins(daysAhead = 14): Promise<number> {
  const rows = await pool.query<CallScheduleTemplateRow>(
    `select s.user_id, u.timezone, s.windows
     from schedules s
     join users u on u.id = s.user_id
     where s.type = 'call'`
  );

  let inserted = 0;
  const now = Date.now();

  for (const row of rows.rows) {
    const userTimezone = row.timezone || "UTC";
    const localToday = dateInTimeZone(new Date(), userTimezone);
    const windows = Array.isArray(row.windows) ? row.windows : [];

    for (const windowObj of windows) {
      if (!windowObj || typeof windowObj !== "object") continue;
      const exactTime = pickExactTime(windowObj);
      if (!exactTime) continue;

      const daysRaw = Array.isArray((windowObj as { days_of_week?: unknown }).days_of_week)
        ? ((windowObj as { days_of_week: unknown[] }).days_of_week as unknown[])
        : null;
      const allowedDays = new Set(
        (daysRaw ?? [0, 1, 2, 3, 4, 5, 6])
          .map((v) => Number(v))
          .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6)
      );

      for (let offset = 0; offset <= daysAhead; offset += 1) {
        const candidateLocalDate = addDays(localToday, offset);
        if (!allowedDays.has(dayOfWeek(candidateLocalDate))) continue;

        const utcIso = await toUtcIsoFromLocal(candidateLocalDate, exactTime, userTimezone);
        if (!utcIso) continue;
        if (new Date(utcIso).getTime() <= now) continue;

        const didInsert = await createCheckinEventIfMissing({
          userId: row.user_id,
          scheduledAtUtc: utcIso,
          type: "call"
        });
        if (didInsert) inserted += 1;
      }
    }
  }

  return inserted;
}

export async function claimDueCheckins(limit: number): Promise<CheckinRow[]> {
  const result = await pool.query<CheckinRow>(
    `with candidates as (
      select id
      from checkin_events
      where type = 'call'
        and status = 'scheduled'
        and scheduled_at_utc <= now()
      order by scheduled_at_utc asc
      limit $1
      for update skip locked
    )
    update checkin_events ce
    set status = 'in_progress',
        updated_at = now()
    from candidates
    where ce.id = candidates.id
    returning ce.id, ce.user_id, ce.scheduled_at_utc::text, ce.attempt_count`,
    [limit]
  );

  return result.rows;
}

export async function getCallRetryPolicy(userId: string): Promise<{ max_attempts: number; retry_delay_minutes: number }> {
  const result = await pool.query<{ retry_policy: Record<string, unknown> | null }>(
    `select retry_policy
     from schedules
     where user_id = $1 and type = 'call'
     limit 1`,
    [userId]
  );

  const policy = result.rows[0]?.retry_policy ?? null;
  const maxAttemptsRaw = Number((policy as { max_attempts?: number } | null)?.max_attempts ?? 1);
  const retryDelayRaw = Number((policy as { retry_delay_minutes?: number } | null)?.retry_delay_minutes ?? 15);

  return {
    max_attempts: Number.isFinite(maxAttemptsRaw) ? Math.max(0, Math.min(5, maxAttemptsRaw)) : 1,
    retry_delay_minutes: Number.isFinite(retryDelayRaw) ? Math.max(1, Math.min(240, retryDelayRaw)) : 15
  };
}

export async function getUserCallablePhone(userId: string): Promise<string | null> {
  const result = await pool.query<{ phone_e164: string | null; phone_verified: boolean }>(
    `select phone_e164, phone_verified
     from users
     where id = $1
     limit 1`,
    [userId]
  );

  const row = result.rows[0];
  if (!row || !row.phone_verified || !row.phone_e164) {
    return null;
  }

  return row.phone_e164;
}

export async function markCheckinDispatched(params: {
  checkinEventId: string;
  attemptCount: number;
  providerCallId: string;
}): Promise<void> {
  await pool.query(
    `update checkin_events
     set attempt_count = $2,
         provider_call_id = $3,
         updated_at = now()
     where id = $1`,
    [params.checkinEventId, params.attemptCount, params.providerCallId]
  );
}

export async function markCheckinRetry(params: {
  checkinEventId: string;
  attemptCount: number;
  scheduledAtUtc: string;
}): Promise<void> {
  await pool.query(
    `update checkin_events
     set status = 'scheduled',
         attempt_count = $2,
         scheduled_at_utc = $3,
         updated_at = now()
     where id = $1`,
    [params.checkinEventId, params.attemptCount, params.scheduledAtUtc]
  );
}

export async function markCheckinFailed(params: {
  checkinEventId: string;
  attemptCount: number;
}): Promise<void> {
  await pool.query(
    `update checkin_events
     set status = 'failed',
         attempt_count = $2,
         updated_at = now()
     where id = $1`,
    [params.checkinEventId, params.attemptCount]
  );
}

export async function markCheckinCompleted(params: {
  checkinEventId: string;
  attemptCount: number;
}): Promise<void> {
  await pool.query(
    `update checkin_events
     set status = 'completed',
         attempt_count = $2,
         updated_at = now()
     where id = $1`,
    [params.checkinEventId, params.attemptCount]
  );
}

export async function closeWorkerDb(): Promise<void> {
  await pool.end();
}
