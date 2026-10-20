// Unified Base Market Data Provider Interface

export class BaseMarketDataProvider {
  constructor(name) {
    this.name = name;
  }

  /**
   * Get current or latest available quote for an instrument
   * @param {string} symbol - NSE/BSE symbol (e.g. 'RELIANCE')
   * @returns {Promise<Object>} Normalized quote
   */
  async getQuote(symbol) {
    throw new Error(`getQuote not implemented by ${this.name}`);
  }

  /**
   * Get historical price series
   * @param {string} symbol - Instrument symbol
   * @param {string} interval - '1d', '1wk', '1mo'
   * @param {Date} from - Start date
   * @param {Date} to - End date
   * @returns {Promise<Array<Object>>} Normalized candle array
   */
  async getHistoricalPrices(symbol, interval = '1d', from = null, to = null) {
    throw new Error(`getHistoricalPrices not implemented by ${this.name}`);
  }

  /**
   * Get market status for exchange
   * @param {string} exchange - 'NSE' or 'BSE'
   * @returns {Promise<Object>}
   */
  async getMarketStatus(exchange = 'NSE') {
    throw new Error(`getMarketStatus not implemented by ${this.name}`);
  }

  /**
   * Get benchmark index prices (e.g. NIFTY 50)
   * @param {string} benchmark - '^NSEI' or '^BSESN'
   * @returns {Promise<Array<Object>>}
   */
  async getBenchmarkPrices(benchmark = '^NSEI') {
    throw new Error(`getBenchmarkPrices not implemented by ${this.name}`);
  }
}
