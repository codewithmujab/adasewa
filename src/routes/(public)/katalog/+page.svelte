<script lang="ts">
	import CategoryIcon from '#lib/components/public/CategoryIcon.svelte';
	import RentalItemCard from '#lib/components/public/RentalItemCard.svelte';
	import { rentalCart } from '#lib/stores/cart.svelte';
	import { buildBranchWhatsAppUrl } from '#lib/utils/catalog';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let searchQuery = $state('');
	let selectedCategory = $state<string>('all');
	let onlyFeatured = $state(false);
	let sortBy = $state<'default' | 'name-asc' | 'name-desc'>('default');
	let visibleLimit = $state(24);

	$effect(() => {
		searchQuery = data.initialQuery;
		selectedCategory =
			data.initialCategory &&
			(data.initialCategory === 'all' ||
				data.categories.some((cat) => cat.slug === data.initialCategory))
				? data.initialCategory
				: 'all';
		visibleLimit = 24;
	});

	let activeCategoryObj = $derived(
		selectedCategory === 'all'
			? null
			: (data.categories.find((cat) => cat.slug === selectedCategory) ?? null)
	);

	let filteredItems = $derived.by(() => {
		const q = searchQuery.trim().toLowerCase();
		const list = data.items.filter((item) => {
			if (selectedCategory !== 'all' && item.category.slug !== selectedCategory) {
				return false;
			}
			if (onlyFeatured && !item.isFeatured) {
				return false;
			}
			if (!q) return true;

			if (item.name.toLowerCase().includes(q)) return true;
			if (item.category.name.toLowerCase().includes(q)) return true;
			if (item.shortDescription.toLowerCase().includes(q)) return true;
			if (item.variants.some((v) => v.toLowerCase().includes(q))) return true;
			if (
				item.specs.some(
					(s) => s.label.toLowerCase().includes(q) || s.value.toLowerCase().includes(q)
				)
			) {
				return true;
			}
			return false;
		});

		if (sortBy === 'name-asc') {
			return [...list].sort((a, b) => a.name.localeCompare(b.name, 'id'));
		}
		if (sortBy === 'name-desc') {
			return [...list].sort((a, b) => b.name.localeCompare(a.name, 'id'));
		}
		return list;
	});

	let displayedItems = $derived(filteredItems.slice(0, visibleLimit));
	let hasMore = $derived(filteredItems.length > visibleLimit);
	let hasActiveFilter = $derived(
		searchQuery.trim().length > 0 || selectedCategory !== 'all' || onlyFeatured
	);

	let activeBranch = $derived(
		data.branches.find((b) => b.id === rentalCart.branchId) ?? data.branches[0] ?? null
	);

	let whatsappAskUrl = $derived(
		buildBranchWhatsAppUrl(
			activeBranch,
			data.settings,
			searchQuery.trim()
				? `Halo ${data.settings.companyName}${activeBranch ? ` (${activeBranch.name})` : ''}, saya sedang mencari sewa "${searchQuery.trim()}". Apakah unitnya tersedia?`
				: `Halo ${data.settings.companyName}${activeBranch ? ` (${activeBranch.name})` : ''}, saya ingin menanyakan ketersediaan dan informasi sewa barang.`
		)
	);

	function selectCategory(slug: string): void {
		selectedCategory = slug;
		visibleLimit = 24;
	}

	function resetFilters(): void {
		searchQuery = '';
		selectedCategory = 'all';
		onlyFeatured = false;
		sortBy = 'default';
		visibleLimit = 24;
	}
</script>

<svelte:head>
	<title>
		{activeCategoryObj
			? `${activeCategoryObj.name} — Katalog ${data.settings.companyName}`
			: `Katalog Barang Sewa — ${data.settings.companyName}`}
	</title>
	<meta
		name="description"
		content={activeCategoryObj
			? activeCategoryObj.description
			: `Telusuri ${data.items.length}+ jenis barang siap sewa di ${data.settings.companyName}. Lengkap dengan spesifikasi, kelengkapan, dan opsi varian.`}
	/>
</svelte:head>

