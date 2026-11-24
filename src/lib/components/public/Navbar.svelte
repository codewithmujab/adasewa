<script lang="ts">
	import { page } from '$app/state';
	import type { Branch, CompanySettings } from '#lib/server/db/schema';
	import { rentalCart } from '#lib/stores/cart.svelte';

	interface CurrentUserSummary {
		id: string;
		name: string;
		email: string;
		role: string;
		branchId: string | null;
		pointBalance: number;
	}

	interface Props {
		settings: CompanySettings;
		branches: Branch[];
		isAuthenticated: boolean;
		currentUser: CurrentUserSummary | null;
	}

	let { settings, branches, isAuthenticated, currentUser }: Props = $props();
	let mobileOpen = $state(false);

	const navItems = [
		{ href: '/', label: 'Beranda' },
		{ href: '/katalog', label: 'Katalog Barang' },
		{ href: '/#cara-sewa', label: 'Cara Sewa' },
		{ href: '/#area-layanan', label: 'Cabang' },
		{ href: '/about', label: 'Tentang' }
	] as const;

	let pathname = $derived(page.url.pathname);
	let isStaff = $derived(currentUser?.role === 'admin' || currentUser?.role === 'branch_admin');
	let activeBranchId = $derived(rentalCart.branchId ?? branches[0]?.id ?? '');

	function isActive(href: string): boolean {
		if (href.startsWith('/#')) return false;
		if (href === '/') return pathname === '/';
		return pathname === href || pathname.startsWith(`${href}/`);
	}

	function handleBranchChange(nextId: string): void {
		const target = branches.find((b) => b.id === nextId);
		if (target) {
			rentalCart.selectBranch(target);
		}
	}
</script>

