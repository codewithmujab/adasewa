<script lang="ts">
	import InvoiceSheet from '#lib/components/invoice/InvoiceSheet.svelte';
	import Toast from '#lib/components/ui/Toast.svelte';
	import type { RentalOrder, RentalOrderItem } from '#lib/server/db/schema';
	import type { ApiResponse } from '#lib/types/api';
	import { buildBranchWhatsAppUrl, formatRupiah } from '#lib/utils/catalog';
	import {
		formatDateId,
		formatDateTimeId,
		getOrderStatusMeta,
		getPaymentMethodInfo,
		getPaymentStatusMeta,
		getReturnConditionLabel
	} from '#lib/utils/orders';
	import { calculateEarnedPoints } from '#lib/utils/points';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let orderOverride = $state<RentalOrder | null>(null);
	let itemsOverride = $state<RentalOrderItem[] | null>(null);
	let order = $derived(orderOverride ?? data.order);
	let items = $derived(itemsOverride ?? data.items);

	// Form konfirmasi pembayaran
	let paymentProofNote = $state('');
	let submittingPayment = $state(false);

	// Form pengajuan pengembalian barang
	let returnMethod = $state<'pickup_courier' | 'drop_off_kios'>('pickup_courier');
	let returnNotes = $state('');
	let submittingReturn = $state(false);

	let toastMessage = $state<string | null>(null);
	let toastVariant = $state<'success' | 'error' | 'info'>('success');

	$effect(() => {
		orderOverride = null;
		itemsOverride = null;
		returnMethod = data.order.deliveryMethod === 'pickup' ? 'drop_off_kios' : 'pickup_courier';
	});

	let orderMeta = $derived(getOrderStatusMeta(order.orderStatus));
	let payMeta = $derived(getPaymentStatusMeta(order.paymentStatus));
	let payMethod = $derived(getPaymentMethodInfo(order.paymentMethod));

	let currentStepIndex = $derived.by(() => {
		switch (order.orderStatus) {
			case 'pending_payment':
				return 1;
			case 'confirmed':
				return 2;
			case 'active_rental':
				return 3;
			case 'return_requested':
				return 4;
			case 'returned':
				return 5;
			default:
				return 0;
		}
	});

	let canRequestReturn = $derived(
		order.orderStatus === 'active_rental' || order.orderStatus === 'confirmed'
	);

	let whatsappConfirmUrl = $derived(
		buildBranchWhatsAppUrl(
			order.branchWhatsapp ? { whatsapp: order.branchWhatsapp } : null,
			data.settings,
			`Halo ${data.settings.companyName}${order.branchName ? ` (${order.branchName})` : ''}, saya ingin konfirmasi pesanan ${order.orderCode} atas nama ${order.customerName} (Total: ${formatRupiah(order.totalAmount)}).`
		)
	);

	function showToast(message: string, variant: 'success' | 'error' | 'info' = 'success'): void {
		toastVariant = variant;
		toastMessage = message;
	}

	async function handleConfirmPayment(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		submittingPayment = true;
		try {
			const response = await fetch(`/api/orders/${order.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'confirm_payment',
					paymentProofNote: paymentProofNote.trim()
				})
			});
			const result = (await response.json()) as ApiResponse<
				RentalOrder & { items: RentalOrderItem[] }
			>;
			if (!response.ok || !result.success || !result.data) {
				showToast(result.message || 'Gagal mengirim konfirmasi pembayaran.', 'error');
				return;
			}
			orderOverride = result.data;
			itemsOverride = result.data.items;
			paymentProofNote = '';
			showToast('Konfirmasi pembayaran tercatat! Tim kami akan segera memverifikasi.');
		} catch {
			showToast('Gangguan jaringan saat mengirim konfirmasi pembayaran.', 'error');
		} finally {
			submittingPayment = false;
		}
	}

	async function handleRequestReturn(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		submittingReturn = true;
		try {
			const response = await fetch(`/api/orders/${order.id}/return`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					returnMethod,
					returnNotes: returnNotes.trim() || null
				})
			});
			const result = (await response.json()) as ApiResponse<
				RentalOrder & { items: RentalOrderItem[] }
			>;
			if (!response.ok || !result.success || !result.data) {
				showToast(result.message || 'Gagal mengajukan pengembalian barang.', 'error');
				return;
			}
			orderOverride = result.data;
			itemsOverride = result.data.items;
			returnNotes = '';
			showToast('Pengajuan pengembalian barang berhasil dicatat!');
		} catch {
			showToast('Gangguan jaringan saat mengajukan pengembalian.', 'error');
		} finally {
			submittingReturn = false;
		}
	}

	const timelineSteps = [
		{ step: 1, label: 'Pesanan Dibuat' },
		{ step: 2, label: 'Pembayaran & Konfirmasi' },
		{ step: 3, label: 'Sedang Disewa' },
		{ step: 4, label: 'Pengembalian Barang' },
		{ step: 5, label: 'Selesai' }
	] as const;
</script>

<svelte:head>
	<title>Pesanan {order.orderCode} — {data.settings.companyName}</title>
</svelte:head>

<!-- Tampilan Khusus Cetak 1 Lembar A4 (jika user tekan Ctrl+P di halaman detail) -->
<div class="hidden print:block">
	<InvoiceSheet settings={data.settings} {order} {items} />
</div>

<section class="bg-surface/60 py-10 pb-24 sm:py-14 print:hidden">
	<div class="mx-auto max-w-5xl px-6">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<a href="/akun" class="text-sm font-semibold text-neutral-600 hover:text-neutral-950">
				← Kembali ke Dashboard Pemesan
			</a>

			<div class="flex flex-wrap gap-2">
				{#if data.isAdmin}
					<a
						href="/admin/orders"
						class="rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-800 hover:border-neutral-950"
					>
						Kelola di Admin
					</a>
				{/if}
				<a
					href={`/invoice/${order.orderCode}`}
					class="inline-flex items-center gap-1.5 rounded-full bg-neutral-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-neutral-800"
				>
					Lihat &amp; Cetak Invoice (1 Lembar)
				</a>
			</div>
		</div>

		<!-- Header Pesanan & Timeline -->
		<div class="mt-5 rounded-3xl border border-neutral-200/80 bg-white p-6 sm:p-8">
			<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
				<div>
					<p class="text-xs font-semibold tracking-widest text-neutral-400 uppercase">
						Kode Transaksi Sewa
					</p>
					<h1 class="mt-1 font-mono text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
						{order.orderCode}
					</h1>
					<p class="mt-1 text-xs text-neutral-500">
						Dibuat pada {formatDateTimeId(order.createdAt)} · Ref Pembayaran:
						<span class="font-mono font-medium text-neutral-700">{order.paymentReference ?? '-'}</span>
					</p>
				</div>

				<div class="flex flex-wrap gap-2">
					{#if order.branchName}
						<span class="rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-xs font-semibold text-emerald-800">
							📍 {order.branchName}
						</span>
					{/if}
					<span class="rounded-full border px-3.5 py-1 text-xs font-semibold {orderMeta.badgeClass}">
						{orderMeta.label}
					</span>
					<span class="rounded-full border px-3.5 py-1 text-xs font-semibold {payMeta.badgeClass}">
						Pembayaran: {payMeta.label}
					</span>
				</div>
			</div>

			{#if order.orderStatus !== 'cancelled'}
				<ol class="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-5">
					{#each timelineSteps as t (t.step)}
						{@const reached = currentStepIndex >= t.step}
						<li
							class="rounded-2xl border p-3 text-center transition {reached
								? 'border-neutral-950 bg-neutral-950 text-white'
								: 'border-neutral-200/80 bg-surface text-neutral-400'}"
						>
							<p class="font-mono text-[10px] font-bold">0{t.step}</p>
							<p class="mt-1 text-[11px] font-semibold">{t.label}</p>
						</li>
					{/each}
				</ol>
			{/if}
		</div>

		<div class="mt-6 grid gap-6 lg:grid-cols-12">
			<!-- Kolom Kiri: Pembayaran & Pengembalian + Daftar Barang -->
			<div class="space-y-6 lg:col-span-7">
				<!-- Panel Pembayaran -->
				<section class="rounded-3xl border border-neutral-200/80 bg-white p-6">
					<div class="flex flex-wrap items-center justify-between gap-2">
						<h2 class="text-base font-bold text-neutral-950">Informasi Pembayaran</h2>
						<span class="rounded-full bg-surface px-3 py-1 text-xs font-semibold text-neutral-700">
							{payMethod.label}
						</span>
					</div>

					<p class="mt-3 rounded-2xl bg-surface p-4 text-xs leading-relaxed text-neutral-600">
						<span class="mb-1 block font-semibold text-neutral-900">
							Rekening Pembayaran Terpusat ({data.settings.companyName} Pusat)
						</span>
						{payMethod.instruction}
					</p>

					{#if order.paymentStatus === 'paid'}
						<div class="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800">
							<strong>✓ Pembayaran Lunas</strong>
							{#if order.paidAt}
								· Diverifikasi pada {formatDateTimeId(order.paidAt)}
							{/if}
						</div>
					{:else if order.paymentStatus === 'waiting_verification'}
						<div class="mt-4 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-xs text-sky-900">
							<p class="font-semibold">Konfirmasi pembayaran sudah dikirim — menunggu verifikasi admin.</p>
							{#if order.paymentProofNote}
								<p class="mt-1 text-sky-800">Catatan Anda: "{order.paymentProofNote}"</p>
							{/if}
						</div>
					{:else if order.orderStatus !== 'cancelled'}
						<form onsubmit={handleConfirmPayment} class="mt-5 space-y-3 border-t border-neutral-100 pt-4">
							<label for="pay-proof" class="block text-xs font-semibold text-neutral-700">
								Sudah melakukan transfer / pembayaran? Kirim konfirmasi:
							</label>
							<textarea
								id="pay-proof"
								rows="2"
								required
								minlength="3"
								bind:value={paymentProofNote}
								placeholder="Contoh: Sudah transfer BCA Rp 425.000 a.n. Budi Santoso jam 14.30"
								class="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-neutral-950 focus:outline-none"
							></textarea>
							<div class="flex flex-wrap gap-2.5">
								<button
									type="submit"
									disabled={submittingPayment}
									class="rounded-full bg-neutral-950 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-60"
								>
									{submittingPayment ? 'Mengirim...' : 'Kirim Konfirmasi Pembayaran'}
								</button>
								<a
									href={whatsappConfirmUrl}
									target="_blank"
									rel="noopener noreferrer"
									class="rounded-full border border-neutral-200 px-4 py-2.5 text-xs font-semibold text-neutral-700 hover:border-neutral-950"
								>
									Kirim Bukti ke WA {order.branchName ?? 'CS'}
								</a>
							</div>
						</form>
					{/if}
				</section>

				<!-- Panel Pelacakan & Pengajuan Pengembalian Barang -->
				<section class="rounded-3xl border border-neutral-200/80 bg-white p-6">
					<div class="flex flex-wrap items-center justify-between gap-2">
						<div>
							<h2 class="text-base font-bold text-neutral-950">Data &amp; Status Pengembalian Barang</h2>
							<p class="text-xs text-neutral-500">
								Jatuh tempo pengembalian:
								<strong class="text-neutral-950">{formatDateId(order.endDate)}</strong>
							</p>
						</div>
					</div>

					{#if order.orderStatus === 'returned'}
						<div class="mt-4 space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900">
							<p class="font-bold">✓ Seluruh barang telah dikembalikan &amp; diverifikasi</p>
							<p>Waktu diterima kembali: <strong>{formatDateTimeId(order.returnedAt)}</strong></p>
							<p>
								Hasil cek kondisi: <strong>{getReturnConditionLabel(order.returnCondition)}</strong>
							</p>
							{#if order.lateFee > 0}
								<p>Biaya keterlambatan / penyesuaian: <strong>{formatRupiah(order.lateFee)}</strong></p>
							{/if}
							{#if order.returnNotes}
								<p>Catatan: {order.returnNotes}</p>
							{/if}
						</div>
					{:else if order.orderStatus === 'return_requested'}
						<div class="mt-4 space-y-1.5 rounded-2xl border border-violet-200 bg-violet-50 p-4 text-xs text-violet-900">
							<p class="font-bold">⏳ Pengembalian barang sedang diproses</p>
							<p>
								Metode pengembalian:
								<strong>
									{order.returnMethod === 'pickup_courier'
										? 'Dijemput Kurir Adasewa.id'
										: 'Diantar Kembali ke Kios'}
								</strong>
							</p>
							<p>Diajukan pada: {formatDateTimeId(order.returnRequestedAt)}</p>
							{#if order.returnNotes}
								<p>Catatan Anda: "{order.returnNotes}"</p>
							{/if}
							<p class="pt-1 text-violet-700">
								Admin akan memperbarui status menjadi Selesai setelah barang diterima dan dicek
								kelengkapannya.
							</p>
						</div>
					{:else if canRequestReturn}
						<form onsubmit={handleRequestReturn} class="mt-4 space-y-4 border-t border-neutral-100 pt-4">
							<p class="text-xs leading-relaxed text-neutral-600">
								Sudah selesai menggunakan barang? Ajukan pengembalian di sini agar tim kami bisa
								menjadwalkan penjemputan atau menyiapkan penerimaan di kios.
							</p>

							<div class="grid gap-2.5 sm:grid-cols-2">
								<button
									type="button"
									onclick={() => (returnMethod = 'pickup_courier')}
									class="rounded-2xl border p-3.5 text-left text-xs transition {returnMethod ===
									'pickup_courier'
										? 'border-neutral-950 bg-neutral-950 text-white'
										: 'border-neutral-200 bg-white text-neutral-700'}"
								>
									<p class="font-semibold">Dijemput Kurir Adasewa</p>
									<p class="mt-0.5 opacity-80">Kurir jemput ke alamat pengiriman</p>
								</button>
								<button
									type="button"
									onclick={() => (returnMethod = 'drop_off_kios')}
									class="rounded-2xl border p-3.5 text-left text-xs transition {returnMethod ===
									'drop_off_kios'
										? 'border-neutral-950 bg-neutral-950 text-white'
										: 'border-neutral-200 bg-white text-neutral-700'}"
								>
									<p class="font-semibold">Antar ke Kios {order.branchName ?? ''}</p>
									<p class="mt-0.5 opacity-80">
										{order.branchAddress ?? `Serahkan langsung di kios ${data.settings.companyName}`}
									</p>
								</button>
							</div>

							<div>
								<label for="ret-notes" class="block text-xs font-semibold text-neutral-700">
									Catatan Jadwal / Kondisi Barang (Opsional)
								</label>
								<textarea
									id="ret-notes"
									rows="2"
									bind:value={returnNotes}
									placeholder="Contoh: Barang lengkap & rapi, siap dijemput besok jam 10.00 WIB"
									class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-neutral-950 focus:outline-none"
								></textarea>
							</div>

							<button
								type="submit"
								disabled={submittingReturn}
								class="rounded-full bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
							>
								{submittingReturn ? 'Mencatat Pengembalian...' : 'Ajukan Pengembalian Barang'}
							</button>
						</form>
					{:else}
						<p class="mt-3 text-xs text-neutral-500">
							Form pengajuan pengembalian barang akan aktif otomatis setelah pembayaran diverifikasi
							dan barang berstatus Sedang Disewa.
						</p>
					{/if}
				</section>

				<!-- Daftar Barang & Status Pengembalian per Item -->
				<section class="rounded-3xl border border-neutral-200/80 bg-white p-6">
					<h2 class="text-base font-bold text-neutral-950">
						Daftar Barang Disewa ({items.length} jenis)
					</h2>
					<ul class="mt-4 divide-y divide-neutral-100">
						{#each items as line (line.id)}
							<li class="flex flex-col justify-between gap-2 py-3.5 sm:flex-row sm:items-center">
								<div class="min-w-0">
									<a
										href={`/katalog/${line.itemSlug}`}
										class="text-sm font-semibold text-neutral-950 hover:underline"
									>
										{line.itemName}
									</a>
									<p class="mt-0.5 text-xs text-neutral-500">
										{line.categoryName}
										{#if line.variant}
											· Varian: {line.variant}
										{/if}
									</p>
									<p class="mt-0.5 text-xs text-neutral-400">
										{line.quantity} unit × {formatRupiah(line.unitPrice)} × {line.durationDays}
										{line.unitLabel}
									</p>
								</div>
								<div class="text-left sm:text-right">
									<p class="text-sm font-bold text-neutral-950">{formatRupiah(line.lineTotal)}</p>
									<p class="mt-0.5 text-[11px] font-medium {line.returnedQty >= line.quantity ? 'text-emerald-700' : 'text-neutral-400'}">
										Kembali: {line.returnedQty} / {line.quantity} unit
									</p>
								</div>
							</li>
						{/each}
					</ul>
				</section>
			</div>

			<!-- Kolom Kanan: Rincian Biaya & Data Pengiriman -->
			<aside class="space-y-6 lg:col-span-5">
				<section class="rounded-3xl border border-neutral-200/80 bg-white p-6">
					<h2 class="text-base font-bold text-neutral-950">Rincian Biaya</h2>
					<dl class="mt-4 space-y-2.5 text-sm">
						<div class="flex justify-between text-neutral-600">
							<dt>Subtotal Sewa ({order.durationDays} hari)</dt>
							<dd class="font-medium text-neutral-950">{formatRupiah(order.subtotalAmount)}</dd>
						</div>
						<div class="flex justify-between text-neutral-600">
							<dt>Biaya Pengiriman</dt>
							<dd class="font-medium text-neutral-950">
								{order.deliveryFee > 0 ? formatRupiah(order.deliveryFee) : 'Gratis (Rp 0)'}
							</dd>
						</div>
						{#if order.promoDiscountAmount > 0}
							<div class="flex justify-between text-rose-700">
								<dt>Promo Diskon ({order.promoCode ?? 'Voucher'})</dt>
								<dd class="font-semibold">−{formatRupiah(order.promoDiscountAmount)}</dd>
							</div>
						{/if}
						{#if order.pointsDiscountAmount > 0}
							<div class="flex justify-between text-emerald-700">
								<dt>Potongan Poin ({order.pointsRedeemed} Poin)</dt>
								<dd class="font-semibold">−{formatRupiah(order.pointsDiscountAmount)}</dd>
							</div>
						{/if}
						{#if order.depositAmount > 0}
							<div class="flex justify-between text-neutral-600">
								<dt>Uang Jaminan (Deposit)</dt>
								<dd class="font-medium text-neutral-950">{formatRupiah(order.depositAmount)}</dd>
							</div>
						{/if}
						{#if order.lateFee > 0}
							<div class="flex justify-between text-red-600">
								<dt>Denda / Penyesuaian Kembali</dt>
								<dd class="font-semibold">{formatRupiah(order.lateFee)}</dd>
							</div>
						{/if}
					</dl>
					<div class="mt-4 flex items-baseline justify-between border-t border-neutral-200 pt-4">
						<span class="text-sm font-bold text-neutral-950">Total Tagihan</span>
						<span class="text-2xl font-bold text-neutral-950">{formatRupiah(order.totalAmount)}</span>
					</div>

					<!-- Status Poin Sewa Pesanan -->
					{#if order.pointsEarned > 0}
						<div class="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900">
							<p class="font-bold">★ +{order.pointsEarned} Poin Masuk ke Rekening Poin</p>
							{#if order.pointsAwardedAt}
								<p class="mt-0.5 text-[11px] text-amber-800">
									Dikreditkan pada {formatDateTimeId(order.pointsAwardedAt)} ·
									<a href="/akun#rekening-poin" class="font-semibold underline">Lihat Rekening Poin</a>
								</p>
							{/if}
						</div>
					{:else if order.orderStatus !== 'cancelled' && order.orderStatus !== 'returned'}
						<div class="mt-4 rounded-2xl bg-surface p-3.5 text-xs text-neutral-600">
							<p class="font-semibold text-neutral-900">
								★ Estimasi +{calculateEarnedPoints(order.subtotalAmount)} Poin Sewa
							</p>
							<p class="mt-0.5 text-[11px] text-neutral-500">
								Otomatis masuk ke Rekening Poin Anda setelah seluruh barang dikembalikan dalam kondisi
								baik.
							</p>
						</div>
					{/if}
				</section>

				<section class="rounded-3xl border border-neutral-200/80 bg-white p-6">
					<h2 class="text-base font-bold text-neutral-950">Data Cabang, Pemesan &amp; Pengiriman</h2>
					<dl class="mt-4 space-y-3 text-xs sm:text-sm">
						{#if order.branchName}
							<div class="rounded-2xl bg-emerald-50/70 p-3">
								<dt class="text-[11px] font-bold tracking-wider text-emerald-800 uppercase">
									📍 Cabang Pelaksana
								</dt>
								<dd class="mt-0.5 font-bold text-neutral-950">{order.branchName}</dd>
								{#if order.branchAddress}
									<dd class="mt-0.5 text-xs text-neutral-600">{order.branchAddress}</dd>
								{/if}
								{#if order.branchWhatsapp}
									<dd class="mt-1 text-xs font-medium text-emerald-800">
										WA CS Cabang: +{order.branchWhatsapp}
									</dd>
								{/if}
							</div>
						{/if}
						<div>
							<dt class="text-xs text-neutral-400">Nama Pemesan</dt>
							<dd class="font-medium text-neutral-950">{order.customerName}</dd>
						</div>
						<div>
							<dt class="text-xs text-neutral-400">Nomor HP / WhatsApp</dt>
							<dd class="font-medium text-neutral-950">
								{order.customerPhone}
								{#if order.emergencyPhone}
									<span class="block text-xs text-neutral-500">
										Darurat: {order.emergencyPhone}
									</span>
								{/if}
							</dd>
						</div>
						<div>
							<dt class="text-xs text-neutral-400">Jadwal Sewa</dt>
							<dd class="font-medium text-neutral-950">
								{formatDateId(order.startDate)} s/d {formatDateId(order.endDate)} ({order.durationDays}
								hari)
							</dd>
						</div>
						<div>
							<dt class="text-xs text-neutral-400">Metode &amp; Alamat</dt>
							<dd class="font-medium text-neutral-950">
								{order.deliveryMethod === 'delivery'
									? `Delivery — ${order.deliveryRegion ?? ''}`
									: 'Ambil Langsung di Kios'}
							</dd>
							{#if order.deliveryAddress}
								<dd class="mt-1 leading-relaxed text-neutral-600">{order.deliveryAddress}</dd>
							{/if}
						</div>
						{#if order.notes}
							<div>
								<dt class="text-xs text-neutral-400">Catatan Pemesan</dt>
								<dd class="text-neutral-600">{order.notes}</dd>
							</div>
						{/if}
					</dl>
				</section>
			</aside>
		</div>
	</div>
</section>

<Toast message={toastMessage} variant={toastVariant} onDismiss={() => (toastMessage = null)} />
