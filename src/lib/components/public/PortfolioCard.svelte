<script lang="ts">
  import type { Portfolio } from "#lib/server/db/schema";

  interface Props {
    portfolio: Portfolio;
  }

  let { portfolio }: Props = $props();

  let completedYear = $derived(
    portfolio.completedAt
      ? new Date(portfolio.completedAt).getFullYear()
      : null,
  );
</script>

<a
  href={`/portfolios/${portfolio.slug}`}
  class="group flex flex-col overflow-hidden rounded-3xl border border-neutral-200/80 bg-white transition duration-300 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-lg hover:shadow-neutral-950/5"
>
  <div class="relative aspect-16/10 w-full overflow-hidden bg-surface">
    {#if portfolio.imageUrl}
      <img
        src={portfolio.imageUrl}
        alt={portfolio.title}
        loading="lazy"
        class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
      />
    {:else}
      <div
        class="flex h-full w-full flex-col items-center justify-center p-6 text-center"
      >
        <span
          class="text-xs font-medium tracking-widest text-neutral-400 uppercase"
        >
          {portfolio.category}
        </span>
        <span
          class="mt-2 text-lg font-semibold tracking-tight text-neutral-700"
        >
          {portfolio.clientName}
        </span>
      </div>
    {/if}
    <div class="absolute top-4 left-4 flex items-center gap-2">
      <span
        class="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-neutral-900 backdrop-blur-md"
      >
        {portfolio.category}
      </span>
    </div>
  </div>

  <div class="flex flex-1 flex-col p-7">
    <div class="flex items-center justify-between text-xs text-neutral-400">
      <span class="font-medium text-neutral-600">{portfolio.clientName}</span>
      {#if completedYear}
        <span>{completedYear}</span>
      {/if}
    </div>

    <h3 class="mt-2.5 text-xl font-semibold tracking-tight text-neutral-950">
      {portfolio.title}
    </h3>

    <p class="mt-2.5 flex-1 text-sm leading-relaxed text-neutral-500">
      {portfolio.summary}
    </p>

    <div
      class="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-950"
    >
      <span>Baca studi kasus</span>
      <svg
        class="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
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
    </div>
  </div>
</a>
