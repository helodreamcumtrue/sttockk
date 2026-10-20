<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { SearchIcon, CloseIcon } from '$lib/components/icons/index.js';

  let { isOpen = $bindable(false) } = $props();

  let queryText = $state('');
  let companies = $state([]);
  let sectors = $state([]);
  let news = $state([]);
  let isLoading = $state(false);

  async function performSearch(val) {
    if (!val || val.trim().length < 2) {
      companies = [];
      sectors = [];
      news = [];
      return;
    }

    isLoading = true;
    try {
      const [compRes, secRes, newsRes] = await Promise.all([
        fetch(`/api/companies?q=${encodeURIComponent(val)}`).then(r => r.json()),
        fetch('/api/sectors').then(r => r.json()),
        fetch(`/api/news?q=${encodeURIComponent(val)}&limit=5`).then(r => r.json())
      ]);

      companies = (compRes.companies || []).slice(0, 8);
      sectors = (secRes.sectors || []).filter(s =>
        s.name.toLowerCase().includes(val.toLowerCase()) || s.code.toLowerCase().includes(val.toLowerCase())
      );
      news = newsRes.articles || [];
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      isLoading = false;
    }
  }

  $effect(() => {
    performSearch(queryText);
  });

  function close() {
    isOpen = false;
    queryText = '';
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') close();
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      isOpen = !isOpen;
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  });

  function navigateTo(url) {
    close();
    goto(url);
  }
</script>

{#if isOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-start justify-center pt-20 px-4"
    onclick={close}
  >
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
      class="bg-white border border-slate-200 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden"
      onclick={e => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-label="Universal Financial Intelligence Search"
      tabindex="-1"
    >
      <!-- Search Input (Google Finance clean search box) -->
      <div class="flex items-center px-4 border-b border-slate-200 bg-white">
        <SearchIcon size={18} class="text-slate-400 mr-3" />
        <!-- svelte-ignore a11y_autofocus -->
        <input
          type="text"
          bind:value={queryText}
          placeholder="Search Indian stocks (e.g. RELIANCE, TCS, HDFCBANK), sectors, or news..."
          class="w-full bg-transparent py-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
          autofocus
        />
        {#if queryText}
          <button onclick={() => queryText = ''} class="text-xs text-slate-400 hover:text-slate-700 px-2 py-1 cursor-pointer flex items-center gap-1">
            <CloseIcon size={14} />
          </button>
        {/if}
        <kbd class="text-[11px] font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200 ml-2 font-semibold">ESC</kbd>
      </div>

      <!-- Results pane -->
      <div class="max-h-96 overflow-y-auto p-4 space-y-4">
        {#if isLoading}
          <div class="text-center py-6 text-slate-400 text-xs">Searching market database...</div>
        {:else if !queryText || queryText.length < 2}
          <div class="text-center py-6 text-slate-500 text-xs">
            Type at least 2 characters to search across Indian equities, sectors, and intelligence reports.
          </div>
        {:else if companies.length === 0 && sectors.length === 0 && news.length === 0}
          <div class="text-center py-6 text-slate-500 text-xs">
            No matching companies, sectors, or news events found for "{queryText}".
          </div>
        {:else}
          <!-- Companies -->
          {#if companies.length > 0}
            <div>
              <div class="text-[10px] uppercase tracking-wider text-slate-400 mb-2 font-bold">
                LISTED EQUITIES ({companies.length})
              </div>
              <div class="space-y-1">
                {#each companies as c}
                  <button
                    onclick={() => navigateTo(`/company/${c.symbol}`)}
                    class="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 text-left transition-colors cursor-pointer group"
                  >
                    <div class="flex items-center gap-2">
                      <span class="font-mono font-bold text-blue-600 group-hover:text-blue-800 text-sm">{c.symbol}</span>
                      <span class="text-slate-800 text-xs font-medium">{c.name}</span>
                      <span class="text-[10px] text-slate-400">({c.sub_industry})</span>
                    </div>
                    {#if c.last_price}
                      <div class="text-right">
                        <span class="font-mono text-xs font-bold text-slate-900 tabular-nums">₹{c.last_price.toLocaleString('en-IN')}</span>
                        {#if c.change_percent !== undefined}
                          <span class="text-[11px] font-mono font-semibold ml-2 {c.change_percent >= 0 ? 'text-emerald-700' : 'text-rose-700'}">
                            {c.change_percent >= 0 ? '+' : ''}{c.change_percent}%
                          </span>
                        {/if}
                      </div>
                    {/if}
                  </button>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Sectors -->
          {#if sectors.length > 0}
            <div class="border-t border-slate-100 pt-3">
              <div class="text-[10px] uppercase tracking-wider text-slate-400 mb-2 font-bold">
                SECTORS ({sectors.length})
              </div>
              <div class="space-y-1">
                {#each sectors as s}
                  <button
                    onclick={() => navigateTo(`/sectors/${s.id}`)}
                    class="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 text-left transition-colors cursor-pointer group"
                  >
                    <div>
                      <span class="font-semibold text-slate-800 text-xs">{s.name}</span>
                      <span class="text-slate-400 text-xs ml-2">[{s.benchmark_index}]</span>
                    </div>
                    <span class="text-xs text-slate-400 font-mono">{s.company_count} Companies</span>
                  </button>
                {/each}
              </div>
            </div>
          {/if}

          <!-- News -->
          {#if news.length > 0}
            <div class="border-t border-slate-100 pt-3">
              <div class="text-[10px] uppercase tracking-wider text-slate-400 mb-2 font-bold">
                FINANCIAL CATALYSTS & REPORTS ({news.length})
              </div>
              <div class="space-y-1.5">
                {#each news as n}
                  <button
                    onclick={() => navigateTo(`/news/${n.id}`)}
                    class="w-full p-2.5 rounded-lg hover:bg-slate-50 text-left transition-colors cursor-pointer group"
                  >
                    <div class="text-xs font-semibold text-slate-900 group-hover:text-blue-600 line-clamp-1">{n.title}</div>
                    <div class="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-mono">
                      <span>{n.event_category}</span>
                      <span>•</span>
                      <span>{n.verification_status}</span>
                    </div>
                  </button>
                {/each}
              </div>
            </div>
          {/if}
        {/if}
      </div>
    </div>
  </div>
{/if}
