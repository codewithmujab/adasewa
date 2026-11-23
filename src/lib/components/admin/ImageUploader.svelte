<script lang="ts">
  import {
    MAX_MEDIA_SIZE_BYTES,
    type MediaFolder,
    type UploadedMediaResult,
  } from "#lib/schemas/media";
  import type { ApiResponse } from "#lib/types/api";

  interface Props {
    label: string;
    folder: MediaFolder;
    imageUrl: string | null;
    imageKey: string | null;
    hint?: string;
    onChange: (value: {
      imageKey: string | null;
      imageUrl: string | null;
    }) => void;
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
      uploadError = "Ukuran gambar maksimal 5 MB.";
      target.value = "";
      return;
    }

    uploading = true;
    try {
      const formData = new FormData();
      formData.append("folder", folder);
      formData.append("file", file);

      const response = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      const payload =
        (await response.json()) as ApiResponse<UploadedMediaResult>;

      if (!response.ok || !payload.success || !payload.data) {
        uploadError =
          payload.message || "Gagal mengunggah gambar ke Cloudflare R2.";
        return;
      }

      onChange({
        imageKey: payload.data.key,
        imageUrl: payload.data.url,
      });
    } catch {
      uploadError = "Terjadi gangguan jaringan saat mengunggah gambar.";
    } finally {
      uploading = false;
      target.value = "";
    }
  }

  function handleRemove(): void {
    uploadError = null;
    onChange({ imageKey: null, imageUrl: null });
  }
</script>

<div class="space-y-2">
  <div class="flex items-center justify-between">
    <span class="text-xs font-medium text-neutral-700">{label}</span>
    {#if imageKey}
      <span
        class="max-w-55 truncate font-mono text-[11px] text-neutral-400"
        title={imageKey}
      >
        {imageKey}
      </span>
    {/if}
  </div>

  {#if imageUrl}
    <div
      class="overflow-hidden rounded-2xl border border-neutral-200 bg-surface"
    >
      <img
        src={imageUrl}
        alt={label}
        class="aspect-video max-h-52 w-full object-cover"
      />
      <div
        class="flex items-center justify-between gap-2 border-t border-neutral-200/80 bg-white px-4 py-2.5"
      >
        <button
          type="button"
          disabled={uploading}
          onclick={() => inputEl?.click()}
          class="text-xs font-medium text-neutral-800 transition hover:text-neutral-950 disabled:opacity-50"
        >
          {uploading ? "Mengunggah..." : "Ganti Gambar"}
        </button>
        <button
          type="button"
          disabled={uploading}
          onclick={handleRemove}
          class="text-xs font-medium text-red-600 transition hover:text-red-800 disabled:opacity-50"
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
      class="flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-surface px-6 py-8 text-center transition hover:border-neutral-500 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span class="text-sm font-medium text-neutral-800">
        {uploading
          ? "Mengunggah ke Cloudflare R2..."
          : "Klik untuk unggah gambar"}
      </span>
      <span class="mt-1 text-xs text-neutral-500">
        {hint || "Format JPG, PNG, WebP, AVIF, atau GIF · Maksimal 5 MB"}
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
    <p class="text-xs text-red-600">{uploadError}</p>
  {/if}
</div>
