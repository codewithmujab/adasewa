<script lang="ts">
	import { buildBranchWhatsAppUrl } from '#lib/utils/catalog';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let paragraphs = $derived(
		data.settings.aboutFull
			.split(/\n{2,}/)
			.map((p) => p.trim())
			.filter((p) => p.length > 0)
	);
</script>

<svelte:head>
	<title>Tentang — {data.settings.companyName}</title>
	<meta name="description" content={data.settings.aboutShort} />
</svelte:head>

<section class="bg-black pt-12 pb-16 sm:pt-16 sm:pb-20">
	<div class="mx-auto max-w-5xl px-6">
		<div class="rounded-[2.5rem] border border-white/15 bg-[#0b0b0e] p-8 sm:p-14">
			<span
				class="inline-flex rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1 text-xs font-bold tracking-wide text-neutral-300 uppercase"
			>
				Tentang Perusahaan
			</span>
			<h1 class="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
				{data.settings.companyName}
			</h1>
			<p class="mt-5 max-w-3xl text-lg leading-relaxed text-neutral-300 sm:text-xl">
				{data.settings.tagline}
			</p>

			{#if data.settings.imageUrl}
				<div class="mt-10 overflow-hidden rounded-[2rem] border border-white/15 bg-black p-2">
					<img
						src={data.settings.imageUrl}
						alt={data.settings.companyName}
						class="aspect-video w-full rounded-[1.5rem] object-cover"
					/>
				</div>
			{/if}

			<div class="mt-10 space-y-5 text-base leading-8 text-neutral-300">
				{#each paragraphs as paragraph, idx (idx)}
					<p>{paragraph}</p>
				{/each}
			</div>
		</div>
	</div>
</section>

{#if data.settings.vision || data.settings.mission}
	<section class="border-t border-white/10 bg-black py-16 sm:py-20">
		<div class="mx-auto max-w-5xl px-6">
			<div class="grid gap-6 md:grid-cols-2">
				{#if data.settings.vision}
					<div class="rounded-[2.25rem] border border-white/15 bg-[#0c0c0f] p-8 sm:p-10">
						<span
							class="inline-flex rounded-full bg-white px-3.5 py-1 text-xs font-semibold tracking-wide text-black uppercase"
						>
							Visi
						</span>
						<p class="mt-5 text-lg leading-relaxed font-semibold text-white">
							{data.settings.vision}
						</p>
					</div>
				{/if}

				{#if data.settings.mission}
					<div class="rounded-[2.25rem] border border-white/15 bg-[#0c0c0f] p-8 sm:p-10">
						<span
							class="inline-flex rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-semibold tracking-wide text-white uppercase"
						>
							Misi
						</span>
						<p class="mt-5 text-base leading-relaxed whitespace-pre-line text-neutral-300">
							{data.settings.mission}
						</p>
					</div>
				{/if}
			</div>
		</div>
	</section>
{/if}

{#if data.branches.length > 0}
	<section class="border-t border-white/10 bg-black py-16 sm:py-20">
		<div class="mx-auto max-w-5xl px-6">
			<span
				class="inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/15 px-3.5 py-1 text-xs font-bold tracking-wide text-emerald-300 uppercase"
			>
				Lokasi Cabang Resmi
			</span>
			<h2 class="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
				Kios Penyewaan {data.settings.companyName}
			</h2>

			<div class="mt-7 grid gap-5 md:grid-cols-2">
				{#each data.branches as branch (branch.id)}
					<div
						class="flex flex-col justify-between rounded-[2rem] border border-white/15 bg-[#0c0c0f] p-6"
					>
						<div>
							<div class="flex items-center justify-between gap-2">
								<h3 class="text-lg font-bold text-white">{branch.name}</h3>
								<span
									class="rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 font-mono text-xs font-bold text-white"
								>
									{branch.code}
								</span>
							</div>
							<p class="mt-3 text-sm leading-relaxed text-neutral-300">📍 {branch.address}</p>
							<p class="mt-2 text-xs text-neutral-400">🕒 {branch.operatingHours}</p>
							<p class="mt-1 text-xs text-neutral-400">
								📞 WA CS: <strong class="text-white">{branch.phone}</strong>
							</p>
						</div>

						<div class="mt-5 border-t border-white/10 pt-4">
							<a
								href={buildBranchWhatsAppUrl(
									branch,
									data.settings,
									`Halo ${branch.name} ${data.settings.companyName}, saya ingin bertanya mengenai penyewaan barang.`
								)}
								target="_blank"
								rel="noopener noreferrer"
								class="inline-flex items-center justify-center rounded-full bg-white px-5 py-2 text-sm font-bold text-black transition hover:bg-neutral-200"
							>
								Chat WA {branch.name} →
							</a>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>
{/if}

<section class="border-t border-white/10 bg-black py-16 pb-24 sm:py-20">
	<div class="mx-auto max-w-5xl px-6">
		<div
			class="grid gap-8 rounded-[2.5rem] border border-white/15 bg-[#0c0c0f] p-8 sm:p-10 md:grid-cols-3"
		>
			<div>
				<p class="text-xs font-bold tracking-wide text-neutral-400 uppercase">Email</p>
				<a
					href={`mailto:${data.settings.email}`}
					class="mt-2 block text-base font-bold text-white hover:underline"
				>
					{data.settings.email}
				</a>
			</div>

			{#if data.settings.phone}
				<div>
					<p class="text-xs font-bold tracking-wide text-neutral-400 uppercase">Telepon Pusat</p>
					<a
						href={`tel:${data.settings.phone}`}
						class="mt-2 block text-base font-bold text-white hover:underline"
					>
						{data.settings.phone}
					</a>
				</div>
			{/if}

			{#if data.settings.address}
				<div>
					<p class="text-xs font-bold tracking-wide text-neutral-400 uppercase">Jangkauan</p>
					<p class="mt-2 text-sm leading-relaxed text-neutral-300">
						{data.settings.address}
					</p>
				</div>
			{/if}
		</div>
	</div>
</section>
