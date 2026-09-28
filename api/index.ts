process.env.VERCEL = '1';

import type { Request, Response } from 'express';
import app from '../server.ts';
import { syncWithCloud } from '../src/db/cloudSync.ts';

let cloudSyncPromise: Promise<void> | null = null;
function ensureCloudSync(): Promise<void> {
  if (!cloudSyncPromise) {
    cloudSyncPromise = syncWithCloud().catch((err) => {
      console.warn('Vercel serverless cloud sync note:', err?.message || err);
    });
  }
  return cloudSyncPromise;
}

export default async function handler(req: Request, res: Response) {
  // Normalize req.url so both /api/... and stripped /... work seamlessly on Vercel
  if (req.url && !req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }

  // Handle CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Ensure latest Firestore data is synchronized into localStore before handling request
  try {
    const isMutation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method || '');
    await syncWithCloud(isMutation);
  } catch (err) {
    console.warn('Vercel serverless cloud sync note:', err);
  }

  return app(req, res);
}
