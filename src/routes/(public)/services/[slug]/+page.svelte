<script lang="ts">
  import PortfolioCard from "#lib/components/public/PortfolioCard.svelte";
  import type { PageData } from "./$types";

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let paragraphs = $derived(
    data.service.description
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0),
  );
</script>

<svelte:head>
  <title>{data.service.title} — {data.settings.companyName}</title>
  <meta name="description" content={data.service.shortDescription} />
</svelte:head>

<article class="bg-white pt-16 pb-24 sm:pt-24">
  <div class="mx-auto max-w-4xl px-6">
    <a
      href="/services"
      class="inline-flex items-center gap-1.5 text-sm text-neutral-500 transition hover:text-neutral-950"
    >
      <svg
        class="h-4 w-4"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fill-rule="evenodd"
          d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
          clip-rule="evenodd"
        />
      </svg>
      Kembali ke Layanan
    </a>

    <div class="mt-8 flex flex-wrap items-center gap-3">
      {#if data.service.icon}
        <span
          class="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium tracking-wider text-neutral-600 uppercase"
        >
          {data.service.icon}
        </span>
      {/if}
      {#if data.service.isFeatured}
        <span
          class="rounded-full bg-neutral-950 px-3 py-1 text-xs font-medium text-white"
        >
          Layanan Unggulan
        </span>
      {/if}
    </div>

    <h1
      class="mt-5 text-4xl font-semibold tracking-tight text-neutral-950 sm:text-5xl"
    >
      {data.service.title}
    </h1>
    <p class="mt-5 text-lg leading-relaxed text-neutral-500">
      {data.service.shortDescription}
    </p>

    {#if data.service.imageUrl}
      <div
        class="mt-10 overflow-hidden rounded-3xl border border-neutral-200/80 bg-surface"
      >
        <img
          src={data.service.imageUrl}
          alt={data.service.title}
          class="aspect-video w-full object-cover"
        />
      </div>
    {/if}

    <div class="mt-12 space-y-6 text-base leading-8 text-neutral-600">
      {#each paragraphs as paragraph, idx (idx)}
        <p class="whitespace-pre-line">{paragraph}</p>
      {/each}
    </div>

    <div
      class="mt-14 rounded-3xl border border-neutral-200 bg-surface p-8 sm:p-10"
    >
      <h2 class="text-xl font-semibold tracking-tight text-neutral-950">
        Tertarik dengan layanan {data.service.title}?
      </h2>
      <p class="mt-2 text-sm leading-relaxed text-neutral-500">
        Hubungi tim kami untuk sesi konsultasi kebutuhan, estimasi timeline, dan
        arsitektur terbaik.
      </p>
      <div class="mt-6 flex flex-wrap gap-3">
        <a
          href={`mailto:${data.settings.email}?subject=${encodeURIComponent(`Konsultasi Layanan: ${data.service.title}`)}`}
          class="inline-flex items-center justify-center rounded-full bg-neutral-950 px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
        >
          Hubungi Tim Kami
        </a>
      </div>
    </div>
  </div>
</article>

{#if data.relatedPortfolios.length > 0}
  <section class="border-t border-neutral-100 bg-surface py-20">
    <div class="mx-auto max-w-6xl px-6">
      <h2 class="text-2xl font-semibold tracking-tight text-neutral-950">
        Portofolio Terkait
      </h2>
      <div class="mt-8 grid gap-8 md:grid-cols-2">
        {#each data.relatedPortfolios as portfolio (portfolio.id)}
          <PortfolioCard {portfolio} />
        {/each}
      </div>
    </div>
  </section>
{/if}
