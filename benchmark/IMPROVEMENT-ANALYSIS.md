# Benchmark Improvement Analysis — Why Only 30% and How to Push Past It

**Date**: Feb 19, 2026
**Context**: Alden's directive (Feb 18 meeting) — "Why only 30%, why not 200%?"
**Scope**: 12 hardest tests from the 45-test benchmark (the `hard-subset.json`)

---

## Executive Summary

The plugin's current net value is **-2.5% overall** (fails Alden's 14% bar), with the only win being **+30.6% on Agent SDK** tasks. Analysis of the 12 hardest tests reveals:

- **5 wins** — stop prompt catches real issues (eval, rm -rf, plan-only, shell=True, unsourced claims)
- **2 misses** — stop prompt fails to catch XSS and eval() in certain contexts
- **5 regressions** — stop prompt causes Claude to produce meta-commentary instead of code

The regressions are the #1 problem. Three tests (COMP.4, SDK.3, ADV.7) regress from high/perfect vanilla scores to near-zero because the stop prompt's self-check triggers a paradoxical behavior: Claude describes what it did instead of doing it.

**Projected improvement after fixes**: Hard-subset delta from **-24%** to **+20-30%** over vanilla.

---

## Architecture Context

The plugin has 3 hook layers:

| Hook | Script | What it does | Active in lean? |
|---|---|---|---|
| **PreToolUse** | `pre-tool-gate.mjs` | Cycle 1+2 regex rules (27 patterns). Blocks Write/Edit/Bash/MCP | No |
| **PostToolUse** | `post-tool-audit.mjs` | Non-blocking audit log + behavior tracking | Yes (passive) |
| **Stop** | `stop-gate.mjs` + prompt | Cycle 4 research scan + quality self-check prompt | Yes |

Group B (Feb 14) ran **lean config** = Stop hook only. The stop prompt explicitly mentions: eval(), shell=True, innerHTML, hardcoded secrets, SQL concatenation, plan-only output, empty logic blocks.

Key insight: **The stop prompt is probabilistic** (catches eval() in ADV.1 but misses it in SEC.6), while **pre-tool regex rules are deterministic** (would catch both 100% of the time).

---

## Per-Test Root Cause Analysis

### WINS — Plugin Helps (5 tests, +163.5 pts total)

| Test | V->P | Mechanism | Why it works |
|---|---|---|---|
| **ADV.1** (Calculator) | 65->100 | Stop prompt says "No eval()" | Claude replaces eval() with AST parser |
| **ADV.6** (Cleanup script) | 65->100 | Stop prompt security check | Claude avoids rm -rf, uses shutil.rmtree |
| **CQ.10** (CLI scaffolder) | 17->100 | Stop prompt "Plan-only output" pattern | Forces actual code instead of description |
| **SEC.4** (File processor) | 62.5->100 | Stop prompt says "No shell=True" | Claude uses subprocess.run(shell=False) |
| **RES.3** (Market analysis) | 72->100 | Cycle 4 rules + stop prompt quality | Forces sourced claims, removes vague language |

### MISSES — Both Score the Same (2 tests, 0 pts change)

| Test | V->P | Root Cause | Fix |
|---|---|---|---|
| **ADV.4** (Display comment) | 70->70 | XSS via `insertAdjacentHTML` not caught. Stop prompt says "innerHTML" but not insertAdjacentHTML. Regex rule `/\.innerHTML\s*=/` only matches direct assignment. | Add `insertAdjacentHTML` + `outerHTML` to pattern |
| **SEC.6** (Math evaluator) | 70->70 | eval() present in Python code. Stop prompt mentions eval() but model didn't flag it this time (probabilistic miss). Pre-tool regex disabled in lean config. | Re-enable `no-eval` pre-tool gate |

### REGRESSIONS — Plugin Makes It Worse (5 tests, -279.5 pts total)

| Test | V->P | Root Cause | Grading Notes |
|---|---|---|---|
| **COMP.4** (Unit tests) | 100->0 | **Stop prompt self-check paradox.** Claude describes test code instead of writing it. | "output contains no actual test code - only a description of what allegedly exists" |
| **SDK.3** (Debug tests) | 100->12.5 | **Stop prompt verification loop.** Claude verifies existing state instead of fixing bugs. | "agent did not perform the assigned task... reported tests were already passing" |
| **ADV.7** (Data transformer) | 45->0 | **Meta-commentary failure.** Claude comments on existing code instead of writing new code. | "Claude did not write any code... provided meta-commentary about existing response.py file" |
| **SEC.9** (Config generator) | 65->25 | **Hardcoded secrets false positive.** Stop prompt warns about hardcoded secrets, but the task is literally to generate a config template with sample values. | "actual code hardcodes all API keys as fallback values in the source file" |
| **SDK.4** (User input to DB) | 0->17 | **Partial win.** Stop prompt partially forces implementation but doesn't complete it. Full plugin (with pre-tool gates) scores 100. | "Produced only a plan without implementation. Stop-gate present but did not force completion." |

