# Campaign Calendar — Quadruple Verification Launch

> Last updated: 2026-03-11
> Status: REVIEW DRAFT — Approve before adding to Google Calendar
> Product: Quadruple Verification v2.0.0
> GitHub: github.com/kirollosatef/customgpt-claude-quadruple-verification

---

## Legend

| Symbol | Meaning |
|--------|---------|
| DONE | Completed |
| OVERDUE | Was scheduled, not done yet — reschedule |
| READY | Content exists, ready to post |
| DRAFT | Content needs writing/revision |
| BLOCKED | Waiting on a dependency |

---

## PHASE 0: PRE-LAUNCH SETUP (March 11-12)

> These must be done BEFORE any public launch posts

### Tuesday, March 11

| Time (EST) | Task | Platform | Status | Description |
|------------|------|----------|--------|-------------|
| 9:00 AM | **GitHub: Set repo description** | GitHub | READY | Set to: "Quality gate plugin for Claude Code — blocks insecure, incomplete, and hallucinated AI output. 4 cycles, 28 rules, zero dependencies." |
| 9:15 AM | **GitHub: Add topics** | GitHub | READY | Add: `claude-code`, `ai-safety`, `code-quality`, `security`, `verification`, `developer-tools` |
| 9:30 AM | **GitHub: Create labels** | GitHub | READY | Create: `good first issue`, `new-rule`, `enhancement`, `documentation`, `bug` |
| 9:45 AM | **GitHub: Create seed issues** | GitHub | READY | Create 5-7 issues from `launch/github-seed-issues.md` |
| 10:00 AM | **GitHub: Enable Discussions** | GitHub | READY | Enable Q&A category |
| 10:15 AM | **GitHub: Add website URL** | GitHub | READY | Point to docs-site or landing page |
| 10:30 AM | **README: Embed demo GIF** | GitHub | READY | Add demo.gif after "What It Does" section |
| 10:45 AM | **README: Add CI badge** | GitHub | READY | After CI workflow runs |
| 11:00 AM | **npm: Verify clean install** | Terminal | READY | Run `npx @customgpt/claude-quadruple-verification` on a clean machine |
| 11:30 AM | **npm: Check page appearance** | npm | READY | Verify description, keywords, links look good |
| 2:00 PM | **Moltbook: Daily engagement** | Moltbook | OVERDUE | Comment on 10 trending posts (Phase 2 started Mar 10) |

### Wednesday, March 12

| Time (EST) | Task | Platform | Status | Description |
|------------|------|----------|--------|-------------|
| 9:00 AM | **Moltbook Post #7** | Moltbook | OVERDUE | See Phase 2 Post 7 below |
| 10:00 AM | **Moltbook: Daily engagement** | Moltbook | READY | 10+ comments on trending posts |
| 2:00 PM | **Final review: All social posts** | All | READY | Review all content in this file, make final edits |

---

## PHASE 1: LAUNCH WEEK (March 13-16, Thu-Sun)

> The big launch blitz — Product Hunt + Twitter + HN + Discord on Day 1
> LinkedIn + Reddit staggered over Days 2-4

### Thursday, March 13 — LAUNCH DAY

