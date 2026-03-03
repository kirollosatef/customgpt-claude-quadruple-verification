# CustomGPT Quadruple Verification for Claude Code

[![CI](https://github.com/kirollosatef/customgpt-claude-quadruple-verification/actions/workflows/ci.yml/badge.svg)](https://github.com/kirollosatef/customgpt-claude-quadruple-verification/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@customgpt/claude-quadruple-verification)](https://www.npmjs.com/package/@customgpt/claude-quadruple-verification)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](https://github.com/kirollosatef/customgpt-claude-quadruple-verification)

LLM-powered intelligent verification on every Claude Code operation. Regex fast gates block obvious violations instantly, while an AI-driven multi-section review ensures code quality, security, research accuracy, and completeness — before anything ships.

Built by [CustomGPT.ai](https://customgpt.ai) for production teams running Claude Code at scale.

<!-- TODO: Replace with actual demo GIF after recording -->
<!-- ![Demo](demo/demo.gif) -->

## What It Does

Four verification cycles run automatically on every Claude Code operation:

| Cycle | When | What |
|-------|------|------|
| **Cycle 1 — Code Quality** | Before file write/edit | Regex gate blocks TODO, placeholder, stub, and incomplete code |
| **Cycle 2 — Security** | Before write/edit/bash/MCP | Regex gate blocks eval(), hardcoded secrets, SQL injection, XSS, destructive commands |
| **Cycle 3 — Output Quality** | Before Claude finishes | AI multi-section review: code quality, security, research claims, completeness |
| **Cycle 4 — Research Claims** | Before write/edit of research .md | Blocks vague language, unverified stats, missing source URLs |
| **Audit Trail** | After every operation | Full JSONL audit log + optional LLM advisory analysis |

## Quick Start

### Requirements
- Node.js >= 18
- Claude Code CLI

### Option 1: Marketplace (Recommended)

Two commands inside Claude Code — includes auto-updates:

```
/plugin marketplace add kirollosatef/customgpt-claude-quadruple-verification
/plugin install customgpt-claude-quadruple-verification@kirollosatef-customgpt-claude-quadruple-verification
```

That's it. The plugin auto-updates every session.

### Option 2: npx

Run from any terminal:

```bash
npx @customgpt/claude-quadruple-verification
```

### Option 3: Manual Install

**Windows (PowerShell):**
```powershell
git clone https://github.com/kirollosatef/customgpt-claude-quadruple-verification.git
cd customgpt-claude-quadruple-verification
.\install\install.ps1
```

**macOS / Linux:**
```bash
git clone https://github.com/kirollosatef/customgpt-claude-quadruple-verification.git
cd customgpt-claude-quadruple-verification
bash install/install.sh
```

### Verify Installation
```bash
node install/verify.mjs
```

### Test It
1. Start Claude Code in any project
2. Ask: *"Create a Python file with a TODO comment"*
3. The operation should be **BLOCKED** with an explanation
4. Check audit logs in `.claude/quadruple-verify-audit/`

## Team Setup

To auto-prompt all team members to install the plugin, commit this file to each repo:

**`.claude/settings.json`**
```json
{
  "plugins": [
    "kirollosatef/customgpt-claude-quadruple-verification"
  ]
}
```

When anyone opens the project in Claude Code, they'll be prompted to install the plugin. See [`docs/team-setup/settings.json`](docs/team-setup/settings.json) for the template.

## Auto-Updates

- **Marketplace installs** auto-update every session — push to the repo and everyone gets it.
- **npx installs** get the latest version each time `npx` runs.
- **Manual installs** require `git pull` to update.

## How It Works

The plugin uses Claude Code's hook system to intercept operations at three points:

```
User Request → Claude generates code
                    ↓
              ┌─────────────┐
              │  Cycle 1    │  PreToolUse (Write|Edit)
              │  Quality    │  Blocks placeholder/TODO code
              └──────┬──────┘
                     ↓
              ┌─────────────┐
              │  Cycle 2    │  PreToolUse (Write|Edit|Bash|MCP)
              │  Security   │  Blocks eval, secrets, injection
              └──────┬──────┘
                     ↓
              ┌─────────────┐
              │  Cycle 3    │  Stop (prompt hook)
              │  Output QA  │  Second AI reviews final output
              └──────┬──────┘
                     ↓
              ┌─────────────┐
              │  Cycle 4    │  PreToolUse (Write|Edit) + Stop
              │  Research   │  Blocks vague claims, missing sources
              └──────┬──────┘
                     ↓
              ┌─────────────┐
              │  Audit      │  PostToolUse (all tools)
              │  Logger     │  JSONL trail of every operation
              └─────────────┘
```

## Configuration

Configuration merges from three sources (later overrides earlier):

1. **Plugin defaults** — `config/default-rules.json`
2. **User config** — `~/.claude/quadruple-verify-config.json`
3. **Project config** — `$PROJECT/.claude/quadruple-verify-config.json`

### Example: Disable a Rule
```json
{
  "disabledRules": ["no-todo"]
}
```

### Example: Project-Level Config
Create `.claude/quadruple-verify-config.json` in your project:
```json
{
  "disabledRules": ["no-empty-pass"],
  "audit": {
    "enabled": true
  }
}
```

## Rules Reference

See [docs/RULES.md](docs/RULES.md) for the complete list of verification rules with examples.

### Cycle 1 — Code Quality
- `no-todo` — Block TODO/FIXME/HACK/XXX comments
- `no-empty-pass` — Block placeholder `pass` in Python
- `no-not-implemented` — Block `raise NotImplementedError`
- `no-ellipsis` — Block `...` placeholder in Python
- `no-placeholder-text` — Block "placeholder", "stub", "implement this"
- `no-throw-not-impl` — Block `throw new Error("not implemented")`

### Cycle 2 — Security
- `no-eval` — Block `eval()`
- `no-exec` — Block `exec()` in Python
- `no-os-system` — Block `os.system()` in Python
- `no-shell-true` — Block `shell=True` in subprocess
- `no-hardcoded-secrets` — Block hardcoded API keys, passwords, tokens
- `no-raw-sql` — Block SQL injection via string concatenation
- `no-innerhtml` — Block `.innerHTML =` (XSS)
- `no-rm-rf` — Block destructive `rm -rf` on critical paths
- `no-chmod-777` — Block world-writable permissions
- `no-curl-pipe-sh` — Block `curl | sh` patterns
- `no-insecure-url` — Block non-HTTPS URLs (except localhost)

### Cycle 4 — Research Claims
- `no-vague-claims` — Block "studies show", "experts say", and similar vague language
- `no-unverified-claims` — Block claims without a verification tag (`<!-- VERIFIED -->`, `<!-- PERPLEXITY_VERIFIED -->`, etc.)
- `no-unsourced-claims` — Block claims lacking a source URL within 300 characters

## Development

### Run Tests
```bash
npm test
```

### Run Individual Test Suites
```bash
npm run test:cycle1
npm run test:cycle2
npm run test:cycle4
npm run test:audit
npm run test:config
```

### Run Smoke Test
```bash
npm run verify
```

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed technical documentation.

## Troubleshooting

See [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for common issues and solutions.

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Look for issues labeled [`good first issue`](https://github.com/kirollosatef/customgpt-claude-quadruple-verification/labels/good%20first%20issue) to get started.

## License

MIT — see [LICENSE](LICENSE)
