import { z } from 'zod';
import { inventoryRoles, productUnits } from './product.model.js';

const productImage = z.string().max(500_000).refine((value) => value === '' || (value.startsWith('https://') && z.url().safeParse(value).success) || /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value), 'Product image must be an HTTPS URL or supported uploaded image');

export const categorySchema = z.object({ name: z.string().trim().min(2).max(80) });
export const productSchema = z.object({
  name: z.string().trim().min(2).max(140),
  imageUrl: productImage.default(''),
  sku: z.string().trim().min(2).max(50).regex(/^[A-Za-z0-9_-]+$/).transform((value) => value.toUpperCase()),
  barcode: z.string().trim().max(64).regex(/^[A-Za-z0-9_-]*$/).default(''),
  categoryId: z.string().min(1), unit: z.enum(productUnits), inventoryRole: z.enum(inventoryRoles).default('standard'),
  costPrice: z.coerce.number().min(0), sellingPrice: z.preprocess((value) => value === '' || value === undefined ? undefined : value, z.coerce.number().min(0).optional()), reorderLevel: z.coerce.number().min(0).default(0),
  packageName: z.string().trim().max(40).default(''),
  packageSize: z.preprocess((value) => value === '' || value === undefined ? undefined : value, z.coerce.number().positive().optional()),
  packageSellingPrice: z.preprocess((value) => value === '' || value === undefined ? undefined : value, z.coerce.number().min(0).optional()),
}).superRefine((value, context) => {
  const configured = Boolean(value.packageName) || value.packageSize !== undefined || value.packageSellingPrice !== undefined;
  if (configured && (!value.packageName || value.packageSize === undefined)) context.addIssue({ code: 'custom', message: 'Package name and units per package are required', path: ['packageName'] });
  if (value.sellingPrice === undefined) context.addIssue({ code: 'custom', message: 'Unit selling price is required', path: ['sellingPrice'] });
  if (configured && value.packageSellingPrice === undefined) context.addIssue({ code: 'custom', message: 'Pack selling price is required', path: ['packageSellingPrice'] });
});
export const productStatusSchema = z.object({ isActive: z.boolean() });
export const productPackageSchema = z.object({ packageName: z.string().trim().min(1).max(40), packageSize: z.coerce.number().positive(), packageSellingPrice: z.coerce.number().min(0) });
export const productImageSchema = z.object({ imageUrl: productImage });

