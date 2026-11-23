<script lang="ts">
	import { page } from '$app/state';
	import type { CompanySettings } from '#lib/server/db/schema';

	interface Props {
		settings: CompanySettings;
		isAuthenticated: boolean;
	}

	let { settings, isAuthenticated }: Props = $props();
	let mobileOpen = $state(false);

	const navItems = [
		{ href: '/', label: 'Beranda' },
		{ href: '/about', label: 'Tentang' },
		{ href: '/services', label: 'Layanan' },
		{ href: '/portfolios', label: 'Portofolio' }
	] as const;

	let pathname = $derived(page.url.pathname);

	function isActive(href: string): boolean {
		if (href === '/') return pathname === '/';
		return pathname === href || pathname.startsWith(`${href}/`);
	}
</script>

<header class="sticky top-0 z-40 border-b border-neutral-200/70 bg-white/80 backdrop-blur-xl">
	<div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
		<a
			href="/"
			class="flex items-center gap-3 text-sm font-semibold tracking-tight text-neutral-950"
			onclick={() => (mobileOpen = false)}
		>
			{#if settings.logoUrl}
				<img
					src={settings.logoUrl}
					alt={settings.companyName}
					class="h-8 w-8 rounded-lg object-cover"
				/>
			{:else}
				<span
					class="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-950 text-xs font-semibold text-white"
				>
					{settings.companyName.slice(0, 2).toUpperCase()}
				</span>
			{/if}
			<span>{settings.companyName}</span>
		</a>

		<nav aria-label="Navigasi utama" class="hidden items-center gap-8 md:flex">
			{#each navItems as item (item.href)}
				<a
					href={item.href}
					class="text-sm transition {isActive(item.href)
						? 'font-medium text-neutral-950'
						: 'text-neutral-500 hover:text-neutral-950'}"
				>
					{item.label}
				</a>
			{/each}
		</nav>

		<div class="hidden items-center gap-3 md:flex">
			<a
				href={`mailto:${settings.email}`}
				class="text-sm text-neutral-500 transition hover:text-neutral-950"
			>
				Hubungi Kami
			</a>
			<a
				href={isAuthenticated ? '/admin' : '/login'}
				class="rounded-full bg-neutral-950 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-800"
			>
				{isAuthenticated ? 'Dashboard CMS' : 'Admin'}
			</a>
		</div>

		<button
			type="button"
			onclick={() => (mobileOpen = !mobileOpen)}
			aria-label="Buka menu navigasi"
			aria-expanded={mobileOpen}
			class="inline-flex items-center justify-center rounded-full p-2 text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-950 md:hidden"
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

	{#if mobileOpen}
		<div class="border-t border-neutral-100 bg-white px-6 py-5 md:hidden">
			<nav class="flex flex-col gap-3">
				{#each navItems as item (item.href)}
					<a
						href={item.href}
						onclick={() => (mobileOpen = false)}
						class="rounded-xl px-3 py-2 text-sm transition {isActive(item.href)
							? 'bg-neutral-100 font-medium text-neutral-950'
							: 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-950'}"
					>
						{item.label}
					</a>
				{/each}
				<div class="mt-2 flex flex-col gap-2 border-t border-neutral-100 pt-4">
					<a
						href={`mailto:${settings.email}`}
						onclick={() => (mobileOpen = false)}
						class="rounded-full border border-neutral-200 px-4 py-2 text-center text-sm font-medium text-neutral-800"
					>
						Hubungi Kami
					</a>
					<a
						href={isAuthenticated ? '/admin' : '/login'}
						onclick={() => (mobileOpen = false)}
						class="rounded-full bg-neutral-950 px-4 py-2 text-center text-sm font-medium text-white"
					>
						{isAuthenticated ? 'Dashboard CMS' : 'Login Admin'}
					</a>
				</div>
			</nav>
		</div>
	{/if}
</header>
