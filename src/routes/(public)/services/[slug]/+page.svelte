<script lang="ts">
	import PortfolioCard from '#lib/components/public/PortfolioCard.svelte';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let paragraphs = $derived(
		data.service.description
			.split(/\n{2,}/)
			.map((p) => p.trim())
			.filter((p) => p.length > 0)
	);
</script>

<svelte:head>
	<title>{data.service.title} — {data.settings.companyName}</title>
	<meta name="description" content={data.service.shortDescription} />
</svelte:head>

<article class="bg-black pt-10 pb-24 sm:pt-16">
	<div class="mx-auto max-w-4xl px-6">
		<a
			href="/services"
			class="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/[0.06] px-4 py-2 text-sm font-bold text-white transition hover:border-white hover:bg-white hover:text-black"
		>
			← Kembali ke Layanan
		</a>

		<div class="mt-8 rounded-[2.5rem] border border-white/15 bg-[#0c0c0f] p-7 sm:p-12">
			<div class="flex flex-wrap items-center gap-3">
				{#if data.service.icon}
					<span
						class="rounded-full border border-white/15 bg-white/10 px-3.5 py-1 text-xs font-bold tracking-wider text-neutral-200 uppercase"
					>
						{data.service.icon}
					</span>
				{/if}
				{#if data.service.isFeatured}
					<span class="rounded-full bg-white px-3.5 py-1 text-xs font-semibold text-black">
						Layanan Unggulan
					</span>
				{/if}
			</div>

			<h1 class="mt-5 text-2xl font-bold tracking-tight text-white sm:text-3xl">
				{data.service.title}
			</h1>
			<p class="mt-5 text-lg leading-relaxed text-neutral-300">
				{data.service.shortDescription}
			</p>

			{#if data.service.imageUrl}
				<div class="mt-8 overflow-hidden rounded-[2rem] border border-white/15 bg-black p-2">
					<img
						src={data.service.imageUrl}
						alt={data.service.title}
						class="aspect-video w-full rounded-[1.5rem] object-cover"
					/>
				</div>
			{/if}

			<div class="mt-10 space-y-6 text-base leading-8 text-neutral-300">
				{#each paragraphs as paragraph, idx (idx)}
					<p class="whitespace-pre-line">{paragraph}</p>
				{/each}
			</div>

			<div class="mt-12 rounded-[2rem] border border-white/15 bg-black p-7 sm:p-9">
				<h2 class="text-xl font-bold tracking-tight text-white">
					Tertarik dengan layanan {data.service.title}?
				</h2>
				<p class="mt-2 text-sm leading-relaxed text-neutral-400">
					Hubungi tim kami untuk sesi konsultasi kebutuhan, estimasi timeline, dan paket terbaik.
				</p>
				<div class="mt-6 flex flex-wrap gap-3">
					<a
						href={`mailto:${data.settings.email}?subject=${encodeURIComponent(`Konsultasi Layanan: ${data.service.title}`)}`}
						class="inline-flex items-center justify-center rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-black transition hover:bg-neutral-200"
					>
						Hubungi Tim Kami
					</a>
					<a
						href="/katalog"
						class="inline-flex items-center justify-center rounded-full border border-white/20 px-7 py-3.5 text-sm font-bold text-white transition hover:border-white hover:bg-white/10"
					>
						Lihat Katalog Unit
					</a>
				</div>
			</div>
		</div>
	</div>
</article>

{#if data.relatedPortfolios.length > 0}
	<section class="border-t border-white/10 bg-black py-20">
		<div class="mx-auto max-w-6xl px-6">
			<h2 class="text-2xl font-bold tracking-tight text-white">Portofolio Terkait</h2>
			<div class="mt-8 grid gap-8 md:grid-cols-2">
				{#each data.relatedPortfolios as portfolio (portfolio.id)}
					<PortfolioCard {portfolio} variant="dark" />
				{/each}
			</div>
		</div>
	</section>
{/if}
