<script lang="ts">
  import ImageUploader from "#lib/components/admin/ImageUploader.svelte";
  import { slugify } from "#lib/schemas/common";
  import type { Service } from "#lib/server/db/schema";
  import type { ApiResponse } from "#lib/types/api";

  interface Props {
    service: Service | null;
    onSaved: (saved: Service, isNew: boolean) => void;
    onCancel: () => void;
  }

  let { service, onSaved, onCancel }: Props = $props();

  let title = $state("");
  let slug = $state("");
  let slugTouched = $state(false);
  let shortDescription = $state("");
  let description = $state("");
  let icon = $state("");
  let imageKey = $state<string | null>(null);
  let imageUrl = $state<string | null>(null);
  let isFeatured = $state(false);
  let isPublished = $state(true);
  let sortOrder = $state(0);

  let submitting = $state(false);
  let errorMessage = $state<string | null>(null);
  let fieldErrors = $state<Record<string, string[]>>({});

  $effect(() => {
    const current = service;
    title = current?.title ?? "";
    slug = current?.slug ?? "";
    slugTouched = Boolean(current);
    shortDescription = current?.shortDescription ?? "";
    description = current?.description ?? "";
    icon = current?.icon ?? "";
    imageKey = current?.imageKey ?? null;
    imageUrl = current?.imageUrl ?? null;
    isFeatured = current?.isFeatured ?? false;
    isPublished = current?.isPublished ?? true;
    sortOrder = current?.sortOrder ?? 0;
    errorMessage = null;
    fieldErrors = {};
  });

  function handleTitleInput(value: string): void {
    title = value;
    if (!slugTouched) {
      slug = slugify(value);
    }
  }

  async function handleSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    submitting = true;
    errorMessage = null;
    fieldErrors = {};

    const payload = {
      title: title.trim(),
      slug: slug.trim() || undefined,
      shortDescription: shortDescription.trim(),
      description: description.trim(),
      icon: icon.trim() ? icon.trim() : null,
      imageKey,
      imageUrl,
      isFeatured,
      isPublished,
      sortOrder: Number.isFinite(Number(sortOrder))
        ? Math.max(0, Math.trunc(Number(sortOrder)))
        : 0,
    };

    try {
      const isEdit = Boolean(service);
      const endpoint =
        isEdit && service ? `/api/services/${service.id}` : "/api/services";
      const response = await fetch(endpoint, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as ApiResponse<Service>;

      if (!response.ok || !result.success || !result.data) {
        errorMessage = result.message || "Gagal menyimpan layanan.";
        fieldErrors = result.errors ?? {};
        return;
      }

      onSaved(result.data, !isEdit);
    } catch {
      errorMessage = "Terjadi kesalahan jaringan saat menyimpan layanan.";
    } finally {
      submitting = false;
    }
  }
</script>

<form onsubmit={handleSubmit} class="space-y-5">
  {#if errorMessage}
    <div
      class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
    >
      {errorMessage}
    </div>
  {/if}

  <div class="grid gap-4 sm:grid-cols-2">
    <div>
      <label for="svc-title" class="block text-xs font-medium text-neutral-700">
        Judul Layanan *
      </label>
      <input
        id="svc-title"
        type="text"
        required
        value={title}
        oninput={(e) => handleTitleInput(e.currentTarget.value)}
        placeholder="Pengembangan Web & Aplikasi"
        class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-neutral-950 focus:outline-none"
      />
      {#if fieldErrors.title?.[0]}
        <p class="mt-1 text-xs text-red-600">{fieldErrors.title[0]}</p>
      {/if}
    </div>

    <div>
      <label for="svc-slug" class="block text-xs font-medium text-neutral-700">
        Slug URL
      </label>
      <input
        id="svc-slug"
        type="text"
        value={slug}
        oninput={(e) => {
          slugTouched = true;
          slug = e.currentTarget.value;
        }}
        placeholder="pengembangan-web-aplikasi"
        class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 font-mono text-xs focus:border-neutral-950 focus:outline-none"
      />
      {#if fieldErrors.slug?.[0]}
        <p class="mt-1 text-xs text-red-600">{fieldErrors.slug[0]}</p>
      {/if}
    </div>
  </div>

  <div class="grid gap-4 sm:grid-cols-2">
    <div>
      <label for="svc-icon" class="block text-xs font-medium text-neutral-700">
        Label / Ikon Singkat
      </label>
      <input
        id="svc-icon"
        type="text"
        bind:value={icon}
        placeholder="Engineering / Cloud / Design"
        class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-neutral-950 focus:outline-none"
      />
    </div>

    <div>
      <label for="svc-order" class="block text-xs font-medium text-neutral-700">
        Urutan Tampil
      </label>
      <input
        id="svc-order"
        type="number"
        min="0"
        max="9999"
        bind:value={sortOrder}
        class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-neutral-950 focus:outline-none"
      />
    </div>
  </div>

  <div>
    <label for="svc-short" class="block text-xs font-medium text-neutral-700">
      Deskripsi Singkat *
    </label>
    <textarea
      id="svc-short"
      rows="2"
      required
      bind:value={shortDescription}
      placeholder="Ringkasan padat 1-2 kalimat untuk kartu layanan..."
      class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-neutral-950 focus:outline-none"
    ></textarea>
    {#if fieldErrors.shortDescription?.[0]}
      <p class="mt-1 text-xs text-red-600">{fieldErrors.shortDescription[0]}</p>
    {/if}
  </div>

  <div>
    <label for="svc-desc" class="block text-xs font-medium text-neutral-700">
      Deskripsi Lengkap *
    </label>
    <textarea
      id="svc-desc"
      rows="5"
      required
      bind:value={description}
      placeholder="Jelaskan ruang lingkup, metodologi, dan nilai utama layanan ini..."
      class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-neutral-950 focus:outline-none"
    ></textarea>
    {#if fieldErrors.description?.[0]}
      <p class="mt-1 text-xs text-red-600">{fieldErrors.description[0]}</p>
    {/if}
  </div>

  <ImageUploader
    label="Gambar Layanan (Cloudflare R2)"
    folder="services"
    {imageKey}
    {imageUrl}
    onChange={(val) => {
      imageKey = val.imageKey;
      imageUrl = val.imageUrl;
    }}
  />

  <div class="flex flex-wrap gap-6 rounded-2xl bg-surface px-4 py-3.5">
    <label
      class="flex cursor-pointer items-center gap-2.5 text-sm text-neutral-800"
    >
      <input
        type="checkbox"
        bind:checked={isPublished}
        class="h-4 w-4 rounded accent-neutral-950"
      />
      <span>Publikasikan ke website</span>
    </label>
    <label
      class="flex cursor-pointer items-center gap-2.5 text-sm text-neutral-800"
    >
      <input
        type="checkbox"
        bind:checked={isFeatured}
        class="h-4 w-4 rounded accent-neutral-950"
      />
      <span>Tampilkan sebagai layanan unggulan</span>
    </label>
  </div>

  <div
    class="flex items-center justify-end gap-3 border-t border-neutral-100 pt-5"
  >
    <button
      type="button"
      onclick={onCancel}
      class="rounded-full border border-neutral-200 px-5 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
    >
      Batal
    </button>
    <button
      type="submit"
      disabled={submitting}
      class="rounded-full bg-neutral-950 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-60"
    >
      {submitting
        ? "Menyimpan..."
        : service
          ? "Simpan Perubahan"
          : "Tambah Layanan"}
    </button>
  </div>
</form>
