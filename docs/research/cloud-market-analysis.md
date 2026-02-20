# Cloud Computing Market Analysis: AWS vs Azure vs GCP

> **Published:** February 14, 2026 | **Data through:** Q4 2025 (Synergy Research)

---

## Executive Summary

The global cloud infrastructure market reached **$419 billion** in annual revenue in 2025, with Q4 quarterly spending hitting a record **$119.1 billion** — a $12 billion sequential jump. AWS maintains revenue leadership, but Azure and Google Cloud are closing the gap through aggressive AI investment and faster growth rates. GenAI-specific cloud services grew 140-180% year-over-year in 2025, reshaping competitive dynamics across all three providers. CoreWeave has entered the top ten cloud providers, generating over $1.5 billion in quarterly revenue from AI/GPU workloads.

---

## 1. Market Share

### Q4 2025 — Global Cloud Infrastructure Services (Synergy Research Group)

| Provider | Market Share | Trend (2024 → 2025) |
|----------|:-----------:|:------------------:|
| **AWS** | 28% | Declining (was ~30% in Q3, ~32% in 2021) |
| **Microsoft Azure** | 21% | Gaining (+1 pp from Q3) |
| **Google Cloud** | 14% | Gaining (+1 pp from Q3) |
| **Big Three Combined** | 63% | Stable |
| Others (Alibaba, Oracle, IBM, neoclouds) | 37% | Neoclouds rising, others flat/declining |

- AWS share has eroded gradually from ~32% in 2021 to 28% in Q4 2025, though absolute revenue continues to grow strongly.
- Azure and GCP have gained steadily; Microsoft crossed the 21% threshold for the first time.
- Oracle and "neoclouds" (CoreWeave, Crusoe, Nebius, Lambda) are the fastest-growing segment outside the Big Three, driven by GPU-as-a-service demand. CoreWeave now exceeds $1.5B in quarterly revenue and has entered the top ten.
- Google Cloud remains nearly **4x the size** of fourth-placed Alibaba, highlighting the wide moat between the top three and everyone else.
- The overall market grew 30% YoY in Q4 2025, with IaaS/PaaS accounting for 34% of the growth.

---

## 2. Revenue & Growth

### Quarterly Revenue (Q4 2025)

| Provider | Q4 2025 Revenue | YoY Growth | Annualized Run Rate |
|----------|:--------------:|:----------:|:-------------------:|
| **AWS** | $35.6 B | 24% | ~$142 B |
| **Microsoft Intelligent Cloud** | $32.9 B | 29% | ~$132 B |
| **Google Cloud** | $17.7 B | 48% | ~$71 B |

### Full-Year 2025 Revenue

| Provider | FY 2025 Revenue | FY 2024 Revenue | YoY Growth |
|----------|:---------------------:|:---------------:|:----------:|
| **AWS** | $128.7 B | $107.6 B | ~20% |
| **Microsoft Azure*** | $75 B | ~$56 B | 34% |
| **Google Cloud** | ~$58.8 B | ~$43.1 B | ~36% |
| **Total Cloud Market** | **$419 B** | **$330 B** | **~27%** |

*\*Microsoft does not break out Azure revenue separately; the $75B figure reflects Azure and other cloud services within Intelligent Cloud for Microsoft's fiscal year ending June 2025. Google Cloud quarterly totals: Q1 $12.3B + Q2 $13.6B + Q3 $15.2B + Q4 $17.7B. Total market figure from Synergy Research Group includes all IaaS, PaaS, and hosted private cloud services.*

### Growth Trajectory

| Metric | AWS | Azure | Google Cloud |
|--------|:---:|:-----:|:------------:|
| Q2 2025 YoY growth | 17% | 26% | 32% |
| Q3 2025 YoY growth | ~20% | ~28% | ~35% |
| Q4 2025 YoY growth | 24% | 29% | 48% |
| 2025 average annual growth | ~20% | ~33% | ~36% |

Google Cloud posted the fastest acceleration in H2 2025, driven by Gemini AI workloads and BigQuery demand. AWS rebounded in Q4 after a softer first half, citing increased enterprise migration commitments. AWS full-year 2025 operating income reached $45.6 billion with a ~35% operating margin in Q4.

---

## 3. Pricing Comparison

### 3.1 Compute — General Purpose VMs (4 vCPU, 16 GB RAM)

| Pricing Model | AWS (m7i.xlarge) | Azure (D4s v5) | GCP (n2-standard-4) |
|---------------|:----------------:|:---------------:|:--------------------:|
| **On-Demand (monthly)** | $140.16 | $140.16 | $142.79 |
| **1-Year Commitment** | $88.33 | $96.12 | $90.33 |
| **3-Year Commitment** | $60.59 | $64.50 | $64.81 |

