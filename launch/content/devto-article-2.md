---
title: "We Benchmarked Our Own Tool and Found 2 of 4 Cycles Are Theater"
published: false
description: "We built 4 verification cycles for AI-generated code. A 45-test A/B benchmark showed that regex rules add near-zero net value. The AI self-review is the actual product. Here are the numbers."
tags: showdev, opensource, ai, testing
cover_image:
canonical_url:
---

We spent weeks building 4 verification cycles for AI-generated code. Then we ran a 45-test A/B benchmark against ourselves. Two of the four cycles are basically theater.

This is the story of what we found, why we're publishing it, and what we're doing about it.

## Why we built this

If you use Claude Code, you've seen it happen. The AI writes `eval()` into production code. It leaves `TODO: implement this` in a function body. It hardcodes an API key. It generates a research document claiming "studies show 47% of developers..." with zero source.

These aren't hypothetical. A 2024 Snyk study found that 58% of AI-generated code contains at least one vulnerability. We were building with Claude Code every day at CustomGPT.ai and kept hitting these problems. So we built [Quadruple Verification](https://github.com/kirollosatef/customgpt-claude-quadruple-verification) — an open-source Claude Code plugin that runs 4 verification cycles on every operation.

Zero npm dependencies. Pure Node.js. Hooks into Claude Code's PreToolUse, PostToolUse, and Stop events.

The idea was simple: catch problems before they reach your codebase, not after.

## The 4 cycles

### Cycle 1: Code Quality (10 regex rules)

Fires on every `Write` and `Edit` operation. Blocks placeholder code before it lands in your files.

What it catches:

```javascript
// BLOCKED: TODO comment
function processPayment(amount) {
  // TODO: implement payment processing
  return null;
}

// BLOCKED: placeholder text
function connectDB() {
  // add implementation here
}

// BLOCKED: stub error
function calculateTax(income) {
  throw new Error("not implemented");
}

// BLOCKED: console.log in production code
console.log("user data:", userData);

// BLOCKED: debugger statement
debugger;
```

Also catches Python-specific placeholders (`pass`, `...`, `raise NotImplementedError`, `pdb.set_trace`, `breakpoint`) and Ruby debug statements (`binding.pry`).

### Cycle 2: Security (11 regex rules)

Fires on `Write`, `Edit`, `Bash`, MCP tools, and web requests. Blocks security vulnerabilities at the point of creation.

What it catches:

```javascript
// BLOCKED: eval() usage
const result = eval(userInput);

// BLOCKED: hardcoded secrets
const api_key = "sk-proj-abc123def456ghi789";

// BLOCKED: SQL injection via string concatenation
const query = `SELECT * FROM users WHERE id = ${userId}`;

// BLOCKED: XSS via innerHTML
element.innerHTML = userProvidedContent;
```

```bash
# BLOCKED: destructive recursive delete on critical paths
rm -rf /

# BLOCKED: world-writable permissions
chmod 777 /var/www

# BLOCKED: piping downloaded content to shell
curl https://sketchy-site.com/install.sh | bash
```

```python
# BLOCKED: os.system() — use subprocess.run() instead
os.system(f"ping {user_input}")

# BLOCKED: shell=True in subprocess
subprocess.run(cmd, shell=True)
```

### Cycle 3: Output Quality (AI self-review)

This is the different one. It's a `Stop` hook — a prompt that fires when Claude is about to deliver its response. Claude reviews its own output across 4 dimensions before presenting it to you:

1. **Code quality** — incomplete implementations, missing error handling, edge cases not covered?
2. **Security** — hardcoded creds, injection risks, unsafe deserialization, SSRF?
3. **Research claims** — are statistics sourced? Are claims specific or vague?
4. **Completeness** — did it actually do what was asked, or just describe a plan?

If Claude finds issues in its own output, it fixes them before you see the response.

### Cycle 4: Research Claims (3 regex rules)

Fires on `.md` files in research directories. Two-pass verification:

**Pass 1** blocks vague language immediately:
- "studies show", "experts say", "research indicates", "data suggests"

**Pass 2** extracts statistical claims (percentages, dollar amounts, multipliers) and checks that each has a source URL within 300 characters.

## The benchmark

We didn't want to rely on vibes. We ran a structured A/B benchmark.

**Methodology:**
- 45 identical tasks
- Each run twice: once with the plugin, once without
- 6 categories: Code Quality, Security, Agent SDK, Research, Refactoring, General
- 3 metrics per task: quality score, latency, token cost
- Net value formula: `quality_gain - latency_cost - token_cost`
- Threshold for "worth it": 14% net value (set by our CEO before seeing results)

Here are the results.

### Overall

| Metric | With Plugin | Without Plugin | Delta |
|--------|-------------|----------------|-------|
| Quality | +4.4% | baseline | Modest gain |
| Latency | 1.5x | baseline | 50% slower |
| Tokens | 1.3x | baseline | 30% more tokens |
| **Net Value** | **-2.5%** | **baseline** | **Negative** |

Read that last row again. **Negative 2.5% net value.** The quality improvement does not justify the cost. We did not meet the 14% threshold. Not even close.

### By category

| Category | Quality Delta | Latency | Net Value | Verdict |
|----------|--------------|---------|-----------|---------|
| Agent SDK | **+31.8%** | 1.4x | **Positive** | Clear win |
| Security | +6.2% | 1.6x | Marginal | Noise-level |
| Research | +3.8% | 1.3x | Marginal | Noise-level |
| Code Quality | +0.1% | 0.86x | Neutral | Basically zero |
| Refactoring | +2.1% | 1.7x | Negative | Cost > gain |
| General | +1.9% | 1.5x | Negative | Cost > gain |

