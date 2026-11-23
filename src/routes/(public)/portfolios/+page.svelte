<script lang="ts">
  import PortfolioCard from "#lib/components/public/PortfolioCard.svelte";
  import type { PageData } from "./$types";

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
  let selectedCategory = $state<string>("Semua");
  let searchQuery = $state("");

  let categories = $derived.by(() => {
    const unique = new Set<string>();
    for (const item of data.portfolios) {
      unique.add(item.category);
    }
    return ["Semua", ...Array.from(unique)];
  });

  let filteredPortfolios = $derived.by(() => {
    const q = searchQuery.trim().toLowerCase();
    return data.portfolios.filter((item) => {
      const matchCategory =
        selectedCategory === "Semua" || item.category === selectedCategory;
      const matchSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.clientName.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q);
      return matchCategory && matchSearch;
    });
  });
</script>

<svelte:head>
  <title>Portofolio — {data.settings.companyName}</title>
  <meta
    name="description"
    content={`Studi kasus dan karya terbaik yang telah diselesaikan ${data.settings.companyName}.`}
  />
</svelte:head>

<section class="bg-white pt-20 pb-10 sm:pt-28">
  <div class="mx-auto max-w-6xl px-6">
    <div class="flex flex-col justify-between gap-8 md:flex-row md:items-end">
      <div class="max-w-2xl">
        <p
          class="text-xs font-semibold tracking-widest text-neutral-400 uppercase"
        >
          Portofolio
        </p>
        <h1
          class="mt-3 text-4xl font-semibold tracking-tight text-neutral-950 sm:text-5xl"
        >
          Karya nyata dengan dampak terukur.
        </h1>
      </div>

      <div class="w-full md:w-72">
        <label for="portfolio-search" class="sr-only">Cari portofolio</label>
        <input
          id="portfolio-search"
          type="search"
          bind:value={searchQuery}
          placeholder="Cari proyek atau klien..."
          class="w-full rounded-full border border-neutral-200 bg-surface px-5 py-2.5 text-sm text-neutral-950 placeholder:text-neutral-400 focus:border-neutral-950 focus:bg-white focus:outline-none"
        />
      </div>
    </div>

    {#if categories.length > 1}
      <div class="mt-8 flex flex-wrap gap-2">
        {#each categories as category (category)}
          <button
            type="button"
            onclick={() => (selectedCategory = category)}
            class="rounded-full px-4 py-1.5 text-xs font-medium transition {selectedCategory ===
            category
              ? 'bg-neutral-950 text-white'
              : 'border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400 hover:text-neutral-950'}"
          >
            {category}
          </button>
        {/each}
      </div>
    {/if}
  </div>
</section>

<section class="bg-white pt-6 pb-28">
  <div class="mx-auto max-w-6xl px-6">
    {#if filteredPortfolios.length > 0}
      <div class="grid gap-8 md:grid-cols-2">
        {#each filteredPortfolios as portfolio (portfolio.id)}
          <PortfolioCard {portfolio} />
        {/each}
      </div>
    {:else}
      <div
        class="rounded-3xl border border-neutral-200 bg-surface p-14 text-center"
      >
        <p class="text-sm text-neutral-500">
          Tidak ada portofolio yang sesuai dengan filter saat ini.
        </p>
      </div>
    {/if}
  </div>
</section>
