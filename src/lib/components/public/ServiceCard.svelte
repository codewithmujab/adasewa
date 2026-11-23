<script lang="ts">
  import type { Service } from "#lib/server/db/schema";

  interface Props {
    service: Service;
  }

  let { service }: Props = $props();
</script>

<a
  href={`/services/${service.slug}`}
  class="group flex flex-col overflow-hidden rounded-3xl border border-neutral-200/80 bg-white transition duration-300 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-lg hover:shadow-neutral-950/5"
>
  {#if service.imageUrl}
    <div class="aspect-16/10 w-full overflow-hidden bg-surface">
      <img
        src={service.imageUrl}
        alt={service.title}
        loading="lazy"
        class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
      />
    </div>
  {:else}
    <div
      class="flex aspect-16/10 w-full items-center justify-center bg-surface text-neutral-400"
    >
      <span
        class="rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-xs font-medium tracking-wider text-neutral-600 uppercase"
      >
        {service.icon || "Layanan"}
      </span>
    </div>
  {/if}

  <div class="flex flex-1 flex-col p-7">
    <div class="flex items-center justify-between gap-2">
      {#if service.icon}
        <span
          class="text-xs font-medium tracking-wide text-neutral-400 uppercase"
        >
          {service.icon}
        </span>
      {:else}
        <span
          class="text-xs font-medium tracking-wide text-neutral-400 uppercase"
          >Solusi</span
        >
      {/if}
      {#if service.isFeatured}
        <span
          class="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-medium text-neutral-700"
        >
          Unggulan
        </span>
      {/if}
    </div>

    <h3 class="mt-3 text-xl font-semibold tracking-tight text-neutral-950">
      {service.title}
    </h3>

    <p class="mt-2.5 flex-1 text-sm leading-relaxed text-neutral-500">
      {service.shortDescription}
    </p>

    <div
      class="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-950"
    >
      <span>Pelajari selengkapnya</span>
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