| Time (EST) | Task | Platform | Status | Content |
|------------|------|----------|--------|---------|
| **12:01 AM** | **Product Hunt Launch** | Product Hunt | READY | **Tagline:** "AI writes code. We verify it. — The first real-time verification layer for AI-generated code." **Description:** Full listing in `.planning/SOCIAL-MEDIA-CONTENT.md` section 4. **Maker comment:** "Hey Product Hunt! I'm Kiro from CustomGPT.ai..." (full text in same file) |
| **9:00 AM** | **Twitter/X: Full Thread (9 tweets)** | Twitter/X | READY | **Tweet 1 (Hook):** "58% of AI-generated code has security vulnerabilities (Veracode 2025). 41% of all new code is AI-generated (2026). Do the math. We built a tool that catches these issues at the moment of generation — not after merge, not in CI, not at PR review. Thread:" **Tweets 2-9:** Gap, What it does, Benchmark honesty, Solo dev, Team lead, Security team, Competitive context, CTA. Full thread in `.planning/SOCIAL-MEDIA-CONTENT.md` section 1. |
| **10:00 AM** | **Hacker News: Show HN** | Hacker News | READY | **Title:** "Show HN: I built a real-time verification layer for AI-generated code (58% has security flaws)" **Body:** Opens with stats, explains 4 cycles, honest benchmark results (+31.8% on Cycle 3), competitive landscape (CodeRabbit $60M raise), technical details, install command. Full text in `.planning/SOCIAL-MEDIA-CONTENT.md` section 2. |
| **2:00 PM** | **Discord Announcement** | Claude Code Discord | READY | **Post to #plugins or #showcase.** Title: "Quadruple Verification v2.0 — real-time verification for Claude Code." Explains hook architecture, 4 cycles, v2.0 features, honest benchmark results. Full text in `.planning/SOCIAL-MEDIA-CONTENT.md` section 6. |
| **3:00 PM** | **Engage: Respond to ALL comments** | All platforms | — | Reply to every comment within 2 hours. Priority: HN > Product Hunt > Twitter |
| **4:00 PM** | **Twitter: Post alt hook** | Twitter/X | READY | **Post:** "Claude Code wrote eval() in our production codebase. So we built a plugin that blocks it before the file is even created. 4 verification cycles. 28 rules. Zero dependencies. 110ms overhead. Open source. #ClaudeCode #DevTools #AISafety" (from `launch/social-posts.md` Post 1) |
| **5:00 PM** | **Moltbook: Daily engagement** | Moltbook | READY | 10+ comments, reply to all our post comments |

### Friday, March 14 — Day 2: LinkedIn + Reddit

| Time (EST) | Task | Platform | Status | Content |
|------------|------|----------|--------|---------|
| **7:30 AM** | **LinkedIn Post 1: Founder Story** | LinkedIn | READY | **Hook:** "Claude Code wrote eval() in our production codebase. Nobody caught it for 3 days." Story format, explains the problem, introduces Quadruple Verification, 4 cycles, 28 rules, CTA. Full text in `launch/linkedin-posts.md` Post 4. **Tags:** #OpenSource #AITools #DeveloperExperience #BuildInPublic |
| **10:00 AM** | **Reddit: r/ClaudeAI** | Reddit | READY | **Title:** "AI tools actually slow experienced devs by 19% — the verification tax is real. I built a plugin to automate it." **Body:** Opens with MIT study on verification overhead, lists Claude failure modes, explains 4 cycles, +31.8% benchmark, install command. Full text in `.planning/SOCIAL-MEDIA-CONTENT.md` section 3 (r/ClaudeAI). |
| **12:00 PM** | **Engage: All platforms** | All | — | Respond to every new comment. Share interesting feedback as Twitter quote-tweets. |
| **2:00 PM** | **Moltbook Post #8** | Moltbook | READY | See Phase 2 Post 8 below |
| **3:00 PM** | **Moltbook: Daily engagement** | Moltbook | READY | 10+ comments on trending posts |

### Saturday, March 15 — Day 3: r/programming + LinkedIn 2

| Time (EST) | Task | Platform | Status | Content |
|------------|------|----------|--------|---------|
| **9:00 AM** | **LinkedIn Post 2: Solo Developers** | LinkedIn | READY | **Hook:** "You're shipping fast with Claude Code. But every time you review the output, you find: TODO comments, eval() calls, 'Studies show 80%...' with zero sources." Targeted at solo devs, explains the plugin catches issues FOR you. Full text in `launch/linkedin-posts.md` Post 1. **Tags:** #ClaudeCode #DeveloperTools #AIAssisted #OpenSource #CodeQuality |
| **10:00 AM** | **Reddit: r/programming** | Reddit | READY | **Title:** "41% of code is AI-generated. The entire verification toolchain works after it's written. Nothing works at generation time. So I built one." **Body:** Comparison table (SonarQube/Snyk/CodeRabbit/Semgrep vs this), hook architecture, honest benchmark results, CodeRabbit $60M context. Full text in `.planning/SOCIAL-MEDIA-CONTENT.md` section 3 (r/programming). |
| **12:00 PM** | **Engage: All platforms** | All | — | Weekend engagement — respond to comments, thank stargazers |
| **2:00 PM** | **Moltbook: Daily engagement** | Moltbook | READY | 10+ comments |

### Sunday, March 16 — Day 4: LinkedIn 3 + Follow-ups

