import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../utils/supabase';

const router = Router();

// ========== PAPER TYPES ==========

// GET /api/admin/paper-types - List all paper types (including inactive)
router.get('/paper-types', async (_req: AuthRequest, res: Response) => {
  try {
    const { data } = await supabaseAdmin
      .from('paper_types')
      .select('*')
      .order('sort_order', { ascending: true });
    return res.json(data || []);
  } catch {
    return res.status(500).json({ error: 'Erreur chargement' });
  }
});

// POST /api/admin/paper-types - Create a paper type
router.post('/paper-types', async (req: AuthRequest, res: Response) => {
  const { name, sign_limit, drive_folder_name, sort_order } = req.body;

  if (!name || !sign_limit || !drive_folder_name) {
    return res.status(400).json({ error: 'Nom, limite signes et nom dossier Drive requis' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('paper_types')
      .insert({
        name,
        sign_limit: parseInt(sign_limit),
        drive_folder_name,
        sort_order: sort_order || 0,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return res.status(201).json(data);
  } catch (error) {
    console.error('Create paper type error:', error);
    return res.status(500).json({ error: 'Erreur creation' });
  }
});

// PUT /api/admin/paper-types/:id - Update a paper type
router.put('/paper-types/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, sign_limit, drive_folder_name, is_active, sort_order } = req.body;

  try {
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (sign_limit !== undefined) updates.sign_limit = parseInt(sign_limit);
    if (drive_folder_name !== undefined) updates.drive_folder_name = drive_folder_name;
    if (is_active !== undefined) updates.is_active = is_active;
    if (sort_order !== undefined) updates.sort_order = sort_order;

    const { data, error } = await supabaseAdmin
      .from('paper_types')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return res.json(data);
  } catch (error) {
    console.error('Update paper type error:', error);
    return res.status(500).json({ error: 'Erreur mise a jour' });
  }
});

// DELETE /api/admin/paper-types/:id - Delete a paper type
router.delete('/paper-types/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    // Soft delete: just deactivate
    const { error } = await supabaseAdmin
      .from('paper_types')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    return res.json({ message: 'Type desactive' });
  } catch {
    return res.status(500).json({ error: 'Erreur suppression' });
  }
});

// ========== HEBDO CONFIG ==========

// GET /api/admin/hebdo - List all hebdo configs
router.get('/hebdo', async (_req: AuthRequest, res: Response) => {
  try {
    const { data } = await supabaseAdmin
      .from('hebdo_config')
      .select('*')
      .order('created_at', { ascending: false });
    return res.json(data || []);
  } catch {
    return res.status(500).json({ error: 'Erreur chargement' });
  }
});

// POST /api/admin/hebdo - Create and set current hebdo
router.post('/hebdo', async (req: AuthRequest, res: Response) => {
  const { numero } = req.body;
  if (!numero) {
    return res.status(400).json({ error: 'Numero requis' });
  }

  try {
    // Unset all current
    await supabaseAdmin
      .from('hebdo_config')
      .update({ is_current: false })
      .eq('is_current', true);

    // Create new
    const { data, error } = await supabaseAdmin
      .from('hebdo_config')
      .insert({
        numero: parseInt(numero),
        label: `RSH${numero}`,
        is_current: true,
      })
      .select()
      .single();

    if (error) throw error;
    return res.status(201).json(data);
  } catch (error) {
    console.error('Create hebdo error:', error);
    return res.status(500).json({ error: 'Erreur creation hebdo' });
  }
});

// PUT /api/admin/hebdo/:id/set-current - Set a hebdo as current
router.put('/hebdo/:id/set-current', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    await supabaseAdmin
      .from('hebdo_config')
      .update({ is_current: false })
      .eq('is_current', true);

    const { data, error } = await supabaseAdmin
      .from('hebdo_config')
      .update({ is_current: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return res.json(data);
  } catch {
    return res.status(500).json({ error: 'Erreur changement hebdo' });
  }
});

// ========== JOURNALISTS ==========

// GET /api/admin/journalists - List all journalists
router.get('/journalists', async (_req: AuthRequest, res: Response) => {
  try {
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true });
    return res.json(data || []);
  } catch {
    return res.status(500).json({ error: 'Erreur chargement' });
  }
});

// POST /api/admin/journalists - Create a journalist account
router.post('/journalists', async (req: AuthRequest, res: Response) => {
  const { email, full_name, password, role } = req.body;

  if (!email || !full_name || !password) {
    return res.status(400).json({ error: 'Email, nom complet et mot de passe requis' });
  }

  try {
    // Create auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) throw authError;

    // Create profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authUser.user.id,
        email,
        full_name,
        role: role || 'journalist',
        is_active: true,
      })
      .select()
      .single();

    if (profileError) throw profileError;
    return res.status(201).json(profile);
  } catch (error: any) {
    console.error('Create journalist error:', error);
    return res.status(500).json({ error: error?.message || 'Erreur creation compte' });
  }
});

// PUT /api/admin/journalists/:id - Update journalist
router.put('/journalists/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { full_name, role, is_active } = req.body;

  try {
    const updates: Record<string, unknown> = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (role !== undefined) updates.role = role;
    if (is_active !== undefined) updates.is_active = is_active;

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return res.json(data);
  } catch {
    return res.status(500).json({ error: 'Erreur mise a jour' });
  }
});

// ========== ALL DELIVERIES (admin view) ==========

// GET /api/admin/deliveries - List all deliveries
router.get('/deliveries', async (req: AuthRequest, res: Response) => {
  try {
    const { data } = await supabaseAdmin
      .from('deliveries')
      .select(`
        *,
        author:profiles(full_name, email),
        paper_type:paper_types(name, sign_limit),
        hebdo:hebdo_config(numero, label)
      `)
      .order('created_at', { ascending: false });

    return res.json(data || []);
  } catch {
    return res.status(500).json({ error: 'Erreur chargement' });
  }
});

// ========== CORRECTION PROMPT ==========

// GET /api/admin/prompt - Get the current correction prompt
router.get('/prompt', async (_req: AuthRequest, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('correction_prompt')
      .select('*')
      .limit(1)
      .single();

    if (error) throw error;
    return res.json(data);
  } catch (error) {
    console.error('Get prompt error:', error);
    return res.status(500).json({ error: 'Erreur chargement prompt' });
  }
});

// PUT /api/admin/prompt - Update the correction prompt
router.put('/prompt', async (req: AuthRequest, res: Response) => {
  const { prompt_text } = req.body;

  if (!prompt_text || typeof prompt_text !== 'string' || prompt_text.trim().length < 50) {
    return res.status(400).json({ error: 'Le prompt doit contenir au moins 50 caracteres' });
  }

  try {
    // Get the single prompt row
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('correction_prompt')
      .select('id')
      .limit(1)
      .single();

    if (fetchError) throw fetchError;

    const { data, error } = await supabaseAdmin
      .from('correction_prompt')
      .update({
        prompt_text: prompt_text.trim(),
        updated_at: new Date().toISOString(),
        updated_by: req.userId || null,
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return res.json(data);
  } catch (error) {
    console.error('Update prompt error:', error);
    return res.status(500).json({ error: 'Erreur mise a jour prompt' });
  }
});

export default router;
