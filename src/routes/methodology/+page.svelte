<script>
  import { onMount } from 'svelte';
  import { ArrowRightIcon } from '$lib/components/icons';

  let data = $state(null);
  let isLoading = $state(true);
  let error = $state(null);

  onMount(async () => {
    try {
      const res = await fetch('/api/methodology');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      data = await res.json();
    } catch (err) {
      error = err.message;
    } finally {
      isLoading = false;
    }
  });
</script>

<svelte:head>
  <title>Methodology & Compliance Framework — MarketPulse Finance</title>
</svelte:head>

<div class="space-y-8 max-w-5xl mx-auto">
  <!-- Header -->
  <div class="border-b border-slate-200 pb-5">
    <div class="flex items-center gap-2 mb-2">
      <span class="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold uppercase tracking-wider">
        TRANSPARENCY CHARTER
      </span>
      <span class="text-xs text-slate-500 font-mono">Formula Version: v2.0-deterministic</span>
    </div>
    <h1 class="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
      Quantitative Methodology & Compliance Framework
    </h1>
    <p class="text-xs text-slate-600 mt-2 leading-relaxed">
      MarketPulse Finance is built on explainable, deterministic causal rules, verifiable primary sources, and empirical event studies. We operate under strict transparency rules, ensuring zero fabricated predictions.
    </p>
  </div>

  {#if isLoading}
    <div class="py-20 text-center font-mono text-xs text-slate-400 space-y-3">
      <div class="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p class="font-sans text-slate-600 font-medium text-xs">Loading quantitative methodology documentation...</p>
    </div>
  {:else if error}
    <div class="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono">
      Error: {error}
    </div>
  {:else if data}
    <!-- Structured Methodology Pillars -->
    <div class="space-y-6">
      {#each data.pillars as pillar}
        <section class="screener-card p-6 bg-white space-y-3">
          <h2 class="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span class="text-blue-600 font-mono">{pillar.title}</span>
          </h2>

          <p class="text-xs text-slate-600 leading-relaxed font-sans">
            {pillar.content}
          </p>

          {#if pillar.formula}
            <div class="bg-slate-50 border border-slate-200 p-3.5 rounded-lg font-mono text-xs text-slate-800 overflow-x-auto">
              <span class="text-slate-400 block text-[10px] uppercase font-bold mb-1">MATHEMATICAL SPECIFICATION:</span>
              <code>{pillar.formula}</code>
            </div>
          {/if}

          {#if pillar.rules && pillar.rules.length > 0}
            <ul class="space-y-1.5 list-disc list-inside text-xs text-slate-700 pl-1">
              {#each pillar.rules as rule}
                <li class="leading-relaxed">{rule}</li>
              {/each}
            </ul>
          {/if}
        </section>
      {/each}

      <!-- Allowlisted Sources Section -->
      <section id="sources" class="screener-card p-6 bg-white space-y-3">
        <h2 class="text-base font-bold text-slate-900">
          Permitted Primary Sources Allowlist
        </h2>
        <p class="text-xs text-slate-600 leading-relaxed">
          The engine accepts disclosures solely from verified, accredited Indian institutions:
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2 text-xs">
          {#each [
            { name: 'National Stock Exchange (NSE)', tier: 'Tier 1 Official', desc: 'Direct corporate announcements & filings' },
            { name: 'Bombay Stock Exchange (BSE)', tier: 'Tier 1 Official', desc: 'Regulatory filings and shareholding disclosures' },
            { name: 'Securities and Exchange Board of India (SEBI)', tier: 'Tier 1 Regulator', desc: 'Enforcement orders and market regulations' },
            { name: 'Reserve Bank of India (RBI)', tier: 'Tier 1 Central Bank', desc: 'Monetary policy resolutions and banking circulars' },
            { name: 'Press Information Bureau (PIB)', tier: 'Tier 1 Sovereign', desc: 'Official Union Cabinet decisions and policy notifications' },
            { name: 'Accredited Financial News Desks', tier: 'Tier 2 Corroborated', desc: 'Reuters, Bloomberg, PTI, Economic Times (multi-sourced only)' }
          ] as s}
            <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <div class="font-bold text-slate-800 text-xs">{s.name}</div>
              <div class="text-[10px] font-mono text-blue-700 font-semibold">{s.tier}</div>
              <div class="text-[11px] text-slate-500">{s.desc}</div>
            </div>
          {/each}
        </div>
      </section>

      <!-- Legal Compliance & Disclaimer Section -->
      <section id="disclaimer" class="p-6 bg-amber-50/70 border border-amber-200 rounded-lg space-y-2 text-xs">
        <h2 class="text-sm font-bold uppercase text-amber-900">
          SEBI (Research Analysts) Regulations, 2014 — Compliance Notice
        </h2>
        <p class="text-slate-700 leading-relaxed font-sans">
          MarketPulse Finance is an automated research and quantitative screening tool designed exclusively for educational, technical, and analytical inquiry into causal news transmission mechanisms. It is not an algorithmic trading advisory, portfolio management scheme, or licensed financial recommendation. Users should exercise independent judgment and consult certified financial planners before making capital allocations.
        </p>
      </section>
    </div>
  {/if}
</div>
