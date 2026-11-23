import { z } from 'zod';

export const MEDIA_FOLDERS = ['services', 'portfolios', 'settings'] as const;
export type MediaFolder = (typeof MEDIA_FOLDERS)[number];

export const ALLOWED_IMAGE_MIME_TYPES = [
	'image/jpeg',
	'image/png',
	'image/webp',
	'image/avif',
	'image/gif'
] as const;
export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

export const MAX_MEDIA_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const MIME_TO_EXTENSION: Record<AllowedImageMimeType, string> = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp',
	'image/avif': 'avif',
	'image/gif': 'gif'
};

export const mediaFolderSchema = z.enum(MEDIA_FOLDERS).default('services');

export function isAllowedImageMimeType(mime: string): mime is AllowedImageMimeType {
	return (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(mime);
}

export interface UploadedMediaResult {
	key: string;
	url: string;
	contentType: AllowedImageMimeType;
	size: number;
}
