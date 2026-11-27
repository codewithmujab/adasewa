<script lang="ts">
	import type { Snippet } from 'svelte';
	import AdminSidebar from '#lib/components/admin/AdminSidebar.svelte';
	import type { LayoutData } from './$types';

	interface Props {
		data: LayoutData;
		children: Snippet;
	}

	let { data, children }: Props = $props();
	let mobileDrawerOpen = $state(false);
</script>

<div class="min-h-screen bg-black text-white lg:flex">
	<!-- Sidebar Desktop -->
	<aside
		class="hidden w-68 shrink-0 border-r border-white/15 bg-[#09090b] lg:sticky lg:top-0 lg:block lg:h-screen"
	>
		<AdminSidebar
			companyName={data.companyName}
			logoUrl={data.logoUrl}
			userName={data.user.name}
			userEmail={data.user.email}
			isSuperAdmin={data.isSuperAdmin}
			branchName={data.assignedBranch?.name ?? null}
		/>
	</aside>

	<!-- Header Mobile Sticky -->
	<header
		class="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/15 bg-black/90 px-4 backdrop-blur-xl lg:hidden"
	>
		<a href="/admin" class="flex items-center gap-2.5 text-sm font-bold tracking-tight text-white">
			<img
				src={data.logoUrl}
				alt={data.companyName}
				class="h-8 w-8 rounded-full object-cover ring-2 ring-white/25"
			/>
			<span>{data.companyName}</span>
		</a>
		<button
			type="button"
			onclick={() => (mobileDrawerOpen = !mobileDrawerOpen)}
			aria-label="Buka menu admin"
			class="rounded-full border border-white/15 bg-white/[0.06] p-2 text-neutral-200 hover:border-white hover:text-white"
		>
			<svg
				class="h-5 w-5"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.75"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M4 7h16M4 12h16M4 17h16" />
			</svg>
		</button>
	</header>

	{#if mobileDrawerOpen}
		<div class="fixed inset-0 z-40 flex lg:hidden">
			<button
				type="button"
				aria-label="Tutup sidebar"
				onclick={() => (mobileDrawerOpen = false)}
				class="fixed inset-0 bg-black/75 backdrop-blur-sm"
			></button>
			<div class="relative z-10 h-full w-72 max-w-[85vw] border-r border-white/15 bg-[#09090b] shadow-2xl">
				<AdminSidebar
					companyName={data.companyName}
					logoUrl={data.logoUrl}
					userName={data.user.name}
					userEmail={data.user.email}
					isSuperAdmin={data.isSuperAdmin}
					branchName={data.assignedBranch?.name ?? null}
					onNavigate={() => (mobileDrawerOpen = false)}
				/>
			</div>
		</div>
	{/if}

	<main class="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
		<div class="mx-auto max-w-5xl">
			{@render children()}
		</div>
	</main>
</div>
