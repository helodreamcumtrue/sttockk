<script>
  let { status = 'DELAYED_15M', size = 'sm' } = $props();

  const configs = {
    LIVE: {
      label: 'LIVE',
      classes: 'bg-emerald-950/60 text-emerald-400 border-emerald-500/50',
      dotClass: 'bg-emerald-400 animate-pulse',
      desc: 'Real-time live exchange tick feed'
    },
    DELAYED_15M: {
      label: 'DELAYED 15M',
      classes: 'bg-amber-950/60 text-amber-400 border-amber-500/50',
      dotClass: 'bg-amber-400',
      desc: '15-minute delayed market quote as per exchange policy'
    },
    HISTORICAL: {
      label: 'HISTORICAL',
      classes: 'bg-slate-800 text-slate-300 border-slate-600',
      dotClass: 'bg-slate-400',
      desc: 'Previous end-of-day market closing data'
    },
    LAST_AVAILABLE: {
      label: 'LAST QUOTE',
      classes: 'bg-zinc-800 text-zinc-300 border-zinc-600',
      dotClass: 'bg-zinc-400',
      desc: 'Last cached quote record'
    },
    SYNTHETIC_DEMO: {
      label: 'DEMO / SYNTHETIC',
      classes: 'bg-purple-950/70 text-purple-300 border-purple-500/60 font-semibold',
      dotClass: 'bg-purple-400',
      desc: 'Simulated educational seed data. Not an actual trade price.'
    },
    INDICATIVE: {
      label: 'INDICATIVE',
      classes: 'bg-sky-950/60 text-sky-400 border-sky-500/50',
      dotClass: 'bg-sky-400',
      desc: 'Indicative macro reference benchmark'
    }
  };

  const config = $derived(configs[status] || configs.LAST_AVAILABLE);
  const sizeClasses = $derived(size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5');
</script>

<span
  class="inline-flex items-center gap-1.5 font-mono uppercase tracking-wider rounded-full border shadow-xs {config.classes} {sizeClasses}"
  title={config.desc}
>
  <span class="w-1.5 h-1.5 rounded-full {config.dotClass}"></span>
  <span>{config.label}</span>
</span>

