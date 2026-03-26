import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../utils/supabase';

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  accessToken?: string;
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
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

    // Get profile with role
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, full_name, is_active')
      .eq('id', user.id)
      .single();

    if (!profile?.is_active) {
      return res.status(403).json({ error: 'Compte desactive' });
    }

    req.userId = user.id;
    req.userEmail = user.email;
    req.userRole = profile?.role || 'journalist';
    req.accessToken = token;
    next();
  } catch {
    return res.status(401).json({ error: 'Erreur authentification' });
  }
}
