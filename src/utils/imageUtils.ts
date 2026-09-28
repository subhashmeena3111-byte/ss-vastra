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

const GUARANTEED_FALLBACK =
  'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80';

/**
 * Transforms any Google Drive URL (view link, sharing link, export link, etc.)
 * into a direct high-speed preview URL or proxied URL that renders directly in standard <img> tags.
 */
export function normalizeProductImageUrl(url?: string | null): string {
  if (!url) return GUARANTEED_FALLBACK;

  const trimmed = url.trim();
  if (!trimmed) return GUARANTEED_FALLBACK;

  // Direct local base64 or upload path
  if (trimmed.startsWith('data:image/') || trimmed.startsWith('/api/uploads/') || trimmed.startsWith('/uploads/')) {
    return trimmed;
  }

  // If it's a Google Drive URL, route through our resilient server proxy so it never fails on login redirects
  if (isGoogleDriveUrl(trimmed)) {
    const driveId = extractDriveFileId(trimmed);
    if (driveId) {
      return `/api/image-proxy?url=${encodeURIComponent(`https://drive.google.com/uc?export=download&id=${driveId}`)}`;
    }
    return `/api/image-proxy?url=${encodeURIComponent(trimmed)}`;
  }

  return trimmed;
}

/**
 * Fallback URL in case a specific Google CDN domain faces temporary connectivity issues
 */
export function getDriveThumbnailUrl(url: string): string {
  const driveId = extractDriveFileId(url);
  if (driveId) {
    return `/api/image-proxy?url=${encodeURIComponent(`https://drive.google.com/uc?export=download&id=${driveId}`)}`;
  }
  return GUARANTEED_FALLBACK;
}
