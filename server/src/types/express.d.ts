import type { UserRole } from '../modules/users/user.model.js';

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        businessId: string;
        role: UserRole;
      };
      platformAuth?: {
        adminId: string;
        email: string;
      };
    }
  }
}

export {};

