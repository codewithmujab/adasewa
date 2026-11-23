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
		class="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/45 p-4 backdrop-blur-sm sm:p-6"
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
			class="relative z-10 flex max-h-[90vh] w-full flex-col overflow-hidden rounded-3xl border border-neutral-200/80 bg-white shadow-2xl {maxWidthClass}"
		>
			<header class="flex items-start justify-between gap-4 border-b border-neutral-100 px-6 py-5">
				<div>
					<h2 class="text-lg font-semibold tracking-tight text-neutral-950">{title}</h2>
					{#if subtitle}
						<p class="mt-0.5 text-sm text-neutral-500">{subtitle}</p>
					{/if}
				</div>
				<button
					type="button"
					onclick={onClose}
					aria-label="Tutup"
					class="rounded-full p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-900"
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
