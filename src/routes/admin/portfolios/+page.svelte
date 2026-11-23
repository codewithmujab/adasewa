<script lang="ts">
  import PortfolioForm from "#lib/components/admin/PortfolioForm.svelte";
  import Modal from "#lib/components/ui/Modal.svelte";
  import Toast from "#lib/components/ui/Toast.svelte";
  import type { Portfolio } from "#lib/server/db/schema";
  import type { ApiResponse } from "#lib/types/api";
  import type { PageData } from "./$types";

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let items = $state<Portfolio[]>([]);
  let search = $state("");
  let statusFilter = $state<"all" | "published" | "draft">("all");

  let modalOpen = $state(false);
  let editingPortfolio = $state<Portfolio | null>(null);
  let deletingPortfolio = $state<Portfolio | null>(null);
  let busyId = $state<string | null>(null);

  let toastMessage = $state<string | null>(null);
  let toastVariant = $state<"success" | "error" | "info">("success");

  $effect(() => {
    items = data.portfolios;
  });

  let filteredItems = $derived.by(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (statusFilter === "published" && !item.isPublished) return false;
      if (statusFilter === "draft" && item.isPublished) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.clientName.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.slug.toLowerCase().includes(q)
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
    editingPortfolio = null;
    modalOpen = true;
  }

  function openEdit(portfolio: Portfolio): void {
    editingPortfolio = portfolio;
    modalOpen = true;
  }

  function handleSaved(saved: Portfolio, isNew: boolean): void {
    if (isNew) {
      items = [saved, ...items];
      showToast("Portofolio baru berhasil ditambahkan.");
    } else {
      items = items.map((item) => (item.id === saved.id ? saved : item));
      showToast("Perubahan portofolio berhasil disimpan.");
    }
    modalOpen = false;
    editingPortfolio = null;
  }

  async function togglePublish(portfolio: Portfolio): Promise<void> {
    busyId = portfolio.id;
    try {
      const response = await fetch(`/api/portfolios/${portfolio.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !portfolio.isPublished }),
      });
      const result = (await response.json()) as ApiResponse<Portfolio>;
      if (!response.ok || !result.success || !result.data) {
        showToast(
          result.message || "Gagal memperbarui status portofolio.",
          "error",
        );
        return;
      }
      const updated = result.data;
      items = items.map((item) => (item.id === updated.id ? updated : item));
      showToast(
        updated.isPublished
          ? "Portofolio dipublikasikan."
          : "Portofolio dipindahkan ke draft.",
      );
    } catch {
      showToast("Gangguan jaringan saat mengubah status portofolio.", "error");
    } finally {
      busyId = null;
    }
  }

  async function confirmDelete(): Promise<void> {
    if (!deletingPortfolio) return;
    const target = deletingPortfolio;
    busyId = target.id;
    try {
      const response = await fetch(`/api/portfolios/${target.id}`, {
        method: "DELETE",
      });
      const result = (await response.json()) as ApiResponse<{ id: string }>;
      if (!response.ok || !result.success) {
        showToast(result.message || "Gagal menghapus portofolio.", "error");
        return;
      }
      items = items.filter((item) => item.id !== target.id);
      deletingPortfolio = null;
      showToast("Portofolio dan seluruh gambar R2 terkait berhasil dihapus.");
    } catch {
      showToast("Gangguan jaringan saat menghapus portofolio.", "error");
    } finally {
      busyId = null;
    }
  }
</script>

<svelte:head>
  <title>Kelola Portofolio — CMS</title>
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
        Portofolio
      </h1>
      <p class="mt-1 text-sm text-neutral-500">
        Kelola studi kasus proyek, galeri media Cloudflare R2, dan relasi
        layanan.
      </p>
    </div>

    <button
      type="button"
      onclick={openCreate}
      class="inline-flex items-center justify-center rounded-full bg-neutral-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
    >
      + Tambah Portofolio
    </button>
  </header>

  <div
    class="flex flex-col gap-3 rounded-3xl border border-neutral-200/80 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
  >
    <input
      type="search"
      bind:value={search}
      placeholder="Cari judul, klien, atau kategori..."
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
              <th class="px-5 py-3.5 font-medium">Proyek</th>
              <th class="px-4 py-3.5 font-medium">Klien &amp; Kategori</th>
              <th class="px-4 py-3.5 font-medium">Status</th>
              <th class="px-5 py-3.5 text-right font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-100">
            {#each filteredItems as portfolio (portfolio.id)}
              <tr class="transition hover:bg-neutral-50/60">
                <td class="px-5 py-4">
                  <div class="flex items-center gap-3.5">
                    {#if portfolio.imageUrl}
                      <img
                        src={portfolio.imageUrl}
                        alt={portfolio.title}
                        class="h-11 w-14 shrink-0 rounded-xl object-cover"
                      />
                    {:else}
                      <div
                        class="flex h-11 w-14 shrink-0 items-center justify-center rounded-xl bg-surface text-[10px] font-medium text-neutral-400 uppercase"
                      >
                        CASE
                      </div>
                    {/if}
                    <div class="min-w-0">
                      <div class="flex items-center gap-2">
                        <p class="truncate font-medium text-neutral-950">
                          {portfolio.title}
                        </p>
                        {#if portfolio.isFeatured}
                          <span
                            class="rounded-full bg-neutral-950 px-2 py-0.5 text-[10px] font-medium text-white"
                          >
                            Unggulan
                          </span>
                        {/if}
                      </div>
                      <p class="truncate font-mono text-xs text-neutral-400">
                        /portfolios/{portfolio.slug}
                      </p>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-4">
                  <p class="text-sm text-neutral-800">{portfolio.clientName}</p>
                  <p class="text-xs text-neutral-400">{portfolio.category}</p>
                </td>
                <td class="px-4 py-4">
                  <button
                    type="button"
                    disabled={busyId === portfolio.id}
                    onclick={() => togglePublish(portfolio)}
                    class="rounded-full px-3 py-1 text-xs font-medium transition {portfolio.isPublished
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}"
                  >
                    {portfolio.isPublished ? "Terbit" : "Draft"}
                  </button>
                </td>
                <td class="px-5 py-4 text-right">
                  <div class="inline-flex items-center gap-2">
                    <button
                      type="button"
                      onclick={() => openEdit(portfolio)}
                      class="rounded-full border border-neutral-200 px-3.5 py-1.5 text-xs font-medium text-neutral-700 transition hover:border-neutral-950 hover:text-neutral-950"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onclick={() => (deletingPortfolio = portfolio)}
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
        Belum ada data portofolio yang sesuai filter.
      </p>
      <button
        type="button"
        onclick={openCreate}
        class="mt-4 rounded-full bg-neutral-950 px-5 py-2 text-xs font-medium text-white"
      >
        Tambah Portofolio Pertama
      </button>
    </div>
  {/if}
</div>

<Modal
  open={modalOpen}
  title={editingPortfolio ? "Edit Portofolio" : "Tambah Portofolio Baru"}
  subtitle="Lengkapi studi kasus dan unggah dokumentasi proyek ke Cloudflare R2."
  maxWidthClass="max-w-3xl"
  onClose={() => {
    modalOpen = false;
    editingPortfolio = null;
  }}
>
  <PortfolioForm
    portfolio={editingPortfolio}
    services={data.services}
    onSaved={handleSaved}
    onCancel={() => {
      modalOpen = false;
      editingPortfolio = null;
    }}
  />
</Modal>

<Modal
  open={Boolean(deletingPortfolio)}
  title="Hapus Portofolio?"
  maxWidthClass="max-w-md"
  onClose={() => (deletingPortfolio = null)}
>
  {#if deletingPortfolio}
    <p class="text-sm leading-relaxed text-neutral-600">
      Anda yakin ingin menghapus portofolio <strong class="text-neutral-950"
        >{deletingPortfolio.title}</strong
      >? Gambar sampul dan galeri di Cloudflare R2 akan ikut dihapus.
    </p>
    <div class="mt-6 flex justify-end gap-2.5">
      <button
        type="button"
        onclick={() => (deletingPortfolio = null)}
        class="rounded-full border border-neutral-200 px-4 py-2 text-xs font-medium text-neutral-700"
      >
        Batal
      </button>
      <button
        type="button"
        disabled={busyId === deletingPortfolio.id}
        onclick={confirmDelete}
        class="rounded-full bg-red-600 px-5 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
      >
        {busyId === deletingPortfolio.id ? "Menghapus..." : "Ya, Hapus"}
      </button>
    </div>
  {/if}
</Modal>

<Toast
  message={toastMessage}
  variant={toastVariant}
  onDismiss={() => (toastMessage = null)}
/>
