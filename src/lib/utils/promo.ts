import { formatRupiah } from '#lib/utils/catalog';

export interface PromoCalculable {
	discountType: string;
	discountValue: number;
	maxDiscountAmount: number | null;
	minOrderAmount: number;
}

export function normalizePromoCode(raw: string): string {
	return raw.trim().toUpperCase().replace(/\s+/g, '');
}

export function calculatePromoDiscount(
	promo: PromoCalculable,
	subtotalAmount: number
): number {
	if (subtotalAmount <= 0) return 0;
	if (subtotalAmount < promo.minOrderAmount) return 0;

	if (promo.discountType === 'percentage') {
		const rawDiscount = Math.floor((subtotalAmount * promo.discountValue) / 100);
		const cappedByMax =
			promo.maxDiscountAmount !== null && promo.maxDiscountAmount > 0
				? Math.min(rawDiscount, promo.maxDiscountAmount)
				: rawDiscount;
		return Math.max(0, Math.min(subtotalAmount, cappedByMax));
	}

	return Math.max(0, Math.min(subtotalAmount, promo.discountValue));
}

export function formatPromoBadge(promo: PromoCalculable): string {
	if (promo.discountType === 'percentage') {
		return `Diskon ${promo.discountValue}%`;
	}
	return `Potongan ${formatRupiah(promo.discountValue)}`;
}

export function formatPromoDetail(promo: PromoCalculable): string {
	const parts: string[] = [];
	if (promo.discountType === 'percentage') {
		parts.push(`Diskon ${promo.discountValue}%`);
		if (promo.maxDiscountAmount && promo.maxDiscountAmount > 0) {
			parts.push(`maks. ${formatRupiah(promo.maxDiscountAmount)}`);
		}
	} else {
		parts.push(`Potongan ${formatRupiah(promo.discountValue)}`);
	}
	if (promo.minOrderAmount > 0) {
		parts.push(`min. sewa ${formatRupiah(promo.minOrderAmount)}`);
	}
	return parts.join(' · ');
}
