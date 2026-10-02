import { Product } from '../types.ts';

export interface RawDefaultProduct {
  id: number;
  slug: string;
  name: string;
  category: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  sizes: string[];
  stock: number;
  image: string;
  gallery: string[];
  description: string;
  fabric: string;
  color: string;
  colors: string[];
  highlights: string[];
  isNewArrival: boolean;
  isBestSeller: boolean;
  isFeatured: boolean;
  isSpotlight?: boolean;
  isOutfit?: boolean;
  isActive: boolean;
  isDemo: boolean;
  createdAt: string;
}

export const RAW_DEFAULT_PRODUCTS: RawDefaultProduct[] = [
  {
    id: 12,
    slug: 'olive-green-embroidered-3-piece-suit-set-977',
    name: 'Olive Green Embroidered 3-Piece Suit Set',
    category: 'Kurta Sets',
    price: 999,
    originalPrice: 1999,
    discountPercent: 50,
    sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'],
    stock: 100,
    image: '/api/uploads/1790776717697_DE5C3FC2-E25A-42B5-B4C2-E0AD1E1CBC1B_png.jpg',
    gallery: [
      '/api/uploads/1790776717697_DE5C3FC2-E25A-42B5-B4C2-E0AD1E1CBC1B_png.jpg',
      '/api/uploads/1790776723859_8DC8AAD9-C440-4549-8011-29EB8CCC21FB_png.jpg',
      '/api/uploads/1790776729293_8AFA4156-3FBD-4126-B3C1-6A47F098A566_png.jpg',
      '/api/uploads/1790776733479_55D07E03-4236-427E-B8E9-15B97B6C2784_png.jpg',
    ],
    description: 'Royal olive green elegance with delicate embroidery and a graceful dupatta — a timeless ethnic look by SS VASTRA. ✨\n\nAvailable Sizes: S, M, L, XL, XXL, 3XL\nFit: Regular Fit\nLength: Long Kurta\nBottom: Straight Fit Pants\nSleeves: 3/4 Sleeves',
    fabric: 'Premium Rayon Blend',
    color: 'Olive Green with Gold Embroidery',
    colors: ['Olive Green'],
    highlights: ['Delicate Gold Embroidery', '3-Piece Festive Set', 'Straight Fit Pants', 'Fast Dispatch'],
    isNewArrival: true,
    isBestSeller: true,
    isFeatured: true,
    isSpotlight: true,
    isOutfit: true,
    isActive: true,
    isDemo: false,
    createdAt: '2026-09-30T14:01:36.886Z',
  },
  {
    id: 11,
    slug: 'red-floral-embroidered-kurta-pant-set-with-dupatta-519',
    name: 'Red Floral Embroidered Kurta Pant Set with Dupatta',
    category: 'Kurta Sets',
    price: 999,
    originalPrice: 2999,
    discountPercent: 67,
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 99,
    image: '/api/uploads/1790762637327_E98EF014-C501-4A97-9A45-B237E0283D81_png.jpg',
    gallery: [
      '/api/uploads/1790762637327_E98EF014-C501-4A97-9A45-B237E0283D81_png.jpg',
      '/api/uploads/1790762718131_D3312AF4-E11D-477D-BBB1-2D30ED4DA54F_png.jpg',
      '/api/uploads/1790762861999_FF04CE96-FD79-441F-854D-38A5CC34F507_png.jpg',
      '/api/uploads/1790762912677_D30D4ECA-C5C6-4140-8739-E869A56D8998_png.jpg',
    ],
    description: 'Red Floral Embroidered 3-Piece Suit Set — SS VASTRA\n\nElevate your ethnic wardrobe with this elegant red embroidered suit set from SS VASTRA. Featuring beautiful multicolor floral embroidery, a graceful V-neckline, detailed sleeves and a matching embroidered dupatta, this outfit combines traditional charm with a modern silhouette.\n\nSet Includes: Kurta, Pant & Dupatta\nFabric: Premium Cotton Blend\nColor: Red / Rani Red',
    fabric: 'Premium Cotton Blend',
    color: 'Red / Rani Red',
    colors: ['Red', 'Rani Red'],
    highlights: ['Multicolor Floral Embroidery', 'Graceful V-Neckline', 'Matching Embroidered Dupatta', 'Pure Fabric'],
    isNewArrival: true,
    isBestSeller: true,
    isFeatured: true,
    isSpotlight: true,
    isOutfit: true,
    isActive: true,
    isDemo: false,
    createdAt: '2026-09-30T10:11:11.351Z',
  },
  {
    id: 10,
    slug: 'peach-embroidered-kurta-pant-dupatta-suit-set--576',
    name: 'Peach Embroidered Kurta Pant & Dupatta Suit Set',
    category: 'Kurta Sets',
    price: 999,
    originalPrice: 1999,
    discountPercent: 50,
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 100,
    image: '/api/uploads/1790761962059_05E9E31B-E53C-49FE-8C19-6DF3DCAD364A_png.jpg',
    gallery: [
      '/api/uploads/1790761962059_05E9E31B-E53C-49FE-8C19-6DF3DCAD364A_png.jpg',
      '/api/uploads/1790761966940_378BC2B9-74A1-481B-8DBA-2C9B757F555E_png.jpg',
      '/api/uploads/1790762053453_7EC6C937-1F78-4CAE-AC3B-DAEE68AF3089_png.jpg',
      '/api/uploads/1790762302488_04575528-EFAC-4A84-86D5-395FA9BB0E4F_png.jpg',
    ],
    description: 'Peach Embroidered 3-Piece Suit Set — SS VASTRA\n\nAdd a touch of elegance to your ethnic wardrobe with this beautiful peach embroidered suit set. The kurta features intricate embroidery around the neckline and elegant detailing along the hem and sleeves. Paired with a matching pant and a graceful embroidered-border dupatta, this outfit creates a sophisticated traditional look.',
    fabric: 'Pure Cotton mulmul',
    color: 'Pastel Peach',
    colors: ['Pastel Peach'],
    highlights: ['Pure Cotton Mulmul', 'Intricate Neckline Embroidery', 'Matching Straight Pant', 'Graceful Dupatta'],
    isNewArrival: true,
    isBestSeller: false,
    isFeatured: true,
    isSpotlight: true,
    isOutfit: true,
    isActive: true,
    isDemo: false,
    createdAt: '2026-09-30T09:59:03.152Z',
  },
  {
    id: 9,
    slug: 'teal-embroidered-kurta-pant-dupatta-suit-set-858',
    name: 'Teal Embroidered Kurta Pant & Dupatta Suit Set',
    category: 'Kurta Sets',
    price: 999,
    originalPrice: 1999,
    discountPercent: 50,
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 100,
    image: '/api/uploads/1790760655275_80B18A6F-C029-42ED-944E-34C09330C972_png.jpg',
    gallery: [
      '/api/uploads/1790760655275_80B18A6F-C029-42ED-944E-34C09330C972_png.jpg',
      '/api/uploads/1790760665186_6CC7A0C9-AFC3-406E-BC5C-C3685AAD695E_png.jpg',
      '/api/uploads/1790760677776_D79CCCF4-D910-4CC2-A681-6E049FF13062_png.jpg',
      '/api/uploads/1790760691141_8E1B95CF-C2F6-40CE-83DD-08D7307216BC_png.jpg',
    ],
    description: 'Teal Embroidered Kurta Pant & Dupatta Suit Set — SS VASTRA\n\nElevate your ethnic wardrobe with this elegant teal suit set from SS VASTRA. The outfit features beautiful floral detailing, an embroidered neckline and a matching embroidered dupatta for a graceful and sophisticated look.\n\nSet Includes: Kurta + Pant + Dupatta\nColor: Teal\nDesign: Floral Embroidery\nStyle: Elegant Ethnic Wear',
    fabric: 'Premium ethnic-wear fabric',
    color: 'Teal Blue',
    colors: ['Teal Blue'],
    highlights: ['Elegant Teal Shade', 'Embroidered Neckline', 'Comfortable 3-Piece Set', 'Matching Dupatta'],
    isNewArrival: true,
    isBestSeller: false,
    isFeatured: true,
    isSpotlight: true,
    isOutfit: true,
    isActive: true,
    isDemo: false,
    createdAt: '2026-09-29T10:08:09.716Z',
  },
];

export function getDefaultProducts(): Product[] {
  return RAW_DEFAULT_PRODUCTS.map((p) => ({
    ...p,
  }));
}

export function getDefaultLocalProducts(): any[] {
  return RAW_DEFAULT_PRODUCTS.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.category,
    price: p.price,
    originalPrice: p.originalPrice,
    discountPercent: p.discountPercent,
    sizes: JSON.stringify(p.sizes),
    stock: p.stock,
    image: p.image,
    description: p.description,
    fabric: p.fabric,
    color: p.color,
    colors: p.colors,
    highlights: JSON.stringify(p.highlights),
    isNewArrival: p.isNewArrival,
    isBestSeller: p.isBestSeller,
    isFeatured: p.isFeatured,
    isSpotlight: p.isSpotlight || false,
    isOutfit: p.isOutfit || false,
    isActive: p.isActive,
    isDemo: p.isDemo,
    createdAt: p.createdAt,
    images: p.gallery,
  }));
}
