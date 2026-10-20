// Explainable, Deterministic News-to-Company Impact Engine
// Implements Stages A to F of Master Prompt Section 9

import { resolveEntities } from './entity-resolver.js';
import { calculateVerificationScore } from '../news/verification.js';
import { query } from '../db/index.js';

export const EVENT_CATEGORIES = [
  'COMMODITY_PRICE_SHOCK',
  'INTEREST_RATE_DECISION',
  'REGULATORY_CHANGE',
  'GOVERNMENT_POLICIES',
  'EARNINGS_SURPRISE',
  'MERGERS_ACQUISITIONS',
  'SUPPLY_CHAIN_DISRUPTION',
  'GEOPOLITICAL_EVENT',
  'SANCTIONS_TRADE_RESTRICTIONS',
  'NATURAL_DISASTER',
  'PRODUCT_LAUNCH_RECALL',
  'CYBERSECURITY_INCIDENT',
  'MANAGEMENT_CHANGE',
  'FRAUD_INVESTIGATION',
  'COURT_JUDGMENT',
  'CREDIT_RATING_CHANGE',
  'PRODUCTION_OUTAGE',
  'INDUSTRY_DEVELOPMENT'
];

export class ImpactEngine {
  /**
   * Stage A: Classify news event category from title and text
   */
  classifyEvent(title, text) {
    const full = `${title || ''} ${text || ''}`.toLowerCase();

    if (/crude oil|brent|opec|fuel|petroleum|atf|diesel|gas price/i.test(full)) {
      return 'COMMODITY_PRICE_SHOCK';
    }
    if (/repo rate|interest rate|rbi mpc|monetary policy|basis points hike|rate cut/i.test(full)) {
      return 'INTEREST_RATE_DECISION';
    }
    if (/fda|form 483|warning letter|sebi order|trai regulation|regulatory|compliance/i.test(full)) {
      return 'REGULATORY_CHANGE';
    }
    if (/union budget|capex outlay|cabinet approves|ccea|government policy|national highway/i.test(full)) {
      return 'GOVERNMENT_POLICIES';
    }
    if (/quarterly profit|q[1-4] results|ebitda beats|revenue miss|earnings surprise/i.test(full)) {
      return 'EARNINGS_SURPRISE';
    }
    if (/merger|acquisition|takeover|buys stake|amalgamation/i.test(full)) {
      return 'MERGERS_ACQUISITIONS';
    }
    if (/whistleblower|fraud|investigation|accounting irregularities|raids/i.test(full)) {
      return 'FRAUD_INVESTIGATION';
    }
    if (/sanctions|tariff|customs duty|export ban|safeguard duty/i.test(full)) {
      return 'SANCTIONS_TRADE_RESTRICTIONS';
    }

    return 'INDUSTRY_DEVELOPMENT';
  }

