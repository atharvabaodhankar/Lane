# Lane: system design

> Working name. An open-source gateway that sits in front of Amazon Bedrock and sends every prompt to the cheapest model that can answer it. A small, fast Fastino GLiDE call makes the routing decision.

Status: draft v0.1
Owner: Atharva Baodhankar

---

## 1. Overview

### The problem
Most apps call one big model for everything. A greeting, a one-line rewrite and a hard reasoning task all get billed at the same top-tier rate.

### The idea
Put a gateway between the app and Bedrock. For each prompt, the gateway decides which lane it belongs in:

| Lane | Used for | Example models (verify in your region) |
|---|---|---|
| cheap | short Q&A, classification, rewrites | Amazon Nova Micro / Lite |
| mid | normal chat, RAG answers, summaries | Claude Haiku 4.5, Amazon Nova Pro |
| strong | hard reasoning, code, long documents | Claude Sonnet 4.5 / 4.6 |
| reject | PII leaks, abuse, empty or malformed input | none (no model call) |

A cache sits in front of all lanes and answers repeat prompts for free.

### Goals
- Cut Bedrock spend on a mixed workload with a quality drop small enough to measure and publish.
- One-line adoption: change the base URL, keep the rest of the app.
- Every decision is visible: which lane, why, what it cost, what it would have cost on the strong lane.
- Deploy to any AWS account with one command (`sam deploy`).
- A showcase-grade UI: landing page with a live router playground, plus a dashboard.

### Non-goals (v1)
- Streaming responses (planned for v2, see section 12).
- Multi-provider routing outside Bedrock.
- Semantic cache (v1 is exact-match only).
- Billing or multi-tenant accounts for outside users.
- Competing with LiteLLM or OpenRouter on breadth. The angle is a small decision model, a cache, a reject lane and a clear UI.

---

## 2. Architecture

```
 client app
     │  POST /api/v1/completions   (API key)
     ▼
┌─────────────────┐
│  API Gateway    │  usage plan, API key, throttling
└────────┬────────┘
         ▼
┌──────────────────────────────────────────────────────────┐
│  Lambda (Node.js, Express via serverless-express)         │
│                                                           │
│  1  validate (Zod) + idempotency check                    │
│  2  cache lookup ────────────► DynamoDB: cache  (hit → done)│
│  3  PII scan  (GLiNER) ─────► reject lane if blocked      │
│  4  decide    (GLiDE)  ─────► cheap | mid | strong | reject│
│  5  invoke    Bedrock Converse API with the chosen model  │
│  6  escalate once if the answer fails sanity checks       │
│  7  write cache + request log ─► DynamoDB                 │
└──────────────────────────────────────────────────────────┘
         │                         │
         ▼                         ▼
   Amazon Bedrock            Fastino API (GLiNER, GLiDE)

 dashboard (React, Vite)  ──GET /api/v1/stats, /requests──►  same Lambda
```

### Request flow in plain words
1. The client sends a prompt with an API key.
2. If the same prompt (normalized) was answered recently, return the cached answer. Cost is zero.
3. Optionally scan the prompt for PII and secrets with GLiNER. If found, reject or redact.
4. Ask GLiDE which lane fits. If GLiDE is slow or down, fall back to `mid` and log the fallback.
5. Call Bedrock with that lane's model.
6. If a cheap-lane answer is empty or a refusal, retry once on `mid`. Log the escalation.
7. Store the answer in the cache, log tokens, cost and latency, and return the response.

### Why Lambda
- No server to run, near-zero cost when idle, easy for others to deploy into their own account.
- Limit to know: API Gateway REST has a default 29-second integration timeout, so cap `maxTokens` and keep v1 non-streaming. Streaming needs a Lambda Function URL with response streaming (v2).

---

## 3. Components

| Component | Choice | Notes |
|---|---|---|
| Runtime | Node.js on Lambda | matches the rest of your stack |
| HTTP layer | Express + `@vendia/serverless-express` | `corsMiddleware` first, `ALLOWED_ORIGINS` from env |
| Validation | Zod | every input validated before any service call |
| Router brain | Fastino GLiDE | behind an adapter, see section 5 |
| PII scan | Fastino GLiNER | optional, behind the same adapter |
| Models | Bedrock Converse API | one code path for every model |
| Cache and logs | DynamoDB | on-demand billing |
| Secrets | AWS Secrets Manager (prod) / `.env` (local) | never in source |
| IaC | AWS SAM | `sam build && sam deploy --guided` |
| Frontend | React + Vite + Tailwind v4 | see section 11 |

