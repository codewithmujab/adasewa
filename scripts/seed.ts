import 'dotenv/config';
import { neon, neonConfig } from '@neondatabase/serverless';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { count, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/lib/server/db/schema.ts';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	throw new Error('DATABASE_URL belum diatur di .env untuk menjalankan seed.');
}

const neonFetchEndpoint = process.env.NEON_FETCH_ENDPOINT?.trim();
if (neonFetchEndpoint) {
	neonConfig.fetchEndpoint = neonFetchEndpoint;
} else {
	const parsed = new URL(databaseUrl);
	if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
		neonConfig.fetchEndpoint = `http://${parsed.hostname}:4445/sql`;
	}
}

const sql = neon(databaseUrl);
const db = drizzle(sql, { schema });

async function seed(): Promise<void> {
	console.log('Memulai proses seeding database AdaSewa...');

	// 1. Seed Company Settings
	await db
		.insert(schema.companySettings)
		.values({
			id: 'default',
			companyName: 'AdaSewa',
			tagline: 'Solusi sewa modern yang mudah, transparan, dan terpercaya.',
			aboutShort:
				'AdaSewa menghadirkan layanan penyewaan terintegrasi dengan pengelolaan modern, proses cepat, serta dukungan pelanggan responsif untuk kebutuhan personal maupun bisnis.',
			aboutFull:
				'AdaSewa dibangun untuk menyederhanakan pengalaman penyewaan secara menyeluruh — mulai dari pencarian unit atau layanan, transparansi informasi, hingga dukungan operasional yang andal.\n\nDengan infrastruktur web modern berbasis Cloudflare Edge dan manajemen konten terpusat, kami memastikan setiap informasi layanan dan portofolio selalu akurat dan mudah diakses dari mana saja.',
			vision:
				'Menjadi platform penyewaan paling tepercaya di Indonesia dengan standar layanan prima dan teknologi yang ramah pengguna.',
			mission:
				'Menyediakan pilihan layanan sewa berkualitas, proses pemesanan yang ringkas, serta dukungan mitra yang profesional dan transparan.',
			email: 'halo@adasewa.id',
			phone: '+62 21 5088 2410',
			address: 'Jakarta Selatan, Indonesia',
			socialLinks: {
				instagram: 'https://instagram.com/adasewa.id',
				linkedin: 'https://linkedin.com/company/adasewa'
			},
			metaTitle: 'AdaSewa — Solusi Sewa Modern & Terpercaya',
			metaDescription:
				'Platform dan layanan penyewaan modern untuk kebutuhan bisnis maupun personal dengan proses cepat dan transparan.'
		})
		.onConflictDoNothing({ target: schema.companySettings.id });

	// 2. Seed Services
	const seedServices = [
		{
			title: 'Rekayasa Aplikasi Web & Platform',
			slug: 'rekayasa-aplikasi-web-platform',
			shortDescription:
				'Pengembangan aplikasi web full-stack berkecepatan tinggi dengan SvelteKit, TypeScript strict, dan API modern.',
			description:
				'Kami merancang dan membangun aplikasi web kelas produksi mulai dari company profile dengan CMS kustom, portal pelanggan, hingga sistem internal enterprise.\n\nSetiap baris kode ditulis dengan standar TypeScript strict, validasi data menyeluruh, pengujian terstruktur, serta optimasi Core Web Vitals agar bisnis Anda siap bertumbuh tanpa utang teknis.',
			icon: 'Engineering',
			isFeatured: true,
			isPublished: true,
			sortOrder: 1
		},
		{
			title: 'Desain Produk & Sistem Antarmuka',
			slug: 'desain-produk-sistem-antarmuka',
			shortDescription:
				'Pendekatan desain minimalis berbasis riset pengguna, tipografi presisi, dan design system yang konsisten.',
			description:
				'Antarmuka yang baik menghilangkan gesekan antara pengguna dan tujuan bisnis. Kami menyusun arsitektur informasi, prototipe interaktif, serta pustaka komponen UI yang responsif di seluruh ukuran layar.\n\nHasil akhirnya adalah pengalaman digital yang bersih, mudah dipahami, dan memperkuat citra profesional merek Anda.',
			icon: 'Design',
			isFeatured: true,
			isPublished: true,
			sortOrder: 2
		},
		{
			title: 'Arsitektur Cloud Edge & Serverless',
			slug: 'arsitektur-cloud-edge-serverless',
			shortDescription:
				'Migrasi dan optimasi infrastruktur di Cloudflare Workers, R2 Object Storage, dan Neon Serverless PostgreSQL.',
			description:
				'Dengan menjalankan aplikasi di tepi jaringan global (Edge), latensi turun drastis dan skalabilitas berjalan otomatis tanpa beban pemeliharaan server konvensional.\n\nKami membantu tim Anda menerapkan caching strategis, keamanan API, penyimpanan media R2 tanpa biaya egress, serta observabilitas menyeluruh.',
			icon: 'Cloud',
			isFeatured: true,
			isPublished: true,
			sortOrder: 3
		},
		{
			title: 'Integrasi API & Transformasi Digital',
			slug: 'integrasi-api-transformasi-digital',
			shortDescription:
				'Menghubungkan sistem ERP, pembayaran, analitik, dan alur kerja internal melalui RESTful API yang aman.',
			description:
				'Kami menyederhanakan proses operasional yang terfragmentasi menjadi satu ekosistem data yang sinkron. Setiap endpoint dirancang dengan kontrak tipe data jelas, autentikasi berbasis sesi modern, dan dokumentasi yang mudah dipelihara tim internal Anda.',
			icon: 'Strategy',
			isFeatured: false,
			isPublished: true,
			sortOrder: 4
		}
	];

	for (const svc of seedServices) {
		await db
			.insert(schema.services)
			.values(svc)
			.onConflictDoNothing({ target: schema.services.slug });
	}

	const [webService] = await db
		.select({ id: schema.services.id })
		.from(schema.services)
		.where(eq(schema.services.slug, 'rekayasa-aplikasi-web-platform'))
		.limit(1);

	const [cloudService] = await db
		.select({ id: schema.services.id })
		.from(schema.services)
		.where(eq(schema.services.slug, 'arsitektur-cloud-edge-serverless'))
		.limit(1);

	const [designService] = await db
		.select({ id: schema.services.id })
		.from(schema.services)
		.where(eq(schema.services.slug, 'desain-produk-sistem-antarmuka'))
		.limit(1);

	// 3. Seed Portfolios
	const seedPortfolios = [
		{
			title: 'Platform Manajemen Aset & Portal Investor Nusantara',
			slug: 'portal-investor-nusantara',
			clientName: 'PT Nusantara Energi Terbarukan',
			category: 'Enterprise Web',
			summary:
				'Modernisasi portal pelaporan kinerja operasional dan dokumentasi investor dengan waktu muat sub-100ms di jaringan edge.',
			content:
				'PT Nusantara Energi Terbarukan membutuhkan portal korporat sekaligus sistem publikasi laporan berkala yang mampu melayani ribuan pemangku kepentingan secara simultan.\n\nKami membangun ulang keseluruhan arsitektur menggunakan SvelteKit SSR di Cloudflare Workers, menyimpan dokumen dan aset visual di Cloudflare R2, serta memusatkan manajemen konten pada CMS internal yang intuitif bagi tim komunikasi perusahaan.',
			projectUrl: 'https://nusantara-energi.example.id',
			completedAt: new Date('2026-08-15T00:00:00Z'),
			serviceId: webService?.id ?? null,
			isFeatured: true,
			isPublished: true,
			sortOrder: 1
		},
		{
			title: 'Sistem Pemesanan & Katalog Omnichannel Aruna',
			slug: 'katalog-omnichannel-aruna',
			clientName: 'Aruna Retail Group',
			category: 'Commerce',
			summary:
				'Integrasi katalog produk real-time untuk 45 gerai dengan pengalaman belanja minimalis dan responsif.',
			content:
				'Aruna Retail Group menghadapi tantangan sinkronisasi stok dan performa situs katalog saat kampanye musiman.\n\nMelalui pendekatan arsitektur serverless PostgreSQL dan edge caching terkendali, kami menurunkan biaya infrastruktur sebesar 52% sembari meningkatkan konversi kunjungan mobile sebesar 34%.',
			projectUrl: 'https://aruna-retail.example.id',
			completedAt: new Date('2026-05-20T00:00:00Z'),
			serviceId: cloudService?.id ?? null,
			isFeatured: true,
			isPublished: true,
			sortOrder: 2
		},
		{
			title: 'Design System & Aplikasi Klinik Digital Medika',
			slug: 'design-system-klinik-medika',
			clientName: 'Medika Prima Healthcare',
			category: 'Product Design',
			summary:
				'Perancangan ulang pengalaman pendaftaran pasien, rekam medis ringkas, dan sistem desain lintas produk.',
			content:
				'Fokus utama proyek ini adalah kejelasan informasi dan aksesibilitas bagi pasien lintas usia.\n\nTim desain kami menyusun sistem tipografi, komponen formulir, serta alur janji temu yang memangkas rata-rata waktu pendaftaran dari 6 menit menjadi kurang dari 90 detik.',
			projectUrl: null,
			completedAt: new Date('2026-02-10T00:00:00Z'),
			serviceId: designService?.id ?? null,
			isFeatured: true,
			isPublished: true,
			sortOrder: 3
		}
	];

	for (const pf of seedPortfolios) {
		await db
			.insert(schema.portfolios)
			.values(pf)
			.onConflictDoNothing({ target: schema.portfolios.slug });
	}

	// 4. Seed default local admin account (jika belum ada satupun user)
	const [existingUsers] = await db.select({ total: count() }).from(schema.user);
	if (Number(existingUsers?.total ?? 0) === 0) {
		const secret =
			process.env.BETTER_AUTH_SECRET || 'local-dev-secret-key-minimal-32-chars-change-me';
		const baseURL = process.env.BETTER_AUTH_URL || 'http://localhost:5173';

		const auth = betterAuth({
			baseURL,
			secret,
			database: drizzleAdapter(db, {
				provider: 'pg',
				schema: {
					user: schema.user,
					session: schema.session,
					account: schema.account,
					verification: schema.verification
				}
			}),
			emailAndPassword: {
				enabled: true,
				minPasswordLength: 8,
				disableSignUp: false
			},
			user: {
				additionalFields: {
					role: {
						type: 'string',
						required: false,
						defaultValue: 'admin',
						input: false
					}
				}
			}
		});

		await auth.api.signUpEmail({
			body: {
				name: 'Admin AdaSewa',
				email: 'admin@adasewa.id',
				password: 'Admin1234!'
			}
		});

		console.log('Akun admin awal berhasil dibuat: admin@adasewa.id / Admin1234!');
	} else {
		console.log('Akun admin sudah ada, melewati pembuatan akun awal.');
	}

	console.log('Seeding selesai!');
}

seed().catch((err) => {
	console.error('Seeding gagal:', err);
	process.exit(1);
});
