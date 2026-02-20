# OpenClaw Research Handoff — Implementation Brief

## Context

This document captures research from the Feb 18, 2026 meeting (Felipe Pires + Alden Do Rosario)
and deep analysis of the OpenClaw ecosystem (SecureClaw, ClawHavoc, marketplace security, OWASP ASI).

**Repo:** `C:\Users\Felipe Pires\customgpt-claude-quadruple-verification`
**Branch:** `feat/openclaw-learnings-v2`
**What was already done (commit 92ff4df):** 10 new rules, behavioral sequence detection, MCP validation, OWASP ASI mapping, enhanced Stop prompt. See `git log -1 --stat` for details.

---

## What Still Needs to Be Implemented

### 1. Lean Mode Toggle (HIGHEST PRIORITY)

**Why:** Benchmark shows pre-tool gates (Cycles 1+2) add latency/tokens with marginal quality gain. The Stop gate (Cycle 3) is the #1 value driver (+30.6% net value on Agent SDK tasks). Alden asked "why only 30%, not 200%" — the overhead from pre-tool checks is dragging down net value to -2.5%.

**What to build:**
- Add a `"leanMode": true/false` option to `config/default-rules.json`
- When `leanMode: true`, skip Cycle 1+2 pre-tool checks in `scripts/pre-tool-gate.mjs` (approve immediately)
- Keep: Stop prompt (Cycle 3), behavioral tracking (PostToolUse), audit logging
- Keep Cycle 4 (research verification) as-is since it only fires on research .md files

**Files to modify:**
- `config/default-rules.json` — add `"leanMode": false` (default off for backwards compat)
- `scripts/pre-tool-gate.mjs` — early return `approve()` when leanMode is true
- `scripts/lib/config-loader.mjs` — no changes needed (already merges arbitrary keys)

**Expected impact:** Cuts latency overhead from 1.5x to ~1.0x, token overhead from 1.3x to ~1.0x, while retaining the highest-value verification (Stop gate).

---

### 2. Smaller Benchmark Suite (HIGH PRIORITY)

**Why:** Current benchmark takes 1-1.5 hours and costs ~$32. Alden said this is too long. Need a 15-minute smoke test for fast iteration.

**What to build:**
- Create `benchmark/test-cases/smoke.json` with ~10 highest-signal tests from existing categories:
  - 2-3 from Agent SDK (highest delta category, +31.8%)
  - 2-3 from Security (where the new rules matter most)
  - 2 from Code Quality (regression check)
  - 2 from Completeness (regression check)
- Add `npm run benchmark:smoke` script to `package.json`
- Modify `benchmark/run-benchmark.py` to accept a `--suite smoke` flag

**Source test cases:** Located in `benchmark/test-cases/`:
- `category-sdk-agent.json` — pick SDK.3 (string utils) and SDK.4 (auth system, the breakthrough case)
- `category-2-security.json` — pick tests that exercise the new ClawHavoc rules
- `category-1-code-quality.json` — pick 2 representative tests
- `category-4-completeness.json` — pick 2 representative tests

**Expected impact:** 15-min runs enable rapid A/B testing of verifier changes.

---

### 3. External Content Boundary Markers (MEDIUM PRIORITY)

**Why:** OpenClaw's `external-content.ts` wraps untrusted content in `<<<EXTERNAL_UNTRUSTED_CONTENT>>>` markers with Unicode homoglyph folding. This prevents prompt injection through tool results — a vector not currently covered.

**What to build:**
- New module `scripts/lib/content-boundary.mjs`:
  - `wrapExternalContent(content)` — wraps content in boundary markers
  - `detectInjectionPatterns(content)` — checks for 11+ patterns ("ignore previous instructions", "system: override", etc.)
  - `foldHomoglyphs(content)` — normalizes fullwidth ASCII and CJK lookalikes
  - `sanitizeMarkers(content)` — replaces boundary markers found inside content with `[[MARKER_SANITIZED]]`
