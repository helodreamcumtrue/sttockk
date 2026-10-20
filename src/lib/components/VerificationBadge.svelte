<script>
  import { CheckIcon, ClockIcon, AlertCircleIcon } from '$lib/components/icons/index.js';

  let { status = 'REPORTED_AWAITING_CORROBORATION', score = 50, showScore = true } = $props();

  const statusConfigs = {
    OFFICIALLY_DISCLOSED: {
      label: 'Officially Disclosed',
      color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-bold',
      iconType: 'CHECK'
    },
    INDEPENDENTLY_CORROBORATED: {
      label: 'Corroborated',
      color: 'bg-sky-500/15 text-sky-400 border-sky-500/30 font-bold',
      iconType: 'CHECK'
    },
    REPORTED_AWAITING_CORROBORATION: {
      label: 'Awaiting Corroboration',
      color: 'bg-amber-500/15 text-amber-300 border-amber-500/30 font-medium',
      iconType: 'CLOCK'
    },
    PRELIMINARY_DEVELOPING: {
      label: 'Preliminary',
      color: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30 font-medium',
      iconType: 'ALERT'
    },
    CORRECTED: {
      label: 'Corrected',
      color: 'bg-blue-500/15 text-blue-300 border-blue-500/30 font-medium',
      iconType: 'ALERT'
    },
    RETRACTED: {
      label: 'Retracted',
      color: 'bg-rose-500/15 text-rose-300 border-rose-500/30 line-through font-medium',
      iconType: 'ALERT'
    },
    CONFLICTING_REPORTS: {
      label: 'Conflicting Reports',
      color: 'bg-purple-500/15 text-purple-300 border-purple-500/30 font-medium',
      iconType: 'ALERT'
    }
  };

  const current = $derived(statusConfigs[status] || statusConfigs.REPORTED_AWAITING_CORROBORATION);
</script>

<div class="inline-flex items-center gap-1.5">
  <span class="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full border {current.color} shadow-xs">
    {#if current.iconType === 'CHECK'}
      <CheckIcon size={11} class="text-current inline" />
    {:else if current.iconType === 'CLOCK'}
      <ClockIcon size={11} class="text-current inline" />
    {:else}
      <AlertCircleIcon size={11} class="text-current inline" />
    {/if}
    <span>{current.label}</span>
  </span>

  {#if showScore}
    <span
      class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-bold"
      title="Verification Evidence Quality Score (0-100)"
    >
      {score}/100
    </span>
  {/if}
</div>


