<script>
  let { nodes = [], edges = [], onNodeClick = null } = $props();

  let selectedNode = $state(null);
  let hoveredEdge = $state(null);

  // SVG dimensions
  const width = 860;
  const height = 440;

  // Compute layout positions for nodes
  // Event node in center-left, Sectors in middle, Companies on right
  const positionedNodes = $derived.by(() => {
    const eventNodes = nodes.filter(n => n.type === 'EVENT');
    const sectorNodes = nodes.filter(n => n.type === 'SECTOR');
    const companyNodes = nodes.filter(n => n.type === 'COMPANY');

    const result = [];

    // Event node
    eventNodes.forEach(n => {
      result.push({ ...n, x: 120, y: height / 2 });
    });

    // Sector nodes
    sectorNodes.forEach((n, idx) => {
      const step = height / (sectorNodes.length + 1);
      result.push({ ...n, x: 380, y: step * (idx + 1) });
    });

    // Company nodes
    companyNodes.forEach((n, idx) => {
      const step = height / (companyNodes.length + 1);
      result.push({ ...n, x: 680, y: step * (idx + 1) });
    });

    return result;
  });

  const nodePosMap = $derived(new Map(positionedNodes.map(n => [n.id, n])));

  function selectNode(node) {
    selectedNode = node;
    if (onNodeClick) onNodeClick(node);
  }
</script>