  /**
   * Run full deterministic impact analysis on an incoming or candidate news article
   */
  async analyzeArticle(article) {
    const title = article.title || '';
    const text = `${title} ${article.summary || ''} ${article.content_snippet || ''}`;
    const category = article.event_category || this.classifyEvent(title, text);

    // Calculate Verification
    const verification = calculateVerificationScore({
      ...article,
      event_category: category
    });

    // Check for Retraction or Extreme Low Confidence -> ABSTAIN
    if (verification.status === 'RETRACTED' || verification.score < 25) {
      return {
        event_category: category,
        verification,
        abstained: true,
        abstention_reason: verification.status === 'RETRACTED' 
          ? 'Article formally retracted or withdrawn by reporting source.' 
          : 'Evidence quality score below minimum actionable confidence threshold (25/100). Engine explicitly abstains.',
        assessments: []
      };
    }

    // Stage B: Entity Resolution
    const entities = resolveEntities(text);
    const affectedCompanies = [];

    // Load full companies and relationships from database
    const allCompanies = await query('SELECT * FROM companies');
    const compMap = new Map(allCompanies.map(c => [c.symbol, c]));

    const allRelationships = await query('SELECT * FROM company_relationships');

    // 1. Evaluate Directly Mentioned Companies
    for (const sym of entities.direct_companies) {
      const comp = compMap.get(sym);
      if (!comp) continue;

      const assessment = this.evaluateCompanyImpact(comp, category, 'DIRECT', text, verification.score);
      if (assessment) affectedCompanies.push(assessment);
    }

    // 2. Evaluate Macro / Commodity Indirect Exposures
    if (entities.detected_commodities.includes('COMMODITY_CRUDE') || category === 'COMMODITY_PRICE_SHOCK') {
      const isSurge = /surge|jump|rallies|higher|spike|soars|escalat/i.test(text);
      
      // Upstream E&P: ONGC
      if (compMap.has('ONGC') && !affectedCompanies.some(a => a.symbol === 'ONGC')) {
        affectedCompanies.push(this.createCrudeImpactForONGC(compMap.get('ONGC'), isSurge, verification.score));
      }
      // Airlines: INDIGO
      if (compMap.has('INDIGO') && !affectedCompanies.some(a => a.symbol === 'INDIGO')) {
        affectedCompanies.push(this.createCrudeImpactForIndiGo(compMap.get('INDIGO'), isSurge, verification.score));
      }
      // Downstream OMCs: BPCL
      if (compMap.has('BPCL') && !affectedCompanies.some(a => a.symbol === 'BPCL')) {
        affectedCompanies.push(this.createCrudeImpactForBPCL(compMap.get('BPCL'), isSurge, verification.score));
      }
      // FMCG: HINDUNILVR (Indirect packaging/LAB)
      if (compMap.has('HINDUNILVR') && !affectedCompanies.some(a => a.symbol === 'HINDUNILVR')) {
        affectedCompanies.push(this.createCrudeImpactForHUL(compMap.get('HINDUNILVR'), isSurge, verification.score));
      }
    }

    // 3. Evaluate Interest Rate Decision Exposures
    if (category === 'INTEREST_RATE_DECISION' || entities.detected_macro.includes('INTEREST_RATES')) {
      const isHike = /hike|increase|higher|tighten|25 bps|50 bps/i.test(text);

      if (compMap.has('HDFCBANK') && !affectedCompanies.some(a => a.symbol === 'HDFCBANK')) {
        affectedCompanies.push(this.createRateImpactForBank(compMap.get('HDFCBANK'), isHike, verification.score));
      }
      if (compMap.has('MARUTI') && !affectedCompanies.some(a => a.symbol === 'MARUTI')) {
        affectedCompanies.push(this.createRateImpactForAuto(compMap.get('MARUTI'), isHike, verification.score));
      }
    }

    // 4. Evaluate Government Infrastructure Capex
    if (category === 'GOVERNMENT_POLICIES' && /infrastructure|capex|corridor|highway|railway/i.test(text)) {
      if (compMap.has('LT') && !affectedCompanies.some(a => a.symbol === 'LT')) {
        affectedCompanies.push(this.createCapexImpactForLT(compMap.get('LT'), verification.score));
      }
      if (compMap.has('TATASTEEL') && !affectedCompanies.some(a => a.symbol === 'TATASTEEL')) {
        affectedCompanies.push(this.createCapexImpactForSteel(compMap.get('TATASTEEL'), verification.score));
      }
    }

    // 5. Evaluate Supply Chain Indirect Neighbors
    for (const direct of [...affectedCompanies]) {
      const directComp = compMap.get(direct.symbol);
      if (!directComp) continue;

      const directRels = allRelationships.filter(r => r.target_company_id === directComp.id || r.source_company_id === directComp.id);
      for (const rel of directRels) {
        const neighborId = rel.source_company_id === directComp.id ? rel.target_company_id : rel.source_company_id;
        const neighbor = allCompanies.find(c => c.id === neighborId);
        if (neighbor && !affectedCompanies.some(a => a.symbol === neighbor.symbol)) {
          // Add indirect assessment if relationship has high confidence
          if (rel.confidence_score >= 85) {
            affectedCompanies.push({
              company_id: neighbor.id,
              symbol: neighbor.symbol,
              name: neighbor.name,
              exposure_type: 'INDIRECT',
              potential_direction: direct.potential_direction === 'POSITIVE' ? 'POSITIVE' : 'NEGATIVE',
              impact_horizon: 'MEDIUM_TERM',
              impact_score: Math.max(30, Math.round(direct.impact_score * 0.75)),
              evidence_quality_score: verification.score,
              causal_chain: [
                `Primary shock impacts ${direct.name} (${direct.exposure_type})`,
                `Documented business relationship: ${rel.description} (${rel.relationship_type})`,
                `Second-order transmission alters order volumes or payment schedules for ${neighbor.name}`
              ],
              explanation: `Indirect supply-chain exposure: ${neighbor.name} is connected to ${direct.name} via ${rel.relationship_type}. Causal ripple transmitted through contract volume commitments.`,
              key_facts: [`Documented relationship confidence: ${rel.confidence_score}%. Evidence: ${rel.evidence_source}`],
              counterarguments: ['Secondary exposure can be mitigated if alternative client contracts absorb capacity.'],
              invalidation_conditions: ['Termination or restructuring of inter-firm supply agreement.']
            });
          }
        }
      }
    }

    return {
      event_category: category,
      verification,
      abstained: affectedCompanies.length === 0,
      abstention_reason: affectedCompanies.length === 0 ? 'No listed Indian equities in the knowledge graph have verified direct or indirect causal exposure.' : null,
      assessments: affectedCompanies
    };
  }

