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

<main class="flex min-h-screen flex-col items-center justify-center bg-surface px-6 py-16">
	<div class="w-full max-w-md">
		<div class="mb-8 text-center">
			<a
				href="/"
				class="inline-flex items-center gap-2.5 text-sm font-bold tracking-tight text-neutral-950"
			>
				<span
					class="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-950 text-xs font-bold text-white"
				>
					AS
				</span>
				<span>{data.companyName}</span>
			</a>
			<h1 class="mt-6 text-2xl font-bold tracking-tight text-neutral-950">
				{mode === 'signup' ? 'Buat Akun Pemesan' : 'Masuk ke Akun Anda'}
			</h1>
			<p class="mt-2 text-sm text-neutral-500">
				{mode === 'signup'
					? 'Daftar gratis untuk menyimpan transaksi sewa, status pembayaran, dan jadwal pengembalian barang.'
					: 'Pantau pesanan sewa, Rekening Poin, dan jadwal pengembalian barang Anda.'}
			</p>
		</div>

		<div class="rounded-3xl border border-neutral-200/80 bg-white p-8 shadow-sm">
			<div class="mb-6 grid grid-cols-2 rounded-full bg-surface p-1 text-xs font-semibold">
				<button
					type="button"
					onclick={() => {
						mode = 'signin';
						errorMessage = null;
					}}
					class="rounded-full py-2.5 transition {mode === 'signin'
						? 'bg-white text-neutral-950 shadow-xs'
						: 'text-neutral-500 hover:text-neutral-900'}"
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
						? 'bg-white text-neutral-950 shadow-xs'
						: 'text-neutral-500 hover:text-neutral-900'}"
				>
					Daftar Pemesan
				</button>
			</div>

			{#if errorMessage}
				<div
					role="alert"
					class="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
				>
					{errorMessage}
				</div>
			{/if}

			<form onsubmit={handleSubmit} class="space-y-4">
				{#if mode === 'signup'}
					<div>
						<label for="name" class="block text-xs font-semibold text-neutral-700">
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
							class="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-950 placeholder:text-neutral-400 focus:border-neutral-950 focus:outline-none"
						/>
					</div>
				{/if}

				<div>
					<label for="email" class="block text-xs font-semibold text-neutral-700">Email</label>
					<input
						id="email"
						type="email"
						required
						bind:value={email}
						placeholder="nama@email.com"
						autocomplete="email"
						class="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-950 placeholder:text-neutral-400 focus:border-neutral-950 focus:outline-none"
					/>
				</div>

				<div>
					<label for="password" class="block text-xs font-semibold text-neutral-700">
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
						class="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-950 placeholder:text-neutral-400 focus:border-neutral-950 focus:outline-none"
					/>
				</div>

				<button
					type="submit"
					disabled={submitting}
					class="mt-2 inline-flex w-full items-center justify-center rounded-full bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
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

		<p class="mt-6 text-center text-xs text-neutral-500">
			<a href="/katalog" class="transition hover:text-neutral-950">← Kembali ke Katalog Barang</a>
		</p>
	</div>
</main>
