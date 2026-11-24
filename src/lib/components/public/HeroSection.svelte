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

<section class="relative overflow-hidden bg-white pt-16 pb-20 sm:pt-24 sm:pb-28">
	<div
		class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-100 via-white to-white"
	></div>

	<div class="mx-auto max-w-6xl px-6">
		<div class="mx-auto max-w-3xl text-center">
			<span
				class="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/70 px-4 py-1.5 text-xs font-semibold tracking-wide text-emerald-800"
			>
				<span class="h-2 w-2 rounded-full bg-emerald-500"></span>
				Layanan Delivery DKI · Jabar · Jateng · DIY &amp; Ambil di Kios
			</span>

			<h1
				class="mt-7 text-4xl font-bold tracking-tight text-neutral-950 sm:text-6xl sm:leading-[1.06]"
			>
				{settings.tagline}
			</h1>

			<p class="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-neutral-500 sm:text-lg">
				{settings.aboutShort}
			</p>

			<!-- Instant Catalog Search -->
			<form
				onsubmit={handleSearch}
				class="mx-auto mt-9 flex max-w-2xl flex-col gap-2.5 rounded-3xl border border-neutral-200/90 bg-white p-2 shadow-lg shadow-neutral-950/[0.04] sm:flex-row sm:items-center sm:rounded-full"
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
						class="w-full rounded-full bg-transparent py-3 pr-4 pl-11 text-sm text-neutral-950 placeholder:text-neutral-400 focus:outline-none"
					/>
				</div>
				<button
					type="submit"
					class="shrink-0 rounded-full bg-neutral-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
				>
					Cari Barang
				</button>
			</form>

			<!-- Popular Search Chips -->
			<div class="mt-4 flex flex-wrap items-center justify-center gap-1.5">
				<span class="mr-1 text-xs text-neutral-400">Sering dicari:</span>
				{#each popularSearches as term (term)}
					<a
						href={`/katalog?q=${encodeURIComponent(term)}`}
						class="rounded-full border border-neutral-200/80 bg-white px-3 py-1 text-xs font-medium text-neutral-600 transition hover:border-neutral-950 hover:text-neutral-950"
					>
						{term}
					</a>
				{/each}
			</div>

			<div class="mt-9 flex flex-wrap items-center justify-center gap-3">
				<a
					href="/katalog"
					class="inline-flex items-center gap-2 rounded-full bg-neutral-950 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
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
					class="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-7 py-3.5 text-sm font-semibold text-neutral-900 transition hover:border-neutral-300 hover:bg-neutral-50"
				>
					Lihat Keranjang Sewa
					{#if rentalCart.totalUnits > 0}
						<span class="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white">
							{rentalCart.totalUnits}
						</span>
					{/if}
				</a>
			</div>
		</div>

		<!-- Trust & Scope Bar -->
		<div
			class="mt-16 grid grid-cols-2 gap-4 rounded-3xl border border-neutral-200/80 bg-surface p-5 sm:p-7 lg:grid-cols-4"
		>
			<div class="rounded-2xl bg-white p-5">
				<p class="text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
					Pilihan Unit
				</p>
				<p class="mt-2 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
					{totalItems > 0 ? `${totalItems}+` : '135+'}
				</p>
				<p class="mt-1 text-xs leading-relaxed text-neutral-500">
					Sewa 1 atau banyak barang sekaligus dalam satu keranjang.
				</p>
			</div>

			<div class="rounded-2xl bg-white p-5">
				<p class="text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
					Estimasi Transparan
				</p>
				<p class="mt-2 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
					Langsung Hitung
				</p>
				<p class="mt-1 text-xs leading-relaxed text-neutral-500">
					Lihat rincian biaya per hari &amp; total sebelum checkout.
				</p>
			</div>

			<div class="rounded-2xl bg-white p-5">
				<p class="text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
					Area Delivery
				</p>
				<p class="mt-2 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
					4 Provinsi
				</p>
				<p class="mt-1 text-xs leading-relaxed text-neutral-500">
					Antar-jemput DKI, Jabar, Jateng &amp; DIY atau ambil di kios.
				</p>
			</div>

			<div class="rounded-2xl bg-white p-5">
				<p class="text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
					Dashboard Pemesan
				</p>
				<p class="mt-2 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
					{totalCategories > 0 ? `${totalCategories}` : '10'} Kategori
				</p>
				<p class="mt-1 text-xs leading-relaxed text-neutral-500">
					Pantau pembayaran, status sewa &amp; jadwal pengembalian barang.
				</p>
			</div>
		</div>
	</div>
</section>