<section class="border-b border-white/10 bg-black pt-10 pb-10 sm:pt-14">
	<div class="mx-auto max-w-6xl px-6">
		<div
			class="rounded-[2.5rem] border border-white/15 bg-[#0b0b0e] p-6 sm:p-10"
		>
			<div class="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
				<div class="max-w-2xl">
					<span
						class="inline-flex rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1 text-[11px] font-bold tracking-widest text-neutral-300 uppercase"
					>
						Katalog Resmi {data.settings.companyName}
					</span>
					<h1 class="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
						{activeCategoryObj ? activeCategoryObj.name : 'Katalog Barang Sewa'}
					</h1>
					<p class="mt-3 text-sm leading-relaxed text-neutral-400 sm:text-base">
						{activeCategoryObj
							? activeCategoryObj.description
							: `Telusuri ${data.items.length} jenis unit dari ${data.categories.length} kategori. Klik tiap barang untuk melihat detail spesifikasi, kelengkapan, dan pilihan varian.`}
					</p>
				</div>

				<div class="flex flex-wrap gap-2.5">
					<button
						type="button"
						onclick={() => rentalCart.openDrawer()}
						class="inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-xs font-bold text-black transition hover:bg-neutral-200"
					>
						Keranjang Sewa ({rentalCart.totalUnits})
					</button>
					<a
						href={whatsappAskUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/[0.06] px-5 py-2.5 text-xs font-bold text-white transition hover:border-white hover:bg-white/15"
					>
						Tanya CS via WA
					</a>
				</div>
			</div>

			<!-- Cabang Penyewaan Switcher -->
			{#if data.branches.length > 0}
				<div
					class="mt-7 flex flex-col justify-between gap-4 rounded-[1.75rem] border border-emerald-400/25 bg-emerald-400/10 p-4 sm:flex-row sm:items-center sm:px-5"
				>
					<div class="min-w-0">
						<p class="text-[11px] font-bold tracking-wider text-emerald-300 uppercase">
							📍 Tarif &amp; Stok Aktif: {activeBranch?.name ?? 'Semua Cabang'}
						</p>
						{#if activeBranch}
							<p class="mt-0.5 text-xs text-neutral-300">
								Kios: {activeBranch.address} · WA CS:
								<strong class="text-white">{activeBranch.phone}</strong>
							</p>
						{/if}
					</div>
					<div class="flex flex-wrap items-center gap-2">
						{#each data.branches as branch (branch.id)}
							<button
								type="button"
								onclick={() => rentalCart.selectBranch(branch)}
								class="rounded-full px-4 py-1.5 text-xs font-bold transition {activeBranch?.id ===
								branch.id
									? 'bg-white text-black'
									: 'border border-white/20 bg-black/60 text-neutral-200 hover:border-white hover:text-white'}"
							>
								{branch.name}
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Search & Filter Controls -->
			<div class="mt-6 space-y-4">
				<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
					<div class="relative flex-1">
						<svg
							class="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-neutral-400"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							aria-hidden="true"
						>
							<circle cx="11" cy="11" r="7" />
							<path stroke-linecap="round" d="M20 20l-3.5-3.5" />
						</svg>
						<label for="catalog-search-input" class="sr-only">Cari barang sewa</label>
						<input
							id="catalog-search-input"
							type="search"
							bind:value={searchQuery}
							oninput={() => (visibleLimit = 24)}
							placeholder="Cari nama barang, lumens, watt, merek (mis. iPhone, ROG, Vespa, Stroller, Toga)..."
							class="w-full rounded-full border border-white/20 bg-black py-3 pr-4 pl-11 text-sm text-white placeholder:text-neutral-500 focus:border-white focus:outline-none"
						/>
					</div>

					<div class="flex flex-wrap items-center gap-2">
						<button
							type="button"
							onclick={() => {
								onlyFeatured = !onlyFeatured;
								visibleLimit = 24;
							}}
							class="rounded-full border px-4 py-3 text-xs font-bold transition {onlyFeatured
								? 'border-white bg-white text-black'
								: 'border-white/20 bg-black text-neutral-200 hover:border-white'}"
						>
							Populer Saja
						</button>

						<label for="catalog-sort" class="sr-only">Urutkan katalog</label>
						<select
							id="catalog-sort"
							bind:value={sortBy}
							class="rounded-full border border-white/20 bg-black px-4 py-3 text-xs font-bold text-white [color-scheme:dark] focus:border-white focus:outline-none"
						>
							<option value="default" class="bg-neutral-950">Urutan Rekomendasi</option>
							<option value="name-asc" class="bg-neutral-950">Nama A → Z</option>
							<option value="name-desc" class="bg-neutral-950">Nama Z → A</option>
						</select>
					</div>
				</div>

				<!-- Category Pills -->
				<div class="flex flex-wrap gap-2">
					<button
						type="button"
						onclick={() => selectCategory('all')}
						class="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition {selectedCategory ===
						'all'
							? 'bg-white text-black'
							: 'border border-white/15 bg-black text-neutral-300 hover:border-white/40 hover:text-white'}"
					>
						<span>Semua Kategori</span>
						<span
							class="text-[10px] {selectedCategory === 'all'
								? 'text-neutral-600'
								: 'text-neutral-500'}"
						>
							{data.items.length}
						</span>
					</button>

					{#each data.categories as cat (cat.id)}
						<button
							type="button"
							onclick={() => selectCategory(cat.slug)}
							class="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition {selectedCategory ===
							cat.slug
								? 'bg-white text-black'
								: 'border border-white/15 bg-black text-neutral-300 hover:border-white/40 hover:text-white'}"
						>
							<CategoryIcon icon={cat.icon} class="h-3.5 w-3.5" />
							<span>{cat.name}</span>
							<span
								class="text-[10px] {selectedCategory === cat.slug
									? 'text-neutral-600'
									: 'text-neutral-500'}"
							>
								{cat.itemCount}
							</span>
						</button>
					{/each}
				</div>
			</div>
		</div>
	</div>
