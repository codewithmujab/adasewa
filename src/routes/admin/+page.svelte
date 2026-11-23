<script lang="ts">
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
</script>

<svelte:head>
	<title>Dashboard CMS — {data.companyName}</title>
</svelte:head>

<div class="space-y-8">
	<header class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
		<div>
			<p class="text-xs font-semibold tracking-widest text-neutral-400 uppercase">Dashboard</p>
			<h1 class="mt-1 text-3xl font-semibold tracking-tight text-neutral-950">
				Selamat datang, {data.user.name}
			</h1>
			<p class="mt-1.5 text-sm text-neutral-500">
				Ringkasan konten company profile dan akses cepat pengelolaan CMS.
			</p>
		</div>

		<div class="flex flex-wrap gap-2.5">
			<a
				href="/admin/services"
				class="rounded-full bg-neutral-950 px-5 py-2.5 text-xs font-medium text-white transition hover:bg-neutral-800"
			>
				Kelola Layanan
			</a>
			<a
				href="/admin/portfolios"
				class="rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-xs font-medium text-neutral-800 transition hover:border-neutral-300"
			>
				Kelola Portofolio
			</a>
		</div>
	</header>

	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<div class="rounded-3xl border border-neutral-200/80 bg-white p-6">
			<p class="text-xs font-medium text-neutral-400">Total Layanan</p>
			<p class="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">
				{data.stats.totalServices}
			</p>
			<p class="mt-1 text-xs text-neutral-500">
				{data.stats.publishedServices} terbit · {data.stats.draftServices} draft
			</p>
		</div>

		<div class="rounded-3xl border border-neutral-200/80 bg-white p-6">
			<p class="text-xs font-medium text-neutral-400">Total Portofolio</p>
			<p class="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">
				{data.stats.totalPortfolios}
			</p>
			<p class="mt-1 text-xs text-neutral-500">
				{data.stats.publishedPortfolios} terbit · {data.stats.draftPortfolios} draft
			</p>
		</div>

		<div class="rounded-3xl border border-neutral-200/80 bg-white p-6">
			<p class="text-xs font-medium text-neutral-400">Media Storage</p>
			<p class="mt-2 text-xl font-semibold tracking-tight text-neutral-950">Cloudflare R2</p>
			<p class="mt-1 text-xs text-neutral-500">Native binding MEDIA_BUCKET</p>
		</div>

		<div class="rounded-3xl border border-neutral-200/80 bg-white p-6">
			<p class="text-xs font-medium text-neutral-400">Identitas Situs</p>
			<p class="mt-2 truncate text-xl font-semibold tracking-tight text-neutral-950">
				{data.companyName}
			</p>
			<a href="/admin/settings" class="mt-1 inline-block text-xs font-medium text-neutral-900 hover:underline">
				Edit pengaturan →
			</a>
		</div>
	</div>

	<div class="grid gap-6 lg:grid-cols-2">
		<section class="rounded-3xl border border-neutral-200/80 bg-white p-6">
			<div class="flex items-center justify-between">
				<h2 class="text-base font-semibold tracking-tight text-neutral-950">Layanan Terbaru</h2>
				<a href="/admin/services" class="text-xs font-medium text-neutral-500 hover:text-neutral-950">
					Lihat semua →
				</a>
			</div>

			{#if data.recentServices.length > 0}
				<ul class="mt-4 divide-y divide-neutral-100">
					{#each data.recentServices as svc (svc.id)}
						<li class="flex items-center justify-between gap-4 py-3">
							<div class="min-w-0">
								<p class="truncate text-sm font-medium text-neutral-950">{svc.title}</p>
								<p class="truncate font-mono text-xs text-neutral-400">/{svc.slug}</p>
							</div>
							<span
								class="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium {svc.isPublished
									? 'bg-emerald-50 text-emerald-700'
									: 'bg-neutral-100 text-neutral-600'}"
							>
								{svc.isPublished ? 'Terbit' : 'Draft'}
							</span>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="mt-6 text-sm text-neutral-400">Belum ada layanan yang ditambahkan.</p>
			{/if}
		</section>

		<section class="rounded-3xl border border-neutral-200/80 bg-white p-6">
			<div class="flex items-center justify-between">
				<h2 class="text-base font-semibold tracking-tight text-neutral-950">Portofolio Terbaru</h2>
				<a
					href="/admin/portfolios"
					class="text-xs font-medium text-neutral-500 hover:text-neutral-950"
				>
					Lihat semua →
				</a>
			</div>

			{#if data.recentPortfolios.length > 0}
				<ul class="mt-4 divide-y divide-neutral-100">
					{#each data.recentPortfolios as pf (pf.id)}
						<li class="flex items-center justify-between gap-4 py-3">
							<div class="min-w-0">
								<p class="truncate text-sm font-medium text-neutral-950">{pf.title}</p>
								<p class="truncate text-xs text-neutral-400">
									{pf.clientName} · {pf.category}
								</p>
							</div>
							<span
								class="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium {pf.isPublished
									? 'bg-emerald-50 text-emerald-700'
									: 'bg-neutral-100 text-neutral-600'}"
							>
								{pf.isPublished ? 'Terbit' : 'Draft'}
							</span>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="mt-6 text-sm text-neutral-400">Belum ada portofolio yang ditambahkan.</p>
			{/if}
		</section>
	</div>
</div>
