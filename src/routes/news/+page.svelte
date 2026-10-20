<script>
  import { onMount } from 'svelte';
  import VerificationBadge from '$lib/components/VerificationBadge.svelte';
  import DirectionBadge from '$lib/components/DirectionBadge.svelte';
  import DataBadge from '$lib/components/DataBadge.svelte';
  import { ArrowRightIcon, ArrowUpRightIcon, CloseIcon, SearchIcon, SlidersIcon } from '$lib/components/icons';

  let articles = $state([]);
  let sectors = $state([]);
  let isLoading = $state(true);
  let error = $state(null);

  // Filter state
  let searchQuery = $state('');
  let selectedSector = $state('');
  let selectedCategory = $state('');
  let selectedVerification = $state('');
  let selectedDirection = $state('');

  // Custom simulation modal
  let showCustomModal = $state(false);
  let customTitle = $state('');
  let customSummary = $state('');
  let customCategory = $state('COMMODITY_PRICE_SHOCK');
  let isSimulating = $state(false);

  async function fetchNews() {
    isLoading = true;
    error = null;
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (selectedSector) params.set('sector', selectedSector);
      if (selectedCategory) params.set('category', selectedCategory);
      if (selectedVerification) params.set('verification', selectedVerification);
      if (selectedDirection) params.set('direction', selectedDirection);

      const [newsRes, secRes] = await Promise.all([
        fetch(`/api/news?${params.toString()}`).then(r => r.json()),
        fetch('/api/sectors').then(r => r.json())
      ]);

      articles = newsRes.articles || [];
      sectors = secRes.sectors || [];
    } catch (err) {
      error = err.message;
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    fetchNews();
  });

  async function handleCustomSimulation(e) {
    e.preventDefault();
    if (!customTitle) return;

    isSimulating = true;
    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'custom',
          article: {
            title: customTitle,
            summary: customSummary,
            content_snippet: customSummary || customTitle,
            event_category: customCategory,
            published_at: new Date().toISOString(),
            reliability_tier: 2,
            corroboration_count: 2
          }
        })
      });

      if (res.ok) {
        showCustomModal = false;
        customTitle = '';
        customSummary = '';
        await fetchNews();
      }
    } catch (err) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      isSimulating = false;
    }
  }

  function resetFilters() {
    searchQuery = '';
    selectedSector = '';
    selectedCategory = '';
    selectedVerification = '';
    selectedDirection = '';
    fetchNews();
  }
</script>

