import { eq } from 'drizzle-orm';
import type { Database } from '#lib/server/db';
import { companySettings, type CompanySettings } from '#lib/server/db/schema';

export const DEFAULT_COMPANY_SETTINGS_ID = 'default';

export function getFallbackCompanySettings(): CompanySettings {
	return {
		id: DEFAULT_COMPANY_SETTINGS_ID,
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
		logoKey: null,
		logoUrl: null,
		imageKey: null,
		imageUrl: null,
		socialLinks: {
			instagram: 'https://instagram.com/adasewa.id',
			linkedin: 'https://linkedin.com/company/adasewa'
		},
		metaTitle: 'AdaSewa — Solusi Sewa Modern & Terpercaya',
		metaDescription:
			'Platform dan layanan penyewaan modern untuk kebutuhan bisnis maupun personal dengan proses cepat dan transparan.',
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
