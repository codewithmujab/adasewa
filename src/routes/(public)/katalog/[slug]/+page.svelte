<script lang="ts">
	import { goto } from '$app/navigation';
	import CategoryIcon from '#lib/components/public/CategoryIcon.svelte';
	import RentalItemCard from '#lib/components/public/RentalItemCard.svelte';
	import { rentalCart } from '#lib/stores/cart.svelte';
	import {
		buildWhatsAppUrl,
		formatRupiah,
		getCategoryTheme
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

	let theme = $derived(getCategoryTheme(data.item.category.accent));

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

	let estimatedDays = $derived(
		Math.max(data.item.minDurationDays, calculateDurationDays(startDate, endDate))
	);

	let unitPrice = $derived(data.item.pricePerDay ?? 0);
	let estimatedTotal = $derived(unitPrice * qty * estimatedDays);

	let whatsappAskUrl = $derived.by(() => {
		const lines = [
			`Halo ${data.settings.companyName}, saya ingin bertanya mengenai unit:`,
			`- Barang: ${data.item.name}`
		];
		if (selectedVariant) lines.push(`- Varian: ${selectedVariant}`);
		lines.push(`- Rencana jumlah: ${qty} unit (${estimatedDays} hari)`);
		return buildWhatsAppUrl(data.settings, lines.join('\n'));
	});

	function addCurrentToCart(openDrawer: boolean): void {
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
				quantity: qty,
				stockQty: data.item.stockQty,
				requiresDeposit: data.item.requiresDeposit,
				startDate,
				endDate
			},
			openDrawer
		);
		addedFeedback = true;
	}

	function handleRentNow(): void {
		addCurrentToCart(false);
		void goto('/keranjang');
	}
</script>

<svelte:head>
	<title>{data.item.name} — Sewa di {data.settings.companyName}</title>
	<meta name="description" content={data.item.shortDescription} />
</svelte:head>

