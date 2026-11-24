import { eq } from 'drizzle-orm';
import type { Database } from '#lib/server/db';
import { companySettings, type CompanySettings } from '#lib/server/db/schema';

export const DEFAULT_COMPANY_SETTINGS_ID = 'default';

export const ADASEWA_GOOGLE_FORM_URL =
	'https://docs.google.com/forms/d/e/1FAIpQLSc7oXCUZVUNH3gUMrlcaI2MhvNbJiPGnSFFPGNWTLK6wdETRg/viewform';

export function getFallbackCompanySettings(): CompanySettings {
	return {
		id: DEFAULT_COMPANY_SETTINGS_ID,
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
		address: 'Layanan Delivery DKI Jakarta, Jawa Barat, Jawa Tengah & D.I. Yogyakarta · Tersedia Ambil di Kios',
		logoKey: null,
		logoUrl: null,
		imageKey: null,
		imageUrl: null,
		socialLinks: {
			instagram: 'https://www.instagram.com/adasewa.id/',
			whatsapp: 'https://wa.me/6285777139748',
			bookingForm: ADASEWA_GOOGLE_FORM_URL
		},
		metaTitle: 'Adasewa.id — Pusat Sewa Barang Terlengkap | Delivery DKI, Jabar, Jateng & DIY',
		metaDescription:
			'Pusat sewa 135+ jenis barang: proyektor, sound system, TV LED, kamera, streaming, iPhone, laptop ROG, genset, mobil, motor, mainan anak, camping & toga wisuda. Delivery DKI–Jabar–Jateng–DIY.',
		updatedAt: new Date(0)
	};
}

export async function getCompanySettings(db: Database): Promise<CompanySettings> {
	const [record] = await db
		.select()
		.from(companySettings)
		.where(eq(companySettings.id, DEFAULT_COMPANY_SETTINGS_ID))
		.limit(1);

	return record ?? getFallbackCompanySettings();
}
