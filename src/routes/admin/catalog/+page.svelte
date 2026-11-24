<script lang="ts">
	import CatalogItemForm from '#lib/components/admin/CatalogItemForm.svelte';
	import Modal from '#lib/components/ui/Modal.svelte';
	import Toast from '#lib/components/ui/Toast.svelte';
	import type { RentalItem } from '#lib/server/db/schema';
	import type { ApiResponse } from '#lib/types/api';
	import { formatRupiah } from '#lib/utils/catalog';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let items = $state<RentalItem[]>([]);
	let search = $state('');
	let categoryFilter = $state<string>('all');
	let statusFilter = $state<'all' | 'published' | 'draft'>('all');

	let modalOpen = $state(false);
	let editingItem = $state<RentalItem | null>(null);
	let deletingItem = $state<RentalItem | null>(null);
	let busyId = $state<string | null>(null);

	let toastMessage = $state<string | null>(null);
	let toastVariant = $state<'success' | 'error' | 'info'>('success');

	$effect(() => {
		items = data.items;
	});

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
				Inventaris Katalog
			</p>
			<h1 class="mt-1 text-3xl font-semibold tracking-tight text-neutral-950">
				Katalog Barang ({items.length})
			</h1>
			<p class="mt-1 text-sm text-neutral-500">
				Kelola 135+ unit sewa, atur harga sewa harian, spesifikasi, varian, serta unggah foto produk
				ke Cloudflare R2.
			</p>
		</div>

		<button
			type="button"
			onclick={openCreate}
			class="inline-flex items-center justify-center rounded-full bg-neutral-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
		>
			+ Tambah Barang
		</button>
	</header>

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
							<th class="px-4 py-3.5 font-medium">Tarif</th>
							<th class="px-4 py-3.5 font-medium">Status</th>
							<th class="px-5 py-3.5 text-right font-medium">Aksi</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-neutral-100">
						{#each filteredItems as item (item.id)}
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
								<td class="px-4 py-3.5 text-xs font-medium text-neutral-900">
									{#if item.pricePerDay !== null}
										{formatRupiah(item.pricePerDay)} / {item.unitLabel}
									{:else}
										<span class="text-neutral-400">Tanya CS</span>
									{/if}
								</td>
								<td class="px-4 py-3.5">
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
								</td>
								<td class="px-5 py-3.5 text-right">
									<div class="inline-flex items-center gap-2">
										<button
											type="button"
											onclick={() => openEdit(item)}
											class="rounded-full border border-neutral-200 px-3.5 py-1.5 text-xs font-medium text-neutral-700 transition hover:border-neutral-950 hover:text-neutral-950"
										>
											Edit
										</button>
										<button
											type="button"
											onclick={() => (deletingItem = item)}
											class="rounded-full border border-red-200 px-3.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
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

<Toast message={toastMessage} variant={toastVariant} onDismiss={() => (toastMessage = null)} />
