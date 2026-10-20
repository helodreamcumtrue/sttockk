import { YahooFinanceProvider } from './yahoo-finance.js';
import { LocalMarketDataProvider } from './local-provider.js';
import { execute, query } from '../db/index.js';

class MarketDataService {
  constructor() {
    this.yahooProvider = new YahooFinanceProvider();
    this.localProvider = new LocalMarketDataProvider();
    this.cache = new Map(); // In-memory short-lived cache (30s)
    this.CACHE_TTL_MS = 30000;
  }

  isDemoMode(urlParams = null, cookies = null) {
    if (process.env.FORCE_DEMO_MODE === 'true') return true;
    if (urlParams && urlParams.get('mode') === 'demo') return true;
    if (cookies && cookies.demo_mode === 'true') return true;
    return false;
  }

  async getQuote(symbol, isDemo = false) {
    const sym = symbol.toUpperCase();
    const cacheKey = `${sym}_${isDemo ? 'demo' : 'live'}`;
    const cached = this.cache.get(cacheKey);

    if (cached && (Date.now() - cached.timestamp < this.CACHE_TTL_MS)) {
      return cached.data;
    }

    if (isDemo) {
      const demoQuote = await this.localProvider.getQuote(sym);
      demoQuote.data_status = 'SYNTHETIC_DEMO';
      this.cache.set(cacheKey, { timestamp: Date.now(), data: demoQuote });
      return demoQuote;
    }

    // Try Yahoo Finance live/delayed feed first
    const startTime = Date.now();
    try {
      const quote = await this.yahooProvider.getQuote(sym);
      const latency = Date.now() - startTime;
      
      // Update provider health
      await execute(
        `INSERT OR REPLACE INTO provider_health (provider_name, status, last_check, latency_ms, quota_remaining, notes)
         VALUES (?, 'OPERATIONAL', ?, ?, 'Free Unmetered', 'Active market quote retrieval')`,
        ['Yahoo Finance (NSE)', new Date().toISOString(), latency]
      );

      // Persist quote to database cache
      await execute(
        `INSERT OR REPLACE INTO market_quotes (
          symbol, exchange, last_price, change, change_percent, open, high, low,
          previous_close, volume, market_status, data_status, exchange_timestamp, retrieved_at, provider
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          quote.symbol, quote.exchange, quote.last_price, quote.change, quote.change_percent,
          quote.open, quote.high, quote.low, quote.previous_close, quote.volume,
          quote.market_status, quote.data_status, quote.exchange_timestamp, quote.retrieved_at, quote.provider
        ]
      );

      this.cache.set(cacheKey, { timestamp: Date.now(), data: quote });
      return quote;
    } catch (err) {
      console.warn(`[MarketDataService] Yahoo Finance failed for ${sym} (${err.message}). Falling back to local cache.`);
      
      // Update provider health to DEGRADED
      await execute(
        `INSERT OR REPLACE INTO provider_health (provider_name, status, last_check, latency_ms, notes)
         VALUES (?, 'DEGRADED', ?, ?, ?)`,
        ['Yahoo Finance (NSE)', new Date().toISOString(), Date.now() - startTime, `Fallback active: ${err.message}`]
      );

      const fallbackQuote = await this.localProvider.getQuote(sym);
      this.cache.set(cacheKey, { timestamp: Date.now(), data: fallbackQuote });
      return fallbackQuote;
    }
  }

  async getHistoricalPrices(symbol, range = '3mo', isDemo = false) {
    if (isDemo) {
      return await this.localProvider.getHistoricalPrices(symbol, range);
    }

    try {
      const candles = await this.yahooProvider.getHistoricalPrices(symbol, range);
      if (candles && candles.length > 0) return candles;
    } catch (err) {
      console.warn(`[MarketDataService] Yahoo historical failed for ${symbol}. Using local history.`);
    }

    return await this.localProvider.getHistoricalPrices(symbol, range);
  }

  async getMarketStatus() {
    return await this.yahooProvider.getMarketStatus();
  }

  async getOverviewIndices(isDemo = false) {
    const nifty = await this.getQuote('^NSEI', isDemo).catch(() => ({
      symbol: 'NIFTY 50', last_price: 24850.30, change: 112.40, change_percent: 0.45, data_status: 'SYNTHETIC_DEMO'
    }));
    const sensex = await this.getQuote('^BSESN', isDemo).catch(() => ({
      symbol: 'SENSEX', last_price: 81450.80, change: 345.10, change_percent: 0.43, data_status: 'SYNTHETIC_DEMO'
    }));
    
    // Macro indicators
    const macroIndicators = [
      { name: 'NIFTY 50', value: nifty.last_price || 24850.30, change: nifty.change || 112.40, change_pct: nifty.change_percent || 0.45, status: nifty.data_status },
      { name: 'BSE SENSEX', value: sensex.last_price || 81450.80, change: sensex.change || 345.10, change_pct: sensex.change_percent || 0.43, status: sensex.data_status },
      { name: 'USD / INR', value: 84.12, change: 0.08, change_pct: 0.10, status: isDemo ? 'SYNTHETIC_DEMO' : 'INDICATIVE' },
      { name: 'Brent Crude ($/bbl)', value: 88.40, change: 2.15, change_pct: 2.49, status: isDemo ? 'SYNTHETIC_DEMO' : 'INDICATIVE' },
      { name: 'India 10Y G-Sec Yield', value: 6.84, change: 0.03, change_pct: 0.44, status: isDemo ? 'SYNTHETIC_DEMO' : 'INDICATIVE' }
    ];

    return macroIndicators;
  }
}

export const marketService = new MarketDataService();
