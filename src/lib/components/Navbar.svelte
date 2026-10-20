<script>
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import GlobalSearchModal from './GlobalSearchModal.svelte';
  import { SearchIcon, SettingsIcon, TrendingUpIcon, TrendingDownIcon } from '$lib/components/icons/index.js';

  let isSearchOpen = $state(false);
  let isDemoMode = $state(true);
  let marketStatus = $state({ status: 'REGULAR', exchange: 'NSE', current_ist: '' });

  let tickerItems = $state([
    { name: 'NIFTY 50', value: '24,850.30', change: '+112.40', pct: '+0.45%', up: true },
    { name: 'SENSEX', value: '81,450.80', change: '+345.10', pct: '+0.43%', up: true },
    { name: 'NIFTY BANK', value: '51,200.15', change: '+315.60', pct: '+0.62%', up: true },
    { name: 'NIFTY IT', value: '38,940.50', change: '-115.20', pct: '-0.29%', up: false },
    { name: 'RELIANCE', value: '₹2,984.50', change: '+18.20', pct: '+0.61%', up: true },
    { name: 'TCS', value: '₹4,120.80', change: '-12.40', pct: '-0.30%', up: false },
    { name: 'HDFCBANK', value: '₹1,682.40', change: '+14.10', pct: '+0.85%', up: true },
    { name: 'INDIGO', value: '₹4,320.00', change: '-152.00', pct: '-3.40%', up: false },
    { name: 'ONGC', value: '₹296.40', change: '+10.80', pct: '+3.78%', up: true },
    { name: 'USD/INR', value: '84.12', change: '+0.08', pct: '+0.10%', up: true },
    { name: 'BRENT CRUDE', value: '$88.40', change: '+2.15', pct: '+2.49%', up: true }
  ]);

  onMount(async () => {
    const saved = localStorage.getItem('marketpulse_demo_mode');
    if (saved !== null) {
      isDemoMode = saved === 'true';
    }

    try {
      const res = await fetch('/api/market/overview');
      if (res.ok) {
        const data = await res.json();
        if (data.market_status) marketStatus = data.market_status;
      }
    } catch (err) {
      console.warn('Could not fetch market status:', err);
    }
  });

  function toggleDemoMode() {
    isDemoMode = !isDemoMode;
    localStorage.setItem('marketpulse_demo_mode', String(isDemoMode));
    document.cookie = `demo_mode=${isDemoMode}; path=/; max-age=31536000`;
    window.location.reload();
  }

  const navLinks = [
    { href: '/', label: 'Markets Overview' },
    { href: '/companies', label: 'Stock Screener', badge: 'Live' },
    { href: '/sectors', label: 'Sectors & Heatmap' },
    { href: '/news', label: 'News Intelligence' },
    { href: '/watchlist', label: 'Watchlist' },
    { href: '/accuracy', label: 'Backtest & Accuracy' }
  ];
</script>

