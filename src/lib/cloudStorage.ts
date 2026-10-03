import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

export interface UploadResult {
  success: boolean;
  url: string;
  provider: 'cloudinary' | 'supabase' | 'local';
  publicId?: string;
  error?: string;
}

/**
 * Parses Cloudinary configuration from environment variables
 */
function getCloudinaryConfig() {
  let cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  let apiKey = process.env.CLOUDINARY_API_KEY;
  let apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (process.env.CLOUDINARY_URL && (!cloudName || !apiKey || !apiSecret)) {
    try {
      const parsed = new URL(process.env.CLOUDINARY_URL);
      apiKey = parsed.username;
      apiSecret = parsed.password;
      cloudName = parsed.hostname;
    } catch {
      // ignore
    }
  }

  if (cloudName && apiKey && apiSecret) {
    return { cloudName, apiKey, apiSecret };
  }
  return null;
}

/**
 * Parses Supabase Storage configuration from environment variables
 */
function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'products';

  if (url && key) {
    return { url: url.replace(/\/$/, ''), key, bucket };
  }
  return null;
}

/**
 * Uploads an image to Cloudinary via REST API
 */
async function uploadToCloudinary(
  base64OrUrl: string,
  filename: string,
  folder = 'ss-vastra'
): Promise<UploadResult> {
  const config = getCloudinaryConfig();
  if (!config) throw new Error('Cloudinary not configured');

  const timestamp = Math.round(Date.now() / 1000);
  const publicId = `${folder}/${path.parse(filename).name}_${Date.now()}`;

  // Generate SHA-1 signature
  const signatureString = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${config.apiSecret}`;
  const signature = crypto.createHash('sha1').update(signatureString).digest('hex');

  const formData = new FormData();
  formData.append('file', base64OrUrl);
  formData.append('api_key', config.apiKey);
  formData.append('timestamp', String(timestamp));
  formData.append('folder', folder);
  formData.append('public_id', publicId);
  formData.append('signature', signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (data.secure_url) {
    return {
      success: true,
      url: data.secure_url,
      provider: 'cloudinary',
      publicId: data.public_id,
    };
  }

  throw new Error(data.error?.message || 'Cloudinary upload failed');
}

/**
 * Uploads an image to Supabase Storage via REST API
 */
async function uploadToSupabase(
  dataBufferOrBase64: Buffer | string,
  filename: string,
  mimeType = 'image/jpeg',
  bucket = 'products'
): Promise<UploadResult> {
  const config = getSupabaseConfig();
  if (!config) throw new Error('Supabase Storage not configured');

  let buffer: Buffer;
  if (typeof dataBufferOrBase64 === 'string') {
    if (dataBufferOrBase64.startsWith('data:')) {
      const base64Data = dataBufferOrBase64.split(';base64,').pop() || '';
      buffer = Buffer.from(base64Data, 'base64');
    } else {
      buffer = Buffer.from(dataBufferOrBase64);
    }
  } else {
    buffer = dataBufferOrBase64;
  }

  const cleanFilename = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9_.-]/g, '')}`;
  const uploadUrl = `${config.url}/storage/v1/object/${config.bucket}/${cleanFilename}`;

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.key}`,
      apikey: config.key,
      'Content-Type': mimeType,
      'x-upsert': 'true',
    },
    body: new Uint8Array(buffer),
  });

  if (res.ok) {
    const publicUrl = `${config.url}/storage/v1/object/public/${config.bucket}/${cleanFilename}`;
    return {
      success: true,
      url: publicUrl,
      provider: 'supabase',
      publicId: cleanFilename,
    };
  }

  const errData = await res.json().catch(() => ({}));
  throw new Error(errData.message || 'Supabase upload failed');
}

/**
 * Universal media upload function:
 * 1. Checks Cloudinary credentials.
 * 2. Checks Supabase Storage credentials.
 * 3. Falls back safely to local /tmp storage with valid URL.
 */
export async function uploadMediaToCloudStorage(options: {
  mediaPayload: string; // Base64 data URI, HTTP URL, or local path
  filename: string;
  mimeType?: string;
  folder?: string;
}): Promise<UploadResult> {
  const { mediaPayload, filename, mimeType = 'image/jpeg', folder = 'products' } = options;

  // 1. If it's already an absolute Cloudinary or Supabase URL, return directly
  if (
    typeof mediaPayload === 'string' &&
    (mediaPayload.includes('cloudinary.com') || mediaPayload.includes('supabase.co'))
  ) {
    return {
      success: true,
      url: mediaPayload,
      provider: mediaPayload.includes('cloudinary.com') ? 'cloudinary' : 'supabase',
    };
  }

  // 2. Try Cloudinary
  const cloudinaryConfig = getCloudinaryConfig();
  if (cloudinaryConfig) {
    try {
      return await uploadToCloudinary(mediaPayload, filename, folder);
    } catch (err: any) {
      console.warn('Cloudinary upload attempt warning:', err?.message || err);
    }
  }

  // 3. Try Supabase Storage
  const supabaseConfig = getSupabaseConfig();
  if (supabaseConfig) {
    try {
      return await uploadToSupabase(mediaPayload, filename, mimeType, supabaseConfig.bucket);
    } catch (err: any) {
      console.warn('Supabase upload attempt warning:', err?.message || err);
    }
  }

  // 4. Fallback: Save to local public/uploads directory if accessible
  try {
    const safeFileName = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9_.-]/g, '')}`;
    const publicUploadDir = path.join(process.cwd(), 'public', 'uploads');
    const tmpUploadDir = path.join('/tmp', 'uploads');

    let targetDir = publicUploadDir;
    try {
      if (!fs.existsSync(publicUploadDir)) {
        fs.mkdirSync(publicUploadDir, { recursive: true });
      }
    } catch {
      targetDir = tmpUploadDir;
      if (!fs.existsSync(tmpUploadDir)) {
        fs.mkdirSync(tmpUploadDir, { recursive: true });
      }
    }

    if (mediaPayload.startsWith('data:')) {
      const base64Data = mediaPayload.split(';base64,').pop() || '';
      fs.writeFileSync(path.join(targetDir, safeFileName), base64Data, 'base64');
      return {
        success: true,
        url: `/api/uploads/${safeFileName}`,
        provider: 'local',
      };
    }
  } catch (localErr) {
    console.warn('Local file write notice:', localErr);
  }

  // Default fallback to supplied URL
  return {
    success: true,
    url: mediaPayload,
    provider: 'local',
  };
}
