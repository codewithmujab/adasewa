<script lang="ts">
	import { goto } from '$app/navigation';
	import CategoryIcon from '#lib/components/public/CategoryIcon.svelte';
	import RentalItemCard from '#lib/components/public/RentalItemCard.svelte';
	import { rentalCart } from '#lib/stores/cart.svelte';
	import {
		buildBranchWhatsAppUrl,
		formatRupiah,
		resolveItemBranchPricing
	} from '#lib/utils/catalog';
	import { calculateDurationDays, getTodayIsoDate } from '#lib/utils/orders';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
	const today = getTodayIsoDate();

	let selectedVariant = $state<string>('');
	let qty = $state<number>(1);
	let startDate = $state<string>('');
	let endDate = $state<string>('');
	let activePhotoUrl = $state<string | null>(null);
	let addedFeedback = $state(false);

	$effect(() => {
		selectedVariant = data.item.variants[0] ?? '';
		qty = 1;
		startDate = rentalCart.startDate;
		endDate = rentalCart.endDate;
		activePhotoUrl = data.item.imageUrl;
		addedFeedback = false;
	});

	let paragraphs = $derived(
		data.item.description
			.split(/\n{2,}/)
			.map((p) => p.trim())
			.filter((p) => p.length > 0)
	);

	let galleryUrls = $derived.by(() => {
		const urls: Array<{ url: string; alt: string }> = [];
		if (data.item.imageUrl) {
			urls.push({ url: data.item.imageUrl, alt: data.item.name });
		}
		for (const g of data.item.gallery) {
			if (g.imageUrl && !urls.some((u) => u.url === g.imageUrl)) {
				urls.push({ url: g.imageUrl, alt: g.alt || data.item.name });
			}
		}
		return urls;
	});

	let activeBranch = $derived(
		data.branches.find((b) => b.id === rentalCart.branchId) ?? data.branches[0] ?? null
	);

	let branchPricing = $derived(resolveItemBranchPricing(data.item, activeBranch?.id));

	let estimatedDays = $derived(
		Math.max(data.item.minDurationDays, calculateDurationDays(startDate, endDate))
	);

	let unitPrice = $derived(branchPricing.pricePerDay);
	let effectiveStockQty = $derived(branchPricing.stockQty);
	let isOutOfStock = $derived(!branchPricing.isAvailable || effectiveStockQty <= 0);
	let estimatedTotal = $derived(unitPrice * qty * estimatedDays);

	let whatsappAskUrl = $derived.by(() => {
		const lines = [
			`Halo ${data.settings.companyName}${activeBranch ? ` (${activeBranch.name})` : ''}, saya ingin bertanya mengenai unit:`,
			`- Barang: ${data.item.name}`
		];
		if (selectedVariant) lines.push(`- Varian: ${selectedVariant}`);
		lines.push(`- Rencana jumlah: ${qty} unit (${estimatedDays} hari)`);
		return buildBranchWhatsAppUrl(activeBranch, data.settings, lines.join('\n'));
	});

	function addCurrentToCart(openDrawer: boolean): void {
		if (isOutOfStock) return;
		rentalCart.addItem(
			{
				itemId: data.item.id,
				slug: data.item.slug,
				name: data.item.name,
				categoryName: data.item.category.name,
				imageUrl: data.item.imageUrl,
				variant: selectedVariant || null,
				pricePerDay: unitPrice,
				unitLabel: data.item.unitLabel,
				quantity: Math.min(qty, Math.max(1, effectiveStockQty)),
				stockQty: effectiveStockQty,
				requiresDeposit: data.item.requiresDeposit,
				startDate,
				endDate,
				branchStocks: data.item.branchStocks
			},
			openDrawer
		);
		addedFeedback = true;
	}

	function handleRentNow(): void {
		if (isOutOfStock) return;
		addCurrentToCart(false);
		void goto('/keranjang');
	}
</script>

<svelte:head>
	<title>{data.item.name} — Sewa di {data.settings.companyName}</title>
	<meta name="description" content={data.item.shortDescription} />
</svelte:head>

