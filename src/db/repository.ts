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
} from './schema.ts';
import { eq, desc, asc, and, or, sql } from 'drizzle-orm';
import { localStore, LocalCategory, LocalOrder, LocalAdmin, LocalCoupon, LocalBanner } from './localStore.ts';

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
  if (await isDbReady()) {
    try {
      await db.update(categories).set(updates).where(eq(categories.id, id));
    } catch {
      markDbOffline();
    }
  }
}

// 3. Products
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
          const pImgs = allImages.filter((img) => img.productId === p.id);
          return {
            ...p,
            sizes: typeof p.sizes === 'string' ? JSON.parse(p.sizes) : p.sizes,
            highlights:
              typeof p.highlights === 'string'
                ? JSON.parse(p.highlights)
                : p.highlights || [],
            gallery: pImgs.map((img) => img.imageUrl),
          };
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

  return localList.map((p) => ({
    ...p,
    sizes: typeof p.sizes === 'string' ? JSON.parse(p.sizes) : p.sizes,
    highlights:
      typeof p.highlights === 'string' ? JSON.parse(p.highlights) : p.highlights || [],
    gallery: p.images || [p.image],
  }));
}

export async function getAllProductsAdminList() {
  if (await isDbReady()) {
    try {
      const allProducts = await db.select().from(products).orderBy(desc(products.id));
      if (allProducts && allProducts.length > 0) {
        const allImages = await db.select().from(productImages).orderBy(asc(productImages.displayOrder));
        return allProducts.map((p) => {
          const pImgs = allImages.filter((img) => img.productId === p.id);
          return {
            ...p,
            sizes: typeof p.sizes === 'string' ? JSON.parse(p.sizes) : p.sizes,
            highlights:
              typeof p.highlights === 'string' ? JSON.parse(p.highlights) : p.highlights || [],
            gallery: pImgs.map((img) => img.imageUrl),
          };
        });
      }
    } catch {
      markDbOffline();
    }
  }

  return localStore.getAllProductsAdmin().map((p) => ({
    ...p,
    sizes: typeof p.sizes === 'string' ? JSON.parse(p.sizes) : p.sizes,
    highlights:
      typeof p.highlights === 'string' ? JSON.parse(p.highlights) : p.highlights || [],
    gallery: p.images || [p.image],
  }));
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

        return {
          ...prod,
          sizes: typeof prod.sizes === 'string' ? JSON.parse(prod.sizes) : prod.sizes,
          highlights:
            typeof prod.highlights === 'string' ? JSON.parse(prod.highlights) : prod.highlights || [],
          gallery: imgs.map((i) => i.imageUrl),
        };
      }
    } catch {
      markDbOffline();
    }
  }

  const p = localStore.getProductById(id);
  if (!p) return null;
  return {
    ...p,
    sizes: typeof p.sizes === 'string' ? JSON.parse(p.sizes) : p.sizes,
    highlights:
      typeof p.highlights === 'string' ? JSON.parse(p.highlights) : p.highlights || [],
    gallery: p.images || [p.image],
  };
}

export async function createProductRecord(productData: any, extraImages: string[] = []) {
  const createdLocal = localStore.createProduct({
    ...productData,
    images: [productData.image, ...extraImages],
  });

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
      return inserted[0];
    } catch {
      markDbOffline();
    }
  }
  return createdLocal;
}

export async function updateProductRecord(id: number, updates: any) {
  localStore.updateProduct(id, updates);
  if (await isDbReady()) {
    try {
      const res = await db.update(products).set(updates).where(eq(products.id, id)).returning();
      return res[0] || updates;
    } catch {
      markDbOffline();
    }
  }
  return localStore.getProductById(id);
}

export async function deleteProductRecord(id: number) {
  localStore.deleteProduct(id);
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
  if (await isDbReady()) {
    try {
      const list = await db.select().from(orders).orderBy(desc(orders.id));
      if (list && list.length > 0) {
        const allItems = await db.select().from(orderItems);
        const allShipments = await db.select().from(shipments);

        return list.map((o) => {
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
  return localStore.getOrders();
}

export async function getOrderByNumber(orderNumber: string) {
  if (await isDbReady()) {
    try {
      const found = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber));
      if (found && found.length > 0) {
        const o = found[0];
        const items = await db.select().from(orderItems).where(eq(orderItems.orderId, o.id));
        const shipment = await db.select().from(shipments).where(eq(shipments.orderId, o.id));
        return {
          ...o,
          status: o.orderStatus,
          orderStatus: o.orderStatus,
          items,
          shipment: shipment[0] || null,
        };
      }
    } catch {
      markDbOffline();
    }
  }
  return localStore.getOrderByNumber(orderNumber);
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
  if (await isDbReady()) {
    try {
      await db.update(orders).set({ orderStatus: status, ...(paymentStatus ? { paymentStatus } : {}) }).where(eq(orders.id, orderId));
    } catch {
      markDbOffline();
    }
  }
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
