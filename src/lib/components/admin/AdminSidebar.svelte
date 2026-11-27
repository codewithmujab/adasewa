<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { authClient } from '#lib/auth-client';

	interface Props {
		companyName: string;
		logoUrl?: string | null;
		userName: string;
		userEmail: string;
		isSuperAdmin?: boolean;
		branchName?: string | null;
		onNavigate?: () => void;
	}

	let {
		companyName,
		logoUrl = '/logo-adasewa.jpg',
		userName,
		userEmail,
		isSuperAdmin = true,
		branchName = null,
		onNavigate
	}: Props = $props();
	let signingOut = $state(false);

	let links = $derived.by(() => {
		const base = [
			{ href: '/admin', label: 'Ringkasan', exact: true },
			{ href: '/admin/orders', label: 'Transaksi & Pengembalian', exact: false },
			{
				href: '/admin/catalog',
				label: isSuperAdmin ? 'Katalog & Harga Cabang' : 'Harga & Stok Cabang',
				exact: false
			},
			{ href: '/admin/promos', label: 'Promo & Diskon', exact: false },
			{
				href: '/admin/branches',
				label: isSuperAdmin ? 'Cabang & Kios' : 'Info Cabang & Kios',
				exact: false
			}
		];

		if (isSuperAdmin) {
			return [
				...base,
				{ href: '/admin/points', label: 'Rekening Poin', exact: false },
				{ href: '/admin/services', label: 'Paket Layanan', exact: false },
				{ href: '/admin/portfolios', label: 'Dokumentasi Acara', exact: false },
				{ href: '/admin/settings', label: 'Pengaturan Perusahaan', exact: false }
			];
		}

		return base;
	});

	let pathname = $derived(page.url.pathname);

	function isActive(href: string, exact: boolean): boolean {
		if (exact) return pathname === href;
		return pathname === href || pathname.startsWith(`${href}/`);
	}

	async function handleSignOut(): Promise<void> {
		signingOut = true;
		try {
			await authClient.signOut();
			await goto('/login', { refreshAll: true });
		} finally {
			signingOut = false;
		}
	}
</script>

<div class="flex h-full flex-col justify-between bg-[#09090b] px-5 py-6 text-white">
	<div>
		<a
			href="/admin"
			onclick={onNavigate}
			class="flex items-center gap-3 px-2 text-sm font-bold tracking-tight text-white"
		>
			<img
				src={logoUrl || '/logo-adasewa.jpg'}
				alt={companyName}
				class="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-white/25"
			/>
			<div class="min-w-0">
				<p class="truncate text-sm font-semibold text-white">
					{companyName}
				</p>
				<p
					class="truncate text-xs font-semibold {isSuperAdmin
						? 'text-neutral-400'
						: 'text-emerald-400'}"
				>
					{isSuperAdmin ? 'Owner · Semua Cabang' : `📍 ${branchName ?? 'Admin Cabang'}`}
				</p>
			</div>
		</a>

		<nav aria-label="Menu admin" class="mt-8 space-y-1.5">
			{#each links as item (item.href)}
				<a
					href={item.href}
					onclick={onNavigate}
					class="flex items-center justify-between rounded-full px-4 py-2.5 text-sm transition {isActive(
						item.href,
						item.exact
					)
						? 'bg-white font-bold text-black'
						: 'text-neutral-300 hover:bg-white/10 hover:text-white'}"
				>
					<span>{item.label}</span>
				</a>
			{/each}
		</nav>
	</div>

	<div class="space-y-3 border-t border-white/10 pt-5">
		<a
			href="/"
			target="_blank"
			rel="noopener noreferrer"
			class="flex items-center justify-between rounded-full border border-white/20 bg-black px-4 py-2 text-sm font-bold text-neutral-200 transition hover:border-white hover:text-white"
		>
			<span>Lihat Situs Publik</span>
			<span aria-hidden="true">↗</span>
		</a>

		<div class="rounded-[1.5rem] border border-white/15 bg-black p-4">
			<p class="truncate text-xs font-bold text-white">{userName}</p>
			<p class="truncate text-xs text-neutral-400">{userEmail}</p>
			<button
				type="button"
				disabled={signingOut}
				onclick={handleSignOut}
				class="mt-3 w-full rounded-full border border-white/20 bg-white/[0.06] px-3 py-1.5 text-xs font-bold text-neutral-200 transition hover:border-red-400 hover:text-red-300 disabled:opacity-50"
			>
				{signingOut ? 'Keluar...' : 'Keluar'}
			</button>
		</div>
	</div>
</div>
