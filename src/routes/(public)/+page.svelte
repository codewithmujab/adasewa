<script lang="ts">
	import CategoryIcon from '#lib/components/public/CategoryIcon.svelte';
	import HeroSection from '#lib/components/public/HeroSection.svelte';
	import PortfolioCard from '#lib/components/public/PortfolioCard.svelte';
	import RentalItemCard from '#lib/components/public/RentalItemCard.svelte';
	import { rentalCart } from '#lib/stores/cart.svelte';
	import { buildBranchWhatsAppUrl, formatRupiah } from '#lib/utils/catalog';
	import { formatPromoBadge, formatPromoDetail } from '#lib/utils/promo';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let activeTab = $state<string>('featured');
	let openFaqIndex = $state<number | null>(0);
	let copiedPromoCode = $state<string | null>(null);

	async function copyPromoCode(code: string): Promise<void> {
		try {
			await navigator.clipboard.writeText(code);
		} catch {
			// Fallback jika clipboard tidak diizinkan
		}
		copiedPromoCode = code;
		setTimeout(() => {
			if (copiedPromoCode === code) copiedPromoCode = null;
		}, 2500);
	}

	let pageTitle = $derived(
		data.settings.metaTitle || `${data.settings.companyName} — ${data.settings.tagline}`
	);
	let pageDescription = $derived(data.settings.metaDescription || data.settings.aboutShort);
	let activeBranch = $derived(
		data.branches.find((b) => b.id === rentalCart.branchId) ?? data.branches[0] ?? null
	);

	let whatsappUrl = $derived(
		buildBranchWhatsAppUrl(
			activeBranch,
			data.settings,
			`Halo ${data.settings.companyName}${activeBranch ? ` (${activeBranch.name})` : ''}, saya ingin menanyakan informasi penyewaan barang.`
		)
	);

	let visibleShowcaseItems = $derived.by(() => {
		if (activeTab === 'featured') {
			const featured = data.showcaseItems.filter((item) => item.isFeatured);
			return (featured.length > 0 ? featured : data.showcaseItems).slice(0, 9);
		}
		return data.showcaseItems
			.filter((item) => item.category.slug === activeTab)
			.slice(0, 6);
	});

	let activeCategoryMeta = $derived(
		activeTab === 'featured'
			? null
			: (data.categories.find((c) => c.slug === activeTab) ?? null)
	);

	const rentalSteps = [
		{
			num: '01',
			title: 'Pilih Barang & Masukkan Keranjang',
			desc: 'Telusuri 135+ unit di katalog, cek spesifikasi, pilih varian & jumlah, lalu masukkan satu atau beberapa barang sekaligus ke keranjang.'
		},
		{
			num: '02',
			title: 'Cek Estimasi Biaya di Keranjang',
			desc: 'Atur tanggal mulai dan sampai pemakaian untuk langsung melihat rincian biaya per hari dan estimasi total sebelum lanjut checkout.'
		},
		{
			num: '03',
			title: 'Daftar / Masuk, Isi Alamat & Bayar',
			desc: 'Saat lanjut ke pembayaran, daftar atau login akun pemesan, isi alamat delivery (atau ambil di kios), dan pilih metode pembayaran.'
		},
		{
			num: '04',
			title: 'Pantau Sewa & Pengembalian di Dashboard',
			desc: 'Seluruh transaksi tercatat otomatis di Dashboard Pemesan — lengkap dengan status pembayaran, masa sewa aktif, dan pengajuan pengembalian barang.'
		}
	] as const;

	const deliveryAreas = [
		{
			region: 'DKI Jakarta',
			areas: 'Jakarta Pusat, Selatan, Barat, Timur, Utara & sekitarnya'
		},
		{
			region: 'Jawa Barat',
			areas: 'Bogor, Depok, Bekasi, Bandung, Cikarang, Karawang & kota sekitar'
		},
		{
			region: 'Jawa Tengah',
			areas: 'Semarang, Solo, Magelang, Purwokerto, Pekalongan & sekitarnya'
		},
		{
			region: 'D.I. Yogyakarta',
			areas: 'Kota Yogyakarta, Sleman, Bantul, Kulon Progo & Gunungkidul'
		}
	] as const;

	const faqs = [
		{
			q: 'Bagaimana cara menghitung total biaya sebelum memesan?',
			a: 'Tambahkan satu atau beberapa barang ke Keranjang Sewa, pilih varian dan jumlah unit, lalu atur tanggal mulai–selesai pemakaian. Sistem langsung menampilkan rincian tarif per hari dan estimasi total biaya sebelum Anda lanjut ke halaman Checkout.'
		},
		{
			q: 'Wilayah mana saja yang dilayani untuk pengantaran (delivery)?',
			a: 'Adasewa.id melayani pengiriman antar-jemput (delivery) ke wilayah DKI Jakarta, Jawa Barat, Jawa Tengah, dan D.I. Yogyakarta. Anda juga dapat memilih opsi ambil sendiri langsung di kios tanpa biaya pengiriman.'
		},
		{
			q: 'Bagaimana alur pembayaran dan pengembalian barang?',
			a: 'Saat lanjut ke Checkout, Anda cukup daftar atau masuk akun pemesan, mengisi alamat pengiriman, dan memilih metode pembayaran. Seluruh transaksi tercatat di Dashboard Pemesan (/akun) — termasuk tombol ajukan pengembalian barang (dijemput kurir atau antar ke kios) saat masa sewa selesai.'
		},
		{
			q: 'Mengapa saat pemesanan diminta Nomor HP Darurat?',
			a: 'Nomor HP darurat (keluarga/rekan/panitia pendamping) diperlukan sebagai kontak cadangan bila terjadi kendala teknis pengantaran, perubahan jadwal mendadak, serta sebagai standar keamanan penyewaan terutama untuk barang bernilai tinggi.'
		},
		{
			q: 'Apakah perlengkapan event besar seperti Sound System, Genset, Panggung & Videotron termasuk pemasangan?',
			a: 'Ya, untuk unit berskala event (Sound System besar, Panggung 6×10m, Videotron, Lighting Pro Set, Genset, dan Paket Streaming multi-kamera) tersedia layanan setup/instalasi dan dukungan teknisi sesuai paket yang disepakati.'
		},
		{
			q: 'Bagaimana kebersihan untuk perlengkapan bayi, alat camping, dan toga wisuda?',
			a: 'Seluruh perlengkapan bayi (stroller, car seat, bouncer, mainan anak), alat camping (tenda, sepatu hiking, carrier), dan toga wisuda S1/S2/S3 selalu dibersihkan, dicuci/disanitasi, dan dicek kelayakannya sebelum diserahkan ke penyewa berikutnya.'
		}
	] as const;
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={pageDescription} />
</svelte:head>

