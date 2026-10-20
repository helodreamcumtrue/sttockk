<script>
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import VerificationBadge from '$lib/components/VerificationBadge.svelte';
  import DirectionBadge from '$lib/components/DirectionBadge.svelte';
  import DataBadge from '$lib/components/DataBadge.svelte';
  import CausalGraph from '$lib/components/CausalGraph.svelte';
  import { ArrowLeftIcon, ArrowRightIcon, ArrowUpRightIcon } from '$lib/components/icons';

  let articleId = $derived(page.params.id);
  let report = $state(null);
  let isLoading = $state(true);
  let error = $state(null);
  let selectedCompany = $state(null);

  async function loadDetail() {
    isLoading = true;
    error = null;
    try {
      const res = await fetch(`/api/news/${articleId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: Article not found`);
      report = await res.json();
      if (report.assessments && report.assessments.length > 0) {
        selectedCompany = report.assessments[0];
      }
    } catch (err) {
      error = err.message;
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    loadDetail();
  });
</script>

<svelte:head>
  <title>{report ? report.article.title : 'News Intelligence Detail'} — MarketPulse Finance</title>
</svelte:head>

<div class="space-y-6">
  <!-- Back navigation & Category breadcrumb -->
  <div class="flex items-center justify-between text-xs border-b border-slate-200 pb-2.5">
    <a href="/news" class="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1.5">
      <ArrowLeftIcon size={13} /> Back to News Intelligence Feed
    </a>
    {#if report}
      <div class="flex items-center gap-2">
        <span class="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium text-xs">
          {report.article.event_category.replace(/_/g, ' ')}
        </span>
        {#if report.article.is_demo}
          <DataBadge status="SYNTHETIC_DEMO" size="xs" />
        {/if}
      </div>
    {/if}
  </div>

  {#if isLoading}
    <div class="py-20 text-center font-mono text-xs text-slate-400 space-y-3">
      <div class="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p class="font-sans text-slate-600 font-medium text-xs">Deconstructing causal chain and verifying evidence...</p>
    </div>
  {:else if error}
    <div class="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono">
      Error: {error}
    </div>
  {:else if report}
    <!-- Section A: Event Summary (Google Finance style card) -->
    <section aria-label="Event Summary" class="screener-card p-6 bg-white space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
          {report.article.title}
        </h1>
        <VerificationBadge status={report.article.verification_status} score={report.article.verification_score} size="sm" />
      </div>

      <!-- Publication Meta -->
      <div class="flex flex-wrap items-center gap-4 text-xs text-slate-500 border-b border-slate-100 pb-3">
        <span>Published: <strong class="text-slate-800">{new Date(report.article.published_at).toLocaleString('en-IN')} IST</strong></span>
        <span>•</span>
        <span>Source: <strong class="text-slate-800">{report.article.source?.name}</strong></span>
        <span>•</span>
        <span>Reliability: <strong class="text-blue-600">Tier {report.article.source?.reliability_tier}</strong></span>
        <span>•</span>
        <a href={report.article.url} target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline inline-flex items-center gap-1 font-semibold">
          <span>Original Reference URL</span>
          <ArrowUpRightIcon size={11} />
        </a>
      </div>

      <!-- Factual Breakdown Box -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div class="bg-emerald-50/60 border border-emerald-200 p-4 rounded-lg space-y-1.5">
          <div class="text-[10px] uppercase font-bold text-emerald-800 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span>
            <span>WHAT IS CONFIRMED</span>
          </div>
          <p class="text-slate-700 leading-relaxed font-sans">
            {report.article.summary}
          </p>
        </div>

        <div class="bg-amber-50/60 border border-amber-200 p-4 rounded-lg space-y-1.5">
          <div class="text-[10px] uppercase font-bold text-amber-800 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
            <span>WHAT REMAINS DEVELOPING</span>
          </div>
          <p class="text-slate-700 leading-relaxed font-sans">
            Magnitude and longevity of pass-through effects depend on regulatory intervention, hedging horizon, and competitor pricing reactions.
          </p>
        </div>
      </div>
    </section>

    <!-- Section D: Interactive Causal Impact Graph -->
    <section aria-label="Interactive Causal Graph" class="screener-card p-5 bg-white space-y-3">
      <div class="flex items-center justify-between border-b border-slate-200 pb-2">
        <h2 class="text-xs font-bold uppercase tracking-wider text-slate-700">
          Causal Transmission Graph (Interactive)
        </h2>
        <span class="text-xs text-slate-400 font-mono">Click nodes to inspect company impact</span>
      </div>
      <CausalGraph
        nodes={report.causal_graph.nodes}
        edges={report.causal_graph.edges}
        onNodeClick={(node) => {
          if (node.symbol) {
            const found = report.assessments.find(a => a.symbol === node.symbol);
            if (found) selectedCompany = found;
          }
        }}
      />
    </section>

    <!-- Section C: Company Impact Table (Screener.in format) -->
    <section aria-label="Company Impact Table" class="screener-card p-6 bg-white space-y-4">
      <div class="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <h2 class="text-base font-bold text-slate-900">
            Affected Equities & Causal Transmission
          </h2>
          <p class="text-xs text-slate-500 mt-0.5">
            Ranked by deterministic impact score (evidence quality, directness, and economic magnitude).
          </p>
        </div>
        <span class="text-xs font-mono text-slate-500">{report.assessments.length} Monitored Companies</span>
      </div>

      <div class="overflow-x-auto">
        <table class="screener-table">
          <thead>
            <tr>
              <th class="text-left">Company / Ticker</th>
              <th class="text-left">Exposure</th>
              <th class="text-center">Direction</th>
              <th class="text-right">Impact Score</th>
              <th class="text-left">Horizon</th>
              <th class="text-right">Observed Price</th>
              <th class="text-center">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {#each report.assessments as a}
              <tr class="hover:bg-slate-50 transition-colors {selectedCompany?.symbol === a.symbol ? 'bg-blue-50/60 font-semibold' : ''}">
                <td class="p-3">
                  <div class="font-mono font-bold text-blue-600">{a.symbol}</div>
                  <div class="text-[11px] text-slate-500">{a.company_name}</div>
                </td>
                <td class="p-3">
                  <span class="px-2 py-0.5 rounded text-[10px] font-semibold {a.exposure_type === 'DIRECT' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'}">
                    {a.exposure_type}
                  </span>
                </td>
                <td class="p-3 text-center">
                  <DirectionBadge direction={a.potential_direction} size="sm" />
                </td>
                <td class="p-3 text-right font-bold text-slate-900 font-mono tabular-nums">
                  {a.impact_score}<span class="text-slate-400 text-[10px]">/100</span>
                </td>
                <td class="p-3 text-slate-700 text-xs">
                  {a.impact_horizon.replace(/_/g, ' ')}
                </td>
                <td class="p-3 text-right">
                  {#if a.market_data && a.market_data.last_price}
                    <div class="font-bold text-slate-900 font-mono tabular-nums">₹{a.market_data.last_price}</div>
                    <div class="text-[10px] font-bold font-mono tabular-nums {a.market_data.change_percent >= 0 ? 'text-emerald-700' : 'text-rose-700'}">
                      {a.market_data.change_percent >= 0 ? '+' : ''}{a.market_data.change_percent}%
                    </div>
                  {:else}
                    <span class="text-slate-400 font-mono text-[10px]">UNAVAILABLE</span>
                  {/if}
                </td>
                <td class="p-3 text-center space-x-2">
                  <button
                    onclick={() => selectedCompany = a}
                    class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded cursor-pointer transition-colors text-xs"
                  >
                    Causal Chain
                  </button>
                  <a
                    href="/company/{a.symbol}"
                    class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition-colors text-xs shadow-2xs"
                  >
                    Analyze
                  </a>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Detailed Causal Chain Pane for Selected Company -->
      {#if selectedCompany}
        <div class="mt-4 p-5 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
            <div class="flex items-center gap-2">
              <span class="text-xs uppercase font-bold text-blue-700">
                EVIDENCE & CAUSAL MECHANISM: {selectedCompany.company_name} ({selectedCompany.symbol})
              </span>
              <DirectionBadge direction={selectedCompany.potential_direction} size="sm" />
            </div>
            <a href="/company/{selectedCompany.symbol}" class="text-xs text-blue-600 hover:underline font-semibold inline-flex items-center gap-1">
              <span>Open Screener.in Analysis</span>
              <ArrowRightIcon size={11} />
            </a>
          </div>

          <!-- Causal Chain Steps -->
          <div>
            <div class="text-[10px] uppercase font-bold text-slate-500 mb-1.5 tracking-wider">
              CAUSAL TRANSMISSION PATHWAY:
            </div>
            <div class="space-y-1.5 text-xs text-slate-700">
              {#each selectedCompany.causal_chain as step, sIdx}
                <div class="flex items-start gap-2">
                  <span class="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {sIdx + 1}
                  </span>
                  <span class="leading-relaxed">{step}</span>
                </div>
              {/each}
            </div>
          </div>

          <!-- Explanation -->
          <div class="text-xs text-slate-700 leading-relaxed font-sans bg-white p-3.5 rounded border border-slate-200">
            <strong>Analytical Assessment:</strong> {selectedCompany.explanation}
          </div>

          <!-- Supporting Facts & Invalidation -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div class="p-3 bg-white border border-slate-200 rounded">
              <div class="text-[10px] uppercase font-bold text-slate-500 mb-1">KEY SUPPORTING FACTS:</div>
              <ul class="space-y-1 list-disc list-inside text-slate-600 text-[11px]">
                {#each selectedCompany.key_facts as fact}
                  <li>{fact}</li>
                {/each}
              </ul>
            </div>

            <div class="p-3 bg-white border border-slate-200 rounded">
              <div class="text-[10px] uppercase font-bold text-amber-700 mb-1">INVALIDATION CONDITIONS:</div>
              <ul class="space-y-1 list-disc list-inside text-slate-600 text-[11px]">
                {#each selectedCompany.invalidation_conditions as cond}
                  <li>{cond}</li>
                {/each}
              </ul>
            </div>
          </div>
        </div>
      {/if}
    </section>

    <!-- Section E: Historical Analogues -->
    <section aria-label="Historical Analogues" class="screener-card p-6 bg-white space-y-3">
      <div class="flex items-center justify-between border-b border-slate-200 pb-2">
        <div>
          <h2 class="text-base font-bold text-slate-900">
            Historical Event Analogues
          </h2>
          <p class="text-xs text-slate-500 mt-0.5">
            Documented market performance during past comparable {report.article.event_category.replace(/_/g, ' ')} events.
          </p>
        </div>
        <span class="text-xs font-mono text-slate-500">Benchmark: NIFTY 50 CAR</span>
      </div>

      {#if report.historical_analogues && report.historical_analogues.length > 0}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          {#each report.historical_analogues as h}
            <div class="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
              <div class="flex items-center justify-between">
                <strong class="text-slate-800">{h.event_title}</strong>
                <span class="text-slate-500 font-mono text-[11px]">{h.event_date}</span>
              </div>
              <div class="text-slate-600 text-xs">
                Impact on <strong class="text-blue-700">{h.symbol}</strong> (Sample Size: {h.sample_size} historical events)
              </div>
              <div class="flex items-center gap-4 pt-1.5 border-t border-slate-200 text-xs font-mono tabular-nums">
                <span>1D CAR: <strong class="{h.car_1d >= 0 ? 'text-emerald-700' : 'text-rose-700'}">{h.car_1d >= 0 ? '+' : ''}{h.car_1d}%</strong></span>
                <span>3D CAR: <strong class="{h.car_3d >= 0 ? 'text-emerald-700' : 'text-rose-700'}">{h.car_3d >= 0 ? '+' : ''}{h.car_3d}%</strong></span>
                <span>5D CAR: <strong class="{h.car_5d >= 0 ? 'text-emerald-700' : 'text-rose-700'}">{h.car_5d >= 0 ? '+' : ''}{h.car_5d}%</strong></span>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="p-6 text-center text-slate-500 font-mono text-xs">
          No calibrated historical event analogues recorded for this category yet.
        </div>
      {/if}
    </section>
  {/if}
</div>
