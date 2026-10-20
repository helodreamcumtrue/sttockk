// News Deduplication & Story Update Detector

export function canonicalizeUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid', 'ref', 'source'];
    for (const p of trackingParams) {
      parsed.searchParams.delete(p);
    }
    // Remove trailing slash
    return parsed.toString().replace(/\/$/, '');
  } catch (err) {
    return (rawUrl || '').trim().replace(/\/$/, '');
  }
}

export function tokenizeTitle(title) {
  return (title || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2);
}

export function calculateTitleSimilarity(titleA, titleB) {
  const tokensA = new Set(tokenizeTitle(titleA));
  const tokensB = new Set(tokenizeTitle(titleB));

  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersection = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) intersection++;
  }

  const union = new Set([...tokensA, ...tokensB]).size;
  return union === 0 ? 0 : Number((intersection / union).toFixed(3));
}

export function isDuplicateOrUpdate(newArticle, existingArticles, threshold = 0.65) {
  const newCanonical = canonicalizeUrl(newArticle.url || newArticle.canonical_url);

  for (const existing of existingArticles) {
    const existingCanonical = canonicalizeUrl(existing.url || existing.canonical_url);
    
    // Direct URL match
    if (newCanonical && existingCanonical && newCanonical === existingCanonical) {
      return {
        isDuplicate: true,
        isUpdate: (newArticle.published_at && existing.published_at && new Date(newArticle.published_at) > new Date(existing.published_at)),
        matchedArticle: existing,
        reason: 'EXACT_URL_MATCH',
        similarity: 1.0
      };
    }

    // Title similarity check
    const sim = calculateTitleSimilarity(newArticle.title, existing.title);
    if (sim >= threshold) {
      return {
        isDuplicate: true,
        isUpdate: (newArticle.published_at && existing.published_at && new Date(newArticle.published_at) > new Date(existing.published_at)),
        matchedArticle: existing,
        reason: 'HIGH_TITLE_SIMILARITY',
        similarity: sim
      };
    }
  }

  return { isDuplicate: false, isUpdate: false, matchedArticle: null, similarity: 0 };
}
