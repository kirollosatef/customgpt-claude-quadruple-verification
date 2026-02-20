# Programming Language Popularity Trends (2025-2026)

A data-driven analysis of programming language popularity across the TIOBE Index,
Stack Overflow Developer Survey, GitHub Octoverse, and job market data.

---

## 1. TIOBE Index Rankings

The TIOBE Index measures language popularity based on search engine query volume.
Python continues to lead, but the gap is narrowing as specialized languages gain ground.

### February 2026 Top 10

| Rank | Language             | Rating  | Trend                          |
|------|----------------------|---------|--------------------------------|
| 1    | Python               | 21.81%  | Down from 26.98% peak (Jul 2025) |
| 2    | C                    | 11.05%  | Rising; moved up from 4th      |
| 3    | C++                  | 8.55%   | Swapped with Java               |
| 4    | Java                 | 8.12%   | Dropped from 2nd (Jan 2025)     |
| 5    | C#                   | 6.83%   | 2025 Language of the Year       |
| 6    | JavaScript           | 2.92%   | Stable                          |
| 7    | Visual Basic         | 2.85%   | Stable                          |
| 8    | R                    | 2.19%   | Climbed from 10th               |
| 9    | SQL                  | 1.93%   | Dropped one spot                |
| 10   | Delphi/Object Pascal | 1.88%   | Dropped one spot                |

### February 2025 Top 20 (Baseline)

For comparison, the TIOBE Index from February 2025 provides the baseline the
current rankings evolved from:

| Rank | Language             | Rating  | YoY Change |
|------|----------------------|---------|------------|
| 1    | Python               | 23.88%  | +8.72%     |
| 2    | C++                  | 11.37%  | +0.84%     |
| 3    | Java                 | 10.66%  | +1.79%     |
| 4    | C                    | 9.84%   | -1.14%     |
| 5    | C#                   | 4.12%   | -3.41%     |
| 6    | JavaScript           | 3.78%   | +0.61%     |
| 7    | SQL                  | 2.87%   | +1.04%     |
| 8    | Go                   | 2.26%   | +0.53%     |
| 9    | Delphi/Object Pascal | 2.18%   | +0.78%     |
| 10   | Visual Basic         | 2.04%   | +0.52%     |
| 11   | Fortran              | 1.75%   | +0.35%     |
| 12   | Scratch              | 1.54%   | +0.36%     |
| 13   | Rust                 | 1.47%   | +0.42%     |
| 14   | PHP                  | 1.14%   | -0.37%     |
| 15   | R                    | 1.06%   | +0.07%     |
| 16   | MATLAB               | 0.98%   | -0.28%     |
| 17   | Assembly Language     | 0.95%   | -0.24%     |
| 18   | COBOL                | 0.82%   | -0.18%     |
| 19   | Ruby                 | 0.82%   | -0.17%     |
| 20   | Prolog               | 0.80%   | +0.03%     |

### Key TIOBE Trends

- **Python's decline from peak.** Python hit 26.98% in July 2025 but has since
  fallen to 21.81% by February 2026. While still dominant, specialized languages
  (R, Perl, Julia) are chipping away at its share.
- **C# named 2025 Language of the Year** for achieving the largest year-over-year
  rating increase, driven by .NET ecosystem expansion, Unity game development, and
  enterprise adoption.
- **C surges to second place** in 2026, displacing both C++ and Java with an 11.05%
  rating. Embedded systems and IoT demand continue to fuel C's resurgence.
- **Perl's comeback.** Perl jumped from 32nd (January 2025) to 11th by year-end
  2025 -- one of the most dramatic climbs in TIOBE history.
- **Julia enters the top 20** for the first time, marking a milestone for the
  scientific computing language.
- **Go dropped out of the top 10** between February 2025 (8th place) and
  February 2026, despite continued growth in cloud and DevOps usage.

