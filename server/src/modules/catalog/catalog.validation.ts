import { z } from 'zod';
import { productUnits } from './product.model.js';

const productImage = z.string().max(500_000).refine((value) => value === '' || (value.startsWith('https://') && z.url().safeParse(value).success) || /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value), 'Product image must be an HTTPS URL or supported uploaded image');

export const categorySchema = z.object({ name: z.string().trim().min(2).max(80) });
export const productSchema = z.object({
  name: z.string().trim().min(2).max(140),
  imageUrl: productImage.default(''),
  sku: z.string().trim().min(2).max(50).regex(/^[A-Za-z0-9_-]+$/).transform((value) => value.toUpperCase()),
  categoryId: z.string().min(1), unit: z.enum(productUnits),
  costPrice: z.coerce.number().min(0), sellingPrice: z.coerce.number().min(0), reorderLevel: z.coerce.number().min(0).default(0),
  packageName: z.string().trim().max(40).default(''),
  packageSize: z.preprocess((value) => value === '' || value === undefined ? undefined : value, z.coerce.number().positive().optional()),
  packageSellingPrice: z.preprocess((value) => value === '' || value === undefined ? undefined : value, z.coerce.number().min(0).optional()),
}).superRefine((value, context) => {
  const configured = Boolean(value.packageName) || value.packageSize !== undefined || value.packageSellingPrice !== undefined;
  if (configured && (!value.packageName || value.packageSize === undefined || value.packageSellingPrice === undefined)) context.addIssue({ code: 'custom', message: 'Package name, size, and selling price are all required', path: ['packageName'] });
});
export const productStatusSchema = z.object({ isActive: z.boolean() });
export const productImageSchema = z.object({ imageUrl: productImage });

