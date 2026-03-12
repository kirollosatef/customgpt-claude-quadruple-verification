---
title: "How We Stopped Claude Code from Writing eval() in Production"
published: false
description: "Claude Code wrote eval() in our production codebase. Nobody caught it for 3 days. Here's the open-source plugin we built to make sure it never happens again."
tags: showdev, opensource, security, ai
cover_image:
canonical_url:
---

## Claude Code wrote `eval()` in our production codebase. Nobody caught it for 3 days.

It was a Tuesday refactor. We asked Claude Code to consolidate three config parsers into one. The task was mundane -- merge duplicate logic, unify the interface, write tests. Claude did exactly what we asked. Clean code. Tests passed. PR approved by two engineers who both said "looks good."

Three days later, our security scanner flagged it in the nightly report.

Buried on line 47 of the new unified parser:

```javascript
const parsed = eval('(' + configString + ')');
```

Claude had decided that the fastest way to parse a flexible config format -- sometimes JSON, sometimes a JS object literal -- was to `eval()` the string. And it was right. It worked perfectly. Every test passed. The code was readable, well-commented, and syntactically clean.

It was also a textbook remote code execution vulnerability.

If you're using AI coding tools, here's the question you should be asking yourself right now: **what's in your codebase that you haven't found yet?**

## The discovery

Our code review process is solid. Two human reviewers on every PR. Linting. Type checking. CI/CD pipeline with unit and integration tests. The problem is that every one of those checks is designed to catch things that look *wrong*.

`eval()` doesn't look wrong. It looks like a deliberate engineering decision. The function name is familiar. The usage was correct. The surrounding code had proper error handling. Claude even added a comment: `// Parse flexible config format (JSON or JS object literal)`.

Two senior engineers read that line and moved on.

This is the fundamental problem with AI-generated code: it doesn't make *syntactic* mistakes. It makes *judgment* mistakes. It reaches for dangerous patterns because those patterns genuinely solve the problem. And it wraps them in clean, well-documented code that sails through human review.

## It's not just `eval()`

After the incident, we audited three months of Claude-generated code across our projects. Here's what we found:

```python
# Merged by Claude during a "quick fix" to a deployment script
subprocess.call(deploy_cmd, shell=True)
```

Shell injection vector. Claude used `shell=True` because the command had pipes in it. Technically correct. Catastrophically unsafe.

```javascript
// Claude's "simple" way to render user-generated content
element.innerHTML = sanitize(userContent);
```

Except `sanitize` was a function Claude had written three files earlier that did `return str.replace('<script>', '')`. Not DOMPurify. A regex that misses `<img onerror=...>`, `<svg onload=...>`, and about a hundred other XSS vectors.

```bash
# Claude's deploy script for a staging environment
chmod 777 /var/www/app/uploads
```

World-writable permissions on an upload directory. Because "it's just staging."

```markdown
## Performance Results
Our optimization improved throughput by 340%, reducing p99 latency from
450ms to 120ms. According to industry benchmarks, this places our
system in the top 5% of comparable solutions.
```

Claude fabricated statistics for a docs page. "Industry benchmarks" that don't exist. A "340% improvement" that was never measured. A developer copy-pasted it into the README and shipped it. It's still on their marketing site.

And the one that bothers me the most:

```javascript
// TODO: implement rate limiting
app.post('/api/webhook', async (req, res) => {
  // Process webhook
  await processWebhook(req.body);
  res.json({ ok: true });
});
```

Claude generated stub code with a TODO comment, the developer asked for "the rest," and Claude marked the task complete. The TODO stayed. Rate limiting was never implemented. That endpoint got hammered in production a month later.

## Why existing tools miss it

You might be thinking: "We have SonarQube. We have Snyk. We have CodeRabbit."

Here's the timeline problem:

