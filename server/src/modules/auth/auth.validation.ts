import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must contain at least 8 characters')
  .max(72, 'Password must contain no more than 72 characters')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/\d/, 'Password must contain a number');

export const registerSchema = z.object({
  businessName: z.string().trim().min(2).max(120),
  logoUrl: z.string().max(750_000).refine((value) => value === '' || /^data:image\/(png|jpeg|webp);base64,/.test(value), 'Logo must be a PNG, JPEG, or WebP image').default(''),
  businessPhone: z.string().trim().max(40).default(''),
  businessEmail: z.union([z.literal(''), z.email()]).default(''),
  businessAddress: z.string().trim().max(240).default(''),
  tin: z.string().trim().max(40).default(''),
  registrationNumber: z.string().trim().max(60).default(''),
  businessType: z.enum(['sole_trader', 'limited_company', 'partnership', 'cooperative', 'other']).default('sole_trader'),
  industry: z.enum(['retail', 'manufacturing', 'real_estate', 'restaurant', 'building_materials', 'logistics', 'school', 'construction']).default('retail'),
  branchName: z.preprocess(
    (value) => typeof value === 'string' && value.trim() === '' ? undefined : value,
    z.string().trim().min(2).max(100).optional(),
  ),
  firstName: z.string().trim().min(2).max(60),
  lastName: z.string().trim().min(2).max(60),
  email: z.email().transform((value) => value.toLowerCase()),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: z.email().transform((value) => value.toLowerCase()),
  password: z.string().min(1, 'Password is required'),
});

export const businessProfileSchema = z.object({
  name: z.string().trim().min(2).max(120),
  logoUrl: z.string().max(750_000).refine((value) => value === '' || /^data:image\/(png|jpeg|webp);base64,/.test(value), 'Logo must be a PNG, JPEG, or WebP image'),
  phone: z.string().trim().max(40),
  email: z.union([z.literal(''), z.email()]),
  address: z.string().trim().max(240),
  tin: z.string().trim().max(40),
  registrationNumber: z.string().trim().max(60).default(''),
  businessType: z.enum(['sole_trader', 'limited_company', 'partnership', 'cooperative', 'other']).default('sole_trader'),
  industry: z.enum(['retail', 'manufacturing', 'real_estate', 'restaurant', 'building_materials', 'logistics', 'school', 'construction']).default('retail'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

