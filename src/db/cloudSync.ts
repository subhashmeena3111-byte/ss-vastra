import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  Firestore,
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { localStore } from './localStore.ts';
import type { LocalProduct, LocalCategory, LocalBanner, LocalCoupon, LocalOrder } from './localStore.ts';

let dbInstance: Firestore | null = null;
let isInitialized = false;

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
  lastUpdated: number;
}

/**
 * Loads cloud data into localStore or seeds cloud data if empty
 */
export async function syncWithCloud(): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;

  try {
    const docRef = doc(db, 'app_sync', 'store_data');
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const cloudData = snap.data() as CloudStorePayload;
      if (Array.isArray(cloudData.products) && cloudData.products.length > 0) {
        // Hydrate localStore with cloud data
        const deletedIds: number[] = Array.isArray(cloudData.deletedProductIds)
          ? cloudData.deletedProductIds
          : [];
        const validProds = cloudData.products.filter((p) => !deletedIds.includes(p.id));

        localStore.getAllProducts().length; // ensure loaded
        (localStore as any).data.products = validProds;
        (localStore as any).data.deletedProductIds = deletedIds;

        if (Array.isArray(cloudData.categories) && cloudData.categories.length > 0) {
          (localStore as any).data.categories = cloudData.categories;
        }
        if (Array.isArray(cloudData.banners) && cloudData.banners.length > 0) {
          (localStore as any).data.banners = cloudData.banners;
        }
        if (Array.isArray(cloudData.coupons) && cloudData.coupons.length > 0) {
          (localStore as any).data.coupons = cloudData.coupons;
        }
        if (Array.isArray(cloudData.orders) && cloudData.orders.length > 0) {
          (localStore as any).data.orders = cloudData.orders;
        }
        if (cloudData.settings && Object.keys(cloudData.settings).length > 0) {
          (localStore as any).data.settings = cloudData.settings;
        }

        localStore.saveData();
      }
    } else {
      // First time initialization: Seed cloud with localStore current data
      await pushAllToCloud();
    }
    isInitialized = true;
  } catch (err: any) {
    console.warn('syncWithCloud non-blocking note:', err?.message || err);
  }
}

/**
 * Pushes entire localStore state to Firestore cloud
 */
export async function pushAllToCloud(): Promise<boolean> {
  const db = getFirestoreDb();
  if (!db) return false;

  try {
    const docRef = doc(db, 'app_sync', 'store_data');
    const payload: CloudStorePayload = {
      products: localStore.getAllProducts(),
      deletedProductIds: localStore.getDeletedProductIds(),
      categories: localStore.getAllCategories(),
      banners: localStore.getAllBanners(),
      coupons: localStore.getAllCoupons(),
      orders: localStore.getAllOrders(),
      settings: localStore.getAllSettings(),
      lastUpdated: Date.now(),
    };

    await setDoc(docRef, payload);
    return true;
  } catch (err: any) {
    console.warn('pushAllToCloud note:', err?.message || err);
    return false;
  }
}

// Background fire-and-forget sync helper
export function triggerCloudSave(): void {
  pushAllToCloud().catch(() => {});
}
