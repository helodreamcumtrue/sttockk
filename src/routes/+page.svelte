<script>
  import DataBadge from '$lib/components/DataBadge.svelte';
  import VerificationBadge from '$lib/components/VerificationBadge.svelte';
  import DirectionBadge from '$lib/components/DirectionBadge.svelte';
  import {
    RefreshIcon,
    TrendingUpIcon,
    TrendingDownIcon,
    ArrowUpRightIcon,
    SearchIcon,
    SlidersIcon
  } from '$lib/components/icons/index.js';

  let { data: pageData } = $props();

  let liveData = $state(null);
  let isLoading = $state(false);
  let error = $state(null);

  // Screener tab state
  let activeScreenerTab = $state('ALL'); // 'ALL' | 'GAINERS' | 'LOSERS' | 'LARGECAP'
  let homeSearchQuery = $state('');
  let selectedSectorFilter = $state('ALL');

  // Selected Macro Index for the top interactive preview
  let selectedIndexId = $state('nifty50');

  // Selected news article index
  let selectedArticleIndex = $state(0);

  // Shock Simulation Scenario state
  let selectedShockPreset = $state('CRUDE_HIKE');

  const shockScenarios = {
    CRUDE_HIKE: {
      name: 'Brent Crude Hike (+10%)',
      driver: 'Brent Crude $88 -> $97/bbl',
      niftyImpact: '-0.85%',
      energyImpact: '+3.40%',
      aviationImpact: '-5.20%',
      paintsImpact: '-4.10%',
      notes: 'Gross refining margins expand for upstream drillers (ONGC, Reliance); high ATF and petrochemical feedstock squeeze aviation and FMCG margins.'
    },
    REPO_HIKE: {
      name: 'RBI Repo Rate Hike (+25 bps)',
      driver: 'RBI Repo Rate 6.50% -> 6.75%',
      niftyImpact: '-0.65%',
      energyImpact: '-0.20%',
      aviationImpact: '-0.90%',
      bankingImpact: '-1.40%',
      autoImpact: '-2.80%',
      notes: 'Higher retail borrowing costs dampen auto loans and housing disbursements; banking treasury bond books record MTM compression.'
    },
    USD_INR_WEAK: {
      name: 'Rupee Depreciation (-1.5% vs USD)',
      driver: 'USD/INR 84.10 -> 85.35',
      niftyImpact: '+0.25%',
      itImpact: '+3.10%',
      pharmaImpact: '+2.40%',
      aviationImpact: '-3.80%',
      notes: 'Export-heavy sectors (TCS, Infosys, Sun Pharma) see margin expansion; dollar-denominated import and aircraft lease expenses increase.'
    }
  };

  const data = $derived(liveData || pageData?.overview || null);

  const allStocks = $derived(data?.all_stocks || []);

  // Filtered screener stocks
  const displayedStocks = $derived.by(() => {
    let list = [...allStocks];

    if (activeScreenerTab === 'GAINERS') {
      list = list.filter(s => s.change > 0).sort((a, b) => b.change_percent - a.change_percent);
    } else if (activeScreenerTab === 'LOSERS') {
      list = list.filter(s => s.change < 0).sort((a, b) => a.change_percent - b.change_percent);
    } else if (activeScreenerTab === 'LARGECAP') {
      list = list.filter(s => s.market_cap_category === 'LARGE_CAP');
    }

    if (selectedSectorFilter !== 'ALL') {
      list = list.filter(s => s.sector_name?.toLowerCase().includes(selectedSectorFilter.toLowerCase()));
    }

    if (homeSearchQuery.trim()) {
      const q = homeSearchQuery.toLowerCase();
      list = list.filter(s => s.symbol.toLowerCase().includes(q) || s.company_name?.toLowerCase().includes(q));
    }

    return list;
  });

  const newsArticles = $derived(data?.high_significance_news || []);
  const activeArticle = $derived(newsArticles[selectedArticleIndex] || newsArticles[0] || null);
  const currentScenario = $derived(shockScenarios[selectedShockPreset] || shockScenarios.CRUDE_HIKE);

  async function refreshData() {
    isLoading = true;
    error = null;
    try {
      const res = await fetch('/api/market/overview');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      liveData = await res.json();
    } catch (err) {
      error = err.message;
    } finally {
      isLoading = false;
    }
  }

  // Pre-configured major market benchmarks
  const defaultIndices = [
    { id: 'nifty50', name: 'NIFTY 50', value: '24,850.30', change: '+112.40', pct: '+0.45%', isUp: true, sparkline: [40, 42, 45, 43, 48, 52, 55, 53, 58] },
    { id: 'sensex', name: 'SENSEX', value: '81,450.80', change: '+345.10', pct: '+0.43%', isUp: true, sparkline: [120, 125, 122, 130, 135, 134, 140, 142] },
    { id: 'banknifty', name: 'NIFTY BANK', value: '51,200.15', change: '+315.60', pct: '+0.62%', isUp: true, sparkline: [70, 72, 75, 78, 76, 82, 85, 88] },
    { id: 'niftyit', name: 'NIFTY IT', value: '38,940.50', change: '-115.20', pct: '-0.29%', isUp: false, sparkline: [95, 92, 90, 93, 88, 86, 85, 84] },
    { id: 'brent', name: 'BRENT CRUDE', value: '$88.40', change: '+2.15', pct: '+2.49%', isUp: true, sparkline: [82, 83, 84, 85, 86, 87, 88] },
    { id: 'usdinr', name: 'USD / INR', value: '₹84.12', change: '+0.08', pct: '+0.10%', isUp: true, sparkline: [83.9, 84.0, 84.05, 84.10, 84.12] }
  ];

  const currentBenchmark = $derived(
    defaultIndices.find(i => i.id === selectedIndexId) || defaultIndices[0]
  );