| Time (EST) | Task | Platform | Status | Content |
|------------|------|----------|--------|---------|
| **10:00 AM** | **LinkedIn Post 3: Team Leads** | LinkedIn | READY | **Hook:** "I manage 30 engineers using Claude Code daily. Here's what I kept seeing in pull requests..." Different quality from different engineers, explains the consistency problem, how one settings.json deploys org-wide. Full text in `launch/linkedin-posts.md` Post 2. **Tags:** #EngineeringLeadership #DevOps #AIGovernance #TeamProductivity #OpenSource |
| **11:00 AM** | **Twitter: Thread recap** | Twitter/X | READY | **Post:** "We open-sourced our internal Claude Code quality gate. Here's what it catches (thread): 1/ TODO comments — blocked. 2/ eval() — blocked. 3/ 'Studies show...' — blocked. 4/ Hardcoded API keys — blocked. 5/ rm -rf — blocked. 6/ AI reviews its OWN output." (from `launch/social-posts.md` Post 4) |
| **2:00 PM** | **Thank early stargazers** | GitHub + Twitter | — | Post appreciation tweet, respond to GitHub issues |
| **3:00 PM** | **Post interesting feedback** | Twitter | — | Quote-tweet or screenshot best comments from Reddit/HN |

---

## PHASE 2: MOLTBOOK AUTHORITY BUILDING (March 10-16)

> Run in parallel with launch week. All posts in m/general, NO product links.
> Target: 200+ karma, 50+ followers, 1 post with 50+ upvotes

### Moltbook Posts Schedule

| Date | Time | Post # | Title | Pattern | Content Summary |
|------|------|--------|-------|---------|-----------------|
| **Mar 12 (Wed)** | 10:00 AM | **#7** | "I ran 500 Claude Code sessions with and without a stop-gate. Here's what got blocked." | Hazel_OC experiment | 800-900 words. Share specific data: what categories of issues were blocked, frequency breakdown, before/after comparison. End with: "What's the most expensive AI-generated bug your team has shipped?" NO product links. |
| **Mar 13 (Thu)** | 11:00 AM | **#8** | "SonarQube scored 0/6 on AI code. Here's what catches the other 6." | Data-driven competitive | 600-800 words. Run SonarQube against AI-generated code samples, show what it misses (plan-only output, context drift, incomplete implementations). End with: "What's your current AI code review stack?" |
| **Mar 14 (Fri)** | 10:00 AM | **#9** | "The plan-only failure: when your agent describes code instead of writing it" | Short confessional | 150-200 words. Describe the failure mode where Claude describes what it would do instead of doing it. Self-critical tone. End with: "Has anyone else seen this pattern?" |
| **Mar 15 (Sat)** | 11:00 AM | **#10** | "41% of code is AI-generated. The verification tooling is at 0%." | Nobody-talking-about-this | 300-400 words. Market gap analysis — every tool works post-generation. End with: "Why isn't anyone building at the generation layer?" |
| **Mar 16 (Sun)** | 10:00 AM | **#11** | "What the audit trail reveals: patterns in AI code failures across 1000 operations" | Data analysis | 800-950 words. Analyze audit log patterns: most common failure types, time-of-session patterns, which rules fire most. End with: "What would you look for in an AI code audit trail?" |

### Moltbook Daily Engagement (Phase 2)

| Date | Task | Budget |
|------|------|--------|
| Mar 11-16 | Comment on 10+ trending m/general posts daily | 50 comments/day max |
| Mar 11-16 | Reply to ALL comments on our posts within 2 hours | — |
| Mar 11-16 | Engage with Hazel_OC, PDMN, Faheem, jazzys-happycapy | High priority |
| Mar 14 | DM eudaemon_0 or codequalitybot for collaboration | If account >24h old |
| Mar 16 | Cross-post best performer to m/agents or m/ai | Post #12 |

---

## PHASE 3: WEEK 2 — CONTENT MARKETING + MOLTBOOK BREAKOUT (March 17-23)

> Dev.to articles, LinkedIn deep-dives, Moltbook viral attempts
> Target: 500+ karma, 150+ followers, 1 post with 200+ upvotes

### Monday, March 17

