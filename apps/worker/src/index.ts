import { Queue, Worker, Job, QueueEvents } from "bullmq";
import IORedis from "ioredis";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:8000/v1";
const toolApiKey = process.env.TOOL_API_KEY ?? "dev-tool-api-key";

const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null
});

const CHECKIN_QUEUE = "checkin";
const REVIEW_QUEUE = "weekly-review";

type PlaceCallJob = {
  checkin_event_id: string;
  user_id: string;
  scheduled_at_utc: string;
};

type RetryCallJob = {
  checkin_event_id: string;
  user_id: string;
  retry_delay_minutes: number;
};

type WeeklyReviewGenerateJob = {
  user_id: string;
  week_start: string;
};

const checkinQueue = new Queue<PlaceCallJob | RetryCallJob>(CHECKIN_QUEUE, { connection });
const reviewQueue = new Queue<WeeklyReviewGenerateJob>(REVIEW_QUEUE, { connection });
new QueueEvents(CHECKIN_QUEUE, { connection });
new QueueEvents(REVIEW_QUEUE, { connection });

async function checkinTick(): Promise<void> {
  // TODO: replace with DB query for due checkin_events.
  console.log("[checkin_tick] polling for due check-ins");
}

async function placeCall(job: Job<PlaceCallJob>): Promise<void> {
  console.log("[place_call]", job.data);
  // TODO: call ElevenLabs/Twilio integration service to start outbound call.
  // Suggested flow:
  // 1) POST to internal API orchestration endpoint
  // 2) update checkin_event status
  // 3) enqueue retry on no answer
}

async function callRetry(job: Job<RetryCallJob>): Promise<void> {
  console.log("[call_retry]", job.data);
  const delayMs = job.data.retry_delay_minutes * 60 * 1000;

  await checkinQueue.add(
    "place_call",
    {
      checkin_event_id: job.data.checkin_event_id,
      user_id: job.data.user_id,
      scheduled_at_utc: new Date(Date.now() + delayMs).toISOString()
    },
    {
      delay: delayMs,
      attempts: 1
    }
  );
}

async function weeklyReviewGenerate(job: Job<WeeklyReviewGenerateJob>): Promise<void> {
  console.log("[weekly_review_generate]", job.data);
  const endpoint = `${apiBaseUrl}/weekly-reviews/${job.data.week_start}`;

  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      Authorization: `Bearer dev-access::${job.data.user_id}`,
      "x-tool-api-key": toolApiKey
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to generate weekly review (${response.status}): ${text}`);
  }
}

async function start(): Promise<void> {
  const checkinWorker = new Worker<PlaceCallJob | RetryCallJob>(
    CHECKIN_QUEUE,
    async (job) => {
      if (job.name === "place_call") {
        return placeCall(job as Job<PlaceCallJob>);
      }
      if (job.name === "call_retry") {
        return callRetry(job as Job<RetryCallJob>);
      }
      throw new Error(`Unknown job: ${job.name}`);
    },
    { connection }
  );

  const reviewWorker = new Worker<WeeklyReviewGenerateJob>(
    REVIEW_QUEUE,
    async (job) => {
      if (job.name !== "weekly_review_generate") {
        throw new Error(`Unknown job: ${job.name}`);
      }
      return weeklyReviewGenerate(job);
    },
    { connection }
  );

  setInterval(() => {
    void checkinTick();
  }, 60_000);

  console.log("Worker started");

  const shutdown = async () => {
    await Promise.all([
      checkinWorker.close(),
      reviewWorker.close(),
      checkinQueue.close(),
      reviewQueue.close(),
      connection.quit()
    ]);
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());
}

void start();
