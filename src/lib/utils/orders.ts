export const DELIVERY_REGIONS = [
	{
		value: 'DKI Jakarta',
		label: 'DKI Jakarta',
		fee: 50000,
		areas: 'Jakarta Pusat, Selatan, Barat, Timur & Utara'
	},
	{
		value: 'Jawa Barat',
		label: 'Jawa Barat',
		fee: 75000,
		areas: 'Bogor, Depok, Bekasi, Bandung, Cikarang & sekitar'
	},
	{
		value: 'Jawa Tengah',
		label: 'Jawa Tengah',
		fee: 100000,
		areas: 'Semarang, Solo, Magelang, Purwokerto & sekitar'
	},
	{
		value: 'D.I. Yogyakarta',
		label: 'D.I. Yogyakarta',
		fee: 100000,
		areas: 'Kota Yogyakarta, Sleman, Bantul & sekitar'
	}
] as const;

export type DeliveryRegionValue = (typeof DELIVERY_REGIONS)[number]['value'];

export const PAYMENT_METHODS = [
	{
		id: 'bank_transfer',
		label: 'Transfer Bank / Virtual Account',
		subtitle: 'BCA · Mandiri · BRI · BNI (Siap integrasi Payment Gateway VA)',
		deliveryAllowed: true,
		pickupAllowed: true,
		instruction:
			'Transfer sesuai total tagihan ke rekening resmi Adasewa.id (BCA 8820-1234-56 a.n. Adasewa Indonesia) lalu klik Konfirmasi Pembayaran di bawah. Saat Payment Gateway aktif, nomor VA akan diterbitkan otomatis.'
	},
	{
		id: 'qris',
		label: 'QRIS (Semua Bank & E-Wallet)',
		subtitle: 'Scan dari BCA Mobile, Livin, BRImo, GoPay, OVO, DANA',
		deliveryAllowed: true,
		pickupAllowed: true,
		instruction:
			'Selesaikan pembayaran QRIS sesuai nominal tagihan menggunakan kode referensi transaksi Anda, lalu kirim konfirmasi pembayaran agar pesanan segera diverifikasi.'
	},
	{
		id: 'ewallet',
		label: 'E-Wallet (GoPay / OVO / DANA / ShopeePay)',
		subtitle: 'Pembayaran instan dompet digital',
		deliveryAllowed: true,
		pickupAllowed: true,
		instruction:
			'Kirim pembayaran via E-Wallet ke nomor resmi Adasewa.id (0857-7713-9748 a.n. Adasewa.id) dengan mencantumkan Kode Pesanan pada berita transfer.'
	},
	{
		id: 'cod_kios',
		label: 'Bayar Langsung di Kios',
		subtitle: 'Tersedia khusus untuk metode Ambil Langsung di Kios',
		deliveryAllowed: false,
		pickupAllowed: true,
		instruction:
			'Tunjukkan Kode Pesanan Anda saat datang mengambil barang di kios Adasewa.id dan lakukan pembayaran tunai / QRIS di tempat.'
	}
] as const;

export type PaymentMethodId = (typeof PAYMENT_METHODS)[number]['id'];

export const INFO_SOURCES = [
	'Instagram',
	'TikTok',
	'Google',
	'Website',
	'Teman',
	'Saudara',
	'Kakak Tingkat',
	'Kios',
	'Facebook',
	'Poster'
] as const;

export function getPaymentMethodInfo(id: string) {
	return PAYMENT_METHODS.find((m) => m.id === id) ?? PAYMENT_METHODS[0];
}

export function getDeliveryFee(
	deliveryMethod: 'delivery' | 'pickup',
	region: string | null | undefined
): number {
	if (deliveryMethod === 'pickup') return 0;
	const found = DELIVERY_REGIONS.find((r) => r.value === region);
	return found ? found.fee : 75000;
}

