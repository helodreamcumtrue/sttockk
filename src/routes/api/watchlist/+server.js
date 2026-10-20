import { json } from '@sveltejs/kit';
import { query, execute } from '#lib/server/db/index.js';

export async function GET() {
  const items = await query(`
    SELECT wi.*, c.name as company_name, c.exchange, c.sub_industry,
           q.last_price, q.change, q.change_percent, q.volume, q.data_status
    FROM watchlist_items wi
    JOIN companies c ON wi.symbol = c.symbol
    LEFT JOIN market_quotes q ON c.symbol = q.symbol
    WHERE wi.watchlist_id = 'wl_default'
    ORDER BY wi.added_at DESC
  `);

  return json({
    items: items.map(i => ({
      id: i.id,
      symbol: i.symbol,
      company_name: i.company_name,
      exchange: i.exchange,
      sub_industry: i.sub_industry,
      alert_threshold: i.alert_threshold,
      notes: i.notes,
      added_at: i.added_at,
      last_price: i.last_price ? Number(i.last_price) : null,
      change: i.change ? Number(i.change) : null,
      change_percent: i.change_percent ? Number(i.change_percent) : null,
      data_status: i.data_status || 'LAST_AVAILABLE',
      volume: i.volume ? Number(i.volume) : 0
    }))
  });
}

export async function POST({ request }) {
  try {
    const body = await request.json();
    const symbol = (body.symbol || '').trim().toUpperCase();
    const threshold = Number(body.alert_threshold) || 2.0;
    const notes = body.notes || 'User tracked position';

    if (!symbol) {
      return json({ error: 'Symbol is required' }, { status: 400 });
    }

    // Verify company exists
    const comp = await query('SELECT * FROM companies WHERE symbol = ?', [symbol]);
    if (comp.length === 0) {
      return json({ error: `Symbol ${symbol} not found in company registry` }, { status: 404 });
    }

    const id = `wli_${symbol}_${Date.now()}`;
    await execute(
      `INSERT OR REPLACE INTO watchlist_items (id, watchlist_id, symbol, alert_threshold, notes)
       VALUES (?, 'wl_default', ?, ?, ?)`,
      [id, symbol, threshold, notes]
    );

    return json({ success: true, symbol, message: `Added ${symbol} to watchlist` });
  } catch (err) {
    return json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE({ url }) {
  const symbol = url.searchParams.get('symbol')?.toUpperCase();
  if (!symbol) {
    return json({ error: 'Symbol parameter required' }, { status: 400 });
  }

  await execute(
    `DELETE FROM watchlist_items WHERE watchlist_id = 'wl_default' AND symbol = ?`,
    [symbol]
  );

  return json({ success: true, message: `Removed ${symbol} from watchlist` });
}
