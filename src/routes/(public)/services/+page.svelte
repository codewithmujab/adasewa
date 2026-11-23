<script lang="ts">
  import ServiceCard from "#lib/components/public/ServiceCard.svelte";
  import type { PageData } from "./$types";

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
  let searchQuery = $state("");

  let filteredServices = $derived.by(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return data.services;
    return data.services.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.shortDescription.toLowerCase().includes(q) ||
        (item.icon?.toLowerCase().includes(q) ?? false),
    );
  });
</script>

<svelte:head>
  <title>Layanan — {data.settings.companyName}</title>
  <meta
    name="description"
    content={`Daftar layanan profesional dari ${data.settings.companyName}.`}
  />
</svelte:head>

<section class="bg-white pt-20 pb-12 sm:pt-28">
  <div class="mx-auto max-w-6xl px-6">
    <div class="flex flex-col justify-between gap-8 md:flex-row md:items-end">
      <div class="max-w-2xl">
        <p
          class="text-xs font-semibold tracking-widest text-neutral-400 uppercase"
        >
          Layanan
        </p>
        <h1
          class="mt-3 text-4xl font-semibold tracking-tight text-neutral-950 sm:text-5xl"
        >
          Solusi yang dirancang untuk performa jangka panjang.
        </h1>
      </div>

      <div class="w-full md:w-72">
        <label for="service-search" class="sr-only">Cari layanan</label>
        <input
          id="service-search"
          type="search"
          bind:value={searchQuery}
          placeholder="Cari layanan..."
          class="w-full rounded-full border border-neutral-200 bg-surface px-5 py-2.5 text-sm text-neutral-950 placeholder:text-neutral-400 focus:border-neutral-950 focus:bg-white focus:outline-none"
        />
      </div>
    </div>
  </div>
</section>

<section class="bg-white pt-6 pb-28">
  <div class="mx-auto max-w-6xl px-6">
    {#if filteredServices.length > 0}
      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {#each filteredServices as service (service.id)}
          <ServiceCard {service} />
        {/each}
      </div>
    {:else}
      <div
        class="rounded-3xl border border-neutral-200 bg-surface p-14 text-center"
      >
        <p class="text-sm text-neutral-500">
          {searchQuery.trim()
            ? `Tidak ditemukan layanan yang cocok dengan "${searchQuery}".`
            : "Belum ada layanan yang tersedia."}
        </p>
      </div>
    {/if}
  </div>
</section>
