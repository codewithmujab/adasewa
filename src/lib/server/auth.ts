import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import type { Database } from '#lib/server/db';
import * as schema from '#lib/server/db/schema';

export interface AuthEnv {
	BETTER_AUTH_SECRET: string;
	BETTER_AUTH_URL: string;
	ALLOW_ADMIN_SIGNUP?: string;
	REQUEST_ORIGIN?: string;
}

/**
 * Factory function untuk membuat instance Better Auth per-request.
 * Menghindari state global / koneksi stale pada Cloudflare Workers V8 Isolates.
 */
export function createAuth(db: Database, env: AuthEnv) {
	if (!env.BETTER_AUTH_SECRET) {
		throw new Error('BETTER_AUTH_SECRET diperlukan untuk menginisialisasi Better Auth.');
	}

	if (!env.BETTER_AUTH_URL) {
		throw new Error('BETTER_AUTH_URL diperlukan untuk menginisialisasi Better Auth.');
	}

	const trustedOrigins = Array.from(
		new Set(
			[env.BETTER_AUTH_URL, env.REQUEST_ORIGIN].filter(
				(origin): origin is string => typeof origin === 'string' && origin.length > 0
			)
		)
	);

	return betterAuth({
		baseURL: env.BETTER_AUTH_URL,
		secret: env.BETTER_AUTH_SECRET,
		trustedOrigins,
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
			maxPasswordLength: 128,
			autoSignIn: true,
			disableSignUp: false
		},
		user: {
			additionalFields: {
				role: {
					type: 'string',
					required: false,
					defaultValue: 'customer',
					input: false
				}
			}
		},
		session: {
			expiresIn: 60 * 60 * 24 * 7,
			updateAge: 60 * 60 * 24,
			cookieCache: {
				enabled: true,
				maxAge: 60 * 5
			}
		},
		plugins: [sveltekitCookies(getRequestEvent)]
	});
}

export type Auth = ReturnType<typeof createAuth>;
export type AuthSession = Auth['$Infer']['Session']['session'];
export type AuthUser = Auth['$Infer']['Session']['user'];
