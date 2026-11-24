import { building } from '$app/env';
import {
	ALLOW_ADMIN_SIGNUP,
	BETTER_AUTH_SECRET,
	BETTER_AUTH_URL,
	DATABASE_URL,
	NEON_FETCH_ENDPOINT
} from '$app/env/private';
import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit/hooks';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { createAuth } from '#lib/server/auth';
import { createDb } from '#lib/server/db';

function isProtectedAdminPath(pathname: string): boolean {
	return pathname === '/admin' || pathname.startsWith('/admin/');
}

function isProtectedCustomerPath(pathname: string): boolean {
	return pathname === '/akun' || pathname.startsWith('/akun/');
}

function isBetterAuthPath(pathname: string): boolean {
	return pathname === '/api/auth' || pathname.startsWith('/api/auth/');
}

export const handle: Handle = async ({ event, resolve }) => {
	if (building) {
		return resolve(event);
	}

	const databaseUrl = DATABASE_URL;
	const betterAuthSecret = BETTER_AUTH_SECRET;
	const requestOrigin = event.url.origin;

	if (!databaseUrl) {
		throw new Error('Environment variable DATABASE_URL tidak ditemukan.');
	}

	if (!betterAuthSecret) {
		throw new Error('Environment variable BETTER_AUTH_SECRET tidak ditemukan.');
	}

	const db = createDb(databaseUrl, NEON_FETCH_ENDPOINT);
	const auth = createAuth(db, {
		BETTER_AUTH_SECRET: betterAuthSecret,
		BETTER_AUTH_URL: requestOrigin,
		ALLOW_ADMIN_SIGNUP: ALLOW_ADMIN_SIGNUP ? 'true' : 'false',
		REQUEST_ORIGIN: BETTER_AUTH_URL
	});

	event.locals.db = db;
	event.locals.auth = auth;
	event.locals.user = null;
	event.locals.session = null;

	const pathname = event.url.pathname;

	if (isBetterAuthPath(pathname)) {
		const authResponse = await svelteKitHandler({ event, resolve, auth, building });
		authResponse.headers.set('Cache-Control', 'private, no-store');
		return authResponse;
	}

	const sessionResult = await auth.api.getSession({
		headers: event.request.headers
	});

	if (sessionResult) {
		event.locals.session = sessionResult.session;
		event.locals.user = sessionResult.user;
	}

	if (isProtectedAdminPath(pathname)) {
		if (!event.locals.session || !event.locals.user) {
			const redirectTo = encodeURIComponent(`${pathname}${event.url.search}`);
			redirect(303, `/login?redirectTo=${redirectTo}`);
		}
		if (event.locals.user.role !== 'admin') {
			redirect(303, '/akun');
		}
	}

	if (isProtectedCustomerPath(pathname)) {
		if (!event.locals.session || !event.locals.user) {
			const redirectTo = encodeURIComponent(`${pathname}${event.url.search}`);
			redirect(303, `/login?redirectTo=${redirectTo}`);
		}
	}

	if (pathname === '/login' && event.locals.session && event.locals.user) {
		const target = event.locals.user.role === 'admin' ? '/admin' : '/akun';
		redirect(303, target);
	}

	const response = await svelteKitHandler({ event, resolve, auth, building });

	if (
		isProtectedAdminPath(pathname) ||
		isProtectedCustomerPath(pathname) ||
		pathname === '/login' ||
		pathname === '/checkout'
	) {
		response.headers.set('Cache-Control', 'private, no-store');
	}

	return response;
};