  evaluateCompanyImpact(comp, category, exposureType, text, verifScore) {
    const isDirect = exposureType === 'DIRECT';
    const isNeg = /warning|inspection|observations|fine|penalty|breach|miss|drop|decline|loss|fraud|probe|curb|ban/i.test(text);

    let direction = isNeg ? 'NEGATIVE' : 'POSITIVE';
    let horizon = 'SHORT_TERM';
    let magnitude = 70;

    // Direct regulatory action like US FDA 483
    if (category === 'REGULATORY_CHANGE' && /483|observation|warning/i.test(text)) {
      direction = 'NEGATIVE';
      horizon = 'SHORT_TERM';
      magnitude = 85;
    }

    // Calculate Stage E Potential Impact Score (0-100)
    // Formula: Verification (25%) + Directness (25%) + Causal Relevance (20%) + Economic Magnitude (15%) + Recency (15%)
    const verifWeight = verifScore * 0.25;
    const directnessWeight = (isDirect ? 100 : 65) * 0.25;
    const causalWeight = 85 * 0.20;
    const magnitudeWeight = magnitude * 0.15;
    const recencyWeight = 95 * 0.15;
    const impactScore = Math.round(verifWeight + directnessWeight + causalWeight + magnitudeWeight + recencyWeight);

    return {
      company_id: comp.id,
      symbol: comp.symbol,
      name: comp.name,
      exposure_type: exposureType,
      potential_direction: direction,
      impact_horizon: horizon,
      impact_score: impactScore,
      evidence_quality_score: verifScore,
      causal_chain: [
        `Explicitly disclosed event affecting ${comp.name} operations`,
        `Event category: ${category} with direct enterprise linkage`,
        `Observed regulatory or operational transmission mechanism altering near-term cash flows`
      ],
      explanation: `${comp.name} is directly named in the disclosure regarding ${category.toLowerCase().replace(/_/g, ' ')}. The business implications reflect documented operational sensitivity.`,
      key_facts: [
        `Entity: ${comp.name} (${comp.exchange}: ${comp.symbol})`,
        `Sub-industry: ${comp.sub_industry}`
      ],
      counterarguments: [
        'Management may deploy immediate legal remediation or contingency operational protocols.'
      ],
      invalidation_conditions: [
        'Official clarification or withdrawal of regulatory order.'
      ]
    };
  }

  createCrudeImpactForONGC(comp, isSurge, verifScore) {
    const direction = isSurge ? 'POSITIVE' : 'NEGATIVE';
    const impactScore = Math.round((verifScore * 0.25) + (100 * 0.25) + (95 * 0.20) + (90 * 0.15) + (95 * 0.15));

    return {
      company_id: comp.id,
      symbol: 'ONGC',
      name: comp.name,
      exposure_type: 'DIRECT',
      potential_direction: direction,
      impact_horizon: 'SHORT_TERM',
      impact_score: impactScore,
      evidence_quality_score: verifScore,
      causal_chain: [
        'Brent international crude benchmark surges following supply disruption',
        'ONGC realizes international parity pricing on all offshore Mumbai High domestic crude sales',
        'Net operating realization expands per barrel, expanding gross cash generation'
      ],
      explanation: 'ONGC is India largest upstream oil producer. An increase in crude price directly elevates realization per barrel, offset only by potential adjustments to government windfall tax levies.',
      key_facts: ['ONGC produces ~71% of Indian domestic crude.'],
      counterarguments: ['Government raising domestic crude windfall levy to limit excess profits.'],
      invalidation_conditions: ['Rapid normalization of crude shipping routes.']
    };
  }

