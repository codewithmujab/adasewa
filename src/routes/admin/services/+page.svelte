<script lang="ts">
  import ServiceForm from "#lib/components/admin/ServiceForm.svelte";
  import Modal from "#lib/components/ui/Modal.svelte";
  import Toast from "#lib/components/ui/Toast.svelte";
  import type { Service } from "#lib/server/db/schema";
  import type { ApiResponse } from "#lib/types/api";
  import type { PageData } from "./$types";

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let items = $state<Service[]>([]);
  let search = $state("");
  let statusFilter = $state<"all" | "published" | "draft">("all");

  let modalOpen = $state(false);
  let editingService = $state<Service | null>(null);
  let deletingService = $state<Service | null>(null);
  let busyId = $state<string | null>(null);

  let toastMessage = $state<string | null>(null);
  let toastVariant = $state<"success" | "error" | "info">("success");

  $effect(() => {
    items = data.services;
  });

  let filteredItems = $derived.by(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (statusFilter === "published" && !item.isPublished) return false;
      if (statusFilter === "draft" && item.isPublished) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.slug.toLowerCase().includes(q) ||
        item.shortDescription.toLowerCase().includes(q)
      );
    });
  });

  function showToast(
    message: string,
    variant: "success" | "error" | "info" = "success",
  ): void {
    toastVariant = variant;
    toastMessage = message;
  }

  function openCreate(): void {
    editingService = null;
    modalOpen = true;
  }

  function openEdit(service: Service): void {
    editingService = service;
    modalOpen = true;
  }

  function handleSaved(saved: Service, isNew: boolean): void {
    if (isNew) {
      items = [saved, ...items];
      showToast("Layanan baru berhasil ditambahkan.");
    } else {
      items = items.map((item) => (item.id === saved.id ? saved : item));
      showToast("Perubahan layanan berhasil disimpan.");
    }
    modalOpen = false;
    editingService = null;
  }

  async function togglePublish(service: Service): Promise<void> {
    busyId = service.id;
    try {
      const response = await fetch(`/api/services/${service.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !service.isPublished }),
      });
      const result = (await response.json()) as ApiResponse<Service>;
      if (!response.ok || !result.success || !result.data) {
        showToast(
          result.message || "Gagal memperbarui status layanan.",
          "error",
        );
        return;
      }
      const updated = result.data;
      items = items.map((item) => (item.id === updated.id ? updated : item));
      showToast(
        updated.isPublished
          ? "Layanan dipublikasikan."
          : "Layanan dipindahkan ke draft.",
      );
    } catch {
      showToast("Gangguan jaringan saat mengubah status layanan.", "error");
    } finally {
      busyId = null;
    }
  }

  async function confirmDelete(): Promise<void> {
    if (!deletingService) return;
    const target = deletingService;
    busyId = target.id;
    try {
      const response = await fetch(`/api/services/${target.id}`, {
        method: "DELETE",
      });
      const result = (await response.json()) as ApiResponse<{ id: string }>;
      if (!response.ok || !result.success) {
        showToast(result.message || "Gagal menghapus layanan.", "error");
        return;
      }
      items = items.filter((item) => item.id !== target.id);
      deletingService = null;
      showToast("Layanan dan media terkait berhasil dihapus.");
    } catch {
      showToast("Gangguan jaringan saat menghapus layanan.", "error");
    } finally {
      busyId = null;
    }
  }
</script>

<svelte:head>
  <title>Kelola Layanan — CMS</title>
</svelte:head>

<div class="space-y-6">
  <header class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
    <div>
      <p
        class="text-xs font-semibold tracking-widest text-neutral-400 uppercase"
      >
        CMS Konten
      </p>
      <h1 class="mt-1 text-3xl font-semibold tracking-tight text-neutral-950">
        Layanan
      </h1>
      <p class="mt-1 text-sm text-neutral-500">
        Tambah, edit, unggah gambar ke R2, dan atur publikasi layanan
        perusahaan.
      </p>
    </div>

    <button
      type="button"
      onclick={openCreate}
      class="inline-flex items-center justify-center rounded-full bg-neutral-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
    >
      + Tambah Layanan
    </button>
  </header>

  <div
    class="flex flex-col gap-3 rounded-3xl border border-neutral-200/80 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
  >
    <input
      type="search"
      bind:value={search}
      placeholder="Cari judul atau slug layanan..."
      class="w-full rounded-full border border-neutral-200 bg-surface px-4 py-2 text-sm focus:border-neutral-950 focus:bg-white focus:outline-none sm:max-w-xs"
    />

    <div class="flex gap-1.5">
      {#each [{ id: "all", label: "Semua" }, { id: "published", label: "Terbit" }, { id: "draft", label: "Draft" }] as tab (tab.id)}
        <button
          type="button"
          onclick={() =>
            (statusFilter = tab.id as "all" | "published" | "draft")}
          class="rounded-full px-3.5 py-1.5 text-xs font-medium transition {statusFilter ===
          tab.id
            ? 'bg-neutral-950 text-white'
            : 'bg-surface text-neutral-600 hover:text-neutral-950'}"
        >
          {tab.label}
        </button>
      {/each}
    </div>
  </div>

  {#if filteredItems.length > 0}
    <div
      class="overflow-hidden rounded-3xl border border-neutral-200/80 bg-white"
    >
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead
            class="border-b border-neutral-100 bg-neutral-50/70 text-xs text-neutral-500"
          >
            <tr>
              <th class="px-5 py-3.5 font-medium">Layanan</th>
              <th class="px-4 py-3.5 font-medium">Urutan</th>
              <th class="px-4 py-3.5 font-medium">Status</th>
              <th class="px-5 py-3.5 text-right font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-100">
            {#each filteredItems as service (service.id)}
              <tr class="transition hover:bg-neutral-50/60">
                <td class="px-5 py-4">
                  <div class="flex items-center gap-3.5">
                    {#if service.imageUrl}
                      <img
                        src={service.imageUrl}
                        alt={service.title}
                        class="h-11 w-14 shrink-0 rounded-xl object-cover"
                      />
                    {:else}
                      <div
                        class="flex h-11 w-14 shrink-0 items-center justify-center rounded-xl bg-surface text-[10px] font-medium text-neutral-400 uppercase"
                      >
                        {service.icon?.slice(0, 4) || "SVC"}
                      </div>
                    {/if}
                    <div class="min-w-0">
                      <div class="flex items-center gap-2">
                        <p class="truncate font-medium text-neutral-950">
                          {service.title}
                        </p>
                        {#if service.isFeatured}
                          <span
                            class="rounded-full bg-neutral-950 px-2 py-0.5 text-[10px] font-medium text-white"
                          >
                            Unggulan
                          </span>
                        {/if}
                      </div>
                      <p class="truncate font-mono text-xs text-neutral-400">
                        /services/{service.slug}
                      </p>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-4 font-mono text-xs text-neutral-500"
                  >{service.sortOrder}</td
                >
                <td class="px-4 py-4">
                  <button
                    type="button"
                    disabled={busyId === service.id}
                    onclick={() => togglePublish(service)}
                    class="rounded-full px-3 py-1 text-xs font-medium transition {service.isPublished
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}"
                  >
                    {service.isPublished ? "Terbit" : "Draft"}
                  </button>
                </td>
                <td class="px-5 py-4 text-right">
                  <div class="inline-flex items-center gap-2">
                    <button
                      type="button"
                      onclick={() => openEdit(service)}
                      class="rounded-full border border-neutral-200 px-3.5 py-1.5 text-xs font-medium text-neutral-700 transition hover:border-neutral-950 hover:text-neutral-950"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onclick={() => (deletingService = service)}
                      class="rounded-full border border-red-200 px-3.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                    >
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {:else}
    <div
      class="rounded-3xl border border-neutral-200/80 bg-white p-14 text-center"
    >
      <p class="text-sm text-neutral-500">
        Belum ada data layanan yang sesuai filter.
      </p>
      <button
        type="button"
        onclick={openCreate}
        class="mt-4 rounded-full bg-neutral-950 px-5 py-2 text-xs font-medium text-white"
      >
        Tambah Layanan Pertama
      </button>
    </div>
  {/if}
</div>

<Modal
  open={modalOpen}
  title={editingService ? "Edit Layanan" : "Tambah Layanan Baru"}
  subtitle="Perubahan akan otomatis disinkronkan ke halaman publik."
  onClose={() => {
    modalOpen = false;
    editingService = null;
  }}
>
  <ServiceForm
    service={editingService}
    onSaved={handleSaved}
    onCancel={() => {
      modalOpen = false;
      editingService = null;
    }}
  />
</Modal>

<Modal
  open={Boolean(deletingService)}
  title="Hapus Layanan?"
  maxWidthClass="max-w-md"
  onClose={() => (deletingService = null)}
>
  {#if deletingService}
    <p class="text-sm leading-relaxed text-neutral-600">
      Anda yakin ingin menghapus layanan <strong class="text-neutral-950"
        >{deletingService.title}</strong
      >? Gambar terkait di Cloudflare R2 juga akan ikut dibersihkan.
    </p>
    <div class="mt-6 flex justify-end gap-2.5">
      <button
        type="button"
        onclick={() => (deletingService = null)}
        class="rounded-full border border-neutral-200 px-4 py-2 text-xs font-medium text-neutral-700"
      >
        Batal
      </button>
      <button
        type="button"
        disabled={busyId === deletingService.id}
        onclick={confirmDelete}
        class="rounded-full bg-red-600 px-5 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
      >
        {busyId === deletingService.id ? "Menghapus..." : "Ya, Hapus"}
      </button>
    </div>
  {/if}
</Modal>

<Toast
  message={toastMessage}
  variant={toastVariant}
  onDismiss={() => (toastMessage = null)}
/>
