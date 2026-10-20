<script>
  import { onMount } from 'svelte';
  import { ArrowRightIcon, ArrowUpRightIcon } from '$lib/components/icons';

  let sectors = $state([]);
  let isLoading = $state(true);
  let error = $state(null);

  onMount(async () => {
    try {
      const res = await fetch('/api/sectors');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      sectors = data.sectors || [];
    } catch (err) {
      error = err.message;
    } finally {
      isLoading = false;
    }
  });
</script>

<svelte:head>
  <title>Sector Intelligence & Exposures — MarketPulse Finance</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="border-b border-slate-200 pb-4 flex flex-wrap items-center justify-between gap-3">
    <div>
      <h1 class="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
        Indian Sectors & Macroeconomic Exposures
      </h1>
      <p class="text-xs text-slate-500 mt-1">
        Analyze sector-level exposure to interest rate shocks, commodity cycles, and regulatory shifts across Indian equities.
      </p>
    </div>

    <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
      10 NSE Sector Indices
    </span>
  </div>

  {#if isLoading}
    <div class="py-20 text-center font-mono text-xs text-slate-400 space-y-3">
      <div class="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p class="font-sans text-slate-600 font-medium text-xs">Loading sector intelligence matrix...</p>
    </div>
  {:else if error}
    <div class="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono">
      Error: {error}
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      {#each sectors as s}
        <div class="bg-white border border-slate-200 hover:border-slate-300 rounded-lg p-5 flex flex-col justify-between space-y-4 shadow-2xs hover:shadow-xs transition-all">
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-mono font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {s.code}
              </span>
              <span class="text-xs text-slate-500 font-mono">
                Index: <strong class="text-slate-800">{s.benchmark_index}</strong>
              </span>
            </div>

            <h2 class="text-base font-bold text-slate-900 hover:text-blue-600 transition-colors">
              <a href="/sectors/{s.id}">{s.name}</a>
            </h2>

            <p class="text-xs text-slate-600 mt-1.5 leading-relaxed">
              {s.description}
            </p>

            <!-- Macro Drivers -->
            <div class="mt-3.5 pt-3 border-t border-slate-100">
              <div class="text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-wider">
                PRIMARY MACRO DRIVERS:
              </div>
              <div class="flex flex-wrap gap-1.5">
                {#each s.macro_drivers as md}
                  <span class="px-2.5 py-0.5 rounded-full bg-slate-50 text-slate-700 border border-slate-200 text-[11px] font-medium">
                    {md}
                  </span>
                {/each}
              </div>
            </div>
          </div>

          <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span class="text-slate-500 font-medium">
              {s.company_count} Listed Equities
            </span>
            <a
              href="/sectors/{s.id}"
              class="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-2xs"
            >
              <span>Sector Deep Dive</span>
              <ArrowRightIcon size={12} />
            </a>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
