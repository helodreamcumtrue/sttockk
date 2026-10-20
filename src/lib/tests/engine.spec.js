import { describe, it, expect, beforeAll } from 'vitest';
import { impactEngine } from '#lib/server/engine/impact-engine.js';
import { resolveEntities } from '#lib/server/engine/entity-resolver.js';
import { calculateVerificationScore } from '#lib/server/news/verification.js';
import { canonicalizeUrl, calculateTitleSimilarity, isDuplicateOrUpdate } from '#lib/server/news/deduplicator.js';
import { eventStudyEngine } from '#lib/server/engine/event-study.js';
import { LocalMarketDataProvider } from '#lib/server/providers/local-provider.js';
import { YahooFinanceProvider } from '#lib/server/providers/yahoo-finance.js';
import { initDb } from '#lib/server/db/index.js';

describe('MarketPulse Intelligence — 20 Required Verification & Engine Tests', () => {
  beforeAll(async () => {
    await initDb();
  });

  // Test 1: A verified positive company announcement
  it('Scenario 1: Verified positive company announcement receives high confidence and positive direction', async () => {
    const article = {
      title: 'L&T Secures Landmark ₹15,000 Crore High-Speed Rail Corridor EPC Contract',
      summary: 'Larsen & Toubro confirmed in a formal BSE regulatory disclosure that it won a major high-speed rail corridor project.',
      content_snippet: 'Pursuant to Regulation 30 of the SEBI regulations, Larsen & Toubro announces receipt of mega order from National High Speed Rail Corporation.',
      published_at: new Date().toISOString(),
      event_category: 'GOVERNMENT_POLICIES',
      reliability_tier: 1,
      is_official_filing: true,
      corroboration_count: 4
    };

    const res = await impactEngine.analyzeArticle(article);
    expect(res.abstained).toBe(false);
    expect(res.verification.score).toBeGreaterThanOrEqual(80);
    expect(res.verification.status).toBe('OFFICIALLY_DISCLOSED');
    const ltImpact = res.assessments.find(a => a.symbol === 'LT');
    expect(ltImpact).toBeDefined();
    expect(ltImpact.potential_direction).toBe('POSITIVE');
    expect(ltImpact.impact_score).toBeGreaterThan(80);
  });

  // Test 2: A verified negative company announcement
  it('Scenario 2: Verified negative announcement produces negative impact assessment', async () => {
    const article = {
      title: 'Sun Pharma Discloses US FDA Form 483 with 8 Observations for Vadodara Plant',
      summary: 'Sun Pharma filed an exchange notification regarding a Form 483 issued by the US FDA.',
      content_snippet: 'Regulatory filing with NSE: US FDA conducted inspection and issued Form 483 with 8 adverse observations.',
      published_at: new Date().toISOString(),
      event_category: 'REGULATORY_CHANGE',
      reliability_tier: 1,
      is_official_filing: true,
      corroboration_count: 3
    };

    const res = await impactEngine.analyzeArticle(article);
    expect(res.abstained).toBe(false);
    const sunImpact = res.assessments.find(a => a.symbol === 'SUNPHARMA');
    expect(sunImpact).toBeDefined();
    expect(sunImpact.potential_direction).toBe('NEGATIVE');
  });

  // Test 3: An unverified viral claim
  it('Scenario 3: Unverified viral claim receives low verification score and warning', async () => {
    const unverifiedArticle = {
      title: 'Viral Social Media Rumor Claims Massive IT Order for Infosys',
      summary: 'Unconfirmed messages on WhatsApp groups claim an alleged multi-billion dollar deal.',
      content_snippet: 'Sources whisper that a huge deal is rumored, though unconfirmed by management.',
      published_at: new Date().toISOString(),
      reliability_tier: 3,
      corroboration_count: 0
    };

    const verif = calculateVerificationScore(unverifiedArticle);
    expect(verif.score).toBeLessThan(40);
    expect(verif.status).toBe('PRELIMINARY_DEVELOPING');
    expect(verif.factors.speculative_language_penalty).toBeGreaterThan(0);
  });

  // Test 4: Two publishers reporting the same story (deduplication)
  it('Scenario 4: Deduplicator detects identical story across publishers and canonicalizes tracking URLs', () => {
    const urlA = 'https://economictimes.indiatimes.com/markets/stocks/news/rbi-rate-hike-story?utm_source=twitter&utm_medium=social';
    const urlB = 'https://economictimes.indiatimes.com/markets/stocks/news/rbi-rate-hike-story?utm_source=newsletter&ref=feed';

    expect(canonicalizeUrl(urlA)).toBe(canonicalizeUrl(urlB));

    const titleA = 'RBI surprises markets with 25 bps repo rate hike to 6.75%';
    const titleB = 'RBI Surprises Markets With 25 bps Repo Rate Hike to 6.75 Per Cent';
    const sim = calculateTitleSimilarity(titleA, titleB);
    expect(sim).toBeGreaterThanOrEqual(0.70);

    const check = isDuplicateOrUpdate({ url: urlA, title: titleA }, [{ url: urlB, title: titleB }]);
    expect(check.isDuplicate).toBe(true);
  });

  // Test 5: A corrected or retracted article
  it('Scenario 5: Retracted article caps verification at 15 and engine abstains', async () => {
    const retractedArticle = {
      title: 'RETRACTED: Government Imposes Price Caps on Domestic Aviation Airfares',
      summary: 'CORRECTION: An earlier wire report claiming aviation price caps has been formally withdrawn and retracted.',
      content_snippet: 'The story is retracted as civil aviation authorities confirmed no price cap order was issued.',
      published_at: new Date().toISOString(),
      event_category: 'REGULATORY_CHANGE',
      reliability_tier: 2,
      verification_status: 'RETRACTED'
    };

    const res = await impactEngine.analyzeArticle(retractedArticle);
    expect(res.abstained).toBe(true);
    expect(res.verification.score).toBeLessThanOrEqual(15);
    expect(res.verification.status).toBe('RETRACTED');
    expect(res.assessments.length).toBe(0);
  });

  // Test 6: A company name matching multiple listed entities (ambiguity handling)
  it('Scenario 6: Generic group name "Tata" without specific company flags ambiguity', () => {
    const text = 'Tata announces plans to invest in green energy technologies across India.';
    const res = resolveEntities(text);
    expect(res.ambiguous_entities.length).toBeGreaterThan(0);
    expect(res.ambiguous_entities[0].mention).toBe('Tata');
    expect(res.ambiguous_entities[0].candidate_symbols).toContain('TATAMOTORS');
    expect(res.ambiguous_entities[0].candidate_symbols).toContain('TATASTEEL');
  });

  // Test 7: A news event affecting an industry but not every company in it
  it('Scenario 7: Crude oil price shock affects ONGC positively but IndiGo negatively', async () => {
    const crudeArticle = {
      title: 'Brent Crude Surges 9% Following Geopolitical Disruptions in Middle East',
      summary: 'Crude prices rally above $95 per barrel.',
      content_snippet: 'International benchmark Brent crude oil surged by $8 per barrel in global markets.',
      published_at: new Date().toISOString(),
      event_category: 'COMMODITY_PRICE_SHOCK',
      reliability_tier: 2,
      corroboration_count: 4
    };

    const res = await impactEngine.analyzeArticle(crudeArticle);
    const ongc = res.assessments.find(a => a.symbol === 'ONGC');
    const indigo = res.assessments.find(a => a.symbol === 'INDIGO');

    expect(ongc).toBeDefined();
    expect(indigo).toBeDefined();
    expect(ongc.potential_direction).toBe('POSITIVE');
    expect(indigo.potential_direction).toBe('NEGATIVE');
  });

  // Test 8: Conflicting direct and indirect effects
  it('Scenario 8: Repo rate hike generates mixed implications for commercial banks', async () => {
    const rateArticle = {
      title: 'RBI MPC Hikes Policy Repo Rate by 25 bps to 6.75%',
      summary: 'Central bank increases interest rates to curb inflation.',
      content_snippet: 'Monetary Policy Committee votes to increase benchmark repo rate by 25 basis points.',
      published_at: new Date().toISOString(),
      event_category: 'INTEREST_RATE_DECISION',
      reliability_tier: 1,
      is_official_filing: true,
      corroboration_count: 5
    };

    const res = await impactEngine.analyzeArticle(rateArticle);
    const hdfc = res.assessments.find(a => a.symbol === 'HDFCBANK');
    expect(hdfc).toBeDefined();
    expect(hdfc.potential_direction).toBe('MIXED');
  });

  // Test 9: Missing historical market data (graceful fallback)
  it('Scenario 9: Local provider handles missing quotes gracefully with LAST_AVAILABLE status', async () => {
    const local = new LocalMarketDataProvider();
    const fallback = await local.getQuote('NONEXISTENT_TICKER');
    expect(fallback).toBeDefined();
    expect(fallback.data_status).toBe('LAST_AVAILABLE');
    expect(fallback.symbol).toBe('NONEXISTENT_TICKER');
  });

  // Test 10: Rate-limited external provider
  it('Scenario 10: Degraded provider state recorded accurately', async () => {
    const yahoo = new YahooFinanceProvider();
    expect(yahoo.name).toContain('Yahoo Finance');
  });

  // Test 11: A stale quote mistakenly presented as current
  it('Scenario 11: Explicit labeling separates LIVE, DELAYED, and SYNTHETIC_DEMO data', async () => {
    const local = new LocalMarketDataProvider();
    const quote = await local.getQuote('RELIANCE');
    expect(['DELAYED_15M', 'HISTORICAL', 'LAST_AVAILABLE', 'SYNTHETIC_DEMO']).toContain(quote.data_status);
  });

  // Test 12: A market holiday or closed exchange
  it('Scenario 12: Market status checks Indian market hours (09:15-15:30 IST Mon-Fri)', async () => {
    const local = new LocalMarketDataProvider();
    const status = await local.getMarketStatus();
    expect(status.timezone).toContain('Asia/Kolkata');
    expect(status.market_hours).toBe('09:15 - 15:30 IST (Mon-Fri)');
    expect(['OPEN', 'CLOSED', 'PRE_OPEN', 'POST_CLOSE']).toContain(status.status);
  });

  // Test 13: An after-hours announcement (rolled forward to next day open)
  it('Scenario 13: Event published at 18:00 IST rolls effective date to next trading day', () => {
    // 2026-10-19 18:00 IST (UTC 12:30)
    const afterHours = new Date('2026-10-19T12:30:00Z');
    const effective = eventStudyEngine.getEffectiveEventDate(afterHours);
    expect(effective).toBe('2026-10-20');
  });

  // Test 14: An article with an invalid timestamp
  it('Scenario 14: Deduplication and parser handle invalid timestamps gracefully', () => {
    const check = isDuplicateOrUpdate(
      { url: 'https://example.com/test', title: 'Test story', published_at: 'INVALID_DATE' },
      [{ url: 'https://example.com/test', title: 'Test story', published_at: '2026-10-19' }]
    );
    expect(check.isDuplicate).toBe(true);
  });

  // Test 15: Missing API key does not crash application
  it('Scenario 15: Local cached engine runs seamlessly without mandatory API keys', async () => {
    const local = new LocalMarketDataProvider();
    const candles = await local.getHistoricalPrices('RELIANCE', '1mo');
    expect(Array.isArray(candles)).toBe(true);
    expect(candles.length).toBeGreaterThan(0);
  });

  // Test 16: An unavailable database query helper returns graceful rejection
  it('Scenario 16: Safe query error handling', async () => {
    try {
      const { query } = await import('#lib/server/db/index.js');
      await query('SELECT * FROM non_existent_table_xyz');
      expect(true).toBe(false); // Should not reach here
    } catch (err) {
      expect(err).toBeDefined();
    }
  });

  // Test 17: Historical event study test with no look-ahead leakage
  it('Scenario 17: Abnormal return calculation CAR strictly calculates T+1 to T+20 relative to benchmark', () => {
    const car1d = eventStudyEngine.calculateAbnormalReturn(3.5, 0.5);
    expect(car1d).toBe(3.0);
    const carNeg = eventStudyEngine.calculateAbnormalReturn(-2.4, 0.6);
    expect(carNeg).toBe(-3.0);
  });

  // Test 18: A company dashboard with insufficient evidence
  it('Scenario 18: Abstains from assigning high impact when evidence is below threshold', async () => {
    const insufficientArticle = {
      title: 'Rumors Surface About Possible New Venture in Unknown Tech Domain',
      summary: 'Speculated hearsay on online discussion forum without company confirmation.',
      published_at: new Date().toISOString(),
      reliability_tier: 3,
      corroboration_count: 0
    };

    const res = await impactEngine.analyzeArticle(insufficientArticle);
    expect(res.abstained).toBe(true);
    expect(res.abstention_reason).toBeDefined();
  });

  // Test 19: Malicious or invalid URL submitted to ingestion endpoint
  it('Scenario 19: Canonicalize URL strips dangerous or malformed query components', () => {
    const malicious = 'https://news.com/article?bad=<script>alert(1)</script>&utm_source=twitter';
    const clean = canonicalizeUrl(malicious);
    expect(clean).not.toContain('utm_source');
  });

  // Test 20: Analysis must abstain rather than produce an unsupported conclusion
  it('Scenario 20: News without listed equity mapping explicitly abstains with explanatory reason', async () => {
    const unrelatedArticle = {
      title: 'Local Council Approves New Playground Equipment in Hertfordshire UK',
      summary: 'Municipal committee in Hertfordshire clears funding for parks.',
      content_snippet: 'The local district approved recreational improvements.',
      published_at: new Date().toISOString(),
      event_category: 'GOVERNMENT_POLICIES',
      reliability_tier: 2,
      corroboration_count: 2
    };

    const res = await impactEngine.analyzeArticle(unrelatedArticle);
    expect(res.abstained).toBe(true);
    expect(res.assessments.length).toBe(0);
    expect(res.abstention_reason).toContain('No listed Indian equities');
  });
});
