import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { me, signIn, updateBusinessProfile } from './auth.controller.js';
import { rateLimit } from '../../middleware/rateLimit.js';

export const authRouter = Router();
authRouter.post('/login', rateLimit(15, 15 * 60 * 1000), signIn);
authRouter.get('/me', authenticate, me);
authRouter.patch('/business', authenticate, updateBusinessProfile);

