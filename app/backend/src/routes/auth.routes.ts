import { Router } from 'express';
import { z } from 'zod';
import { validateRequest } from '../middleware/validate.middleware';
import { requireAuth } from '../middleware/auth.middleware';
import { login, logout, me } from '../controllers/auth.controller';

const router = Router();

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

router.post('/login', validateRequest(loginSchema), login);
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, me);

export default router;