<svelte:head>
  <title>Financial News & Catalysts Intelligence — MarketPulse Finance</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header Bar -->
  <div class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
    <div>
      <div class="flex items-center gap-2">
        <h1 class="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
          Financial News & Market Catalysts
        </h1>
        <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
          Google Finance Style
        </span>
      </div>
      <p class="text-xs text-slate-500 mt-1">
        Evidence-backed news-to-company impact tracking for Indian equities listed on NSE and BSE.
      </p>
    </div>

    <div class="flex items-center gap-3">
      <button
        onclick={() => showCustomModal = true}
        class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
      >
        <span>+ Analyze Custom Event Scenario</span>
      </button>
    </div>
  </div>

  <!-- Search & Filter Controls -->
  <div class="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs space-y-3">
    <!-- Search Bar -->
    <div class="flex items-center gap-2">
      <div class="relative flex-1">
        <SearchIcon size={14} class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          bind:value={searchQuery}
          onkeydown={(e) => e.key === 'Enter' && fetchNews()}
          placeholder="Search news events by keyword (e.g. Brent crude, repo rate, Form 483, Capex)..."
          class="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500"
        />
      </div>

      <button
        onclick={fetchNews}
        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
      >
        Search
      </button>

      <button
        onclick={resetFilters}
        class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium cursor-pointer transition-colors"
      >
        Reset
      </button>
    </div>

    <!-- Filter Dropdowns -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
      <!-- Sector Filter -->
      <select
        bind:value={selectedSector}
        onchange={fetchNews}
        class="bg-slate-50 border border-slate-200 rounded-md p-1.5 text-slate-700 focus:outline-none focus:border-blue-500 font-medium"
      >
        <option value="">All Sectors</option>
        {#each sectors as s}
          <option value={s.id}>{s.name}</option>
        {/each}
      </select>

      <!-- Category Filter -->
      <select
        bind:value={selectedCategory}
        onchange={fetchNews}
        class="bg-slate-50 border border-slate-200 rounded-md p-1.5 text-slate-700 focus:outline-none focus:border-blue-500 font-medium"
      >
        <option value="">All Categories</option>
        <option value="COMMODITY_PRICE_SHOCK">Commodity Shock</option>
        <option value="INTEREST_RATE_DECISION">Interest Rate Decision</option>
        <option value="REGULATORY_CHANGE">Regulatory Change</option>
        <option value="GOVERNMENT_POLICIES">Government Policy / Capex</option>
        <option value="FRAUD_INVESTIGATION">Investigation</option>
        <option value="EARNINGS_SURPRISE">Earnings Surprise</option>
      </select>

      <!-- Verification Status Filter -->
      <select
        bind:value={selectedVerification}
        onchange={fetchNews}
        class="bg-slate-50 border border-slate-200 rounded-md p-1.5 text-slate-700 focus:outline-none focus:border-blue-500 font-medium"
      >
        <option value="">All Verification Tiers</option>
        <option value="OFFICIALLY_DISCLOSED">Officially Disclosed</option>
        <option value="INDEPENDENTLY_CORROBORATED">Independently Corroborated</option>
        <option value="PRELIMINARY_DEVELOPING">Preliminary / Developing</option>
        <option value="RETRACTED">Retracted</option>
      </select>

      <!-- Impact Direction Filter -->
      <select
        bind:value={selectedDirection}
        onchange={fetchNews}
        class="bg-slate-50 border border-slate-200 rounded-md p-1.5 text-slate-700 focus:outline-none focus:border-blue-500 font-medium"
      >
        <option value="">All Directions</option>
        <option value="POSITIVE">Positive / Bullish</option>
        <option value="NEGATIVE">Negative / Bearish</option>
        <option value="MIXED">Mixed / Neutral</option>
      </select>
    </div>
  </div>

  <!-- News Stream Cards -->
  {#if isLoading}
    <div class="py-16 text-center font-mono text-xs text-slate-400 space-y-2">
      <div class="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p class="font-sans text-slate-600 font-medium text-xs">Filtering financial intelligence stream...</p>
    </div>
  {:else if error}
    <div class="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
      Error loading news: {error}
    </div>
  {:else if articles.length === 0}
    <div class="p-12 text-center bg-white border border-slate-200 rounded-lg shadow-2xs text-xs text-slate-500">
      <p>No intelligence reports match your current filter parameters.</p>
      <button onclick={resetFilters} class="mt-2 text-blue-600 font-semibold underline cursor-pointer">
        Reset filters
      </button>
    </div>
  {:else}
    <div class="space-y-4">
      {#each articles as a}
        <article class="bg-white border border-slate-200 hover:border-slate-300 rounded-lg p-5 shadow-2xs hover:shadow-xs transition-all space-y-3">
          <!-- Top Metadata Bar -->
          <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase font-semibold text-[10px]">
                {a.event_category.replace(/_/g, ' ')}
              </span>
              {#if a.is_demo}
                <DataBadge status="SYNTHETIC_DEMO" size="xs" />
              {/if}
              <span class="text-slate-400 text-xs">
                {new Date(a.published_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} IST
              </span>
            </div>

            <VerificationBadge status={a.verification_status} score={a.verification_score} size="xs" />
          </div>

          <!-- Headline -->
          <h2 class="text-base font-bold text-slate-900 hover:text-blue-600 transition-colors">
            <a href="/news/{a.id}">{a.title}</a>
          </h2>

          <!-- Summary Snippet -->
          <p class="text-xs text-slate-600 leading-relaxed">
            {a.summary}
          </p>

          <!-- Affected Companies Impact Matrix Pills -->
          {#if a.affected_companies && a.affected_companies.length > 0}
            <div class="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
              <span class="text-[10px] uppercase text-slate-400 font-bold mr-1">
                AFFECTED EQUITIES:
              </span>
              {#each a.affected_companies as comp}
                <a
                  href="/company/{comp.symbol}"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-50 border border-slate-200 hover:border-blue-500 transition-colors text-xs font-mono"
                >
                  <span class="font-bold text-blue-600">{comp.symbol}</span>
                  <DirectionBadge direction={comp.potential_direction} size="sm" />
                  <span class="text-[10px] text-slate-500 font-semibold" title="Impact Evidence Score">
                    ({comp.impact_score}/100)
                  </span>
                </a>
              {/each}
            </div>
          {/if}

          <!-- Footer Action Bar -->
          <div class="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <div class="flex items-center gap-2">
              <span>Source: <strong class="text-slate-700">{a.source?.name || 'Accredited Wire'}</strong></span>
              <span>•</span>
              <a href={a.url} target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline inline-flex items-center gap-1">
                <span>Original Filing</span>
                <ArrowUpRightIcon size={11} />
              </a>
            </div>

            <a
              href="/news/{a.id}"
              class="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
            >
              <span>Trace Causal Impact & Event Analogues</span>
              <ArrowRightIcon size={12} />
            </a>
          </div>
        </article>
      {/each}
    </div>
  {/if}
</div>

<!-- Modal for Custom Event Simulation / Analysis -->
{#if showCustomModal}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
    onclick={() => showCustomModal = false}
  >
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
      class="bg-white border border-slate-200 w-full max-w-lg rounded-xl p-6 shadow-xl space-y-4"
      onclick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-label="Analyze Event Scenario"
      tabindex="-1"
    >
      <div class="flex items-center justify-between border-b border-slate-200 pb-3">
        <h3 class="text-sm font-bold uppercase text-slate-800">
          Simulate News-to-Impact Analysis
        </h3>
        <button onclick={() => showCustomModal = false} class="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded hover:bg-slate-100 transition-colors">
          <CloseIcon size={14} />
        </button>
      </div>

      <form onsubmit={handleCustomSimulation} class="space-y-4 text-xs">
        <div>
          <label for="event-title" class="block text-slate-700 mb-1 font-bold">Event Headline / Title</label>
          <input
            id="event-title"
            type="text"
            bind:value={customTitle}
            placeholder="e.g. Brent Crude Spikes to $98 as Tanker Transit Halts..."
            class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label for="event-category" class="block text-slate-700 mb-1 font-bold">Event Category</label>
          <select
            id="event-category"
            bind:value={customCategory}
            class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500"
          >
            <option value="COMMODITY_PRICE_SHOCK">Commodity Price Shock</option>
            <option value="INTEREST_RATE_DECISION">Interest Rate Decision (RBI)</option>
            <option value="REGULATORY_CHANGE">Regulatory Change (SEBI / FDA / TRAI)</option>
            <option value="GOVERNMENT_POLICIES">Government Policy / Capex Outlay</option>
            <option value="EARNINGS_SURPRISE">Earnings Surprise</option>
          </select>
        </div>

        <div>
          <label for="event-summary" class="block text-slate-700 mb-1 font-bold">Factual Event Summary & Key Data</label>
          <textarea
            id="event-summary"
            bind:value={customSummary}
            rows="3"
            placeholder="Describe the economic event details and metrics..."
            class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500"
          ></textarea>
        </div>

        <div class="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
          <button
            type="button"
            onclick={() => showCustomModal = false}
            class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSimulating}
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg cursor-pointer transition-colors shadow-2xs"
          >
            {isSimulating ? 'Running Impact Engine...' : 'Run Deterministic Analysis'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
