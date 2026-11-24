<script lang="ts">
	import Modal from '#lib/components/ui/Modal.svelte';
	import Toast from '#lib/components/ui/Toast.svelte';
	import type { Branch } from '#lib/server/db/schema';
	import type { ApiResponse } from '#lib/types/api';
	import { formatRupiah } from '#lib/utils/catalog';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	type BranchRow = PageData['branchList'][number];

	let branchRows = $state<BranchRow[]>([]);
	let modalOpen = $state(false);
	let editingBranch = $state<BranchRow | null>(null);
	let saving = $state(false);
	let formError = $state<string | null>(null);

	// Form state
	let code = $state('');
	let name = $state('');
	let city = $state('');
	let address = $state('');
	let phone = $state('');
	let whatsapp = $state('');
	let deliveryFeeDefault = $state(35000);
	let operatingHours = $state('Senin – Minggu, 08.00 – 21.00 WIB');
	let isActive = $state(true);
	let sortOrder = $state(0);

	let toastMessage = $state<string | null>(null);
	let toastVariant = $state<'success' | 'error' | 'info'>('success');

	$effect(() => {
		branchRows = data.branchList;
	});

	function showToast(message: string, variant: 'success' | 'error' | 'info' = 'success'): void {
		toastVariant = variant;
		toastMessage = message;
	}

	function openCreate(): void {
		editingBranch = null;
		code = '';
		name = '';
		city = '';
		address = '';
		phone = '';
		whatsapp = '';
		deliveryFeeDefault = 35000;
		operatingHours = 'Senin – Minggu, 08.00 – 21.00 WIB';
		isActive = true;
		sortOrder = branchRows.length + 1;
		formError = null;
		modalOpen = true;
	}

	function openEdit(branch: BranchRow): void {
		editingBranch = branch;
		code = branch.code;
		name = branch.name;
		city = branch.city;
		address = branch.address;
		phone = branch.phone;
		whatsapp = branch.whatsapp;
		deliveryFeeDefault = branch.deliveryFeeDefault;
		operatingHours = branch.operatingHours;
		isActive = branch.isActive;
		sortOrder = branch.sortOrder;
		formError = null;
		modalOpen = true;
	}

	async function handleSave(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		saving = true;
		formError = null;

		const payload = {
			code: code.trim().toUpperCase(),
			name: name.trim(),
			city: city.trim(),
			address: address.trim(),
			phone: phone.trim(),
			whatsapp: whatsapp.trim(),
			deliveryFeeDefault: Math.max(0, Math.trunc(Number(deliveryFeeDefault) || 0)),
			operatingHours: operatingHours.trim(),
			isActive,
			sortOrder: Math.max(0, Math.trunc(Number(sortOrder) || 0))
		};

		try {
			const isEdit = Boolean(editingBranch);
			const endpoint = isEdit && editingBranch ? `/api/branches/${editingBranch.id}` : '/api/branches';
			const response = await fetch(endpoint, {
				method: isEdit ? 'PATCH' : 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			const result = (await response.json()) as ApiResponse<Branch>;
			if (!response.ok || !result.success || !result.data) {
				formError = result.message || 'Gagal menyimpan data cabang.';
				return;
			}

			const saved = result.data;
			if (isEdit) {
				branchRows = branchRows.map((b) =>
					b.id === saved.id
						? { ...b, ...saved }
						: b
				);
				showToast(result.message || `Informasi ${saved.name} berhasil diperbarui.`);
			} else {
				branchRows = [
					...branchRows,
					{
						...saved,
						orderCount: 0,
						totalRevenue: 0,
						staff: []
					}
				];
				showToast(result.message || `${saved.name} berhasil ditambahkan.`);
			}
			modalOpen = false;
			editingBranch = null;
		} catch {
			formError = 'Gangguan jaringan saat menyimpan cabang.';
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>{data.isSuperAdmin ? 'Cabang & Kios' : 'Info Cabang & Kios'} — Admin CMS</title>
</svelte:head>

<div class="space-y-6">
	<header class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
		<div>
			<p class="text-xs font-semibold tracking-widest text-neutral-400 uppercase">
				Manajemen Multi-Cabang
			</p>
			<h1 class="mt-1 text-3xl font-semibold tracking-tight text-neutral-950">
				{data.isSuperAdmin ? 'Cabang & Kios Penyewaan' : `Info ${data.assignedBranch?.name ?? 'Cabang'}`}
			</h1>
			<p class="mt-1 text-sm text-neutral-500">
				Atur alamat kios, nomor WhatsApp CS, jam operasional, dan ongkir dasar masing-masing cabang.
			</p>
		</div>

		{#if data.isSuperAdmin}
			<button
				type="button"
				onclick={openCreate}
				class="inline-flex items-center justify-center rounded-full bg-neutral-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
			>
				+ Tambah Cabang Baru
			</button>
		{/if}
	</header>

	<!-- Info Rekening Terpusat -->
	<div class="rounded-3xl border border-sky-200/80 bg-sky-50/60 p-5 text-xs text-sky-950">
		<p class="font-bold">🏦 Kebijakan Rekening Terpusat &amp; Operasional Per Cabang</p>
		<p class="mt-1 leading-relaxed text-sky-800">
			Setiap cabang mengelola <strong>harga sewa, stok unit, alamat kios, nomor WhatsApp CS, dan transaksi operasionalnya sendiri</strong>.
			Seluruh pembayaran transfer/QRIS/VA dari semua cabang tetap masuk ke <strong>Rekening Pembayaran Terpusat {data.companyName}</strong>.
		</p>
	</div>

	<!-- Kartu Cabang -->
	<div class="grid gap-6 md:grid-cols-2">
		{#each branchRows as branch (branch.id)}
			<div class="flex flex-col justify-between rounded-3xl border border-neutral-200/80 bg-white p-6">
				<div>
					<div class="flex items-start justify-between gap-3">
						<div>
							<div class="flex items-center gap-2">
								<span class="rounded-lg bg-neutral-950 px-2.5 py-0.5 font-mono text-xs font-bold text-white">
									{branch.code}
								</span>
								<span
									class="rounded-full px-2.5 py-0.5 text-[11px] font-semibold {branch.isActive
										? 'bg-emerald-50 text-emerald-700'
										: 'bg-neutral-100 text-neutral-500'}"
								>
									{branch.isActive ? 'Aktif' : 'Nonaktif'}
								</span>
							</div>
							<h2 class="mt-2.5 text-xl font-bold text-neutral-950">{branch.name}</h2>
							<p class="text-xs text-neutral-500">Kota {branch.city} · Slug: <span class="font-mono">/{branch.slug}</span></p>
						</div>

						<button
							type="button"
							onclick={() => openEdit(branch)}
							class="rounded-full border border-neutral-200 px-4 py-1.5 text-xs font-semibold text-neutral-700 transition hover:border-neutral-950 hover:text-neutral-950"
						>
							Edit Info
						</button>
					</div>

					<dl class="mt-5 space-y-2.5 border-t border-neutral-100 pt-4 text-xs">
						<div>
							<dt class="text-neutral-400">Alamat Kios</dt>
							<dd class="mt-0.5 font-medium text-neutral-900">{branch.address}</dd>
						</div>
						<div class="grid grid-cols-2 gap-3">
							<div>
								<dt class="text-neutral-400">Telepon / Display</dt>
								<dd class="mt-0.5 font-semibold text-neutral-900">{branch.phone}</dd>
							</div>
							<div>
								<dt class="text-neutral-400">WhatsApp CS (wa.me)</dt>
								<dd class="mt-0.5 font-mono font-semibold text-emerald-700">+{branch.whatsapp}</dd>
							</div>
						</div>
						<div class="grid grid-cols-2 gap-3">
							<div>
								<dt class="text-neutral-400">Ongkir Dasar Delivery</dt>
								<dd class="mt-0.5 font-semibold text-neutral-900">{formatRupiah(branch.deliveryFeeDefault)}</dd>
							</div>
							<div>
								<dt class="text-neutral-400">Jam Operasional</dt>
								<dd class="mt-0.5 font-medium text-neutral-800">{branch.operatingHours}</dd>
							</div>
						</div>
					</dl>
				</div>

				<div class="mt-5 space-y-3 border-t border-neutral-100 pt-4">
					<div class="grid grid-cols-2 gap-3 rounded-2xl bg-surface p-3.5 text-xs">
						<div>
							<p class="text-neutral-400">Total Transaksi</p>
							<p class="mt-0.5 text-lg font-bold text-neutral-950">{branch.orderCount}</p>
						</div>
						<div>
							<p class="text-neutral-400">Omzet Tercatat</p>
							<p class="mt-0.5 text-lg font-bold text-emerald-700">{formatRupiah(branch.totalRevenue)}</p>
						</div>
					</div>

					{#if branch.staff.length > 0}
						<div class="text-xs">
							<p class="font-semibold text-neutral-500">Admin Cabang Ditugaskan:</p>
							<div class="mt-1.5 flex flex-wrap gap-1.5">
								{#each branch.staff as st (st.id)}
									<span class="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-700">
										{st.name} ({st.email})
									</span>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>

<Modal
	open={modalOpen}
	title={editingBranch ? `Edit ${editingBranch.name}` : 'Tambah Cabang Penyewaan Baru'}
	subtitle="Nomor WA CS, alamat kios, dan ongkir dasar langsung tampil di website publik & invoice."
	onClose={() => {
		modalOpen = false;
		editingBranch = null;
	}}
>
	<form onsubmit={handleSave} class="space-y-4">
		{#if formError}
			<div class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
				{formError}
			</div>
		{/if}

		<div class="grid gap-4 sm:grid-cols-3">
			<div>
				<label for="br-code" class="block text-xs font-semibold text-neutral-700">Kode Cabang *</label>
				<input
					id="br-code"
					type="text"
					required
					disabled={Boolean(editingBranch) && !data.isSuperAdmin}
					bind:value={code}
					placeholder="BGR / DPK"
					class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 font-mono text-sm font-bold uppercase focus:border-neutral-950 focus:outline-none disabled:bg-neutral-100"
				/>
			</div>
			<div class="sm:col-span-2">
				<label for="br-name" class="block text-xs font-semibold text-neutral-700">Nama Cabang *</label>
				<input
					id="br-name"
					type="text"
					required
					bind:value={name}
					placeholder="Cabang Bogor"
					class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-neutral-950 focus:outline-none"
				/>
			</div>
		</div>

		<div class="grid gap-4 sm:grid-cols-2">
			<div>
				<label for="br-city" class="block text-xs font-semibold text-neutral-700">Kota *</label>
				<input
					id="br-city"
					type="text"
					required
					bind:value={city}
					placeholder="Bogor"
					class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-neutral-950 focus:outline-none"
				/>
			</div>
			<div>
				<label for="br-fee" class="block text-xs font-semibold text-neutral-700">Ongkir Dasar Delivery (Rp) *</label>
				<input
					id="br-fee"
					type="number"
					min="0"
					step="5000"
					required
					bind:value={deliveryFeeDefault}
					class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm font-semibold focus:border-neutral-950 focus:outline-none"
				/>
			</div>
		</div>

		<div>
			<label for="br-addr" class="block text-xs font-semibold text-neutral-700">Alamat Kios Lengkap *</label>
			<textarea
				id="br-addr"
				rows="2"
				required
				bind:value={address}
				placeholder="Jl. Pajajaran No. 88, Bogor Tengah, Kota Bogor..."
				class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-neutral-950 focus:outline-none"
			></textarea>
		</div>

		<div class="grid gap-4 sm:grid-cols-2">
			<div>
				<label for="br-phone" class="block text-xs font-semibold text-neutral-700">Nomor Telepon / Display *</label>
				<input
					id="br-phone"
					type="text"
					required
					bind:value={phone}
					placeholder="0857-xxxx-xxxx"
					class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-neutral-950 focus:outline-none"
				/>
			</div>
			<div>
				<label for="br-wa" class="block text-xs font-semibold text-neutral-700">Nomor WhatsApp CS *</label>
				<input
					id="br-wa"
					type="text"
					required
					bind:value={whatsapp}
					placeholder="62857xxxxxxxx"
					class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 font-mono text-sm focus:border-neutral-950 focus:outline-none"
				/>
			</div>
		</div>

		<div>
			<label for="br-hours" class="block text-xs font-semibold text-neutral-700">Jam Operasional *</label>
			<input
				id="br-hours"
				type="text"
				required
				bind:value={operatingHours}
				class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-neutral-950 focus:outline-none"
			/>
		</div>

		{#if data.isSuperAdmin}
			<div class="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-surface px-4 py-3 text-xs">
				<label class="flex cursor-pointer items-center gap-2 text-neutral-800">
					<input type="checkbox" bind:checked={isActive} class="h-4 w-4 accent-neutral-950" />
					<span>Cabang Aktif &amp; Tampil di Website Publik</span>
				</label>
				<label class="flex items-center gap-2 text-neutral-600">
					<span>Urutan:</span>
					<input
						type="number"
						min="0"
						max="999"
						bind:value={sortOrder}
						class="w-16 rounded-lg border border-neutral-200 bg-white px-2 py-1 text-center text-xs font-semibold"
					/>
				</label>
			</div>
		{/if}

		<div class="flex justify-end gap-2.5 border-t border-neutral-100 pt-4">
			<button
				type="button"
				onclick={() => {
					modalOpen = false;
					editingBranch = null;
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
				{saving ? 'Menyimpan...' : editingBranch ? 'Simpan Perubahan' : 'Tambah Cabang'}
			</button>
		</div>
	</form>
</Modal>

<Toast message={toastMessage} variant={toastVariant} onDismiss={() => (toastMessage = null)} />
