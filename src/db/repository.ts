import { db, isDbReady, markDbOffline } from './index.ts';
import {
  admins,
  categories,
  products,
  productImages,
  orders,
  orderItems,
  shipments,
  coupons,
  banners,
  activityLogs,
  settings,
  customers,
  reviews,
} from './schema.ts';
import { eq, desc, asc, and, or, sql } from 'drizzle-orm';
import { localStore } from './localStore.ts';
import type { LocalCategory, LocalOrder, LocalAdmin, LocalCoupon, LocalBanner, LocalProduct } from './localStore.ts';
import { triggerCloudSave } from './cloudSync.ts';

// 1. Settings
export async function getSettingsMap(): Promise<Record<string, string>> {
  if (await isDbReady()) {
    try {
      const allSettings = await db.select().from(settings);
      if (allSettings && allSettings.length > 0) {
        const map: Record<string, string> = {};
        for (const s of allSettings) {
          map[s.key] = s.value;
        }
        return map;
      }
    } catch {
      markDbOffline();
    }
  }
  return localStore.getSettings();
}

export async function saveSetting(key: string, value: string) {
  localStore.updateSetting(key, value);
  triggerCloudSave();
  if (await isDbReady()) {
    try {
      await db
        .insert(settings)
        .values({ key, value })
        .onConflictDoUpdate({
          target: settings.key,
          set: { value },
        });
    } catch {
      markDbOffline();
    }
  }
}

// 2. Categories
export async function getCategoriesList(): Promise<LocalCategory[]> {
  if (await isDbReady()) {
    try {
      const list = await db
        .select()
        .from(categories)
        .orderBy(asc(categories.displayOrder));
      if (list && list.length > 0) {
        return list as LocalCategory[];
      }
    } catch {
      markDbOffline();
    }
  }
  return localStore.getCategories();
}

export async function updateCategoryRecord(id: number, updates: Partial<LocalCategory>) {
  localStore.updateCategory(id, updates);
  triggerCloudSave();
  if (await isDbReady()) {
    try {
      await db.update(categories).set(updates).where(eq(categories.id, id));
    } catch {
      markDbOffline();
    }
  }
}

