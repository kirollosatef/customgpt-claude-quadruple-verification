# Changelog

All notable changes to the CustomGPT Triple Verification plugin.

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
