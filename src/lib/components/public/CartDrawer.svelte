<script lang="ts">
	import { rentalCart } from '#lib/stores/cart.svelte';
	import { formatRupiah } from '#lib/utils/catalog';
	import { getTodayIsoDate } from '#lib/utils/orders';

	const today = getTodayIsoDate();

	function handleKeydown(event: KeyboardEvent): void {
		if (event.key === 'Escape' && rentalCart.drawerOpen) {
			rentalCart.closeDrawer();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if rentalCart.drawerOpen}
	<div
		class="fixed inset-0 z-50 flex justify-end bg-neutral-950/40 backdrop-blur-xs"
		role="dialog"
		aria-modal="true"
		aria-label="Keranjang Sewa"
	>
		<button
			type="button"
			aria-label="Tutup keranjang"
			onclick={() => rentalCart.closeDrawer()}
			class="flex-1 cursor-default"
		></button>

		<div class="flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
			<header class="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
				<div>
					<h2 class="text-base font-bold tracking-tight text-neutral-950">
						Keranjang Sewa ({rentalCart.totalUnits} unit)
					</h2>
					<p class="text-xs text-neutral-500">
						Cek estimasi biaya sebelum lanjut pembayaran
					</p>
				</div>
				<button
					type="button"
					onclick={() => rentalCart.closeDrawer()}
					aria-label="Tutup panel keranjang"
					class="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950"
				>
					✕
				</button>
			</header>

			{#if rentalCart.items.length > 0}
				<!-- Periode Tanggal Sewa -->
				<div class="border-b border-neutral-100 bg-surface px-6 py-3.5">
					<div class="flex items-center justify-between">
						<span class="text-[11px] font-semibold tracking-wider text-neutral-500 uppercase">
							Jadwal Pemakaian
						</span>
						<span class="rounded-full bg-neutral-950 px-2.5 py-0.5 text-[11px] font-semibold text-white">
							{rentalCart.durationDays} hari
						</span>
					</div>
					<div class="mt-2 grid grid-cols-2 gap-2.5">
						<div>
							<label for="drawer-start" class="block text-[11px] text-neutral-500">Mulai</label>
							<input
								id="drawer-start"
								type="date"
								min={today}
								value={rentalCart.startDate}
								onchange={(e) => rentalCart.setDates(e.currentTarget.value, rentalCart.endDate)}
								class="mt-0.5 w-full rounded-xl border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-900 focus:border-neutral-950 focus:outline-none"
							/>
						</div>
						<div>
							<label for="drawer-end" class="block text-[11px] text-neutral-500">Sampai</label>
							<input
								id="drawer-end"
								type="date"
								min={rentalCart.startDate || today}
								value={rentalCart.endDate}
								onchange={(e) => rentalCart.setDates(rentalCart.startDate, e.currentTarget.value)}
								class="mt-0.5 w-full rounded-xl border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-900 focus:border-neutral-950 focus:outline-none"
							/>
						</div>
					</div>
				</div>

				<!-- Daftar Item -->
				<div class="flex-1 space-y-3 overflow-y-auto px-6 py-4">
					{#each rentalCart.items as item (item.key)}
						<div class="rounded-2xl border border-neutral-200/80 bg-white p-3.5">
							<div class="flex items-start justify-between gap-3">
								<div class="min-w-0">
									<p class="text-[11px] font-medium text-neutral-400">{item.categoryName}</p>
									<a
										href={`/katalog/${item.slug}`}
										onclick={() => rentalCart.closeDrawer()}
										class="mt-0.5 block truncate text-sm font-semibold text-neutral-950 hover:underline"
									>
										{item.name}
									</a>
									{#if item.variant}
										<span
											class="mt-1 inline-block rounded-full bg-surface px-2 py-0.5 text-[11px] font-medium text-neutral-700"
										>
											{item.variant}
										</span>
									{/if}
								</div>
								<button
									type="button"
									onclick={() => rentalCart.removeItem(item.key)}
									aria-label={`Hapus ${item.name}`}
									class="shrink-0 text-xs text-neutral-400 transition hover:text-red-600"
								>
									Hapus
								</button>
							</div>

							<div class="mt-3 flex items-center justify-between gap-3 border-t border-neutral-100 pt-2.5">
								<div class="inline-flex items-center rounded-full border border-neutral-200">
									<button
										type="button"
										onclick={() => rentalCart.updateQuantity(item.key, item.quantity - 1)}
										aria-label="Kurangi jumlah"
										class="px-2.5 py-1 text-xs font-bold text-neutral-600 hover:text-neutral-950"
									>
										−
									</button>
									<span class="min-w-6 text-center text-xs font-semibold text-neutral-950">
										{item.quantity}
									</span>
									<button
										type="button"
										onclick={() => rentalCart.updateQuantity(item.key, item.quantity + 1)}
										aria-label="Tambah jumlah"
										class="px-2.5 py-1 text-xs font-bold text-neutral-600 hover:text-neutral-950"
									>
										+
									</button>
								</div>

								<div class="text-right">
									<p class="text-xs font-bold text-neutral-950">
										{formatRupiah(item.pricePerDay * item.quantity * rentalCart.durationDays)}
									</p>
									<p class="text-[10px] text-neutral-400">
										{formatRupiah(item.pricePerDay)} × {item.quantity} × {rentalCart.durationDays} hari
									</p>
								</div>
							</div>
						</div>
					{/each}
				</div>

				<!-- Footer Ringkasan & CTA -->
				<footer class="border-t border-neutral-200 bg-white px-6 py-4">
					<div class="flex items-baseline justify-between">
						<div>
							<p class="text-xs text-neutral-500">Estimasi Total Sewa</p>
							<p class="text-[11px] text-neutral-400">
								{rentalCart.distinctCount} jenis · {rentalCart.totalUnits} unit · {rentalCart.durationDays} hari
							</p>
						</div>
						<p class="text-lg font-bold text-neutral-950">
							{formatRupiah(rentalCart.estimatedSubtotal)}
						</p>
					</div>

					<div class="mt-4 flex flex-col gap-2">
						<a
							href="/checkout"
							onclick={() => rentalCart.closeDrawer()}
							class="flex w-full items-center justify-center rounded-full bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
						>
							Lanjut ke Checkout &amp; Pembayaran →
						</a>
						<a
							href="/keranjang"
							onclick={() => rentalCart.closeDrawer()}
							class="flex w-full items-center justify-center rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-xs font-semibold text-neutral-700 transition hover:border-neutral-950 hover:text-neutral-950"
						>
							Lihat Detail Keranjang
						</a>
					</div>
				</footer>
			{:else}
				<div class="flex flex-1 flex-col items-center justify-center px-8 text-center">
					<div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface text-neutral-400">
						<svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
							<path stroke-linecap="round" stroke-linejoin="round" d="M3 4h2l2.4 11.2a1.5 1.5 0 001.47 1.2h8.76a1.5 1.5 0 001.46-1.16L21 7.5H6" />
							<circle cx="9.5" cy="20" r="1.25" />
							<circle cx="17.5" cy="20" r="1.25" />
						</svg>
					</div>
					<p class="mt-4 text-sm font-semibold text-neutral-950">Keranjang sewa masih kosong</p>
					<p class="mt-1.5 text-xs leading-relaxed text-neutral-500">
						Pilih satu atau beberapa barang dari katalog untuk melihat estimasi total biaya sewa Anda.
					</p>
					<a
						href="/katalog"
						onclick={() => rentalCart.closeDrawer()}
						class="mt-6 rounded-full bg-neutral-950 px-6 py-2.5 text-xs font-semibold text-white transition hover:bg-neutral-800"
					>
						Jelajahi Katalog Barang
					</a>
				</div>
			{/if}
		</div>
	</div>
{/if}
