import React, { useState, useEffect, useRef } from 'react';
import {
  Image as ImageIcon,
  Upload,
  Plus,
  Trash2,
  Star,
  ArrowUp,
  ArrowDown,
  Sparkles,
  CheckCircle,
  Eye,
  Sliders,
  ExternalLink,
  HardDrive,
  Loader2,
  CloudUpload,
} from 'lucide-react';
import { Product } from '../types.ts';
import { uploadImageToDrive, ensureDriveAuth, getAccessToken } from '../utils/imageUpload.ts';
import { normalizeProductImageUrl, getDriveThumbnailUrl } from '../utils/imageUtils.ts';

interface Banner {
  id: number;
  title: string;
  subtitle?: string;
  imageUrl: string;
  ctaText?: string;
  ctaLink?: string;
  isActive?: boolean;
}

interface CategoryItem {
  id: number;
  name: string;
  image: string;
  slug: string;
}

interface AdminCatalogImagesProps {
  products: Product[];
  token: string | null;
  onRefreshProducts: () => void;
}

export const AdminCatalogImages: React.FC<AdminCatalogImagesProps> = ({
  products,
  token,
  onRefreshProducts,
}) => {
  const [activeSection, setActiveSection] = useState<'products' | 'banners' | 'categories'>('products');
  const [selectedProductId, setSelectedProductId] = useState<number>(
    products.length > 0 ? products[0].id : 1
  );

  // Selected product gallery state
  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Banners state
  const [bannersList, setBannersList] = useState<Banner[]>([
    {
      id: 1,
      title: 'Elegance in Every Thread',
      subtitle: 'Ladies Fashion & Fabrics • Sanganer, Jaipur',
      imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=85',
      ctaText: 'WhatsApp Par Order Karein',
      ctaLink: 'https://wa.me/919783770735',
      isActive: true,
    },
    {
      id: 2,
      title: 'Jaipuri Handblock Gotapatti Drop',
      subtitle: 'Pure 60s Cambric Cotton Anarkalis with Organza Dupatta',
      imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=85',
      ctaText: 'Explore Collection',
      ctaLink: '#catalog-section',
      isActive: true,
    },
  ]);

  const [newBanner, setNewBanner] = useState({
    title: '',
    subtitle: '',
    imageUrl: '',
    ctaText: 'Order on WhatsApp',
    ctaLink: 'https://wa.me/919783770735',
  });

  // Categories list
  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>([
    {
      id: 1,
      slug: 'kurta-sets',
      name: 'Kurta Sets',
      image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=300&q=80',
    },
    {
      id: 2,
      slug: 'co-ord-sets',
      name: 'Co-ord Sets',
      image: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=300&q=80',
    },
    {
      id: 3,
      slug: 'anarkali-dresses',
      name: 'Anarkali & Dresses',
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=300&q=80',
    },
    {
      id: 4,
      slug: 'kurta-kurtis',
      name: 'Kurta / Kurtis',
      image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=300&q=80',
    },
    {
      id: 5,
      slug: 'festive-fits',
      name: 'Festive Fits',
      image: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=300&q=80',
    },
    {
      id: 6,
      slug: 'fabrics',
      name: 'Fabrics',
      image: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?auto=format&fit=crop&w=300&q=80',
    },
  ]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync gallery when selected product changes
  useEffect(() => {
    if (selectedProduct) {
      const imgs = [
        selectedProduct.image,
        ...(selectedProduct.gallery || []),
      ].filter(Boolean);
      setGalleryImages(Array.from(new Set(imgs)));
    }
  }, [selectedProduct]);

  // Load banners from API if available
  useEffect(() => {
    if (token) {
      fetch('/api/admin/banners', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.banners && data.banners.length > 0) {
            setBannersList(data.banners);
          }
        })
        .catch(() => {});
    }
  }, [token]);

  // Google Drive Direct Upload & auto-compression
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    setFeedbackMsg('Google Drive se connect ho raha hai...');

    try {
      // 1. Ensure active Google Drive access token
      let driveToken = await getAccessToken();
      if (!driveToken) {
        driveToken = await ensureDriveAuth();
      }

      setFeedbackMsg('Photo optimize ho rahi hai (Auto-resizing)...');

      // 2. Client-side auto resize & compress to high-quality JPEG Blob
      const optimizedBlob: Blob = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1600;
            const MAX_HEIGHT = 2000;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height = Math.round((height * MAX_WIDTH) / width);
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width = Math.round((width * MAX_HEIGHT) / height);
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              canvas.toBlob(
                (blob) => {
                  if (blob) resolve(blob);
                  else resolve(file);
                },
                'image/jpeg',
                0.90
              );
            } else {
              resolve(file);
            }
          };
          img.onerror = () => reject(new Error('Image decode error'));
          img.src = event.target?.result as string;
        };
        reader.onerror = () => reject(new Error('File read error'));
        reader.readAsDataURL(file);
      });

      setFeedbackMsg('Google Drive folder "SS VASTRA Product Images" mein upload ho raha hai...');

      const safeName = (selectedProduct?.name || 'product')
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase();
      const fileName = `${safeName}_${Date.now()}.jpg`;

      // 3. Upload directly to user's Google Drive and set public reader permission
      const uploadResult = await uploadImageToDrive(
        driveToken,
        optimizedBlob,
        fileName,
        'SS VASTRA Product Images'
      );

      // 4. Save high-speed direct CDN preview link
      await handleAddImage(uploadResult.directUrl);
      showNotice('Photo Google Drive mein upload ho gayi aur product listing mein add ho gayi!');
    } catch (err: any) {
      console.error('Google Drive image upload failed:', err);
      alert('Google Drive upload error: ' + (err?.message || 'Upload nahi ho paya. Dobara koshish karein.'));
    } finally {
      setIsCompressing(false);
      setFeedbackMsg(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddImage = async (urlToAdd: string) => {
    if (!urlToAdd.trim()) return;
    const formattedUrl = normalizeProductImageUrl(urlToAdd.trim());
    const updated = [...galleryImages, formattedUrl];
    setGalleryImages(updated);
    setNewImageUrl('');
    await persistProductImages(updated[0], updated.slice(1));
  };

  const handleSetMainImage = async (idx: number) => {
    if (idx === 0) return;
    const newMain = galleryImages[idx];
    const rest = galleryImages.filter((_, i) => i !== idx);
    const updated = [newMain, ...rest];
    setGalleryImages(updated);
    await persistProductImages(newMain, rest);
    showNotice('Main catalog image updated!');
  };

  const handleMoveImage = async (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= galleryImages.length) return;

    const copy = [...galleryImages];
    const temp = copy[idx];
    copy[idx] = copy[targetIdx];
    copy[targetIdx] = temp;

    setGalleryImages(copy);
    await persistProductImages(copy[0], copy.slice(1));
  };

  const handleDeleteImage = async (idx: number) => {
    if (galleryImages.length <= 1) {
      alert('Product must have at least one main image.');
      return;
    }
    const updated = galleryImages.filter((_, i) => i !== idx);
    setGalleryImages(updated);
    await persistProductImages(updated[0], updated.slice(1));
    showNotice('Image removed from gallery.');
  };

  const persistProductImages = async (mainImg: string, extraImgs: string[]) => {
    if (!selectedProduct) return;
    try {
      await fetch(`/api/admin/products/${selectedProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          image: mainImg,
          gallery: extraImgs,
        }),
      });
      onRefreshProducts();
    } catch {
      console.error('Error persisting product images');
    }
  };

  const handleAddBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBanner.title || !newBanner.imageUrl) {
      alert('Banner title and image URL are required');
      return;
    }

    try {
      const res = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newBanner),
      });
      const data = await res.json();
      if (data.success && data.banner) {
        setBannersList([...bannersList, data.banner]);
        setNewBanner({
          title: '',
          subtitle: '',
          imageUrl: '',
          ctaText: 'Order on WhatsApp',
          ctaLink: 'https://wa.me/919783770735',
        });
        showNotice('New Hero Banner added and live on website!');
        window.dispatchEvent(new CustomEvent('ss-vastra-banners-updated'));
      }
    } catch {
      // Local fallback
      setBannersList([
        ...bannersList,
        {
          id: Date.now(),
          ...newBanner,
          isActive: true,
        },
      ]);
      showNotice('Banner saved locally.');
      window.dispatchEvent(new CustomEvent('ss-vastra-banners-updated'));
    }
  };

  const handleDeleteBanner = async (bannerId: number) => {
    if (!confirm('Kya aap is Hero Banner ko delete karna chahte hain?')) return;
    setBannersList((prev) => prev.filter((b) => b.id !== bannerId));
    try {
      await fetch(`/api/admin/banners/${bannerId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.warn('Banner delete api note:', err);
    }
    showNotice('Hero banner delete ho gaya!');
    window.dispatchEvent(new CustomEvent('ss-vastra-banners-updated'));
  };

  const handleBannerFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.84);
            setNewBanner((prev) => ({ ...prev, imageUrl: dataUrl }));
          } else {
            setNewBanner((prev) => ({ ...prev, imageUrl: event.target?.result as string }));
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      alert('Photo read error: ' + (err?.message || 'Try again'));
    }
  };

  const handleUpdateCategory = async (cat: CategoryItem, newImg: string) => {
    try {
      await fetch(`/api/admin/categories/${cat.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ image: newImg }),
      });
      setCategoriesList((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, image: newImg } : c))
      );
      showNotice(`Updated image for ${cat.name}!`);
    } catch {
      setCategoriesList((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, image: newImg } : c))
      );
    }
  };

  const showNotice = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      {feedbackMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Sub-Tabs: Product Gallery, Hero Banners, Category Images */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#2B2320]">
            Catalog Images & Visual Media
          </h2>
          <p className="text-xs text-stone-500">
            Multi-image product galleries, hero banners, and round category icons with auto-compression.
          </p>
        </div>

        <div className="flex bg-stone-100 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveSection('products')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeSection === 'products'
                ? 'bg-white text-[#A87A2A] shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Outfit Galleries
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('banners')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeSection === 'banners'
                ? 'bg-white text-[#A87A2A] shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Hero Banners
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('categories')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeSection === 'categories'
                ? 'bg-white text-[#A87A2A] shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Category Icons
          </button>
        </div>
      </div>

      {/* SECTION 1: PRODUCT GALLERIES */}
      {activeSection === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Product Selector & Gallery Management */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Product Selector Dropdown */}
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Select Outfit to Manage Images
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(Number(e.target.value))}
                  className="bg-[#FBF7F0] border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:border-[#A87A2A]"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (₹{p.price})
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-stone-500 block">Total Photos</span>
                <span className="font-bold text-sm text-[#A87A2A]">
                  {galleryImages.length} Images
                </span>
              </div>
            </div>

            {/* Images Grid */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-base font-bold text-[#2B2320]">
                  Image Slots (Drag / Reorder)
                </h3>
                <span className="text-[11px] text-stone-400">
                  Slot 1 is the primary card thumbnail
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {galleryImages.map((img, idx) => (
                  <div
                    key={idx}
                    className={`relative rounded-xl overflow-hidden border-2 bg-stone-50 group flex flex-col ${
                      idx === 0
                        ? 'border-[#A87A2A] shadow-md'
                        : 'border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    <div className="aspect-[3/4] relative overflow-hidden">
                      <img
                        src={normalizeProductImageUrl(img)}
                        alt={`Photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget;
                          const fallback = getDriveThumbnailUrl(img);
                          if (target.src !== fallback) {
                            target.src = fallback;
                          }
                        }}
                      />
                      {idx === 0 && (
                        <span className="absolute top-1.5 left-1.5 bg-[#A87A2A] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-current" /> Main
                        </span>
                      )}
                    </div>

                    {/* Action Bar Under Each Thumbnail */}
                    <div className="p-1.5 bg-white border-t border-stone-100 flex items-center justify-between gap-1 text-[10px]">
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => handleSetMainImage(idx)}
                          className="px-1.5 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-[#A87A2A] font-semibold"
                          title="Make Main Image"
                        >
                          Make Main
                        </button>
                      )}

                      <div className="flex items-center gap-0.5 ml-auto">
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => handleMoveImage(idx, 'up')}
                            className="p-1 rounded hover:bg-stone-100 text-stone-600"
                            title="Move earlier"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                        )}
                        {idx < galleryImages.length - 1 && (
                          <button
                            type="button"
                            onClick={() => handleMoveImage(idx, 'down')}
                            className="p-1 rounded hover:bg-stone-100 text-stone-600"
                            title="Move later"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(idx)}
                          className="p-1 rounded hover:bg-rose-50 text-rose-600"
                          title="Delete photo"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Image Form & File Upload */}
              <div className="pt-4 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Google Drive Direct File Upload */}
                <div className="p-3.5 bg-[#FBF7F0] border-2 border-dashed border-[#A87A2A]/60 rounded-xl flex flex-col items-center justify-center text-center relative overflow-hidden">
                  <div className="flex items-center gap-1.5 mb-1 text-[#A87A2A]">
                    <HardDrive className="w-5 h-5" />
                    <CloudUpload className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-[#2B2320]">
                    Direct Google Drive Photo Upload
                  </span>
                  <span className="text-[10px] text-stone-500 mb-2 max-w-[220px]">
                    Auto-saved to Drive folder <span className="font-semibold text-stone-700">"SS VASTRA Product Images"</span> & converted to instant preview link
                  </span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={isCompressing}
                    className="hidden"
                    id="catalog-img-file-upload"
                  />
                  <label
                    htmlFor="catalog-img-file-upload"
                    className={`px-3.5 py-1.5 bg-[#A87A2A] hover:bg-[#8e6520] text-white text-xs font-bold rounded-lg cursor-pointer transition-all shadow-xs flex items-center gap-1.5 ${
                      isCompressing ? 'opacity-70 pointer-events-none' : ''
                    }`}
                  >
                    {isCompressing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{feedbackMsg || 'Uploading to Drive...'}</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Photo to Drive</span>
                      </>
                    )}
                  </label>
                </div>

                {/* Direct Image URL Form */}
                <div className="p-3.5 bg-[#FBF7F0] border border-stone-200 rounded-xl flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#2B2320] block mb-1">
                      Or Add by Image / Drive Link
                    </span>
                    <input
                      type="url"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="Paste image link or Google Drive link..."
                      className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs focus:outline-none focus:border-[#A87A2A]"
                    />
                    <p className="text-[9.5px] text-stone-500 mt-1">
                      Google Drive links (sharing/view) auto-convert to high-speed CDN preview links.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddImage(newImageUrl)}
                    className="mt-2 w-full py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    Add Image to Listing
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Storefront Card Preview */}
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center gap-2 mb-3 text-xs font-bold text-[#A87A2A] uppercase">
                <Eye className="w-4 h-4" />
                <span>Storefront Live Preview</span>
              </div>

              {selectedProduct ? (
                <div className="max-w-xs mx-auto bg-white rounded-2xl overflow-hidden border border-[#E9A9BB]/40 shadow-md">
                  <div className="aspect-[3/4] overflow-hidden bg-stone-100 relative">
                    <img
                      src={normalizeProductImageUrl(galleryImages[0] || selectedProduct.image)}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget;
                        const fallback = getDriveThumbnailUrl(galleryImages[0] || selectedProduct.image);
                        if (target.src !== fallback) {
                          target.src = fallback;
                        }
                      }}
                    />
                    <span className="absolute top-2 left-2 bg-[#A87A2A] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {selectedProduct.discountPercent || 30}% OFF
                    </span>
                  </div>
                  <div className="p-3">
                    <span className="text-[10px] text-[#A87A2A] font-bold">
                      {selectedProduct.category}
                    </span>
                    <h4 className="font-serif text-xs font-bold text-[#2B2320] line-clamp-1 mt-0.5">
                      {selectedProduct.name}
                    </h4>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-sm font-bold text-[#2B2320]">
                        ₹{selectedProduct.price}
                      </span>
                      {selectedProduct.originalPrice && (
                        <span className="text-[10px] text-stone-400 line-through">
                          ₹{selectedProduct.originalPrice}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: HERO BANNERS */}
      {activeSection === 'banners' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Existing Banners */}
            <div className="space-y-4">
              <h3 className="font-serif text-lg font-bold text-[#2B2320]">
                Active Hero Slider Banners
              </h3>

              <div className="space-y-3">
                {bannersList.length === 0 ? (
                  <p className="text-xs text-stone-500 italic p-4 bg-white rounded-xl border border-stone-200">
                    Abhi koi custom banner nahi hai. Niche form se naya banner add karein.
                  </p>
                ) : (
                  bannersList.map((b) => (
                    <div
                      key={b.id}
                      className="p-3.5 bg-white rounded-2xl border border-stone-200 shadow-xs flex gap-3.5 items-center justify-between"
                    >
                      <img
                        src={b.imageUrl}
                        alt={b.title}
                        className="w-20 h-16 object-cover rounded-xl border border-stone-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-serif text-sm font-bold text-[#2B2320] truncate">
                            {b.title}
                          </h4>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-bold shrink-0">
                            Live
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 truncate">{b.subtitle || 'Jaipur Collection'}</p>
                        <span className="inline-block mt-0.5 text-[10px] font-mono text-[#A87A2A]">
                          CTA: {b.ctaText || 'Order'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteBanner(b.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                        title="Delete Hero Banner"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Delete</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Add New Banner Form */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <h3 className="font-serif text-lg font-bold text-[#2B2320] mb-3">
                Add New Hero Banner
              </h3>

              <form onSubmit={handleAddBanner} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Banner Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newBanner.title}
                    onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                    placeholder="e.g. Royal Gotapatti Collection 2026"
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-none focus:border-[#A87A2A]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Subtitle / Tagline
                  </label>
                  <input
                    type="text"
                    value={newBanner.subtitle}
                    onChange={(e) => setNewBanner({ ...newBanner, subtitle: e.target.value })}
                    placeholder="e.g. Sanganeri Handcrafted Elegance"
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-none focus:border-[#A87A2A]"
                  />
                </div>

                {/* Banner Photo Upload (Device & URL) */}
                <div className="p-3 bg-[#FBF7F0] border border-stone-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block font-semibold text-stone-700">
                      Banner Image (Photo Upload) *
                    </label>
                    <span className="text-[10px] text-[#A87A2A] font-medium">Device & Web URL</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <label className="px-3 py-1.5 bg-[#2B2320] hover:bg-stone-800 text-white text-xs font-bold rounded-xl cursor-pointer transition-all shadow-xs flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                      <span>Phone / PC se Photo Daalein</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBannerFileSelect}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div>
                    <input
                      type="url"
                      required
                      value={newBanner.imageUrl}
                      onChange={(e) => setNewBanner({ ...newBanner, imageUrl: e.target.value })}
                      placeholder="Ya Image link paste karein..."
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl font-mono text-[11px] focus:outline-none focus:border-[#A87A2A]"
                    />
                  </div>

                  {newBanner.imageUrl && (
                    <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-stone-200">
                      <img
                        src={newBanner.imageUrl}
                        alt="Banner Preview"
                        className="w-16 h-12 object-cover rounded-md border border-stone-200"
                      />
                      <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Photo Ready
                      </span>
                      <button
                        type="button"
                        onClick={() => setNewBanner({ ...newBanner, imageUrl: '' })}
                        className="ml-auto text-[11px] text-rose-600 hover:underline font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Button Text
                    </label>
                    <input
                      type="text"
                      value={newBanner.ctaText}
                      onChange={(e) => setNewBanner({ ...newBanner, ctaText: e.target.value })}
                      placeholder="Order on WhatsApp"
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-none focus:border-[#A87A2A]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Button Link
                    </label>
                    <input
                      type="text"
                      value={newBanner.ctaLink}
                      onChange={(e) => setNewBanner({ ...newBanner, ctaLink: e.target.value })}
                      placeholder="https://wa.me/919783770735"
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-none focus:border-[#A87A2A]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-2.5 bg-[#A87A2A] hover:bg-[#8e6520] text-white rounded-xl font-bold transition-colors shadow-xs"
                >
                  Save Hero Banner
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: CATEGORY IMAGES */}
      {activeSection === 'categories' && (
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div>
            <h3 className="font-serif text-lg font-bold text-[#2B2320]">
              Category Round Thumbnails
            </h3>
            <p className="text-xs text-stone-500">
              Update circular badge photos appearing on the home catalog navigation bar.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {categoriesList.map((cat) => (
              <div
                key={cat.id}
                className="p-3 rounded-2xl border border-stone-200 bg-[#FBF7F0] flex items-center gap-3"
              >
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#A87A2A] shrink-0">
                  <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                </div>

                <div className="flex-1 min-w-0">
                  <span className="font-serif font-bold text-xs text-[#2B2320] block">
                    {cat.name}
                  </span>
                  <input
                    type="url"
                    defaultValue={cat.image}
                    onBlur={(e) => {
                      if (e.target.value !== cat.image) {
                        handleUpdateCategory(cat, e.target.value);
                      }
                    }}
                    placeholder="Change image URL..."
                    className="mt-1 w-full px-2 py-1 bg-white border border-stone-300 rounded text-[10px] focus:outline-none focus:border-[#A87A2A]"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
