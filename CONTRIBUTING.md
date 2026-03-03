# Contributing to CustomGPT Quadruple Verification

Thanks for your interest in contributing! This plugin helps teams run Claude Code at production quality — every contribution makes AI-assisted development safer and more reliable.

## Quick Start

```bash
git clone https://github.com/kirollosatef/customgpt-claude-quadruple-verification.git
cd customgpt-claude-quadruple-verification
npm test
```

Zero dependencies. Node.js 18+ is all you need.

## How to Contribute

### Report a Bug
- Use the [Bug Report](https://github.com/kirollosatef/customgpt-claude-quadruple-verification/issues/new?template=bug_report.md) template
- Include your OS, Node.js version, and Claude Code version
- Include the audit log entry if relevant (`.claude/quadruple-verify-audit/`)

### Suggest a New Rule
- Use the [Feature Request](https://github.com/kirollosatef/customgpt-claude-quadruple-verification/issues/new?template=feature_request.md) template
- Describe: what pattern should be blocked, why it's dangerous, and an example

### Submit a Pull Request

1. Fork the repo and create a branch from `master`
2. Add tests for any new rules or behavior changes
3. Run `npm test` and make sure all tests pass
4. Keep PRs focused — one rule or fix per PR

## Architecture Overview

```
scripts/
├── pre-tool-gate.mjs        # Cycles 1, 2, 4 dispatcher (PreToolUse hook)
├── post-tool-audit.mjs      # Audit logger (PostToolUse hook)
├── stop-gate.mjs            # Session-end research scan (Stop hook)
└── lib/
    ├── rules-engine.mjs     # Cycle 1 + 2 regex rules
    ├── research-verifier.mjs # Cycle 4 claim verification
    ├── audit-logger.mjs     # JSONL structured logging
    ├── config-loader.mjs    # Multi-source config merge
    ├── llm-advisor.mjs      # Optional Claude Haiku advisory
    └── utils.mjs            # Shared utilities
```

### Adding a New Rule

1. Add the regex pattern to `scripts/lib/rules-engine.mjs`
2. Add the rule name to `config/default-rules.json` (enabled by default)
3. Add tests in the appropriate `tests/test-cycle*.mjs` file
4. Update `docs/RULES.md` with the rule description and examples
5. Run `npm test`

### Testing

```bash
npm test              # All tests
npm run test:cycle1   # Code quality rules
npm run test:cycle2   # Security rules
npm run test:cycle4   # Research claim rules
npm run test:audit    # Audit logging
npm run test:config   # Configuration merge
npm run verify        # Smoke test
```

## Code Style

- Zero external dependencies — use only Node.js built-ins
- ESM modules (`import`/`export`)
- Descriptive variable names, minimal comments
- Fail-open by default (if the verifier crashes, don't block the developer)

## Good First Issues

Look for issues labeled [`good first issue`](https://github.com/kirollosatef/customgpt-claude-quadruple-verification/labels/good%20first%20issue). These are designed to help you get familiar with the codebase:

- Adding new regex patterns to block
- Improving error messages
- Adding test cases for edge cases
- Documentation improvements

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
