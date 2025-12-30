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
      return reject(new Error("La API de Google no se ha cargado. Verifique su conexión o bloqueadores de anuncios."));
    }
    
    try {
      // @ts-ignore
      const client = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: (response: any) => {
          if (response.error) {
            console.error("Google Auth Error:", response);
            return reject(new Error(`Error de autenticación: ${response.error_description || response.error}`));
          }
          resolve(response.access_token);
        },
        error_callback: (err: any) => {
          console.error("Google Auth Client Error:", err);
          reject(new Error("No se pudo abrir el diálogo de autenticación."));
        }
      });
      client.requestAccessToken();
    } catch (e: any) {
      reject(new Error(`Fallo crítico en OAuth: ${e.message}`));
    }
  });
};

/**
 * Búsqueda de carpeta por nombre dentro de un directorio padre.
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
 * Creación de carpeta nueva.
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
    throw new Error("No se pudo crear la subcarpeta en Drive.");
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
    throw new Error(`Error al subir archivo a Drive: ${errorText}`);
  }

  return await response.json();
};