<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import CartDrawer from '#lib/components/public/CartDrawer.svelte';
	import Footer from '#lib/components/public/Footer.svelte';
	import Navbar from '#lib/components/public/Navbar.svelte';
	import { rentalCart } from '#lib/stores/cart.svelte';
	import type { LayoutData } from './$types';

	interface Props {
		data: LayoutData;
		children: Snippet;
	}

	let { data, children }: Props = $props();

	onMount(() => {
		rentalCart.hydrate();
	});
</script>

<div class="flex min-h-screen flex-col bg-white text-neutral-950">
	<div class="print:hidden">
		<Navbar
			settings={data.settings}
			isAuthenticated={data.isAuthenticated}
			currentUser={data.currentUser}
		/>
	</div>
	<main class="flex-1">
		{@render children()}
	</main>
	<div class="print:hidden">
		<Footer settings={data.settings} />
		<CartDrawer />
	</div>
</div>
