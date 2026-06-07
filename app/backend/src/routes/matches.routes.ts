import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { sendMatch, rejectMatch } from '../controllers/matches.controller';

const router = Router();

// Apply auth middleware to all match endpoints
router.use(requireAuth);

router.post('/:matchActionId/send', sendMatch);
router.post('/:matchActionId/reject', rejectMatch);

export default router;
