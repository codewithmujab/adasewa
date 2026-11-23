declare module 'cloudflare:workers' {
	export interface WorkerEnv {
		MEDIA_BUCKET: import('@cloudflare/workers-types').R2Bucket;
		ASSETS?: import('@cloudflare/workers-types').Fetcher;
		DATABASE_URL?: string;
		NEON_FETCH_ENDPOINT?: string;
		BETTER_AUTH_SECRET?: string;
		BETTER_AUTH_URL?: string;
		ALLOW_ADMIN_SIGNUP?: string;
		R2_PUBLIC_URL?: string;
	}

	export const env: WorkerEnv;
	export function waitUntil(promise: Promise<unknown>): void;
}
