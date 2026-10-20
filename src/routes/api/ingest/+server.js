import { json } from '@sveltejs/kit';
import { impactEngine } from '#lib/server/engine/impact-engine.js';
import { execute, query } from '#lib/server/db/index.js';
import { isDuplicateOrUpdate } from '#lib/server/news/deduplicator.js';

export async function POST({ request }) {
  try {
    const body = await request.json().catch(() => ({}));
    const mode = body.mode || 'demo';

    if (mode === 'custom' && body.article) {
      // Analyze a custom submitted article (useful for testing and user simulations)
      const rawArticle = body.article;
      const analysis = await impactEngine.analyzeArticle(rawArticle);

      const articleId = `art_${Date.now()}`;
      await execute(
        `INSERT INTO news_articles (
          id, source_id, external_id, title, url, canonical_url, author, summary,
          content_snippet, published_at, event_category, verification_status,
          verification_score, verification_factors, is_demo
        ) VALUES (?, 'src_mint', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          articleId,
          articleId,
          rawArticle.title,
          rawArticle.url || `https://example.com/news/${articleId}`,
          rawArticle.url || `https://example.com/news/${articleId}`,
          rawArticle.author || 'Financial Reporter',
          rawArticle.summary || rawArticle.title,
          rawArticle.content_snippet || rawArticle.title,
          rawArticle.published_at || new Date().toISOString(),
          analysis.event_category,
          analysis.verification.status,
          analysis.verification.score,
          JSON.stringify(analysis.verification.factors),
          1
        ]
      );

      // Save assessments if not abstained
      if (!analysis.abstained && analysis.assessments.length > 0) {
        for (const a of analysis.assessments) {
          const impId = `imp_${Date.now()}_${a.symbol}`;
          await execute(
            `INSERT INTO impact_assessments (
              id, article_id, company_id, exposure_type, potential_direction, impact_horizon,
              impact_score, evidence_quality_score, causal_chain, explanation, key_facts,
              counterarguments, invalidation_conditions, model_version
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              impId,
              articleId,
              a.company_id,
              a.exposure_type,
              a.potential_direction,
              a.impact_horizon,
              a.impact_score,
              a.evidence_quality_score,
              JSON.stringify(a.causal_chain),
              a.explanation,
              JSON.stringify(a.key_facts),
              JSON.stringify(a.counterarguments),
              JSON.stringify(a.invalidation_conditions),
              'v1.0-deterministic'
            ]
          );
        }
      }

      return json({
        success: true,
        article_id: articleId,
        analysis
      });
    }

    return json({
      success: true,
      message: 'Ingestion pipeline operational.',
      mode
    });
  } catch (err) {
    return json({ error: err.message }, { status: 500 });
  }
}
