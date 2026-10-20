// Transparent, explainable news verification scoring system
// Section 7 of Master Prompt

export function calculateVerificationScore(articleData) {
  let score = 50; // Base baseline
  const factors = {
    publisher_tier_score: 50,
    primary_source_cited: false,
    corroboration_count: 0,
    consistency_score: 50,
    is_official_regulatory_filing: false,
    retraction_issued: false,
    correction_issued: false,
    speculative_language_penalty: 0,
    explanation: []
  };

  const publisherTier = articleData.reliability_tier || (articleData.source?.reliability_tier ?? 2);
  const text = `${articleData.title || ''} ${articleData.content_snippet || ''} ${articleData.summary || ''}`.toLowerCase();

  // 1. Publisher Tier Check
  if (publisherTier === 1) {
    factors.publisher_tier_score = 95;
    factors.explanation.push('Published by Tier-1 Primary / Official Regulatory Body (+45)');
    score = 80;
  } else if (publisherTier === 2) {
    factors.publisher_tier_score = 75;
    factors.explanation.push('Published by Accredited Tier-2 Financial News Publisher (+25)');
    score = 65;
  } else {
    factors.publisher_tier_score = 30;
    factors.explanation.push('Published by Tier-3 / Unaccredited Discovery Source (-20)');
    score = 35;
  }

  // 2. Primary Source / Regulatory Filing Citation
  const hasOfficialCitation = /exchange filing|regulatory filing|bse disclosure|nse disclosure|sebi order|rbi circular|press information bureau|ccea approved|form 483|annual report/i.test(text);
  if (hasOfficialCitation || articleData.is_official_filing) {
    factors.primary_source_cited = true;
    score += 15;
    factors.explanation.push('Explicitly cites official exchange filing or regulatory document (+15)');
  }

  // 3. Independent Corroboration
  const corroborationCount = articleData.corroboration_count || 1;
  factors.corroboration_count = corroborationCount;
  if (corroborationCount >= 3) {
    score += 15;
    factors.explanation.push(`Independently corroborated across ${corroborationCount} separate publishers (+15)`);
  } else if (corroborationCount === 2) {
    score += 8;
    factors.explanation.push('Corroborated by 2 independent news outlets (+8)');
  } else if (corroborationCount <= 1 && publisherTier > 1) {
    score -= 10;
    factors.explanation.push('Single-source report awaiting independent verification (-10)');
  }

  // 4. Speculation vs Factual Tone
  const speculativeWords = ['rumor', 'rumours', 'alleged', 'unconfirmed', 'sources whisper', 'may consider', 'speculated', 'hearsay', 'purported'];
  let specHits = 0;
  for (const word of speculativeWords) {
    if (text.includes(word)) specHits++;
  }
  if (specHits > 0) {
    const penalty = Math.min(35, specHits * 15);
    factors.speculative_language_penalty = penalty;
    score -= penalty;
    factors.explanation.push(`Contains speculative or unconfirmed phraseology (-${penalty})`);
  }

  // 5. Retraction / Correction Checks
  if (articleData.verification_status === 'RETRACTED' || /retracted|withdrawn by wire|erroneous report/i.test(text)) {
    factors.retraction_issued = true;
    score = 15;
    factors.explanation = ['ARTICLE RETRACTED OR WITHDRAWN: Disregard prior reporting (Score capped at 15)'];
    return {
      score: 15,
      status: 'RETRACTED',
      display_label: 'Retracted',
      factors
    };
  }

  if (articleData.verification_status === 'CORRECTED' || /correction:|clarification issued/i.test(text)) {
    factors.correction_issued = true;
    score = Math.min(score, 60);
    factors.explanation.push('Subject to formal editorial correction');
    return {
      score,
      status: 'CORRECTED',
      display_label: 'Corrected',
      factors
    };
  }

  // Clamp score 0 to 100
  score = Math.max(0, Math.min(100, Math.round(score)));

  // Determine Verification Status Label
  let status = 'REPORTED_AWAITING_CORROBORATION';
  let display_label = 'Reported, Awaiting Corroboration';

  if (publisherTier === 1 && (factors.primary_source_cited || articleData.is_official_filing)) {
    status = 'OFFICIALLY_DISCLOSED';
    display_label = 'Officially Disclosed';
  } else if (score >= 80 && corroborationCount >= 2) {
    status = 'INDEPENDENTLY_CORROBORATED';
    display_label = 'Independently Corroborated';
  } else if (score < 40 || specHits >= 2) {
    status = 'PRELIMINARY_DEVELOPING';
    display_label = 'Preliminary / Developing';
  } else if (articleData.has_conflicts) {
    status = 'CONFLICTING_REPORTS';
    display_label = 'Conflicting Reports';
  }

  return {
    score,
    status,
    display_label,
    factors
  };
}
