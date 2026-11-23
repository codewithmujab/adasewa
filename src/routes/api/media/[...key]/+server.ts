import { apiError, apiSuccess, requireAdmin } from '#lib/server/api/response';
import { getMediaBucket, getMediaFromR2, isValidMediaKey } from '#lib/server/storage/r2';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, request, platform }) => {
	const key = params.key;
	if (!isValidMediaKey(key)) {
		return apiError('Key media tidak valid.', { status: 400 });
	}

	const bucket = getMediaBucket(platform);
	if (!bucket) {
		return apiError('Binding Cloudflare R2 (MEDIA_BUCKET) tidak tersedia.', { status: 500 });
	}

	const object = await getMediaFromR2(bucket, key);
	if (!object) {
		return apiError('Media tidak ditemukan.', { status: 404 });
	}

	const etag = object.httpEtag;
	const ifNoneMatch = request.headers.get('if-none-match');
	if (ifNoneMatch && etag && (ifNoneMatch === etag || ifNoneMatch === `W/${etag}`)) {
		return new Response(null, {
			status: 304,
			headers: {
				ETag: etag,
				'Cache-Control': 'public, max-age=31536000, immutable'
			}
		});
	}

	const body = await object.arrayBuffer();
	const headers = new Headers();
	headers.set('Content-Type', object.httpMetadata?.contentType ?? 'application/octet-stream');
	headers.set('Content-Length', String(body.byteLength));
	headers.set(
		'Cache-Control',
		object.httpMetadata?.cacheControl ?? 'public, max-age=31536000, immutable'
	);
	headers.set('X-Content-Type-Options', 'nosniff');
	if (etag) {
		headers.set('ETag', etag);
	}

	return new Response(body, {
		status: 200,
		headers
	});
};

export const DELETE: RequestHandler = async ({ params, locals, platform }) => {
	const unauthorized = requireAdmin(
		locals,
		'Unauthorized. Anda harus login untuk menghapus media.'
	);
	if (unauthorized) {
		return unauthorized;
	}

	const key = params.key;
	if (!isValidMediaKey(key)) {
		return apiError('Key media tidak valid.', {
			status: 400,
			headers: { 'Cache-Control': 'private, no-store' }
		});
	}

	const bucket = getMediaBucket(platform);
	if (!bucket) {
		return apiError('Binding Cloudflare R2 (MEDIA_BUCKET) tidak tersedia.', {
			status: 500,
			headers: { 'Cache-Control': 'private, no-store' }
		});
	}

	try {
		await bucket.delete(key);

		return apiSuccess(
			{ key },
			{
				status: 200,
				message: 'Media berhasil dihapus dari Cloudflare R2.',
				headers: { 'Cache-Control': 'private, no-store' }
			}
		);
	} catch (error: unknown) {
		console.error(`[DELETE /api/media/${key}] R2 delete error:`, error);
		return apiError('Terjadi kesalahan saat menghapus media dari Cloudflare R2.', {
			status: 500,
			headers: { 'Cache-Control': 'private, no-store' }
		});
	}
};
