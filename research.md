# CustomGPT 3 Cycles Hooks

# Brainstorm:

Here’s the “professional” way to think about what you and Felipe built — and why it works (and why it *didn’t* work before).

## 1) Why Alden is right to prefer hooks over “skills”

A **skill / CLAUDE.md** is *advisory*: it’s context the model may ignore, forget after compaction, or simply not “decide” to apply.

A **hook** is *guaranteed execution* because it fires automatically at defined lifecycle points like:

- `PreToolUse` (before *every* tool call; can block)
- `PostToolUse` (after tool success)
- `Stop` (before Claude “finishes”; can prevent stopping) ([Claude Code](https://code.claude.com/docs/en/hooks))

That maps exactly to Alden’s “RAG-like grounding for every action” requirement.

## 2) The root cause of Felipe’s original “hooks never trigger”

Your early configs were **not valid Claude Code hook schema**, so Claude logged “Found 0 hook matchers in settings”.

The correct structure is:

- Hooks belong in **settings** files: `~/.claude/settings.json` (user) or `.claude/settings.json` (project), or managed deployment. ([Claude Code](https://code.claude.com/docs/en/settings))
- Each event is an array of **matcher groups**, and each group contains a `hooks` array of **handlers** with a `type` (`command`, `prompt`, or `agent`). ([Claude Code](https://code.claude.com/docs/en/hooks))
- `matcher` is a **regex string**, not an array (e.g. `"Write|Edit|Bash"`). ([Claude Code](https://code.claude.com/docs/en/hooks))

That’s why “hooks.json + matcher array + command directly” silently resulted in zero matchers.

Also: for enterprise reliability, always reference scripts using `"$CLAUDE_PROJECT_DIR"` (handles spaces like `Desktop/APPLE 2`). ([Claude Code](https://code.claude.com/docs/en/hooks))

## 3) The production-quality pattern: **one dispatcher hook**

Claude Code runs matching hooks **in parallel** (and deduplicates identical handlers). ([Claude Code](https://code.claude.com/docs/en/hooks))

So if you want **“3 cycles” in order**, don’t register 3 separate hooks and hope ordering works.

**Best practice:** register **one** `PreToolUse` command hook that runs a **dispatcher** (Node is great cross-platform), and inside it do:

1. Cycle 1 policy lint (TODO/placeholder)
2. Cycle 2 security scan
3. (optional in PreToolUse) fast sanity checks
    
    …and decide **allow/deny/ask**.
    

Blocking is done via **exit code 2** (stderr becomes the error Claude sees) and it prevents the tool call. ([Claude Code](https://code.claude.com/docs/en/hooks))

### Minimal correct config (project-scoped)

Put this in each repo as `.claude/settings.json`:

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit|Bash|mcp__.*",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/triple-verify.mjs",
            "timeout": 10
          }
        ]
      }
    ]
  }
}

```

Notes:

- `mcp__.*` covers MCP tools (great for “API input/output triple-check”). ([Claude Code](https://code.claude.com/docs/en/hooks))
- `Write` and `Edit` inputs include the content fields you need to scan (`Write.content`, `Edit.new_string`). ([Claude Code](https://code.claude.com/docs/en/hooks))

## 4) How to implement the 3 cycles “correctly”

### Cycle 1: Block TODO/shortcuts/placeholders (PreToolUse)

- For `Write`: scan `tool_input.content`
- For `Edit`: scan `tool_input.new_string` ([Claude Code](https://code.claude.com/docs/en/hooks))
    
    Block patterns:
    
- `TODO|FIXME|HACK|XXX`
- `pass` (Python) when it’s a placeholder
- `raise NotImplementedError`
    
    Return **exit 2** with a clean, actionable message. ([Claude Code](https://code.claude.com/docs/en/hooks))
    

### Cycle 2: Security scan (PreToolUse)

- For `Bash`: inspect `tool_input.command` ([Claude Code](https://code.claude.com/docs/en/hooks))
- For code writes/edits: scan content for:
    - `eval(`, `exec(`, `os.system`, `shell=True`, raw SQL string concat, obvious secrets patterns
        
        Alden’s “ground every API/tool call” fits here: match `mcp__.*` and validate tool inputs before they run. ([Claude Code](https://code.claude.com/docs/en/hooks))
        

### Cycle 3: Block failing tests (Stop + PostToolUse)

You have two good options:

**Option A (fast feedback):** `PostToolUse` runs tests async (doesn’t block), reports results back next turn. ([Claude Code](https://code.claude.com/docs/en/hooks))

**Option B (hard gate):** `Stop` hook blocks finishing unless tests pass. `Stop` can be prompt/agent based (agent can actually run tests via tools) and will prevent stopping when it returns `{ "ok": false }`. ([Claude Code](https://code.claude.com/docs/en/hooks))

In practice for enterprise:

- Use **PostToolUse async** to keep flow smooth
- Use **Stop gate** to ensure Claude can’t “ship” while red tests exist

## 5) Enterprise rollout (what “professional” looks like)

### Recommended maturity path

1. **Project-scoped** `.claude/settings.json` committed in each repo (quick win)
2. Upgrade to a **plugin** so hooks/scripts live in one versioned package (`hooks/hooks.json`, `${CLAUDE_PLUGIN_ROOT}`), and teams enable it. ([Claude Code](https://code.claude.com/docs/en/hooks))
3. For true enterprise enforcement: deploy **managed-settings.json** machine-wide and (optionally) set `allowManagedHooksOnly: true` so nobody can bypass with local/user hooks. ([Claude Code](https://code.claude.com/docs/en/settings))

### Non-negotiables for “production-quality”

- Add `$schema` to settings so invalid hook JSON gets caught by editors (prevents the exact failure Felipe hit). ([Claude Code](https://code.claude.com/docs/en/settings))
- Structured logging: every hook input includes `session_id` + `transcript_path`; log decisions with those IDs for auditability. ([Claude Code](https://code.claude.com/docs/en/hooks))
- Use `"$CLAUDE_PROJECT_DIR"` everywhere (paths with spaces). ([Claude Code](https://code.claude.com/docs/en/hooks))
- Test with `claude --debug hooks` and confirm it prints “Found X hook matchers in settings” (Claude docs even show what good debug output looks like). ([Claude Code](https://code.claude.com/docs/en/hooks))
- Use `/hooks` menu to verify the hook is actually loaded and from which scope. ([Claude Code](https://code.claude.com/docs/en/hooks))
    
    ---
    
    If you want, paste Felipe’s **current** working `.claude/settings.json` + the Node hook entrypoint (the dispatcher), and I’ll:
    
    - sanity-check it against the official schema,
    - suggest a clean “v1.0 enterprise” folder layout,
    - and give you a stress-test checklist that specifically targets bypasses + false positives + latency.

# Architecture

> so  what is the best architecture for doing that ? is it the hook ? can you also search all the Claude docs to see if there's anything else ?
> 

Yes — if Alden’s requirement is **“it must happen automatically on every operation”**, then **hooks are the right enforcement layer**, not a “skill”. Claude Code’s docs are pretty explicit that hooks exist to provide **deterministic control** (things always happen, not “LLM decides”). ([Claude Code](https://code.claude.com/docs/en/hooks-guide))

Here’s the **best “production-quality” architecture** I’d recommend, based on Claude Code’s hook system + deployment options:

---

## Recommended architecture (Enterprise-grade)

### 1) One “Policy Engine” invoked by hooks (don’t scatter logic)

Use **one** fast executable (Node/Go/Python) as a **gatekeeper** that:

- reads hook JSON from stdin
- runs your “triple verification” pipeline
- returns allow/deny (and reason) in the correct hook output format

Why one engine?

- Claude Code can run **multiple matching hooks in parallel** (and dedupe identical handlers), so if you want **ordered “Cycle 1 → Cycle 2 → Cycle 3”**, you should implement the ordering **inside one gatekeeper**, not as 3 separate hook handlers. ([Claude Code](https://code.claude.com/docs/en/hooks))

### 2) Enforce “every operation” with **PreToolUse**

**PreToolUse** runs *after tool params are created and before execution*, and it **can block** the tool call. It matches on tool names like `Write/Edit/Bash/Read/WebFetch/WebSearch` and even **MCP tool names**. ([Claude Code](https://code.claude.com/docs/en/hooks))

This is where you enforce:

- **Cycle 1 (no TODO/shortcuts/placeholders)**: scan `tool_input.content` (Write) / `tool_input.new_string` (Edit) ([Claude Code](https://code.claude.com/docs/en/hooks))
- **Cycle 2 (security patterns)**: scan content + bash commands + URLs; optionally allowlist domains/tools
- **API/tool I/O verification**: for `WebFetch` / MCP calls, validate inputs before they go out ([Claude Code](https://code.claude.com/docs/en/hooks))

### 3) Don’t run full tests on every tool call — gate them with **Stop** (or async + Stop)

Cycle 3 (“block failing tests”) is expensive if done on every Write/Edit.

Best practice:

- Run quick checks in **PreToolUse** (lint / typecheck / pattern checks).
- Run the *real test suite* at completion using a **Stop hook**:
    - `Stop` hooks can block Claude from finishing and feed back “reason” so it continues fixing. ([Claude Code](https://code.claude.com/docs/en/hooks))
    - If tests require tool access, use a **type: "agent" Stop hook** (it can run tools like Bash/Read/etc to verify). ([Claude Code](https://code.claude.com/docs/en/hooks-guide))

Optional performance pattern:

- Use **PostToolUse async** to kick off tests after Write/Edit (non-blocking), then **Stop** ensures “must be green before finishing.” Async can’t block by itself. ([Claude Code](https://code.claude.com/docs/en/hooks))

### 4) Add auditability: structured logs keyed by session/tool_use_id

Hook input includes useful fields like `session_id`, `transcript_path`, `cwd`, and tool-specific inputs. Log each decision as JSONL:

- event + tool + file_path
- checks run + verdicts
- hashes of content (avoid storing secrets)
    
    This gives Alden the “how decisions were made” audit trail. ([Claude Code](https://code.claude.com/docs/en/hooks))
    

---

## How to roll it out to 30 employees (the “professional” part)

### Option A (fastest): Repo or user settings

Hooks can live in:

- `~/.claude/settings.json` (global for a dev)
- `.claude/settings.json` (repo, shareable)
    
    ([Claude Code](https://code.claude.com/docs/en/settings))
    

### Option B (best for enterprise): **managed-settings.json**

Claude Code supports **org-wide managed settings** deployed to system paths (Windows/Linux/macOS). ([Claude Code](https://code.claude.com/docs/en/settings))

And you can enforce:

- `allowManagedHooksOnly: true` to prevent user/project/plugin hooks from overriding (only managed + SDK hooks run). ([Claude Code](https://code.claude.com/docs/en/settings))

### Option C (clean packaging): a Plugin that bundles hooks + scripts

Plugins can ship `hooks/hooks.json` and scripts, and hooks merge when enabled. ([Claude Code](https://code.claude.com/docs/en/hooks))

For teams, you can manage plugin enablement via `enabledPlugins` and distribute marketplaces via `extraKnownMarketplaces` (or lock down via managed `strictKnownMarketplaces`). ([Claude Code](https://code.claude.com/docs/en/settings))

---

## “Is there anything else besides hooks?”

From Claude’s docs, the relevant alternatives/adjacent mechanisms are:

1. **Prompt-based hooks** (`type: "prompt"`)
    
    Good when “judgment” is needed; model returns `{ ok: true/false }`. ([Claude Code](https://code.claude.com/docs/en/hooks-guide))
    
2. **Agent-based hooks** (`type: "agent"`)
    
    For multi-step verification that needs tool access (e.g., actually running tests). ([Claude Code](https://code.claude.com/docs/en/hooks-guide))
    
3. **Hooks inside Skills/Agents**
    
    Possible, but only active while that component is active — so not great for “nobody can forget.” ([Claude Code](https://code.claude.com/docs/en/hooks))
    
4. **Agent SDK / programmatic usage (“headless”)**
    
    If you ever want a *centralized* enforcement gateway (CI, bots, internal tooling), the Agent SDK gives “Claude Code’s loop” programmatically. ([Claude Code](https://code.claude.com/docs/en/headless))
    
    But for day-to-day dev tool calls in the CLI, hooks are still the most direct enforcement.
    

---

## Minimal “golden pattern” event mapping

- **PreToolUse**: block bad writes/edits/commands + validate API inputs (your main enforcement) ([Claude Code](https://code.claude.com/docs/en/hooks))
- **PostToolUse (optional)**: coaching / warnings / async triggers ([Claude Code](https://code.claude.com/docs/en/hooks))
- **Stop**: final gate (tests pass, no policy violations, output verified) ([Claude Code](https://code.claude.com/docs/en/hooks-guide))

If you want, paste Felipe’s current working `settings.json` + the Node hook entrypoint (even redacted), and I’ll suggest a “v1 production” layout: folder structure, config format, logging format, and the rollout path (plugin vs managed-settings) without changing the behavior you already validated.

# Ship

> how can we share that after finishing with all the company for different OSs and make it working good and not making all users there claude bad ! and buggy!
also who they will install that should we have a landsing page an a public hing that will srtup that automaticly and how ? what is the options ?
> 

### Is “hooks” the right primitive for triple verification?

Yes — if the requirement is **“run automatically on every operation (tool use + final output)”**, **hooks are the built-in mechanism designed for that**. Hooks fire inside the agentic loop (e.g., `PreToolUse`, `PostToolUse`, `Stop`) and can **block** actions via structured decisions. Skills/CLAUDE.md instructions are useful context, but they **don’t guarantee execution** unless Claude decides to use them or the component is active. Hooks are explicitly meant for “always run” enforcement. ([Claude Code](https://code.claude.com/docs/en/hooks))

---

## Best-practice architecture (production-quality)

### 1) Split verification by lifecycle (fast vs heavy)

A clean “enterprise” design is:

**A. PreToolUse (hard gate, fast, deterministic)**

- Runs before `Write|Edit|Bash|mcp__*` etc.
- Enforce **Cycle 1 + Cycle 2** here (TODO/placeholder + security patterns) because they’re quick and should block before damage.
- Implement as a **command hook** that receives JSON on stdin. ([Claude Code](https://code.claude.com/docs/en/hooks))

**B. PostToolUse (soft feedback or async checks)**

- Use it for formatting, linting, telemetry, or async tests.
- **Async PostToolUse is allowed** but **cannot block** (important!). ([Claude Code](https://code.claude.com/docs/en/hooks))

**C. Stop (hard gate for “final answer quality” + full test gate)**

- This is the right place to enforce “don’t stop until verified”, including **Cycle 3 (tests)** and “triple-check the text I’m about to show the user.”
- You can do this with **prompt hooks** (fast) or **agent hooks** (can run tools like tests/read files). ([Claude Code](https://code.claude.com/docs/en/hooks))

### 2) Use one “policy engine” entrypoint (don’t scatter scripts)

For cross-OS reliability, don’t rely on random `.sh` paths. Ship a single executable/command like:

- `claude-verify pretool` (for `PreToolUse`)
- `claude-verify stop` (for `Stop`)

Then every hook calls **the same stable command**, and you version/configure behavior in one place.

Claude Code explicitly supports feeding hook context JSON via stdin to a command hook, and it supports timeouts. ([Claude Code](https://code.claude.com/docs/en/hooks))

### 3) Add safety controls so you don’t “make Claude buggy”

Key guardrails from the docs + enterprise reality:

- **Timeout everything** (fast gates should be ~50–300ms; stop gates can be longer).
- Decide policy for failures:
    - **Fail-open** during rollout (if verifier crashes, don’t block devs)
    - **Fail-closed** once stable (strict enforcement)
- Keep a **global kill switch** (`"disableAllHooks": true`) that IT/DevOps can push if something goes wrong. ([Claude Code](https://code.claude.com/docs/en/settings))
- Remember: Claude snapshots hooks at startup; changes require review in `/hooks` before they apply, which actually helps prevent “sudden breakage mid-session.” ([Claude Code](https://code.claude.com/docs/en/hooks))

---

## What else exists in Claude docs besides hooks?

There are **4 relevant “distribution/packaging” primitives**, each with different guarantees:

1. **Settings-scoped hooks**
    - User: `~/.claude/settings.json`
    - Project: `.claude/settings.json` (commit to repo)
    - Managed: org-wide policy (best for enterprise) ([Claude Code](https://code.claude.com/docs/en/hooks))
2. **Plugins** (bundle hooks/scripts/skills/agents)
    - Plugin hooks live in `hooks/hooks.json` and run when plugin is enabled. ([Claude Code](https://code.claude.com/docs/en/hooks))
3. **Repo-distributed plugin marketplaces** (`extraKnownMarketplaces`)
    - Great for teams, but **requires explicit consent/trust prompts** (not fully “silent auto”). ([Claude Code](https://code.claude.com/docs/en/settings))
4. **Managed enterprise controls**
    - `managed-settings.json` can enforce policies org-wide and can even block user/project/plugin hooks if you want (`allowManagedHooksOnly`). ([Claude Code](https://code.claude.com/docs/en/settings))

---

# How to roll this out to the whole company (Windows/macOS/Linux) without breaking people

## Option 1 (recommended for “must always run”): IT-managed policy + single verifier binary

**Who installs?** IT/DevOps via endpoint management (Intune/Jamf/MDM/Ansible/etc.)

**How it works**

- Deploy `managed-settings.json` to the system-wide path:
    - macOS: `/Library/Application Support/ClaudeCode/`
    - Linux/WSL: `/etc/claude-code/`
    - Windows: `C:\Program Files\ClaudeCode\` ([Claude Code](https://code.claude.com/docs/en/settings))
- `managed-settings.json` defines the hooks and points them to `claude-verify` on PATH.
- Optionally enforce **only managed hooks** (prevents user/plugin hooks from interfering): `allowManagedHooksOnly: true`. ([Claude Code](https://code.claude.com/docs/en/settings))

**Pros**

- True enterprise enforcement, consistent behavior, easy rollback (push one file).
- Avoids per-repo drift and “works on my machine”.

**Cons**

- Requires admin privileges + deployment pipeline.

## Option 2 (good for engineering teams): commit `.claude/settings.json` in each repo

**Who installs?** Nobody “installs”; it rides with the repo.

**How it works**

- Each repo includes `.claude/settings.json` that enables hooks.
- Hooks call a verifier that’s installed per-developer (or vendored).

**Pros**

- Very fast to ship across your 9 repos.
- Easy to iterate.

**Cons**

- Not truly enforceable org-wide (people can override locally unless you move to managed policy).
- Still need cross-OS setup for the verifier command.

## Option 3 (best packaging UX): internal plugin marketplace + plugin bundles hooks

**Who installs?** Devs (or IT if you later enforce via managed settings)

**How it works**

- Publish `customgpt-verification` as a Claude Code plugin that contains:
    - `hooks/hooks.json`
    - scripts/binaries/config
- In `.claude/settings.json`, add `extraKnownMarketplaces` + `enabledPlugins` so teammates get prompted to install. ([Claude Code](https://code.claude.com/docs/en/settings))
- Later, lock it down via managed settings + `strictKnownMarketplaces`. ([Claude Code](https://code.claude.com/docs/en/settings))

**Pros**

- Clean versioning + updates.
- One artifact, less “copy this folder” chaos.

**Cons**

- Still consent-based unless you go managed.

---

## Should you build a landing page + “one-click installer”?

Yes — but the **installer should choose one of the options above**.

### What the landing page should provide (practical)

1. **Support matrix** (what you officially support)
    - Based on your experience: **Windows native Claude** behaved differently than **WSL Claude**. I’d treat WSL as “beta/unsupported until proven”.
2. **One command per OS**
    - Windows (PowerShell): installs verifier + writes settings (or tells user to restart)
    - macOS/Linux (shell): same
3. **Verification step**
    - A single “smoke test” prompt: “Create a file with TODO” → should block.
4. **Rollback instructions**
    - Flip `"disableAllHooks": true` or remove plugin / managed file. ([Claude Code](https://code.claude.com/docs/en/hooks))

### “Public thing that sets up automatically” — what’s realistically possible?

- **Silent, mandatory, company-wide auto-enforcement** ⇒ only really clean with **managed-settings.json** pushed by IT (because it’s system-wide and highest precedence). ([Claude Code](https://code.claude.com/docs/en/settings))
- **Self-serve automation** (engineers run a script) ⇒ doable, but it’s opt-in and you must handle prompts/restart/`/hooks` review because hooks are snapshotted and changes require review. ([Claude Code](https://code.claude.com/docs/en/hooks))

---

## My concrete recommendation for CustomGPT.ai

**Phase 1 (now, stress test 2–3 days):**

- Keep what Felipe built, but refactor into a single `claude-verify` entrypoint + config file.
- Use:
    - `PreToolUse` for TODO/security blocking
    - `Stop` (agent hook) for “tests must pass + output must be verified” ([Claude Code](https://code.claude.com/docs/en/hooks))

**Phase 2 (rollout):**

- Ship an internal plugin + landing page for easy adoption.
- Start with repo-level `.claude/settings.json` across your 9 repos.

**Phase 3 (true enterprise):**

- IT deploys `managed-settings.json` org-wide and (optionally) `allowManagedHooksOnly: true` once stable. ([Claude Code](https://code.claude.com/docs/en/settings))

If you want, paste Felipe’s current Windows settings + hook config (sanitized), and I’ll map it into the “Phase 3 managed policy” layout + a rollout checklist (canary → staged → full) that minimizes false positives and “Claude feels broken” complaints.