import { Router } from 'express';
import authRoutes from './auth.routes';
import customerRoutes from './customers.routes';
import notesRoutes from './notes.routes';
import poolRoutes from './pool.routes';
import aiRoutes from './ai.routes';
import matchesRoutes from './matches.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/customers', customerRoutes);
router.use('/notes', notesRoutes);
router.use('/pool', poolRoutes);
router.use('/ai', aiRoutes);
router.use('/matches', matchesRoutes);

export default router;
