import { Router, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthRequest } from '../middleware/auth';
import { correctText } from '../services/claude';

const router = Router();

// Dedicated rate limit for Claude API corrections (expensive)
const correctionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour window
  max: 30,                     // 30 corrections per hour per user
  keyGenerator: (req: AuthRequest) => req.userId || req.ip || 'unknown',
  message: { error: 'Trop de corrections demandees. Reessayez dans quelques minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/correct - Correct text with Claude
router.post('/', correctionLimiter, async (req: AuthRequest, res: Response) => {
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
