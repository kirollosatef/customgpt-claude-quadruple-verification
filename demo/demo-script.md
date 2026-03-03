# Demo Recording Script

Use this script to record a compelling demo GIF/video for the README and social media.

## Tools
- **Terminal recording**: [asciinema](https://asciinema.org/) or [Terminalizer](https://terminalizer.com/)
- **GIF conversion**: [agg](https://github.com/asciinema/agg) (asciinema to GIF)
- **Screen recording**: OBS Studio or ShareX (for video posts)

## Demo Script (60 seconds)

### Setup
```bash
# Make sure the plugin is installed
npx @customgpt/claude-quadruple-verification
```

### Scene 1: Code Quality Gate (15s)
```
You: "Create a Python file with a TODO comment and placeholder pass statement"

Claude tries to write:
  def process_data(data):
      # TODO: implement this later
      pass

BLOCKED! PreToolUse:Write hook returned blocking error
Error: BLOCKED - Fix these issues first:
  - TODO comment found (line 2)
  - Empty pass statement (line 3)
```

### Scene 2: Security Gate (15s)
```
You: "Write a function that uses eval() to parse user input"

Claude tries to write:
  def parse_input(user_input):
      return eval(user_input)

BLOCKED! PreToolUse:Write hook returned blocking error
Error: BLOCKED - Security violation:
  - eval() detected (line 2) — use ast.literal_eval() or json.loads() instead
```

### Scene 3: Research Verification (15s)
```
You: "Write a blog post about AI adoption rates"

Claude tries to write:
  Studies show that 80% of enterprises use AI...

BLOCKED! PreToolUse:Write hook returned blocking error
Error: BLOCKED - Research claim violation:
  - Vague language: "Studies show" — cite specific source
  - Unverified statistic: "80%" — add source URL within 300 characters
```

### Scene 4: Clean Code Passes (15s)
```
You: "Create a properly implemented Python function"

Claude writes:
  def process_data(data: list[dict]) -> list[dict]:
      if not data:
          return []
      return [item for item in data if item.get("active")]

PASSED! All 4 verification cycles clear.
Audit logged to .claude/quadruple-verify-audit/
```

## Recording Tips

1. **Use a clean terminal** — dark theme, large font (16-18pt)
2. **Slow typing** — if recording manual input, type deliberately
3. **Pause on blocks** — let the BLOCKED message sit for 2-3 seconds
4. **End on success** — always end with a passing example
5. **Keep it under 60 seconds** — attention spans are short

## Recommended GIF Size
- Width: 800px
- Duration: 30-60 seconds
- Format: GIF for README, MP4 for social media

## Output Files
Save to:
- `demo/demo.gif` — for README
- `demo/demo.mp4` — for social media posts
