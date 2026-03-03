# Cycle 3 — Output Quality

<span class="badge badge-cycle3">Stop Hook</span> <span class="badge badge-block">Prompt-based review</span>

Cycle 3 runs before Claude finishes responding (the **Stop** hook event). Instead of pattern matching, it uses a prompt-based review — asking Claude to self-verify its output meets quality standards.

## Why This Matters

Pattern matching (Cycles 1 and 2) catches known bad patterns, but can't evaluate whether the overall response is complete, correct, and production-ready. Cycle 3 fills this gap with a second AI review pass.

## How It Works

When Claude is about to finish responding, the Stop hook injects a review prompt. Claude then evaluates its own output across four structured review sections:

| Section | What It Verifies |
|---------|-----------------|
| **CODE QUALITY REVIEW** | Incomplete implementations, stubs, missing error handling, edge cases |
| **SECURITY REVIEW** | Hardcoded credentials, injection vulnerabilities, unsafe deserialization, insecure crypto, path traversal, permissions. Test files are evaluated with different risk profiles. |
| **RESEARCH CLAIMS** | Sourced statistical claims, factual specificity, verification via available search tools (Perplexity, WebSearch, WebFetch). Adds `<!-- VERIFIED -->` tag to confirmed claims. |
| **COMPLETENESS CHECK** | Fully implemented what was asked, files mentioned but not created, steps listed but not executed |

## Quality Gateway Display

Cycle 3 produces a minimal **Verification** line at the end of each Claude response:

```
**Verification**: PASS
```

If all sections pass, the output is a single line. If any section identifies issues, the output includes a brief note of what was fixed:

```
**Verification**: PASS (fixed missing error handling in upload handler)
```

If issues cannot be auto-fixed, Claude will explain the problem and attempt to resolve it before completing the response.

## Key Differences from Other Cycles

| Property | Cycles 1/2/4 | Cycle 3 |
|----------|-------------|---------|
| **Mechanism** | Regex pattern matching | AI self-review prompt |
| **Hook type** | Command (external script) | Prompt (injected text) |
| **Scope** | Specific tool inputs | Entire response |
| **Speed** | <50ms | Adds latency (AI review) |
| **False positives** | Possible (regex limits) | Rare (contextual understanding) |

## Configuration

Cycle 3 is always active when the plugin is installed. The review prompt is defined in the plugin's Stop hook configuration.

Individual review sections can be toggled via `cycle3.sections` in your configuration file:

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

Set any section to `false` to disable that part of the review. All sections are enabled by default.
