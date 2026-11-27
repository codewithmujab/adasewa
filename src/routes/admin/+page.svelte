<script lang="ts">
	import { formatRupiah } from '#lib/utils/catalog';
	import { formatDateId, getOrderStatusMeta } from '#lib/utils/orders';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
</script>

<svelte:head>
	<title>Dashboard Admin — {data.companyName}</title>
</svelte:head>

<div class="space-y-8">
	<header class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
		<div>
			<span
				class="inline-flex rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-xs font-bold tracking-wide text-neutral-300 uppercase"
			>
				{data.isSuperAdmin
					? 'Dashboard Owner · Semua Cabang'
					: `Dashboard ${data.assignedBranch?.name ?? 'Admin Cabang'}`}
			</span>
			<h1 class="mt-3 text-2xl font-bold tracking-tight text-white">
				Selamat datang, {data.user.name}
			</h1>
			<p class="mt-1.5 text-sm text-neutral-400">
				{#if data.isSuperAdmin}
					Pantau transaksi semua cabang, harga &amp; stok per cabang, pengembalian barang, dan
					pengaturan {data.companyName}.
				{:else}
					Pantau transaksi sewa, pengembalian barang, harga &amp; stok khusus
					{data.assignedBranch?.name ?? 'cabang Anda'}.
				{/if}
			</p>
		</div>

		<div class="flex flex-wrap gap-2.5">
			<a
				href="/admin/orders"
				class="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-neutral-200"
			>
				Kelola Transaksi &amp; Pengembalian
			</a>
			<a
				href="/admin/catalog"
				class="rounded-full border border-white/20 bg-[#0c0c0f] px-5 py-2.5 text-sm font-bold text-white transition hover:border-white"
			>
				{data.isSuperAdmin ? 'Katalog & Harga Cabang' : 'Atur Harga & Stok Cabang'}
			</a>
		</div>
	</header>

	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<div class="rounded-[2rem] border border-white/15 bg-[#0c0c0f] p-6">
			<p class="text-sm font-medium text-neutral-400">Total Transaksi</p>
			<p class="mt-2 text-2xl font-bold tracking-tight text-white">
				{data.stats.totalOrders}
			</p>
			<p class="mt-1 text-xs text-neutral-400">
				{data.stats.activeOrders} sewa aktif · {data.stats.returnRequestedOrders} ajukan kembali
			</p>
		</div>

		<div class="rounded-[2rem] border border-white/15 bg-[#0c0c0f] p-6">
			<p class="text-sm font-medium text-neutral-400">Katalog Barang</p>
			<p class="mt-2 text-2xl font-bold tracking-tight text-white">
				{data.stats.totalCatalog}
			</p>
			<p class="mt-1 text-xs text-neutral-400">
				{data.stats.publishedCatalog} terbit · {data.stats.totalCategories} kategori
			</p>
		</div>

		<div class="rounded-[2rem] border border-white/15 bg-[#0c0c0f] p-6">
			<p class="text-sm font-medium text-neutral-400">Layanan &amp; Dokumentasi</p>
			<p class="mt-2 text-2xl font-bold tracking-tight text-white">
				{data.stats.totalServices + data.stats.totalPortfolios}
			</p>
			<p class="mt-1 text-xs text-neutral-400">
				{data.stats.totalServices} layanan · {data.stats.totalPortfolios} dokumentasi
			</p>
		</div>

		<div class="rounded-[2rem] border border-white/15 bg-[#0c0c0f] p-6">
			<p class="text-sm font-medium text-neutral-400">
				{data.isSuperAdmin ? 'Cabang Aktif' : 'Info Kios Cabang'}
			</p>
			<p class="mt-2 truncate text-xl font-bold tracking-tight text-white">
				{data.isSuperAdmin
					? `${data.branches.length} Cabang`
					: (data.assignedBranch?.name ?? data.companyName)}
			</p>
			<a
				href="/admin/branches"
				class="mt-1 inline-block text-xs font-bold text-emerald-400 hover:underline"
			>
				Kelola cabang &amp; kios →
			</a>
		</div>
	</div>

	{#if data.isSuperAdmin && data.branchBreakdown.length > 0}
		<section class="rounded-[2.25rem] border border-white/15 bg-[#0c0c0f] p-6 sm:p-7">
			<div class="flex items-center justify-between gap-2">
				<div>
					<h2 class="text-base font-bold tracking-tight text-white">
						Ringkasan Transaksi Per Cabang
					</h2>
					<p class="text-xs text-neutral-400">
						Data transaksi terpisah per cabang · Pembayaran masuk ke rekening terpusat.
					</p>
				</div>
				<a href="/admin/branches" class="text-xs font-bold text-neutral-300 hover:text-white">
					Kelola cabang →
				</a>
			</div>
			<div class="mt-5 grid gap-4 sm:grid-cols-2">
				{#each data.branchBreakdown as br (br.id)}
					<div
						class="flex items-center justify-between gap-4 rounded-[1.5rem] border border-white/15 bg-black p-5"
					>
						<div>
							<div class="flex items-center gap-2">
								<span
									class="rounded-full bg-white px-2.5 py-0.5 font-mono text-xs font-semibold text-black"
								>
									{br.code}
								</span>
								<p class="text-sm font-bold text-white">{br.name}</p>
							</div>
							<p class="mt-1.5 text-xs text-neutral-400">WA CS: {br.phone}</p>
						</div>
						<div class="text-right">
							<p class="text-sm font-semibold text-emerald-400">{formatRupiah(br.totalRevenue)}</p>
							<p class="text-xs text-neutral-400">{br.orderCount} transaksi</p>
						</div>
					</div>
				{/each}
			</div>
		</section>
	{/if}

	<div class="grid gap-6 lg:grid-cols-2">
		<section class="rounded-[2.25rem] border border-white/15 bg-[#0c0c0f] p-6">
			<div class="flex items-center justify-between">
				<h2 class="text-base font-bold tracking-tight text-white">Transaksi Sewa Terbaru</h2>
				<a href="/admin/orders" class="text-xs font-bold text-neutral-400 hover:text-white">
					Kelola semua →
				</a>
			</div>

			{#if data.recentOrders.length > 0}
				<ul class="mt-4 divide-y divide-white/10">
					{#each data.recentOrders as ord (ord.id)}
						{@const meta = getOrderStatusMeta(ord.orderStatus)}
						<li class="flex items-center justify-between gap-4 py-3.5">
							<div class="min-w-0">
								<p class="truncate text-sm font-bold text-white">
									{ord.orderCode} · {ord.customerName}
								</p>
								<p class="truncate text-xs text-neutral-400">
									{#if ord.branchName}
										<span class="font-bold text-emerald-400">{ord.branchName}</span> ·
									{/if}
									{formatDateId(ord.startDate)} – {formatDateId(ord.endDate)} ·
									{formatRupiah(ord.totalAmount)}
								</p>
							</div>
							<span
								class="shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-bold {meta.badgeClass}"
							>
								{meta.label}
							</span>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="mt-6 text-sm text-neutral-500">Belum ada transaksi penyewaan yang masuk.</p>
			{/if}
		</section>

		<section class="rounded-[2.25rem] border border-white/15 bg-[#0c0c0f] p-6">
			<div class="flex items-center justify-between">
				<h2 class="text-base font-bold tracking-tight text-white">Katalog Barang Terbaru</h2>
				<a href="/admin/catalog" class="text-xs font-bold text-neutral-400 hover:text-white">
					Lihat semua ({data.stats.totalCatalog}) →
				</a>
			</div>

			{#if data.recentCatalogItems.length > 0}
				<ul class="mt-4 divide-y divide-white/10">
					{#each data.recentCatalogItems as item (item.id)}
						<li class="flex items-center justify-between gap-4 py-3.5">
							<div class="min-w-0">
								<p class="truncate text-sm font-bold text-white">{item.name}</p>
								<p class="truncate text-xs text-neutral-400">
									{item.pricePerDay !== null
										? `${formatRupiah(item.pricePerDay)} / ${item.unitLabel}`
										: 'Tarif: Tanya CS'}
								</p>
							</div>
							<span
								class="shrink-0 rounded-full px-3 py-0.5 text-xs font-bold {item.isPublished
									? 'border border-emerald-400/30 bg-emerald-400/15 text-emerald-300'
									: 'border border-white/15 bg-white/10 text-neutral-300'}"
							>
								{item.isPublished ? 'Terbit' : 'Draft'}
							</span>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="mt-6 text-sm text-neutral-500">Belum ada barang katalog.</p>
			{/if}
		</section>
	</div>
</div>
