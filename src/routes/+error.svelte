<script lang="ts">
	import { page } from '$app/state';

	let status = $derived(page.status);
	let message = $derived(
		page.error?.message ??
			(status === 404
				? 'Halaman yang Anda cari tidak ditemukan atau telah dipindahkan.'
				: 'Terjadi kendala saat memuat halaman ini.')
	);
</script>

<svelte:head>
	<title>{status} — Company Profile</title>
</svelte:head>

<main class="flex min-h-screen flex-col items-center justify-center bg-white px-6 py-24 text-center">
	<span
		class="rounded-full border border-neutral-200 bg-neutral-50 px-3.5 py-1 text-xs font-medium tracking-widest text-neutral-500 uppercase"
	>
		Error {status}
	</span>
	<h1 class="mt-6 max-w-xl text-4xl font-semibold tracking-tight text-neutral-950 sm:text-5xl">
		{status === 404 ? 'Halaman tidak ditemukan.' : 'Terjadi kesalahan.'}
	</h1>
	<p class="mt-4 max-w-md text-base leading-relaxed text-neutral-500">
		{message}
	</p>
	<div class="mt-10 flex flex-wrap items-center justify-center gap-3">
		<a
			href="/"
			class="inline-flex items-center justify-center rounded-full bg-neutral-950 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
		>
			Kembali ke Beranda
		</a>
		<a
			href="/services"
			class="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-6 py-2.5 text-sm font-medium text-neutral-800 transition hover:border-neutral-300 hover:bg-neutral-50"
		>
			Lihat Layanan
		</a>
	</div>
</main>
