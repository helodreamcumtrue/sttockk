import { BaseMarketDataProvider } from './base-provider.js';
import { query, queryOne } from '../db/index.js';

export class LocalMarketDataProvider extends BaseMarketDataProvider {
  constructor() {
    super('MarketPulse Local Cache & Demo Engine');
  }

  async getQuote(symbol) {
    const row = await queryOne('SELECT * FROM market_quotes WHERE symbol = ?', [symbol.toUpperCase()]);
    if (!row) {
      return {
        symbol: symbol.toUpperCase(),
        exchange: 'NSE',
        last_price: 1000.00,
        change: 0.00,
        change_percent: 0.00,
        open: 1000.00,
        high: 1000.00,
        low: 1000.00,
        previous_close: 1000.00,
        volume: 0,
        market_status: 'CLOSED',
        data_status: 'LAST_AVAILABLE',
        exchange_timestamp: new Date().toISOString(),
        retrieved_at: new Date().toISOString(),
        provider: this.name,
        disclaimer: 'Cached historical fallback. Real-time quote feed currently unavailable.'
      };
    }

    return {
      symbol: row.symbol,
      exchange: row.exchange,
      last_price: Number(row.last_price),
      change: Number(row.change),
      change_percent: Number(row.change_percent),
      open: Number(row.open ?? row.last_price),
      high: Number(row.high ?? row.last_price),
      low: Number(row.low ?? row.last_price),
      previous_close: Number(row.previous_close ?? row.last_price),
      volume: Number(row.volume ?? 0),
      market_status: row.market_status,
      data_status: row.data_status || 'SYNTHETIC_DEMO',
      exchange_timestamp: row.exchange_timestamp,
      retrieved_at: row.retrieved_at,
      provider: row.provider || this.name,
      disclaimer: row.data_status === 'SYNTHETIC_DEMO'
        ? 'DEMO DATA: Synthetic benchmark demonstration only.'
        : 'Cached snapshot from database.'
    };
  }

  async getHistoricalPrices(symbol, range = '1mo') {
    const rows = await query(
      'SELECT date, open, high, low, close, volume, benchmark_close FROM historical_market_prices WHERE symbol = ? ORDER BY date ASC',
      [symbol.toUpperCase()]
    );

    return rows.map(r => ({
      date: r.date,
      open: Number(r.open),
      high: Number(r.high),
      low: Number(r.low),
      close: Number(r.close),
      volume: Number(r.volume),
      benchmark_close: r.benchmark_close ? Number(r.benchmark_close) : null
    }));
  }

  async getMarketStatus() {
    const now = new Date();
    const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
    const day = istTime.getUTCDay();
    const hours = istTime.getUTCHours();
    const minutes = istTime.getUTCMinutes();
    const totalMinutes = hours * 60 + minutes;

    const isOpen = (day >= 1 && day <= 5) && (totalMinutes >= (9 * 60 + 15) && totalMinutes <= (15 * 60 + 30));
    return {
      exchange: 'NSE',
      status: isOpen ? 'OPEN' : 'CLOSED',
      timezone: 'Asia/Kolkata (IST)',
      current_ist: istTime.toISOString().replace('T', ' ').slice(0, 19),
      market_hours: '09:15 - 15:30 IST (Mon-Fri)',
      next_session: isOpen ? 'Live trading session' : 'Session closed'
    };
  }

  async getBenchmarkPrices() {
    const rows = await query(
      'SELECT date, benchmark_close as close FROM historical_market_prices WHERE symbol = ? ORDER BY date ASC',
      ['RELIANCE']
    );
    return rows.map(r => ({
      date: r.date,
      close: Number(r.close ?? 24500)
    }));
  }
}
