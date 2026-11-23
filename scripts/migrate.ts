import 'dotenv/config';
import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	throw new Error('DATABASE_URL belum diatur di .env untuk menjalankan migrasi.');
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
const db = drizzle(sql);

async function runMigrations(): Promise<void> {
	console.log('Menjalankan migrasi Drizzle dari folder ./drizzle ...');
	await migrate(db, { migrationsFolder: './drizzle' });
	console.log('Migrasi database berhasil diterapkan!');
}

runMigrations().catch((err) => {
	console.error('Migrasi database gagal:', err);
	process.exit(1);
});