**Key observations:**
- On-demand pricing is nearly identical across all three providers.
- AWS offers the lowest committed pricing at both 1-year and 3-year terms.
- GCP is competitive at the 1-year level but slightly higher at 3 years.
- ARM-based instances (AWS Graviton, Azure Cobalt, GCP Axion) deliver 20-40% savings over x86 equivalents.

### 3.2 Spot / Preemptible Instances

| Provider | Typical Discount vs On-Demand | Price Stability |
|----------|:----------------------------:|:---------------:|
| **AWS Spot** | Up to 90% off | High volatility (avg. 197 price changes/month) |
| **Azure Spot** | Up to 90% off | Moderate volatility |
| **GCP Preemptible / Spot** | Up to 80% off | Most stable pricing |

### 3.3 Object Storage (Standard Tier, per GB/month, US East)

| Tier | AWS S3 | Azure Blob (Hot) | GCP Cloud Storage |
|------|:------:|:----------------:|:-----------------:|
| **Standard** | $0.023 | $0.018 | $0.020 |
| **Infrequent Access** | $0.0125 | $0.010 | $0.010 |
| **Archive** | $0.004 | $0.001 | $0.0012 |

**Key observations:**
- Azure is the most cost-effective for standard and archive object storage.
- AWS S3 is the most expensive across all tiers but offers the most granular tiering options (S3 Express One Zone, Intelligent-Tiering, Glacier Deep Archive).
- Egress fees remain a significant hidden cost: AWS charges $0.09/GB for the first 10 TB; Azure and GCP offer comparable rates but with more generous free tiers.

### 3.4 Storage — 10 TB (Standard Tier, Monthly)

| Region | AWS | Azure | GCP |
|--------|:---:|:-----:|:---:|
| **US East (N. Virginia)** | $235.52 | $212.99 | $214.20 |
| **Europe (Zurich)** | $275.97 | $220.77 | $232.83 |
| **Asia (Mumbai)** | $256.00 | $204.80 | $214.20 |

Azure is consistently the cheapest for bulk storage across all major regions.

### 3.5 Managed Database (Relational, 4 vCPU / 16 GB RAM)

| Provider | Service | Approx. Monthly Cost (On-Demand) |
|----------|---------|:--------------------------------:|
| **AWS** | RDS (PostgreSQL, db.m7g.xlarge) | ~$280-350 |
| **Azure** | Azure Database for PostgreSQL (GP, 4 vCPU) | ~$290-370 |
| **GCP** | Cloud SQL (PostgreSQL, db-custom-4-16384) | ~$260-330 |

Managed database pricing varies significantly by engine, storage IOPS, and backup configuration. GCP Cloud SQL tends to be the most affordable for baseline configurations.

### 3.6 Serverless Functions

| Provider | Service | Free Tier | Price per 1M Invocations | Price per GB-sec |
|----------|---------|:---------:|:------------------------:|:----------------:|
| **AWS** | Lambda | 1M req + 400K GB-sec/month | $0.20 | $0.0000166667 |
| **Azure** | Functions | 1M req + 400K GB-sec/month | $0.20 | $0.000016 |
| **GCP** | Cloud Functions | 2M req + 400K GB-sec/month | $0.40 | $0.0000025 |

GCP's per-GB-second pricing is significantly lower, but per-invocation cost is higher. Total cost depends on function memory allocation and execution duration.

---

## 4. Competitive Positioning

### AWS — The Broadest Platform

- **Strengths:** Largest service catalog (200+ services), deepest ecosystem of partners and tooling, strongest enterprise migration track record.
- **AI strategy:** Amazon Bedrock (model marketplace), Trainium/Inferentia custom silicon, SageMaker for MLOps.
- **Weakness:** Slower growth relative to competitors; perceived as more complex and expensive for new workloads.

### Microsoft Azure — The Enterprise Incumbent

- **Strengths:** Seamless integration with Microsoft 365, Active Directory, and Dynamics; strongest hybrid cloud story (Azure Arc); deep enterprise relationships.
- **AI strategy:** Exclusive OpenAI partnership, Copilot ecosystem, Azure AI Studio.
- **Weakness:** Pricing complexity; service reliability has drawn scrutiny after several high-profile outages.

### Google Cloud — The AI-Native Challenger

