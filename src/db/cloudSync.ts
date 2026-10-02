import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  Firestore,
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { localStore } from './localStore.ts';
import type { LocalProduct, LocalCategory, LocalBanner, LocalCoupon, LocalOrder, LocalVideoReel } from './localStore.ts';

let dbInstance: Firestore | null = null;
let isInitialized = false;
let lastSyncTime = 0;
let isWriteQuotaExceeded = false;
let quotaExceededTime = 0;
const QUOTA_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour cooldown if quota hit
const SYNC_CACHE_MS = 2500; // Cache cloud read for 2.5s to keep response under 100ms

function getFirebaseConfig(): any {
  try {
    const p = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf-8'));
    }
  } catch {}
  return {
    projectId: 'gen-lang-client-0444416198',
    appId: '1:912531479443:web:feea1f43d288063f4ce666',
    apiKey: 'AIzaSyAKtTzN_uSabp6gaYZoSkhSAGKXc59FNC4',
    authDomain: 'gen-lang-client-0444416198.firebaseapp.com',
    firestoreDatabaseId: 'ai-studio-ssvastraladiesfa-d140d88b-63fc-4cef-b645-1ddbb7ada6ad',
  };
}

export function getFirestoreDb(): Firestore | null {
  if (dbInstance) return dbInstance;
  try {
    const config = getFirebaseConfig();
    const app = getApps().length === 0 ? initializeApp(config) : getApp();
    const dbId =
      config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)'
        ? config.firestoreDatabaseId
        : '';
    dbInstance = dbId ? getFirestore(app, dbId) : getFirestore(app);
    return dbInstance;
  } catch (err) {
    console.warn('Firebase Firestore initialization note:', err);
    return null;
  }
}

export interface CloudStorePayload {
  products: LocalProduct[];
  deletedProductIds: number[];
  categories: LocalCategory[];
  banners: LocalBanner[];
  coupons: LocalCoupon[];
  orders: LocalOrder[];
  settings: Record<string, string>;
  videoReels?: LocalVideoReel[];
  lastUpdated: number;
}

/**
 * Loads cloud data into localStore or seeds cloud data if empty
 */
export async function syncWithCloud(force = false): Promise<void> {
  const now = Date.now();
  if (!force && isInitialized && now - lastSyncTime < SYNC_CACHE_MS) {
    return;
  }

  const db = getFirestoreDb();
  if (!db) return;

  try {
    const docRef = doc(db, 'app_sync', 'store_data');
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const cloudData = snap.data() as CloudStorePayload;
      
      // Permanent demo cleanup: IDs 1-8 are demo and must be permanently excluded
      const permanentDemoIds = [1, 2, 3, 4, 5, 6, 7, 8];
      let deletedIds: number[] = Array.isArray(cloudData.deletedProductIds)
        ? cloudData.deletedProductIds.filter((id) => id <= 8 || id > 12)
        : [];
      permanentDemoIds.forEach((id) => {
        if (!deletedIds.includes(id)) deletedIds.push(id);
      });

      let validProds: LocalProduct[] = [];
      if (Array.isArray(cloudData.products)) {
        validProds = cloudData.products.filter(
          (p) => p && p.id > 8 && !p.isDemo && !deletedIds.includes(p.id)
        );
      }

      // If cloud has zero valid products, populate with local store products and update cloud!
      if (validProds.length === 0) {
        validProds = localStore.getAllProducts().filter((p) => p.id > 8 && !p.isDemo);
        (localStore as any).data.products = validProds;
        (localStore as any).data.deletedProductIds = deletedIds;
        localStore.saveData();
        await pushAllToCloud();
      } else {
        (localStore as any).data.products = validProds;
        (localStore as any).data.deletedProductIds = deletedIds;

        if (Array.isArray(cloudData.categories) && cloudData.categories.length > 0) {
          (localStore as any).data.categories = cloudData.categories;
        }
        if (Array.isArray(cloudData.banners)) {
          (localStore as any).data.banners = cloudData.banners;
        }
        if (Array.isArray(cloudData.coupons) && cloudData.coupons.length > 0) {
          (localStore as any).data.coupons = cloudData.coupons;
        }
        if (Array.isArray(cloudData.orders)) {
          (localStore as any).data.orders = cloudData.orders.filter(
            (o) => !o.isDemo && !o.orderNumber?.startsWith('SSV-DEMO')
          );
        }
        if (cloudData.settings && Object.keys(cloudData.settings).length > 0) {
          (localStore as any).data.settings = cloudData.settings;
        }
        if (Array.isArray(cloudData.videoReels) && cloudData.videoReels.length > 0) {
          (localStore as any).data.videoReels = cloudData.videoReels;
        }

        localStore.saveData();
      }
    } else {
      // First time initialization: Seed cloud with localStore current data
      await pushAllToCloud();
    }
    isInitialized = true;
    lastSyncTime = Date.now();
  } catch (err: any) {
    console.warn('syncWithCloud non-blocking note:', err?.message || err);
  }
}