---

## 4. Model tiers config

Model IDs and prices live in one config file, never hardcoded in logic. Models get retired and regional availability differs, so check the Bedrock console's model access page and the AWS pricing page for your region before you fill this in.

```json
{
  "region": "us-east-1",
  "tiers": {
    "cheap":  { "modelId": "<fill from console>", "inputPer1M": 0, "outputPer1M": 0, "maxTokens": 512 },
    "mid":    { "modelId": "anthropic.claude-haiku-4-5-20251001-v1:0", "inputPer1M": 0, "outputPer1M": 0, "maxTokens": 1024 },
    "strong": { "modelId": "<fill from console>", "inputPer1M": 0, "outputPer1M": 0, "maxTokens": 2048 }
  },
  "baselineTier": "strong",
  "fallbackTier": "mid",
  "cacheTtlSeconds": 86400
}
```

Rules:
- Use cross-region inference profile IDs (`us.`, `apac.`, `global.` prefixes) where a model needs one.
- Prices are filled from the AWS pricing page and dated in a comment. The dashboard shows the "prices as of" date.
- Swapping a model is a config change, not a code change.

---

## 5. Routing contract

### Adapter interface
GLiDE and GLiNER sit behind one internal interface so the rest of the code never touches vendor details. Confirm the exact request and response shape from the Fastino docs before writing the adapter.

```ts
interface Decision {
  lane: "cheap" | "mid" | "strong" | "reject";
  confidence: number;      // 0 to 1
  reason: string;          // one sentence, shown in the dashboard
  source: "glide" | "fallback";
  latencyMs: number;
}

decide(prompt: string, context?: { hasSystemPrompt: boolean; tokenEstimate: number }): Promise<Decision>
scanPii(prompt: string): Promise<{ found: boolean; entities: { type: string; text: string }[] }>
```

### Decision rules
- GLiDE returns the lane. The label set is fixed: `cheap`, `mid`, `strong`, `reject`.
- Confidence below a threshold (config, start at 0.6) bumps the prompt up one lane. Wrong-cheap costs quality, wrong-strong only costs money.
- GLiDE timeout (config, start at 800 ms) or error: use `fallbackTier`, mark `source: "fallback"`.
- Prompts over a token threshold skip the cheap lane.

### Escalation checks (cheap lane only, one retry to `mid`)
- Empty answer.
- Stop reason indicates truncation on a short-answer task.
- Answer matches a refusal pattern.

---

## 6. API design

Follows the contract rules: versioned from day one, plural nouns, camelCase, string IDs, one response envelope.

### Envelope (every response)
```json
{ "success": true, "data": {}, "error": null, "meta": {} }
```
Errors use `{ "success": false, "data": null, "error": "message" }` with the matching HTTP status.

### Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | infrastructure check, unversioned |
| POST | `/api/v1/completions` | send a prompt, get an answer and the routing metadata |
| GET | `/api/v1/requests` | cursor-paginated request log |
| GET | `/api/v1/requests/:id` | one request with decision details |
| GET | `/api/v1/stats` | spend, savings, lane split for a date range |
| GET | `/api/v1/config` | active tiers and the prices-as-of date (read-only) |
| POST | `/api/v1/auth/login` | dashboard login, returns a JWT |

### `POST /api/v1/completions`

Request:
```json
{
  "messages": [{ "role": "user", "content": "Summarize this in one line: ..." }],
  "system": "optional system prompt",
  "maxTokens": 512,
  "forceLane": null
}
```
Headers: `x-api-key`, optional `Idempotency-Key`.

Response:
```json
{
  "success": true,
  "data": {
    "id": "req_01H...",
    "answer": "...",
    "lane": "cheap",
    "modelId": "...",
    "cacheHit": false,
    "escalated": false,
    "usage": { "inputTokens": 42, "outputTokens": 61 },
    "cost": "0.0000112",
    "baselineCost": "0.0004800",
    "savings": "0.0004688",
    "latencyMs": 640,
    "decision": { "confidence": 0.91, "reason": "Short factual rewrite, no reasoning needed.", "source": "glide" }
  },
  "error": null
}
```
Costs are strings to avoid float drift.

### Status codes
200 ok, 400 validation failed, 401 missing or bad key, 422 rejected by the reject lane (with the reason), 429 rate limited (with `retryAfter`), 502 Bedrock or Fastino failure after fallback, 500 unexpected.

### Safety rules
- Rate limiting on every route, stricter on `/auth` and `/completions`.
- Idempotency keys on `POST /completions` so retries do not double-bill.
- Never return internals in error messages.

