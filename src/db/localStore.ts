import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { getDefaultLocalProducts } from '../data/defaultProducts.ts';

const DATA_DIR = path.resolve('data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

export interface LocalCategory {
  id: number;
  slug: string;
  name: string;
  icon: string;
  image: string;
  description: string;
  displayOrder: number;
}

export interface LocalProduct {
  id: number;
  slug: string;
  name: string;
  category: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  sizes: string;
  stock: number;
  image: string;
  description: string;
  fabric: string;
  color: string;
  colors?: string[];
  highlights: string;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isFeatured: boolean;
  isSpotlight?: boolean;
  isOutfit?: boolean;
  isActive: boolean;
  isDemo?: boolean;
  createdAt: string;
  images?: string[];
}

export interface LocalOrder {
  id: number;
  orderNumber: string;
  userId?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  totalAmount: number;
  discountAmount?: number | null;
  couponCode?: string | null;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  orderStatus?: string;
  notes?: string | null;
  isDemo?: boolean;
  createdAt: string;
  items?: Array<{
    id?: number;
    productId?: number;
    productName: string;
    productImage?: string;
    size?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  shipment?: {
    id?: number;
    courierPartner?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    estimatedDelivery?: string;
    shippedAt?: string;
    deliveredAt?: string;
    events?: Array<{
      status: string;
      description?: string;
      note?: string;
      location?: string;
      timestamp: string;
    }>;
  };
}

export interface LocalAdmin {
  id: number;
  adminId: string;
  email: string;
  phone?: string | null;
  passwordHash: string;
  name: string;
  role: string;
  mustChangePassword?: boolean;
  isActive: boolean;
  failedAttempts?: number;
  createdAt: string;
}

export interface LocalCoupon {
  id: number;
  code: string;
  discountType: string;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  isActive: boolean;
}

export interface LocalBanner {
  id: number;
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  isActive: boolean;
  displayOrder: number;
}

export interface LocalVisitorLog {
  id: number;
  visitorId: string;
  ipAddress?: string;
  userAgent?: string;
  page: string;
  referrer?: string;
  deviceType?: string;
  createdAt: string;
}

export interface LocalCustomerActivity {
  id: number;
  type: 'visit' | 'login' | 'signup' | 'order' | 'otp_request';
  phone?: string;
  email?: string;
  name?: string;
  ipAddress?: string;
  userAgent?: string;
  page?: string;
  details?: string;
  createdAt: string;
}

export interface LocalVideoReel {
  id: number;
  title: string;
  videoUrl: string;
  posterUrl?: string;
  productId?: number;
  productTitle?: string;
  productPrice?: number;
  productImage?: string;
  badge?: string;
  displayOrder?: number;
  isActive: boolean;
  createdAt?: string;
}

export interface LocalStoreData {
  categories: LocalCategory[];
  products: LocalProduct[];
  orders: LocalOrder[];
  admins: LocalAdmin[];
  coupons: LocalCoupon[];
  banners: LocalBanner[];
  settings: Record<string, string>;
  deletedProductIds?: number[];
  customProducts?: LocalProduct[];
  visitorLogs?: LocalVisitorLog[];
  customerActivities?: LocalCustomerActivity[];
  videoReels?: LocalVideoReel[];
  activityLogs: Array<{
    id: number;
    adminId?: string;
    adminName?: string;
    userEmail?: string;
    action: string;
    entity: string;
    entityId?: string;
    details?: string;
    ipAddress?: string;
    createdAt: string;
  }>;
}

// Generate default initial dataset
function createInitialData(): LocalStoreData {
  const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || 'subhashmeena3111@gmail.com').toLowerCase().trim();
  const superAdminPass = (process.env.SUPER_ADMIN_PASSWORD && process.env.SUPER_ADMIN_PASSWORD !== 'your-strong-super-admin-password' && process.env.SUPER_ADMIN_PASSWORD !== '1000')
    ? process.env.SUPER_ADMIN_PASSWORD
    : 'Meena@9829';
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(superAdminPass, salt);

  const categories: LocalCategory[] = [
    {
      id: 1,
      slug: 'kurta-sets',
      name: 'Kurta Sets',
      icon: '👗',
      image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=600&q=80',
      description: 'Graceful embroidered and printed ethnic kurta sets with bottoms & dupattas.',
      displayOrder: 1,
    },
    {
      id: 2,
      slug: 'co-ord-sets',
      name: 'Co-ord Sets',
      icon: '👚',
      image: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=600&q=80',
      description: 'Contemporary matching sets designed for festive flair and everyday chic.',
      displayOrder: 2,
    },
    {
      id: 3,
      slug: 'anarkali-dresses',
      name: 'Anarkali & Dresses',
      icon: '💃',
      image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=600&q=80',
      description: 'Flowing flares, fine muslin cotton and gotapatti lace royal dresses.',
      displayOrder: 3,
    },
    {
      id: 4,
      slug: 'kurta-kurtis',
      name: 'Kurta / Kurtis',
      icon: '🌸',
      image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80',
      description: 'Breathable Jaipur cotton tunics, short kurtas and daily office staples.',
      displayOrder: 4,
    },
    {
      id: 5,
      slug: 'festive-fits',
      name: 'Festive Fits',
      icon: '👑',
      image: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=600&q=80',
      description: 'Rich Chanderi, zari borders and celebratory suits for auspicious occasions.',
      displayOrder: 5,
    },
    {
      id: 6,
      slug: 'fabrics',
      name: 'Fabrics',
      icon: '🧵',
      image: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?auto=format&fit=crop&w=600&q=80',
      description: 'Direct from Sanganer master wooden handblock cambric & mulmul cotton.',
      displayOrder: 6,
    },
    {
      id: 7,
      slug: 'new-arrivals',
      name: 'New Arrivals',
      icon: '🌟',
      image: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=600&q=80',
      description: 'Freshly loomed designs and latest seasonal silhouettes.',
      displayOrder: 7,
    },
    {
      id: 8,
      slug: 'best-sellers',
      name: 'Best Sellers',
      icon: '🔥',
      image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80',
      description: 'Most loved Jaipur creations ordered across India.',
      displayOrder: 8,
    },
  ];

  // Clean product catalog ready for owner's real outfits
  const products: LocalProduct[] = getDefaultLocalProducts();

  const admins: LocalAdmin[] = [
    {
      id: 1,
      adminId: superAdminEmail,
      email: superAdminEmail,
      passwordHash,
      name: 'Subhash Meena (SS VASTRA Owner)',
      role: 'super_admin',
      mustChangePassword: false,
      isActive: true,
      failedAttempts: 0,
      createdAt: new Date().toISOString(),
    },
  ];

  const coupons: LocalCoupon[] = [
    { id: 1, code: 'WELCOME10', discountType: 'percent', discountValue: 10, minOrderAmount: 999, maxDiscount: 500, isActive: true },
    { id: 2, code: 'JAIPUR100', discountType: 'flat', discountValue: 100, minOrderAmount: 1499, isActive: true },
    { id: 3, code: 'FESTIVE15', discountType: 'percent', discountValue: 15, minOrderAmount: 2499, maxDiscount: 800, isActive: true },
  ];

  const banners: LocalBanner[] = [
    {
      id: 1,
      title: 'Elegance in Every Thread',
      subtitle: 'Ladies Fashion & Fabrics',
      imageUrl: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1600&q=85',
      ctaText: 'Explore Collections',
      ctaLink: '#products-section',
      isActive: true,
      displayOrder: 1,
    },
  ];

  const settings: Record<string, string> = {
    store_name: 'SS VASTRA',
    tagline: 'Elegance in Every Thread',
    category: 'Ladies Fashion & Fabrics',
    address: 'Green Vihar Vatika, Sanganer, Jaipur 303905',
    phone: '9783770735',
    whatsapp: 'https://wa.me/919783770735',
    email: 'subhashmeena3111@gmail.com',
    instagram: 'https://instagram.com/SS_vastra',
    cod_enabled: 'true',
    shipping_fee: '0',
    free_shipping_threshold: '1999',
    razorpay_key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder_key',
    payment_gateway_provider: 'razorpay',
    payment_gateway_mode: 'test',
    gateway_enabled: 'true',
    bank_transfer_enabled: 'true',
    bank_name: 'State Bank of India (SBI)',
    bank_account_holder: 'SS VASTRA - SUBHASH MEENA',
    bank_account_number: '38920100054231',
    bank_ifsc: 'SBIN0031114',
    bank_branch: 'Sanganer Branch, Jaipur',
    bank_account_type: 'Current Account',
    bank_instructions: 'Kripya payment transfer ke baad transaction UTR reference number aur screenshot WhatsApp helpline par bhejein.',
    upi_enabled: 'true',
    upi_id: '9783770735@upi',
    upi_secondary_id: 'ssvastra@okaxis',
    upi_name: 'SS VASTRA JAIPUR',
    upi_number: '9783770735',
    upi_qr_image: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi%3A%2F%2Fpay%3Fpa%3D9783770735%40upi%26pn%3DSS%2520VASTRA%2520JAIPUR%26cu%3DINR',
    payment_gateways_list: JSON.stringify([
      {
        id: 'gw_razorpay',
        name: 'Razorpay Payment Gateway',
        provider: 'razorpay',
        keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder_key',
        keySecret: '',
        mode: 'test',
        isActive: true,
        isDefault: true,
        instructions: 'Accepts UPI, Debit/Credit Cards, NetBanking, and Wallets.',
      },
      {
        id: 'gw_phonepe',
        name: 'PhonePe PG',
        provider: 'phonepe',
        keyId: 'MERCHANTUAT',
        keySecret: '',
        mode: 'test',
        isActive: false,
        isDefault: false,
        instructions: 'Direct PhonePe QR and Intent payments.',
      },
      {
        id: 'gw_paytm',
        name: 'Paytm Business All-in-One',
        provider: 'paytm',
        keyId: '',
        keySecret: '',
        mode: 'test',
        isActive: false,
        isDefault: false,
        instructions: 'Paytm Wallet, Postpaid, and UPI.',
      },
      {
        id: 'gw_cashfree',
        name: 'Cashfree Payments',
        provider: 'cashfree',
        keyId: '',
        keySecret: '',
        mode: 'test',
        isActive: false,
        isDefault: false,
        instructions: 'Cashfree auto-collect and cards gateway.',
      },
    ]),
    bank_accounts_list: JSON.stringify([
      {
        id: 'bank_sbi_primary',
        bankName: 'State Bank of India (SBI)',
        accountHolder: 'SS VASTRA - SUBHASH MEENA',
        accountNumber: '38920100054231',
        ifsc: 'SBIN0031114',
        accountType: 'Current Account',
        branch: 'Sanganer Branch, Jaipur, Rajasthan',
        upiId: '9783770735@upi',
        instructions: 'Transfer via IMPS / NEFT and share UTR reference number or screenshot on WhatsApp helpline.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'bank_hdfc_secondary',
        bankName: 'HDFC Bank',
        accountHolder: 'SS VASTRA JAIPUR',
        accountNumber: '50200084729112',
        ifsc: 'HDFC0001832',
        accountType: 'Current Account',
        branch: 'Tonk Road Branch, Jaipur',
        upiId: 'ssvastra@okhdfcbank',
        instructions: 'Instant RTGS/NEFT settlement account.',
        isDefault: false,
        isActive: true,
      },
    ]),
    upi_accounts_list: JSON.stringify([
      {
        id: 'upi_primary_gpay',
        title: 'Primary Google Pay / PhonePe UPI',
        upiId: '9783770735@upi',
        payeeName: 'SS VASTRA JAIPUR',
        phone: '9783770735',
        qrImageUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi%3A%2F%2Fpay%3Fpa%3D9783770735%40upi%26pn%3DSS%2520VASTRA%2520JAIPUR%26cu%3DINR',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'upi_axis_merchant',
        title: 'Axis Bank Business UPI ID',
        upiId: 'ssvastra@okaxis',
        payeeName: 'SS VASTRA JAIPUR',
        phone: '9783770735',
        qrImageUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi%3A%2F%2Fpay%3Fpa%3Dssvastra%40okaxis%26pn%3DSS%2520VASTRA%2520JAIPUR%26cu%3DINR',
        isDefault: false,
        isActive: true,
      },
    ]),
    delivery_partners: JSON.stringify([
      {
        id: 'delhivery',
        name: 'Delhivery Express',
        trackingUrlTemplate: 'https://www.delhivery.com/track/package/{TRACKING_NO}',
        estimatedDays: '2 to 4 Business Days',
        phone: '1800 102 4567',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'shiprocket',
        name: 'Shiprocket Direct',
        trackingUrlTemplate: 'https://shiprocket.co/tracking/{TRACKING_NO}',
        estimatedDays: '3 to 5 Business Days',
        phone: '011 4056 1234',
        isDefault: false,
        isActive: true,
      },
      {
        id: 'bluedart',
        name: 'Blue Dart Express',
        trackingUrlTemplate: 'https://www.bluedart.com/tracking?numbers={TRACKING_NO}',
        estimatedDays: '1 to 3 Business Days',
        phone: '1860 233 1234',
        isDefault: false,
        isActive: true,
      },
      {
        id: 'dtdc',
        name: 'DTDC Courier',
        trackingUrlTemplate: 'https://www.dtdc.in/tracking/shipment-tracking.asp?trkType=AWB&strCnno={TRACKING_NO}',
        estimatedDays: '3 to 5 Business Days',
        phone: '080 2536 5032',
        isDefault: false,
        isActive: true,
      },
      {
        id: 'indiapost',
        name: 'India Post Speed Post',
        trackingUrlTemplate: 'https://www.indiapost.gov.in/_layouts/15/dpt.cpt.infrastructure/pages/trackconsignment.aspx?consignment={TRACKING_NO}',
        estimatedDays: '4 to 7 Business Days',
        phone: '1800 266 6868',
        isDefault: false,
        isActive: true,
      },
    ]),
  };

  const videoReels: LocalVideoReel[] = [
    {
      id: 1,
      title: 'Royal Anarkali Handblock Drape',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-fashion-model-in-an-orange-dress-41130-large.mp4',
      posterUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800',
      productTitle: 'Pure Cambric Cotton Jaipuri Anarkali Suit',
      productPrice: 2499,
      productImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800',
      badge: 'Trending 🔥',
      displayOrder: 1,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      title: 'Jaipur Handcrafted Farshi Suit Fit',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-posing-in-a-white-dress-and-a-hat-41133-large.mp4',
      posterUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800',
      productTitle: 'Blush Pink Cotton Farshi Suit Set',
      productPrice: 1850,
      productImage: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800',
      badge: 'New Arrival ✨',
      displayOrder: 2,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 3,
      title: 'Festive Banarasi & Zari Elegance',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-with-curly-hair-posing-41135-large.mp4',
      posterUrl: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=800',
      productTitle: 'Pista Green Rayon Kurta Farshi Set',
      productPrice: 2150,
      productImage: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=800',
      badge: 'Best Seller 👑',
      displayOrder: 3,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 4,
      title: 'Mustard Cotton Kurti Flare Look',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-model-posing-in-a-leather-jacket-41134-large.mp4',
      posterUrl: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&q=80&w=800',
      productTitle: 'White & Mustard Embroidered Kurta Set',
      productPrice: 1850,
      productImage: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&q=80&w=800',
      badge: 'Must Have 💖',
      displayOrder: 4,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ];

  return {
    categories,
    products,
    orders: [],
    admins,
    coupons,
    banners,
    settings,
    visitorLogs: [],
    customerActivities: [],
    videoReels,
    activityLogs: [],
  };
}

class LocalStoreManager {
  private data: LocalStoreData;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): LocalStoreData {
    const sanitizeLoaded = (parsed: any): LocalStoreData => {
      const deletedIds: number[] = Array.isArray(parsed.deletedProductIds) ? parsed.deletedProductIds : [];
      const customProds: LocalProduct[] = Array.isArray(parsed.customProducts) ? parsed.customProducts : [];
      let prods: LocalProduct[] = Array.isArray(parsed.products) ? parsed.products : [];

      // Filter out explicitly deleted products
      prods = prods.filter((p: LocalProduct) => !deletedIds.includes(p.id));

      // Ensure custom products are preserved
      for (const cp of customProds) {
        if (!deletedIds.includes(cp.id) && !prods.some((p) => p.id === cp.id)) {
          prods.unshift(cp);
        }
      }

      // Auto-seed curated Jaipur outfits if catalog is empty and not explicitly purged
      if (prods.length === 0 && customProds.length === 0 && !deletedIds.includes(1)) {
        prods = getDefaultLocalProducts();
      }

      // Mark demo products correctly (IDs <= 8 or isDemo === true)
      prods = prods.map((p: any) => ({
        ...p,
        isDemo: p.isDemo !== undefined ? Boolean(p.isDemo) : (typeof p.id === 'number' && p.id <= 8),
      }));

      parsed.products = prods;
      parsed.deletedProductIds = deletedIds;
      parsed.customProducts = customProds.filter((cp) => !deletedIds.includes(cp.id));
      if (!Array.isArray(parsed.visitorLogs)) parsed.visitorLogs = [];
      if (!Array.isArray(parsed.customerActivities)) parsed.customerActivities = [];
      if (!Array.isArray(parsed.orders)) parsed.orders = [];
      if (!Array.isArray(parsed.videoReels) || parsed.videoReels.length === 0) {
        parsed.videoReels = createInitialData().videoReels;
      }
      return parsed as LocalStoreData;
    };

    // 1. Try reading from /tmp/store.json if updated previously in this container
    try {
      const tmpPath = path.join('/tmp', 'store.json');
      if (fs.existsSync(tmpPath)) {
        const content = fs.readFileSync(tmpPath, 'utf-8');
        const parsed = JSON.parse(content);
        if (parsed.products && parsed.categories && parsed.admins) {
          return sanitizeLoaded(parsed);
        }
      }
    } catch {}

    // 2. Try reading from project bundle data/store.json
    try {
      const candidates = [
        STORE_FILE,
        path.join(process.cwd(), 'data', 'store.json'),
        path.resolve('data', 'store.json'),
      ];
      for (const filePath of candidates) {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          const parsed = JSON.parse(content);
          if (parsed.products && parsed.categories && parsed.admins) {
            return sanitizeLoaded(parsed);
          }
        }
      }
    } catch (err) {
      console.warn('Could not read existing store.json from disk:', err);
    }

    const initial = createInitialData();
    this.saveData(initial);
    return initial;
  }

  saveData(dataToSave?: LocalStoreData) {
    const payload = JSON.stringify(dataToSave || this.data, null, 2);
    // 1. Attempt writing to project data/store.json (persistent local & VPS)
    let wroteSuccess = false;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(STORE_FILE, payload, 'utf-8');
      wroteSuccess = true;
    } catch {
      // Ignore read-only file system (e.g. Vercel serverless)
    }

    // 2. Also write to /tmp/store.json for serverless persistence across requests in same instance
    if (!wroteSuccess || process.env.VERCEL) {
      try {
        fs.writeFileSync(path.join('/tmp', 'store.json'), payload, 'utf-8');
      } catch {
        // Ignore fallback write errors
      }
    }
  }

  // Categories
  getCategories(): LocalCategory[] {
    return [...this.data.categories].sort((a, b) => a.displayOrder - b.displayOrder);
  }

  updateCategory(id: number, updates: Partial<LocalCategory>): LocalCategory | null {
    const idx = this.data.categories.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    this.data.categories[idx] = { ...this.data.categories[idx], ...updates };
    this.saveData();
    return this.data.categories[idx];
  }

  // Products
  getDataMode(): 'all' | 'live' | 'demo' {
    const mode = this.data.settings?.['data_mode'];
    if (mode === 'live' || mode === 'demo' || mode === 'all') return mode;
    return 'all';
  }

  setDataMode(mode: 'all' | 'live' | 'demo'): void {
    if (!this.data.settings) this.data.settings = {};
    this.data.settings['data_mode'] = mode;
    this.saveData();
  }

  purgeDemoData(): { removedProducts: number; removedOrders: number } {
    const isDemoItem = (p: LocalProduct) => p.isDemo === true || p.id <= 8;
    const demoProds = this.data.products.filter(isDemoItem);
    const countProds = demoProds.length;

    this.data.products = this.data.products.filter((p) => !isDemoItem(p));
    if (this.data.customProducts) {
      this.data.customProducts = this.data.customProducts.filter((p) => !isDemoItem(p));
    }
    const deletedIds = this.data.deletedProductIds || [];
    demoProds.forEach((p) => {
      if (!deletedIds.includes(p.id)) deletedIds.push(p.id);
    });
    this.data.deletedProductIds = deletedIds;

    const demoOrders = (this.data.orders || []).filter((o) => o.isDemo === true || o.orderNumber.startsWith('SSV-DEMO'));
    const countOrders = demoOrders.length;
    this.data.orders = (this.data.orders || []).filter((o) => !(o.isDemo === true || o.orderNumber.startsWith('SSV-DEMO')));

    this.saveData();
    return {
      removedProducts: countProds,
      removedOrders: countOrders,
    };
  }

  purgeAllCatalogData(): { removedProducts: number; removedOrders: number } {
    const countProds = this.data.products.length;
    const countOrders = (this.data.orders || []).length;

    const deletedIds = this.data.deletedProductIds || [];
    this.data.products.forEach((p) => {
      if (!deletedIds.includes(p.id)) deletedIds.push(p.id);
    });
    this.data.deletedProductIds = deletedIds;
    this.data.products = [];
    this.data.customProducts = [];
    this.data.orders = [];

    this.saveData();
    return {
      removedProducts: countProds,
      removedOrders: countOrders,
    };
  }

  restoreDemoData(): { restoredProducts: number } {
    const initial = createInitialData();
    const demoProds = initial.products.map((p) => ({ ...p, isDemo: true }));

    if (this.data.deletedProductIds) {
      this.data.deletedProductIds = this.data.deletedProductIds.filter((id) => id > 8);
    }

    for (const dp of demoProds) {
      const idx = this.data.products.findIndex((p) => p.id === dp.id);
      if (idx >= 0) {
        this.data.products[idx] = dp;
      } else {
        this.data.products.push(dp);
      }
    }

    this.saveData();
    return {
      restoredProducts: demoProds.length,
    };
  }

  getDataStatus() {
    const mode = this.getDataMode();
    const isDemoItem = (p: LocalProduct) => p.isDemo === true || p.id <= 8;
    const totalProducts = this.data.products.length;
    const demoProducts = this.data.products.filter(isDemoItem).length;
    const liveProducts = totalProducts - demoProducts;

    const totalOrders = (this.data.orders || []).length;
    const demoOrders = (this.data.orders || []).filter((o) => o.isDemo === true || o.orderNumber.startsWith('SSV-DEMO')).length;
    const liveOrders = totalOrders - demoOrders;

    return {
      mode,
      totalProducts,
      demoProducts,
      liveProducts,
      totalOrders,
      demoOrders,
      liveOrders,
    };
  }

  getProducts(filters?: {
    category?: string;
    search?: string;
    featured?: boolean;
    newArrival?: boolean;
    bestSeller?: boolean;
    mode?: 'all' | 'live' | 'demo';
  }): LocalProduct[] {
    let list = this.data.products.filter((p) => p.isActive);

    const mode = filters?.mode || this.getDataMode();
    const isDemoItem = (p: LocalProduct) => p.isDemo === true || p.id <= 8;
    if (mode === 'live') {
      list = list.filter((p) => !isDemoItem(p));
    } else if (mode === 'demo') {
      list = list.filter(isDemoItem);
    }

    if (filters?.category) {
      const catLower = String(filters.category).toLowerCase();
      list = list.filter((p) => p.category.toLowerCase() === catLower || p.slug.toLowerCase().includes(catLower));
    }

    if (filters?.search) {
      const q = String(filters.search).toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.fabric && p.fabric.toLowerCase().includes(q))
      );
    }

    if (filters?.featured) {
      list = list.filter((p) => p.isFeatured);
    }
    if (filters?.newArrival) {
      list = list.filter((p) => p.isNewArrival);
    }
    if (filters?.bestSeller) {
      list = list.filter((p) => p.isBestSeller);
    }

    return [...list].sort((a, b) => b.id - a.id);
  }

  getAllProductsAdmin(modeFilter?: 'all' | 'live' | 'demo'): LocalProduct[] {
    const isDemoItem = (p: LocalProduct) => p.isDemo === true || p.id <= 8;
    let list = this.data.products;
    if (modeFilter === 'live') {
      list = list.filter((p) => !isDemoItem(p));
    } else if (modeFilter === 'demo') {
      list = list.filter(isDemoItem);
    }
    return [...list].sort((a, b) => b.id - a.id);
  }

  getProductById(id: number): LocalProduct | null {
    return this.data.products.find((p) => p.id === id) || null;
  }

  getProductBySlug(slug: string): LocalProduct | null {
    return this.data.products.find((p) => p.slug === slug) || null;
  }

  createProduct(data: Omit<LocalProduct, 'id' | 'createdAt'>): LocalProduct {
    const newId = this.data.products.reduce((max, p) => Math.max(max, p.id), 0) + 1;
    const newProduct: LocalProduct = {
      ...data,
      isDemo: data.isDemo !== undefined ? Boolean(data.isDemo) : false,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    if (!this.data.customProducts) this.data.customProducts = [];
    this.data.customProducts.unshift(newProduct);
    this.data.products.unshift(newProduct);

    // If it was somehow previously marked deleted, unmark it
    if (this.data.deletedProductIds) {
      this.data.deletedProductIds = this.data.deletedProductIds.filter((id) => id !== newId);
    }

    this.saveData();
    return newProduct;
  }

  updateProduct(id: number, updates: Partial<LocalProduct>): LocalProduct | null {
    const idx = this.data.products.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    this.data.products[idx] = { ...this.data.products[idx], ...updates };

    // Also sync in customProducts if present
    if (this.data.customProducts) {
      const cIdx = this.data.customProducts.findIndex((p) => p.id === id);
      if (cIdx >= 0) {
        this.data.customProducts[cIdx] = { ...this.data.customProducts[cIdx], ...updates };
      }
    }

    // If it was marked deleted previously, unmark it
    if (this.data.deletedProductIds) {
      this.data.deletedProductIds = this.data.deletedProductIds.filter((dId) => dId !== id);
    }

    this.saveData();
    return this.data.products[idx];
  }

  deleteProduct(id: number): boolean {
    if (!this.data.deletedProductIds) this.data.deletedProductIds = [];
    if (!this.data.deletedProductIds.includes(id)) {
      this.data.deletedProductIds.push(id);
    }
    this.data.products = this.data.products.filter((p) => p.id !== id);
    if (this.data.customProducts) {
      this.data.customProducts = this.data.customProducts.filter((p) => p.id !== id);
    }
    this.saveData();
    return true;
  }

  getDeletedProductIds(): number[] {
    return this.data.deletedProductIds || [];
  }

  getAllProducts(): LocalProduct[] {
    return [...this.data.products];
  }

  getAllCategories(): LocalCategory[] {
    return [...this.data.categories];
  }

  getAllBanners(): LocalBanner[] {
    return [...this.data.banners];
  }

  getAllCoupons(): LocalCoupon[] {
    return [...this.data.coupons];
  }

  getAllOrders(): LocalOrder[] {
    return [...this.data.orders];
  }

  getAllSettings(): Record<string, string> {
    return { ...this.data.settings };
  }

  // Settings
  getSettings(): Record<string, string> {
    return { ...this.data.settings };
  }

  updateSetting(key: string, value: string) {
    this.data.settings[key] = value;
    this.saveData();
  }

  // Orders
  getOrders(): LocalOrder[] {
    return [...this.data.orders]
      .map((o) => ({
        ...o,
        orderStatus: o.orderStatus || o.status,
      }))
      .sort((a, b) => b.id - a.id);
  }

  getOrderById(id: number): LocalOrder | null {
    const o = this.data.orders.find((ord) => ord.id === id);
    if (!o) return null;
    return { ...o, orderStatus: o.orderStatus || o.status };
  }

  getOrderByNumber(orderNumber: string): LocalOrder | null {
    const o = this.data.orders.find((ord) => ord.orderNumber === orderNumber);
    if (!o) return null;
    return { ...o, orderStatus: o.orderStatus || o.status };
  }

  createOrder(orderData: Omit<LocalOrder, 'id' | 'createdAt'>): LocalOrder {
    const newId = this.data.orders.reduce((max, o) => Math.max(max, o.id), 0) + 1;
    const newOrder: LocalOrder = {
      ...orderData,
      id: newId,
      orderStatus: orderData.orderStatus || orderData.status,
      createdAt: new Date().toISOString(),
    };
    this.data.orders.unshift(newOrder);
    this.saveData();
    return newOrder;
  }

  updateOrder(id: number, updates: Partial<LocalOrder>): LocalOrder | null {
    const idx = this.data.orders.findIndex((o) => o.id === id);
    if (idx === -1) return null;
    this.data.orders[idx] = { ...this.data.orders[idx], ...updates };
    this.saveData();
    return this.data.orders[idx];
  }

  deleteOrder(id: number): boolean {
    const prevLen = this.data.orders.length;
    this.data.orders = this.data.orders.filter((o) => o.id !== id);
    if (this.data.orders.length !== prevLen) {
      this.saveData();
      return true;
    }
    return false;
  }

  // Admins
  getAdmins(): LocalAdmin[] {
    try {
      this.data = this.loadData();
    } catch {}
    return [...this.data.admins];
  }

  getAdminByEmail(email: string): LocalAdmin | null {
    try {
      this.data = this.loadData();
    } catch {}
    const e = email.toLowerCase().trim();
    return (
      this.data.admins.find(
        (a) =>
          a.email.toLowerCase() === e ||
          a.adminId.toLowerCase() === e ||
          (e === '1000' && (a.id === 1 || a.role === 'super_admin')) ||
          (e === 'subhashmeena3111@gmail.com' && (a.id === 1 || a.role === 'super_admin')) ||
          (e === 'admin' && (a.id === 1 || a.role === 'super_admin'))
      ) || null
    );
  }

  getAdminById(id: number): LocalAdmin | null {
    try {
      this.data = this.loadData();
    } catch {}
    return this.data.admins.find((a) => a.id === id) || (id === 1 ? this.data.admins[0] : null) || null;
  }

  createAdmin(admin: Omit<LocalAdmin, 'id' | 'createdAt'>): LocalAdmin {
    const newId = this.data.admins.reduce((max, a) => Math.max(max, a.id), 0) + 1;
    const newAdmin: LocalAdmin = {
      ...admin,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    this.data.admins.push(newAdmin);
    this.saveData();
    return newAdmin;
  }

  updateAdmin(id: number, updates: Partial<LocalAdmin>): LocalAdmin | null {
    const idx = this.data.admins.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    this.data.admins[idx] = { ...this.data.admins[idx], ...updates };
    this.saveData();
    return this.data.admins[idx];
  }

  // Coupons
  getCoupons(): LocalCoupon[] {
    return [...this.data.coupons];
  }

  createCoupon(coupon: Omit<LocalCoupon, 'id'>): LocalCoupon {
    const newId = this.data.coupons.reduce((max, c) => Math.max(max, c.id), 0) + 1;
    const newCoupon: LocalCoupon = { ...coupon, id: newId };
    this.data.coupons.push(newCoupon);
    this.saveData();
    return newCoupon;
  }

  updateCoupon(id: number, updates: Partial<LocalCoupon>): LocalCoupon | null {
    const idx = this.data.coupons.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    this.data.coupons[idx] = { ...this.data.coupons[idx], ...updates };
    this.saveData();
    return this.data.coupons[idx];
  }

  deleteCoupon(id: number): boolean {
    const prevLen = this.data.coupons.length;
    this.data.coupons = this.data.coupons.filter((c) => c.id !== id);
    if (this.data.coupons.length !== prevLen) {
      this.saveData();
      return true;
    }
    return false;
  }

  // Banners
  getBanners(): LocalBanner[] {
    return [...this.data.banners].sort((a, b) => a.displayOrder - b.displayOrder);
  }

  createBanner(banner: Omit<LocalBanner, 'id'>): LocalBanner {
    const newId = this.data.banners.reduce((max, b) => Math.max(max, b.id), 0) + 1;
    const newBanner: LocalBanner = {
      ...banner,
      id: newId,
    };
    this.data.banners.push(newBanner);
    this.saveData();
    return newBanner;
  }

  deleteBanner(id: number): boolean {
    const idx = this.data.banners.findIndex((b) => b.id === id);
    if (idx === -1) return false;
    this.data.banners.splice(idx, 1);
    this.saveData();
    return true;
  }

  // Activity Logs
  getActivityLogs(): Array<LocalStoreData['activityLogs'][0]> {
    return [...this.data.activityLogs].slice(-100);
  }

  addActivityLog(log: Omit<LocalStoreData['activityLogs'][0], 'id' | 'createdAt'>) {
    const newId = this.data.activityLogs.reduce((max, l) => Math.max(max, l.id), 0) + 1;
    this.data.activityLogs.unshift({
      ...log,
      id: newId,
      createdAt: new Date().toISOString(),
    });
    if (this.data.activityLogs.length > 200) {
      this.data.activityLogs = this.data.activityLogs.slice(0, 200);
    }
    this.saveData();
  }

  // Visitor & Traffic Logs
  getVisitorLogs(limit = 100): LocalVisitorLog[] {
    if (!this.data.visitorLogs) this.data.visitorLogs = [];
    return [...this.data.visitorLogs].slice(0, limit);
  }

  addVisitorLog(log: Omit<LocalVisitorLog, 'id' | 'createdAt'>): LocalVisitorLog {
    if (!this.data.visitorLogs) this.data.visitorLogs = [];
    const newId = this.data.visitorLogs.reduce((max, l) => Math.max(max, l.id || 0), 0) + 1;
    const entry: LocalVisitorLog = {
      ...log,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    this.data.visitorLogs.unshift(entry);
    if (this.data.visitorLogs.length > 500) {
      this.data.visitorLogs = this.data.visitorLogs.slice(0, 500);
    }
    this.saveData();
    return entry;
  }

  // Customer Logins & Signups Tracking
  getCustomerActivities(limit = 100): LocalCustomerActivity[] {
    if (!this.data.customerActivities) this.data.customerActivities = [];
    return [...this.data.customerActivities].slice(0, limit);
  }

  addCustomerActivity(activity: Omit<LocalCustomerActivity, 'id' | 'createdAt'>): LocalCustomerActivity {
    if (!this.data.customerActivities) this.data.customerActivities = [];
    const newId = this.data.customerActivities.reduce((max, a) => Math.max(max, a.id || 0), 0) + 1;
    const entry: LocalCustomerActivity = {
      ...activity,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    this.data.customerActivities.unshift(entry);
    if (this.data.customerActivities.length > 500) {
      this.data.customerActivities = this.data.customerActivities.slice(0, 500);
    }
    this.saveData();
    return entry;
  }

  getCustomerActivitySummary() {
    const vLogs = this.data.visitorLogs || [];
    const cActs = this.data.customerActivities || [];
    const today = new Date().toISOString().split('T')[0];

    const todayVisits = vLogs.filter((v) => v.createdAt && v.createdAt.startsWith(today)).length;
    const uniqueVisitors = new Set(vLogs.map((v) => v.visitorId || v.ipAddress)).size;
    const totalSignups = cActs.filter((a) => a.type === 'signup').length;
    const todayLogins = cActs.filter((a) => (a.type === 'login' || a.type === 'otp_request') && a.createdAt && a.createdAt.startsWith(today)).length;

    return {
      totalVisits: vLogs.length,
      todayVisits,
      uniqueVisitors,
      totalSignups,
      todayLogins,
      totalCustomerActivities: cActs.length,
    };
  }

  // Video Reels (9:16 Portrait Reels)
  getVideoReels(): LocalVideoReel[] {
    if (!this.data.videoReels || !Array.isArray(this.data.videoReels) || this.data.videoReels.length === 0) {
      this.data.videoReels = [
        {
          id: 1,
          title: 'Royal Anarkali Handblock Drape',
          videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-fashion-model-in-an-orange-dress-41130-large.mp4',
          posterUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800',
          productTitle: 'Pure Cambric Cotton Jaipuri Anarkali Suit',
          productPrice: 2499,
          productImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800',
          badge: 'Trending 🔥',
          displayOrder: 1,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 2,
          title: 'Jaipur Handcrafted Farshi Suit Fit',
          videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-posing-in-a-white-dress-and-a-hat-41133-large.mp4',
          posterUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800',
          productTitle: 'Blush Pink Cotton Farshi Suit Set',
          productPrice: 1850,
          productImage: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800',
          badge: 'New Arrival ✨',
          displayOrder: 2,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 3,
          title: 'Festive Banarasi & Zari Elegance',
          videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-with-curly-hair-posing-41135-large.mp4',
          posterUrl: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=800',
          productTitle: 'Pista Green Rayon Kurta Farshi Set',
          productPrice: 2150,
          productImage: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=800',
          badge: 'Best Seller 👑',
          displayOrder: 3,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 4,
          title: 'Mustard Cotton Kurti Flare Look',
          videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-model-posing-in-a-leather-jacket-41134-large.mp4',
          posterUrl: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&q=80&w=800',
          productTitle: 'White & Mustard Embroidered Kurta Set',
          productPrice: 1850,
          productImage: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&q=80&w=800',
          badge: 'Must Have 💖',
          displayOrder: 4,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ];
    }
    return [...this.data.videoReels].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }

  addVideoReel(reel: Omit<LocalVideoReel, 'id' | 'createdAt'>): LocalVideoReel {
    if (!this.data.videoReels) this.data.videoReels = [];
    const newId = this.data.videoReels.reduce((max, r) => Math.max(max, r.id || 0), 0) + 1;
    const entry: LocalVideoReel = {
      ...reel,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    this.data.videoReels.push(entry);
    this.saveData();
    return entry;
  }

  updateVideoReel(id: number, updates: Partial<LocalVideoReel>): LocalVideoReel | null {
    if (!this.data.videoReels) this.data.videoReels = [];
    const idx = this.data.videoReels.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    this.data.videoReels[idx] = { ...this.data.videoReels[idx], ...updates };
    this.saveData();
    return this.data.videoReels[idx];
  }

  deleteVideoReel(id: number): boolean {
    if (!this.data.videoReels) return false;
    const prev = this.data.videoReels.length;
    this.data.videoReels = this.data.videoReels.filter((r) => r.id !== id);
    if (this.data.videoReels.length !== prev) {
      this.saveData();
      return true;
    }
    return false;
  }

  // Update Admin Profile (Username, Email, Phone, Password)
  updateAdminProfile(
    identifier: string | number,
    updates: { name?: string; email?: string; phone?: string; passwordHash?: string; adminId?: string }
  ): LocalAdmin | null {
    const idStr = String(identifier).toLowerCase().trim();
    const idx = this.data.admins.findIndex(
      (a) =>
        String(a.id) === idStr ||
        a.adminId.toLowerCase() === idStr ||
        a.email.toLowerCase() === idStr ||
        (a.role === 'super_admin' && (idStr === '1' || idStr === '1000' || idStr === 'admin'))
    );

    if (idx === -1) return null;
    this.data.admins[idx] = { ...this.data.admins[idx], ...updates };
    this.saveData();
    return this.data.admins[idx];
  }
}

export const localStore = new LocalStoreManager();