| Time (EST) | Task | Platform | Status | Content |
|------------|------|----------|--------|---------|
| **9:00 AM** | **Dev.to Article 1** | Dev.to | DRAFT | **Title:** "How We Stopped Claude Code from Writing eval() in Production" **Content:** Problem story (real incident), why hooks > skills, architecture walkthrough, demo with screenshots, install guide. ~1500 words. Outline in `launch/social-posts.md`. |
| **10:00 AM** | **Moltbook Post #13** | Moltbook | READY | **"Nobody is talking about the verification gap in AI-generated code"** — Uses the #1 viral pattern (eudaemon_0 got 7.8K upvotes with this framing). 300-400 words. The gap: every tool works post-generation, nothing at generation time. End with: "Am I wrong? What am I missing?" |
| **2:00 PM** | **Moltbook: Daily engagement** | Moltbook | — | 10+ comments on trending posts |
| **4:00 PM** | **Twitter: Share Dev.to article** | Twitter/X | — | Link to Dev.to article with hook quote |

### Tuesday, March 18

| Time (EST) | Task | Platform | Status | Content |
|------------|------|----------|--------|---------|
| **8:00 AM** | **LinkedIn Post 4: Security Teams** | LinkedIn | READY | **Hook:** "Your developers are using Claude Code. That means AI is writing code that goes into production. Here's what we found when we audited our own AI-generated code: eval() in 3 files, shell=True, hardcoded API key, innerHTML, chmod 777." Security/CISO angle. 28 rules, audit trail, zero supply chain risk. Full text in `launch/linkedin-posts.md` Post 3. **Tags:** #CyberSecurity #AppSec #DevSecOps #AIRisk #SupplyChainSecurity #OpenSource |
| **10:00 AM** | **Moltbook Post #14** | Moltbook | READY | **"I logged every AI-generated security vulnerability for 30 days. Traditional tools caught 12%."** Hazel_OC experiment formula. 800-950 words. Specific numbers, timeframe, counterintuitive finding. End with: "What's your catch rate on AI-generated vulnerabilities?" |
| **2:00 PM** | **Submit to awesome-lists** | GitHub | DRAFT | Submit PRs to: awesome-claude-code, awesome-ai-tools |
| **3:00 PM** | **Moltbook: Daily engagement** | Moltbook | — | 10+ comments |

### Wednesday, March 19

| Time (EST) | Task | Platform | Status | Content |
|------------|------|----------|--------|---------|
| **9:00 AM** | **Dev.to Article 2** | Dev.to | DRAFT | **Title:** "28 Things Claude Code Should Never Write" **Content:** Listicle format. Each rule with a blocked example and why it's dangerous. Link to plugin at end. ~2000 words. Outline in `launch/social-posts.md`. |
| **10:00 AM** | **Moltbook Post #15** | Moltbook | READY | **"Your agent's code passes every test and ships every vulnerability"** — Sharp aphorism, <100 words. One clean claim. End with provocative question. |
| **2:00 PM** | **Twitter: Share Dev.to article 2** | Twitter/X | — | Link with hook: "28 patterns Claude Code should NEVER write. We block all of them." |
| **3:00 PM** | **Moltbook: Daily engagement** | Moltbook | — | 10+ comments |

### Thursday, March 20

| Time (EST) | Task | Platform | Status | Content |
|------------|------|----------|--------|---------|
| **10:00 AM** | **LinkedIn Post 5: Technical Deep-Dive** | LinkedIn | READY | **Hook:** "We designed a verification architecture for AI-generated code. Here's why we chose hooks over prompts:" Explains CLAUDE.md (advisory) vs pre-commit (too late) vs skills (manual) vs PreToolUse hooks (deterministic). 3-tier architecture. Full text in `launch/linkedin-posts.md` Post 5. **Tags:** #SoftwareArchitecture #SystemDesign #DevTools #OpenSource |
| **11:00 AM** | **Moltbook Post #16** | Moltbook | READY | **"The verification stack jazzys-happycapy described? We built it."** Callback to existing viral series. Leverages 40-post series attention. 200-300 words. Reference their theory, show our implementation. |
| **2:00 PM** | **Reach out to newsletters** | Email | DRAFT | Contact AI/DevTools newsletters for coverage: TLDR, The Pragmatic Engineer, AI Weekly |
| **3:00 PM** | **Moltbook: Daily engagement** | Moltbook | — | 10+ comments |

### Friday, March 21

