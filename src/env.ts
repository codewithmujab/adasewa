import { defineEnvVars } from '@sveltejs/kit/env';

const optionalString = (value: string | undefined): string | undefined => {
	if (!value) return undefined;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
};

export const variables = defineEnvVars({
	DATABASE_URL: {
		description: 'Connection string PostgreSQL (Neon Serverless atau proxy lokal)',
		schema: optionalString
	},
	NEON_FETCH_ENDPOINT: {
		description: 'Endpoint HTTP SQL kustom untuk local Neon proxy saat development (opsional)',
		schema: optionalString
	},
	BETTER_AUTH_SECRET: {
		description: 'Kunci rahasia minimal 32 karakter untuk Better Auth',
		schema: optionalString
	},
	BETTER_AUTH_URL: {
		description: 'Base URL aplikasi untuk Better Auth',
		schema: optionalString
	},
	ALLOW_ADMIN_SIGNUP: {
		description: 'Aktifkan "true" sementara untuk registrasi admin awal',
		schema: (value) => value === 'true'
	},
	R2_PUBLIC_URL: {
		description: 'Custom domain publik Cloudflare R2 (opsional; default memakai /api/media/...)',
		schema: optionalString
	}
});
