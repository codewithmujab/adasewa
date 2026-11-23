<script lang="ts">
  import { goto } from "$app/navigation";
  import { authClient } from "#lib/auth-client";
  import type { PageData } from "./$types";

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let mode = $state<"signin" | "signup">("signin");
  let name = $state("");
  let email = $state("");
  let password = $state("");
  let submitting = $state(false);
  let errorMessage = $state<string | null>(null);

  $effect(() => {
    if (!data.hasAnyAdmin && data.allowSignup) {
      mode = "signup";
    }
  });

  async function handleSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    errorMessage = null;
    submitting = true;

    try {
      if (mode === "signup") {
        if (!data.allowSignup) {
          errorMessage = "Registrasi admin dinonaktifkan.";
          return;
        }
        const result = await authClient.signUp.email({
          name: name.trim(),
          email: email.trim(),
          password,
        });
        if (result.error) {
          errorMessage =
            result.error.message || "Gagal mendaftarkan akun admin.";
          return;
        }
      } else {
        const result = await authClient.signIn.email({
          email: email.trim(),
          password,
        });
        if (result.error) {
          errorMessage =
            result.error.message || "Email atau kata sandi tidak valid.";
          return;
        }
      }

      await goto(data.redirectTo, { refreshAll: true });
    } catch {
      errorMessage =
        "Tidak dapat terhubung ke server autentikasi. Coba lagi beberapa saat.";
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>Login Admin — {data.companyName}</title>
</svelte:head>

<main
  class="flex min-h-screen flex-col items-center justify-center bg-surface px-6 py-16"
>
  <div class="w-full max-w-md">
    <div class="mb-8 text-center">
      <a
        href="/"
        class="inline-flex items-center gap-2.5 text-sm font-semibold tracking-tight text-neutral-950"
      >
        <span
          class="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-950 text-xs font-semibold text-white"
        >
          {data.companyName.slice(0, 2).toUpperCase()}
        </span>
        <span>{data.companyName}</span>
      </a>
      <h1 class="mt-6 text-2xl font-semibold tracking-tight text-neutral-950">
        {mode === "signup" ? "Buat Akun Admin" : "Masuk ke Dashboard CMS"}
      </h1>
      <p class="mt-2 text-sm text-neutral-500">
        {mode === "signup"
          ? "Daftarkan akun administrator untuk mulai mengelola konten perusahaan."
          : "Kelola layanan, portofolio, media R2, dan profil perusahaan."}
      </p>
    </div>

    <div
      class="rounded-3xl border border-neutral-200/80 bg-white p-8 shadow-sm"
    >
      {#if data.allowSignup}
        <div
          class="mb-6 grid grid-cols-2 rounded-full bg-surface p-1 text-xs font-medium"
        >
          <button
            type="button"
            onclick={() => {
              mode = "signin";
              errorMessage = null;
            }}
            class="rounded-full py-2 transition {mode === 'signin'
              ? 'bg-white text-neutral-950 shadow-xs'
              : 'text-neutral-500 hover:text-neutral-900'}"
          >
            Masuk
          </button>
          <button
            type="button"
            onclick={() => {
              mode = "signup";
              errorMessage = null;
            }}
            class="rounded-full py-2 transition {mode === 'signup'
              ? 'bg-white text-neutral-950 shadow-xs'
              : 'text-neutral-500 hover:text-neutral-900'}"
          >
            Daftar Admin
          </button>
        </div>
      {/if}

      {#if errorMessage}
        <div
          role="alert"
          class="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {errorMessage}
        </div>
      {/if}

      <form onsubmit={handleSubmit} class="space-y-4">
        {#if mode === "signup"}
          <div>
            <label
              for="name"
              class="block text-xs font-medium text-neutral-700"
            >
              Nama Lengkap
            </label>
            <input
              id="name"
              type="text"
              required
              minlength="2"
              bind:value={name}
              placeholder="Admin AdaSewa"
              autocomplete="name"
              class="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-950 placeholder:text-neutral-400 focus:border-neutral-950 focus:outline-none"
            />
          </div>
        {/if}

        <div>
          <label for="email" class="block text-xs font-medium text-neutral-700"
            >Email</label
          >
          <input
            id="email"
            type="email"
            required
            bind:value={email}
            placeholder="admin@adasewa.id"
            autocomplete="email"
            class="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-950 placeholder:text-neutral-400 focus:border-neutral-950 focus:outline-none"
          />
        </div>

        <div>
          <label
            for="password"
            class="block text-xs font-medium text-neutral-700"
          >
            Kata Sandi
          </label>
          <input
            id="password"
            type="password"
            required
            minlength="8"
            bind:value={password}
            placeholder="Minimal 8 karakter"
            autocomplete={mode === "signup"
              ? "new-password"
              : "current-password"}
            class="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-950 placeholder:text-neutral-400 focus:border-neutral-950 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          class="mt-2 inline-flex w-full items-center justify-center rounded-full bg-neutral-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {#if submitting}
            Memproses...
          {:else if mode === "signup"}
            Buat Akun &amp; Masuk
          {:else}
            Masuk ke CMS
          {/if}
        </button>
      </form>
    </div>

    <p class="mt-6 text-center text-xs text-neutral-500">
      <a href="/" class="transition hover:text-neutral-950"
        >← Kembali ke situs publik</a
      >
    </p>
  </div>
</main>
