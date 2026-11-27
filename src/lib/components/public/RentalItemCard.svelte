<script lang="ts">
	import CategoryIcon from '#lib/components/public/CategoryIcon.svelte';
	import { rentalCart } from '#lib/stores/cart.svelte';
	import {
		formatRupiah,
		getCategoryTheme,
		resolveItemBranchPricing,
		type RentalItemWithCategory
	} from '#lib/utils/catalog';

	interface Props {
		item: RentalItemWithCategory;
		variant?: 'light' | 'dark';
	}

	let { item, variant = 'light' }: Props = $props();

	let isDark = $derived(variant === 'dark');
	let theme = $derived(getCategoryTheme(item.category.accent));
	let primarySpec = $derived(item.specs[0] ?? null);
	let secondarySpec = $derived(item.specs[1] ?? null);
	let hasVariants = $derived(item.variants.length > 0);

	let branchPricing = $derived(resolveItemBranchPricing(item, rentalCart.branchId));

	function handleQuickAdd(): void {
		if (!branchPricing.isAvailable || branchPricing.stockQty <= 0) return;
		rentalCart.addItem({
			itemId: item.id,
			slug: item.slug,
			name: item.name,
			categoryName: item.category.name,
			imageUrl: item.imageUrl,
			variant: null,
			pricePerDay: branchPricing.pricePerDay,
			unitLabel: item.unitLabel,
			quantity: 1,
			stockQty: branchPricing.stockQty,
			requiresDeposit: item.requiresDeposit,
			branchStocks: item.branchStocks
		});
	}
</script>

