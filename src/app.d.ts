import type {
	CacheStorage as CfCacheStorage,
	CfProperties,
	ExecutionContext,
	Fetcher,
	R2Bucket
} from '@cloudflare/workers-types';
import type { Auth, AuthSession, AuthUser } from '#lib/server/auth';
import type { Database } from '#lib/server/db';

declare global {
	namespace App {
		interface Locals {
			db: Database;
			auth: Auth;
			user: AuthUser | null;
			session: AuthSession | null;
		}

		interface Platform {
			env: {
				MEDIA_BUCKET: R2Bucket;
				ASSETS?: Fetcher;
			};
			cf: CfProperties;
			ctx: ExecutionContext;
			caches: CfCacheStorage;
		}
	}
}

export {};
