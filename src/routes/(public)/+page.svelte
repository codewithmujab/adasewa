<script lang="ts">
  import HeroSection from "#lib/components/public/HeroSection.svelte";
  import PortfolioCard from "#lib/components/public/PortfolioCard.svelte";
  import ServiceCard from "#lib/components/public/ServiceCard.svelte";
  import type { PageData } from "./$types";

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let pageTitle = $derived(
    data.settings.metaTitle ||
      `${data.settings.companyName} — ${data.settings.tagline}`,
  );
  let pageDescription = $derived(
    data.settings.metaDescription || data.settings.aboutShort,
  );
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />
</svelte:head>

<HeroSection
  settings={data.settings}
  serviceCount={data.serviceCount}
  portfolioCount={data.portfolioCount}
/>

<!-- Layanan Unggulan -->
<section class="border-t border-neutral-100 bg-surface py-24 sm:py-32">
  <div class="mx-auto max-w-6xl px-6">
    <div class="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
      <div class="max-w-2xl">
        <p
          class="text-xs font-semibold tracking-widest text-neutral-400 uppercase"
        >
          Layanan
        </p>
        <h2
          class="mt-3 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl"
        >
          Kapabilitas inti untuk mempercepat pertumbuhan bisnis.
        </h2>
      </div>
      <a
        href="/services"
        class="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-950 transition hover:text-neutral-600"
      >
        Semua layanan
        <svg
          class="h-4 w-4"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fill-rule="evenodd"
            d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
            clip-rule="evenodd"
          />
        </svg>
      </a>
    </div>

    {#if data.featuredServices.length > 0}
      <div class="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {#each data.featuredServices as service (service.id)}
          <ServiceCard {service} />
        {/each}
      </div>
    {:else}
      <div
        class="mt-14 rounded-3xl border border-neutral-200 bg-white p-12 text-center"
      >
        <p class="text-sm text-neutral-500">
          Belum ada layanan yang dipublikasikan. Tambahkan layanan pertama
          melalui Dashboard CMS.
        </p>
      </div>
    {/if}
  </div>
</section>

<!-- Portofolio Pilihan -->
<section class="bg-white py-24 sm:py-32">
  <div class="mx-auto max-w-6xl px-6">
    <div class="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
      <div class="max-w-2xl">
        <p
          class="text-xs font-semibold tracking-widest text-neutral-400 uppercase"
        >
          Portofolio
        </p>
        <h2
          class="mt-3 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl"
        >
          Karya terpilih bersama mitra terdepan.
        </h2>
      </div>
      <a
        href="/portfolios"
        class="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-950 transition hover:text-neutral-600"
      >
        Semua portofolio
        <svg
          class="h-4 w-4"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fill-rule="evenodd"
            d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
            clip-rule="evenodd"
          />
        </svg>
      </a>
    </div>

    {#if data.featuredPortfolios.length > 0}
      <div class="mt-14 grid gap-8 md:grid-cols-2">
        {#each data.featuredPortfolios as portfolio (portfolio.id)}
          <PortfolioCard {portfolio} />
        {/each}
      </div>
    {:else}
      <div
        class="mt-14 rounded-3xl border border-neutral-200 bg-surface p-12 text-center"
      >
        <p class="text-sm text-neutral-500">
          Belum ada portofolio yang dipublikasikan. Kelola proyek Anda melalui
          Dashboard CMS.
        </p>
      </div>
    {/if}
  </div>
</section>

<!-- Tentang Singkat & CTA -->
<section class="border-t border-neutral-100 bg-white pb-24 sm:pb-32">
  <div class="mx-auto max-w-6xl px-6">
    <div
      class="rounded-3xl bg-neutral-950 px-8 py-16 text-white sm:px-14 sm:py-20"
    >
      <div class="grid items-center gap-10 lg:grid-cols-12">
        <div class="lg:col-span-8">
          <p
            class="text-xs font-semibold tracking-widest text-neutral-400 uppercase"
          >
            Mulai Kolaborasi
          </p>
          <h2 class="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Siap mewujudkan inisiatif digital Anda berikutnya?
          </h2>
          <p class="mt-4 max-w-2xl text-base leading-relaxed text-neutral-300">
            {data.settings.vision || data.settings.aboutShort}
          </p>
        </div>
        <div class="flex flex-wrap gap-3 lg:col-span-4 lg:justify-end">
          <a
            href={`mailto:${data.settings.email}`}
            class="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-medium text-neutral-950 transition hover:bg-neutral-200"
          >
            Diskusikan Proyek
          </a>
          <a
            href="/about"
            class="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Tentang Kami
          </a>
        </div>
      </div>
    </div>
  </div>
</section>
