<script lang="ts">
	import type { CompanySettings } from '#lib/server/db/schema';
	import { buildWhatsAppUrl } from '#lib/utils/catalog';

	interface Props {
		settings: CompanySettings;
		dark?: boolean;
	}

	let { settings, dark = false }: Props = $props();

	const currentYear = new Date().getFullYear();

	const quickCategories = [
		{ slug: 'proyektor-display', label: 'Proyektor & TV LED' },
		{ slug: 'audio-sound-system', label: 'Sound System & HT' },
		{ slug: 'kamera-streaming-booth', label: 'Kamera & Streaming' },
		{ slug: 'gadget-laptop-gaming', label: 'iPhone, Laptop ROG & PS5' },
		{ slug: 'event-lighting-panggung', label: 'Lighting, Panggung & Genset' },
		{ slug: 'kendaraan-transportasi', label: 'Hiace, Mobil & Motor' }
	] as const;

	let whatsappUrl = $derived(
		buildWhatsAppUrl(
			settings,
			'Halo Adasewa.id, saya ingin menanyakan ketersediaan dan informasi penyewaan barang.'
		)
	);

	let socialEntries = $derived.by(() => {
		const entries: Array<{ label: string; href: string }> = [];
		const links = settings.socialLinks;
		if (links.instagram) entries.push({ label: 'Instagram', href: links.instagram });
		if (links.tiktok) entries.push({ label: 'TikTok', href: links.tiktok });
		if (links.youtube) entries.push({ label: 'YouTube', href: links.youtube });
		if (links.whatsapp) entries.push({ label: 'WhatsApp', href: whatsappUrl });
		return entries;
	});
</script>

<footer
	class={dark
		? 'border-t border-white/15 bg-black text-neutral-300'
		: 'border-t border-neutral-200/80 bg-surface'}
>
	<div class="mx-auto max-w-6xl px-6 py-16">
		<div
			class={dark
				? 'grid gap-10 rounded-[2.5rem] border border-white/15 bg-[#0a0a0d] p-8 sm:p-12 md:grid-cols-12'
				: 'grid gap-10 md:grid-cols-12'}
		>
			<div class="md:col-span-4">
				<div class="flex items-center gap-3">
					<img
						src={settings.logoUrl || '/logo-adasewa.jpg'}
						alt={settings.companyName}
						class="h-10 w-10 rounded-full object-cover {dark
							? 'ring-2 ring-white/25'
							: 'ring-1 ring-neutral-200/80'}"
					/>
					<span
						class="text-base font-bold tracking-tight {dark ? 'text-white' : 'text-neutral-950'}"
					>
						{settings.companyName}
					</span>
				</div>
				<p
					class="mt-4 max-w-sm text-sm leading-relaxed {dark
						? 'text-neutral-400'
						: 'text-neutral-500'}"
				>
					{settings.tagline}
				</p>
				<div class="mt-5 flex flex-wrap gap-1.5">
					{#each ['DKI Jakarta', 'Jawa Barat', 'Jawa Tengah', 'D.I. Yogyakarta'] as area (area)}
						<span
							class="rounded-full border px-3 py-1 text-[11px] font-semibold {dark
								? 'border-white/15 bg-white/[0.06] text-neutral-200'
								: 'border-neutral-200 bg-white text-neutral-600'}"
						>
							{area}
						</span>
					{/each}
				</div>
			</div>

			<div class="md:col-span-3">
				<h3
					class="text-xs font-bold tracking-wider uppercase {dark
						? 'text-white'
						: 'text-neutral-950'}"
				>
					Kategori Populer
				</h3>
				<ul
					class="mt-4 space-y-2.5 text-sm {dark ? 'text-neutral-400' : 'text-neutral-600'}"
				>
					{#each quickCategories as cat (cat.slug)}
						<li>
							<a
								href={`/katalog?kategori=${cat.slug}`}
								class="transition {dark ? 'hover:text-white' : 'hover:text-neutral-950'}"
							>
								{cat.label}
							</a>
						</li>
					{/each}
				</ul>
			</div>

			<div class="md:col-span-2">
				<h3
					class="text-xs font-bold tracking-wider uppercase {dark
						? 'text-white'
						: 'text-neutral-950'}"
				>
					Layanan Pemesan
				</h3>
				<ul
					class="mt-4 space-y-2.5 text-sm {dark ? 'text-neutral-400' : 'text-neutral-600'}"
				>
					<li>
						<a
							href="/katalog"
							class="transition {dark ? 'hover:text-white' : 'hover:text-neutral-950'}"
						>
							Katalog Barang
						</a>
					</li>
					<li>
						<a
							href="/keranjang"
							class="transition {dark ? 'hover:text-white' : 'hover:text-neutral-950'}"
						>
							Keranjang Sewa
						</a>
					</li>
					<li>
						<a
							href="/akun"
							class="transition {dark ? 'hover:text-white' : 'hover:text-neutral-950'}"
						>
							Dashboard Pemesan
						</a>
					</li>
					<li>
						<a
							href="/#cara-sewa"
							class="transition {dark ? 'hover:text-white' : 'hover:text-neutral-950'}"
						>
							Cara Sewa
						</a>
					</li>
					<li>
						<a
							href="/about"
							class="transition {dark ? 'hover:text-white' : 'hover:text-neutral-950'}"
						>
							Tentang Kami
						</a>
					</li>
				</ul>
			</div>

			<div class="md:col-span-3">
				<h3
					class="text-xs font-bold tracking-wider uppercase {dark
						? 'text-white'
						: 'text-neutral-950'}"
				>
					Bantuan &amp; Kontak
				</h3>
				<ul
					class="mt-4 space-y-2.5 text-sm {dark ? 'text-neutral-400' : 'text-neutral-600'}"
				>
					{#if settings.phone}
						<li>
							<a
								href={whatsappUrl}
								target="_blank"
								rel="noopener noreferrer"
								class="font-semibold transition {dark
									? 'text-white hover:text-emerald-400'
									: 'text-neutral-950 hover:text-neutral-700'}"
							>
								WhatsApp CS: {settings.phone}
							</a>
						</li>
					{/if}
					<li>
						<a
							href={`mailto:${settings.email}`}
							class="transition {dark ? 'hover:text-white' : 'hover:text-neutral-950'}"
						>
							{settings.email}
						</a>
					</li>
				</ul>

				{#if socialEntries.length > 0}
					<div class="mt-5 flex flex-wrap gap-2">
						{#each socialEntries as item (item.label)}
							<a
								href={item.href}
								target="_blank"
								rel="noopener noreferrer"
								class="rounded-full border px-3.5 py-1.5 text-xs font-semibold transition {dark
									? 'border-white/20 bg-white/[0.06] text-white hover:border-white hover:bg-white hover:text-black'
									: 'border-neutral-300/80 bg-white text-neutral-700 hover:border-neutral-950 hover:text-neutral-950'}"
							>
								{item.label}
							</a>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<div
			class="mt-8 flex flex-col items-start justify-between gap-4 px-2 text-xs sm:flex-row sm:items-center {dark
				? 'text-neutral-500'
				: 'mt-14 border-t border-neutral-200 pt-6 text-neutral-500'}"
		>
			<p>&copy; {currentYear} {settings.companyName}. Pusat Sewa Barang Terlengkap.</p>
			<p class={dark ? 'text-neutral-500' : 'text-neutral-400'}>Cabang Bogor &amp; Cabang Depok</p>
		</div>
	</div>
</footer>
