import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../utils/supabase';

const router = Router();

const REQUIRED_KEYS = [
  'ANTHROPIC_API_KEY',
  'DROPBOX_APP_KEY',
  'DROPBOX_APP_SECRET',
  'DROPBOX_REFRESH_TOKEN',
];

async function isAppConfigured(): Promise<boolean> {
  try {
    // First check: if env vars are set, the app is already configured
    const envConfigured = REQUIRED_KEYS.every((key) => {
      const val = process.env[key];
      return val && val.trim() !== '';
    });
    if (envConfigured) return true;

    // Second check: look in app_settings table
    const { data, error } = await supabaseAdmin
      .from('app_settings')
      .select('key, value')
      .in('key', REQUIRED_KEYS);

    if (error || !data) return false;

    for (const key of REQUIRED_KEYS) {
      const setting = data.find((s: any) => s.key === key);
      if (!setting || !setting.value || setting.value.trim() === '') {
        return false;
      }
    }
    return true;
  } catch {
    // If anything fails (table doesn't exist, etc.), check env vars as fallback
    return REQUIRED_KEYS.every((key) => {
      const val = process.env[key];
      return val && val.trim() !== '';
    });
  }
}

// GET /api/setup/status - Check if the app is configured (PUBLIC, no auth)
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const configured = await isAppConfigured();
    return res.json({ configured });
  } catch {
    return res.status(500).json({ error: 'Erreur verification configuration' });
  }
});

// POST /api/setup/configure - Initial setup (requires SETUP_SECRET_TOKEN + app not yet configured)
router.post('/configure', async (req: Request, res: Response) => {
  try {
    // Require setup token to prevent unauthorized configuration
    const SETUP_TOKEN = process.env.SETUP_SECRET_TOKEN;
    const providedToken = req.headers['x-setup-token'] as string;

    if (!SETUP_TOKEN) {
      return res.status(403).json({ error: 'SETUP_SECRET_TOKEN non configure sur le serveur. Setup desactive.' });
    }

    if (!providedToken || providedToken !== SETUP_TOKEN) {
      return res.status(403).json({ error: 'Token de setup invalide' });
    }

    // Block if already configured
    const configured = await isAppConfigured();
    if (configured) {
      return res.status(403).json({ error: 'Application deja configuree. Utilisez le panneau admin pour modifier les parametres.' });
    }

    const { settings } = req.body;

    if (!Array.isArray(settings) || settings.length === 0) {
      return res.status(400).json({ error: 'Un tableau de settings est requis' });
    }

    // Validate that all required keys are present
    for (const key of REQUIRED_KEYS) {
      const setting = settings.find((s: any) => s.key === key);
      if (!setting || !setting.value || setting.value.trim() === '') {
        return res.status(400).json({ error: `La cle ${key} est requise` });
      }
    }

    // Upsert each setting
    for (const s of settings) {
      if (!s.key || typeof s.value !== 'string') continue;

      // Try update first
      const { data: existing } = await supabaseAdmin
        .from('app_settings')
        .select('id')
        .eq('key', s.key)
        .single();

      if (existing) {
        await supabaseAdmin
          .from('app_settings')
          .update({
            value: s.value.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq('key', s.key);
      } else {
        await supabaseAdmin
          .from('app_settings')
          .insert({
            key: s.key,
            value: s.value.trim(),
            updated_at: new Date().toISOString(),
          });
      }
    }

    return res.json({ message: 'Configuration initiale terminee avec succes' });
  } catch (error) {
    console.error('Setup configure error:', error);
    return res.status(500).json({ error: 'Erreur configuration initiale' });
  }
});

export default router;