- **Strengths:** Best-in-class data analytics (BigQuery), leading AI/ML platform (Vertex AI, Gemini), strongest Kubernetes offering (GKE as originator of K8s).
- **AI strategy:** Gemini model family, TPU custom silicon, Vertex AI as unified platform.
- **Weakness:** Smallest enterprise sales force; narrower service catalog; least mature in regulated industries.

---

## 5. Market Outlook (2026)

- **Total market size** is projected to reach **$520-550 billion** in 2026, driven by AI infrastructure spending and the Q4 2025 run rate of $476B annualized.
- **AI workloads** will account for an increasing share of cloud revenue, with GenAI services expected to grow 80-120% YoY.
- **Google Cloud** is likely to continue the fastest growth trajectory, potentially approaching 15% market share by end of 2026.
- **Azure** will benefit from enterprise Copilot adoption and OpenAI integration, maintaining 30%+ growth.
- **AWS** is expected to sustain 20-25% growth, leveraging its scale advantage and custom silicon (Graviton, Trainium).
- **Emerging competitors:** Oracle Cloud Infrastructure and neoclouds (CoreWeave, Lambda) will capture GPU-centric workloads but remain sub-5% of total market.

---

## Sources

- [Synergy Research Group — Cloud Market Share Trends, Q3 2025](https://www.srgresearch.com/articles/cloud-market-share-trends-big-three-together-hold-63-while-oracle-and-the-neoclouds-inch-higher)
- [Synergy Research Group — Q4 2025 Cloud Infrastructure Spend Jumps $12B](https://www.datacenterdynamics.com/en/news/synergy-enterprise-cloud-infrastructure-spend-jumps-12bn-in-q4-2025/)
- [Canalys — Global Cloud Q1 2025](https://canalys.com/newsroom/global-cloud-q1-2025)
- [TechTarget — Big Three Grab Two-Thirds of $107B Cloud Market](https://www.techtarget.com/searchcloudcomputing/news/366634757/The-big-three-grab-two-thirds-of-107B-cloud-market-in-Q3)
- [Fiduciary Tech — Cloud Wars Q4 2025](https://www.fiduciarytech.com/single-post/cloud-wars-face-off-google-surges-48-while-aws-dominates-revenue-in-q4-2025)
- [CNBC — AWS Q4 Earnings Report 2025](https://www.cnbc.com/2026/02/05/aws-q4-earnings-report-2025.html)
- [Motley Fool — AWS vs Azure and Google Cloud, Feb 2026](https://www.fool.com/investing/2026/02/07/think-aws-is-losing-to-azure-and-google-cloud-you/)
- [EffectiveSoft — Cloud Pricing Comparison 2026](https://www.effectivesoft.com/blog/cloud-pricing-comparison.html)
- [CAST AI — Cloud Pricing Comparison 2025](https://cast.ai/blog/cloud-pricing-comparison/)
- [Sedai — AWS vs Azure vs GCP VMs 2026](https://sedai.io/blog/aws-ec2-vs-azure-public-cloud-vms-vs-gcp-compute-engine-comparison)
- [Statista — Cloud Infrastructure Market Share](https://www.statista.com/chart/18819/worldwide-market-share-of-leading-cloud-infrastructure-service-providers/)
- [CNBC — Alphabet Q4 2025 Earnings](https://www.cnbc.com/2026/02/04/alphabet-googl-q4-2025-earnings.html)
- [Amazon Q4 2025 Earnings Release](https://www.aboutamazon.com/news/company-news/amazon-earnings-q4-2025-report)
- [Microsoft FY25 Q4 Investor Relations](https://www.microsoft.com/en-us/investor/earnings/fy-2025-q4/press-release-webcast)
- [Microsoft Azure FY2025 Revenue — Data Center Dynamics](https://www.datacenterdynamics.com/en/news/microsoft-azure-brought-in-75bn-for-fy2025-company-deployed-2gw-data-center-capacity/)
- [Futurum Group — Microsoft Q4 FY 2025 Earnings](https://futurumgroup.com/insights/microsoft-q4-fy-2025-earnings-beat-driven-by-39-azure-growth/)
- [Futurum Group — Amazon Q4 FY 2025 Earnings](https://futurumgroup.com/insights/amazon-q4-fy-2025-revenue-beat-aws-24-amid-200b-capex-plan/)
- [Futurum Group — Alphabet Q4 FY 2025 Earnings](https://futurumgroup.com/insights/alphabet-q4-fy-2025-highlights-cloud-acceleration-and-enterprise-ai-momentum/)
- [Veritis — AWS vs Azure vs GCP Cloud Cost Comparison 2025](https://www.veritis.com/blog/aws-vs-azure-vs-gcp-cloud-cost-comparison/)
