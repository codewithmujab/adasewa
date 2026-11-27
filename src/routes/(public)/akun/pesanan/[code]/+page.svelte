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

<!-- Tampilan Khusus Cetak 1 Lembar A4 (tetap putih bersih saat Ctrl+P) -->
<div class="hidden bg-white text-neutral-950 print:block">
	<InvoiceSheet settings={data.settings} {order} {items} />
</div>

<section class="bg-black py-10 pb-24 sm:py-14 print:hidden">
	<div class="mx-auto max-w-5xl px-6">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<a
				href="/akun"
				class="inline-flex items-center rounded-full border border-white/20 bg-white/[0.06] px-4 py-2 text-xs font-bold text-white transition hover:border-white hover:bg-white hover:text-black"
			>
				← Kembali ke Dashboard Pemesan
			</a>

			<div class="flex flex-wrap gap-2">
				{#if data.isAdmin}
					<a
						href="/admin/orders"
						class="rounded-full border border-white/20 bg-white/[0.06] px-4 py-2 text-xs font-bold text-white hover:border-white"
					>
						Kelola di Admin
					</a>
				{/if}
				<a
					href={`/invoice/${order.orderCode}`}
					class="inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2 text-xs font-extrabold text-black transition hover:bg-neutral-200"
				>
					Lihat &amp; Cetak Invoice (1 Lembar)
				</a>
			</div>
		</div>

		<!-- Header Pesanan & Timeline -->
		<div class="mt-6 rounded-[2.25rem] border border-white/15 bg-[#0c0c0f] p-6 sm:p-8">
			<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
				<div>
					<p class="text-xs font-bold tracking-widest text-neutral-400 uppercase">
						Kode Transaksi Sewa
					</p>
					<h1 class="mt-1 font-mono text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
						{order.orderCode}
					</h1>
					<p class="mt-1.5 text-xs text-neutral-400">
						Dibuat pada {formatDateTimeId(order.createdAt)} · Ref Pembayaran:
						<span class="font-mono font-semibold text-neutral-200"
							>{order.paymentReference ?? '-'}</span
						>
					</p>
				</div>

				<div class="flex flex-wrap gap-2">
					{#if order.branchName}
						<span
							class="rounded-full border border-emerald-400/30 bg-emerald-400/15 px-3.5 py-1 text-xs font-bold text-emerald-300"
						>
							📍 {order.branchName}
						</span>
					{/if}
					<span
						class="rounded-full border px-3.5 py-1 text-xs font-bold {orderMeta.badgeClass}"
					>
						{orderMeta.label}
					</span>
					<span
						class="rounded-full border px-3.5 py-1 text-xs font-bold {payMeta.badgeClass}"
					>
						Pembayaran: {payMeta.label}
					</span>
				</div>
			</div>

			{#if order.orderStatus !== 'cancelled'}
				<ol class="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-5">
					{#each timelineSteps as t (t.step)}
						{@const reached = currentStepIndex >= t.step}
						<li
							class="rounded-[1.25rem] border p-3.5 text-center transition {reached
								? 'border-white bg-white text-black'
								: 'border-white/15 bg-black text-neutral-500'}"
						>
							<p class="font-mono text-[10px] font-extrabold">0{t.step}</p>
							<p class="mt-1 text-[11px] font-bold">{t.label}</p>
						</li>
					{/each}
				</ol>
			{/if}
		</div>

		<div class="mt-6 grid gap-6 lg:grid-cols-12">
			<!-- Kolom Kiri: Pembayaran & Pengembalian + Daftar Barang -->
			<div class="space-y-6 lg:col-span-7">
				<!-- Panel Pembayaran -->
				<section class="rounded-[2rem] border border-white/15 bg-[#0c0c0f] p-6">
					<div class="flex flex-wrap items-center justify-between gap-2">
						<h2 class="text-base font-extrabold text-white">Informasi Pembayaran</h2>
						<span
							class="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold text-white"
						>
							{payMethod.label}
						</span>
					</div>

					<p
						class="mt-3 rounded-[1.25rem] border border-white/10 bg-black p-4 text-xs leading-relaxed text-neutral-300"
					>
						<span class="mb-1 block font-bold text-white">
							Rekening Pembayaran Terpusat ({data.settings.companyName} Pusat)
						</span>
						{payMethod.instruction}
					</p>

					{#if order.paymentStatus === 'paid'}
						<div
							class="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-400/15 p-4 text-xs text-emerald-200"
						>
							<strong class="text-emerald-300">✓ Pembayaran Lunas</strong>
							{#if order.paidAt}
								· Diverifikasi pada {formatDateTimeId(order.paidAt)}
							{/if}
						</div>
					{:else if order.paymentStatus === 'waiting_verification'}
						<div
							class="mt-4 rounded-2xl border border-sky-400/30 bg-sky-400/15 p-4 text-xs text-sky-200"
						>
							<p class="font-bold text-white">
								Konfirmasi pembayaran sudah dikirim — menunggu verifikasi admin.
							</p>
							{#if order.paymentProofNote}
								<p class="mt-1 text-sky-200">Catatan Anda: "{order.paymentProofNote}"</p>
							{/if}
						</div>
					{:else if order.orderStatus !== 'cancelled'}
						<form
							onsubmit={handleConfirmPayment}
							class="mt-5 space-y-3 border-t border-white/10 pt-4"
						>
							<label for="pay-proof" class="block text-xs font-semibold text-neutral-300">
								Sudah melakukan transfer / pembayaran? Kirim konfirmasi:
							</label>
							<textarea
								id="pay-proof"
								rows="2"
								required
								minlength="3"
								bind:value={paymentProofNote}
								placeholder="Contoh: Sudah transfer BCA Rp 425.000 a.n. Budi Santoso jam 14.30"
								class="w-full rounded-2xl border border-white/20 bg-black px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-white focus:outline-none"
							></textarea>
							<div class="flex flex-wrap gap-2.5">
								<button
									type="submit"
									disabled={submittingPayment}
									class="rounded-full bg-white px-5 py-2.5 text-xs font-extrabold text-black transition hover:bg-neutral-200 disabled:opacity-60"
								>
									{submittingPayment ? 'Mengirim...' : 'Kirim Konfirmasi Pembayaran'}
								</button>
								<a
									href={whatsappConfirmUrl}
									target="_blank"
									rel="noopener noreferrer"
									class="rounded-full border border-white/20 bg-white/[0.06] px-4 py-2.5 text-xs font-bold text-white hover:border-white"
								>
									Kirim Bukti ke WA {order.branchName ?? 'CS'}
								</a>
							</div>
						</form>
					{/if}
				</section>

				<!-- Panel Pelacakan & Pengajuan Pengembalian Barang -->
				<section class="rounded-[2rem] border border-white/15 bg-[#0c0c0f] p-6">
					<div>
						<h2 class="text-base font-extrabold text-white">Data &amp; Status Pengembalian Barang</h2>
						<p class="mt-0.5 text-xs text-neutral-400">
							Jatuh tempo pengembalian:
							<strong class="text-white">{formatDateId(order.endDate)}</strong>
						</p>
					</div>

					{#if order.orderStatus === 'returned'}
						<div
							class="mt-4 space-y-2 rounded-2xl border border-emerald-400/30 bg-emerald-400/15 p-4 text-xs text-emerald-100"
						>
							<p class="font-bold text-emerald-300">
								✓ Seluruh barang telah dikembalikan &amp; diverifikasi
							</p>
							<p>Waktu diterima kembali: <strong class="text-white">{formatDateTimeId(order.returnedAt)}</strong></p>
							<p>
								Hasil cek kondisi:
								<strong class="text-white">{getReturnConditionLabel(order.returnCondition)}</strong>
							</p>
							{#if order.lateFee > 0}
								<p>
									Biaya keterlambatan / penyesuaian:
									<strong class="text-white">{formatRupiah(order.lateFee)}</strong>
								</p>
							{/if}
							{#if order.returnNotes}
								<p>Catatan: {order.returnNotes}</p>
							{/if}
						</div>
					{:else if order.orderStatus === 'return_requested'}
						<div
							class="mt-4 space-y-1.5 rounded-2xl border border-violet-400/30 bg-violet-500/15 p-4 text-xs text-violet-100"
						>
							<p class="font-bold text-violet-200">⏳ Pengembalian barang sedang diproses</p>
							<p>
								Metode pengembalian:
								<strong class="text-white">
									{order.returnMethod === 'pickup_courier'
										? 'Dijemput Kurir Adasewa.id'
										: 'Diantar Kembali ke Kios'}
								</strong>
							</p>
							<p>Diajukan pada: {formatDateTimeId(order.returnRequestedAt)}</p>
							{#if order.returnNotes}
								<p>Catatan Anda: "{order.returnNotes}"</p>
							{/if}
							<p class="pt-1 text-violet-300">
								Admin akan memperbarui status menjadi Selesai setelah barang diterima dan dicek
								kelengkapannya.
							</p>
						</div>
					{:else if canRequestReturn}
						<form
							onsubmit={handleRequestReturn}
							class="mt-4 space-y-4 border-t border-white/10 pt-4"
						>
							<p class="text-xs leading-relaxed text-neutral-300">
								Sudah selesai menggunakan barang? Ajukan pengembalian di sini agar tim kami bisa
								menjadwalkan penjemputan atau menyiapkan penerimaan di kios.
							</p>

							<div class="grid gap-2.5 sm:grid-cols-2">
								<button
									type="button"
									onclick={() => (returnMethod = 'pickup_courier')}
									class="rounded-2xl border p-3.5 text-left text-xs transition {returnMethod ===
									'pickup_courier'
										? 'border-white bg-white text-black'
										: 'border-white/15 bg-black text-neutral-200 hover:border-white/40'}"
								>
									<p class="font-bold">Dijemput Kurir Adasewa</p>
									<p class="mt-0.5 opacity-75">Kurir jemput ke alamat pengiriman</p>
								</button>
								<button
									type="button"
									onclick={() => (returnMethod = 'drop_off_kios')}
									class="rounded-2xl border p-3.5 text-left text-xs transition {returnMethod ===
									'drop_off_kios'
										? 'border-white bg-white text-black'
										: 'border-white/15 bg-black text-neutral-200 hover:border-white/40'}"
								>
									<p class="font-bold">Antar ke Kios {order.branchName ?? ''}</p>
									<p class="mt-0.5 opacity-75">
										{order.branchAddress ?? `Serahkan langsung di kios ${data.settings.companyName}`}
									</p>
								</button>
							</div>

							<div>
								<label for="ret-notes" class="block text-xs font-semibold text-neutral-300">
									Catatan Jadwal / Kondisi Barang (Opsional)
								</label>
								<textarea
									id="ret-notes"
									rows="2"
									bind:value={returnNotes}
									placeholder="Contoh: Barang lengkap & rapi, siap dijemput besok jam 10.00 WIB"
									class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-white focus:outline-none"
								></textarea>
							</div>

							<button
								type="submit"
								disabled={submittingReturn}
								class="rounded-full bg-white px-6 py-3 text-xs font-extrabold text-black transition hover:bg-neutral-200 disabled:opacity-60"
							>
								{submittingReturn ? 'Mencatat Pengembalian...' : 'Ajukan Pengembalian Barang'}
							</button>
						</form>
					{:else}
						<p class="mt-3 text-xs text-neutral-400">
							Form pengajuan pengembalian barang akan aktif otomatis setelah pembayaran diverifikasi
							dan barang berstatus Sedang Disewa.
						</p>
					{/if}
				</section>

				<!-- Daftar Barang & Status Pengembalian per Item -->
				<section class="rounded-[2rem] border border-white/15 bg-[#0c0c0f] p-6">
					<h2 class="text-base font-extrabold text-white">
						Daftar Barang Disewa ({items.length} jenis)
					</h2>
					<ul class="mt-4 divide-y divide-white/10">
						{#each items as line (line.id)}
							<li class="flex flex-col justify-between gap-2 py-3.5 sm:flex-row sm:items-center">
								<div class="min-w-0">
									<a
										href={`/katalog/${line.itemSlug}`}
										class="text-sm font-bold text-white hover:underline"
									>
										{line.itemName}
									</a>
									<p class="mt-0.5 text-xs text-neutral-400">
										{line.categoryName}
										{#if line.variant}
											· Varian: {line.variant}
										{/if}
									</p>
									<p class="mt-0.5 text-xs text-neutral-500">
										{line.quantity} unit × {formatRupiah(line.unitPrice)} × {line.durationDays}
										{line.unitLabel}
									</p>
								</div>
								<div class="text-left sm:text-right">
									<p class="text-sm font-extrabold text-white">{formatRupiah(line.lineTotal)}</p>
									<p
										class="mt-0.5 text-[11px] font-semibold {line.returnedQty >= line.quantity
											? 'text-emerald-400'
											: 'text-neutral-500'}"
									>
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
				<section class="rounded-[2rem] border-2 border-white/20 bg-[#0d0d11] p-6">
					<h2 class="text-base font-extrabold text-white">Rincian Biaya</h2>
					<dl class="mt-4 space-y-2.5 text-sm">
						<div class="flex justify-between text-neutral-400">
							<dt>Subtotal Sewa ({order.durationDays} hari)</dt>
							<dd class="font-semibold text-white">{formatRupiah(order.subtotalAmount)}</dd>
						</div>
						<div class="flex justify-between text-neutral-400">
							<dt>Biaya Pengiriman</dt>
							<dd class="font-semibold text-white">
								{order.deliveryFee > 0 ? formatRupiah(order.deliveryFee) : 'Gratis (Rp 0)'}
							</dd>
						</div>
						{#if order.promoDiscountAmount > 0}
							<div class="flex justify-between text-rose-300">
								<dt>Promo Diskon ({order.promoCode ?? 'Voucher'})</dt>
								<dd class="font-bold">−{formatRupiah(order.promoDiscountAmount)}</dd>
							</div>
						{/if}
						{#if order.pointsDiscountAmount > 0}
							<div class="flex justify-between text-emerald-300">
								<dt>Potongan Poin ({order.pointsRedeemed} Poin)</dt>
								<dd class="font-bold">−{formatRupiah(order.pointsDiscountAmount)}</dd>
							</div>
						{/if}
						{#if order.depositAmount > 0}
							<div class="flex justify-between text-neutral-400">
								<dt>Uang Jaminan (Deposit)</dt>
								<dd class="font-semibold text-white">{formatRupiah(order.depositAmount)}</dd>
							</div>
						{/if}
						{#if order.lateFee > 0}
							<div class="flex justify-between text-red-400">
								<dt>Denda / Penyesuaian Kembali</dt>
								<dd class="font-bold">{formatRupiah(order.lateFee)}</dd>
							</div>
						{/if}
					</dl>
					<div class="mt-4 flex items-baseline justify-between border-t border-white/20 pt-4">
						<span class="text-sm font-extrabold text-white">Total Tagihan</span>
						<span class="text-2xl font-extrabold text-white">{formatRupiah(order.totalAmount)}</span>
					</div>

					<!-- Status Poin Sewa Pesanan -->
					{#if order.pointsEarned > 0}
						<div
							class="mt-4 rounded-2xl border border-amber-400/30 bg-amber-400/15 p-3.5 text-xs text-amber-200"
						>
							<p class="font-bold text-amber-300">
								★ +{order.pointsEarned} Poin Masuk ke Rekening Poin
							</p>
							{#if order.pointsAwardedAt}
								<p class="mt-0.5 text-[11px] text-amber-200/80">
									Dikreditkan pada {formatDateTimeId(order.pointsAwardedAt)} ·
									<a href="/akun#rekening-poin" class="font-bold text-white underline"
										>Lihat Rekening Poin</a
									>
								</p>
							{/if}
						</div>
					{:else if order.orderStatus !== 'cancelled' && order.orderStatus !== 'returned'}
						<div class="mt-4 rounded-2xl border border-white/10 bg-black p-3.5 text-xs text-neutral-400">
							<p class="font-bold text-white">
								★ Estimasi +{calculateEarnedPoints(order.subtotalAmount)} Poin Sewa
							</p>
							<p class="mt-0.5 text-[11px] text-neutral-400">
								Otomatis masuk ke Rekening Poin Anda setelah seluruh barang dikembalikan dalam
								kondisi baik.
							</p>
						</div>
					{/if}
				</section>

				<section class="rounded-[2rem] border border-white/15 bg-[#0c0c0f] p-6">
					<h2 class="text-base font-extrabold text-white">Data Cabang, Pemesan &amp; Pengiriman</h2>
					<dl class="mt-4 space-y-3 text-xs sm:text-sm">
						{#if order.branchName}
							<div class="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-3.5">
								<dt class="text-[11px] font-bold tracking-wider text-emerald-300 uppercase">
									📍 Cabang Pelaksana
								</dt>
								<dd class="mt-0.5 font-extrabold text-white">{order.branchName}</dd>
								{#if order.branchAddress}
									<dd class="mt-0.5 text-xs text-neutral-300">{order.branchAddress}</dd>
								{/if}
								{#if order.branchWhatsapp}
									<dd class="mt-1 text-xs font-bold text-emerald-300">
										WA CS Cabang: +{order.branchWhatsapp}
									</dd>
								{/if}
							</div>
						{/if}
						<div>
							<dt class="text-xs text-neutral-400">Nama Pemesan</dt>
							<dd class="font-bold text-white">{order.customerName}</dd>
						</div>
						<div>
							<dt class="text-xs text-neutral-400">Nomor HP / WhatsApp</dt>
							<dd class="font-bold text-white">
								{order.customerPhone}
								{#if order.emergencyPhone}
									<span class="block text-xs font-normal text-neutral-400">
										Darurat: {order.emergencyPhone}
									</span>
								{/if}
							</dd>
						</div>
						<div>
							<dt class="text-xs text-neutral-400">Jadwal Sewa</dt>
							<dd class="font-bold text-white">
								{formatDateId(order.startDate)} s/d {formatDateId(order.endDate)} ({order.durationDays}
								hari)
							</dd>
						</div>
						<div>
							<dt class="text-xs text-neutral-400">Metode &amp; Alamat</dt>
							<dd class="font-bold text-white">
								{order.deliveryMethod === 'delivery'
									? `Delivery — ${order.deliveryRegion ?? ''}`
									: 'Ambil Langsung di Kios'}
							</dd>
							{#if order.deliveryAddress}
								<dd class="mt-1 leading-relaxed text-neutral-300">{order.deliveryAddress}</dd>
							{/if}
						</div>
						{#if order.notes}
							<div>
								<dt class="text-xs text-neutral-400">Catatan Pemesan</dt>
								<dd class="text-neutral-300">{order.notes}</dd>
							</div>
						{/if}
					</dl>
				</section>
			</aside>
		</div>
	</div>
</section>

<Toast message={toastMessage} variant={toastVariant} onDismiss={() => (toastMessage = null)} />
