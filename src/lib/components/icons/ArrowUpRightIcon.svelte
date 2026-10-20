<script>
  let { size = 16, class: className = '' } = $props();
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  class={className}
>
  <line x1="7" y1="17" x2="17" y2="7"></line>
  <polyline points="7 7 17 7 17 17"></polyline>
</svg>