<header class="sticky top-0 z-40 border-b border-neutral-200/70 bg-white/85 backdrop-blur-xl">
	<div class="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-6">
		<div class="flex items-center gap-3">
			<a
				href="/"
				class="flex items-center gap-2.5 text-sm font-bold tracking-tight text-neutral-950"
				onclick={() => (mobileOpen = false)}
			>
				<img
					src={settings.logoUrl || '/logo-adasewa.jpg'}
					alt={settings.companyName}
					class="h-9 w-9 rounded-full object-cover ring-1 ring-neutral-200/80"
				/>
				<div class="flex flex-col leading-none">
					<span>{settings.companyName}</span>
					<span class="mt-0.5 text-[10px] font-medium text-neutral-400">Pusat Sewa Barang</span>
				</div>
			</a>

			<!-- Pemilih Cabang Cepat (Bogor / Depok) -->
			{#if branches.length > 0}
				<div class="hidden items-center sm:flex">
					<label for="nav-branch-select" class="sr-only">Pilih cabang penyewaan</label>
					<select
						id="nav-branch-select"
						value={activeBranchId}
						onchange={(e) => handleBranchChange(e.currentTarget.value)}
						class="rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1.5 text-xs font-semibold text-emerald-900 transition hover:border-emerald-400 focus:border-neutral-950 focus:outline-none"
					>
						{#each branches as br (br.id)}
							<option value={br.id}>📍 {br.name}</option>
						{/each}
					</select>
				</div>
			{/if}
		</div>

		<nav aria-label="Navigasi utama" class="hidden items-center gap-6 lg:flex">
			{#each navItems as item (item.href)}
				<a
					href={item.href}
					class="text-sm transition {isActive(item.href)
						? 'font-semibold text-neutral-950'
						: 'text-neutral-500 hover:text-neutral-950'}"
				>
					{item.label}
				</a>
			{/each}
		</nav>

		<div class="flex items-center gap-2">
			<button
				type="button"
				onclick={() => rentalCart.openDrawer()}
				aria-label="Buka keranjang sewa"
				class="relative inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-900 transition hover:border-neutral-950"
			>
				<svg
					class="h-4 w-4"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.8"
					aria-hidden="true"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M3 4h2l2.4 11.2a1.5 1.5 0 001.47 1.2h8.76a1.5 1.5 0 001.46-1.16L21 7.5H6"
					/>
					<circle cx="9.5" cy="20" r="1.25" />
					<circle cx="17.5" cy="20" r="1.25" />
				</svg>
				<span class="hidden sm:inline">Keranjang</span>
				{#if rentalCart.totalUnits > 0}
					<span
						class="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[10px] font-bold text-white"
					>
						{rentalCart.totalUnits}
					</span>
				{/if}
			</button>

			<div class="hidden items-center gap-2 lg:flex">
				{#if isAuthenticated && currentUser}
					<a
						href="/akun#rekening-poin"
						title="Rekening Poin Sewa Anda"
						class="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 transition hover:border-amber-400"
					>
						<span aria-hidden="true">★</span>
						<span>{currentUser.pointBalance} Poin</span>
					</a>
					<a
						href="/akun"
						class="rounded-full bg-neutral-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-neutral-800"
					>
						Pesanan Saya
					</a>
					{#if isStaff}
						<a
							href="/admin"
							class="rounded-full border border-neutral-200 px-3.5 py-2 text-xs font-semibold text-neutral-700 transition hover:border-neutral-950 hover:text-neutral-950"
						>
							Admin
						</a>
					{/if}
				{:else}
					<a
						href="/login"
						class="rounded-full bg-neutral-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-neutral-800"
					>
						Masuk / Daftar
					</a>
				{/if}
			</div>

			<button
				type="button"
				onclick={() => (mobileOpen = !mobileOpen)}
				aria-label="Buka menu navigasi"
				aria-expanded={mobileOpen}
				class="inline-flex items-center justify-center rounded-full p-2 text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-950 lg:hidden"
			>
				{#if mobileOpen}
					<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				{:else}
					<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
						<path stroke-linecap="round" stroke-linejoin="round" d="M4 7h16M4 12h16M4 17h16" />
					</svg>
				{/if}
			</button>
		</div>
	</div>

	{#if mobileOpen}
		<div class="border-t border-neutral-100 bg-white px-6 py-5 lg:hidden">
			{#if branches.length > 0}
				<div class="mb-4">
					<label for="mobile-branch-select" class="block text-[11px] font-semibold text-neutral-500 uppercase">
						Cabang Penyewaan (Tarif &amp; Stok)
					</label>
					<select
						id="mobile-branch-select"
						value={activeBranchId}
						onchange={(e) => handleBranchChange(e.currentTarget.value)}
						class="mt-1.5 w-full rounded-xl border border-emerald-200 bg-emerald-50/70 px-3.5 py-2.5 text-sm font-semibold text-emerald-950"
					>
						{#each branches as br (br.id)}
							<option value={br.id}>📍 {br.name} — {br.city}</option>
						{/each}
					</select>
				</div>
			{/if}

			<nav class="flex flex-col gap-2">
				{#each navItems as item (item.href)}
					<a
						href={item.href}
						onclick={() => (mobileOpen = false)}
						class="rounded-xl px-3.5 py-2.5 text-sm transition {isActive(item.href)
							? 'bg-neutral-100 font-semibold text-neutral-950'
							: 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-950'}"
					>
						{item.label}
					</a>
				{/each}
				<div class="mt-2 flex flex-col gap-2 border-t border-neutral-100 pt-4">
					<a
						href="/keranjang"
						onclick={() => (mobileOpen = false)}
						class="rounded-full border border-neutral-200 px-4 py-2.5 text-center text-sm font-semibold text-neutral-800"
					>
						Keranjang Sewa ({rentalCart.totalUnits})
					</a>
					{#if isAuthenticated}
						<a
							href="/akun"
							onclick={() => (mobileOpen = false)}
							class="rounded-full bg-neutral-950 px-4 py-2.5 text-center text-sm font-semibold text-white"
						>
							Dashboard Pemesan
						</a>
						{#if isStaff}
							<a
								href="/admin"
								onclick={() => (mobileOpen = false)}
								class="rounded-full border border-neutral-200 px-4 py-2 text-center text-xs font-semibold text-neutral-700"
							>
								Dashboard Admin
							</a>
						{/if}
					{:else}
						<a
							href="/login"
							onclick={() => (mobileOpen = false)}
							class="rounded-full bg-neutral-950 px-4 py-2.5 text-center text-sm font-semibold text-white"
						>
							Masuk / Daftar Pemesan
						</a>
					{/if}
				</div>
			</nav>
		</div>
	{/if}
</header>