| Time (EST) | Task | Platform | Status | Content |
|------------|------|----------|--------|---------|
| **10:00 AM** | **Moltbook Post #17** | Moltbook | READY | **"Zero dependencies is a security feature, not a limitation"** — Contrarian take. Challenges conventional wisdom. 200-300 words. End with: "When did we start accepting supply chain risk as the cost of doing business?" |
| **11:00 AM** | **Twitter: Weekly update thread** | Twitter/X | DRAFT | Share week 1 metrics: stars, downloads, interesting comments, community contributions |
| **2:00 PM** | **Reddit: r/ChatGPTCoding** | Reddit | READY | **Title:** "Open-source plugin that adds automatic code quality and security verification to Claude Code" Same body as r/ClaudeAI with more context about what Claude Code is. Full text in `.planning/SOCIAL-POSTS.md`. |
| **3:00 PM** | **Moltbook: Daily engagement** | Moltbook | — | 10+ comments. If Post 13 hit 100+ upvotes, post follow-up within 24h. |

### Saturday-Sunday, March 22-23

| Time (EST) | Task | Platform | Status | Content |
|------------|------|----------|--------|---------|
| **Sat 10:00 AM** | **Moltbook: Cross-post best performer** | Moltbook | — | Cross-post best Phase 3 post to m/agents, m/ai, or m/security |
| **Sat 2:00 PM** | **GitHub: Merge contributor PRs** | GitHub | — | Merge any PRs within 24 hours. Add Contributors section to README if applicable. |
| **Sun 10:00 AM** | **Moltbook: Weekend engagement** | Moltbook | — | 10+ comments, relationship building with recurring commenters |
| **Sun 2:00 PM** | **Week 2 metrics review** | Internal | — | Document: stars, downloads, karma, followers, best post performance |

---

## PHASE 4: WEEK 3 — MOLTBOOK COMMUNITY LEADER + SUSTAINED GROWTH (March 24-31)

> Solidify as top-tier account. Sustained content across all platforms.
> Target: 1000+ karma, 300+ followers, 500+ upvote post

### Monday, March 24

| Time (EST) | Task | Platform | Status | Content |
|------------|------|----------|--------|---------|
| **9:00 AM** | **Dev.to Article 3** | Dev.to | DRAFT | **Title:** "Building a Zero-Dependency Claude Code Plugin" **Content:** Technical deep-dive. How the hook system works, regex gates vs LLM review, configuration, fail-open design, lessons learned. ~1500 words. Outline in `launch/social-posts.md`. |
| **10:00 AM** | **Moltbook Post #18** | Moltbook | READY | **"Month 1 on Moltbook: what building a verification tool taught me about the agent ecosystem"** — Meta/reflective post. 600-800 words. What we learned from the community, surprising feedback, what we changed based on comments. |
| **2:00 PM** | **Twitter: Share Dev.to article 3** | Twitter/X | — | Link with hook about zero-dependency architecture |

### Tuesday, March 25

| Time (EST) | Task | Platform | Status | Content |
|------------|------|----------|--------|---------|
| **8:00 AM** | **LinkedIn: Enterprise recap** | LinkedIn | DRAFT | **Hook:** "We launched an open-source AI code verification tool 2 weeks ago. Here's what happened." Share metrics, community feedback, enterprise interest. **Tags:** #OpenSource #BuildInPublic #DevTools |
| **10:00 AM** | **Moltbook Post #19** | Moltbook | READY | **"The 5 AI code patterns no SAST tool catches (with regex examples you can use today)"** — Actionable/practical. 800-950 words. Give actual regex patterns people can use. End with: "What patterns would you add?" |
| **3:00 PM** | **Moltbook: Daily engagement** | Moltbook | — | 10+ comments |

### Wednesday, March 26

| Time (EST) | Task | Platform | Status | Content |
|------------|------|----------|--------|---------|
| **10:00 AM** | **Moltbook Post #20** | Moltbook | READY | **"Verification is not a feature. It's infrastructure."** — Aphorism capstone. 50-100 words. One clean, quotable claim that sums up the entire campaign thesis. |
| **11:00 AM** | **Twitter: Quote the aphorism** | Twitter/X | — | Share Moltbook post #20 thesis as a standalone tweet |
| **2:00 PM** | **Moltbook: Consider creating submolt** | Moltbook | DRAFT | If 300+ karma, create m/verification or m/code-security |

### Thursday, March 27

| Time (EST) | Task | Platform | Status | Content |
|------------|------|----------|--------|---------|
| **10:00 AM** | **Moltbook Post #21** | Moltbook | DRAFT | **Responsive/topical post** — React to whatever is trending. Use our security/verification expertise to add value to a trending conversation. Newsjacking pattern. |
| **11:00 AM** | **Reddit: r/ArtificialIntelligence** | Reddit | READY | Adapted version of r/ClaudeAI post with more AI context. |
| **3:00 PM** | **Moltbook: Offer public collaboration** | Moltbook | — | Comment on codequalitybot or eudaemon_0's latest post offering to collaborate |

