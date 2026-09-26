import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { HeroSlider } from './components/HeroSlider.tsx';
import { CategoryRow } from './components/CategoryRow.tsx';
import { ProductCard } from './components/ProductCard.tsx';
import { ProductDetailModal } from './components/ProductDetailModal.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { CheckoutModal } from './components/CheckoutModal.tsx';
import { TrackOrderModal } from './components/TrackOrderModal.tsx';
import { AdminPortal } from './components/AdminPortal.tsx';
import { SearchModal } from './components/SearchModal.tsx';
import { MyOrdersModal } from './components/MyOrdersModal.tsx';
import { CustomerAuthModal } from './components/CustomerAuthModal.tsx';
import { ContactModal } from './components/ContactModal.tsx';
import { FeaturedSection } from './components/FeaturedSection.tsx';
import { WhyChooseUs } from './components/WhyChooseUs.tsx';
import { ReviewsSlider } from './components/ReviewsSlider.tsx';
import { Footer } from './components/Footer.tsx';
import { FloatingWhatsApp } from './components/FloatingWhatsApp.tsx';
import { StoreLocationMap } from './components/StoreLocationMap.tsx';
import { DeepLinkModal } from './components/DeepLinkModal.tsx';
import { Product, Category, CartItem, Banner } from './types.ts';