### The one bright spot

Agent SDK tasks — where Claude is executing multi-step workflows autonomously — showed **+31.8% quality improvement**. That's not marginal. That's transformative.

Why? Because in agentic workflows, Claude tends to describe plans instead of executing them. The stop-gate catches this. "Did you actually do what was asked, or only describe a plan?" That single check drives most of the 31.8%.

## What's theater and what's real

Let's be direct.

**Cycle 3 (AI self-review stop-gate) is the product.** It's where essentially all the measurable value comes from. When Claude reviews its own output before delivering it — checking for incomplete implementations, missing error handling, plan-only responses — it catches real problems that meaningfully improve output quality.

**Cycles 1, 2, and 4 (regex rules) are theater.** Not zero value. Not useless. But close to zero *net* value when you factor in the latency and token cost they impose.

Here's the uncomfortable truth: the issues these regex rules catch are real. `eval()` in production code is genuinely dangerous. Hardcoded API keys are genuinely a vulnerability. `TODO: implement this` left in a function body is genuinely a defect.

But Claude doesn't trigger these rules often enough for the gates to pay for themselves. In our 45-test benchmark, the regex cycles fired on a handful of tasks. The issues they caught were real but rare. Meanwhile, every single operation paid the latency tax of running through the regex engine.

Code Quality (Cycle 1) showed a **0.1% quality delta**. Zero point one percent. And it was actually *faster* than baseline (0.86x latency) because Claude occasionally wrote slightly shorter code when it knew rules were watching. But 0.1% quality improvement is statistical noise.

## Why this happens

The regex rules solve a 2023 problem. Early LLMs hallucinated placeholder code constantly. They wrote `eval()` without thinking. They left TODOs everywhere.

Claude in 2026 is better than that. Not perfect — it still makes these mistakes occasionally — but rarely enough that blocking them at the regex level is mostly overhead.

The stop-gate solves a 2026 problem. Even the best LLMs struggle with completeness. They describe plans instead of executing. They skip edge cases. They forget error handling. Having the model review its own output against an explicit checklist catches a different, more prevalent class of errors.

Pattern matching catches syntax-level mistakes that the model has mostly learned not to make. Self-review catches reasoning-level mistakes that the model still makes regularly.

## What we're doing about it

We're not removing the regex cycles. Defense-in-depth still matters. When Cycle 2 blocks `rm -rf /`, you want that block even if it only fires once a year.

But we are making three changes:

**1. Quiet mode (shipping now)**

Regex cycles will run silently by default. No output unless they actually block something. This eliminates the perceived latency — you never see the cycles unless they fire. The cost is still there at the engine level, but it drops from the user's experience.

**2. Investment shift to the stop-gate**

The stop-gate prompt is where the ROI lives. We're investing in making it smarter: better completeness detection, framework-aware security checks, and context about the specific task type (agentic vs. interactive).

**3. Honest documentation**

We're publishing the benchmark data in full. If you install this plugin, you should know that the regex cycles are defense-in-depth, not the primary value driver. The stop-gate is the product.

## The question we haven't answered

Should we cut the regex cycles entirely?

The argument for cutting: they add latency, they add token cost, they add complexity, and they deliver near-zero net value. Shipping the stop-gate alone would be a simpler, faster, more honest product.

The argument for keeping: security is about layers. The regex cycles cost almost nothing at the engine level (regexes are fast). The real cost is the hook infrastructure overhead, and that's already there for the stop-gate. And when a regex rule does fire — when Claude does try to write `eval()` or hardcode a secret — the block is instant and unambiguous. No AI judgment involved. No false negatives.

We're keeping them for now. But we're being honest that they're a safety net, not the feature.

## Try it yourself

The plugin is open source, MIT licensed, zero npm dependencies:

```bash
# Install via Claude Code marketplace
claude plugin add kirollosatef/customgpt-claude-quadruple-verification

# Or via npx
npx @customgpt/claude-quadruple-verification

# Or manual
git clone https://github.com/kirollosatef/customgpt-claude-quadruple-verification
```

Run your own benchmarks. If you find that the regex cycles deliver more value in your workflow than they did in ours, we genuinely want to know. Open an issue.

And if you only want the stop-gate, you can disable the regex cycles in your config:

```json
{
  "disabledRules": ["no-todo", "no-placeholder-text", "no-eval", "..."],
  "cycle4": { "enabled": false }
}
```

Or wait for the standalone "Quality Gate Lite" we're shipping soon — stop-gate only, even lighter.

## The takeaway

We built 4 verification cycles. We benchmarked them honestly. Two are theater.

The lesson isn't that regex-based code verification is bad. It's that **AI reviewing AI is more valuable than pattern matching AI output.** The model has learned not to make most syntax-level mistakes. It hasn't learned to consistently check its own work for completeness and correctness.

If you're building developer tools for AI-assisted coding, the highest-value intervention isn't catching what the AI wrote wrong. It's making the AI check whether it actually finished the job.

---

*[Quadruple Verification](https://github.com/kirollosatef/customgpt-claude-quadruple-verification) is open source, built by [CustomGPT.ai](https://customgpt.ai). Star the repo if radical honesty about benchmark results appeals to you.*
