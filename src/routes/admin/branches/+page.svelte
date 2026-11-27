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
			const endpoint =
				isEdit && editingBranch ? `/api/branches/${editingBranch.id}` : '/api/branches';
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
				branchRows = branchRows.map((b) => (b.id === saved.id ? { ...b, ...saved } : b));
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
			<span
				class="inline-flex rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-xs font-bold tracking-wide text-neutral-300 uppercase"
			>
				Manajemen Multi-Cabang
			</span>
			<h1 class="mt-3 text-2xl font-bold tracking-tight text-white">
				{data.isSuperAdmin
					? 'Cabang & Kios Penyewaan'
					: `Info ${data.assignedBranch?.name ?? 'Cabang'}`}
			</h1>
			<p class="mt-1 text-sm text-neutral-400">
				Atur alamat kios, nomor WhatsApp CS, jam operasional, dan ongkir dasar masing-masing
				cabang.
			</p>
		</div>

		{#if data.isSuperAdmin}
			<button
				type="button"
				onclick={openCreate}
				class="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-neutral-200"
			>
				+ Tambah Cabang Baru
			</button>
		{/if}
	</header>

	<!-- Info Rekening Terpusat -->
	<div class="rounded-[2rem] border border-sky-400/30 bg-sky-400/10 p-5 text-xs text-sky-100">
		<p class="font-semibold text-sky-300">🏦 Kebijakan Rekening Terpusat &amp; Operasional Per Cabang</p>
		<p class="mt-1 leading-relaxed text-neutral-300">
			Setiap cabang mengelola
			<strong class="text-white"
				>harga sewa, stok unit, alamat kios, nomor WhatsApp CS, dan transaksi operasionalnya
				sendiri</strong
			>. Seluruh pembayaran transfer/QRIS/VA dari semua cabang tetap masuk ke
			<strong class="text-white">Rekening Pembayaran Terpusat {data.companyName}</strong>.
		</p>
	</div>

	<!-- Kartu Cabang -->
	<div class="grid gap-6 md:grid-cols-2">
		{#each branchRows as branch (branch.id)}
			<div
				class="flex flex-col justify-between rounded-[2.25rem] border border-white/15 bg-[#0c0c0f] p-6"
			>
				<div>
					<div class="flex items-start justify-between gap-3">
						<div>
							<div class="flex items-center gap-2">
								<span
									class="rounded-full bg-white px-3 py-0.5 font-mono text-xs font-semibold text-black"
								>
									{branch.code}
								</span>
								<span
									class="rounded-full px-3 py-0.5 text-xs font-bold {branch.isActive
										? 'border border-emerald-400/30 bg-emerald-400/15 text-emerald-300'
										: 'border border-white/15 bg-white/10 text-neutral-400'}"
								>
									{branch.isActive ? 'Aktif' : 'Nonaktif'}
								</span>
							</div>
							<h2 class="mt-3 text-xl font-bold text-white">{branch.name}</h2>
							<p class="text-xs text-neutral-400">
								Kota {branch.city} · Slug: <span class="font-mono text-neutral-300">/{branch.slug}</span>
							</p>
						</div>

						<button
							type="button"
							onclick={() => openEdit(branch)}
							class="rounded-full border border-white/20 bg-black px-4 py-1.5 text-xs font-bold text-white transition hover:border-white hover:bg-white hover:text-black"
						>
							Edit Info
						</button>
					</div>

					<dl class="mt-5 space-y-2.5 border-t border-white/10 pt-4 text-xs">
						<div>
							<dt class="text-neutral-400">Alamat Kios</dt>
							<dd class="mt-0.5 font-semibold text-white">{branch.address}</dd>
						</div>
						<div class="grid grid-cols-2 gap-3">
							<div>
								<dt class="text-neutral-400">Telepon / Display</dt>
								<dd class="mt-0.5 font-bold text-white">{branch.phone}</dd>
							</div>
							<div>
								<dt class="text-neutral-400">WhatsApp CS (wa.me)</dt>
								<dd class="mt-0.5 font-mono font-bold text-emerald-400">+{branch.whatsapp}</dd>
							</div>
						</div>
						<div class="grid grid-cols-2 gap-3">
							<div>
								<dt class="text-neutral-400">Ongkir Dasar Delivery</dt>
								<dd class="mt-0.5 font-bold text-white">
									{formatRupiah(branch.deliveryFeeDefault)}
								</dd>
							</div>
							<div>
								<dt class="text-neutral-400">Jam Operasional</dt>
								<dd class="mt-0.5 font-medium text-neutral-200">{branch.operatingHours}</dd>
							</div>
						</div>
					</dl>
				</div>

				<div class="mt-5 space-y-3 border-t border-white/10 pt-4">
					<div class="grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-black p-4 text-xs">
						<div>
							<p class="text-neutral-400">Total Transaksi</p>
							<p class="mt-0.5 text-lg font-bold text-white">{branch.orderCount}</p>
						</div>
						<div>
							<p class="text-neutral-400">Omzet Tercatat</p>
							<p class="mt-0.5 text-lg font-bold text-emerald-400">
								{formatRupiah(branch.totalRevenue)}
							</p>
						</div>
					</div>

					{#if branch.staff.length > 0}
						<div class="text-xs">
							<p class="font-semibold text-neutral-400">Admin Cabang Ditugaskan:</p>
							<div class="mt-1.5 flex flex-wrap gap-1.5">
								{#each branch.staff as st (st.id)}
									<span
										class="rounded-full border border-white/15 bg-black px-3 py-1 text-xs font-semibold text-neutral-200"
									>
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
			<div class="rounded-2xl border border-red-400/30 bg-red-500/15 px-4 py-3 text-xs text-red-200">
				{formError}
			</div>
		{/if}

		<div class="grid gap-4 sm:grid-cols-3">
			<div>
				<label for="br-code" class="block text-sm font-semibold text-neutral-300">Kode Cabang *</label>
				<input
					id="br-code"
					type="text"
					required
					disabled={Boolean(editingBranch) && !data.isSuperAdmin}
					bind:value={code}
					placeholder="BGR / DPK"
					class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2.5 font-mono text-sm font-bold text-white uppercase focus:border-white focus:outline-none disabled:opacity-50"
				/>
			</div>
			<div class="sm:col-span-2">
				<label for="br-name" class="block text-sm font-semibold text-neutral-300">Nama Cabang *</label>
				<input
					id="br-name"
					type="text"
					required
					bind:value={name}
					placeholder="Cabang Bogor"
					class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2.5 text-sm text-white focus:border-white focus:outline-none"
				/>
			</div>
		</div>

		<div class="grid gap-4 sm:grid-cols-2">
			<div>
				<label for="br-city" class="block text-sm font-semibold text-neutral-300">Kota *</label>
				<input
					id="br-city"
					type="text"
					required
					bind:value={city}
					placeholder="Bogor"
					class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2.5 text-sm text-white focus:border-white focus:outline-none"
				/>
			</div>
			<div>
				<label for="br-fee" class="block text-sm font-semibold text-neutral-300">
					Ongkir Dasar Delivery (Rp) *
				</label>
				<input
					id="br-fee"
					type="number"
					min="0"
					step="5000"
					required
					bind:value={deliveryFeeDefault}
					class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2.5 text-sm font-bold text-white focus:border-white focus:outline-none"
				/>
			</div>
		</div>

		<div>
			<label for="br-addr" class="block text-sm font-semibold text-neutral-300">
				Alamat Kios Lengkap *
			</label>
			<textarea
				id="br-addr"
				rows="2"
				required
				bind:value={address}
				placeholder="Jl. Pajajaran No. 88, Bogor Tengah, Kota Bogor..."
				class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2.5 text-sm text-white focus:border-white focus:outline-none"
			></textarea>
		</div>

		<div class="grid gap-4 sm:grid-cols-2">
			<div>
				<label for="br-phone" class="block text-sm font-semibold text-neutral-300">
					Nomor Telepon / Display *
				</label>
				<input
					id="br-phone"
					type="text"
					required
					bind:value={phone}
					placeholder="0857-xxxx-xxxx"
					class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2.5 text-sm text-white focus:border-white focus:outline-none"
				/>
			</div>
			<div>
				<label for="br-wa" class="block text-sm font-semibold text-neutral-300">
					Nomor WhatsApp CS *
				</label>
				<input
					id="br-wa"
					type="text"
					required
					bind:value={whatsapp}
					placeholder="62857xxxxxxxx"
					class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2.5 font-mono text-sm text-white focus:border-white focus:outline-none"
				/>
			</div>
		</div>

		<div>
			<label for="br-hours" class="block text-sm font-semibold text-neutral-300">
				Jam Operasional *
			</label>
			<input
				id="br-hours"
				type="text"
				required
				bind:value={operatingHours}
				class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2.5 text-sm text-white focus:border-white focus:outline-none"
			/>
		</div>

		{#if data.isSuperAdmin}
			<div
				class="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black px-4 py-3 text-xs"
			>
				<label class="flex cursor-pointer items-center gap-2 text-neutral-200">
					<input type="checkbox" bind:checked={isActive} class="h-4 w-4 accent-white" />
					<span>Cabang Aktif &amp; Tampil di Website Publik</span>
				</label>
				<label class="flex items-center gap-2 text-neutral-400">
					<span>Urutan:</span>
					<input
						type="number"
						min="0"
						max="999"
						bind:value={sortOrder}
						class="w-16 rounded-xl border border-white/20 bg-[#121216] px-2 py-1 text-center text-xs font-bold text-white"
					/>
				</label>
			</div>
		{/if}

		<div class="flex justify-end gap-2.5 border-t border-white/10 pt-4">
			<button
				type="button"
				onclick={() => {
					modalOpen = false;
					editingBranch = null;
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
				{saving ? 'Menyimpan...' : editingBranch ? 'Simpan Perubahan' : 'Tambah Cabang'}
			</button>
		</div>
	</form>
</Modal>

<Toast message={toastMessage} variant={toastVariant} onDismiss={() => (toastMessage = null)} />
