<script lang="ts">
	import CatalogItemForm from '#lib/components/admin/CatalogItemForm.svelte';
	import Modal from '#lib/components/ui/Modal.svelte';
	import Toast from '#lib/components/ui/Toast.svelte';
	import type { BranchItemStock, RentalItem } from '#lib/server/db/schema';
	import type { ApiResponse } from '#lib/types/api';
	import { formatRupiah, type BranchStockSnapshot } from '#lib/utils/catalog';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let items = $state<RentalItem[]>([]);
	let branchStocksByItem = $state<Record<string, Record<string, BranchStockSnapshot>>>({});
	let selectedBranchId = $state<string>('');
	let search = $state('');
	let categoryFilter = $state<string>('all');
	let statusFilter = $state<'all' | 'published' | 'draft'>('all');

	let modalOpen = $state(false);
	let editingItem = $state<RentalItem | null>(null);
	let deletingItem = $state<RentalItem | null>(null);
	let busyId = $state<string | null>(null);

	// Modal Edit Harga & Stok Cabang
	let stockModalItem = $state<RentalItem | null>(null);
	let editBranchPrice = $state(0);
	let editBranchStockQty = $state(1);
	let editBranchAvailable = $state(true);
	let savingBranchStock = $state(false);

	let toastMessage = $state<string | null>(null);
	let toastVariant = $state<'success' | 'error' | 'info'>('success');

	$effect(() => {
		items = data.items;
		branchStocksByItem = data.branchStocksByItem;
		if (!selectedBranchId) {
			selectedBranchId = data.assignedBranch?.id ?? data.branches[0]?.id ?? '';
		}
	});

	let activeBranch = $derived(
		data.branches.find((b) => b.id === selectedBranchId) ??
			data.assignedBranch ??
			data.branches[0] ??
			null
	);

	function getBranchStock(item: RentalItem): BranchStockSnapshot {
		const bId = activeBranch?.id;
		const existing = bId ? branchStocksByItem[item.id]?.[bId] : undefined;
		if (existing) return existing;
		return {
			pricePerDay: item.pricePerDay ?? 0,
			stockQty: item.stockQty,
			isAvailable: item.isPublished
		};
	}

	function openBranchStockModal(item: RentalItem): void {
		const current = getBranchStock(item);
		stockModalItem = item;
		editBranchPrice = current.pricePerDay;
		editBranchStockQty = current.stockQty;
		editBranchAvailable = current.isAvailable;
	}

	async function handleSaveBranchStock(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		if (!stockModalItem || !activeBranch) return;
		savingBranchStock = true;
		try {
			const response = await fetch(`/api/catalog/${stockModalItem.id}/branch-stock`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					branchId: activeBranch.id,
					pricePerDay: Math.max(0, Math.trunc(Number(editBranchPrice) || 0)),
					stockQty: Math.max(0, Math.trunc(Number(editBranchStockQty) || 0)),
					isAvailable: editBranchAvailable
				})
			});
			const result = (await response.json()) as ApiResponse<BranchItemStock>;
			if (!response.ok || !result.success || !result.data) {
				showToast(result.message || 'Gagal memperbarui harga & stok cabang.', 'error');
				return;
			}
			const updated = result.data;
			const prevForItem = branchStocksByItem[stockModalItem.id] ?? {};
			branchStocksByItem = {
				...branchStocksByItem,
				[stockModalItem.id]: {
					...prevForItem,
					[activeBranch.id]: {
						pricePerDay: updated.pricePerDay,
						stockQty: updated.stockQty,
						isAvailable: updated.isAvailable
					}
				}
			};
			showToast(result.message || `Harga & stok ${activeBranch.name} berhasil disimpan.`);
			stockModalItem = null;
		} catch {
			showToast('Gangguan jaringan saat menyimpan harga cabang.', 'error');
		} finally {
			savingBranchStock = false;
		}
	}

	let categoryNameById = $derived(
		new Map<string, string>(data.categories.map((cat) => [cat.id, cat.name]))
	);

	let filteredItems = $derived.by(() => {
		const q = search.trim().toLowerCase();
		return items.filter((item) => {
			if (categoryFilter !== 'all' && item.categoryId !== categoryFilter) return false;
			if (statusFilter === 'published' && !item.isPublished) return false;
			if (statusFilter === 'draft' && item.isPublished) return false;
			if (!q) return true;
			return (
				item.name.toLowerCase().includes(q) ||
				item.slug.toLowerCase().includes(q) ||
				item.shortDescription.toLowerCase().includes(q)
			);
		});
	});

	function showToast(message: string, variant: 'success' | 'error' | 'info' = 'success'): void {
		toastVariant = variant;
		toastMessage = message;
	}

	function openCreate(): void {
		editingItem = null;
		modalOpen = true;
	}

	function openEdit(item: RentalItem): void {
		editingItem = item;
		modalOpen = true;
	}

	function handleSaved(saved: RentalItem, isNew: boolean): void {
		if (isNew) {
			items = [saved, ...items];
			showToast('Barang katalog baru berhasil ditambahkan.');
		} else {
			items = items.map((row) => (row.id === saved.id ? saved : row));
			showToast('Perubahan barang katalog berhasil disimpan.');
		}
		modalOpen = false;
		editingItem = null;
	}

	async function togglePublish(item: RentalItem): Promise<void> {
		busyId = item.id;
		try {
			const response = await fetch(`/api/catalog/${item.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ isPublished: !item.isPublished })
			});
			const result = (await response.json()) as ApiResponse<RentalItem>;
			if (!response.ok || !result.success || !result.data) {
				showToast(result.message || 'Gagal memperbarui status barang.', 'error');
				return;
			}
			const updated = result.data;
			items = items.map((row) => (row.id === updated.id ? updated : row));
			showToast(updated.isPublished ? 'Barang diterbitkan ke katalog.' : 'Barang dipindah ke draft.');
		} catch {
			showToast('Gangguan jaringan saat mengubah status barang.', 'error');
		} finally {
			busyId = null;
		}
	}

	async function confirmDelete(): Promise<void> {
		if (!deletingItem) return;
		const target = deletingItem;
		busyId = target.id;
		try {
			const response = await fetch(`/api/catalog/${target.id}`, {
				method: 'DELETE'
			});
			const result = (await response.json()) as ApiResponse<{ id: string }>;
			if (!response.ok || !result.success) {
				showToast(result.message || 'Gagal menghapus barang.', 'error');
				return;
			}
			items = items.filter((row) => row.id !== target.id);
			deletingItem = null;
			showToast('Barang katalog berhasil dihapus.');
		} catch {
			showToast('Gangguan jaringan saat menghapus barang.', 'error');
		} finally {
			busyId = null;
		}
	}
</script>

<svelte:head>
	<title>Katalog Barang Sewa — CMS</title>
</svelte:head>

<div class="space-y-6">
	<header class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
		<div>
			<p class="text-xs font-semibold tracking-widest text-neutral-400 uppercase">
				{data.isSuperAdmin
					? 'Inventaris & Tarif Multi-Cabang'
					: `Tarif & Stok ${data.assignedBranch?.name ?? 'Cabang'}`}
			</p>
			<h1 class="mt-1 text-3xl font-semibold tracking-tight text-neutral-950">
				{data.isSuperAdmin ? `Katalog & Harga Cabang (${items.length})` : `Harga & Stok ${data.assignedBranch?.name ?? ''}`}
			</h1>
			<p class="mt-1 text-sm text-neutral-500">
				{#if data.isSuperAdmin}
					Atur katalog master serta harga &amp; ketersediaan stok berbeda untuk setiap cabang (Bogor &amp; Depok).
				{:else}
					Sesuaikan harga sewa harian, jumlah stok, dan ketersediaan barang khusus {data.assignedBranch?.name ?? 'cabang Anda'}.
				{/if}
			</p>
		</div>

		{#if data.isSuperAdmin}
			<button
				type="button"
				onclick={openCreate}
				class="inline-flex items-center justify-center rounded-full bg-neutral-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
			>
				+ Tambah Barang Master
			</button>
		{/if}
	</header>

	<!-- Pemilih Cabang untuk Harga & Stok -->
	{#if data.branches.length > 0}
		<div
			class="flex flex-col justify-between gap-3 rounded-3xl border border-emerald-200/80 bg-emerald-50/50 p-4 sm:flex-row sm:items-center"
		>
			<div>
				<p class="text-[11px] font-bold tracking-wider text-emerald-800 uppercase">
					📍 Menampilkan Harga &amp; Stok: {activeBranch?.name ?? '-'}
				</p>
				<p class="mt-0.5 text-xs text-neutral-600">
					Klik tombol <strong>Harga &amp; Stok</strong> pada tiap barang untuk mengubah tarif khusus cabang ini.
				</p>
			</div>

			{#if data.isSuperAdmin}
				<div class="flex flex-wrap gap-1.5">
					{#each data.branches as br (br.id)}
						<button
							type="button"
							onclick={() => (selectedBranchId = br.id)}
							class="rounded-full px-4 py-1.5 text-xs font-semibold transition {activeBranch?.id ===
							br.id
								? 'bg-neutral-950 text-white'
								: 'border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-950'}"
						>
							{br.name} ({br.code})
						</button>
					{/each}
				</div>
			{:else if activeBranch}
				<span class="rounded-full bg-emerald-700 px-3.5 py-1.5 text-xs font-semibold text-white">
					{activeBranch.name} ({activeBranch.code})
				</span>
			{/if}
		</div>
	{/if}

	<div
		class="flex flex-col gap-3 rounded-3xl border border-neutral-200/80 bg-white p-4 lg:flex-row lg:items-center lg:justify-between"
	>
		<div class="flex flex-1 flex-col gap-2.5 sm:flex-row">
			<input
				type="search"
				bind:value={search}
				placeholder="Cari nama barang atau slug..."
				class="w-full rounded-full border border-neutral-200 bg-surface px-4 py-2 text-sm focus:border-neutral-950 focus:bg-white focus:outline-none sm:max-w-xs"
			/>

			<select
				bind:value={categoryFilter}
				class="rounded-full border border-neutral-200 bg-surface px-4 py-2 text-xs font-medium text-neutral-700 focus:border-neutral-950 focus:bg-white focus:outline-none"
			>
				<option value="all">Semua Kategori ({data.categories.length})</option>
				{#each data.categories as cat (cat.id)}
					<option value={cat.id}>{cat.name}</option>
				{/each}
			</select>
		</div>

		<div class="flex items-center gap-1.5">
			{#each [{ id: 'all', label: 'Semua' }, { id: 'published', label: 'Terbit' }, { id: 'draft', label: 'Draft' }] as tab (tab.id)}
				<button
					type="button"
					onclick={() => (statusFilter = tab.id as 'all' | 'published' | 'draft')}
					class="rounded-full px-3.5 py-1.5 text-xs font-medium transition {statusFilter === tab.id
						? 'bg-neutral-950 text-white'
						: 'bg-surface text-neutral-600 hover:text-neutral-950'}"
				>
					{tab.label}
				</button>
			{/each}
		</div>
	</div>

	<p class="text-xs text-neutral-500">
		Menampilkan <strong class="text-neutral-950">{filteredItems.length}</strong> barang
	</p>

	{#if filteredItems.length > 0}
		<div class="overflow-hidden rounded-3xl border border-neutral-200/80 bg-white">
			<div class="overflow-x-auto">
				<table class="w-full text-left text-sm">
					<thead class="border-b border-neutral-100 bg-neutral-50/70 text-xs text-neutral-500">
						<tr>
							<th class="px-5 py-3.5 font-medium">Barang</th>
							<th class="px-4 py-3.5 font-medium">Kategori</th>
							<th class="px-4 py-3.5 font-medium">Tarif &amp; Stok ({activeBranch?.code ?? 'Cabang'})</th>
							<th class="px-4 py-3.5 font-medium">Status</th>
							<th class="px-5 py-3.5 text-right font-medium">Aksi</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-neutral-100">
						{#each filteredItems as item (item.id)}
							{@const bStock = getBranchStock(item)}
							<tr class="transition hover:bg-neutral-50/60">
								<td class="px-5 py-3.5">
									<div class="flex items-center gap-3">
										{#if item.imageUrl}
											<img
												src={item.imageUrl}
												alt={item.name}
												class="h-10 w-12 shrink-0 rounded-xl object-cover"
											/>
										{:else}
											<div
												class="flex h-10 w-12 shrink-0 items-center justify-center rounded-xl bg-surface text-[10px] font-semibold text-neutral-400"
											>
												UNIT
											</div>
										{/if}
										<div class="min-w-0">
											<div class="flex items-center gap-2">
												<p class="truncate font-medium text-neutral-950">{item.name}</p>
												{#if item.isFeatured}
													<span
														class="rounded-full bg-neutral-950 px-2 py-0.5 text-[10px] font-medium text-white"
													>
														Populer
													</span>
												{/if}
											</div>
											<a
												href={`/katalog/${item.slug}`}
												target="_blank"
												rel="noopener noreferrer"
												class="truncate font-mono text-[11px] text-neutral-400 hover:text-neutral-800"
											>
												/katalog/{item.slug} ↗
											</a>
										</div>
									</div>
								</td>
								<td class="px-4 py-3.5 text-xs text-neutral-600">
									{categoryNameById.get(item.categoryId) ?? '-'}
								</td>
								<td class="px-4 py-3.5 text-xs">
									<p class="font-bold text-neutral-950">
										{formatRupiah(bStock.pricePerDay)}
										<span class="font-normal text-neutral-400">/ {item.unitLabel}</span>
									</p>
									<p class="mt-0.5 text-[11px] {bStock.isAvailable && bStock.stockQty > 0 ? 'text-emerald-700' : 'text-red-600'}">
										{bStock.isAvailable && bStock.stockQty > 0
											? `Stok: ${bStock.stockQty} unit`
											: 'Tidak tersedia / Habis'}
									</p>
								</td>
								<td class="px-4 py-3.5">
									{#if data.isSuperAdmin}
										<button
											type="button"
											disabled={busyId === item.id}
											onclick={() => togglePublish(item)}
											class="rounded-full px-3 py-1 text-xs font-medium transition {item.isPublished
												? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
												: 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}"
										>
											{item.isPublished ? 'Terbit' : 'Draft'}
										</button>
									{:else}
										<span
											class="rounded-full px-3 py-1 text-xs font-medium {bStock.isAvailable && bStock.stockQty > 0
												? 'bg-emerald-50 text-emerald-700'
												: 'bg-red-50 text-red-700'}"
										>
											{bStock.isAvailable && bStock.stockQty > 0 ? 'Tersedia' : 'Nonaktif'}
										</span>
									{/if}
								</td>
								<td class="px-5 py-3.5 text-right">
									<div class="inline-flex items-center gap-1.5">
										<button
											type="button"
											onclick={() => openBranchStockModal(item)}
											class="rounded-full bg-neutral-950 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-neutral-800"
										>
											Harga &amp; Stok
										</button>
										{#if data.isSuperAdmin}
											<button
												type="button"
												onclick={() => openEdit(item)}
												class="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:border-neutral-950 hover:text-neutral-950"
											>
												Master
											</button>
											<button
												type="button"
												onclick={() => (deletingItem = item)}
												class="rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
											>
												Hapus
											</button>
										{/if}
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
			<p class="text-sm text-neutral-500">Tidak ada barang katalog yang sesuai filter.</p>
		</div>
	{/if}
</div>

<Modal
	open={modalOpen}
	title={editingItem ? 'Edit Barang Katalog' : 'Tambah Barang Katalog'}
	subtitle="Perubahan harga, foto, spesifikasi & kelengkapan langsung tampil di website publik."
	onClose={() => {
		modalOpen = false;
		editingItem = null;
	}}
>
	<CatalogItemForm
		item={editingItem}
		categories={data.categories}
		onSaved={handleSaved}
		onCancel={() => {
			modalOpen = false;
			editingItem = null;
		}}
	/>
</Modal>

<Modal
	open={Boolean(deletingItem)}
	title="Hapus Barang Katalog?"
	maxWidthClass="max-w-md"
	onClose={() => (deletingItem = null)}
>
	{#if deletingItem}
		<p class="text-sm leading-relaxed text-neutral-600">
			Anda yakin ingin menghapus <strong class="text-neutral-950">{deletingItem.name}</strong> dari
			katalog?
		</p>
		<div class="mt-6 flex justify-end gap-2.5">
			<button
				type="button"
				onclick={() => (deletingItem = null)}
				class="rounded-full border border-neutral-200 px-4 py-2 text-xs font-medium text-neutral-700"
			>
				Batal
			</button>
			<button
				type="button"
				disabled={busyId === deletingItem.id}
				onclick={confirmDelete}
				class="rounded-full bg-red-600 px-5 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
			>
				{busyId === deletingItem.id ? 'Menghapus...' : 'Ya, Hapus'}
			</button>
		</div>
	{/if}
</Modal>

<Modal
	open={Boolean(stockModalItem)}
	title={stockModalItem ? `Atur Harga & Stok — ${activeBranch?.name ?? ''}` : 'Atur Harga & Stok Cabang'}
	subtitle={stockModalItem ? `Barang: ${stockModalItem.name} (per ${stockModalItem.unitLabel})` : undefined}
	maxWidthClass="max-w-md"
	onClose={() => (stockModalItem = null)}
>
	{#if stockModalItem && activeBranch}
		<form onsubmit={handleSaveBranchStock} class="space-y-4">
			<div>
				<label for="bs-price" class="block text-xs font-semibold text-neutral-700">
					Tarif Sewa per {stockModalItem.unitLabel} di {activeBranch.name} (Rp) *
				</label>
				<input
					id="bs-price"
					type="number"
					min="0"
					step="5000"
					required
					bind:value={editBranchPrice}
					class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm font-bold text-neutral-950 focus:border-neutral-950 focus:outline-none"
				/>
				<p class="mt-1 text-[11px] text-neutral-500">
					Preview: <strong>{formatRupiah(Number(editBranchPrice) || 0)}</strong> / {stockModalItem.unitLabel}
				</p>
			</div>

			<div>
				<label for="bs-stock" class="block text-xs font-semibold text-neutral-700">
					Jumlah Stok Tersedia di {activeBranch.name} *
				</label>
				<input
					id="bs-stock"
					type="number"
					min="0"
					max="10000"
					required
					bind:value={editBranchStockQty}
					class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm font-semibold text-neutral-950 focus:border-neutral-950 focus:outline-none"
				/>
			</div>

			<label class="flex cursor-pointer items-center gap-2.5 rounded-2xl bg-surface px-4 py-3 text-xs text-neutral-800">
				<input type="checkbox" bind:checked={editBranchAvailable} class="h-4 w-4 accent-neutral-950" />
				<span>Barang tersedia untuk disewa di {activeBranch.name}</span>
			</label>

			<div class="flex justify-end gap-2 border-t border-neutral-100 pt-4">
				<button
					type="button"
					onclick={() => (stockModalItem = null)}
					class="rounded-full border border-neutral-200 px-4 py-2 text-xs font-semibold text-neutral-700"
				>
					Batal
				</button>
				<button
					type="submit"
					disabled={savingBranchStock}
					class="rounded-full bg-neutral-950 px-5 py-2 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"
				>
					{savingBranchStock ? 'Menyimpan...' : 'Simpan Harga Cabang'}
				</button>
			</div>
		</form>
	{/if}
</Modal>

<Toast message={toastMessage} variant={toastVariant} onDismiss={() => (toastMessage = null)} />
