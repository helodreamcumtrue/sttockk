<script>
  import { onMount } from 'svelte';
  import DataBadge from '$lib/components/DataBadge.svelte';
  import { ArrowUpRightIcon, SearchIcon, BookmarkIcon } from '$lib/components/icons';

  let items = $state([]);
  let isLoading = $state(true);
  let error = $state(null);
  let newSymbol = $state('');
  let newThreshold = $state(2.0);
  let isAdding = $state(false);

  async function loadWatchlist() {
    isLoading = true;
    error = null;
    try {
      const res = await fetch('/api/watchlist');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      items = data.items || [];
    } catch (err) {
      error = err.message;
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    loadWatchlist();
  });

  async function addItem(e) {
    e.preventDefault();
    if (!newSymbol) return;

    isAdding = true;
    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: newSymbol.trim().toUpperCase(),
          alert_threshold: Number(newThreshold) || 2.0
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to add symbol');
      }

      newSymbol = '';
      await loadWatchlist();
    } catch (err) {
      alert(err.message);
    } finally {
      isAdding = false;
    }
  }

  async function removeItem(symbol) {
    try {
      await fetch(`/api/watchlist?symbol=${symbol}`, { method: 'DELETE' });
      await loadWatchlist();
    } catch (err) {
      alert(`Failed to remove: ${err.message}`);
    }
  }
</script>

<svelte:head>
  <title>Portfolio Watchlist — MarketPulse Finance</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="border-b border-slate-200 pb-4 flex flex-wrap items-center justify-between gap-4">
    <div>
      <h1 class="text-xl md:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
        <span>Portfolio Watchlist</span>
        <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
          {items.length} Monitored
        </span>
      </h1>
      <p class="text-xs text-slate-500 mt-1">
        Track your favorite Indian equities with live 15-minute quotes and impact alert triggers.
      </p>
    </div>

    <!-- Quick Add Form -->
    <form onsubmit={addItem} class="flex items-center gap-2 text-xs">
      <input
        type="text"
        bind:value={newSymbol}
        placeholder="Add Symbol (e.g. TCS)..."
        class="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 placeholder-slate-400 uppercase font-mono focus:outline-none focus:border-blue-500 shadow-2xs text-xs"
        required
      />
      <button
        type="submit"
        disabled={isAdding}
        class="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg cursor-pointer transition-colors shadow-2xs disabled:opacity-60"
      >
        {isAdding ? 'Adding...' : '+ Add Symbol'}
      </button>
    </form>
  </div>

  {#if isLoading}
    <div class="py-20 text-center font-mono text-xs text-slate-400 space-y-3">
      <div class="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p class="font-sans text-slate-600 font-medium text-xs">Retrieving watchlist quotes...</p>
    </div>
  {:else if error}
    <div class="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono">
      Error: {error}
    </div>
  {:else if items.length === 0}
    <div class="p-12 text-center bg-white border border-slate-200 rounded-lg shadow-2xs space-y-3">
      <div class="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
        <BookmarkIcon size={24} />
      </div>
      <h3 class="text-base font-bold text-slate-800">Your Watchlist is empty</h3>
      <p class="text-xs text-slate-500 max-w-sm mx-auto">
        Search for any Indian company on the Stock Screener or type a symbol above to start monitoring.
      </p>
      <a
        href="/companies"
        class="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors"
      >
        <span>Explore Stock Screener</span>
        <ArrowUpRightIcon size={12} />
      </a>
    </div>
  {:else}
    <div class="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="screener-table">
          <thead>
            <tr>
              <th class="text-left">Symbol</th>
              <th class="text-left">Company Name</th>
              <th class="text-right">Last Price (₹)</th>
              <th class="text-right">Change</th>
              <th class="text-right">Change %</th>
              <th class="text-right">Alert Threshold</th>
              <th class="text-center">Data Freshness</th>
              <th class="text-center">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {#each items as item}
              <tr class="hover:bg-slate-50 transition-colors">
                <td class="font-mono font-bold text-blue-600 text-sm">
                  <a href="/company/{item.symbol}" class="hover:underline">{item.symbol}</a>
                </td>
                <td class="text-xs font-medium text-slate-800">
                  {item.company_name}
                </td>
                <td class="text-right font-bold text-slate-900 font-mono tabular-nums">
                  ₹{item.last_price?.toLocaleString('en-IN') || '—'}
                </td>
                <td class="text-right font-semibold font-mono tabular-nums text-xs {item.change >= 0 ? 'text-emerald-700' : 'text-rose-700'}">
                  {item.change >= 0 ? '+' : ''}{item.change?.toFixed(2) || '0.00'}
                </td>
                <td class="text-right">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold tabular-nums {item.change_percent >= 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}">
                    {item.change_percent >= 0 ? '+' : ''}{item.change_percent || 0}%
                  </span>
                </td>
                <td class="text-right text-xs font-mono text-slate-600">
                  ±{item.alert_threshold}%
                </td>
                <td class="text-center">
                  <DataBadge status={item.data_status || 'DELAYED_15M'} size="xs" />
                </td>
                <td class="text-center space-x-2">
                  <a
                    href="/company/{item.symbol}"
                    class="px-2.5 py-1 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white font-semibold rounded text-xs transition-colors"
                  >
                    Analyze
                  </a>
                  <button
                    onclick={() => removeItem(item.symbol)}
                    class="px-2.5 py-1 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white font-semibold rounded text-xs transition-colors cursor-pointer"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>
