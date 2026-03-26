import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { correctText } from '../services/claude';

const router = Router();

// POST /api/correct - Correct text with Claude
router.post('/', async (req: AuthRequest, res: Response) => {
  const { text } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Texte requis' });
  }

  if (text.length > 100000) {
    return res.status(400).json({ error: 'Texte trop long (max 100 000 signes)' });
  }

  try {
    const result = await correctText(text);
    return res.json(result);
  } catch (error) {
    console.error('Correction error:', error);
    return res.status(500).json({ error: 'Erreur lors de la correction' });
  }
});

export default router;
