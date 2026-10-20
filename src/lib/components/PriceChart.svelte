<script>
  let { candles = [], symbol = 'RELIANCE', currentPrice = 0, benchmarkCandles = [] } = $props();

  let chartMode = $state('area'); // 'area' or 'candles'
  let activeRange = $state('1mo');
  let hoveredPoint = $state(null);

  // Filter candles based on active range
  const filteredCandles = $derived.by(() => {
    if (!candles || candles.length === 0) return [];
    if (activeRange === '5d') return candles.slice(-5);
    if (activeRange === '1mo') return candles.slice(-22);
    if (activeRange === '3mo') return candles.slice(-66);
    if (activeRange === '6mo') return candles.slice(-132);
    return candles;
  });

  // Calculate scales
  const stats = $derived.by(() => {
    if (filteredCandles.length === 0) {
      return { min: 0, max: 100, maxVol: 100, firstClose: 100, lastClose: 100, changePct: 0 };
    }
    let min = Infinity;
    let max = -Infinity;
    let maxVol = 0;

    for (const c of filteredCandles) {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
      if (c.volume > maxVol) maxVol = c.volume;
    }

    // Add padding to price scale
    const padding = (max - min) * 0.08 || 5;
    min = Math.max(0, min - padding);
    max = max + padding;

    const firstClose = filteredCandles[0]?.close || 1;
    const lastClose = filteredCandles[filteredCandles.length - 1]?.close || firstClose;
    const changePct = Number((((lastClose - firstClose) / firstClose) * 100).toFixed(2));

    return { min, max, maxVol: maxVol || 1, firstClose, lastClose, changePct };
  });

  // SVG dimensions
  const width = 800;
  const height = 360;
  const priceHeight = 270;
  const volHeight = 65;
  const volTop = 295;

  function getX(index) {
    if (filteredCandles.length <= 1) return width / 2;
    return (index / (filteredCandles.length - 1)) * (width - 80) + 10;
  }

  function getY(price) {
    if (stats.max === stats.min) return priceHeight / 2;
    return priceHeight - ((price - stats.min) / (stats.max - stats.min)) * (priceHeight - 30) - 15;
  }

  function getVolY(volume) {
    return height - ((volume / stats.maxVol) * volHeight);
  }

  // SVG Area path generator
  const areaPath = $derived.by(() => {
    if (filteredCandles.length === 0) return '';
    const points = filteredCandles.map((c, i) => `${getX(i).toFixed(1)},${getY(c.close).toFixed(1)}`);
    const firstX = getX(0).toFixed(1);
    const lastX = getX(filteredCandles.length - 1).toFixed(1);
    return `M ${firstX},${priceHeight} L ${points.join(' L ')} L ${lastX},${priceHeight} Z`;
  });

  const linePath = $derived.by(() => {
    if (filteredCandles.length === 0) return '';
    const points = filteredCandles.map((c, i) => `${getX(i).toFixed(1)},${getY(c.close).toFixed(1)}`);
    return `M ${points.join(' L ')}`;
  });

  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, (mouseX - 10) / (width - 80)));
    const index = Math.round(ratio * (filteredCandles.length - 1));
    if (filteredCandles[index]) {
      hoveredPoint = {
        candle: filteredCandles[index],
        index,
        x: getX(index),
        y: getY(filteredCandles[index].close)
      };
    }
  }

  function handleMouseLeave() {
    hoveredPoint = null;
  }
</script>

