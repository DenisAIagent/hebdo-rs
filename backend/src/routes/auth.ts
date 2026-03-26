import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../utils/supabase';

const router = Router();

// GET /api/auth/profile - Get current user profile (requires token in header)
router.get('/profile', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant' });
  }
  const token = authHeader.split(' ')[1];

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Token invalide' });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return res.status(404).json({ error: 'Profil introuvable' });
    }

    return res.json({ user: { ...profile, email: user.email } });
  } catch {
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
