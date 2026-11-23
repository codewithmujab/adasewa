import { z } from 'zod';

export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const uuidSchema = z.string().uuid('Parameter ID harus berupa UUID yang valid.');

export const mediaUrlSchema = z
	.string()
	.trim()
	.max(2048, 'URL gambar maksimal 2048 karakter.')
	.refine(
		(value) => {
			if (value.startsWith('/')) {
				return true;
			}
			try {
				const url = new URL(value);
				return url.protocol === 'https:' || url.protocol === 'http:';
			} catch {
				return false;
			}
		},
		{
			message: 'URL gambar harus berupa URL HTTP/HTTPS atau path relatif yang valid.'
		}
	);

export const httpUrlSchema = z
	.string()
	.trim()
	.max(2048, 'URL maksimal 2048 karakter.')
	.refine(
		(value) => {
			try {
				const url = new URL(value);
				return url.protocol === 'https:' || url.protocol === 'http:';
			} catch {
				return false;
			}
		},
		{
			message: 'URL harus diawali http:// atau https:// yang valid.'
		}
	);

export function slugify(input: string, maxLength = 180): string {
	return input
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, maxLength);
}
