<script>
  import { onMount } from 'svelte';
  import { ShieldIcon, ArrowUpRightIcon } from '$lib/components/icons';

  let metrics = $state(null);
  let isLoading = $state(true);
  let error = $state(null);

  onMount(async () => {
    try {
      const res = await fetch('/api/accuracy');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      metrics = await res.json();
    } catch (err) {
      error = err.message;
    } finally {
      isLoading = false;
    }
  });
</script>

<svelte:head>
  <title>Model Accuracy & Backtested Event Studies — MarketPulse Finance</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="border-b border-slate-200 pb-4">
    <h1 class="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
      Model Accuracy & Backtested Event Studies
    </h1>
    <p class="text-xs text-slate-500 mt-1">
      Empirically validated out-of-sample event studies comparing news impact assessments against actual Cumulative Abnormal Returns (CAR).
    </p>
  </div>

  {#if isLoading}
    <div class="py-20 text-center font-mono text-xs text-slate-400 space-y-3">
      <div class="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p class="font-sans text-slate-600 font-medium text-xs">Calculating event study returns and confusion matrix...</p>
    </div>
  {:else if error}
    <div class="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono">
      Error: {error}
    </div>
  {:else if metrics}
    <!-- Top KPI Performance Cards (Google Finance / Screener Cards) -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-3.5">
      <div class="screener-card p-4 bg-white">
        <div class="text-[10px] uppercase font-bold text-slate-500 mb-1">DIRECTIONAL ACCURACY</div>
        <div class="text-2xl font-extrabold font-mono text-emerald-700 tabular-nums">
          {metrics.directional_accuracy_pct}%
        </div>
        <div class="text-[11px] text-slate-500 mt-1">
          Out-of-sample event match
        </div>
      </div>

      <div class="screener-card p-4 bg-white">
        <div class="text-[10px] uppercase font-bold text-slate-500 mb-1">MATERIAL PRECISION</div>
        <div class="text-2xl font-extrabold font-mono text-blue-700 tabular-nums">
          {metrics.precision_pct}%
        </div>
        <div class="text-[11px] text-slate-500 mt-1">
          High-conviction calls
        </div>
      </div>

      <div class="screener-card p-4 bg-white">
        <div class="text-[10px] uppercase font-bold text-slate-500 mb-1">CALL RECALL</div>
        <div class="text-2xl font-extrabold font-mono text-slate-800 tabular-nums">
          {metrics.recall_pct}%
        </div>
        <div class="text-[11px] text-slate-500 mt-1">
          Identified shock events
        </div>
      </div>

      <div class="screener-card p-4 bg-white">
        <div class="text-[10px] uppercase font-bold text-slate-500 mb-1">FALSE POSITIVE RATE</div>
        <div class="text-2xl font-extrabold font-mono text-amber-700 tabular-nums">
          {metrics.false_positive_rate_pct}%
        </div>
        <div class="text-[11px] text-slate-500 mt-1">
          Opposite directional drift
        </div>
      </div>

      <div class="screener-card p-4 bg-white">
        <div class="text-[10px] uppercase font-bold text-slate-500 mb-1">ABSTENTION RATE</div>
        <div class="text-2xl font-extrabold font-mono text-slate-700 tabular-nums">
          {metrics.abstention_rate_pct}%
        </div>
        <div class="text-[11px] text-slate-500 mt-1">
          Unverified / insufficient
        </div>
      </div>
    </div>

    <!-- Look-ahead bias prevention & Methodology Box -->
    <div class="p-4 bg-blue-50/70 border border-blue-200 rounded-lg text-xs space-y-2">
      <div class="text-blue-900 font-bold uppercase text-[11px] flex items-center gap-2">
        <ShieldIcon size={14} class="text-blue-600 shrink-0" />
        <span>RIGOROUS LOOK-AHEAD BIAS PREVENTION PROTOCOL</span>
      </div>
      <p class="text-slate-700 leading-relaxed font-sans">
        {metrics.methodology_notes} Cumulative Abnormal Return (CAR) is measured as:
        <code class="px-1.5 py-0.5 rounded bg-white border border-blue-200 text-blue-700 font-mono text-xs">CAR = R_stock - R_nifty50</code> over standardized event windows: 1D (T+1), 3D (T+3), 5D (T+5), and 20D (T+20).
      </p>
    </div>

    <!-- Category Breakdown Table (Screener.in format) -->
    <div class="screener-card p-6 bg-white space-y-4">
      <div class="flex items-center justify-between border-b border-slate-200 pb-2">
        <h2 class="text-base font-bold text-slate-900">
          Performance Breakdown by Event Category
        </h2>
        <span class="text-xs font-mono text-slate-500">Benchmark: NIFTY 50 Index</span>
      </div>

      <div class="overflow-x-auto">
        <table class="screener-table">
          <thead>
            <tr>
              <th class="text-left">Event Category</th>
              <th class="text-right">Sample Events</th>
              <th class="text-right">Directional Accuracy %</th>
              <th class="text-right">Avg 3D Abnormal Return (CAR)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {#each Object.entries(metrics.category_breakdown) as [cat, val]}
              <tr class="hover:bg-slate-50 transition-colors">
                <td class="font-bold text-slate-800 text-xs">{cat.replace(/_/g, ' ')}</td>
                <td class="text-right font-mono text-slate-600">{val.total_events}</td>
                <td class="text-right font-mono font-bold text-emerald-700">{val.accuracy_pct}%</td>
                <td class="text-right font-mono font-bold tabular-nums {val.average_car_3d_pct >= 0 ? 'text-emerald-700' : 'text-rose-700'}">
                  {val.average_car_3d_pct >= 0 ? '+' : ''}{val.average_car_3d_pct}%
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Recent Historical Studies -->
    <div class="screener-card p-6 bg-white space-y-4">
      <div class="flex items-center justify-between border-b border-slate-200 pb-2">
        <h2 class="text-base font-bold text-slate-900">
          Recent Calibrated Historical Event Studies
        </h2>
        <span class="text-xs font-mono text-slate-500">{metrics.recent_studies.length} Studies Recorded</span>
      </div>

      <div class="space-y-3">
        {#each metrics.recent_studies as s}
          <div class="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="font-bold text-slate-900 text-sm">{s.event_title}</span>
              <span class="text-slate-500 font-mono text-[11px]">{s.event_date}</span>
            </div>

            <div class="flex flex-wrap items-center gap-4 text-slate-600">
              <span>Target Equity: <a href="/company/{s.symbol}" class="font-mono font-bold text-blue-600 hover:underline">{s.symbol}</a></span>
              <span>•</span>
              <span>Category: <strong>{s.category.replace(/_/g, ' ')}</strong></span>
              <span>•</span>
              <span>Predicted: <strong class="uppercase text-slate-800">{s.predicted_direction}</strong></span>
              <span>•</span>
              <span>Actual: <strong class="uppercase text-slate-800">{s.actual_direction}</strong></span>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold {s.directional_match ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
                {s.directional_match ? '✓ DIRECTION MATCHED' : '✗ DIVERGED'}
              </span>
            </div>

            <div class="flex items-center gap-4 pt-1.5 border-t border-slate-200 text-xs font-mono tabular-nums">
              <span>1D CAR: <strong class="{s.car_1d >= 0 ? 'text-emerald-700' : 'text-rose-700'}">{s.car_1d >= 0 ? '+' : ''}{s.car_1d}%</strong></span>
              <span>3D CAR: <strong class="{s.car_3d >= 0 ? 'text-emerald-700' : 'text-rose-700'}">{s.car_3d >= 0 ? '+' : ''}{s.car_3d}%</strong></span>
              <span>5D CAR: <strong class="{s.car_5d >= 0 ? 'text-emerald-700' : 'text-rose-700'}">{s.car_5d >= 0 ? '+' : ''}{s.car_5d}%</strong></span>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