<div class="bg-slate-950 border border-slate-800 rounded-lg p-4">
  <div class="flex flex-wrap items-center justify-between gap-2 mb-3 border-b border-slate-800 pb-2">
    <div class="flex items-center gap-2">
      <span class="text-xs uppercase font-mono font-bold tracking-wider text-slate-300">
        INTERACTIVE CAUSAL IMPACT GRAPH
      </span>
      <span class="text-[11px] text-slate-500 font-mono">
        (Click any node or link to trace economic transmission)
      </span>
    </div>

    <div class="flex items-center gap-4 text-xs font-mono">
      <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Positive</span>
      <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Negative</span>
      <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Mixed / Unclear</span>
    </div>

  </div>

  <div class="relative w-full overflow-hidden select-none">
    <svg viewBox="0 0 {width} {height}" class="w-full h-auto" preserveAspectRatio="xMidYMid meet">
      <defs>
        <!-- Arrowhead markers -->
        <marker id="arrow-pos" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
        </marker>
        <marker id="arrow-neg" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#f43f5e" />
        </marker>
        <marker id="arrow-mixed" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
        </marker>
        <marker id="arrow-default" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
        </marker>
      </defs>

      <!-- Draw Edges -->
      {#each edges as edge}
        {@const src = nodePosMap.get(edge.source)}
        {@const tgt = nodePosMap.get(edge.target)}
        {#if src && tgt}
          {@const isPos = edge.direction === 'POSITIVE'}
          {@const isNeg = edge.direction === 'NEGATIVE'}
          {@const isMixed = edge.direction === 'MIXED'}
          {@const strokeColor = isPos ? '#10b981' : (isNeg ? '#f43f5e' : (isMixed ? '#f59e0b' : '#475569'))}
          {@const marker = isPos ? 'url(#arrow-pos)' : (isNeg ? 'url(#arrow-neg)' : (isMixed ? 'url(#arrow-mixed)' : 'url(#arrow-default)'))}
          {@const midX = (src.x + tgt.x) / 2}
          {@const midY = (src.y + tgt.y) / 2}

          <!-- Curved bezier path -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <path
            d="M {src.x} {src.y} C {midX} {src.y}, {midX} {tgt.y}, {tgt.x} {tgt.y}"
            fill="none"
            stroke={strokeColor}
            stroke-width="2"
            stroke-dasharray={edge.relation === 'INDIRECT' ? '4,4' : 'none'}
            opacity={hoveredEdge === edge ? "1" : "0.75"}
            marker-end={marker}
            class="transition-opacity cursor-pointer hover:stroke-[3]"
            onmouseenter={() => hoveredEdge = edge}
            onmouseleave={() => hoveredEdge = null}
          />

          {#if edge.label}
            <text
              x={midX}
              y={midY - 6}
              text-anchor="middle"
              fill={strokeColor}
              font-size="9"
              font-family="monospace"
              font-weight="bold"
            >
              {edge.label}
            </text>
          {/if}
        {/if}
      {/each}

      <!-- Draw Nodes -->
      {#each positionedNodes as node}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <g
          transform="translate({node.x}, {node.y})"
          class="cursor-pointer group"
          onclick={() => selectNode(node)}
        >
          {#if node.type === 'EVENT'}
            <!-- Event node shape -->
            <polygon
              points="-55,-25 55,-25 65,0 55,25 -55,25 -65,0"
              fill="#1e1b4b"
              stroke="#818cf8"
              stroke-width="2"
            />
            <text y="-4" text-anchor="middle" fill="#c7d2fe" font-size="10" font-weight="bold" font-family="sans-serif">
              EVENT SHOCK
            </text>
            <text y="12" text-anchor="middle" fill="#ffffff" font-size="9" font-family="monospace">
              {node.label}
            </text>
          {:else if node.type === 'SECTOR'}
            <!-- Sector node shape -->
            <rect
              x="-60"
              y="-20"
              width="120"
              height="40"
              rx="4"
              fill="#0f172a"
              stroke="#38bdf8"
              stroke-width="1.5"
            />
            <text y="-2" text-anchor="middle" fill="#7dd3fc" font-size="10" font-weight="bold" font-family="sans-serif">
              SECTOR
            </text>
            <text y="12" text-anchor="middle" fill="#e2e8f0" font-size="9" font-family="monospace">
              {node.label.slice(0, 16)}
            </text>
          {:else}
            <!-- Company node shape -->
            {@const isPos = node.direction === 'POSITIVE'}
            {@const isNeg = node.direction === 'NEGATIVE'}
            {@const compStroke = isPos ? '#10b981' : (isNeg ? '#f43f5e' : '#f59e0b')}
            {@const compBg = isPos ? '#064e3b' : (isNeg ? '#4c0519' : '#451a03')}

            <rect
              x="-55"
              y="-24"
              width="110"
              height="48"
              rx="6"
              fill={compBg}
              stroke={compStroke}
              stroke-width={selectedNode?.symbol === node.symbol ? "3" : "1.8"}
            />
            <text y="-6" text-anchor="middle" fill="#ffffff" font-size="12" font-weight="bold" font-family="monospace">
              {node.symbol}
            </text>
            <text y="8" text-anchor="middle" fill="#cbd5e1" font-size="9" font-family="sans-serif">
              {node.exposure_type || 'EXPOSURE'}
            </text>
            <text y="18" text-anchor="middle" fill={compStroke} font-size="9" font-mono font-bold>
              {node.direction} ({node.impact_score}/100)
            </text>
          {/if}
        </g>
      {/each}
    </svg>
  </div>

  <!-- Interactive Inspector Box -->
  {#if selectedNode}
    <div class="mt-4 p-3 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono flex flex-wrap items-center justify-between gap-3">
      <div>
        <span class="text-slate-400">Selected Node:</span>
        <strong class="text-sky-400 ml-1.5 font-bold uppercase">{selectedNode.label || selectedNode.symbol}</strong>
        {#if selectedNode.type === 'COMPANY'}
          <span class="ml-2 text-slate-300">({selectedNode.name})</span>
          <span class="ml-2 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold {selectedNode.direction === 'POSITIVE' ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'}">
            {selectedNode.direction} Impact ({selectedNode.impact_score}/100)
          </span>
        {/if}
      </div>

      {#if selectedNode.symbol}
        <a
          href="/company/{selectedNode.symbol}"
          class="px-3 py-1 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded transition-colors text-xs"
        >
          Open {selectedNode.symbol} Dashboard
        </a>
      {/if}
    </div>
  {/if}
</div>
