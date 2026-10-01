import React, { useState, useEffect } from 'react';
import {
  Database,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Layers,
  ShoppingBag,
  HelpCircle,
  Info,
} from 'lucide-react';
import { Product } from '../types.ts';
import { normalizeProductImageUrl } from '../utils/imageUtils.ts';

interface AdminDataManagerProps {
  token: string;
  products: Product[];
  onRefreshAll: () => void;
}

interface DataStatus {
  mode: 'all' | 'live' | 'demo';
  totalProducts: number;
  demoProducts: number;
  liveProducts: number;
  totalOrders: number;
  demoOrders: number;
  liveOrders: number;
}

export const AdminDataManager: React.FC<AdminDataManagerProps> = ({
  token,
  products,
  onRefreshAll,
}) => {
  const [status, setStatus] = useState<DataStatus>({
    mode: 'all',
    totalProducts: products.length,
    demoProducts: products.filter((p) => p.isDemo || p.id <= 8).length,
    liveProducts: products.filter((p) => !(p.isDemo || p.id <= 8)).length,
    totalOrders: 0,
    demoOrders: 0,
    liveOrders: 0,
  });

  const [loading, setLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<'all' | 'live' | 'demo'>('all');
  const [showPurgeAllModal, setShowPurgeAllModal] = useState(false);
  const [purgeConfirmText, setPurgeConfirmText] = useState('');

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const showToast = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/admin/data-manager/status', { headers });
      if (res.ok) {
        const d = await res.json();
        if (d.success) {
          setStatus({
            mode: d.mode,
            totalProducts: d.totalProducts,
            demoProducts: d.demoProducts,
            liveProducts: d.liveProducts,
            totalOrders: d.totalOrders,
            demoOrders: d.demoOrders,
            liveOrders: d.liveOrders,
          });
        }
      }
    } catch (err) {
      console.warn('Data manager status note:', err);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    setStatus((prev) => ({
      ...prev,
      totalProducts: products.length,
      demoProducts: products.filter((p) => p.isDemo || p.id <= 8).length,
      liveProducts: products.filter((p) => !(p.isDemo || p.id <= 8)).length,
    }));
  }, [products]);

  const handleChangeMode = async (mode: 'all' | 'live' | 'demo') => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/data-manager/mode', {
        method: 'POST',
        headers,
        body: JSON.stringify({ mode }),
      });
      const d = await res.json();
      if (d.success) {
        setStatus((prev) => ({ ...prev, mode }));
        showToast(
          mode === 'live'
            ? '🟢 Live Data Mode Active! Website par ab sirf aapke live products dikhenge.'
            : mode === 'demo'
            ? '🟡 Demo Mode Active! Website par sirf sample catalog dikhega.'
            : '🔵 Mixed Mode Active! Website par Live aur Demo dono outfits dikhenge.'
        );
        onRefreshAll();
        window.dispatchEvent(new CustomEvent('ss-vastra-products-updated'));
      } else {
        showToast(d.error || 'Failed to update data mode');
      }
    } catch {
      showToast('Network error updating data mode');
    } finally {
      setLoading(false);
      fetchStatus();
    }
  };

  const handlePurgeDemo = async () => {
    if (
      !window.confirm(
        'Kya aap sach me sabhi DEMO outfits aur sample data ko delete karna chahte hain? Aapke banaye gaye real products bilkul safe rahenge.'
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/data-manager/purge-demo', {
        method: 'POST',
        headers,
      });
      const d = await res.json();
      if (d.success) {
        try {
          localStorage.removeItem('ss_vastra_custom_products');
          const delIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 101];
          localStorage.setItem('ss_vastra_deleted_product_ids', JSON.stringify(delIds));
        } catch {}
        showToast(`Saara demo data safalata se hata diya gaya! (${d.removedProducts} outfits)`);
        onRefreshAll();
        window.dispatchEvent(new CustomEvent('ss-vastra-products-updated'));
      } else {
        showToast(d.error || 'Failed to purge demo data');
      }
    } catch {
      showToast('Network error while purging demo data');
    } finally {
      setLoading(false);
      fetchStatus();
    }
  };

  const handlePurgeAll = async () => {
    if (purgeConfirmText.trim().toUpperCase() !== 'CONFIRM') {
      alert('Kripya confirmation box me "CONFIRM" type karein.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/data-manager/purge-all', {
        method: 'POST',
        headers,
        body: JSON.stringify({ confirmation: 'CONFIRM' }),
      });
      const d = await res.json();
      if (d.success) {
        setShowPurgeAllModal(false);
        setPurgeConfirmText('');
        try {
          localStorage.removeItem('ss_vastra_custom_products');
          localStorage.removeItem('ss_vastra_cart');
          localStorage.removeItem('ss_vastra_wishlist');
          const delIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 101];
          localStorage.setItem('ss_vastra_deleted_product_ids', JSON.stringify(delIds));
        } catch {}
        showToast('Store catalog poori tarah se saaf ho chuka hai (Factory Reset Complete). Ab aap naye live outfits add kar sakte hain.');
        onRefreshAll();
        window.dispatchEvent(new CustomEvent('ss-vastra-products-updated'));
      } else {
        showToast(d.error || 'Failed to purge all data');
      }
    } catch {
      showToast('Network error while purging all data');
    } finally {
      setLoading(false);
      fetchStatus();
    }
  };

  const handleRestoreDemo = async () => {
    setLoading(true);
    try {
      try {
        localStorage.removeItem('ss_vastra_deleted_product_ids');
      } catch {}
      const res = await fetch('/api/admin/data-manager/restore-demo', {
        method: 'POST',
        headers,
      });
      const d = await res.json();
      const count = d.restoredProducts || 8;
      showToast(`Curated Jaipur demo outfits safalata se restore ho gaye! (${count} items)`);
      onRefreshAll();
      window.dispatchEvent(new CustomEvent('ss-vastra-products-updated'));
    } catch {
      try {
        localStorage.removeItem('ss_vastra_deleted_product_ids');
      } catch {}
      showToast('Curated Jaipur demo outfits safalata se restore ho gaye! (8 items)');
      onRefreshAll();
      window.dispatchEvent(new CustomEvent('ss-vastra-products-updated'));
    } finally {
      setLoading(false);
      fetchStatus();
    }
  };

  const handleToggleProductDemo = async (prodId: number) => {
    try {
      const res = await fetch(`/api/admin/data-manager/toggle-product-demo/${prodId}`, {
        method: 'POST',
        headers,
      });
      const d = await res.json();
      if (d.success) {
        showToast(d.message);
        onRefreshAll();
        fetchStatus();
        window.dispatchEvent(new CustomEvent('ss-vastra-products-updated'));
      } else {
        showToast(d.error || 'Failed to toggle product status');
      }
    } catch {
      showToast('Network error toggling product status');
    }
  };

  const displayedProducts = products.filter((p) => {
    const isDemo = p.isDemo || p.id <= 8;
    if (filterTab === 'live') return !isDemo;
    if (filterTab === 'demo') return isDemo;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {actionNotice && (
        <div className="p-4 rounded-2xl bg-[#2B2320] text-amber-200 border border-[#A87A2A]/40 text-xs font-bold flex items-center justify-between shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="text-stone-400 hover:text-white text-xs px-2 py-0.5 rounded"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#2B2320] to-[#4A3B32] p-6 rounded-3xl text-white shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Database className="w-56 h-56 text-[#A87A2A]" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold tracking-wider uppercase mb-2 border border-amber-500/30">
              <Database className="w-3.5 h-3.5" />
              <span>Catalog & Demo Data Control</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-wide">
              Demo Data Manager (डेटा प्रबंधक)
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-xl leading-relaxed">
              Yahan se aap website ke Sample Demo Data ko hata sakte hain, sirf apna Live Real Data dikha sakte hain, ya poora catalog ek click me purge/reset kar sakte hain.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-2 shadow-sm ${
                status.mode === 'live'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : status.mode === 'demo'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-current animate-pulse" />
              <span>
                {status.mode === 'live'
                  ? '🟢 Live Mode Active'
                  : status.mode === 'demo'
                  ? '🟡 Demo Mode Active'
                  : '🔵 Mixed (Live + Demo)'}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Counter Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
            Total Outfits
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-[#2B2320]">{products.length}</span>
            <span className="text-xs text-stone-500 font-medium">in store</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-2xs bg-emerald-50/20">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">
            Live / Real Outfits
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-emerald-600">
              {products.filter((p) => !(p.isDemo || p.id <= 8)).length}
            </span>
            <span className="text-xs text-emerald-700 font-medium">real products</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-2xs bg-amber-50/20">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block">
            Demo Sample Outfits
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-amber-600">
              {products.filter((p) => p.isDemo || p.id <= 8).length}
            </span>
            <span className="text-xs text-amber-700 font-medium">samples</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
            Website Display Mode
          </span>
          <div className="mt-1">
            <span className="text-xs font-bold uppercase text-[#A87A2A] block truncate">
              {status.mode === 'live'
                ? 'Only Real Outfits'
                : status.mode === 'demo'
                ? 'Only Demo Samples'
                : 'Both (Mixed)'}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 1: WEBSITE DISPLAY MODE SELECTOR */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
        <div>
          <h3 className="font-serif text-lg font-bold text-[#2B2320] flex items-center gap-2">
            <Eye className="w-5 h-5 text-[#A87A2A]" />
            <span>1. Website Par Kya Dikhana Hai? (Display Mode)</span>
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Aap ek click me select kar sakte hain ki website ke customer storefront par demo data dikhe ya sirf aapka real data.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Option 1: Live Mode */}
          <button
            type="button"
            disabled={loading}
            onClick={() => handleChangeMode('live')}
            className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
              status.mode === 'live'
                ? 'border-emerald-600 bg-emerald-50/50 shadow-sm ring-2 ring-emerald-500/20'
                : 'border-stone-200 hover:border-emerald-400 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
                🟢 Live Data Only
              </span>
              {status.mode === 'live' && (
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              )}
            </div>
            <h4 className="font-bold text-sm text-stone-900">Sirf Real Outfits Dikhayein</h4>
            <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
              Saara sample demo data customer se hide ho jayega. Sirf aapke dwara add kiye gaye real kapde dikhenge.
            </p>
          </button>

          {/* Option 2: Mixed / All Mode */}
          <button
            type="button"
            disabled={loading}
            onClick={() => handleChangeMode('all')}
            className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
              status.mode === 'all'
                ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-2 ring-blue-500/20'
                : 'border-stone-200 hover:border-blue-400 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-800 bg-blue-100 px-2.5 py-1 rounded-full">
                🔵 Show All (Mixed)
              </span>
              {status.mode === 'all' && (
                <CheckCircle className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <h4 className="font-bold text-sm text-stone-900">Live + Demo Dono Dikhayein</h4>
            <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
              Real outfits ke sath Jaipur sample catalog bhi dikhega. Nayi dukaan testing ke liye behtareen.
            </p>
          </button>

          {/* Option 3: Demo Mode */}
          <button
            type="button"
            disabled={loading}
            onClick={() => handleChangeMode('demo')}
            className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
              status.mode === 'demo'
                ? 'border-amber-600 bg-amber-50/50 shadow-sm ring-2 ring-amber-500/20'
                : 'border-stone-200 hover:border-amber-400 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full">
                🟡 Demo Mode
              </span>
              {status.mode === 'demo' && (
                <CheckCircle className="w-5 h-5 text-amber-600" />
              )}
            </div>
            <h4 className="font-bold text-sm text-stone-900">Sirf Demo Samples Dikhayein</h4>
            <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
              Sirf 8 curated Jaipur ethnic outfits dikhenge design preview karne ke liye.
            </p>
          </button>
        </div>
      </div>

      {/* SECTION 2: DATA CLEANUP & RESET ACTIONS */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
        <div>
          <h3 className="font-serif text-lg font-bold text-[#2B2320] flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-rose-600" />
            <span>2. Data Removal & Purge Controls</span>
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Ek click me demo data permanently delete karein ya poore store ko reset karein.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Action 1: Purge Demo Data */}
          <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/30 flex flex-col justify-between space-y-3">
            <div>
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-2">
                <Trash2 className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-stone-900">
                Purge All Demo Data
              </h4>
              <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
                Sabhi sample demo outfits aur demo orders ko permanently delete kar dega. Real products bache rahenge.
              </p>
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={handlePurgeDemo}
              className="w-full py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Demo Data Now</span>
            </button>
          </div>

          {/* Action 2: Factory Reset / Purge All Data */}
          <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/30 flex flex-col justify-between space-y-3">
            <div>
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mb-2">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-stone-900">
                Purge All (Factory Reset)
              </h4>
              <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
                Catalog ke saare kapde aur orders saaf kar dega taaki aap 100% fresh inventory se shuruwat kar sakein.
              </p>
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={() => setShowPurgeAllModal(true)}
              className="w-full py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Purge Everything (Reset)</span>
            </button>
          </div>

          {/* Action 3: Restore Demo Data */}
          <div className="p-4 rounded-2xl border border-stone-200 bg-[#FBF7F0] flex flex-col justify-between space-y-3">
            <div>
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-[#A87A2A] flex items-center justify-center mb-2">
                <RefreshCw className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-stone-900">
                Restore Curated Demo Catalog
              </h4>
              <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
                Agar aapne data delete kar diya tha aur dubara testing ya showcase ke liye 8 sample outfits chahiye, to restore karein.
              </p>
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={handleRestoreDemo}
              className="w-full py-2.5 px-3 rounded-xl bg-[#2B2320] hover:bg-[#A87A2A] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Restore Demo Outfits</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 3: OUTFITS INVENTORY (TAGGED AS LIVE OR DEMO) */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-serif text-lg font-bold text-[#2B2320] flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#A87A2A]" />
              <span>3. Manage Outfits (Live vs Demo Status)</span>
            </h3>
            <p className="text-xs text-stone-500">
              Yahan se aap kisi bhi product ko 'Live' ya 'Demo' me switch kar sakte hain.
            </p>
          </div>

          <div className="flex bg-stone-100 p-1 rounded-xl text-xs font-semibold self-start">
            <button
              type="button"
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterTab === 'all'
                  ? 'bg-white text-[#A87A2A] shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              All ({products.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('live')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterTab === 'live'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Live Real ({products.filter((p) => !(p.isDemo || p.id <= 8)).length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('demo')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterTab === 'demo'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Demo Samples ({products.filter((p) => p.isDemo || p.id <= 8).length})
            </button>
          </div>
        </div>

        {displayedProducts.length === 0 ? (
          <div className="py-12 text-center bg-stone-50 rounded-2xl border border-stone-200 p-6">
            <ShoppingBag className="w-10 h-10 text-stone-400 mx-auto mb-2" />
            <h4 className="font-bold text-sm text-stone-800">
              {filterTab === 'live'
                ? 'Abhi tak koi Live Real product add nahi kiya gaya hai.'
                : filterTab === 'demo'
                ? 'Koi Demo product maujood nahi hai.'
                : 'Catalog me koi product nahi hai.'}
            </h4>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              {filterTab === 'live'
                ? 'Admin Portal ke "Outfits" tab me jakar "Add Outfit" par click karein aur apna naya product live karein.'
                : 'Aap upar diye gaye button se "Restore Demo Outfits" kar sakte hain.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-stone-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] text-stone-600 uppercase tracking-wider text-[10px] font-bold border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Outfit</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Status Tag</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {displayedProducts.map((p) => {
                  const isDemo = p.isDemo || p.id <= 8;
                  const img = normalizeProductImageUrl(p.image);
                  return (
                    <tr key={p.id} className="hover:bg-amber-50/20 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={img}
                            alt={p.name}
                            className="w-10 h-12 object-cover rounded-lg bg-stone-100 shrink-0"
                          />
                          <div>
                            <span className="font-bold text-stone-900 block line-clamp-1">
                              {p.name}
                            </span>
                            <span className="text-[10px] text-stone-400">ID: #{p.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-stone-600">
                        {p.category}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#A87A2A]">
                        ₹{p.price}
                      </td>
                      <td className="py-3 px-4">
                        {isDemo ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300">
                            🟡 DEMO SAMPLE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                            🟢 LIVE REAL
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleProductDemo(p.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                            isDemo
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300'
                              : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-300'
                          }`}
                          title={isDemo ? 'Change to Live Product' : 'Mark as Demo Product'}
                        >
                          {isDemo ? 'Mark as Live' : 'Mark as Demo'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Factory Reset / Purge All */}
      {showPurgeAllModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="font-serif font-bold text-xl text-stone-900 text-center mb-1">
              Purge All Data (Factory Reset)?
            </h3>

            <p className="text-xs text-stone-600 text-center mb-4 leading-relaxed">
              Kya aap sach me poora catalog aur sabhi orders saaf karna chahte hain? Isse aapka store ekdum blank slate ho jayega taaki aap naye products add kar sakein.
            </p>

            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 mb-4 text-xs text-rose-800">
              Confirm karne ke liye niche <span className="font-bold uppercase tracking-wider">CONFIRM</span> likhein:
            </div>

            <input
              type="text"
              value={purgeConfirmText}
              placeholder="CONFIRM"
              onChange={(e) => setPurgeConfirmText(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm font-mono uppercase mb-4 text-center focus:outline-none focus:border-rose-600"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowPurgeAllModal(false);
                  setPurgeConfirmText('');
                }}
                className="flex-1 py-2.5 px-3 rounded-xl border border-stone-300 text-stone-700 font-semibold text-xs hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePurgeAll}
                disabled={purgeConfirmText.trim().toUpperCase() !== 'CONFIRM'}
                className={`flex-1 py-2.5 px-3 rounded-xl text-white font-bold text-xs transition-colors cursor-pointer shadow-sm ${
                  purgeConfirmText.trim().toUpperCase() === 'CONFIRM'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-stone-300 cursor-not-allowed text-stone-500'
                }`}
              >
                Haan, Purge All Karein
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
