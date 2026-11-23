<script lang="ts">
  import type { CompanySettings } from "#lib/server/db/schema";

  interface Props {
    settings: CompanySettings;
  }

  let { settings }: Props = $props();

  const currentYear = new Date().getFullYear();

  let socialEntries = $derived.by(() => {
    const entries: Array<{ label: string; href: string }> = [];
    const links = settings.socialLinks;
    if (links.instagram)
      entries.push({ label: "Instagram", href: links.instagram });
    if (links.linkedin)
      entries.push({ label: "LinkedIn", href: links.linkedin });
    if (links.x) entries.push({ label: "X", href: links.x });
    if (links.youtube) entries.push({ label: "YouTube", href: links.youtube });
    if (links.github) entries.push({ label: "GitHub", href: links.github });
    if (links.whatsapp)
      entries.push({ label: "WhatsApp", href: links.whatsapp });
    return entries;
  });
</script>

<footer class="border-t border-neutral-200/80 bg-surface">
  <div class="mx-auto max-w-6xl px-6 py-16">
    <div class="grid gap-12 md:grid-cols-12">
      <div class="md:col-span-5">
        <div class="flex items-center gap-3">
          {#if settings.logoUrl}
            <img
              src={settings.logoUrl}
              alt={settings.companyName}
              class="h-8 w-8 rounded-lg object-cover"
            />
          {:else}
            <span
              class="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-950 text-xs font-semibold text-white"
            >
              {settings.companyName.slice(0, 2).toUpperCase()}
            </span>
          {/if}
          <span class="text-sm font-semibold tracking-tight text-neutral-950">
            {settings.companyName}
          </span>
        </div>
        <p class="mt-4 max-w-sm text-sm leading-relaxed text-neutral-500">
          {settings.tagline}
        </p>
      </div>

      <div class="md:col-span-3">
        <h3
          class="text-xs font-semibold tracking-wider text-neutral-950 uppercase"
        >
          Navigasi
        </h3>
        <ul class="mt-4 space-y-2.5 text-sm text-neutral-600">
          <li>
            <a href="/" class="transition hover:text-neutral-950">Beranda</a>
          </li>
          <li>
            <a href="/about" class="transition hover:text-neutral-950"
              >Tentang Perusahaan</a
            >
          </li>
          <li>
            <a href="/services" class="transition hover:text-neutral-950"
              >Layanan</a
            >
          </li>
          <li>
            <a href="/portfolios" class="transition hover:text-neutral-950"
              >Portofolio</a
            >
          </li>
        </ul>
      </div>

      <div class="md:col-span-4">
        <h3
          class="text-xs font-semibold tracking-wider text-neutral-950 uppercase"
        >
          Kontak
        </h3>
        <ul class="mt-4 space-y-2.5 text-sm text-neutral-600">
          <li>
            <a
              href={`mailto:${settings.email}`}
              class="transition hover:text-neutral-950"
            >
              {settings.email}
            </a>
          </li>
          {#if settings.phone}
            <li>
              <a
                href={`tel:${settings.phone}`}
                class="transition hover:text-neutral-950"
              >
                {settings.phone}
              </a>
            </li>
          {/if}
          {#if settings.address}
            <li class="leading-relaxed text-neutral-500">{settings.address}</li>
          {/if}
        </ul>

        {#if socialEntries.length > 0}
          <div class="mt-5 flex flex-wrap gap-2">
            {#each socialEntries as item (item.label)}
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                class="rounded-full border border-neutral-300/80 bg-white px-3 py-1 text-xs font-medium text-neutral-700 transition hover:border-neutral-950 hover:text-neutral-950"
              >
                {item.label}
              </a>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <div
      class="mt-14 flex flex-col items-start justify-between gap-4 border-t border-neutral-200 pt-6 text-xs text-neutral-500 sm:flex-row sm:items-center"
    >
      <p>
        &copy; {currentYear}
        {settings.companyName}. Seluruh hak cipta dilindungi.
      </p>
      <a href="/admin" class="transition hover:text-neutral-900"
        >Portal Admin CMS</a
      >
    </div>
  </div>
</footer>
