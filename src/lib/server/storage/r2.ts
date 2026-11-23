import { env as cfEnv, waitUntil as cfWaitUntil } from 'cloudflare:workers';
import { R2_PUBLIC_URL } from '$app/env/private';
import type { R2Bucket, R2ObjectBody } from '@cloudflare/workers-types';
import {
	MEDIA_FOLDERS,
	MIME_TO_EXTENSION,
	type AllowedImageMimeType,
	type MediaFolder,
	type UploadedMediaResult
} from '#lib/schemas/media';

const KEY_SEGMENT_REGEX = /^[a-zA-Z0-9._-]+$/;

/**
 * Mengambil native binding Cloudflare R2 (`MEDIA_BUCKET`).
 * Mendukung `platform.env.MEDIA_BUCKET` maupun import modern `cloudflare:workers` (adapter-cloudflare v9).
 */
export function getMediaBucket(platform?: App.Platform): R2Bucket | null {
	if (platform?.env.MEDIA_BUCKET) {
		return platform.env.MEDIA_BUCKET;
	}

	try {
		return cfEnv.MEDIA_BUCKET ?? null;
	} catch {
		return null;
	}
}

/**
 * Memvalidasi apakah key media aman dan berada dalam folder yang diizinkan.
 * Mencegah path traversal (`..`), karakter kontrol, atau prefix tidak valid.
 */
export function isValidMediaKey(key: string): boolean {
	if (!key || key.length > 512 || key.startsWith('/') || key.endsWith('/')) {
		return false;
	}

	const segments = key.split('/');
	if (segments.length < 2 || segments.length > 6) {
		return false;
	}

	const rootFolder = segments[0];
	if (!rootFolder || !(MEDIA_FOLDERS as readonly string[]).includes(rootFolder)) {
		return false;
	}

	for (const segment of segments) {
		if (!segment || segment === '.' || segment === '..' || !KEY_SEGMENT_REGEX.test(segment)) {
			return false;
		}
	}

	return true;
}

/**
 * Mendeteksi tipe MIME gambar asli berdasarkan magic bytes (header biner) menggunakan Uint8Array.
 * 100% Web Standard API tanpa dependensi Node.js.
 */
export function detectImageMimeFromBytes(buffer: ArrayBuffer): AllowedImageMimeType | null {
	const bytes = new Uint8Array(buffer);
	if (bytes.length < 12) {
		return null;
	}

	// JPEG: FF D8 FF
	if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
		return 'image/jpeg';
	}

	// PNG: 89 50 4E 47 0D 0A 1A 0A
	if (
		bytes[0] === 0x89 &&
		bytes[1] === 0x50 &&
		bytes[2] === 0x4e &&
		bytes[3] === 0x47 &&
		bytes[4] === 0x0d &&
		bytes[5] === 0x0a &&
		bytes[6] === 0x1a &&
		bytes[7] === 0x0a
	) {
		return 'image/png';
	}

	// GIF: GIF87a / GIF89a
	if (
		bytes[0] === 0x47 &&
		bytes[1] === 0x49 &&
		bytes[2] === 0x46 &&
		bytes[3] === 0x38 &&
		(bytes[4] === 0x37 || bytes[4] === 0x39) &&
		bytes[5] === 0x61
	) {
		return 'image/gif';
	}

	// WebP: RIFF....WEBP
	if (
		bytes[0] === 0x52 &&
		bytes[1] === 0x49 &&
		bytes[2] === 0x46 &&
		bytes[3] === 0x46 &&
		bytes[8] === 0x57 &&
		bytes[9] === 0x45 &&
		bytes[10] === 0x42 &&
		bytes[11] === 0x50
	) {
		return 'image/webp';
	}

	// AVIF: ....ftypavif / ....ftypavis / ....ftypmif1
	if (
		bytes[4] === 0x66 &&
		bytes[5] === 0x74 &&
		bytes[6] === 0x79 &&
		bytes[7] === 0x70 &&
		((bytes[8] === 0x61 && bytes[9] === 0x76 && bytes[10] === 0x69 && (bytes[11] === 0x66 || bytes[11] === 0x73)) ||
			(bytes[8] === 0x6d && bytes[9] === 0x69 && bytes[10] === 0x66 && bytes[11] === 0x31))
	) {
		return 'image/avif';
	}

	return null;
}

export function buildMediaUrl(key: string): string {
	const publicBase = R2_PUBLIC_URL?.trim().replace(/\/+$/, '');
	if (publicBase) {
		return `${publicBase}/${key}`;
	}
	return `/api/media/${key}`;
}

export async function uploadMediaToR2(
	bucket: R2Bucket,
	folder: MediaFolder,
	buffer: ArrayBuffer,
	contentType: AllowedImageMimeType
): Promise<UploadedMediaResult> {
	const now = new Date();
	const year = String(now.getUTCFullYear());
	const month = String(now.getUTCMonth() + 1).padStart(2, '0');
	const extension = MIME_TO_EXTENSION[contentType];
	const key = `${folder}/${year}/${month}/${crypto.randomUUID()}.${extension}`;

	await bucket.put(key, buffer, {
		httpMetadata: {
			contentType,
			cacheControl: 'public, max-age=31536000, immutable'
		},
		customMetadata: {
			folder,
			uploadedAt: now.toISOString()
		}
	});

	return {
		key,
		url: buildMediaUrl(key),
		contentType,
		size: buffer.byteLength
	};
}

export async function getMediaFromR2(
	bucket: R2Bucket,
	key: string
): Promise<R2ObjectBody | null> {
	return bucket.get(key);
}

function scheduleBackgroundTask(platform: App.Platform | undefined, task: Promise<unknown>): void {
	if (platform?.ctx) {
		platform.ctx.waitUntil(task);
		return;
	}

	try {
		cfWaitUntil(task);
	} catch {
		void task;
	}
}

export async function deleteR2ObjectSafely(
	platform: App.Platform | undefined,
	imageKey: string
): Promise<void> {
	if (!isValidMediaKey(imageKey)) {
		return;
	}

	const bucket = getMediaBucket(platform);
	if (!bucket) {
		return;
	}

	const task = bucket.delete(imageKey).catch((error: unknown) => {
		console.error(`[R2 Cleanup] Gagal menghapus objek "${imageKey}":`, error);
	});

	scheduleBackgroundTask(platform, task);
}

export async function deleteR2ObjectsSafely(
	platform: App.Platform | undefined,
	imageKeys: ReadonlyArray<string | null | undefined>
): Promise<void> {
	const validKeys = Array.from(
		new Set(imageKeys.filter((k): k is string => typeof k === 'string' && isValidMediaKey(k)))
	);

	if (validKeys.length === 0) {
		return;
	}

	const bucket = getMediaBucket(platform);
	if (!bucket) {
		return;
	}

	const task = bucket.delete(validKeys).catch((error: unknown) => {
		console.error(`[R2 Cleanup] Gagal menghapus ${validKeys.length} objek:`, error);
	});

	scheduleBackgroundTask(platform, task);
}
