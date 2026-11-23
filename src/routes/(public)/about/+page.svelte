<script lang="ts">
  import type { PageData } from "./$types";

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let paragraphs = $derived(
    data.settings.aboutFull
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0),
  );
</script>

<svelte:head>
  <title>Tentang — {data.settings.companyName}</title>
  <meta name="description" content={data.settings.aboutShort} />
</svelte:head>

<section class="bg-white pt-20 pb-20 sm:pt-28">
  <div class="mx-auto max-w-4xl px-6">
    <p class="text-xs font-semibold tracking-widest text-neutral-400 uppercase">
      Tentang Perusahaan
    </p>
    <h1
      class="mt-4 text-4xl font-semibold tracking-tight text-neutral-950 sm:text-5xl sm:leading-[1.08]"
    >
      {data.settings.companyName}
    </h1>
    <p class="mt-6 text-xl leading-relaxed text-neutral-500">
      {data.settings.tagline}
    </p>

    {#if data.settings.imageUrl}
      <div
        class="mt-12 overflow-hidden rounded-3xl border border-neutral-200/80 bg-surface"
      >
        <img
          src={data.settings.imageUrl}
          alt={data.settings.companyName}
          class="aspect-video w-full object-cover"
        />
      </div>
    {/if}

    <div class="mt-14 space-y-6 text-base leading-8 text-neutral-600">
      {#each paragraphs as paragraph, idx (idx)}
        <p>{paragraph}</p>
      {/each}
    </div>
  </div>
</section>

{#if data.settings.vision || data.settings.mission}
  <section class="border-t border-neutral-100 bg-surface py-20 sm:py-24">
    <div class="mx-auto max-w-6xl px-6">
      <div class="grid gap-6 md:grid-cols-2">
        {#if data.settings.vision}
          <div class="rounded-3xl border border-neutral-200/70 bg-white p-10">
            <p
              class="text-xs font-semibold tracking-widest text-neutral-400 uppercase"
            >
              Visi
            </p>
            <p
              class="mt-4 text-lg leading-relaxed font-medium text-neutral-900"
            >
              {data.settings.vision}
            </p>
          </div>
        {/if}

        {#if data.settings.mission}
          <div class="rounded-3xl border border-neutral-200/70 bg-white p-10">
            <p
              class="text-xs font-semibold tracking-widest text-neutral-400 uppercase"
            >
              Misi
            </p>
            <p
              class="mt-4 text-base leading-relaxed whitespace-pre-line text-neutral-600"
            >
              {data.settings.mission}
            </p>
          </div>
        {/if}
      </div>
    </div>
  </section>
{/if}

<section class="bg-white py-20 sm:py-24">
  <div class="mx-auto max-w-6xl px-6">
    <div
      class="grid gap-8 rounded-3xl border border-neutral-200/80 bg-surface p-10 md:grid-cols-3"
    >
      <div>
        <p
          class="text-xs font-semibold tracking-widest text-neutral-400 uppercase"
        >
          Email
        </p>
        <a
          href={`mailto:${data.settings.email}`}
          class="mt-2 block text-base font-medium text-neutral-950 hover:underline"
        >
          {data.settings.email}
        </a>
      </div>

      {#if data.settings.phone}
        <div>
          <p
            class="text-xs font-semibold tracking-widest text-neutral-400 uppercase"
          >
            Telepon
          </p>
          <a
            href={`tel:${data.settings.phone}`}
            class="mt-2 block text-base font-medium text-neutral-950 hover:underline"
          >
            {data.settings.phone}
          </a>
        </div>
      {/if}

      {#if data.settings.address}
        <div>
          <p
            class="text-xs font-semibold tracking-widest text-neutral-400 uppercase"
          >
            Kantor
          </p>
          <p class="mt-2 text-sm leading-relaxed text-neutral-600">
            {data.settings.address}
          </p>
        </div>
      {/if}
    </div>
  </div>
</section>