export function getTodayIsoDate(): string {
	const now = new Date();
	const y = now.getFullYear();
	const m = String(now.getMonth() + 1).padStart(2, '0');
	const d = String(now.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

export function addDaysIsoDate(baseIso: string, daysToAdd: number): string {
	const parts = baseIso.split('-').map(Number);
	const y = parts[0] ?? 2026;
	const m = parts[1] ?? 1;
	const d = parts[2] ?? 1;
	const dt = new Date(Date.UTC(y, m - 1, d + daysToAdd));
	const ry = dt.getUTCFullYear();
	const rm = String(dt.getUTCMonth() + 1).padStart(2, '0');
	const rd = String(dt.getUTCDate()).padStart(2, '0');
	return `${ry}-${rm}-${rd}`;
}

export function calculateDurationDays(startDate: string, endDate: string): number {
	if (!startDate || !endDate) return 1;
	const start = new Date(`${startDate}T00:00:00Z`);
	const end = new Date(`${endDate}T00:00:00Z`);
	if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;
	const diffDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
	return Math.max(1, Math.min(365, diffDays));
}

export function formatDateId(value: string | Date | null | undefined): string {
	if (!value) return '-';
	const date =
		typeof value === 'string'
			? new Date(value.length === 10 ? `${value}T00:00:00` : value)
			: value;
	if (Number.isNaN(date.getTime())) return String(value);
	return new Intl.DateTimeFormat('id-ID', {
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	}).format(date);
}

export function formatDateTimeId(value: string | Date | null | undefined): string {
	if (!value) return '-';
	const date = typeof value === 'string' ? new Date(value) : value;
	if (Number.isNaN(date.getTime())) return String(value);
	return new Intl.DateTimeFormat('id-ID', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	}).format(date);
}

export interface StatusBadgeMeta {
	label: string;
	badgeClass: string;
	description: string;
}

export function getOrderStatusMeta(status: string): StatusBadgeMeta {
	switch (status) {
		case 'pending_payment':
			return {
				label: 'Menunggu Pembayaran',
				badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
				description: 'Segera selesaikan pembayaran untuk mengunci jadwal & stok barang.'
			};
		case 'confirmed':
			return {
				label: 'Terkonfirmasi / Diproses',
				badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
				description: 'Pesanan sudah dikonfirmasi dan sedang disiapkan untuk serah terima.'
			};
		case 'active_rental':
			return {
				label: 'Sedang Disewa',
				badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
				description: 'Barang sedang berada di pemesan. Jangan lupa jadwal pengembalian.'
			};
		case 'return_requested':
			return {
				label: 'Proses Pengembalian',
				badgeClass: 'bg-violet-50 text-violet-800 border-violet-200',
				description: 'Pengembalian barang sedang dijadwalkan / menunggu verifikasi pengecekan tim.'
			};
		case 'returned':
			return {
				label: 'Selesai & Dikembalikan',
				badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
				description: 'Seluruh barang telah diterima kembali dan transaksi selesai.'
			};
		case 'cancelled':
			return {
				label: 'Dibatalkan',
				badgeClass: 'bg-red-50 text-red-700 border-red-200',
				description: 'Pesanan ini telah dibatalkan.'
			};
		default:
			return {
				label: status,
				badgeClass: 'bg-neutral-100 text-neutral-700 border-neutral-200',
				description: ''
			};
	}
}

export function getPaymentStatusMeta(status: string): { label: string; badgeClass: string } {
	switch (status) {
		case 'unpaid':
			return { label: 'Belum Dibayar', badgeClass: 'bg-amber-50 text-amber-800 border-amber-200' };
		case 'waiting_verification':
			return {
				label: 'Menunggu Verifikasi',
				badgeClass: 'bg-sky-50 text-sky-800 border-sky-200'
			};
		case 'paid':
			return { label: 'Lunas', badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
		case 'failed':
			return { label: 'Gagal', badgeClass: 'bg-red-50 text-red-700 border-red-200' };
		case 'refunded':
			return { label: 'Refund', badgeClass: 'bg-neutral-100 text-neutral-700 border-neutral-200' };
		default:
			return { label: status, badgeClass: 'bg-neutral-100 text-neutral-700 border-neutral-200' };
	}
}

export function getReturnConditionLabel(condition: string | null | undefined): string {
	switch (condition) {
		case 'good':
			return 'Baik & Lengkap';
		case 'minor_issue':
			return 'Catatan Ringan';
		case 'damaged':
			return 'Ada Kerusakan';
		case 'missing_part':
			return 'Kelengkapan Kurang';
		default:
			return 'Belum Diverifikasi';
	}
}
