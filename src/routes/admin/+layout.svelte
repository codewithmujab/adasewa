<script lang="ts">
  import type { Snippet } from "svelte";
  import AdminSidebar from "#lib/components/admin/AdminSidebar.svelte";
  import type { LayoutData } from "./$types";

  interface Props {
    data: LayoutData;
    children: Snippet;
  }

  let { data, children }: Props = $props();
  let mobileDrawerOpen = $state(false);
</script>

<div class="min-h-screen bg-surface text-neutral-950 lg:flex">
  <!-- Sidebar Desktop -->
  <aside
    class="hidden w-64 shrink-0 border-r border-neutral-200/80 bg-white lg:sticky lg:top-0 lg:block lg:h-screen"
  >
    <AdminSidebar
      companyName={data.companyName}
      userName={data.user.name}
      userEmail={data.user.email}
      isSuperAdmin={data.isSuperAdmin}
      branchName={data.assignedBranch?.name ?? null}
    />
  </aside>

  <!-- Header Mobile -->
  <header
    class="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-neutral-200/80 bg-white/90 px-4 backdrop-blur-md lg:hidden"
  >
    <a
      href="/admin"
      class="text-sm font-semibold tracking-tight text-neutral-950"
    >
      {data.companyName} · CMS
    </a>
    <button
      type="button"
      onclick={() => (mobileDrawerOpen = !mobileDrawerOpen)}
      aria-label="Buka menu admin"
      class="rounded-full p-2 text-neutral-600 hover:bg-neutral-100"
    >
      <svg
        class="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M4 7h16M4 12h16M4 17h16"
        />
      </svg>
    </button>
  </header>

  {#if mobileDrawerOpen}
    <div class="fixed inset-0 z-40 flex lg:hidden">
      <button
        type="button"
        aria-label="Tutup sidebar"
        onclick={() => (mobileDrawerOpen = false)}
        class="fixed inset-0 bg-neutral-950/40 backdrop-blur-xs"
      ></button>
      <div class="relative z-10 h-full w-72 max-w-[85vw] bg-white shadow-xl">
        <AdminSidebar
          companyName={data.companyName}
          userName={data.user.name}
          userEmail={data.user.email}
          isSuperAdmin={data.isSuperAdmin}
          branchName={data.assignedBranch?.name ?? null}
          onNavigate={() => (mobileDrawerOpen = false)}
        />
      </div>
    </div>
  {/if}

  <main class="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
    <div class="mx-auto max-w-5xl">
      {@render children()}
    </div>
  </main>
</div>
