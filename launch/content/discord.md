# Discord — Claude Code Community

**Status:** NOT POSTED
**Channel:** #plugins or #showcase

```
Quadruple Verification v2.0 -- real-time verification for Claude Code

Hey all -- shipped v2.0 of this plugin and wanted to share.

The problem I kept hitting: Claude writes code fast, but it also writes eval(), hardcodes API keys, ships TODO comments as "done", and fabricates statistics. Every other tool catches these after the fact -- SonarQube at CI, CodeRabbit at PR, Snyk at repo scan. Nothing catches them at generation time.

This plugin hooks into Claude Code and verifies output before it reaches your codebase:

- Cycle 1 (PreToolUse) -- regex gate blocks TODOs, placeholders, stubs before file write
- Cycle 2 (PreToolUse) -- regex gate blocks eval(), hardcoded secrets, SQL injection, innerHTML XSS, rm -rf, chmod 777, curl|bash (11 rules)
- Cycle 3 (Stop) -- AI self-review: Claude analyzes its own response across code quality, security, research claims, and completeness
- Cycle 4 (PreToolUse + Stop) -- blocks vague claims and unsourced stats in .md files
- Audit (PostToolUse) -- JSONL log of every operation

New in v2.0:
- Multi-section intelligent review (Cycle 3 checks 4 dimensions instead of 1)
- Verification tag cascade
- Optional LLM Advisory mode
- Quiet mode
- Configurable Cycle 3 sections

The honest take: The regex rules are fast (<50ms) but the AI self-review in Cycle 3 is where the real value is. +31.8% quality improvement on agent tasks in our 45-test benchmark.

Install:
/plugin marketplace add kirollosatef/customgpt-claude-quadruple-verification

Or: npx @customgpt/claude-quadruple-verification

Zero deps. Fail-open. MIT licensed.
GitHub: https://github.com/kirollosatef/customgpt-claude-quadruple-verification

Happy to answer questions about the architecture. Anyone else building verification hooks?
```

## Tips
- Casual, community-member tone
- Include install commands directly (people try things immediately)
- Post after PH/HN get initial traction
