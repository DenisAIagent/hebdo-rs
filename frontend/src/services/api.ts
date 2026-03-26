import axios from 'axios';
import { supabase } from '../lib/supabase.ts';
import type { PaperType, HebdoConfig, Delivery, CorrectionResult, Profile, CorrectionPrompt } from '../types/index.ts';

const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_URL,
});

// Attach token to every request
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// ========== AUTH ==========
export async function getProfile(): Promise<Profile> {
  const { data } = await api.get('/api/auth/profile');
  return data.user;
}

// ========== DELIVERIES ==========
export async function getMyDeliveries(): Promise<Delivery[]> {
  const { data } = await api.get('/api/deliveries');
  return data;
}

export async function getCurrentHebdo(): Promise<HebdoConfig | null> {
  const { data } = await api.get('/api/deliveries/current-hebdo');
  return data;
}

export async function getAllHebdos(): Promise<HebdoConfig[]> {
  const { data } = await api.get('/api/deliveries/hebdos');
  return data;
}

export async function ensureHebdo(numero: number): Promise<HebdoConfig> {
  const { data } = await api.post('/api/deliveries/ensure-hebdo', { numero });
  return data;
}

export async function getActivePaperTypes(): Promise<PaperType[]> {
  const { data } = await api.get('/api/deliveries/paper-types');
  return data;
}

export async function submitDelivery(formData: FormData): Promise<{ delivery: Delivery; drive: { folderUrl: string }; message: string }> {
  const { data } = await api.post('/api/deliveries', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  });
  return data;
}

// ========== CORRECTION ==========
export async function correctText(text: string): Promise<CorrectionResult> {
  const { data } = await api.post('/api/correct', { text }, { timeout: 120000 });
  return data;
}

// ========== ADMIN ==========
export async function adminGetPaperTypes(): Promise<PaperType[]> {
  const { data } = await api.get('/api/admin/paper-types');
  return data;
}

export async function adminCreatePaperType(pt: Partial<PaperType>): Promise<PaperType> {
  const { data } = await api.post('/api/admin/paper-types', pt);
  return data;
}

export async function adminUpdatePaperType(id: string, pt: Partial<PaperType>): Promise<PaperType> {
  const { data } = await api.put(`/api/admin/paper-types/${id}`, pt);
  return data;
}

export async function adminDeletePaperType(id: string): Promise<void> {
  await api.delete(`/api/admin/paper-types/${id}`);
}

export async function adminGetHebdos(): Promise<HebdoConfig[]> {
  const { data } = await api.get('/api/admin/hebdo');
  return data;
}

export async function adminCreateHebdo(numero: number): Promise<HebdoConfig> {
  const { data } = await api.post('/api/admin/hebdo', { numero });
  return data;
}

export async function adminSetCurrentHebdo(id: string): Promise<HebdoConfig> {
  const { data } = await api.put(`/api/admin/hebdo/${id}/set-current`);
  return data;
}

export async function adminGetJournalists(): Promise<Profile[]> {
  const { data } = await api.get('/api/admin/journalists');
  return data;
}

export async function adminCreateJournalist(j: { email: string; full_name: string; password: string; role?: string }): Promise<Profile> {
  const { data } = await api.post('/api/admin/journalists', j);
  return data;
}

export async function adminUpdateJournalist(id: string, j: Partial<Profile>): Promise<Profile> {
  const { data } = await api.put(`/api/admin/journalists/${id}`, j);
  return data;
}

export async function adminGetDeliveries(): Promise<Delivery[]> {
  const { data } = await api.get('/api/admin/deliveries');
  return data;
}

// ========== CORRECTION PROMPT ==========
export async function adminGetPrompt(): Promise<CorrectionPrompt> {
  const { data } = await api.get('/api/admin/prompt');
  return data;
}

export async function adminUpdatePrompt(prompt_text: string): Promise<CorrectionPrompt> {
  const { data } = await api.put('/api/admin/prompt', { prompt_text });
  return data;
}
