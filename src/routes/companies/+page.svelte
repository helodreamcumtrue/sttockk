<script>
  import { onMount } from 'svelte';
  import DataBadge from '$lib/components/DataBadge.svelte';
  import {
    SearchIcon,
    SlidersIcon,
    ArrowUpRightIcon,
    TrendingUpIcon,
    TrendingDownIcon,
    BookmarkIcon
  } from '$lib/components/icons';

  let companies = $state([]);
  let sectors = $state([]);
  let watchlist = $state([]);
  let isLoading = $state(true);
  let error = $state(null);

  // Filters & State
  let searchQuery = $state('');
  let selectedSector = $state('');
  let selectedCapCategory = $state('');
  let selectedPreset = $state('ALL'); // 'ALL' | 'LARGECAP' | 'GAINERS' | 'LOSERS' | 'EXPORT' | 'CRUDE' | 'RATE'
  let activeTableView = $state('OVERVIEW'); // 'OVERVIEW' | 'FUNDAMENTALS' | 'EXPOSURES'
  let sortBy = $state('market_cap'); // 'market_cap' | 'price_desc' | 'change_desc' | 'change_asc' | 'export_desc'

  async function loadData() {
    isLoading = true;
    error = null;
    try {
      const [compRes, secRes, wlRes] = await Promise.all([
        fetch('/api/companies').then(r => r.json()),
        fetch('/api/sectors').then(r => r.json()),
        fetch('/api/watchlist').then(r => r.json()).catch(() => ({ items: [] }))
      ]);

      companies = compRes.companies || [];
      sectors = secRes.sectors || [];
      watchlist = (wlRes.items || []).map(i => i.symbol);
    } catch (err) {
      error = err.message;
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    loadData();
  });

  async function toggleWatchlist(symbol, e) {
    e.stopPropagation();
    try {
      if (watchlist.includes(symbol)) {
        await fetch(`/api/watchlist?symbol=${symbol}`, { method: 'DELETE' });
        watchlist = watchlist.filter(s => s !== symbol);
      } else {
        await fetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol, alert_threshold: 2.0 })
        });
        watchlist = [...watchlist, symbol];
      }
    } catch (err) {
      console.error('Watchlist toggle error:', err);
    }
  }

  // Preset Filters
  function applyPreset(presetKey) {
    selectedPreset = presetKey;
    if (presetKey === 'ALL') {
      selectedSector = '';
      selectedCapCategory = '';
      searchQuery = '';
    } else if (presetKey === 'LARGECAP') {
      selectedCapCategory = 'LARGE_CAP';
    } else if (presetKey === 'EXPORT') {
      sortBy = 'export_desc';
    }
  }

  // Filtered and Sorted Securities
  const filteredCompanies = $derived.by(() => {
    let list = [...companies];

    // Presets
    if (selectedPreset === 'GAINERS') {
      list = list.filter(c => (c.change_percent || 0) > 0);
    } else if (selectedPreset === 'LOSERS') {
      list = list.filter(c => (c.change_percent || 0) < 0);
    } else if (selectedPreset === 'EXPORT') {
      list = list.filter(c => (c.export_exposure_pct || 0) >= 25);
    } else if (selectedPreset === 'CRUDE') {
      list = list.filter(c => c.commodity_sensitivities?.crude_oil || c.sector_code === 'ENERGY' || c.sector_code === 'AVIATION');
    } else if (selectedPreset === 'RATE') {
      list = list.filter(c => c.interest_rate_sensitivity?.includes('NEGATIVE') || c.sector_code === 'BANKING' || c.sector_code === 'AUTO');
    }

    // Sector
    if (selectedSector) {
      list = list.filter(c => c.sector_id === selectedSector || c.sector_name === selectedSector);
    }

    // Cap Category
    if (selectedCapCategory) {
      list = list.filter(c => c.market_cap_category === selectedCapCategory);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c =>
        c.symbol.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.sub_industry?.toLowerCase().includes(q)
      );
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'price_desc') return (b.last_price || 0) - (a.last_price || 0);
      if (sortBy === 'change_desc') return (b.change_percent || 0) - (a.change_percent || 0);
      if (sortBy === 'change_asc') return (a.change_percent || 0) - (b.change_percent || 0);
      if (sortBy === 'export_desc') return (b.export_exposure_pct || 0) - (a.export_exposure_pct || 0);
      return (b.last_price || 0) * 1000 - (a.last_price || 0) * 1000;
    });

    return list;
  });

  function exportCSV() {
    const headers = ['Symbol', 'Company Name', 'Sector', 'Sub-Industry', 'Market Cap', 'Price (INR)', 'Change %', 'Export %', 'Import %', 'Currency Sensitivity'];
    const rows = filteredCompanies.map(c => [
      c.symbol,
      `"${c.name}"`,
      `"${c.sector_name || ''}"`,
      `"${c.sub_industry || ''}"`,
      c.market_cap_category,
      c.last_price || 0,
      c.change_percent || 0,
      c.export_exposure_pct || 0,
      c.import_exposure_pct || 0,
      c.currency_sensitivity || 'NEUTRAL'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `indian_equities_screener_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
</script>

<svelte:head>
  <title>Indian Equities Stock Screener — Yahoo & Google Finance Style</title>
</svelte:head>

<div class="space-y-6">
  <!-- Screener Hero Header -->
  <div class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
    <div>
      <div class="flex items-center gap-2">
        <h1 class="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
          Indian Equities Stock Screener
        </h1>
        <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
          Yahoo & Google Finance
        </span>
      </div>
      <p class="text-xs text-slate-500 mt-1">
        Screen 15+ NSE & BSE listed equities across fundamentals, trading multiples, and macroeconomic sensitivities.
      </p>
    </div>

    <!-- Quick Export -->
    <div class="flex items-center gap-2">
      <button
        onclick={exportCSV}
        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
        title="Download screened results as CSV file"
      >
        <svg class="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span>Export CSV</span>
      </button>

      <a
        href="/"
        class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
      >
        <span>Markets Overview</span>
        <ArrowUpRightIcon size={12} />
      </a>
    </div>
  </div>

  <!-- Yahoo Finance Style Preset Quick Filter Pills -->
  <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
    <span class="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1 shrink-0">
      Presets:
    </span>
    {#each [
      { id: 'ALL', label: 'All Stocks' },
      { id: 'LARGECAP', label: 'Large Cap Leaders' },
      { id: 'GAINERS', label: 'Top Gainers (Bullish)' },
      { id: 'LOSERS', label: 'Top Losers (Bearish)' },
      { id: 'EXPORT', label: 'High Export Exposure (>25%)' },
      { id: 'CRUDE', label: 'Crude Oil Sensitive' },
      { id: 'RATE', label: 'Interest Rate Sensitive' }
    ] as preset}
      <button
        onclick={() => applyPreset(preset.id)}
        class="px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer {selectedPreset === preset.id ? 'bg-blue-600 text-white shadow-2xs' : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'}"
      >
        {preset.label}
      </button>
    {/each}
  </div>

  <!-- Yahoo Screener Filter Bar -->
  <div class="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs space-y-3">
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
      <!-- Search Input -->
      <div>
        <label for="screener-search-input" class="block text-[11px] font-bold uppercase text-slate-500 mb-1">Search Security</label>
        <div class="relative">
          <SearchIcon size={14} class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="screener-search-input"
            type="text"
            bind:value={searchQuery}
            placeholder="Symbol or name (e.g. RELIANCE)..."
            class="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500"
          />
        </div>
      </div>

      <!-- Sector Dropdown -->
      <div>
        <label for="screener-sector-select" class="block text-[11px] font-bold uppercase text-slate-500 mb-1">Sector</label>
        <select
          id="screener-sector-select"
          bind:value={selectedSector}
          class="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:bg-white focus:border-blue-500"
        >
          <option value="">All Sectors (10)</option>
          {#each sectors as s}
            <option value={s.id}>{s.name}</option>
          {/each}
        </select>
      </div>

      <!-- Market Cap Category -->
      <div>
        <label for="screener-market-cap-select" class="block text-[11px] font-bold uppercase text-slate-500 mb-1">Market Cap</label>
        <select
          id="screener-market-cap-select"
          bind:value={selectedCapCategory}
          class="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:bg-white focus:border-blue-500"
        >
          <option value="">All Categories</option>
          <option value="LARGE_CAP">Large Cap (>₹50,000 Cr)</option>
          <option value="MID_CAP">Mid Cap</option>
          <option value="SMALL_CAP">Small Cap</option>
        </select>
      </div>

      <!-- Sort By -->
      <div>
        <label for="screener-sort-select" class="block text-[11px] font-bold uppercase text-slate-500 mb-1">Sort By</label>
        <select
          id="screener-sort-select"
          bind:value={sortBy}
          class="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:bg-white focus:border-blue-500"
        >
          <option value="market_cap">Market Cap / Relevance</option>
          <option value="price_desc">Last Price: High to Low</option>
          <option value="change_desc">Day Gain: High to Low (%)</option>
          <option value="change_asc">Day Loss: Low to High (%)</option>
          <option value="export_desc">Export Exposure: Highest First</option>
        </select>
      </div>
    </div>
  </div>

  <!-- Screener Results & View Switcher -->
  <div class="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
    <!-- View Switcher Bar (Yahoo Finance style) -->
    <div class="px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <span class="text-xs font-bold text-slate-700">
          Showing {filteredCompanies.length} of {companies.length} Equities
        </span>
        {#if selectedPreset !== 'ALL' || selectedSector || searchQuery}
          <button
            onclick={() => applyPreset('ALL')}
            class="text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer"
          >
            Clear filters
          </button>
        {/if}
      </div>

      <!-- Tab Views: Overview, Fundamentals, Exposures -->
      <div class="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md text-xs font-medium">
        <button
          onclick={() => activeTableView = 'OVERVIEW'}
          class="px-3 py-1 rounded transition-colors cursor-pointer {activeTableView === 'OVERVIEW' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'}"
        >
          Overview & Price
        </button>
        <button
          onclick={() => activeTableView = 'FUNDAMENTALS'}
          class="px-3 py-1 rounded transition-colors cursor-pointer {activeTableView === 'FUNDAMENTALS' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'}"
        >
          Valuation & Ratios
        </button>
        <button
          onclick={() => activeTableView = 'EXPOSURES'}
          class="px-3 py-1 rounded transition-colors cursor-pointer {activeTableView === 'EXPOSURES' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'}"
        >
          Macro & Sensitivities
        </button>
      </div>
    </div>

    {#if isLoading}
      <div class="py-20 text-center font-mono text-xs text-slate-400 space-y-3">
        <div class="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p>Scanning Indian equity fundamentals and market quotes...</p>
      </div>
    {:else if error}
      <div class="p-6 text-center text-rose-600 font-mono text-xs">
        Error loading screener data: {error}
      </div>
    {:else if filteredCompanies.length === 0}
      <div class="p-12 text-center text-slate-500 font-mono text-xs">
        No equities match your current screener criteria. Try clearing filters.
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="screener-table">
          <thead>
            <tr>
              <th class="w-10 text-center">★</th>
              <th class="text-left">Symbol & Exchange</th>
              <th class="text-left">Company Name</th>
              <th class="text-left">Sector & Industry</th>
              <th class="text-right">Price (₹)</th>
              <th class="text-right">Change</th>
              <th class="text-right">Change %</th>

              {#if activeTableView === 'OVERVIEW'}
                <th class="text-right">Market Cap</th>
                <th class="text-center">Feed Freshness</th>
              {:else if activeTableView === 'FUNDAMENTALS'}
                <th class="text-right">Cap Category</th>
                <th class="text-right">ISIN Code</th>
                <th class="text-center">Benchmark</th>
              {:else if activeTableView === 'EXPOSURES'}
                <th class="text-right">Export %</th>
                <th class="text-right">Import %</th>
                <th class="text-left">FX & Rate Sensitivity</th>
              {/if}

              <th class="text-center">Screener</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {#each filteredCompanies as c}
              {@const isWatched = watchlist.includes(c.symbol)}
              <tr class="hover:bg-slate-50/80 transition-colors">
                <!-- Watchlist Star -->
                <td class="text-center">
                  <button
                    onclick={(e) => toggleWatchlist(c.symbol, e)}
                    class="text-slate-300 hover:text-amber-400 transition-colors cursor-pointer p-1"
                    title={isWatched ? 'Remove from Watchlist' : 'Add to Watchlist'}
                  >
                    <BookmarkIcon size={14} filled={isWatched} class={isWatched ? 'text-amber-500 fill-amber-500' : ''} />
                  </button>
                </td>

                <!-- Symbol & Exchange -->
                <td>
                  <a
                    href="/company/{c.symbol}"
                    class="font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline text-sm"
                  >
                    {c.symbol}
                  </a>
                  <div class="text-[10px] text-slate-400 font-mono uppercase">{c.exchange || 'NSE'}</div>
                </td>

                <!-- Company Name -->
                <td>
                  <a href="/company/{c.symbol}" class="font-medium text-slate-900 text-xs hover:text-blue-600 block">
                    {c.name}
                  </a>
                </td>

                <!-- Sector & Industry -->
                <td>
                  <div class="text-xs font-medium text-slate-700">{c.sector_name || 'Broad Market'}</div>
                  <div class="text-[11px] text-slate-400">{c.sub_industry || '—'}</div>
                </td>

                <!-- Price -->
                <td class="text-right font-mono font-bold text-slate-900 tabular-nums">
                  ₹{c.last_price ? c.last_price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                </td>

                <!-- Absolute Change -->
                <td class="text-right font-mono font-semibold tabular-nums text-xs {c.change >= 0 ? 'text-emerald-700' : 'text-rose-700'}">
                  {c.change >= 0 ? '+' : ''}{c.change ? c.change.toFixed(2) : '0.00'}
                </td>

                <!-- % Change (Google Finance pill) -->
                <td class="text-right">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold tabular-nums {c.change_percent >= 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}">
                    {c.change_percent >= 0 ? '+' : ''}{c.change_percent ? c.change_percent.toFixed(2) : '0.00'}%
                  </span>
                </td>

                <!-- Tab-specific fields -->
                {#if activeTableView === 'OVERVIEW'}
                  <td class="text-right text-xs font-mono text-slate-600">
                    <span class="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                      {c.market_cap_category?.replace('_', ' ') || 'LARGE CAP'}
                    </span>
                  </td>
                  <td class="text-center">
                    <DataBadge status={c.data_status || 'DELAYED_15M'} size="xs" />
                  </td>
                {:else if activeTableView === 'FUNDAMENTALS'}
                  <td class="text-right text-xs font-mono text-slate-700">
                    {c.market_cap_category}
                  </td>
                  <td class="text-right text-xs font-mono text-slate-500">
                    {c.isin || '—'}
                  </td>
                  <td class="text-center text-xs font-mono text-slate-600">
                    {c.benchmark_index || 'NIFTY 50'}
                  </td>
                {:else if activeTableView === 'EXPOSURES'}
                  <td class="text-right text-xs font-mono font-bold tabular-nums {c.export_exposure_pct > 25 ? 'text-blue-700' : 'text-slate-600'}">
                    {c.export_exposure_pct || 0}%
                  </td>
                  <td class="text-right text-xs font-mono font-bold tabular-nums {c.import_exposure_pct > 25 ? 'text-amber-700' : 'text-slate-600'}">
                    {c.import_exposure_pct || 0}%
                  </td>
                  <td>
                    <div class="text-[11px] font-mono text-slate-700">{c.currency_sensitivity || 'NEUTRAL'}</div>
                    <div class="text-[10px] text-slate-400">{c.interest_rate_sensitivity || 'NEUTRAL'}</div>
                  </td>
                {/if}

                <!-- Action Button -->
                <td class="text-center">
                  <a
                    href="/company/{c.symbol}"
                    class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 border border-blue-200 hover:border-blue-600 rounded transition-all cursor-pointer shadow-2xs"
                    title="Open Screener.in analysis dashboard for {c.symbol}"
                  >
                    <span>Analyze</span>
                    <ArrowUpRightIcon size={11} />
                  </a>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>
