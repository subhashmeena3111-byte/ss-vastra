import type { Product } from '../types.ts';
import { normalizeProductImageUrl } from './imageUtils.ts';

export const FALLBACK_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80';

export function normalizeProductSizes(sizes: any): string[] {
  if (Array.isArray(sizes)) {
    const cleaned = sizes
      .map((s) => (typeof s === 'string' ? s.trim() : String(s || '').trim()))
      .filter((s) => s.length > 0);
    return cleaned.length > 0 ? cleaned : ['Free Size'];
  }

  if (typeof sizes === 'string') {
    const trimmed = sizes.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return normalizeProductSizes(parsed);
        }
      } catch {}
    }
    if (trimmed.includes(',')) {
      const split = trimmed
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      return split.length > 0 ? split : ['Free Size'];
    }
    if (trimmed.length > 0) {
      return [trimmed];
    }
  }

  return ['Free Size'];
}

export function normalizeProductHighlights(highlights: any): string[] {
  if (Array.isArray(highlights)) {
    return highlights
      .map((h) => (typeof h === 'string' ? h.trim() : String(h || '').trim()))
      .filter((h) => h.length > 0);
  }

  if (typeof highlights === 'string') {
    const trimmed = highlights.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return normalizeProductHighlights(parsed);
        }
      } catch {}
    }
    if (trimmed.includes(',')) {
      return trimmed
        .split(',')
        .map((h) => h.trim())
        .filter(Boolean);
    }
    if (trimmed.length > 0) {
      return [trimmed];
    }
  }

  return [];
}

export function sanitizeProduct(p: any): Product {
  if (!p || typeof p !== 'object') {
    return {
      id: Date.now(),
      name: 'Jaipuri Ethnic Outfit',
      slug: 'jaipuri-ethnic-outfit',
      category: 'Kurta Sets',
      price: 1499,
      originalPrice: 1999,
      discountPercent: 25,
      sizes: ['S', 'M', 'L', 'XL'],
      stock: 50,
      image: FALLBACK_PRODUCT_IMAGE,
      description: '',
      fabric: 'Pure Cotton Mulmul',
      color: '',
      highlights: ['Handmade Jaipuri Work', 'Fast Delivery'],
      isNewArrival: false,
      isBestSeller: false,
      isFeatured: false,
      isActive: true,
      gallery: [FALLBACK_PRODUCT_IMAGE],
    };
  }

  const rawImage = typeof p.image === 'string' && p.image ? p.image : FALLBACK_PRODUCT_IMAGE;
  const image = normalizeProductImageUrl(rawImage);
  const sizes = normalizeProductSizes(p.sizes);
  const highlights = normalizeProductHighlights(p.highlights);

  let rawGallery: string[] = [];
  if (Array.isArray(p.gallery) && p.gallery.length > 0) {
    rawGallery = p.gallery;
  } else if (Array.isArray(p.images) && p.images.length > 0) {
    rawGallery = p.images;
  } else {
    rawGallery = [image];
  }
  const gallery = rawGallery.map((g) => normalizeProductImageUrl(g));

  const price = typeof p.price === 'number' && !isNaN(p.price) ? p.price : Number(p.price) || 999;
  const originalPrice =
    typeof p.originalPrice === 'number' && !isNaN(p.originalPrice)
      ? p.originalPrice
      : Number(p.originalPrice) || price;

  const discountPercent =
    typeof p.discountPercent === 'number' && !isNaN(p.discountPercent)
      ? p.discountPercent
      : Math.max(0, Math.round(((originalPrice - price) / originalPrice) * 100));

  return {
    ...p,
    id: typeof p.id === 'number' && !isNaN(p.id) ? p.id : Number(p.id) || Date.now(),
    name: String(p.name || 'Jaipuri Outfit'),
    slug: String(p.slug || `outfit-${Date.now()}`),
    category: String(p.category || 'Kurta Sets'),
    price,
    originalPrice,
    discountPercent,
    sizes,
    stock: typeof p.stock === 'number' && !isNaN(p.stock) ? p.stock : Number(p.stock) || 50,
    image,
    gallery,
    description: String(p.description || ''),
    fabric: String(p.fabric || 'Cotton Blend'),
    color: String(p.color || ''),
    highlights,
    isNewArrival: Boolean(p.isNewArrival),
    isBestSeller: Boolean(p.isBestSeller),
    isFeatured: Boolean(p.isFeatured),
    isActive: p.isActive !== false,
  };
}

export function sanitizeProductList(list: any[]): Product[] {
  if (!Array.isArray(list)) return [];
  return list.map(sanitizeProduct).filter((p) => p.isActive);
}
