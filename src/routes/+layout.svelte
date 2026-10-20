<script>
  import './layout.css';
  import Navbar from '$lib/components/Navbar.svelte';
  import DisclaimerBanner from '$lib/components/DisclaimerBanner.svelte';
  import { ArrowUpRightIcon } from '$lib/components/icons';

  let { children } = $props();
</script>

<svelte:head>
  <title>MarketPulse Finance — Indian Equities Screener & Market Intelligence</title>
  <meta name="description" content="Google Finance and Screener style market intelligence for Indian equities on NSE and BSE with macroeconomic impact analysis." />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</svelte:head>

<div class="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900 selection:bg-blue-600 selection:text-white">
  <!-- Regulatory Notice -->
  <DisclaimerBanner />

  <!-- Google Finance Top App Bar -->
  <Navbar />

  <!-- Main View -->
  <main class="flex-1 w-full max-w-7xl mx-auto px-4 py-5">
    {@render children()}
  </main>

  <!-- Google Finance / Screener Clean Footer -->
  <footer class="border-t border-slate-200 bg-white py-8 text-xs text-slate-600 mt-12">
    <div class="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 mb-6">
      <div class="space-y-2.5">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
            MP
          </div>
          <span class="text-sm font-bold text-slate-900 tracking-tight">MarketPulse Finance</span>
          <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">v2.0</span>
        </div>
        <p class="text-slate-500 text-xs leading-relaxed">
          Financial screener and news intelligence engine for Indian equities listed on NSE and BSE. Quantifying macro shocks to company fundamentals.
        </p>
      </div>

      <div class="space-y-2 text-xs">
        <div class="text-slate-900 font-bold uppercase text-[11px] tracking-wider mb-2">FINANCIAL SUITE</div>
        <div><a href="/" class="text-slate-600 hover:text-blue-600 transition-colors">Market Overview</a></div>
        <div><a href="/companies" class="text-slate-600 hover:text-blue-600 transition-colors">Stock Screener (NSE / BSE)</a></div>
        <div><a href="/sectors" class="text-slate-600 hover:text-blue-600 transition-colors">Sectors & Exposure Heatmap</a></div>
        <div><a href="/news" class="text-slate-600 hover:text-blue-600 transition-colors">Financial News & Catalysts</a></div>
      </div>

      <div class="space-y-2 text-xs">
        <div class="text-slate-900 font-bold uppercase text-[11px] tracking-wider mb-2">RESEARCH & ANALYSIS</div>
        <div><a href="/accuracy" class="text-slate-600 hover:text-blue-600 transition-colors">Historical Validation & Backtest</a></div>
        <div><a href="/methodology" class="text-slate-600 hover:text-blue-600 transition-colors">Quantitative Scoring Engine</a></div>
        <div><a href="/watchlist" class="text-slate-600 hover:text-blue-600 transition-colors">My Portfolio Watchlist</a></div>
        <div><a href="/api/health" target="_blank" class="text-slate-600 hover:text-blue-600 transition-colors inline-flex items-center gap-1"><span>System Health & Live Data Feed</span> <ArrowUpRightIcon size={11} /></a></div>
      </div>

      <div class="space-y-2 text-xs">
        <div class="text-slate-900 font-bold uppercase text-[11px] tracking-wider mb-2">DISCLAIMER & COMPLIANCE</div>
        <p class="text-slate-500 leading-relaxed text-[11px]">
          Quotes delayed at least 15 minutes. Financial data provided for educational and analytical purposes only. Not SEBI registered investment advice.
        </p>
        <div class="pt-1">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-medium">
            Official Filings: NSE • BSE • SEBI • RBI
          </span>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
      <div>
        © 2026 MarketPulse Finance. All rights reserved.
      </div>
      <div class="flex items-center gap-4">
        <a href="/methodology#disclaimer" class="hover:text-blue-600 underline">SEBI Compliance Notice</a>
        <a href="/methodology#sources" class="hover:text-blue-600 underline">Data Sources</a>
        <a href="/methodology#corrections" class="hover:text-blue-600 underline">Feedback & Corrections</a>
      </div>
    </div>
  </footer>
</div>
