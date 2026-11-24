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
	let statusTab = $state<
		'all' | 'pending_payment' | 'waiting_verification' | 'active_rental' | 'return_requested' | 'returned'
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

	let counts = $derived({
		all: orders.length,
		waitingVerify: orders.filter((o) => o.paymentStatus === 'waiting_verification').length,
		active: orders.filter((o) => o.orderStatus === 'active_rental' || o.orderStatus === 'confirmed')
			.length,
		returnReq: orders.filter((o) => o.orderStatus === 'return_requested').length,
		returned: orders.filter((o) => o.orderStatus === 'returned').length
	});

	let filteredOrders = $derived.by(() => {
		const q = search.trim().toLowerCase();
		return orders.filter((order) => {
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
			<p class="text-xs font-semibold tracking-widest text-neutral-400 uppercase">
				Operasional Sewa
			</p>
			<h1 class="mt-1 text-3xl font-semibold tracking-tight text-neutral-950">
				Transaksi &amp; Pengembalian
			</h1>
			<p class="mt-1 text-sm text-neutral-500">
				Verifikasi pembayaran pemesan, pantau barang yang sedang disewa, dan catat pengembalian unit.
			</p>
		</div>
	</header>

	<!-- Stats -->
	<div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
		<div class="rounded-3xl border border-neutral-200/80 bg-white p-5">
			<p class="text-xs font-medium text-neutral-400">Total Transaksi</p>
			<p class="mt-2 text-2xl font-bold text-neutral-950">{counts.all}</p>
		</div>
		<div class="rounded-3xl border border-neutral-200/80 bg-white p-5">
			<p class="text-xs font-medium text-neutral-400">Verifikasi Bayar</p>
			<p class="mt-2 text-2xl font-bold text-sky-600">{counts.waitingVerify}</p>
		</div>
		<div class="rounded-3xl border border-neutral-200/80 bg-white p-5">
			<p class="text-xs font-medium text-neutral-400">Sedang Disewa</p>
			<p class="mt-2 text-2xl font-bold text-indigo-600">{counts.active}</p>
		</div>
		<div class="rounded-3xl border border-neutral-200/80 bg-white p-5">
			<p class="text-xs font-medium text-neutral-400">Ajukan Kembali / Selesai</p>
			<p class="mt-2 text-2xl font-bold text-emerald-600">
				{counts.returnReq} / {counts.returned}
			</p>
		</div>
	</div>

	<!-- Search & Filter -->
	<div
		class="flex flex-col gap-3 rounded-3xl border border-neutral-200/80 bg-white p-4 lg:flex-row lg:items-center lg:justify-between"
	>
		<input
			type="search"
			bind:value={search}
			placeholder="Cari kode pesanan, nama pemesan, atau No HP..."
			class="w-full rounded-full border border-neutral-200 bg-surface px-4 py-2 text-sm focus:border-neutral-950 focus:bg-white focus:outline-none lg:max-w-xs"
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
					class="rounded-full px-3.5 py-1.5 text-xs font-medium transition {statusTab === tab.id
						? 'bg-neutral-950 text-white'
						: 'bg-surface text-neutral-600 hover:text-neutral-950'}"
				>
					{tab.label}
				</button>
			{/each}
		</div>
	</div>

	<!-- Table -->
	{#if filteredOrders.length > 0}
		<div class="overflow-hidden rounded-3xl border border-neutral-200/80 bg-white">
			<div class="overflow-x-auto">
				<table class="w-full text-left text-sm">
					<thead class="border-b border-neutral-100 bg-neutral-50/70 text-xs text-neutral-500">
						<tr>
							<th class="px-5 py-3.5 font-medium">Kode &amp; Pemesan</th>
							<th class="px-4 py-3.5 font-medium">Jadwal Sewa / Kembali</th>
							<th class="px-4 py-3.5 font-medium">Total &amp; Pembayaran</th>
							<th class="px-4 py-3.5 font-medium">Status Sewa</th>
							<th class="px-5 py-3.5 text-right font-medium">Aksi</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-neutral-100">
						{#each filteredOrders as order (order.id)}
							{@const orderMeta = getOrderStatusMeta(order.orderStatus)}
							{@const payMeta = getPaymentStatusMeta(order.paymentStatus)}
							<tr class="transition hover:bg-neutral-50/60">
								<td class="px-5 py-4">
									<p class="font-mono text-xs font-bold text-neutral-950">{order.orderCode}</p>
									<p class="mt-0.5 font-medium text-neutral-900">{order.customerName}</p>
									<p class="text-xs text-neutral-500">
										{order.customerPhone} · {order.items.length} jenis barang
									</p>
								</td>
								<td class="px-4 py-4 text-xs text-neutral-600">
									<p class="font-medium text-neutral-900">
										{formatDateId(order.startDate)} – {formatDateId(order.endDate)}
									</p>
									<p class="text-neutral-400">
										{order.durationDays} hari ·
										{order.deliveryMethod === 'delivery'
											? order.deliveryRegion ?? 'Delivery'
											: 'Ambil di Kios'}
									</p>
								</td>
								<td class="px-4 py-4">
									<p class="text-xs font-bold text-neutral-950">
										{formatRupiah(order.totalAmount)}
									</p>
									<span
										class="mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold {payMeta.badgeClass}"
									>
										{payMeta.label}
									</span>
								</td>
								<td class="px-4 py-4">
									<span
										class="inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-semibold {orderMeta.badgeClass}"
									>
										{orderMeta.label}
									</span>
									{#if order.returnedAt}
										<p class="mt-1 text-[10px] text-emerald-700">
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
											class="rounded-full border border-neutral-200 px-3.5 py-1.5 text-xs font-semibold text-neutral-700 transition hover:border-neutral-950 hover:text-neutral-950"
										>
											Invoice
										</a>
										<button
											type="button"
											onclick={() => openManageModal(order)}
											class="rounded-full bg-neutral-950 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-neutral-800"
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
		<div class="rounded-3xl border border-neutral-200/80 bg-white p-14 text-center">
			<p class="text-sm text-neutral-500">Belum ada transaksi penyewaan yang sesuai filter.</p>
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
			<div class="grid gap-3 rounded-2xl bg-surface p-4 text-xs sm:grid-cols-2">
				<div>
					<p class="text-neutral-400">Pemesan</p>
					<p class="font-semibold text-neutral-950">{selectedOrder.customerName}</p>
					<p class="text-neutral-600">{selectedOrder.customerPhone}</p>
					{#if selectedOrder.emergencyPhone}
						<p class="text-neutral-500">Darurat: {selectedOrder.emergencyPhone}</p>
					{/if}
				</div>
				<div>
					<p class="text-neutral-400">Pengiriman &amp; Pembayaran</p>
					<p class="font-semibold text-neutral-950">
						{selectedOrder.deliveryMethod === 'delivery'
							? `Delivery (${selectedOrder.deliveryRegion ?? '-'})`
							: 'Ambil di Kios'}
					</p>
					{#if selectedOrder.deliveryAddress}
						<p class="text-neutral-600">{selectedOrder.deliveryAddress}</p>
					{/if}
					<p class="mt-1 font-medium text-neutral-800">
						{payMethod.label} · Total {formatRupiah(selectedOrder.totalAmount)}
					</p>
				</div>
				{#if selectedOrder.paymentProofNote}
					<div class="rounded-xl border border-sky-200 bg-sky-50 p-3 text-sky-900 sm:col-span-2">
						<strong>Catatan Bukti Bayar Pemesan:</strong> {selectedOrder.paymentProofNote}
					</div>
				{/if}
				{#if selectedOrder.returnRequestedAt}
					<div class="rounded-xl border border-violet-200 bg-violet-50 p-3 text-violet-900 sm:col-span-2">
						<strong>Pengajuan Pengembalian:</strong>
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
					<label for="adm-pay-status" class="block text-xs font-semibold text-neutral-700">
						Status Pembayaran
					</label>
					<select
						id="adm-pay-status"
						bind:value={editPaymentStatus}
						class="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm focus:border-neutral-950 focus:outline-none"
					>
						<option value="unpaid">Belum Dibayar</option>
						<option value="waiting_verification">Menunggu Verifikasi</option>
						<option value="paid">Lunas (Paid)</option>
						<option value="failed">Gagal</option>
						<option value="refunded">Refund</option>
					</select>
				</div>

				<div>
					<label for="adm-order-status" class="block text-xs font-semibold text-neutral-700">
						Status Penyewaan
					</label>
					<select
						id="adm-order-status"
						bind:value={editOrderStatus}
						class="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm focus:border-neutral-950 focus:outline-none"
					>
						<option value="pending_payment">Menunggu Pembayaran</option>
						<option value="confirmed">Terkonfirmasi / Siap Serah Terima</option>
						<option value="active_rental">Sedang Disewa (Barang di Pemesan)</option>
						<option value="return_requested">Pemesan Ajukan Pengembalian</option>
						<option value="returned">Barang Kembali &amp; Selesai</option>
						<option value="cancelled">Dibatalkan</option>
					</select>
				</div>
			</div>

			<!-- Verifikasi Pengembalian Per Barang -->
			<div class="space-y-3 rounded-2xl border border-neutral-200 p-4">
				<div class="flex flex-wrap items-center justify-between gap-2">
					<h3 class="text-xs font-bold tracking-wider text-neutral-900 uppercase">
						Checklist Pengembalian Unit
					</h3>
					<button
						type="button"
						onclick={markAllItemsReturnedGood}
						class="rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-emerald-500"
					>
						✓ Tandai Semua Sudah Kembali Baik
					</button>
				</div>

				<div class="space-y-2.5">
					{#each editItemReturns as row (row.orderItemId)}
						<div class="grid items-center gap-2 rounded-xl bg-surface p-3 text-xs sm:grid-cols-12">
							<div class="sm:col-span-6">
								<p class="font-semibold text-neutral-950">{row.itemName}</p>
								<p class="text-[11px] text-neutral-500">
									Disewa: {row.quantity} unit
									{#if row.variant}
										· {row.variant}
									{/if}
								</p>
							</div>
							<div class="sm:col-span-3">
								<label class="block text-[10px] text-neutral-500">
									Kembali
									<input
										type="number"
										min="0"
										max={row.quantity}
										bind:value={row.returnedQty}
										class="mt-0.5 w-full rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs font-semibold"
									/>
								</label>
							</div>
							<div class="sm:col-span-3">
								<label class="block text-[10px] text-neutral-500">
									Kondisi
									<select
										bind:value={row.returnCondition}
										class="mt-0.5 w-full rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs"
									>
										<option value="pending">Belum</option>
										<option value="good">Baik</option>
										<option value="damaged">Rusak/Kurang</option>
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
					<label for="adm-ret-cond" class="block text-xs font-semibold text-neutral-700">
						Hasil Cek Kondisi Pengembalian
					</label>
					<select
						id="adm-ret-cond"
						bind:value={editReturnCondition}
						class="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm focus:border-neutral-950 focus:outline-none"
					>
						<option value="">-- Belum Dicek --</option>
						<option value="good">Baik &amp; Lengkap</option>
						<option value="minor_issue">Catatan Ringan</option>
						<option value="damaged">Ada Kerusakan</option>
						<option value="missing_part">Kelengkapan Kurang</option>
					</select>
				</div>

				<div>
					<label for="adm-late-fee" class="block text-xs font-semibold text-neutral-700">
						Denda Keterlambatan / Kerusakan (Rp)
					</label>
					<input
						id="adm-late-fee"
						type="number"
						min="0"
						step="5000"
						bind:value={editLateFee}
						class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-neutral-950 focus:outline-none"
					/>
				</div>
			</div>

			<div>
				<label for="adm-ret-notes" class="block text-xs font-semibold text-neutral-700">
					Catatan Serah Terima / Pengembalian
				</label>
				<textarea
					id="adm-ret-notes"
					rows="2"
					bind:value={editReturnNotes}
					placeholder="Catatan pemeriksaan barang saat dikembalikan..."
					class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-neutral-950 focus:outline-none"
				></textarea>
			</div>

			<!-- Pengaturan Poin Sewa ke Rekening Penyewa -->
			<div class="rounded-2xl border border-amber-200/90 bg-amber-50/70 p-4">
				{#if selectedOrder.pointsAwardedAt}
					<p class="text-xs font-bold text-amber-950">
						★ +{selectedOrder.pointsEarned} Poin Sudah Masuk ke Rekening Poin Penyewa
					</p>
					<p class="mt-0.5 text-[11px] text-amber-800">
						Dikreditkan pada {formatDateTimeId(selectedOrder.pointsAwardedAt)}.
					</p>
				{:else}
					<div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
						<div>
							<label for="adm-pts-award" class="block text-xs font-bold text-amber-950">
								★ Poin Sewa Masuk ke Rekening Penyewa
							</label>
							<p class="mt-0.5 text-[11px] text-amber-800">
								Otomatis cair saat status disimpan sebagai <strong>Barang Kembali &amp; Selesai</strong>.
							</p>
						</div>
						<input
							id="adm-pts-award"
							type="number"
							min="0"
							max="100000"
							bind:value={editPointsToAward}
							class="w-28 rounded-xl border border-amber-300 bg-white px-3 py-2 text-sm font-bold text-neutral-950 focus:border-neutral-950 focus:outline-none"
						/>
					</div>
				{/if}
			</div>

			<div class="flex items-center justify-end gap-3 border-t border-neutral-100 pt-4">
				<button
					type="button"
					onclick={() => (selectedOrder = null)}
					class="rounded-full border border-neutral-200 px-5 py-2 text-xs font-semibold text-neutral-700"
				>
					Batal
				</button>
				<button
					type="submit"
					disabled={saving}
					class="rounded-full bg-neutral-950 px-6 py-2.5 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"
				>
					{saving ? 'Menyimpan...' : 'Simpan Status Transaksi'}
				</button>
			</div>
		</form>
	{/if}
</Modal>

<Toast message={toastMessage} variant={toastVariant} onDismiss={() => (toastMessage = null)} />