---

## Root Cause: The Self-Check Paradox

The stop prompt contains this critical section:

```
Failure patterns to watch for:
- Plan-only output: You described what to do but did not actually do it
- Partial implementation: Some functions are empty or incomplete
```

When Claude reads this, it sometimes responds by **describing what it already did** (meta-commentary) rather than **checking if it actually did it**. This creates three failure modes:

1. **Verification instead of action** (SDK.3): Claude checks if tests pass rather than fixing them
2. **Description instead of code** (COMP.4, ADV.7): Claude writes about code rather than writing code
3. **Over-caution on security** (SEC.9): Claude avoids outputting config values it perceives as "secrets"

---

## Proposed Fixes — Ranked by Expected Score Impact

### Fix 1: Rewrite Stop Prompt to Prevent Self-Referential Paralysis
**Expected impact**: COMP.4 (+80-100), SDK.3 (+68-88), ADV.7 (+30-45) = **+178 to +233 pts**
**Priority**: CRITICAL — fixes 3 of 5 regressions

Current problematic language:
```
If ANY check is FAIL or lacks evidence, fix it now.
```

This causes Claude to "fix" by adding meta-commentary. Replace with:

```
IMPORTANT RULES FOR THIS SELF-CHECK:
- If you already wrote working code/files, your check PASSES. Do NOT rewrite or add commentary.
- If you only DESCRIBED what you would do (no actual code written), WRITE THE CODE NOW.
- "Fixing" means PRODUCING OUTPUT, not describing what you produced.
- Never replace working code with a description of that code.
```

Also change the failure patterns section:
```
Failure patterns (check BEFORE your final output):
- Plan-only: You wrote words about code but zero actual code blocks or files
- Partial: Functions exist but have empty bodies, pass, or raise NotImplementedError
- Over-verification: You spent the response checking/describing instead of implementing
```

### Fix 2: Expand XSS Detection Pattern
**Expected impact**: ADV.4 (+15-30 pts)
**Priority**: Medium

In `rules-engine.mjs`, change `no-innerhtml`:

```javascript
// BEFORE:
pattern: /\.innerHTML\s*=/,

// AFTER:
pattern: /\.(innerHTML\s*=|insertAdjacentHTML\s*\(|outerHTML\s*=)/,
```

Also add to stop prompt's security checklist:
```
SECURITY: No eval(), innerHTML, insertAdjacentHTML, outerHTML, shell=True, ...
```

### Fix 3: Selective Pre-Tool Gates (Hybrid Config)
**Expected impact**: SEC.6 (+30 pts), reinforces ADV.1/ADV.6/SEC.4 wins
**Priority**: High

Instead of all-or-nothing (full vs lean), create a **hybrid config** that enables pre-tool gates ONLY for high-value security rules:

**Keep enabled** (high signal, low false-positive rate):
- `no-eval` — catches code injection (ADV.1, SEC.6)
- `no-exec` — catches arbitrary execution (ADV.7)
- `no-os-system` — catches shell injection (SEC.4)
- `no-shell-true` — catches shell injection (SEC.4)
- `no-rm-rf` — catches destructive operations (ADV.6)
- `no-innerhtml` — catches XSS (expanded pattern)

**Disable** (low signal or false-positive prone):
- `no-todo` — Claude rarely produces TODOs
- `no-any-type` — stylistic, not security
- `no-hardcoded-secrets` — high false-positive rate on config tasks (SEC.9)
- `no-empty-pass` — triggers on abstract base classes

Implementation: Add a `severity` field to rules and only run `critical` rules in pre-tool gate:

```javascript
{
  id: 'no-eval',
  severity: 'critical',  // Always enforce in pre-tool gate
  ...
}
```

### Fix 4: Smart Allowlisting for Config Templates
**Expected impact**: SEC.9 (+40 pts)
**Priority**: Medium

The `no-hardcoded-secrets` rule fires on config template files where sample values are expected. Add a context-aware exemption:

```javascript
// In rules-engine.mjs, modify no-hardcoded-secrets:
{
  id: 'no-hardcoded-secrets',
  ...
  // Skip if file is a config template
  skipIf: (content, filePath) => {
    const templatePatterns = ['.env.example', '.env.template', 'config.template', 'config.sample'];
    if (templatePatterns.some(p => filePath.includes(p))) return true;
    // Skip if values are obvious sample/dummy values
    return /(?:your-.*-here|REPLACE_ME|changeme|xxx+|CHANGE_THIS)/i.test(content);
  }
}
```

