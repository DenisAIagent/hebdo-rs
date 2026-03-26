import { Router, Response } from 'express';
import multer from 'multer';
import { AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../utils/supabase';
import { generateDocx } from '../services/docx';
import { uploadDelivery, ensureHebdoFolderStructure } from '../services/dropbox';
import { notifyDelivery } from '../services/email';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont acceptees'));
    }
  },
});

// GET /api/deliveries - List user's deliveries
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('deliveries')
      .select(`
        *,
        paper_type:paper_types(name, sign_limit),
        hebdo:hebdo_config(numero, label)
      `)
      .eq('author_id', req.userId!)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.json(data);
  } catch (error) {
    console.error('List deliveries error:', error);
    return res.status(500).json({ error: 'Erreur chargement livraisons' });
  }
});

// GET /api/deliveries/current-hebdo - Get current hebdo config
router.get('/current-hebdo', async (_req: AuthRequest, res: Response) => {
  try {
    const { data } = await supabaseAdmin
      .from('hebdo_config')
      .select('*')
      .eq('is_current', true)
      .single();

    return res.json(data || null);
  } catch {
    return res.status(500).json({ error: 'Erreur chargement hebdo' });
  }
});

// GET /api/deliveries/hebdos - Get all hebdo configs (for journalist selection)
router.get('/hebdos', async (_req: AuthRequest, res: Response) => {
  try {
    const { data } = await supabaseAdmin
      .from('hebdo_config')
      .select('*')
      .order('numero', { ascending: false });

    return res.json(data || []);
  } catch {
    return res.status(500).json({ error: 'Erreur chargement hebdos' });
  }
});

// POST /api/deliveries/ensure-hebdo - Find or create a hebdo by number
// Journalists can type any number; if it doesn't exist yet, it's created
router.post('/ensure-hebdo', async (req: AuthRequest, res: Response) => {
  try {
    const { numero } = req.body;
    const num = parseInt(numero, 10);

    if (isNaN(num) || num < 1 || num > 9999) {
      return res.status(400).json({ error: 'Numero invalide (entre 1 et 9999)' });
    }

    // Check if exists
    const { data: existing } = await supabaseAdmin
      .from('hebdo_config')
      .select('*')
      .eq('numero', num)
      .single();

    if (existing) {
      return res.json(existing);
    }

    // Create new hebdo
    const label = `RSH${num}`;
    const { data: created, error } = await supabaseAdmin
      .from('hebdo_config')
      .insert({ numero: num, label, is_current: false })
      .select()
      .single();

    if (error) throw error;

    console.log(`[Hebdo] New hebdo created by journalist: ${label}`);
    return res.status(201).json(created);
  } catch (error) {
    console.error('Ensure hebdo error:', error);
    return res.status(500).json({ error: 'Erreur creation hebdo' });
  }
});

// GET /api/deliveries/paper-types - Get active paper types
router.get('/paper-types', async (_req: AuthRequest, res: Response) => {
  try {
    const { data } = await supabaseAdmin
      .from('paper_types')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    return res.json(data || []);
  } catch {
    return res.status(500).json({ error: 'Erreur chargement types' });
  }
});

// POST /api/deliveries - Submit a delivery
router.post('/', upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    const { paper_type_id, title, subject, body_original, body_corrected, digital_link, hebdo_id } = req.body;
    const imageFile = req.file;

    // Validations
    if (!paper_type_id || !title || !body_corrected || !imageFile || !hebdo_id) {
      return res.status(400).json({ error: 'Champs obligatoires manquants (type, titre, texte, image, hebdo)' });
    }

    // Get paper type info
    const { data: paperType } = await supabaseAdmin
      .from('paper_types')
      .select('*')
      .eq('id', paper_type_id)
      .single();

    if (!paperType) {
      return res.status(400).json({ error: 'Type de papier invalide' });
    }

    // Get hebdo info
    const { data: hebdo } = await supabaseAdmin
      .from('hebdo_config')
      .select('*')
      .eq('id', hebdo_id)
      .single();

    if (!hebdo) {
      return res.status(400).json({ error: 'Hebdo invalide' });
    }

    // Get journalist profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', req.userId!)
      .single();

    const journalistName = profile?.full_name || req.userEmail || 'Unknown';
    const signCount = body_corrected.length;

    // Generate DOCX
    const docxFileName = `${hebdo.label} - ${paperType.name} - ${title}.docx`;
    const docxBuffer = await generateDocx({
      title,
      author: journalistName,
      content: body_corrected,
      paperType: paperType.name,
    });

    // Ensure full folder structure exists in Google Drive
    // On first delivery to this hebdo, creates RSH226/ + all type subfolders
    const { data: allActiveTypes } = await supabaseAdmin
      .from('paper_types')
      .select('drive_folder_name')
      .eq('is_active', true);

    if (allActiveTypes && allActiveTypes.length > 0) {
      await ensureHebdoFolderStructure(hebdo.label, allActiveTypes);
    }

    // Upload to Google Drive
    const driveResult = await uploadDelivery({
      hebdoNumber: hebdo.label,
      driveFolderName: paperType.drive_folder_name,
      journalistName,
      subject: subject || title,
      docxBuffer,
      docxFileName,
      imageBuffer: imageFile.buffer,
      imageFileName: imageFile.originalname,
      imageMimeType: imageFile.mimetype,
    });

    // Save to database
    const { data: delivery, error: insertError } = await supabaseAdmin
      .from('deliveries')
      .insert({
        author_id: req.userId,
        hebdo_id: hebdo.id,
        paper_type_id: paperType.id,
        title,
        subject: subject || null,
        body_original,
        body_corrected,
        digital_link: digital_link || null,
        image_filename: imageFile.originalname,
        drive_folder_url: driveResult.folderUrl,
        status: 'delivered',
        sign_count: signCount,
        delivered_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Send notification email
    await notifyDelivery({
      journalistName,
      paperType: paperType.name,
      title,
      hebdoNumber: hebdo.label,
      driveFolderUrl: driveResult.folderUrl,
      signCount,
    });

    return res.status(201).json({
      delivery,
      drive: driveResult,
      message: 'Papier livre avec succes !',
    });
  } catch (error) {
    console.error('Delivery error:', error);
    return res.status(500).json({ error: 'Erreur lors de la livraison' });
  }
});

export default router;
