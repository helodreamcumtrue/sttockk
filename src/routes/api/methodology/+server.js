import { json } from '@sveltejs/kit';

export async function GET() {
  return json({
    title: 'MarketPulse Intelligence — Quantitative Methodology & Compliance Disclosure',
    version: '1.0.0-deterministic',
    last_updated: '2026-10-19',
    pillars: [
      {
        id: 'news_ingestion',
        title: '1. News Ingestion & Tiered Source Hierarchy',
        summary: 'All financial news events undergo strict domain validation, deduplication, and source tier classification prior to impact analysis.',
        details: [
          'Tier 1 (Official & Regulatory): NSE/BSE corporate filings, SEBI circulars, RBI monetary policy statements, and Press Information Bureau (PIB).',
          'Tier 2 (Accredited Financial Publishers): Strict allowlist including PTI Economic Service, Reuters India, Mint, and Business Standard.',
          'Tier 3 (Discovery Feeds): Open indexes such as GDELT. Used exclusively for story discovery, never treated as self-authenticating proof.',
          'Deduplication: Canonical URL normalization and token Jaccard similarity to prevent duplicate coverage and distinguish follow-up developments.'
        ]
      },
      {
        id: 'verification_scoring',
        title: '2. Explainable Verification Score (0-100)',
        summary: 'A deterministic, evidence-based quality score measuring source credibility, primary disclosures, and corroboration.',
        details: [
          'Publisher Tier Base: Tier 1 (+45), Tier 2 (+25), Tier 3 (-20).',
          'Primary Citation: Explicit citation of exchange filing, SEBI order, or RBI circular (+15).',
          'Independent Corroboration: +15 if corroborated across 3+ distinct outlets, +8 for 2 outlets, -10 if uncorroborated single source.',
          'Speculative Language Penalty: -15 to -35 for unverified rumor terminology ("hearsay", "sources whisper", "purported").',
          'Retractions & Corrections: Immediate score cap at 15 for retracted articles; status flagged as RETRACTED.'
        ]
      },
      {
        id: 'entity_resolution',
        title: '3. Entity Resolution & Knowledge Graph',
        summary: 'Explicit entities are resolved to verified NSE/BSE tickers, followed by 1st- and 2nd-order graph traversal for supply chain and competitor exposures.',
        details: [
          'Disambiguation: Strict matching on alias dictionaries. Generic group mentions without specific company disambiguation (e.g. "Tata" alone) are flagged as ambiguous.',
          'Relationship Mapping: Documented supply contracts (e.g. ONGC -> BPCL crude, JSW Steel -> L&T rebars, BPCL -> IndiGo ATF) with verified confidence scores and disclosure sources.',
          'Sensitivity Attributes: Quantitative profiles including raw material dependencies, import/export exposure %, interest-rate sensitivity, and currency sensitivity.'
        ]
      },
      {
        id: 'impact_scoring',
        title: '4. Deterministic Impact Scoring & Abstention',
        summary: 'A transparent formula evaluating the potential economic magnitude of an event on listed equities.',
        details: [
          'Weighted Formula: Verification Quality (25%) + Directness of Exposure (25%) + Causal Relevance (20%) + Economic Magnitude (15%) + Novelty/Recency (15%).',
          'Strict Abstention Rule: If verification score < 25 or if an article is retracted, the engine explicitly abstains from directional forecasting.',
          'Separation of Measures: Evidence quality is kept strictly independent from potential price magnitude and observed market movements.'
        ]
      },
      {
        id: 'historical_event_study',
        title: '5. Historical Event Studies & Benchmark CAR',
        summary: 'Out-of-sample event study analysis computing Cumulative Abnormal Returns (CAR) against the NIFTY 50 benchmark index.',
        details: [
          'Windows Supported: 1D (T+1), 3D (T+3), 5D (T+5), and 20D (T+20).',
          'Look-ahead Bias Prevention: Announcements published after market close (15:30 IST) are strictly indexed to T+1 market open.',
          'Cumulative Abnormal Return: CAR = Stock Cumulative Return - Benchmark Cumulative Return over identical trading days.'
        ]
      },
      {
        id: 'regulatory_compliance',
        title: '6. Legal, SEBI Compliance & Risk Disclaimers',
        summary: 'MarketPulse Intelligence is a financial data research terminal, not a registered investment advisor.',
        details: [
          'No Investment Advice: The platform provides informational and analytical research tools. It does not issue buy, sell, or hold recommendations.',
          'SEBI Compliance: The platform is not registered as a SEBI Research Analyst under SEBI (Research Analysts) Regulations, 2014. Users must consult licensed advisors.',
          'Data Latency: Market quotes are delayed by 15 minutes as per exchange dissemination policies unless explicitly indicated.',
          'Demo / Synthetic Mode: Clearly demarcated synthetic scenarios are provided for educational and evaluation purposes and are never mixed with real-world quotes.'
        ]
      }
    ]
  });
}