{#if isDark}
	<div
		class="group flex h-full flex-col overflow-hidden rounded-[2rem] border border-white/15 bg-[#0c0c0f] transition duration-300 hover:-translate-y-1 hover:border-white/40 hover:bg-[#121216]"
	>
		<div class="p-2.5 pb-0">
			<a
				href={`/katalog/${item.slug}`}
				class="relative block aspect-16/10 w-full overflow-hidden rounded-[1.5rem] bg-[#16161b]"
			>
				{#if item.imageUrl}
					<img
						src={item.imageUrl}
						alt={item.name}
						loading="lazy"
						class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
					/>
				{:else}
					<div
						class="flex h-full w-full flex-col items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_rgba(12,12,15,1))] p-6 text-center"
					>
						<div
							class="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition duration-300 group-hover:scale-110 group-hover:bg-white group-hover:text-black"
						>
							<CategoryIcon icon={item.category.icon} class="h-6 w-6" />
						</div>
						{#if primarySpec}
							<p class="mt-3.5 max-w-[85%] truncate text-xs font-medium text-neutral-400">
								{primarySpec.value}
							</p>
						{/if}
					</div>
				{/if}

				<div class="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
					<span
						class="inline-flex max-w-[70%] items-center gap-1.5 truncate rounded-full border border-white/15 bg-black/80 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-md"
					>
						<CategoryIcon icon={item.category.icon} class="h-3.5 w-3.5 shrink-0" />
						<span class="truncate">{item.category.name}</span>
					</span>

					{#if !branchPricing.isAvailable || branchPricing.stockQty <= 0}
						<span
							class="shrink-0 rounded-full border border-red-400/30 bg-red-500/20 px-2.5 py-1 text-[10px] font-bold text-red-200 backdrop-blur-md"
						>
							Habis
						</span>
					{:else if item.isFeatured}
						<span
							class="shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-extrabold tracking-wide text-black"
						>
							Populer
						</span>
					{/if}
				</div>
			</a>
		</div>

		<div class="flex flex-1 flex-col p-5 pt-4 sm:p-6 sm:pt-5">
			<a
				href={`/katalog/${item.slug}`}
				class="line-clamp-2 text-base font-bold tracking-tight text-white transition hover:text-neutral-300 sm:text-lg"
			>
				{item.name}
			</a>

			<p class="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-neutral-400">
				{item.shortDescription}
			</p>

			<div class="mt-4 flex flex-wrap gap-1.5">
				{#if hasVariants}
					<span
						class="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-neutral-200"
					>
						{item.variants.length} pilihan varian
					</span>
				{:else if secondarySpec}
					<span
						class="max-w-full truncate rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-neutral-300"
					>
						{secondarySpec.label}: {secondarySpec.value}
					</span>
				{/if}

				{#if rentalCart.branchName}
					<span
						class="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300"
					>
						{rentalCart.branchName} · Stok {branchPricing.stockQty}
					</span>
				{/if}
			</div>

			<div class="mt-5 flex items-center justify-between gap-2 border-t border-white/10 pt-4">
				<div>
					<p class="text-base font-extrabold text-white">
						{formatRupiah(branchPricing.pricePerDay)}
					</p>
					<p class="text-[11px] text-neutral-400">per {item.unitLabel}</p>
				</div>

				<div class="flex items-center gap-1.5">
					<a
						href={`/katalog/${item.slug}`}
						class="rounded-full border border-white/20 px-3.5 py-1.5 text-xs font-semibold text-neutral-200 transition hover:border-white hover:text-white"
					>
						Detail
					</a>
					{#if !branchPricing.isAvailable || branchPricing.stockQty <= 0}
						<span
							class="rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-neutral-500"
						>
							Kosong
						</span>
					{:else if hasVariants}
						<a
							href={`/katalog/${item.slug}`}
							class="rounded-full bg-white px-4 py-1.5 text-xs font-bold text-black transition hover:bg-neutral-200"
						>
							Pilih Varian
						</a>
					{:else}
						<button
							type="button"
							onclick={handleQuickAdd}
							class="rounded-full bg-white px-4 py-1.5 text-xs font-bold text-black transition hover:bg-neutral-200"
						>
							+ Keranjang
						</button>
					{/if}
				</div>
			</div>
		</div>
	</div>
{:else}
	<div
		class="group flex h-full flex-col overflow-hidden rounded-3xl border border-neutral-200/80 bg-white transition duration-300 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-xl hover:shadow-neutral-950/[0.06]"
	>
		<a
			href={`/katalog/${item.slug}`}
			class="relative block aspect-16/10 w-full overflow-hidden bg-surface"
		>
			{#if item.imageUrl}
				<img
					src={item.imageUrl}
					alt={item.name}
					loading="lazy"
					class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
				/>
			{:else}
				<div
					class="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br {theme.surfaceBg} p-6 text-center"
				>
					<div
						class="flex h-14 w-14 items-center justify-center rounded-2xl {theme.iconBg} {theme.iconText} transition duration-300 group-hover:scale-105"
					>
						<CategoryIcon icon={item.category.icon} class="h-7 w-7" />
					</div>
					{#if primarySpec}
						<p class="mt-3.5 max-w-[85%] truncate text-xs font-medium text-neutral-500">
							{primarySpec.value}
						</p>
					{/if}
				</div>
			{/if}

			<div class="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2">
				<span
					class="inline-flex max-w-[70%] items-center gap-1.5 truncate rounded-full border {theme.border} bg-white/95 px-2.5 py-1 text-[11px] font-semibold {theme.badgeText} backdrop-blur-md"
				>
					<CategoryIcon icon={item.category.icon} class="h-3.5 w-3.5 shrink-0" />
					<span class="truncate">{item.category.name}</span>
				</span>

				{#if !branchPricing.isAvailable || branchPricing.stockQty <= 0}
					<span
						class="shrink-0 rounded-full bg-neutral-200/95 px-2.5 py-1 text-[10px] font-semibold text-neutral-700"
					>
						Stok Habis
					</span>
				{:else if item.isFeatured}
					<span
						class="shrink-0 rounded-full bg-neutral-950/90 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-white backdrop-blur-md"
					>
						Populer
					</span>
				{/if}
			</div>
		</a>

		<div class="flex flex-1 flex-col p-5 sm:p-6">
			<a
				href={`/katalog/${item.slug}`}
				class="line-clamp-2 text-base font-semibold tracking-tight text-neutral-950 transition hover:text-neutral-600 sm:text-lg"
			>
				{item.name}
			</a>

			<p class="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-neutral-500">
				{item.shortDescription}
			</p>

			<div class="mt-4 flex flex-wrap gap-1.5">
				{#if hasVariants}
					<span class="rounded-full bg-surface px-2.5 py-1 text-[11px] font-medium text-neutral-700">
						{item.variants.length} pilihan varian
					</span>
				{:else if secondarySpec}
					<span
						class="max-w-full truncate rounded-full bg-surface px-2.5 py-1 text-[11px] font-medium text-neutral-600"
					>
						{secondarySpec.label}: {secondarySpec.value}
					</span>
				{/if}

				{#if rentalCart.branchName}
					<span
						class="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700"
					>
						{rentalCart.branchName} · Stok {branchPricing.stockQty}
					</span>
				{/if}
			</div>

			<div class="mt-5 flex items-center justify-between gap-2 border-t border-neutral-100 pt-4">
				<div>
					<p class="text-sm font-bold text-neutral-950">
						{formatRupiah(branchPricing.pricePerDay)}
					</p>
					<p class="text-[11px] text-neutral-400">per {item.unitLabel}</p>
				</div>

				<div class="flex items-center gap-1.5">
					<a
						href={`/katalog/${item.slug}`}
						class="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:border-neutral-950 hover:text-neutral-950"
					>
						Detail
					</a>
					{#if !branchPricing.isAvailable || branchPricing.stockQty <= 0}
						<span class="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-400">
							Kosong
						</span>
					{:else if hasVariants}
						<a
							href={`/katalog/${item.slug}`}
							class="rounded-full bg-neutral-950 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-neutral-800"
						>
							Pilih Varian
						</a>
					{:else}
						<button
							type="button"
							onclick={handleQuickAdd}
							class="rounded-full bg-neutral-950 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-neutral-800"
						>
							+ Keranjang
						</button>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}
