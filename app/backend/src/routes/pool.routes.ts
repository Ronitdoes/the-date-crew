import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'Pool service placeholder' });
});

export default router;
