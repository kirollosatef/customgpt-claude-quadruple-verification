# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 2.x     | Yes       |
| 1.x     | No        |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT open a public GitHub issue**
2. Use [GitHub's private vulnerability reporting](https://github.com/kirollosatef/customgpt-claude-quadruple-verification/security/advisories/new)
3. Or email: security@customgpt.ai

### What to include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response timeline

- **Acknowledgment:** Within 48 hours
- **Initial assessment:** Within 5 business days
- **Fix timeline:** Depends on severity (critical: 7 days, high: 14 days, medium: 30 days)

### Disclosure policy

We follow a 90-day responsible disclosure policy. After a fix is released, we credit the reporter in the release notes (unless you prefer anonymity).

## Security Design

This plugin is designed with security in mind:

- **Zero npm dependencies** — no supply chain risk
- **Fail-open design** — plugin crashes never block Claude Code
- **No network access** required (LLM advisory is opt-in)
- **No data collection** — all audit logs stay local
- **npm provenance** — published packages are cryptographically signed via GitHub Actions
