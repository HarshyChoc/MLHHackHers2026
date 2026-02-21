# Goal Coach (Contract-First Scaffold)

This repository now contains a build scaffold that follows `docs/api-contract.openapi.yaml` without modifying the contract.

## Stack (initial)

- Web: Next.js (`apps/web`)
- API + Orchestrator: Fastify + TypeScript (`apps/api`)
- Worker + Scheduler: BullMQ + Redis (`apps/worker`)
- Shared types: `packages/shared`
- Database schema: Postgres SQL in `db/schema.sql`

## What is implemented

- All v1 API routes listed in the contract are wired in `apps/api/src/app.ts`.
- Tool endpoints and webhook endpoints are included.
- In-memory persistence is used for fast iteration.
- Weekly review generation logic is included in `apps/api/src/weekly-review.ts`.
- Minimal frontend workbench exists at `apps/web/src/app/workbench/page.tsx`.
- Worker job skeleton includes `checkin_tick`, `place_call`, `call_retry`, and `weekly_review_generate`.

## Local run

1. Install dependencies:
   - `npm install`
2. Start API:
   - `npm run dev:api`
3. Start web app:
   - `npm run dev:web`
4. Start worker (requires Redis):
   - `npm run dev:worker`

## Notes

- API base URL defaults to `http://localhost:8000/v1`.
- Tool key defaults to `dev-tool-api-key`.
- The OpenAPI contract file is unchanged. Any contract-level changes should be discussed first.