// Initial fallback curated catalog if backend database is cold-starting
const INITIAL_PRODUCTS: Product[] = [
  {
    id: 1,
    slug: 'gulabi-gotapatti-anarkali-suit',
    name: 'Gulabi Mahal Handblock Gotapatti Anarkali Set with Organza Dupatta',
    category: 'Anarkali & Dresses',
    price: 2499,
    originalPrice: 3899,
    discountPercent: 36,
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    stock: 25,
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
    ],
    description: 'Masterfully handcrafted by master artisans in Sanganer, Jaipur. Pure 60s cambric cotton with traditional floral block prints, authentic gold gotapatti hand embroidery along the yoke, and a breezy lightweight organza dupatta.',
    fabric: 'Pure 60s Cambric Cotton',
    color: 'Gulabi Rose Pink',
    highlights: ['Handcrafted Yoke with Real Gotapatti', 'Flared 4.5m Kali Gher', 'Tailored Cigarette Pants'],
    isNewArrival: true,
    isBestSeller: true,
    isFeatured: true,
    isActive: true,
  },
  {
    id: 2,
    slug: 'indigo-bagru-straight-kurta-set',
    name: 'Indigo Neelkamal Handblock Straight Kurta Set with Afghani Pants',
    category: 'Kurta Sets',
    price: 1899,
    originalPrice: 2699,
    discountPercent: 30,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    stock: 40,
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
    description: 'Authentic Bagru natural indigo block prints with delicate thread embroidery on collar and cuffs. Paired with comfortable pleated Afghani trousers and matching mulmul dupatta.',
    fabric: '100% Breathable Sanganeri Cotton',
    color: 'Indigo Blue & Ivory',
    highlights: ['Natural Dyes', 'Comfort Afghani Fit Pants', 'Subtle Thread Work'],
    isNewArrival: true,
    isBestSeller: true,
    isActive: true,
  },
  {
    id: 3,
    slug: 'sage-green-cotton-coord-set',
    name: 'Sanganer Floral Sage Green Collared Co-ord Set',
    category: 'Co-ord Sets',
    price: 1599,
    originalPrice: 2299,
    discountPercent: 30,
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    stock: 35,
    image: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=800&q=80',
    description: 'Modern chic ethnic co-ord set featuring a button-down tunic top with notched lapels and tailored straight-cut trousers with deep functional pockets.',
    fabric: 'Soft Rayon Slub Cotton',
    color: 'Sage Green Floral',
    highlights: ['Dual Pockets Included', 'Elasticated Comfort Waist', 'Zero Color Bleed'],
    isNewArrival: true,
    isBestSeller: false,
    isActive: true,
  },
  {
    id: 4,
    slug: 'royal-peacock-mirror-kurti',
    name: 'Peacock Blue Sheesha Mirror-Work Flared Kurti',
    category: 'Kurta / Kurtis',
    price: 1299,
    originalPrice: 1799,
    discountPercent: 28,
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    stock: 50,
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80',
    description: 'Vibrant peacock blue short flared kurti adorned with genuine Rajasthani mirror work (sheesha) and gotta patti accents on neckline and bell sleeves.',
    fabric: 'Pure Cotton Mulmul',
    color: 'Peacock Blue',
    highlights: ['Hand-stitched Mirror Work', 'Three-quarter Bell Sleeves', 'Breezy Silhouette'],
    isNewArrival: false,
    isBestSeller: true,
    isActive: true,
  },
  {
    id: 5,
    slug: 'kesar-yellow-chanderi-festive-fit',
    name: 'Kesar Yellow Chanderi Silk Zari Suit with Scalloped Dupatta',
    category: 'Festive Fits',
    price: 2799,
    originalPrice: 3999,
    discountPercent: 30,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    stock: 20,
    image: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=800&q=80',
    description: 'Radiant festive suit crafted from rich Chanderi silk with intricate gold zari brocade motifs and scalloped organza dupatta with hand-finished latkans.',
    fabric: 'Chanderi Silk & Santoon Lining',
    color: 'Haldi Kesar Yellow',
    highlights: ['Gold Zari Weave', 'Scalloped Embroidered Border', 'Complete 3-Piece Set'],
    isNewArrival: false,
    isBestSeller: true,
    isActive: true,
  },
  {
    id: 6,
    slug: 'sanganer-wooden-block-cotton-fabric',
    name: 'Sanganer Heritage Wooden Handblock Cotton Fabric (Per Meter)',
    category: 'Fabrics',
    price: 349,
    originalPrice: 499,
    discountPercent: 30,
    sizes: ['1 Meter', '2.5 Meters', '5 Meters'],
    stock: 120,
    image: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?auto=format&fit=crop&w=800&q=80',
    description: 'Authentic 60x60 cambric cotton running fabric stamped by hand with carved teakwood blocks in Sanganer, Jaipur. Premium skin-friendly quality for bespoke tailoring.',
    fabric: '100% Pure Cambric Cotton 60s',
    color: 'Terracotta & Beige',
    highlights: ['Direct from Sanganer Looms', 'Natural Eco Dyes', 'Ultra Soft Breathable Feel'],
    isNewArrival: false,
    isBestSeller: true,
    isActive: true,
  },
  {
    id: 7,
    slug: 'peach-blossom-tier-anarkali',
    name: 'Peach Blossom Tiered Flared Anarkali Kurta Set',
    category: 'Anarkali & Dresses',
    price: 2299,
    originalPrice: 3199,
    discountPercent: 28,
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 30,
    image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80',
    description: 'Delicate pastel peach 3-tiered anarkali kurta set with hand-printed miniature florals, tassel tie-ups at waist, and straight cotton pants.',
    fabric: 'Pure Cotton Mulmul',
    color: 'Blush Peach',
    highlights: ['Multi-tier Flared Hem', 'Handmade Dori Tassels', 'Soft Inner Lining'],
    isNewArrival: true,
    isBestSeller: false,
    isActive: true,
  },
  {
    id: 8,
    slug: 'royal-maroon-velvet-touch-kurta',
    name: 'Maroon Zardozi Embroidered Silk Kurta with Chanderi Pants',
    category: 'Festive Fits',
    price: 2999,
    originalPrice: 4299,
    discountPercent: 30,
    sizes: ['M', 'L', 'XL', 'XXL'],
    stock: 15,
    image: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80',
    description: 'Deep royal maroon silk kurta featuring regal zardozi threadwork along the keyhole neckline and embroidered sleeve hems. Paired with straight chanderi trousers.',
    fabric: 'Raw Silk Blend',
    color: 'Deep Maroon',
    highlights: ['Handmade Zardozi Work', 'Regal Festive Tone', 'Premium Lining'],
    isNewArrival: true,
    isBestSeller: true,
    isActive: true,
  },
];

