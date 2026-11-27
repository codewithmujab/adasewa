<script lang="ts">
	import type { PortfolioMediaItem } from '#lib/server/db/schema';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
	let activeLightbox = $state<PortfolioMediaItem | null>(null);

	let formattedDate = $derived(
		data.portfolio.completedAt
			? new Intl.DateTimeFormat('id-ID', {
					month: 'long',
					year: 'numeric'
				}).format(new Date(data.portfolio.completedAt))
			: null
	);

	let paragraphs = $derived(
		data.portfolio.content
			.split(/\n{2,}/)
			.map((p) => p.trim())
			.filter((p) => p.length > 0)
	);

	function handleKeydown(event: KeyboardEvent): void {
		if (activeLightbox && event.key === 'Escape') {
			activeLightbox = null;
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
	<title>{data.portfolio.title} — {data.settings.companyName}</title>
	<meta name="description" content={data.portfolio.summary} />
</svelte:head>

<article class="bg-black pt-10 pb-24 sm:pt-16">
	<div class="mx-auto max-w-4xl px-6">
		<a
			href="/portfolios"
			class="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/[0.06] px-4 py-2 text-sm font-bold text-white transition hover:border-white hover:bg-white hover:text-black"
		>
			← Kembali ke Dokumentasi
		</a>

		<div class="mt-8 rounded-[2.5rem] border border-white/15 bg-[#0c0c0f] p-7 sm:p-12">
			<div class="flex flex-wrap items-center gap-2.5">
				<span class="rounded-full bg-white px-3.5 py-1 text-xs font-semibold text-black">
					{data.portfolio.category}
				</span>
				{#if data.relatedService}
					<a
						href={`/services/${data.relatedService.slug}`}
						class="rounded-full border border-white/20 bg-black px-3.5 py-1 text-xs font-bold text-neutral-200 transition hover:border-white hover:text-white"
					>
						Layanan: {data.relatedService.title}
					</a>
				{/if}
			</div>

			<h1 class="mt-5 text-2xl font-bold tracking-tight text-white sm:text-3xl">
				{data.portfolio.title}
			</h1>
			<p class="mt-5 text-lg leading-relaxed text-neutral-300">
				{data.portfolio.summary}
			</p>

			<dl class="mt-8 grid grid-cols-2 gap-6 border-y border-white/10 py-6 sm:grid-cols-3">
				<div>
					<dt class="text-xs font-bold tracking-wider text-neutral-400 uppercase">Klien</dt>
					<dd class="mt-1.5 text-sm font-bold text-white">
						{data.portfolio.clientName}
					</dd>
				</div>
				{#if formattedDate}
					<div>
						<dt class="text-xs font-bold tracking-wider text-neutral-400 uppercase">Selesai</dt>
						<dd class="mt-1.5 text-sm font-bold text-white">
							{formattedDate}
						</dd>
					</div>
				{/if}
				{#if data.portfolio.projectUrl}
					<div>
						<dt class="text-xs font-bold tracking-wider text-neutral-400 uppercase">Tautan</dt>
						<dd class="mt-1.5">
							<a
								href={data.portfolio.projectUrl}
								target="_blank"
								rel="noopener noreferrer"
								class="inline-flex items-center gap-1 text-sm font-bold text-white underline decoration-white/40 underline-offset-4 hover:decoration-white"
							>
								Kunjungi Proyek
							</a>
						</dd>
					</div>
				{/if}
			</dl>

			{#if data.portfolio.imageUrl}
				<div class="mt-8 overflow-hidden rounded-[2rem] border border-white/15 bg-black p-2">
					<img
						src={data.portfolio.imageUrl}
						alt={data.portfolio.title}
						class="aspect-video w-full rounded-[1.5rem] object-cover"
					/>
				</div>
			{/if}

			<div class="mt-10 space-y-6 text-base leading-8 text-neutral-300">
				{#each paragraphs as paragraph, idx (idx)}
					<p class="whitespace-pre-line">{paragraph}</p>
				{/each}
			</div>

			{#if data.portfolio.gallery.length > 0}
				<div class="mt-14 border-t border-white/10 pt-10">
					<h2 class="text-xl font-bold tracking-tight text-white">Galeri Proyek</h2>
					<div class="mt-6 grid gap-4 sm:grid-cols-2">
						{#each data.portfolio.gallery as item (item.imageKey)}
							<button
								type="button"
								onclick={() => (activeLightbox = item)}
								class="group overflow-hidden rounded-[1.5rem] border border-white/15 bg-black p-2 text-left transition hover:border-white/40"
							>
								<img
									src={item.imageUrl}
									alt={item.alt || data.portfolio.title}
									loading="lazy"
									class="aspect-16/10 w-full rounded-[1.15rem] object-cover transition duration-500 group-hover:scale-105"
								/>
								{#if item.alt}
									<p class="px-2 pt-2.5 pb-1 text-xs text-neutral-400">{item.alt}</p>
								{/if}
							</button>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
</article>

{#if activeLightbox}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-6 backdrop-blur-md"
		role="dialog"
		aria-modal="true"
		aria-label="Pratinjau gambar galeri"
	>
		<button
			type="button"
			aria-label="Tutup pratinjau"
			onclick={() => (activeLightbox = null)}
			class="fixed inset-0 cursor-default"
		></button>
		<div class="relative z-10 max-h-[90vh] max-w-5xl">
			<img
				src={activeLightbox.imageUrl}
				alt={activeLightbox.alt || data.portfolio.title}
				class="max-h-[82vh] rounded-[1.75rem] border border-white/20 object-contain"
			/>
			<div class="mt-4 flex items-center justify-between text-sm text-neutral-300">
				<span>{activeLightbox.alt || data.portfolio.title}</span>
				<button
					type="button"
					onclick={() => (activeLightbox = null)}
					class="rounded-full bg-white px-5 py-1.5 text-xs font-semibold text-black hover:bg-neutral-200"
				>
					Tutup
				</button>
			</div>
		</div>
	</div>
{/if}