1. **Claude writes `eval()` at 2:14 PM** -- the developer sees it generate clean, working code
2. **Developer commits at 2:17 PM** -- tests pass locally
3. **PR created at 2:18 PM** -- CI runs SonarQube, but the developer has already moved on to the next file
4. **Code review at 4:30 PM** -- two hours later, reviewer scans 400 lines of diff
5. **SonarQube alert at 4:31 PM** -- flagged in a list of 23 findings, 19 of which are false positives
6. **Merged at 4:45 PM** -- "It's fine, the tests pass"

Every tool in your pipeline catches this *after the developer has lost context*. By the time SonarQube flags it, the developer is three files deep in a different feature. The finding becomes noise. It gets triaged. It gets deprioritized. It ships.

The only way to catch dangerous patterns reliably is to catch them **at the moment of generation** -- before the file is written, before the developer sees "clean" code, before context is lost.

## The fix: verification at generation time

We built [Quadruple Verification](https://github.com/kirollosatef/customgpt-claude-quadruple-verification), an open-source Claude Code plugin that intercepts every tool call and blocks dangerous patterns before they reach your filesystem.

Here's what happens now when Claude tries to write `eval()`:

```
 Quadruple Verification BLOCKED this operation:

[Cycle 2 - no-eval] Code uses eval(). This is a critical security risk
(code injection). Use a safe alternative.
  Fix: Use JSON.parse() or ast.literal_eval()

Fix these issues and try again.
```

The file is never written. Claude sees the block, understands why, and rewrites the code using `JSON.parse()`. The developer never sees the dangerous version. There's no finding to triage, no alert to dismiss, no PR comment to argue about. The vulnerability simply doesn't exist.

The same thing happens for every pattern we found in our audit:

```python
# BLOCKED before the file is written:
subprocess.call(cmd, shell=True)
# → "Use subprocess.run(["cmd", "arg"]) without shell=True"
```

```javascript
// BLOCKED before the file is written:
element.innerHTML = userContent;
// → "Use textContent or a sanitization library like DOMPurify"
```

```bash
# BLOCKED before the command runs:
chmod 777 /var/www/app
# → "Use chmod 755 for directories, 644 for files"
```

```javascript
// BLOCKED before the file is written:
// TODO: implement rate limiting
// → "Code contains a TODO/FIXME/HACK/XXX comment. Remove placeholder
//    comments and implement the actual logic."
```

```bash
# BLOCKED before the command runs:
curl https://example.com/install.sh | bash
# → "Download first, inspect, then execute."
```

## How it works technically

The plugin hooks into Claude Code's tool execution pipeline at three points:

### PreToolUse: regex gates (<50ms)

Every time Claude calls `Write`, `Edit`, `Bash`, any MCP tool, or `WebFetch`/`WebSearch`, the hook fires. It extracts the content being written, the command being run, or the URL being fetched, and runs it through 24 regex rules organized into three cycles:

**Cycle 1 -- Code Quality (10 rules):** Blocks TODO/FIXME/HACK comments, `pass` stubs, `NotImplementedError`, placeholder text, `console.log()` in production code, debugger statements across JS/TS/Python/Ruby.

**Cycle 2 -- Security (11 rules):** Blocks `eval()`, `exec()`, `os.system()`, `shell=True`, hardcoded secrets, SQL injection via string concatenation, `innerHTML` assignment, destructive `rm -rf`, `chmod 777`, `curl|bash` pipe execution, and non-HTTPS URLs.

**Cycle 4 -- Research Claims (3 rules):** Blocks vague unsourced language ("studies show," "experts say"), statistical claims without verification tags, and sourced claims missing URLs within 300 characters.

The regex engine runs in under 50ms. It adds virtually zero latency to normal operations. When nothing is wrong, you don't notice it's there.

### Stop hook: AI self-review

At the end of every session, a prompt hook asks Claude to review its own output for incomplete implementations, security risks, and unverified claims. This is the highest-value component -- in our benchmarks, it improved output quality by **31.8% on agent tasks** by catching cases where Claude described a plan but didn't execute it, or left subtle issues the regex couldn't catch.

### PostToolUse: audit trail

Every tool call -- blocked or approved -- gets logged to a JSONL audit file. Tool name, timestamp, decision, violations found. When something does slip through (no tool is perfect), the audit trail tells you exactly when it happened and what was checked.

### The architecture philosophy

Three design decisions we got right:

**Zero npm dependencies.** The entire plugin uses Node.js built-ins. `fs`, `path`, `process`. The optional LLM advisory feature uses the `https` module directly. No `node_modules` folder, no supply chain risk, no version conflicts.

**Fail-open design.** If the plugin crashes -- bad input, disk full, Node.js hiccup -- Claude continues working normally. Every entry point is wrapped in a `failOpen()` handler. Verification is important, but blocking your workflow because of a plugin bug is worse.

**Block by default.** When a rule triggers, the operation is blocked. There's no "ignore" button, no "suppress for this file" option. Claude has to fix the code and try again. This is intentional. The moment you add a bypass, every violation becomes "probably fine."

## The uncomfortable truth

Here's the part nobody wants to hear: **58% of AI-generated code contains security vulnerabilities** ([Veracode, 2024](https://www.veracode.com/)), and AI code has **1.7x more issues** than human-written code ([SonarQube, 2025](https://www.sonarsource.com/blog/ai-code-assurance/)). With **41% of all new code now generated by AI**, that's not a fringe risk. It's the default.

Your team is probably shipping `eval()` equivalents right now. Not because anyone is careless, but because AI-generated code looks *right*. It passes tests. It gets good reviews. It just happens to contain patterns that no human would have chosen.

The gap between "code that works" and "code that's safe" is exactly where AI coding tools live. Filling that gap is the entire point of this plugin.

## Installation: one command

```bash
npx @customgpt/claude-quadruple-verification
```

That's it. The installer writes `hooks.json` into your project's `.claude/` directory and updates `settings.json` to load the plugin. The next time you start Claude Code, every operation is verified.

What it does:
- Creates `.claude/hooks.json` with PreToolUse, PostToolUse, and Stop hooks
- Configures matchers for Write, Edit, Bash, MCP tools, and web operations
- Sets up the JSONL audit trail
- Adds the AI self-review prompt to the Stop hook

What it doesn't do:
- Modify your code
- Send data anywhere (everything runs locally)
- Add dependencies to your project
- Slow you down (regex gates complete in <50ms)

Works on Windows, macOS, and Linux. Requires Node.js 18+.

### Configuration

The plugin merges three config layers: plugin defaults, user config (`~/.config/quadruple-verify/config.json`), and project config (`.claude/quadruple-verify.json`). You can disable specific rules:

```json
{
  "disabledRules": ["no-console-log"],
  "cycle4": {
    "enabled": true,
    "acceptedVerificationTags": ["<!-- VERIFIED -->"]
  }
}
```

Need `console.log()` in a CLI tool? Disable that one rule. Everything else stays enforced.

## What this won't catch

I want to be honest about the boundaries. Regex rules catch syntactic patterns -- `eval()`, `shell=True`, hardcoded API keys. They don't catch:

- Logic bugs (incorrect algorithm, wrong business logic)
- Architectural flaws (wrong abstraction, poor separation of concerns)
- Subtle security issues (timing attacks, race conditions, TOCTOU)
- Context-dependent risks (a pattern that's safe in tests but dangerous in production)

The AI self-review (Stop hook) catches some of these, but it's not a replacement for human code review or proper security auditing. This plugin is a safety net, not a fortress. It catches the obvious things that should never ship, which frees up your actual review process to focus on the subtle stuff.

## Try it

**GitHub:** [github.com/kirollosatef/customgpt-claude-quadruple-verification](https://github.com/kirollosatef/customgpt-claude-quadruple-verification)

**Install:** `npx @customgpt/claude-quadruple-verification`

**What it costs:** Nothing. MIT license. Zero dependencies.

We built this because we needed it. We open-sourced it because everyone using Claude Code needs it.

---

**What's the worst thing an AI coding tool ever shipped into your codebase?** I'd genuinely like to know -- drop it in the comments. No judgment. We've all been there.