- Integrate into `scripts/post-tool-audit.mjs` for tool results that come from external sources (WebFetch, WebSearch, MCP tools)
- Non-blocking: log warnings when injection patterns detected, don't block

**OpenClaw reference patterns (from `src/security/external-content.ts`):**
```
/ignore\s+(all\s+)?previous\s+instructions/i
/system:\s*override/i
/\brm\s+-rf\s+\//
/you\s+are\s+now\s+/i
/forget\s+(all\s+)?(your\s+)?instructions/i
/act\s+as\s+(if\s+you\s+are|a)\s+/i
/new\s+role:/i
/override\s+safety/i
```

---

### 4. Structured Finding Format (LOW PRIORITY)

**Why:** Current audit logs have flat violation objects. OpenClaw uses `{ruleId, severity, file, line, message, evidence}` with namespace-qualified reason codes (`suspicious.dangerous_exec`, `malicious.env_harvesting`).

**What to build:**
- Add severity tiers to rules in `scripts/lib/rules-engine.mjs`: `critical`, `warn`, `info`
- Add `remediation` field to each rule (short fix suggestion)
- Update `scripts/lib/audit-logger.mjs` to include severity in JSONL entries
- Map rule IDs to namespaced codes: `quality.*`, `security.*`, `research.*`, `behavior.*`

**No behavioral change** — just better structured output for debugging and reporting.

---

### 5. Tiered Trust Model (LOW PRIORITY)

**Why:** OpenClaw uses builtin/community/local trust tiers with different enforcement levels. Could reduce overhead on common safe operations.

**What to build:**
- Add `"trustLevel": "standard" | "strict" | "minimal"` to config
- `minimal`: Only Stop prompt + behavioral tracking (like lean mode but also skips MCP validation)
- `standard`: Current full verification (default)
- `strict`: All checks + `no-any-type` enabled + fail-closed on behavioral warnings

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `hooks/hooks.json` | Hook definitions — PreToolUse, PostToolUse, Stop |
| `scripts/pre-tool-gate.mjs` | PreToolUse dispatcher — Cycles 1+2+4 |
| `scripts/post-tool-audit.mjs` | PostToolUse — audit + behavioral tracking |
| `scripts/stop-gate.mjs` | Stop — research file scan |
| `scripts/lib/rules-engine.mjs` | All Cycle 1 (11 rules) + Cycle 2 (16 rules) |
| `scripts/lib/behavior-tracker.mjs` | Cross-tool-call behavioral pattern detection |
| `scripts/lib/research-verifier.mjs` | Cycle 4 rules |
| `scripts/lib/audit-logger.mjs` | JSONL structured logging |
| `scripts/lib/config-loader.mjs` | Three-layer config merge |
| `scripts/lib/utils.mjs` | Shared utils: stdin, deny/approve, failOpen |
| `config/default-rules.json` | Default config (v1.2.0) |
| `docs/owasp-asi-mapping.md` | OWASP ASI Top 10 coverage map |
| `benchmark/test-cases/` | 6 category JSON files (45 tests) |
| `benchmark/run-benchmark.py` | Benchmark runner |
| `benchmark/auto-grade.py` | Auto-grader (Sonnet 4.5) |

## Benchmark Context

- Current overall: +4.4% quality, -2.5% net value (below Alden's 14% bar)
- Agent SDK category: +31.8% quality, +30.6% net value (above bar)
- Stop gate (Cycle 3) is the highest-value component
- Pre-tool gates add 1.5x latency, 1.3x tokens for marginal gain
- 136 tests pass, 0 fail

## Alden's Key Asks (Feb 18 Meeting)

1. Push benchmark score higher (why 30% not 200%)
2. Reduce benchmark run time (1-1.5h too long)
3. Trust and control for OpenClaw ecosystem
4. Marketing angle: OWASP ASI coverage
5. Integration with Manus agent (Python SDK port exists)
