/**
 * Dropbox storage service — replaces Google Drive.
 * Uses the Dropbox HTTP API v2 with a long-lived refresh token.
 *
 * Required env vars:
 *   DROPBOX_APP_KEY
 *   DROPBOX_APP_SECRET
 *   DROPBOX_REFRESH_TOKEN
 *   DROPBOX_ROOT_FOLDER  (e.g. "/Hebdo Delivery")
 */

import axios from 'axios';

// ── Token management ────────────────────────────────────────────
let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const key = process.env.DROPBOX_APP_KEY!;
  const secret = process.env.DROPBOX_APP_SECRET!;
  const refreshToken = process.env.DROPBOX_REFRESH_TOKEN!;

  const res = await axios.post(
    'https://api.dropboxapi.com/oauth2/token',
    new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
    {
      auth: { username: key, password: secret },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }
  );

  cachedToken = res.data.access_token;
  // Expire 5 min before actual expiry to be safe
  tokenExpiry = Date.now() + (res.data.expires_in - 300) * 1000;
  return cachedToken!;
}

// ── Helpers ─────────────────────────────────────────────────────

function rootFolder(): string {
  return process.env.DROPBOX_ROOT_FOLDER || '/Hebdo Delivery';
}

/** Sleep helper */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Retry wrapper — retries on 429 with exponential backoff */
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 429 && attempt < maxRetries) {
        const retryAfter = parseInt(err?.response?.headers?.['retry-after'] || '1', 10);
        const waitMs = Math.max(retryAfter, 1) * 1000 + attempt * 500;
        console.log(`[Dropbox] Rate limited, retrying in ${waitMs}ms (attempt ${attempt + 1}/${maxRetries})`);
        await sleep(waitMs);
        continue;
      }
      throw err;
    }
  }
  throw new Error('withRetry: unreachable');
}

/** Create a folder (ignores "conflict" = folder already exists) */
async function ensureFolder(path: string): Promise<void> {
  await withRetry(async () => {
    const token = await getAccessToken();
    try {
      await axios.post(
        'https://api.dropboxapi.com/2/files/create_folder_v2',
        { path, autorename: false },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
    } catch (err: any) {
      // 409 conflict with "path/conflict/folder" means folder already exists — that's fine
      const tag = err?.response?.data?.error?.path?.['.tag'];
      if (tag === 'conflict') return;
      throw err;
    }
  });
}

/** Upload a file (overwrite if exists) */
async function uploadFile(
  path: string,
  content: Buffer,
): Promise<void> {
  await withRetry(async () => {
    const token = await getAccessToken();
    await axios.post(
      'https://content.dropboxapi.com/2/files/upload',
      content,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/octet-stream',
          'Dropbox-API-Arg': JSON.stringify({
            path,
            mode: 'overwrite',
            autorename: false,
            mute: false,
          }),
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );
  });
}

/** Create a shared link for a folder (return existing one if any) */
async function getOrCreateSharedLink(path: string): Promise<string> {
  return withRetry(async () => {
    const token = await getAccessToken();
    try {
      const res = await axios.post(
        'https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings',
        { path, settings: { requested_visibility: 'public', audience: 'public' } },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      return res.data.url;
    } catch (err: any) {
      // If link already exists, fetch it
      const tag = err?.response?.data?.error?.['.tag'];
      if (tag === 'shared_link_already_exists') {
        const listRes = await axios.post(
          'https://api.dropboxapi.com/2/sharing/list_shared_links',
          { path, direct_only: true },
          { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
        );
        if (listRes.data.links?.length > 0) {
          return listRes.data.links[0].url;
        }
      }
      throw err;
    }
  });
}

// ── Public API (same interface as the old drive.ts) ─────────────

export async function ensureHebdoFolderStructure(
  hebdoLabel: string,
  paperTypes: { drive_folder_name: string }[]
): Promise<{ hebdoFolderId: string; hebdoFolderUrl: string }> {
  const root = rootFolder();
  const hebdoPath = `${root}/${hebdoLabel}`;

  // Create root + hebdo folder
  await ensureFolder(root);
  await ensureFolder(hebdoPath);

  // Create type subfolders sequentially to avoid Dropbox rate limits
  for (const pt of paperTypes) {
    await ensureFolder(`${hebdoPath}/${pt.drive_folder_name}`);
  }

  // Get shared link for the hebdo folder
  const hebdoFolderUrl = await getOrCreateSharedLink(hebdoPath);

  console.log(`[Dropbox] Folder structure created for ${hebdoLabel}: ${paperTypes.length} subfolders`);

  return { hebdoFolderId: hebdoPath, hebdoFolderUrl };
}

export interface UploadDeliveryParams {
  hebdoNumber: string;        // e.g. "RSH225"
  driveFolderName: string;    // e.g. "Chronique cinema" (from paper_type config)
  journalistName: string;     // e.g. "Xavier Bonnet"
  subject?: string;           // e.g. "Bukowski" (for Interview type)
  docxBuffer: Buffer;
  docxFileName: string;
  imageBuffer: Buffer;
  imageFileName: string;
  imageMimeType: string;      // kept for interface compatibility
}

export async function uploadDelivery(params: UploadDeliveryParams): Promise<{
  folderUrl: string;
  docxUrl: string;
  imageUrl: string;
}> {
  const root = rootFolder();
  const hebdoPath = `${root}/${params.hebdoNumber}`;

  // Build the subfolder name based on type
  let subFolderName = params.driveFolderName;
  if (subFolderName.toLowerCase().startsWith('interview') && params.subject) {
    subFolderName = `Interview ${params.subject}`;
  }
  if (subFolderName.toLowerCase().includes('livres et expo') && params.journalistName) {
    subFolderName = `${subFolderName} ${params.journalistName}`;
  }

  const typePath = `${hebdoPath}/${subFolderName}`;

  // For "Chroniques Musique" or "Chronique cinema", create journalist subfolder
  let targetPath = typePath;
  const needsJournalistSubfolder = ['chroniques musique', 'chronique cinema'].some(
    (t) => params.driveFolderName.toLowerCase().includes(t)
  );
  if (needsJournalistSubfolder && params.journalistName) {
    targetPath = `${typePath}/${params.journalistName}`;
  }

  // Ensure all folders exist
  await ensureFolder(root);
  await ensureFolder(hebdoPath);
  await ensureFolder(typePath);
  if (targetPath !== typePath) {
    await ensureFolder(targetPath);
  }

  // Upload files in parallel
  const docxPath = `${targetPath}/${params.docxFileName}`;
  const imagePath = `${targetPath}/${params.imageFileName}`;

  await Promise.all([
    uploadFile(docxPath, params.docxBuffer),
    uploadFile(imagePath, params.imageBuffer),
  ]);

  // Get shared links sequentially to avoid rate limits
  const folderUrl = await getOrCreateSharedLink(targetPath);
  const docxUrl = await getOrCreateSharedLink(docxPath);
  const imageUrl = await getOrCreateSharedLink(imagePath);

  console.log(`[Dropbox] Files uploaded to ${targetPath}`);

  return { folderUrl, docxUrl, imageUrl };
}
