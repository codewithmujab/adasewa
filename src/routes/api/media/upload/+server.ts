import { apiError, apiSuccess, formatZodErrors, requireAdmin } from '#lib/server/api/response';
import {
	ALLOWED_IMAGE_MIME_TYPES,
	MAX_MEDIA_SIZE_BYTES,
	isAllowedImageMimeType,
	mediaFolderSchema
} from '#lib/schemas/media';
import {
	detectImageMimeFromBytes,
	getMediaBucket,
	uploadMediaToR2
} from '#lib/server/storage/r2';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	const unauthorized = requireAdmin(
		locals,
		'Unauthorized. Anda harus login untuk mengunggah media.'
	);
	if (unauthorized) {
		return unauthorized;
	}

	const bucket = getMediaBucket(platform);
	if (!bucket) {
		return apiError('Binding Cloudflare R2 (MEDIA_BUCKET) tidak tersedia di runtime ini.', {
			status: 500,
			headers: { 'Cache-Control': 'private, no-store' }
		});
	}

	let formData: FormData;
	try {
		formData = await request.formData();
	} catch {
		return apiError('Request harus berupa multipart/form-data yang valid.', {
			status: 400,
			headers: { 'Cache-Control': 'private, no-store' }
		});
	}

	const folderField = formData.get('folder');
	const parsedFolder = mediaFolderSchema.safeParse(
		typeof folderField === 'string' && folderField.length > 0 ? folderField : undefined
	);
	if (!parsedFolder.success) {
		return apiError('Folder media tidak valid.', {
			status: 422,
			errors: formatZodErrors(parsedFolder.error),
			headers: { 'Cache-Control': 'private, no-store' }
		});
	}

	const fileEntry = formData.get('file');
	if (!(fileEntry instanceof File)) {
		return apiError('Field "file" wajib diisi dengan berkas gambar.', {
			status: 422,
			errors: { file: ['Silakan pilih berkas gambar terlebih dahulu.'] },
			headers: { 'Cache-Control': 'private, no-store' }
		});
	}

	if (fileEntry.size === 0) {
		return apiError('Berkas gambar kosong.', {
			status: 422,
			errors: { file: ['Berkas tidak boleh berukuran 0 byte.'] },
			headers: { 'Cache-Control': 'private, no-store' }
		});
	}

	if (fileEntry.size > MAX_MEDIA_SIZE_BYTES) {
		return apiError('Ukuran gambar melebihi batas maksimal 5 MB.', {
			status: 413,
			errors: { file: ['Ukuran berkas maksimal adalah 5 MB.'] },
			headers: { 'Cache-Control': 'private, no-store' }
		});
	}

	if (fileEntry.type && !isAllowedImageMimeType(fileEntry.type)) {
		return apiError('Format gambar tidak didukung.', {
			status: 415,
			errors: {
				file: [`Format yang didukung: ${ALLOWED_IMAGE_MIME_TYPES.join(', ')}.`]
			},
			headers: { 'Cache-Control': 'private, no-store' }
		});
	}

	const buffer = await fileEntry.arrayBuffer();
	const detectedMime = detectImageMimeFromBytes(buffer);

	if (!detectedMime) {
		return apiError('Isi berkas bukan gambar yang valid (JPG, PNG, WebP, AVIF, atau GIF).', {
			status: 415,
			errors: {
				file: ['File gagal verifikasi magic bytes sebagai gambar valid.']
			},
			headers: { 'Cache-Control': 'private, no-store' }
		});
	}

	try {
		const uploaded = await uploadMediaToR2(bucket, parsedFolder.data, buffer, detectedMime);

		return apiSuccess(uploaded, {
			status: 201,
			message: 'Gambar berhasil diunggah ke Cloudflare R2.',
			headers: { 'Cache-Control': 'private, no-store' }
		});
	} catch (error: unknown) {
		console.error('[POST /api/media/upload] R2 put error:', error);
		return apiError('Terjadi kesalahan saat mengunggah gambar ke Cloudflare R2.', {
			status: 500,
			headers: { 'Cache-Control': 'private, no-store' }
		});
	}
};
