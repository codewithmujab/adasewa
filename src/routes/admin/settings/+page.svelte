<script lang="ts">
	import { refreshAll } from '$app/navigation';
	import ImageUploader from '#lib/components/admin/ImageUploader.svelte';
	import Toast from '#lib/components/ui/Toast.svelte';
	import type { CompanySettings } from '#lib/server/db/schema';
	import type { ApiResponse } from '#lib/types/api';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let companyName = $state('');
	let tagline = $state('');
	let aboutShort = $state('');
	let aboutFull = $state('');
	let vision = $state('');
	let mission = $state('');
	let email = $state('');
	let phone = $state('');
	let address = $state('');
	let logoKey = $state<string | null>(null);
	let logoUrl = $state<string | null>(null);
	let imageKey = $state<string | null>(null);
	let imageUrl = $state<string | null>(null);
	let instagram = $state('');
	let tiktok = $state('');
	let linkedin = $state('');
	let x = $state('');
	let youtube = $state('');
	let github = $state('');
	let whatsapp = $state('');
	let bookingForm = $state('');
	let metaTitle = $state('');
	let metaDescription = $state('');

	let saving = $state(false);
	let fieldErrors = $state<Record<string, string[]>>({});
	let toastMessage = $state<string | null>(null);
	let toastVariant = $state<'success' | 'error' | 'info'>('success');

	$effect(() => {
		const s = data.settings;
		companyName = s.companyName;
		tagline = s.tagline;
		aboutShort = s.aboutShort;
		aboutFull = s.aboutFull;
		vision = s.vision ?? '';
		mission = s.mission ?? '';
		email = s.email;
		phone = s.phone ?? '';
		address = s.address ?? '';
		logoKey = s.logoKey;
		logoUrl = s.logoUrl;
		imageKey = s.imageKey;
		imageUrl = s.imageUrl;
		instagram = s.socialLinks.instagram ?? '';
		tiktok = s.socialLinks.tiktok ?? '';
		linkedin = s.socialLinks.linkedin ?? '';
		x = s.socialLinks.x ?? '';
		youtube = s.socialLinks.youtube ?? '';
		github = s.socialLinks.github ?? '';
		whatsapp = s.socialLinks.whatsapp ?? '';
		bookingForm = s.socialLinks.bookingForm ?? '';
		metaTitle = s.metaTitle ?? '';
		metaDescription = s.metaDescription ?? '';
	});

	async function handleSubmit(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		saving = true;
		fieldErrors = {};

		const payload = {
			companyName: companyName.trim(),
			tagline: tagline.trim(),
			aboutShort: aboutShort.trim(),
			aboutFull: aboutFull.trim(),
			vision: vision.trim() || null,
			mission: mission.trim() || null,
			email: email.trim(),
			phone: phone.trim() || null,
			address: address.trim() || null,
			logoKey,
			logoUrl,
			imageKey,
			imageUrl,
			socialLinks: {
				instagram: instagram.trim(),
				tiktok: tiktok.trim(),
				linkedin: linkedin.trim(),
				x: x.trim(),
				youtube: youtube.trim(),
				github: github.trim(),
				whatsapp: whatsapp.trim(),
				bookingForm: bookingForm.trim()
			},
			metaTitle: metaTitle.trim() || null,
			metaDescription: metaDescription.trim() || null
		};

		try {
			const response = await fetch('/api/settings', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			const result = (await response.json()) as ApiResponse<CompanySettings>;

			if (!response.ok || !result.success) {
				fieldErrors = result.errors ?? {};
				toastVariant = 'error';
				toastMessage = result.message || 'Gagal menyimpan pengaturan perusahaan.';
				return;
			}

			await refreshAll();
			toastVariant = 'success';
			toastMessage = 'Pengaturan perusahaan berhasil disimpan.';
		} catch {
			toastVariant = 'error';
			toastMessage = 'Terjadi gangguan jaringan saat menyimpan pengaturan.';
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>Pengaturan Perusahaan — CMS</title>
</svelte:head>

<form onsubmit={handleSubmit} class="space-y-8">
	<header class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
		<div>
			<span
				class="inline-flex rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-[11px] font-bold tracking-widest text-neutral-300 uppercase"
			>
				Konfigurasi
			</span>
			<h1 class="mt-3 text-3xl font-extrabold tracking-tight text-white">Pengaturan Perusahaan</h1>
			<p class="mt-1 text-sm text-neutral-400">
				Atur identitas brand, profil tentang kami, media R2, kontak pusat, dan SEO.
			</p>
		</div>

		<button
			type="submit"
			disabled={saving}
			class="inline-flex items-center justify-center rounded-full bg-white px-6 py-2.5 text-sm font-extrabold text-black transition hover:bg-neutral-200 disabled:opacity-60"
		>
			{saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
		</button>
	</header>

	<!-- Identitas & Media -->
	<section class="space-y-5 rounded-[2.25rem] border border-white/15 bg-[#0c0c0f] p-6 sm:p-8">
		<h2 class="text-base font-extrabold tracking-tight text-white">Identitas &amp; Visual</h2>

		<div class="grid gap-4 sm:grid-cols-2">
			<div>
				<label for="st-name" class="block text-xs font-semibold text-neutral-300">
					Nama Perusahaan *
				</label>
				<input
					id="st-name"
					type="text"
					required
					bind:value={companyName}
					class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2.5 text-sm text-white focus:border-white focus:outline-none"
				/>
				{#if fieldErrors.companyName?.[0]}
					<p class="mt-1 text-xs text-red-400">{fieldErrors.companyName[0]}</p>
				{/if}
			</div>

			<div>
				<label for="st-tagline" class="block text-xs font-semibold text-neutral-300">
					Tagline *
				</label>
				<input
					id="st-tagline"
					type="text"
					required
					bind:value={tagline}
					class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2.5 text-sm text-white focus:border-white focus:outline-none"
				/>
				{#if fieldErrors.tagline?.[0]}
					<p class="mt-1 text-xs text-red-400">{fieldErrors.tagline[0]}</p>
				{/if}
			</div>
		</div>

		<div class="grid gap-6 md:grid-cols-2">
			<ImageUploader
				label="Logo Perusahaan (R2)"
				folder="settings"
				imageKey={logoKey}
				imageUrl={logoUrl}
				hint="Disarankan rasio 1:1 (PNG/WebP/JPG bulat)"
				onChange={(val) => {
					logoKey = val.imageKey;
					logoUrl = val.imageUrl;
				}}
			/>

			<ImageUploader
				label="Gambar Hero / Profil (R2)"
				folder="settings"
				{imageKey}
				{imageUrl}
				hint="Disarankan rasio landscape 16:9 atau 21:9"
				onChange={(val) => {
					imageKey = val.imageKey;
					imageUrl = val.imageUrl;
				}}
			/>
		</div>
	</section>

	<!-- Profil, Visi & Misi -->
	<section class="space-y-5 rounded-[2.25rem] border border-white/15 bg-[#0c0c0f] p-6 sm:p-8">
		<h2 class="text-base font-extrabold tracking-tight text-white">Tentang, Visi &amp; Misi</h2>

		<div>
			<label for="st-about-short" class="block text-xs font-semibold text-neutral-300">
				Ringkasan Tentang Perusahaan (Beranda) *
			</label>
			<textarea
				id="st-about-short"
				rows="3"
				required
				bind:value={aboutShort}
				class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2.5 text-sm text-white focus:border-white focus:outline-none"
			></textarea>
			{#if fieldErrors.aboutShort?.[0]}
				<p class="mt-1 text-xs text-red-400">{fieldErrors.aboutShort[0]}</p>
			{/if}
		</div>

		<div>
			<label for="st-about-full" class="block text-xs font-semibold text-neutral-300">
				Profil Lengkap (Halaman Tentang) *
			</label>
			<textarea
				id="st-about-full"
				rows="6"
				required
				bind:value={aboutFull}
				class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2.5 text-sm text-white focus:border-white focus:outline-none"
			></textarea>
			{#if fieldErrors.aboutFull?.[0]}
				<p class="mt-1 text-xs text-red-400">{fieldErrors.aboutFull[0]}</p>
			{/if}
		</div>

		<div class="grid gap-4 md:grid-cols-2">
			<div>
				<label for="st-vision" class="block text-xs font-semibold text-neutral-300">Visi</label>
				<textarea
					id="st-vision"
					rows="3"
					bind:value={vision}
					class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2.5 text-sm text-white focus:border-white focus:outline-none"
				></textarea>
			</div>

			<div>
				<label for="st-mission" class="block text-xs font-semibold text-neutral-300">Misi</label>
				<textarea
					id="st-mission"
					rows="3"
					bind:value={mission}
					class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2.5 text-sm text-white focus:border-white focus:outline-none"
				></textarea>
			</div>
		</div>
	</section>

	<!-- Kontak & Media Sosial -->
	<section class="space-y-5 rounded-[2.25rem] border border-white/15 bg-[#0c0c0f] p-6 sm:p-8">
		<h2 class="text-base font-extrabold tracking-tight text-white">Kontak &amp; Media Sosial</h2>

		<div class="grid gap-4 sm:grid-cols-2">
			<div>
				<label for="st-email" class="block text-xs font-semibold text-neutral-300">Email *</label>
				<input
					id="st-email"
					type="email"
					required
					bind:value={email}
					class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2.5 text-sm text-white focus:border-white focus:outline-none"
				/>
			</div>
			<div>
				<label for="st-phone" class="block text-xs font-semibold text-neutral-300">Telepon</label>
				<input
					id="st-phone"
					type="text"
					bind:value={phone}
					class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2.5 text-sm text-white focus:border-white focus:outline-none"
				/>
			</div>
		</div>

		<div>
			<label for="st-address" class="block text-xs font-semibold text-neutral-300">
				Alamat Kantor / Jangkauan
			</label>
			<textarea
				id="st-address"
				rows="2"
				bind:value={address}
				class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2.5 text-sm text-white focus:border-white focus:outline-none"
			></textarea>
		</div>

		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			<div>
				<label for="st-ig" class="block text-xs font-semibold text-neutral-300">Instagram URL</label>
				<input
					id="st-ig"
					type="url"
					bind:value={instagram}
					placeholder="https://instagram.com/..."
					class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-white focus:outline-none"
				/>
			</div>
			<div>
				<label for="st-li" class="block text-xs font-semibold text-neutral-300">LinkedIn URL</label>
				<input
					id="st-li"
					type="url"
					bind:value={linkedin}
					placeholder="https://linkedin.com/company/..."
					class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-white focus:outline-none"
				/>
			</div>
			<div>
				<label for="st-gh" class="block text-xs font-semibold text-neutral-300">GitHub URL</label>
				<input
					id="st-gh"
					type="url"
					bind:value={github}
					placeholder="https://github.com/..."
					class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-white focus:outline-none"
				/>
			</div>
			<div>
				<label for="st-x" class="block text-xs font-semibold text-neutral-300">X / Twitter URL</label>
				<input
					id="st-x"
					type="url"
					bind:value={x}
					placeholder="https://x.com/..."
					class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-white focus:outline-none"
				/>
			</div>
			<div>
				<label for="st-yt" class="block text-xs font-semibold text-neutral-300">YouTube URL</label>
				<input
					id="st-yt"
					type="url"
					bind:value={youtube}
					placeholder="https://youtube.com/..."
					class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-white focus:outline-none"
				/>
			</div>
			<div>
				<label for="st-wa" class="block text-xs font-semibold text-neutral-300">WhatsApp URL</label>
				<input
					id="st-wa"
					type="url"
					bind:value={whatsapp}
					placeholder="https://wa.me/62..."
					class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-white focus:outline-none"
				/>
			</div>
			<div>
				<label for="st-tiktok" class="block text-xs font-semibold text-neutral-300">TikTok URL</label>
				<input
					id="st-tiktok"
					type="url"
					bind:value={tiktok}
					placeholder="https://tiktok.com/@..."
					class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-white focus:outline-none"
				/>
			</div>
			<div class="sm:col-span-2">
				<label for="st-form" class="block text-xs font-semibold text-neutral-300">
					Link Form Pemesanan (Google Form / Checkout)
				</label>
				<input
					id="st-form"
					type="url"
					bind:value={bookingForm}
					placeholder="https://docs.google.com/forms/..."
					class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-white focus:outline-none"
				/>
			</div>
		</div>
	</section>

	<!-- SEO -->
	<section class="space-y-4 rounded-[2.25rem] border border-white/15 bg-[#0c0c0f] p-6 sm:p-8">
		<h2 class="text-base font-extrabold tracking-tight text-white">SEO Metadata</h2>

		<div>
			<label for="st-meta-title" class="block text-xs font-semibold text-neutral-300">
				Meta Title
			</label>
			<input
				id="st-meta-title"
				type="text"
				bind:value={metaTitle}
				placeholder="Adasewa.id — Pusat Sewa Barang Terlengkap"
				class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-white focus:outline-none"
			/>
		</div>

		<div>
			<label for="st-meta-desc" class="block text-xs font-semibold text-neutral-300">
				Meta Description
			</label>
			<textarea
				id="st-meta-desc"
				rows="2"
				bind:value={metaDescription}
				class="mt-1.5 w-full rounded-2xl border border-white/20 bg-black px-4 py-2.5 text-sm text-white focus:border-white focus:outline-none"
			></textarea>
		</div>
	</section>
</form>

<Toast message={toastMessage} variant={toastVariant} onDismiss={() => (toastMessage = null)} />
