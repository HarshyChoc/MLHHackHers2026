import { createApp } from "./app.js";

const port = Number(process.env.API_PORT ?? 8000);
const host = process.env.API_HOST ?? "0.0.0.0";

async function start() {
  const app = createApp();

  try {
    await app.listen({ port, host });
    app.log.info(`API listening on http://${host}:${port}`);
  } catch (error) {
    app.log.error(error, "Failed to start API service");
    process.exit(1);
  }
}

void start();
