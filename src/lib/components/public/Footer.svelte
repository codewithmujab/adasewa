<script lang="ts">
	import type { CompanySettings } from '#lib/server/db/schema';
	import { buildWhatsAppUrl } from '#lib/utils/catalog';

	interface Props {
		settings: CompanySettings;
	}

	let { settings }: Props = $props();

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

<footer class="border-t border-neutral-200/80 bg-surface">
	<div class="mx-auto max-w-6xl px-6 py-16">
		<div class="grid gap-10 md:grid-cols-12">
			<div class="md:col-span-4">
				<div class="flex items-center gap-2.5">
					{#if settings.logoUrl}
						<img
							src={settings.logoUrl}
							alt={settings.companyName}
							class="h-8 w-8 rounded-xl object-cover"
						/>
					{:else}
						<span
							class="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-950 text-xs font-bold text-white"
						>
							AS
						</span>
					{/if}
					<span class="text-sm font-bold tracking-tight text-neutral-950">
						{settings.companyName}
					</span>
				</div>
				<p class="mt-4 max-w-sm text-sm leading-relaxed text-neutral-500">
					{settings.tagline}
				</p>
				<div class="mt-4 flex flex-wrap gap-1.5">
					{#each ['DKI Jakarta', 'Jawa Barat', 'Jawa Tengah', 'D.I. Yogyakarta'] as area (area)}
						<span
							class="rounded-full border border-neutral-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-neutral-600"
						>
							{area}
						</span>
					{/each}
				</div>
			</div>

			<div class="md:col-span-3">
				<h3 class="text-xs font-semibold tracking-wider text-neutral-950 uppercase">
					Kategori Populer
				</h3>
				<ul class="mt-4 space-y-2.5 text-sm text-neutral-600">
					{#each quickCategories as cat (cat.slug)}
						<li>
							<a href={`/katalog?kategori=${cat.slug}`} class="transition hover:text-neutral-950">
								{cat.label}
							</a>
						</li>
					{/each}
				</ul>
			</div>

			<div class="md:col-span-2">
				<h3 class="text-xs font-semibold tracking-wider text-neutral-950 uppercase">
					Layanan Pemesan
				</h3>
				<ul class="mt-4 space-y-2.5 text-sm text-neutral-600">
					<li><a href="/katalog" class="transition hover:text-neutral-950">Katalog Barang</a></li>
					<li><a href="/keranjang" class="transition hover:text-neutral-950">Keranjang Sewa</a></li>
					<li><a href="/akun" class="transition hover:text-neutral-950">Dashboard Pemesan</a></li>
					<li><a href="/#cara-sewa" class="transition hover:text-neutral-950">Cara Sewa</a></li>
					<li><a href="/about" class="transition hover:text-neutral-950">Tentang Kami</a></li>
				</ul>
			</div>

			<div class="md:col-span-3">
				<h3 class="text-xs font-semibold tracking-wider text-neutral-950 uppercase">
					Bantuan &amp; Kontak
				</h3>
				<ul class="mt-4 space-y-2.5 text-sm text-neutral-600">
					{#if settings.phone}
						<li>
							<a
								href={whatsappUrl}
								target="_blank"
								rel="noopener noreferrer"
								class="font-medium text-neutral-950 transition hover:text-neutral-700"
							>
								WhatsApp CS: {settings.phone}
							</a>
						</li>
					{/if}
					<li>
						<a href={`mailto:${settings.email}`} class="transition hover:text-neutral-950">
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
								class="rounded-full border border-neutral-300/80 bg-white px-3 py-1 text-xs font-medium text-neutral-700 transition hover:border-neutral-950 hover:text-neutral-950"
							>
								{item.label}
							</a>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<div
			class="mt-14 flex flex-col items-start justify-between gap-4 border-t border-neutral-200 pt-6 text-xs text-neutral-500 sm:flex-row sm:items-center"
		>
			<p>&copy; {currentYear} {settings.companyName}. Pusat Sewa Barang Terlengkap.</p>
			<p class="text-neutral-400">Cabang Bogor &amp; Cabang Depok</p>
		</div>
	</div>
</footer>
