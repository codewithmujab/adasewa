<script lang="ts">
	interface Props {
		message: string | null;
		variant?: 'success' | 'error' | 'info';
		onDismiss: () => void;
	}

	let { message, variant = 'success', onDismiss }: Props = $props();

	let styles = $derived(
		variant === 'error'
			? 'border-red-400/40 bg-[#1a0b0d]/95 text-red-200'
			: variant === 'info'
				? 'border-white/25 bg-[#121216]/95 text-white'
				: 'border-emerald-400/40 bg-[#071a12]/95 text-emerald-200'
	);

	$effect(() => {
		if (!message) return;
		const timer = setTimeout(() => {
			onDismiss();
		}, 4500);
		return () => clearTimeout(timer);
	});
</script>

{#if message}
	<div
		role="status"
		aria-live="polite"
		class="fixed right-6 bottom-6 z-50 flex max-w-md items-center gap-3 rounded-full border px-5 py-3 text-sm font-semibold shadow-2xl backdrop-blur-xl transition {styles}"
	>
		<span class="leading-snug">{message}</span>
		<button
			type="button"
			onclick={onDismiss}
			aria-label="Tutup notifikasi"
			class="ml-2 rounded-full p-1 opacity-70 transition hover:opacity-100"
		>
			<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
				<path
					d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
				/>
			</svg>
		</button>
	</div>
{/if}
