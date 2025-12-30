
interface DriveUploadParams {
  accessToken: string;
  name: string;
  blob: Blob;
  parentId?: string;
}

export const initDriveAuth = (clientId: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    // @ts-ignore
    if (typeof google === 'undefined' || !google?.accounts?.oauth2) {
      return reject(new Error("Google API not loaded. Check your connection or ad-blockers."));
    }
    
    try {
      // @ts-ignore
      const client = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: (response: any) => {
          if (response.error) {
            console.error("Google Auth Error:", response);
            return reject(new Error(`Authentication error: ${response.error_description || response.error}`));
          }
          resolve(response.access_token);
        },
        error_callback: (err: any) => {
          console.error("Google Auth Client Error:", err);
          reject(new Error("Could not open authentication dialog."));
        }
      });
      client.requestAccessToken();
    } catch (e: any) {
      reject(new Error(`OAuth critical failure: ${e.message}`));
    }
  });
};

/**
 * Find folder by name within a parent directory.
 */
export const findFolderByName = async (accessToken: string, folderName: string, parentId?: string): Promise<string | null> => {
  let query = `name = '${folderName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  if (parentId) {
    query += ` and '${parentId}' in parents`;
  }

  const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id, name)`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("Drive Search Error:", error);
    return null;
  }
  
  const data = await response.json();
  return data.files && data.files.length > 0 ? data.files[0].id : null;
};

/**
 * Create a new folder.
 */
export const createFolder = async (accessToken: string, folderName: string, parentId?: string): Promise<string> => {
  const metadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
    parents: parentId ? [parentId] : undefined
  };

  const response = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(metadata)
  });

  if (!response.ok) {
    throw new Error("Could not create subfolder on Google Drive.");
  }

  const data = await response.json();
  return data.id;
};

export const uploadToDrive = async ({ accessToken, name, blob, parentId }: DriveUploadParams) => {
  const metadata = {
    name: name,
    parents: parentId ? [parentId] : undefined,
    mimeType: 'application/pdf',
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', blob);

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: form,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Drive upload error: ${errorText}`);
  }

  return await response.json();
};
