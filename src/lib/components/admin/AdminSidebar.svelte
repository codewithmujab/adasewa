<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { authClient } from "#lib/auth-client";

  interface Props {
    companyName: string;
    logoUrl?: string | null;
    userName: string;
    userEmail: string;
    isSuperAdmin?: boolean;
    branchName?: string | null;
    onNavigate?: () => void;
  }

  let {
    companyName,
    logoUrl = "/logo-adasewa.jpg",
    userName,
    userEmail,
    isSuperAdmin = true,
    branchName = null,
    onNavigate,
  }: Props = $props();
  let signingOut = $state(false);

  let links = $derived.by(() => {
    const base = [
      { href: "/admin", label: "Ringkasan", exact: true },
      { href: "/admin/orders", label: "Transaksi & Pengembalian", exact: false },
      {
        href: "/admin/catalog",
        label: isSuperAdmin ? "Katalog & Harga Cabang" : "Harga & Stok Cabang",
        exact: false,
      },
      { href: "/admin/promos", label: "Promo & Diskon", exact: false },
      {
        href: "/admin/branches",
        label: isSuperAdmin ? "Cabang & Kios" : "Info Cabang & Kios",
        exact: false,
      },
    ];

    if (isSuperAdmin) {
      return [
        ...base,
        { href: "/admin/points", label: "Rekening Poin", exact: false },
        { href: "/admin/services", label: "Paket Layanan", exact: false },
        { href: "/admin/portfolios", label: "Dokumentasi Acara", exact: false },
        { href: "/admin/settings", label: "Pengaturan Perusahaan", exact: false },
      ];
    }

    return base;
  });

  let pathname = $derived(page.url.pathname);

  function isActive(href: string, exact: boolean): boolean {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  async function handleSignOut(): Promise<void> {
    signingOut = true;
    try {
      await authClient.signOut();
      await goto("/login", { refreshAll: true });
    } finally {
      signingOut = false;
    }
  }
</script>

<div class="flex h-full flex-col justify-between bg-white px-5 py-6">
  <div>
    <a
      href="/admin"
      onclick={onNavigate}
      class="flex items-center gap-3 px-2 text-sm font-semibold tracking-tight text-neutral-950"
    >
      <img
        src={logoUrl || "/logo-adasewa.jpg"}
        alt={companyName}
        class="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-neutral-200/80"
      />
      <div class="min-w-0">
        <p class="truncate text-sm font-semibold text-neutral-950">
          {companyName}
        </p>
        <p class="truncate text-[11px] font-medium {isSuperAdmin ? 'text-neutral-500' : 'text-emerald-700'}">
          {isSuperAdmin ? "Owner · Semua Cabang" : `📍 ${branchName ?? "Admin Cabang"}`}
        </p>
      </div>
    </a>

    <nav aria-label="Menu admin" class="mt-8 space-y-1">
      {#each links as item (item.href)}
        <a
          href={item.href}
          onclick={onNavigate}
          class="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm transition {isActive(
            item.href,
            item.exact,
          )
            ? 'bg-neutral-950 font-medium text-white'
            : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950'}"
        >
          <span>{item.label}</span>
        </a>
      {/each}
    </nav>
  </div>

  <div class="space-y-3 border-t border-neutral-100 pt-5">
    <a
      href="/"
      target="_blank"
      rel="noopener noreferrer"
      class="flex items-center justify-between rounded-xl border border-neutral-200 px-3.5 py-2 text-xs font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50"
    >
      <span>Lihat Situs Publik</span>
      <span aria-hidden="true">↗</span>
    </a>

    <div class="rounded-2xl bg-surface px-3.5 py-3">
      <p class="truncate text-xs font-semibold text-neutral-950">{userName}</p>
      <p class="truncate text-[11px] text-neutral-500">{userEmail}</p>
      <button
        type="button"
        disabled={signingOut}
        onclick={handleSignOut}
        class="mt-3 w-full rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:border-neutral-950 hover:text-neutral-950 disabled:opacity-50"
      >
        {signingOut ? "Keluar..." : "Keluar"}
      </button>
    </div>
  </div>
</div>
