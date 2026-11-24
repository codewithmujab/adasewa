export const POINT_EARN_UNIT_IDR = 10_000; // 1 Poin setiap Rp 10.000 subtotal sewa
export const POINT_VALUE_IDR = 500; // 1 Poin = Rp 500 potongan transaksi berikutnya
export const MAX_REDEEM_RATIO = 0.5; // Maksimal potongan poin 50% dari subtotal sewa

export function calculateEarnedPoints(
	subtotalAmount: number,
	returnCondition?: string | null
): number {
	if (subtotalAmount <= 0) return 0;
	if (returnCondition === 'damaged' || returnCondition === 'missing_part') {
		return 0;
	}
	return Math.max(1, Math.floor(subtotalAmount / POINT_EARN_UNIT_IDR));
}

export function calculateMaxRedeemablePoints(
	subtotalAmount: number,
	availableBalance: number
): number {
	if (subtotalAmount <= 0 || availableBalance <= 0) return 0;
	const maxDiscountIdr = Math.floor(subtotalAmount * MAX_REDEEM_RATIO);
	const maxPointsBySubtotal = Math.floor(maxDiscountIdr / POINT_VALUE_IDR);
	return Math.max(0, Math.min(Math.trunc(availableBalance), maxPointsBySubtotal));
}

export function calculatePointDiscountIdr(points: number): number {
	return Math.max(0, Math.trunc(points)) * POINT_VALUE_IDR;
}

export function formatPointAccountNumber(userId: string): string {
	const cleaned = userId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8);
	return `ASW-PT-${cleaned.padEnd(8, '0')}`;
}

export function getPointTxMeta(type: string): { label: string; badgeClass: string } {
	switch (type) {
		case 'earn_return':
			return {
				label: 'Poin Pengembalian',
				badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200'
			};
		case 'redeem_checkout':
			return {
				label: 'Potongan Checkout',
				badgeClass: 'bg-amber-50 text-amber-800 border-amber-200'
			};
		case 'refund_cancel':
			return {
				label: 'Pengembalian Poin',
				badgeClass: 'bg-sky-50 text-sky-700 border-sky-200'
			};
		case 'admin_adjust':
			return {
				label: 'Penyesuaian Admin',
				badgeClass: 'bg-violet-50 text-violet-700 border-violet-200'
			};
		default:
			return {
				label: type,
				badgeClass: 'bg-neutral-100 text-neutral-700 border-neutral-200'
			};
	}
}
