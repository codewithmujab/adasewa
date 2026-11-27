<script lang="ts">
	import { goto } from '$app/navigation';
	import type { CompanySettings } from '#lib/server/db/schema';
	import { rentalCart } from '#lib/stores/cart.svelte';

	interface Props {
		settings: CompanySettings;
		totalItems: number;
		totalCategories: number;
	}

	let { settings, totalItems, totalCategories }: Props = $props();
	let searchQuery = $state('');

	const popularSearches = [
		'Proyektor',
		'Sound System',
		'iPhone 16 Pro Max',
		'Laptop ROG',
		'Paket Streaming',
		'Genset',
		'Mobil',
		'Stroller',
		'Tenda',
		'Toga Wisuda'
	] as const;

	function handleSearch(event: SubmitEvent): void {
		event.preventDefault();
		const q = searchQuery.trim();
		void goto(q ? `/katalog?q=${encodeURIComponent(q)}` : '/katalog');
	}
</script>

<section class="relative overflow-hidden bg-black pt-10 pb-20 sm:pt-14 sm:pb-24">
	<!-- Subtle ambient depth behind hero card -->
	<div
		class="pointer-events-none absolute inset-x-0 top-0 h-[560px] bg-[radial-gradient(ellipse_65%_50%_at_50%_0%,rgba(255,255,255,0.08),transparent_70%)]"
	></div>

	<div class="relative mx-auto max-w-6xl px-6">
		<!-- Main Sculpted Pitch-Black Hero Canvas -->
		<div
			class="rounded-[2.5rem] border border-white/15 bg-[#09090b] px-6 py-14 shadow-2xl shadow-black sm:rounded-[3rem] sm:px-12 sm:py-20"
		>
			<div class="mx-auto max-w-3xl text-center">
				<span
					class="inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/[0.06] px-4 py-1.5 text-xs font-semibold tracking-wide text-white"
				>
					<span class="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
					Cabang Bogor &amp; Depok · Delivery DKI · Jabar · Jateng · DIY
				</span>

				<h1
					class="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl sm:leading-tight"
				>
					{settings.tagline}
				</h1>

				<p class="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-neutral-300">
					{settings.aboutShort}
				</p>

				<!-- Instant Catalog Search (Bold High-Contrast Pill) -->
				<form
					onsubmit={handleSearch}
					class="mx-auto mt-9 flex max-w-2xl flex-col gap-2.5 rounded-[2rem] border-2 border-white/20 bg-black p-2 shadow-xl shadow-black/50 transition focus-within:border-white sm:flex-row sm:items-center sm:rounded-full"
				>
					<div class="relative flex flex-1 items-center">
						<svg
							class="pointer-events-none absolute left-4 h-4 w-4 text-neutral-400"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							aria-hidden="true"
						>
							<circle cx="11" cy="11" r="7" />
							<path stroke-linecap="round" d="M20 20l-3.5-3.5" />
						</svg>
						<label for="hero-catalog-search" class="sr-only">Cari barang yang ingin disewa</label>
						<input
							id="hero-catalog-search"
							type="search"
							bind:value={searchQuery}
							placeholder="Cari proyektor, sound system, iPhone, laptop ROG, tenda, toga..."
							class="w-full rounded-full bg-transparent py-3 pr-4 pl-11 text-sm text-white placeholder:text-neutral-500 focus:outline-none"
						/>
					</div>
					<button
						type="submit"
						class="shrink-0 rounded-full bg-white px-7 py-3 text-sm font-bold text-black transition hover:bg-neutral-200"
					>
						Cari Barang
					</button>
				</form>

				<!-- Popular Search Chips -->
				<div class="mt-5 flex flex-wrap items-center justify-center gap-2">
					<span class="mr-1 text-xs font-medium text-neutral-400">Populer:</span>
					{#each popularSearches as term (term)}
						<a
							href={`/katalog?q=${encodeURIComponent(term)}`}
							class="rounded-full border border-white/15 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-neutral-200 transition hover:border-white hover:bg-white hover:text-black"
						>
							{term}
						</a>
					{/each}
				</div>

				<div class="mt-9 flex flex-wrap items-center justify-center gap-3">
					<a
						href="/katalog"
						class="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-black transition hover:bg-neutral-200"
					>
						Jelajahi {totalItems > 0 ? `${totalItems}+` : 'Semua'} Katalog Barang
						<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
							<path
								fill-rule="evenodd"
								d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
								clip-rule="evenodd"
							/>
						</svg>
					</a>
					<a
						href="/keranjang"
						class="inline-flex items-center gap-2 rounded-full border-2 border-white/20 bg-black px-7 py-3.5 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10"
					>
						Lihat Keranjang Sewa
						{#if rentalCart.totalUnits > 0}
							<span class="rounded-full bg-emerald-400 px-2.5 py-0.5 text-xs font-bold text-black">
								{rentalCart.totalUnits}
							</span>
						{/if}
					</a>
				</div>
			</div>
		</div>

		<!-- Bento Metrics Row -->
		<div class="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
			<div
				class="rounded-[2rem] border border-white/15 bg-[#0c0c0f] p-6 transition hover:border-white/35"
			>
				<p class="text-xs font-semibold tracking-wide text-neutral-400 uppercase">
					Pilihan Unit
				</p>
				<p class="mt-2.5 text-2xl font-bold tracking-tight text-white">
					{totalItems > 0 ? `${totalItems}+` : '135+'}
				</p>
				<p class="mt-2 text-sm leading-relaxed text-neutral-400">
					Sewa 1 atau banyak barang sekaligus dalam satu keranjang.
				</p>
			</div>

			<div
				class="rounded-[2rem] border border-white/15 bg-[#0c0c0f] p-6 transition hover:border-white/35"
			>
				<p class="text-xs font-semibold tracking-wide text-neutral-400 uppercase">
					Estimasi Transparan
				</p>
				<p class="mt-2.5 text-2xl font-bold tracking-tight text-white">
					Real-Time
				</p>
				<p class="mt-2 text-sm leading-relaxed text-neutral-400">
					Tarif per cabang Bogor &amp; Depok langsung terhitung otomatis.
				</p>
			</div>

			<div
				class="rounded-[2rem] border border-white/15 bg-[#0c0c0f] p-6 transition hover:border-white/35"
			>
				<p class="text-xs font-semibold tracking-wide text-neutral-400 uppercase">
					Area Delivery
				</p>
				<p class="mt-2.5 text-2xl font-bold tracking-tight text-white">
					4 Provinsi
				</p>
				<p class="mt-2 text-sm leading-relaxed text-neutral-400">
					Antar-jemput DKI, Jabar, Jateng &amp; DIY atau ambil di kios.
				</p>
			</div>

			<div
				class="rounded-[2rem] border border-white/15 bg-[#0c0c0f] p-6 transition hover:border-white/35"
			>
				<p class="text-xs font-semibold tracking-wide text-neutral-400 uppercase">
					Loyalitas Sewa
				</p>
				<p class="mt-2.5 text-2xl font-bold tracking-tight text-white">
					{totalCategories > 0 ? `${totalCategories}` : '10'} Kategori
				</p>
				<p class="mt-2 text-sm leading-relaxed text-neutral-400">
					Bonus Rekening Poin otomatis tiap pengembalian + voucher promo.
				</p>
			</div>
		</div>
	</div>
</section>
