# Lane: Implementation Roadmap & Execution Plan

Lane is an open-source gateway in front of Amazon Bedrock that routes prompts to the cheapest model that can answer it using Fastino GLiDE decisions.

## Milestones & Execution Checklist

- [ ] **Milestone 1: Backend Core (`backend/`)**
  - [ ] Initialize `backend/package.json` with Express, `@vendia/serverless-express`, `@aws-sdk/client-bedrock-runtime`, `@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`, `zod`, `dotenv`, `cors`, `jsonwebtoken`.
  - [ ] Create `config/tiers.json` and `config/tiers.js` (Nova Micro, Claude Haiku, Claude Sonnet, pricing per 1M tokens).
  - [ ] Implement `services/fastino.js` (GLiDE System One adapter calling `POST /v1/systemone` with choice question for lanes).
  - [ ] Implement `services/pricing.js` (exact cost accounting for actual vs baseline strong tier).
  - [ ] Implement `services/bedrock.js` (Converse API service with retry/escalation from cheap to mid).
  - [ ] Implement `middleware/` (CORS, envelope response formatter, error handler, rate limiter).
  - [ ] Implement `routes/completions.js` (`POST /api/v1/completions`).
  - [ ] Implement `routes/config.js` (`GET /api/v1/config`).
  - [ ] Implement `routes/health.js` (`GET /api/health`).
  - [ ] Setup dual-mode entry: `src/local.js` (local Express server) and `src/handler.js` (Lambda handler).
  - [ ] Add unit tests with mock services.
  - [ ] *Git Micro-commits for each component.*

- [ ] **Milestone 2: Storage, Caching & Dashboard API**
  - [ ] Implement `services/dynamo.js` (DynamoDB document client with fallback in-memory cache for offline dev).
  - [ ] Implement `services/cache.js` (SHA-256 prompt normalization, TTL check, zero-cost hit).
  - [ ] Implement `services/logger.js` (request logging with decision metadata).
  - [ ] Implement `routes/requests.js` (`GET /api/v1/requests`, `GET /api/v1/requests/:id`).
  - [ ] Implement `routes/stats.js` (`GET /api/v1/stats` aggregating spend, savings, lane split).
  - [ ] Implement `routes/auth.js` (`POST /api/v1/auth/login`).
  - [ ] *Git Micro-commits.*

- [ ] **Milestone 3: Infrastructure as Code (`infra/`)**
  - [ ] Write `infra/template.yaml` (AWS SAM template).
  - [ ] Define API Gateway REST API with CORS.
  - [ ] Define Lambda Function (`LaneGatewayFunction`) with environment variables & timeout.
  - [ ] Define DynamoDB tables (`LaneRequests`, `LaneCache`, `LaneApiKeys`).
  - [ ] Define least-privilege IAM policies for Bedrock Converse and DynamoDB.
  - [ ] Validate with `sam validate`.
  - [ ] *Git Micro-commits.*

- [ ] **Milestone 4: Benchmark Suite (`bench/`)**
  - [ ] Create `bench/prompts.json` (100 prompts across 5 categories: greetings/FAQs, rewrites, summaries, reasoning, code).
  - [ ] Create `bench/run.js` (evaluates router vs always-strong baseline, hand-checks savings & quality).
  - [ ] *Git Micro-commits.*

- [ ] **Milestone 5 & 6: Showcase-Grade Frontend (`frontend/`)**
  - [ ] Initialize React + Vite + Tailwind v4.
  - [ ] Configure custom design tokens: concrete (`#E6E9EE`), paper (`#F7F8FA`), ink (`#0E1B3D`), paint (`#FFC400`), tide (`#00B39A`), signal (`#2340FF`), Archivo font.
  - [ ] Build API client with mock mode toggle (`src/lib/apiClient.js`).
  - [ ] Build Hero with interactive Router Playground:
    - Animated prompt travel along SVG path into gateway.
    - GLiDE decision pause, lane peel into cheap/mid/strong.
    - Live cost counter vs baseline counter.
  - [ ] Build Prompt Journey scrub/step visualizer.
  - [ ] Build Dashboard (`/app`):
    - "Saved this week" headline numeral.
    - Spend over time chart with paint-yellow savings gap.
    - Lane-split progress bar.
    - Expandable request log table showing GLiDE reasoning and cost breakdown.
  - [ ] Responsive design & accessibility tests.
  - [ ] *Git Micro-commits.*

- [ ] **Milestone 7: Launch Polish & Documentation**
  - [ ] Comprehensive README.md with architecture diagram, local quickstart, SAM deployment commands, and benchmark results.
  - [ ] Verification audit across backend, tests, frontend, and SAM templates.
