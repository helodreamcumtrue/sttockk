<script>
  let isExpanded = $state(false);

  function toggle() {
    isExpanded = !isExpanded;
  }
</script>

<aside aria-label="Regulatory Disclaimers" class="bg-slate-900 text-xs text-slate-300 py-1.5 px-4 border-b border-slate-800">
  <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
    <div class="flex items-center gap-2">
      <span class="inline-flex items-center px-2 py-0.5 text-[10px] uppercase font-mono font-bold bg-[#ccff00] text-black rounded-full">
        SEBI COMPLIANCE NOTICE
      </span>
      <span class="text-slate-300 text-xs">
        Quantitative research terminal only. Delayed 15m quotes. Not certified financial advice or price forecasting.
      </span>
    </div>

    <div class="flex items-center gap-3">
      <button
        onclick={toggle}
        class="text-[#ccff00] hover:underline font-medium cursor-pointer"
        aria-expanded={isExpanded}
      >
        {isExpanded ? 'Hide Notice' : 'Read Regulatory Disclosure'}
      </button>
      <a href="/methodology" class="text-slate-400 hover:text-white underline">
        Transparency Docs
      </a>
    </div>

  </div>


  {#if isExpanded}
    <div class="max-w-7xl mx-auto mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
      <p>
        <strong>1. Research & Analysis:</strong> MarketPulse Intelligence operates solely as an educational and evidence-based quantitative research interface. The platform does not issue buy, sell, or hold recommendations, nor does it execute transactions.
      </p>
      <p>
        <strong>2. Regulatory Status:</strong> This platform is not registered as a Research Analyst under SEBI (Research Analysts) Regulations, 2014. Investors must independently assess risk or seek certified financial counsel.
      </p>
      <p>
        <strong>3. Data Freshness:</strong> Quotes for Indian equities listed on NSE and BSE are delayed by 15 minutes as per exchange dissemination guidelines. Demonstration data is strictly labeled as SYNTHETIC.
      </p>
    </div>
  {/if}
</aside>
