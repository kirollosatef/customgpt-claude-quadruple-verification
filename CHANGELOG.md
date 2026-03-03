# Changelog

All notable changes to the CustomGPT Quadruple Verification plugin.

## [2.0.0] - 2026-03-03

### Added
- **Enhanced Stop prompt (Cycle 3)**: Multi-section intelligent review replaces generic 4-row table. Now covers Code Quality, Security, Research Claims, and Completeness — each with detailed verification criteria
- **Verification tag cascade (Cycle 4)**: Accepts multiple verification tags (`<!-- VERIFIED -->`, `<!-- PERPLEXITY_VERIFIED -->`, `<!-- WEBSEARCH_VERIFIED -->`, `<!-- CLAIMS_VERIFIED -->`). Removes hard dependency on Perplexity MCP
- **Optional LLM Advisory mode**: Opt-in Claude Haiku API analysis for deeper security and quality review. Advisory only (never blocks). Enable via `config.llm.enabled`. Requires `ANTHROPIC_API_KEY` env var
- **Quiet mode**: Minimal output when all checks pass ("**Verification**: PASS"). Enabled by default via `output.quiet`
- **Configurable Cycle 3 sections**: Toggle individual review sections via `cycle3.sections` (codeQuality, security, research, completeness)
- New `scripts/lib/llm-advisor.mjs` — LLM advisory module using Node.js built-in `https` (zero npm deps)

### Changed
- Cycle 3 prompt: detailed multi-section review with context-aware security checks (test files vs production code)
- Cycle 4 rule messages: tool-agnostic language ("available search tools" instead of "Perplexity MCP tools")
- `config/default-rules.json` updated to v2.0.0 with new config keys
- Python port (`quadruple_verification.py`): mirrors all JS changes — tag cascade, enhanced prompt, LLM advisory

### Fixed
- Cycle 4 no longer requires Perplexity MCP specifically — any search tool can verify claims

## [1.1.0] - 2026-02-11

### Changed
- Renamed from "Triple Verification" to "Quadruple Verification" everywhere (package, plugin, branding, config paths, audit paths)
- Added visible Quality Gateway display on every response — Cycle 3 now shows a verification table (Completeness, Quality, Correctness, Security) at the end of each response
- Fixed `failOpen()` not outputting valid JSON on crash (caused "JSON validation failed" error in Claude Code)
- Package name: `@customgpt/claude-quadruple-verification`
- Plugin name: `customgpt-claude-quadruple-verification`
- Config file: `quadruple-verify-config.json`
- Audit directory: `quadruple-verify-audit/`

## [1.0.1] - 2026-02-09

### Added
- Marketplace install support (`/plugin marketplace add kirollosatef/customgpt-claude-quadruple-verification`)
- npx installer (`npx @customgpt/claude-quadruple-verification`)
- Team rollout template (`docs/team-setup/settings.json`) for auto-prompting employees
- Auto-updates via marketplace — push to repo, everyone gets it
- `.claude-plugin/marketplace.json` catalog file
- `bin/cli.mjs` cross-platform CLI installer

### Changed
- Restructured `hooks/hooks.json` from flat array to event-keyed format (`PreToolUse`, `PostToolUse`, `Stop`)
- Updated hook variable from `$CLAUDE_PLUGIN_DIR` to `${CLAUDE_PLUGIN_ROOT}`
- Fixed `plugin.json` hooks path from `../hooks/hooks.json` to `./hooks/hooks.json`
- Added `homepage`, `repository`, `license` to `plugin.json`
- Removed `engines` from `plugin.json` (not in plugin schema)
- Scoped npm package name to `@customgpt/claude-quadruple-verification`
- Added `bin` and `files` fields to `package.json`
- Fixed repository URL to `kirollosatef/customgpt-claude-quadruple-verification`
- Updated README with marketplace/npx/manual install options, team setup, auto-updates
- Updated landing page install tabs (Marketplace/npx/Manual) and FAQ
- Updated all docs (ARCHITECTURE, TROUBLESHOOTING) with correct paths and new features

## [1.0.0] - 2026-02-09

### Added
- Cycle 1: Code quality verification (6 rules)
  - `no-todo` — Block TODO/FIXME/HACK/XXX comments
  - `no-empty-pass` — Block placeholder pass in Python
  - `no-not-implemented` — Block NotImplementedError
  - `no-ellipsis` — Block ellipsis placeholder in Python
  - `no-placeholder-text` — Block placeholder/stub text
  - `no-throw-not-impl` — Block throw not implemented in JS/TS
- Cycle 2: Security verification (11 rules)
  - `no-eval` — Block eval()
  - `no-exec` — Block exec() in Python
  - `no-os-system` — Block os.system()
  - `no-shell-true` — Block shell=True
  - `no-hardcoded-secrets` — Block hardcoded API keys/passwords/tokens
  - `no-raw-sql` — Block SQL injection via string concatenation
  - `no-innerhtml` — Block innerHTML assignment (XSS)
  - `no-rm-rf` — Block destructive rm -rf
  - `no-chmod-777` — Block world-writable permissions
  - `no-curl-pipe-sh` — Block curl/wget piped to shell
  - `no-insecure-url` — Block non-HTTPS URLs
- Cycle 3: Output quality verification via Stop prompt hook
- Full JSONL audit trail for every operation
- Multi-source configuration merge (defaults → user → project)
- Cross-platform install scripts (Windows PowerShell, macOS/Linux/WSL bash)
- Post-install smoke test
- Complete test suite using Node.js built-in test runner
- Documentation: README, ARCHITECTURE, RULES, TROUBLESHOOTING
- Landing page for internal distribution
