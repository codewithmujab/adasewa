<script lang="ts">
	import PortfolioCard from '#lib/components/public/PortfolioCard.svelte';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
	let selectedCategory = $state<string>('Semua');
	let searchQuery = $state('');

	let categories = $derived.by(() => {
		const unique = new Set<string>();
		for (const item of data.portfolios) {
			unique.add(item.category);
		}
		return ['Semua', ...Array.from(unique)];
	});

	let filteredPortfolios = $derived.by(() => {
		const q = searchQuery.trim().toLowerCase();
		return data.portfolios.filter((item) => {
			const matchCategory =
				selectedCategory === 'Semua' || item.category === selectedCategory;
			const matchSearch =
				!q ||
				item.title.toLowerCase().includes(q) ||
				item.clientName.toLowerCase().includes(q) ||
				item.summary.toLowerCase().includes(q);
			return matchCategory && matchSearch;
		});
	});
</script>

<svelte:head>
	<title>Portofolio &amp; Dokumentasi — {data.settings.companyName}</title>
	<meta
		name="description"
		content={`Studi kasus dan dokumentasi acara yang telah didukung oleh ${data.settings.companyName}.`}
	/>
</svelte:head>

<section class="bg-black pt-12 pb-10 sm:pt-16">
	<div class="mx-auto max-w-6xl px-6">
		<div class="rounded-[2.5rem] border border-white/15 bg-[#0b0b0e] p-7 sm:p-10">
			<div class="flex flex-col justify-between gap-6 md:flex-row md:items-end">
				<div class="max-w-2xl">
					<span
						class="inline-flex rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1 text-[11px] font-bold tracking-widest text-neutral-300 uppercase"
					>
						Dokumentasi &amp; Portofolio
					</span>
					<h1 class="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
						Karya nyata dengan dampak terukur.
					</h1>
				</div>

				<div class="w-full md:w-72">
					<label for="portfolio-search" class="sr-only">Cari portofolio</label>
					<input
						id="portfolio-search"
						type="search"
						bind:value={searchQuery}
						placeholder="Cari proyek atau klien..."
						class="w-full rounded-full border border-white/20 bg-black px-5 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-white focus:outline-none"
					/>
				</div>
			</div>

			{#if categories.length > 1}
				<div class="mt-7 flex flex-wrap gap-2">
					{#each categories as category (category)}
						<button
							type="button"
							onclick={() => (selectedCategory = category)}
							class="rounded-full px-4 py-1.5 text-xs font-bold transition {selectedCategory ===
							category
								? 'bg-white text-black'
								: 'border border-white/15 bg-black text-neutral-300 hover:border-white/40 hover:text-white'}"
						>
							{category}
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</section>

<section class="bg-black pt-4 pb-24">
	<div class="mx-auto max-w-6xl px-6">
		{#if filteredPortfolios.length > 0}
			<div class="grid gap-8 md:grid-cols-2">
				{#each filteredPortfolios as portfolio (portfolio.id)}
					<PortfolioCard {portfolio} variant="dark" />
				{/each}
			</div>
		{:else}
			<div class="rounded-[2.25rem] border border-white/15 bg-[#0c0c0f] p-14 text-center">
				<p class="text-sm text-neutral-400">
					Tidak ada portofolio yang sesuai dengan filter saat ini.
				</p>
			</div>
		{/if}
	</div>
</section>
