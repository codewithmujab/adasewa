<script lang="ts">
	import CategoryIcon from '#lib/components/public/CategoryIcon.svelte';
	import HeroSection from '#lib/components/public/HeroSection.svelte';
	import PortfolioCard from '#lib/components/public/PortfolioCard.svelte';
	import RentalItemCard from '#lib/components/public/RentalItemCard.svelte';
	import { buildWhatsAppUrl, getCategoryTheme } from '#lib/utils/catalog';
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
	let whatsappUrl = $derived(
		buildWhatsAppUrl(
			data.settings,
			'Halo Adasewa.id, saya ingin menanyakan informasi penyewaan barang.'
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

<HeroSection
	settings={data.settings}
	totalItems={data.totalItems}
	totalCategories={data.totalCategories}
/>

<!-- Promo & Voucher Diskon Aktif -->
{#if data.activePromos.length > 0}
	<section class="border-t border-neutral-100 bg-white py-14 sm:py-16">
		<div class="mx-auto max-w-6xl px-6">
			<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
				<div>
					<p class="text-xs font-semibold tracking-widest text-rose-600 uppercase">
						Promo &amp; Voucher Aktif
					</p>
					<h2 class="mt-2 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
						Hemat lebih banyak dengan kode promo sewa.
					</h2>
				</div>
				<p class="text-xs text-neutral-500">
					Salin kode promo di bawah dan masukkan di halaman Checkout — bisa digabung dengan Poin Sewa!
				</p>
			</div>

			<div class="mt-8 grid gap-4 md:grid-cols-3">
				{#each data.activePromos.slice(0, 3) as promo (promo.id)}
					<div
						class="flex flex-col justify-between rounded-3xl border border-neutral-200/80 bg-surface/70 p-5 transition hover:border-neutral-300 hover:bg-white hover:shadow-md hover:shadow-neutral-950/[0.04]"
					>
						<div>
							<div class="flex items-center justify-between gap-2">
								<span
									class="inline-flex rounded-full bg-rose-50 px-3 py-1 text-[11px] font-bold text-rose-700"
								>
									{formatPromoBadge(promo)}
								</span>
								{#if promo.usageLimit !== null}
									<span class="text-[11px] font-medium text-neutral-400">
										Sisa {Math.max(0, promo.usageLimit - promo.usedCount)} kuota
									</span>
								{/if}
							</div>

							<h3 class="mt-3 text-base font-bold text-neutral-950">{promo.title}</h3>
							<p class="mt-1 text-xs leading-relaxed text-neutral-500">{promo.description}</p>
							<p class="mt-2 text-[11px] font-medium text-neutral-700">
								{formatPromoDetail(promo)}
							</p>
						</div>

						<div class="mt-4 flex items-center justify-between gap-2 rounded-2xl border border-dashed border-neutral-300 bg-white px-3.5 py-2.5">
							<span class="font-mono text-sm font-bold tracking-wider text-neutral-950">
								{promo.code}
							</span>
							<button
								type="button"
								onclick={() => copyPromoCode(promo.code)}
								class="rounded-full bg-neutral-950 px-3.5 py-1 text-[11px] font-semibold text-white transition hover:bg-neutral-800"
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
<section class="border-t border-neutral-100 bg-surface py-20 sm:py-28">
	<div class="mx-auto max-w-6xl px-6">
		<div class="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
			<div class="max-w-2xl">
				<p class="text-xs font-semibold tracking-widest text-neutral-400 uppercase">
					Kategori Lengkap
				</p>
				<h2 class="mt-3 text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">
					Satu tempat untuk semua kebutuhan sewa Anda.
				</h2>
				<p class="mt-3 text-sm leading-relaxed text-neutral-500 sm:text-base">
					Pilih kategori di bawah ini untuk melihat seluruh daftar barang, detail spesifikasi, dan
					kelengkapan yang tersedia.
				</p>
			</div>
			<a
				href="/katalog"
				class="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-neutral-950 transition hover:text-neutral-600"
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
				{@const theme = getCategoryTheme(category.accent)}
				<a
					href={`/katalog?kategori=${category.slug}`}
					class="group flex flex-col rounded-3xl border border-neutral-200/80 bg-white p-5 transition duration-300 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-lg hover:shadow-neutral-950/[0.05]"
				>
					<div class="flex items-center justify-between gap-2">
						<span
							class="flex h-11 w-11 items-center justify-center rounded-2xl {theme.iconBg} {theme.iconText} transition group-hover:scale-105"
						>
							<CategoryIcon icon={category.icon} class="h-5 w-5" />
						</span>
						<span
							class="rounded-full bg-surface px-2.5 py-1 text-[11px] font-semibold text-neutral-600"
						>
							{category.itemCount} item
						</span>
					</div>

					<h3 class="mt-4 text-base font-semibold tracking-tight text-neutral-950">
						{category.name}
					</h3>

					<p class="mt-1.5 line-clamp-2 flex-1 text-xs leading-relaxed text-neutral-500">
						{category.description}
					</p>

					{#if category.previewItems.length > 0}
						<div class="mt-4 border-t border-neutral-100 pt-3">
							<p class="truncate text-[11px] text-neutral-400">
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
<section class="bg-white py-20 sm:py-28">
	<div class="mx-auto max-w-6xl px-6">
		<div class="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
			<div class="max-w-2xl">
				<p class="text-xs font-semibold tracking-widest text-neutral-400 uppercase">
					Detail Katalog Unit
				</p>
				<h2 class="mt-3 text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">
					Cek spesifikasi &amp; kelengkapan sebelum menyewa.
				</h2>
			</div>
			<a
				href={activeCategoryMeta ? `/katalog?kategori=${activeCategoryMeta.slug}` : '/katalog'}
				class="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-neutral-950 transition hover:text-neutral-600"
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
		<div class="mt-8 flex flex-wrap gap-2">
			<button
				type="button"
				onclick={() => (activeTab = 'featured')}
				class="rounded-full px-4 py-2 text-xs font-semibold transition {activeTab === 'featured'
					? 'bg-neutral-950 text-white'
					: 'border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400 hover:text-neutral-950'}"
			>
				Pilihan Populer
			</button>
			{#each data.categories as cat (cat.id)}
				<button
					type="button"
					onclick={() => (activeTab = cat.slug)}
					class="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition {activeTab ===
					cat.slug
						? 'bg-neutral-950 text-white'
						: 'border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400 hover:text-neutral-950'}"
				>
					<span>{cat.name}</span>
					<span
						class="text-[10px] {activeTab === cat.slug ? 'text-neutral-300' : 'text-neutral-400'}"
					>
						{cat.itemCount}
					</span>
				</button>
			{/each}
		</div>

		{#if visibleShowcaseItems.length > 0}
			<div class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{#each visibleShowcaseItems as item (item.id)}
					<RentalItemCard {item} />
				{/each}
			</div>
		{:else}
			<div class="mt-10 rounded-3xl border border-neutral-200 bg-surface p-12 text-center">
				<p class="text-sm text-neutral-500">Belum ada unit pada kategori ini.</p>
			</div>
		{/if}

		<div class="mt-12 text-center">
			<a
				href={activeCategoryMeta ? `/katalog?kategori=${activeCategoryMeta.slug}` : '/katalog'}
				class="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-7 py-3.5 text-sm font-semibold text-neutral-950 transition hover:border-neutral-950 hover:bg-neutral-950 hover:text-white"
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
<section id="cara-sewa" class="scroll-mt-20 border-t border-neutral-100 bg-surface py-20 sm:py-28">
	<div class="mx-auto max-w-6xl px-6">
		<div class="max-w-2xl">
			<p class="text-xs font-semibold tracking-widest text-neutral-400 uppercase">Alur Pemesanan</p>
			<h2 class="mt-3 text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">
				Cara sewa barang di Adasewa.id sangat mudah.
			</h2>
			<p class="mt-3 text-sm leading-relaxed text-neutral-500 sm:text-base">
				Pahami detail barang dulu di website ini, lalu pesan dalam hitungan menit tanpa ribet.
			</p>
		</div>

		<div class="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
			{#each rentalSteps as step (step.num)}
				<div class="flex flex-col rounded-3xl border border-neutral-200/80 bg-white p-6">
					<span
						class="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-950 font-mono text-xs font-bold text-white"
					>
						{step.num}
					</span>
					<h3 class="mt-5 text-base font-semibold tracking-tight text-neutral-950">
						{step.title}
					</h3>
					<p class="mt-2 text-sm leading-relaxed text-neutral-500">
						{step.desc}
					</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- Cakupan Delivery & Ketentuan Ringkas -->
<section id="area-layanan" class="scroll-mt-20 bg-white py-20 sm:py-28">
	<div class="mx-auto max-w-6xl px-6">
		<div class="grid gap-6 lg:grid-cols-12">
			<!-- Area Delivery -->
			<div class="rounded-3xl border border-neutral-200/80 bg-surface p-7 sm:p-10 lg:col-span-7">
				<p class="text-xs font-semibold tracking-widest text-emerald-700 uppercase">
					Jangkauan Pengiriman
				</p>
				<h2 class="mt-3 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
					Delivery DKI, Jawa Barat, Jawa Tengah &amp; DIY.
				</h2>
				<p class="mt-3 text-sm leading-relaxed text-neutral-500">
					Tidak sempat mengambil unit sendiri? Tim kami siap mengantar dan menjemput kembali barang
					sewaan langsung ke rumah, kantor, kampus, maupun venue acara Anda.
				</p>

				<div class="mt-7 grid gap-3 sm:grid-cols-2">
					{#each deliveryAreas as area (area.region)}
						<div class="rounded-2xl border border-neutral-200/70 bg-white p-4">
							<div class="flex items-center gap-2">
								<span class="h-2 w-2 rounded-full bg-emerald-500"></span>
								<p class="text-sm font-semibold text-neutral-950">{area.region}</p>
							</div>
							<p class="mt-1.5 text-xs leading-relaxed text-neutral-500">{area.areas}</p>
						</div>
					{/each}
				</div>

				<div class="mt-5 rounded-2xl border border-dashed border-neutral-300 bg-white/80 p-4">
					<p class="text-xs font-semibold text-neutral-900">Tersedia Opsi Ambil di Kios</p>
					<p class="mt-1 text-xs leading-relaxed text-neutral-500">
						Ingin lebih hemat ongkos kirim? Anda bisa mengambil dan mengembalikan unit langsung di
						kios sesuai jadwal yang sudah dikonfirmasi bersama CS.
					</p>
				</div>
			</div>

			<!-- Standar & Ketentuan -->
			<div class="flex flex-col justify-between rounded-3xl bg-neutral-950 p-7 text-white sm:p-10 lg:col-span-5">
				<div>
					<p class="text-xs font-semibold tracking-widest text-neutral-400 uppercase">
						Ketentuan &amp; Jaminan Kualitas
					</p>
					<h2 class="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
						Hal penting sebelum melakukan pemesanan.
					</h2>

					<ul class="mt-7 space-y-4 text-sm text-neutral-300">
						<li class="flex gap-3">
							<span class="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold text-emerald-400">
								✓
							</span>
							<span>
								<strong class="text-white">Siapkan data dasar:</strong> Nama lengkap, Nomor HP/WA
								aktif, Nomor HP Darurat, tanggal mulai &amp; selesai pemakaian, serta alamat kirim.
							</span>
						</li>
						<li class="flex gap-3">
							<span class="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold text-emerald-400">
								✓
							</span>
							<span>
								<strong class="text-white">Cek fungsi bersama:</strong> Setiap unit diuji nyala dan
								dicek kelengkapannya sebelum serah terima agar aman dipakai di acara Anda.
							</span>
						</li>
						<li class="flex gap-3">
							<span class="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold text-emerald-400">
								✓
							</span>
							<span>
								<strong class="text-white">Verifikasi unit bernilai tinggi:</strong> Sewa gadget
								(iPhone, Laptop ROG, kamera, drone), kendaraan &amp; perangkat besar mengikuti
								verifikasi identitas &amp; ketentuan DP.
							</span>
						</li>
						<li class="flex gap-3">
							<span class="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold text-emerald-400">
								✓
							</span>
							<span>
								<strong class="text-white">Booking lebih awal disarankan:</strong> Terutama untuk
								akhir pekan, musim wisuda, dan event skala besar agar stok pasti terkunci.
							</span>
						</li>
					</ul>
				</div>

				<div class="mt-8 flex flex-wrap gap-2.5 border-t border-white/10 pt-6">
					<a
						href="/keranjang"
						class="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white px-5 py-3 text-xs font-semibold text-neutral-950 transition hover:bg-neutral-200"
					>
						Buka Keranjang Sewa →
					</a>
					<a
						href="/akun"
						class="inline-flex flex-1 items-center justify-center rounded-full border border-white/20 px-5 py-3 text-xs font-semibold text-white transition hover:bg-white/10"
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
	<section class="border-t border-neutral-100 bg-surface py-20 sm:py-28">
		<div class="mx-auto max-w-6xl px-6">
			<div class="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
				<div class="max-w-2xl">
					<p class="text-xs font-semibold tracking-widest text-neutral-400 uppercase">
						Contoh Paket &amp; Dokumentasi
					</p>
					<h2 class="mt-3 text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">
						Inspirasi penggunaan unit untuk berbagai skala acara.
					</h2>
				</div>
				<a
					href="/portfolios"
					class="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-neutral-950 transition hover:text-neutral-600"
				>
					Lihat semua dokumentasi →
				</a>
			</div>

			<div class="mt-12 grid gap-6 md:grid-cols-2">
				{#each data.featuredPortfolios as portfolio (portfolio.id)}
					<PortfolioCard {portfolio} />
				{/each}
			</div>
		</div>
	</section>
{/if}

<!-- FAQ Interaktif -->
<section class="border-t border-neutral-100 bg-white py-20 sm:py-28">
	<div class="mx-auto max-w-4xl px-6">
		<div class="text-center">
			<p class="text-xs font-semibold tracking-widest text-neutral-400 uppercase">FAQ</p>
			<h2 class="mt-3 text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">
				Pertanyaan yang sering ditanyakan penyewa.
			</h2>
		</div>

		<div class="mt-12 space-y-3">
			{#each faqs as faq, index (faq.q)}
				{@const isOpen = openFaqIndex === index}
				<div class="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white">
					<button
						type="button"
						onclick={() => (openFaqIndex = isOpen ? null : index)}
						aria-expanded={isOpen}
						class="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition hover:bg-neutral-50/70"
					>
						<span class="text-sm font-semibold text-neutral-950 sm:text-base">{faq.q}</span>
						<span
							class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface text-sm font-medium text-neutral-600 transition {isOpen
								? 'rotate-45 bg-neutral-950 text-white'
								: ''}"
							aria-hidden="true"
						>
							+
						</span>
					</button>
					{#if isOpen}
						<div class="border-t border-neutral-100 px-6 py-4 text-sm leading-relaxed text-neutral-600">
							{faq.a}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- CTA Penutup -->
<section class="bg-white pb-24 sm:pb-32">
	<div class="mx-auto max-w-6xl px-6">
		<div class="rounded-3xl bg-neutral-950 px-8 py-14 text-white sm:px-14 sm:py-20">
			<div class="grid items-center gap-10 lg:grid-cols-12">
				<div class="lg:col-span-7">
					<p class="text-xs font-semibold tracking-widest text-emerald-400 uppercase">
						Siap Sewa Sekarang?
					</p>
					<h2 class="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
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
						class="inline-flex items-center justify-center rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-200"
					>
						Pilih Barang di Katalog
					</a>
					<a
						href="/keranjang"
						class="inline-flex items-center justify-center gap-1.5 rounded-full border border-white/25 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
					>
						Lihat Keranjang Sewa
					</a>
					<a
						href={whatsappUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
					>
						WhatsApp CS
					</a>
				</div>
			</div>
		</div>
	</div>
</section>
