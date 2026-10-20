import { json } from '@sveltejs/kit';
import { marketService } from '#lib/server/providers/market-service.js';

export async function GET({ url }) {
  const symbolsParam = url.searchParams.get('symbols') || url.searchParams.get('symbol');
  const isDemo = url.searchParams.get('mode') === 'demo' || process.env.FORCE_DEMO_MODE === 'true';

  if (!symbolsParam) {
    return json({ error: 'Missing symbol parameter' }, { status: 400 });
  }

  const symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
  const quotes = [];

  for (const sym of symbols) {
    try {
      const q = await marketService.getQuote(sym, isDemo);
      quotes.push(q);
    } catch (err) {
      quotes.push({
        symbol: sym,
        last_price: null,
        data_status: 'UNAVAILABLE',
        error: err.message
      });
    }
  }

  return json({
    quotes,
    count: quotes.length,
    timestamp: new Date().toISOString()
  });
}
