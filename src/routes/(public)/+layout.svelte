<script lang="ts">
	import type { Snippet } from 'svelte';
	import Footer from '#lib/components/public/Footer.svelte';
	import Navbar from '#lib/components/public/Navbar.svelte';
	import type { LayoutData } from './$types';

	interface Props {
		data: LayoutData;
		children: Snippet;
	}

	let { data, children }: Props = $props();
</script>

<div class="flex min-h-screen flex-col bg-white text-neutral-950">
	<Navbar settings={data.settings} isAuthenticated={data.isAuthenticated} />
	<main class="flex-1">
		{@render children()}
	</main>
	<Footer settings={data.settings} />
</div>