</section>

<section class="bg-black py-12 pb-24">
	<div class="mx-auto max-w-6xl px-6">
		<div class="mb-6 flex flex-wrap items-center justify-between gap-3">
			<p class="text-xs font-medium text-neutral-400">
				Menampilkan <strong class="text-white">{displayedItems.length}</strong> dari
				<strong class="text-white">{filteredItems.length}</strong> barang
				{#if activeCategoryObj}
					di kategori <strong class="text-white">{activeCategoryObj.name}</strong>
				{/if}
			</p>

			{#if hasActiveFilter}
				<button
					type="button"
					onclick={resetFilters}
					class="rounded-full border border-white/20 px-3.5 py-1 text-xs font-bold text-neutral-200 transition hover:border-white hover:text-white"
				>
					Reset semua filter
				</button>
			{/if}
		</div>

		{#if displayedItems.length > 0}
			<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{#each displayedItems as item (item.id)}
					<RentalItemCard {item} variant="dark" />
				{/each}
			</div>

			{#if hasMore}
				<div class="mt-12 flex flex-wrap items-center justify-center gap-3">
					<button
						type="button"
						onclick={() => (visibleLimit += 24)}
						class="rounded-full bg-white px-7 py-3.5 text-sm font-bold text-black transition hover:bg-neutral-200"
					>
						Muat Lebih Banyak ({filteredItems.length - displayedItems.length} tersisa)
					</button>
					<button
						type="button"
						onclick={() => (visibleLimit = filteredItems.length)}
						class="rounded-full border border-white/20 bg-white/[0.06] px-6 py-3.5 text-sm font-bold text-white transition hover:border-white hover:bg-white/15"
					>
						Tampilkan Semua
					</button>
				</div>
			{/if}
		{:else}
			<div class="rounded-[2.5rem] border border-white/15 bg-[#0c0c0f] p-14 text-center">
				<p class="text-lg font-bold text-white">Barang tidak ditemukan</p>
				<p class="mx-auto mt-2 max-w-md text-sm text-neutral-400">
					Tidak ada unit yang cocok dengan kata kunci "{searchQuery}". Anda bisa reset filter atau
					tanyakan langsung ke CS kami — kami mungkin punya unitnya di gudang.
				</p>
				<div class="mt-6 flex flex-wrap justify-center gap-3">
					<button
						type="button"
						onclick={resetFilters}
						class="rounded-full border border-white/20 bg-white/[0.06] px-5 py-2.5 text-xs font-bold text-white hover:border-white"
					>
						Reset Filter
					</button>
					<a
						href={whatsappAskUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="rounded-full bg-emerald-400 px-5 py-2.5 text-xs font-extrabold text-black hover:bg-emerald-300"
					>
						Tanya Ketersediaan via WA
					</a>
				</div>
			</div>
		{/if}
	</div>
</section>