const INITIAL_CATEGORIES: Category[] = [
  {
    id: 1,
    slug: 'kurta-sets',
    name: 'Kurta Sets',
    icon: '👗',
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 2,
    slug: 'co-ord-sets',
    name: 'Co-ord Sets',
    icon: '👚',
    image: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 3,
    slug: 'anarkali-dresses',
    name: 'Anarkali & Dresses',
    icon: '💃',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 4,
    slug: 'kurta-kurtis',
    name: 'Kurta / Kurtis',
    icon: '🌸',
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 5,
    slug: 'festive-fits',
    name: 'Festive Fits',
    icon: '👑',
    image: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 6,
    slug: 'fabrics',
    name: 'Fabrics',
    icon: '🧵',
    image: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?auto=format&fit=crop&w=300&q=80',
  },
];

export function App() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All Products');
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'bestseller'>('all');

  // Modals and Drawers
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [trackOrderModalOpen, setTrackOrderModalOpen] = useState(false);
  const [myOrdersModalOpen, setMyOrdersModalOpen] = useState(false);
  const [customerAuthModalOpen, setCustomerAuthModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [adminPortalOpen, setAdminPortalOpen] = useState<boolean>(() => {
    try {
      const p = window.location.pathname.toLowerCase();
      const s = window.location.search.toLowerCase();
      const h = window.location.hash.toLowerCase();
      return (
        p.startsWith('/admin') ||
        p.includes('admin') ||
        s.includes('admin') ||
        h.includes('admin') ||
        s.includes('action=set-password') ||
        s.includes('action=reset-password')
      );
    } catch {
      return false;
    }
  });
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  // Customer Profile State
  const [customerProfile, setCustomerProfile] = useState<{
    name: string;
    phone: string;
    email: string;
    address: string;
  } | null>(() => {
    try {
      const p = localStorage.getItem('ss_vastra_customer_phone');
      const n = localStorage.getItem('ss_vastra_customer_name');
      const e = localStorage.getItem('ss_vastra_customer_email');
      const a = localStorage.getItem('ss_vastra_customer_address');
      return p ? { name: n || '', phone: p, email: e || '', address: a || '' } : null;
    } catch {
      return null;
    }
  });

  // Google Maps quota exceeded state
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    const handleQuota = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  // Cart State (Persisted in localStorage)
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('ss_vastra_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Coupon state applied in cart drawer
  const [appliedCouponDiscount, setAppliedCouponDiscount] = useState(0);
  const [appliedCouponCode, setAppliedCouponCode] = useState('');

  // Tracking modal pre-fill state
  const [trackOrderNumber, setTrackOrderNumber] = useState('');
  const [trackPhone, setTrackPhone] = useState('');

  // Check admin login status
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('ss_vastra_cart', JSON.stringify(cartItems));
    } catch {
      // ignore
    }
  }, [cartItems]);

  // Deep Link Modal state
  const [deepLinkModalOpen, setDeepLinkModalOpen] = useState(false);
  const [deepLinkTargetProduct, setDeepLinkTargetProduct] = useState<Product | null>(null);
  const [deepLinkTargetCategory, setDeepLinkTargetCategory] = useState<string | null>(null);

  const handleOpenDeepLinkModal = (product?: Product | null, category?: string | null) => {
    setDeepLinkTargetProduct(product || null);
    setDeepLinkTargetCategory(category || null);
    setDeepLinkModalOpen(true);
  };

  const handleParseDeepLink = (productList: Product[], categoryList: Category[]) => {
    try {
      const params = new URLSearchParams(window.location.search);
      const path = window.location.pathname;
      const hash = window.location.hash;

      // 1. Admin Portal Deep Link: /admin, ?admin=true, ?admin, or #admin
      if (
        path.startsWith('/admin') ||
        path.includes('admin') ||
        params.get('admin') === 'true' ||
        params.has('admin') ||
        hash === '#admin' ||
        hash.startsWith('#admin') ||
        params.get('action') === 'reset-password' ||
        params.get('action') === 'set-password'
      ) {
        setAdminPortalOpen(true);
        return;
      }

      // 2. Deep Link Generator Modal: ?deeplink=open or ?share=open
      if (params.get('deeplink') === 'open' || params.get('share') === 'open') {
        setDeepLinkModalOpen(true);
      }

      // 3. Coupon Deep Link: ?coupon=CODE
      const couponParam = params.get('coupon');
      if (couponParam) {
        const cleanCode = couponParam.toUpperCase();
        setAppliedCouponCode(cleanCode);
        setAppliedCouponDiscount(cleanCode.includes('20') ? 200 : 100);
      }

      // 4. Product Deep Link: ?product=ID_OR_SLUG or /product/ID_OR_SLUG or #product-ID
      let productIdOrSlug = params.get('product');
      if (!productIdOrSlug && path.startsWith('/product/')) {
        productIdOrSlug = path.replace('/product/', '').split('/')[0];
      }
      if (!productIdOrSlug && hash.startsWith('#product-')) {
        productIdOrSlug = hash.replace('#product-', '');
      }

      if (productIdOrSlug) {
        const targetProd = productList.find(
          (p) => String(p.id) === productIdOrSlug || p.slug === productIdOrSlug
        );
        if (targetProd) {
          setDetailProduct(targetProd);
        }
      }

      // 5. Instant Buy Deep Link: ?buy=ID_OR_SLUG&size=M
      const buyParam = params.get('buy');
      if (buyParam) {
        const targetProd = productList.find(
          (p) => String(p.id) === buyParam || p.slug === buyParam
        );
        if (targetProd) {
          const sizeParam = params.get('size') || (targetProd.sizes && targetProd.sizes[0]) || 'Free Size';
          handleAddToCart(targetProd, sizeParam, 1);
          setCheckoutModalOpen(true);
        }
      }

      // 6. Category Deep Link: ?category=CATEGORY_NAME_OR_SLUG
      const categoryParam = params.get('category');
      if (categoryParam) {
        const decoded = decodeURIComponent(categoryParam);
        const matchedCategory = categoryList.find(
          (c) =>
            c.name.toLowerCase() === decoded.toLowerCase() ||
            c.slug.toLowerCase() === decoded.toLowerCase()
        );
        if (matchedCategory) {
          setSelectedCategory(matchedCategory.name);
        } else {
          setSelectedCategory(decoded);
        }
        setTimeout(() => {
          document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 350);
      }

      // 7. Track Order Deep Link: ?track=SSV-1001&phone=9876543210
      const trackParam = params.get('track');
      if (trackParam) {
        setTrackOrderNumber(decodeURIComponent(trackParam));
        const phoneParam = params.get('phone');
        if (phoneParam) {
          setTrackPhone(decodeURIComponent(phoneParam));
        }
        setTrackOrderModalOpen(true);
      }

      // 8. Cart Deep Link: ?cart=open or ?cart=true
      if (params.get('cart') === 'open' || params.get('cart') === 'true') {
        setCartDrawerOpen(true);
      }

      // 9. Customer Orders Deep Link: ?my-orders=true or ?orders=true
      if (params.get('my-orders') === 'true' || params.get('orders') === 'true') {
        setMyOrdersModalOpen(true);
      }

      // 10. Contact Deep Link: ?contact=true
      if (params.get('contact') === 'true') {
        setContactModalOpen(true);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('ss_vastra_admin_token');
    setIsAdminLoggedIn(!!token);
    handleParseDeepLink(products, categories);
    loadProductsFromAPI();
    loadCategoriesFromAPI();
    loadBannersFromAPI();
  }, []);

  useEffect(() => {
    const onPopState = () => {
      handleParseDeepLink(products, categories);
    };
    const onHashChange = () => {
      const h = window.location.hash.toLowerCase();
      if (h.includes('admin')) {
        setAdminPortalOpen(true);
      }
    };
    const handleProductsUpdated = () => {
      loadProductsFromAPI();
    };
    const handleBannersUpdated = () => {
      loadBannersFromAPI();
    };

    window.addEventListener('popstate', onPopState);
    window.addEventListener('hashchange', onHashChange);
    window.addEventListener('open-admin-portal', () => setAdminPortalOpen(true));
    window.addEventListener('ss-vastra-products-updated', handleProductsUpdated);
    window.addEventListener('ss-vastra-banners-updated', handleBannersUpdated);
    window.addEventListener('storage', handleProductsUpdated);
    return () => {
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('open-admin-portal', () => setAdminPortalOpen(true));
      window.removeEventListener('ss-vastra-products-updated', handleProductsUpdated);
      window.removeEventListener('ss-vastra-banners-updated', handleBannersUpdated);
      window.removeEventListener('storage', handleProductsUpdated);
    };
  }, [products, categories]);

  const handleOpenProductDetail = (p: Product) => {
    setDetailProduct(p);
    try {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('product', String(p.id));
      window.history.pushState({ productId: p.id }, '', newUrl.toString());
    } catch {
      // ignore
    }
  };

  const handleCloseProductDetail = () => {
    setDetailProduct(null);
    try {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('product');
      window.history.pushState({}, '', newUrl.pathname + (newUrl.search ? newUrl.search : ''));
    } catch {
      // ignore
    }
  };

  const handleOpenAdmin = () => {
    if (!window.location.pathname.startsWith('/admin')) {
      window.history.pushState(null, '', '/admin');
    }
    setAdminPortalOpen(true);
  };

  const handleCloseAdmin = () => {
    if (window.location.pathname.startsWith('/admin') || window.location.search.includes('action=')) {
      window.history.pushState(null, '', '/');
    }
    setAdminPortalOpen(false);
  };

  const loadProductsFromAPI = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      let list: Product[] =
        data.success && Array.isArray(data.products) && data.products.length > 0
          ? data.products
          : INITIAL_PRODUCTS;

      // Persistence safeguard: filter out deleted products & merge custom products across serverless restarts
      try {
        const deletedIds: number[] = JSON.parse(
          localStorage.getItem('ss_vastra_deleted_product_ids') || '[]'
        );
        const customProds: Product[] = JSON.parse(
          localStorage.getItem('ss_vastra_custom_products') || '[]'
        );

        list = list.filter((p) => !deletedIds.includes(p.id));
        for (const cp of customProds) {
          if (!deletedIds.includes(cp.id)) {
            const idx = list.findIndex((p) => p.id === cp.id);
            if (idx >= 0) {
              list[idx] = { ...list[idx], ...cp };
            } else {
              list.unshift(cp);
            }
          }
        }
      } catch {}

      setProducts(list);
      handleParseDeepLink(list, categories);
    } catch {
      try {
        const deletedIds: number[] = JSON.parse(
          localStorage.getItem('ss_vastra_deleted_product_ids') || '[]'
        );
        const customProds: Product[] = JSON.parse(
          localStorage.getItem('ss_vastra_custom_products') || '[]'
        );
        let fallbackList = INITIAL_PRODUCTS.filter((p) => !deletedIds.includes(p.id));
        for (const cp of customProds) {
          if (!deletedIds.includes(cp.id) && !fallbackList.some((p) => p.id === cp.id)) {
            fallbackList.unshift(cp);
          }
        }
        setProducts(fallbackList);
      } catch {}
    }
  };

  const loadCategoriesFromAPI = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.success && data.categories && data.categories.length > 0) {
        setCategories(data.categories);
        handleParseDeepLink(products, data.categories);
      }
    } catch {
      // Fallback already in place
    }
  };

  const loadBannersFromAPI = async () => {
    try {
      const res = await fetch('/api/banners');
      const data = await res.json();
      if (data.success && Array.isArray(data.banners) && data.banners.length > 0) {
        setBanners(data.banners);
      }
    } catch (err) {
      console.warn('Error loading banners:', err);
    }
  };

  // Cart operations
  const handleAddToCart = (product: Product, size: string, quantity = 1) => {
    setCartItems((prev) => {
      const existingIdx = prev.findIndex(
        (i) => i.product.id === product.id && i.size === size
      );
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx].quantity += quantity;
        return updated;
      }
      return [...prev, { product, size, quantity }];
    });
    setCartDrawerOpen(true);
  };

  const handleUpdateQuantity = (productId: number, size: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId && item.size === size) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveItem = (productId: number, size: string) => {
    setCartItems((prev) =>
      prev.filter((i) => !(i.product.id === productId && i.size === size))
    );
  };

  const handleClearCart = () => {
    setCartItems([]);
    setAppliedCouponDiscount(0);
    setAppliedCouponCode('');
  };

  const handleInstantBuy = (product: Product, size: string, quantity = 1) => {
    handleAddToCart(product, size, quantity);
    setDetailProduct(null);
    setCartDrawerOpen(false);
    setCheckoutModalOpen(true);
  };

  const handleProceedToCheckout = (couponDiscount: number, couponCode: string) => {
    setAppliedCouponDiscount(couponDiscount);
    setAppliedCouponCode(couponCode);
    setCartDrawerOpen(false);
    setCheckoutModalOpen(true);
  };

  // Filter products by selected category and active tab
  const displayedProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory && selectedCategory !== 'All Products') {
        if (p.category.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }
      }
      if (activeTab === 'new') return p.isNewArrival;
      if (activeTab === 'bestseller') return p.isBestSeller;
      return true;
    });
  }, [products, selectedCategory, activeTab]);

  const cartTotalCount = cartItems.reduce((acc, curr) => acc + curr.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF7F0] text-[#2B2320]">
      {/* Tier 1 / Case A Maps Quota Notice Banner */}
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* 1. Header & Navigation */}
      <Navbar
        cartCount={cartTotalCount}
        onOpenCart={() => setCartDrawerOpen(true)}
        onOpenSearch={() => setSearchModalOpen(true)}
        onOpenTrackOrder={() => setTrackOrderModalOpen(true)}
        onOpenMyOrders={() => setMyOrdersModalOpen(true)}
        onOpenCustomerAuth={() => setCustomerAuthModalOpen(true)}
        onOpenContact={() => setContactModalOpen(true)}
        onOpenDeepLink={() => handleOpenDeepLinkModal()}
        onScrollToMap={() => {
          document.getElementById('store-location')?.scrollIntoView({ behavior: 'smooth' });
        }}
        onSelectCategory={(catName) => {
          setSelectedCategory(catName);
          setActiveTab('all');
          document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenAdmin={handleOpenAdmin}
        isAdminLoggedIn={isAdminLoggedIn}
      />

      {/* 2. Hero Banner Slider */}
      <HeroSlider
        banners={banners}
        onExploreClick={() => {
          document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* 3. Round Category Icons Row */}
      <CategoryRow
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={(catName) => {
          setSelectedCategory(catName);
          setActiveTab('all');
          document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* 4. Main Product Catalog Section with 2-Column Mobile Grid */}
      <section id="catalog-section" className="py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Heading & Filter Tabs */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#A87A2A] block">
                {selectedCategory === 'All Products' ? 'Curated Jaipur Collection' : selectedCategory}
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#2B2320]">
                {selectedCategory === 'All Products' ? 'Handcrafted Ladies Ethnic Wear' : selectedCategory}
              </h2>
            </div>

            {/* Sub-filter tabs: All, New Arrivals, Best Sellers */}
            <div className="inline-flex p-1 rounded-2xl bg-white border border-[#E9A9BB]/40 shadow-xs self-start md:self-center">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'all'
                    ? 'bg-[#A87A2A] text-white shadow-xs'
                    : 'text-stone-600 hover:text-[#A87A2A]'
                }`}
              >
                All Outfits
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('new')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'new'
                    ? 'bg-[#A87A2A] text-white shadow-xs'
                    : 'text-stone-600 hover:text-[#A87A2A]'
                }`}
              >
                New Arrivals
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('bestseller')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'bestseller'
                    ? 'bg-[#A87A2A] text-white shadow-xs'
                    : 'text-stone-600 hover:text-[#A87A2A]'
                }`}
              >
                Best Sellers
              </button>
            </div>
          </div>

          {/* 2-Column Grid on Mobile, 3-4 Columns on Desktop */}
          {displayedProducts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-[#E9A9BB]/30 p-8">
              <p className="font-serif text-xl font-bold text-[#2B2320] mb-2">
                No outfits found in this category right now
              </p>
              <p className="text-xs text-stone-500 mb-6">
                Please check another category or browse all handcrafted products.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('All Products');
                  setActiveTab('all');
                }}
                className="px-6 py-2.5 rounded-full bg-[#A87A2A] text-white text-xs font-semibold hover:bg-[#8e6520]"
              >
                Show All Outfits
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {displayedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickView={(p) => handleOpenProductDetail(p)}
                  onAddToCart={(p, size) => handleAddToCart(p, size, 1)}
                  onShareDeepLink={(p) => handleOpenDeepLinkModal(p)}
                />
              ))}
            </div>
          )}

        </div>
      </section>

      {/* 5. Featured Product with Detail Shots */}
      <FeaturedSection
        onAddToCart={(p, size) => handleAddToCart(p, size, 1)}
        onQuickView={(p) => handleOpenProductDetail(p)}
      />

      {/* 6. Why Choose Us Section */}
      <WhyChooseUs />

      {/* 7. Boutique & Artisan Workshop Google Map */}
      <StoreLocationMap
        onScheduleAppointment={() => setContactModalOpen(true)}
      />

      {/* 8. Customer Reviews Slider */}
      <ReviewsSlider />

      {/* 8. Footer (3 Columns, Dark #1F1A18, Store Contacts) */}
      <Footer
        onSelectCategory={(catName) => {
          setSelectedCategory(catName);
          setActiveTab('all');
          document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenTrackOrder={() => setTrackOrderModalOpen(true)}
        onOpenMyOrders={() => setMyOrdersModalOpen(true)}
        onOpenContact={() => setContactModalOpen(true)}
        onOpenAdmin={() => setAdminPortalOpen(true)}
      />

      {/* 9. Floating WhatsApp Helpline Button */}
      <FloatingWhatsApp />

      {/* Quick Admin Launcher Floating Button */}
      {!adminPortalOpen && (
        <button
          type="button"
          onClick={handleOpenAdmin}
          className="fixed bottom-5 left-5 z-40 flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#2B2320] text-amber-300 hover:text-white border-2 border-[#A87A2A] shadow-xl hover:bg-[#A87A2A] transition-all text-xs font-bold tracking-wide active:scale-95 group cursor-pointer"
          title="Open SS VASTRA Admin Portal"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Admin Portal</span>
        </button>
      )}

      {/* 10. Modals & Drawers */}
      <CartDrawer
        isOpen={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onProceedToCheckout={handleProceedToCheckout}
      />

      <CheckoutModal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        items={cartItems}
        couponDiscount={appliedCouponDiscount}
        couponCode={appliedCouponCode}
        onClearCart={handleClearCart}
        onOrderSuccess={(orderData) => {
          setTrackOrderNumber(orderData.orderNumber);
          setTrackPhone(orderData.phone);
        }}
      />

      <ProductDetailModal
        product={detailProduct}
        onClose={handleCloseProductDetail}
        onAddToCart={handleAddToCart}
        onInstantBuy={handleInstantBuy}
        onOpenDeepLink={(p) => handleOpenDeepLinkModal(p)}
      />

      <TrackOrderModal
        isOpen={trackOrderModalOpen}
        onClose={() => setTrackOrderModalOpen(false)}
        defaultOrderNumber={trackOrderNumber}
        defaultPhone={trackPhone}
      />

      <MyOrdersModal
        isOpen={myOrdersModalOpen}
        onClose={() => setMyOrdersModalOpen(false)}
        customerPhone={customerProfile?.phone || trackPhone}
        customerEmail={customerProfile?.email}
        onOpenTracking={(orderNo, phone) => {
          setTrackOrderNumber(orderNo);
          setTrackPhone(phone);
          setTrackOrderModalOpen(true);
        }}
      />

      <CustomerAuthModal
        isOpen={customerAuthModalOpen}
        onClose={() => setCustomerAuthModalOpen(false)}
        onLoginSuccess={(profile) => {
          setCustomerProfile(profile);
          setTrackPhone(profile.phone);
        }}
      />

      <ContactModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        onScrollToMap={() => {
          document.getElementById('store-location')?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        products={products}
        onSelectProduct={(p) => handleOpenProductDetail(p)}
      />

      <AdminPortal
        isOpen={adminPortalOpen}
        onClose={handleCloseAdmin}
        onProductsUpdated={loadProductsFromAPI}
      />

      <DeepLinkModal
        isOpen={deepLinkModalOpen}
        onClose={() => setDeepLinkModalOpen(false)}
        products={products}
        categories={categories}
        initialProduct={deepLinkTargetProduct}
        initialCategory={deepLinkTargetCategory}
      />
    </div>
  );
}

export default App;
