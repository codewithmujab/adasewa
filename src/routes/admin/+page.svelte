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
			<p class="text-xs font-semibold tracking-widest text-neutral-400 uppercase">
				{data.isSuperAdmin
					? 'Dashboard Owner · Semua Cabang'
					: `Dashboard ${data.assignedBranch?.name ?? 'Admin Cabang'}`}
			</p>
			<h1 class="mt-1 text-3xl font-semibold tracking-tight text-neutral-950">
				Selamat datang, {data.user.name}
			</h1>
			<p class="mt-1.5 text-sm text-neutral-500">
				{#if data.isSuperAdmin}
					Pantau transaksi semua cabang, harga &amp; stok per cabang, pengembalian barang, dan pengaturan {data.companyName}.
				{:else}
					Pantau transaksi sewa, pengembalian barang, harga &amp; stok khusus {data.assignedBranch?.name ?? 'cabang Anda'}.
				{/if}
			</p>
		</div>

		<div class="flex flex-wrap gap-2.5">
			<a
				href="/admin/orders"
				class="rounded-full bg-neutral-950 px-5 py-2.5 text-xs font-medium text-white transition hover:bg-neutral-800"
			>
				Kelola Transaksi &amp; Pengembalian
			</a>
			<a
				href="/admin/catalog"
				class="rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-xs font-medium text-neutral-800 transition hover:border-neutral-300"
			>
				{data.isSuperAdmin ? 'Katalog & Harga Cabang' : 'Atur Harga & Stok Cabang'}
			</a>
		</div>
	</header>

	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<div class="rounded-3xl border border-neutral-200/80 bg-white p-6">
			<p class="text-xs font-medium text-neutral-400">Total Transaksi</p>
			<p class="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">
				{data.stats.totalOrders}
			</p>
			<p class="mt-1 text-xs text-neutral-500">
				{data.stats.activeOrders} sewa aktif · {data.stats.returnRequestedOrders} ajukan kembali
			</p>
		</div>

		<div class="rounded-3xl border border-neutral-200/80 bg-white p-6">
			<p class="text-xs font-medium text-neutral-400">Katalog Barang</p>
			<p class="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">
				{data.stats.totalCatalog}
			</p>
			<p class="mt-1 text-xs text-neutral-500">
				{data.stats.publishedCatalog} terbit · {data.stats.totalCategories} kategori
			</p>
		</div>

		<div class="rounded-3xl border border-neutral-200/80 bg-white p-6">
			<p class="text-xs font-medium text-neutral-400">Layanan &amp; Dokumentasi</p>
			<p class="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">
				{data.stats.totalServices + data.stats.totalPortfolios}
			</p>
			<p class="mt-1 text-xs text-neutral-500">
				{data.stats.totalServices} layanan · {data.stats.totalPortfolios} dokumentasi
			</p>
		</div>

		<div class="rounded-3xl border border-neutral-200/80 bg-white p-6">
			<p class="text-xs font-medium text-neutral-400">
				{data.isSuperAdmin ? 'Cabang Aktif' : 'Info Kios Cabang'}
			</p>
			<p class="mt-2 truncate text-xl font-semibold tracking-tight text-neutral-950">
				{data.isSuperAdmin
					? `${data.branches.length} Cabang`
					: (data.assignedBranch?.name ?? data.companyName)}
			</p>
			<a
				href="/admin/branches"
				class="mt-1 inline-block text-xs font-medium text-neutral-900 hover:underline"
			>
				Kelola cabang &amp; kios →
			</a>
		</div>
	</div>

	{#if data.isSuperAdmin && data.branchBreakdown.length > 0}
		<section class="rounded-3xl border border-neutral-200/80 bg-white p-6">
			<div class="flex items-center justify-between gap-2">
				<div>
					<h2 class="text-base font-semibold tracking-tight text-neutral-950">
						Ringkasan Transaksi Per Cabang
					</h2>
					<p class="text-xs text-neutral-500">
						Data transaksi terpisah per cabang · Pembayaran masuk ke rekening terpusat.
					</p>
				</div>
				<a href="/admin/branches" class="text-xs font-medium text-neutral-500 hover:text-neutral-950">
					Kelola cabang →
				</a>
			</div>
			<div class="mt-4 grid gap-4 sm:grid-cols-2">
				{#each data.branchBreakdown as br (br.id)}
					<div class="flex items-center justify-between gap-4 rounded-2xl border border-neutral-200/70 bg-surface/60 p-4">
						<div>
							<div class="flex items-center gap-2">
								<span class="rounded bg-neutral-950 px-2 py-0.5 font-mono text-[10px] font-bold text-white">
									{br.code}
								</span>
								<p class="text-sm font-bold text-neutral-950">{br.name}</p>
							</div>
							<p class="mt-1 text-xs text-neutral-500">WA CS: {br.phone}</p>
						</div>
						<div class="text-right">
							<p class="text-sm font-bold text-emerald-700">{formatRupiah(br.totalRevenue)}</p>
							<p class="text-xs text-neutral-500">{br.orderCount} transaksi</p>
						</div>
					</div>
				{/each}
			</div>
		</section>
	{/if}

	<div class="grid gap-6 lg:grid-cols-2">
		<section class="rounded-3xl border border-neutral-200/80 bg-white p-6">
			<div class="flex items-center justify-between">
				<h2 class="text-base font-semibold tracking-tight text-neutral-950">
					Transaksi Sewa Terbaru
				</h2>
				<a href="/admin/orders" class="text-xs font-medium text-neutral-500 hover:text-neutral-950">
					Kelola semua →
				</a>
			</div>

			{#if data.recentOrders.length > 0}
				<ul class="mt-4 divide-y divide-neutral-100">
					{#each data.recentOrders as ord (ord.id)}
						{@const meta = getOrderStatusMeta(ord.orderStatus)}
						<li class="flex items-center justify-between gap-4 py-3">
							<div class="min-w-0">
								<p class="truncate text-sm font-semibold text-neutral-950">
									{ord.orderCode} · {ord.customerName}
								</p>
								<p class="truncate text-xs text-neutral-400">
									{#if ord.branchName}
										<span class="font-medium text-emerald-700">{ord.branchName}</span> ·
									{/if}
									{formatDateId(ord.startDate)} – {formatDateId(ord.endDate)} ·
									{formatRupiah(ord.totalAmount)}
								</p>
							</div>
							<span class="shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold {meta.badgeClass}">
								{meta.label}
							</span>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="mt-6 text-sm text-neutral-400">Belum ada transaksi penyewaan yang masuk.</p>
			{/if}
		</section>

		<section class="rounded-3xl border border-neutral-200/80 bg-white p-6">
			<div class="flex items-center justify-between">
				<h2 class="text-base font-semibold tracking-tight text-neutral-950">
					Katalog Barang Terbaru
				</h2>
				<a href="/admin/catalog" class="text-xs font-medium text-neutral-500 hover:text-neutral-950">
					Lihat semua ({data.stats.totalCatalog}) →
				</a>
			</div>

			{#if data.recentCatalogItems.length > 0}
				<ul class="mt-4 divide-y divide-neutral-100">
					{#each data.recentCatalogItems as item (item.id)}
						<li class="flex items-center justify-between gap-4 py-3">
							<div class="min-w-0">
								<p class="truncate text-sm font-medium text-neutral-950">{item.name}</p>
								<p class="truncate text-xs text-neutral-400">
									{item.pricePerDay !== null
										? `${formatRupiah(item.pricePerDay)} / ${item.unitLabel}`
										: 'Tarif: Tanya CS'}
								</p>
							</div>
							<span
								class="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium {item.isPublished
									? 'bg-emerald-50 text-emerald-700'
									: 'bg-neutral-100 text-neutral-600'}"
							>
								{item.isPublished ? 'Terbit' : 'Draft'}
							</span>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="mt-6 text-sm text-neutral-400">Belum ada barang katalog.</p>
			{/if}
		</section>
	</div>
</div>
