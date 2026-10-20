# Lane: 100-Prompt Benchmark Results

Published as specified in Section 10 of SYSTEM_DESIGN.md.

## Summary

| Metric | Always Strong (Claude Sonnet 4.5) | Lane Autonomous Gateway | Delta |
|---|---|---|---|
| **Total 100-Prompt Spend** | $0.26966 | $0.21730 | **-19.4%** |
| **p50 Latency** | 1194 ms | 1796 ms | 602 ms |
| **p95 Latency** | 1421 ms | 3068 ms | 1647 ms |
| **Lane Distribution** | 100% strong | 39% cheap · 21% mid · 40% strong | Optimal routing |

## Category Breakdown

| Category | Prompts | Cheap | Mid | Strong | Rejection | Spend | Baseline Spend | Savings |
|---|---|---|---|---|---|---|---|---|
| greetings_faqs | 20 | 20 | 0 | 0 | 0 | $0.00020 | $0.00824 | **-97.6%** |
| rewrites | 20 | 19 | 1 | 0 | 0 | $0.00028 | $0.01040 | **-97.3%** |
| summaries | 20 | 0 | 20 | 0 | 0 | $0.00311 | $0.03731 | **-91.7%** |
| reasoning | 20 | 0 | 0 | 20 | 0 | $0.10703 | $0.10703 | **-0.0%** |
| code | 20 | 0 | 0 | 20 | 0 | $0.10667 | $0.10667 | **-0.0%** |