<article class="bg-white pt-10 pb-20 sm:pt-14 sm:pb-28">
	<div class="mx-auto max-w-6xl px-6">
		<!-- Breadcrumb -->
		<nav aria-label="Breadcrumb" class="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
			<a href="/" class="transition hover:text-neutral-950">Beranda</a>
			<span aria-hidden="true">/</span>
			<a href="/katalog" class="transition hover:text-neutral-950">Katalog</a>
			<span aria-hidden="true">/</span>
			<a
				href={`/katalog?kategori=${data.item.category.slug}`}
				class="transition hover:text-neutral-950"
			>
				{data.item.category.name}
			</a>
			<span aria-hidden="true">/</span>
			<span class="truncate font-medium text-neutral-950">{data.item.name}</span>
		</nav>

		<div class="mt-8 grid gap-10 lg:grid-cols-12">
			<!-- Kolom Kiri -->
			<div class="space-y-8 lg:col-span-7">
				<div class="overflow-hidden rounded-3xl border border-neutral-200/80 bg-surface">
					{#if activePhotoUrl}
						<img
							src={activePhotoUrl}
							alt={data.item.name}
							class="aspect-16/10 w-full object-cover"
						/>
					{:else}
						<div
							class="flex aspect-16/10 w-full flex-col items-center justify-center bg-gradient-to-br {theme.surfaceBg} p-10 text-center"
						>
							<div
								class="flex h-20 w-20 items-center justify-center rounded-3xl {theme.iconBg} {theme.iconText}"
							>
								<CategoryIcon icon={data.item.category.icon} class="h-10 w-10" />
							</div>
							<p class="mt-5 text-sm font-semibold text-neutral-800">{data.item.name}</p>
							<p class="mt-1 text-xs text-neutral-500">
								Kategori {data.item.category.name} · Stok tersedia: {data.item.stockQty} unit
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
									? 'border-neutral-950'
									: 'border-transparent opacity-70 hover:opacity-100'}"
							>
								<img src={media.url} alt={media.alt} class="h-16 w-24 object-cover" />
							</button>
						{/each}
					</div>
				{/if}

				<div class="grid gap-3 sm:grid-cols-3">
					<div class="rounded-2xl border border-neutral-200/70 bg-surface/70 p-4">
						<p class="text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
							Pengiriman
						</p>
						<p class="mt-1 text-xs font-semibold text-neutral-900">
							{data.item.deliveryAvailable ? 'Delivery DKI–Jabar–Jateng–DIY' : 'Ambil di Kios'}
						</p>
					</div>
					<div class="rounded-2xl border border-neutral-200/70 bg-surface/70 p-4">
						<p class="text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
							Pengambilan
						</p>
						<p class="mt-1 text-xs font-semibold text-neutral-900">
							{data.item.pickupAvailable ? 'Bisa Ambil Langsung di Kios' : 'Khusus Delivery'}
						</p>
					</div>
					<div class="rounded-2xl border border-neutral-200/70 bg-surface/70 p-4">
						<p class="text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
							Stok Tersedia
						</p>
						<p class="mt-1 text-xs font-semibold text-neutral-900">
							{data.item.stockQty} Unit Siap Pakai
						</p>
					</div>
				</div>

				<section class="rounded-3xl border border-neutral-200/80 bg-white p-6 sm:p-8">
					<h2 class="text-lg font-bold tracking-tight text-neutral-950">
						Detail &amp; Rekomendasi Penggunaan
					</h2>
					<div class="mt-4 space-y-4 text-sm leading-7 text-neutral-600">
						{#each paragraphs as paragraph, idx (idx)}
							<p>{paragraph}</p>
						{/each}
					</div>
				</section>

				{#if data.item.specs.length > 0}
					<section class="rounded-3xl border border-neutral-200/80 bg-white p-6 sm:p-8">
						<h2 class="text-lg font-bold tracking-tight text-neutral-950">
							Spesifikasi &amp; Informasi Unit
						</h2>
						<dl class="mt-5 divide-y divide-neutral-100">
							{#each data.item.specs as spec (spec.label)}
								<div class="grid gap-1 py-3.5 sm:grid-cols-12 sm:gap-4">
									<dt class="text-xs font-semibold text-neutral-400 uppercase sm:col-span-4">
										{spec.label}
									</dt>
									<dd class="text-sm font-medium text-neutral-900 sm:col-span-8">
										{spec.value}
									</dd>
								</div>
							{/each}
						</dl>
					</section>
				{/if}

				{#if data.item.includes.length > 0}
					<section class="rounded-3xl border border-neutral-200/80 bg-white p-6 sm:p-8">
						<h2 class="text-lg font-bold tracking-tight text-neutral-950">
							Kelengkapan yang Didapat
						</h2>
						<ul class="mt-4 grid gap-3 sm:grid-cols-2">
							{#each data.item.includes as inc (inc)}
								<li class="flex items-start gap-2.5 text-sm text-neutral-700">
									<span
										class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700"
									>
										✓
									</span>
									<span>{inc}</span>
								</li>
							{/each}
						</ul>
					</section>
				{/if}

				<section class="rounded-3xl border border-neutral-200/80 bg-surface p-6 sm:p-8">
					<h2 class="text-base font-bold tracking-tight text-neutral-950">
						Ketentuan Sewa &amp; Pengembalian
					</h2>
					<ul class="mt-3.5 space-y-2 text-xs leading-relaxed text-neutral-600 sm:text-sm">
						<li>
							• Masukkan barang ke keranjang bersama unit lain untuk langsung melihat estimasi
							total biaya sewa.
						</li>
						<li>
							• Minimal sewa <strong>{data.item.minDurationDays} {data.item.unitLabel}</strong>.
							Setelah checkout, status sewa dan jatuh tempo pengembalian tercatat di Dashboard Pemesan.
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
				<div class="sticky top-24 rounded-3xl border border-neutral-200/90 bg-white p-6 shadow-xl shadow-neutral-950/[0.04] sm:p-7">
					<div class="flex flex-wrap items-center gap-2">
						<a
							href={`/katalog?kategori=${data.item.category.slug}`}
							class="inline-flex items-center gap-1.5 rounded-full border {theme.border} {theme.badgeBg} px-3 py-1 text-xs font-semibold {theme.badgeText}"
						>
							<CategoryIcon icon={data.item.category.icon} class="h-3.5 w-3.5" />
							{data.item.category.name}
						</a>
						<span class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
							Stok: {data.item.stockQty} Unit
						</span>
					</div>

					<h1 class="mt-4 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
						{data.item.name}
					</h1>
					<p class="mt-2.5 text-sm leading-relaxed text-neutral-500">
						{data.item.shortDescription}
					</p>

					<!-- Price Box -->
					<div class="mt-6 rounded-2xl bg-surface p-4">
						<p class="text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
							Tarif Sewa
						</p>
						<p class="mt-1 text-2xl font-bold text-neutral-950">
							{formatRupiah(unitPrice)}
							<span class="text-sm font-normal text-neutral-500">/ {data.item.unitLabel}</span>
						</p>
					</div>

					<!-- Pilihan Varian -->
					{#if data.item.variants.length > 0}
						<div class="mt-5">
							<p class="text-xs font-semibold text-neutral-700">
								Pilih Varian / Tipe ({data.item.variants.length} opsi):
							</p>
							<div class="mt-2.5 flex flex-wrap gap-2">
								{#each data.item.variants as variant (variant)}
									<button
										type="button"
										onclick={() => (selectedVariant = variant)}
										class="rounded-xl border px-3 py-1.5 text-xs font-medium transition {selectedVariant ===
										variant
											? 'border-neutral-950 bg-neutral-950 text-white'
											: 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'}"
									>
										{variant}
									</button>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Tanggal & Qty -->
					<div class="mt-6 space-y-4 border-t border-neutral-100 pt-5">
						<div class="grid grid-cols-2 gap-3">
							<div>
								<label for="rent-start" class="block text-xs font-medium text-neutral-700">
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
									class="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-xs text-neutral-900 focus:border-neutral-950 focus:outline-none"
								/>
							</div>
							<div>
								<label for="rent-end" class="block text-xs font-medium text-neutral-700">
									Sampai Tanggal
								</label>
								<input
									id="rent-end"
									type="date"
									min={startDate || today}
									bind:value={endDate}
									class="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-xs text-neutral-900 focus:border-neutral-950 focus:outline-none"
								/>
							</div>
						</div>

						<div>
							<label for="rent-qty" class="block text-xs font-medium text-neutral-700">
								Jumlah Unit (maks. {data.item.stockQty})
							</label>
							<div class="mt-1 flex items-center rounded-xl border border-neutral-200">
								<button
									type="button"
									onclick={() => (qty = Math.max(1, qty - 1))}
									aria-label="Kurangi jumlah"
									class="px-4 py-2 text-sm font-semibold text-neutral-600 hover:text-neutral-950"
								>
									−
								</button>
								<input
									id="rent-qty"
									type="number"
									min="1"
									max={Math.max(1, data.item.stockQty)}
									bind:value={qty}
									class="w-full text-center text-sm font-semibold text-neutral-950 focus:outline-none"
								/>
								<button
									type="button"
									onclick={() => (qty = Math.min(Math.max(1, data.item.stockQty), qty + 1))}
									aria-label="Tambah jumlah"
									class="px-4 py-2 text-sm font-semibold text-neutral-600 hover:text-neutral-950"
								>
									+
								</button>
							</div>
						</div>

						<!-- Live Cost Estimation -->
						<div class="rounded-2xl bg-neutral-950 px-4 py-3.5 text-white">
							<div class="flex items-center justify-between text-xs text-neutral-300">
								<span>
									Estimasi ({qty} unit × {estimatedDays} {data.item.unitLabel})
								</span>
								<span>{formatRupiah(unitPrice)} / {data.item.unitLabel}</span>
							</div>
							<p class="mt-1 text-xl font-bold">{formatRupiah(estimatedTotal)}</p>
						</div>

						{#if addedFeedback}
							<p class="rounded-2xl bg-emerald-50 px-3.5 py-2 text-center text-xs font-semibold text-emerald-700">
								✓ Ditambahkan ke keranjang sewa Anda!
							</p>
						{/if}

						<div class="space-y-2.5 pt-1">
							<button
								type="button"
								onclick={() => addCurrentToCart(true)}
								class="flex w-full items-center justify-center gap-2 rounded-full bg-neutral-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
							>
								+ Masukkan ke Keranjang
							</button>

							<button
								type="button"
								onclick={handleRentNow}
								class="flex w-full items-center justify-center gap-1.5 rounded-full border border-neutral-300 bg-white px-6 py-3.5 text-sm font-semibold text-neutral-950 transition hover:border-neutral-950"
							>
								Sewa Sekarang &amp; Cek Total →
							</button>
						</div>

						<div class="pt-1 text-center">
							<a
								href={whatsappAskUrl}
								target="_blank"
								rel="noopener noreferrer"
								class="text-xs font-medium text-neutral-500 underline underline-offset-4 transition hover:text-neutral-950"
							>
								Butuh konsultasi teknis? Chat CS via WhatsApp
							</a>
						</div>
					</div>
				</div>
			</aside>
		</div>
	</div>
</article>

{#if data.relatedItems.length > 0}
	<section class="border-t border-neutral-100 bg-surface py-20">
		<div class="mx-auto max-w-6xl px-6">
			<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
				<div>
					<p class="text-xs font-semibold tracking-widest text-neutral-400 uppercase">
						Kategori {data.item.category.name}
					</p>
					<h2 class="mt-2 text-2xl font-bold tracking-tight text-neutral-950">
						Unit lain yang sering disewa bersamaan
					</h2>
				</div>
				<a
					href={`/katalog?kategori=${data.item.category.slug}`}
					class="text-sm font-semibold text-neutral-950 hover:text-neutral-600"
				>
					Lihat semua {data.item.category.name} →
				</a>
			</div>

			<div class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
				{#each data.relatedItems as related (related.id)}
					<RentalItemCard item={related} />
				{/each}
			</div>
		</div>
	</section>
{/if}
