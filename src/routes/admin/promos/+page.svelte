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
	let branchIdInput = $state<string>('');
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

	let branchNameById = $derived(new Map<string, string>(data.branches.map((b) => [b.id, b.name])));

	function canManagePromo(promo: PromoCode): boolean {
		if (data.isSuperAdmin) return true;
		return Boolean(data.user.branchId) && promo.branchId === data.user.branchId;
	}

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
		branchIdInput = data.isSuperAdmin ? '' : (data.user.branchId ?? '');
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
		branchIdInput = promo.branchId ?? '';
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
			branchId: data.isSuperAdmin ? branchIdInput || null : (data.user.branchId ?? null),
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
				updated.isActive ? `Promo ${updated.code} diaktifkan.` : `Promo ${updated.code} dinonaktifkan.`
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
			<span
				class="inline-flex rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-xs font-bold tracking-wide text-neutral-300 uppercase"
			>
				Pemasaran
			</span>
			<h1 class="mt-3 text-2xl font-bold tracking-tight text-white">Promo &amp; Diskon</h1>
			<p class="mt-1 text-sm text-neutral-400">
				Buat dan kelola voucher diskon persentase (%) atau potongan rupiah (Rp) untuk checkout &amp;
				landing page.
			</p>
		</div>

		<button
			type="button"
			onclick={openCreate}
			class="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-neutral-200"
		>
			+ Buat Kode Promo
		</button>
	</header>

	<div class="grid gap-4 sm:grid-cols-3">
		<div class="rounded-[2rem] border border-white/15 bg-[#0c0c0f] p-5">
			<p class="text-sm font-medium text-neutral-400">Total Kode Promo</p>
			<p class="mt-2 text-2xl font-bold text-white">{stats.total}</p>
		</div>
		<div class="rounded-[2rem] border border-white/15 bg-[#0c0c0f] p-5">
			<p class="text-sm font-medium text-neutral-400">Sedang Aktif</p>
			<p class="mt-2 text-2xl font-bold text-emerald-400">{stats.active}</p>
		</div>
		<div class="rounded-[2rem] border border-white/15 bg-[#0c0c0f] p-5">
			<p class="text-sm font-medium text-neutral-400">Total Pemakaian</p>
			<p class="mt-2 text-2xl font-bold text-rose-400">{stats.totalUsed}×</p>
		</div>
	</div>

	<div class="rounded-[2rem] border border-white/15 bg-[#0c0c0f] p-4">
		<input
			type="search"
			bind:value={search}
			placeholder="Cari kode atau judul promo..."
			class="w-full rounded-full border border-white/20 bg-black px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-white focus:outline-none sm:max-w-xs"
		/>
	</div>

	{#if filteredPromos.length > 0}
		<div class="overflow-hidden rounded-[2rem] border border-white/15 bg-[#0c0c0f]">
			<div class="overflow-x-auto">
				<table class="w-full text-left text-sm">
					<thead class="border-b border-white/10 bg-black/60 text-xs text-neutral-400">
						<tr>
							<th class="px-5 py-3.5 font-semibold">Kode &amp; Judul</th>
							<th class="px-4 py-3.5 font-semibold">Potongan &amp; Syarat</th>
							<th class="px-4 py-3.5 font-semibold">Kuota &amp; Masa Berlaku</th>
							<th class="px-4 py-3.5 font-semibold">Status</th>
							<th class="px-5 py-3.5 text-right font-semibold">Aksi</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-white/10">
						{#each filteredPromos as promo (promo.id)}
							{@const editable = canManagePromo(promo)}
							<tr class="transition hover:bg-white/[0.03]">
								<td class="px-5 py-4">
									<div class="flex flex-wrap items-center gap-1.5">
										<span
											class="rounded-full bg-white px-3 py-0.5 font-mono text-xs font-semibold text-black"
										>
											{promo.code}
										</span>
										<span
											class="rounded-full px-2.5 py-0.5 text-xs font-bold {promo.branchId
												? 'border border-emerald-400/30 bg-emerald-400/15 text-emerald-300'
												: 'border border-white/15 bg-white/10 text-neutral-300'}"
										>
											{promo.branchId
												? `📍 ${branchNameById.get(promo.branchId) ?? 'Cabang'}`
												: 'Semua Cabang'}
										</span>
										{#if promo.showOnLanding}
											<span
												class="rounded-full border border-white/15 bg-black px-2 py-0.5 text-xs font-medium text-neutral-400"
											>
												Landing
											</span>
										{/if}
									</div>
									<p class="mt-1.5 font-bold text-white">{promo.title}</p>
								</td>
								<td class="px-4 py-4 text-xs text-neutral-300">
									<p class="font-semibold text-white">{formatPromoBadge(promo)}</p>
									{#if promo.maxDiscountAmount}
										<p class="text-neutral-400">Maks. {formatRupiah(promo.maxDiscountAmount)}</p>
									{/if}
									<p class="text-neutral-500">
										Min. sewa {promo.minOrderAmount > 0 ? formatRupiah(promo.minOrderAmount) : 'Rp 0'}
									</p>
								</td>
								<td class="px-4 py-4 text-xs text-neutral-300">
									<p class="font-bold text-white">
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
										disabled={!editable || busyId === promo.id}
										onclick={() => toggleActive(promo)}
										class="rounded-full px-3 py-1 text-xs font-bold transition disabled:cursor-default disabled:opacity-60 {promo.isActive
											? 'border border-emerald-400/30 bg-emerald-400/15 text-emerald-300 hover:bg-emerald-400/25'
											: 'border border-white/15 bg-white/10 text-neutral-400 hover:bg-white/20'}"
									>
										{promo.isActive ? 'Aktif' : 'Nonaktif'}
									</button>
								</td>
								<td class="px-5 py-4 text-right">
									{#if editable}
										<div class="inline-flex items-center gap-2">
											<button
												type="button"
												onclick={() => openEdit(promo)}
												class="rounded-full border border-white/20 bg-black px-3.5 py-1.5 text-xs font-bold text-neutral-200 hover:border-white hover:text-white"
											>
												Edit
											</button>
											<button
												type="button"
												onclick={() => (deletingPromo = promo)}
												class="rounded-full border border-red-400/30 bg-red-500/10 px-3.5 py-1.5 text-xs font-bold text-red-300 hover:bg-red-500/20"
											>
												Hapus
											</button>
										</div>
									{:else}
										<span class="text-xs font-semibold text-neutral-500">Promo Pusat</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{:else}
		<div class="rounded-[2.25rem] border border-white/15 bg-[#0c0c0f] p-14 text-center">
			<p class="text-sm text-neutral-400">Belum ada kode promo diskon.</p>
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
			<div class="rounded-2xl border border-red-400/30 bg-red-500/15 px-4 py-3 text-xs text-red-200">
				{formError}
			</div>
		{/if}

		<div>
			{#if data.isSuperAdmin}
				<label for="pr-branch" class="block text-sm font-semibold text-neutral-300">
					Berlaku Untuk Cabang
				</label>
				<select
					id="pr-branch"
					bind:value={branchIdInput}
					class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2.5 text-sm text-white [color-scheme:dark] focus:border-white focus:outline-none"
				>
					<option value="" class="bg-neutral-950">Semua Cabang (Promo Global)</option>
					{#each data.branches as br (br.id)}
						<option value={br.id} class="bg-neutral-950">{br.name} ({br.code})</option>
					{/each}
				</select>
			{:else}
				<p class="block text-xs font-semibold text-neutral-300">Berlaku Untuk Cabang</p>
				<p
					class="mt-1.5 rounded-2xl border border-emerald-400/30 bg-emerald-400/15 px-4 py-2.5 text-xs font-bold text-emerald-300"
				>
					📍 Khusus {data.assignedBranch?.name ?? 'Cabang Anda'}
				</p>
			{/if}
		</div>

		<div class="grid gap-4 sm:grid-cols-2">
			<div>
				<label for="pr-code" class="block text-sm font-semibold text-neutral-300">Kode Promo *</label>
				<input
					id="pr-code"
					type="text"
					required
					bind:value={code}
					placeholder="SEWABARU10"
					class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2.5 font-mono text-sm font-bold text-white uppercase focus:border-white focus:outline-none"
				/>
			</div>

			<div>
				<label for="pr-title" class="block text-sm font-semibold text-neutral-300">Judul Promo *</label>
				<input
					id="pr-title"
					type="text"
					required
					bind:value={title}
					placeholder="Diskon 10% Semua Barang"
					class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2.5 text-sm text-white focus:border-white focus:outline-none"
				/>
			</div>
		</div>

		<div>
			<label for="pr-desc" class="block text-sm font-semibold text-neutral-300">
				Deskripsi Singkat *
			</label>
			<textarea
				id="pr-desc"
				rows="2"
				required
				bind:value={description}
				placeholder="Penjelasan syarat & ketentuan singkat promo..."
				class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-white focus:outline-none"
			></textarea>
		</div>

		<div class="grid gap-4 sm:grid-cols-3">
			<div>
				<label for="pr-type" class="block text-sm font-semibold text-neutral-300">Jenis Diskon</label>
				<select
					id="pr-type"
					bind:value={discountType}
					class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2.5 text-sm text-white [color-scheme:dark] focus:border-white focus:outline-none"
				>
					<option value="percentage" class="bg-neutral-950">Persentase (%)</option>
					<option value="fixed" class="bg-neutral-950">Nominal Tetap (Rp)</option>
				</select>
			</div>

			<div>
				<label for="pr-val" class="block text-sm font-semibold text-neutral-300">
					{discountType === 'percentage' ? 'Persentase (%)' : 'Potongan (Rp)'} *
				</label>
				<input
					id="pr-val"
					type="number"
					min="1"
					max={discountType === 'percentage' ? 90 : 100000000}
					required
					bind:value={discountValue}
					class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2.5 text-sm font-bold text-white focus:border-white focus:outline-none"
				/>
			</div>

			<div>
				<label for="pr-max" class="block text-sm font-semibold text-neutral-300">
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
					class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-white focus:outline-none disabled:opacity-40"
				/>
			</div>
		</div>

		<div class="grid gap-4 sm:grid-cols-2">
			<div>
				<label for="pr-min" class="block text-sm font-semibold text-neutral-300">
					Minimal Subtotal Sewa (Rp)
				</label>
				<input
					id="pr-min"
					type="number"
					min="0"
					step="10000"
					bind:value={minOrderAmount}
					class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2.5 text-sm text-white focus:border-white focus:outline-none"
				/>
			</div>

			<div>
				<label for="pr-limit" class="block text-sm font-semibold text-neutral-300">
					Batas Kuota Pemakaian
				</label>
				<input
					id="pr-limit"
					type="number"
					min="1"
					bind:value={usageLimitInput}
					placeholder="Kosong = tak terbatas"
					class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-white focus:outline-none"
				/>
			</div>
		</div>

		<div class="grid gap-4 sm:grid-cols-2">
			<div>
				<label for="pr-start" class="block text-sm font-semibold text-neutral-300">
					Berlaku Mulai (Opsional)
				</label>
				<input
					id="pr-start"
					type="date"
					bind:value={startsAtInput}
					class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2.5 text-sm text-white [color-scheme:dark] focus:border-white focus:outline-none"
				/>
			</div>

			<div>
				<label for="pr-end" class="block text-sm font-semibold text-neutral-300">
					Berakhir Tanggal (Opsional)
				</label>
				<input
					id="pr-end"
					type="date"
					bind:value={expiresAtInput}
					class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2.5 text-sm text-white [color-scheme:dark] focus:border-white focus:outline-none"
				/>
			</div>
		</div>

		<div class="flex flex-wrap gap-6 rounded-2xl border border-white/10 bg-black px-4 py-3 text-xs">
			<label class="flex cursor-pointer items-center gap-2 text-neutral-200">
				<input type="checkbox" bind:checked={isActive} class="h-4 w-4 accent-white" />
				<span>Promo Aktif</span>
			</label>
			<label class="flex cursor-pointer items-center gap-2 text-neutral-200">
				<input type="checkbox" bind:checked={showOnLanding} class="h-4 w-4 accent-white" />
				<span>Tampilkan Voucher di Landing Page</span>
			</label>
		</div>

		<div class="flex justify-end gap-2.5 border-t border-white/10 pt-4">
			<button
				type="button"
				onclick={() => {
					modalOpen = false;
					editingPromo = null;
				}}
				class="rounded-full border border-white/20 bg-black px-5 py-2 text-xs font-bold text-neutral-300"
			>
				Batal
			</button>
			<button
				type="submit"
				disabled={saving}
				class="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black hover:bg-neutral-200 disabled:opacity-60"
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
		<p class="text-sm text-neutral-300">
			Anda yakin ingin menghapus kode promo
			<strong class="font-mono text-white">{deletingPromo.code}</strong>?
		</p>
		<div class="mt-6 flex justify-end gap-2">
			<button
				type="button"
				onclick={() => (deletingPromo = null)}
				class="rounded-full border border-white/20 bg-black px-4 py-2 text-xs font-bold text-neutral-300"
			>
				Batal
			</button>
			<button
				type="button"
				disabled={busyId === deletingPromo.id}
				onclick={confirmDelete}
				class="rounded-full bg-red-500 px-5 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
			>
				{busyId === deletingPromo.id ? 'Menghapus...' : 'Ya, Hapus'}
			</button>
		</div>
	{/if}
</Modal>

<Toast message={toastMessage} variant={toastVariant} onDismiss={() => (toastMessage = null)} />