---

## 7. Data model (DynamoDB)

### `requests`
| Field | Notes |
|---|---|
| `tenantId` (PK) | API key owner |
| `sk` (SK) | `createdAt#requestId`, newest first with a reverse query |
| `lane`, `modelId`, `source` | decision outcome |
| `confidence`, `reason` | from GLiDE |
| `inputTokens`, `outputTokens` | from Bedrock usage |
| `cost`, `baselineCost` | strings |
| `latencyMs`, `cacheHit`, `escalated` | metrics |
| `promptHash` | SHA-256 of the normalized prompt |
| `promptPreview` | optional, redacted, off by default |

Raw prompts are not stored by default. The hash is enough for cache and debugging.

### `cache`
| Field | Notes |
|---|---|
| `key` (PK) | hash of normalized prompt + system prompt + tier params |
| `answer`, `lane`, `modelId` | stored response |
| `ttl` | DynamoDB TTL attribute |

### `apiKeys`
Hashed keys, tenant name, createdAt, revokedAt.

### Stats
v1 computes stats on read from `requests` for a bounded date range. If that gets slow, add DynamoDB Streams to a small `dailyStats` table.

---

## 8. Cost accounting

- `cost` = (inputTokens × tier input price + outputTokens × tier output price) / 1,000,000.
- `baselineCost` = the same tokens priced at the `baselineTier` (strong).
- `savings` = `baselineCost` − `cost`. Cache hits count the full baseline as saved.
- Dashboard shows the formula and the prices-as-of date on screen. Savings numbers you cannot explain are worthless.

---

## 9. Security

- API keys hashed at rest. Dashboard uses a short-lived JWT.
- Lambda IAM is least privilege: `bedrock:InvokeModel` on the configured model ARNs only, scoped DynamoDB access, `secretsmanager:GetSecretValue` on one secret.
- Fastino key in Secrets Manager. `.env` locally, `VITE_` prefix only for non-secret frontend values.
- CORS origins from `ALLOWED_ORIGINS`.
- Public playground uses recorded real responses by default, and a rate-limited live mode behind a toggle, so strangers cannot run up your bill.
- Prompt logging off by default. PII scan before anything is logged.

---

## 10. Benchmark plan (the headline number)

1. Build a set of 100 prompts across five kinds: greetings and FAQs, rewrites, summaries, reasoning, code.
2. Run all 100 through "always strong". Record cost, p50 and p95 latency.
3. Run the same 100 through the router. Record the same numbers plus the lane split.
4. Have a strong model score both sets 1 to 5 against a short rubric. Spot-check 20 by hand.
5. Publish a table: cost, latency, average quality, quality delta, lane split.

Report the quality drop honestly. "Cut cost by X% with a quality delta of Y" is believable. A savings number with no quality number is not.

---

## 11. UI and design system

### Brief
Light theme. Huge type. Smooth, deliberate motion. Awwwards-level craft with zero template feel. The product is a router, so the visual idea comes from roads: lanes, lane paint, a prompt travelling and choosing where to go.

### The one memorable thing
The router playground in the hero. You type a prompt, a mark travels along a line into the gateway, pauses while GLiDE decides, then peels into one of three lanes. The lane lights up, the model name appears, and a cost counter ticks. Everything else on the page stays quiet so this lands.

### Pages
1. **Home**: hero with the playground, a pinned scroll story of one prompt's journey, benchmark results in huge type, install steps, footer.
2. **Dashboard** (`/app`): spend vs baseline, lane split, request log.
3. **Docs**: plain, long-form, readable. No animation beyond the shared layout.

### Palette

| Token | Hex | Role |
|---|---|---|
| `concrete` | `#E6E9EE` | page background |
| `paper` | `#F7F8FA` | raised surfaces, input fields |
| `ink` | `#0E1B3D` | all text, primary lines (a deep navy, not a near-black) |
| `paint` | `#FFC400` | cheap lane, savings fill |
| `tide` | `#00B39A` | mid lane |
| `signal` | `#2340FF` | strong lane, primary actions |

Rules:
- Lane colors always mean the lane. They are never used for decoration.
- Paint and tide fail contrast as text on light backgrounds. They are fills and lines only. Text on them is `ink`.
- No gradients. No glass. No drop shadows; depth comes from color blocks and spacing.

