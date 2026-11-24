import { json } from '@sveltejs/kit';
import type { ZodError } from 'zod';
import type { ApiResponse } from '#lib/types/api';

export function apiSuccess<T>(
	data: T,
	options?: {
		status?: number;
		message?: string;
		headers?: HeadersInit;
	}
): Response {
	const payload: ApiResponse<T> = {
		success: true,
		data,
		...(options?.message ? { message: options.message } : {})
	};

	return json(payload, {
		status: options?.status ?? 200,
		headers: options?.headers
	});
}

export function apiError(
	message: string,
	options?: {
		status?: number;
		errors?: Record<string, string[]>;
		headers?: HeadersInit;
	}
): Response {
	const payload: ApiResponse<never> = {
		success: false,
		message,
		...(options?.errors ? { errors: options.errors } : {})
	};

	return json(payload, {
		status: options?.status ?? 400,
		headers: options?.headers
	});
}

export function requireAuth(
	locals: App.Locals,
	message = 'Silakan masuk terlebih dahulu untuk melanjutkan.'
): Response | null {
	if (!locals.user || !locals.session) {
		return apiError(message, {
			status: 401,
			headers: { 'Cache-Control': 'private, no-store' }
		});
	}
	return null;
}

export function requireAdmin(
	locals: App.Locals,
	message = 'Unauthorized. Anda harus login sebagai admin untuk melakukan aksi ini.'
): Response | null {
	if (!locals.user || !locals.session) {
		return apiError(message, {
			status: 401,
			headers: { 'Cache-Control': 'private, no-store' }
		});
	}
	if (locals.user.role !== 'admin') {
		return apiError('Akses ditolak. Fitur ini khusus untuk administrator.', {
			status: 403,
			headers: { 'Cache-Control': 'private, no-store' }
		});
	}
	return null;
}

export function formatZodErrors(error: ZodError): Record<string, string[]> {
	const formatted: Record<string, string[]> = {};

	for (const issue of error.issues) {
		const key = issue.path.length > 0 ? issue.path.map(String).join('.') : '_root';
		const existing = formatted[key];
		if (existing) {
			existing.push(issue.message);
		} else {
			formatted[key] = [issue.message];
		}
	}

	return formatted;
}

export async function parseJsonBody(
	request: Request
): Promise<{ ok: true; data: unknown } | { ok: false; response: Response }> {
	try {
		const data: unknown = await request.json();
		return { ok: true, data };
	} catch {
		return {
			ok: false,
			response: apiError('Body request harus berupa JSON yang valid.', { status: 400 })
		};
	}
}

export function getPgErrorCode(error: unknown): string | null {
	if (typeof error !== 'object' || error === null) {
		return null;
	}

	const record = error as { code?: unknown; cause?: unknown };
	if (typeof record.code === 'string') {
		return record.code;
	}

	if (typeof record.cause === 'object' && record.cause !== null) {
		const cause = record.cause as { code?: unknown };
		if (typeof cause.code === 'string') {
			return cause.code;
		}
	}

	return null;
}

export function escapeLikePattern(value: string): string {
	return value.replace(/[\\%_]/g, '\\$&');
}
