import {
	addDaysIsoDate,
	calculateDurationDays,
	getTodayIsoDate
} from '#lib/utils/orders';

export interface CartLineItem {
	key: string;
	itemId: string;
	slug: string;
	name: string;
	categoryName: string;
	imageUrl: string | null;
	variant: string | null;
	pricePerDay: number;
	unitLabel: string;
	quantity: number;
	stockQty: number;
	requiresDeposit: boolean;
}

export interface AddToCartPayload {
	itemId: string;
	slug: string;
	name: string;
	categoryName: string;
	imageUrl: string | null;
	variant?: string | null;
	pricePerDay: number;
	unitLabel: string;
	quantity?: number;
	stockQty: number;
	requiresDeposit: boolean;
	startDate?: string;
	endDate?: string;
}

interface PersistedCart {
	items: CartLineItem[];
	startDate: string;
	endDate: string;
}

const STORAGE_KEY = 'adasewa_rental_cart_v1';

function buildCartKey(itemId: string, variant: string | null | undefined): string {
	const normalized = variant?.trim() ?? '';
	return `${itemId}::${normalized}`;
}

function getDefaultDates(): { startDate: string; endDate: string } {
	const startDate = addDaysIsoDate(getTodayIsoDate(), 1);
	const endDate = startDate;
	return { startDate, endDate };
}

function createRentalCart() {
	const defaults = getDefaultDates();

	let items = $state<CartLineItem[]>([]);
	let startDate = $state<string>(defaults.startDate);
	let endDate = $state<string>(defaults.endDate);
	let drawerOpen = $state<boolean>(false);
	let hydrated = $state<boolean>(false);

	function persist(): void {
		if (typeof window === 'undefined') return;
		try {
			const payload: PersistedCart = { items, startDate, endDate };
			window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
		} catch {
			// Abaikan jika storage penuh / mode privat
		}
	}

	function hydrate(): void {
		if (hydrated || typeof window === 'undefined') return;
		hydrated = true;
		try {
			const raw = window.localStorage.getItem(STORAGE_KEY);
			if (!raw) return;
			const parsed = JSON.parse(raw) as Partial<PersistedCart>;
			if (Array.isArray(parsed.items)) {
				items = parsed.items.filter(
					(entry): entry is CartLineItem =>
						typeof entry === 'object' &&
						entry !== null &&
						typeof entry.itemId === 'string' &&
						typeof entry.name === 'string' &&
						typeof entry.quantity === 'number' &&
						entry.quantity > 0
				);
			}
			const today = getTodayIsoDate();
			if (typeof parsed.startDate === 'string' && parsed.startDate >= today) {
				startDate = parsed.startDate;
			}
			if (typeof parsed.endDate === 'string' && parsed.endDate >= startDate) {
				endDate = parsed.endDate;
			} else {
				endDate = startDate;
			}
		} catch {
			// Abaikan JSON rusak
		}
	}

	function addItem(payload: AddToCartPayload, openDrawerAfter = true): void {
		const variant = payload.variant?.trim() ? payload.variant.trim() : null;
		const key = buildCartKey(payload.itemId, variant);
		const addQty = Math.max(1, Math.trunc(payload.quantity ?? 1));

		if (payload.startDate) {
			startDate = payload.startDate;
			if (payload.endDate && payload.endDate >= payload.startDate) {
				endDate = payload.endDate;
			} else if (endDate < payload.startDate) {
				endDate = payload.startDate;
			}
		}

		const existingIndex = items.findIndex((i) => i.key === key);
		if (existingIndex >= 0) {
			const current = items[existingIndex];
			if (current) {
				const maxAllowed = Math.max(1, current.stockQty || 99);
				items = items.map((entry, idx) =>
					idx === existingIndex
						? {
								...entry,
								pricePerDay: payload.pricePerDay,
								quantity: Math.min(maxAllowed, entry.quantity + addQty)
							}
						: entry
				);
			}
		} else {
			items = [
				...items,
				{
					key,
					itemId: payload.itemId,
					slug: payload.slug,
					name: payload.name,
					categoryName: payload.categoryName,
					imageUrl: payload.imageUrl,
					variant,
					pricePerDay: payload.pricePerDay,
					unitLabel: payload.unitLabel,
					quantity: Math.min(Math.max(1, payload.stockQty || 99), addQty),
					stockQty: Math.max(1, payload.stockQty || 1),
					requiresDeposit: payload.requiresDeposit
				}
			];
		}

		persist();
		if (openDrawerAfter) {
			drawerOpen = true;
		}
	}

	function updateQuantity(key: string, nextQty: number): void {
		const cleanQty = Math.trunc(nextQty);
		if (cleanQty <= 0) {
			removeItem(key);
			return;
		}
		items = items.map((entry) =>
			entry.key === key
				? { ...entry, quantity: Math.min(Math.max(1, entry.stockQty || 99), cleanQty) }
				: entry
		);
		persist();
	}

	function removeItem(key: string): void {
		items = items.filter((entry) => entry.key !== key);
		persist();
	}

	function setDates(nextStart: string, nextEnd: string): void {
		if (nextStart) {
			startDate = nextStart;
		}
		if (nextEnd && nextEnd >= startDate) {
			endDate = nextEnd;
		} else {
			endDate = startDate;
		}
		persist();
	}

	function clear(): void {
		items = [];
		const nextDefaults = getDefaultDates();
		startDate = nextDefaults.startDate;
		endDate = nextDefaults.endDate;
		persist();
	}

	function openDrawer(): void {
		drawerOpen = true;
	}

	function closeDrawer(): void {
		drawerOpen = false;
	}

	return {
		get items(): CartLineItem[] {
			return items;
		},
		get startDate(): string {
			return startDate;
		},
		get endDate(): string {
			return endDate;
		},
		get drawerOpen(): boolean {
			return drawerOpen;
		},
		get hydrated(): boolean {
			return hydrated;
		},
		get distinctCount(): number {
			return items.length;
		},
		get totalUnits(): number {
			return items.reduce((acc, item) => acc + item.quantity, 0);
		},
		get durationDays(): number {
			return calculateDurationDays(startDate, endDate);
		},
		get subtotalPerDay(): number {
			return items.reduce((acc, item) => acc + item.pricePerDay * item.quantity, 0);
		},
		get estimatedSubtotal(): number {
			const days = calculateDurationDays(startDate, endDate);
			return items.reduce((acc, item) => acc + item.pricePerDay * item.quantity * days, 0);
		},
		get hasDepositItems(): boolean {
			return items.some((item) => item.requiresDeposit);
		},
		hydrate,
		addItem,
		updateQuantity,
		removeItem,
		setDates,
		clear,
		openDrawer,
		closeDrawer
	};
}

export const rentalCart = createRentalCart();
