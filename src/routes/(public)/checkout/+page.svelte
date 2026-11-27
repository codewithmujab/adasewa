<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { authClient } from '#lib/auth-client';
	import { rentalCart } from '#lib/stores/cart.svelte';
	import type { RentalOrder, RentalOrderItem } from '#lib/server/db/schema';
	import type { ApiResponse } from '#lib/types/api';
	import { formatRupiah } from '#lib/utils/catalog';
	import {
		DELIVERY_REGIONS,
		INFO_SOURCES,
		PAYMENT_METHODS,
		formatDateId,
		getDeliveryFee,
		getTodayIsoDate,
		type PaymentMethodId
	} from '#lib/utils/orders';
	import {
		POINT_VALUE_IDR,
		calculateEarnedPoints,
		calculateMaxRedeemablePoints,
		calculatePointDiscountIdr
	} from '#lib/utils/points';
	import {
		calculatePromoDiscount,
		formatPromoBadge,
		formatPromoDetail,
		normalizePromoCode
	} from '#lib/utils/promo';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
	const today = getTodayIsoDate();

	// State Auth Inline (jika pemesan belum login saat masuk checkout)
	let authMode = $state<'signup' | 'signin'>('signup');
	let authName = $state('');
	let authEmail = $state('');
	let authPassword = $state('');
	let authBusy = $state(false);
	let authError = $state<string | null>(null);

	// State Form Checkout
	let customerName = $state('');
	let customerPhone = $state('');
	let emergencyPhone = $state('');
	let deliveryMethod = $state<'delivery' | 'pickup'>('delivery');
	let deliveryRegion = $state<string>('DKI Jakarta');
	let deliveryAddress = $state('');
	interface AppliedPromoInfo {
		id: string;
		code: string;
		title: string;
		branchId?: string | null;
		discountType: string;
		discountValue: number;
		maxDiscountAmount: number | null;
		minOrderAmount: number;
	}

	let activeBranch = $derived(
		data.branches.find((b) => b.id === rentalCart.branchId) ?? data.branches[0] ?? null
	);

	let branchEligiblePromos = $derived(
		data.activePromos.filter((p) => !p.branchId || p.branchId === activeBranch?.id)
	);

	function handleBranchSwitch(branch: (typeof data.branches)[number]): void {
		rentalCart.selectBranch(branch);
		if (appliedPromo && appliedPromo.branchId && appliedPromo.branchId !== branch.id) {
			appliedPromo = null;
			promoError = `Promo sebelumnya tidak berlaku untuk ${branch.name}.`;
		}
	}

	let paymentMethod = $state<PaymentMethodId>('bank_transfer');
	let promoCodeInput = $state('');
	let appliedPromo = $state<AppliedPromoInfo | null>(null);
	let promoBusy = $state(false);
	let promoError = $state<string | null>(null);
	let usePoints = $state(false);
	let pointsToRedeem = $state(0);
	let infoSource = $state('Instagram');
	let notes = $state('');

	let submitting = $state(false);
	let submitError = $state<string | null>(null);
	let fieldErrors = $state<Record<string, string[]>>({});

	$effect(() => {
		if (data.currentUser) {
			if (!customerName) customerName = data.currentUser.name;
		}
		if (data.lastOrderProfile) {
			if (!customerPhone) customerPhone = data.lastOrderProfile.customerPhone;
			if (!emergencyPhone && data.lastOrderProfile.emergencyPhone) {
				emergencyPhone = data.lastOrderProfile.emergencyPhone;
			}
			if (
				data.lastOrderProfile.deliveryRegion &&
				DELIVERY_REGIONS.some((r) => r.value === data.lastOrderProfile?.deliveryRegion)
			) {
				deliveryRegion = data.lastOrderProfile.deliveryRegion;
			}
			if (!deliveryAddress && data.lastOrderProfile.deliveryAddress) {
				deliveryAddress = data.lastOrderProfile.deliveryAddress;
			}
		}
	});

	let availablePaymentMethods = $derived(
		PAYMENT_METHODS.filter((method) =>
			deliveryMethod === 'delivery' ? method.deliveryAllowed : method.pickupAllowed
		)
	);

	$effect(() => {
		if (deliveryMethod === 'delivery' && paymentMethod === 'cod_kios') {
			paymentMethod = 'bank_transfer';
		}
	});

	let deliveryFee = $derived(
		deliveryMethod === 'pickup'
			? 0
			: (activeBranch?.deliveryFeeDefault ?? getDeliveryFee(deliveryMethod, deliveryRegion))
	);
	let promoDiscount = $derived(
		appliedPromo ? calculatePromoDiscount(appliedPromo, rentalCart.estimatedSubtotal) : 0
	);
	let subtotalAfterPromo = $derived(Math.max(0, rentalCart.estimatedSubtotal - promoDiscount));
	let availablePoints = $derived(data.currentUser?.pointBalance ?? 0);
	let maxRedeemablePoints = $derived(
		calculateMaxRedeemablePoints(subtotalAfterPromo, availablePoints)
	);
	let effectivePointsToRedeem = $derived(
		usePoints ? Math.max(0, Math.min(maxRedeemablePoints, Math.trunc(Number(pointsToRedeem) || 0))) : 0
	);
	let pointsDiscount = $derived(calculatePointDiscountIdr(effectivePointsToRedeem));
	let grandTotal = $derived(
		Math.max(0, rentalCart.estimatedSubtotal + deliveryFee - promoDiscount - pointsDiscount)
	);
	let estimatedEarnedPoints = $derived(calculateEarnedPoints(rentalCart.estimatedSubtotal));

	async function applyPromoCode(rawCode?: string): Promise<void> {
		const codeToCheck = normalizePromoCode(rawCode ?? promoCodeInput);
		if (!codeToCheck) {
			promoError = 'Masukkan kode promo terlebih dahulu.';
			return;
		}
		promoCodeInput = codeToCheck;
		promoBusy = true;
		promoError = null;

		try {
			const response = await fetch('/api/promos/validate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					code: codeToCheck,
					subtotalAmount: rentalCart.estimatedSubtotal,
					branchId: activeBranch?.id ?? null
				})
			});

			const result = (await response.json()) as ApiResponse<{
				promo: AppliedPromoInfo;
				discountAmount: number;
			}>;

			if (!response.ok || !result.success || !result.data) {
				appliedPromo = null;
				promoError = result.message || 'Kode promo tidak dapat digunakan.';
				return;
			}

			appliedPromo = result.data.promo;
			promoError = null;
		} catch {
			promoError = 'Gangguan jaringan saat mengecek kode promo.';
		} finally {
			promoBusy = false;
		}
	}

	function removePromo(): void {
		appliedPromo = null;
		promoCodeInput = '';
		promoError = null;
	}

	async function handleInlineAuth(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		authError = null;
		authBusy = true;

		try {
			if (authMode === 'signup') {
				const res = await authClient.signUp.email({
					name: authName.trim(),
					email: authEmail.trim(),
					password: authPassword
				});
				if (res.error) {
					authError = res.error.message || 'Gagal mendaftar. Coba gunakan email lain.';
					return;
				}
				customerName = authName.trim();
			} else {
				const res = await authClient.signIn.email({
					email: authEmail.trim(),
					password: authPassword
				});
				if (res.error) {
					authError = res.error.message || 'Email atau kata sandi tidak cocok.';
					return;
				}
			}

			await invalidateAll();
		} catch {
			authError = 'Gangguan jaringan saat menghubungi server autentikasi.';
		} finally {
			authBusy = false;
		}
	}

	async function handleCreateOrder(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		if (rentalCart.items.length === 0) return;

		submitting = true;
		submitError = null;
		fieldErrors = {};

		try {
			const response = await fetch('/api/orders', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					branchId: activeBranch?.id ?? null,
					customerName: customerName.trim(),
					customerPhone: customerPhone.trim(),
					emergencyPhone: emergencyPhone.trim() || null,
					deliveryMethod,
					deliveryRegion:
						deliveryMethod === 'delivery'
							? deliveryRegion
							: `Ambil di Kios ${activeBranch?.name ?? ''}`.trim(),
					deliveryAddress: deliveryMethod === 'delivery' ? deliveryAddress.trim() : null,
					startDate: rentalCart.startDate,
					endDate: rentalCart.endDate,
					paymentMethod,
					promoCode: appliedPromo && promoDiscount > 0 ? appliedPromo.code : null,
					pointsToRedeem: effectivePointsToRedeem,
					infoSource: infoSource || null,
					notes: notes.trim() || null,
					items: rentalCart.items.map((item) => ({
						itemId: item.itemId,
						variant: item.variant,
						quantity: item.quantity
					}))
				})
			});

			const result = (await response.json()) as ApiResponse<
				RentalOrder & { items: RentalOrderItem[] }
			>;

			if (!response.ok || !result.success || !result.data) {
				submitError = result.message || 'Gagal membuat pesanan. Periksa kembali isian Anda.';
				fieldErrors = result.errors ?? {};
				return;
			}

			const createdCode = result.data.orderCode;
			rentalCart.clear();
			await goto(`/akun/pesanan/${createdCode}`, { refreshAll: true });
		} catch {
			submitError = 'Gangguan jaringan saat menyimpan transaksi pesanan.';
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Checkout &amp; Pembayaran — {data.settings.companyName}</title>
</svelte:head>

<section class="bg-black py-10 pb-24 sm:py-14">
	<div class="mx-auto max-w-6xl px-6">
		<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
			<div>
				<span
					class="inline-flex rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1 text-[11px] font-bold tracking-widest text-neutral-300 uppercase"
				>
					Langkah 2 dari 2
				</span>
				<h1 class="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
					Checkout &amp; Pembayaran
				</h1>
				<p class="mt-2 text-sm text-neutral-400">
					Lengkapi akun pemesan, alamat pengiriman, dan metode pembayaran untuk mencatat transaksi.
				</p>
			</div>

			<a
				href="/keranjang"
				class="inline-flex items-center rounded-full border border-white/20 bg-white/[0.06] px-5 py-2.5 text-xs font-bold text-white transition hover:border-white hover:bg-white hover:text-black"
			>
				← Ubah Isi Keranjang
			</a>
		</div>

		{#if rentalCart.items.length === 0}
			<div class="mt-10 rounded-[2.5rem] border border-white/15 bg-[#0c0c0f] p-14 text-center">
				<h2 class="text-xl font-extrabold text-white">Belum ada barang di keranjang</h2>
				<p class="mt-2 text-sm text-neutral-400">
					Pilih barang di katalog terlebih dahulu sebelum masuk ke halaman checkout.
				</p>
				<a
					href="/katalog"
					class="mt-6 inline-flex rounded-full bg-white px-8 py-3.5 text-sm font-bold text-black transition hover:bg-neutral-200"
				>
					Buka Katalog Barang
				</a>
			</div>
		{:else}
			<div class="mt-8 grid gap-8 lg:grid-cols-12">
				<!-- Kiri: Cabang Aktif + Gate Registrasi/Login ATAU Form Alamat & Pembayaran -->
				<div class="space-y-6 lg:col-span-7">
					<!-- Cabang Penyewaan Aktif -->
					{#if data.branches.length > 0}
						<div class="rounded-[2rem] border border-emerald-400/25 bg-emerald-400/10 p-5 sm:p-6">
							<div class="flex flex-wrap items-start justify-between gap-3">
								<div>
									<p class="text-[11px] font-bold tracking-wider text-emerald-300 uppercase">
										📍 Cabang Penyewaan Dipilih
									</p>
									<p class="mt-0.5 text-base font-extrabold text-white">
										{activeBranch?.name ?? 'Belum dipilih'}
									</p>
									{#if activeBranch}
										<p class="mt-0.5 text-xs text-neutral-300">
											Kios: {activeBranch.address}
										</p>
										<p class="mt-0.5 text-xs text-neutral-300">
											WA CS Cabang: <strong class="text-white">{activeBranch.phone}</strong> · Jam:
											{activeBranch.operatingHours}
										</p>
									{/if}
								</div>
								<div class="flex flex-wrap gap-1.5">
									{#each data.branches as branch (branch.id)}
										<button
											type="button"
											onclick={() => handleBranchSwitch(branch)}
											class="rounded-full px-3.5 py-1.5 text-xs font-bold transition {activeBranch?.id ===
											branch.id
												? 'bg-white text-black'
												: 'border border-white/20 bg-black/60 text-neutral-200 hover:border-white'}"
										>
											{branch.name}
										</button>
									{/each}
								</div>
							</div>
						</div>
					{/if}

					{#if !data.isAuthenticated || !data.currentUser}
						<div class="rounded-[2.25rem] border border-white/15 bg-[#0c0c0f] p-6 sm:p-8">
							<div>
								<span
									class="inline-flex rounded-full border border-amber-400/30 bg-amber-400/15 px-3.5 py-1 text-[11px] font-bold text-amber-300"
								>
									Akun Pemesan Diperlukan
								</span>
								<h2 class="mt-3 text-xl font-extrabold tracking-tight text-white">
									Daftar atau Masuk untuk Melanjutkan Pembayaran
								</h2>
								<p class="mt-1.5 text-sm text-neutral-400">
									Dengan akun pemesan, riwayat transaksi, invoice, status pembayaran, dan jadwal
									pengembalian barang Anda tersimpan rapi di Dashboard Pemesan.
								</p>
							</div>

							<div class="mt-6 grid grid-cols-2 rounded-full border border-white/15 bg-black p-1 text-xs font-bold">
								<button
									type="button"
									onclick={() => {
										authMode = 'signup';
										authError = null;
									}}
									class="rounded-full py-2.5 transition {authMode === 'signup'
										? 'bg-white text-black'
										: 'text-neutral-400 hover:text-white'}"
								>
									Daftar Pemesan Baru
								</button>
								<button
									type="button"
									onclick={() => {
										authMode = 'signin';
										authError = null;
									}}
									class="rounded-full py-2.5 transition {authMode === 'signin'
										? 'bg-white text-black'
										: 'text-neutral-400 hover:text-white'}"
								>
									Sudah Punya Akun? Masuk
								</button>
							</div>

							{#if authError}
								<div
									role="alert"
									class="mt-5 rounded-2xl border border-red-400/30 bg-red-500/15 px-4 py-3 text-sm text-red-200"
								>
									{authError}
								</div>
							{/if}

							<form onsubmit={handleInlineAuth} class="mt-5 space-y-4">
								{#if authMode === 'signup'}
									<div>
										<label for="co-auth-name" class="block text-xs font-semibold text-neutral-300">
											Nama Lengkap *
										</label>
										<input
											id="co-auth-name"
											type="text"
											required
											minlength="2"
											bind:value={authName}
											placeholder="Nama lengkap sesuai identitas"
											class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-white focus:outline-none"
										/>
									</div>
								{/if}

								<div>
									<label for="co-auth-email" class="block text-xs font-semibold text-neutral-300">
										Email *
									</label>
									<input
										id="co-auth-email"
										type="email"
										required
										bind:value={authEmail}
										placeholder="email@anda.com"
										class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-white focus:outline-none"
									/>
								</div>

								<div>
									<label for="co-auth-pass" class="block text-xs font-semibold text-neutral-300">
										Kata Sandi *
									</label>
									<input
										id="co-auth-pass"
										type="password"
										required
										minlength="8"
										bind:value={authPassword}
										placeholder="Minimal 8 karakter"
										class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-white focus:outline-none"
									/>
								</div>

								<button
									type="submit"
									disabled={authBusy}
									class="w-full rounded-full bg-white px-6 py-4 text-sm font-extrabold text-black transition hover:bg-neutral-200 disabled:opacity-60"
								>
									{#if authBusy}
										Memproses...
									{:else if authMode === 'signup'}
										Daftar &amp; Lanjut Isi Alamat →
									{:else}
										Masuk &amp; Lanjut Isi Alamat →
									{/if}
								</button>
							</form>
						</div>
					{:else}
						<!-- Banner User Sudah Login -->
						<div
							class="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-white/15 bg-[#0e0e12] px-5 py-3.5"
						>
							<div class="text-xs text-neutral-300">
								<span class="font-bold text-white">Masuk sebagai {data.currentUser.name}</span>
								<span class="text-neutral-400"> ({data.currentUser.email})</span>
							</div>
							<a href="/akun" class="text-xs font-bold text-emerald-300 underline">
								Dashboard Pemesan
							</a>
						</div>

						<form onsubmit={handleCreateOrder} class="space-y-6">
							{#if submitError}
								<div
									role="alert"
									class="rounded-2xl border border-red-400/30 bg-red-500/15 px-4 py-3 text-sm text-red-200"
								>
									{submitError}
								</div>
							{/if}

							<!-- 1. Data Pemesan -->
							<section class="rounded-[2rem] border border-white/15 bg-[#0c0c0f] p-6">
								<h2 class="text-base font-extrabold text-white">1. Data Pemesan &amp; Kontak</h2>
								<div class="mt-4 grid gap-4 sm:grid-cols-2">
									<div class="sm:col-span-2">
										<label for="co-name" class="block text-xs font-semibold text-neutral-300">
											Nama Lengkap Pemesan *
										</label>
										<input
											id="co-name"
											type="text"
											required
											bind:value={customerName}
											class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-3 text-sm text-white focus:border-white focus:outline-none"
										/>
										{#if fieldErrors.customerName?.[0]}
											<p class="mt-1 text-xs text-red-400">{fieldErrors.customerName[0]}</p>
										{/if}
									</div>

									<div>
										<label for="co-phone" class="block text-xs font-semibold text-neutral-300">
											Nomor HP / WhatsApp Aktif *
										</label>
										<input
											id="co-phone"
											type="tel"
											required
											bind:value={customerPhone}
											placeholder="0812xxxxxxxx"
											class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-white focus:outline-none"
										/>
										{#if fieldErrors.customerPhone?.[0]}
											<p class="mt-1 text-xs text-red-400">{fieldErrors.customerPhone[0]}</p>
										{/if}
									</div>

									<div>
										<label for="co-emg" class="block text-xs font-semibold text-neutral-300">
											Nomor HP Darurat (Keluarga/Rekan)
										</label>
										<input
											id="co-emg"
											type="tel"
											bind:value={emergencyPhone}
											placeholder="08xxxxxxxxxx (disarankan)"
											class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-white focus:outline-none"
										/>
									</div>
								</div>
							</section>

							<!-- 2. Jadwal Sewa & Pengembalian -->
							<section class="rounded-[2rem] border border-white/15 bg-[#0c0c0f] p-6">
								<div class="flex items-center justify-between gap-2">
									<h2 class="text-base font-extrabold text-white">
										2. Tanggal Pemakaian &amp; Pengembalian
									</h2>
									<span class="rounded-full bg-white px-3.5 py-1 text-xs font-extrabold text-black">
										{rentalCart.durationDays} hari
									</span>
								</div>
								<div class="mt-4 grid gap-4 sm:grid-cols-2">
									<div>
										<label for="co-start" class="block text-xs font-semibold text-neutral-300">
											Mulai Tanggal Pemakaian *
										</label>
										<input
											id="co-start"
											type="date"
											required
											min={today}
											value={rentalCart.startDate}
											onchange={(e) => rentalCart.setDates(e.currentTarget.value, rentalCart.endDate)}
											class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-3 text-sm font-semibold text-white [color-scheme:dark] focus:border-white focus:outline-none"
										/>
									</div>
									<div>
										<label for="co-end" class="block text-xs font-semibold text-neutral-300">
											Sampai Tanggal (Batas Pengembalian) *
										</label>
										<input
											id="co-end"
											type="date"
											required
											min={rentalCart.startDate || today}
											value={rentalCart.endDate}
											onchange={(e) => rentalCart.setDates(rentalCart.startDate, e.currentTarget.value)}
											class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-3 text-sm font-semibold text-white [color-scheme:dark] focus:border-white focus:outline-none"
										/>
									</div>
								</div>
							</section>

							<!-- 3. Pengiriman & Alamat -->
							<section class="rounded-[2rem] border border-white/15 bg-[#0c0c0f] p-6">
								<h2 class="text-base font-extrabold text-white">3. Metode Pengiriman &amp; Alamat</h2>

								<div class="mt-4 grid gap-3 sm:grid-cols-2">
									<button
										type="button"
										onclick={() => (deliveryMethod = 'delivery')}
										class="rounded-[1.5rem] border p-4 text-left transition {deliveryMethod === 'delivery'
											? 'border-white bg-white text-black'
											: 'border-white/15 bg-black text-white hover:border-white/40'}"
									>
										<p class="text-sm font-bold">Antar ke Lokasi (Delivery)</p>
										<p
											class="mt-1 text-xs {deliveryMethod === 'delivery'
												? 'text-neutral-700'
												: 'text-neutral-400'}"
										>
											Tarif dasar {activeBranch?.name ?? 'cabang'}: {formatRupiah(
												activeBranch?.deliveryFeeDefault ?? 25000
											)}
										</p>
									</button>

									<button
										type="button"
										onclick={() => (deliveryMethod = 'pickup')}
										class="rounded-[1.5rem] border p-4 text-left transition {deliveryMethod === 'pickup'
											? 'border-white bg-white text-black'
											: 'border-white/15 bg-black text-white hover:border-white/40'}"
									>
										<p class="text-sm font-bold">
											Ambil di Kios {activeBranch?.name ?? ''}
										</p>
										<p
											class="mt-1 text-xs {deliveryMethod === 'pickup'
												? 'text-neutral-700'
												: 'text-neutral-400'}"
										>
											Gratis ongkir (Rp 0) · {activeBranch?.address ?? 'Ambil & kembali di kios'}
										</p>
									</button>
								</div>

								{#if deliveryMethod === 'delivery'}
									<div class="mt-5 space-y-4">
										<div>
											<label for="co-region" class="block text-xs font-semibold text-neutral-300">
												Wilayah Delivery *
											</label>
											<select
												id="co-region"
												bind:value={deliveryRegion}
												class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-3 text-sm text-white [color-scheme:dark] focus:border-white focus:outline-none"
											>
												{#each DELIVERY_REGIONS as reg (reg.value)}
													<option value={reg.value} class="bg-neutral-950">
														{reg.label} — {reg.areas}
													</option>
												{/each}
											</select>
										</div>

										<div>
											<label for="co-address" class="block text-xs font-semibold text-neutral-300">
												Alamat Pengiriman Lengkap *
											</label>
											<textarea
												id="co-address"
												rows="3"
												required
												bind:value={deliveryAddress}
												placeholder="Nama jalan, nomor rumah/gedung, patokan, kecamatan & kota..."
												class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-white focus:outline-none"
											></textarea>
											{#if fieldErrors.deliveryAddress?.[0]}
												<p class="mt-1 text-xs text-red-400">{fieldErrors.deliveryAddress[0]}</p>
											{/if}
										</div>
									</div>
								{/if}
							</section>

							<!-- 4. Metode Pembayaran -->
							<section class="rounded-[2rem] border border-white/15 bg-[#0c0c0f] p-6">
								<div class="flex flex-wrap items-center justify-between gap-2">
									<div>
										<h2 class="text-base font-extrabold text-white">4. Metode Pembayaran</h2>
										<p class="mt-0.5 text-xs text-neutral-400">
											Pembayaran seluruh cabang menggunakan <strong class="text-white"
												>Rekening Terpusat Adasewa.id</strong
											>.
										</p>
									</div>
									<span
										class="rounded-full border border-sky-400/30 bg-sky-400/15 px-3 py-1 text-[11px] font-bold text-sky-300"
									>
										Rekening Terpusat · Siap PG
									</span>
								</div>

								<div class="mt-4 space-y-2.5">
									{#each availablePaymentMethods as method (method.id)}
										<label
											class="flex cursor-pointer items-start gap-3 rounded-[1.5rem] border p-4 transition {paymentMethod ===
											method.id
												? 'border-white bg-white/[0.08]'
												: 'border-white/15 bg-black hover:border-white/40'}"
										>
											<input
												type="radio"
												name="paymentMethod"
												value={method.id}
												bind:group={paymentMethod}
												class="mt-1 h-4 w-4 accent-white"
											/>
											<div>
												<p class="text-sm font-bold text-white">{method.label}</p>
												<p class="mt-0.5 text-xs text-neutral-400">{method.subtitle}</p>
											</div>
										</label>
									{/each}
								</div>

								<!-- Kode Promo & Voucher Diskon -->
								<div class="mt-5 rounded-[1.5rem] border border-rose-400/25 bg-rose-500/10 p-4">
									<p class="text-xs font-bold text-rose-200">Kode Promo / Voucher Diskon</p>
									<p class="mt-0.5 text-[11px] text-rose-300/80">
										Masukkan kode voucher atau klik promo yang tersedia di bawah.
									</p>

									{#if appliedPromo && promoDiscount > 0}
										<div
											class="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-400/15 px-4 py-3 text-xs text-emerald-200"
										>
											<div>
												<p class="font-bold text-white">
													✓ Kode <span class="font-mono">{appliedPromo.code}</span> diterapkan
												</p>
												<p class="text-[11px] text-emerald-300">
													{appliedPromo.title} · Hemat {formatRupiah(promoDiscount)}
												</p>
											</div>
											<button
												type="button"
												onclick={removePromo}
												class="rounded-full border border-white/25 bg-black px-3.5 py-1 text-[11px] font-bold text-white hover:border-red-400 hover:text-red-300"
											>
												Hapus
											</button>
										</div>
									{:else}
										<div class="mt-3 flex gap-2">
											<input
												type="text"
												bind:value={promoCodeInput}
												placeholder="Contoh: SEWABARU10"
												class="flex-1 rounded-full border border-white/20 bg-black px-4 py-2.5 font-mono text-xs font-bold text-white uppercase placeholder:text-neutral-500 focus:border-white focus:outline-none"
											/>
											<button
												type="button"
												disabled={promoBusy}
												onclick={() => applyPromoCode()}
												class="shrink-0 rounded-full bg-white px-5 py-2.5 text-xs font-bold text-black transition hover:bg-neutral-200 disabled:opacity-60"
											>
												{promoBusy ? 'Cek...' : 'Terapkan'}
											</button>
										</div>

										{#if promoError}
											<p class="mt-2 text-xs font-semibold text-red-400">{promoError}</p>
										{/if}

										{#if branchEligiblePromos.length > 0}
											<div class="mt-3 flex flex-wrap gap-1.5">
												{#each branchEligiblePromos as p (p.id)}
													<button
														type="button"
														onclick={() => applyPromoCode(p.code)}
														title={formatPromoDetail(p)}
														class="inline-flex items-center gap-1.5 rounded-full border border-rose-400/30 bg-black px-3.5 py-1 text-[11px] font-bold text-rose-200 transition hover:border-white hover:bg-white hover:text-black"
													>
														<span class="font-mono">{p.code}</span>
														<span class="opacity-75">· {formatPromoBadge(p)}</span>
													</button>
												{/each}
											</div>
										{/if}
									{/if}
								</div>

								<!-- Rekening Poin Sewa (Redeem Poin) -->
								<div class="mt-5 rounded-[1.5rem] border border-amber-400/25 bg-amber-400/10 p-4">
									<div class="flex flex-wrap items-center justify-between gap-2">
										<div>
											<p class="text-xs font-bold text-amber-200">
												★ Rekening Poin Anda: {availablePoints} Poin
											</p>
											<p class="text-[11px] text-amber-300/80">
												1 Poin = {formatRupiah(POINT_VALUE_IDR)} (maks. 50% subtotal sewa)
											</p>
										</div>

										{#if maxRedeemablePoints > 0}
											<label
												class="inline-flex cursor-pointer items-center gap-2 text-xs font-bold text-white"
											>
												<input
													type="checkbox"
													checked={usePoints}
													onchange={(e) => {
														usePoints = e.currentTarget.checked;
														pointsToRedeem = usePoints ? maxRedeemablePoints : 0;
													}}
													class="h-4 w-4 accent-white"
												/>
												<span>Gunakan Poin</span>
											</label>
										{/if}
									</div>

									{#if usePoints && maxRedeemablePoints > 0}
										<div
											class="mt-3 flex flex-wrap items-center gap-2.5 border-t border-amber-400/20 pt-3"
										>
											<input
												type="number"
												min="0"
												max={maxRedeemablePoints}
												bind:value={pointsToRedeem}
												class="w-28 rounded-full border border-amber-400/35 bg-black px-3.5 py-1.5 text-sm font-bold text-white focus:border-white focus:outline-none"
											/>
											<button
												type="button"
												onclick={() => (pointsToRedeem = maxRedeemablePoints)}
												class="rounded-full bg-amber-400 px-3.5 py-1.5 text-[11px] font-extrabold text-black hover:bg-amber-300"
											>
												Pakai Maksimal ({maxRedeemablePoints})
											</button>
											<span class="text-xs font-bold text-emerald-300">
												Potongan −{formatRupiah(pointsDiscount)}
											</span>
										</div>
									{:else if availablePoints === 0}
										<p class="mt-2 text-[11px] text-amber-200/80">
											Setelah barang dikembalikan, Anda akan memperoleh
											<strong class="text-white">+{estimatedEarnedPoints} Poin</strong> ke Rekening
											Poin Anda!
										</p>
									{/if}
								</div>
							</section>

							<!-- 5. Informasi Tambahan -->
							<section class="rounded-[2rem] border border-white/15 bg-[#0c0c0f] p-6">
								<h2 class="text-base font-extrabold text-white">5. Informasi Tambahan (Opsional)</h2>
								<div class="mt-4 grid gap-4 sm:grid-cols-2">
									<div>
										<label for="co-source" class="block text-xs font-semibold text-neutral-300">
											Tahu {data.settings.companyName} dari mana?
										</label>
										<select
											id="co-source"
											bind:value={infoSource}
											class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-3 text-sm text-white [color-scheme:dark] focus:border-white focus:outline-none"
										>
											{#each INFO_SOURCES as src (src)}
												<option value={src} class="bg-neutral-950">{src}</option>
											{/each}
										</select>
									</div>

									<div class="sm:col-span-2">
										<label for="co-notes" class="block text-xs font-semibold text-neutral-300">
											Catatan Acara / Permintaan Khusus
										</label>
										<textarea
											id="co-notes"
											rows="2"
											bind:value={notes}
											placeholder="Mis. jam pengiriman yang diinginkan, butuh teknisi, atau catatan lain..."
											class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-white focus:outline-none"
										></textarea>
									</div>
								</div>
							</section>

							<button
								type="submit"
								disabled={submitting}
								class="flex w-full items-center justify-center rounded-full bg-white px-7 py-4 text-sm font-extrabold text-black transition hover:bg-neutral-200 disabled:opacity-60"
							>
								{submitting
									? 'Mencatat Transaksi Pesanan...'
									: `Buat Pesanan & Lanjut Pembayaran (${formatRupiah(grandTotal)}) →`}
							</button>
						</form>
					{/if}
				</div>

				<!-- Kanan: Ringkasan Pesanan -->
				<aside class="lg:col-span-5">
					<div
						class="sticky top-24 rounded-[2.25rem] border-2 border-white/20 bg-[#0d0d11] p-6 shadow-2xl"
					>
						<h2 class="text-base font-extrabold text-white">
							Ringkasan Pesanan ({rentalCart.totalUnits} unit)
						</h2>
						{#if activeBranch}
							<p class="mt-1 text-xs font-bold text-emerald-300">
								📍 {activeBranch.name} ({activeBranch.code})
							</p>
						{/if}
						<p class="mt-0.5 text-xs text-neutral-400">
							Jadwal: {formatDateId(rentalCart.startDate)} – {formatDateId(rentalCart.endDate)} ({rentalCart.durationDays}
							hari)
						</p>

						<ul class="mt-5 divide-y divide-white/10">
							{#each rentalCart.items as item (item.key)}
								<li class="flex items-start justify-between gap-3 py-3 text-sm">
									<div class="min-w-0">
										<p class="font-bold text-white">{item.name}</p>
										{#if item.variant}
											<p class="text-xs text-neutral-400">Varian: {item.variant}</p>
										{/if}
										<p class="mt-0.5 text-xs text-neutral-500">
											{item.quantity} unit × {formatRupiah(item.pricePerDay)} × {rentalCart.durationDays}
											hari
										</p>
									</div>
									<p class="shrink-0 font-bold text-white">
										{formatRupiah(item.pricePerDay * item.quantity * rentalCart.durationDays)}
									</p>
								</li>
							{/each}
						</ul>

						<dl class="mt-4 space-y-2.5 border-t border-white/15 pt-4 text-sm">
							<div class="flex justify-between text-neutral-400">
								<dt>Subtotal Sewa</dt>
								<dd class="font-semibold text-white">
									{formatRupiah(rentalCart.estimatedSubtotal)}
								</dd>
							</div>
							<div class="flex justify-between text-neutral-400">
								<dt>
									{deliveryMethod === 'delivery'
										? `Ongkir Delivery (${activeBranch?.name ?? deliveryRegion})`
										: `Ambil di Kios (${activeBranch?.name ?? 'Kios'})`}
								</dt>
								<dd class="font-semibold text-white">
									{deliveryFee > 0 ? formatRupiah(deliveryFee) : 'Gratis (Rp 0)'}
								</dd>
							</div>
							{#if promoDiscount > 0 && appliedPromo}
								<div class="flex justify-between text-rose-300">
									<dt>Promo Diskon ({appliedPromo.code})</dt>
									<dd class="font-bold">−{formatRupiah(promoDiscount)}</dd>
								</div>
							{/if}
							{#if pointsDiscount > 0}
								<div class="flex justify-between text-emerald-300">
									<dt>Potongan Poin ({effectivePointsToRedeem} Poin)</dt>
									<dd class="font-bold">−{formatRupiah(pointsDiscount)}</dd>
								</div>
							{/if}
						</dl>

						<div class="mt-4 flex items-baseline justify-between border-t border-white/20 pt-4">
							<span class="text-sm font-extrabold text-white">Total Tagihan</span>
							<span class="text-2xl font-extrabold text-white">{formatRupiah(grandTotal)}</span>
						</div>

						<div
							class="mt-4 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-4 text-xs text-emerald-200"
						>
							<p class="font-bold text-emerald-300">
								★ Estimasi Bonus: +{estimatedEarnedPoints} Poin Sewa
							</p>
							<p class="mt-0.5 text-[11px] text-neutral-300">
								Otomatis masuk ke <strong class="text-white">Rekening Poin</strong> Anda setelah
								seluruh barang dikembalikan dalam kondisi baik.
							</p>
						</div>
					</div>
				</aside>
			</div>
		{/if}
	</div>
</section>
