# Hacker News — Show HN

**Status:** NOT POSTED

## Title
```
Show HN: Real-time verification layer for AI-generated code (58% has security flaws)
```

## URL
```
https://github.com/kirollosatef/customgpt-claude-quadruple-verification
```
Link directly to GitHub. NOT the landing page. HN penalizes marketing sites.

## First Comment (post immediately after submission)

```
Hi HN, I'm Kiro from CustomGPT.ai.

I built this because I noticed a gap in the AI code verification toolchain: every tool works after the code is already written. SonarQube at CI. Snyk at repo scan ($25/dev/mo). CodeRabbit at PR review ($12-24/dev/mo). Semgrep at CI ($35/dev/mo). Nothing works at the point of generation.

41% of all new code committed this year is AI-generated. Veracode reports 58% of it contains security vulnerabilities. AI code has 1.7x more issues than human-written code (SonarQube). And MIT found AI tools actually slow experienced devs by 19% -- because the verification overhead eats the speed gains.

Quadruple Verification is a Claude Code hook plugin that intercepts every operation in real-time:

- Cycles 1, 2, 4: Regex fast-gates (<50ms). 20 rules covering OWASP patterns, placeholder code, unsourced research claims. They block violations before the file is written.
- Cycle 3: AI self-review stop-gate. Before Claude delivers a response, it reviews its own output across 4 dimensions: code quality, security, research accuracy, completeness.
- Audit: Every operation logs to JSONL.

The honest benchmark result: We ran a 45-test A/B. The regex gates add near-zero net value on their own -- the issues they catch are real but relatively rare. The AI self-review stop-gate (Cycle 3) is where the measurable quality improvement comes from: +31.8% on Agent SDK tasks. We publish the full methodology.

Some competitive context: CodeRabbit just raised $60M at $550M valuation for PR-level review. This works a full stage earlier -- at generation time -- and it's free.

Technical details:
- Zero npm dependencies (uses Node.js built-in https for optional LLM advisory)
- Fail-open design -- plugin crashes never block Claude
- Config merge: plugin defaults -> user config -> project config
- Cross-platform (Windows, macOS, Linux)

v2.0 features: multi-section intelligent review, verification tag cascade, optional Haiku-powered advisory mode, quiet mode.

Happy to answer questions about the architecture, benchmark methodology, or how this sits alongside existing SAST/review tools. What verification layer do you use for AI-generated code?
```

## Tips
- Post Tue-Thu, 9am Pacific / 12pm EST
- This is the #1 highest-leverage action in the campaign (avg 121 stars in 24hrs from front page)
- Monitor every 30 min and reply to EVERY comment — fast, technical, honest
- HN hates marketing. Be the builder sharing work.
- Dedicate the full day to HN engagement
