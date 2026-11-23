<script lang="ts">
  import type { CompanySettings } from "#lib/server/db/schema";

  interface Props {
    settings: CompanySettings;
    serviceCount: number;
    portfolioCount: number;
  }

  let { settings, serviceCount, portfolioCount }: Props = $props();
</script>

<section
  class="relative overflow-hidden bg-white pt-20 pb-24 sm:pt-28 sm:pb-32"
>
  <div class="mx-auto max-w-6xl px-6">
    <div class="mx-auto max-w-3xl text-center">
      <span
        class="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-1.5 text-xs font-medium tracking-wide text-neutral-600"
      >
        <span class="h-1.5 w-1.5 rounded-full bg-neutral-950"></span>
        {settings.companyName}
      </span>

      <h1
        class="mt-8 text-4xl font-semibold tracking-tight text-neutral-950 sm:text-6xl sm:leading-[1.06]"
      >
        {settings.tagline}
      </h1>

      <p
        class="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-neutral-500 sm:text-lg"
      >
        {settings.aboutShort}
      </p>

      <div class="mt-10 flex flex-wrap items-center justify-center gap-3">
        <a
          href="/services"
          class="inline-flex items-center gap-2 rounded-full bg-neutral-950 px-7 py-3.5 text-sm font-medium text-white transition hover:bg-neutral-800"
        >
          Jelajahi Layanan
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
        <a
          href="/portfolios"
          class="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-7 py-3.5 text-sm font-medium text-neutral-900 transition hover:border-neutral-300 hover:bg-neutral-50"
        >
          Lihat Portofolio
        </a>
      </div>
    </div>

    {#if settings.imageUrl}
      <div
        class="mt-16 overflow-hidden rounded-3xl border border-neutral-200/80 bg-surface shadow-sm"
      >
        <img
          src={settings.imageUrl}
          alt={settings.companyName}
          class="aspect-21/9 w-full object-cover"
        />
      </div>
    {:else}
      <div
        class="mt-16 grid grid-cols-1 gap-4 rounded-3xl border border-neutral-200/80 bg-surface p-8 sm:grid-cols-3 sm:p-10"
      >
        <div class="rounded-2xl bg-white p-6">
          <p
            class="text-xs font-medium tracking-wider text-neutral-400 uppercase"
          >
            Layanan Aktif
          </p>
          <p
            class="mt-2 text-3xl font-semibold tracking-tight text-neutral-950"
          >
            {serviceCount > 0 ? `${serviceCount}+` : "End-to-End"}
          </p>
          <p class="mt-1 text-sm text-neutral-500">
            Solusi terukur dari riset hingga produksi.
          </p>
        </div>
        <div class="rounded-2xl bg-white p-6">
          <p
            class="text-xs font-medium tracking-wider text-neutral-400 uppercase"
          >
            Studi Kasus
          </p>
          <p
            class="mt-2 text-3xl font-semibold tracking-tight text-neutral-950"
          >
            {portfolioCount > 0 ? `${portfolioCount}+` : "Terbukti"}
          </p>
          <p class="mt-1 text-sm text-neutral-500">
            Dipercaya oleh tim bisnis dan enterprise.
          </p>
        </div>
        <div class="rounded-2xl bg-white p-6">
          <p
            class="text-xs font-medium tracking-wider text-neutral-400 uppercase"
          >
            Arsitektur
          </p>
          <p
            class="mt-2 text-3xl font-semibold tracking-tight text-neutral-950"
          >
            Global Edge
          </p>
          <p class="mt-1 text-sm text-neutral-500">
            Cepat, aman, dan selalu siap bertumbuh.
          </p>
        </div>
      </div>
    {/if}
  </div>
</section>
