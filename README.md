# Lane: Bedrock Smart Cost Gateway

> An open-source gateway in front of Amazon Bedrock that routes every prompt to the cheapest model that can answer it. A fast Fastino GLiDE decision model makes the routing decision.

---

## 1. Overview

Most applications default to calling a flagship model (like Claude Sonnet) for every user request. A greeting, a one-line rewrite, and a hard reasoning task all get billed at the top-tier rate ($3.00/1M in, $15.00/1M out).

**Lane** sits between your app and Amazon Bedrock:
- Analyzes prompt complexity using **Fastino GLiDE** in milliseconds.
- Routes to the most cost-effective tier:
  - **`cheap`**: Amazon Nova Micro ($0.035 in / $0.14 out per 1M tokens) — greetings, basic rewrites, short Q&A.
  - **`mid`**: Anthropic Claude Haiku / Amazon Nova Pro — standard chat, RAG, summaries.
  - **`strong`**: Anthropic Claude Sonnet 4.5 — hard reasoning, code, math proofs.
  - **`reject`**: Intercepts PII leaks and prompt injections before any model is invoked.
- Exact-match cache answers repeat prompts for **$0.00**.
- One-line adoption: change your base URL, keep the rest of your app.

---

## 2. Architecture

```
 client app / web dashboard
     │  POST /api/v1/completions (API key)
     ▼
┌─────────────────┐
│  API Gateway    │  CORS, rate limiting, usage plan
└────────┬────────┘
         ▼
┌──────────────────────────────────────────────────────────┐
│  AWS Lambda (Node.js 20, Express via serverless-express)  │
│                                                           │
│  1  validate (Zod) + idempotency check                    │
│  2  cache lookup ────────────► DynamoDB: cache  (hit → 0$)│
│  3  decide    (GLiDE)  ─────► cheap | mid | strong | reject│
│  4  invoke    Bedrock Converse API with chosen model      │
│  5  escalate once if answer is empty or refusal           │
│  6  cost accounting: actual vs baseline (strong)          │
│  7  write cache + request log ─► DynamoDB                 │
└──────────────────────────────────────────────────────────┘
         │                         │
         ▼                         ▼
   Amazon Bedrock            Fastino GLiDE
 (Nova / Claude)         (Choice Decision Model)
```

---

## 3. Model Tiers & Pricing

Configured in `backend/src/config/tiers.json`:

| Lane | Model | Input / 1M | Output / 1M | Max Tokens |
|---|---|---|---|---|
| **`cheap`** | Amazon Nova Micro (`us.amazon.nova-micro-v1:0`) | $0.035 | $0.14 | 512 |
| **`mid`** | Claude Haiku 4.5 (`us.anthropic.claude-haiku-4-5-20251001-v1:0`) | $0.25 | $1.25 | 1024 |
| **`strong`** | Claude Sonnet 4.5 (`us.anthropic.claude-sonnet-4-5-20250929-v1:0`) | $3.00 | $15.00 | 2048 |
| **`reject`** | None (Safety Interceptor) | $0.00 | $0.00 | 0 |

---

## 4. Quickstart

### Prerequisites
1. **Node.js**: v20 or higher
2. **AWS CLI**: configured with IAM credentials (`aws configure`)
3. **Fastino API Key**: get your key from [Fastino Settings](https://agent.fastino.ai/api-keys)

### Setup
```bash
# 1. Clone and enter directory
git clone https://github.com/your-username/lane.git
cd lane

# 2. Configure environment
cp .env.example .env
# Edit .env and paste your FASTINO_API_KEY
```

### Run Locally (Dual-Mode)
```bash
# Start backend on http://localhost:3000
cd backend
npm install
npm run dev

# In another terminal, start frontend on http://localhost:5173
cd frontend
npm install
npm run dev
```

### Run Tests
```bash
cd backend
npm test
```
All 15 unit and integration tests run offline in milliseconds with zero AWS cost.

---

## 5. One-Command Autonomous Deployment (AWS SAM)

Deploy API Gateway, Lambda, DynamoDB tables, and IAM policies automatically:

```powershell
# Build SAM bundle
sam build -t infra/template.yaml

# Deploy to AWS
sam deploy `
  --stack-name lane-gateway `
  --resolve-s3 `
  --capabilities CAPABILITY_IAM `
  --region us-east-1 `
  --no-confirm-changeset
```

Outputs will display your live public API endpoint:
```text
LaneApiEndpoint: https://xyz123.execute-api.us-east-1.amazonaws.com/prod
LaneCompletionsEndpoint: https://xyz123.execute-api.us-east-1.amazonaws.com/prod/api/v1/completions
```

---

## 6. API Reference

### `POST /api/v1/completions`

Headers:
- `Content-Type: application/json`
- `x-api-key: your-api-key`
- `Idempotency-Key: optional-unique-id`

Request Body:
```json
{
  "messages": [
    { "role": "user", "content": "What is the capital of France?" }
  ],
  "maxTokens": 512,
  "forceLane": null
}
```

Response Envelope:
```json
{
  "success": true,
  "data": {
    "id": "req_mvkz9b784a004bd3b330",
    "answer": "The capital of France is Paris.",
    "lane": "cheap",
    "modelId": "us.amazon.nova-micro-v1:0",
    "cacheHit": false,
    "escalated": false,
    "usage": { "inputTokens": 7, "outputTokens": 8 },
    "cost": "0.0000014",
    "baselineCost": "0.0001410",
    "savings": "0.0001396",
    "latencyMs": 420,
    "decision": {
      "confidence": 0.99,
      "reason": "GLiDE selected cheap lane (confidence 99.1%).",
      "source": "glide"
    }
  },
  "error": null,
  "meta": {}
}
```

---

## 7. UI & Design System

The frontend follows the **road/lane visual language**:
- **Palette**: Concrete (`#E6E9EE`), Paper (`#F7F8FA`), Ink (`#0E1B3D`), Paint Yellow (`#FFC400`), Tide Teal (`#00B39A`), Signal Blue (`#2340FF`).
- **Typography**: Variable **Archivo** (ultra-wide display headings, tabular numerals).
- **Hero Playground**: Animated SVG junction showing prompts traveling along road tracks into the gateway, peeling into lanes, and ticking live cost savings.
- **Dashboard**: Hand-crafted SVG spend over time chart with the yellow savings gap, stacked traffic split bar, and expandable request log.

---

## 8. License

MIT
