<script lang="ts">
	import { goto } from '$app/navigation';
	import { authClient } from '#lib/auth-client';
	import { formatRupiah } from '#lib/utils/catalog';
	import {
		formatDateId,
		formatDateTimeId,
		getOrderStatusMeta,
		getPaymentMethodInfo,
		getPaymentStatusMeta
	} from '#lib/utils/orders';
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

	let statusFilter = $state<'all' | 'pending' | 'active' | 'return' | 'done'>('all');
	let showAllMutations = $state(false);
	let signingOut = $state(false);

	let pointAccountNo = $derived(formatPointAccountNumber(data.user.id));
	let pointWorthIdr = $derived(calculatePointDiscountIdr(data.points.balance));
	let visiblePointHistory = $derived(
		showAllMutations ? data.points.history : data.points.history.slice(0, 5)
	);

	let activeReturnReminders = $derived(
		data.orders.filter(
			(o) => o.orderStatus === 'active_rental' || o.orderStatus === 'return_requested'
		)
	);

	let filteredOrders = $derived.by(() => {
		return data.orders.filter((order) => {
			if (statusFilter === 'pending') {
				return order.orderStatus === 'pending_payment' || order.paymentStatus === 'unpaid';
			}
			if (statusFilter === 'active') {
				return order.orderStatus === 'confirmed' || order.orderStatus === 'active_rental';
			}
			if (statusFilter === 'return') {
				return order.orderStatus === 'return_requested';
			}
			if (statusFilter === 'done') {
				return order.orderStatus === 'returned';
			}
			return true;
		});
	});

	async function handleSignOut(): Promise<void> {
		signingOut = true;
		try {
			await authClient.signOut();
			await goto('/', { refreshAll: true });
		} finally {
			signingOut = false;
		}
	}
</script>

<svelte:head>
	<title>Dashboard Pemesan — {data.settings.companyName}</title>
</svelte:head>

