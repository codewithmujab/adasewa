<script lang="ts">
	import { rentalCart } from '#lib/stores/cart.svelte';
	import { formatRupiah } from '#lib/utils/catalog';
	import { addDaysIsoDate, formatDateId, getTodayIsoDate } from '#lib/utils/orders';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
	const today = getTodayIsoDate();

	let activeBranch = $derived(
		data.branches.find((b) => b.id === rentalCart.branchId) ?? data.branches[0] ?? null
	);

	function applyQuickDays(days: number): void {
		const start = rentalCart.startDate || addDaysIsoDate(today, 1);
		const end = addDaysIsoDate(start, days - 1);
		rentalCart.setDates(start, end);
	}
</script>

<svelte:head>
	<title>Keranjang Sewa — {data.settings.companyName}</title>
</svelte:head>

<section class="bg-surface/60 py-12 pb-24 sm:py-16">
	<div class="mx-auto max-w-6xl px-6">
		<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
			<div>
				<p class="text-xs font-semibold tracking-widest text-neutral-400 uppercase">
					Langkah 1 dari 2
				</p>
				<h1 class="mt-2 text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">
					Keranjang Sewa Anda
				</h1>
				<p class="mt-1.5 text-sm text-neutral-500">
					Tambahkan beberapa barang sekaligus dan atur tanggal sewa untuk melihat estimasi biaya
					secara transparan sebelum checkout.
				</p>
			</div>

			<a
				href="/katalog"
				class="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-950 hover:text-neutral-600"
			>
				+ Tambah Barang Lainnya
			</a>
		</div>

		{#if data.branches.length > 0}
			<div
				class="mt-6 flex flex-col justify-between gap-4 rounded-3xl border border-emerald-200/80 bg-white p-5 sm:flex-row sm:items-center"
			>
				<div>
					<p class="text-[11px] font-bold tracking-wider text-emerald-700 uppercase">
						📍 Cabang Penyewaan Aktif
					</p>
					<p class="mt-0.5 text-sm font-bold text-neutral-950">
						{activeBranch?.name ?? 'Belum dipilih'}
					</p>
					{#if activeBranch}
						<p class="mt-0.5 text-xs text-neutral-500">
							{activeBranch.address} · WA CS: {activeBranch.phone}
						</p>
					{/if}
				</div>
				<div class="flex flex-wrap gap-2">
					{#each data.branches as branch (branch.id)}
						<button
							type="button"
							onclick={() => rentalCart.selectBranch(branch)}
							class="rounded-full px-3.5 py-1.5 text-xs font-semibold transition {activeBranch?.id ===
							branch.id
								? 'bg-neutral-950 text-white'
								: 'border border-neutral-200 bg-surface text-neutral-700 hover:border-neutral-950'}"
						>
							{branch.name}
						</button>
					{/each}
				</div>
			</div>
		{/if}

		{#if rentalCart.items.length > 0}
			<div class="mt-8 grid gap-8 lg:grid-cols-12">
				<!-- Kiri: Tanggal Sewa & Daftar Item -->
				<div class="space-y-6 lg:col-span-8">
					<!-- Card Jadwal Pemakaian -->
					<div class="rounded-3xl border border-neutral-200/80 bg-white p-6">
						<div class="flex flex-wrap items-center justify-between gap-3">
							<div>
								<h2 class="text-base font-bold text-neutral-950">Jadwal Pemakaian &amp; Pengembalian</h2>
								<p class="text-xs text-neutral-500">
									Durasi otomatis menghitung estimasi biaya seluruh barang di keranjang.
								</p>
							</div>
							<span class="rounded-full bg-neutral-950 px-3.5 py-1 text-xs font-semibold text-white">
								Durasi {rentalCart.durationDays} Hari
							</span>
						</div>

						<div class="mt-5 grid gap-4 sm:grid-cols-2">
							<div>
								<label for="cart-start" class="block text-xs font-semibold text-neutral-700">
									Mulai Tanggal Pemakaian
								</label>
								<input
									id="cart-start"
									type="date"
									min={today}
									value={rentalCart.startDate}
									onchange={(e) => rentalCart.setDates(e.currentTarget.value, rentalCart.endDate)}
									class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm font-medium text-neutral-950 focus:border-neutral-950 focus:outline-none"
								/>
							</div>
							<div>
								<label for="cart-end" class="block text-xs font-semibold text-neutral-700">
									Sampai Tanggal (Jatuh Tempo Kembali)
								</label>
								<input
									id="cart-end"
									type="date"
									min={rentalCart.startDate || today}
									value={rentalCart.endDate}
									onchange={(e) => rentalCart.setDates(rentalCart.startDate, e.currentTarget.value)}
									class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm font-medium text-neutral-950 focus:border-neutral-950 focus:outline-none"
								/>
							</div>
						</div>

						<div class="mt-4 flex flex-wrap items-center gap-2">
							<span class="text-xs text-neutral-400">Durasi cepat:</span>
							{#each [1, 2, 3, 7] as preset (preset)}
								<button
									type="button"
									onclick={() => applyQuickDays(preset)}
									class="rounded-full border px-3 py-1 text-xs font-medium transition {rentalCart.durationDays ===
									preset
										? 'border-neutral-950 bg-neutral-950 text-white'
										: 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400'}"
								>
									{preset === 7 ? '7 Hari (Mingguan)' : `${preset} Hari`}
								</button>
							{/each}
						</div>
					</div>

					<!-- List Barang di Keranjang -->
					<div class="space-y-4">
						{#each rentalCart.items as item (item.key)}
							<div
								class="flex flex-col justify-between gap-4 rounded-3xl border border-neutral-200/80 bg-white p-5 sm:flex-row sm:items-center"
							>
								<div class="flex items-start gap-4">
									{#if item.imageUrl}
										<img
											src={item.imageUrl}
											alt={item.name}
											class="h-16 w-20 shrink-0 rounded-2xl object-cover"
										/>
									{:else}
										<div
											class="flex h-16 w-20 shrink-0 items-center justify-center rounded-2xl bg-surface text-xs font-semibold text-neutral-400"
										>
											UNIT
										</div>
									{/if}

									<div class="min-w-0">
										<p class="text-[11px] font-medium text-neutral-400">{item.categoryName}</p>
										<a
											href={`/katalog/${item.slug}`}
											class="mt-0.5 block text-base font-semibold text-neutral-950 hover:underline"
										>
											{item.name}
										</a>
										<div class="mt-1.5 flex flex-wrap items-center gap-2">
											{#if item.variant}
												<span
													class="rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium text-neutral-700"
												>
													Varian: {item.variant}
												</span>
											{/if}
											<span class="text-xs text-neutral-500">
												{formatRupiah(item.pricePerDay)} / {item.unitLabel}
											</span>
										</div>
									</div>
								</div>

								<div class="flex items-center justify-between gap-5 border-t border-neutral-100 pt-3 sm:border-t-0 sm:pt-0">
									<div class="inline-flex items-center rounded-full border border-neutral-200">
										<button
											type="button"
											onclick={() => rentalCart.updateQuantity(item.key, item.quantity - 1)}
											aria-label="Kurangi jumlah"
											class="px-3 py-1.5 text-sm font-semibold text-neutral-600 hover:text-neutral-950"
										>
											−
										</button>
										<span class="min-w-8 text-center text-sm font-semibold text-neutral-950">
											{item.quantity}
										</span>
										<button
											type="button"
											onclick={() => rentalCart.updateQuantity(item.key, item.quantity + 1)}
											aria-label="Tambah jumlah"
											class="px-3 py-1.5 text-sm font-semibold text-neutral-600 hover:text-neutral-950"
										>
											+
										</button>
									</div>

									<div class="min-w-[120px] text-right">
										<p class="text-sm font-bold text-neutral-950">
											{formatRupiah(item.pricePerDay * item.quantity * rentalCart.durationDays)}
										</p>
										<p class="text-[11px] text-neutral-400">
											{item.quantity} unit × {rentalCart.durationDays} hari
										</p>
										<button
											type="button"
											onclick={() => rentalCart.removeItem(item.key)}
											class="mt-1 text-[11px] font-medium text-red-600 hover:underline"
										>
											Hapus
										</button>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>

				<!-- Kanan: Ringkasan Biaya -->
				<aside class="lg:col-span-4">
					<div class="sticky top-24 rounded-3xl border border-neutral-200/90 bg-white p-6 shadow-sm">
						<h2 class="text-base font-bold text-neutral-950">Ringkasan Estimasi Biaya</h2>

						<dl class="mt-5 space-y-3 text-sm">
							{#if activeBranch}
								<div class="flex justify-between text-neutral-600">
									<dt>Cabang Kios</dt>
									<dd class="font-semibold text-emerald-700">{activeBranch.name}</dd>
								</div>
							{/if}
							<div class="flex justify-between text-neutral-600">
								<dt>Periode Sewa</dt>
								<dd class="font-medium text-neutral-950">
									{formatDateId(rentalCart.startDate)} – {formatDateId(rentalCart.endDate)}
								</dd>
							</div>
							<div class="flex justify-between text-neutral-600">
								<dt>Durasi</dt>
								<dd class="font-medium text-neutral-950">{rentalCart.durationDays} hari</dd>
							</div>
							<div class="flex justify-between text-neutral-600">
								<dt>Total Barang</dt>
								<dd class="font-medium text-neutral-950">
									{rentalCart.distinctCount} jenis ({rentalCart.totalUnits} unit)
								</dd>
							</div>
							<div class="flex justify-between text-neutral-600">
								<dt>Tarif per Hari</dt>
								<dd class="font-medium text-neutral-950">
									{formatRupiah(rentalCart.subtotalPerDay)}
								</dd>
							</div>
							<div class="flex justify-between text-neutral-600">
								<dt>Ongkir Delivery</dt>
								<dd class="text-xs font-medium text-emerald-700">
									Rp 0 (Kios) / dihitung saat Checkout
								</dd>
							</div>
						</dl>

						<div class="mt-5 flex items-baseline justify-between border-t border-neutral-100 pt-5">
							<span class="text-sm font-semibold text-neutral-700">Estimasi Subtotal Sewa</span>
							<span class="text-2xl font-bold text-neutral-950">
								{formatRupiah(rentalCart.estimatedSubtotal)}
							</span>
						</div>

						{#if rentalCart.hasDepositItems}
							<p class="mt-4 rounded-2xl bg-amber-50 px-3.5 py-2.5 text-xs leading-relaxed text-amber-800">
								Keranjang memuat unit bernilai tinggi / skala event. Verifikasi identitas &amp;
								ketentuan jaminan akan dikonfirmasi oleh tim kami.
							</p>
						{/if}

						<a
							href="/checkout"
							class="mt-6 flex w-full items-center justify-center rounded-full bg-neutral-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
						>
							Lanjut ke Checkout &amp; Pembayaran →
						</a>

						{#if !data.isAuthenticated}
							<p class="mt-3 text-center text-[11px] leading-relaxed text-neutral-400">
								Belum login? Anda akan diminta <strong>daftar atau masuk</strong> di halaman
								Checkout agar transaksi &amp; jadwal pengembalian tercatat di dashboard Anda.
							</p>
						{/if}
					</div>
				</aside>
			</div>
		{:else}
			<div class="mt-10 rounded-3xl border border-neutral-200/80 bg-white p-14 text-center">
				<h2 class="text-lg font-bold text-neutral-950">Keranjang sewa Anda masih kosong</h2>
				<p class="mx-auto mt-2 max-w-md text-sm text-neutral-500">
					Jelajahi 135+ unit barang kami dan tambahkan barang yang Anda butuhkan ke keranjang untuk
					melihat rincian total biaya secara langsung.
				</p>
				<a
					href="/katalog"
					class="mt-6 inline-flex items-center justify-center rounded-full bg-neutral-950 px-7 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
				>
					Jelajahi Katalog Barang →
				</a>
			</div>
		{/if}
	</div>
</section>
