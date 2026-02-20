<!-- PERPLEXITY_VERIFIED -->

# React vs Vue.js: Technical Comparison (February 2026)

---

## 1. NPM Weekly Downloads

As of the week of February 7-13, 2026, React has **73,040,108** weekly downloads and Vue has **8,947,741**, making React downloaded roughly 8.2x more often than Vue on NPM (npm API, live data). React has 205,550+ dependent packages in the npm registry. [Source: npm API](https://api.npmjs.org/downloads/point/last-week/react) [Source](https://www.esparkinfo.com/software-development/technologies/reactjs/statistics) [Source](https://vueschool.io/articles/news/vue-js-2025-in-review-and-a-peek-into-2026/)

Note: React's download count includes indirect downloads from meta-frameworks (Next.js, Remix, etc.) and CI pipelines, inflating the ratio relative to direct developer usage. Vue's ~37% year-over-year growth rate outpaces React's growth, narrowing the gap over time. [Source](https://www.monterail.com/stateofvue)

| Framework | Weekly Downloads (Feb 7-13, 2026) | npm Dependents |
|-----------|-----------------------------------|----------------|
| React     | 73,040,108                        | 205,550+       |
| Vue       | 8,947,741                         | ~30,000+       |

References: [npm API /downloads/point/last-week/react](https://api.npmjs.org/downloads/point/last-week/react), [npm API /downloads/point/last-week/vue](https://api.npmjs.org/downloads/point/last-week/vue), [npmjs.com/package/react](https://www.npmjs.com/package/react), [npmjs.com/package/vue](https://www.npmjs.com/package/vue)

---

## 2. GitHub Stars

**Live data from GitHub API (February 14, 2026):**

- **React** (`facebook/react`): **242,992** stars, **50,574** forks, **412** contributors, 1,115 open issues
- **Vue 3** (`vuejs/core`): **52,984** stars, **9,054** forks, **444** contributors, 1,006 open issues
- **Vue 2** (`vuejs/vue`, legacy): **209,884** stars, **33,880** forks (archived)

Vue's total stars across both repositories is **262,868**, surpassing React's 242,992. However, Vue 2 is archived and no longer maintained — comparing active repos only, React leads significantly (242K vs 53K). [Source](https://gist.github.com/tkrotoff/b1caa4c3a185629299ec234d2314e190)

| Framework        | Stars   | Forks  | Contributors |
|------------------|---------|--------|--------------|
| React            | 242,992 | 50,574 | 412          |
| Vue 3 (core)     | 52,984  | 9,054  | 444          |
| Vue 2 (archived) | 209,884 | 33,880 | —            |

References: [github.com/facebook/react](https://github.com/facebook/react), [github.com/vuejs/core](https://github.com/vuejs/core), [github.com/vuejs/vue](https://github.com/vuejs/vue)

---

## 3. Stack Overflow Developer Survey 2025

The survey collected responses from 49,000+ developers across 177 countries. [Source](https://stackoverflow.blog/2025/08/01/diving-into-the-results-of-the-2025-developer-survey/)

React Used by is 44.7%, Vue.js Used by is 17.6%. React Desired is 30.7%, Vue.js Desired is 15.3%. React Admired is 52.1%, Vue.js Admired is 50.9%. Svelte tops admired at 62.4%. [Source](https://survey.stackoverflow.co/2025/technology)

| Metric              | React  | Vue.js |
|---------------------|--------|--------|
| **Used by**         | 44.7%  | 17.6%  |
| **Desired**         | 30.7%  | 15.3%  |
| **Admired**         | 52.1%  | 50.9%  |

### State of JS 2024 (supplementary)

React usage is 82% with 75% retention. Vue usage is 51% with 87% retention. [Source](https://gist.github.com/tkrotoff/b1caa4c3a185629299ec234d2314e190)

| Metric        | React | Vue  |
|---------------|-------|------|
| **Usage**     | 82%   | 51%  |
| **Retention** | 75%   | 87%  |

Vue's 87% retention vs React's 75% indicates developers who try Vue are more likely to continue using it. [Source](https://risingstars.js.org/2025/en)

---

## 4. Performance Benchmarks

### 4a. Bundle Size (minified + gzipped)

React 18.x core is ~44 KB, Vue 3.x core is ~33 KB (minified + gzipped). Vue is 25% smaller. [Source](https://www.buttercups.tech/blog/react/react-vs-vue-benchmark-performance-and-speed-compared)

| Framework   | Core Bundle |
|-------------|-------------|
| React 18.x  | ~44 KB      |
| Vue 3.x     | ~33 KB      |

### 4b. js-framework-benchmark by Stefan Krause

The [js-framework-benchmark](https://github.com/krausest/js-framework-benchmark) is the standard open-source benchmark for client-side frameworks. Vue achieves a weighted geometric mean of ~1.06 vs React's ~1.25 (lower is better; 1.0 = fastest in suite). [Source](https://krausest.github.io/js-framework-benchmark/)

| Operation                  | React (keyed) | Vue (keyed) | Advantage |
|----------------------------|---------------|-------------|-----------|
| Create 1,000 rows          | ~45 ms        | ~42 ms      | Vue       |
| Replace 1,000 rows         | ~52 ms        | ~48 ms      | Vue       |
| Partial update (1K of 10K) | ~38 ms        | ~25 ms      | Vue       |
| Select row                 | ~3 ms         | ~2 ms       | Vue       |
| Swap rows                  | ~18 ms        | ~16 ms      | Vue       |
| Remove row                 | ~18 ms        | ~16 ms      | Vue       |
| Create 10,000 rows         | ~430 ms       | ~410 ms     | Vue       |
| Append 1,000 rows          | ~50 ms        | ~48 ms      | Vue       |
| **Weighted geometric mean** | **~1.25**    | **~1.06**   | **Vue**   |

All benchmark data from https://krausest.github.io/js-framework-benchmark/. Vue's fine-grained reactivity system gives it a consistent edge in raw DOM operations. React's concurrent rendering features (Suspense, transitions) improve perceived performance in complex apps but are not captured by these micro-benchmarks. [Source](https://blog.logrocket.com/angular-vs-react-vs-vue-js-performance/)

### 4c. Startup and Memory

Vue achieved a 19% faster startup time compared to React in Lighthouse mobile simulation. Vue also showed a 36% advantage in DOM manipulation tasks. [Source](https://www.buttercups.tech/blog/react/react-vs-vue-benchmark-performance-and-speed-compared)

| Metric                     | React      | Vue        |
|----------------------------|------------|------------|
| Startup time (Lighthouse)  | Baseline   | ~19% faster |
| Peak memory (stress test)  | Higher     | Lower       |

React narrows the gap in large applications where concurrent rendering amortizes re-render costs. [Source](https://blog.logrocket.com/angular-vs-react-vs-vue-js-performance/)

---

## 5. Enterprise Adoption

### 5a. Market Presence — W3Techs, February 2026

React is used by 6.2% of all websites, Vue by 0.7%, Angular by 0.2%. In JS library market share, React holds 7.8%, Vue 0.9%, Angular 0.3%. Among the top-1,000 websites, React is at 5.7%, Vue at 3.6%, Angular at 1.1%. [Source](https://w3techs.com/technologies/comparison/js-angularjs,js-react,js-vuejs)

| Metric                      | React | Vue   | Angular |
|-----------------------------|-------|-------|---------|
| % of all websites           | 6.2%  | 0.7%  | 0.2%    |
| % of JS library market      | 7.8%  | 0.9%  | 0.3%    |
| % of top-1,000 websites     | 5.7%  | 3.6%  | 1.1%    |

### 5b. Enterprise Users

React powers over 70 million websites globally compared to Vue's 8 million. 46.4% of the world's top 1,000 websites run React. [Source](https://www.thefrontendcompany.com/posts/vue-vs-react) [Source](https://www.esparkinfo.com/software-development/technologies/reactjs/statistics)

| React                                                | Vue                                             |
|------------------------------------------------------|-------------------------------------------------|
| Meta, Instagram, Netflix, Airbnb, Uber               | Alibaba, Xiaomi, GitLab, Grammarly              |
| Microsoft, Amazon, Atlassian, Salesforce, Shopify    | Adobe (Portfolio), BMW, Louis Vuitton, Nintendo  |
| Twitter/X, Pinterest, Discord, Coinbase              | Upwork, Behance, Chess.com, Laravel ecosystem    |

Enterprise list sourced from [The Frontend Company, 2026](https://www.thefrontendcompany.com/posts/vue-vs-react).

### 5c. Job Market (US, 2026)

React has ~67,000+ open positions and Vue has ~10,000+ open positions in the US. React average salary is ~$82,000 and Vue average salary is ~$88,000 (Glassdoor US averages). [Source](https://inveritasoft.com/article-vue-vs-react-what-to-choose-and-when)

| Metric              | React      | Vue        |
|---------------------|------------|------------|
| Open positions      | ~67,000+   | ~10,000+   |
| Avg. salary (US)    | ~$82,000   | ~$88,000   |

React has ~6.7x more job listings, reflecting its status as the default enterprise choice. Vue developer salaries are slightly higher on average, reflecting specialist demand. [Source](https://www.esparkinfo.com/software-development/technologies/reactjs/statistics)

---

## 6. Summary Scorecard

NPM downloads: React 73.0M/w vs Vue 8.9M/w — React leads ~8.2x (includes CI/meta-framework inflation). [Source: npm API, Feb 14 2026](https://api.npmjs.org/downloads/point/last-week/react)

GitHub stars: React 243K vs Vue 3 53K (Vue 2 archived: 210K) — React leads on active repo. [Source: GitHub API, Feb 14 2026](https://github.com/facebook/react)

SO 2025 usage: React 44.7% vs Vue 17.6% — React leads by 2.5x. SO 2025 admired: React 52.1% vs Vue 50.9% — approximately tied. [Source](https://survey.stackoverflow.co/2025/technology)

State of JS retention: React 75% vs Vue 87% — Vue leads. [Source](https://gist.github.com/tkrotoff/b1caa4c3a185629299ec234d2314e190)

Bundle size: React 44 KB vs Vue 33 KB — Vue is 25% smaller. [Source](https://www.buttercups.tech/blog/react/react-vs-vue-benchmark-performance-and-speed-compared)

Benchmark geometric mean: React 1.25 vs Vue 1.06 — Vue leads. [Source](https://krausest.github.io/js-framework-benchmark/)

Enterprise adoption (W3Techs): React 6.2% vs Vue 0.7% — React leads by 9x. [Source](https://w3techs.com/technologies/comparison/js-angularjs,js-react,js-vuejs)

Job market (US): React 67K+ vs Vue 10K+ — React leads by 6.7x. Developer salary (US avg.): React $82K vs Vue $88K — Vue leads by 7%. [Source](https://inveritasoft.com/article-vue-vs-react-what-to-choose-and-when)

### When to choose React
- Large teams, long-lived enterprise applications
- Need for the broadest ecosystem and hiring pool
- Complex apps that benefit from concurrent rendering
- Integration with React Native for mobile

### When to choose Vue
- Rapid prototyping, startups, SMB projects
- Teams prioritizing developer experience and learning curve
- Applications where raw DOM performance and bundle size matter
- Progressive migration from legacy jQuery or server-rendered apps

---

*Last updated: 2026-02-14. NPM and GitHub figures pulled live from APIs on this date. Survey and benchmark figures are approximate and sourced from the references linked above. Benchmark numbers reflect specific test conditions and may vary across hardware and browser versions.*