<article class="bg-black pt-8 pb-20 sm:pt-12 sm:pb-28">
	<div class="mx-auto max-w-6xl px-6">
		<!-- Breadcrumb -->
		<nav aria-label="Breadcrumb" class="flex flex-wrap items-center gap-2 text-xs text-neutral-400">
			<a href="/" class="transition hover:text-white">Beranda</a>
			<span aria-hidden="true">/</span>
			<a href="/katalog" class="transition hover:text-white">Katalog</a>
			<span aria-hidden="true">/</span>
			<a
				href={`/katalog?kategori=${data.item.category.slug}`}
				class="transition hover:text-white"
			>
				{data.item.category.name}
			</a>
			<span aria-hidden="true">/</span>
			<span class="truncate font-semibold text-white">{data.item.name}</span>
		</nav>

		<div class="mt-8 grid gap-8 lg:grid-cols-12">
			<!-- Kolom Kiri -->
			<div class="space-y-6 lg:col-span-7">
				<div class="overflow-hidden rounded-[2.25rem] border border-white/15 bg-[#0c0c0f] p-2.5">
					{#if activePhotoUrl}
						<img
							src={activePhotoUrl}
							alt={data.item.name}
							class="aspect-16/10 w-full rounded-[1.75rem] object-cover"
						/>
					{:else}
						<div
							class="flex aspect-16/10 w-full flex-col items-center justify-center rounded-[1.75rem] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.09),_rgba(12,12,15,1))] p-10 text-center"
						>
							<div
								class="flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-white text-black"
							>
								<CategoryIcon icon={data.item.category.icon} class="h-9 w-9" />
							</div>
							<p class="mt-5 text-base font-bold text-white">{data.item.name}</p>
							<p class="mt-1 text-xs text-neutral-400">
								Kategori {data.item.category.name} · Stok {activeBranch?.name ?? ''}:
								{effectiveStockQty} unit
							</p>
						</div>
					{/if}
				</div>

				{#if galleryUrls.length > 1}
					<div class="flex flex-wrap gap-2.5">
						{#each galleryUrls as media (media.url)}
							<button
								type="button"
								onclick={() => (activePhotoUrl = media.url)}
								class="overflow-hidden rounded-2xl border-2 transition {activePhotoUrl === media.url
									? 'border-white'
									: 'border-white/10 opacity-60 hover:opacity-100'}"
							>
								<img src={media.url} alt={media.alt} class="h-16 w-24 object-cover" />
							</button>
						{/each}
					</div>
				{/if}

				<div class="grid gap-3 sm:grid-cols-3">
					<div class="rounded-[1.5rem] border border-white/15 bg-[#0c0c0f] p-4">
						<p class="text-[11px] font-bold tracking-wider text-neutral-400 uppercase">
							Pengiriman
						</p>
						<p class="mt-1 text-xs font-bold text-white">
							{data.item.deliveryAvailable ? 'Delivery DKI–Jabar–Jateng–DIY' : 'Ambil di Kios'}
						</p>
					</div>
					<div class="rounded-[1.5rem] border border-white/15 bg-[#0c0c0f] p-4">
						<p class="text-[11px] font-bold tracking-wider text-neutral-400 uppercase">
							Pengambilan
						</p>
						<p class="mt-1 text-xs font-bold text-white">
							{data.item.pickupAvailable ? 'Bisa Ambil Langsung di Kios' : 'Khusus Delivery'}
						</p>
					</div>
					<div class="rounded-[1.5rem] border border-white/15 bg-[#0c0c0f] p-4">
						<p class="text-[11px] font-bold tracking-wider text-neutral-400 uppercase">
							Stok {activeBranch?.name ?? 'Tersedia'}
						</p>
						<p class="mt-1 text-xs font-bold {isOutOfStock ? 'text-red-400' : 'text-emerald-300'}">
							{isOutOfStock ? 'Stok Habis di Cabang Ini' : `${effectiveStockQty} Unit Siap Pakai`}
						</p>
					</div>
				</div>

				<section class="rounded-[2rem] border border-white/15 bg-[#0c0c0f] p-6 sm:p-8">
					<h2 class="text-lg font-bold tracking-tight text-white">
						Detail &amp; Rekomendasi Penggunaan
					</h2>
					<div class="mt-4 space-y-4 text-sm leading-7 text-neutral-300">
						{#each paragraphs as paragraph, idx (idx)}
							<p>{paragraph}</p>
						{/each}
					</div>
				</section>

				{#if data.item.specs.length > 0}
					<section class="rounded-[2rem] border border-white/15 bg-[#0c0c0f] p-6 sm:p-8">
						<h2 class="text-lg font-bold tracking-tight text-white">
							Spesifikasi &amp; Informasi Unit
						</h2>
						<dl class="mt-5 divide-y divide-white/10">
							{#each data.item.specs as spec (spec.label)}
								<div class="grid gap-1 py-3.5 sm:grid-cols-12 sm:gap-4">
									<dt class="text-xs font-bold text-neutral-400 uppercase sm:col-span-4">
										{spec.label}
									</dt>
									<dd class="text-sm font-semibold text-white sm:col-span-8">
										{spec.value}
									</dd>
								</div>
							{/each}
						</dl>
					</section>
				{/if}

				{#if data.item.includes.length > 0}
					<section class="rounded-[2rem] border border-white/15 bg-[#0c0c0f] p-6 sm:p-8">
						<h2 class="text-lg font-bold tracking-tight text-white">
							Kelengkapan yang Didapat
						</h2>
						<ul class="mt-4 grid gap-3 sm:grid-cols-2">
							{#each data.item.includes as inc (inc)}
								<li class="flex items-start gap-2.5 text-sm text-neutral-200">
									<span
										class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-xs font-extrabold text-black"
									>
										✓
									</span>
									<span>{inc}</span>
								</li>
							{/each}
						</ul>
					</section>
				{/if}

				<section class="rounded-[2rem] border border-white/15 bg-[#0b0b0e] p-6 sm:p-8">
					<h2 class="text-base font-bold tracking-tight text-white">
						Ketentuan Sewa &amp; Pengembalian
					</h2>
					<ul class="mt-3.5 space-y-2 text-xs leading-relaxed text-neutral-400 sm:text-sm">
						<li>
							• Masukkan barang ke keranjang bersama unit lain untuk langsung melihat estimasi total
							biaya sewa.
						</li>
						<li>
							• Minimal sewa
							<strong class="text-white">{data.item.minDurationDays} {data.item.unitLabel}</strong>.
							Setelah checkout, status sewa dan jatuh tempo pengembalian tercatat di Dashboard
							Pemesan.
						</li>
						{#if data.item.requiresDeposit}
							<li>
								• Unit ini termasuk kategori bernilai tinggi / skala event — verifikasi identitas
								&amp; ketentuan jaminan dikonfirmasi saat proses transaksi.
							</li>
						{/if}
						<li>
							• Pengembalian dapat diajukan langsung dari Dashboard Pemesan (dijemput kurir atau
							antar kembali ke kios).
						</li>
					</ul>
				</section>
			</div>

			<!-- Kolom Kanan: Sticky Panel Tambah ke Keranjang -->
			<aside class="lg:col-span-5">
				<div
					class="sticky top-24 rounded-[2.5rem] border-2 border-white/20 bg-[#0d0d11] p-6 shadow-2xl shadow-black sm:p-7"
				>
					<div class="flex flex-wrap items-center gap-2">
						<a
							href={`/katalog?kategori=${data.item.category.slug}`}
							class="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 py-1 text-xs font-bold text-white transition hover:border-white"
						>
							<CategoryIcon icon={data.item.category.icon} class="h-3.5 w-3.5" />
							{data.item.category.name}
						</a>
						<span
							class="rounded-full border px-3 py-1 text-xs font-bold {isOutOfStock
								? 'border-red-400/30 bg-red-500/15 text-red-300'
								: 'border-emerald-400/30 bg-emerald-400/15 text-emerald-300'}"
						>
							{isOutOfStock ? 'Stok Habis' : `Stok: ${effectiveStockQty} Unit`}
						</span>
					</div>

					<h1 class="mt-4 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
						{data.item.name}
					</h1>
					<p class="mt-2.5 text-sm leading-relaxed text-neutral-400">
						{data.item.shortDescription}
					</p>

					<!-- Pilihan Cabang & Perbandingan Tarif -->
					{#if data.branches.length > 0}
						<div class="mt-5">
							<p class="text-[11px] font-bold tracking-wider text-neutral-400 uppercase">
								Pilih Cabang Penyewaan
							</p>
							<div class="mt-2 grid gap-2 sm:grid-cols-2">
								{#each data.branches as branch (branch.id)}
									{@const bp = resolveItemBranchPricing(data.item, branch.id)}
									{@const isSelected = activeBranch?.id === branch.id}
									<button
										type="button"
										onclick={() => {
											rentalCart.selectBranch(branch);
											qty = Math.min(qty, Math.max(1, bp.stockQty));
										}}
										class="rounded-[1.25rem] border p-3.5 text-left transition {isSelected
											? 'border-white bg-white text-black'
											: 'border-white/15 bg-black text-white hover:border-white/40'}"
									>
										<div class="flex items-center justify-between gap-1">
											<span class="text-xs font-bold">{branch.name}</span>
											<span
												class="text-[10px] font-bold {isSelected
													? bp.isAvailable && bp.stockQty > 0
														? 'text-emerald-700'
														: 'text-red-600'
													: bp.isAvailable && bp.stockQty > 0
														? 'text-emerald-400'
														: 'text-red-400'}"
											>
												{bp.isAvailable && bp.stockQty > 0 ? `Stok ${bp.stockQty}` : 'Habis'}
											</span>
										</div>
										<p class="mt-1 text-sm font-extrabold">
											{formatRupiah(bp.pricePerDay)}
											<span
												class="text-[10px] font-normal {isSelected
													? 'text-neutral-600'
													: 'text-neutral-400'}"
											>
												/ {data.item.unitLabel}
											</span>
										</p>
									</button>
								{/each}
							</div>
							{#if activeBranch}
								<p class="mt-2 text-[11px] text-neutral-400">
									📍 Kios {activeBranch.name}: {activeBranch.address}
								</p>
							{/if}
						</div>
					{/if}

					<!-- Price Box -->
					<div class="mt-5 rounded-[1.5rem] border border-white/10 bg-black p-4">
						<p class="text-[11px] font-bold tracking-wider text-neutral-400 uppercase">
							Tarif Sewa {activeBranch ? `— ${activeBranch.name}` : ''}
						</p>
						<p class="mt-1 text-2xl font-extrabold text-white">
							{formatRupiah(unitPrice)}
							<span class="text-sm font-normal text-neutral-400">/ {data.item.unitLabel}</span>
						</p>
					</div>

					<!-- Pilihan Varian -->
					{#if data.item.variants.length > 0}
						<div class="mt-5">
							<p class="text-xs font-bold text-neutral-200">
								Pilih Varian / Tipe ({data.item.variants.length} opsi):
							</p>
							<div class="mt-2.5 flex flex-wrap gap-2">
								{#each data.item.variants as variant (variant)}
									<button
										type="button"
										onclick={() => (selectedVariant = variant)}
										class="rounded-full border px-3.5 py-1.5 text-xs font-bold transition {selectedVariant ===
										variant
											? 'border-white bg-white text-black'
											: 'border-white/20 bg-black text-neutral-200 hover:border-white/50'}"
									>
										{variant}
									</button>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Tanggal & Qty -->
					<div class="mt-6 space-y-4 border-t border-white/10 pt-5">
						<div class="grid grid-cols-2 gap-3">
							<div>
								<label for="rent-start" class="block text-xs font-semibold text-neutral-300">
									Mulai Tanggal
								</label>
								<input
									id="rent-start"
									type="date"
									min={today}
									bind:value={startDate}
									onchange={() => {
										if (endDate < startDate) endDate = startDate;
									}}
									class="mt-1.5 w-full rounded-xl border border-white/20 bg-black px-3 py-2.5 text-xs font-semibold text-white [color-scheme:dark] focus:border-white focus:outline-none"
								/>
							</div>
							<div>
								<label for="rent-end" class="block text-xs font-semibold text-neutral-300">
									Sampai Tanggal
								</label>
								<input
									id="rent-end"
									type="date"
									min={startDate || today}
									bind:value={endDate}
									class="mt-1.5 w-full rounded-xl border border-white/20 bg-black px-3 py-2.5 text-xs font-semibold text-white [color-scheme:dark] focus:border-white focus:outline-none"
								/>
							</div>
						</div>

						<div>
							<label for="rent-qty" class="block text-xs font-semibold text-neutral-300">
								Jumlah Unit (maks. {effectiveStockQty})
							</label>
							<div
								class="mt-1.5 flex items-center rounded-full border border-white/20 bg-black px-1"
							>
								<button
									type="button"
									onclick={() => (qty = Math.max(1, qty - 1))}
									aria-label="Kurangi jumlah"
									class="px-4 py-2 text-sm font-bold text-neutral-300 hover:text-white"
								>
									−
								</button>
								<input
									id="rent-qty"
									type="number"
									min="1"
									max={Math.max(1, effectiveStockQty)}
									bind:value={qty}
									class="w-full bg-transparent text-center text-sm font-bold text-white focus:outline-none"
								/>
								<button
									type="button"
									onclick={() => (qty = Math.min(Math.max(1, effectiveStockQty), qty + 1))}
									aria-label="Tambah jumlah"
									class="px-4 py-2 text-sm font-bold text-neutral-300 hover:text-white"
								>
									+
								</button>
							</div>
						</div>

						<!-- Live Cost Estimation -->
						<div class="rounded-[1.5rem] border border-white/15 bg-black px-4 py-4 text-white">
							<div class="flex items-center justify-between text-xs text-neutral-400">
								<span>
									Estimasi ({qty} unit × {estimatedDays} {data.item.unitLabel})
								</span>
								<span>{formatRupiah(unitPrice)} / {data.item.unitLabel}</span>
							</div>
							<p class="mt-1 text-2xl font-extrabold text-white">{formatRupiah(estimatedTotal)}</p>
						</div>

						{#if addedFeedback}
							<p
								class="rounded-full border border-emerald-400/30 bg-emerald-400/15 px-4 py-2 text-center text-xs font-bold text-emerald-300"
							>
								✓ Ditambahkan ke keranjang sewa Anda!
							</p>
						{/if}

						<div class="space-y-2.5 pt-1">
							<button
								type="button"
								disabled={isOutOfStock}
								onclick={() => addCurrentToCart(true)}
								class="flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-4 text-sm font-extrabold text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-40"
							>
								{isOutOfStock ? 'Stok Habis di Cabang Ini' : '+ Masukkan ke Keranjang'}
							</button>

							<button
								type="button"
								disabled={isOutOfStock}
								onclick={handleRentNow}
								class="flex w-full items-center justify-center gap-1.5 rounded-full border-2 border-white/25 bg-black px-6 py-3.5 text-sm font-bold text-white transition hover:border-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
							>
								Sewa Sekarang &amp; Cek Total →
							</button>
						</div>

						<div class="pt-1 text-center">
							<a
								href={whatsappAskUrl}
								target="_blank"
								rel="noopener noreferrer"
								class="text-xs font-semibold text-neutral-400 underline underline-offset-4 transition hover:text-white"
							>
								Butuh konsultasi teknis? Chat CS {activeBranch?.name ?? ''} via WhatsApp
							</a>
						</div>
					</div>
				</div>
			</aside>
		</div>
	</div>
</article>

{#if data.relatedItems.length > 0}
	<section class="border-t border-white/10 bg-black py-20">
		<div class="mx-auto max-w-6xl px-6">
			<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
				<div>
					<span
						class="inline-flex rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1 text-[11px] font-bold tracking-widest text-neutral-300 uppercase"
					>
						Kategori {data.item.category.name}
					</span>
					<h2 class="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
						Unit lain yang sering disewa bersamaan
					</h2>
				</div>
				<a
					href={`/katalog?kategori=${data.item.category.slug}`}
					class="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/[0.06] px-4 py-2 text-xs font-bold text-white transition hover:border-white hover:bg-white hover:text-black"
				>
					Lihat semua {data.item.category.name} →
				</a>
			</div>

			<div class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
				{#each data.relatedItems as related (related.id)}
					<RentalItemCard item={related} variant="dark" />
				{/each}
			</div>
		</div>
	</section>
{/if}
