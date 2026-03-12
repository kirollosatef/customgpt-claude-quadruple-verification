# Migration Guide: v1.x → v2.0

## Breaking Changes

### Renamed package and paths
- Package: `@customgpt/claude-quadruple-verification` (unchanged since v1.1)
- Config file: `quadruple-verify-config.json` (unchanged since v1.1)
- Audit directory: `quadruple-verify-audit/` (unchanged since v1.1)

If you're upgrading from v1.0.x (before the rename), update any references from "triple" to "quadruple".

### Cycle 3 (Stop gate) prompt redesigned
The output quality table is now a multi-section review covering Code Quality, Security, Research Claims, and Completeness. This is automatic — no config changes needed.

### Cycle 4 verification tags expanded
v1.x only accepted `<!-- PERPLEXITY_VERIFIED -->`. v2.0 accepts:
- `<!-- VERIFIED -->` (recommended)
- `<!-- PERPLEXITY_VERIFIED -->` (still supported)
- `<!-- WEBSEARCH_VERIFIED -->`
- `<!-- CLAIMS_VERIFIED -->`

Existing `<!-- PERPLEXITY_VERIFIED -->` tags continue to work.

## New Features (opt-in)

### LLM Advisory mode
Optional deeper analysis using Claude Haiku. Never blocks — advisory only.

```json
{
  "llm": {
    "enabled": true
  }
}
```

Requires `ANTHROPIC_API_KEY` environment variable.

### Quiet mode (on by default)
v2.0 only shows output when checks fail. To see full output on every operation:

```json
{
  "output": {
    "quiet": false
  }
}
```

### Configurable Cycle 3 sections
Toggle individual review sections:

```json
{
  "cycle3": {
    "sections": {
      "codeQuality": true,
      "security": true,
      "research": true,
      "completeness": true
    }
  }
}
```

## Upgrade Steps

1. Update the plugin:
   ```
   /plugin marketplace add kirollosatef/customgpt-claude-quadruple-verification
   ```
   Or: `npx @customgpt/claude-quadruple-verification`

2. No config changes required — v2.0 is backwards-compatible with v1.x configs.

3. Optionally enable LLM Advisory for deeper analysis (see above).
