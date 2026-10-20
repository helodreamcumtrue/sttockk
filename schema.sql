-- =============================================================================
-- MarketPulse Intelligence — Complete Database Schema & Migrations
-- Compatible with SQLite (via LibSQL) and PostgreSQL (Neon Free Tier)
-- =============================================================================

CREATE TABLE IF NOT EXISTS exchanges (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  open_time TEXT NOT NULL DEFAULT '09:15',
  close_time TEXT NOT NULL DEFAULT '15:30',
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'ACTIVE'
);

CREATE TABLE IF NOT EXISTS sectors (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  macro_drivers TEXT, -- JSON array of strings
  benchmark_index TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  symbol TEXT UNIQUE NOT NULL,
  isin TEXT,
  exchange TEXT NOT NULL DEFAULT 'NSE',
  name TEXT NOT NULL,
  sector_id TEXT REFERENCES sectors(id),
  sub_industry TEXT,
  market_cap_category TEXT, -- LARGE_CAP, MID_CAP, SMALL_CAP
  description TEXT,
  products_services TEXT, -- JSON array
  raw_materials TEXT, -- JSON array
  input_costs TEXT, -- JSON array
  export_exposure_pct REAL DEFAULT 0,
  import_exposure_pct REAL DEFAULT 0,
  currency_sensitivity TEXT, -- HIGH_USD_POSITIVE, HIGH_USD_NEGATIVE, NEUTRAL
  interest_rate_sensitivity TEXT, -- HIGH_NEGATIVE, MODERATE_NEGATIVE, POSITIVE, NEUTRAL
  commodity_sensitivities TEXT, -- JSON object: {"crude_oil": "NEGATIVE_HIGH", ...}
  regulatory_bodies TEXT, -- JSON array: ["RBI", "SEBI", "DGCA"]
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS company_relationships (
  id TEXT PRIMARY KEY,
  source_company_id TEXT REFERENCES companies(id),
  target_company_id TEXT REFERENCES companies(id),
  relationship_type TEXT NOT NULL, -- SUPPLIER_TO, CUSTOMER_OF, COMPETITOR_WITH, JV_PARTNER
  confidence_score INTEGER NOT NULL DEFAULT 85,
  evidence_source TEXT NOT NULL,
  description TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS data_sources (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  category TEXT NOT NULL, -- OFFICIAL_EXCHANGE, REGULATOR, GOVT_PIB, TIER1_MEDIA, DISCOVERY
  reliability_tier INTEGER NOT NULL, -- 1, 2, 3
  attribution_req TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  last_fetched_at TEXT,
  error_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS news_articles (
  id TEXT PRIMARY KEY,
  source_id TEXT REFERENCES data_sources(id),
  external_id TEXT,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  canonical_url TEXT,
  author TEXT,
  summary TEXT,
  content_snippet TEXT,
  published_at TEXT NOT NULL,
  retrieved_at TEXT DEFAULT CURRENT_TIMESTAMP,
  event_category TEXT NOT NULL,
  verification_status TEXT NOT NULL, -- OFFICIALLY_DISCLOSED, INDEPENDENTLY_CORROBORATED, REPORTED_AWAITING_CORROBORATION, PRELIMINARY_DEVELOPING, CORRECTED, RETRACTED, CONFLICTING_REPORTS
  verification_score INTEGER NOT NULL, -- 0-100
  verification_factors TEXT, -- JSON object
  is_demo INTEGER DEFAULT 0,
  raw_data TEXT
);

CREATE TABLE IF NOT EXISTS news_entities (
  id TEXT PRIMARY KEY,
  article_id TEXT REFERENCES news_articles(id),
  entity_type TEXT NOT NULL, -- COMPANY, SECTOR, COMMODITY, REGULATOR, MACRO_FACTOR
  entity_id TEXT,
  raw_mention TEXT NOT NULL,
  match_confidence INTEGER DEFAULT 100
);

CREATE TABLE IF NOT EXISTS impact_assessments (
  id TEXT PRIMARY KEY,
  article_id TEXT REFERENCES news_articles(id),
  company_id TEXT REFERENCES companies(id),
  exposure_type TEXT NOT NULL, -- DIRECT, INDIRECT, SECTOR_LEVEL
  potential_direction TEXT NOT NULL, -- POSITIVE, NEGATIVE, MIXED, UNCLEAR_NEGLIGIBLE
  impact_horizon TEXT NOT NULL, -- IMMEDIATE, SHORT_TERM, MEDIUM_TERM, LONG_TERM
  impact_score INTEGER NOT NULL, -- 0-100
  evidence_quality_score INTEGER NOT NULL, -- 0-100
  causal_chain TEXT, -- JSON array of steps
  explanation TEXT NOT NULL,
  key_facts TEXT, -- JSON array
  counterarguments TEXT, -- JSON array
  invalidation_conditions TEXT, -- JSON array
  model_version TEXT NOT NULL DEFAULT 'v1.0-deterministic',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS market_quotes (
  symbol TEXT PRIMARY KEY,
  exchange TEXT NOT NULL DEFAULT 'NSE',
  last_price REAL NOT NULL,
  change REAL NOT NULL,
  change_percent REAL NOT NULL,
  open REAL,
  high REAL,
  low REAL,
  previous_close REAL,
  volume INTEGER,
  market_status TEXT NOT NULL DEFAULT 'REGULAR',
  data_status TEXT NOT NULL DEFAULT 'DELAYED_15M',
  exchange_timestamp TEXT,
  retrieved_at TEXT DEFAULT CURRENT_TIMESTAMP,
  provider TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS historical_market_prices (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  date TEXT NOT NULL,
  open REAL NOT NULL,
  high REAL NOT NULL,
  low REAL NOT NULL,
  close REAL NOT NULL,
  volume INTEGER,
  adj_close REAL,
  benchmark_close REAL,
  UNIQUE(symbol, date)
);

CREATE TABLE IF NOT EXISTS historical_event_studies (
  id TEXT PRIMARY KEY,
  event_id TEXT,
  event_title TEXT NOT NULL,
  event_category TEXT NOT NULL,
  company_id TEXT REFERENCES companies(id),
  company_symbol TEXT NOT NULL,
  event_date TEXT NOT NULL,
  window_1d_return REAL,
  window_3d_return REAL,
  window_5d_return REAL,
  window_20d_return REAL,
  benchmark_1d_return REAL,
  benchmark_3d_return REAL,
  benchmark_5d_return REAL,
  benchmark_20d_return REAL,
  car_1d REAL,
  car_3d REAL,
  car_5d REAL,
  car_20d REAL,
  actual_direction TEXT,
  predicted_direction TEXT,
  directional_match INTEGER,
  sample_size INTEGER DEFAULT 1,
  confidence_interval REAL DEFAULT 0.95
);

CREATE TABLE IF NOT EXISTS watchlists (
  id TEXT PRIMARY KEY,
  user_id TEXT DEFAULT 'default_user',
  name TEXT NOT NULL DEFAULT 'Primary Watchlist',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS watchlist_items (
  id TEXT PRIMARY KEY,
  watchlist_id TEXT REFERENCES watchlists(id),
  symbol TEXT NOT NULL,
  alert_threshold REAL DEFAULT 2.0,
  notes TEXT,
  added_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(watchlist_id, symbol)
);

CREATE TABLE IF NOT EXISTS provider_health (
  provider_name TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'OPERATIONAL',
  last_check TEXT DEFAULT CURRENT_TIMESTAMP,
  latency_ms INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  quota_remaining TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS ingestion_runs (
  id TEXT PRIMARY KEY,
  run_time TEXT DEFAULT CURRENT_TIMESTAMP,
  source_id TEXT,
  articles_fetched INTEGER DEFAULT 0,
  duplicates_dropped INTEGER DEFAULT 0,
  assessments_generated INTEGER DEFAULT 0,
  status TEXT DEFAULT 'COMPLETED',
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_news_published ON news_articles(published_at);
CREATE INDEX IF NOT EXISTS idx_impact_article ON impact_assessments(article_id);
CREATE INDEX IF NOT EXISTS idx_impact_company ON impact_assessments(company_id);
CREATE INDEX IF NOT EXISTS idx_hist_prices_sym ON historical_market_prices(symbol, date);