</script>

<svelte:head>
  <title>Market Overview & Stock Screener — MarketPulse Finance</title>
</svelte:head>

<div class="space-y-6">
  <!-- Top Google Finance Header: Markets Summary & Action Bar -->
  <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
    <div>
      <h1 class="text-xl md:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
        <span>Indian Markets & Equity Screener</span>
        <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
          NSE & BSE
        </span>
      </h1>
      <p class="text-xs text-slate-500 mt-0.5">
        Real-time financial intelligence, valuation metrics, and news transmission impact for listed equities.
      </p>
    </div>

    <div class="flex items-center gap-2">
      <button
        onclick={refreshData}
        disabled={isLoading}
        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
      >
        <RefreshIcon size={13} class={isLoading ? 'animate-spin' : ''} />
        <span>{isLoading ? 'Updating...' : 'Refresh Quotes'}</span>
      </button>

      <a
        href="/companies"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
      >
        <SlidersIcon size={13} />
        <span>Open Full Screener</span>
      </a>
    </div>
  </div>

  <!-- Google Finance Style Benchmark Indices Cards Strip -->
  <div>
    <div class="flex items-center justify-between mb-2">
      <span class="text-xs font-bold uppercase tracking-wider text-slate-500">
        Benchmark Indices & Commodities
      </span>
      <span class="text-[11px] text-slate-400">
        Click to inspect benchmark trend
      </span>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {#each defaultIndices as idx}
        {@const isSelected = selectedIndexId === idx.id}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          onclick={() => selectedIndexId = idx.id}
          class="p-3 rounded-lg border transition-all cursor-pointer bg-white shadow-2xs hover:shadow-xs {isSelected ? 'border-blue-600 ring-2 ring-blue-500/20' : 'border-slate-200 hover:border-slate-300'}"
        >
          <div class="text-[11px] font-semibold text-slate-500 truncate">{idx.name}</div>
          <div class="text-base font-bold text-slate-900 font-mono tabular-nums mt-0.5">{idx.value}</div>
          <div class="flex items-center justify-between mt-1 text-xs font-mono font-semibold tabular-nums">
            <span class="{idx.isUp ? 'text-emerald-700' : 'text-rose-700'}">
              {idx.change} ({idx.pct})
            </span>
            <!-- Mini SVG Sparkline -->
            <svg class="w-10 h-4 stroke-2 fill-none {idx.isUp ? 'stroke-emerald-600' : 'stroke-rose-600'}" viewBox="0 0 40 16">
              <polyline points="0,12 8,10 16,13 24,7 32,8 40,3"></polyline>
            </svg>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Google Finance / Yahoo Finance Market Breadth Bar -->
  {#if data?.market_breadth}
    {@const b = data.market_breadth}
    {@const total = b.advances + b.declines + (b.unchanged || 0) || 1}
    {@const advPct = Math.round((b.advances / total) * 100)}
    {@const decPct = Math.round((b.declines / total) * 100)}
    <div class="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <span class="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Market Breadth (NSE):
        </span>
        <div class="flex items-center gap-2 text-xs font-semibold font-mono">
          <span class="text-emerald-700 inline-flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            Advances: {b.advances} ({advPct}%)
          </span>
          <span class="text-slate-300">•</span>
          <span class="text-rose-700 inline-flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-rose-500"></span>
            Declines: {b.declines} ({decPct}%)
          </span>
          {#if b.unchanged}
            <span class="text-slate-300">•</span>
            <span class="text-slate-500">Unchanged: {b.unchanged}</span>
          {/if}
        </div>
      </div>

      <!-- Ratio Bar -->
      <div class="flex-1 max-w-xs h-2 rounded-full bg-slate-100 overflow-hidden flex">
        <div class="bg-emerald-500 h-full transition-all" style="width: {advPct}%"></div>
        <div class="bg-rose-500 h-full transition-all" style="width: {decPct}%"></div>
      </div>

      <div class="text-[11px] text-slate-500 font-medium">
        Feed: <span class="font-semibold text-slate-700">NSE 15M Delayed</span>
      </div>
    </div>
  {/if}

  <!-- MAIN SECTION: Yahoo Finance Screener Table -->
  <div class="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
    <!-- Screener Header & Filter Tabs -->
    <div class="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <h2 class="text-base font-bold text-slate-900 tracking-tight">
          Equity Screener
        </h2>
        <span class="text-xs text-slate-500 font-medium">
          ({displayedStocks.length} equities matching criteria)
        </span>
      </div>

      <!-- Yahoo Finance Style Filter Tabs -->
      <div class="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium">
        <button
          onclick={() => activeScreenerTab = 'ALL'}
          class="px-3 py-1 rounded-md transition-colors cursor-pointer {activeScreenerTab === 'ALL' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'}"
        >
          All Equities
        </button>
        <button
          onclick={() => activeScreenerTab = 'GAINERS'}
          class="px-3 py-1 rounded-md transition-colors cursor-pointer {activeScreenerTab === 'GAINERS' ? 'bg-white text-emerald-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'}"
        >
          Top Gainers
        </button>
        <button
          onclick={() => activeScreenerTab = 'LOSERS'}
          class="px-3 py-1 rounded-md transition-colors cursor-pointer {activeScreenerTab === 'LOSERS' ? 'bg-white text-rose-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'}"
        >
          Top Losers
        </button>
        <button
          onclick={() => activeScreenerTab = 'LARGECAP'}
          class="px-3 py-1 rounded-md transition-colors cursor-pointer {activeScreenerTab === 'LARGECAP' ? 'bg-white text-blue-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'}"
        >
          Large Cap Bluechips
        </button>
      </div>
    </div>

    <!-- Quick Search & Sector Filter Bar -->
    <div class="px-4 py-2.5 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
      <div class="flex items-center gap-2 flex-1 max-w-sm">
        <div class="relative w-full">
          <SearchIcon size={14} class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            bind:value={homeSearchQuery}
            placeholder="Filter by symbol or company name..."
            class="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-md text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-xs"
          />
        </div>
      </div>

      <div class="flex items-center gap-2">
        <span class="text-slate-500 font-medium">Sector:</span>
        <select
          bind:value={selectedSectorFilter}
          class="bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-blue-500 text-xs font-medium"
        >
          <option value="ALL">All Sectors</option>
          {#each data?.sectors || [] as s}
            <option value={s.name}>{s.name}</option>
          {/each}
        </select>
      </div>
    </div>

    <!-- Screener Data Table -->
    <div class="overflow-x-auto">
      <table class="screener-table">
        <thead>
          <tr>
            <th class="text-left">Symbol & Company</th>
            <th class="text-left">Sector / Sub-Industry</th>
            <th class="text-right">Last Price (₹)</th>
            <th class="text-right">Day Change</th>
            <th class="text-right">Day Range (L - H)</th>
            <th class="text-right">Volume</th>
            <th class="text-left">Macro Sensitivity</th>
            <th class="text-center">Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          {#each displayedStocks as stock}
            <tr class="hover:bg-slate-50/80 transition-colors">
              <!-- Symbol & Name -->
              <td>
                <div class="flex items-center gap-2">
                  <a
                    href="/company/{stock.symbol}"
                    class="font-bold text-blue-600 hover:text-blue-800 hover:underline tracking-tight font-mono text-sm"
                  >
                    {stock.symbol}
                  </a>
                  <span class="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                    NSE
                  </span>
                </div>
                <div class="text-xs text-slate-500 truncate max-w-[200px]">
                  {stock.company_name}
                </div>
              </td>

              <!-- Sector -->
              <td>
                <div class="font-medium text-slate-800 text-xs">{stock.sector_name}</div>
                <div class="text-[11px] text-slate-400">{stock.sub_industry}</div>
              </td>

              <!-- Last Price -->
              <td class="text-right font-mono font-bold text-slate-900 tabular-nums">
                ₹{stock.last_price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>

              <!-- Change Badge (Google Finance rounded pill) -->
              <td class="text-right">
                <span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-bold tabular-nums {stock.change >= 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}">
                  {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.change_percent >= 0 ? '+' : ''}{stock.change_percent.toFixed(2)}%)
                </span>
              </td>

              <!-- Day Range -->
              <td class="text-right text-xs font-mono tabular-nums text-slate-600">
                ₹{stock.low.toFixed(1)} - ₹{stock.high.toFixed(1)}
              </td>

              <!-- Volume -->
              <td class="text-right text-xs font-mono tabular-nums text-slate-600">
                {stock.volume.toLocaleString('en-IN')}
              </td>

              <!-- Sensitivity -->
              <td>
                {#if stock.currency_sensitivity && stock.currency_sensitivity !== 'NEUTRAL'}
                  <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {stock.currency_sensitivity.replace(/_/g, ' ')}
                  </span>
                {:else if stock.export_exposure_pct > 20}
                  <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    Export: {stock.export_exposure_pct}%
                  </span>
                {:else}
                  <span class="text-[10px] text-slate-400">Domestic Core</span>
                {/if}
              </td>

              <!-- Screener Analysis Action -->
              <td class="text-center">
                <a
                  href="/company/{stock.symbol}"
                  class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 border border-blue-200 hover:border-blue-600 rounded-md transition-all cursor-pointer shadow-2xs"
                  title="View Screener.in analysis for {stock.symbol}"
                >
                  <span>Analyze</span>
                  <ArrowUpRightIcon size={12} />
                </a>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Screener Footer Link -->
    <div class="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
      <span>Showing {displayedStocks.length} equities with 15-minute delayed market quotes</span>
      <a href="/companies" class="text-blue-600 hover:text-blue-800 font-semibold hover:underline inline-flex items-center gap-1">
        <span>Open full multi-filter screener</span>
        <span>→</span>
      </a>
    </div>
  </div>

  <!-- Google Finance "Market Intelligence & Causal Transmission" Stream -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Left 2 Cols: News Articles List -->
    <div class="lg:col-span-2 space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <span>Financial Catalysts & Regulatory News</span>
          <span class="text-[11px] font-semibold text-slate-500 font-mono">
            {newsArticles.length} Monitored
          </span>
        </h2>
        <a href="/news" class="text-xs text-blue-600 hover:underline font-semibold">
          View all news →
        </a>
      </div>

      <div class="space-y-3">
        {#each newsArticles as article, index}
          {@const isSelected = selectedArticleIndex === index}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div
            onclick={() => selectedArticleIndex = index}
            class="p-4 bg-white border rounded-lg shadow-2xs hover:shadow-xs transition-all cursor-pointer {isSelected ? 'border-blue-600 ring-2 ring-blue-500/10' : 'border-slate-200 hover:border-slate-300'}"
          >
            <div class="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <div class="flex items-center gap-2 text-xs">
                <span class="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                  {article.source_name || 'Official Disclosure'}
                </span>
                <span class="text-slate-400">•</span>
                <span class="text-slate-500 font-mono text-[11px]">
                  {new Date(article.published_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST
                </span>
              </div>

              <VerificationBadge status={article.verification_status} score={article.verification_score} size="xs" />
            </div>

            <h3 class="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
              {article.title}
            </h3>

            {#if article.summary}
              <p class="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                {article.summary}
              </p>
            {/if}

            {#if article.assessments?.length > 0}
              <div class="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-[11px]">
                <span class="text-slate-400 font-medium">Impacted:</span>
                {#each article.assessments as a}
                  <a
                    href="/company/{a.symbol}"
                    onclick={(e) => e.stopPropagation()}
                    class="inline-flex items-center gap-1 font-mono font-bold px-1.5 py-0.5 rounded text-[10px] {a.potential_direction === 'POSITIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : (a.potential_direction === 'NEGATIVE' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-700')}"
                  >
                    <span>{a.symbol}</span>
                    <span class="text-[9px] font-normal">({a.impact_score}/100)</span>
                  </a>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>

    <!-- Right 1 Col: Dynamic Transmission Panel -->
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-base font-bold text-slate-900 tracking-tight">
          Causal Transmission Engine
        </h2>
        <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold">
          DETERMINISTIC
        </span>
      </div>

      {#if activeArticle}
        <div class="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs space-y-4">
          <div>
            <div class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Selected Catalyst Event
            </div>
            <div class="text-xs font-bold text-slate-900 mt-0.5 leading-snug">
              {activeArticle.title}
            </div>
          </div>

          {#if activeArticle.assessments?.length > 0}
            <div class="space-y-3">
              <div class="text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-1">
                Company Fundamental Impact
              </div>

              {#each activeArticle.assessments as a}
                <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-1.5">
                      <a href="/company/{a.symbol}" class="font-bold text-sm text-blue-600 hover:underline font-mono">
                        {a.symbol}
                      </a>
                      <span class="text-[11px] text-slate-500 font-sans">({a.company_name})</span>
                    </div>
                    <DirectionBadge direction={a.potential_direction} size="xs" />
                  </div>

                  <div class="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                    <span>Score: <strong class="text-slate-800">{a.impact_score}/100</strong></span>
                    <span>•</span>
                    <span>Horizon: <strong class="text-slate-800">{a.impact_horizon}</strong></span>
                  </div>

                  <p class="text-xs text-slate-600 leading-relaxed bg-white p-2.5 rounded border border-slate-200">
                    {a.explanation}
                  </p>

                  {#if a.causal_chain?.length > 0}
                    <div class="pt-1">
                      <div class="text-[10px] font-bold uppercase text-slate-500 mb-1">Causal Transmission Steps:</div>
                      <div class="space-y-1 text-xs text-slate-700">
                        {#each a.causal_chain as step, sIdx}
                          <div class="flex items-start gap-1.5">
                            <span class="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {sIdx + 1}
                            </span>
                            <span class="text-[11px] leading-tight">{step}</span>
                          </div>
                        {/each}
                      </div>
                    </div>
                  {/if}

                  <div class="pt-1">
                    <a
                      href="/company/{a.symbol}"
                      class="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 bg-white hover:bg-slate-100 text-blue-600 text-xs font-semibold rounded border border-slate-200 transition-colors shadow-2xs"
                    >
                      <span>Analyze {a.symbol} on Screener</span>
                      <ArrowUpRightIcon size={12} />
                    </a>
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <div class="p-6 text-center text-xs text-slate-400">
              No direct company impacts mapped for this general macro bulletin.
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>

  <!-- Interactive Macroeconomic Shock Simulator Box -->
  <div class="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
      <div>
        <h2 class="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <span>Macroeconomic Shock Scenario Simulator</span>
          <span class="text-xs font-mono font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
            Real-time Sensitivity Modeling
          </span>
        </h2>
        <p class="text-xs text-slate-500 mt-0.5">
          Select a macroeconomic shock to evaluate transmission through Indian corporate supply chains.
        </p>
      </div>

      <!-- Presets -->
      <div class="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium">
        {#each Object.entries(shockScenarios) as [key, scenario]}
          <button
            onclick={() => selectedShockPreset = key}
            class="px-2.5 py-1 rounded-md transition-all cursor-pointer {selectedShockPreset === key ? 'bg-white text-blue-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'}"
          >
            {scenario.name}
          </button>
        {/each}
      </div>
    </div>

    {#if currentScenario}
      {@const s = currentScenario}
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
          <div class="text-[10px] uppercase font-bold text-slate-400">Shock Magnitude</div>
          <div class="text-sm font-bold text-slate-800 font-mono">{s.driver}</div>
        </div>

        <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
          <div class="text-[10px] uppercase font-bold text-slate-400">Projected NIFTY 50 Reaction</div>
          <div class="text-sm font-bold font-mono {s.niftyImpact.startsWith('+') ? 'text-emerald-700' : 'text-rose-700'}">
            {s.niftyImpact}
          </div>
        </div>

        <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
          <div class="text-[10px] uppercase font-bold text-slate-400">Key Sector Disruption</div>
          <div class="text-xs font-mono font-semibold space-y-0.5">
            {#if s.energyImpact}<div class="{s.energyImpact.startsWith('+') ? 'text-emerald-700' : 'text-rose-700'}">Energy: {s.energyImpact}</div>{/if}
            {#if s.aviationImpact}<div class="{s.aviationImpact.startsWith('+') ? 'text-emerald-700' : 'text-rose-700'}">Aviation: {s.aviationImpact}</div>{/if}
            {#if s.itImpact}<div class="{s.itImpact.startsWith('+') ? 'text-emerald-700' : 'text-rose-700'}">IT Services: {s.itImpact}</div>{/if}
            {#if s.bankingImpact}<div class="{s.bankingImpact.startsWith('+') ? 'text-emerald-700' : 'text-rose-700'}">Banking: {s.bankingImpact}</div>{/if}
          </div>
        </div>

        <div class="p-3.5 bg-blue-50/70 border border-blue-200 rounded-lg space-y-1">
          <div class="text-[10px] uppercase font-bold text-blue-700">Transmission Channel</div>
          <p class="text-xs text-slate-700 leading-relaxed font-sans">
            {s.notes}
          </p>
        </div>
      </div>
    {/if}
  </div>
</div>
