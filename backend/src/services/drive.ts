import { google } from 'googleapis';
import { Readable } from 'stream';

function getAuthClient() {
  const credentials = JSON.parse(process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON || '{}');
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  return auth;
}

function getDrive() {
  return google.drive({ version: 'v3', auth: getAuthClient() });
}

// Find or create a folder inside a parent
async function findOrCreateFolder(name: string, parentId: string): Promise<string> {
  const drive = getDrive();

  // Search for existing folder
  const res = await drive.files.list({
    q: `name='${name.replace(/'/g, "\\'")}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive',
  });

  if (res.data.files && res.data.files.length > 0) {
    return res.data.files[0].id!;
  }

  // Create folder
  const folder = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: 'id',
  });

  return folder.data.id!;
}

// Upload a file to a specific folder
async function uploadFile(
  fileName: string,
  mimeType: string,
  content: Buffer,
  folderId: string
): Promise<{ id: string; webViewLink: string }> {
  const drive = getDrive();

  const file = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: Readable.from(content),
    },
    fields: 'id, webViewLink',
  });

  return {
    id: file.data.id!,
    webViewLink: file.data.webViewLink || '',
  };
}

// Get a link to a folder
async function getFolderLink(folderId: string): Promise<string> {
  const drive = getDrive();
  const res = await drive.files.get({
    fileId: folderId,
    fields: 'webViewLink',
  });
  return res.data.webViewLink || `https://drive.google.com/drive/folders/${folderId}`;
}

// Create the full folder structure for a hebdo number in one go
// Called on first delivery to a hebdo — creates RSH226/ + all type subfolders
export async function ensureHebdoFolderStructure(
  hebdoLabel: string,
  paperTypes: { drive_folder_name: string }[]
): Promise<{ hebdoFolderId: string; hebdoFolderUrl: string }> {
  const parentFolderId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID!;

  // 1. Create/find the hebdo root folder (e.g. RSH226)
  const hebdoFolderId = await findOrCreateFolder(hebdoLabel, parentFolderId);

  // 2. Create all type subfolders in parallel
  await Promise.all(
    paperTypes.map((pt) => findOrCreateFolder(pt.drive_folder_name, hebdoFolderId))
  );

  const hebdoFolderUrl = await getFolderLink(hebdoFolderId);

  console.log(`[Drive] Folder structure created for ${hebdoLabel}: ${paperTypes.length} subfolders`);

  return { hebdoFolderId, hebdoFolderUrl };
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
  imageMimeType: string;
}

export async function uploadDelivery(params: UploadDeliveryParams): Promise<{
  folderUrl: string;
  docxUrl: string;
  imageUrl: string;
}> {
  const parentFolderId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID!;

  // 1. Find or create RSH{number} folder
  const hebdoFolderId = await findOrCreateFolder(params.hebdoNumber, parentFolderId);

  // 2. Build the subfolder name based on type
  let subFolderName = params.driveFolderName;
  // For "Interview" types, append the subject
  if (subFolderName.toLowerCase().startsWith('interview') && params.subject) {
    subFolderName = `Interview ${params.subject}`;
  }
  // For types like "Livres et expo", append journalist name
  if (subFolderName.toLowerCase().includes('livres et expo') && params.journalistName) {
    subFolderName = `${subFolderName} ${params.journalistName}`;
  }

  const typeFolderId = await findOrCreateFolder(subFolderName, hebdoFolderId);

  // 3. For "Chroniques Musique" or "Chronique cinema", create journalist subfolder
  let targetFolderId = typeFolderId;
  const needsJournalistSubfolder = ['chroniques musique', 'chronique cinema'].some(
    t => params.driveFolderName.toLowerCase().includes(t)
  );
  if (needsJournalistSubfolder && params.journalistName) {
    targetFolderId = await findOrCreateFolder(params.journalistName, typeFolderId);
  }

  // 4. Upload files
  const [docxResult, imageResult] = await Promise.all([
    uploadFile(params.docxFileName, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', params.docxBuffer, targetFolderId),
    uploadFile(params.imageFileName, params.imageMimeType, params.imageBuffer, targetFolderId),
  ]);

  const folderUrl = await getFolderLink(targetFolderId);

  return {
    folderUrl,
    docxUrl: docxResult.webViewLink,
    imageUrl: imageResult.webViewLink,
  };
}
