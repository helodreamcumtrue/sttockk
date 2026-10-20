<script>
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import DataBadge from '$lib/components/DataBadge.svelte';
  import VerificationBadge from '$lib/components/VerificationBadge.svelte';
  import { ArrowLeftIcon, ArrowRightIcon, ArrowUpRightIcon } from '$lib/components/icons';

  let sectorId = $derived(page.params.id);
  let data = $state(null);
  let isLoading = $state(true);
  let error = $state(null);

  async function loadSector() {
    isLoading = true;
    error = null;
    try {
      const res = await fetch(`/api/sectors/${sectorId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      data = await res.json();
    } catch (err) {
      error = err.message;
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    loadSector();
  });
</script>

<svelte:head>
  <title>{data ? data.sector.name : 'Sector Analysis'} — MarketPulse Finance</title>
</svelte:head>

<div class="space-y-6">
  <!-- Back link -->
  <div class="border-b border-slate-200 pb-2.5 flex items-center justify-between text-xs">
    <a href="/sectors" class="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1.5">
      <ArrowLeftIcon size={13} /> Back to All Sectors
    </a>
    <span class="text-slate-400 font-mono">Sector Intelligence & Constituents</span>
  </div>

  {#if isLoading}
    <div class="py-20 text-center font-mono text-xs text-slate-400 space-y-3">
      <div class="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p class="font-sans text-slate-600 font-medium text-xs">Loading sector profile and constituent performance...</p>
    </div>
  {:else if error}
    <div class="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono">
      Error: {error}
    </div>
  {:else if data}
    <!-- Sector Header Card -->
    <div class="screener-card p-6 space-y-4 bg-white">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">
          {data.sector.name}
        </h1>
        <span class="px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-mono text-xs font-bold border border-blue-200">
          Benchmark: {data.sector.benchmark_index}
        </span>
      </div>

      <p class="text-xs text-slate-600 leading-relaxed max-w-4xl">
        {data.sector.description}
      </p>

      <div class="pt-3 border-t border-slate-100">
        <div class="text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-wider">
          PRIMARY MACROECONOMIC SENSITIVITIES & DRIVERS:
        </div>
        <div class="flex flex-wrap gap-1.5">
          {#each data.sector.macro_drivers as md}
            <span class="px-2.5 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium">
              {md}
            </span>
          {/each}
        </div>
      </div>
    </div>

    <!-- Constituents Table (Screener.in format) -->
    <div class="screener-card p-6 space-y-4 bg-white">
      <div class="flex items-center justify-between border-b border-slate-200 pb-2">
        <h2 class="text-base font-bold text-slate-900">
          Constituent Equities ({data.companies.length})
        </h2>
        <span class="text-xs font-mono text-slate-500">NSE Delayed Quotes (15m)</span>
      </div>

      <div class="overflow-x-auto">
        <table class="screener-table">
          <thead>
            <tr>
              <th class="text-left">Symbol</th>
              <th class="text-left">Company Name</th>
              <th class="text-left">Sub-Industry</th>
              <th class="text-right">Cap Category</th>
              <th class="text-right">Last Price (₹)</th>
              <th class="text-right">Change %</th>
              <th class="text-center">Status</th>
              <th class="text-center">Screener Analysis</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {#each data.companies as c}
              <tr class="hover:bg-slate-50 transition-colors">
                <td class="font-bold text-blue-600 font-mono">
                  <a href="/company/{c.symbol}" class="hover:underline">{c.symbol}</a>
                </td>
                <td class="text-slate-800 text-xs">{c.name}</td>
                <td class="text-slate-500 text-xs">{c.sub_industry}</td>
                <td class="text-right text-xs font-mono text-slate-600">{c.market_cap_category}</td>
                <td class="text-right font-bold text-slate-900 font-mono tabular-nums">
                  ₹{c.last_price?.toLocaleString('en-IN') || '—'}
                </td>
                <td class="text-right font-bold font-mono tabular-nums {c.change_percent >= 0 ? 'text-emerald-700' : 'text-rose-700'}">
                  {c.change_percent >= 0 ? '+' : ''}{c.change_percent || 0}%
                </td>
                <td class="text-center">
                  <DataBadge status={c.data_status} size="xs" />
                </td>
                <td class="text-center">
                  <a
                    href="/company/{c.symbol}"
                    class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 border border-blue-200 hover:border-blue-600 rounded transition-colors"
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
    </div>

    <!-- Recent Sector News -->
    <div class="screener-card p-6 space-y-4 bg-white">
      <div class="flex items-center justify-between border-b border-slate-200 pb-2">
        <h2 class="text-base font-bold text-slate-900">
          Recent News Affecting {data.sector.name}
        </h2>
        <a href="/news?sector={data.sector.id}" class="text-xs text-blue-600 hover:underline font-semibold inline-flex items-center gap-1">
          <span>Filter all news</span>
          <ArrowRightIcon size={11} />
        </a>
      </div>

      {#if data.recent_news.length > 0}
        <div class="space-y-3">
          {#each data.recent_news as n}
            <div class="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-mono font-bold uppercase bg-slate-200 px-2 py-0.5 rounded text-slate-700">
                  {n.event_category}
                </span>
                <VerificationBadge status={n.verification_status} score={n.verification_score} size="xs" />
              </div>
              <h3 class="text-xs font-bold text-slate-900 hover:text-blue-600">
                <a href="/news/{n.id}">{n.title}</a>
              </h3>
              <p class="text-xs text-slate-600 font-sans leading-relaxed">
                {n.summary}
              </p>
            </div>
          {/each}
        </div>
      {:else}
        <div class="p-6 text-center text-slate-500 font-mono text-xs">
          No active news recorded for this sector yet.
        </div>
      {/if}
    </div>
  {/if}
</div>
