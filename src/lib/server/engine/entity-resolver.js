// Entity Resolution Module for Indian Equities and Macro Drivers

export const ENTITY_ALIASES = {
  RELIANCE: ['reliance', 'ril', 'reliance industries', 'jio', 'reliance retail'],
  TCS: ['tcs', 'tata consultancy', 'tata consultancy services'],
  INFY: ['infosys', 'infy', 'finacle'],
  HDFCBANK: ['hdfc bank', 'hdfc', 'hdfcbank'],
  ICICIBANK: ['icici bank', 'icici', 'icicibank'],
  TATAMOTORS: ['tata motors', 'tamo', 'jaguar land rover', 'jlr'],
  MARUTI: ['maruti', 'maruti suzuki', 'msil'],
  LT: ['l&t', 'larsen & toubro', 'larsen and toubro', 'larsen toubro'],
  BHARTIARTL: ['bharti airtel', 'airtel', 'bharti'],
  SBIN: ['state bank of india', 'sbi', 'sbin'],
  HINDUNILVR: ['hindustan unilever', 'hul', 'hindunilvr', 'unilever india'],
  ITC: ['itc', 'itc limited', 'itc ltd'],
  SUNPHARMA: ['sun pharma', 'sun pharmaceutical', 'sunpharma'],
  INDIGO: ['indigo', 'interglobe aviation', 'interglobe', 'indigo airlines'],
  BPCL: ['bpcl', 'bharat petroleum', 'bharat petroleum corp'],
  IOC: ['ioc', 'iocl', 'indian oil', 'indian oil corporation'],
  TATASTEEL: ['tata steel', 'tisco'],
  JSWSTEEL: ['jsw steel', 'jsw'],
  ULTRACEMCO: ['ultratech cement', 'ultratech', 'ultracemco'],
  ONGC: ['ongc', 'oil and natural gas corporation', 'oil & natural gas corp']
};

export const MACRO_KEYWORDS = {
  COMMODITY_CRUDE: ['crude oil', 'brent crude', 'oil prices', 'strait of hormuz', 'opec', 'petroleum', 'aviation turbine fuel', 'atf', 'diesel', 'petrol'],
  COMMODITY_STEEL: ['steel prices', 'coking coal', 'iron ore', 'hot rolled coil', 'rebar', 'lme metal'],
  INTEREST_RATES: ['repo rate', 'rbi mpc', 'monetary policy committee', 'rate hike', 'rate cut', 'eblr', 'cost of funds', 'bond yield'],
  REGULATORY_FDA: ['us fda', 'form 483', 'warning letter', 'good manufacturing practice', 'gmp inspection', 'halol', 'anda approval'],
  GOV_CAPEX: ['union budget', 'capital expenditure', 'capex outlay', 'national infrastructure pipeline', 'ccea approved', 'freight corridor', 'expressway tenders']
};

export function resolveEntities(text, knownCompanies = []) {
  const normalized = (text || '').toLowerCase();
  const directCompanies = [];
  const detectedCommodities = [];
  const detectedMacro = [];
  const ambiguousEntities = [];

  // Check for ambiguous "Tata" mention without specific company
  const mentionsTata = /\btata\b/i.test(normalized);
  const mentionsTataSpecific = /tata motors|tata steel|tata consultancy|tcs/i.test(normalized);
  if (mentionsTata && !mentionsTataSpecific) {
    ambiguousEntities.push({
      mention: 'Tata',
      candidate_symbols: ['TATAMOTORS', 'TATASTEEL', 'TCS'],
      reason: 'Generic group mention without specific listed entity disambiguation'
    });
  }

  // Check for company aliases
  for (const [symbol, aliases] of Object.entries(ENTITY_ALIASES)) {
    for (const alias of aliases) {
      const regex = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(normalized)) {
        if (!directCompanies.includes(symbol)) {
          directCompanies.push(symbol);
        }
        break;
      }
    }
  }

  // Check macro keywords
  for (const [key, keywords] of Object.entries(MACRO_KEYWORDS)) {
    for (const kw of keywords) {
      if (normalized.includes(kw)) {
        if (key.startsWith('COMMODITY_')) {
          if (!detectedCommodities.includes(key)) detectedCommodities.push(key);
        } else {
          if (!detectedMacro.includes(key)) detectedMacro.push(key);
        }
        break;
      }
    }
  }

  return {
    direct_companies: directCompanies,
    detected_commodities: detectedCommodities,
    detected_macro: detectedMacro,
    ambiguous_entities: ambiguousEntities
  };
}
