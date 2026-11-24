import 'dotenv/config';
import { neon, neonConfig } from '@neondatabase/serverless';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { count, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';
import { ADASEWA_CATEGORIES, ADASEWA_ITEMS } from '../src/lib/data/adasewa-catalog-seed.ts';
import * as schema from '../src/lib/server/db/schema.ts';

const ADASEWA_GOOGLE_FORM_URL =
	'https://docs.google.com/forms/d/e/1FAIpQLSc7oXCUZVUNH3gUMrlcaI2MhvNbJiPGnSFFPGNWTLK6wdETRg/viewform';

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
	console.log('Memulai proses seeding database Adasewa.id...');

	// 1. Seed Company Settings (Adasewa.id)
	await db
		.insert(schema.companySettings)
		.values({
			id: 'default',
			companyName: 'Adasewa.id',
			tagline: 'Pusat Sewa Barang Terlengkap untuk Acara, Bisnis & Kebutuhan Harian.',
			aboutShort:
				'Lebih dari 135 jenis barang siap sewa — mulai dari proyektor, sound system, kamera, laptop ROG, genset, kendaraan, hingga perlengkapan bayi & toga wisuda. Melayani delivery DKI Jakarta, Jawa Barat, Jawa Tengah & DIY atau ambil langsung di kios.',
			aboutFull:
				'Adasewa.id adalah pusat penyewaan barang terlengkap yang hadir untuk mempermudah kebutuhan acara, operasional bisnis, produksi kreatif, perjalanan, hingga keperluan keluarga tanpa harus membeli aset mahal.\n\nKami menyediakan lebih dari 135 jenis unit terawat lintas 10 kategori utama — mulai dari proyektor 2.600 hingga 10.000 lumens, TV LED hingga 85 inch, videotron, sound system hingga 20.000 watt, paket live streaming multi-kamera, gadget flagship iPhone & Laptop ROG, genset & lighting panggung, alat musik, kendaraan, perlengkapan bayi, alat camping, hingga toga wisuda.\n\nSeluruh unit dicek fungsinya sebelum serah terima. Anda dapat memilih layanan antar-jemput (delivery) ke wilayah DKI Jakarta, Jawa Barat, Jawa Tengah, dan D.I. Yogyakarta, atau ambil langsung di kios kami dengan proses pemesanan yang cepat dan transparan.',
			vision:
				'Menjadi pusat penyewaan barang paling lengkap, mudah diakses, dan tepercaya bagi individu, kampus, EO, maupun perusahaan di Indonesia.',
			mission:
				'Menyediakan ragam unit berkualitas yang selalu siap pakai, transparansi informasi spesifikasi dan kelengkapan barang, serta layanan delivery cepat lintas DKI, Jabar, Jateng, dan DIY.',
			email: 'halo@adasewa.id',
			phone: '+62 857-7713-9748',
			address:
				'Layanan Delivery DKI Jakarta, Jawa Barat, Jawa Tengah & D.I. Yogyakarta · Tersedia Ambil di Kios',
			socialLinks: {
				instagram: 'https://www.instagram.com/adasewa.id/',
				whatsapp: 'https://wa.me/6285777139748',
				bookingForm: ADASEWA_GOOGLE_FORM_URL
			},
			metaTitle: 'Adasewa.id — Pusat Sewa Barang Terlengkap | Delivery DKI, Jabar, Jateng & DIY',
			metaDescription:
				'Pusat sewa 135+ jenis barang: proyektor, sound system, TV LED, kamera, streaming, iPhone, laptop ROG, genset, mobil, motor, mainan anak, camping & toga wisuda. Delivery DKI–Jabar–Jateng–DIY.'
		})
		.onConflictDoNothing({ target: schema.companySettings.id });

	// 1b. Seed Cabang Penyewaan (Bogor & Depok — Alamat Kios & WA masing-masing, Rekening Pembayaran Terpusat)
	const seedBranches = [
		{
			code: 'BGR',
			name: 'Cabang Bogor',
			slug: 'bogor',
			city: 'Bogor',
			address: 'Jl. Pajajaran No. 88, Bogor Tengah, Kota Bogor, Jawa Barat',
			phone: '+62 857-7713-9748',
			whatsapp: '6285777139748',
			deliveryFeeDefault: 50000,
			operatingHours: 'Senin – Minggu, 08.00 – 21.00 WIB',
			isActive: true,
			sortOrder: 1
		},
		{
			code: 'DPK',
			name: 'Cabang Depok',
			slug: 'depok',
			city: 'Depok',
			address: 'Jl. Margonda Raya No. 245, Beji, Kota Depok, Jawa Barat',
			phone: '+62 857-7713-9749',
			whatsapp: '6285777139749',
			deliveryFeeDefault: 40000,
			operatingHours: 'Senin – Minggu, 08.00 – 21.00 WIB',
			isActive: true,
			sortOrder: 2
		}
	];

	for (const br of seedBranches) {
		await db
			.insert(schema.branches)
			.values(br)
			.onConflictDoNothing({ target: schema.branches.slug });
	}

	const allBranches = await db.select().from(schema.branches);
	const bogorBranch = allBranches.find((b) => b.slug === 'bogor');
	const depokBranch = allBranches.find((b) => b.slug === 'depok');

	// 2. Seed 10 Kategori Katalog Sewa
	await db
		.insert(schema.rentalCategories)
		.values(
			ADASEWA_CATEGORIES.map((cat) => ({
				name: cat.name,
				slug: cat.slug,
				description: cat.description,
				icon: cat.icon,
				accent: cat.accent,
				sortOrder: cat.sortOrder,
				isPublished: true
			}))
		)
		.onConflictDoNothing({ target: schema.rentalCategories.slug });

	const allCategories = await db.select().from(schema.rentalCategories);
	const categoryIdBySlug = new Map<string, string>(
		allCategories.map((cat) => [cat.slug, cat.id])
	);

	// 3. Seed 135 Barang Sewa Adasewa.id (batched)
	const itemValues = ADASEWA_ITEMS.map((item) => {
		const categoryId = categoryIdBySlug.get(item.categorySlug);
		if (!categoryId) {
			throw new Error(`Kategori dengan slug "${item.categorySlug}" tidak ditemukan.`);
		}
		return {
			categoryId,
			name: item.name,
			slug: item.slug,
			shortDescription: item.shortDescription,
			description: item.description,
			specs: item.specs,
			includes: item.includes,
			variants: item.variants,
			pricePerDay: item.pricePerDay,
			unitLabel: item.unitLabel,
			minDurationDays: item.minDurationDays,
			stockQty: item.stockQty,
			requiresDeposit: item.requiresDeposit,
			deliveryAvailable: true,
			pickupAvailable: true,
			isFeatured: item.isFeatured,
			isPublished: true,
			sortOrder: item.sortOrder
		};
	});

	const BATCH_SIZE = 35;
	for (let i = 0; i < itemValues.length; i += BATCH_SIZE) {
		const chunk = itemValues.slice(i, i + BATCH_SIZE);
		await db
			.insert(schema.rentalItems)
			.values(chunk)
			.onConflictDoNothing({ target: schema.rentalItems.slug });
	}
	console.log(`Katalog tersinkron: ${ADASEWA_CATEGORIES.length} kategori & ${itemValues.length} barang.`);

	// 3b. Seed Harga & Stok per Cabang (Bogor & Depok punya harga & stok sendiri)
	if (bogorBranch && depokBranch) {
		const dbItems = await db
			.select({
				id: schema.rentalItems.id,
				pricePerDay: schema.rentalItems.pricePerDay,
				stockQty: schema.rentalItems.stockQty
			})
			.from(schema.rentalItems);

		const roundTo5k = (val: number): number => Math.max(10000, Math.round(val / 5000) * 5000);

		const branchStockRows: Array<{
			branchId: string;
			rentalItemId: string;
			pricePerDay: number;
			stockQty: number;
			isAvailable: boolean;
		}> = [];

		for (const item of dbItems) {
			const basePrice = item.pricePerDay ?? 100000;
			// Harga Depok = tarif dasar; Harga Bogor = berbeda (contoh +Rp 5.000 s/d +10%, dapat diubah di Admin)
			const depokPrice = basePrice;
			const bogorPrice =
				basePrice >= 100000 ? roundTo5k(basePrice * 1.08) : roundTo5k(basePrice + 5000);

			branchStockRows.push(
				{
					branchId: bogorBranch.id,
					rentalItemId: item.id,
					pricePerDay: bogorPrice,
					stockQty: Math.max(1, item.stockQty),
					isAvailable: true
				},
				{
					branchId: depokBranch.id,
					rentalItemId: item.id,
					pricePerDay: depokPrice,
					stockQty: Math.max(1, item.stockQty + 1),
					isAvailable: true
				}
			);
		}

		for (let i = 0; i < branchStockRows.length; i += 50) {
			await db
				.insert(schema.branchItemStocks)
				.values(branchStockRows.slice(i, i + 50))
				.onConflictDoNothing({
					target: [schema.branchItemStocks.branchId, schema.branchItemStocks.rentalItemId]
				});
		}
		console.log(`Stok & harga cabang tersinkron: ${branchStockRows.length} baris (Bogor & Depok).`);

		// Backfill pesanan lama yang belum memiliki branchId ke Cabang Depok
		await sql`
			UPDATE rental_orders
			SET
				branch_id = ${depokBranch.id},
				branch_name = ${depokBranch.name},
				branch_address = ${depokBranch.address},
				branch_whatsapp = ${depokBranch.whatsapp}
			WHERE branch_id IS NULL
		`;
	}

	// 4. Seed Layanan Unggulan Adasewa.id
	const seedServices = [
		{
			title: 'Sewa Perlengkapan Event, Panggung & Multimedia',
			slug: 'event-panggung-multimedia',
			shortDescription:
				'Paket lengkap proyektor 2.600–10.000 lumens, TV LED hingga 85 inch, videotron, sound system hingga 20.000W, lighting, panggung & genset.',
			description:
				'Mendukung kelancaran seminar, konferensi, peluncuran produk, pernikahan, pensi kampus, hingga konser outdoor dengan perangkat multimedia dan panggung berstandar profesional.\n\nSeluruh unit dapat disesuaikan dengan kapasitas ruangan dan jumlah audiens, lengkap dengan opsi pengiriman ke lokasi serta dukungan instalasi.',
			icon: 'Event & AV',
			isFeatured: true,
			isPublished: true,
			sortOrder: 1
		},
		{
			title: 'Produksi Live Streaming, Kamera & Booth Interaktif',
			slug: 'live-streaming-kamera-booth',
			shortDescription:
				'Paket streaming 2–5 kamera, kamera mirrorless & DSLR Nikon, Sony NX100, drone, photobooth, mirror booth, hingga video booth 360°.',
			description:
				'Solusi lengkap bagi penyelenggara acara hybrid, wisuda, webinar nasional, dan resepsi yang membutuhkan dokumentasi tajam serta siaran langsung stabil.\n\nTersedia pula wahana hiburan tamu modern seperti Photobooth cetak instan, Mirror Booth, dan Video Booth 360°.',
			icon: 'Produksi',
			isFeatured: true,
			isPublished: true,
			sortOrder: 2
		},
		{
			title: 'Sewa Gadget Flagship, Laptop ROG & Kendaraan',
			slug: 'gadget-laptop-kendaraan',
			shortDescription:
				'iPhone 12–17 Pro Max, laptop gaming/editing ASUS ROG, PlayStation 3–5, hingga armada Hiace Premio, mobil keluarga & motor matic.',
			description:
				'Fleksibel untuk kebutuhan konten kreator, konser, turnamen esports, dinas luar kota, maupun liburan keluarga tanpa perlu membeli aset baru.\n\nSetiap unit diperiksa kondisinya secara menyeluruh sebelum serah terima di kios maupun pengiriman ke alamat Anda.',
			icon: 'Lifestyle & Mobilitas',
			isFeatured: true,
			isPublished: true,
			sortOrder: 3
		},
		{
			title: 'Perlengkapan Anak, Camping & Wisuda',
			slug: 'keluarga-camping-wisuda',
			shortDescription:
				'Stroller, car seat, mainan anak higienis, tenda & carrier pendakian, serta set toga wisuda S1/S2/S3 siap pakai.',
			description:
				'Memenuhi kebutuhan musiman dan keluarga secara ekonomis — mulai dari perlengkapan bayi yang disanitasi sebelum kirim, perlengkapan mendaki gunung lengkap, hingga toga wisuda bersih untuk individu maupun rombongan fakultas.',
			icon: 'Keluarga & Kampus',
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

	const [eventService] = await db
		.select({ id: schema.services.id })
		.from(schema.services)
		.where(eq(schema.services.slug, 'event-panggung-multimedia'))
		.limit(1);

	const [streamService] = await db
		.select({ id: schema.services.id })
		.from(schema.services)
		.where(eq(schema.services.slug, 'live-streaming-kamera-booth'))
		.limit(1);

	// 5. Seed Dokumentasi / Portofolio Acara Adasewa.id
	const seedPortfolios = [
		{
			title: 'Dukungan Audio, Proyektor 5500 Lumens & Live Streaming 3 Kamera',
			slug: 'dukungan-seminar-hybrid-jakarta',
			clientName: 'Acara Seminar & Konferensi Korporat',
			category: 'Event & Multimedia',
			summary:
				'Pengadaan terpadu proyektor 5500 lumens, screen 94 inch, sound system 5000 watt, dan paket streaming 3 kamera untuk peserta hybrid.',
			content:
				'Kebutuhan acara seminar hybrid memerlukan kejelasan visual di dalam aula sekaligus kualitas siaran yang jernih bagi peserta daring.\n\nTim Adasewa.id menyiapkan proyektor 5500 lumens, layar proyektor, sound system 5000 watt, mikrofon wireless, serta paket live streaming 3 kamera dengan pengujian pra-acara agar seluruh sesi berjalan mulus tanpa kendala teknis.',
			projectUrl: null,
			completedAt: new Date('2026-09-12T00:00:00Z'),
			serviceId: eventService?.id ?? null,
			isFeatured: true,
			isPublished: true,
			sortOrder: 1
		},
		{
			title: 'Paket Video Booth 360°, Lighting Pro Set & Genset Acara Outdoor',
			slug: 'paket-wedding-booth-lighting-bandung',
			clientName: 'Resepsi & Gathering Outdoor',
			category: 'Wedding & Booth',
			summary:
				'Kombinasi tata cahaya panggung Lighting Pro Set, Misty Fan Krisbow, Genset 10.000W, dan Video Booth 360° dalam satu pengantaran.',
			content:
				'Menyewa seluruh perlengkapan acara dari satu penyedia memudahkan koordinasi pengiriman dan pemasangan di venue outdoor.\n\nAdasewa.id mengantarkan paket lengkap mulai dari genset cadangan, kipas embun penyejuk area tamu, lighting panggung, hingga Video Booth 360° yang menjadi favorit para tamu.',
			projectUrl: null,
			completedAt: new Date('2026-08-20T00:00:00Z'),
			serviceId: streamService?.id ?? null,
			isFeatured: true,
			isPublished: true,
			sortOrder: 2
		}
	];

	for (const pf of seedPortfolios) {
		await db
			.insert(schema.portfolios)
			.values(pf)
			.onConflictDoNothing({ target: schema.portfolios.slug });
	}

	// 5b. Seed Promo & Voucher Diskon Awal
	const seedPromos = [
		{
			code: 'SEWABARU10',
			title: 'Diskon 10% Semua Barang',
			description:
				'Berlaku untuk seluruh kategori barang sewa Adasewa.id dengan potongan maksimal Rp 150.000.',
			discountType: 'percentage',
			discountValue: 10,
			maxDiscountAmount: 150000,
			minOrderAmount: 100000,
			usageLimit: 100,
			isActive: true,
			showOnLanding: true
		},
		{
			code: 'EVENT100K',
			title: 'Potongan Langsung Rp 100.000 Paket Event',
			description:
				'Hemat Rp 100.000 untuk penyewaan perlengkapan seminar, sound system, proyektor, genset & booth minimal Rp 500.000.',
			discountType: 'fixed',
			discountValue: 100000,
			maxDiscountAmount: null,
			minOrderAmount: 500000,
			usageLimit: 50,
			isActive: true,
			showOnLanding: true
		},
		{
			code: 'WISUDA15',
			title: 'Promo Wisuda & Kampus 15%',
			description:
				'Potongan 15% hingga Rp 100.000 untuk toga wisuda, kamera, iPhone, dan perlengkapan acara kampus.',
			discountType: 'percentage',
			discountValue: 15,
			maxDiscountAmount: 100000,
			minOrderAmount: 150000,
			usageLimit: 100,
			isActive: true,
			showOnLanding: true
		}
	];

	for (const promo of seedPromos) {
		await db
			.insert(schema.promoCodes)
			.values(promo)
			.onConflictDoNothing({ target: schema.promoCodes.code });
	}

	// 6. Seed default owner & branch admin accounts (idempoten per email)
	const secret =
		process.env.BETTER_AUTH_SECRET || 'local-dev-secret-key-minimal-32-chars-change-me';
	const baseURL = process.env.BETTER_AUTH_URL || 'http://localhost:5173';

	const seedAuth = betterAuth({
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
					defaultValue: 'customer',
					input: false
				},
				branchId: {
					type: 'string',
					required: false,
					defaultValue: null,
					input: false
				}
			}
		}
	});

	const staffAccounts = [
		{
			name: 'Owner Adasewa.id',
			email: 'admin@adasewa.id',
			role: 'admin',
			branchId: null as string | null
		},
		...(bogorBranch
			? [
					{
						name: 'Admin Cabang Bogor',
						email: 'admin.bogor@adasewa.id',
						role: 'branch_admin',
						branchId: bogorBranch.id
					}
				]
			: []),
		...(depokBranch
			? [
					{
						name: 'Admin Cabang Depok',
						email: 'admin.depok@adasewa.id',
						role: 'branch_admin',
						branchId: depokBranch.id
					}
				]
			: [])
	];

	for (const staff of staffAccounts) {
		const [exists] = await db
			.select({ id: schema.user.id })
			.from(schema.user)
			.where(eq(schema.user.email, staff.email))
			.limit(1);

		if (!exists) {
			await seedAuth.api.signUpEmail({
				body: {
					name: staff.name,
					email: staff.email,
					password: 'Admin1234!'
				}
			});
			await db
				.update(schema.user)
				.set({ role: staff.role, branchId: staff.branchId })
				.where(eq(schema.user.email, staff.email));
			console.log(`Akun staf dibuat: ${staff.email} (${staff.role})`);
		}
	}

	const [totalUserRow] = await db.select({ total: count() }).from(schema.user);
	console.log(`Total user di DB: ${Number(totalUserRow?.total ?? 0)}`);

	console.log('Seeding Adasewa.id selesai!');
}

seed().catch((err) => {
	console.error('Seeding gagal:', err);
	process.exit(1);
});