Sources: [TIOBE Index](https://www.tiobe.com/tiobe-index/),
[TechRepublic](https://www.techrepublic.com/article/news-tiobe-index-language-rankings/),
[InfoWorld](https://www.infoworld.com/article/4129615/python-is-slipping-in-popularity-tiobe.html),
[Visual Studio Magazine](https://visualstudiomagazine.com/articles/2026/01/08/csharp-grabs-language-of-the-year-tiobe-predicts-typescript-rise.aspx),
[index.dev](https://www.index.dev/blog/most-popular-programming-languages-)

---

## 2. Stack Overflow Developer Survey (2025)

The 2025 Stack Overflow Developer Survey collected 49,000+ responses from
developers in 177 countries, covering 314 technologies.

### Most Used Languages

| Rank | Language        | Usage  | YoY Change       |
|------|-----------------|--------|------------------|
| 1    | JavaScript       | 66.0%  | Stable           |
| 2    | HTML/CSS         | 61.9%  | Stable           |
| 3    | SQL              | 58.6%  | Stable           |
| 4    | Python           | 57.9%  | +7 pp from 2024  |
| 5    | Bash/Shell       | 48.7%  | Stable           |
| 6    | TypeScript       | 43.6%  | Growing          |

Python's +7 percentage point jump is the largest single-year gain for any
language in recent survey history, driven by AI/ML and data science adoption.

### Most Admired Languages

"Admired" = percentage of current users who want to continue using the language.

| Rank | Language | Admired |
|------|----------|---------|
| 1    | Rust     | 72%     |
| 2    | Gleam    | 70%     |
| 3    | Elixir   | 66%     |
| 4    | Zig      | 64%     |

Rust has held the top "most admired" spot for multiple consecutive years.
Gleam is a newcomer to the rankings, reflecting growing interest in
BEAM-ecosystem languages.

### Most Desired Languages

Python is the most desired language -- the one developers most want to learn
next -- followed by TypeScript, Rust, and Go. These four languages represent a
convergence around performance, type safety, and AI applicability.

### Notable Growth

- **Rust and Go** each gained +2 percentage points in usage, both increasingly
  adopted for AI infrastructure and systems programming.
- Python's 56.4% admiration rate is notable: while not the highest, it shows
  strong retention alongside massive growth in new adoption.

Sources: [Stack Overflow 2025 Survey](https://survey.stackoverflow.co/2025/),
[SO Technology Results](https://survey.stackoverflow.co/2025/technology),
[Stack Overflow Blog](https://stackoverflow.blog/2025/12/29/developers-remain-willing-but-reluctant-to-use-ai-the-2025-developer-survey-results-are-here)

---

## 3. GitHub Octoverse (2025)

The GitHub Octoverse 2025 report (released October 2025) tracks real-world open
source activity across GitHub's 100M+ developer base.

### Top Languages by Monthly Contributors (August 2025)

| Rank | Language    | Monthly Contributors | YoY Growth    |
|------|-------------|----------------------|---------------|
| 1    | TypeScript  | 2,636,006            | +66.63%       |
| 2    | Python      | ~2,592,000 (est.)    | +48.78%       |
| 3    | JavaScript  | ~2,150,000 (est.)    | +24.79%       |
| 4    | Java        | Strong               | Stable growth |
| 5    | C++         | Strong               | Stable growth |
| 6    | C#          | +136,735 added       | +22.22%       |

### Platform-Wide Metrics (2025)

- **36 million** new developers joined GitHub (more than 1 per second on average)
- **~1 billion** commits pushed (+25.1% YoY)
- **43.2 million** pull requests merged per month on average (+23% YoY)
- Nearly **80%** of new repositories used just six languages: Python, JavaScript,
  TypeScript, Java, C++, and C#

### The TypeScript Breakthrough

TypeScript overtaking Python as the #1 language on GitHub is the most significant
language shift in more than a decade. Key factors:

1. **AI-assisted coding reliability.** A 2025 study found 94% of LLM-generated
   code errors are type-related. TypeScript catches these automatically at
   compile time.
2. **Framework defaults.** Major frontend frameworks (Next.js, Angular, etc.) now
   scaffold with TypeScript by default.
3. **Full-stack adoption.** TypeScript is no longer just a frontend language --
   server-side usage (Node.js, Deno, Bun) is surging.

### Python's Continued Strength

Despite dropping to #2 by contributors, Python added ~850,000 new contributors
(+48.78% YoY) -- its highest absolute growth ever. AI/ML repositories are the
primary driver.

Sources: [GitHub Octoverse 2025](https://octoverse.github.com/),
[InfoWorld](https://www.infoworld.com/article/4080454/typescript-rises-to-the-top-on-github.html),
[It's FOSS](https://itsfoss.com/news/github-octoverse-2025/),
[Codecademy](https://www.codecademy.com/resources/blog/typescript-most-used-language-on-github)

---

## 4. Job Market Demand and Salaries

### Job Postings by Language (US Market, 2025)

| Language       | Approx. Postings (Indeed) | LinkedIn Jobs |
|----------------|---------------------------|---------------|
| Python         | 80,000+                   | 1,190,000+    |
| Java           | 43,000+                   | High          |
| JavaScript/TS  | 30,000+                   | High          |
| C++            | Significant               | High          |
| Go             | Growing                   | Growing       |
| Rust           | Growing rapidly            | Growing       |

Python dominates with roughly 30% of all programming job postings. Job postings
for Python grew 25% in 2025 alone, fueled by AI/ML demand.

### Average Developer Salaries (US, 2025-2026)

| Language     | Average Salary | Senior Range       |
|--------------|----------------|---------------------|
| Solidity     | $167,000       | $200,000+           |
| Erlang       | $152,000       | $180,000+           |
| Go           | $146,879       | $180,000+           |
| Scala        | $146,000       | $175,000+           |
| Perl         | $140,000       | $160,000+           |
| Rust         | $130,000       | Up to $235,000      |
| Python       | $125,740       | Up to $188,507      |
| TypeScript   | $131,956       | $163,000+           |
| Swift        | $110,000       | $150,000+           |
| Kotlin       | $105,000       | $140,000+           |
| JavaScript   | $100,000       | Up to $171,600      |
| Ruby         | $95,000        | $130,000+           |
| SQL          | $90,000        | $120,000+           |

### Demand Trends

- **Python** leads in both volume and salary growth, driven by AI/ML adoption.
  Roughly 40% of tech recruiters actively seek Python skills.
- **Go and Rust** command premium salaries relative to their ecosystem size due
  to a supply-demand gap -- more companies want these skills than developers
  possess them.
- **TypeScript** is increasingly listed alongside or instead of JavaScript in job
  postings, reflecting the GitHub trend.
- **Solidity and blockchain languages** offer the highest salaries but in a
  smaller, more volatile niche market.

Sources: [Itransition](https://www.itransition.com/developers/in-demand-programming-languages),
[WhizzBridge](https://www.whizzbridge.com/blog/highest-paying-programming-languages),
[GeeksforGeeks](https://www.geeksforgeeks.org/blogs/highest-paying-programming-languages/),
[index.dev](https://www.index.dev/blog/best-paying-programming-languages),
[Second Talent](https://www.secondtalent.com/resources/top-programming-usage-statistics/)

---

## 5. Cross-Source Analysis

Combining all four data sources reveals consistent themes and some interesting
divergences.

### Languages Ranked Consistently High Across All Sources

| Language    | TIOBE | SO Survey | GitHub  | Job Market |
|-------------|-------|-----------|---------|------------|
| Python      | #1    | #4 (58%)  | #2      | #1         |
| JavaScript  | #6    | #1 (66%)  | #3      | #3         |
| TypeScript  | N/A*  | #6 (44%)  | **#1**  | Rising     |
| Java        | #4    | Top 10    | #4      | #2         |
| C++         | #3    | Top 15    | #5      | Top 5      |
| C#          | #5    | Top 10    | #6      | Top 10     |

*TypeScript is not tracked separately in TIOBE (grouped under JavaScript
ecosystem).

### Key Takeaways

1. **Python is the overall king** -- #1 in TIOBE and job market, #2 on GitHub,
   and #4 in Stack Overflow usage. Its AI/ML tailwind shows no sign of slowing.

2. **TypeScript is the breakout story of 2025.** Its leap to #1 on GitHub by
   contributors is historic. The combination of type safety, AI-coding
   compatibility, and framework adoption makes it the fastest-growing mainstream
   language.

3. **Rust is the developer-loved outsider.** #1 in admiration for multiple years
   running, with salaries up to $235K, but still niche in TIOBE (~1.5%) and job
   volume. It's the language developers *want* to use.

4. **C# had a breakout year.** TIOBE's 2025 Language of the Year, powered by
   .NET expansion, Unity, and enterprise demand. Its +22% contributor growth on
   GitHub confirms the trend.

5. **The old guard (C, C++, Java) remains entrenched.** Despite newer language
   hype, C moved to #2 in TIOBE, C++ to #3, and Java maintains massive job
   market demand. Systems programming and enterprise aren't going anywhere.

6. **Go lost TIOBE ground but gained everywhere else.** Dropped out of the TIOBE
   top 10 but commands $147K average salary, +2pp growth in Stack Overflow, and
   is central to cloud-native infrastructure.

7. **Perl's unexpected resurgence** (32nd to 11th in TIOBE) is one of 2025's
   biggest surprises, likely driven by infrastructure automation and legacy system
   maintenance demand.

---

## 6. Outlook for 2026

Based on current trajectories:

- **Python** will remain #1 overall but continue its gradual TIOBE decline from
  the 2025 peak as the ecosystem diversifies.
- **TypeScript** is on track to appear in TIOBE's top 10 (TIOBE itself has
  predicted this) and will likely hold #1 on GitHub.
- **Rust** will continue climbing in job postings and survey usage but remains
  2-3 years from mainstream adoption in enterprise environments.
- **AI-driven language selection** is the meta-trend: languages with strong type
  systems (TypeScript, Rust, Go) benefit from AI code generation tooling, as
  type checkers catch LLM-generated errors automatically.
- **C# and .NET** momentum is strong; expect continued growth in enterprise and
  game development.

---

*Data compiled February 2026. All figures are approximate and sourced from the
publications cited in each section. Salary figures represent US market averages
and vary significantly by location, experience, and specialization.*
