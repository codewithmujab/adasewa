<script lang="ts">
  import type { PortfolioMediaItem } from "#lib/server/db/schema";
  import type { PageData } from "./$types";

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
  let activeLightbox = $state<PortfolioMediaItem | null>(null);

  let formattedDate = $derived(
    data.portfolio.completedAt
      ? new Intl.DateTimeFormat("id-ID", {
          month: "long",
          year: "numeric",
        }).format(new Date(data.portfolio.completedAt))
      : null,
  );

  let paragraphs = $derived(
    data.portfolio.content
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0),
  );

  function handleKeydown(event: KeyboardEvent): void {
    if (activeLightbox && event.key === "Escape") {
      activeLightbox = null;
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
  <title>{data.portfolio.title} — {data.settings.companyName}</title>
  <meta name="description" content={data.portfolio.summary} />
</svelte:head>

<article class="bg-white pt-16 pb-28 sm:pt-24">
  <div class="mx-auto max-w-4xl px-6">
    <a
      href="/portfolios"
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
      Kembali ke Portofolio
    </a>

    <div class="mt-8 flex flex-wrap items-center gap-2.5">
      <span
        class="rounded-full bg-surface px-3.5 py-1 text-xs font-medium text-neutral-700"
      >
        {data.portfolio.category}
      </span>
      {#if data.relatedService}
        <a
          href={`/services/${data.relatedService.slug}`}
          class="rounded-full border border-neutral-200 px-3.5 py-1 text-xs font-medium text-neutral-600 transition hover:border-neutral-950 hover:text-neutral-950"
        >
          Layanan: {data.relatedService.title}
        </a>
      {/if}
    </div>

    <h1
      class="mt-5 text-4xl font-semibold tracking-tight text-neutral-950 sm:text-5xl"
    >
      {data.portfolio.title}
    </h1>
    <p class="mt-5 text-lg leading-relaxed text-neutral-500">
      {data.portfolio.summary}
    </p>

    <dl
      class="mt-10 grid grid-cols-2 gap-6 border-y border-neutral-200/80 py-6 sm:grid-cols-3"
    >
      <div>
        <dt
          class="text-xs font-medium tracking-wider text-neutral-400 uppercase"
        >
          Klien
        </dt>
        <dd class="mt-1.5 text-sm font-medium text-neutral-950">
          {data.portfolio.clientName}
        </dd>
      </div>
      {#if formattedDate}
        <div>
          <dt
            class="text-xs font-medium tracking-wider text-neutral-400 uppercase"
          >
            Selesai
          </dt>
          <dd class="mt-1.5 text-sm font-medium text-neutral-950">
            {formattedDate}
          </dd>
        </div>
      {/if}
      {#if data.portfolio.projectUrl}
        <div>
          <dt
            class="text-xs font-medium tracking-wider text-neutral-400 uppercase"
          >
            Tautan
          </dt>
          <dd class="mt-1.5">
            <a
              href={data.portfolio.projectUrl}
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1 text-sm font-medium text-neutral-950 underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-950"
            >
              Kunjungi Proyek
            </a>
          </dd>
        </div>
      {/if}
    </dl>

    {#if data.portfolio.imageUrl}
      <div
        class="mt-10 overflow-hidden rounded-3xl border border-neutral-200/80 bg-surface"
      >
        <img
          src={data.portfolio.imageUrl}
          alt={data.portfolio.title}
          class="aspect-video w-full object-cover"
        />
      </div>
    {/if}

    <div class="mt-12 space-y-6 text-base leading-8 text-neutral-600">
      {#each paragraphs as paragraph, idx (idx)}
        <p class="whitespace-pre-line">{paragraph}</p>
      {/each}
    </div>

    {#if data.portfolio.gallery.length > 0}
      <div class="mt-16">
        <h2 class="text-xl font-semibold tracking-tight text-neutral-950">
          Galeri Proyek
        </h2>
        <div class="mt-6 grid gap-4 sm:grid-cols-2">
          {#each data.portfolio.gallery as item (item.imageKey)}
            <button
              type="button"
              onclick={() => (activeLightbox = item)}
              class="group overflow-hidden rounded-2xl border border-neutral-200/80 bg-surface text-left"
            >
              <img
                src={item.imageUrl}
                alt={item.alt || data.portfolio.title}
                loading="lazy"
                class="aspect-16/10 w-full object-cover transition duration-500 group-hover:scale-105"
              />
              {#if item.alt}
                <p class="px-4 py-2.5 text-xs text-neutral-500">{item.alt}</p>
              {/if}
            </button>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</article>

{#if activeLightbox}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/85 p-6 backdrop-blur-sm"
    role="dialog"
    aria-modal="true"
    aria-label="Pratinjau gambar galeri"
  >
    <button
      type="button"
      aria-label="Tutup pratinjau"
      onclick={() => (activeLightbox = null)}
      class="fixed inset-0 cursor-default"
    ></button>
    <div class="relative z-10 max-h-[90vh] max-w-5xl">
      <img
        src={activeLightbox.imageUrl}
        alt={activeLightbox.alt || data.portfolio.title}
        class="max-h-[82vh] rounded-2xl object-contain"
      />
      <div
        class="mt-3 flex items-center justify-between text-sm text-neutral-300"
      >
        <span>{activeLightbox.alt || data.portfolio.title}</span>
        <button
          type="button"
          onclick={() => (activeLightbox = null)}
          class="rounded-full bg-white/15 px-4 py-1.5 text-xs font-medium text-white hover:bg-white/25"
        >
          Tutup
        </button>
      </div>
    </div>
  </div>
{/if}
