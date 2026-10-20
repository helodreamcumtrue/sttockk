import { json } from '@sveltejs/kit';
import { marketService } from '#lib/server/providers/market-service.js';

export async function GET({ params, url }) {
  const symbol = params.symbol.toUpperCase();
  const range = url.searchParams.get('range') || '1mo';
  const isDemo = url.searchParams.get('mode') === 'demo' || process.env.FORCE_DEMO_MODE === 'true';

  try {
    const candles = await marketService.getHistoricalPrices(symbol, range, isDemo);
    return json({
      symbol,
      range,
      candles,
      count: candles.length,
      data_status: isDemo ? 'SYNTHETIC_DEMO' : 'HISTORICAL'
    });
  } catch (err) {
    return json({ error: err.message }, { status: 500 });
  }
}
