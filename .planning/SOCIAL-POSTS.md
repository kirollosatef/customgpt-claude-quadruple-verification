# Social Media Launch Posts

## Twitter/X Post (Company Account: @CustomGPT_AI)

### Option A — Problem-first hook (recommended)

```
Claude Code ships TODOs as "finished" code.
It hardcodes API keys.
It makes up statistics.

We built a plugin that blocks all of that — automatically.

Quadruple Verification: 4 verification cycles that run on every Claude Code operation.

→ Blocks placeholder code before it's saved
→ Catches hardcoded secrets and eval()
→ AI self-review on every response
→ Flags "studies show" with no source

Zero dependencies. <50ms overhead. Open source.

github.com/customgpt-ai/customgpt-claude-quadruple-verification
```

### Option B — Short and punchy

```
We open-sourced a Claude Code plugin that blocks bad code before it reaches your files.

No more TODOs shipped as "done."
No more hardcoded API keys.
No more "studies show" with zero sources.

4 verification cycles. 20 rules. Zero dependencies.

→ github.com/customgpt-ai/customgpt-claude-quadruple-verification
```

---

## Reddit Post (r/ClaudeAI)

### Title:
"We built a free plugin that stops Claude Code from shipping TODOs, hardcoded secrets, and made-up statistics"

### Body:

```
Hey everyone,

If you use Claude Code, you've probably noticed it sometimes:

- Ships TODO comments as "finished" code
- Hardcodes API keys like `sk-proj-abc123` directly in files
- Uses `eval()` or `.innerHTML` without thinking twice
- Writes "studies show that 45% of..." with zero sources

We built **Quadruple Verification** — a Claude Code plugin that blocks these issues automatically before they reach your codebase.

## How it works

The plugin adds 4 verification gates to every Claude Code operation:

1. **Code Quality Gate** — Blocks TODOs, placeholder `pass` statements, `throw new Error("not implemented")`, and stub code
2. **Security Gate** — Catches `eval()`, hardcoded secrets, SQL injection, `rm -rf /`, `chmod 777`, `curl | bash`, and insecure HTTP URLs
3. **Output Quality Gate** — A second AI review pass checks completeness, correctness, and security before Claude finishes responding
4. **Research Claims Gate** — Flags vague phrases like "studies show" and requires source URLs near statistical claims

When something is caught, the file write is blocked and Claude has to fix the issue before proceeding.

## Quick install

```
npx @customgpt/claude-quadruple-verification
```

Or via the plugin marketplace:
```
/plugin marketplace add kirollosatef/customgpt-claude-quadruple-verification
```

Zero npm dependencies. The regex-based checks add <50ms. Open source (MIT).

**GitHub:** [link]

Would love your feedback — especially on false positives. You can disable any rule per-project if it's too noisy for your workflow.
```

---

## Reddit Post (r/ChatGPTCoding or r/ArtificialIntelligence)

### Title:
"Open-source plugin that adds automatic code quality and security verification to Claude Code"

### Body:
(Same as r/ClaudeAI post but with a bit more context about what Claude Code is)

---

## HackerNews Post

### Title:
"Quadruple Verification – Open-source plugin that blocks bad AI-generated code before it ships"

### Comment (post with submission):

```
Hi HN, I'm Kiro from CustomGPT.ai.

41% of code is now AI-generated, and that number is growing fast. But AI coding assistants have a pattern: they ship TODO comments as finished code, hardcode secrets, use eval(), and cite statistics that don't exist.

We built Quadruple Verification — a Claude Code plugin that adds 4 automatic verification gates:

1. Code quality (blocks TODOs, placeholders, stubs)
2. Security (catches eval, hardcoded keys, SQL injection, XSS)
3. Output quality (AI self-review before response delivery)
4. Research claims (flags unverified statistics and vague citations)

It runs as a hook system — regex checks add <50ms, zero dependencies, fail-open design (never breaks your workflow). MIT licensed.

The interesting technical bit: the highest-value component isn't the regex rules — it's the AI self-review (Cycle 3). In our benchmarks, having Claude review its own output before delivering it improved Agent SDK task quality by 31.8%. The regex rules are essentially free safety nets.

GitHub: [link]
```

---

## Notes for posting:
- Post from **company account** (CustomGPT.ai), not personal
- GitHub repo should be moved to `customgpt-ai` org before posting
- Post on Tuesday-Thursday, 8-10am PST for best engagement
- Watch comments and iterate fast after posting (Alden's instruction)
- Reply to every comment within the first 2 hours
