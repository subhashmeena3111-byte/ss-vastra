process.env.VERCEL = '1';

import type { Request, Response } from 'express';
import app from '../server.ts';

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

  // Quick health response
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
    return app(req, res);
  } catch (err: any) {
    console.error('Vercel serverless uncaught error:', err);
    return res.status(500).json({
      success: false,
      diagnosticError: true,
      message: err?.message || String(err),
      stack: err?.stack,
    });
  }
}