  createCrudeImpactForIndiGo(comp, isSurge, verifScore) {
    const direction = isSurge ? 'NEGATIVE' : 'POSITIVE';
    const impactScore = Math.round((verifScore * 0.25) + (100 * 0.25) + (95 * 0.20) + (95 * 0.15) + (95 * 0.15));

    return {
      company_id: comp.id,
      symbol: 'INDIGO',
      name: comp.name,
      exposure_type: 'DIRECT',
      potential_direction: direction,
      impact_horizon: 'IMMEDIATE',
      impact_score: impactScore,
      evidence_quality_score: verifScore,
      causal_chain: [
        'Surge in crude oil drives Aviation Turbine Fuel (ATF) prices higher in domestic bi-monthly revision',
        'Fuel accounts for ~40% of IndiGo total operating costs',
        'Sudden fuel cost inflation compresses operating margins prior to airfare pass-through'
      ],
      explanation: 'Jet fuel constitutes IndiGo single largest cost center. Rapid crude surges directly compress airline operating margins unless offset by swift fuel surcharge increases.',
      key_facts: ['Fuel represents ~40% of operating expenditure.'],
      counterarguments: ['IndiGo market dominance (>62%) grants strong pricing power to raise airfares.'],
      invalidation_conditions: ['Crude prices falling back or state fuel VAT cuts.']
    };
  }

  createCrudeImpactForBPCL(comp, isSurge, verifScore) {
    const direction = isSurge ? 'NEGATIVE' : 'POSITIVE';
    const impactScore = Math.round((verifScore * 0.25) + (90 * 0.25) + (85 * 0.20) + (85 * 0.15) + (90 * 0.15));

    return {
      company_id: comp.id,
      symbol: 'BPCL',
      name: comp.name,
      exposure_type: 'DIRECT',
      potential_direction: direction,
      impact_horizon: 'SHORT_TERM',
      impact_score: impactScore,
      evidence_quality_score: verifScore,
      causal_chain: [
        'Crude import bill rises for downstream refining network',
        'Retail petrol and diesel prices at pumps are sticky and politically monitored',
        'Net marketing margins on motor spirit contract'
      ],
      explanation: 'Oil marketing companies bear elevated procurement costs while retail pump prices remain capped, creating marketing margin squeeze.',
      key_facts: ['Imports over 85% of crude requirements.'],
      counterarguments: ['Strong refining margins (GRM) can partially cushion marketing margin compression.'],
      invalidation_conditions: ['Immediate domestic pump price increases.']
    };
  }

  createCrudeImpactForHUL(comp, isSurge, verifScore) {
    const direction = isSurge ? 'NEGATIVE' : 'POSITIVE';
    const impactScore = Math.round((verifScore * 0.25) + (70 * 0.25) + (75 * 0.20) + (70 * 0.15) + (85 * 0.15));

    return {
      company_id: comp.id,
      symbol: 'HINDUNILVR',
      name: comp.name,
      exposure_type: 'INDIRECT',
      potential_direction: direction,
      impact_horizon: 'MEDIUM_TERM',
      impact_score: impactScore,
      evidence_quality_score: verifScore,
      causal_chain: [
        'Crude derivatives (LAB, polymers for packaging) increase in price',
        'Freight logistics and diesel delivery costs climb nationwide',
        'FMCG gross margins contract without retail price or grammage revisions'
      ],
      explanation: 'Petrochemical derivatives form the foundation for detergents and plastic packaging. Sustained crude inflation inflates input costs and compresses FMCG gross margins.',
      key_facts: ['Packaging and petrochemical derivatives constitute ~16% of raw material basket.'],
      counterarguments: ['Superior brand pricing power and inventory buffers.'],
      invalidation_conditions: ['Crude shock retreats within two weeks.']
    };
  }

