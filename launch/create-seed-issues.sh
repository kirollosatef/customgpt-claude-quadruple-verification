#!/bin/bash
# Run this on launch day to create seed issues
# Requires: gh CLI (brew install gh / winget install GitHub.cli)
# Usage: bash launch/create-seed-issues.sh

set -e

REPO="kirollosatef/customgpt-claude-quadruple-verification"

echo "Creating labels..."
gh label create "new-rule" --description "Proposal for a new verification rule" --color "0E8A16" --repo "$REPO" 2>/dev/null || true
gh label create "good first issue" --description "Good for newcomers" --color "7057ff" --repo "$REPO" 2>/dev/null || true

echo ""
echo "Creating seed issues..."

gh issue create --repo "$REPO" \
  --title "[Rule] Add no-console-log rule" \
  --label "good first issue,new-rule" \
  --body "$(cat <<'EOF'
## Rule: `no-console-log`
**Cycle:** 1 (Code Quality)

Block `console.log()` in production code (.js/.ts files).

### Should be BLOCKED:
```javascript
console.log("debug value:", data);
console.log(user);
```

### Should be ALLOWED:
```javascript
logger.log("Processing request");
console.error("Critical failure");
console.warn("Deprecation notice");
// Files in test/ directories
```

### Why
`console.log` statements are debugging artifacts that should never ship to production. They leak internal state and clutter output.

### Implementation hint
Add a new entry to `scripts/lib/rules-engine.mjs` and corresponding tests in `tests/test-cycle1.mjs`.
EOF
)"

gh issue create --repo "$REPO" \
  --title "[Rule] Add no-debug-statements rule" \
  --label "good first issue,new-rule" \
  --body "$(cat <<'EOF'
## Rule: `no-debug-statements`
**Cycle:** 1 (Code Quality)

Block debug breakpoint statements across languages.

### Patterns to block:
- JavaScript/TypeScript: `debugger;`
- Python: `import pdb; pdb.set_trace()` and `breakpoint()`
- Ruby: `binding.pry`

### Why
Debug breakpoints should never ship to production. They halt execution.

### Implementation hint
Add entries to `scripts/lib/rules-engine.mjs` and tests in `tests/test-cycle1.mjs`.
EOF
)"

gh issue create --repo "$REPO" \
  --title "[Feature] Add --stats CLI command for verification statistics" \
  --label "good first issue,enhancement" \
  --body "$(cat <<'EOF'
## Feature: `--stats` command

Add a CLI command that reads JSONL audit logs and displays:

- Total operations verified
- Operations blocked (with breakdown by rule)
- Most common violations
- Block rate over time (daily/weekly)

### Example output:
```
Verification Stats (last 7 days)
================================
Total operations:  1,247
Blocked:           43 (3.4%)

Top violations:
  no-todo          18 blocks
  no-eval           9 blocks
  no-placeholder    8 blocks
  no-vague-claims   5 blocks
  no-hardcoded-secrets 3 blocks
```

### Implementation hint
Read JSONL files from `.claude/quadruple-verify-audit/` and aggregate.
EOF
)"

gh issue create --repo "$REPO" \
  --title "[Feature] Custom user-defined rules in config" \
  --label "enhancement" \
  --body "$(cat <<'EOF'
## Feature: Custom rules

Allow users to define custom regex rules in their config file:

```json
{
  "customRules": [
    {
      "name": "no-company-secrets",
      "cycle": 2,
      "pattern": "INTERNAL_API_KEY|COMPANY_SECRET",
      "message": "Company-specific secret pattern detected"
    }
  ]
}
```

This would let teams add organization-specific rules without forking the plugin.
EOF
)"

gh issue create --repo "$REPO" \
  --title "[Feature] GitHub Action for PR verification" \
  --label "enhancement" \
  --body "$(cat <<'EOF'
## Feature: GitHub Action

Create a GitHub Action that runs the same verification rules on pull requests:

- Scan changed files with Cycle 1 + 2 rules
- Post violations as PR review comments
- Optionally block merge if violations found

### Usage:
```yaml
- uses: kirollosatef/customgpt-claude-quadruple-verification@v2
  with:
    cycles: "1,2"
    fail-on-violation: true
```

This extends the plugin's reach beyond Claude Code into the CI/CD pipeline.
EOF
)"

gh issue create --repo "$REPO" \
  --title "Improve error messages with fix suggestions" \
  --label "good first issue,enhancement" \
  --body "$(cat <<'EOF'
## Improvement: Fix suggestions in error messages

When a rule blocks an operation, include a suggested fix:

### Current:
```
BLOCKED: eval() detected (line 5)
```

### Proposed:
```
BLOCKED: eval() detected (line 5)
  Fix: Use JSON.parse() for JSON data, or ast.literal_eval() for Python literals
```

### Suggestions to add:
- `eval()` → "Use JSON.parse() or ast.literal_eval()"
- `shell=True` → "Use subprocess.run(['cmd', 'arg']) without shell=True"
- `innerHTML` → "Use textContent or a sanitization library like DOMPurify"
- `os.system()` → "Use subprocess.run() instead"
- `chmod 777` → "Use chmod 755 for directories, 644 for files"

### Implementation hint
Update the rule definitions in `scripts/lib/rules-engine.mjs` to include a `fix` field.
EOF
)"

gh issue create --repo "$REPO" \
  --title "[Docs] Add comparison table vs alternatives" \
  --label "good first issue,documentation" \
  --body "$(cat <<'EOF'
## Documentation: Comparison table

Add a comparison table to the README or docs showing how this plugin compares to alternatives:

| Feature | This Plugin | CLAUDE.md Rules | Pre-commit Hooks | Manual Review |
|---------|------------|-----------------|------------------|---------------|
| Runs automatically | Yes | No (advisory) | At commit only | No |
| Blocks before execution | Yes | No | After all changes | After all changes |
| AI-powered review | Yes (Cycle 3) | N/A | No | Yes |
| Research verification | Yes (Cycle 4) | No | No | Sometimes |
| Audit trail | Yes (JSONL) | No | No | Varies |
| Zero dependencies | Yes | N/A | Varies | N/A |
| Configurable | Yes | N/A | Varies | N/A |

This helps users understand why they should use this plugin over simpler alternatives.
EOF
)"

echo ""
echo "Done! Created 7 seed issues."
echo "View them at: https://github.com/$REPO/issues"
