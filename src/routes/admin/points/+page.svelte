<script lang="ts">
	import Modal from '#lib/components/ui/Modal.svelte';
	import Toast from '#lib/components/ui/Toast.svelte';
	import type { PointTransaction } from '#lib/server/db/schema';
	import type { ApiResponse } from '#lib/types/api';
	import { formatRupiah } from '#lib/utils/catalog';
	import { formatDateTimeId } from '#lib/utils/orders';
	import {
		POINT_EARN_UNIT_IDR,
		POINT_VALUE_IDR,
		calculatePointDiscountIdr,
		formatPointAccountNumber,
		getPointTxMeta
	} from '#lib/utils/points';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	type AccountRow = PageData['accounts'][number];

	let accounts = $state<AccountRow[]>([]);
	let transactions = $state<PointTransaction[]>([]);
	let search = $state('');

	let adjustingAccount = $state<AccountRow | null>(null);
	let adjustMode = $state<'add' | 'deduct'>('add');
	let adjustAmount = $state(10);
	let adjustDesc = $state('');
	let busy = $state(false);

	let toastMessage = $state<string | null>(null);
	let toastVariant = $state<'success' | 'error' | 'info'>('success');

	$effect(() => {
		accounts = data.accounts;
		transactions = data.recentTransactions;
	});

	let accountNameById = $derived(new Map<string, string>(accounts.map((a) => [a.id, a.name])));

	let totalPointsCirculating = $derived(
		accounts.reduce((acc, row) => acc + row.pointBalance, 0)
	);

	let filteredAccounts = $derived.by(() => {
		const q = search.trim().toLowerCase();
		if (!q) return accounts;
		return accounts.filter(
			(a) =>
				a.name.toLowerCase().includes(q) ||
				a.email.toLowerCase().includes(q) ||
				formatPointAccountNumber(a.id).toLowerCase().includes(q)
		);
	});

	function openAdjust(acc: AccountRow): void {
		adjustingAccount = acc;
		adjustMode = 'add';
		adjustAmount = 10;
		adjustDesc = '';
	}

	async function handleAdjustSubmit(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		if (!adjustingAccount) return;

		const cleanAmount = Math.max(1, Math.trunc(Number(adjustAmount) || 0));
		const delta = adjustMode === 'add' ? cleanAmount : -cleanAmount;

		busy = true;
		try {
			const response = await fetch('/api/admin/points', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					userId: adjustingAccount.id,
					delta,
					description: adjustDesc.trim()
				})
			});

			const result = (await response.json()) as ApiResponse<{
				userId: string;
				newBalance: number;
				transaction: PointTransaction;
			}>;

			if (!response.ok || !result.success || !result.data) {
				toastVariant = 'error';
				toastMessage = result.message || 'Gagal menyesuaikan saldo poin.';
				return;
			}

			const { userId, newBalance, transaction } = result.data;
			accounts = accounts.map((a) =>
				a.id === userId ? { ...a, pointBalance: newBalance } : a
			);
			transactions = [transaction, ...transactions];
			adjustingAccount = null;
			toastVariant = 'success';
			toastMessage = result.message || 'Saldo Rekening Poin berhasil diperbarui.';
		} catch {
			toastVariant = 'error';
			toastMessage = 'Gangguan jaringan saat menyesuaikan poin.';
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head>
	<title>Rekening Poin Penyewa — Admin CMS</title>
</svelte:head>

<div class="space-y-6">
	<header class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
		<div>
			<span
				class="inline-flex rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-xs font-bold tracking-wide text-neutral-300 uppercase"
			>
				Loyalitas Penyewa
			</span>
			<h1 class="mt-3 text-2xl font-bold tracking-tight text-white">Rekening Poin Sewa</h1>
			<p class="mt-1 text-sm text-neutral-400">
				Aturan aktif:
				<strong class="text-white">+1 Poin tiap {formatRupiah(POINT_EARN_UNIT_IDR)}</strong> saat
				barang dikembalikan ·
				<strong class="text-white">1 Poin = {formatRupiah(POINT_VALUE_IDR)}</strong>.
			</p>
		</div>
	</header>

	<div class="grid gap-4 sm:grid-cols-3">
		<div class="rounded-[2rem] border border-white/15 bg-[#0c0c0f] p-5">
			<p class="text-sm font-medium text-neutral-400">Total Poin Beredar</p>
			<p class="mt-2 text-2xl font-bold text-white">
				{totalPointsCirculating.toLocaleString('id-ID')}
				<span class="text-sm font-bold text-amber-300">Poin</span>
			</p>
			<p class="mt-1 text-xs text-neutral-400">
				Nilai tukar: {formatRupiah(calculatePointDiscountIdr(totalPointsCirculating))}
			</p>
		</div>

		<div class="rounded-[2rem] border border-white/15 bg-[#0c0c0f] p-5">
			<p class="text-sm font-medium text-neutral-400">Rekening Poin Terdaftar</p>
			<p class="mt-2 text-2xl font-bold text-white">{accounts.length}</p>
			<p class="mt-1 text-xs text-neutral-400">Akun penyewa &amp; admin</p>
		</div>

		<div class="rounded-[2rem] border border-white/15 bg-[#0c0c0f] p-5">
			<p class="text-sm font-medium text-neutral-400">Total Mutasi Tercatat</p>
			<p class="mt-2 text-2xl font-bold text-white">{transactions.length}</p>
			<p class="mt-1 text-xs text-neutral-400">Masuk, tukar &amp; penyesuaian</p>
		</div>
	</div>

	<!-- Daftar Rekening Poin Penyewa -->
	<section class="rounded-[2.25rem] border border-white/15 bg-[#0c0c0f] p-6">
		<div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
			<h2 class="text-base font-bold text-white">Saldo Rekening Poin Penyewa</h2>
			<input
				type="search"
				bind:value={search}
				placeholder="Cari nama, email, atau no. rekening poin..."
				class="w-full rounded-full border border-white/20 bg-black px-4 py-2 text-xs text-white placeholder:text-neutral-500 focus:border-white focus:outline-none sm:max-w-xs"
			/>
		</div>

		<div class="mt-4 overflow-x-auto">
			<table class="w-full text-left text-sm">
				<thead class="border-b border-white/10 text-xs text-neutral-400">
					<tr>
						<th class="py-3 pr-4 font-semibold">Pemilik Rekening</th>
						<th class="px-3 py-3 font-semibold">No. Rekening Poin</th>
						<th class="px-3 py-3 font-semibold">Saldo Poin</th>
						<th class="py-3 pl-3 text-right font-semibold">Aksi</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-white/10">
					{#each filteredAccounts as acc (acc.id)}
						<tr class="transition hover:bg-white/[0.03]">
							<td class="py-3.5 pr-4">
								<p class="font-bold text-white">
									{acc.name}
									{#if acc.role === 'admin' || acc.role === 'branch_admin'}
										<span
											class="ml-1.5 rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-xs font-bold text-neutral-200"
										>
											{acc.role === 'admin' ? 'Owner' : 'Admin Cabang'}
										</span>
									{/if}
								</p>
								<p class="text-xs text-neutral-400">{acc.email}</p>
							</td>
							<td class="px-3 py-3.5 font-mono text-xs text-neutral-300">
								{formatPointAccountNumber(acc.id)}
							</td>
							<td class="px-3 py-3.5">
								<p class="text-sm font-semibold text-amber-300">
									★ {acc.pointBalance.toLocaleString('id-ID')} Poin
								</p>
								<p class="text-xs text-neutral-400">
									≈ {formatRupiah(calculatePointDiscountIdr(acc.pointBalance))}
								</p>
							</td>
							<td class="py-3.5 pl-3 text-right">
								<button
									type="button"
									onclick={() => openAdjust(acc)}
									class="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-black transition hover:bg-neutral-200"
								>
									Sesuaikan Poin
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<!-- Riwayat Mutasi Poin Global -->
	<section class="rounded-[2.25rem] border border-white/15 bg-[#0c0c0f] p-6">
		<h2 class="text-base font-bold text-white">Mutasi Poin Terbaru</h2>
		{#if transactions.length > 0}
			<div class="mt-4 overflow-x-auto">
				<table class="w-full text-left text-sm">
					<thead class="border-b border-white/10 text-xs text-neutral-400">
						<tr>
							<th class="py-2.5 pr-3 font-semibold">Waktu</th>
							<th class="px-2 py-2.5 font-semibold">Penyewa</th>
							<th class="px-2 py-2.5 font-semibold">Jenis</th>
							<th class="px-2 py-2.5 font-semibold">Keterangan</th>
							<th class="px-2 py-2.5 text-right font-semibold">Mutasi</th>
							<th class="py-2.5 pl-2 text-right font-semibold">Saldo Akhir</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-white/10">
						{#each transactions as tx (tx.id)}
							{@const meta = getPointTxMeta(tx.type)}
							<tr>
								<td class="py-3 pr-3 whitespace-nowrap text-neutral-400">
									{formatDateTimeId(tx.createdAt)}
								</td>
								<td class="px-2 py-3 font-bold text-white">
									{accountNameById.get(tx.userId) ?? tx.userId.slice(0, 8)}
								</td>
								<td class="px-2 py-3">
									<span
										class="inline-block rounded-full border px-2 py-0.5 text-xs font-bold {meta.badgeClass}"
									>
										{meta.label}
									</span>
								</td>
								<td class="px-2 py-3 text-neutral-300">{tx.description}</td>
								<td
									class="px-2 py-3 text-right font-mono font-semibold {tx.points >= 0
										? 'text-emerald-400'
										: 'text-amber-300'}"
								>
									{tx.points >= 0 ? `+${tx.points}` : tx.points}
								</td>
								<td class="py-3 pl-2 text-right font-mono font-bold text-neutral-200">
									{tx.balanceAfter}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<p class="mt-4 text-sm text-neutral-500">Belum ada riwayat mutasi poin.</p>
		{/if}
	</section>
</div>

<Modal
	open={Boolean(adjustingAccount)}
	title={adjustingAccount ? `Sesuaikan Poin — ${adjustingAccount.name}` : 'Sesuaikan Poin'}
	subtitle="Setiap penambahan atau pengurangan otomatis tercatat di mutasi Rekening Poin penyewa."
	maxWidthClass="max-w-md"
	onClose={() => (adjustingAccount = null)}
>
	{#if adjustingAccount}
		<form onsubmit={handleAdjustSubmit} class="space-y-4">
			<div class="rounded-2xl border border-white/10 bg-black p-3.5 text-xs">
				<span class="text-neutral-400">Saldo saat ini:</span>
				<strong class="ml-1 text-amber-300">{adjustingAccount.pointBalance} Poin</strong>
			</div>

			<div class="grid grid-cols-2 gap-2 rounded-full border border-white/15 bg-black p-1 text-xs font-bold">
				<button
					type="button"
					onclick={() => (adjustMode = 'add')}
					class="rounded-full py-2 transition {adjustMode === 'add'
						? 'bg-emerald-400 text-black'
						: 'text-neutral-400 hover:text-white'}"
				>
					+ Tambah Poin
				</button>
				<button
					type="button"
					onclick={() => (adjustMode = 'deduct')}
					class="rounded-full py-2 transition {adjustMode === 'deduct'
						? 'bg-amber-400 text-black'
						: 'text-neutral-400 hover:text-white'}"
				>
					− Kurangi Poin
				</button>
			</div>

			<div>
				<label for="adj-pts" class="block text-sm font-semibold text-neutral-300">Jumlah Poin *</label>
				<input
					id="adj-pts"
					type="number"
					min="1"
					max="100000"
					required
					bind:value={adjustAmount}
					class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2.5 text-sm font-bold text-white focus:border-white focus:outline-none"
				/>
			</div>

			<div>
				<label for="adj-desc" class="block text-sm font-semibold text-neutral-300">
					Alasan / Keterangan *
				</label>
				<input
					id="adj-desc"
					type="text"
					required
					minlength="3"
					bind:value={adjustDesc}
					placeholder="Mis. Bonus pelanggan loyal / koreksi transaksi"
					class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-white focus:outline-none"
				/>
			</div>

			<div class="flex justify-end gap-2 border-t border-white/10 pt-4">
				<button
					type="button"
					onclick={() => (adjustingAccount = null)}
					class="rounded-full border border-white/20 bg-black px-4 py-2 text-xs font-bold text-neutral-300"
				>
					Batal
				</button>
				<button
					type="submit"
					disabled={busy}
					class="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black hover:bg-neutral-200 disabled:opacity-60"
				>
					{busy ? 'Menyimpan...' : 'Simpan Mutasi Poin'}
				</button>
			</div>
		</form>
	{/if}
</Modal>

<Toast message={toastMessage} variant={toastVariant} onDismiss={() => (toastMessage = null)} />
