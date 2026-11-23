# AdaSewa

Website **AdaSewa** (Company Profile + CMS Admin & RESTful API) yang dikloning dari arsitektur `company-profile-cms`:

- **SvelteKit 3 + Svelte 5 Runes** (`$state`, `$derived`, `$effect`, `$props`)
- **TypeScript Strict** (tanpa `any`, `noUncheckedIndexedAccess: true`)
- **Cloudflare Workers & R2** (`@sveltejs/adapter-cloudflare` v9 + native `MEDIA_BUCKET` binding)
- **Neon Serverless PostgreSQL + Drizzle ORM** (`@neondatabase/serverless` HTTP driver)
- **Better Auth** (Email & Password, `drizzleAdapter`, proteksi `/admin` di `hooks.server.ts`)
- **Zod v4** (validasi input API & form)
- **Tailwind CSS v4** (`@tailwindcss/vite`, desain minimalis gaya Apple)

## Menjalankan Secara Lokal

### 1. Jalankan PostgreSQL + Local Neon HTTP Proxy (Docker)

```bash
npm run db:local
```

> Port lokal menggunakan `5440` (PostgreSQL) dan `4445` (Neon HTTP proxy) agar tidak bentrok dengan proyek `company-profile-cms`.

### 2. Jalankan Migrasi & Seed Data Awal

```bash
npm run db:migrate
npm run db:seed
```

### 3. Jalankan Dev Server

```bash
npm run dev
```

Buka `http://localhost:5173`.
Login Admin default (hasil `npm run db:seed`):
- **URL:** `http://localhost:5173/login`
- **Email:** `admin@adasewa.id`
- **Password:** `Admin1234!`

## Beralih ke Neon PostgreSQL Cloud & Deploy ke Cloudflare Workers

1. Buat database di [Neon](https://neon.tech) dan salin connection string `DATABASE_URL`.
2. Hapus `NEON_FETCH_ENDPOINT` dari `.env` dan `.dev.vars`, lalu ganti `DATABASE_URL` dengan URL Neon Cloud Anda.
3. Buat bucket R2 di Cloudflare:
   ```bash
   npx wrangler r2 bucket create adasewa-media
   ```
4. Atur secrets production di Cloudflare Workers:
   ```bash
   npx wrangler secret put DATABASE_URL
   npx wrangler secret put BETTER_AUTH_SECRET
   npx wrangler secret put BETTER_AUTH_URL
   ```
5. Jalankan migrasi & deploy:
   ```bash
   npm run db:migrate
   npm run deploy
   ```
