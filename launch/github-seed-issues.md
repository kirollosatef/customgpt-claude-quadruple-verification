# GitHub Seed Issues

Create these issues on launch day to make the repo look active and contributor-friendly.

## Good First Issues (label: `good first issue`)

### 1. Add rule: `no-console-log` — block console.log in production code
```
**Cycle:** 1 (Code Quality)
**Pattern:** `console.log(` in .js/.ts files
**Why:** console.log statements are debugging artifacts that shouldn't ship

Should NOT block:
- logger.log() or winston.log()
- Files in test/ directories
- console.error() and console.warn() (sometimes intentional)
```

### 2. Add rule: `no-debug-statements` — block debugger/breakpoint statements
```
**Cycle:** 1 (Code Quality)
**Pattern:** `debugger;` in JS/TS, `import pdb; pdb.set_trace()` in Python
**Why:** Debug breakpoints should never ship to production
```

### 3. Add rule: `no-any-type` — block TypeScript `any` type usage
```
**Cycle:** 1 (Code Quality)
**Pattern:** `: any` in .ts files
**Why:** Using `any` defeats the purpose of TypeScript's type system
```

### 4. Add rule: `no-disabled-eslint` — block eslint-disable without explanation
```
**Cycle:** 1 (Code Quality)
**Pattern:** `eslint-disable` without an adjacent comment explaining why
**Why:** Silencing linters without explanation hides real issues
```

### 5. Improve error messages with fix suggestions
```
When a rule blocks an operation, suggest the fix:
- eval() → "Use JSON.parse() or ast.literal_eval() instead"
- shell=True → "Use subprocess.run(['cmd', 'arg']) without shell=True"
- innerHTML → "Use textContent or a sanitization library"
```

### 6. Add VS Code extension notification support
```
When a violation is blocked, show a VS Code notification with the rule name and fix suggestion.
Investigate if Claude Code hooks can trigger VS Code notifications.
```

### 7. Add `--stats` command to show verification statistics
```
Add a CLI command that reads audit logs and shows:
- Total operations verified
- Operations blocked (with breakdown by rule)
- Most common violations
- Block rate over time
```

## Feature Requests (label: `enhancement`)

### 8. Custom rule definitions in config
```
Allow users to add custom regex rules in their config file:
{
  "customRules": [
    {
      "name": "no-company-secrets",
      "cycle": 2,
      "pattern": "INTERNAL_API_KEY|COMPANY_SECRET",
      "message": "Company secret pattern detected"
    }
  ]
}
```

### 9. GitHub Action for CI/CD verification
```
Create a GitHub Action that runs the same verification rules on PRs:
- Scan changed files with Cycle 1 + 2 rules
- Report violations as PR comments
- Block merge if violations found
```

### 10. Dashboard / web UI for audit logs
```
A simple web interface to browse audit logs:
- Timeline of operations
- Filter by rule, result (pass/block), file
- Charts showing block rate trends
```

## Documentation (label: `documentation`)

### 11. Add comparison table: this plugin vs alternatives
```
Create a comparison table showing:
- vs manual code review
- vs pre-commit hooks
- vs CLAUDE.md instructions
- vs other Claude Code plugins
```

### 12. Video tutorial: setting up for a team
```
Record a 5-minute walkthrough:
1. Install the plugin
2. Configure for a team repo
3. Show it blocking violations
4. Show the audit trail
```

---

## How to Create These

Run this on launch day:
```bash
# Use GitHub CLI to create issues
gh issue create --title "[Rule] Add no-console-log rule" --body "..." --label "good first issue,new-rule"
gh issue create --title "[Rule] Add no-debug-statements rule" --body "..." --label "good first issue,new-rule"
# etc.
```