<div class="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
  <!-- Controls bar (Screener.in format) -->
  <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
    <div class="flex items-center gap-3">
      <span class="text-xs font-bold font-mono tracking-wider text-slate-800">
        {symbol} NSE PRICE & VOLUME
      </span>
      <span
        class="text-xs font-mono font-bold px-2 py-0.5 rounded-full {stats.changePct >= 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}"
      >
        {stats.changePct >= 0 ? '+' : ''}{stats.changePct}% in period
      </span>
    </div>

    <div class="flex items-center gap-2">
      <!-- Chart mode toggle -->
      <div class="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
        <button
          onclick={() => chartMode = 'area'}
          class="px-2.5 py-1 rounded-md transition-colors cursor-pointer {chartMode === 'area' ? 'bg-white text-blue-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'}"
        >
          Area
        </button>
        <button
          onclick={() => chartMode = 'candles'}
          class="px-2.5 py-1 rounded-md transition-colors cursor-pointer {chartMode === 'candles' ? 'bg-white text-blue-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'}"
        >
          Candles
        </button>
      </div>

      <!-- Range selector (Screener.in pills) -->
      <div class="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-mono">
        {#each ['5d', '1mo', '3mo'] as range}
          <button
            onclick={() => activeRange = range}
            class="px-2.5 py-1 rounded-md uppercase transition-colors cursor-pointer {activeRange === range ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'}"
          >
            {range}
          </button>
        {/each}
      </div>
    </div>
  </div>

  <!-- Active tooltip readouts -->
  {#if hoveredPoint}
    <div class="flex flex-wrap items-center gap-4 text-xs font-mono bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-slate-700">
      <span class="text-slate-500">Date: <strong class="text-slate-900">{hoveredPoint.candle.date}</strong></span>
      <span>O: <strong class="text-slate-800">₹{hoveredPoint.candle.open}</strong></span>
      <span>H: <strong class="text-emerald-700">₹{hoveredPoint.candle.high}</strong></span>
      <span>L: <strong class="text-rose-700">₹{hoveredPoint.candle.low}</strong></span>
      <span>C: <strong class="text-blue-700 font-bold">₹{hoveredPoint.candle.close}</strong></span>
      <span>Vol: <strong class="text-slate-800">{Number(hoveredPoint.candle.volume).toLocaleString('en-IN')}</strong></span>
    </div>
  {:else}
    <div class="flex items-center gap-4 text-xs font-mono text-slate-400 p-2">
      <span>Hover or drag crosshair over chart to inspect historical candle details & volume</span>
    </div>
  {/if}

  <!-- SVG Chart Canvas -->
  {#if filteredCandles.length > 0}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="relative w-full overflow-hidden cursor-crosshair select-none bg-slate-50/50 rounded-lg p-2 border border-slate-100"
      onmousemove={handleMouseMove}
      onmouseleave={handleMouseLeave}
    >
      <svg
        viewBox="0 0 {width} {height}"
        class="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#1a73e8" stop-opacity="0.25" />
            <stop offset="100%" stop-color="#1a73e8" stop-opacity="0.0" />
          </linearGradient>
        </defs>

        <!-- Horizontal grid lines -->
        {#each [0.2, 0.4, 0.6, 0.8] as frac}
          {@const pVal = stats.min + (stats.max - stats.min) * frac}
          <line
            x1="10"
            y1={priceHeight * (1 - frac)}
            x2={width - 70}
            y2={priceHeight * (1 - frac)}
            stroke="#e2e8f0"
            stroke-width="1"
            stroke-dasharray="3,3"
          />
          <text
            x={width - 65}
            y={priceHeight * (1 - frac) + 4}
            fill="#94a3b8"
            font-size="10"
            font-family="monospace"
          >
            ₹{pVal.toFixed(0)}
          </text>
        {/each}

        <!-- Volume pane separator -->
        <line x1="10" y1={volTop - 10} x2={width - 70} y2={volTop - 10} stroke="#cbd5e1" stroke-width="1" />
        <text x="12" y={volTop - 2} fill="#94a3b8" font-size="9" font-family="monospace" uppercase>VOLUME</text>

        <!-- Volume histogram bars -->
        {#each filteredCandles as c, i}
          {@const x = getX(i)}
          {@const barW = Math.max(2, (width / filteredCandles.length) * 0.65)}
          {@const isUp = c.close >= c.open}
          <rect
            x={x - barW / 2}
            y={getVolY(c.volume)}
            width={barW}
            height={height - getVolY(c.volume)}
            fill={isUp ? '#0d9f67' : '#d93025'}
            opacity="0.6"
          />
        {/each}

        <!-- Price rendering: Area or Candlesticks -->
        {#if chartMode === 'area'}
          <path d={areaPath} fill="url(#areaGradient)" />
          <path d={linePath} fill="none" stroke="#1a73e8" stroke-width="2" stroke-linecap="round" />
        {:else}
          {#each filteredCandles as c, i}
            {@const x = getX(i)}
            {@const isUp = c.close >= c.open}
            {@const candleColor = isUp ? '#0d9f67' : '#d93025'}
            {@const bodyTop = getY(Math.max(c.open, c.close))}
            {@const bodyBottom = getY(Math.min(c.open, c.close))}
            {@const bodyHeight = Math.max(2, bodyBottom - bodyTop)}
            {@const barW = Math.max(3, (width / filteredCandles.length) * 0.7)}

            <!-- Wick -->
            <line
              x1={x}
              y1={getY(c.high)}
              x2={x}
              y2={getY(c.low)}
              stroke={candleColor}
              stroke-width="1.5"
            />
            <!-- Body -->
            <rect
              x={x - barW / 2}
              y={bodyTop}
              width={barW}
              height={bodyHeight}
              fill={candleColor}
              stroke={candleColor}
              stroke-width="0.5"
            />
          {/each}
        {/if}

        <!-- Hover crosshair -->
        {#if hoveredPoint}
          <!-- Vertical line -->
          <line
            x1={hoveredPoint.x}
            y1="5"
            x2={hoveredPoint.x}
            y2={height}
            stroke="#64748b"
            stroke-width="1"
            stroke-dasharray="2,2"
          />
          <!-- Horizontal line -->
          <line
            x1="10"
            y1={hoveredPoint.y}
            x2={width - 70}
            y2={hoveredPoint.y}
            stroke="#64748b"
            stroke-width="1"
            stroke-dasharray="2,2"
          />
          <!-- Highlight dot -->
          <circle
            cx={hoveredPoint.x}
            cy={hoveredPoint.y}
            r="4.5"
            fill="#1a73e8"
            stroke="#ffffff"
            stroke-width="2"
          />
        {/if}
      </svg>
    </div>
  {:else}
    <div class="h-64 flex flex-col items-center justify-center text-slate-400 font-mono text-sm">
      <p>No historical candles available for this symbol.</p>
    </div>
  {/if}
</div>
