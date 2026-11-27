<script lang="ts">
	import PortfolioForm from '#lib/components/admin/PortfolioForm.svelte';
	import Modal from '#lib/components/ui/Modal.svelte';
	import Toast from '#lib/components/ui/Toast.svelte';
	import type { Portfolio } from '#lib/server/db/schema';
	import type { ApiResponse } from '#lib/types/api';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let items = $state<Portfolio[]>([]);
	let search = $state('');
	let statusFilter = $state<'all' | 'published' | 'draft'>('all');

	let modalOpen = $state(false);
	let editingPortfolio = $state<Portfolio | null>(null);
	let deletingPortfolio = $state<Portfolio | null>(null);
	let busyId = $state<string | null>(null);

	let toastMessage = $state<string | null>(null);
	let toastVariant = $state<'success' | 'error' | 'info'>('success');

	$effect(() => {
		items = data.portfolios;
	});

	let filteredItems = $derived.by(() => {
		const q = search.trim().toLowerCase();
		return items.filter((item) => {
			if (statusFilter === 'published' && !item.isPublished) return false;
			if (statusFilter === 'draft' && item.isPublished) return false;
			if (!q) return true;
			return (
				item.title.toLowerCase().includes(q) ||
				item.clientName.toLowerCase().includes(q) ||
				item.category.toLowerCase().includes(q) ||
				item.slug.toLowerCase().includes(q)
			);
		});
	});

	function showToast(message: string, variant: 'success' | 'error' | 'info' = 'success'): void {
		toastVariant = variant;
		toastMessage = message;
	}

	function openCreate(): void {
		editingPortfolio = null;
		modalOpen = true;
	}

	function openEdit(portfolio: Portfolio): void {
		editingPortfolio = portfolio;
		modalOpen = true;
	}

	function handleSaved(saved: Portfolio, isNew: boolean): void {
		if (isNew) {
			items = [saved, ...items];
			showToast('Portofolio baru berhasil ditambahkan.');
		} else {
			items = items.map((item) => (item.id === saved.id ? saved : item));
			showToast('Perubahan portofolio berhasil disimpan.');
		}
		modalOpen = false;
		editingPortfolio = null;
	}

	async function togglePublish(portfolio: Portfolio): Promise<void> {
		busyId = portfolio.id;
		try {
			const response = await fetch(`/api/portfolios/${portfolio.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ isPublished: !portfolio.isPublished })
			});
			const result = (await response.json()) as ApiResponse<Portfolio>;
			if (!response.ok || !result.success || !result.data) {
				showToast(result.message || 'Gagal memperbarui status portofolio.', 'error');
				return;
			}
			const updated = result.data;
			items = items.map((item) => (item.id === updated.id ? updated : item));
			showToast(
				updated.isPublished ? 'Portofolio dipublikasikan.' : 'Portofolio dipindahkan ke draft.'
			);
		} catch {
			showToast('Gangguan jaringan saat mengubah status portofolio.', 'error');
		} finally {
			busyId = null;
		}
	}

	async function confirmDelete(): Promise<void> {
		if (!deletingPortfolio) return;
		const target = deletingPortfolio;
		busyId = target.id;
		try {
			const response = await fetch(`/api/portfolios/${target.id}`, {
				method: 'DELETE'
			});
			const result = (await response.json()) as ApiResponse<{ id: string }>;
			if (!response.ok || !result.success) {
				showToast(result.message || 'Gagal menghapus portofolio.', 'error');
				return;
			}
			items = items.filter((item) => item.id !== target.id);
			deletingPortfolio = null;
			showToast('Portofolio dan seluruh gambar R2 terkait berhasil dihapus.');
		} catch {
			showToast('Gangguan jaringan saat menghapus portofolio.', 'error');
		} finally {
			busyId = null;
		}
	}
</script>

<svelte:head>
	<title>Kelola Portofolio — CMS</title>
</svelte:head>

<div class="space-y-6">
	<header class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
		<div>
			<span
				class="inline-flex rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-xs font-bold tracking-wide text-neutral-300 uppercase"
			>
				CMS Konten
			</span>
			<h1 class="mt-3 text-2xl font-bold tracking-tight text-white">Dokumentasi Acara</h1>
			<p class="mt-1 text-sm text-neutral-400">
				Kelola studi kasus acara, galeri media Cloudflare R2, dan relasi layanan.
			</p>
		</div>

		<button
			type="button"
			onclick={openCreate}
			class="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-neutral-200"
		>
			+ Tambah Dokumentasi
		</button>
	</header>

	<div
		class="flex flex-col gap-3 rounded-[2rem] border border-white/15 bg-[#0c0c0f] p-4 sm:flex-row sm:items-center sm:justify-between"
	>
		<input
			type="search"
			bind:value={search}
			placeholder="Cari judul, klien, atau kategori..."
			class="w-full rounded-full border border-white/20 bg-black px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-white focus:outline-none sm:max-w-xs"
		/>

		<div class="flex gap-1.5">
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

	{#if filteredItems.length > 0}
		<div class="overflow-hidden rounded-[2rem] border border-white/15 bg-[#0c0c0f]">
			<div class="overflow-x-auto">
				<table class="w-full text-left text-sm">
					<thead class="border-b border-white/10 bg-black/60 text-xs text-neutral-400">
						<tr>
							<th class="px-5 py-3.5 font-semibold">Proyek</th>
							<th class="px-4 py-3.5 font-semibold">Klien &amp; Kategori</th>
							<th class="px-4 py-3.5 font-semibold">Status</th>
							<th class="px-5 py-3.5 text-right font-semibold">Aksi</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-white/10">
						{#each filteredItems as portfolio (portfolio.id)}
							<tr class="transition hover:bg-white/[0.03]">
								<td class="px-5 py-4">
									<div class="flex items-center gap-3.5">
										{#if portfolio.imageUrl}
											<img
												src={portfolio.imageUrl}
												alt={portfolio.title}
												class="h-11 w-14 shrink-0 rounded-xl border border-white/10 object-cover"
											/>
										{:else}
											<div
												class="flex h-11 w-14 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black text-xs font-bold text-neutral-500 uppercase"
											>
												CASE
											</div>
										{/if}
										<div class="min-w-0">
											<div class="flex items-center gap-2">
												<p class="truncate font-bold text-white">{portfolio.title}</p>
												{#if portfolio.isFeatured}
													<span
														class="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-black"
													>
														Unggulan
													</span>
												{/if}
											</div>
											<p class="truncate font-mono text-xs text-neutral-400">
												/portfolios/{portfolio.slug}
											</p>
										</div>
									</div>
								</td>
								<td class="px-4 py-4">
									<p class="text-sm font-semibold text-white">{portfolio.clientName}</p>
									<p class="text-xs text-neutral-400">{portfolio.category}</p>
								</td>
								<td class="px-4 py-4">
									<button
										type="button"
										disabled={busyId === portfolio.id}
										onclick={() => togglePublish(portfolio)}
										class="rounded-full px-3 py-1 text-xs font-bold transition {portfolio.isPublished
											? 'border border-emerald-400/30 bg-emerald-400/15 text-emerald-300 hover:bg-emerald-400/25'
											: 'border border-white/15 bg-white/10 text-neutral-400 hover:bg-white/20'}"
									>
										{portfolio.isPublished ? 'Terbit' : 'Draft'}
									</button>
								</td>
								<td class="px-5 py-4 text-right">
									<div class="inline-flex items-center gap-2">
										<button
											type="button"
											onclick={() => openEdit(portfolio)}
											class="rounded-full border border-white/20 bg-black px-3.5 py-1.5 text-xs font-bold text-neutral-200 transition hover:border-white hover:text-white"
										>
											Edit
										</button>
										<button
											type="button"
											onclick={() => (deletingPortfolio = portfolio)}
											class="rounded-full border border-red-400/30 bg-red-500/10 px-3.5 py-1.5 text-xs font-bold text-red-300 transition hover:bg-red-500/20"
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
		<div class="rounded-[2.25rem] border border-white/15 bg-[#0c0c0f] p-14 text-center">
			<p class="text-sm text-neutral-400">Belum ada data dokumentasi yang sesuai filter.</p>
			<button
				type="button"
				onclick={openCreate}
				class="mt-4 rounded-full bg-white px-5 py-2 text-sm font-semibold text-black"
			>
				Tambah Dokumentasi Pertama
			</button>
		</div>
	{/if}
</div>

<Modal
	open={modalOpen}
	title={editingPortfolio ? 'Edit Dokumentasi' : 'Tambah Dokumentasi Baru'}
	subtitle="Lengkapi studi kasus dan unggah dokumentasi acara ke Cloudflare R2."
	maxWidthClass="max-w-3xl"
	onClose={() => {
		modalOpen = false;
		editingPortfolio = null;
	}}
>
	<PortfolioForm
		portfolio={editingPortfolio}
		services={data.services}
		onSaved={handleSaved}
		onCancel={() => {
			modalOpen = false;
			editingPortfolio = null;
		}}
	/>
</Modal>

<Modal
	open={Boolean(deletingPortfolio)}
	title="Hapus Dokumentasi?"
	maxWidthClass="max-w-md"
	onClose={() => (deletingPortfolio = null)}
>
	{#if deletingPortfolio}
		<p class="text-sm leading-relaxed text-neutral-300">
			Anda yakin ingin menghapus dokumentasi
			<strong class="text-white">{deletingPortfolio.title}</strong>? Gambar sampul dan galeri di
			Cloudflare R2 akan ikut dihapus.
		</p>
		<div class="mt-6 flex justify-end gap-2.5">
			<button
				type="button"
				onclick={() => (deletingPortfolio = null)}
				class="rounded-full border border-white/20 bg-black px-4 py-2 text-xs font-bold text-neutral-300"
			>
				Batal
			</button>
			<button
				type="button"
				disabled={busyId === deletingPortfolio.id}
				onclick={confirmDelete}
				class="rounded-full bg-red-500 px-5 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
			>
				{busyId === deletingPortfolio.id ? 'Menghapus...' : 'Ya, Hapus'}
			</button>
		</div>
	{/if}
</Modal>

<Toast message={toastMessage} variant={toastVariant} onDismiss={() => (toastMessage = null)} />
