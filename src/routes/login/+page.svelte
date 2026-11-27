<script lang="ts">
	import { goto } from '$app/navigation';
	import { authClient } from '#lib/auth-client';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let mode = $state<'signin' | 'signup'>('signin');
	let name = $state('');
	let email = $state('');
	let password = $state('');
	let submitting = $state(false);
	let errorMessage = $state<string | null>(null);

	$effect(() => {
		mode = data.initialMode;
	});

	async function handleSubmit(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		errorMessage = null;
		submitting = true;

		try {
			if (mode === 'signup') {
				const result = await authClient.signUp.email({
					name: name.trim(),
					email: email.trim(),
					password
				});
				if (result.error) {
					errorMessage =
						result.error.message || 'Gagal mendaftarkan akun. Periksa kembali email Anda.';
					return;
				}
				await goto(data.redirectTo ?? '/akun', { refreshAll: true });
			} else {
				const result = await authClient.signIn.email({
					email: email.trim(),
					password
				});
				if (result.error) {
					errorMessage = result.error.message || 'Email atau kata sandi tidak valid.';
					return;
				}

				const userRole = (result.data?.user as { role?: string } | undefined)?.role;
				const defaultTarget =
					userRole === 'admin' || userRole === 'branch_admin' ? '/admin' : '/akun';
				await goto(data.redirectTo ?? defaultTarget, { refreshAll: true });
			}
		} catch {
			errorMessage = 'Tidak dapat terhubung ke server autentikasi. Coba lagi beberapa saat.';
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>{mode === 'signup' ? 'Daftar Akun' : 'Masuk'} — {data.companyName}</title>
</svelte:head>

<main class="flex min-h-screen flex-col items-center justify-center bg-black px-6 py-16 text-white">
	<div class="w-full max-w-md">
		<div class="mb-8 text-center">
			<a
				href="/"
				class="inline-flex flex-col items-center gap-3 text-base font-extrabold tracking-tight text-white"
			>
				<img
					src={data.logoUrl}
					alt={data.companyName}
					class="h-16 w-16 rounded-full object-cover shadow-xl ring-2 ring-white/25"
				/>
				<span>{data.companyName}</span>
			</a>
			<h1 class="mt-5 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
				{mode === 'signup' ? 'Buat Akun Pemesan' : 'Masuk ke Akun Anda'}
			</h1>
			<p class="mt-2 text-sm text-neutral-400">
				{mode === 'signup'
					? 'Daftar gratis untuk menyimpan transaksi sewa, status pembayaran, dan jadwal pengembalian barang.'
					: 'Pantau pesanan sewa, Rekening Poin, dan jadwal pengembalian barang Anda.'}
			</p>
		</div>

		<div class="rounded-[2.25rem] border border-white/15 bg-[#0c0c0f] p-7 shadow-2xl sm:p-8">
			<div class="mb-6 grid grid-cols-2 rounded-full border border-white/15 bg-black p-1 text-xs font-bold">
				<button
					type="button"
					onclick={() => {
						mode = 'signin';
						errorMessage = null;
					}}
					class="rounded-full py-2.5 transition {mode === 'signin'
						? 'bg-white text-black'
						: 'text-neutral-400 hover:text-white'}"
				>
					Masuk
				</button>
				<button
					type="button"
					onclick={() => {
						mode = 'signup';
						errorMessage = null;
					}}
					class="rounded-full py-2.5 transition {mode === 'signup'
						? 'bg-white text-black'
						: 'text-neutral-400 hover:text-white'}"
				>
					Daftar Pemesan
				</button>
			</div>

			{#if errorMessage}
				<div
					role="alert"
					class="mb-5 rounded-2xl border border-red-400/30 bg-red-500/15 px-4 py-3 text-sm text-red-200"
				>
					{errorMessage}
				</div>
			{/if}

			<form onsubmit={handleSubmit} class="space-y-4">
				{#if mode === 'signup'}
					<div>
						<label for="name" class="block text-xs font-semibold text-neutral-300">
							Nama Lengkap
						</label>
						<input
							id="name"
							type="text"
							required
							minlength="2"
							bind:value={name}
							placeholder="Nama sesuai KTP"
							autocomplete="name"
							class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-white focus:outline-none"
						/>
					</div>
				{/if}

				<div>
					<label for="email" class="block text-xs font-semibold text-neutral-300">Email</label>
					<input
						id="email"
						type="email"
						required
						bind:value={email}
						placeholder="nama@email.com"
						autocomplete="email"
						class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-white focus:outline-none"
					/>
				</div>

				<div>
					<label for="password" class="block text-xs font-semibold text-neutral-300">
						Kata Sandi
					</label>
					<input
						id="password"
						type="password"
						required
						minlength="8"
						bind:value={password}
						placeholder="Minimal 8 karakter"
						autocomplete={mode === 'signup' ? 'new-password' : 'current-password'}
						class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-white focus:outline-none"
					/>
				</div>

				<button
					type="submit"
					disabled={submitting}
					class="mt-2 inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-3.5 text-sm font-extrabold text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
				>
					{#if submitting}
						Memproses...
					{:else if mode === 'signup'}
						Daftar &amp; Masuk
					{:else}
						Masuk
					{/if}
				</button>
			</form>
		</div>

		<p class="mt-6 text-center text-xs text-neutral-400">
			<a href="/katalog" class="transition hover:text-white">← Kembali ke Katalog Barang</a>
		</p>
	</div>
</main>
