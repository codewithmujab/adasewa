<script lang="ts">
	import type {
		CompanySettings,
		RentalOrder,
		RentalOrderItem
	} from '#lib/server/db/schema';
	import { formatRupiah } from '#lib/utils/catalog';
	import {
		formatDateId,
		formatDateTimeId,
		getOrderStatusMeta,
		getPaymentMethodInfo,
		getPaymentStatusMeta,
		getReturnConditionLabel
	} from '#lib/utils/orders';

	interface Props {
		settings: CompanySettings;
		order: RentalOrder;
		items: RentalOrderItem[];
	}

	let { settings, order, items }: Props = $props();

	let payMeta = $derived(getPaymentStatusMeta(order.paymentStatus));
	let orderMeta = $derived(getOrderStatusMeta(order.orderStatus));
	let payMethod = $derived(getPaymentMethodInfo(order.paymentMethod));
</script>

<div
	class="invoice-sheet mx-auto w-full max-w-[210mm] bg-white text-neutral-950 print:max-w-none print:shadow-none"
>
	<!-- Kop Invoice -->
	<header class="flex items-start justify-between gap-6 border-b-2 border-neutral-950 pb-4">
		<div class="flex items-start gap-3">
			<img
				src={settings.logoUrl || '/logo-adasewa.jpg'}
				alt={settings.companyName}
				class="h-11 w-11 shrink-0 rounded-full border border-neutral-200 object-cover"
			/>
			<div>
				<p class="text-base font-bold tracking-tight text-neutral-950">
					{settings.companyName}{#if order.branchName} — {order.branchName}{/if}
				</p>
				<p class="text-[11px] text-neutral-600">
					{order.branchAddress || settings.address || 'Pusat Sewa Barang Terlengkap'}
				</p>
				<p class="mt-0.5 text-[11px] text-neutral-500">
					WA CS {order.branchName ?? 'Pusat'}: {order.branchWhatsapp
						? `+${order.branchWhatsapp}`
						: settings.phone || '-'}
					· {settings.email}
				</p>
			</div>
		</div>

		<div class="text-right">
			<p class="text-xl font-extrabold tracking-tight text-neutral-950 uppercase">INVOICE</p>
			<p class="mt-0.5 font-mono text-xs font-bold text-neutral-800">INV/{order.orderCode}</p>
			<div class="mt-1.5 flex justify-end gap-1.5">
				<span
					class="inline-block rounded border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase {payMeta.badgeClass}"
				>
					{payMeta.label}
				</span>
				{#if order.orderStatus === 'returned'}
					<span
						class="inline-block rounded border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold tracking-wider text-emerald-800 uppercase"
					>
						Dikembalikan
					</span>
				{/if}
			</div>
		</div>
	</header>

	<!-- Info Pemesan & Detail Transaksi (2 Kolom Ringkas) -->
	<section class="mt-4 grid grid-cols-2 gap-4 text-[11px] leading-relaxed">
		<div class="rounded-xl border border-neutral-200 p-3.5">
			<p class="text-[10px] font-bold tracking-wider text-neutral-400 uppercase">
				Ditagihkan Kepada
			</p>
			<p class="mt-1 text-xs font-bold text-neutral-950">{order.customerName}</p>
			<p class="text-neutral-600">{order.customerEmail}</p>
			<p class="text-neutral-600">
				HP/WA: {order.customerPhone}
				{#if order.emergencyPhone}
					· Darurat: {order.emergencyPhone}
				{/if}
			</p>
			<p class="mt-1.5 text-neutral-700">
				<span class="font-semibold">
					{order.deliveryMethod === 'delivery'
						? `Delivery (${order.deliveryRegion ?? '-'})`
						: 'Ambil Langsung di Kios'}
				</span>
				{#if order.deliveryAddress}
					<span class="block text-neutral-500">{order.deliveryAddress}</span>
				{/if}
			</p>
		</div>

		<div class="rounded-xl border border-neutral-200 p-3.5">
			<p class="text-[10px] font-bold tracking-wider text-neutral-400 uppercase">
				Detail Sewa &amp; Pembayaran
			</p>
			<dl class="mt-1 space-y-1">
				{#if order.branchName}
					<div class="flex justify-between gap-2">
						<dt class="text-neutral-500">Cabang Kios</dt>
						<dd class="font-semibold text-neutral-950">{order.branchName}</dd>
					</div>
				{/if}
				<div class="flex justify-between gap-2">
					<dt class="text-neutral-500">Tanggal Terbit</dt>
					<dd class="font-medium text-neutral-950">{formatDateTimeId(order.createdAt)}</dd>
				</div>
				<div class="flex justify-between gap-2">
					<dt class="text-neutral-500">Periode Sewa</dt>
					<dd class="font-semibold text-neutral-950">
						{formatDateId(order.startDate)} – {formatDateId(order.endDate)} ({order.durationDays}
						hari)
					</dd>
				</div>
				<div class="flex justify-between gap-2">
					<dt class="text-neutral-500">Metode Bayar</dt>
					<dd class="font-medium text-neutral-950">{payMethod.label}</dd>
				</div>
				<div class="flex justify-between gap-2">
					<dt class="text-neutral-500">No. Referensi</dt>
					<dd class="font-mono font-medium text-neutral-800">{order.paymentReference ?? '-'}</dd>
				</div>
				<div class="flex justify-between gap-2">
					<dt class="text-neutral-500">Status Sewa</dt>
					<dd class="font-semibold text-neutral-950">{orderMeta.label}</dd>
				</div>
			</dl>
		</div>
	</section>

	<!-- Tabel Barang Sewa -->
	<section class="mt-4">
		<table class="w-full border-collapse text-left text-[11px]">
			<thead>
				<tr class="border-y border-neutral-900 bg-neutral-100/80 text-[10px] font-bold tracking-wider text-neutral-700 uppercase">
					<th class="w-8 px-2.5 py-2 text-center">No</th>
					<th class="px-2.5 py-2">Nama Barang &amp; Varian</th>
					<th class="w-12 px-2 py-2 text-center">Qty</th>
					<th class="w-16 px-2 py-2 text-center">Durasi</th>
					<th class="w-24 px-2.5 py-2 text-right">Tarif/Hari</th>
					<th class="w-28 px-2.5 py-2 text-right">Subtotal</th>
					<th class="w-24 px-2.5 py-2 text-center">Kembali</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-neutral-200">
				{#each items as line, idx (line.id)}
					<tr>
						<td class="px-2.5 py-2 text-center text-neutral-500">{idx + 1}</td>
						<td class="px-2.5 py-2">
							<p class="font-semibold text-neutral-950">{line.itemName}</p>
							<p class="text-[10px] text-neutral-500">
								{line.categoryName}
								{#if line.variant}
									· Varian: {line.variant}
								{/if}
							</p>
						</td>
						<td class="px-2 py-2 text-center font-medium text-neutral-900">{line.quantity}</td>
						<td class="px-2 py-2 text-center text-neutral-700">
							{line.durationDays} {line.unitLabel}
						</td>
						<td class="px-2.5 py-2 text-right text-neutral-700">
							{formatRupiah(line.unitPrice)}
						</td>
						<td class="px-2.5 py-2 text-right font-semibold text-neutral-950">
							{formatRupiah(line.lineTotal)}
						</td>
						<td class="px-2.5 py-2 text-center text-[10px]">
							{#if line.returnedQty >= line.quantity}
								<span class="font-semibold text-emerald-700">
									{line.returnedQty}/{line.quantity} · {line.returnCondition === 'damaged'
										? 'Catatan'
										: 'Baik'}
								</span>
							{:else}
								<span class="text-neutral-500">{line.returnedQty}/{line.quantity}</span>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</section>

	<!-- Ringkasan Total & Status Pengembalian -->
	<section class="mt-4 grid grid-cols-12 gap-4 text-[11px]">
		<div class="col-span-7 space-y-2">
			<div class="rounded-xl border border-neutral-200 bg-neutral-50/70 p-3">
				<p class="text-[10px] font-bold tracking-wider text-neutral-500 uppercase">
					Keterangan Pembayaran &amp; Pengembalian
				</p>
				<div class="mt-1 space-y-1 text-neutral-600">
					{#if order.paidAt}
						<p>
							• Pembayaran terverifikasi lunas ke rekening pusat {settings.companyName} pada
							<strong class="text-neutral-900">{formatDateTimeId(order.paidAt)}</strong>.
						</p>
					{:else}
						<p>
							• <strong class="text-neutral-900">Rekening Pusat:</strong> {payMethod.instruction}
						</p>
					{/if}

					{#if order.returnedAt}
						<p>
							• Barang diterima kembali pada
							<strong class="text-neutral-900">{formatDateTimeId(order.returnedAt)}</strong>
							(Kondisi: <strong>{getReturnConditionLabel(order.returnCondition)}</strong>).
						</p>
					{:else}
						<p>
							• Batas waktu pengembalian barang:
							<strong class="text-neutral-900">{formatDateId(order.endDate)}</strong>.
						</p>
					{/if}

					{#if order.pointsEarned > 0}
						<p>
							• Bonus loyalitas: <strong class="text-neutral-900">+{order.pointsEarned} Poin</strong>
							telah dikreditkan ke Rekening Poin penyewa.
						</p>
					{/if}

					{#if order.returnNotes}
						<p>• Catatan pengembalian: {order.returnNotes}</p>
					{:else if order.notes}
						<p>• Catatan pesanan: {order.notes}</p>
					{/if}
				</div>
			</div>
		</div>

		<div class="col-span-5">
			<dl class="space-y-1.5 rounded-xl border border-neutral-200 p-3.5">
				<div class="flex justify-between text-neutral-600">
					<dt>Subtotal Sewa</dt>
					<dd class="font-medium text-neutral-950">{formatRupiah(order.subtotalAmount)}</dd>
				</div>
				<div class="flex justify-between text-neutral-600">
					<dt>Biaya Pengiriman</dt>
					<dd class="font-medium text-neutral-950">
						{order.deliveryFee > 0 ? formatRupiah(order.deliveryFee) : 'Rp 0'}
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
					<div class="flex justify-between text-red-700">
						<dt>Denda / Penyesuaian</dt>
						<dd class="font-semibold">{formatRupiah(order.lateFee)}</dd>
					</div>
				{/if}
				<div class="mt-2 flex items-baseline justify-between border-t-2 border-neutral-950 pt-2">
					<dt class="text-xs font-bold text-neutral-950 uppercase">Total Tagihan</dt>
					<dd class="text-base font-extrabold text-neutral-950">
						{formatRupiah(order.totalAmount)}
					</dd>
				</div>
			</dl>
		</div>
	</section>

	<!-- Area Tanda Tangan Serah Terima & Footer 1 Lembar -->
	<footer class="mt-6 border-t border-neutral-200 pt-4">
		<div class="grid grid-cols-2 gap-8 text-center text-[11px] text-neutral-600">
			<div>
				<p class="font-medium text-neutral-700">Penyewa / Penerima Unit</p>
				<div class="mx-auto mt-10 w-44 border-b border-neutral-400"></div>
				<p class="mt-1 font-semibold text-neutral-900">{order.customerName}</p>
			</div>
			<div>
				<p class="font-medium text-neutral-700">
					Hormat Kami, {settings.companyName}
				</p>
				<div class="mx-auto mt-10 w-44 border-b border-neutral-400"></div>
				<p class="mt-1 font-semibold text-neutral-900">
					Petugas / Admin {order.branchName || settings.companyName}
				</p>
			</div>
		</div>

		<p class="mt-5 text-center text-[10px] text-neutral-400">
			Invoice ini diterbitkan secara elektronik oleh {settings.companyName} dan berlaku sebagai bukti
			transaksi penyewaan &amp; pengembalian barang yang sah.
		</p>
	</footer>
</div>