<div class="bg-black text-white">
	<HeroSection
		settings={data.settings}
		totalItems={data.totalItems}
		totalCategories={data.totalCategories}
	/>

	<!-- Promo & Voucher Diskon Aktif -->
	{#if data.activePromos.length > 0}
		<section class="border-t border-white/10 bg-black py-16 sm:py-20">
			<div class="mx-auto max-w-6xl px-6">
				<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
					<div>
						<span
							class="inline-flex rounded-full border border-rose-400/30 bg-rose-500/15 px-3.5 py-1 text-xs font-bold tracking-wide text-rose-300 uppercase"
						>
							Promo &amp; Voucher Aktif
						</span>
						<h2 class="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
							Hemat lebih banyak dengan kode promo sewa.
						</h2>
					</div>
					<p class="max-w-sm text-sm leading-relaxed text-neutral-400">
						Salin kode promo di bawah dan masukkan di halaman Checkout — bisa digabung dengan Poin
						Sewa!
					</p>
				</div>

				<div class="mt-9 grid gap-5 md:grid-cols-3">
					{#each data.activePromos.slice(0, 3) as promo (promo.id)}
						<div
							class="flex flex-col justify-between rounded-[2rem] border border-white/15 bg-[#0c0c0f] p-6 transition hover:border-white/35 hover:bg-[#121216]"
						>
							<div>
								<div class="flex items-center justify-between gap-2">
									<span
										class="inline-flex rounded-full bg-white px-3.5 py-1 text-xs font-semibold text-black"
									>
										{formatPromoBadge(promo)}
									</span>
									{#if promo.usageLimit !== null}
										<span
											class="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs font-medium text-neutral-300"
										>
											Sisa {Math.max(0, promo.usageLimit - promo.usedCount)} kuota
										</span>
									{/if}
								</div>

								<h3 class="mt-4 text-lg font-bold text-white">{promo.title}</h3>
								<p class="mt-1.5 text-sm leading-relaxed text-neutral-400">{promo.description}</p>
								<p class="mt-3 text-sm font-medium text-neutral-200">
									{formatPromoDetail(promo)}
								</p>
							</div>

							<div
								class="mt-5 flex items-center justify-between gap-2 rounded-full border border-dashed border-white/25 bg-black py-1.5 pr-1.5 pl-4"
							>
								<span class="font-mono text-sm font-bold tracking-wider text-white">
									{promo.code}
								</span>
								<button
									type="button"
									onclick={() => copyPromoCode(promo.code)}
									class="rounded-full bg-white px-4 py-1.5 text-xs font-bold text-black transition hover:bg-neutral-200"
								>
									{copiedPromoCode === promo.code ? '✓ Tersalin' : 'Salin Kode'}
								</button>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</section>
	{/if}

	<!-- 10 Kategori Utama -->
	<section class="border-t border-white/10 bg-black py-20 sm:py-28">
		<div class="mx-auto max-w-6xl px-6">
			<div class="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
				<div class="max-w-2xl">
					<span
						class="inline-flex rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1 text-xs font-bold tracking-wide text-neutral-300 uppercase"
					>
						Kategori Lengkap
					</span>
					<h2 class="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
						Satu tempat untuk semua kebutuhan sewa Anda.
					</h2>
					<p class="mt-3 text-sm leading-relaxed text-neutral-400 sm:text-base">
						Pilih kategori di bawah ini untuk melihat seluruh daftar barang, detail spesifikasi, dan
						kelengkapan yang tersedia.
					</p>
				</div>
				<a
					href="/katalog"
					class="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/20 bg-white/[0.06] px-5 py-2.5 text-sm font-bold text-white transition hover:border-white hover:bg-white hover:text-black"
				>
					Lihat semua katalog
					<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
						<path
							fill-rule="evenodd"
							d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
							clip-rule="evenodd"
						/>
					</svg>
				</a>
			</div>

			<div class="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
				{#each data.categories as category (category.id)}
					<a
						href={`/katalog?kategori=${category.slug}`}
						class="group flex flex-col rounded-[2rem] border border-white/15 bg-[#0c0c0f] p-5 transition duration-300 hover:-translate-y-1 hover:border-white/45 hover:bg-[#141418]"
					>
						<div class="flex items-center justify-between gap-2">
							<span
								class="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white text-black transition group-hover:scale-105"
							>
								<CategoryIcon icon={category.icon} class="h-5 w-5" />
							</span>
							<span
								class="rounded-full border border-white/15 bg-white/[0.07] px-3 py-1 text-xs font-bold text-white"
							>
								{category.itemCount} item
							</span>
						</div>

						<h3 class="mt-5 text-base font-bold tracking-tight text-white">
							{category.name}
						</h3>

						<p class="mt-1.5 line-clamp-2 flex-1 text-sm leading-relaxed text-neutral-400">
							{category.description}
						</p>

						{#if category.previewItems.length > 0}
							<div class="mt-4 border-t border-white/10 pt-3">
								<p class="truncate text-xs font-medium text-neutral-500">
									{category.previewItems.slice(0, 2).join(' · ')}
								</p>
							</div>
						{/if}
					</a>
				{/each}
			</div>
		</div>
	</section>

	<!-- Preview Katalog Barang Interaktif -->
	<section class="border-t border-white/10 bg-black py-20 sm:py-28">
		<div class="mx-auto max-w-6xl px-6">
			<div class="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
				<div class="max-w-2xl">
					<span
						class="inline-flex rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1 text-xs font-bold tracking-wide text-neutral-300 uppercase"
					>
						Detail Katalog Unit {activeBranch ? `· ${activeBranch.name}` : ''}
					</span>
					<h2 class="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
						Cek spesifikasi &amp; kelengkapan sebelum menyewa.
					</h2>
				</div>
				<a
					href={activeCategoryMeta ? `/katalog?kategori=${activeCategoryMeta.slug}` : '/katalog'}
					class="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/20 bg-white/[0.06] px-5 py-2.5 text-sm font-bold text-white transition hover:border-white hover:bg-white hover:text-black"
				>
					{activeCategoryMeta
						? `Semua ${activeCategoryMeta.itemCount} item di ${activeCategoryMeta.name}`
						: `Lihat seluruh ${data.totalItems} barang`}
					<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
						<path
							fill-rule="evenodd"
							d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
							clip-rule="evenodd"
						/>
					</svg>
				</a>
			</div>

			<!-- Interactive Category Tabs -->
			<div class="mt-9 flex flex-wrap gap-2">
				<button
					type="button"
					onclick={() => (activeTab = 'featured')}
					class="rounded-full px-4 py-2 text-xs font-bold transition {activeTab === 'featured'
						? 'bg-white text-black'
						: 'border border-white/15 bg-[#0e0e11] text-neutral-300 hover:border-white/40 hover:text-white'}"
				>
					Pilihan Populer
				</button>
				{#each data.categories as cat (cat.id)}
					<button
						type="button"
						onclick={() => (activeTab = cat.slug)}
						class="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition {activeTab ===
						cat.slug
							? 'bg-white text-black'
							: 'border border-white/15 bg-[#0e0e11] text-neutral-300 hover:border-white/40 hover:text-white'}"
					>
						<span>{cat.name}</span>
						<span
							class="text-xs {activeTab === cat.slug ? 'text-neutral-600' : 'text-neutral-500'}"
						>
							{cat.itemCount}
						</span>
					</button>
				{/each}
			</div>

			{#if visibleShowcaseItems.length > 0}
				<div class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{#each visibleShowcaseItems as item (item.id)}
						<RentalItemCard {item} variant="dark" />
					{/each}
				</div>
			{:else}
				<div
					class="mt-10 rounded-[2rem] border border-white/15 bg-[#0c0c0f] p-12 text-center"
				>
					<p class="text-sm text-neutral-400">Belum ada unit pada kategori ini.</p>
				</div>
			{/if}

			<div class="mt-12 text-center">
				<a
					href={activeCategoryMeta ? `/katalog?kategori=${activeCategoryMeta.slug}` : '/katalog'}
					class="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-bold text-black transition hover:bg-neutral-200"
				>
					{activeCategoryMeta
						? `Lihat Semua di ${activeCategoryMeta.name}`
						: `Buka Katalog Lengkap (${data.totalItems} Barang)`}
					<span aria-hidden="true">→</span>
				</a>
			</div>
		</div>
	</section>

	<!-- Cara Sewa (4 Langkah) -->
	<section id="cara-sewa" class="scroll-mt-24 border-t border-white/10 bg-black py-20 sm:py-28">
		<div class="mx-auto max-w-6xl px-6">
			<div class="max-w-2xl">
				<span
					class="inline-flex rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1 text-xs font-bold tracking-wide text-neutral-300 uppercase"
				>
					Alur Pemesanan
				</span>
				<h2 class="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
					Cara sewa barang di Adasewa.id sangat mudah.
				</h2>
				<p class="mt-3 text-sm leading-relaxed text-neutral-400 sm:text-base">
					Pahami detail barang dulu di website ini, lalu pesan dalam hitungan menit tanpa ribet.
				</p>
			</div>

			<div class="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
				{#each rentalSteps as step (step.num)}
					<div
						class="flex flex-col rounded-[2rem] border border-white/15 bg-[#0c0c0f] p-7 transition hover:border-white/35"
					>
						<span
							class="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white font-mono text-sm font-semibold text-black"
						>
							{step.num}
						</span>
						<h3 class="mt-6 text-base font-bold tracking-tight text-white">
							{step.title}
						</h3>
						<p class="mt-2.5 text-sm leading-relaxed text-neutral-400">
							{step.desc}
						</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Cabang Kios & Ketentuan Ringkas -->
	<section id="area-layanan" class="scroll-mt-24 border-t border-white/10 bg-black py-20 sm:py-28">
		<div class="mx-auto max-w-6xl px-6">
			<div class="grid gap-6 lg:grid-cols-12">
				<!-- Cabang Kios & Jangkauan Pengiriman -->
				<div
					class="rounded-[2.5rem] border border-white/15 bg-[#0b0b0e] p-7 sm:p-10 lg:col-span-7"
				>
					<span
						class="inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/15 px-3.5 py-1 text-xs font-bold tracking-wide text-emerald-300 uppercase"
					>
						Lokasi Cabang Kios &amp; Area Layanan
					</span>
					<h2 class="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
						Cabang Penyewaan Resmi Adasewa.id
					</h2>
					<p class="mt-3 text-sm leading-relaxed text-neutral-400">
						Setiap cabang memiliki stok, daftar tarif sewa, alamat kios, dan nomor WhatsApp CS
						tersendiri. Pembayaran dilakukan melalui <strong class="text-white"
							>rekening pusat Adasewa.id</strong
						>.
					</p>

					{#if data.branches.length > 0}
						<div class="mt-6 grid gap-4 sm:grid-cols-2">
							{#each data.branches as branch (branch.id)}
								{@const isSelected = activeBranch?.id === branch.id}
								<div
									class="flex flex-col justify-between rounded-[1.75rem] border p-5 transition {isSelected
										? 'border-2 border-white bg-[#141419]'
										: 'border-white/15 bg-black hover:border-white/35'}"
								>
									<div>
										<div class="flex items-center justify-between gap-2">
											<div class="flex items-center gap-2">
												<span
													class="h-2.5 w-2.5 rounded-full {isSelected
														? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
														: 'bg-neutral-600'}"
												></span>
												<p class="text-sm font-bold text-white">{branch.name}</p>
											</div>
											<span
												class="rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 font-mono text-xs font-bold text-white"
											>
												{branch.code}
											</span>
										</div>
										<p class="mt-2.5 text-sm leading-relaxed text-neutral-300">
											📍 {branch.address}
										</p>
										<p class="mt-2 text-sm text-neutral-400">
											🕒 {branch.operatingHours}
										</p>
										<p class="mt-1 text-sm text-neutral-400">
											🚚 Ongkir dasar:
											<strong class="text-white">{formatRupiah(branch.deliveryFeeDefault)}</strong>
										</p>
										<p class="mt-1 text-sm text-neutral-400">
											📞 WA CS: <strong class="text-white">{branch.phone}</strong>
										</p>
									</div>

									<div class="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-3.5">
										<button
											type="button"
											onclick={() => rentalCart.selectBranch(branch)}
											class="flex-1 rounded-full px-3.5 py-2 text-xs font-bold transition {isSelected
												? 'bg-emerald-400 text-black'
												: 'bg-white text-black hover:bg-neutral-200'}"
										>
											{isSelected ? '✓ Cabang Aktif' : 'Pilih Cabang Ini'}
										</button>
										<a
											href={buildBranchWhatsAppUrl(
												branch,
												data.settings,
												`Halo ${branch.name} Adasewa.id, saya ingin menanyakan ketersediaan barang sewa.`
											)}
											target="_blank"
											rel="noopener noreferrer"
											class="rounded-full border border-white/20 bg-white/[0.06] px-3.5 py-2 text-xs font-semibold text-white transition hover:border-white hover:bg-white/15"
										>
											WA Cabang
										</a>
									</div>
								</div>
							{/each}
						</div>
					{/if}

					<div class="mt-5 grid gap-3 sm:grid-cols-2">
						{#each deliveryAreas as area (area.region)}
							<div
								class="rounded-[1.25rem] border border-white/10 bg-black/70 px-4 py-3"
							>
								<p class="text-sm font-semibold text-white">{area.region}</p>
								<p class="mt-0.5 text-sm leading-relaxed text-neutral-400">{area.areas}</p>
							</div>
						{/each}
					</div>
				</div>

				<!-- Standar & Ketentuan -->
				<div
					class="flex flex-col justify-between rounded-[2.5rem] border-2 border-white/20 bg-[#101014] p-7 text-white sm:p-10 lg:col-span-5"
				>
					<div>
						<span
							class="inline-flex rounded-full border border-white/15 bg-white/[0.08] px-3.5 py-1 text-xs font-bold tracking-wide text-neutral-200 uppercase"
						>
							Ketentuan &amp; Jaminan Kualitas
						</span>
						<h2 class="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
							Hal penting sebelum melakukan pemesanan.
						</h2>

						<ul class="mt-7 space-y-4 text-sm text-neutral-300">
							<li class="flex gap-3">
								<span
									class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-black"
								>
									✓
								</span>
								<span>
									<strong class="text-white">Siapkan data dasar:</strong> Nama lengkap, Nomor HP/WA
									aktif, Nomor HP Darurat, tanggal mulai &amp; selesai pemakaian, serta alamat
									kirim.
								</span>
							</li>
							<li class="flex gap-3">
								<span
									class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-black"
								>
									✓
								</span>
								<span>
									<strong class="text-white">Cek fungsi bersama:</strong> Setiap unit diuji nyala
									dan dicek kelengkapannya sebelum serah terima agar aman dipakai di acara Anda.
								</span>
							</li>
							<li class="flex gap-3">
								<span
									class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-black"
								>
									✓
								</span>
								<span>
									<strong class="text-white">Verifikasi unit bernilai tinggi:</strong> Sewa gadget
									(iPhone, Laptop ROG, kamera, drone), kendaraan &amp; perangkat besar mengikuti
									verifikasi identitas &amp; ketentuan DP.
								</span>
							</li>
							<li class="flex gap-3">
								<span
									class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-black"
								>
									✓
								</span>
								<span>
									<strong class="text-white">Booking lebih awal disarankan:</strong> Terutama untuk
									akhir pekan, musim wisuda, dan event skala besar agar stok pasti terkunci.
								</span>
							</li>
						</ul>
					</div>

					<div class="mt-8 flex flex-wrap gap-2.5 border-t border-white/15 pt-6">
						<a
							href="/keranjang"
							class="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white px-5 py-3.5 text-sm font-bold text-black transition hover:bg-neutral-200"
						>
							Buka Keranjang Sewa →
						</a>
						<a
							href="/akun"
							class="inline-flex flex-1 items-center justify-center rounded-full border border-white/25 px-5 py-3.5 text-sm font-bold text-white transition hover:border-white hover:bg-white/10"
						>
							Dashboard Pemesan
						</a>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Dokumentasi Acara (jika tersedia di CMS) -->
	{#if data.featuredPortfolios.length > 0}
		<section class="border-t border-white/10 bg-black py-20 sm:py-28">
			<div class="mx-auto max-w-6xl px-6">
				<div class="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
					<div class="max-w-2xl">
						<span
							class="inline-flex rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1 text-xs font-bold tracking-wide text-neutral-300 uppercase"
						>
							Contoh Paket &amp; Dokumentasi
						</span>
						<h2 class="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
							Inspirasi penggunaan unit untuk berbagai skala acara.
						</h2>
					</div>
					<a
						href="/portfolios"
						class="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/20 bg-white/[0.06] px-5 py-2.5 text-sm font-bold text-white transition hover:border-white hover:bg-white hover:text-black"
					>
						Lihat semua dokumentasi →
					</a>
				</div>

				<div class="mt-12 grid gap-6 md:grid-cols-2">
					{#each data.featuredPortfolios as portfolio (portfolio.id)}
						<PortfolioCard {portfolio} variant="dark" />
					{/each}
				</div>
			</div>
		</section>
	{/if}

	<!-- FAQ Interaktif -->
	<section class="border-t border-white/10 bg-black py-20 sm:py-28">
		<div class="mx-auto max-w-4xl px-6">
			<div class="text-center">
				<span
					class="inline-flex rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1 text-xs font-bold tracking-wide text-neutral-300 uppercase"
				>
					FAQ
				</span>
				<h2 class="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
					Pertanyaan yang sering ditanyakan penyewa.
				</h2>
			</div>

			<div class="mt-12 space-y-3.5">
				{#each faqs as faq, index (faq.q)}
					{@const isOpen = openFaqIndex === index}
					<div
						class="overflow-hidden rounded-[1.75rem] border transition {isOpen
							? 'border-white/35 bg-[#121216]'
							: 'border-white/15 bg-[#0b0b0e] hover:border-white/30'}"
					>
						<button
							type="button"
							onclick={() => (openFaqIndex = isOpen ? null : index)}
							aria-expanded={isOpen}
							class="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
						>
							<span class="text-sm font-bold text-white sm:text-base">{faq.q}</span>
							<span
								class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition {isOpen
									? 'rotate-45 bg-white text-black'
									: 'border border-white/20 bg-white/10 text-white'}"
								aria-hidden="true"
							>
								+
							</span>
						</button>
						{#if isOpen}
							<div
								class="border-t border-white/10 px-6 py-4 text-sm leading-relaxed text-neutral-300"
							>
								{faq.a}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- CTA Penutup -->
	<section class="bg-black pb-20 sm:pb-24">
		<div class="mx-auto max-w-6xl px-6">
			<div
				class="rounded-[2.75rem] border-2 border-white/25 bg-[#0d0d11] px-8 py-14 text-white shadow-2xl sm:px-14 sm:py-20"
			>
				<div class="grid items-center gap-10 lg:grid-cols-12">
					<div class="lg:col-span-7">
						<span
							class="inline-flex rounded-full border border-emerald-400/35 bg-emerald-400/15 px-3.5 py-1 text-xs font-bold tracking-wide text-emerald-300 uppercase"
						>
							Siap Sewa Sekarang?
						</span>
						<h2 class="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
							Temukan barang yang Anda butuhkan dan kunci jadwalnya hari ini.
						</h2>
						<p class="mt-4 max-w-2xl text-sm leading-relaxed text-neutral-300 sm:text-base">
							Cek detail 135+ unit di katalog kami, atau langsung hubungi tim Adasewa.id untuk
							konsultasi paket acara &amp; estimasi biaya delivery DKI–Jabar–Jateng–DIY.
						</p>
					</div>
					<div class="flex flex-wrap gap-3 lg:col-span-5 lg:justify-end">
						<a
							href="/katalog"
							class="inline-flex items-center justify-center rounded-full bg-white px-7 py-4 text-sm font-bold text-black transition hover:bg-neutral-200"
						>
							Pilih Barang di Katalog
						</a>
						<a
							href="/keranjang"
							class="inline-flex items-center justify-center gap-1.5 rounded-full border-2 border-white/25 px-7 py-4 text-sm font-bold text-white transition hover:border-white hover:bg-white/10"
						>
							Lihat Keranjang Sewa
						</a>
						<a
							href={whatsappUrl}
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex items-center justify-center rounded-full bg-emerald-400 px-7 py-4 text-sm font-semibold text-black transition hover:bg-emerald-300"
						>
							WhatsApp CS
						</a>
					</div>
				</div>
			</div>
		</div>
	</section>
</div>
