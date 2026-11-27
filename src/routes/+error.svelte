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
	<title>{status} — Adasewa.id</title>
</svelte:head>

<main
	class="flex min-h-screen flex-col items-center justify-center bg-black px-6 py-24 text-center text-white"
>
	<div class="w-full max-w-lg rounded-[2.5rem] border border-white/15 bg-[#0c0c0f] p-10 sm:p-12">
		<span
			class="rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-extrabold tracking-widest text-neutral-200 uppercase"
		>
			Error {status}
		</span>
		<h1 class="mt-6 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
			{status === 404 ? 'Halaman tidak ditemukan.' : 'Terjadi kesalahan.'}
		</h1>
		<p class="mt-4 text-sm leading-relaxed text-neutral-400 sm:text-base">
			{message}
		</p>
		<div class="mt-9 flex flex-wrap items-center justify-center gap-3">
			<a
				href="/"
				class="inline-flex items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-extrabold text-black transition hover:bg-neutral-200"
			>
				Kembali ke Beranda
			</a>
			<a
				href="/katalog"
				class="inline-flex items-center justify-center rounded-full border border-white/20 bg-black px-7 py-3 text-sm font-bold text-white transition hover:border-white hover:bg-white/10"
			>
				Lihat Katalog
			</a>
		</div>
	</div>
</main>
