process.env.VERCEL = '1';

import type { Request, Response } from 'express';
import fs from 'fs';

function loadFallbackProducts() {
  try {
    const filePath = new URL('./defaultProducts.json', import.meta.url);
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    return [];
  }
}

let appInstance: any = null;
let appLoadPromise: Promise<any> | null = null;

async function getApp(): Promise<any> {
  if (appInstance) return appInstance;
  if (!appLoadPromise) {
    appLoadPromise = (async () => {
      try {
        const mod = await import('./_server.js');
        appInstance = mod.default || mod.app;
        return appInstance;
      } catch (err1: any) {
        console.warn('Could not load api/_server.js:', err1?.message || err1);
        throw err1;
      }
    })();
  }
  return appLoadPromise;
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

  // Attempt standard Express handling via bundled server
  try {
    const app = await getApp();
    return app(req, res);
  } catch (err: any) {
    console.warn('Server handling fallback to standalone catalog responder:', err?.message || err);

    // Bulletproof Fallback: If GET /api/products, return curated Jaipur outfits directly!
    const pathname = (req.url || '').split('?')[0].toLowerCase();
    if (req.method === 'GET' && (pathname === '/api/products' || pathname === '/products')) {
      const prods = loadFallbackProducts();
      return res.status(200).json({
        success: true,
        source: 'serverless-catalog',
        products: prods,
      });
    }

    if (req.method === 'GET' && (pathname === '/api/categories' || pathname === '/categories')) {
      return res.status(200).json({
        success: true,
        source: 'serverless-catalog',
        categories: [
          { id: 1, slug: 'kurta-sets', name: 'Kurta Sets', icon: '👗', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80', description: 'Graceful embroidered and printed ethnic kurta sets.', displayOrder: 1 },
          { id: 2, slug: 'co-ord-sets', name: 'Co-ord Sets', icon: '👚', image: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=600&q=80', description: 'Contemporary matching sets designed for festive flair.', displayOrder: 2 },
          { id: 3, slug: 'anarkali-dresses', name: 'Anarkali & Dresses', icon: '💃', image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=600&q=80', description: 'Flowing flares, fine muslin cotton and gotapatti lace.', displayOrder: 3 },
          { id: 4, slug: 'kurta-kurtis', name: 'Kurta / Kurtis', icon: '🌸', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80', description: 'Breathable Jaipur cotton tunics and daily office staples.', displayOrder: 4 },
          { id: 5, slug: 'festive-fits', name: 'Festive Fits', icon: '👑', image: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=600&q=80', description: 'Rich Chanderi, zari borders and celebratory suits.', displayOrder: 5 },
          { id: 6, slug: 'fabrics', name: 'Fabrics', icon: '🧵', image: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?auto=format&fit=crop&w=600&q=80', description: 'Direct from Sanganer master wooden handblock cambric & mulmul cotton.', displayOrder: 6 },
          { id: 7, slug: 'new-arrivals', name: 'New Arrivals', icon: '🌟', image: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=600&q=80', description: 'Freshly loomed designs and latest seasonal silhouettes.', displayOrder: 7 },
          { id: 8, slug: 'best-sellers', name: 'Best Sellers', icon: '🔥', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80', description: 'Most loved Jaipur creations ordered across India.', displayOrder: 8 },
        ],
      });
    }

    if (req.method === 'GET' && (pathname === '/api/reels' || pathname === '/reels')) {
      return res.status(200).json({
        success: true,
        source: 'serverless-reels',
        reels: [],
      });
    }

    return res.status(200).json({
      success: false,
      diagnosticError: true,
      message: err?.message || String(err),
      stack: err?.stack,
    });
  }
}