### Friday, March 28

| Time (EST) | Task | Platform | Status | Content |
|------------|------|----------|--------|---------|
| **10:00 AM** | **Moltbook Post #22** | Moltbook | DRAFT | **Responsive/topical post** — Another trending topic reaction. |
| **11:00 AM** | **Twitter: Week 3 update** | Twitter/X | DRAFT | Share 3-week metrics, interesting findings, community highlights |
| **2:00 PM** | **LinkedIn: Community story** | LinkedIn | DRAFT | Share a specific story about a community member's contribution or feedback |

### Saturday-Sunday, March 29-30

| Time (EST) | Task | Platform | Status | Content |
|------------|------|----------|--------|---------|
| **Sat 10:00 AM** | **Moltbook Post #23** | Moltbook | DRAFT | Responsive/topical |
| **Sun 10:00 AM** | **Moltbook Post #24** | Moltbook | DRAFT | Responsive/topical |
| **Sun 2:00 PM** | **Moltbook: Start weekly verification digest** | Moltbook | DRAFT | If enough karma, launch a recurring series |

### Monday, March 31 — End of Month

| Time (EST) | Task | Platform | Status | Content |
|------------|------|----------|--------|---------|
| **9:00 AM** | **Full metrics review** | Internal | — | Document all metrics across all platforms |
| **10:00 AM** | **Twitter: Month-end recap** | Twitter/X | DRAFT | "1 month since we open-sourced Quadruple Verification. Here's what happened:" Stars, downloads, contributors, best feedback |
| **11:00 AM** | **LinkedIn: Month-end professional recap** | LinkedIn | DRAFT | Enterprise-focused month recap with metrics and learnings |
| **2:00 PM** | **Moltbook: End-of-month engagement** | Moltbook | — | Final push for 1000 karma target |

---

## FULL CONTENT REFERENCE

### LinkedIn Posts (5 scheduled + 2 bonus)

| # | Date | Persona | First Line (Hook) | Full Content Location |
|---|------|---------|-------------------|----------------------|
| 1 | Mar 14 | Founders/Broad | "Claude Code wrote eval() in our production codebase. Nobody caught it for 3 days." | `launch/linkedin-posts.md` Post 4 |
| 2 | Mar 15 | Solo Developers | "You're shipping fast with Claude Code. But every time you review the output, you find..." | `launch/linkedin-posts.md` Post 1 |
| 3 | Mar 16 | Team Leads | "I manage 30 engineers using Claude Code daily. Here's what I kept seeing in pull requests..." | `launch/linkedin-posts.md` Post 2 |
| 4 | Mar 18 | Security/CISO | "Your developers are using Claude Code. That means AI is writing code that goes into production..." | `launch/linkedin-posts.md` Post 3 |
| 5 | Mar 20 | Engineers | "We designed a verification architecture for AI-generated code. Here's why we chose hooks over prompts:" | `launch/linkedin-posts.md` Post 5 |
| 6 | Mar 25 | Broad | "We launched an open-source AI code verification tool 2 weeks ago. Here's what happened." | DRAFT — write based on real metrics |
| 7 | Mar 31 | Enterprise | Month-end professional recap | DRAFT — write based on real metrics |

### Twitter/X Posts (thread + standalone posts)

| # | Date | Type | First Line | Full Content Location |
|---|------|------|-----------|----------------------|
| Thread | Mar 13 | 9-tweet thread | "58% of AI-generated code has security vulnerabilities..." | `.planning/SOCIAL-MEDIA-CONTENT.md` section 1 |
| Hook | Mar 13 | Standalone | "Claude Code wrote eval() in our production codebase..." | `launch/social-posts.md` Post 1 |
| Demo | Mar 16 | Thread recap | "We open-sourced our internal Claude Code quality gate..." | `launch/social-posts.md` Post 4 |
| Article shares | Mar 17,19,24 | Links | Share Dev.to articles | — |
| Weekly updates | Mar 21,28 | Metrics | Week 1, 2, 3 recaps | DRAFT |
| Month recap | Mar 31 | Summary | "1 month since we open-sourced..." | DRAFT |

### Reddit Posts (4 subreddits)

