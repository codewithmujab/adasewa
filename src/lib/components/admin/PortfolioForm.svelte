<script lang="ts">
  import ImageUploader from "#lib/components/admin/ImageUploader.svelte";
  import { slugify } from "#lib/schemas/common";
  import {
    MAX_MEDIA_SIZE_BYTES,
    type UploadedMediaResult,
  } from "#lib/schemas/media";
  import type {
    Portfolio,
    PortfolioMediaItem,
    Service,
  } from "#lib/server/db/schema";
  import type { ApiResponse } from "#lib/types/api";

  interface Props {
    portfolio: Portfolio | null;
    services: Service[];
    onSaved: (saved: Portfolio, isNew: boolean) => void;
    onCancel: () => void;
  }

  let { portfolio, services, onSaved, onCancel }: Props = $props();

  let title = $state("");
  let slug = $state("");
  let slugTouched = $state(false);
  let clientName = $state("");
  let category = $state("");
  let summary = $state("");
  let content = $state("");
  let projectUrl = $state("");
  let completedAt = $state("");
  let serviceId = $state("");
  let imageKey = $state<string | null>(null);
  let imageUrl = $state<string | null>(null);
  let gallery = $state<PortfolioMediaItem[]>([]);
  let isFeatured = $state(false);
  let isPublished = $state(true);
  let sortOrder = $state(0);

  let uploadingGallery = $state(false);
  let galleryError = $state<string | null>(null);
  let galleryInputEl = $state<HTMLInputElement | null>(null);

  let submitting = $state(false);
  let errorMessage = $state<string | null>(null);
  let fieldErrors = $state<Record<string, string[]>>({});

  function formatDateInput(value: Date | string | null | undefined): string {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  }

  $effect(() => {
    const current = portfolio;
    title = current?.title ?? "";
    slug = current?.slug ?? "";
    slugTouched = Boolean(current);
    clientName = current?.clientName ?? "";
    category = current?.category ?? "";
    summary = current?.summary ?? "";
    content = current?.content ?? "";
    projectUrl = current?.projectUrl ?? "";
    completedAt = formatDateInput(current?.completedAt);
    serviceId = current?.serviceId ?? "";
    imageKey = current?.imageKey ?? null;
    imageUrl = current?.imageUrl ?? null;
    gallery = current ? current.gallery.map((g) => ({ ...g })) : [];
    isFeatured = current?.isFeatured ?? false;
    isPublished = current?.isPublished ?? true;
    sortOrder = current?.sortOrder ?? 0;
    errorMessage = null;
    fieldErrors = {};
    galleryError = null;
  });

  function handleTitleInput(value: string): void {
    title = value;
    if (!slugTouched) {
      slug = slugify(value, 200);
    }
  }

  async function handleGalleryUpload(event: Event): Promise<void> {
    const target = event.currentTarget as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    galleryError = null;
    if (file.size > MAX_MEDIA_SIZE_BYTES) {
      galleryError = "Ukuran gambar galeri maksimal 5 MB.";
      target.value = "";
      return;
    }

    uploadingGallery = true;
    try {
      const formData = new FormData();
      formData.append("folder", "portfolios");
      formData.append("file", file);

      const response = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });
      const result =
        (await response.json()) as ApiResponse<UploadedMediaResult>;

      if (!response.ok || !result.success || !result.data) {
        galleryError = result.message || "Gagal mengunggah gambar galeri.";
        return;
      }

      gallery = [
        ...gallery,
        {
          imageKey: result.data.key,
          imageUrl: result.data.url,
          alt: title.trim() || file.name.replace(/\.[^.]+$/, ""),
        },
      ];
    } catch {
      galleryError = "Gangguan jaringan saat mengunggah gambar galeri.";
    } finally {
      uploadingGallery = false;
      target.value = "";
    }
  }

  function removeGalleryItem(keyToRemove: string): void {
    gallery = gallery.filter((item) => item.imageKey !== keyToRemove);
  }

  function updateGalleryAlt(keyToEdit: string, alt: string): void {
    gallery = gallery.map((item) =>
      item.imageKey === keyToEdit ? { ...item, alt } : item,
    );
  }

  async function handleSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    submitting = true;
    errorMessage = null;
    fieldErrors = {};

    const payload = {
      title: title.trim(),
      slug: slug.trim() || undefined,
      clientName: clientName.trim(),
      category: category.trim(),
      summary: summary.trim(),
      content: content.trim(),
      projectUrl: projectUrl.trim() || null,
      completedAt: completedAt.trim()
        ? new Date(completedAt).toISOString()
        : null,
      serviceId: serviceId || null,
      imageKey,
      imageUrl,
      gallery,
      isFeatured,
      isPublished,
      sortOrder: Number.isFinite(Number(sortOrder))
        ? Math.max(0, Math.trunc(Number(sortOrder)))
        : 0,
    };

    try {
      const isEdit = Boolean(portfolio);
      const endpoint =
        isEdit && portfolio
          ? `/api/portfolios/${portfolio.id}`
          : "/api/portfolios";
      const response = await fetch(endpoint, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as ApiResponse<Portfolio>;

      if (!response.ok || !result.success || !result.data) {
        errorMessage = result.message || "Gagal menyimpan portofolio.";
        fieldErrors = result.errors ?? {};
        return;
      }

      onSaved(result.data, !isEdit);
    } catch {
      errorMessage = "Terjadi kesalahan jaringan saat menyimpan portofolio.";
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
      <label for="pf-title" class="block text-xs font-medium text-neutral-700">
        Judul Proyek *
      </label>
      <input
        id="pf-title"
        type="text"
        required
        value={title}
        oninput={(e) => handleTitleInput(e.currentTarget.value)}
        placeholder="Transformasi Portal Enterprise"
        class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-neutral-950 focus:outline-none"
      />
      {#if fieldErrors.title?.[0]}
        <p class="mt-1 text-xs text-red-600">{fieldErrors.title[0]}</p>
      {/if}
    </div>

    <div>
      <label for="pf-slug" class="block text-xs font-medium text-neutral-700"
        >Slug URL</label
      >
      <input
        id="pf-slug"
        type="text"
        value={slug}
        oninput={(e) => {
          slugTouched = true;
          slug = e.currentTarget.value;
        }}
        placeholder="transformasi-portal-enterprise"
        class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 font-mono text-xs focus:border-neutral-950 focus:outline-none"
      />
      {#if fieldErrors.slug?.[0]}
        <p class="mt-1 text-xs text-red-600">{fieldErrors.slug[0]}</p>
      {/if}
    </div>
  </div>

  <div class="grid gap-4 sm:grid-cols-2">
    <div>
      <label for="pf-client" class="block text-xs font-medium text-neutral-700"
        >Nama Klien *</label
      >
      <input
        id="pf-client"
        type="text"
        required
        bind:value={clientName}
        placeholder="PT Nusantara Energi"
        class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-neutral-950 focus:outline-none"
      />
      {#if fieldErrors.clientName?.[0]}
        <p class="mt-1 text-xs text-red-600">{fieldErrors.clientName[0]}</p>
      {/if}
    </div>

    <div>
      <label
        for="pf-category"
        class="block text-xs font-medium text-neutral-700">Kategori *</label
      >
      <input
        id="pf-category"
        type="text"
        required
        bind:value={category}
        placeholder="Web Platform / FinTech / SaaS"
        class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-neutral-950 focus:outline-none"
      />
      {#if fieldErrors.category?.[0]}
        <p class="mt-1 text-xs text-red-600">{fieldErrors.category[0]}</p>
      {/if}
    </div>
  </div>

  <div class="grid gap-4 sm:grid-cols-3">
    <div>
      <label
        for="pf-service"
        class="block text-xs font-medium text-neutral-700"
      >
        Layanan Terkait
      </label>
      <select
        id="pf-service"
        bind:value={serviceId}
        class="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm focus:border-neutral-950 focus:outline-none"
      >
        <option value="">— Tanpa relasi —</option>
        {#each services as svc (svc.id)}
          <option value={svc.id}>{svc.title}</option>
        {/each}
      </select>
    </div>

    <div>
      <label for="pf-date" class="block text-xs font-medium text-neutral-700">
        Tanggal Selesai
      </label>
      <input
        id="pf-date"
        type="date"
        bind:value={completedAt}
        class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-neutral-950 focus:outline-none"
      />
    </div>

    <div>
      <label for="pf-order" class="block text-xs font-medium text-neutral-700"
        >Urutan</label
      >
      <input
        id="pf-order"
        type="number"
        min="0"
        max="9999"
        bind:value={sortOrder}
        class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-neutral-950 focus:outline-none"
      />
    </div>
  </div>

  <div>
    <label for="pf-url" class="block text-xs font-medium text-neutral-700">
      URL Proyek Live (Opsional)
    </label>
    <input
      id="pf-url"
      type="url"
      bind:value={projectUrl}
      placeholder="https://contoh-proyek.id"
      class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-neutral-950 focus:outline-none"
    />
    {#if fieldErrors.projectUrl?.[0]}
      <p class="mt-1 text-xs text-red-600">{fieldErrors.projectUrl[0]}</p>
    {/if}
  </div>

  <div>
    <label for="pf-summary" class="block text-xs font-medium text-neutral-700"
      >Ringkasan *</label
    >
    <textarea
      id="pf-summary"
      rows="2"
      required
      bind:value={summary}
      placeholder="Ringkasan tantangan & hasil proyek..."
      class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-neutral-950 focus:outline-none"
    ></textarea>
    {#if fieldErrors.summary?.[0]}
      <p class="mt-1 text-xs text-red-600">{fieldErrors.summary[0]}</p>
    {/if}
  </div>

  <div>
    <label for="pf-content" class="block text-xs font-medium text-neutral-700">
      Studi Kasus Lengkap *
    </label>
    <textarea
      id="pf-content"
      rows="5"
      required
      bind:value={content}
      placeholder="Uraikan konteks, solusi arsitektur, dan dampak terukur proyek ini..."
      class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:border-neutral-950 focus:outline-none"
    ></textarea>
    {#if fieldErrors.content?.[0]}
      <p class="mt-1 text-xs text-red-600">{fieldErrors.content[0]}</p>
    {/if}
  </div>

  <ImageUploader
    label="Gambar Sampul Portofolio (Cloudflare R2)"
    folder="portfolios"
    {imageKey}
    {imageUrl}
    onChange={(val) => {
      imageKey = val.imageKey;
      imageUrl = val.imageUrl;
    }}
  />

  <!-- Galeri Tambahan R2 -->
  <div class="space-y-3 rounded-2xl border border-neutral-200/80 p-4">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-xs font-medium text-neutral-800">
          Galeri Proyek ({gallery.length})
        </p>
        <p class="text-[11px] text-neutral-400">
          Tambahkan tangkapan layar atau dokumentasi ke R2.
        </p>
      </div>
      <button
        type="button"
        disabled={uploadingGallery}
        onclick={() => galleryInputEl?.click()}
        class="rounded-full border border-neutral-300 bg-white px-3.5 py-1.5 text-xs font-medium text-neutral-800 transition hover:border-neutral-950 disabled:opacity-50"
      >
        {uploadingGallery ? "Mengunggah..." : "+ Tambah Foto"}
      </button>
      <input
        bind:this={galleryInputEl}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
        onchange={handleGalleryUpload}
        class="hidden"
      />
    </div>

    {#if galleryError}
      <p class="text-xs text-red-600">{galleryError}</p>
    {/if}

    {#if gallery.length > 0}
      <div class="grid gap-3 sm:grid-cols-2">
        {#each gallery as item (item.imageKey)}
          <div
            class="overflow-hidden rounded-xl border border-neutral-200 bg-surface"
          >
            <img
              src={item.imageUrl}
              alt={item.alt}
              class="aspect-16/10 w-full object-cover"
            />
            <div class="space-y-2 bg-white p-2.5">
              <input
                type="text"
                value={item.alt}
                oninput={(e) =>
                  updateGalleryAlt(item.imageKey, e.currentTarget.value)}
                placeholder="Keterangan / alt gambar"
                class="w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs focus:border-neutral-950 focus:outline-none"
              />
              <button
                type="button"
                onclick={() => removeGalleryItem(item.imageKey)}
                class="text-xs font-medium text-red-600 hover:text-red-800"
              >
                Hapus dari galeri
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

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
      <span>Tampilkan di beranda (Unggulan)</span>
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
        : portfolio
          ? "Simpan Perubahan"
          : "Tambah Portofolio"}
    </button>
  </div>
</form>