### Type
One family, used at two extremes: **Archivo** (variable, with weight and width axes, free on Google Fonts).
- Display: width 125, weight 800 to 900, line-height 0.88, tracking −0.03em. Sentence case, not all caps.
- Body: width 100, weight 400, line-height 1.55, max 62 characters per line.
- Numbers: tabular figures, set big. The cost and savings numerals are part of the design.
- Fluid scale with `clamp()`:

| Style | Size |
|---|---|
| display-xl | `clamp(4.5rem, 14vw, 16rem)` |
| display-l | `clamp(3rem, 9vw, 9rem)` |
| heading | `clamp(2rem, 4vw, 3.5rem)` |
| body | `1.0625rem` |
| small | `0.875rem` |

Self-host a Latin-only subset as woff2, preload the display weight, `font-display: swap`. If Archivo does not feel right once you see it on screen, the fallback shortlist is Anybody (Google Fonts) or Clash Display / Cabinet Grotesk (Fontshare). Pick one and commit.

### Layout
- Left-aligned everywhere. Asymmetric 12-column grid. Display type bleeds off the right edge on purpose.
- Big empty space between sections. No equal-height card grids.
- Corners: square for data and lanes, one small radius only on inputs and buttons.

Hero wireframe:
```
┌────────────────────────────────────────────────────────────────────┐
│ Lane                                    Docs   GitHub   Dashboard  │
│                                                                    │
│ The cheapest model                                                 │
│ that can answer it.                                                │
│                                                                    │
│ ┌──────────────┐   ●━━━━┳━━━━━━━━━━━━━━━━━━━━━━  cheap   Nova Micro│
│ │ type a prompt│━━━━━━━━┫━━━━━━━━━━━━━━━━━━━━━━  mid     Haiku 4.5│
│ └──────────────┘        ┗━━━━━━━━━━━━━━━━━━━━━━  strong  Sonnet   │
│                                                                    │
│ This one cost $0.0000112.  Always-strong would have cost $0.00048. │
└────────────────────────────────────────────────────────────────────┘
```

Dashboard wireframe:
```
┌────────────────────────────────────────────────────────────────────┐
│ Saved this week                                                    │
│ $214.60                       (display-xl, tabular numerals)       │
│ of $398.10 baseline                                                │
│                                                                    │
│ spend over time                                                    │
│ ─────╮   baseline (thin ink line)                                  │
│ ▒▒▒▒▒╰──╮ the gap between the lines is filled paint yellow        │
│ ━━━━━━━━╰━━  actual (thick signal line)                            │
│                                                                    │
│ ▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░░░░░   lane split, labeled inline  │
│                                                                    │
│ requests                                                           │
│ time   lane    model        cost       saved     latency           │
│ ...    row expands to show GLiDE reason + cost breakdown           │
└────────────────────────────────────────────────────────────────────┘
```

Charts are hand-built with d3 scales and SVG, not a default chart library look. The gap between baseline and actual spend, filled in paint yellow, is the whole story of the product. Label lanes directly on the bars, no legend.

### Motion

Principle: one orchestrated moment on load, one scrub-linked scroll story, and motion that answers the user's actions. No fade-and-slide-up on every section, no hover lift on every card.

| Moment | What happens | Tech |
|---|---|---|
| Page load (once, about 1.8 s) | headline width axis animates from condensed to expanded per line; three lane lines draw across the page; playground input settles in. Then stillness. | GSAP timeline, SVG stroke-dashoffset, variable font axes |
| Playground submit | mark travels the entry line, pauses about 250 ms while GLiDE decides, peels into its lane; lane fills; model name and cost counter appear | GSAP, motion path |
| Prompt journey (scroll) | pinned section, four beats, scrubbed: prompt arrives, cache check, GLiDE decides, Bedrock answers. This is a true sequence, so numbered beats are justified here. | ScrollTrigger with scrub |
| Benchmark numbers | count up once on first entry | GSAP |
| Route change | a lane-colored wipe, about 600 ms | GSAP |
| Interactive elements | color or underline change on buttons and rows only | CSS |

Smoothness:
- Lenis for scroll, driven from the GSAP ticker so ScrollTrigger and Lenis share one clock.
- Easing: one custom curve everywhere (`cubic-bezier(0.22, 1, 0.36, 1)`), durations 0.6 to 1.2 s.
- Animate `transform` and `opacity` only. The one exception is the hero's variable-font width animation: contain it to the hero and test on a mid-range phone.
- `prefers-reduced-motion`: Lenis off, scrub sections become static stacked panels, no width animation, playground result appears without travel.

### Components (short list)
Playground (input + lanes), lane track, cost counter, stat numeral, savings chart, lane-split bar, request table with expandable rows, code block with copy button, nav, footer. Each has loading, empty and error states.

