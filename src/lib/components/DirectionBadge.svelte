<script>
  import { TrendingUpIcon, TrendingDownIcon } from '$lib/components/icons/index.js';

  let { direction = 'UNCLEAR_NEGLIGIBLE', size = 'md' } = $props();

  const configs = {
    POSITIVE: {
      label: 'POSITIVE',
      icon: 'UP',
      classes: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-bold',
      title: 'Potential positive economic / business implication'
    },
    NEGATIVE: {
      label: 'NEGATIVE',
      icon: 'DOWN',
      classes: 'bg-rose-500/15 text-rose-400 border-rose-500/30 font-bold',
      title: 'Potential negative economic / business implication'
    },
    MIXED: {
      label: 'MIXED',
      icon: 'DOT',
      classes: 'bg-amber-500/15 text-amber-300 border-amber-500/30 font-bold',
      title: 'Conflicting cross-currents or divergent business segment implications'
    },
    UNCLEAR_NEGLIGIBLE: {
      label: 'UNCLEAR',
      icon: 'DOT',
      classes: 'bg-slate-500/15 text-slate-300 border-slate-500/30 font-medium',
      title: 'Insufficient evidence to determine reliable direction'
    }
  };

  const config = $derived(configs[direction] || configs.UNCLEAR_NEGLIGIBLE);
  const sizeClasses = $derived(size === 'sm' ? 'text-[10px] px-2.5 py-0.5' : 'text-xs px-3 py-1');
</script>

<span
  class="inline-flex items-center gap-1.5 rounded-full border tracking-wide uppercase font-mono shadow-xs {config.classes} {sizeClasses}"
  title={config.title}
>
  {#if config.icon === 'UP'}
    <TrendingUpIcon size={size === 'sm' ? 11 : 13} />
  {:else if config.icon === 'DOWN'}
    <TrendingDownIcon size={size === 'sm' ? 11 : 13} />
  {:else}
    <span class="w-1.5 h-1.5 rounded-full bg-current opacity-80"></span>
  {/if}
  <span>{config.label}</span>
</span>


