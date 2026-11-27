<script lang="ts">
	import {
		MAX_MEDIA_SIZE_BYTES,
		type MediaFolder,
		type UploadedMediaResult
	} from '#lib/schemas/media';
	import type { ApiResponse } from '#lib/types/api';

	interface Props {
		label: string;
		folder: MediaFolder;
		imageUrl: string | null;
		imageKey: string | null;
		hint?: string;
		onChange: (value: { imageKey: string | null; imageUrl: string | null }) => void;
	}

	let { label, folder, imageUrl, imageKey, hint, onChange }: Props = $props();

	let uploading = $state(false);
	let uploadError = $state<string | null>(null);
	let inputEl = $state<HTMLInputElement | null>(null);

	async function handleFileSelect(event: Event): Promise<void> {
		const target = event.currentTarget as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		uploadError = null;

		if (file.size > MAX_MEDIA_SIZE_BYTES) {
			uploadError = 'Ukuran gambar maksimal 5 MB.';
			target.value = '';
			return;
		}

		uploading = true;
		try {
			const formData = new FormData();
			formData.append('folder', folder);
			formData.append('file', file);

			const response = await fetch('/api/media/upload', {
				method: 'POST',
				body: formData
			});

			const payload = (await response.json()) as ApiResponse<UploadedMediaResult>;

			if (!response.ok || !payload.success || !payload.data) {
				uploadError = payload.message || 'Gagal mengunggah gambar ke Cloudflare R2.';
				return;
			}

			onChange({
				imageKey: payload.data.key,
				imageUrl: payload.data.url
			});
		} catch {
			uploadError = 'Terjadi gangguan jaringan saat mengunggah gambar.';
		} finally {
			uploading = false;
			target.value = '';
		}
	}

	function handleRemove(): void {
		uploadError = null;
		onChange({ imageKey: null, imageUrl: null });
	}
</script>

<div class="space-y-2">
	<div class="flex items-center justify-between">
		<span class="text-xs font-semibold text-neutral-300">{label}</span>
		{#if imageKey}
			<span class="max-w-55 truncate font-mono text-[11px] text-neutral-500" title={imageKey}>
				{imageKey}
			</span>
		{/if}
	</div>

	{#if imageUrl}
		<div class="overflow-hidden rounded-[1.5rem] border border-white/15 bg-black">
			<img src={imageUrl} alt={label} class="aspect-video max-h-52 w-full object-cover" />
			<div
				class="flex items-center justify-between gap-2 border-t border-white/10 bg-[#121216] px-4 py-2.5"
			>
				<button
					type="button"
					disabled={uploading}
					onclick={() => inputEl?.click()}
					class="text-xs font-bold text-white transition hover:text-neutral-300 disabled:opacity-50"
				>
					{uploading ? 'Mengunggah...' : 'Ganti Gambar'}
				</button>
				<button
					type="button"
					disabled={uploading}
					onclick={handleRemove}
					class="text-xs font-bold text-red-400 transition hover:text-red-300 disabled:opacity-50"
				>
					Hapus
				</button>
			</div>
		</div>
	{:else}
		<button
			type="button"
			disabled={uploading}
			onclick={() => inputEl?.click()}
			class="flex w-full flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-white/25 bg-black px-6 py-8 text-center transition hover:border-white/50 hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-60"
		>
			<span class="text-sm font-bold text-white">
				{uploading ? 'Mengunggah ke Cloudflare R2...' : 'Klik untuk unggah gambar'}
			</span>
			<span class="mt-1 text-xs text-neutral-400">
				{hint || 'Format JPG, PNG, WebP, AVIF, atau GIF · Maksimal 5 MB'}
			</span>
		</button>
	{/if}

	<input
		bind:this={inputEl}
		type="file"
		accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
		onchange={handleFileSelect}
		class="hidden"
	/>

	{#if uploadError}
		<p class="text-xs font-medium text-red-400">{uploadError}</p>
	{/if}
</div>
