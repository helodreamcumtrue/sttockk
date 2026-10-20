import { BaseMarketDataProvider } from './base-provider.js';

export class YahooFinanceProvider extends BaseMarketDataProvider {
  constructor() {
    super('Yahoo Finance (Free Public Feed)');
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
  }

  formatSymbol(symbol, exchange = 'NSE') {
    if (symbol.startsWith('^')) return symbol;
    if (symbol.includes('.')) return symbol;
    return exchange.toUpperCase() === 'BSE' ? `${symbol}.BO` : `${symbol}.NS`;
  }

  async fetchChart(symbol, range = '1mo', interval = '1d') {
    const formatted = this.formatSymbol(symbol);
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(formatted)}?range=${range}&interval=${interval}&includePrePost=false`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`Yahoo Finance HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      const result = data?.chart?.result?.[0];
      if (!result) {
        throw new Error(`No chart data returned for ${symbol}`);
      }
      return result;
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  }

  async getQuote(symbol) {
    const chart = await this.fetchChart(symbol, '5d', '1d');
    const meta = chart.meta || {};
    const lastPrice = meta.regularMarketPrice ?? meta.chartPreviousClose ?? 0;
    const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? lastPrice;
    const change = Number((lastPrice - prevClose).toFixed(2));
    const changePercent = prevClose ? Number(((change / prevClose) * 100).toFixed(2)) : 0;

    return {
      symbol: symbol.toUpperCase(),
      exchange: meta.exchangeName || 'NSE',
      last_price: lastPrice,
      change,
      change_percent: changePercent,
      open: meta.regularMarketDayHigh ? Number(meta.regularMarketPrice) : lastPrice,
      high: meta.regularMarketDayHigh ?? lastPrice,
      low: meta.regularMarketDayLow ?? lastPrice,
      previous_close: prevClose,
      volume: meta.regularMarketVolume ?? 0,
      currency: meta.currency || 'INR',
      market_status: meta.tradingPeriods ? 'REGULAR' : 'CLOSED',
      data_status: 'DELAYED_15M', // NSE free feed is 15-min delayed by exchange policy
      exchange_timestamp: meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : new Date().toISOString(),
      retrieved_at: new Date().toISOString(),
      provider: this.name,
      disclaimer: 'Data delayed 15 minutes as per exchange dissemination rules. Not for algorithmic execution.'
    };
  }

  async getHistoricalPrices(symbol, range = '3mo', interval = '1d') {
    const chart = await this.fetchChart(symbol, range, interval);
    const timestamps = chart.timestamp || [];
    const quotes = chart.indicators?.quote?.[0] || {};
    const opens = quotes.open || [];
    const highs = quotes.high || [];
    const lows = quotes.low || [];
    const closes = quotes.close || [];
    const volumes = quotes.volume || [];

    const candles = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (closes[i] !== null && closes[i] !== undefined) {
        candles.push({
          date: new Date(timestamps[i] * 1000).toISOString().split('T')[0],
          timestamp: timestamps[i],
          open: Number((opens[i] ?? closes[i]).toFixed(2)),
          high: Number((highs[i] ?? closes[i]).toFixed(2)),
          low: Number((lows[i] ?? closes[i]).toFixed(2)),
          close: Number(closes[i].toFixed(2)),
          volume: volumes[i] ?? 0
        });
      }
    }
    return candles;
  }

  async getMarketStatus() {
    const now = new Date();
    // India Standard Time (UTC+5:30)
    const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
    const day = istTime.getUTCDay(); // 0 is Sunday, 6 is Saturday
    const hours = istTime.getUTCHours();
    const minutes = istTime.getUTCMinutes();
    const totalMinutes = hours * 60 + minutes;

    const isOpen = (day >= 1 && day <= 5) && (totalMinutes >= (9 * 60 + 15) && totalMinutes <= (15 * 60 + 30));
    const isPreOpen = (day >= 1 && day <= 5) && (totalMinutes >= 9 * 60 && totalMinutes < (9 * 60 + 15));

    let status = 'CLOSED';
    if (isOpen) status = 'OPEN';
    else if (isPreOpen) status = 'PRE_OPEN';
    else if (day >= 1 && day <= 5 && totalMinutes > (15 * 60 + 30) && totalMinutes < (16 * 60)) status = 'POST_CLOSE';

    return {
      exchange: 'NSE',
      status,
      timezone: 'Asia/Kolkata (IST)',
      current_ist: istTime.toISOString().replace('T', ' ').slice(0, 19),
      market_hours: '09:15 - 15:30 IST (Mon-Fri)',
      next_session: isOpen ? 'Session in progress' : 'Next session: 09:15 IST'
    };
  }

  async getBenchmarkPrices(range = '1mo') {
    return await this.getHistoricalPrices('^NSEI', range, '1d');
  }
}
