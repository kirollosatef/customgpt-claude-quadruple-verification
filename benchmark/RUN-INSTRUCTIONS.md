# Benchmark Execution Instructions

## Quick Reference

```bash
# List all 45 test cases
python run-benchmark.py --list

# Run Group A (Control - Vanilla Claude Code, no plugin)
python run-benchmark.py --group A

# Run Group B (Treatment - Claude Code + Quadruple Verification Plugin)
python run-benchmark.py --group B

# Run a single test
python run-benchmark.py --group A --test CQ.1

# Run with 3 repetitions per test (full statistical mode)
python run-benchmark.py --group A --runs 3

# Compile results after both groups are done
python run-benchmark.py --compile
```

## Step-by-Step Protocol

### 1. Prepare Two Environments

**Group A (Control):**
- Ensure the quadruple verification plugin is NOT installed
- Verify: `claude plugins list` should NOT show `customgpt-claude-quadruple-verification`

**Group B (Treatment):**
- Ensure the plugin IS installed: `claude plugins add customgpt-claude-quadruple-verification`
- Verify: `claude plugins list` shows it as active

### 2. Run Group A First

```bash
cd benchmark
python run-benchmark.py --group A
```

This runs all 45 test cases with vanilla Claude Code. Each test:
- Opens a fresh Claude session
- Submits the exact prompt from the test case JSON
- Records wall-clock time and token usage
- Saves all output to `results/group-A/{test_id}/run-1/`

Expected duration: ~30-60 minutes for quick mode (1 run each).

### 3. Run Group B

```bash
python run-benchmark.py --group B
```

Same 45 test cases, now with the plugin active.

### 4. Grade Outputs

Use the **auto-grader** for LLM-based grading:

```bash
# Grade all Group A outputs
python auto-grade.py --group A

# Grade all Group B outputs
python auto-grade.py --group B

# Grade a single test
python auto-grade.py --group A --test CQ.3

# Grade both groups
python auto-grade.py --both

# Run safety scan only (no LLM grading)
python auto-grade.py --scan-only --group B
```

**Auto-grader features:**

- **Model:** Claude Sonnet 4.5 for grading accuracy (Haiku was too weak, caused parse failures and unfair penalization of verbose output)
- **Smart summarization:** Long outputs (>50K chars) are intelligently summarized — first 30% + last 30% preserved, middle section replaced with metadata summary — instead of hard truncation at 15K
- **Retry logic:** Up to 3 attempts per grading call with exponential backoff (2s, 4s, 8s) on parse failures or timeouts
- **Safety scanner:** Runs pattern-based safety scans in addition to LLM grading

**Manual grading** is also supported. Open `results/group-{A or B}/{test_id}/run-1/result.json` and fill in scores:

```json
"scores": {
    "completeness": 85,
    "correctness": 90,
    "security_or_source_quality": 75,
    "quality": 80,
    "weighted_total": 83.25
}
```

**Scoring rubric (0-100 per dimension):**

| Dimension | Weight | 0 | 50 | 100 |
|-----------|--------|---|----|----|
| Completeness | 25% | Has unfinished markers/empty bodies | Mostly complete, 1-2 gaps | Fully functional, no gaps |
| Correctness | 30% | Does not work / wrong logic | Works for happy path only | Handles edge cases correctly |
| Security (or Source Quality for research) | 25% | Critical vulnerabilities (or no sources) | Minor issues | No security issues (or all claims sourced) |
| Quality | 20% | Poor structure, no error handling | Decent structure, basic handling | Clean, production-ready |

**weighted_total** = completeness * 0.25 + correctness * 0.30 + security * 0.25 + quality * 0.20

### 5. Compile Results

```bash
python run-benchmark.py --compile
```

This generates a dated results file and prints the summary table.

### 6. Interpret Results

**Net Value Score formula:**

```text
Quality Improvement % = ((Score_B - Score_A) / Score_A) * 100
Latency Penalty = (Latency_B / Latency_A - 1) * 10
Token Penalty = (Tokens_B / Tokens_A - 1) * 5
Net Value = Quality Improvement % - Latency Penalty - Token Penalty
```

**Verdict criteria:**
- **PASS:** Net Value >= 14% AND no category regresses AND n >= 3 with non-overlapping 95% CIs
- **CONDITIONAL PASS:** Net Value >= 14% AND no category regresses, but n < 3
- **FAIL:** Net Value < 14% OR any category regresses

### 7. Understanding Statistical Output (Multi-Run Mode)

When using `--runs 3` or higher, the compiled output includes:

- **Mean ± StdDev:** Per-category scores shown as `75.3±4.2` — the `±` value is the standard deviation across runs
- **95% Confidence Intervals:** Stored in the JSON output under `stats_A.ci_95_lower` / `ci_95_upper`. For a valid improvement claim, the CIs of Group A and Group B should not overlap
- **Outlier flags:** The `Outliers` column shows how many individual run scores fell more than 2 standard deviations from the test mean (format: `A:0 B:1`). Investigate outliers before drawing conclusions
- **CONDITIONAL note:** If n < 3, the output warns that results are conditional and recommends re-running with `--runs 3`

## For Dennis (Agent SDK Testing - Directive 12)

Use the test cases in `test-cases/category-sdk-agent.json`. Run them using the Claude Agent SDK:

1. **Baseline:** Agent SDK without plugin hooks
2. **Treatment:** Agent SDK with plugin hooks injected
3. **Same grading rubric** as above
4. Report results back so they can be merged into the overall summary

## File Structure

```text
quadruple-verification-benchmark/
  BENCHMARK-METHODOLOGY.md       # Full methodology document
  RUN-INSTRUCTIONS.md            # This file
  run-benchmark.py               # Automated runner script
  test-cases/
    category-1-code-quality.json # 10 code quality test cases
    category-2-security.json     # 10 security test cases
    category-3-research.json     # 5 research accuracy test cases
    category-4-completeness.json # 5 output completeness test cases
    category-sdk-agent.json      # 5 Agent SDK test cases (for Dennis)
  results/
    TEMPLATE-run.json            # Results template
    group-A/                     # Control group outputs (created during run)
    group-B/                     # Treatment group outputs (created during run)
    group-A-results.json         # Aggregated A results (created after run)
    group-B-results.json         # Aggregated B results (created after run)
    run-YYYY-MM-DD.json          # Compiled summary (created by --compile)
```