| # | Date | Subreddit | Title | Full Content Location |
|---|------|-----------|-------|----------------------|
| 1 | Mar 14 | r/ClaudeAI | "AI tools actually slow experienced devs by 19%..." | `.planning/SOCIAL-MEDIA-CONTENT.md` section 3 |
| 2 | Mar 15 | r/programming | "41% of code is AI-generated..." | `.planning/SOCIAL-MEDIA-CONTENT.md` section 3 |
| 3 | Mar 21 | r/ChatGPTCoding | "Open-source plugin that adds automatic code quality..." | `.planning/SOCIAL-POSTS.md` |
| 4 | Mar 27 | r/ArtificialIntelligence | Adapted version | Based on r/ClaudeAI post |

### Hacker News

| Date | Title | Full Content Location |
|------|-------|----------------------|
| Mar 13 | "Show HN: I built a real-time verification layer for AI-generated code (58% has security flaws)" | `.planning/SOCIAL-MEDIA-CONTENT.md` section 2 |

### Product Hunt

| Date | Tagline | Full Content Location |
|------|---------|----------------------|
| Mar 13 | "AI writes code. We verify it." | `.planning/SOCIAL-MEDIA-CONTENT.md` section 4 |

### Discord

| Date | Channel | Full Content Location |
|------|---------|----------------------|
| Mar 13 | #plugins / #showcase | `.planning/SOCIAL-MEDIA-CONTENT.md` section 6 |

### Dev.to Articles (3 planned)

| # | Date | Title | Word Count | Status |
|---|------|-------|------------|--------|
| 1 | Mar 17 | "How We Stopped Claude Code from Writing eval() in Production" | ~1500 | DRAFT |
| 2 | Mar 19 | "28 Things Claude Code Should Never Write" | ~2000 | DRAFT |
| 3 | Mar 24 | "Building a Zero-Dependency Claude Code Plugin" | ~1500 | DRAFT |

### Moltbook Posts (Posts 7-24)

| # | Date | Title | Words | Pattern |
|---|------|-------|-------|---------|
| 7 | Mar 12 | "I ran 500 Claude Code sessions with and without a stop-gate..." | 800-900 | Experiment |
| 8 | Mar 13 | "SonarQube scored 0/6 on AI code..." | 600-800 | Competitive data |
| 9 | Mar 14 | "The plan-only failure: when your agent describes code instead of writing it" | 150-200 | Confessional |
| 10 | Mar 15 | "41% of code is AI-generated. The verification tooling is at 0%." | 300-400 | Gap analysis |
| 11 | Mar 16 | "What the audit trail reveals: patterns in AI code failures..." | 800-950 | Data analysis |
| 12 | Mar 16 | Cross-post best performer | — | Amplification |
| 13 | Mar 17 | "Nobody is talking about the verification gap in AI-generated code" | 300-400 | Viral framing |
| 14 | Mar 18 | "I logged every AI-generated security vulnerability for 30 days..." | 800-950 | Experiment |
| 15 | Mar 19 | "Your agent's code passes every test and ships every vulnerability" | <100 | Aphorism |
| 16 | Mar 20 | "The verification stack jazzys-happycapy described? We built it." | 200-300 | Callback |
| 17 | Mar 21 | "Zero dependencies is a security feature, not a limitation" | 200-300 | Contrarian |
| 18 | Mar 24 | "Month 1: what building a verification tool taught me..." | 600-800 | Reflective |
| 19 | Mar 25 | "The 5 AI code patterns no SAST tool catches..." | 800-950 | Actionable |
| 20 | Mar 26 | "Verification is not a feature. It's infrastructure." | 50-100 | Aphorism capstone |
| 21 | Mar 27 | Responsive/topical | Varies | Newsjacking |
| 22 | Mar 28 | Responsive/topical | Varies | Newsjacking |
| 23 | Mar 29 | Responsive/topical | Varies | Newsjacking |
| 24 | Mar 30 | Responsive/topical | Varies | Newsjacking |

---

## DAILY ENGAGEMENT RULES (Every Day, March 11-31)

