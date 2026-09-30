import React, { useState, useEffect, useMemo } from 'react';
import { Package, Plus } from 'lucide-react';
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
import { WishlistDrawer } from './components/WishlistDrawer.tsx';
import { QuickEditProductModal } from './components/QuickEditProductModal.tsx';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal.tsx';
import { VideoReelsSection } from './components/VideoReelsSection.tsx';
import { Product, Category, CartItem, Banner } from './types.ts';
import { sanitizeProductList } from './utils/productUtils.ts';

// Catalog starts clean: data loads dynamically from live database
const INITIAL_PRODUCTS: Product[] = [];

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
    image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=300&q=80',
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
  const [products, setProducts] = useState<Product[]>([]);
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

  // Website Visitor Traffic Tracking
  useEffect(() => {
    try {
      let visitorId = localStorage.getItem('ss_vastra_visitor_id');
      if (!visitorId) {
        visitorId = `vis_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        localStorage.setItem('ss_vastra_visitor_id', visitorId);
      }
      fetch('/api/track/visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorId,
          page: window.location.pathname || '/',
          referrer: document.referrer || 'Direct Visit',
          deviceType: window.innerWidth < 768 ? 'Mobile' : 'Desktop',
        }),
      }).catch(() => {});
    } catch {}
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

  // Wishlist State (Persisted in localStorage)
  const [wishlistIds, setWishlistIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('ss_vastra_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [wishlistDrawerOpen, setWishlistDrawerOpen] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('ss_vastra_wishlist', JSON.stringify(wishlistIds));
    } catch {}
  }, [wishlistIds]);

  const handleToggleWishlist = (product: Product) => {
    setWishlistIds((prev) => {
      const exists = prev.includes(product.id);
      if (exists) {
        setActionNotice(`"${product.name}" Wishlist se hata diya gaya.`);
        setTimeout(() => setActionNotice(null), 2500);
        return prev.filter((id) => id !== product.id);
      } else {
        setActionNotice(`"${product.name}" Wishlist me save ho gaya! ❤️`);
        setTimeout(() => setActionNotice(null), 2500);
        return [...prev, product.id];
      }
    });
  };

  const handleRemoveFromWishlist = (productId: number) => {
    setWishlistIds((prev) => prev.filter((id) => id !== productId));
  };

  const handleClearWishlist = () => {
    setWishlistIds([]);
  };

  const wishlistProducts = useMemo(() => {
    return products.filter((p) => wishlistIds.includes(p.id));
  }, [products, wishlistIds]);

  const [quickEditProduct, setQuickEditProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [currentDataMode, setCurrentDataMode] = useState<'live' | 'all' | 'demo'>('live');

  const handleAdminDeleteProduct = (product: Product, alreadyConfirmed = false) => {
    if (alreadyConfirmed) {
      handleExecuteDeleteProduct(product);
    } else {
      setProductToDelete(product);
    }
  };

  const handleExecuteDeleteProduct = async (product: Product) => {
    setIsDeletingProduct(true);

    // 1. Instantly remove from state so it disappears from the screen in 0ms!
    setProducts((prev) => prev.filter((p) => p.id !== product.id));
    setWishlistIds((prev) => prev.filter((id) => id !== product.id));

    // 2. Persist in deleted IDs cache
    try {
      const deletedIds: number[] = JSON.parse(
        localStorage.getItem('ss_vastra_deleted_product_ids') || '[]'
      );
      if (!deletedIds.includes(product.id)) {
        deletedIds.push(product.id);
        localStorage.setItem('ss_vastra_deleted_product_ids', JSON.stringify(deletedIds));
      }
      const rawCustom = JSON.parse(
        localStorage.getItem('ss_vastra_custom_products') || '[]'
      );
      const filteredCustom = rawCustom.filter((cp: any) => cp.id !== product.id);
      localStorage.setItem('ss_vastra_custom_products', JSON.stringify(filteredCustom));
    } catch {}

    // 3. Inform server
    try {
      const token = localStorage.getItem('ss_vastra_admin_token') || 'ssv_token_123456789';
      await fetch(`/api/admin/products/${product.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.warn('Delete product API note:', err);
    } finally {
      setIsDeletingProduct(false);
      setProductToDelete(null);
    }

    setActionNotice(`"${product.name}" delete ho gaya! ✓`);
    setTimeout(() => setActionNotice(null), 3000);
    window.dispatchEvent(new CustomEvent('ss-vastra-products-updated'));
  };

  const handleAdminEditProduct = (product: Product) => {
    setQuickEditProduct(product);
  };

  const handleSaveQuickEdit = async (updatedProduct: Product) => {
    // 1. Optimistic UI update in 0ms
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );

    // 2. Local storage sync
    try {
      const rawCustom = JSON.parse(
        localStorage.getItem('ss_vastra_custom_products') || '[]'
      );
      const idx = rawCustom.findIndex((cp: any) => cp.id === updatedProduct.id);
      if (idx >= 0) rawCustom[idx] = updatedProduct;
      else rawCustom.unshift(updatedProduct);
      localStorage.setItem('ss_vastra_custom_products', JSON.stringify(rawCustom));
    } catch {}

    // 3. Server PUT sync
    try {
      const token = localStorage.getItem('ss_vastra_admin_token') || 'ssv_token_123456789';
      await fetch(`/api/admin/products/${updatedProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedProduct),
      });
    } catch (err) {
      console.warn('Save product error:', err);
    }

    setActionNotice(`"${updatedProduct.name}" safalata se update ho gaya! ✓`);
    setTimeout(() => setActionNotice(null), 3000);
    window.dispatchEvent(new CustomEvent('ss-vastra-products-updated'));
  };

  // Direct 1-Click Clear All Demo Data
  const handleClearAllDemoData = async () => {
    try {
      const token = localStorage.getItem('ss_vastra_admin_token') || 'ssv_token_123456789';
      const res = await fetch('/api/admin/data-manager/purge-demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const d = await res.json().catch(() => ({}));
      
      // Clear all demo items from local storage caches
      try {
        localStorage.removeItem('ss_vastra_custom_products');
        const deletedIds: number[] = [];
        for (let i = 1; i <= 20; i++) deletedIds.push(i);
        localStorage.setItem('ss_vastra_deleted_product_ids', JSON.stringify(deletedIds));
      } catch {}

      // Refresh catalog
      await loadProductsFromAPI();
      setCurrentDataMode('live');
      setActionNotice(d.message || 'Sabhi Demo Data poori tarah clear ho gaya! ✓');
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err) {
      console.warn('Purge demo error:', err);
      // Fallback local clear
      setProducts((prev) => prev.filter((p) => !p.isDemo && p.id > 8));
      setActionNotice('Demo data hata diya gaya! ✓');
      setTimeout(() => setActionNotice(null), 3000);
    }
  };

  // Direct 1-Click Purge All Catalog
  const handlePurgeAllCatalog = async () => {
    try {
      const token = localStorage.getItem('ss_vastra_admin_token') || 'ssv_token_123456789';
      await fetch('/api/admin/data-manager/purge-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ confirm: 'PURGE_ALL_DATA' }),
      });
      
      localStorage.removeItem('ss_vastra_custom_products');
      localStorage.setItem('ss_vastra_cart', '[]');
      setProducts([]);
      setActionNotice('Catalog poori tarah clear ho gaya! Ab naye outfits add karein. ✓');
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err) {
      console.warn('Purge all error:', err);
      setProducts([]);
    }
  };

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
    // Self-healing: aggressively clear any demo products from legacy cache on startup
    try {
      const customRaw = localStorage.getItem('ss_vastra_custom_products');
      if (customRaw) {
        try {
          const parsed = JSON.parse(customRaw);
          if (Array.isArray(parsed)) {
            const clean = parsed.filter(
              (p: any) =>
                !(
                  p.isDemo === true ||
                  (typeof p.id === 'number' && p.id <= 8) ||
                  (p.name && (
                    p.name.includes('Red Embroidered') ||
                    p.name.includes('Gulabi Pink') ||
                    p.name.includes('Mint Green') ||
                    p.name.includes('Peacock Blue') ||
                    p.name.includes('Kesar Yellow') ||
                    p.name.includes('Sanganer Heritage Wooden') ||
                    p.name.includes('Peach Blossom') ||
                    p.name.includes('Maroon Zardozi')
                  ))
                )
            );
            localStorage.setItem('ss_vastra_custom_products', JSON.stringify(clean));
          } else {
            localStorage.removeItem('ss_vastra_custom_products');
          }
        } catch {
          localStorage.removeItem('ss_vastra_custom_products');
        }
      }
    } catch {}

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
      let list: Product[] = [];

      if (data.success && Array.isArray(data.products)) {
        list = sanitizeProductList(data.products);
        // Clear any stale deleted IDs from local storage that server confirms are active
        try {
          const activeIds = new Set(list.map((p) => p.id));
          const deletedIds: number[] = JSON.parse(
            localStorage.getItem('ss_vastra_deleted_product_ids') || '[]'
          );
          const validDeletedIds = deletedIds.filter((id) => !activeIds.has(id));
          localStorage.setItem('ss_vastra_deleted_product_ids', JSON.stringify(validDeletedIds));
        } catch {}
      }

      // Merge newly added custom products only if not in deleted IDs
      try {
        const deletedIds: number[] = JSON.parse(
          localStorage.getItem('ss_vastra_deleted_product_ids') || '[]'
        );
        const rawCustom = JSON.parse(
          localStorage.getItem('ss_vastra_custom_products') || '[]'
        );
        const customProds: Product[] = sanitizeProductList(rawCustom).filter(
          (cp) =>
            !deletedIds.includes(cp.id) &&
            cp.isDemo !== true &&
            (typeof cp.id !== 'number' || cp.id > 8)
        );
        for (const cp of customProds) {
          const idx = list.findIndex((p) => p.id === cp.id);
          if (idx >= 0) {
            list[idx] = { ...list[idx], ...cp };
          } else {
            list.unshift(cp);
          }
        }
      } catch {}

      const cleanList = sanitizeProductList(list);
      setProducts(cleanList);
      handleParseDeepLink(cleanList, categories);
    } catch {
      // In case of network error, do not overwrite with demo data
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
      if (data.success && Array.isArray(data.banners)) {
        setBanners(data.banners);
      }
    } catch (err) {
      console.warn('Error loading banners:', err);
    }
  };

  // Cart operations
  const handleAddToCart = (product: Product, size: string, quantity = 1, color?: string) => {
    setCartItems((prev) => {
      const existingIdx = prev.findIndex(
        (i) => i.product.id === product.id && i.size === size && (color ? i.color === color : true)
      );
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx].quantity += quantity;
        return updated;
      }
      return [...prev, { product, size, quantity, color: color || product.color }];
    });
    setCartDrawerOpen(true);
  };

  const handleUpdateQuantity = (productId: number, size: string, delta: number, color?: string) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId && item.size === size && (!color || item.color === color)) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveItem = (productId: number, size: string, color?: string) => {
    setCartItems((prev) =>
      prev.filter((i) => !(i.product.id === productId && i.size === size && (!color || i.color === color)))
    );
  };

  const handleClearCart = () => {
    setCartItems([]);
    setAppliedCouponDiscount(0);
    setAppliedCouponCode('');
  };

  const handleInstantBuy = (product: Product, size: string, quantity = 1, color?: string) => {
    handleAddToCart(product, size, quantity, color);
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
        wishlistCount={wishlistIds.length}
        onOpenWishlist={() => setWishlistDrawerOpen(true)}
        customerName={customerProfile?.name}
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

      {/* 3.5. 9:16 Portrait Video Reels Section (Watch, Love & Shop) */}
      <VideoReelsSection
        products={products}
        onSelectProduct={(product) => handleOpenProductDetail(product)}
        onOpenQuickBuy={(product) => handleInstantBuy(product, 'M', 1)}
      />

      {/* 4. Main Product Catalog Section with 2-Column Mobile Grid */}
      <section id="catalog-section" className="py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Data Mode & Live Catalog Manager Strip */}
          <div className="mb-6 p-3 sm:p-4 rounded-2xl bg-white border border-[#E9A9BB]/40 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
              <div>
                <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <span>Data Status:</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold uppercase">
                    Live Production Mode
                  </span>
                </span>
                <p className="text-[11px] text-stone-500">
                  {products.length} Outfits active | Demo Data: {products.filter((p) => p.isDemo || p.id <= 8).length}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleClearAllDemoData}
                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                title="All demo data clear karein"
              >
                <span>Clear Demo Data</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setQuickEditProduct({
                    id: Date.now(),
                    slug: `new-outfit-${Date.now()}`,
                    name: '',
                    category: categories[0]?.name || 'Kurta Sets',
                    price: 1499,
                    originalPrice: 1999,
                    discountPercent: 25,
                    sizes: ['S', 'M', 'L', 'XL'],
                    stock: 20,
                    image: '',
                    description: '',
                    fabric: 'Pure Cotton',
                    color: '',
                    highlights: ['Jaipur Handcrafted', 'Premium Quality'],
                    isNewArrival: true,
                    isBestSeller: false,
                    isFeatured: false,
                    isActive: true,
                    isDemo: false,
                  });
                }}
                className="px-3.5 py-1.5 rounded-xl bg-[#A87A2A] hover:bg-[#8e6520] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                title="Direct naya outfit add karein"
              >
                <span>+ Add Outfit</span>
              </button>

              <button
                type="button"
                onClick={handleOpenAdmin}
                className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                title="Admin Data Manager kholein"
              >
                <span>Data Manager</span>
              </button>
            </div>
          </div>

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
            <div className="text-center py-16 bg-white rounded-3xl border border-[#E9A9BB]/30 p-8 max-w-lg mx-auto">
              <p className="font-serif text-xl font-bold text-[#2B2320] mb-2">
                No outfits found in this view
              </p>
              <p className="text-xs text-stone-500 mb-6 leading-relaxed">
                Agar aapne Demo Data hata diya hai ya Live Mode on kiya hai, to Admin Portal se apne naye kapde add karein ya Demo Data Manager se sample catalog restore karein.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => {
                    setSelectedCategory('All Products');
                    setActiveTab('all');
                  }}
                  className="px-5 py-2.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition-colors"
                >
                  Show All Categories
                </button>
                <button
                  onClick={handleOpenAdmin}
                  className="px-5 py-2.5 rounded-full bg-[#A87A2A] text-white text-xs font-bold hover:bg-[#8e6520] transition-colors shadow-xs"
                >
                  Open Admin Portal
                </button>
              </div>
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
                  isWishlisted={wishlistIds.includes(product.id)}
                  onToggleWishlist={handleToggleWishlist}
                  isAdmin={isAdminLoggedIn}
                  onDeleteProduct={handleAdminDeleteProduct}
                  onEditProduct={handleAdminEditProduct}
                />
              ))}
            </div>
          )}

        </div>
      </section>

      {/* 5. Featured Product with Detail Shots */}
      {products.length > 0 && (
        <FeaturedSection
          product={products.find((p) => p.isFeatured) || products[0] || null}
          onAddToCart={(p, size) => handleAddToCart(p, size, 1)}
          onQuickView={(p) => handleOpenProductDetail(p)}
        />
      )}

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
        isWishlisted={detailProduct ? wishlistIds.includes(detailProduct.id) : false}
        onToggleWishlist={handleToggleWishlist}
        isAdmin={isAdminLoggedIn}
        onDeleteProduct={handleAdminDeleteProduct}
        onEditProduct={handleAdminEditProduct}
      />

      <QuickEditProductModal
        isOpen={!!quickEditProduct}
        product={quickEditProduct}
        onClose={() => setQuickEditProduct(null)}
        onSave={handleSaveQuickEdit}
        categories={categories.map((c) => c.name)}
      />

      <ConfirmDeleteModal
        isOpen={!!productToDelete}
        product={productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleExecuteDeleteProduct}
        isDeleting={isDeletingProduct}
      />

      <WishlistDrawer
        isOpen={wishlistDrawerOpen}
        onClose={() => setWishlistDrawerOpen(false)}
        wishlistProducts={wishlistProducts}
        onRemoveFromWishlist={handleRemoveFromWishlist}
        onClearWishlist={handleClearWishlist}
        onAddToCart={(p, size) => handleAddToCart(p, size, 1)}
        onQuickView={(p) => handleOpenProductDetail(p)}
      />

      {/* Floating Action Notice Toast */}
      {actionNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#2B2320] text-amber-200 px-4 py-2.5 rounded-2xl shadow-2xl border border-[#A87A2A]/40 text-xs font-bold animate-in fade-in slide-in-from-bottom duration-200 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{actionNotice}</span>
        </div>
      )}

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
