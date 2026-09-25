// Pure local, free, standalone image upload handler (No Google Cloud / Drive required)

export async function uploadLocalImage(blob: Blob, fileName: string): Promise<{ directUrl: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64data = reader.result as string;
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: base64data,
            fileName: fileName,
          }),
        });
        const data = await res.json();
        if (data.success && data.url) {
          resolve({ directUrl: data.url });
          return;
        }
      } catch {
        // Fallback to data URL directly
      }
      resolve({ directUrl: base64data });
    };
    reader.onerror = () => {
      resolve({ directUrl: '' });
    };
    reader.readAsDataURL(blob);
  });
}

// Backward-compatible replacements for previous Google Drive callers
export async function ensureDriveAuth(): Promise<string> {
  return 'local_storage_mode';
}

export function getAccessToken(): string {
  return 'local_storage_mode';
}

export async function uploadImageToDrive(
  _token: string,
  blob: Blob,
  fileName: string,
  _folderName?: string
): Promise<{ directUrl: string; fileId: string }> {
  const res = await uploadLocalImage(blob, fileName);
  return {
    directUrl: res.directUrl,
    fileId: `local_${Date.now()}`,
  };
}
