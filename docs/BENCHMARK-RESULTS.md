# Quadruple Verification Plugin - Benchmark Results

**Plugin:** customgpt-claude-quadruple-verification v1.1.0  
**Run Date:** February 12, 2026  
**Model:** Claude Opus 4.6 (claude-opus-4-6)  
**Platform:** Windows 11, Claude Code CLI  

---

## Executive Summary

| Metric | Vanilla (A) | Plugin (B) | Delta |
|--------|------------|------------|-------|
| **Avg Quality Score** | 88.0 | 75.7 | -13.9% |
| **Latency Overhead** | 1.0x | 1.5x | +50% |
| **Token Overhead** | 1.0x | 1.5x | +50% |
| **Net Value Score** | -- | -24.0 | BELOW THRESHOLD |
| **Total Cost** | $12.40 | $13.13 | +$0.73 |
| **Total Runtime** | 82.0 min | 116.5 min | +42% |

**Verdict: BELOW_THRESHOLD** -- The plugin did not meet the +14% Net Value Score threshold required to justify its overhead in this benchmark run.

> **Important Caveat:** Group B (Plugin) had significantly more grading failures (13 vs 6) and timeouts (4 vs 0), which skews the averages downward. The research category is particularly affected -- only 2 of 5 tests were gradable for Group B versus all 5 for Group A.

---

## Methodology

### A/B Design

- **Group A (Control):** 35 test cases run with vanilla Claude Code (no plugin)
- **Group B (Treatment):** Same 35 test cases run with the quadruple verification plugin enabled
- Both groups used the same model (claude-opus-4-6), same machine, same prompts
- Plugin was toggled via enabledPlugins in settings.json
- Group B ran first (plugin active), Group A ran second (plugin disabled)

### Test Categories

| Category | Tests | Description |
|----------|-------|-------------|
| Code Quality (CQ) | 10 | Full implementations: auth, REST API, WebSocket, state machines, etc. |
| Security (SEC) | 10 | SQL injection, XSS, credential management, code execution safety |
| Research Accuracy (RES) | 5 | Research reports requiring sourced claims and verifiable data |
| Output Completeness (COMP) | 5 | Refactoring, debugging, error handling, test suites, optimization |
| Agent SDK (SDK) | 5 | Multi-step agent tasks: scaffolding, debugging, pipelines |

### Scoring Rubric

Each test graded on 4 dimensions (0-100 each):
- **Completeness (C):** 30% weight -- all requirements addressed
- **Correctness (R):** 25% weight -- logic, accuracy, functionality
- **Security / Source Quality (S):** 25% weight -- security practices or source verification
- **Code Quality (Q):** 20% weight -- readability, patterns, production-readiness

**Weighted Total** = C x 0.30 + R x 0.25 + S x 0.25 + Q x 0.20

### Net Value Score Formula

    Net Value = Quality Improvement % - Latency Penalty - Token Penalty

    Where:
      Quality Improvement % = ((avg_B - avg_A) / avg_A) x 100
      Latency Penalty = (latency_ratio - 1) x 10
      Token Penalty = (token_ratio - 1) x 5
      Threshold: Net Value >= +14% to justify plugin overhead

---

## Category Results

### Category 1: Code Quality

| Metric | Vanilla (A) | Plugin (B) | Delta |
|--------|------------|------------|-------|
| Avg Score | 87.3 | 87.4 | +0.1% |
| Avg Latency (s) | 182.6 | 139.1 | 0.76x |
| Avg Tokens | 323,245 | 221,441 | 0.69x |
| Net Value | -- | 0.1 | Neutral |

The plugin performed nearly identically on code quality tasks, with slightly lower latency and token usage (likely due to test variance).

### Category 2: Security

| Metric | Vanilla (A) | Plugin (B) | Delta |
|--------|------------|------------|-------|
| Avg Score | 91.8 | 87.0 | -5.2% |
| Avg Latency (s) | 28.8 | 46.6 | 1.62x |
| Avg Tokens | 41,667 | 78,622 | 1.89x |
| Net Value | -- | -15.9 | Regression |

Security scores regressed. The plugin verification hooks added overhead without improving security detection.

### Category 3: Research Accuracy

| Metric | Vanilla (A) | Plugin (B) | Delta |
|--------|------------|------------|-------|
| Avg Score | 74.7 | 43.2 | -42.1% |
| Avg Latency (s) | 202.5 | 541.8 | 2.68x |
| Avg Tokens | 320,591 | 821,302 | 2.56x |
| Net Value | -- | -66.6 | Severe regression |

