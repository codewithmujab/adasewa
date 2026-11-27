<script lang="ts">
	import Modal from '#lib/components/ui/Modal.svelte';
	import Toast from '#lib/components/ui/Toast.svelte';
	import type { ApiResponse } from '#lib/types/api';
	import { formatRupiah } from '#lib/utils/catalog';
	import {
		formatDateId,
		formatDateTimeId,
		getOrderStatusMeta,
		getPaymentMethodInfo,
		getPaymentStatusMeta
	} from '#lib/utils/orders';
	import { calculateEarnedPoints } from '#lib/utils/points';
	import type { AdminOrderWithItems } from './+page.server';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let orders = $state<AdminOrderWithItems[]>([]);
	let search = $state('');
	let branchFilter = $state<string>('all');
	let statusTab = $state<
		| 'all'
		| 'pending_payment'
		| 'waiting_verification'
		| 'active_rental'
		| 'return_requested'
		| 'returned'
	>('all');

	let selectedOrder = $state<AdminOrderWithItems | null>(null);
	let editOrderStatus = $state('pending_payment');
	let editPaymentStatus = $state('unpaid');
	let editLateFee = $state(0);
	let editPointsToAward = $state(0);
	let editReturnCondition = $state<string>('');
	let editReturnNotes = $state('');
	let editItemReturns = $state<
		Array<{
			orderItemId: string;
			itemName: string;
			variant: string | null;
			quantity: number;
			returnedQty: number;
			returnCondition: 'pending' | 'good' | 'damaged';
		}>
	>([]);

	let saving = $state(false);
	let toastMessage = $state<string | null>(null);
	let toastVariant = $state<'success' | 'error' | 'info'>('success');

	$effect(() => {
		orders = data.orders;
	});

	let branchScopedOrders = $derived(
		branchFilter === 'all' ? orders : orders.filter((o) => o.branchId === branchFilter)
	);

	let counts = $derived({
		all: branchScopedOrders.length,
		waitingVerify: branchScopedOrders.filter((o) => o.paymentStatus === 'waiting_verification')
			.length,
		active: branchScopedOrders.filter(
			(o) => o.orderStatus === 'active_rental' || o.orderStatus === 'confirmed'
		).length,
		returnReq: branchScopedOrders.filter((o) => o.orderStatus === 'return_requested').length,
		returned: branchScopedOrders.filter((o) => o.orderStatus === 'returned').length
	});

	let filteredOrders = $derived.by(() => {
		const q = search.trim().toLowerCase();
		return branchScopedOrders.filter((order) => {
			if (statusTab === 'pending_payment' && order.orderStatus !== 'pending_payment') return false;
			if (statusTab === 'waiting_verification' && order.paymentStatus !== 'waiting_verification')
				return false;
			if (
				statusTab === 'active_rental' &&
				order.orderStatus !== 'active_rental' &&
				order.orderStatus !== 'confirmed'
			) {
				return false;
			}
			if (statusTab === 'return_requested' && order.orderStatus !== 'return_requested')
				return false;
			if (statusTab === 'returned' && order.orderStatus !== 'returned') return false;

			if (!q) return true;
			return (
				order.orderCode.toLowerCase().includes(q) ||
				order.customerName.toLowerCase().includes(q) ||
				order.customerPhone.toLowerCase().includes(q) ||
				order.customerEmail.toLowerCase().includes(q)
			);
		});
	});

	function showToast(message: string, variant: 'success' | 'error' | 'info' = 'success'): void {
		toastVariant = variant;
		toastMessage = message;
	}

	function openManageModal(order: AdminOrderWithItems): void {
		selectedOrder = order;
		editOrderStatus = order.orderStatus;
		editPaymentStatus = order.paymentStatus;
		editLateFee = order.lateFee;
		editReturnCondition = order.returnCondition ?? '';
		editPointsToAward = order.pointsAwardedAt
			? order.pointsEarned
			: calculateEarnedPoints(order.subtotalAmount, order.returnCondition);
		editReturnNotes = order.returnNotes ?? '';
		editItemReturns = order.items.map((line) => ({
			orderItemId: line.id,
			itemName: line.itemName,
			variant: line.variant,
			quantity: line.quantity,
			returnedQty: line.returnedQty,
			returnCondition:
				line.returnCondition === 'good' || line.returnCondition === 'damaged'
					? line.returnCondition
					: 'pending'
		}));
	}

	function markAllItemsReturnedGood(): void {
		editOrderStatus = 'returned';
		editReturnCondition = 'good';
		if (selectedOrder && !selectedOrder.pointsAwardedAt) {
			editPointsToAward = calculateEarnedPoints(selectedOrder.subtotalAmount, 'good');
		}
		editItemReturns = editItemReturns.map((row) => ({
			...row,
			returnedQty: row.quantity,
			returnCondition: 'good'
		}));
	}

	async function handleSaveOrder(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		if (!selectedOrder) return;
		saving = true;

		try {
			const response = await fetch(`/api/orders/${selectedOrder.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					orderStatus: editOrderStatus,
					paymentStatus: editPaymentStatus,
					lateFee: Math.max(0, Math.trunc(Number(editLateFee) || 0)),
					pointsToAward: selectedOrder.pointsAwardedAt
						? undefined
						: Math.max(0, Math.trunc(Number(editPointsToAward) || 0)),
					returnCondition: editReturnCondition || null,
					returnNotes: editReturnNotes.trim() || null,
					itemReturns: editItemReturns.map((row) => ({
						orderItemId: row.orderItemId,
						returnedQty: Math.max(0, Math.min(row.quantity, Math.trunc(Number(row.returnedQty) || 0))),
						returnCondition: row.returnCondition
					}))
				})
			});

			const result = (await response.json()) as ApiResponse<AdminOrderWithItems>;
			if (!response.ok || !result.success || !result.data) {
				showToast(result.message || 'Gagal memperbarui transaksi.', 'error');
				return;
			}

			const updated = result.data;
			orders = orders.map((row) => (row.id === updated.id ? updated : row));
			selectedOrder = null;
			showToast(result.message || `Transaksi ${updated.orderCode} berhasil diperbarui.`);
		} catch {
			showToast('Gangguan jaringan saat menyimpan perubahan transaksi.', 'error');
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>Transaksi &amp; Pengembalian — Admin CMS</title>
</svelte:head>

<div class="space-y-6">
	<header class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
		<div>
			<span
				class="inline-flex rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-[11px] font-bold tracking-widest text-neutral-300 uppercase"
			>
				{data.isSuperAdmin
					? 'Operasional Sewa · Semua Cabang'
					: `Operasional Sewa · ${data.assignedBranch?.name ?? 'Cabang'}`}
			</span>
			<h1 class="mt-3 text-3xl font-extrabold tracking-tight text-white">
				Transaksi &amp; Pengembalian
			</h1>
			<p class="mt-1 text-sm text-neutral-400">
				{#if data.isSuperAdmin}
					Verifikasi pembayaran, pantau transaksi seluruh cabang, dan catat pengembalian unit.
				{:else}
					Khusus transaksi {data.assignedBranch?.name ?? 'cabang Anda'} — data cabang lain terpisah
					secara otomatis.
				{/if}
			</p>
		</div>

		{#if data.isSuperAdmin && data.branches.length > 0}
			<div class="flex flex-wrap gap-1.5">
				<button
					type="button"
					onclick={() => (branchFilter = 'all')}
					class="rounded-full px-4 py-1.5 text-xs font-bold transition {branchFilter === 'all'
						? 'bg-white text-black'
						: 'border border-white/20 bg-[#0c0c0f] text-neutral-300 hover:border-white hover:text-white'}"
				>
					Semua Cabang ({orders.length})
				</button>
				{#each data.branches as br (br.id)}
					<button
						type="button"
						onclick={() => (branchFilter = br.id)}
						class="rounded-full px-4 py-1.5 text-xs font-bold transition {branchFilter === br.id
							? 'bg-emerald-400 text-black'
							: 'border border-white/20 bg-[#0c0c0f] text-neutral-300 hover:border-white hover:text-white'}"
					>
						📍 {br.name} ({orders.filter((o) => o.branchId === br.id).length})
					</button>
				{/each}
			</div>
		{/if}
	</header>

	<!-- Stats -->
	<div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
		<div class="rounded-[2rem] border border-white/15 bg-[#0c0c0f] p-5">
			<p class="text-xs font-semibold text-neutral-400">Total Transaksi</p>
			<p class="mt-2 text-3xl font-extrabold text-white">{counts.all}</p>
		</div>
		<div class="rounded-[2rem] border border-white/15 bg-[#0c0c0f] p-5">
			<p class="text-xs font-semibold text-neutral-400">Verifikasi Bayar</p>
			<p class="mt-2 text-3xl font-extrabold text-sky-400">{counts.waitingVerify}</p>
		</div>
		<div class="rounded-[2rem] border border-white/15 bg-[#0c0c0f] p-5">
			<p class="text-xs font-semibold text-neutral-400">Sedang Disewa</p>
			<p class="mt-2 text-3xl font-extrabold text-indigo-400">{counts.active}</p>
		</div>
		<div class="rounded-[2rem] border border-white/15 bg-[#0c0c0f] p-5">
			<p class="text-xs font-semibold text-neutral-400">Ajukan Kembali / Selesai</p>
			<p class="mt-2 text-3xl font-extrabold text-emerald-400">
				{counts.returnReq} / {counts.returned}
			</p>
		</div>
	</div>

	<!-- Search & Filter -->
	<div
		class="flex flex-col gap-3 rounded-[2rem] border border-white/15 bg-[#0c0c0f] p-4 lg:flex-row lg:items-center lg:justify-between"
	>
		<input
			type="search"
			bind:value={search}
			placeholder="Cari kode pesanan, nama pemesan, atau No HP..."
			class="w-full rounded-full border border-white/20 bg-black px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-white focus:outline-none lg:max-w-xs"
		/>

		<div class="flex flex-wrap gap-1.5">
			{#each [
				{ id: 'all', label: 'Semua' },
				{ id: 'pending_payment', label: 'Belum Bayar' },
				{ id: 'waiting_verification', label: 'Verifikasi Bayar' },
				{ id: 'active_rental', label: 'Aktif / Disewa' },
				{ id: 'return_requested', label: 'Ajukan Kembali' },
				{ id: 'returned', label: 'Selesai' }
			] as tab (tab.id)}
				<button
					type="button"
					onclick={() =>
						(statusTab = tab.id as
							| 'all'
							| 'pending_payment'
							| 'waiting_verification'
							| 'active_rental'
							| 'return_requested'
							| 'returned')}
					class="rounded-full px-3.5 py-1.5 text-xs font-bold transition {statusTab === tab.id
						? 'bg-white text-black'
						: 'border border-white/15 bg-black text-neutral-300 hover:border-white/40 hover:text-white'}"
				>
					{tab.label}
				</button>
			{/each}
		</div>
	</div>

	<!-- Table -->
	{#if filteredOrders.length > 0}
		<div class="overflow-hidden rounded-[2rem] border border-white/15 bg-[#0c0c0f]">
			<div class="overflow-x-auto">
				<table class="w-full text-left text-sm">
					<thead class="border-b border-white/10 bg-black/60 text-xs text-neutral-400">
						<tr>
							<th class="px-5 py-3.5 font-semibold">Kode &amp; Pemesan</th>
							<th class="px-4 py-3.5 font-semibold">Jadwal Sewa / Kembali</th>
							<th class="px-4 py-3.5 font-semibold">Total &amp; Pembayaran</th>
							<th class="px-4 py-3.5 font-semibold">Status Sewa</th>
							<th class="px-5 py-3.5 text-right font-semibold">Aksi</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-white/10">
						{#each filteredOrders as order (order.id)}
							{@const orderMeta = getOrderStatusMeta(order.orderStatus)}
							{@const payMeta = getPaymentStatusMeta(order.paymentStatus)}
							<tr class="transition hover:bg-white/[0.03]">
								<td class="px-5 py-4">
									<div class="flex flex-wrap items-center gap-1.5">
										<p class="font-mono text-xs font-extrabold text-white">{order.orderCode}</p>
										{#if order.branchName}
											<span
												class="rounded-full border border-emerald-400/30 bg-emerald-400/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300"
											>
												{order.branchName}
											</span>
										{/if}
									</div>
									<p class="mt-0.5 font-bold text-neutral-100">{order.customerName}</p>
									<p class="text-xs text-neutral-400">
										{order.customerPhone} · {order.items.length} jenis barang
									</p>
								</td>
								<td class="px-4 py-4 text-xs text-neutral-300">
									<p class="font-bold text-white">
										{formatDateId(order.startDate)} – {formatDateId(order.endDate)}
									</p>
									<p class="text-neutral-400">
										{order.durationDays} hari ·
										{order.deliveryMethod === 'delivery'
											? (order.deliveryRegion ?? 'Delivery')
											: 'Ambil di Kios'}
									</p>
								</td>
								<td class="px-4 py-4">
									<p class="text-xs font-extrabold text-white">
										{formatRupiah(order.totalAmount)}
									</p>
									<span
										class="mt-1 inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold {payMeta.badgeClass}"
									>
										{payMeta.label}
									</span>
								</td>
								<td class="px-4 py-4">
									<span
										class="inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-bold {orderMeta.badgeClass}"
									>
										{orderMeta.label}
									</span>
									{#if order.returnedAt}
										<p class="mt-1 text-[10px] font-semibold text-emerald-400">
											Kembali: {formatDateId(order.returnedAt)}
											{#if order.pointsEarned > 0}
												· ★ +{order.pointsEarned} Poin
											{/if}
										</p>
									{/if}
								</td>
								<td class="px-5 py-4 text-right">
									<div class="inline-flex items-center gap-2">
										<a
											href={`/invoice/${order.orderCode}`}
											target="_blank"
											rel="noopener noreferrer"
											class="rounded-full border border-white/20 bg-black px-3.5 py-1.5 text-xs font-bold text-neutral-200 transition hover:border-white hover:text-white"
										>
											Invoice
										</a>
										<button
											type="button"
											onclick={() => openManageModal(order)}
											class="rounded-full bg-white px-4 py-1.5 text-xs font-extrabold text-black transition hover:bg-neutral-200"
										>
											Kelola &amp; Kembali
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
			<p class="text-sm text-neutral-400">Belum ada transaksi penyewaan yang sesuai filter.</p>
		</div>
	{/if}
</div>

<Modal
	open={Boolean(selectedOrder)}
	title={selectedOrder ? `Kelola Pesanan ${selectedOrder.orderCode}` : 'Kelola Pesanan'}
	subtitle="Verifikasi pembayaran, update status sewa, dan catat pengembalian unit."
	onClose={() => (selectedOrder = null)}
>
	{#if selectedOrder}
		{@const payMethod = getPaymentMethodInfo(selectedOrder.paymentMethod)}
		<form onsubmit={handleSaveOrder} class="space-y-5">
			<!-- Ringkasan Pemesan -->
			<div class="grid gap-3 rounded-[1.5rem] border border-white/10 bg-black p-4 text-xs sm:grid-cols-2">
				<div>
					<p class="text-neutral-400">Pemesan</p>
					<p class="font-bold text-white">{selectedOrder.customerName}</p>
					<p class="text-neutral-300">{selectedOrder.customerPhone}</p>
					{#if selectedOrder.emergencyPhone}
						<p class="text-neutral-400">Darurat: {selectedOrder.emergencyPhone}</p>
					{/if}
				</div>
				<div>
					<p class="text-neutral-400">Pengiriman &amp; Pembayaran</p>
					{#if selectedOrder.branchName}
						<p class="font-bold text-emerald-400">📍 {selectedOrder.branchName}</p>
					{/if}
					<p class="font-bold text-white">
						{selectedOrder.deliveryMethod === 'delivery'
							? `Delivery (${selectedOrder.deliveryRegion ?? '-'})`
							: 'Ambil di Kios'}
					</p>
					{#if selectedOrder.deliveryAddress}
						<p class="text-neutral-300">{selectedOrder.deliveryAddress}</p>
					{/if}
					<p class="mt-1 font-bold text-neutral-200">
						{payMethod.label} · Total {formatRupiah(selectedOrder.totalAmount)}
					</p>
				</div>
				{#if selectedOrder.paymentProofNote}
					<div class="rounded-2xl border border-sky-400/30 bg-sky-400/15 p-3 text-sky-200 sm:col-span-2">
						<strong class="text-white">Catatan Bukti Bayar Pemesan:</strong>
						{selectedOrder.paymentProofNote}
					</div>
				{/if}
				{#if selectedOrder.returnRequestedAt}
					<div
						class="rounded-2xl border border-violet-400/30 bg-violet-500/15 p-3 text-violet-200 sm:col-span-2"
					>
						<strong class="text-white">Pengajuan Pengembalian:</strong>
						{selectedOrder.returnMethod === 'pickup_courier' ? 'Dijemput Kurir' : 'Antar ke Kios'}
						({formatDateTimeId(selectedOrder.returnRequestedAt)})
						{#if selectedOrder.returnNotes}
							— "{selectedOrder.returnNotes}"
						{/if}
					</div>
				{/if}
			</div>

			<!-- Status Pembayaran & Status Sewa -->
			<div class="grid gap-4 sm:grid-cols-2">
				<div>
					<label for="adm-pay-status" class="block text-xs font-semibold text-neutral-300">
						Status Pembayaran
					</label>
					<select
						id="adm-pay-status"
						bind:value={editPaymentStatus}
						class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2.5 text-sm text-white [color-scheme:dark] focus:border-white focus:outline-none"
					>
						<option value="unpaid" class="bg-neutral-950">Belum Dibayar</option>
						<option value="waiting_verification" class="bg-neutral-950">Menunggu Verifikasi</option>
						<option value="paid" class="bg-neutral-950">Lunas (Paid)</option>
						<option value="failed" class="bg-neutral-950">Gagal</option>
						<option value="refunded" class="bg-neutral-950">Refund</option>
					</select>
				</div>

				<div>
					<label for="adm-order-status" class="block text-xs font-semibold text-neutral-300">
						Status Penyewaan
					</label>
					<select
						id="adm-order-status"
						bind:value={editOrderStatus}
						class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2.5 text-sm text-white [color-scheme:dark] focus:border-white focus:outline-none"
					>
						<option value="pending_payment" class="bg-neutral-950">Menunggu Pembayaran</option>
						<option value="confirmed" class="bg-neutral-950">Terkonfirmasi / Siap Serah Terima</option>
						<option value="active_rental" class="bg-neutral-950">Sedang Disewa (Barang di Pemesan)</option>
						<option value="return_requested" class="bg-neutral-950">Pemesan Ajukan Pengembalian</option>
						<option value="returned" class="bg-neutral-950">Barang Kembali &amp; Selesai</option>
						<option value="cancelled" class="bg-neutral-950">Dibatalkan</option>
					</select>
				</div>
			</div>

			<!-- Verifikasi Pengembalian Per Barang -->
			<div class="space-y-3 rounded-[1.5rem] border border-white/15 bg-black/50 p-4">
				<div class="flex flex-wrap items-center justify-between gap-2">
					<h3 class="text-xs font-extrabold tracking-wider text-white uppercase">
						Checklist Pengembalian Unit
					</h3>
					<button
						type="button"
						onclick={markAllItemsReturnedGood}
						class="rounded-full bg-emerald-400 px-3.5 py-1 text-[11px] font-extrabold text-black hover:bg-emerald-300"
					>
						✓ Tandai Semua Sudah Kembali Baik
					</button>
				</div>

				<div class="space-y-2.5">
					{#each editItemReturns as row (row.orderItemId)}
						<div
							class="grid items-center gap-2 rounded-2xl border border-white/10 bg-[#121216] p-3 text-xs sm:grid-cols-12"
						>
							<div class="sm:col-span-6">
								<p class="font-bold text-white">{row.itemName}</p>
								<p class="text-[11px] text-neutral-400">
									Disewa: {row.quantity} unit
									{#if row.variant}
										· {row.variant}
									{/if}
								</p>
							</div>
							<div class="sm:col-span-3">
								<label class="block text-[10px] text-neutral-400">
									Kembali
									<input
										type="number"
										min="0"
										max={row.quantity}
										bind:value={row.returnedQty}
										class="mt-0.5 w-full rounded-xl border border-white/20 bg-black px-2.5 py-1.5 text-xs font-bold text-white"
									/>
								</label>
							</div>
							<div class="sm:col-span-3">
								<label class="block text-[10px] text-neutral-400">
									Kondisi
									<select
										bind:value={row.returnCondition}
										class="mt-0.5 w-full rounded-xl border border-white/20 bg-black px-2 py-1.5 text-xs text-white [color-scheme:dark]"
									>
										<option value="pending" class="bg-neutral-950">Belum</option>
										<option value="good" class="bg-neutral-950">Baik</option>
										<option value="damaged" class="bg-neutral-950">Rusak/Kurang</option>
									</select>
								</label>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Kondisi Umum, Denda & Catatan Pengembalian -->
			<div class="grid gap-4 sm:grid-cols-2">
				<div>
					<label for="adm-ret-cond" class="block text-xs font-semibold text-neutral-300">
						Hasil Cek Kondisi Pengembalian
					</label>
					<select
						id="adm-ret-cond"
						bind:value={editReturnCondition}
						class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2.5 text-sm text-white [color-scheme:dark] focus:border-white focus:outline-none"
					>
						<option value="" class="bg-neutral-950">-- Belum Dicek --</option>
						<option value="good" class="bg-neutral-950">Baik &amp; Lengkap</option>
						<option value="minor_issue" class="bg-neutral-950">Catatan Ringan</option>
						<option value="damaged" class="bg-neutral-950">Ada Kerusakan</option>
						<option value="missing_part" class="bg-neutral-950">Kelengkapan Kurang</option>
					</select>
				</div>

				<div>
					<label for="adm-late-fee" class="block text-xs font-semibold text-neutral-300">
						Denda Keterlambatan / Kerusakan (Rp)
					</label>
					<input
						id="adm-late-fee"
						type="number"
						min="0"
						step="5000"
						bind:value={editLateFee}
						class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2.5 text-sm text-white focus:border-white focus:outline-none"
					/>
				</div>
			</div>

			<div>
				<label for="adm-ret-notes" class="block text-xs font-semibold text-neutral-300">
					Catatan Serah Terima / Pengembalian
				</label>
				<textarea
					id="adm-ret-notes"
					rows="2"
					bind:value={editReturnNotes}
					placeholder="Catatan pemeriksaan barang saat dikembalikan..."
					class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-white focus:outline-none"
				></textarea>
			</div>

			<!-- Pengaturan Poin Sewa ke Rekening Penyewa -->
			<div class="rounded-[1.5rem] border border-amber-400/30 bg-amber-400/15 p-4">
				{#if selectedOrder.pointsAwardedAt}
					<p class="text-xs font-bold text-amber-300">
						★ +{selectedOrder.pointsEarned} Poin Sudah Masuk ke Rekening Poin Penyewa
					</p>
					<p class="mt-0.5 text-[11px] text-amber-200/80">
						Dikreditkan pada {formatDateTimeId(selectedOrder.pointsAwardedAt)}.
					</p>
				{:else}
					<div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
						<div>
							<label for="adm-pts-award" class="block text-xs font-bold text-amber-300">
								★ Poin Sewa Masuk ke Rekening Penyewa
							</label>
							<p class="mt-0.5 text-[11px] text-amber-200/80">
								Otomatis cair saat status disimpan sebagai
								<strong class="text-white">Barang Kembali &amp; Selesai</strong>.
							</p>
						</div>
						<input
							id="adm-pts-award"
							type="number"
							min="0"
							max="100000"
							bind:value={editPointsToAward}
							class="w-28 rounded-full border border-amber-400/40 bg-black px-4 py-2 text-center text-sm font-extrabold text-white focus:border-white focus:outline-none"
						/>
					</div>
				{/if}
			</div>

			<div class="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
				<button
					type="button"
					onclick={() => (selectedOrder = null)}
					class="rounded-full border border-white/20 bg-black px-5 py-2 text-xs font-bold text-neutral-300 hover:border-white hover:text-white"
				>
					Batal
				</button>
				<button
					type="submit"
					disabled={saving}
					class="rounded-full bg-white px-6 py-2.5 text-xs font-extrabold text-black hover:bg-neutral-200 disabled:opacity-60"
				>
					{saving ? 'Menyimpan...' : 'Simpan Status Transaksi'}
				</button>
			</div>
		</form>
	{/if}
</Modal>

<Toast message={toastMessage} variant={toastVariant} onDismiss={() => (toastMessage = null)} />
