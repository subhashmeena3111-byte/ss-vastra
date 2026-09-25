import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

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
  highlights: string;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isFeatured: boolean;
  isActive: boolean;
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
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80',
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

  const products: LocalProduct[] = [
    {
      id: 1,
      slug: 'red-embroidered-cotton-blend-kurta-set',
      name: 'Red Embroidered Cotton Blend Kurta Set',
      category: 'Kurta Sets',
      price: 1899,
      originalPrice: 2699,
      discountPercent: 30,
      sizes: JSON.stringify(['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']),
      stock: 45,
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80',
      description: 'A graceful, comfortable crimson red kurta set featuring intricate neck embroidery, flattering flared fit, and matching cigarette pants with dupatta.',
      fabric: 'Premium Cotton Blend',
      color: 'Crimson Red',
      highlights: JSON.stringify(['Stylish V-Neck', 'Beautiful Embroidery', 'Flair Fit', 'Premium Cotton Blend', 'Soft & Comfortable']),
      isNewArrival: true,
      isBestSeller: true,
      isFeatured: true,
      isActive: true,
      createdAt: new Date().toISOString(),
      images: [
        'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=80',
      ],
    },
    {
      id: 2,
      slug: 'bloom-in-grace-fuchsia-pink-anarkali-set',
      name: 'Bloom in Grace Fuchsia Pink Anarkali Set',
      category: 'Anarkali & Dresses',
      price: 2499,
      originalPrice: 3499,
      discountPercent: 28,
      sizes: JSON.stringify(['S', 'M', 'L', 'XL', 'XXL']),
      stock: 35,
      image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=900&q=80',
      description: 'Exquisite 3-piece flared Anarkali suit set with hand-embroidered yoke, flowing tiered flare, and lightweight chiffon dupatta with delicate gotapatti lace.',
      fabric: 'Pure Muslin Cotton',
      color: 'Fuchsia Pink',
      highlights: JSON.stringify(['Handmade Tassels', 'Flared Ghera', 'Breathable Muslin', 'Festive Ready']),
      isNewArrival: true,
      isBestSeller: true,
      isFeatured: false,
      isActive: true,
      createdAt: new Date().toISOString(),
      images: [
        'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=900&q=80',
      ],
    },
    {
      id: 3,
      slug: 'fresh-floral-sky-blue-co-ord-set',
      name: 'Fresh Floral Sky Blue Co-ord Set',
      category: 'Co-ord Sets',
      price: 1599,
      originalPrice: 2299,
      discountPercent: 30,
      sizes: JSON.stringify(['XS', 'S', 'M', 'L', 'XL']),
      stock: 28,
      image: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=900&q=80',
      description: 'Chic modern ethnic co-ord set with collared button-down tunic and relaxed straight-fit trousers. Perfect for office wear or casual outings.',
      fabric: 'Soft Rayon Slub',
      color: 'Sky Blue Floral',
      highlights: JSON.stringify(['Comfort Waistband', 'Pockets Included', 'Pre-shrunk Fabric', 'Zero Color Bleed']),
      isNewArrival: true,
      isBestSeller: false,
      isFeatured: false,
      isActive: true,
      createdAt: new Date().toISOString(),
      images: [
        'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=900&q=80',
      ],
    },
    {
      id: 4,
      slug: 'grace-in-every-thread-pastel-peach-suit',
      name: 'Grace in Every Thread Pastel Peach Suit',
      category: 'Kurta Sets',
      price: 2199,
      originalPrice: 2999,
      discountPercent: 27,
      sizes: JSON.stringify(['S', 'M', 'L', 'XL', 'XXL', '3XL']),
      stock: 40,
      image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=900&q=80',
      description: 'Subtle and soothing pastel peach kurta set with sequin threadwork along the neckline, paired with scalloped organza dupatta.',
      fabric: 'Chanderi Silk Blend',
      color: 'Pastel Peach',
      highlights: JSON.stringify(['Organza Scalloped Dupatta', 'Subtle Shimmer Work', 'Inner Lining Attached']),
      isNewArrival: false,
      isBestSeller: true,
      isFeatured: false,
      isActive: true,
      createdAt: new Date().toISOString(),
      images: [
        'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=900&q=80',
      ],
    },
    {
      id: 5,
      slug: 'royal-teal-mirror-work-kurti-palazzo',
      name: 'Royal Teal Mirror-Work Kurti & Palazzo',
      category: 'Kurta / Kurtis',
      price: 1399,
      originalPrice: 1899,
      discountPercent: 26,
      sizes: JSON.stringify(['XS', 'S', 'M', 'L', 'XL', 'XXL']),
      stock: 52,
      image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=80',
      description: 'Striking peacock teal short kurti with authentic Rajasthani mirror and gotapatti detailing, paired with wide-leg palazzo pants.',
      fabric: '100% Sanganeri Cotton',
      color: 'Teal Blue',
      highlights: JSON.stringify(['Authentic Mirror Work', 'Wide-Leg Flared Palazzo', 'Jaipur Handcrafted']),
      isNewArrival: false,
      isBestSeller: true,
      isFeatured: false,
      isActive: true,
      createdAt: new Date().toISOString(),
      images: [
        'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=80',
      ],
    },
    {
      id: 6,
      slug: 'mehendi-olive-embroidered-festive-suit',
      name: 'Mehendi Olive Embroidered Festive Suit',
      category: 'Festive Fits',
      price: 2799,
      originalPrice: 3899,
      discountPercent: 28,
      sizes: JSON.stringify(['S', 'M', 'L', 'XL', 'XXL']),
      stock: 22,
      image: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=900&q=80',
      description: 'Lustrous olive green ethnic suit enriched with gold zari embroidery and cut-work border on sleeves and organza dupatta.',
      fabric: 'Silk Chanderi',
      color: 'Olive Green',
      highlights: JSON.stringify(['Zari Cut-Work', 'Heavy Festive Border', 'Comfortable Fit']),
      isNewArrival: true,
      isBestSeller: true,
      isFeatured: false,
      isActive: true,
      createdAt: new Date().toISOString(),
      images: [
        'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=900&q=80',
      ],
    },
    {
      id: 7,
      slug: 'authentic-sanganeri-handblock-cotton-fabric',
      name: 'Authentic Sanganeri Handblock Cotton Fabric (Per Meter)',
      category: 'Fabrics',
      price: 349,
      originalPrice: 499,
      discountPercent: 30,
      sizes: JSON.stringify(['1 Meter', '2.5 Meter', '5 Meter', '10 Meter Bundle']),
      stock: 200,
      image: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?auto=format&fit=crop&w=900&q=80',
      description: 'Traditional wooden handblock printed fabric created by master artisans in Sanganer, Jaipur. Natural dyes, soft 60x60 cambric cotton.',
      fabric: '100% Pure Cambric Cotton (60s)',
      color: 'Indigo & Madder Red',
      highlights: JSON.stringify(['Natural Dye Colors', 'Direct from Sanganer Looms', 'Ultra Soft & Durable']),
      isNewArrival: false,
      isBestSeller: true,
      isFeatured: false,
      isActive: true,
      createdAt: new Date().toISOString(),
      images: [
        'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?auto=format&fit=crop&w=900&q=80',
      ],
    },
    {
      id: 8,
      slug: 'ivory-floral-jaipuri-print-anarkali-dress',
      name: 'Ivory Floral Jaipuri Print Anarkali Dress',
      category: 'Anarkali & Dresses',
      price: 2199,
      originalPrice: 2999,
      discountPercent: 26,
      sizes: JSON.stringify(['S', 'M', 'L', 'XL', 'XXL']),
      stock: 30,
      image: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=900&q=80',
      description: 'Breezy ivory white floor-length Anarkali with subtle pastel floral boota prints, tie-up dori with pom-poms, and contrast border.',
      fabric: 'Mulmul Cotton',
      color: 'Ivory White',
      highlights: JSON.stringify(['Full Floor Length', 'Lightweight Mulmul', 'Handmade Dori Tassels']),
      isNewArrival: true,
      isBestSeller: false,
      isFeatured: false,
      isActive: true,
      createdAt: new Date().toISOString(),
      images: [
        'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=900&q=80',
      ],
    },
  ];

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
      imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1600&q=85',
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

  return {
    categories,
    products,
    orders: [],
    admins,
    coupons,
    banners,
    settings,
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

      parsed.products = prods;
      parsed.deletedProductIds = deletedIds;
      parsed.customProducts = customProds.filter((cp) => !deletedIds.includes(cp.id));
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
  getProducts(filters?: {
    category?: string;
    search?: string;
    featured?: boolean;
    newArrival?: boolean;
    bestSeller?: boolean;
  }): LocalProduct[] {
    let list = this.data.products.filter((p) => p.isActive);

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

  getAllProductsAdmin(): LocalProduct[] {
    return [...this.data.products].sort((a, b) => b.id - a.id);
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
}

export const localStore = new LocalStoreManager();
