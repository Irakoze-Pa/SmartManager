import { hash } from 'bcryptjs';
import type { RequestHandler } from 'express';
import { BranchModel } from '../branches/branch.model.js';
import { UserModel } from '../users/user.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { branchStatusSchema, createBranchSchema, createStaffSchema, staffStatusSchema, updateStaffSchema } from './tenant-admin.validation.js';

const requireAuth = (auth: Express.Request['auth']) => {
  if (!auth) throw new ApiError(401, 'Authentication is required');
  return auth;
};

export const listTenantBranches: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    const auth = requireAuth(request.auth);
    const branches = await BranchModel.find({ businessId: auth.businessId }).sort({ isPrimary: -1, name: 1 }).lean();
    response.json({ items: branches.map((branch) => ({ id: branch._id.toString(), name: branch.name, code: branch.code, isPrimary: branch.isPrimary, isActive: branch.isActive })) });
  } catch (error: unknown) { next(error); }
};

export const createTenantBranch: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    const auth = requireAuth(request.auth);
    const parsed = createBranchSchema.safeParse(request.body);
    if (!parsed.success) throw new ApiError(422, 'Branch details are invalid', parsed.error.flatten().fieldErrors);
    const existing = await BranchModel.exists({ businessId: auth.businessId, code: parsed.data.code });
    if (existing) throw new ApiError(409, 'A branch with this code already exists');
    const branch = await BranchModel.create({ businessId: auth.businessId, ...parsed.data, isPrimary: false });
    response.status(201).json({ branch: { id: branch.id, name: branch.name, code: branch.code, isPrimary: branch.isPrimary, isActive: branch.isActive } });
  } catch (error: unknown) { next(error); }
};

export const updateTenantBranchStatus: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    const auth = requireAuth(request.auth);
    const parsed = branchStatusSchema.safeParse(request.body);
    if (!parsed.success) throw new ApiError(422, 'Branch status is invalid');
    const branch = await BranchModel.findOne({ _id: request.params.branchId, businessId: auth.businessId });
    if (!branch) throw new ApiError(404, 'Branch was not found');
    if (branch.isPrimary && !parsed.data.isActive) throw new ApiError(409, 'The primary branch cannot be deactivated');
    branch.isActive = parsed.data.isActive; await branch.save();
    response.json({ branch: { id: branch.id, isActive: branch.isActive } });
  } catch (error: unknown) { next(error); }
};

export const listTenantStaff: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    const auth = requireAuth(request.auth);
    const users = await UserModel.find({ businessId: auth.businessId }).sort({ createdAt: 1 }).lean();
    const branchIds = users.map((user) => user.defaultBranchId);
    const branches = await BranchModel.find({ _id: { $in: branchIds }, businessId: auth.businessId }).lean();
    const branchNames = new Map(branches.map((branch) => [branch._id.toString(), branch.name]));
    response.json({ items: users.map((user) => ({ id: user._id.toString(), firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role, isActive: user.isActive, branchId: user.defaultBranchId.toString(), branchName: branchNames.get(user.defaultBranchId.toString()) ?? 'Unknown branch' })) });
  } catch (error: unknown) { next(error); }
};

export const createTenantStaff: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    const auth = requireAuth(request.auth);
    const parsed = createStaffSchema.safeParse(request.body);
    if (!parsed.success) throw new ApiError(422, 'Staff details are invalid', parsed.error.flatten().fieldErrors);
    const [branch, existing] = await Promise.all([BranchModel.findOne({ _id: parsed.data.branchId, businessId: auth.businessId, isActive: true }), UserModel.exists({ email: parsed.data.email })]);
    if (!branch) throw new ApiError(422, 'Select an active branch in this business');
    if (existing) throw new ApiError(409, 'An account with this email already exists');
    const passwordHash = await hash(parsed.data.password, 12);
    const user = await UserModel.create({ businessId: auth.businessId, defaultBranchId: branch._id, branchIds: [branch._id], firstName: parsed.data.firstName, lastName: parsed.data.lastName, email: parsed.data.email, passwordHash, role: parsed.data.role });
    response.status(201).json({ user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role, isActive: user.isActive, branchId: branch.id, branchName: branch.name } });
  } catch (error: unknown) { next(error); }
};

export const updateTenantStaffStatus: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    const auth = requireAuth(request.auth);
    const parsed = staffStatusSchema.safeParse(request.body);
    if (!parsed.success) throw new ApiError(422, 'Staff status is invalid');
    if (request.params.userId === auth.userId) throw new ApiError(409, 'You cannot deactivate your own account');
    const user = await UserModel.findOne({ _id: request.params.userId, businessId: auth.businessId });
    if (!user) throw new ApiError(404, 'Staff account was not found');
    if (user.role === 'owner') throw new ApiError(403, 'The owner account cannot be changed here');
    user.isActive = parsed.data.isActive; await user.save();
    response.json({ user: { id: user.id, isActive: user.isActive } });
  } catch (error: unknown) { next(error); }
};

export const updateTenantStaff: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    const auth = requireAuth(request.auth);
    const parsed = updateStaffSchema.safeParse(request.body);
    if (!parsed.success) throw new ApiError(422, 'Staff details are invalid', parsed.error.flatten().fieldErrors);
    if (request.params.userId === auth.userId) throw new ApiError(409, 'You cannot change your own role or access');
    const user = await UserModel.findOne({ _id: request.params.userId, businessId: auth.businessId });
    if (!user) throw new ApiError(404, 'Staff account was not found');
    if (user.role === 'owner') throw new ApiError(403, 'The owner account cannot be changed here');
    if (auth.role !== 'owner' && parsed.data.role === 'admin') throw new ApiError(403, 'Only the owner can assign the admin role');
    const branch = await BranchModel.findOne({ _id: parsed.data.branchId, businessId: auth.businessId, isActive: true });
    if (!branch) throw new ApiError(422, 'Select an active branch in this business');
    user.role = parsed.data.role;
    user.defaultBranchId = branch._id;
    user.branchIds = [branch._id];
    user.isActive = parsed.data.isActive;
    await user.save();
    response.json({ user: { id: user.id, role: user.role, branchId: branch.id, branchName: branch.name, isActive: user.isActive } });
  } catch (error: unknown) { next(error); }
};