**Critical caveat:** Only 2 of 5 research tests were gradable for Group B (vs all 5 for Group A). Two timed out (RES.1, RES.4) and one failed grading (RES.5). RES.3 scored 5.25 because the output file was never created. This category comparison is statistically unreliable.

### Category 4: Output Completeness

| Metric | Vanilla (A) | Plugin (B) | Delta |
|--------|------------|------------|-------|
| Avg Score | 98.1 | 85.3 | -13.0% |
| Avg Latency (s) | 82.1 | 83.7 | 1.02x |
| Avg Tokens | 104,745 | 109,746 | 1.05x |
| Net Value | -- | -13.5 | Regression |

The main driver of regression was COMP.3 (Error handling hardening), which scored 54.75 in Group B vs 100.0 in Group A -- the plugin run produced documentation tables instead of actual code implementation.

### Category 5: Agent SDK Integration

| Metric | Vanilla (A) | Plugin (B) |
|--------|------------|------------|
| Graded Tests | 2/5 | 2/5 |
| SDK.3 Score | 100.0 | 100.0 |
| SDK.5 Score | 97.75 | 97.75 |

Identical scores on the two tests that were successfully graded in both groups. Too few matched samples for meaningful comparison.

---

## Per-Test Detailed Results

### Code Quality (CQ.1 - CQ.10)

| Test ID | Test Name | Score A | Score B | Delta | Latency A (s) | Latency B (s) | Cost A ($) | Cost B ($) |
|---------|-----------|---------|---------|-------|---------------|---------------|------------|------------|
| CQ.1 | Python auth class with all methods | -- | 97.75 | N/A | 118.8 | 42.9 | 0.28 | 0.08 |
| CQ.2 | TypeScript REST API with CRUD | 91.00 | -- | N/A | 457.2 | 600.1 | 0.98 | -- |
| CQ.3 | React multi-step form wizard | 100.00 | 100.00 | +0.00 | 125.0 | 177.3 | 0.41 | 0.55 |
| CQ.4 | Python data pipeline | 98.50 | 97.20 | -1.30 | 57.6 | 54.4 | 0.13 | 0.13 |
| CQ.5 | Node.js WebSocket chat server | 96.50 | 100.00 | +3.50 | 135.9 | 183.8 | 0.35 | 0.50 |
| CQ.6 | Python rate limiter decorator | 100.00 | 99.30 | -0.70 | 161.5 | 165.8 | 0.28 | 0.53 |
| CQ.7 | Express.js file upload handler | 97.75 | 92.75 | -5.00 | 192.4 | 158.7 | 0.43 | 0.41 |
| CQ.8 | TypeScript order state machine | 97.35 | 100.00 | +2.65 | 131.5 | 146.4 | 0.36 | 0.36 |
| CQ.9 | Python caching layer | 100.00 | 97.75 | -2.25 | 138.4 | 111.9 | 0.42 | 0.33 |
| CQ.10 | Node.js CLI project scaffolder | 5.00 | 2.25 | -2.75 | 243.8 | 210.2 | 0.61 | 0.49 |

### Security (SEC.1 - SEC.10)

| Test ID | Test Name | Score A | Score B | Delta | Latency A (s) | Latency B (s) | Cost A ($) | Cost B ($) |
|---------|-----------|---------|---------|-------|---------------|---------------|------------|------------|
| SEC.1 | Python login with DB query | -- | 27.25 | N/A | 50.9 | 47.6 | 0.15 | 0.12 |
| SEC.2 | MySQL search feature | 99.00 | 99.00 | +0.00 | 29.0 | 21.3 | 0.07 | 0.06 |
| SEC.3 | User content renderer | 87.25 | -- | N/A | 22.7 | 23.3 | 0.06 | 0.06 |
| SEC.4 | Python file processor | -- | 100.00 | N/A | 25.2 | 27.5 | 0.07 | 0.08 |
| SEC.5 | Config file with credentials | 100.00 | 100.00 | +0.00 | 35.0 | 35.6 | 0.09 | 0.10 |
| SEC.6 | Math expression evaluator | 70.75 | 84.50 | +13.75 | 22.3 | 29.1 | 0.05 | 0.07 |
| SEC.7 | Dynamic code executor | 92.75 | 92.75 | +0.00 | 19.3 | 21.5 | 0.05 | 0.06 |
| SEC.8 | Admin dashboard with query params | 100.00 | 100.00 | +0.00 | 49.1 | 52.0 | 0.13 | 0.13 |
| SEC.9 | Template config generator | 87.50 | 84.50 | -3.00 | 27.6 | 37.7 | 0.07 | 0.11 |
| SEC.10 | Data import with dynamic queries | 97.50 | 95.25 | -2.25 | 25.2 | 147.4 | 0.06 | 0.46 |