<header class="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs transition-all">
  <!-- Google Finance Style Live Ticker Ribbon -->
  <div class="bg-slate-900 border-b border-slate-800 overflow-hidden py-1.5 text-xs text-slate-300">
    <div class="animate-ticker flex items-center space-x-8">
      {#each [...tickerItems, ...tickerItems] as item}
        <a href={item.name.includes(' ') ? '/' : `/company/${item.name}`} class="flex items-center space-x-2 whitespace-nowrap hover:text-white transition-colors">
          <span class="font-bold text-slate-300">{item.name}</span>
          <span class="font-semibold text-white font-mono tabular-nums">{item.value}</span>
          <span class="inline-flex items-center text-[11px] font-semibold font-mono tabular-nums px-1.5 py-0.2 rounded {item.up ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60' : 'bg-rose-950/80 text-rose-400 border border-rose-800/60'}">
            {#if item.up}
              <span class="mr-0.5">▲</span>
            {:else}
              <span class="mr-0.5">▼</span>
            {/if}
            {item.change} ({item.pct})
          </span>
        </a>
      {/each}
    </div>
  </div>

  <!-- Google Finance Main App Bar -->
  <div class="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
    <!-- Brand / Logo (Google Finance Style) -->
    <a href="/" class="flex items-center gap-2.5 flex-shrink-0 group">
      <div class="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs group-hover:bg-blue-700 transition-colors">
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
          <polyline points="16 7 22 7 22 13"></polyline>
        </svg>
      </div>
      <div>
        <div class="flex items-center gap-1.5">
          <span class="font-bold text-lg text-slate-900 tracking-tight leading-none group-hover:text-blue-600 transition-colors">
            MarketPulse
          </span>
          <span class="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
            FINANCE
          </span>
        </div>
        <span class="text-[10px] text-slate-500 font-medium block leading-none mt-0.5">
          NSE • BSE Financial Screener
        </span>
      </div>
    </a>

    <!-- Center Search Bar (Google Finance signature large pill search) -->
    <div class="flex-1 max-w-xl mx-2">
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        onclick={() => isSearchOpen = true}
        class="w-full flex items-center gap-3 px-3.5 py-2 bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/80 rounded-full cursor-pointer transition-all shadow-2xs group"
      >
        <SearchIcon size={16} class="text-slate-500 group-hover:text-blue-600 transition-colors" />
        <span class="text-xs text-slate-500 font-medium flex-1 truncate">
          Search for stocks, sectors, or news (e.g. RELIANCE, TCS, NIFTY 50)...
        </span>
        <kbd class="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono text-slate-500 bg-white border border-slate-200 rounded shadow-2xs font-semibold">
          Ctrl K
        </kbd>
      </div>
    </div>

    <!-- Right Controls: Status & Mode -->
    <div class="flex items-center gap-2.5 flex-shrink-0">
      <!-- Market Status Badge -->
      <div class="hidden md:flex items-center gap-1.5 text-xs px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-slate-700">
        <span class="w-2 h-2 rounded-full {marketStatus.status === 'OPEN' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}"></span>
        <span class="font-semibold">NSE:</span>
        <span class="{marketStatus.status === 'OPEN' ? 'text-emerald-700 font-bold' : 'text-slate-600 font-medium'}">
          {marketStatus.status === 'OPEN' ? 'LIVE MARKET' : 'CLOSED'}
        </span>
      </div>

      <!-- Mode Switcher -->
      <button
        onclick={toggleDemoMode}
        class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer {isDemoMode ? 'bg-slate-900 text-white border-slate-800 hover:bg-slate-800' : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'}"
        title="Toggle between Live NSE Feed and Historical Demo Data"
      >
        <span class="w-1.5 h-1.5 rounded-full {isDemoMode ? 'bg-amber-400' : 'bg-emerald-500'}"></span>
        <span>{isDemoMode ? 'DEMO' : 'LIVE'}</span>
      </button>

      <!-- Settings / Methodology -->
      <a
        href="/methodology"
        class="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center transition-colors"
        title="Methodology & Documentation"
        aria-label="Methodology"
      >
        <SettingsIcon size={15} class="text-slate-600" />
      </a>
    </div>
  </div>

  <!-- Google Finance Style Navigation Tab Bar -->
  <nav class="border-t border-slate-200 bg-white">
    <div class="max-w-7xl mx-auto px-4 flex items-center space-x-1 overflow-x-auto no-scrollbar">
      {#each navLinks as link}
        {@const isActive = (link.href === '/' && page.url.pathname === '/') || (link.href !== '/' && page.url.pathname.startsWith(link.href))}
        <a
          href={link.href}
          class="relative px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors {isActive ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}"
        >
          <span class="flex items-center gap-1.5">
            {link.label}
            {#if link.badge}
              <span class="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700">
                {link.badge}
              </span>
            {/if}
          </span>
          {#if isActive}
            <span class="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-sm"></span>
          {/if}
        </a>
      {/each}
    </div>
  </nav>
</header>

<GlobalSearchModal bind:isOpen={isSearchOpen} />