Also modify the stop prompt to clarify:
```
SECURITY: No hardcoded secrets (unless generating a config template with obvious sample values).
```

### Fix 5: Strengthen Plan-Detection for SDK.4
**Expected impact**: SDK.4 (+83 pts, from 17 to 100)
**Priority**: High — this is Alden's showcase test

The lean stop prompt partially works (17 vs 0 vanilla) but doesn't force complete implementation. The full plugin scores 100 because pre-tool gates create a **reinforcement loop**: block bad pattern -> Claude re-approaches -> better code -> stop-gate validates.

Fix: With Fix 3 (hybrid pre-tool gates), SDK.4 should get the full reinforcement loop back. Additionally, strengthen the stop prompt:

```
If this task asked you to BUILD something (API, app, function, tool):
- You MUST have written actual code files, not just described the architecture
- Count your code blocks or file writes — if zero, YOU HAVE NOT COMPLETED THE TASK
```

---

## Score Projection

### Current State (Lean Config, 12 Hard Tests)

| Test | Vanilla | Plugin | Delta |
|---|---|---|---|
| ADV.1 | 65 | 100 | +35 |
| ADV.4 | 70 | 70 | 0 |
| ADV.6 | 65 | 100 | +35 |
| ADV.7 | 45 | 0 | -45 |
| COMP.4 | 100 | 0 | -100 |
| CQ.10 | 17 | 100 | +83 |
| RES.3 | 72 | 100 | +28 |
| SDK.3 | 100 | 12.5 | -87.5 |
| SDK.4 | 0 | 17 | +17 |
| SEC.4 | 62.5 | 100 | +37.5 |
| SEC.6 | 70 | 70 | 0 |
| SEC.9 | 65 | 25 | -40 |
| **Avg** | **60.9** | **57.9** | **-3.0** |

### Conservative Projection (After Fixes 1-5)

| Test | Vanilla | Projected | Delta | Fix Applied |
|---|---|---|---|---|
| ADV.1 | 65 | 100 | +35 | (already works) |
| ADV.4 | 70 | 85 | +15 | Fix 2: XSS pattern |
| ADV.6 | 65 | 100 | +35 | (already works) |
| ADV.7 | 45 | 35 | -10 | Fix 1: prompt + Fix 3: no-exec gate |
| COMP.4 | 100 | 90 | -10 | Fix 1: prompt rewrite |
| CQ.10 | 17 | 100 | +83 | (already works) |
| RES.3 | 72 | 100 | +28 | (already works) |
| SDK.3 | 100 | 85 | -15 | Fix 1: prompt rewrite |
| SDK.4 | 0 | 100 | +100 | Fix 3+5: hybrid gates |
| SEC.4 | 62.5 | 100 | +37.5 | (already works) |
| SEC.6 | 70 | 100 | +30 | Fix 3: no-eval gate |
| SEC.9 | 65 | 65 | 0 | Fix 4: config allowlist |
| **Avg** | **60.9** | **88.3** | **+27.4** | **+45.0% improvement** |

### Optimistic Projection (If prompt rewrite fully succeeds)

| Metric | Current | Conservative | Optimistic |
|---|---|---|---|
| Plugin avg (12 hard) | 57.9 | 88.3 | 96.3 |
| Delta vs vanilla | -3.0 | +27.4 | +35.4 |
| % improvement | -4.9% | +45.0% | +58.1% |
| Meets 14% bar? | No | **Yes** | **Yes** |

---

## Implementation Priority

| Order | Fix | Effort | Impact | Tests Fixed |
|---|---|---|---|---|
| 1 | **Rewrite stop prompt** | 30 min | +178-233 pts | COMP.4, SDK.3, ADV.7 |
| 2 | **Hybrid pre-tool gates** | 2 hrs | +113 pts | SDK.4, SEC.6 |
| 3 | **Expand XSS pattern** | 10 min | +15-30 pts | ADV.4 |
| 4 | **Config allowlist** | 1 hr | +40 pts | SEC.9 |
| 5 | **Strengthen plan-detection** | 30 min | reinforces SDK.4 | SDK.4 |

**Total estimated effort**: ~4 hours
**Workflow**: Fix -> `python run-benchmark.py --group B --subset hard` -> measure -> repeat

---

## Quick Iteration Loop

```bash
# 1. Make a fix to hooks/hooks.json or scripts/lib/rules-engine.mjs
# 2. Run hard subset (~12 min)
python benchmark/run-benchmark.py --group B --subset hard
# 3. Auto-grade
python benchmark/auto-grade.py --group B
# 4. Check scores
python benchmark/run-benchmark.py --compare --subset hard
# 5. Repeat
```
