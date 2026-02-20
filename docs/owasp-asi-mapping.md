# OWASP Agentic Security Initiative (ASI) Top 10 — Coverage Mapping

This document maps all Quadruple Verification rules and detection mechanisms to the
[OWASP Agentic Security Initiative Top 10](https://owasp.org/www-project-agentic-security-initiative/) threats.

Last updated: 2026-02-19 (v1.2.0)

---

## Coverage Summary

| OWASP ASI Threat | Status | Covered By |
|-----------------|--------|------------|
| ASI-01: Prompt Injection | Covered | `no-system-prompt-leak`, Stop prompt evidence checks |
| ASI-02: Insecure Output Handling | Covered | Cycle 1 quality rules, Stop prompt completeness check |
| ASI-03: Supply Chain Vulnerabilities | Covered | MCP input validation (Change 4), `no-curl-pipe-sh` |
| ASI-04: Insecure Code Generation | Covered | All Cycle 1 + Cycle 2 rules, `no-pickle-load` |
| ASI-05: Excessive Agency | Covered | Behavioral sequence detection (Change 3), rapid-destructive pattern |
| ASI-06: Sensitive Data Exposure | Covered | `no-hardcoded-secrets`, `no-env-dump`, `no-base64-exfil`, MCP sensitive data detection |
| ASI-07: Improper Access Control | Covered | `no-chmod-777`, `no-rm-rf`, permission-escalation behavioral pattern |
| ASI-08: Denial of Service | Partial | MCP input size limits (Change 4) |
| ASI-09: Logging and Monitoring | Covered | JSONL audit logger, behavioral tracker session state |
| ASI-10: Model/Context Theft | Covered | `no-system-prompt-leak`, exfiltration-sequence behavioral pattern, `no-data-exfil-redirect` |

---

## Detailed Mapping

### ASI-01: Prompt Injection

Attackers craft inputs that override agent instructions or extract system prompts.

**Coverage:**
- **`no-system-prompt-leak`** (Cycle 2) — Blocks code patterns that output system prompt content, `CLAUDE.md` instructions, or `<system>` tags via print/echo/console.log
- **Stop prompt** (Cycle 3) — Evidence-based self-check catches outputs that deviate from the original request

### ASI-02: Insecure Output Handling

Agent produces incomplete, incorrect, or unsafe output that is used downstream.

**Coverage:**
- **Cycle 1 completeness rules** — `no-empty-catch`, `no-empty-function-body`, `no-bare-except`, `no-console-only-error`, `no-placeholder-text`, `no-not-implemented`, `no-throw-not-impl`
- **Stop prompt** — Requires evidence of completeness, correctness, and quality before delivery
- **Failure pattern detection** — Stop prompt specifically checks for plan-only output, partial work, missing error handling, and silenced errors

### ASI-03: Supply Chain Vulnerabilities

Compromised dependencies, tools, or MCP services introduce malicious behavior.

**Coverage:**
- **MCP input validation** (Change 4) — Detects sensitive data being sent to external MCP services, flags oversized payloads
- **`no-curl-pipe-sh`** (Cycle 2) — Blocks piping downloaded content directly to shell execution
- **`no-pickle-load`** (Cycle 2) — Blocks deserialization of untrusted data via pickle

### ASI-04: Insecure Code Generation

Agent generates code with security vulnerabilities (injection, XSS, hardcoded secrets).

**Coverage:**
- **`no-eval`** / **`no-exec`** — Blocks arbitrary code execution via eval/exec
- **`no-os-system`** / **`no-shell-true`** — Blocks shell injection vectors in Python
- **`no-raw-sql`** — Blocks SQL injection via string concatenation/interpolation
- **`no-innerhtml`** — Blocks XSS via innerHTML assignment
- **`no-hardcoded-secrets`** — Blocks hardcoded API keys, passwords, and tokens

### ASI-05: Excessive Agency

Agent takes actions beyond what was requested or authorized.

**Coverage:**
- **Behavioral sequence detection** (Change 3) — Tracks cross-tool-call patterns to detect:
  - Write-without-Read: Editing files never examined in the session
  - Rapid destructive sequence: Multiple destructive commands in quick succession
  - Permission escalation: chmod/chown followed by execution of modified file
- **`no-rm-rf`** (Cycle 2) — Blocks recursive delete on critical paths

### ASI-06: Sensitive Data Exposure

Agent leaks credentials, API keys, or personal data through outputs or tool calls.

**Coverage:**
- **`no-hardcoded-secrets`** (Cycle 2) — Detects API keys, passwords, tokens in code
- **`no-env-dump`** (Cycle 2) — Blocks commands that dump all environment variables
- **`no-base64-exfil`** (Cycle 2) — Detects base64-encoded payloads piped to network tools
- **`no-data-exfil-redirect`** (Cycle 2) — Blocks sending local file data to remote endpoints
- **MCP sensitive data detection** (Change 4) — Detects API keys, Bearer tokens, AWS credentials, private keys, and passwords in MCP tool inputs

### ASI-07: Improper Access Control

Agent modifies permissions or accesses resources beyond its authorization scope.

**Coverage:**
- **`no-chmod-777`** (Cycle 2) — Blocks world-writable permission settings
- **`no-rm-rf`** (Cycle 2) — Blocks destructive recursive delete on root, home, and system paths
- **Permission escalation detection** (Change 3) — Behavioral pattern that flags chmod/chown followed by execution of the modified file

### ASI-08: Denial of Service

Agent triggers resource exhaustion or system instability.

**Coverage (partial):**
- **MCP input size limits** (Change 4) — Flags MCP inputs exceeding configurable size threshold (default 10 KB)
- **Rapid destructive sequence detection** (Change 3) — Detects uncontrolled cleanup loops

> Note: Full DoS protection (rate limiting, resource quotas) is outside the scope of a Claude Code hook plugin. This threat is best addressed at the infrastructure level.

### ASI-09: Logging and Monitoring

Insufficient audit trail makes it impossible to detect or investigate incidents.

**Coverage:**
- **JSONL audit logger** — Every PreToolUse and PostToolUse decision is logged with timestamps, tool names, decisions, violations, and metadata
- **Behavioral tracker session state** — Cross-tool-call patterns stored per session for forensic analysis
- **Behavioral warnings in audit logs** — PostToolUse logs include any behavioral pattern detections

### ASI-10: Model/Context Theft

Attackers extract system prompts, agent instructions, or training data.

**Coverage:**
- **`no-system-prompt-leak`** (Cycle 2) — Blocks code that outputs system prompt content
- **Exfiltration sequence detection** (Change 3) — Flags outbound network calls shortly after reading sensitive files
- **`no-data-exfil-redirect`** (Cycle 2) — Blocks sending local file data to remote URLs
- **`no-base64-exfil`** (Cycle 2) — Detects encoded credential exfiltration attempts

---

## Rule Inventory

### Cycle 1 — Code Quality (11 rules)

| Rule ID | Description |
|---------|------------|
| `no-todo` | Block deferred-work marker comments in code |
| `no-empty-pass` | Block bare `pass` statements in Python |
| `no-not-implemented` | Block `raise NotImplementedError` |
| `no-ellipsis` | Block `...` ellipsis in Python |
| `no-placeholder-text` | Block incomplete-code marker text in comments and strings |
| `no-throw-not-impl` | Block `throw new Error("not implemented")` in JS/TS |
| `no-empty-catch` | Block empty catch blocks in JS/TS |
| `no-bare-except` | Block bare `except:` in Python |
| `no-console-only-error` | Block catch blocks that only log the error |
| `no-empty-function-body` | Block empty function bodies in JS/TS |
| `no-any-type` | Block TypeScript `any` type (disabled by default) |

### Cycle 2 — Security (16 rules)

| Rule ID | Description |
|---------|------------|
| `no-eval` | Block `eval()` usage |
| `no-exec` | Block `exec()` in Python |
| `no-os-system` | Block `os.system()` in Python |
| `no-shell-true` | Block `shell=True` in subprocess |
| `no-hardcoded-secrets` | Block hardcoded API keys, passwords, tokens |
| `no-raw-sql` | Block SQL injection via string concatenation |
| `no-innerhtml` | Block `.innerHTML =` assignment |
| `no-rm-rf` | Block destructive `rm -rf` on critical paths |
| `no-chmod-777` | Block world-writable permissions |
| `no-curl-pipe-sh` | Block piping downloaded content directly to shell execution |
| `no-insecure-url` | Block non-HTTPS URLs (except localhost) |
| `no-system-prompt-leak` | Block system prompt / agent instruction leaks |
| `no-base64-exfil` | Block base64-encoded credential exfiltration |
| `no-env-dump` | Block environment variable dumps |
| `no-data-exfil-redirect` | Block sending local files to remote URLs |
| `no-pickle-load` | Block `pickle.load/loads` deserialization |

### Cycle 3 — Output Quality (Stop Prompt)

Evidence-based self-check with 4 dimensions: Completeness, Correctness, Security, Quality.

### Cycle 4 — Research Claim Verification

Vague language detection, unverified statistics, missing source URLs in research files.

### Behavioral Patterns (4 detectors)

| Pattern | Description |
|---------|------------|
| `write-without-read` | Editing a file that was never read in the session |
| `rapid-destructive` | 3+ destructive commands within 30 seconds |
| `exfiltration-sequence` | Outbound request within 60s of reading a sensitive file |
| `permission-escalation` | chmod/chown followed by execution of the modified file |

### MCP Validation (2 checks)

| Check | Description |
|-------|------------|
| Sensitive data detection | API keys, Bearer tokens, AWS credentials, private keys, passwords in MCP inputs |
| Input size limit | Flag MCP payloads exceeding configurable threshold (default 10 KB) |