  createRateImpactForBank(comp, isHike, verifScore) {
    const impactScore = Math.round((verifScore * 0.25) + (90 * 0.25) + (85 * 0.20) + (80 * 0.15) + (90 * 0.15));
    return {
      company_id: comp.id,
      symbol: comp.symbol,
      name: comp.name,
      exposure_type: 'DIRECT',
      potential_direction: 'MIXED',
      impact_horizon: 'SHORT_TERM',
      impact_score: impactScore,
      evidence_quality_score: verifScore,
      causal_chain: [
        'RBI policy repo rate adjustment alters interbank cost of liquidity',
        'Floating rate retail and commercial loan book reprices immediately',
        'Fixed deposit costs reprice with 3-6 month lag, temporarily widening NIMs while bond portfolios suffer MTM markdowns'
      ],
      explanation: 'A repo rate change generates mixed impacts for commercial banks: immediate asset repricing aids lending yields, but rising bond yields depress treasury investment valuations and elevated EMIs moderate retail credit demand.',
      key_facts: ['Over 55% of loans tied to external benchmark rates.'],
      counterarguments: ['Deposit competition among banks may force aggressive rate hikes on savings/fixed deposits.'],
      invalidation_conditions: ['Central bank conducting massive liquidity repo injections to cool interbank yields.']
    };
  }

  createRateImpactForAuto(comp, isHike, verifScore) {
    const direction = isHike ? 'NEGATIVE' : 'POSITIVE';
    const impactScore = Math.round((verifScore * 0.25) + (85 * 0.25) + (80 * 0.20) + (75 * 0.15) + (90 * 0.15));
    return {
      company_id: comp.id,
      symbol: comp.symbol,
      name: comp.name,
      exposure_type: 'DIRECT',
      potential_direction: direction,
      impact_horizon: 'MEDIUM_TERM',
      impact_score: impactScore,
      evidence_quality_score: verifScore,
      causal_chain: [
        'Higher policy rates flow through to commercial bank auto financing loans',
        'Monthly retail EMI costs rise for entry and compact car segments',
        'Discretionary customer purchase decisions are postponed'
      ],
      explanation: 'Vehicle financing accounts for over 80% of personal auto purchases in India. Elevated interest rates increase loan affordability hurdles for price-sensitive buyers.',
      key_facts: ['Auto loan financing penetration exceeds 80%.'],
      counterarguments: ['High order backlog in premium SUVs and CNG models can sustain volume shipments.'],
      invalidation_conditions: ['OEMs offering low-interest festive financing subventions.']
    };
  }

  createCapexImpactForLT(comp, verifScore) {
    const impactScore = Math.round((verifScore * 0.25) + (95 * 0.25) + (90 * 0.20) + (90 * 0.15) + (95 * 0.15));
    return {
      company_id: comp.id,
      symbol: 'LT',
      name: comp.name,
      exposure_type: 'DIRECT',
      potential_direction: 'POSITIVE',
      impact_horizon: 'LONG_TERM',
      impact_score: impactScore,
      evidence_quality_score: verifScore,
      causal_chain: [
        'Government budget allocates capital expenditure to freight corridors and civil works',
        'National mega-tenders issued over subsequent 6-12 months',
        'L&T captures market-leading order share, expanding forward revenue visibility'
      ],
      explanation: 'L&T is the principal domestic contractor for national transport and industrial infrastructure. Sanctioned public capital outlays expand addressable multi-year order books.',
      key_facts: ['L&T order backlog exceeds ₹4.7 lakh crore.'],
      counterarguments: ['Right-of-way land acquisition hurdles can delay project execution milestones.'],
      invalidation_conditions: ['Fiscal deficit curbs delaying actual tender awards.']
    };
  }

  createCapexImpactForSteel(comp, verifScore) {
    const impactScore = Math.round((verifScore * 0.25) + (80 * 0.25) + (80 * 0.20) + (75 * 0.15) + (90 * 0.15));
    return {
      company_id: comp.id,
      symbol: 'TATASTEEL',
      name: comp.name,
      exposure_type: 'INDIRECT',
      potential_direction: 'POSITIVE',
      impact_horizon: 'MEDIUM_TERM',
      impact_score: impactScore,
      evidence_quality_score: verifScore,
      causal_chain: [
        'High-speed freight rail and civil corridors require high-grade heavy structural steel and rebar',
        'Domestic procurement mandates direct demand to Indian steelmakers',
        'Capacity utilization rates and domestic steel pricing realizations strengthen'
      ],
      explanation: 'Heavy infrastructure execution directly drives bulk steel volume absorption. Tata Steel domestic operations benefit from firm domestic demand and higher plant utilization.',
      key_facts: ['Domestic steel realizations carry premium over export markets.'],
      counterarguments: ['Cheap Chinese steel imports into Asian ports could weigh on domestic pricing power.'],
      invalidation_conditions: ['Removal of anti-dumping tariffs allowing foreign steel flood.']
    };
  }
}

export const impactEngine = new ImpactEngine();
