import { and, desc, eq, sql } from 'drizzle-orm';
import type { Database } from '#lib/server/db';
import { promoCodes, type PromoCode } from '#lib/server/db/schema';
import { formatRupiah } from '#lib/utils/catalog';
import { calculatePromoDiscount, normalizePromoCode } from '#lib/utils/promo';

export type PromoValidationResult =
	| { ok: true; promo: PromoCode; discountAmount: number }
	| { ok: false; message: string };

export function isPromoCurrentlyValid(promo: PromoCode, now = new Date()): boolean {
	if (!promo.isActive) return false;
	if (promo.startsAt && promo.startsAt > now) return false;
	if (promo.expiresAt && promo.expiresAt < now) return false;
	if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit) return false;
	return true;
}

export async function getActivePublicPromos(
	db: Database,
	onlyLanding = false
): Promise<PromoCode[]> {
	const condition = onlyLanding
		? and(eq(promoCodes.isActive, true), eq(promoCodes.showOnLanding, true))
		: eq(promoCodes.isActive, true);

	const rows = await db
		.select()
		.from(promoCodes)
		.where(condition)
		.orderBy(desc(promoCodes.createdAt))
		.limit(20);

	const now = new Date();
	return rows.filter((row) => isPromoCurrentlyValid(row, now));
}

export async function validatePromoForSubtotal(
	db: Database,
	rawCode: string,
	subtotalAmount: number
): Promise<PromoValidationResult> {
	const normalized = normalizePromoCode(rawCode);
	if (!normalized) {
		return { ok: false, message: 'Masukkan kode promo yang valid.' };
	}

	const [promo] = await db
		.select()
		.from(promoCodes)
		.where(eq(promoCodes.code, normalized))
		.limit(1);

	if (!promo) {
		return { ok: false, message: `Kode promo "${normalized}" tidak ditemukan.` };
	}

	if (!promo.isActive) {
		return { ok: false, message: `Promo "${promo.code}" sedang tidak aktif.` };
	}

	const now = new Date();
	if (promo.startsAt && promo.startsAt > now) {
		return { ok: false, message: `Promo "${promo.code}" belum mulai berlaku.` };
	}
	if (promo.expiresAt && promo.expiresAt < now) {
		return { ok: false, message: `Promo "${promo.code}" sudah berakhir.` };
	}
	if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit) {
		return { ok: false, message: `Kuota promo "${promo.code}" sudah habis.` };
	}
	if (subtotalAmount < promo.minOrderAmount) {
		return {
			ok: false,
			message: `Minimal subtotal sewa ${formatRupiah(promo.minOrderAmount)} untuk menggunakan kode "${promo.code}".`
		};
	}

	const discountAmount = calculatePromoDiscount(promo, subtotalAmount);
	if (discountAmount <= 0) {
		return { ok: false, message: `Promo "${promo.code}" tidak dapat diterapkan pada pesanan ini.` };
	}

	return { ok: true, promo, discountAmount };
}

export async function incrementPromoUsage(db: Database, promoId: string): Promise<boolean> {
	const [updated] = await db
		.update(promoCodes)
		.set({
			usedCount: sql`${promoCodes.usedCount} + 1`,
			updatedAt: new Date()
		})
		.where(
			and(
				eq(promoCodes.id, promoId),
				sql`(${promoCodes.usageLimit} IS NULL OR ${promoCodes.usedCount} < ${promoCodes.usageLimit})`
			)
		)
		.returning({ id: promoCodes.id });

	return Boolean(updated);
}

export async function decrementPromoUsage(db: Database, promoId: string): Promise<void> {
	await db
		.update(promoCodes)
		.set({
			usedCount: sql`GREATEST(0, ${promoCodes.usedCount} - 1)`,
			updatedAt: new Date()
		})
		.where(eq(promoCodes.id, promoId));
}
