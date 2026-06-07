import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { aiRateLimiter } from '../middleware/rate-limit.middleware';
import { generateIntroEmailHandler } from '../controllers/ai.controller';

const router = Router();

// Apply auth to all AI routes
router.use(requireAuth);

router.post('/intro-email', aiRateLimiter, generateIntroEmailHandler);

export default router;

