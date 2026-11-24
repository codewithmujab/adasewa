<script lang="ts">
	import Modal from '#lib/components/ui/Modal.svelte';
	import Toast from '#lib/components/ui/Toast.svelte';
	import type { PromoCode } from '#lib/server/db/schema';
	import type { ApiResponse } from '#lib/types/api';
	import { formatRupiah } from '#lib/utils/catalog';
	import { formatDateId } from '#lib/utils/orders';
	import { formatPromoBadge, normalizePromoCode } from '#lib/utils/promo';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let promos = $state<PromoCode[]>([]);
	let search = $state('');
	let modalOpen = $state(false);
	let editingPromo = $state<PromoCode | null>(null);
	let deletingPromo = $state<PromoCode | null>(null);
	let busyId = $state<string | null>(null);

	// Form state
	let code = $state('');
	let title = $state('');
	let description = $state('');
	let discountType = $state<'percentage' | 'fixed'>('percentage');
	let discountValue = $state(10);
	let maxDiscountInput = $state('');
	let minOrderAmount = $state(0);
	let usageLimitInput = $state('');
	let startsAtInput = $state('');
	let expiresAtInput = $state('');
	let isActive = $state(true);
	let showOnLanding = $state(true);
	let saving = $state(false);
	let formError = $state<string | null>(null);

	let toastMessage = $state<string | null>(null);
	let toastVariant = $state<'success' | 'error' | 'info'>('success');

	$effect(() => {
		promos = data.promos;
	});

	let filteredPromos = $derived.by(() => {
		const q = search.trim().toLowerCase();
		if (!q) return promos;
		return promos.filter(
			(p) =>
				p.code.toLowerCase().includes(q) ||
				p.title.toLowerCase().includes(q) ||
				p.description.toLowerCase().includes(q)
		);
	});

	let stats = $derived({
		total: promos.length,
		active: promos.filter((p) => p.isActive).length,
		totalUsed: promos.reduce((acc, p) => acc + p.usedCount, 0)
	});

	function toDateInputValue(dt: Date | string | null): string {
		if (!dt) return '';
		const d = typeof dt === 'string' ? new Date(dt) : dt;
		if (Number.isNaN(d.getTime())) return '';
		return d.toISOString().slice(0, 10);
	}

	function showToast(message: string, variant: 'success' | 'error' | 'info' = 'success'): void {
		toastVariant = variant;
		toastMessage = message;
	}

	function openCreate(): void {
		editingPromo = null;
		code = '';
		title = '';
		description = '';
		discountType = 'percentage';
		discountValue = 10;
		maxDiscountInput = '150000';
		minOrderAmount = 100000;
		usageLimitInput = '100';
		startsAtInput = '';
		expiresAtInput = '';
		isActive = true;
		showOnLanding = true;
		formError = null;
		modalOpen = true;
	}

	function openEdit(promo: PromoCode): void {
		editingPromo = promo;
		code = promo.code;
		title = promo.title;
		description = promo.description;
		discountType = promo.discountType === 'fixed' ? 'fixed' : 'percentage';
		discountValue = promo.discountValue;
		maxDiscountInput = promo.maxDiscountAmount !== null ? String(promo.maxDiscountAmount) : '';
		minOrderAmount = promo.minOrderAmount;
		usageLimitInput = promo.usageLimit !== null ? String(promo.usageLimit) : '';
		startsAtInput = toDateInputValue(promo.startsAt);
		expiresAtInput = toDateInputValue(promo.expiresAt);
		isActive = promo.isActive;
		showOnLanding = promo.showOnLanding;
		formError = null;
		modalOpen = true;
	}

	async function handleSavePromo(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		saving = true;
		formError = null;

		const parsedMax =
			discountType === 'percentage' && maxDiscountInput.trim().length > 0
				? Math.max(1000, Math.trunc(Number(maxDiscountInput)))
				: null;
		const parsedLimit =
			usageLimitInput.trim().length > 0 ? Math.max(1, Math.trunc(Number(usageLimitInput))) : null;

		const payload = {
			code: normalizePromoCode(code),
			title: title.trim(),
			description: description.trim(),
			discountType,
			discountValue: Math.max(1, Math.trunc(Number(discountValue) || 1)),
			maxDiscountAmount: parsedMax,
			minOrderAmount: Math.max(0, Math.trunc(Number(minOrderAmount) || 0)),
			usageLimit: parsedLimit,
			startsAt: startsAtInput ? `${startsAtInput}T00:00:00Z` : null,
			expiresAt: expiresAtInput ? `${expiresAtInput}T23:59:59Z` : null,
			isActive,
			showOnLanding
		};

		try {
			const isEdit = Boolean(editingPromo);
			const endpoint = isEdit && editingPromo ? `/api/promos/${editingPromo.id}` : '/api/promos';
			const response = await fetch(endpoint, {
				method: isEdit ? 'PATCH' : 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			const result = (await response.json()) as ApiResponse<PromoCode>;
			if (!response.ok || !result.success || !result.data) {
				formError = result.message || 'Gagal menyimpan promo diskon.';
				return;
			}

			const saved = result.data;
			if (isEdit) {
				promos = promos.map((p) => (p.id === saved.id ? saved : p));
				showToast(`Promo "${saved.code}" berhasil diperbarui.`);
			} else {
				promos = [saved, ...promos];
				showToast(`Promo "${saved.code}" berhasil dibuat.`);
			}
			modalOpen = false;
			editingPromo = null;
		} catch {
			formError = 'Gangguan jaringan saat menyimpan promo.';
		} finally {
			saving = false;
		}
	}

	async function toggleActive(promo: PromoCode): Promise<void> {
		busyId = promo.id;
		try {
			const response = await fetch(`/api/promos/${promo.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ isActive: !promo.isActive })
			});
			const result = (await response.json()) as ApiResponse<PromoCode>;
			if (!response.ok || !result.success || !result.data) {
				showToast(result.message || 'Gagal mengubah status promo.', 'error');
				return;
			}
			const updated = result.data;
			promos = promos.map((p) => (p.id === updated.id ? updated : p));
			showToast(
				updated.isActive
					? `Promo ${updated.code} diaktifkan.`
					: `Promo ${updated.code} dinonaktifkan.`
			);
		} catch {
			showToast('Gangguan jaringan saat mengubah status promo.', 'error');
		} finally {
			busyId = null;
		}
	}

	async function confirmDelete(): Promise<void> {
		if (!deletingPromo) return;
		const target = deletingPromo;
		busyId = target.id;
		try {
			const response = await fetch(`/api/promos/${target.id}`, { method: 'DELETE' });
			const result = (await response.json()) as ApiResponse<{ id: string }>;
			if (!response.ok || !result.success) {
				showToast(result.message || 'Gagal menghapus promo.', 'error');
				return;
			}
			promos = promos.filter((p) => p.id !== target.id);
			deletingPromo = null;
			showToast(`Promo "${target.code}" berhasil dihapus.`);
		} catch {
			showToast('Gangguan jaringan saat menghapus promo.', 'error');
		} finally {
			busyId = null;
		}
	}
</script>

<svelte:head>
	<title>Promo &amp; Diskon — Admin CMS</title>
</svelte:head>

<div class="space-y-6">
	<header class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
		<div>
			<p class="text-xs font-semibold tracking-widest text-neutral-400 uppercase">Pemasaran</p>
			<h1 class="mt-1 text-3xl font-semibold tracking-tight text-neutral-950">Promo &amp; Diskon</h1>
			<p class="mt-1 text-sm text-neutral-500">
				Buat dan kelola voucher diskon persentase (%) atau potongan rupiah (Rp) untuk checkout &amp;
				landing page.
			</p>
		</div>

		<button
			type="button"
			onclick={openCreate}
			class="inline-flex items-center justify-center rounded-full bg-neutral-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
		>
			+ Buat Kode Promo
		</button>
	</header>

	<div class="grid gap-4 sm:grid-cols-3">
		<div class="rounded-3xl border border-neutral-200/80 bg-white p-5">
			<p class="text-xs font-medium text-neutral-400">Total Kode Promo</p>
			<p class="mt-2 text-3xl font-bold text-neutral-950">{stats.total}</p>
		</div>
		<div class="rounded-3xl border border-neutral-200/80 bg-white p-5">
			<p class="text-xs font-medium text-neutral-400">Sedang Aktif</p>
			<p class="mt-2 text-3xl font-bold text-emerald-600">{stats.active}</p>
		</div>
		<div class="rounded-3xl border border-neutral-200/80 bg-white p-5">
			<p class="text-xs font-medium text-neutral-400">Total Pemakaian</p>
			<p class="mt-2 text-3xl font-bold text-rose-600">{stats.totalUsed}×</p>
		</div>
	</div>

	<div class="rounded-3xl border border-neutral-200/80 bg-white p-4">
		<input
			type="search"
			bind:value={search}
			placeholder="Cari kode atau judul promo..."
			class="w-full rounded-full border border-neutral-200 bg-surface px-4 py-2 text-sm focus:border-neutral-950 focus:bg-white focus:outline-none sm:max-w-xs"
		/>
	</div>

	{#if filteredPromos.length > 0}
		<div class="overflow-hidden rounded-3xl border border-neutral-200/80 bg-white">
			<div class="overflow-x-auto">
				<table class="w-full text-left text-sm">
					<thead class="border-b border-neutral-100 bg-neutral-50/70 text-xs text-neutral-500">
						<tr>
							<th class="px-5 py-3.5 font-medium">Kode &amp; Judul</th>
							<th class="px-4 py-3.5 font-medium">Potongan &amp; Syarat</th>
							<th class="px-4 py-3.5 font-medium">Kuota &amp; Masa Berlaku</th>
							<th class="px-4 py-3.5 font-medium">Status</th>
							<th class="px-5 py-3.5 text-right font-medium">Aksi</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-neutral-100">
						{#each filteredPromos as promo (promo.id)}
							<tr class="transition hover:bg-neutral-50/60">
								<td class="px-5 py-4">
									<div class="flex items-center gap-2">
										<span class="rounded-lg bg-rose-50 px-2.5 py-1 font-mono text-xs font-bold text-rose-700">
											{promo.code}
										</span>
										{#if promo.showOnLanding}
											<span class="rounded-full bg-surface px-2 py-0.5 text-[10px] font-medium text-neutral-500">
												Landing
											</span>
										{/if}
									</div>
									<p class="mt-1 font-medium text-neutral-950">{promo.title}</p>
								</td>
								<td class="px-4 py-4 text-xs text-neutral-700">
									<p class="font-semibold text-neutral-950">{formatPromoBadge(promo)}</p>
									{#if promo.maxDiscountAmount}
										<p class="text-neutral-500">Maks. {formatRupiah(promo.maxDiscountAmount)}</p>
									{/if}
									<p class="text-neutral-400">
										Min. sewa {promo.minOrderAmount > 0 ? formatRupiah(promo.minOrderAmount) : 'Rp 0'}
									</p>
								</td>
								<td class="px-4 py-4 text-xs text-neutral-600">
									<p class="font-medium text-neutral-900">
										Dipakai {promo.usedCount} / {promo.usageLimit ?? '∞'}
									</p>
									<p class="text-neutral-400">
										{promo.startsAt || promo.expiresAt
											? `${promo.startsAt ? formatDateId(promo.startsAt) : 'Sekarang'} – ${promo.expiresAt ? formatDateId(promo.expiresAt) : 'Seterusnya'}`
											: 'Berlaku terus'}
									</p>
								</td>
								<td class="px-4 py-4">
									<button
										type="button"
										disabled={busyId === promo.id}
										onclick={() => toggleActive(promo)}
										class="rounded-full px-3 py-1 text-xs font-medium transition {promo.isActive
											? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
											: 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}"
									>
										{promo.isActive ? 'Aktif' : 'Nonaktif'}
									</button>
								</td>
								<td class="px-5 py-4 text-right">
									<div class="inline-flex items-center gap-2">
										<button
											type="button"
											onclick={() => openEdit(promo)}
											class="rounded-full border border-neutral-200 px-3.5 py-1.5 text-xs font-medium text-neutral-700 hover:border-neutral-950 hover:text-neutral-950"
										>
											Edit
										</button>
										<button
											type="button"
											onclick={() => (deletingPromo = promo)}
											class="rounded-full border border-red-200 px-3.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
										>
											Hapus
										</button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{:else}
		<div class="rounded-3xl border border-neutral-200/80 bg-white p-14 text-center">
			<p class="text-sm text-neutral-500">Belum ada kode promo diskon.</p>
		</div>
	{/if}
</div>

<Modal
	open={modalOpen}
	title={editingPromo ? `Edit Promo ${editingPromo.code}` : 'Buat Kode Promo Baru'}
	subtitle="Promo aktif dapat langsung digunakan penyewa di halaman Checkout."
	onClose={() => {
		modalOpen = false;
		editingPromo = null;
	}}
>
	<form onsubmit={handleSavePromo} class="space-y-4">
		{#if formError}
			<div class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
				{formError}
			</div>
		{/if}

		<div class="grid gap-4 sm:grid-cols-2">
			<div>
				<label for="pr-code" class="block text-xs font-semibold text-neutral-700">Kode Promo *</label>
				<input
					id="pr-code"
					type="text"
					required
					bind:value={code}
					placeholder="SEWABARU10"
					class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 font-mono text-sm font-bold uppercase focus:border-neutral-950 focus:outline-none"
				/>
			</div>

			<div>
				<label for="pr-title" class="block text-xs font-semibold text-neutral-700">Judul Promo *</label>
				<input
					id="pr-title"
					type="text"
					required
					bind:value={title}
					placeholder="Diskon 10% Semua Barang"
					class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-neutral-950 focus:outline-none"
				/>
			</div>
		</div>

		<div>
			<label for="pr-desc" class="block text-xs font-semibold text-neutral-700">Deskripsi Singkat *</label>
			<textarea
				id="pr-desc"
				rows="2"
				required
				bind:value={description}
				placeholder="Penjelasan syarat & ketentuan singkat promo..."
				class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-neutral-950 focus:outline-none"
			></textarea>
		</div>

		<div class="grid gap-4 sm:grid-cols-3">
			<div>
				<label for="pr-type" class="block text-xs font-semibold text-neutral-700">Jenis Diskon</label>
				<select
					id="pr-type"
					bind:value={discountType}
					class="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm focus:border-neutral-950 focus:outline-none"
				>
					<option value="percentage">Persentase (%)</option>
					<option value="fixed">Nominal Tetap (Rp)</option>
				</select>
			</div>

			<div>
				<label for="pr-val" class="block text-xs font-semibold text-neutral-700">
					{discountType === 'percentage' ? 'Persentase (%)' : 'Potongan (Rp)'} *
				</label>
				<input
					id="pr-val"
					type="number"
					min="1"
					max={discountType === 'percentage' ? 90 : 100000000}
					required
					bind:value={discountValue}
					class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm font-semibold focus:border-neutral-950 focus:outline-none"
				/>
			</div>

			<div>
				<label for="pr-max" class="block text-xs font-semibold text-neutral-700">
					Maks. Potongan (Rp)
				</label>
				<input
					id="pr-max"
					type="number"
					min="1000"
					step="5000"
					disabled={discountType === 'fixed'}
					bind:value={maxDiscountInput}
					placeholder={discountType === 'fixed' ? 'Tidak perlu' : 'Kosong = tanpa batas'}
					class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-neutral-950 focus:outline-none disabled:bg-neutral-100"
				/>
			</div>
		</div>

		<div class="grid gap-4 sm:grid-cols-2">
			<div>
				<label for="pr-min" class="block text-xs font-semibold text-neutral-700">
					Minimal Subtotal Sewa (Rp)
				</label>
				<input
					id="pr-min"
					type="number"
					min="0"
					step="10000"
					bind:value={minOrderAmount}
					class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-neutral-950 focus:outline-none"
				/>
			</div>

			<div>
				<label for="pr-limit" class="block text-xs font-semibold text-neutral-700">
					Batas Kuota Pemakaian
				</label>
				<input
					id="pr-limit"
					type="number"
					min="1"
					bind:value={usageLimitInput}
					placeholder="Kosong = tak terbatas"
					class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-neutral-950 focus:outline-none"
				/>
			</div>
		</div>

		<div class="grid gap-4 sm:grid-cols-2">
			<div>
				<label for="pr-start" class="block text-xs font-semibold text-neutral-700">
					Berlaku Mulai (Opsional)
				</label>
				<input
					id="pr-start"
					type="date"
					bind:value={startsAtInput}
					class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-neutral-950 focus:outline-none"
				/>
			</div>

			<div>
				<label for="pr-end" class="block text-xs font-semibold text-neutral-700">
					Berakhir Tanggal (Opsional)
				</label>
				<input
					id="pr-end"
					type="date"
					bind:value={expiresAtInput}
					class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-neutral-950 focus:outline-none"
				/>
			</div>
		</div>

		<div class="flex flex-wrap gap-6 rounded-2xl bg-surface px-4 py-3 text-xs">
			<label class="flex cursor-pointer items-center gap-2 text-neutral-800">
				<input type="checkbox" bind:checked={isActive} class="h-4 w-4 accent-neutral-950" />
				<span>Promo Aktif</span>
			</label>
			<label class="flex cursor-pointer items-center gap-2 text-neutral-800">
				<input type="checkbox" bind:checked={showOnLanding} class="h-4 w-4 accent-neutral-950" />
				<span>Tampilkan Voucher di Landing Page</span>
			</label>
		</div>

		<div class="flex justify-end gap-2.5 border-t border-neutral-100 pt-4">
			<button
				type="button"
				onclick={() => {
					modalOpen = false;
					editingPromo = null;
				}}
				class="rounded-full border border-neutral-200 px-5 py-2 text-xs font-semibold text-neutral-700"
			>
				Batal
			</button>
			<button
				type="submit"
				disabled={saving}
				class="rounded-full bg-neutral-950 px-6 py-2.5 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"
			>
				{saving ? 'Menyimpan...' : editingPromo ? 'Simpan Perubahan' : 'Buat Promo'}
			</button>
		</div>
	</form>
</Modal>

<Modal
	open={Boolean(deletingPromo)}
	title="Hapus Kode Promo?"
	maxWidthClass="max-w-md"
	onClose={() => (deletingPromo = null)}
>
	{#if deletingPromo}
		<p class="text-sm text-neutral-600">
			Anda yakin ingin menghapus kode promo
			<strong class="font-mono text-neutral-950">{deletingPromo.code}</strong>?
		</p>
		<div class="mt-6 flex justify-end gap-2">
			<button
				type="button"
				onclick={() => (deletingPromo = null)}
				class="rounded-full border border-neutral-200 px-4 py-2 text-xs font-semibold text-neutral-700"
			>
				Batal
			</button>
			<button
				type="button"
				disabled={busyId === deletingPromo.id}
				onclick={confirmDelete}
				class="rounded-full bg-red-600 px-5 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
			>
				{busyId === deletingPromo.id ? 'Menghapus...' : 'Ya, Hapus'}
			</button>
		</div>
	{/if}
</Modal>

<Toast message={toastMessage} variant={toastVariant} onDismiss={() => (toastMessage = null)} />