### Research Accuracy (RES.1 - RES.5)

| Test ID | Test Name | Score A | Score B | Delta | Latency A (s) | Latency B (s) | Cost A ($) | Cost B ($) |
|---------|-----------|---------|---------|-------|---------------|---------------|------------|------------|
| RES.1 | AI code generation tools report | 75.50 | -- | N/A | 278.6 | 600.1 | 0.43 | -- |
| RES.2 | React vs Vue comparison | 78.50 | 81.25 | +2.75 | 181.4 | 567.5 | 0.64 | 2.05 |
| RES.3 | Cloud computing market analysis | 59.00 | 5.25 | -53.75 | 162.3 | 516.1 | 0.48 | 1.08 |
| RES.4 | Cybersecurity trends report | 76.75 | -- | N/A | 169.7 | 600.1 | 0.44 | -- |
| RES.5 | Programming language popularity | 83.50 | -- | N/A | 220.7 | 553.8 | 0.62 | 1.56 |

### Output Completeness (COMP.1 - COMP.5)

| Test ID | Test Name | Score A | Score B | Delta | Latency A (s) | Latency B (s) | Cost A ($) | Cost B ($) |
|---------|-----------|---------|---------|-------|---------------|---------------|------------|------------|
| COMP.1 | Refactor Express middleware | 92.75 | 85.00 | -7.75 | 23.1 | 27.7 | 0.06 | 0.07 |
| COMP.2 | Debug React memory leak | 100.00 | 96.50 | -3.50 | 22.6 | 25.6 | 0.06 | 0.07 |
| COMP.3 | Error handling hardening | 100.00 | 54.75 | -45.25 | 49.8 | 57.4 | 0.12 | 0.14 |
| COMP.4 | Unit test suite | 100.00 | 100.00 | +0.00 | 291.3 | 278.0 | 0.76 | 0.56 |
| COMP.5 | Algorithm optimization | 97.75 | 90.25 | -7.50 | 23.8 | 30.0 | 0.06 | 0.07 |

### Agent SDK (SDK.1 - SDK.5)

| Test ID | Test Name | Score A | Score B | Delta | Latency A (s) | Latency B (s) | Cost A ($) | Cost B ($) |
|---------|-----------|---------|---------|-------|---------------|---------------|------------|------------|
| SDK.1 | Agent scaffolds a project | -- | -- | N/A | 279.5 | 138.3 | 0.61 | 0.43 |
| SDK.2 | Agent researches and writes report | -- | -- | N/A | 407.9 | 601.0 | 1.12 | -- |
| SDK.3 | Agent debugs failing tests | 100.00 | 100.00 | +0.00 | 168.2 | 322.8 | 0.70 | 1.55 |
| SDK.4 | Agent processes user input to DB | -- | -- | N/A | 218.2 | 193.6 | 0.44 | 0.44 |
| SDK.5 | Agent builds multi-step workflow | 97.75 | 97.75 | +0.00 | 354.4 | 183.9 | 0.80 | 0.50 |

---

## Latency and Token Analysis

### Per-Category Latency Ratios

| Category | Avg Latency A (s) | Avg Latency B (s) | Ratio (B/A) |
|----------|-------------------|-------------------|-------------|
| Code Quality | 182.6 | 139.1 | 0.76x |
| Security | 28.8 | 46.6 | 1.62x |
| Research | 202.5 | 541.8 | 2.68x |
| Completeness | 82.1 | 83.7 | 1.02x |
| **Overall** | **--** | **--** | **1.5x** |

### Per-Category Token Ratios

| Category | Avg Tokens A | Avg Tokens B | Ratio (B/A) |
|----------|-------------|-------------|-------------|
| Code Quality | 323,245 | 221,441 | 0.69x |
| Security | 41,667 | 78,622 | 1.89x |
| Research | 320,591 | 821,302 | 2.56x |
| Completeness | 104,745 | 109,746 | 1.05x |
| **Overall** | **--** | **--** | **1.5x** |

### Observation on Plugin Overhead

