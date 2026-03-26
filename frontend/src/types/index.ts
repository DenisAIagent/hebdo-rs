export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'journalist' | 'admin';
  is_active: boolean;
  created_at: string;
}

export interface PaperType {
  id: string;
  name: string;
  sign_limit: number;
  drive_folder_name: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface HebdoConfig {
  id: string;
  numero: number;
  label: string;
  is_current: boolean;
  created_at: string;
}

export interface Delivery {
  id: string;
  author_id: string;
  hebdo_id: string;
  paper_type_id: string;
  title: string;
  subject: string | null;
  body_original: string;
  body_corrected: string;
  digital_link: string | null;
  image_filename: string;
  drive_folder_url: string | null;
  status: 'draft' | 'corrected' | 'delivered';
  sign_count: number;
  created_at: string;
  delivered_at: string | null;
  // Joined
  author?: { full_name: string; email: string };
  paper_type?: { name: string; sign_limit: number };
  hebdo?: { numero: number; label: string };
}

export interface CorrectionResult {
  correctedText: string;
  corrections: CorrectionItem[];
  signCount: number;
}

export interface CorrectionItem {
  original: string;
  corrected: string;
  type: string;
  explanation: string;
}
