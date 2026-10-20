import { json } from '@sveltejs/kit';
import { query } from '#lib/server/db/index.js';

export async function GET({ url }) {
  const q = url.searchParams.get('q') || '';
  const sector = url.searchParams.get('sector') || '';
  const company = url.searchParams.get('company') || '';
  const category = url.searchParams.get('category') || '';
  const verification = url.searchParams.get('verification') || '';
  const direction = url.searchParams.get('direction') || '';
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));
  const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0'));

  let sql = `
    SELECT DISTINCT n.*, s.name as source_name, s.domain as source_domain, s.reliability_tier
    FROM news_articles n
    LEFT JOIN data_sources s ON n.source_id = s.id
    LEFT JOIN impact_assessments a ON n.id = a.article_id
    LEFT JOIN companies c ON a.company_id = c.id
    LEFT JOIN sectors sec ON c.sector_id = sec.id
    WHERE 1=1
  `;
  const params = [];

  if (q) {
    sql += ` AND (n.title LIKE ? OR n.summary LIKE ? OR n.content_snippet LIKE ?)`;
    const term = `%${q}%`;
    params.push(term, term, term);
  }

  if (sector) {
    sql += ` AND (sec.code = ? OR sec.id = ?)`;
    params.push(sector, sector);
  }

  if (company) {
    sql += ` AND (c.symbol = ? OR c.id = ?)`;
    params.push(company.toUpperCase(), company);
  }

  if (category) {
    sql += ` AND n.event_category = ?`;
    params.push(category);
  }

  if (verification) {
    sql += ` AND n.verification_status = ?`;
    params.push(verification);
  }

  if (direction) {
    sql += ` AND a.potential_direction = ?`;
    params.push(direction.toUpperCase());
  }

  sql += ` ORDER BY n.published_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const articles = await query(sql, params);

  // For each article, fetch summary of affected companies
  const articleIds = articles.map(a => a.id);
  let impactsByArticle = {};
  if (articleIds.length > 0) {
    const placeholders = articleIds.map(() => '?').join(',');
    const impactRows = await query(`
      SELECT a.article_id, a.exposure_type, a.potential_direction, a.impact_score,
             c.symbol, c.name as company_name
      FROM impact_assessments a
      JOIN companies c ON a.company_id = c.id
      WHERE a.article_id IN (${placeholders})
    `, articleIds);

    for (const row of impactRows) {
      if (!impactsByArticle[row.article_id]) impactsByArticle[row.article_id] = [];
      impactsByArticle[row.article_id].push({
        symbol: row.symbol,
        name: row.company_name,
        exposure_type: row.exposure_type,
        potential_direction: row.potential_direction,
        impact_score: row.impact_score
      });
    }
  }

  return json({
    articles: articles.map(a => ({
      id: a.id,
      title: a.title,
      url: a.url,
      canonical_url: a.canonical_url,
      author: a.author,
      summary: a.summary,
      published_at: a.published_at,
      retrieved_at: a.retrieved_at,
      event_category: a.event_category,
      verification_status: a.verification_status,
      verification_score: a.verification_score,
      verification_factors: a.verification_factors ? JSON.parse(a.verification_factors) : {},
      is_demo: Boolean(a.is_demo),
      source: {
        id: a.source_id,
        name: a.source_name,
        domain: a.source_domain,
        reliability_tier: a.reliability_tier
      },
      affected_companies: impactsByArticle[a.id] || []
    })),
    count: articles.length,
    limit,
    offset
  });
}
