<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		open: boolean;
		title: string;
		subtitle?: string;
		maxWidthClass?: string;
		onClose: () => void;
		children: Snippet;
	}

	let {
		open,
		title,
		subtitle,
		maxWidthClass = 'max-w-2xl',
		onClose,
		children
	}: Props = $props();

	function handleKeydown(event: KeyboardEvent): void {
		if (open && event.key === 'Escape') {
			onClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md sm:p-6"
		role="dialog"
		aria-modal="true"
		aria-label={title}
	>
		<button
			type="button"
			tabindex="-1"
			aria-label="Tutup modal"
			onclick={onClose}
			class="fixed inset-0 cursor-default"
		></button>

		<div
			class="relative z-10 flex max-h-[90vh] w-full flex-col overflow-hidden rounded-[2rem] border border-white/15 bg-[#0c0c0f] text-white shadow-2xl {maxWidthClass}"
		>
			<header class="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
				<div>
					<h2 class="text-lg font-bold tracking-tight text-white">{title}</h2>
					{#if subtitle}
						<p class="mt-0.5 text-sm text-neutral-400">{subtitle}</p>
					{/if}
				</div>
				<button
					type="button"
					onclick={onClose}
					aria-label="Tutup"
					class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-neutral-300 transition hover:border-white hover:bg-white hover:text-black"
				>
					<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
						<path
							d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
						/>
					</svg>
				</button>
			</header>

			<div class="overflow-y-auto px-6 py-6">
				{@render children()}
			</div>
		</div>
	</div>
{/if}
