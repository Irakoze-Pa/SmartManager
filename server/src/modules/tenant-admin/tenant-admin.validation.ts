import { z } from 'zod';
import { userRoles } from '../users/user.model.js';

export const createBranchSchema = z.object({
  name: z.string().trim().min(2).max(100),
  code: z.string().trim().min(2).max(20).regex(/^[A-Za-z0-9-]+$/).transform((value) => value.toUpperCase()),
});
export const branchStatusSchema = z.object({ isActive: z.boolean() });
export const createStaffSchema = z.object({
  firstName: z.string().trim().min(2).max(60), lastName: z.string().trim().min(2).max(60),
  email: z.email().transform((value) => value.toLowerCase()),
  password: z.string().min(12).max(72).regex(/[A-Z]/).regex(/[a-z]/).regex(/\d/),
  role: z.enum(userRoles).exclude(['owner']),
  branchId: z.string().min(1),
});
export const staffStatusSchema = z.object({ isActive: z.boolean() });
export const updateStaffSchema = z.object({
  role: z.enum(userRoles).exclude(['owner']),
  branchId: z.string().min(1),
  isActive: z.boolean(),
});

