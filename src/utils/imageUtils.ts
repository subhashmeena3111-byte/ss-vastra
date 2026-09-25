/**
 * Utilities for resolving, normalizing, and handling Google Drive and catalog image URLs.
 */

const DRIVE_PATTERNS = [
  /\/file\/d\/([a-zA-Z0-9_-]+)/,
  /[?&]id=([a-zA-Z0-9_-]+)/,
  /googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/,
  /\/thumbnail\?id=([a-zA-Z0-9_-]+)/,
  /\/d\/([a-zA-Z0-9_-]+)/,
];

export function extractDriveFileId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  for (const pattern of DRIVE_PATTERNS) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

export function isGoogleDriveUrl(url: string): boolean {
  if (!url) return false;
  return (
    url.includes('drive.google.com') ||
    url.includes('googleusercontent.com/d/') ||
    url.includes('docs.google.com/uc')
  );
}

/**
 * Transforms any Google Drive URL (view link, sharing link, export link, etc.)
 * into a direct high-speed preview URL that renders directly in standard <img> tags.
 */
export function normalizeProductImageUrl(url?: string | null): string {
  if (!url) return 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80';

  const trimmed = url.trim();
  if (!trimmed) return 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80';

  // If it's already a high-speed direct Google CDN link, keep it
  if (trimmed.startsWith('https://lh3.googleusercontent.com/d/')) {
    return trimmed;
  }

  // If it is a Google Drive URL of any format, extract the file ID
  const driveId = extractDriveFileId(trimmed);
  if (driveId) {
    return `https://lh3.googleusercontent.com/d/${driveId}`;
  }

  return trimmed;
}

/**
 * Fallback URL in case a specific Google CDN domain faces temporary connectivity issues
 */
export function getDriveThumbnailUrl(url: string): string {
  const driveId = extractDriveFileId(url);
  if (driveId) {
    return `https://drive.google.com/thumbnail?id=${driveId}&sz=w1600`;
  }
  return normalizeProductImageUrl(url);
}
