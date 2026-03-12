# npm Publishing Process

## How It Works

The GitHub Actions workflow (`.github/workflows/npm-publish.yml`) publishes to npm **only when you push a git tag** matching `v*`. It does NOT auto-publish on every push to master.

## Workflow Steps (automated)

1. **Trigger:** Push a tag like `v2.2.0`
2. **Test:** Runs `node --test tests/test-*.mjs` on ubuntu
3. **Publish:** Checks if version already exists on npm → if not, runs `npm publish --access public --provenance`
4. **Release:** Creates (or updates) a GitHub Release with auto-generated notes

## How to Publish a New Version

```bash
# 1. Make sure you're on master with all changes committed
git checkout master

# 2. Bump version (this updates package.json, commits, and creates a tag)
npm version 2.2.0          # explicit version
# OR
npm version patch           # 2.0.0 → 2.0.1
npm version minor           # 2.0.0 → 2.1.0
npm version major           # 2.0.0 → 3.0.0

# 3. Push the commit AND the tag
git push origin master --tags

# 4. Monitor the workflow
gh run list --workflow=npm-publish.yml --limit=1
```

## Key Details

- **NPM_TOKEN** secret is configured in GitHub repo settings
- **Provenance:** `--provenance` flag generates signed build attestation (npm verified badge)
- **Idempotent:** If the version already exists on npm, the publish step is skipped (no failure)
- **GitHub Release:** Auto-created from tag with generated release notes

## Current State

| Item | Value |
|------|-------|
| npm package | `@customgpt/claude-quadruple-verification` |
| Published versions | 2.0.0 (as of March 2026) |
| Git tags | v1.0.0, v1.0.1, v1.1.0, v2.0.0 |
| Registry | https://www.npmjs.com/package/@customgpt/claude-quadruple-verification |