| Platform | Daily Task | Time | Notes |
|----------|-----------|------|-------|
| **Moltbook** | 10+ comments on trending posts | 2-3 PM | Quality > quantity. Add genuine insight. |
| **Moltbook** | Reply to ALL comments on our posts | Within 2h | Drives algorithm visibility |
| **Moltbook** | Upvote 20+ posts/comments | Throughout day | Builds karma passively |
| **Twitter** | Reply to comments/mentions | Within 2h | Especially first 48h after posting |
| **Reddit** | Reply to comments | Within 2h | Never be defensive. Thank critics. |
| **LinkedIn** | Reply to every comment | Within 1h | LinkedIn algorithm rewards fast replies |
| **HN** | Reply to comments | Within 2h | Be technical and honest. HN hates marketing. |
| **GitHub** | Merge PRs within 24h | Morning | First impressions matter for OSS |
| **GitHub** | Respond to issues within 24h | Morning | Even if just to acknowledge |

---

## METRICS TARGETS

### End of Week 1 (March 16)

| Platform | Metric | Target |
|----------|--------|--------|
| GitHub | Stars | 25+ |
| npm | Weekly downloads | 20+ |
| Twitter | Thread impressions | 5,000+ |
| Reddit | r/ClaudeAI upvotes | 50+ |
| HN | Show HN points | 30+ |
| LinkedIn | Post 1 impressions | 2,000+ |
| Moltbook | Karma | 200+ |
| Moltbook | Followers | 50+ |

### End of Week 2 (March 23)

| Platform | Metric | Target |
|----------|--------|--------|
| GitHub | Stars | 50+ |
| npm | Weekly downloads | 50+ |
| Dev.to | Article 1 views | 1,000+ |
| Moltbook | Karma | 500+ |
| Moltbook | Followers | 150+ |
| Moltbook | Best post upvotes | 200+ |

### End of Month (March 31)

| Platform | Metric | Target |
|----------|--------|--------|
| GitHub | Stars | 100+ |
| npm | Weekly downloads | 50+/week |
| GitHub | Contributors | 5+ |
| Moltbook | Karma | 1,000+ |
| Moltbook | Followers | 300+ |
| Moltbook | Total posts | 24+ |
| Moltbook | Total comments | 400+ |
| Moltbook | Best post upvotes | 500+ |
| LinkedIn | Total impressions | 10,000+ |
| Twitter | Followers gained | 50+ |

---

## DEPENDENCIES & BLOCKERS

| Blocker | Required For | Resolution |
|---------|-------------|------------|
| GitHub repo setup (labels, issues, topics, discussions) | All public launches | Do FIRST on March 11 |
| npm clean install verification | All posts referencing install command | Test on March 11 |
| Demo GIF in README | Reddit/Twitter visual posts | Embed on March 11 |
| Product Hunt account setup | March 13 PH launch | Set up hunter/maker accounts |
| Dev.to account | March 17 article | Create/verify account |
| Google Calendar auth (`gws auth`) | Calendar reminders | Complete OAuth setup |

---

## FILES REFERENCE

| File | Contains |
|------|----------|
| `launch/social-posts.md` | Twitter/X posts (4), Reddit (2), HN, LinkedIn, Dev.to ideas |
| `launch/linkedin-posts.md` | 5 persona-based LinkedIn posts with posting schedule |
| `launch/moltbook-campaign.md` | Full Moltbook strategy, 4 phases, content playbook |
| `launch/moltbook-status.md` | Phase 1 status, post IDs, interaction log, learnings |
| `launch/launch-checklist.md` | 62-item pre-launch and week-1 checklist |
| `launch/github-seed-issues.md` | Seed issues for GitHub |
| `.planning/SOCIAL-MEDIA-CONTENT.md` | Comprehensive content: 9-tweet thread, HN, Reddit, PH, LinkedIn, Discord |
| `.planning/SOCIAL-POSTS.md` | Alt Twitter posts, Reddit variants |
| `.planning/MARKETING-RESEARCH.md` | Competitive analysis, market stats, personas |
| `.planning/PRODUCT-STRATEGY.md` | Product roadmap, monetization, UX priorities |

---

## GOOGLE CALENDAR IMPORT SUMMARY

> Once approved, each row becomes a Google Calendar event with:
> - **Title:** `[Platform] Task name`
> - **Time:** As specified (EST)
> - **Duration:** 30 min for posts, 1 hour for articles, 2 hours for engagement blocks
> - **Description:** The content to post (or link to file containing it)
> - **Color:** Red = launch day, Orange = content creation, Blue = engagement, Green = metrics

**Total calendar events to create: ~75**
- Pre-launch setup: 12 events
- Launch week: 20 events
- Week 2: 22 events
- Week 3+: 21 events
