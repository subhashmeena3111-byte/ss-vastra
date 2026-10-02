process.env.VERCEL = '1';

import type { Request, Response } from 'express';

let appInstance: any = null;
let appLoadError: any = null;

async function getApp() {
  if (appInstance) return appInstance;
  if (appLoadError) throw appLoadError;
  try {
    process.env.VERCEL = '1';
    const serverMod = await import('../server.ts');
    appInstance = serverMod.default || serverMod.app;
    return appInstance;
  } catch (err) {
    appLoadError = err;
    throw err;
  }
}

export default async function handler(req: Request, res: Response) {
  // Normalize req.url so both /api/... and stripped /... work seamlessly on Vercel
  const allParam = (req as any).query?.all;
  const matchedPath = (req.headers['x-matched-path'] as string) || '';

  if (allParam) {
    const subpath = Array.isArray(allParam) ? allParam.join('/') : allParam;
    const queryIdx = (req.url || '').indexOf('?');
    const qs = queryIdx !== -1 ? (req.url || '').slice(queryIdx) : '';
    req.url = `/api/${subpath}${qs}`;
  } else if (matchedPath && matchedPath.startsWith('/api') && (req.url === '/api' || req.url === '/api/')) {
    const queryIdx = (req.url || '').indexOf('?');
    const qs = queryIdx !== -1 ? (req.url || '').slice(queryIdx) : '';
    req.url = `${matchedPath}${qs}`;
  } else if (req.url && !req.url.startsWith('/api')) {
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

  // Quick health response without loading heavy server bundle
  if (req.url === '/api' || req.url === '/api/' || req.url === '/api/health') {
    return res.status(200).json({
      success: true,
      service: 'SS VASTRA API',
      status: 'online',
      env: 'vercel-serverless',
      time: new Date().toISOString(),
    });
  }

  try {
    const app = await getApp();
    return app(req, res);
  } catch (err: any) {
    console.error('Vercel serverless load error:', err);
    return res.status(200).json({
      success: false,
      diagnosticError: true,
      message: err?.message || String(err),
      stack: err?.stack,
    });
  }
}
