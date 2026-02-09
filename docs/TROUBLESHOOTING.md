# Troubleshooting

Common issues and solutions when using the CustomGPT Triple Verification plugin.

---

## Installation Issues

### Node.js version too old
**Symptom:** `SyntaxError: Cannot use import statement outside a module`

**Fix:** Upgrade to Node.js 18 or later:
```bash
node --version  # Check current version
```
Download from [nodejs.org](https://nodejs.org).

### WSL vs Windows confusion
**Symptom:** Plugin installed in WSL but Claude Code runs on Windows (or vice versa)

**Fix:** Claude Code on Windows runs natively, not through WSL. If you're using:
- **Claude Code on Windows** → Run `install.ps1` in PowerShell
- **Claude Code inside WSL** → Run `install.sh` in your WSL terminal

The install script detects WSL and warns you.

### Permission denied on install.sh
**Symptom:** `bash: install.sh: Permission denied`

**Fix:**
```bash
chmod +x install/install.sh
bash install/install.sh
```

---

## Runtime Issues

### Hooks not firing
**Symptom:** Claude Code doesn't seem to check anything

**Debug steps:**
1. Verify the plugin is installed:
   ```bash
   ls ~/.claude/plugins/customgpt-triple-verification/
   ```
2. Check hook configuration exists:
   ```bash
   cat ~/.claude/plugins/customgpt-triple-verification/hooks/hooks.json
   ```
3. Run Claude with debug logging:
   ```bash
   claude --debug hooks
   ```
   Look for "Found N hook matchers" in the output.

### False positives
**Symptom:** Legitimate code is being blocked

Common false positives and fixes:

- **"placeholder" in variable names** — The `no-placeholder-text` rule matches the word "placeholder". If your code legitimately uses this word (e.g., HTML placeholder attribute), disable the rule:
  ```json
  {
    "disabledRules": ["no-placeholder-text"]
  }
  ```

- **`pass` in test files** — Python test stubs might use bare `pass`. Disable per-project:
  ```json
  {
    "disabledRules": ["no-empty-pass"]
  }
  ```

- **`eval` in comments or strings** — The regex matches `eval(` anywhere in the content. If you're writing about eval (not using it), the rule may trigger. This is by design — it's better to have a false positive than miss a real eval.

### Operations are slow
**Symptom:** Noticeable delay on every tool call

The plugin typically adds <50ms per operation. If you're seeing more:
1. Check that the audit log directory is on a fast filesystem
2. Check for disk space issues in `.claude/triple-verify-audit/`
3. The Stop hook (Cycle 3) adds latency because it's a prompt-based review

### Audit logs growing large
**Symptom:** `.claude/triple-verify-audit/` directory consuming disk space

Each session creates a separate JSONL file. Clean up old sessions:
```bash
# Remove logs older than 30 days
find ~/.claude/triple-verify-audit/ -name "*.jsonl" -mtime +30 -delete
```

Or on Windows PowerShell:
```powershell
Get-ChildItem ~/.claude/triple-verify-audit/*.jsonl |
  Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } |
  Remove-Item
```

---

## Configuration Issues

### Config not loading
**Symptom:** Disabled rules are still firing

**Debug steps:**
1. Verify JSON syntax is valid:
   ```bash
   node -e "console.log(JSON.parse(require('fs').readFileSync('.claude/triple-verify-config.json', 'utf-8')))"
   ```
2. Check file location — must be at:
   - User: `~/.claude/triple-verify-config.json`
   - Project: `$PROJECT/.claude/triple-verify-config.json`
3. Check that `disabledRules` is an array of rule ID strings

### Rules not matching expected content
**Symptom:** A rule doesn't catch something you think it should

The rules use regex pattern matching. Check:
1. Is the rule's `appliesTo` context correct? (file-write, bash, web, mcp)
2. Is the file extension in the rule's `fileExtensions` list?
3. Does the content actually match the regex pattern?

Run the smoke test to verify rules work:
```bash
node install/verify.mjs
```

---

## Platform-Specific Issues

### Windows: Path with spaces
**Symptom:** Hook script fails to run because path contains spaces

**Fix:** The hook commands use quoted paths. If you're seeing issues, ensure Node.js is in your PATH without spaces, or use the short path form.

### macOS: Gatekeeper blocking
**Symptom:** "cannot be opened because the developer cannot be verified"

**Fix:** The plugin is pure Node.js — no binaries to verify. If you see this for Node.js itself, allow it in System Preferences > Security.

### Linux: File permissions
**Symptom:** Scripts not executable

**Fix:**
```bash
chmod +x install/install.sh
```
The .mjs files are run via `node`, so they don't need execute permission.
