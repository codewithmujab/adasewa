<script lang="ts">
	interface Props {
		icon: string;
		class?: string;
	}

	let { icon, class: className = 'h-5 w-5' }: Props = $props();
</script>

{#if icon === 'projector'}
	<svg class={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
		<rect x="2" y="7" width="20" height="10" rx="2.5" />
		<circle cx="15.5" cy="12" r="2.75" />
		<path stroke-linecap="round" d="M6 12h4M6 15h2M5 17v2M19 17v2" />
	</svg>
{:else if icon === 'audio'}
	<svg class={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
		<rect x="5" y="3" width="14" height="18" rx="2.5" />
		<circle cx="12" cy="14" r="3.5" />
		<circle cx="12" cy="7.5" r="1.25" />
	</svg>
{:else if icon === 'camera'}
	<svg class={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
		<path stroke-linecap="round" stroke-linejoin="round" d="M4 8.5A2.5 2.5 0 016.5 6h1.6l1.3-2h5.2l1.3 2h1.6A2.5 2.5 0 0120 8.5v9A2.5 2.5 0 0117.5 20h-11A2.5 2.5 0 014 17.5v-9z" />
		<circle cx="12" cy="13" r="3.5" />
	</svg>
{:else if icon === 'gadget'}
	<svg class={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
		<rect x="3" y="4.5" width="13" height="10" rx="2" />
		<path stroke-linecap="round" d="M2 17.5h15" />
		<rect x="15.5" y="9" width="6" height="10.5" rx="1.5" fill="white" />
		<path stroke-linecap="round" d="M18.5 17h.01" />
	</svg>
{:else if icon === 'event'}
	<svg class={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
		<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v3m6.364.636l-2.121 2.121M21 12h-3M5.636 6.636l2.121 2.121M6 12H3m6.5 8h5m-6-3h7l1-4.5a4.5 4.5 0 10-9 0L8.5 17z" />
	</svg>
{:else if icon === 'music'}
	<svg class={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
		<path stroke-linecap="round" stroke-linejoin="round" d="M9 18V6.5l11-2V16" />
		<circle cx="6.5" cy="18" r="2.5" />
		<circle cx="17.5" cy="16" r="2.5" />
	</svg>
{:else if icon === 'vehicle'}
	<svg class={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
		<path stroke-linecap="round" stroke-linejoin="round" d="M4 13l1.8-5.2A2 2 0 017.7 6.5h8.6a2 2 0 011.9 1.3L20 13m-16 0h16v4.5a1 1 0 01-1 1h-1.5a1 1 0 01-1-1V16.5h-9v1a1 1 0 01-1 1H5a1 1 0 01-1-1V13z" />
		<circle cx="7.5" cy="14" r="1" fill="currentColor" stroke="none" />
		<circle cx="16.5" cy="14" r="1" fill="currentColor" stroke="none" />
	</svg>
{:else if icon === 'baby'}
	<svg class={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
		<path stroke-linecap="round" stroke-linejoin="round" d="M5 10h13l-1.5 6H7.5L5 10zm0 0L3.5 6.5H2m9 3.5V4.5a5.5 5.5 0 015.5 5.5" />
		<circle cx="8.5" cy="19" r="1.75" />
		<circle cx="15.5" cy="19" r="1.75" />
	</svg>
{:else if icon === 'camping'}
	<svg class={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
		<path stroke-linecap="round" stroke-linejoin="round" d="M3 19L12 5l9 14H3z" />
		<path stroke-linecap="round" stroke-linejoin="round" d="M9.5 19L12 13l2.5 6" />
	</svg>
{:else if icon === 'graduation'}
	<svg class={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
		<path stroke-linecap="round" stroke-linejoin="round" d="M12 4L2 9l10 5 10-5-10-5z" />
		<path stroke-linecap="round" stroke-linejoin="round" d="M6 11v5.2c0 1.4 2.7 2.8 6 2.8s6-1.4 6-2.8V11m4-2v5" />
	</svg>
{:else}
	<svg class={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
		<path stroke-linecap="round" stroke-linejoin="round" d="M21 8.5L12 3 3 8.5m18 0v7L12 21l-9-5.5v-7m18 0L12 14m0 0L3 8.5m9 5.5v7" />
	</svg>
{/if}
