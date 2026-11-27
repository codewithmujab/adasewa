<script lang="ts">
	import ImageUploader from '#lib/components/admin/ImageUploader.svelte';
	import { slugify } from '#lib/schemas/common';
	import type { RentalCategory, RentalItem, RentalItemSpec } from '#lib/server/db/schema';
	import type { ApiResponse } from '#lib/types/api';

	interface Props {
		item: RentalItem | null;
		categories: RentalCategory[];
		onSaved: (saved: RentalItem, isNew: boolean) => void;
		onCancel: () => void;
	}

	let { item, categories, onSaved, onCancel }: Props = $props();

	let categoryId = $state('');
	let name = $state('');
	let slug = $state('');
	let slugTouched = $state(false);
	let shortDescription = $state('');
	let description = $state('');
	let priceInput = $state('');
	let unitLabel = $state('hari');
	let minDurationDays = $state(1);
	let stockQty = $state(1);
	let sortOrder = $state(0);
	let specsText = $state('');
	let includesText = $state('');
	let variantsText = $state('');
	let imageKey = $state<string | null>(null);
	let imageUrl = $state<string | null>(null);
	let requiresDeposit = $state(false);
	let deliveryAvailable = $state(true);
	let pickupAvailable = $state(true);
	let isFeatured = $state(false);
	let isPublished = $state(true);

	let submitting = $state(false);
	let errorMessage = $state<string | null>(null);
	let fieldErrors = $state<Record<string, string[]>>({});

	$effect(() => {
		const current = item;
		categoryId = current?.categoryId ?? categories[0]?.id ?? '';
		name = current?.name ?? '';
		slug = current?.slug ?? '';
		slugTouched = Boolean(current);
		shortDescription = current?.shortDescription ?? '';
		description = current?.description ?? '';
		priceInput =
			current?.pricePerDay !== null && current?.pricePerDay !== undefined
				? String(current.pricePerDay)
				: '';
		unitLabel = current?.unitLabel ?? 'hari';
		minDurationDays = current?.minDurationDays ?? 1;
		stockQty = current?.stockQty ?? 1;
		sortOrder = current?.sortOrder ?? 0;
		specsText = (current?.specs ?? []).map((s) => `${s.label}: ${s.value}`).join('\n');
		includesText = (current?.includes ?? []).join('\n');
		variantsText = (current?.variants ?? []).join(', ');
		imageKey = current?.imageKey ?? null;
		imageUrl = current?.imageUrl ?? null;
		requiresDeposit = current?.requiresDeposit ?? false;
		deliveryAvailable = current?.deliveryAvailable ?? true;
		pickupAvailable = current?.pickupAvailable ?? true;
		isFeatured = current?.isFeatured ?? false;
		isPublished = current?.isPublished ?? true;
		errorMessage = null;
		fieldErrors = {};
	});

	function handleNameInput(value: string): void {
		name = value;
		if (!slugTouched) {
			slug = slugify(value, 200);
		}
	}

	function parseSpecs(raw: string): RentalItemSpec[] {
		return raw
			.split('\n')
			.map((line) => line.trim())
			.filter((line) => line.length > 0)
			.map((line) => {
				const colonIdx = line.indexOf(':');
				if (colonIdx === -1) {
					return { label: 'Info', value: line };
				}
				const label = line.slice(0, colonIdx).trim();
				const value = line.slice(colonIdx + 1).trim();
				return { label: label || 'Info', value: value || '-' };
			})
			.filter((spec) => spec.value.length > 0);
	}

	function parseLineList(raw: string): string[] {
		return raw
			.split('\n')
			.map((line) => line.trim())
			.filter((line) => line.length > 0);
	}

	function parseCommaList(raw: string): string[] {
		return raw
			.split(/[,\n]/)
			.map((part) => part.trim())
			.filter((part) => part.length > 0);
	}

	async function handleSubmit(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		submitting = true;
		errorMessage = null;
		fieldErrors = {};

		const trimmedPrice = priceInput.trim();
		const parsedPrice =
			trimmedPrice.length > 0 && Number.isFinite(Number(trimmedPrice))
				? Math.max(0, Math.trunc(Number(trimmedPrice)))
				: null;

		const payload = {
			categoryId,
			name: name.trim(),
			slug: slug.trim() || undefined,
			shortDescription: shortDescription.trim(),
			description: description.trim(),
			specs: parseSpecs(specsText),
			includes: parseLineList(includesText),
			variants: parseCommaList(variantsText),
			pricePerDay: parsedPrice,
			unitLabel: unitLabel.trim() || 'hari',
			minDurationDays: Math.max(1, Math.trunc(Number(minDurationDays) || 1)),
			stockQty: Math.max(0, Math.trunc(Number(stockQty) || 0)),
			requiresDeposit,
			deliveryAvailable,
			pickupAvailable,
			imageKey,
			imageUrl,
			isFeatured,
			isPublished,
			sortOrder: Math.max(0, Math.trunc(Number(sortOrder) || 0))
		};

		try {
			const isEdit = Boolean(item);
			const endpoint = isEdit && item ? `/api/catalog/${item.id}` : '/api/catalog';
			const response = await fetch(endpoint, {
				method: isEdit ? 'PATCH' : 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			const result = (await response.json()) as ApiResponse<RentalItem>;

			if (!response.ok || !result.success || !result.data) {
				errorMessage = result.message || 'Gagal menyimpan barang katalog.';
				fieldErrors = result.errors ?? {};
				return;
			}

			onSaved(result.data, !isEdit);
		} catch {
			errorMessage = 'Terjadi kesalahan jaringan saat menyimpan barang.';
		} finally {
			submitting = false;
		}
	}
</script>

<form onsubmit={handleSubmit} class="space-y-5">
	{#if errorMessage}
		<div class="rounded-2xl border border-red-400/30 bg-red-500/15 px-4 py-3 text-sm text-red-200">
			{errorMessage}
		</div>
	{/if}

	<div class="grid gap-4 sm:grid-cols-2">
		<div>
			<label for="cat-name" class="block text-sm font-semibold text-neutral-300">Nama Barang *</label>
			<input
				id="cat-name"
				type="text"
				required
				value={name}
				oninput={(e) => handleNameInput(e.currentTarget.value)}
				placeholder="Proyektor 3500 Lumens"
				class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-white focus:outline-none"
			/>
			{#if fieldErrors.name?.[0]}
				<p class="mt-1 text-xs text-red-400">{fieldErrors.name[0]}</p>
			{/if}
		</div>

		<div>
			<label for="cat-category" class="block text-sm font-semibold text-neutral-300">Kategori *</label>
			<select
				id="cat-category"
				required
				bind:value={categoryId}
				class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2.5 text-sm text-white [color-scheme:dark] focus:border-white focus:outline-none"
			>
				{#each categories as cat (cat.id)}
					<option value={cat.id} class="bg-neutral-950">{cat.name}</option>
				{/each}
			</select>
		</div>
	</div>

	<div class="grid gap-4 sm:grid-cols-3">
		<div>
			<label for="cat-price" class="block text-sm font-semibold text-neutral-300">
				Harga Sewa Dasar (Rp)
			</label>
			<input
				id="cat-price"
				type="number"
				min="0"
				step="1000"
				bind:value={priceInput}
				placeholder="Kosongkan = Tanya CS"
				class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-white focus:outline-none"
			/>
		</div>

		<div>
			<label for="cat-unit" class="block text-sm font-semibold text-neutral-300">Satuan Tarif</label>
			<input
				id="cat-unit"
				type="text"
				bind:value={unitLabel}
				placeholder="hari / event / set"
				class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-white focus:outline-none"
			/>
		</div>

		<div>
			<label for="cat-stock" class="block text-sm font-semibold text-neutral-300">Stok Unit Dasar</label>
			<input
				id="cat-stock"
				type="number"
				min="0"
				bind:value={stockQty}
				class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2.5 text-sm text-white focus:border-white focus:outline-none"
			/>
		</div>
	</div>

	<div class="grid gap-4 sm:grid-cols-3">
		<div class="sm:col-span-2">
			<label for="cat-slug" class="block text-sm font-semibold text-neutral-300">Slug URL</label>
			<input
				id="cat-slug"
				type="text"
				value={slug}
				oninput={(e) => {
					slugTouched = true;
					slug = e.currentTarget.value;
				}}
				class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2.5 font-mono text-xs text-white focus:border-white focus:outline-none"
			/>
		</div>
		<div>
			<label for="cat-order" class="block text-sm font-semibold text-neutral-300">Urutan</label>
			<input
				id="cat-order"
				type="number"
				min="0"
				max="9999"
				bind:value={sortOrder}
				class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2.5 text-sm text-white focus:border-white focus:outline-none"
			/>
		</div>
	</div>

	<div>
		<label for="cat-short" class="block text-sm font-semibold text-neutral-300">
			Deskripsi Singkat (Kartu Katalog) *
		</label>
		<textarea
			id="cat-short"
			rows="2"
			required
			bind:value={shortDescription}
			class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2.5 text-sm text-white focus:border-white focus:outline-none"
		></textarea>
	</div>

	<div>
		<label for="cat-desc" class="block text-sm font-semibold text-neutral-300">
			Detail &amp; Rekomendasi Penggunaan *
		</label>
		<textarea
			id="cat-desc"
			rows="4"
			required
			bind:value={description}
			class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2.5 text-sm text-white focus:border-white focus:outline-none"
		></textarea>
	</div>

	<div class="grid gap-4 sm:grid-cols-2">
		<div>
			<label for="cat-specs" class="block text-sm font-semibold text-neutral-300">
				Spesifikasi (1 baris = Label: Nilai)
			</label>
			<textarea
				id="cat-specs"
				rows="4"
				bind:value={specsText}
				placeholder="Kecerahan: 3500 ANSI Lumens&#10;Konektivitas: HDMI & VGA"
				class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2.5 font-mono text-xs text-white placeholder:text-neutral-500 focus:border-white focus:outline-none"
			></textarea>
		</div>

		<div>
			<label for="cat-includes" class="block text-sm font-semibold text-neutral-300">
				Kelengkapan Didapat (1 item per baris)
			</label>
			<textarea
				id="cat-includes"
				rows="4"
				bind:value={includesText}
				placeholder="Unit Proyektor&#10;Kabel HDMI&#10;Remote Control"
				class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2.5 text-xs text-white placeholder:text-neutral-500 focus:border-white focus:outline-none"
			></textarea>
		</div>
	</div>

	<div>
		<label for="cat-variants" class="block text-sm font-semibold text-neutral-300">
			Pilihan Varian / Ukuran (pisahkan dengan koma, opsional)
		</label>
		<input
			id="cat-variants"
			type="text"
			bind:value={variantsText}
			placeholder="Size S, Size M, Size L, Size XL"
			class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-white focus:outline-none"
		/>
	</div>

	<ImageUploader
		label="Foto Unit Barang (Cloudflare R2)"
		folder="catalog"
		{imageKey}
		{imageUrl}
		onChange={(val) => {
			imageKey = val.imageKey;
			imageUrl = val.imageUrl;
		}}
	/>

	<div class="flex flex-wrap gap-x-6 gap-y-3 rounded-2xl border border-white/10 bg-black px-4 py-3.5 text-xs">
		<label class="flex cursor-pointer items-center gap-2 text-neutral-200">
			<input type="checkbox" bind:checked={isPublished} class="h-4 w-4 accent-white" />
			<span>Publikasikan di Katalog</span>
		</label>
		<label class="flex cursor-pointer items-center gap-2 text-neutral-200">
			<input type="checkbox" bind:checked={isFeatured} class="h-4 w-4 accent-white" />
			<span>Tandai Populer / Unggulan</span>
		</label>
		<label class="flex cursor-pointer items-center gap-2 text-neutral-200">
			<input type="checkbox" bind:checked={requiresDeposit} class="h-4 w-4 accent-white" />
			<span>Perlu Verifikasi / DP Khusus</span>
		</label>
		<label class="flex cursor-pointer items-center gap-2 text-neutral-200">
			<input type="checkbox" bind:checked={deliveryAvailable} class="h-4 w-4 accent-white" />
			<span>Bisa Delivery</span>
		</label>
		<label class="flex cursor-pointer items-center gap-2 text-neutral-200">
			<input type="checkbox" bind:checked={pickupAvailable} class="h-4 w-4 accent-white" />
			<span>Bisa Ambil di Kios</span>
		</label>
	</div>

	<div class="flex items-center justify-end gap-3 border-t border-white/10 pt-5">
		<button
			type="button"
			onclick={onCancel}
			class="rounded-full border border-white/20 bg-black px-5 py-2.5 text-sm font-bold text-neutral-300 hover:border-white hover:text-white"
		>
			Batal
		</button>
		<button
			type="submit"
			disabled={submitting}
			class="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black hover:bg-neutral-200 disabled:opacity-60"
		>
			{submitting ? 'Menyimpan...' : item ? 'Simpan Perubahan' : 'Tambah Barang'}
		</button>
	</div>
</form>
