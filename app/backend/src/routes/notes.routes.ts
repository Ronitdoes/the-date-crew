import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { updateNote, deleteNote } from '../controllers/notes.controller';

const router = Router();
router.use(requireAuth);

const updateNoteSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Note content is required'),
    noteType: z.enum(['general', 'call', 'meeting', 'email', 'observation']).optional(),
  }),
});

router.put('/:noteId', validateRequest(updateNoteSchema), updateNote);
router.delete('/:noteId', deleteNote);

export default router;
