import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '#lib/server/db/schema';

export type Database = NeonHttpDatabase<typeof schema>;

/**
 * Factory function untuk membuat instance Drizzle ORM per-request
 * menggunakan Neon Serverless HTTP driver (100% kompatibel dengan Cloudflare Workers).
 *
 * Jika `neonFetchEndpoint` disediakan (atau host mengarah ke localhost/127.0.0.1 saat dev lokal),
 * driver akan mengarahkan permintaan HTTP SQL ke local Neon proxy; pada Neon Cloud (production),
 * endpoint HTTPS bawaan Neon digunakan tanpa modifikasi.
 */
export function createDb(databaseUrl: string, neonFetchEndpoint?: string): Database {
	if (!databaseUrl) {
		throw new Error('DATABASE_URL diperlukan untuk menginisialisasi koneksi Neon PostgreSQL.');
	}

	if (neonFetchEndpoint && neonFetchEndpoint.trim().length > 0) {
		neonConfig.fetchEndpoint = neonFetchEndpoint.trim();
	} else {
		try {
			const parsed = new URL(databaseUrl);
			if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
				const proxyPort =
					!parsed.port || parsed.port === '5432' || parsed.port === '5440'
						? '4445'
						: parsed.port;
				neonConfig.fetchEndpoint = `http://${parsed.hostname}:${proxyPort}/sql`;
			}
		} catch {
			// Biarkan driver Neon memvalidasi connection string bawaan
		}
	}

	const sql = neon(databaseUrl);
	return drizzle(sql, { schema });
}
