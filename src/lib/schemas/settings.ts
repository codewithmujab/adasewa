import { z } from 'zod';
import { httpUrlSchema, mediaUrlSchema } from '#lib/schemas/common';

const optionalSocialUrlSchema = z
	.union([httpUrlSchema, z.literal(''), z.undefined()])
	.transform((val) => (val === '' ? undefined : val));

const optionalNullableText = (max: number, label: string) =>
	z
		.union([z.string().trim().max(max, `${label} maksimal ${max} karakter.`), z.null()])
		.optional()
		.transform((val) => {
			if (val === undefined) return undefined;
			if (val === null || val === '') return null;
			return val;
		});

export const companySocialLinksSchema = z
	.object({
		instagram: optionalSocialUrlSchema,
		tiktok: optionalSocialUrlSchema,
		linkedin: optionalSocialUrlSchema,
		x: optionalSocialUrlSchema,
		youtube: optionalSocialUrlSchema,
		github: optionalSocialUrlSchema,
		whatsapp: optionalSocialUrlSchema,
		bookingForm: optionalSocialUrlSchema
	})
	.transform((links) => {
		const cleaned: {
			instagram?: string;
			tiktok?: string;
			linkedin?: string;
			x?: string;
			youtube?: string;
			github?: string;
			whatsapp?: string;
			bookingForm?: string;
		} = {};

		if (links.instagram) cleaned.instagram = links.instagram;
		if (links.tiktok) cleaned.tiktok = links.tiktok;
		if (links.linkedin) cleaned.linkedin = links.linkedin;
		if (links.x) cleaned.x = links.x;
		if (links.youtube) cleaned.youtube = links.youtube;
		if (links.github) cleaned.github = links.github;
		if (links.whatsapp) cleaned.whatsapp = links.whatsapp;
		if (links.bookingForm) cleaned.bookingForm = links.bookingForm;

		return cleaned;
	});

export const updateSettingsSchema = z.object({
	companyName: z
		.string()
		.trim()
		.min(2, 'Nama perusahaan minimal 2 karakter.')
		.max(160, 'Nama perusahaan maksimal 160 karakter.'),
	tagline: z
		.string()
		.trim()
		.min(4, 'Tagline minimal 4 karakter.')
		.max(240, 'Tagline maksimal 240 karakter.'),
	aboutShort: z
		.string()
		.trim()
		.min(10, 'Ringkasan tentang perusahaan minimal 10 karakter.')
		.max(2000, 'Ringkasan tentang perusahaan maksimal 2.000 karakter.'),
	aboutFull: z
		.string()
		.trim()
		.min(20, 'Profil lengkap perusahaan minimal 20 karakter.')
		.max(25000, 'Profil lengkap perusahaan maksimal 25.000 karakter.'),
	vision: optionalNullableText(2000, 'Visi'),
	mission: optionalNullableText(4000, 'Misi'),
	email: z.string().trim().email('Alamat email perusahaan tidak valid.').max(180),
	phone: optionalNullableText(64, 'Nomor telepon'),
	address: optionalNullableText(1000, 'Alamat'),
	logoKey: z.string().trim().max(512).nullable().optional(),
	logoUrl: mediaUrlSchema.nullable().optional(),
	imageKey: z.string().trim().max(512).nullable().optional(),
	imageUrl: mediaUrlSchema.nullable().optional(),
	socialLinks: companySocialLinksSchema.default({}),
	metaTitle: optionalNullableText(160, 'Meta title'),
	metaDescription: optionalNullableText(320, 'Meta description')
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