<section class="bg-surface/60 py-12 pb-24 sm:py-16">
	<div class="mx-auto max-w-6xl px-6">
		<!-- Header Profil Pemesan -->
		<header class="flex flex-col justify-between gap-5 rounded-3xl border border-neutral-200/80 bg-white p-6 sm:flex-row sm:items-center sm:p-8">
			<div>
				<p class="text-xs font-semibold tracking-widest text-neutral-400 uppercase">
					Dashboard Pemesan
				</p>
				<h1 class="mt-1.5 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
					Halo, {data.user.name}
				</h1>
				<p class="mt-1 text-sm text-neutral-500">
					{data.user.email} · Pantau Rekening Poin, transaksi sewa &amp; pengembalian barang Anda.
				</p>
			</div>

			<div class="flex flex-wrap items-center gap-2.5">
				<a
					href="/katalog"
					class="rounded-full bg-neutral-950 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-neutral-800"
				>
					+ Sewa Barang Baru
				</a>
				{#if data.user.role === 'admin' || data.user.role === 'branch_admin'}
					<a
						href="/admin/orders"
						class="rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-xs font-semibold text-neutral-800 transition hover:border-neutral-950"
					>
						Admin Transaksi
					</a>
				{/if}
				<button
					type="button"
					disabled={signingOut}
					onclick={handleSignOut}
					class="rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-xs font-semibold text-neutral-600 transition hover:border-red-300 hover:text-red-600 disabled:opacity-60"
				>
					{signingOut ? 'Keluar...' : 'Keluar'}
				</button>
			</div>
		</header>

		<!-- Kartu Rekening Poin Sewa + Mutasi -->
		<section id="rekening-poin" class="mt-6 scroll-mt-24 grid gap-6 lg:grid-cols-12">
			<!-- Digital Point Account Card -->
			<div class="flex flex-col justify-between rounded-3xl bg-neutral-950 p-6 text-white sm:p-7 lg:col-span-5">
				<div>
					<div class="flex items-center justify-between gap-2">
						<span class="text-[11px] font-semibold tracking-widest text-amber-400 uppercase">
							★ Rekening Poin Sewa
						</span>
						<span class="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 font-mono text-[10px] text-neutral-300">
							{pointAccountNo}
						</span>
					</div>

					<p class="mt-5 text-xs text-neutral-400">Saldo Poin Aktif</p>
					<div class="mt-1 flex items-baseline gap-2.5">
						<p class="text-4xl font-bold tracking-tight text-white">
							{data.points.balance.toLocaleString('id-ID')}
						</p>
						<span class="text-sm font-semibold text-amber-400">Poin</span>
					</div>
					<p class="mt-1 text-xs text-neutral-300">
						Setara potongan <strong class="text-white">{formatRupiah(pointWorthIdr)}</strong> untuk
						transaksi sewa berikutnya
					</p>
				</div>

				<div class="mt-6 space-y-3 border-t border-white/10 pt-4">
					<div class="grid grid-cols-2 gap-3 text-xs">
						<div class="rounded-2xl bg-white/5 p-3">
							<p class="text-[10px] text-neutral-400 uppercase">Total Poin Masuk</p>
							<p class="mt-1 text-base font-bold text-emerald-400">+{data.points.totalEarned}</p>
						</div>
						<div class="rounded-2xl bg-white/5 p-3">
							<p class="text-[10px] text-neutral-400 uppercase">Total Poin Dipakai</p>
							<p class="mt-1 text-base font-bold text-amber-300">−{data.points.totalRedeemed}</p>
						</div>
					</div>
					<p class="text-[11px] leading-relaxed text-neutral-400">
						Dapatkan <strong class="text-neutral-200">+1 Poin setiap {formatRupiah(POINT_EARN_UNIT_IDR)}</strong>
						nilai sewa secara otomatis setelah barang selesai dikembalikan dalam kondisi baik.
						1 Poin = {formatRupiah(POINT_VALUE_IDR)}.
					</p>
				</div>
			</div>

			<!-- Buku Mutasi Rekening Poin -->
			<div class="flex flex-col rounded-3xl border border-neutral-200/80 bg-white p-6 lg:col-span-7">
				<div class="flex flex-wrap items-center justify-between gap-2">
					<div>
						<h2 class="text-base font-bold tracking-tight text-neutral-950">
							Mutasi Rekening Poin
						</h2>
						<p class="text-xs text-neutral-500">
							Riwayat poin masuk dari pengembalian barang &amp; pemakaian potongan checkout.
						</p>
					</div>
					{#if data.points.balance > 0}
						<a
							href="/katalog"
							class="rounded-full bg-amber-50 px-3.5 py-1.5 text-xs font-semibold text-amber-900 transition hover:bg-amber-100"
						>
							Pakai Poin di Sewa Berikutnya →
						</a>
					{/if}
				</div>

				{#if visiblePointHistory.length > 0}
					<div class="mt-4 flex-1 overflow-x-auto">
						<table class="w-full text-left text-xs">
							<thead class="border-b border-neutral-100 text-[11px] text-neutral-400">
								<tr>
									<th class="py-2 pr-3 font-medium">Waktu &amp; Keterangan</th>
									<th class="px-2 py-2 font-medium">Jenis</th>
									<th class="px-2 py-2 text-right font-medium">Mutasi</th>
									<th class="py-2 pl-2 text-right font-medium">Saldo</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-neutral-100">
								{#each visiblePointHistory as tx (tx.id)}
									{@const meta = getPointTxMeta(tx.type)}
									<tr>
										<td class="py-3 pr-3">
											<p class="font-medium text-neutral-900">{tx.description}</p>
											<p class="mt-0.5 text-[11px] text-neutral-400">
												{formatDateTimeId(tx.createdAt)}
												{#if tx.orderCode}
													·
													<a
														href={`/akun/pesanan/${tx.orderCode}`}
														class="font-mono text-neutral-600 underline"
													>
														{tx.orderCode}
													</a>
												{/if}
											</p>
										</td>
										<td class="px-2 py-3">
											<span
												class="inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold {meta.badgeClass}"
											>
												{meta.label}
											</span>
										</td>
										<td
											class="px-2 py-3 text-right font-mono font-bold {tx.points >= 0
												? 'text-emerald-600'
												: 'text-amber-700'}"
										>
											{tx.points >= 0 ? `+${tx.points}` : tx.points}
										</td>
										<td class="py-3 pl-2 text-right font-mono font-semibold text-neutral-700">
											{tx.balanceAfter}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>

					{#if data.points.history.length > 5}
						<div class="mt-3 border-t border-neutral-100 pt-3 text-center">
							<button
								type="button"
								onclick={() => (showAllMutations = !showAllMutations)}
								class="text-xs font-semibold text-neutral-600 hover:text-neutral-950"
							>
								{showAllMutations
									? 'Tampilkan lebih ringkas'
									: `Lihat semua ${data.points.history.length} mutasi poin`}
							</button>
						</div>
					{/if}
				{:else}
					<div class="mt-4 flex flex-1 flex-col items-center justify-center rounded-2xl bg-surface p-8 text-center">
						<p class="text-sm font-semibold text-neutral-800">Belum ada mutasi Rekening Poin</p>
						<p class="mt-1 max-w-sm text-xs text-neutral-500">
							Selesaikan penyewaan dan kembalikan barang dalam kondisi baik untuk langsung mendapat
							poin pertama Anda!
						</p>
					</div>
				{/if}
			</div>
		</section>

		<!-- KPI Cards Transaksi -->
		<div class="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
			<div class="rounded-3xl border border-neutral-200/80 bg-white p-5">
				<p class="text-xs font-medium text-neutral-400">Total Transaksi</p>
				<p class="mt-2 text-3xl font-bold tracking-tight text-neutral-950">
					{data.stats.totalOrders}
				</p>
				<p class="mt-1 text-xs text-neutral-500">Riwayat seluruh pesanan sewa</p>
			</div>

			<div class="rounded-3xl border border-neutral-200/80 bg-white p-5">
				<p class="text-xs font-medium text-neutral-400">Menunggu Bayar</p>
				<p class="mt-2 text-3xl font-bold tracking-tight text-amber-600">
					{data.stats.pendingPayment}
				</p>
				<p class="mt-1 text-xs text-neutral-500">Perlu konfirmasi pembayaran</p>
			</div>

			<div class="rounded-3xl border border-neutral-200/80 bg-white p-5">
				<p class="text-xs font-medium text-neutral-400">Sedang Disewa</p>
				<p class="mt-2 text-3xl font-bold tracking-tight text-indigo-600">
					{data.stats.activeRentals + data.stats.returnInProgress}
				</p>
				<p class="mt-1 text-xs text-neutral-500">
					{data.stats.returnInProgress > 0
						? `${data.stats.returnInProgress} dalam proses pengembalian`
						: 'Unit aktif / perlu dikembalikan'}
				</p>
			</div>

			<div class="rounded-3xl border border-neutral-200/80 bg-white p-5">
				<p class="text-xs font-medium text-neutral-400">Selesai Dikembalikan</p>
				<p class="mt-2 text-3xl font-bold tracking-tight text-emerald-600">
					{data.stats.completedReturned}
				</p>
				<p class="mt-1 text-xs text-neutral-500">Barang kembali &amp; poin masuk</p>
			</div>
		</div>

		<!-- Alert Jadwal Pengembalian Aktif -->
		{#if activeReturnReminders.length > 0}
			<div class="mt-6 rounded-3xl border border-indigo-200/80 bg-indigo-50/70 p-5 sm:p-6">
				<p class="text-xs font-semibold tracking-wider text-indigo-800 uppercase">
					Jadwal Pengembalian Barang Aktif
				</p>
				<div class="mt-3 space-y-2.5">
					{#each activeReturnReminders as activeOrder (activeOrder.id)}
						<div class="flex flex-col justify-between gap-3 rounded-2xl bg-white p-4 sm:flex-row sm:items-center">
							<div>
								<p class="text-sm font-bold text-neutral-950">
									{activeOrder.orderCode}
									{#if activeOrder.branchName}
										<span
											class="ml-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700"
										>
											📍 {activeOrder.branchName}
										</span>
									{/if}
									<span class="ml-1.5 font-normal text-neutral-500">
										({activeOrder.items.length} jenis barang)
									</span>
								</p>
								<p class="mt-0.5 text-xs text-neutral-600">
									Batas pengembalian:
									<strong class="text-indigo-700">{formatDateId(activeOrder.endDate)}</strong>
									{#if activeOrder.orderStatus === 'return_requested'}
										· <span class="font-semibold text-violet-700">Pengembalian sudah diajukan</span>
									{/if}
								</p>
							</div>
							<a
								href={`/akun/pesanan/${activeOrder.orderCode}`}
								class="inline-flex shrink-0 items-center justify-center rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
							>
								{activeOrder.orderStatus === 'return_requested'
									? 'Pantau Pengembalian →'
									: 'Ajukan Pengembalian →'}
							</a>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Filter & Daftar Transaksi -->
		<div class="mt-8">
			<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
				<h2 class="text-lg font-bold tracking-tight text-neutral-950">
					Riwayat Transaksi &amp; Pengembalian
				</h2>

				<div class="flex flex-wrap gap-1.5">
					{#each [
						{ id: 'all', label: `Semua (${data.orders.length})` },
						{ id: 'pending', label: 'Menunggu Bayar' },
						{ id: 'active', label: 'Aktif / Disewa' },
						{ id: 'return', label: 'Proses Kembali' },
						{ id: 'done', label: 'Selesai' }
					] as tab (tab.id)}
						<button
							type="button"
							onclick={() =>
								(statusFilter = tab.id as 'all' | 'pending' | 'active' | 'return' | 'done')}
							class="rounded-full px-3.5 py-1.5 text-xs font-semibold transition {statusFilter ===
							tab.id
								? 'bg-neutral-950 text-white'
								: 'border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400'}"
						>
							{tab.label}
						</button>
					{/each}
				</div>
			</div>

			{#if filteredOrders.length > 0}
				<div class="mt-5 space-y-4">
					{#each filteredOrders as order (order.id)}
						{@const orderMeta = getOrderStatusMeta(order.orderStatus)}
						{@const payMeta = getPaymentStatusMeta(order.paymentStatus)}
						{@const payMethod = getPaymentMethodInfo(order.paymentMethod)}
						<div
							class="rounded-3xl border border-neutral-200/80 bg-white p-5 transition hover:border-neutral-300 sm:p-6"
						>
							<div class="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-100 pb-4">
								<div>
									<div class="flex flex-wrap items-center gap-2">
										<span class="font-mono text-sm font-bold text-neutral-950">
											{order.orderCode}
										</span>
										{#if order.branchName}
											<span
												class="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800"
											>
												📍 {order.branchName}
											</span>
										{/if}
										<span
											class="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold {orderMeta.badgeClass}"
										>
											{orderMeta.label}
										</span>
										<span
											class="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold {payMeta.badgeClass}"
										>
											Bayar: {payMeta.label}
										</span>
										{#if order.pointsEarned > 0}
											<span
												class="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800"
											>
												★ +{order.pointsEarned} Poin
											</span>
										{/if}
									</div>
									<p class="mt-1 text-xs text-neutral-500">
										Jadwal sewa:
										<strong class="text-neutral-800">
											{formatDateId(order.startDate)} – {formatDateId(order.endDate)}
										</strong>
										({order.durationDays} hari) · {payMethod.label}
									</p>
								</div>

								<div class="text-left sm:text-right">
									<p class="text-[11px] text-neutral-400">Total Transaksi</p>
									<p class="text-lg font-bold text-neutral-950">{formatRupiah(order.totalAmount)}</p>
								</div>
							</div>

							<div class="mt-4 space-y-2">
								{#each order.items.slice(0, 3) as line (line.id)}
									<div class="flex items-center justify-between gap-3 text-sm">
										<div class="min-w-0">
											<span class="font-medium text-neutral-900">{line.itemName}</span>
											{#if line.variant}
												<span class="ml-1.5 text-xs text-neutral-500">({line.variant})</span>
											{/if}
											<span class="ml-1.5 text-xs text-neutral-400">× {line.quantity} unit</span>
										</div>
										<span class="shrink-0 text-xs font-semibold text-neutral-700">
											{formatRupiah(line.lineTotal)}
										</span>
									</div>
								{/each}
								{#if order.items.length > 3}
									<p class="text-xs text-neutral-400">
										+ {order.items.length - 3} barang lainnya dalam pesanan ini
									</p>
								{/if}
							</div>

							<div class="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 pt-4">
								<div class="text-xs text-neutral-500">
									{#if order.orderStatus === 'returned'}
										<span class="font-semibold text-emerald-700">
											✓ Dikembalikan {formatDateId(order.returnedAt)}
											{#if order.pointsEarned > 0}
												· +{order.pointsEarned} Poin masuk rekening
											{/if}
										</span>
									{:else if order.orderStatus === 'return_requested'}
										<span class="font-semibold text-violet-700">
											⏳ Pengembalian diajukan ({order.returnMethod === 'pickup_courier'
												? 'Dijemput Kurir'
												: 'Antar ke Kios'})
										</span>
									{:else if order.orderStatus !== 'cancelled'}
										<span>
											Jatuh tempo pengembalian:
											<strong class="text-neutral-800">{formatDateId(order.endDate)}</strong>
										</span>
									{/if}
								</div>

								<a
									href={`/akun/pesanan/${order.orderCode}`}
									class="inline-flex items-center gap-1.5 rounded-full bg-neutral-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-neutral-800"
								>
									Detail, Bayar &amp; Pengembalian →
								</a>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="mt-5 rounded-3xl border border-neutral-200/80 bg-white p-14 text-center">
					<p class="text-base font-semibold text-neutral-950">Belum ada transaksi penyewaan</p>
					<p class="mt-1.5 text-sm text-neutral-500">
						Pilih barang di katalog, masukkan ke keranjang, dan lakukan checkout untuk mulai menyewa.
					</p>
					<a
						href="/katalog"
						class="mt-6 inline-flex rounded-full bg-neutral-950 px-6 py-3 text-xs font-semibold text-white"
					>
						Jelajahi Katalog Barang
					</a>
				</div>
			{/if}
		</div>
	</div>
</section>
