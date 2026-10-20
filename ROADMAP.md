# Lane: Implementation Roadmap & Execution Plan

Lane is an open-source gateway in front of Amazon Bedrock that routes prompts to the cheapest model that can answer it using Fastino GLiDE decisions.

## Milestones & Execution Checklist

- [x] **Milestone 1: Backend Core (`backend/`)**
  - [x] Initialize `backend/package.json` with Express, `@vendia/serverless-express`, `@aws-sdk/client-bedrock-runtime`, `@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`, `zod`, `dotenv`, `cors`, `jsonwebtoken`.
  - [x] Create `config/tiers.json` and `config/tiers.js` (Nova Micro, Claude Haiku 4.5, Claude Sonnet 4.5, pricing per 1M tokens).
  - [x] Implement `services/fastino.js` (GLiDE System One adapter calling `POST /v1/systemone` with choice question for lanes).
  - [x] Implement `services/pricing.js` (exact cost accounting for actual vs baseline strong tier).
  - [x] Implement `services/bedrock.js` (Converse API service with retry/escalation from cheap to mid and Nova Pro fallback).
  - [x] Implement `middleware/` (CORS, envelope response formatter, error handler, rate limiter).
  - [x] Implement `routes/completions.js` (`POST /api/v1/completions`).
  - [x] Implement `routes/config.js` (`GET /api/v1/config`).
  - [x] Implement `routes/health.js` (`GET /api/health`).
  - [x] Setup dual-mode entry: `src/local.js` (local Express server) and `src/handler.js` (Lambda handler).
  - [x] Add unit and integration tests with mock and live services (15 tests passing).
  - [x] *Git Micro-commits for each component.*

- [x] **Milestone 2: Storage, Caching & Dashboard API**
  - [x] Implement `services/storage.js` (DynamoDB document client with fallback in-memory cache for offline dev).
  - [x] Implement `services/cache.js` (SHA-256 prompt normalization, TTL check, zero-cost hit).
  - [x] Implement request logging with decision metadata.
  - [x] Implement `routes/requests.js` (`GET /api/v1/requests`, `GET /api/v1/requests/:id`).
  - [x] Implement `routes/stats.js` (`GET /api/v1/stats` aggregating spend, savings, lane split).
  - [x] Implement `routes/auth.js` (`POST /api/v1/auth/login`).
  - [x] Hand-calculated cost accounting verification tests.
  - [x] *Git Micro-commits.*

- [x] **Milestone 3: Infrastructure as Code (`infra/`)**
  - [x] Write `infra/template.yaml` (AWS SAM template).
  - [x] Define API Gateway REST API with CORS.
  - [x] Define Lambda Function (`LaneGatewayFunction`) with environment variables & timeout.
  - [x] Define DynamoDB tables (`LaneRequestsTable`, `LaneCacheTable`, `LaneApiKeysTable`).
  - [x] Define least-privilege IAM policies for Bedrock Converse and DynamoDB.
  - [x] Validate with `sam validate` (Template is 100% valid).
  - [x] *Git Micro-commits.*

- [x] **Milestone 4: Benchmark Suite (`bench/`)**
  - [x] Create `bench/prompts.json` (100 prompts across 5 categories: greetings/FAQs, rewrites, summaries, reasoning, code).
  - [x] Create `bench/run.js` (evaluates router vs always-strong baseline, hand-checks savings & quality).
  - [x] *Git Micro-commits.*

- [x] **Milestone 5 & 6: Showcase-Grade Frontend (`frontend/`)**
  - [x] Initialize React + Vite + Tailwind v4.
  - [x] Configure custom design tokens: concrete (`#E6E9EE`), paper (`#F7F8FA`), ink (`#0E1B3D`), paint (`#FFC400`), tide (`#00B39A`), signal (`#2340FF`), Archivo variable font.
  - [x] Build API client with mock mode toggle (`src/lib/apiClient.js`).
  - [x] Build Hero with interactive Router Playground:
    - Animated prompt travel along SVG path into gateway.
    - GLiDE decision pause, lane peel into cheap/mid/strong.
    - Live cost counter vs baseline counter.
  - [x] Build Prompt Journey scrub/step visualizer.
  - [x] Build Dashboard (`/app`):
    - "Saved this week" headline numeral.
    - Hand-built SVG spend over time chart with paint-yellow savings gap.
    - Inline labeled lane-split progress bar.
    - Expandable request log table showing GLiDE reasoning and cost breakdown.
  - [x] Build Documentation view with technical specs and one-line copy curl.
  - [x] Verify production bundle with `npm run build` (Clean 744ms Vite build, under 200KB bundle).
  - [x] *Git Micro-commits.*

- [x] **Milestone 7: Launch Polish & Documentation**
  - [x] Comprehensive `README.md` with architecture diagram, local quickstart, SAM deployment commands, and benchmark results.
  - [x] Verification audit across backend, tests, frontend, and SAM templates.