/**
 * Pushes entire localStore state to Firestore cloud safely
 */
export async function pushAllToCloud(): Promise<boolean> {
  // If write quota was recently exceeded, skip cloud writes during cooldown
  if (isWriteQuotaExceeded && Date.now() - quotaExceededTime < QUOTA_COOLDOWN_MS) {
    return false;
  }

  const db = getFirestoreDb();
  if (!db) return false;

  try {
    const docRef = doc(db, 'app_sync', 'store_data');
    const prods = localStore.getAllProducts();
    const deletedIds = localStore.getDeletedProductIds();
    const banners = localStore.getAllBanners();
    const categories = localStore.getAllCategories();
    const coupons = localStore.getAllCoupons();
    const orders = localStore.getAllOrders();
    const settings = localStore.getAllSettings();
    const videoReels = localStore.getVideoReels();

    // Safeguard image payloads: extract large dataUrls into uploaded_images collection
    const cleanProds = await Promise.all(
      prods.map(async (p) => {
        if (p.image && typeof p.image === 'string' && p.image.startsWith('data:image/')) {
          const matches = p.image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            const fileName = `prod_${p.id || Date.now()}.jpg`;
            try {
              await setDoc(doc(db, 'uploaded_images', fileName), {
                fileName,
                mimeType: matches[1],
                data: matches[2],
                createdAt: Date.now(),
              });
              return { ...p, image: `/api/uploads/${fileName}` };
            } catch (err: any) {
              if (String(err?.message || '').toLowerCase().includes('quota') || String(err?.code || '').includes('resource-exhausted')) {
                isWriteQuotaExceeded = true;
                quotaExceededTime = Date.now();
              }
            }
          }
        }
        return p;
      })
    );

    const cleanBanners = await Promise.all(
      banners.map(async (b) => {
        if (b.imageUrl && typeof b.imageUrl === 'string' && b.imageUrl.startsWith('data:image/')) {
          const matches = b.imageUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            const fileName = `banner_${b.id || Date.now()}.jpg`;
            try {
              await setDoc(doc(db, 'uploaded_images', fileName), {
                fileName,
                mimeType: matches[1],
                data: matches[2],
                createdAt: Date.now(),
              });
              return { ...b, imageUrl: `/api/uploads/${fileName}` };
            } catch (err: any) {
              if (String(err?.message || '').toLowerCase().includes('quota') || String(err?.code || '').includes('resource-exhausted')) {
                isWriteQuotaExceeded = true;
                quotaExceededTime = Date.now();
              }
            }
          }
        }
        return b;
      })
    );

    const payload: CloudStorePayload = {
      products: cleanProds,
      deletedProductIds: deletedIds,
      categories,
      banners: cleanBanners,
      coupons,
      orders,
      settings,
      videoReels,
      lastUpdated: Date.now(),
    };

    // Save consolidated sync document in Firestore
    await setDoc(docRef, payload);
    lastSyncTime = Date.now();
    isInitialized = true;
    isWriteQuotaExceeded = false;
    return true;
  } catch (err: any) {
    const msg = String(err?.message || err);
    if (msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('resource-exhausted') || err?.code === 'resource-exhausted') {
      isWriteQuotaExceeded = true;
      quotaExceededTime = Date.now();
      console.warn('Firestore write quota exceeded; localStore persistence active.');
    } else {
      console.warn('pushAllToCloud note:', msg);
    }
    return false;
  }
}

// Background fire-and-forget sync helper
export function triggerCloudSave(): void {
  pushAllToCloud().catch(() => {});
}