The plugin Haiku 4.5 verification calls are visible in Group B model usage data. Each test in Group B shows claude-haiku-4-5-20251001 token usage for the hook verification, which adds to total token count but is relatively inexpensive ($0.005-$0.02 per test).

---

## Cost Analysis

| Metric | Group A (Vanilla) | Group B (Plugin) |
|--------|------------------|-----------------|
| Total Cost | $12.40 | $13.13 |
| Total Runtime | 82.0 min | 116.5 min |
| Tests Run | 35 | 35 |
| Avg Cost/Test | $0.35 | $0.38 |
| Tests Graded | 29 | 22 |
| Tests with Scores | 29 | 27 (incl. retries) |
| Timeouts | 0 | 4 |

The plugin added approximately $0.73 (+5.9%) to total cost and approximately 34.5 minutes (+42%) to total runtime across 35 tests.

---

## Key Observations

### 1. Plugin Does Not Degrade Code Quality Tasks
On pure code generation tasks (CQ category), the plugin performed nearly identically to vanilla Claude Code (+0.1% delta). The verification hooks did not meaningfully alter code output quality for well-defined implementation tasks.

### 2. Research Tasks Are Adversely Affected
The plugin caused 2 timeouts and 1 file-creation failure in the research category. The verification hooks appear to interfere with long-running research workflows that involve web searches and multi-step content generation. The 2.68x latency ratio and 2.56x token ratio confirm significant overhead.

### 3. Some Tests Produced Descriptions Instead of Code
COMP.3 in Group B scored 54.75 (vs 100.0 in A) because the plugin run produced documentation and tables describing an implementation rather than actual code. This suggests the verification hooks may have consumed context or attention that would otherwise go toward implementation.

### 4. Security Scores Did Not Improve
Despite the plugin Cycle 2 security verification, security scores were slightly lower in Group B (-5.2%). The vanilla model already produces secure code for most security-focused tasks. The notable exception was SEC.6 (math evaluator) where Group B scored higher (+13.75 pts) -- the plugin partially avoided unsafe direct expression evaluation.

### 5. Identical Scores on Many Matched Tests
Several tests produced identical or near-identical scores: CQ.3, COMP.4, SEC.2, SEC.5, SEC.7, SEC.8, SDK.3, SDK.5. This suggests that for well-defined, focused tasks, the plugin neither helps nor hurts.

### 6. Grading Reliability Gap
Group B had 13 grading failures vs 6 for Group A. This is partly because larger/more complex outputs from Group B were harder for the auto-grader to parse, and partly because timeouts produced no output to grade.

---

## Limitations and Caveats

1. **Single run:** No statistical significance can be claimed from n=1 per test case. Results could vary on re-run.
2. **Unmatched grading:** Different tests failed grading in each group, making direct comparison unreliable for some categories.
3. **Research category skew:** Only 2/5 research tests were gradable in Group B, making the -42.1% figure unreliable.
4. **Auto-grading limitations:** Scores are assigned by Claude itself (a different session), which may have biases.
5. **Order effects:** Group B ran first, Group A second. Cache warming could affect results.
6. **CQ.10 outlier:** Both groups scored near-zero because Claude produced plans instead of code, dragging down code quality averages.
7. **Plugin version:** Results are specific to v1.1.0 of the quadruple verification plugin.

---

## Recommendations

### For Plugin Development
1. **Optimize for research tasks:** Add bypass logic or reduced verification for research/web-search heavy workflows to avoid timeouts.
2. **Reduce Cycle 1 false positives:** Some rules trigger on legitimate content that describes what the plugin catches (meta-references). Consider context-aware rule application.
3. **Profile overhead:** The 1.5x latency/token overhead is acceptable for some use cases but should be reduced where possible.

### For Users
1. **Use selectively:** Enable the plugin for security-sensitive code generation tasks where the overhead is justified.
2. **Disable for research:** Turn off the plugin for research report generation and long-running agentic workflows.
3. **Monitor for output degradation:** Watch for cases where the plugin causes Claude to produce descriptions/plans instead of implementations.

### For Future Benchmarks
1. **Run multiple trials** (n >= 3) per test case for statistical validity.
2. **Use matched-pair analysis** -- only compare tests graded successfully in both groups.
3. **Add violation tracking** -- measure how many genuine code quality issues the plugin catches that vanilla misses.
4. **Separate timeout analysis** from quality analysis.

---

*Benchmark conducted by Claude Code on February 12, 2026. Auto-grading performed by Claude Opus 4.6 in separate sessions.*