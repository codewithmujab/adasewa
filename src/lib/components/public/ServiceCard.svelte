<script lang="ts">
	import type { Service } from '#lib/server/db/schema';

	interface Props {
		service: Service;
	}

	let { service }: Props = $props();
</script>

<a
	href={`/services/${service.slug}`}
	class="group flex flex-col overflow-hidden rounded-[2rem] border border-white/15 bg-[#0c0c0f] transition duration-300 hover:-translate-y-1 hover:border-white/40 hover:bg-[#121216]"
>
	<div class="p-3 pb-0">
		{#if service.imageUrl}
			<div class="aspect-16/10 w-full overflow-hidden rounded-[1.5rem] bg-[#16161b]">
				<img
					src={service.imageUrl}
					alt={service.title}
					loading="lazy"
					class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
				/>
			</div>
		{:else}
			<div
				class="flex aspect-16/10 w-full items-center justify-center rounded-[1.5rem] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_rgba(12,12,15,1))] text-neutral-300"
			>
				<span
					class="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold tracking-wider text-white uppercase"
				>
					{service.icon || 'Layanan'}
				</span>
			</div>
		{/if}
	</div>

	<div class="flex flex-1 flex-col p-6 pt-5 sm:p-7 sm:pt-5">
		<div class="flex items-center justify-between gap-2">
			<span class="text-xs font-bold tracking-wider text-neutral-400 uppercase">
				{service.icon || 'Solusi'}
			</span>
			{#if service.isFeatured}
				<span
					class="rounded-full bg-white px-3 py-0.5 text-xs font-semibold text-black"
				>
					Unggulan
				</span>
			{/if}
		</div>

		<h3 class="mt-3 text-xl font-bold tracking-tight text-white">
			{service.title}
		</h3>

		<p class="mt-2.5 flex-1 text-sm leading-relaxed text-neutral-400">
			{service.shortDescription}
		</p>

		<div class="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-white">
			<span>Pelajari selengkapnya</span>
			<svg
				class="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
				viewBox="0 0 20 20"
				fill="currentColor"
				aria-hidden="true"
			>
				<path
					fill-rule="evenodd"
					d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
					clip-rule="evenodd"
				/>
			</svg>
		</div>
	</div>
</a>
