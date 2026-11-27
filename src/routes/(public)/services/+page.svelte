<script lang="ts">
	import ServiceCard from '#lib/components/public/ServiceCard.svelte';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
	let searchQuery = $state('');

	let filteredServices = $derived.by(() => {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return data.services;
		return data.services.filter(
			(item) =>
				item.title.toLowerCase().includes(q) ||
				item.shortDescription.toLowerCase().includes(q) ||
				(item.icon?.toLowerCase().includes(q) ?? false)
		);
	});
</script>

<svelte:head>
	<title>Layanan — {data.settings.companyName}</title>
	<meta
		name="description"
		content={`Daftar layanan profesional dari ${data.settings.companyName}.`}
	/>
</svelte:head>

<section class="bg-black pt-12 pb-10 sm:pt-16">
	<div class="mx-auto max-w-6xl px-6">
		<div class="rounded-[2.5rem] border border-white/15 bg-[#0b0b0e] p-7 sm:p-10">
			<div class="flex flex-col justify-between gap-6 md:flex-row md:items-end">
				<div class="max-w-2xl">
					<span
						class="inline-flex rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1 text-xs font-bold tracking-wide text-neutral-300 uppercase"
					>
						Paket Layanan
					</span>
					<h1 class="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
						Solusi yang dirancang untuk performa jangka panjang.
					</h1>
				</div>

				<div class="w-full md:w-72">
					<label for="service-search" class="sr-only">Cari layanan</label>
					<input
						id="service-search"
						type="search"
						bind:value={searchQuery}
						placeholder="Cari layanan..."
						class="w-full rounded-full border border-white/20 bg-black px-5 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-white focus:outline-none"
					/>
				</div>
			</div>
		</div>
	</div>
</section>

<section class="bg-black pt-4 pb-24">
	<div class="mx-auto max-w-6xl px-6">
		{#if filteredServices.length > 0}
			<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{#each filteredServices as service (service.id)}
					<ServiceCard {service} />
				{/each}
			</div>
		{:else}
			<div class="rounded-[2.25rem] border border-white/15 bg-[#0c0c0f] p-14 text-center">
				<p class="text-sm text-neutral-400">
					{searchQuery.trim()
						? `Tidak ditemukan layanan yang cocok dengan "${searchQuery}".`
						: 'Belum ada layanan yang tersedia.'}
				</p>
			</div>
		{/if}
	</div>
</section>