// 3. Products
export function formatProductRecord(p: any, galleryImages?: string[]) {
  if (!p) return null;
  let sizes = p.sizes;
  if (typeof sizes === 'string') {
    try {
      sizes = JSON.parse(sizes);
    } catch {
      sizes = sizes.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
  }
  if (!Array.isArray(sizes) || sizes.length === 0) sizes = ['S', 'M', 'L', 'XL'];

  let highlights = p.highlights;
  if (typeof highlights === 'string') {
    try {
      highlights = JSON.parse(highlights);
    } catch {
      highlights = highlights.split(',').map((h: string) => h.trim()).filter(Boolean);
    }
  }
  if (!Array.isArray(highlights)) highlights = [];

  const gallery = Array.isArray(galleryImages) && galleryImages.length > 0
    ? galleryImages
    : Array.isArray(p.gallery) && p.gallery.length > 0
    ? p.gallery
    : Array.isArray(p.images) && p.images.length > 0
    ? p.images
    : [p.image || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'];

  return {
    ...p,
    sizes,
    highlights,
    gallery,
  };
}

export async function getProductsList(filters?: {
  category?: string;
  search?: string;
  featured?: string | boolean;
  newArrival?: string | boolean;
  bestSeller?: string | boolean;
}) {
  if (await isDbReady()) {
    try {
      const allProducts = await db
        .select()
        .from(products)
        .where(eq(products.isActive, true))
        .orderBy(desc(products.id));

      if (allProducts && allProducts.length > 0) {
        const allImages = await db
          .select()
          .from(productImages)
          .orderBy(asc(productImages.displayOrder));

        const mapped = allProducts.map((p) => {
          const pImgs = allImages.filter((img) => img.productId === p.id).map((i) => i.imageUrl);
          return formatProductRecord(p, pImgs);
        });

        let filtered = mapped;
        if (filters?.category && filters.category !== 'All Products') {
          filtered = filtered.filter(
            (p) => p.category.toLowerCase() === String(filters.category).toLowerCase()
          );
        }
        if (filters?.search && String(filters.search).trim() !== '') {
          const q = String(filters.search).toLowerCase();
          filtered = filtered.filter(
            (p) =>
              p.name.toLowerCase().includes(q) ||
              p.category.toLowerCase().includes(q) ||
              (p.fabric && p.fabric.toLowerCase().includes(q))
          );
        }
        if (filters?.featured === 'true' || filters?.featured === true) {
          filtered = filtered.filter((p) => p.isFeatured);
        }
        if (filters?.newArrival === 'true' || filters?.newArrival === true) {
          filtered = filtered.filter((p) => p.isNewArrival);
        }
        if (filters?.bestSeller === 'true' || filters?.bestSeller === true) {
          filtered = filtered.filter((p) => p.isBestSeller);
        }

        return filtered;
      }
    } catch {
      markDbOffline();
    }
  }

  // Fallback to local store
  const localList = localStore.getProducts({
    category: filters?.category,
    search: filters?.search,
    featured: filters?.featured === 'true' || filters?.featured === true,
    newArrival: filters?.newArrival === 'true' || filters?.newArrival === true,
    bestSeller: filters?.bestSeller === 'true' || filters?.bestSeller === true,
  });

  return localList.map((p) => formatProductRecord(p, p.images));
}

export async function getAllProductsAdminList() {
  if (await isDbReady()) {
    try {
      const allProducts = await db.select().from(products).orderBy(desc(products.id));
      if (allProducts && allProducts.length > 0) {
        const allImages = await db.select().from(productImages).orderBy(asc(productImages.displayOrder));
        return allProducts.map((p) => {
          const pImgs = allImages.filter((img) => img.productId === p.id).map((i) => i.imageUrl);
          return formatProductRecord(p, pImgs);
        });
      }
    } catch {
      markDbOffline();
    }
  }

  return localStore.getAllProductsAdmin().map((p) => formatProductRecord(p, p.images));
}

export async function getSingleProductById(id: number) {
  if (await isDbReady()) {
    try {
      const prodList = await db.select().from(products).where(eq(products.id, id));
      if (prodList && prodList.length > 0) {
        const prod = prodList[0];
        const imgs = await db
          .select()
          .from(productImages)
          .where(eq(productImages.productId, prod.id))
          .orderBy(asc(productImages.displayOrder));

        return formatProductRecord(prod, imgs.map((i) => i.imageUrl));
      }
    } catch {
      markDbOffline();
    }
  }

  const p = localStore.getProductById(id);
  if (!p) return null;
  return formatProductRecord(p, p.images);
}

export async function createProductRecord(productData: any, extraImages: string[] = []) {
  const createdLocal = localStore.createProduct({
    ...productData,
    images: [productData.image, ...extraImages],
  });
  triggerCloudSave();

  if (await isDbReady()) {
    try {
      const inserted = await db.insert(products).values(productData).returning();
      const prodId = inserted[0].id;
      await db.insert(productImages).values({
        productId: prodId,
        imageUrl: productData.image,
        displayOrder: 0,
        isMain: true,
      });
      for (let i = 0; i < extraImages.length; i++) {
        await db.insert(productImages).values({
          productId: prodId,
          imageUrl: extraImages[i],
          displayOrder: i + 1,
          isMain: false,
        });
      }
      return formatProductRecord({
        ...inserted[0],
        gallery: [productData.image, ...extraImages],
      });
    } catch {
      markDbOffline();
    }
  }
  return formatProductRecord(createdLocal);
}

export async function updateProductRecord(id: number, updates: any) {
  const images = Array.isArray(updates.images)
    ? updates.images
    : Array.isArray(updates.gallery)
    ? updates.gallery
    : updates.image
    ? [updates.image, ...(Array.isArray(updates.extraImages) ? updates.extraImages : [])]
    : undefined;

  const localUpdates = { ...updates };
  if (images) {
    localUpdates.images = images;
    localUpdates.gallery = images;
  }
  delete localUpdates.extraImages;

  localStore.updateProduct(id, localUpdates);
  triggerCloudSave();

  if (await isDbReady()) {
    try {
      const dbUpdates: any = { ...updates };
      delete dbUpdates.extraImages;
      delete dbUpdates.gallery;
      delete dbUpdates.images;

      if (Object.keys(dbUpdates).length > 0) {
        await db.update(products).set(dbUpdates).where(eq(products.id, id));
      }

      if (images && images.length > 0) {
        await db.delete(productImages).where(eq(productImages.productId, id));
        for (let i = 0; i < images.length; i++) {
          await db.insert(productImages).values({
            productId: id,
            imageUrl: images[i],
            displayOrder: i,
            isMain: i === 0,
          });
        }
      }
    } catch {
      markDbOffline();
    }
  }
  return formatProductRecord(localStore.getProductById(id));
}

export async function deleteProductRecord(id: number) {
  localStore.deleteProduct(id);
  triggerCloudSave();
  if (await isDbReady()) {
    try {
      await db.delete(productImages).where(eq(productImages.productId, id));
      await db.delete(products).where(eq(products.id, id));
    } catch {
      markDbOffline();
    }
  }
  return true;
}

// 4. Banners
export async function getBannersList(): Promise<LocalBanner[]> {
  if (await isDbReady()) {
    try {
      const list = await db
        .select()
        .from(banners)
        .where(eq(banners.isActive, true))
        .orderBy(asc(banners.displayOrder));
      if (list && list.length > 0) return list as LocalBanner[];
    } catch {
      markDbOffline();
    }
  }
  return localStore.getBanners();
}

export async function getAllBannersList(): Promise<LocalBanner[]> {
  if (await isDbReady()) {
    try {
      const list = await db
        .select()
        .from(banners)
        .orderBy(asc(banners.displayOrder));
      if (list && list.length > 0) return list as LocalBanner[];
    } catch {
      markDbOffline();
    }
  }
  return localStore.getBanners();
}

export async function createBannerRecord(bannerData: Omit<LocalBanner, 'id'>): Promise<LocalBanner> {
  const local = localStore.createBanner(bannerData);
  triggerCloudSave();
  if (await isDbReady()) {
    try {
      const inserted = await db.insert(banners).values(bannerData).returning();
      if (inserted && inserted.length > 0) return inserted[0] as LocalBanner;
    } catch {
      markDbOffline();
    }
  }
  return local;
}

export async function deleteBannerRecord(id: number): Promise<boolean> {
  localStore.deleteBanner(id);
  triggerCloudSave();
  if (await isDbReady()) {
    try {
      await db.delete(banners).where(eq(banners.id, id));
    } catch {
      markDbOffline();
    }
  }
  return true;
}

// 5. Coupons
export async function getCouponsList(): Promise<LocalCoupon[]> {
  if (await isDbReady()) {
    try {
      const list = await db.select().from(coupons);
      if (list && list.length > 0) return list as LocalCoupon[];
    } catch {
      markDbOffline();
    }
  }
  return localStore.getCoupons();
}

export async function findCouponByCode(code: string): Promise<LocalCoupon | null> {
  const norm = String(code).toUpperCase().trim();
  if (await isDbReady()) {
    try {
      const found = await db
        .select()
        .from(coupons)
        .where(and(eq(coupons.code, norm), eq(coupons.isActive, true)));
      if (found && found.length > 0) return found[0] as LocalCoupon;
    } catch {
      markDbOffline();
    }
  }
  const all = localStore.getCoupons();
  return all.find((c) => c.code.toUpperCase().trim() === norm && c.isActive) || null;
}

export async function createCouponRecord(coupon: Omit<LocalCoupon, 'id'>) {
  const c = localStore.createCoupon(coupon);
  triggerCloudSave();
  if (await isDbReady()) {
    try {
      await db.insert(coupons).values(coupon);
    } catch {
      markDbOffline();
    }
  }
  return c;
}

export async function updateCouponRecord(id: number, updates: Partial<LocalCoupon>) {
  localStore.updateCoupon(id, updates);
  triggerCloudSave();
  if (await isDbReady()) {
    try {
      await db.update(coupons).set(updates).where(eq(coupons.id, id));
    } catch {
      markDbOffline();
    }
  }
}

export async function deleteCouponRecord(id: number) {
  localStore.deleteCoupon(id);
  triggerCloudSave();
  if (await isDbReady()) {
    try {
      await db.delete(coupons).where(eq(coupons.id, id));
    } catch {
      markDbOffline();
    }
  }
}

// 6. Orders
export async function getOrdersList(): Promise<LocalOrder[]> {
  const localList = localStore.getOrders() || [];
  let dbMappedList: LocalOrder[] = [];

  if (await isDbReady()) {
    try {
      const list = await db.select().from(orders).orderBy(desc(orders.id));
      if (list && list.length > 0) {
        const allItems = await db.select().from(orderItems);
        const allShipments = await db.select().from(shipments);

        dbMappedList = list.map((o) => {
          const items = allItems.filter((i) => i.orderId === o.id);
          const shipment = allShipments.find((s) => s.orderId === o.id);
          const mappedOrder: LocalOrder = {
            id: o.id,
            orderNumber: o.orderNumber,
            userId: o.userId ? String(o.userId) : null,
            customerName: o.customerName,
            customerEmail: o.customerEmail || '',
            customerPhone: o.customerPhone,
            shippingAddress: o.shippingAddress,
            city: o.city,
            state: o.state,
            pincode: o.pincode,
            totalAmount: o.totalAmount,
            discountAmount: o.discountAmount,
            couponCode: o.couponCode,
            paymentMethod: o.paymentMethod,
            paymentStatus: o.paymentStatus,
            status: o.orderStatus,
            orderStatus: o.orderStatus,
            notes: o.notes,
            createdAt: o.createdAt ? o.createdAt.toISOString() : new Date().toISOString(),
            items: items.map((i) => ({
              id: i.id,
              productId: i.productId || undefined,
              productName: i.productName,
              productImage: i.productImage || undefined,
              size: i.size,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              totalPrice: i.totalPrice,
            })),
            shipment: shipment
              ? {
                  id: shipment.id,
                  courierPartner: shipment.courierName || undefined,
                  trackingNumber: shipment.trackingNumber || undefined,
                  trackingUrl: shipment.trackingUrl || undefined,
                  estimatedDelivery: shipment.estimatedDelivery || undefined,
                  statusUpdates: (() => {
                    if (!shipment.statusUpdates) return [];
                    if (Array.isArray(shipment.statusUpdates)) return shipment.statusUpdates;
                    try {
                      const parsed = JSON.parse(shipment.statusUpdates);
                      return Array.isArray(parsed) ? parsed : [];
                    } catch {
                      return [];
                    }
                  })(),
                  events: (() => {
                    if (!shipment.statusUpdates) return [];
                    if (Array.isArray(shipment.statusUpdates)) return shipment.statusUpdates;
                    try {
                      const parsed = JSON.parse(shipment.statusUpdates);
                      return Array.isArray(parsed) ? parsed : [];
                    } catch {
                      return [];
                    }
                  })(),
                }
              : undefined,
          };
          return mappedOrder;
        });
      }
    } catch {
      markDbOffline();
    }
  }

  const combined = [...dbMappedList];
  for (const lo of localList) {
    const exists = combined.some(
      (c) =>
        (c.orderNumber && lo.orderNumber && c.orderNumber.toUpperCase() === lo.orderNumber.toUpperCase()) ||
        (c.id && lo.id && c.id === lo.id)
    );
    if (!exists) {
      combined.push(lo);
    }
  }

  return combined.sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
}

export async function getOrderByNumber(orderNumber: string) {
  const normNumber = String(orderNumber || '').trim().toUpperCase().replace(/^#/, '');
  if (await isDbReady()) {
    try {
      const found = await db.select().from(orders).where(eq(orders.orderNumber, normNumber));
      if (found && found.length > 0) {
        const o = found[0];
        const items = await db.select().from(orderItems).where(eq(orderItems.orderId, o.id));
        const shipmentList = await db.select().from(shipments).where(eq(shipments.orderId, o.id));
        const s = shipmentList[0] || null;
        let parsedUpdates: any[] = [];
        if (s && s.statusUpdates) {
          try {
            parsedUpdates = typeof s.statusUpdates === 'string' ? JSON.parse(s.statusUpdates) : s.statusUpdates;
          } catch {
            parsedUpdates = [];
          }
        }
        return {
          ...o,
          status: o.orderStatus,
          orderStatus: o.orderStatus,
          items,
          shipment: s ? {
            ...s,
            courierPartner: s.courierName,
            statusUpdates: Array.isArray(parsedUpdates) ? parsedUpdates : [],
            events: Array.isArray(parsedUpdates) ? parsedUpdates : [],
          } : null,
        };
      }
    } catch {
      markDbOffline();
    }
  }
  const fromLocal = localStore.getOrderByNumber(normNumber);
  if (fromLocal) return fromLocal;

  const all = localStore.getOrders();
  return all.find((o) => (o.orderNumber || '').trim().toUpperCase().replace(/^#/, '') === normNumber) || null;
}

export async function createOrderRecord(
  orderData: any,
  verifiedItems: any[],
  initialShipment?: any
) {
  const localOrder = localStore.createOrder({
    ...orderData,
    items: verifiedItems,
    shipment: initialShipment,
  });
  triggerCloudSave();

  if (await isDbReady()) {
    try {
      const inserted = await db.insert(orders).values(orderData).returning();
      const orderId = inserted[0].id;

      for (const item of verifiedItems) {
        await db.insert(orderItems).values({
          orderId,
          productId: item.productId,
          productName: item.productName,
          productImage: item.productImage,
          size: item.size,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        });
      }

      if (initialShipment) {
        await db.insert(shipments).values({
          orderId,
          courierName: initialShipment.courierPartner || initialShipment.courierName || 'Delhivery Express',
          trackingNumber: initialShipment.trackingNumber || `DEL${Date.now()}`,
          trackingUrl: initialShipment.trackingUrl,
          estimatedDelivery: initialShipment.estimatedDelivery,
        });
      }

      return inserted[0];
    } catch {
      markDbOffline();
    }
  }
  return localOrder;
}

export async function updateOrderStatus(orderId: number, status: string, paymentStatus?: string) {
  const updates: any = { status, orderStatus: status };
  if (paymentStatus) updates.paymentStatus = paymentStatus;
  localStore.updateOrder(orderId, updates);
  triggerCloudSave();
  if (await isDbReady()) {
    try {
      await db.update(orders).set({ orderStatus: status, ...(paymentStatus ? { paymentStatus } : {}) }).where(eq(orders.id, orderId));
    } catch {
      markDbOffline();
    }
  }
}

export async function updateOrderRecord(orderId: number, updates: any) {
  const localUpdated = localStore.updateOrder(orderId, updates);
  triggerCloudSave();
  if (await isDbReady()) {
    try {
      const dbUpdates: any = {};
      if (updates.customerName !== undefined) dbUpdates.customerName = updates.customerName;
      if (updates.customerPhone !== undefined) dbUpdates.customerPhone = updates.customerPhone;
      if (updates.customerEmail !== undefined) dbUpdates.customerEmail = updates.customerEmail;
      if (updates.shippingAddress !== undefined) dbUpdates.shippingAddress = updates.shippingAddress;
      if (updates.city !== undefined) dbUpdates.city = updates.city;
      if (updates.state !== undefined) dbUpdates.state = updates.state;
      if (updates.pincode !== undefined) dbUpdates.pincode = updates.pincode;
      if (updates.totalAmount !== undefined) dbUpdates.totalAmount = updates.totalAmount;
      if (updates.discountAmount !== undefined) dbUpdates.discountAmount = updates.discountAmount;
      if (updates.couponCode !== undefined) dbUpdates.couponCode = updates.couponCode;
      if (updates.paymentMethod !== undefined) dbUpdates.paymentMethod = updates.paymentMethod;
      if (updates.paymentStatus !== undefined) dbUpdates.paymentStatus = updates.paymentStatus;
      if (updates.orderStatus !== undefined) dbUpdates.orderStatus = updates.orderStatus;
      if (updates.status !== undefined && !updates.orderStatus) dbUpdates.orderStatus = updates.status;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      dbUpdates.updatedAt = new Date();

      if (Object.keys(dbUpdates).length > 0) {
        await db.update(orders).set(dbUpdates).where(eq(orders.id, orderId));
      }
    } catch {
      markDbOffline();
    }
  }
  return localUpdated;
}

export async function deleteOrderRecord(orderId: number): Promise<boolean> {
  localStore.deleteOrder(orderId);
  triggerCloudSave();
  if (await isDbReady()) {
    try {
      await db.delete(orderItems).where(eq(orderItems.orderId, orderId));
      await db.delete(shipments).where(eq(shipments.orderId, orderId));
      await db.delete(orders).where(eq(orders.id, orderId));
    } catch {
      markDbOffline();
    }
  }
  return true;
}

export async function updateOrderShipmentRecord(orderId: number, shipmentUpdates: any) {
  const currentOrder = localStore.getOrderById(orderId);
  const existingShipment = currentOrder?.shipment || {};
  const currentEvents = Array.isArray(existingShipment.events) ? [...existingShipment.events] : [];

  if (shipmentUpdates.newEvent) {
    currentEvents.push({
      status: shipmentUpdates.newEvent.status || 'Updated',
      description: shipmentUpdates.newEvent.description || shipmentUpdates.newEvent.note || '',
      location: shipmentUpdates.newEvent.location || 'Sanganer, Jaipur Hub',
      timestamp: new Date().toISOString(),
    });
  }

  const mergedShipment = {
    ...existingShipment,
    courierPartner: shipmentUpdates.courierPartner || shipmentUpdates.courierName || existingShipment.courierPartner,
    trackingNumber: shipmentUpdates.trackingNumber || existingShipment.trackingNumber,
    trackingUrl: shipmentUpdates.trackingUrl !== undefined ? shipmentUpdates.trackingUrl : existingShipment.trackingUrl,
    estimatedDelivery: shipmentUpdates.estimatedDelivery !== undefined ? shipmentUpdates.estimatedDelivery : existingShipment.estimatedDelivery,
    events: currentEvents,
  };

  const nextStatus = shipmentUpdates.status || shipmentUpdates.orderStatus || currentOrder?.orderStatus || 'Shipped';

  localStore.updateOrder(orderId, {
    shipment: mergedShipment,
    orderStatus: nextStatus,
    status: nextStatus,
  });
  triggerCloudSave();

  if (await isDbReady()) {
    try {
      const existing = await db.select().from(shipments).where(eq(shipments.orderId, orderId));
      if (existing.length > 0) {
        await db.update(shipments).set({
          courierName: mergedShipment.courierPartner || 'Delhivery Express',
          trackingNumber: mergedShipment.trackingNumber,
          trackingUrl: mergedShipment.trackingUrl,
          estimatedDelivery: mergedShipment.estimatedDelivery,
          currentStatus: nextStatus,
          statusUpdates: JSON.stringify(currentEvents),
          updatedAt: new Date(),
        }).where(eq(shipments.orderId, orderId));
      } else {
        await db.insert(shipments).values({
          orderId,
          courierName: mergedShipment.courierPartner || 'Delhivery Express',
          trackingNumber: mergedShipment.trackingNumber || `DEL${Date.now()}`,
          trackingUrl: mergedShipment.trackingUrl,
          estimatedDelivery: mergedShipment.estimatedDelivery,
          currentStatus: nextStatus,
          statusUpdates: JSON.stringify(currentEvents),
        });
      }

      await db.update(orders).set({ orderStatus: nextStatus, updatedAt: new Date() }).where(eq(orders.id, orderId));
    } catch {
      markDbOffline();
    }
  }
  return localStore.getOrderById(orderId);
}

export async function deleteOrderShipmentRecord(orderId: number): Promise<boolean> {
  localStore.updateOrder(orderId, { shipment: undefined });
  triggerCloudSave();
  if (await isDbReady()) {
    try {
      await db.delete(shipments).where(eq(shipments.orderId, orderId));
    } catch {
      markDbOffline();
    }
  }
  return true;
}

// 7. Admins
export async function getAdminByLoginIdentifier(loginIdentifier: string): Promise<LocalAdmin | null> {
  const norm = loginIdentifier.toLowerCase().trim();
  if (await isDbReady()) {
    try {
      const existing = await db
        .select()
        .from(admins)
        .where(
          or(
            eq(admins.email, norm),
            eq(admins.adminId, norm),
            norm === 'admin' ? eq(admins.id, 1) : sql`false`,
            norm === '1000' ? eq(admins.id, 1) : sql`false`,
            norm === 'subhashmeena3111@gmail.com' ? eq(admins.id, 1) : sql`false`
          )
        );
      if (existing && existing.length > 0) {
        const a = existing[0];
        return {
          ...a,
          createdAt: a.createdAt ? a.createdAt.toISOString() : new Date().toISOString(),
        } as unknown as LocalAdmin;
      }
    } catch {
      markDbOffline();
    }
  }
  return localStore.getAdminByEmail(norm);
}

export async function getAdminById(id: number): Promise<LocalAdmin | null> {
  if (await isDbReady()) {
    try {
      const existing = await db
        .select()
        .from(admins)
        .where(eq(admins.id, id));
      if (existing && existing.length > 0) {
        const a = existing[0];
        return {
          ...a,
          createdAt: a.createdAt ? a.createdAt.toISOString() : new Date().toISOString(),
        } as unknown as LocalAdmin;
      }
    } catch {
      markDbOffline();
    }
  }
  return localStore.getAdminById(id);
}

export async function getAdminsList(): Promise<LocalAdmin[]> {
  if (await isDbReady()) {
    try {
      const list = await db.select().from(admins);
      if (list && list.length > 0) {
        return list.map((a) => ({
          ...a,
          createdAt: a.createdAt ? a.createdAt.toISOString() : new Date().toISOString(),
        })) as unknown as LocalAdmin[];
      }
    } catch {
      markDbOffline();
    }
  }
  return localStore.getAdmins();
}

export async function createAdminRecord(adminData: any) {
  const a = localStore.createAdmin(adminData);
  if (await isDbReady()) {
    try {
      await db.insert(admins).values(adminData);
    } catch {
      markDbOffline();
    }
  }
  return a;
}

export async function updateAdminRecord(id: number, updates: any) {
  localStore.updateAdmin(id, updates);
  if (await isDbReady()) {
    try {
      await db.update(admins).set(updates).where(eq(admins.id, id));
    } catch {
      markDbOffline();
    }
  }
}

// 8. Activity Logs
export async function logActivityRecord(
  adminId: string,
  adminName: string,
  action: string,
  entity: string,
  entityId?: string,
  details?: Record<string, unknown>,
  ipAddress?: string,
  userEmail?: string
) {
  localStore.addActivityLog({
    adminId,
    adminName,
    action,
    entity,
    entityId: entityId ? String(entityId) : undefined,
    details: details ? JSON.stringify(details) : undefined,
    ipAddress,
    userEmail,
  });

  if (await isDbReady()) {
    try {
      await db.insert(activityLogs).values({
        adminId,
        adminName,
        userEmail: userEmail || (adminId && adminId.includes('@') ? adminId : null),
        action,
        entity,
        entityId: entityId ? String(entityId) : null,
        ipAddress: ipAddress || null,
        details: details ? JSON.stringify(details) : null,
      });
    } catch {
      markDbOffline();
    }
  }
}

export async function getActivityLogsList() {
  if (await isDbReady()) {
    try {
      const logs = await db.select().from(activityLogs).orderBy(desc(activityLogs.id)).limit(100);
      if (logs && logs.length > 0) return logs;
    } catch {
      markDbOffline();
    }
  }
  return localStore.getActivityLogs();
}

// 9. Customers
export async function getCustomersList() {
  if (await isDbReady()) {
    try {
      const allCustomers = await db.select().from(customers).orderBy(desc(customers.id));
      if (allCustomers && allCustomers.length > 0) return allCustomers;
    } catch {
      markDbOffline();
    }
  }
  return localStore.getCustomers();
}

export async function upsertCustomerRecord(customerData: {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  orderAmount?: number;
}) {
  const normPhone = customerData.phone.replace(/[^0-9]/g, '');
  if (await isDbReady()) {
    try {
      const existing = await db.select().from(customers).where(eq(customers.phone, normPhone));
      if (existing.length > 0) {
        const c = existing[0];
        const updated = await db
          .update(customers)
          .set({
            name: customerData.name || c.name,
            email: customerData.email || c.email,
            address: customerData.address || c.address,
            city: customerData.city || c.city,
            state: customerData.state || c.state,
            pincode: customerData.pincode || c.pincode,
            totalOrders: (c.totalOrders || 0) + 1,
            totalSpent: (c.totalSpent || 0) + (customerData.orderAmount || 0),
            updatedAt: new Date(),
          })
          .where(eq(customers.id, c.id))
          .returning();
        return updated[0];
      } else {
        const inserted = await db
          .insert(customers)
          .values({
            name: customerData.name,
            phone: normPhone,
            email: customerData.email || null,
            address: customerData.address || null,
            city: customerData.city || 'Jaipur',
            state: customerData.state || 'Rajasthan',
            pincode: customerData.pincode || '303905',
            totalOrders: 1,
            totalSpent: customerData.orderAmount || 0,
          })
          .returning();
        return inserted[0];
      }
    } catch {
      markDbOffline();
    }
  }
  return localStore.upsertCustomer(customerData);
}

// 10. Reviews
export async function getReviewsList(productId?: number) {
  if (await isDbReady()) {
    try {
      const query = db.select().from(reviews).where(eq(reviews.isApproved, true)).orderBy(desc(reviews.id));
      const res = await query;
      if (res && res.length > 0) {
        if (productId) {
          return res.filter((r) => r.productId === productId);
        }
        return res;
      }
    } catch {
      markDbOffline();
    }
  }
  return [
    {
      id: 1,
      productId: 9,
      productName: 'Teal Embroidered Kurta Pant & Dupatta Suit Set',
      author: 'Pooja Sharma',
      city: 'Jaipur',
      rating: 5,
      title: 'Authentic Sanganeri Craftsmanship',
      comment: 'SS VASTRA ka Teal suit kapda bohot hi mulayam aur comfortable hai. Finishing bilkul boutique jaisi mili.',
      isVerified: true,
      createdAt: '2026-09-25T10:00:00.000Z',
    },
    {
      id: 2,
      productId: 10,
      productName: 'Peach Embroidered Kurta Pant & Dupatta Suit Set',
      author: 'Anjali Verma',
      city: 'Delhi NCR',
      rating: 5,
      title: 'Graceful Color & Fast Delivery',
      comment: 'Peach suit ka color shade aur embroidery exact photo jaisi aayi. Delivery Delhi me 3 din me ho gayi.',
      isVerified: true,
      createdAt: '2026-09-26T12:00:00.000Z',
    },
    {
      id: 3,
      productId: 11,
      productName: 'Red Floral Embroidered Kurta Pant Set with Dupatta',
      author: 'Neha Meena',
      city: 'Jaipur',
      rating: 5,
      title: 'Festive Wear Perfection',
      comment: 'Rani red embroidery dupatta ke saath look bohot sundar lagta hai. Sanganer craft direct milna badi baat hai.',
      isVerified: true,
      createdAt: '2026-09-27T14:30:00.000Z',
    },
    {
      id: 4,
      productId: 12,
      productName: 'Olive Green Embroidered 3-Piece Suit Set',
      author: 'Sunita Rathore',
      city: 'Jodhpur',
      rating: 5,
      title: 'Pure Cambric Quality & Perfect Fit',
      comment: 'Fitting एकदम perfect aayi. Packaging bhi premium thi aur COD smoothly receive hua.',
      isVerified: true,
      createdAt: '2026-09-28T09:15:00.000Z',
    },
  ];
}

export async function createReviewRecord(reviewData: {
  productId?: number;
  productName?: string;
  author: string;
  city?: string;
  rating: number;
  title?: string;
  comment: string;
}) {
  if (await isDbReady()) {
    try {
      const inserted = await db
        .insert(reviews)
        .values({
          productId: reviewData.productId || null,
          productName: reviewData.productName || null,
          author: reviewData.author,
          city: reviewData.city || 'Jaipur',
          rating: reviewData.rating || 5,
          title: reviewData.title || null,
          comment: reviewData.comment,
          isVerified: true,
          isApproved: true,
        })
        .returning();
      return inserted[0];
    } catch {
      markDbOffline();
    }
  }
  return {
    id: Date.now(),
    ...reviewData,
    city: reviewData.city || 'Jaipur',
    isVerified: true,
    isApproved: true,
    createdAt: new Date().toISOString(),
  };
}