### Copy
- Sentence case. Plain verbs. Say what it does.
- Buttons name the action: "Deploy to AWS", "Copy command", "Open dashboard".
- Empty state: "No requests yet. Send one with curl:" followed by the snippet.
- Errors say what happened and how to fix it, without apologizing: "Bedrock access is off for this model. Enable it in the Bedrock console, then retry."
- Avoid: revolutionize, supercharge, seamless, unlock, "AI-powered".

### Slop checklist (check before shipping each page)
- [ ] No cream background with a serif display and a clay or terracotta accent.
- [ ] No near-black page with one acid accent.
- [ ] No identical rounded cards in a grid, no gradient washes, no uniform soft shadows.
- [ ] No spaced all-caps eyebrow above headings.
- [ ] No single highlighted word inside a headline.
- [ ] No numbered markers unless the content is a real sequence.
- [ ] No arrows appended to every link.
- [ ] Only one place on the page spends the boldness budget (the playground).
- [ ] Remove one more decorative thing before shipping.

### Quality floor
- Responsive down to 360 px. The playground becomes vertical on mobile.
- Visible keyboard focus, full keyboard use of the playground and table.
- Landing JS under about 250 KB gzipped. LCP under 2 s on 4G. No images on the landing page; everything is SVG and type.
- Test the hero animation on a real mid-range Android phone.

### Frontend conventions
- React + Vite, Tailwind v4 (`@import "tailwindcss"`, tokens in `@theme {}`, `@tailwindcss/vite`, no `postcss.config.js`).
- All fetches through `src/lib/apiClient.js`, never raw `fetch()` in components.
- Data hooks in `src/hooks/`, motion helpers in `src/lib/motion/`, tokens in `src/config/`.
- A mock layer for every endpoint so the UI can be built before the backend.
- This project deliberately skips glass cards and gradient buttons from the default UI system. The brief above wins.

```css
@import "tailwindcss";

@theme {
  --color-concrete: #E6E9EE;
  --color-paper: #F7F8FA;
  --color-ink: #0E1B3D;
  --color-paint: #FFC400;
  --color-tide: #00B39A;
  --color-signal: #2340FF;
  --font-sans: "Archivo", ui-sans-serif, system-ui, sans-serif;
  --ease-lane: cubic-bezier(0.22, 1, 0.36, 1);
}
```

---

## 12. Repo layout

```
lane/
├─ infra/
│  └─ template.yaml            # SAM: API Gateway, Lambda, DynamoDB, IAM
├─ backend/
│  ├─ src/
│  │  ├─ app.js                # Express app, corsMiddleware first
│  │  ├─ handler.js            # Lambda entry (serverless-express)
│  │  ├─ config/               # tiers.json, env loading
│  │  ├─ routes/               # completions, requests, stats, auth, config
│  │  ├─ services/             # router, bedrock, fastino adapter, cache, pricing
│  │  ├─ middleware/           # cors, auth, rateLimit, errorHandler, asyncRoute
│  │  └─ utils/                # hashing, normalization, envelope helpers
│  └─ tests/
├─ frontend/
│  └─ src/
│     ├─ config/  hooks/  lib/  components/  pages/
├─ bench/
│  ├─ prompts.json
│  └─ run.js                   # always-strong vs router, plus judge scoring
└─ docs/
   └─ system_design.md
```

---

## 13. Milestones

| # | Milestone | Done when |
|---|---|---|
| 1 | Backend core | `/completions` routes by GLiDE and calls Bedrock locally |
| 2 | Cache, logs, stats | cost and savings correct against hand calculation |
| 3 | SAM deploy | one command deploys to a clean AWS account |
| 4 | Benchmark | the 100-prompt table is published in the README |
| 5 | Landing + playground | hero animation runs at 60 fps on a mid-range phone |
| 6 | Dashboard | savings chart, lane split, request log with live data |
| 7 | Launch | demo video, README, LinkedIn post |

### v2 ideas
Streaming via Lambda Function URL, semantic cache, per-tenant budgets, a Slack alert when spend spikes, an optional on-chain audit log of routing decisions on Base Sepolia.

---

## 14. Open questions

1. Exact GLiDE request and response shape (confirm from the Fastino docs before the adapter).
2. Which AWS region and which models are actually enabled on your account.
3. Final name. "Lane" is a working title.
4. Does the public playground ship with recorded responses only, or also a rate-limited live mode?
5. Is PII scanning in v1 or v1.1? It adds one Fastino call per request.