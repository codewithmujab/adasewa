import type { Branch, CompanySettings, RentalCategory, RentalItem } from '#lib/server/db/schema';

export const DEFAULT_BOOKING_FORM_URL =
	'https://docs.google.com/forms/d/e/1FAIpQLSc7oXCUZVUNH3gUMrlcaI2MhvNbJiPGnSFFPGNWTLK6wdETRg/viewform';

export const DEFAULT_WHATSAPP_NUMBER = '6285777139748';

export interface BranchStockSnapshot {
	pricePerDay: number;
	stockQty: number;
	isAvailable: boolean;
}

export interface RentalItemWithCategory extends RentalItem {
	category: RentalCategory;
	branchStocks?: Record<string, BranchStockSnapshot>;
}

export function resolveItemBranchPricing(
	item: RentalItemWithCategory,
	branchId: string | null | undefined
): BranchStockSnapshot {
	if (branchId && item.branchStocks && item.branchStocks[branchId]) {
		return item.branchStocks[branchId]!;
	}
	return {
		pricePerDay: item.pricePerDay ?? 0,
		stockQty: item.stockQty,
		isAvailable: item.isPublished
	};
}

export function buildBranchWhatsAppUrl(
	branch: Pick<Branch, 'whatsapp'> | null | undefined,
	settings: CompanySettings,
	message: string
): string {
	const rawWa = branch?.whatsapp?.replace(/\D/g, '');
	if (rawWa && rawWa.length >= 9) {
		const normalized = rawWa.startsWith('0') ? `62${rawWa.slice(1)}` : rawWa;
		return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
	}
	return buildWhatsAppUrl(settings, message);
}

export interface CategorySummary extends RentalCategory {
	itemCount: number;
	previewItems: string[];
}

export interface CategoryAccentTheme {
	surfaceBg: string;
	iconBg: string;
	iconText: string;
	badgeBg: string;
	badgeText: string;
	border: string;
}

const ACCENT_THEMES: Record<string, CategoryAccentTheme> = {
	indigo: {
		surfaceBg: 'from-indigo-50/90 via-slate-50 to-white',
		iconBg: 'bg-indigo-600/10',
		iconText: 'text-indigo-700',
		badgeBg: 'bg-indigo-50',
		badgeText: 'text-indigo-700',
		border: 'border-indigo-200/70'
	},
	emerald: {
		surfaceBg: 'from-emerald-50/90 via-teal-50/40 to-white',
		iconBg: 'bg-emerald-600/10',
		iconText: 'text-emerald-700',
		badgeBg: 'bg-emerald-50',
		badgeText: 'text-emerald-700',
		border: 'border-emerald-200/70'
	},
	amber: {
		surfaceBg: 'from-amber-50/90 via-orange-50/40 to-white',
		iconBg: 'bg-amber-600/10',
		iconText: 'text-amber-700',
		badgeBg: 'bg-amber-50',
		badgeText: 'text-amber-800',
		border: 'border-amber-200/70'
	},
	sky: {
		surfaceBg: 'from-sky-50/90 via-cyan-50/40 to-white',
		iconBg: 'bg-sky-600/10',
		iconText: 'text-sky-700',
		badgeBg: 'bg-sky-50',
		badgeText: 'text-sky-700',
		border: 'border-sky-200/70'
	},
	rose: {
		surfaceBg: 'from-rose-50/90 via-pink-50/40 to-white',
		iconBg: 'bg-rose-600/10',
		iconText: 'text-rose-700',
		badgeBg: 'bg-rose-50',
		badgeText: 'text-rose-700',
		border: 'border-rose-200/70'
	},
	violet: {
		surfaceBg: 'from-violet-50/90 via-purple-50/40 to-white',
		iconBg: 'bg-violet-600/10',
		iconText: 'text-violet-700',
		badgeBg: 'bg-violet-50',
		badgeText: 'text-violet-700',
		border: 'border-violet-200/70'
	},
	teal: {
		surfaceBg: 'from-teal-50/90 via-cyan-50/40 to-white',
		iconBg: 'bg-teal-600/10',
		iconText: 'text-teal-700',
		badgeBg: 'bg-teal-50',
		badgeText: 'text-teal-700',
		border: 'border-teal-200/70'
	},
	orange: {
		surfaceBg: 'from-orange-50/90 via-amber-50/40 to-white',
		iconBg: 'bg-orange-600/10',
		iconText: 'text-orange-700',
		badgeBg: 'bg-orange-50',
		badgeText: 'text-orange-700',
		border: 'border-orange-200/70'
	},
	lime: {
		surfaceBg: 'from-lime-50/90 via-emerald-50/40 to-white',
		iconBg: 'bg-lime-600/10',
		iconText: 'text-lime-700',
		badgeBg: 'bg-lime-50',
		badgeText: 'text-lime-800',
		border: 'border-lime-200/70'
	},
	slate: {
		surfaceBg: 'from-slate-100/90 via-neutral-50 to-white',
		iconBg: 'bg-slate-900/10',
		iconText: 'text-slate-800',
		badgeBg: 'bg-slate-100',
		badgeText: 'text-slate-700',
		border: 'border-slate-200/80'
	}
};

export function getCategoryTheme(accent: string | undefined | null): CategoryAccentTheme {
	if (accent && accent in ACCENT_THEMES) {
		const found = ACCENT_THEMES[accent];
		if (found) return found;
	}
	return ACCENT_THEMES.slate!;
}

export function formatRupiah(amount: number): string {
	return new Intl.NumberFormat('id-ID', {
		style: 'currency',
		currency: 'IDR',
		maximumFractionDigits: 0
	}).format(amount);
}

export function getBookingFormUrl(settings: CompanySettings): string {
	return settings.socialLinks.bookingForm || DEFAULT_BOOKING_FORM_URL;
}

export function extractWhatsAppNumber(settings: CompanySettings): string {
	const waLink = settings.socialLinks.whatsapp;
	if (waLink) {
		const digits = waLink.replace(/\D/g, '');
		if (digits.length >= 9) {
			return digits.startsWith('0') ? `62${digits.slice(1)}` : digits;
		}
	}
	if (settings.phone) {
		const digits = settings.phone.replace(/\D/g, '');
		if (digits.length >= 9) {
			return digits.startsWith('0') ? `62${digits.slice(1)}` : digits;
		}
	}
	return DEFAULT_WHATSAPP_NUMBER;
}

export function buildWhatsAppUrl(settings: CompanySettings, message: string): string {
	const number = extractWhatsAppNumber(settings);
	return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
