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
			showToast(
				updated.isPublished ? 'Barang diterbitkan ke katalog.' : 'Barang dipindah ke draft.'
			);
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
			<span
				class="inline-flex rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-[11px] font-bold tracking-widest text-neutral-300 uppercase"
			>
				{data.isSuperAdmin
					? 'Inventaris & Tarif Multi-Cabang'
					: `Tarif & Stok ${data.assignedBranch?.name ?? 'Cabang'}`}
			</span>
			<h1 class="mt-3 text-3xl font-extrabold tracking-tight text-white">
				{data.isSuperAdmin
					? `Katalog & Harga Cabang (${items.length})`
					: `Harga & Stok ${data.assignedBranch?.name ?? ''}`}
			</h1>
			<p class="mt-1 text-sm text-neutral-400">
				{#if data.isSuperAdmin}
					Atur katalog master serta harga &amp; ketersediaan stok berbeda untuk setiap cabang
					(Bogor &amp; Depok).
				{:else}
					Sesuaikan harga sewa harian, jumlah stok, dan ketersediaan barang khusus
					{data.assignedBranch?.name ?? 'cabang Anda'}.
				{/if}
			</p>
		</div>

		{#if data.isSuperAdmin}
			<button
				type="button"
				onclick={openCreate}
				class="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-extrabold text-black transition hover:bg-neutral-200"
			>
				+ Tambah Barang Master
			</button>
		{/if}
	</header>

	<!-- Pemilih Cabang untuk Harga & Stok -->
	{#if data.branches.length > 0}
		<div
			class="flex flex-col justify-between gap-3 rounded-[2rem] border border-emerald-400/30 bg-emerald-400/10 p-5 sm:flex-row sm:items-center"
		>
			<div>
				<p class="text-[11px] font-bold tracking-wider text-emerald-300 uppercase">
					📍 Menampilkan Harga &amp; Stok: {activeBranch?.name ?? '-'}
				</p>
				<p class="mt-0.5 text-xs text-neutral-300">
					Klik tombol <strong class="text-white">Harga &amp; Stok</strong> pada tiap barang untuk
					mengubah tarif khusus cabang ini.
				</p>
			</div>

			{#if data.isSuperAdmin}
				<div class="flex flex-wrap gap-1.5">
					{#each data.branches as br (br.id)}
						<button
							type="button"
							onclick={() => (selectedBranchId = br.id)}
							class="rounded-full px-4 py-1.5 text-xs font-bold transition {activeBranch?.id ===
							br.id
								? 'bg-white text-black'
								: 'border border-white/20 bg-black/60 text-neutral-200 hover:border-white hover:text-white'}"
						>
							{br.name} ({br.code})
						</button>
					{/each}
				</div>
			{:else if activeBranch}
				<span class="rounded-full bg-emerald-400 px-4 py-1.5 text-xs font-extrabold text-black">
					{activeBranch.name} ({activeBranch.code})
				</span>
			{/if}
		</div>
	{/if}

	<div
		class="flex flex-col gap-3 rounded-[2rem] border border-white/15 bg-[#0c0c0f] p-4 lg:flex-row lg:items-center lg:justify-between"
	>
		<div class="flex flex-1 flex-col gap-2.5 sm:flex-row">
			<input
				type="search"
				bind:value={search}
				placeholder="Cari nama barang atau slug..."
				class="w-full rounded-full border border-white/20 bg-black px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-white focus:outline-none sm:max-w-xs"
			/>

			<select
				bind:value={categoryFilter}
				class="rounded-full border border-white/20 bg-black px-4 py-2.5 text-xs font-bold text-white [color-scheme:dark] focus:border-white focus:outline-none"
			>
				<option value="all" class="bg-neutral-950">Semua Kategori ({data.categories.length})</option>
				{#each data.categories as cat (cat.id)}
					<option value={cat.id} class="bg-neutral-950">{cat.name}</option>
				{/each}
			</select>
		</div>

		<div class="flex items-center gap-1.5">
			{#each [
				{ id: 'all', label: 'Semua' },
				{ id: 'published', label: 'Terbit' },
				{ id: 'draft', label: 'Draft' }
			] as tab (tab.id)}
				<button
					type="button"
					onclick={() => (statusFilter = tab.id as 'all' | 'published' | 'draft')}
					class="rounded-full px-4 py-1.5 text-xs font-bold transition {statusFilter === tab.id
						? 'bg-white text-black'
						: 'border border-white/15 bg-black text-neutral-300 hover:border-white/40 hover:text-white'}"
				>
					{tab.label}
				</button>
			{/each}
		</div>
	</div>

	<p class="text-xs text-neutral-400">
		Menampilkan <strong class="text-white">{filteredItems.length}</strong> barang
	</p>

	{#if filteredItems.length > 0}
		<div class="overflow-hidden rounded-[2rem] border border-white/15 bg-[#0c0c0f]">
			<div class="overflow-x-auto">
				<table class="w-full text-left text-sm">
					<thead class="border-b border-white/10 bg-black/60 text-xs text-neutral-400">
						<tr>
							<th class="px-5 py-3.5 font-semibold">Barang</th>
							<th class="px-4 py-3.5 font-semibold">Kategori</th>
							<th class="px-4 py-3.5 font-semibold">
								Tarif &amp; Stok ({activeBranch?.code ?? 'Cabang'})
							</th>
							<th class="px-4 py-3.5 font-semibold">Status</th>
							<th class="px-5 py-3.5 text-right font-semibold">Aksi</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-white/10">
						{#each filteredItems as item (item.id)}
							{@const bStock = getBranchStock(item)}
							<tr class="transition hover:bg-white/[0.03]">
								<td class="px-5 py-3.5">
									<div class="flex items-center gap-3">
										{#if item.imageUrl}
											<img
												src={item.imageUrl}
												alt={item.name}
												class="h-10 w-12 shrink-0 rounded-xl border border-white/10 object-cover"
											/>
										{:else}
											<div
												class="flex h-10 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black text-[10px] font-bold text-neutral-500"
											>
												UNIT
											</div>
										{/if}
										<div class="min-w-0">
											<div class="flex items-center gap-2">
												<p class="truncate font-bold text-white">{item.name}</p>
												{#if item.isFeatured}
													<span
														class="rounded-full bg-white px-2 py-0.5 text-[10px] font-extrabold text-black"
													>
														Populer
													</span>
												{/if}
											</div>
											<a
												href={`/katalog/${item.slug}`}
												target="_blank"
												rel="noopener noreferrer"
												class="truncate font-mono text-[11px] text-neutral-400 hover:text-white"
											>
												/katalog/{item.slug} ↗
											</a>
										</div>
									</div>
								</td>
								<td class="px-4 py-3.5 text-xs text-neutral-300">
									{categoryNameById.get(item.categoryId) ?? '-'}
								</td>
								<td class="px-4 py-3.5 text-xs">
									<p class="font-extrabold text-white">
										{formatRupiah(bStock.pricePerDay)}
										<span class="font-normal text-neutral-400">/ {item.unitLabel}</span>
									</p>
									<p
										class="mt-0.5 text-[11px] font-semibold {bStock.isAvailable && bStock.stockQty > 0
											? 'text-emerald-400'
											: 'text-red-400'}"
									>
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
											class="rounded-full px-3 py-1 text-xs font-bold transition {item.isPublished
												? 'border border-emerald-400/30 bg-emerald-400/15 text-emerald-300 hover:bg-emerald-400/25'
												: 'border border-white/15 bg-white/10 text-neutral-300 hover:bg-white/20'}"
										>
											{item.isPublished ? 'Terbit' : 'Draft'}
										</button>
									{:else}
										<span
											class="rounded-full px-3 py-1 text-xs font-bold {bStock.isAvailable &&
											bStock.stockQty > 0
												? 'border border-emerald-400/30 bg-emerald-400/15 text-emerald-300'
												: 'border border-red-400/30 bg-red-500/15 text-red-300'}"
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
											class="rounded-full bg-white px-3.5 py-1.5 text-xs font-extrabold text-black transition hover:bg-neutral-200"
										>
											Harga &amp; Stok
										</button>
										{#if data.isSuperAdmin}
											<button
												type="button"
												onclick={() => openEdit(item)}
												class="rounded-full border border-white/20 bg-black px-3 py-1.5 text-xs font-bold text-neutral-200 transition hover:border-white hover:text-white"
											>
												Master
											</button>
											<button
												type="button"
												onclick={() => (deletingItem = item)}
												class="rounded-full border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-300 transition hover:bg-red-500/20"
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
		<div class="rounded-[2.25rem] border border-white/15 bg-[#0c0c0f] p-14 text-center">
			<p class="text-sm text-neutral-400">Tidak ada barang katalog yang sesuai filter.</p>
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
		<p class="text-sm leading-relaxed text-neutral-300">
			Anda yakin ingin menghapus <strong class="text-white">{deletingItem.name}</strong> dari
			katalog?
		</p>
		<div class="mt-6 flex justify-end gap-2.5">
			<button
				type="button"
				onclick={() => (deletingItem = null)}
				class="rounded-full border border-white/20 bg-black px-4 py-2 text-xs font-bold text-neutral-300"
			>
				Batal
			</button>
			<button
				type="button"
				disabled={busyId === deletingItem.id}
				onclick={confirmDelete}
				class="rounded-full bg-red-500 px-5 py-2 text-xs font-extrabold text-white hover:bg-red-600 disabled:opacity-60"
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
				<label for="bs-price" class="block text-xs font-semibold text-neutral-300">
					Tarif Sewa per {stockModalItem.unitLabel} di {activeBranch.name} (Rp) *
				</label>
				<input
					id="bs-price"
					type="number"
					min="0"
					step="5000"
					required
					bind:value={editBranchPrice}
					class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2.5 text-sm font-extrabold text-white focus:border-white focus:outline-none"
				/>
				<p class="mt-1 text-[11px] text-neutral-400">
					Preview:
					<strong class="text-emerald-300">{formatRupiah(Number(editBranchPrice) || 0)}</strong> /
					{stockModalItem.unitLabel}
				</p>
			</div>

			<div>
				<label for="bs-stock" class="block text-xs font-semibold text-neutral-300">
					Jumlah Stok Tersedia di {activeBranch.name} *
				</label>
				<input
					id="bs-stock"
					type="number"
					min="0"
					max="10000"
					required
					bind:value={editBranchStockQty}
					class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2.5 text-sm font-bold text-white focus:border-white focus:outline-none"
				/>
			</div>

			<label
				class="flex cursor-pointer items-center gap-2.5 rounded-2xl border border-white/10 bg-black px-4 py-3 text-xs text-neutral-200"
			>
				<input type="checkbox" bind:checked={editBranchAvailable} class="h-4 w-4 accent-white" />
				<span>Barang tersedia untuk disewa di {activeBranch.name}</span>
			</label>

			<div class="flex justify-end gap-2 border-t border-white/10 pt-4">
				<button
					type="button"
					onclick={() => (stockModalItem = null)}
					class="rounded-full border border-white/20 bg-black px-4 py-2 text-xs font-bold text-neutral-300"
				>
					Batal
				</button>
				<button
					type="submit"
					disabled={savingBranchStock}
					class="rounded-full bg-white px-5 py-2 text-xs font-extrabold text-black hover:bg-neutral-200 disabled:opacity-60"
				>
					{savingBranchStock ? 'Menyimpan...' : 'Simpan Harga Cabang'}
				</button>
			</div>
		</form>
	{/if}
</Modal>

<Toast message={toastMessage} variant={toastVariant} onDismiss={() => (toastMessage = null)} />
