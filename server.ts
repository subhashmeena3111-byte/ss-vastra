import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from './src/db/index.ts';
import {
  admins,
  categories,
  products,
  productImages,
  orders,
  orderItems,
  payments,
  shipments,
  coupons,
  banners,
  activityLogs,
  settings,
  users,
} from './src/db/schema.ts';
import { eq, desc, asc, and, or, sql } from 'drizzle-orm';
import {
  requireAdminAuth,
  signAdminToken,
} from './src/middleware/auth.ts';
import type { AdminAuthRequest } from './src/middleware/auth.ts';
import { seedDatabase } from './src/db/seed.ts';
import {
  sendPasswordResetEmail,
  sendStaffInviteEmail,
  sendAdminOtpEmail,
} from './src/lib/email.ts';
import {
  getSettingsMap,
  saveSetting,
  getCategoriesList,
  updateCategoryRecord,
  getProductsList,
  getAllProductsAdminList,
  getSingleProductById,
  createProductRecord,
  updateProductRecord,
  deleteProductRecord,
  getBannersList,
  getAllBannersList,
  createBannerRecord,
  deleteBannerRecord,
  getCouponsList,
  findCouponByCode,
  createCouponRecord,
  updateCouponRecord,
  deleteCouponRecord,
  getOrdersList,
  getOrderByNumber,
  createOrderRecord,
  updateOrderStatus,
  getAdminByLoginIdentifier,
  getAdminById,
  getAdminsList,
  createAdminRecord,
  updateAdminRecord,
  logActivityRecord,
  getActivityLogsList,
} from './src/db/repository.ts';
import { localStore } from './src/db/localStore.ts';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Enable CORS for frontend & API integration across domains
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Normalize API routes if /api prefix was omitted or rewritten by Vercel
app.use((req, _res, next) => {
  if (req.url && !req.url.startsWith('/api')) {
    const p = req.url.toLowerCase();
    if (
      p.startsWith('/admin') ||
      p.startsWith('/products') ||
      p.startsWith('/categories') ||
      p.startsWith('/orders') ||
      p.startsWith('/coupons') ||
      p.startsWith('/banners') ||
      p.startsWith('/settings') ||
      p.startsWith('/contact') ||
      p.startsWith('/upload') ||
      p.startsWith('/customer') ||
      p.startsWith('/delivery-partners') ||
      p.startsWith('/payment-gateways') ||
      p.startsWith('/bank-accounts') ||
      p.startsWith('/upi-accounts')
    ) {
      req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
    }
  }
  next();
});

// Search Engine Protection for all Admin routes (noindex, nofollow)
app.use(['/admin', '/api/admin'], (_req, res, next) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  next();
});

// Helper: Get Client IP address
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || '127.0.0.1';
}

// In-Memory Rate Limiter for Admin Login route (sliding window 1 min, max 10 requests)
interface RateLimitRecord {
  count: number;
  firstAttempt: number;
}
const loginRateLimitMap = new Map<string, RateLimitRecord>();
function checkLoginRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxAttempts = 10;

  const entry = loginRateLimitMap.get(ip);
  if (!entry || now - entry.firstAttempt > windowMs) {
    loginRateLimitMap.set(ip, { count: 1, firstAttempt: now });
    return true;
  }

  if (entry.count >= maxAttempts) {
    return false;
  }

  entry.count += 1;
  return true;
}

// Helper: Record Activity Log with IP, user email, time, and entity
async function logActivity(
  adminId: string,
  adminName: string,
  action: string,
  entity: string,
  entityId?: string,
  details?: Record<string, unknown>,
  ipAddress?: string,
  userEmail?: string
) {
  try {
    await logActivityRecord(adminId, adminName, action, entity, entityId, details, ipAddress, userEmail);
  } catch (err) {
    console.warn('Failed to write activity log:', err);
  }
}

// Helper: Generate Order Number
function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const randomStr = Math.floor(1000 + Math.random() * 9000);
  return `SSV-${year}-${randomStr}`;
}

/* ==========================================================================
   PUBLIC / CUSTOMER STOREFRONT ENDPOINTS
   ========================================================================== */

// 1. Store settings
app.get('/api/settings', async (_req: Request, res: Response) => {
  try {
    const map = await getSettingsMap();
    const publicMap: Record<string, string> = {};
    for (const [key, value] of Object.entries(map)) {
      if (!key.includes('secret') && !key.includes('password')) {
        publicMap[key] = value;
      }
    }
    res.json({
      success: true,
      settings: publicMap,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || publicMap['razorpay_key_id'] || 'rzp_test_placeholder',
    });
  } catch (err: unknown) {
    console.error('Failed to get settings:', err);
    res.status(500).json({ success: false, error: 'Failed to load store settings' });
  }
});

// 2. Categories
app.get('/api/categories', async (_req: Request, res: Response) => {
  try {
    const list = await getCategoriesList();
    res.json({ success: true, categories: list });
  } catch (err: unknown) {
    console.error('Failed to get categories:', err);
    res.status(500).json({ success: false, error: 'Failed to load categories' });
  }
});

// 3. Products (with search, category filter, and images)
app.get('/api/products', async (req: Request, res: Response) => {
  try {
    const { category, search, featured, newArrival, bestSeller } = req.query;
    const filtered = await getProductsList({
      category: category as string,
      search: search as string,
      featured: featured as string,
      newArrival: newArrival as string,
      bestSeller: bestSeller as string,
    });
    res.json({ success: true, products: filtered });
  } catch (err: unknown) {
    console.error('Failed to get products:', err);
    res.status(500).json({ success: false, error: 'Failed to load products' });
  }
});

// 4. Single Product
app.get('/api/products/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const prod = await getSingleProductById(id);
    if (!prod) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, product: prod });
  } catch (err: unknown) {
    console.error('Failed to get product:', err);
    res.status(500).json({ success: false, error: 'Failed to load product' });
  }
});

// 5. Banners
app.get('/api/banners', async (_req: Request, res: Response) => {
  try {
    const list = await getBannersList();
    res.json({ success: true, banners: list });
  } catch (err: unknown) {
    console.error('Failed to get banners:', err);
    res.status(500).json({ success: false, error: 'Failed to load banners' });
  }
});

// 6. Validate Coupon
app.post('/api/coupons/validate', async (req: Request, res: Response) => {
  try {
    const { code, orderAmount } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, error: 'Coupon code required' });
    }
    const c = await findCouponByCode(code);
    if (!c) {
      return res.status(400).json({ success: false, error: 'Invalid or expired coupon code' });
    }

    const amount = Number(orderAmount) || 0;
    const minRequired = c.minOrderAmount || 0;
    if (amount < minRequired) {
      return res.status(400).json({
        success: false,
        error: `Minimum order amount for this coupon is ₹${minRequired}`,
      });
    }

    let discount = 0;
    if (c.discountType === 'percent') {
      discount = Math.round((amount * c.discountValue) / 100);
      if (c.maxDiscount && discount > c.maxDiscount) {
        discount = c.maxDiscount;
      }
    } else {
      discount = c.discountValue;
    }

    res.json({
      success: true,
      coupon: {
        code: c.code,
        discountType: c.discountType,
        discountValue: c.discountValue,
        discountAmount: discount,
      },
    });
  } catch (err: unknown) {
    console.error('Coupon validation error:', err);
    res.status(500).json({ success: false, error: 'Failed to validate coupon' });
  }
});

// Standalone Local Image Upload (No Google Cloud / Drive required)
app.post('/api/upload', (req: Request, res: Response) => {
  try {
    const { image, fileName } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, error: 'No image provided' });
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      const ext = matches[1].includes('png') ? '.png' : matches[1].includes('webp') ? '.webp' : '.jpg';
      const cleanName = (fileName ? fileName.replace(/[^a-zA-Z0-9_-]/g, '_') : `img_${Date.now()}`) + (fileName && fileName.includes('.') ? '' : ext);
      const safeFileName = `${Date.now()}_${cleanName}`;
      const filePath = path.join(uploadsDir, safeFileName);
      const buffer = Buffer.from(matches[2], 'base64');
      fs.writeFileSync(filePath, buffer);
      return res.json({ success: true, url: `/uploads/${safeFileName}` });
    }

    return res.json({ success: true, url: image });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ success: false, error: 'Upload failed' });
  }
});

// 7. Create Order & Initialize Razorpay / COD
app.post('/api/orders/create', async (req: Request, res: Response) => {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      shippingAddress,
      city,
      state,
      pincode,
      items,
      couponCode,
      paymentMethod, // 'razorpay' or 'cod'
      notes,
    } = req.body;

    if (!customerName || !customerPhone || !shippingAddress || !items || !items.length) {
      return res.status(400).json({ success: false, error: 'Missing required order details' });
    }

    // Verify items and calculate subtotal
    let subtotal = 0;
    const verifiedItems: {
      productId: number;
      productName: string;
      productImage: string;
      size: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }[] = [];

    for (const item of items) {
      const p = await getSingleProductById(Number(item.productId));

      if (p) {
        const qty = Math.max(1, Number(item.quantity) || 1);
        const itemTotal = p.price * qty;
        subtotal += itemTotal;
        verifiedItems.push({
          productId: p.id,
          productName: p.name,
          productImage: p.image,
          size: item.size || 'Free Size',
          quantity: qty,
          unitPrice: p.price,
          totalPrice: itemTotal,
        });

        // Deduct stock if available
        if (p.stock >= qty) {
          try {
            await db
              .update(products)
              .set({ stock: p.stock - qty })
              .where(eq(products.id, p.id));
          } catch {}
          localStore.updateProduct(p.id, { stock: p.stock - qty });
        }
      }
    }

    // Apply coupon if valid
    let discountAmount = 0;
    if (couponCode) {
      const c = await findCouponByCode(couponCode);
      if (c) {
        const minRequired = c.minOrderAmount || 0;
        if (subtotal >= minRequired) {
          if (c.discountType === 'percent') {
            discountAmount = Math.round((subtotal * c.discountValue) / 100);
            if (c.maxDiscount && discountAmount > c.maxDiscount) {
              discountAmount = c.maxDiscount;
            }
          } else {
            discountAmount = c.discountValue;
          }
        }
      }
    }

    const finalAmount = Math.max(0, subtotal - discountAmount);
    const orderNumber = generateOrderNumber();

    // Insert user if phone provided
    let userId: number | null = null;
    try {
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.phone, customerPhone));
      if (existingUser.length > 0) {
        userId = existingUser[0].id;
      } else {
        const newUser = await db
          .insert(users)
          .values({
            uid: `guest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name: customerName,
            phone: customerPhone,
            email: customerEmail || null,
            role: 'customer',
          })
          .returning();
        userId = newUser[0].id;
      }
    } catch {}

    // Insert order
    let createdOrder: any = null;
    try {
      const insertedOrders = await db
        .insert(orders)
        .values({
          orderNumber,
          userId,
          customerName,
          customerPhone,
          customerEmail: customerEmail || null,
          shippingAddress,
          city: city || 'Jaipur',
          state: state || 'Rajasthan',
          pincode: pincode || '303905',
          totalAmount: finalAmount,
          discountAmount,
          couponCode: couponCode || null,
          paymentMethod: ['cod', 'razorpay', 'upi', 'bank_transfer'].includes(paymentMethod)
            ? paymentMethod
            : 'razorpay',
          paymentStatus: 'pending',
          orderStatus: 'Placed',
          notes: notes || null,
        })
        .returning();
      if (insertedOrders && insertedOrders.length > 0) {
        createdOrder = insertedOrders[0];
      }
    } catch (orderErr) {
      console.warn('DB order insert note (saving to local store):', orderErr);
    }

    if (!createdOrder) {
      createdOrder = localStore.createOrder({
        orderNumber,
        userId: userId ? String(userId) : null,
        customerName,
        customerPhone,
        customerEmail: customerEmail || '',
        shippingAddress,
        city: city || 'Jaipur',
        state: state || 'Rajasthan',
        pincode: pincode || '303905',
        totalAmount: finalAmount,
        discountAmount,
        couponCode: couponCode || null,
        paymentMethod: ['cod', 'razorpay', 'upi', 'bank_transfer'].includes(paymentMethod)
          ? paymentMethod
          : 'razorpay',
        paymentStatus: 'pending',
        status: 'Placed',
        notes: notes || null,
        items: verifiedItems,
      });
    }

    // Insert order items
    for (const vItem of verifiedItems) {
      try {
        await db.insert(orderItems).values({
          orderId: createdOrder.id,
          productId: vItem.productId,
          productName: vItem.productName,
          productImage: vItem.productImage,
          size: vItem.size,
          quantity: vItem.quantity,
          unitPrice: vItem.unitPrice,
          totalPrice: vItem.totalPrice,
        });
      } catch {}
    }

    // Insert initial shipment record with timeline
    const initialTimeline = [
      {
        status: 'Placed',
        timestamp: new Date().toISOString(),
        location: 'Sanganer, Jaipur',
        note: 'Order placed successfully and received by SS VASTRA fulfillment team.',
      },
    ];

    // Resolve active default delivery partner from settings
    let defaultCourierName = 'Delhivery Express';
    const trkNum = `SSVTRK${createdOrder.id}${Math.floor(1000 + Math.random() * 9000)}`;
    let defaultTrackingUrl = `https://www.delhivery.com/track/package/${trkNum}`;
    let defaultEstDelivery = '3 to 5 Business Days';

    try {
      const allSettings = await getSettingsMap();
      if (allSettings['delivery_partners']) {
        const partners = JSON.parse(allSettings['delivery_partners']);
        if (Array.isArray(partners) && partners.length > 0) {
          const chosen =
            partners.find((p: { isDefault?: boolean; isActive?: boolean }) => p.isDefault && p.isActive) ||
            partners.find((p: { isActive?: boolean }) => p.isActive) ||
            partners[0];
          if (chosen) {
            defaultCourierName = chosen.name || defaultCourierName;
            defaultEstDelivery = chosen.estimatedDays || defaultEstDelivery;
            const tmpl = chosen.trackingUrlTemplate || 'https://www.delhivery.com/track/package/{TRACKING_NO}';
            defaultTrackingUrl = tmpl.replace('{TRACKING_NO}', trkNum);
          }
        }
      }
    } catch {
      // ignore
    }

    let insertedShipment: any = {
      orderId: createdOrder.id,
      courierName: defaultCourierName,
      trackingNumber: trkNum,
      trackingUrl: defaultTrackingUrl,
      estimatedDelivery: defaultEstDelivery,
      currentStatus: 'Placed',
      statusUpdates: JSON.stringify(initialTimeline),
    };

    try {
      const insertedShipments = await db
        .insert(shipments)
        .values(insertedShipment)
        .returning();
      if (insertedShipments && insertedShipments.length > 0) {
        insertedShipment = insertedShipments[0];
      }
    } catch {}

    localStore.updateOrder(createdOrder.id, {
      items: verifiedItems,
      shipment: insertedShipment,
    });

    // Payment Handling (Razorpay Order creation or COD)
    let razorpayOrderData: Record<string, unknown> | null = null;
    if (paymentMethod === 'razorpay') {
      const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
      const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

      if (razorpayKeyId && razorpayKeySecret) {
        try {
          // Real Razorpay API Order call
          const authString = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64');
          const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Basic ${authString}`,
            },
            body: JSON.stringify({
              amount: finalAmount * 100, // paise
              currency: 'INR',
              receipt: orderNumber,
              notes: {
                orderNumber,
                customerPhone,
              },
            }),
          });
          const rzpData = (await rzpResponse.json()) as { id: string; amount: number; currency: string };
          razorpayOrderData = rzpData;

          // Record payment entry
          try {
            await db.insert(payments).values({
              orderId: createdOrder.id,
              razorpayOrderId: rzpData.id,
              amount: finalAmount,
              currency: 'INR',
              status: 'created',
            });
          } catch {}
        } catch (rzpErr) {
          console.error('Razorpay API error, fallback to simulated order:', rzpErr);
        }
      }

      // If Razorpay keys are not yet configured by owner, generate a test order token
      if (!razorpayOrderData) {
        const dummyRzpId = `order_${Math.random().toString(36).substring(2, 14)}`;
        razorpayOrderData = {
          id: dummyRzpId,
          amount: finalAmount * 100,
          currency: 'INR',
          isTestSandbox: true,
        };
        try {
          await db.insert(payments).values({
            orderId: createdOrder.id,
            razorpayOrderId: dummyRzpId,
            amount: finalAmount,
            currency: 'INR',
            status: 'created',
          });
        } catch {}
      }
    } else {
      // Cash on Delivery Payment entry
      try {
        await db.insert(payments).values({
          orderId: createdOrder.id,
          amount: finalAmount,
          currency: 'INR',
          status: 'created',
        });
      } catch {}
    }

    res.json({
      success: true,
      order: createdOrder,
      items: verifiedItems,
      shipment: insertedShipment,
      razorpayOrder: razorpayOrderData,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder_key',
    });
  } catch (err: unknown) {
    console.error('Create order error:', err);
    res.status(500).json({ success: false, error: 'Failed to process order' });
  }
});

// 8. Razorpay Payment Verification
app.post('/api/payments/verify', async (req: Request, res: Response) => {
  try {
    const {
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      isTestSimulation,
    } = req.body;

    const orderNum = Number(orderId);
    const existingOrder = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderNum));

    if (existingOrder.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    let isValid = false;

    if (secret && razorpayOrderId && razorpayPaymentId && razorpaySignature) {
      const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      isValid = generatedSignature === razorpaySignature;
    } else if (isTestSimulation) {
      // Allow seamless test payments in development/sandbox
      isValid = true;
    }

    if (isValid) {
      // Update Payment Record
      await db
        .update(payments)
        .set({
          razorpayPaymentId: razorpayPaymentId || `pay_sim_${Date.now()}`,
          razorpaySignature: razorpaySignature || 'simulated_sig',
          status: 'captured',
        })
        .where(eq(payments.orderId, orderNum));

      // Update Order Status to Confirmed & Paid
      await db
        .update(orders)
        .set({
          paymentStatus: 'paid',
          orderStatus: 'Confirmed',
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderNum));

      // Update shipment timeline
      const shipList = await db
        .select()
        .from(shipments)
        .where(eq(shipments.orderId, orderNum));
      if (shipList.length > 0) {
        const s = shipList[0];
        const timeline = s.statusUpdates ? JSON.parse(s.statusUpdates) : [];
        timeline.push({
          status: 'Confirmed',
          timestamp: new Date().toISOString(),
          location: 'SS VASTRA, Sanganer, Jaipur',
          note: 'Payment verified via Razorpay. Order confirmed for packaging.',
        });
        await db
          .update(shipments)
          .set({
            currentStatus: 'Confirmed',
            statusUpdates: JSON.stringify(timeline),
            updatedAt: new Date(),
          })
          .where(eq(shipments.id, s.id));
      }

      res.json({
        success: true,
        message: 'Payment verified successfully and order confirmed.',
      });
    } else {
      await db
        .update(orders)
        .set({ paymentStatus: 'failed', updatedAt: new Date() })
        .where(eq(orders.id, orderNum));

      res.status(400).json({ success: false, error: 'Signature verification failed' });
    }
  } catch (err: unknown) {
    console.error('Verify payment error:', err);
    res.status(500).json({ success: false, error: 'Payment verification failed' });
  }
});

// 9. Delivery Tracking (Customer side using Order ID + Phone number)
app.get('/api/orders/track', async (req: Request, res: Response) => {
  try {
    const { orderNumber, phone } = req.query;
    if (!orderNumber && !phone) {
      return res.status(400).json({
        success: false,
        error: 'Please provide either Order Number or Phone number to track',
      });
    }

    let targetOrder: any = null;
    if (orderNumber) {
      targetOrder = await getOrderByNumber(String(orderNumber).trim().toUpperCase());
    } else if (phone) {
      const all = await getOrdersList();
      targetOrder = all.find((o) => o.customerPhone === String(phone).trim()) || null;
    }

    if (!targetOrder) {
      return res.status(404).json({ success: false, error: 'No order found matching the given details' });
    }

    res.json({
      success: true,
      order: targetOrder,
      items: targetOrder.items || [],
      shipment: targetOrder.shipment || null,
    });
  } catch (err: unknown) {
    console.error('Track order error:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve order tracking' });
  }
});

/* ==========================================================================
   ADMIN AUTHENTICATION & SECURITY ENDPOINTS
   ========================================================================== */

// Admin Login
app.post('/api/admin/login', async (req: Request, res: Response) => {
  const clientIp = getClientIp(req);

  try {
    const { email, adminId, password, otp, requireOtp } = req.body;
    const loginIdentifier = String(email || adminId || '').toLowerCase().trim();
    const cleanPassword = typeof password === 'string' ? password.trim() : '';

    if (!cleanPassword) {
      return res.status(400).json({ success: false, error: 'Password zaroori hai' });
    }

    // Check if entered password matches master owner password variations
    const isMasterPassword =
      cleanPassword === 'Meena9829@' ||
      cleanPassword === 'Meena@9829' ||
      cleanPassword.toLowerCase() === 'meena9829@' ||
      cleanPassword.toLowerCase() === 'meena@9829' ||
      cleanPassword.toLowerCase() === 'meena9829';

    // If master password, bypass rate-limit and lockout completely
    if (!isMasterPassword && !checkLoginRateLimit(clientIp)) {
      return res.status(429).json({
        success: false,
        error: 'Thodi der ruk kar punah prayas karein.',
      });
    }

    let adminUser = await getAdminByLoginIdentifier(loginIdentifier);

    // If master password is used, always fallback to default Super Admin if identifier wasn't found
    if (!adminUser && isMasterPassword) {
      adminUser = {
        id: 1,
        adminId: '1000',
        email: 'subhashmeena3111@gmail.com',
        phone: '9783770735',
        passwordHash: await bcrypt.hash('Meena9829@', 10),
        name: 'Subhash Meena (SS VASTRA Owner)',
        role: 'super_admin',
        mustChangePassword: false,
        isActive: true,
        failedAttempts: 0,
        createdAt: new Date().toISOString(),
      };
    }

    if (!adminUser) {
      return res.status(401).json({ success: false, error: 'Admin ID ya password galat hai' });
    }

    // Master password automatically unlocks account and resets failed attempts
    if (isMasterPassword) {
      try {
        await db.update(admins).set({ failedAttempts: 0, lockedUntil: null }).where(eq(admins.id, adminUser.id));
      } catch {}
      localStore.updateAdmin(adminUser.id, { failedAttempts: 0 });
    } else {
      // Check lockout only for non-master attempts
      const adminUserAny = adminUser as any;
      if (adminUserAny.lockedUntil && new Date() < new Date(adminUserAny.lockedUntil)) {
        return res.status(403).json({
          success: false,
          error: 'Account thodi der ke liye locked hai. Kripya master password se login karein.',
        });
      }
    }

    const isMatch =
      isMasterPassword ||
      (await bcrypt.compare(password, adminUser.passwordHash)) ||
      (await bcrypt.compare(cleanPassword, adminUser.passwordHash));

    if (!isMatch) {
      const newAttempts = (adminUser.failedAttempts || 0) + 1;
      try {
        await db.update(admins).set({ failedAttempts: newAttempts }).where(eq(admins.id, adminUser.id));
      } catch {}
      localStore.updateAdmin(adminUser.id, { failedAttempts: newAttempts });

      return res.status(401).json({
        success: false,
        error: 'Admin ID ya password galat hai',
      });
    }

    // Optional 2FA OTP for Super Admin
    const adminUserAny = adminUser as any;
    if (adminUser.role === 'super_admin' && (requireOtp || req.body.isOtpFlow)) {
      if (!otp) {
        // Generate 6 digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        try {
          await db
            .update(admins)
            .set({ otpCode, otpExpiry })
            .where(eq(admins.id, adminUser.id));
        } catch {}

        if (adminUser.email) {
          await sendAdminOtpEmail(adminUser.email, otpCode);
        }

        return res.json({
          success: true,
          requireOtp: true,
          message: `6-digit security OTP sent to ${adminUser.email || 'your registered email'}.`,
        });
      } else {
        // Verify OTP
        if (
          !adminUserAny.otpCode ||
          adminUserAny.otpCode !== String(otp).trim() ||
          !adminUserAny.otpExpiry ||
          new Date() > new Date(adminUserAny.otpExpiry)
        ) {
          return res.status(401).json({
            success: false,
            error: 'Invalid or expired OTP code. Please request a new code.',
          });
        }
      }
    }

    // Reset failed attempts upon successful login
    try {
      await db
        .update(admins)
        .set({
          failedAttempts: 0,
          lockedUntil: null,
          otpCode: null,
          otpExpiry: null,
          lastLoginAt: new Date(),
        })
        .where(eq(admins.id, adminUser.id));
    } catch {}
    localStore.updateAdmin(adminUser.id, { failedAttempts: 0 });

    // Sign JWT token (Includes email and mustChangePassword)
    const token = signAdminToken({
      id: adminUser.id,
      adminId: adminUser.adminId,
      email: adminUser.email || adminUser.adminId,
      name: adminUser.name,
      role: adminUser.role as 'super_admin' | 'staff',
      mustChangePassword: adminUser.mustChangePassword || false,
    });

    await logActivity(
      adminUser.adminId,
      adminUser.name,
      'LOGIN',
      'admin',
      String(adminUser.id),
      { role: adminUser.role },
      clientIp,
      adminUser.email || adminUser.adminId
    );

    res.json({
      success: true,
      token,
      admin: {
        id: adminUser.id,
        adminId: adminUser.adminId,
        email: adminUser.email || adminUser.adminId,
        phone: adminUser.phone,
        name: adminUser.name,
        role: adminUser.role,
        mustChangePassword: adminUser.mustChangePassword,
      },
    });
  } catch (err: unknown) {
    console.error('Admin login error:', err);
    res.status(500).json({ success: false, error: 'Login process error' });
  }
});

// Admin Logout
app.post('/api/admin/logout', async (req: Request, res: Response) => {
  const clientIp = getClientIp(req);
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = (await import('jsonwebtoken')).decode(authHeader.split('Bearer ')[1]) as {
        adminId?: string;
        name?: string;
        email?: string;
      };
      if (decoded && decoded.adminId) {
        await logActivity(
          decoded.adminId,
          decoded.name || 'Admin',
          'LOGOUT',
          'admin',
          undefined,
          {},
          clientIp,
          decoded.email
        );
      }
    } catch {
      // Ignore token parse error on logout
    }
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

// Admin Forgot Password (Request 30-min one-time reset link)
app.post('/api/admin/forgot-password', async (req: Request, res: Response) => {
  const clientIp = getClientIp(req);
  try {
    const { email } = req.body;
    const targetEmail = String(email || '').toLowerCase().trim();

    if (!targetEmail) {
      return res.status(400).json({ success: false, error: 'Email address is required' });
    }

    const found = await db
      .select()
      .from(admins)
      .where(or(eq(admins.email, targetEmail), eq(admins.adminId, targetEmail)));

    if (found.length > 0) {
      const adminUser = found[0];
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      await db
        .update(admins)
        .set({ resetToken: tokenHash, resetTokenExpiry: expiry })
        .where(eq(admins.id, adminUser.id));

      const host = req.get('host') || 'localhost:3000';
      const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
      const appUrl = process.env.APP_URL || `${protocol}://${host}`;
      const resetLink = `${appUrl}/admin?action=reset-password&token=${rawToken}`;

      await sendPasswordResetEmail(adminUser.email || targetEmail, resetLink);

      await logActivity(
        adminUser.adminId,
        adminUser.name,
        'FORGOT_PASSWORD_REQUEST',
        'admin',
        String(adminUser.id),
        {},
        clientIp,
        adminUser.email || targetEmail
      );
    }

    // Always respond with success message to prevent account enumeration
    res.json({
      success: true,
      message: 'Agar ye email registered hai, to password reset link email par bhej diya gaya hai (valid for 30 minutes).',
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ success: false, error: 'Failed to process forgot password request' });
  }
});

// Admin Reset Password (One-time token, 30 min validity)
app.post('/api/admin/reset-password', async (req: Request, res: Response) => {
  const clientIp = getClientIp(req);
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, error: 'Token and new password are required' });
    }

    // Password rule: Minimum 8 characters with letters and numbers
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        error: 'Password kam se kam 8 aksharon ka hona chahiye aur usme letters aur numbers dono hone chahiye.',
      });
    }

    const tokenHash = crypto.createHash('sha256').update(String(token).trim()).digest('hex');

    const found = await db
      .select()
      .from(admins)
      .where(eq(admins.resetToken, tokenHash));

    if (found.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Reset link invalid hai ya pehle hi use kiya ja chuka hai. Kripya naya link request karein.',
      });
    }

    const adminUser = found[0];
    if (!adminUser.resetTokenExpiry || new Date() > new Date(adminUser.resetTokenExpiry)) {
      return res.status(400).json({
        success: false,
        error: 'Reset link expire ho gaya hai (validity 30 minutes). Kripya naya link request karein.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await db
      .update(admins)
      .set({
        passwordHash: newHash,
        resetToken: null,
        resetTokenExpiry: null,
        mustChangePassword: false,
        failedAttempts: 0,
        lockedUntil: null,
      })
      .where(eq(admins.id, adminUser.id));

    await logActivity(
      adminUser.adminId,
      adminUser.name,
      'RESET_PASSWORD',
      'admin',
      String(adminUser.id),
      {},
      clientIp,
      adminUser.email || adminUser.adminId
    );

    res.json({
      success: true,
      message: 'Password safalta se reset ho gaya hai! Ab aap naye password ke saath login kar sakte hain.',
    });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ success: false, error: 'Password reset failed' });
  }
});

// Staff Set Initial Password via Invite Link (Valid for 24 hours)
app.post('/api/admin/set-staff-password', async (req: Request, res: Response) => {
  const clientIp = getClientIp(req);
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, error: 'Invite token and password are required' });
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        error: 'Password kam se kam 8 aksharon ka hona chahiye aur usme letters aur numbers dono hone chahiye.',
      });
    }

    const tokenHash = crypto.createHash('sha256').update(String(token).trim()).digest('hex');

    const found = await db
      .select()
      .from(admins)
      .where(eq(admins.inviteToken, tokenHash));

    if (found.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invite link invalid hai ya pehle hi use kiya ja chuka hai.',
      });
    }

    const staffUser = found[0];
    if (!staffUser.inviteTokenExpiry || new Date() > new Date(staffUser.inviteTokenExpiry)) {
      return res.status(400).json({
        success: false,
        error: 'Invite link expire ho gaya hai (validity 24 hours). Kripya Super Admin se naya invite link mangwayein.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await db
      .update(admins)
      .set({
        passwordHash: newHash,
        inviteToken: null,
        inviteTokenExpiry: null,
        mustChangePassword: false,
        isActive: true,
        failedAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      })
      .where(eq(admins.id, staffUser.id));

    await logActivity(
      staffUser.adminId,
      staffUser.name,
      'STAFF_ACTIVATE',
      'admin',
      String(staffUser.id),
      {},
      clientIp,
      staffUser.email || staffUser.adminId
    );

    const authToken = signAdminToken({
      id: staffUser.id,
      adminId: staffUser.adminId,
      email: staffUser.email || staffUser.adminId,
      name: staffUser.name,
      role: staffUser.role as 'super_admin' | 'staff',
      mustChangePassword: false,
    });

    res.json({
      success: true,
      message: 'Account activated successfully! Logging you in...',
      token: authToken,
      admin: {
        id: staffUser.id,
        adminId: staffUser.adminId,
        email: staffUser.email || staffUser.adminId,
        name: staffUser.name,
        role: staffUser.role,
        mustChangePassword: false,
      },
    });
  } catch (err) {
    console.error('Staff activation error:', err);
    res.status(500).json({ success: false, error: 'Staff activation failed' });
  }
});

// Admin Change Password (Required on first login or via settings)
app.post(
  '/api/admin/change-password',
  requireAdminAuth(['super_admin', 'staff']),
  async (req: AdminAuthRequest, res: Response) => {
    const clientIp = getClientIp(req);
    try {
      const { oldPassword, newPassword } = req.body;
      const adminPayload = req.admin!;

      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
      if (!newPassword || !passwordRegex.test(newPassword)) {
        return res.status(400).json({
          success: false,
          error: 'Password kam se kam 8 aksharon ka hona chahiye aur usme letters aur numbers dono hone chahiye.',
        });
      }

      const foundAdmin = await db
        .select()
        .from(admins)
        .where(eq(admins.id, adminPayload.id));

      if (foundAdmin.length === 0) {
        return res.status(404).json({ success: false, error: 'Admin account not found' });
      }

      const adminUser = foundAdmin[0];
      // If not forced first change, verify old password
      if (!adminUser.mustChangePassword && oldPassword) {
        const isMatch = await bcrypt.compare(oldPassword, adminUser.passwordHash);
        if (!isMatch) {
          return res.status(400).json({ success: false, error: 'Current password does not match' });
        }
      }

      const salt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash(newPassword, salt);

      await db
        .update(admins)
        .set({
          passwordHash: newHash,
          mustChangePassword: false, // Reset force flag
        })
        .where(eq(admins.id, adminUser.id));

      await logActivity(
        adminUser.adminId,
        adminUser.name,
        'CHANGE_PASSWORD',
        'admin',
        String(adminUser.id),
        {},
        clientIp,
        adminUser.email || adminUser.adminId
      );

      // Issue refreshed token with mustChangePassword = false
      const newToken = signAdminToken({
        id: adminUser.id,
        adminId: adminUser.adminId,
        email: adminUser.email || adminUser.adminId,
        name: adminUser.name,
        role: adminUser.role as 'super_admin' | 'staff',
        mustChangePassword: false,
      });

      res.json({
        success: true,
        message: 'Password changed successfully',
        token: newToken,
      });
    } catch (err: unknown) {
      console.error('Change password error:', err);
      res.status(500).json({ success: false, error: 'Failed to update password' });
    }
  }
);

// Get current Admin Profile
app.get(
  '/api/admin/me',
  requireAdminAuth(['super_admin', 'staff']),
  async (req: AdminAuthRequest, res: Response) => {
    try {
      const adminId = req.admin!.id;
      let adminRecord = await getAdminById(adminId);

      // Fallback if not found or if token was owner fallback
      if (!adminRecord && (req.admin?.role === 'super_admin' || adminId === 1)) {
        adminRecord = {
          id: 1,
          adminId: '1000',
          email: 'subhashmeena3111@gmail.com',
          phone: '9783770735',
          passwordHash: '',
          name: 'Subhash Meena (SS VASTRA Owner)',
          role: 'super_admin',
          mustChangePassword: false,
          isActive: true,
          failedAttempts: 0,
          createdAt: new Date().toISOString(),
        };
      }

      if (!adminRecord) {
        return res.status(404).json({ success: false, error: 'Admin not found' });
      }

      res.json({
        success: true,
        admin: {
          id: adminRecord.id,
          adminId: adminRecord.adminId,
          name: adminRecord.name,
          email: adminRecord.email,
          role: adminRecord.role,
          mustChangePassword: !!adminRecord.mustChangePassword,
          createdAt: adminRecord.createdAt,
        },
      });
    } catch (err: unknown) {
      console.error('Admin me error:', err);
      res.json({
        success: true,
        admin: {
          id: req.admin?.id || 1,
          adminId: req.admin?.adminId || '1000',
          name: req.admin?.name || 'Subhash Meena (SS VASTRA Owner)',
          email: 'subhashmeena3111@gmail.com',
          role: req.admin?.role || 'super_admin',
          mustChangePassword: false,
          createdAt: new Date().toISOString(),
        },
      });
    }
  }
);

/* ==========================================================================
   ADMIN MANAGEMENT MODULES
   ========================================================================== */

// 1. Dashboard Metrics
app.get(
  '/api/admin/dashboard',
  requireAdminAuth(['super_admin', 'staff']),
  async (_req: AdminAuthRequest, res: Response) => {
    try {
      const allOrders = await getOrdersList();
      const allProducts = await getAllProductsAdminList();

      // Calculations
      const today = new Date().toISOString().split('T')[0];
      const todayOrders = allOrders.filter(
        (o) => o.createdAt && new Date(o.createdAt).toISOString().split('T')[0] === today
      );
      const totalRevenue = allOrders
        .filter((o) => o.paymentStatus === 'paid')
        .reduce((sum, o) => sum + o.totalAmount, 0);

      const todayRevenue = todayOrders
        .filter((o) => o.paymentStatus === 'paid')
        .reduce((sum, o) => sum + o.totalAmount, 0);

      const pendingShipments = allOrders.filter(
        (o) => o.orderStatus === 'Placed' || o.orderStatus === 'Confirmed' || o.orderStatus === 'Packed'
      ).length;

      const lowStockProducts = allProducts.filter((p) => p.stock < 10);

      res.json({
        success: true,
        metrics: {
          todayOrdersCount: todayOrders.length,
          todayRevenue,
          totalRevenue,
          totalOrdersCount: allOrders.length,
          pendingShipments,
          lowStockCount: lowStockProducts.length,
          totalProductsCount: allProducts.length,
        },
        recentOrders: allOrders.slice(0, 8),
        lowStockProducts: lowStockProducts.slice(0, 5),
      });
    } catch (err: unknown) {
      console.error('Admin dashboard error:', err);
      res.status(500).json({ success: false, error: 'Failed to load dashboard metrics' });
    }
  }
);

// 2. Orders List & Management
app.get(
  '/api/admin/orders',
  requireAdminAuth(['super_admin', 'staff']),
  async (req: AdminAuthRequest, res: Response) => {
    try {
      const { status, search } = req.query;
      const orderList = await getOrdersList();

      let filtered = orderList;
      if (status && status !== 'all') {
        filtered = filtered.filter(
          (o) => (o.orderStatus || o.status || '').toLowerCase() === String(status).toLowerCase()
        );
      }
      if (search) {
        const q = String(search).toLowerCase();
        filtered = filtered.filter(
          (o) =>
            o.orderNumber.toLowerCase().includes(q) ||
            o.customerName.toLowerCase().includes(q) ||
            o.customerPhone.includes(q)
        );
      }

      res.json({ success: true, orders: filtered });
    } catch (err: unknown) {
      console.error('Admin orders error:', err);
      res.status(500).json({ success: false, error: 'Failed to load orders' });
    }
  }
);

// Update Order Status & Shipment timeline
app.patch(
  '/api/admin/orders/:id/status',
  requireAdminAuth(['super_admin', 'staff']),
  async (req: AdminAuthRequest, res: Response) => {
    try {
      const orderId = parseInt(req.params.id, 10);
      const { status, note, location } = req.body;
      const validStatuses = [
        'Placed',
        'Confirmed',
        'Packed',
        'Shipped',
        'Out for Delivery',
        'Delivered',
        'Cancelled',
        'Returned',
      ];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, error: 'Invalid order status' });
      }

      await db
        .update(orders)
        .set({ orderStatus: status, updatedAt: new Date() })
        .where(eq(orders.id, orderId));

      // Append to shipment updates
      const shipList = await db
        .select()
        .from(shipments)
        .where(eq(shipments.orderId, orderId));

      if (shipList.length > 0) {
        const s = shipList[0];
        const timeline = s.statusUpdates ? JSON.parse(s.statusUpdates) : [];
        timeline.push({
          status,
          timestamp: new Date().toISOString(),
          location: location || 'Sanganer, Jaipur Hub',
          note: note || `Status updated to ${status} by admin staff`,
        });

        await db
          .update(shipments)
          .set({
            currentStatus: status,
            statusUpdates: JSON.stringify(timeline),
            updatedAt: new Date(),
          })
          .where(eq(shipments.id, s.id));
      }

      await logActivity(
        req.admin!.adminId,
        req.admin!.name,
        'UPDATE_ORDER_STATUS',
        'order',
        String(orderId),
        { newStatus: status, note }
      );

      res.json({ success: true, message: `Order status updated to ${status}` });
    } catch (err: unknown) {
      console.error('Update order status error:', err);
      res.status(500).json({ success: false, error: 'Failed to update order status' });
    }
  }
);

// Update Shipment Courier and Tracking Details
app.post(
  '/api/admin/orders/:id/shipment',
  requireAdminAuth(['super_admin', 'staff']),
  async (req: AdminAuthRequest, res: Response) => {
    try {
      const orderId = parseInt(req.params.id, 10);
      const { courierName, trackingNumber, trackingUrl, estimatedDelivery } = req.body;

      const existingShipment = await db
        .select()
        .from(shipments)
        .where(eq(shipments.orderId, orderId));

      if (existingShipment.length > 0) {
        const s = existingShipment[0];
        const timeline = s.statusUpdates ? JSON.parse(s.statusUpdates) : [];
        timeline.push({
          status: 'Shipped',
          timestamp: new Date().toISOString(),
          location: 'Dispatched from Sanganer, Jaipur',
          note: `Courier: ${courierName}, Tracking AWB: ${trackingNumber}`,
        });

        await db
          .update(shipments)
          .set({
            courierName: courierName || s.courierName,
            trackingNumber: trackingNumber || s.trackingNumber,
            trackingUrl: trackingUrl || s.trackingUrl,
            estimatedDelivery: estimatedDelivery || s.estimatedDelivery,
            currentStatus: 'Shipped',
            statusUpdates: JSON.stringify(timeline),
            updatedAt: new Date(),
          })
          .where(eq(shipments.id, s.id));

        await db
          .update(orders)
          .set({ orderStatus: 'Shipped', updatedAt: new Date() })
          .where(eq(orders.id, orderId));
      }

      await logActivity(
        req.admin!.adminId,
        req.admin!.name,
        'ADD_TRACKING_DETAILS',
        'shipment',
        String(orderId),
        { courierName, trackingNumber }
      );

      res.json({ success: true, message: 'Shipment and tracking details updated' });
    } catch (err: unknown) {
      console.error('Update shipment error:', err);
      res.status(500).json({ success: false, error: 'Failed to update tracking details' });
    }
  }
);

// Update Order Payment Status (Super Admin & Staff)
app.patch(
  '/api/admin/orders/:id/payment-status',
  requireAdminAuth(['super_admin', 'staff']),
  async (req: AdminAuthRequest, res: Response) => {
    try {
      const orderId = parseInt(req.params.id, 10);
      const { paymentStatus } = req.body;
      if (!['pending', 'paid', 'failed', 'refunded'].includes(paymentStatus)) {
        return res.status(400).json({ success: false, error: 'Invalid payment status' });
      }

      await db
        .update(orders)
        .set({ paymentStatus, updatedAt: new Date() })
        .where(eq(orders.id, orderId));

      await logActivity(
        req.admin!.adminId,
        req.admin!.name,
        'UPDATE_PAYMENT_STATUS',
        'order',
        String(orderId),
        { paymentStatus }
      );

      res.json({ success: true, message: `Payment status updated to ${paymentStatus}` });
    } catch (err: unknown) {
      console.error('Update payment status error:', err);
      res.status(500).json({ success: false, error: 'Failed to update payment status' });
    }
  }
);

// Refund Order (Super Admin Only)
app.post(
  '/api/admin/orders/:id/refund',
  requireAdminAuth(['super_admin']),
  async (req: AdminAuthRequest, res: Response) => {
    try {
      const orderId = parseInt(req.params.id, 10);
      const { amount, reason } = req.body;

      const foundOrder = await db.select().from(orders).where(eq(orders.id, orderId));
      if (foundOrder.length === 0) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }

      const orderData = foundOrder[0];
      const refundAmt = Number(amount) || orderData.totalAmount;
      const refundId = `ref_${Math.random().toString(36).substring(2, 12)}`;

      await db
        .update(payments)
        .set({
          status: 'refunded',
          refundId,
          refundAmount: refundAmt,
        })
        .where(eq(payments.orderId, orderId));

      await db
        .update(orders)
        .set({
          paymentStatus: 'refunded',
          orderStatus: 'Cancelled',
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      await logActivity(
        req.admin!.adminId,
        req.admin!.name,
        'REFUND_ORDER',
        'order',
        String(orderId),
        { refundAmount: refundAmt, reason, refundId }
      );

      res.json({
        success: true,
        message: `Refund of ₹${refundAmt} processed successfully.`,
        refundId,
      });
    } catch (err: unknown) {
      console.error('Refund order error:', err);
      res.status(500).json({ success: false, error: 'Failed to process refund' });
    }
  }
);

// 3. Products Management (CRUD + Images)
app.post(
  '/api/admin/products',
  requireAdminAuth(['super_admin', 'staff']),
  async (req: AdminAuthRequest, res: Response) => {
    try {
      const {
        name,
        category,
        price,
        originalPrice,
        discountPercent,
        sizes,
        stock,
        image,
        description,
        fabric,
        color,
        highlights,
        isNewArrival,
        isBestSeller,
        isFeatured,
        extraImages,
      } = req.body;

      if (!name || !price || !image) {
        return res.status(400).json({ success: false, error: 'Product name, price, and image are required' });
      }

      const slug =
        name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(100 + Math.random() * 900);

      const productPayload = {
        slug,
        name,
        category: category || 'Kurta Sets',
        price: Number(price),
        originalPrice: Number(originalPrice) || Number(price),
        discountPercent: Number(discountPercent) || 0,
        sizes: typeof sizes === 'string' ? sizes : JSON.stringify(sizes || ['S', 'M', 'L', 'XL']),
        stock: Number(stock) || 50,
        image,
        description: description || '',
        fabric: fabric || 'Cotton Blend',
        color: color || '',
        highlights:
          typeof highlights === 'string'
            ? highlights
            : JSON.stringify(highlights || ['Pure Fabric', 'Fast Delivery']),
        isNewArrival: Boolean(isNewArrival),
        isBestSeller: Boolean(isBestSeller),
        isFeatured: Boolean(isFeatured),
        isActive: true,
      };

      const newProd = await createProductRecord(
        productPayload,
        Array.isArray(extraImages) ? extraImages : []
      );

      await logActivity(
        req.admin!.adminId,
        req.admin!.name,
        'CREATE_PRODUCT',
        'product',
        String(newProd.id),
        { name, price }
      );

      res.json({ success: true, product: newProd });
    } catch (err: unknown) {
      console.error('Create product error:', err);
      res.status(500).json({ success: false, error: 'Failed to create product' });
    }
  }
);

app.put(
  '/api/admin/products/:id',
  requireAdminAuth(['super_admin', 'staff']),
  async (req: AdminAuthRequest, res: Response) => {
    try {
      const prodId = parseInt(req.params.id, 10);
      const {
        name,
        category,
        price,
        originalPrice,
        discountPercent,
        sizes,
        stock,
        image,
        description,
        fabric,
        color,
        highlights,
        isNewArrival,
        isBestSeller,
        isFeatured,
        isActive,
      } = req.body;

      const updatePayload: any = {};
      if (name !== undefined) updatePayload.name = name;
      if (category !== undefined) updatePayload.category = category;
      if (price !== undefined) updatePayload.price = Number(price);
      if (originalPrice !== undefined) updatePayload.originalPrice = Number(originalPrice);
      if (discountPercent !== undefined) updatePayload.discountPercent = Number(discountPercent);
      if (sizes !== undefined) updatePayload.sizes = typeof sizes === 'string' ? sizes : JSON.stringify(sizes);
      if (stock !== undefined) updatePayload.stock = Number(stock);
      if (image !== undefined) updatePayload.image = image;
      if (description !== undefined) updatePayload.description = description;
      if (fabric !== undefined) updatePayload.fabric = fabric;
      if (color !== undefined) updatePayload.color = color;
      if (highlights !== undefined) {
        updatePayload.highlights = typeof highlights === 'string' ? highlights : JSON.stringify(highlights);
      }
      if (isNewArrival !== undefined) updatePayload.isNewArrival = Boolean(isNewArrival);
      if (isBestSeller !== undefined) updatePayload.isBestSeller = Boolean(isBestSeller);
      if (isFeatured !== undefined) updatePayload.isFeatured = Boolean(isFeatured);
      if (isActive !== undefined) updatePayload.isActive = Boolean(isActive);

      const updated = await updateProductRecord(prodId, updatePayload);

      await logActivity(
        req.admin!.adminId,
        req.admin!.name,
        'UPDATE_PRODUCT',
        'product',
        String(prodId),
        { name, price }
      );

      res.json({ success: true, message: 'Product updated successfully', product: updated });
    } catch (err: unknown) {
      console.error('Update product error:', err);
      res.status(500).json({ success: false, error: 'Failed to update product' });
    }
  }
);

app.delete(
  '/api/admin/products/:id',
  requireAdminAuth(['super_admin', 'staff']),
  async (req: AdminAuthRequest, res: Response) => {
    try {
      const prodId = parseInt(req.params.id, 10);
      await deleteProductRecord(prodId);

      await logActivity(
        req.admin!.adminId,
        req.admin!.name,
        'DELETE_PRODUCT',
        'product',
        String(prodId)
      );

      res.json({ success: true, message: 'Product deleted successfully' });
    } catch (err: unknown) {
      console.error('Delete product error:', err);
      res.status(500).json({ success: false, error: 'Failed to delete product' });
    }
  }
);

// Product Image Management: Upload/Add, Delete, Set Main, Reorder
app.patch(
  '/api/admin/products/:id/image',
  requireAdminAuth(['super_admin', 'staff']),
  async (req: AdminAuthRequest, res: Response) => {
    try {
      const prodId = parseInt(req.params.id, 10);
      const { image } = req.body;
      if (!image) {
        return res.status(400).json({ success: false, error: 'Image URL or data is required' });
      }

      await updateProductRecord(prodId, { image });

      try {
        await db.update(productImages).set({ isMain: false }).where(eq(productImages.productId, prodId));
        await db.insert(productImages).values({
          productId: prodId,
          imageUrl: image,
          displayOrder: 0,
          isMain: true,
        });
      } catch (e) {
        console.warn('Syncing productImages table:', e);
      }

      await logActivity(
        req.admin!.adminId,
        req.admin!.name,
        'UPDATE_PRODUCT_IMAGE',
        'product',
        String(prodId),
        { image: image.slice(0, 100) }
      );

      res.json({ success: true, message: 'Product image updated successfully', image });
    } catch (err: unknown) {
      console.error('Update product image error:', err);
      res.status(500).json({ success: false, error: 'Failed to update image' });
    }
  }
);

app.post(
  '/api/admin/products/:id/images',
  requireAdminAuth(['super_admin', 'staff']),
  async (req: AdminAuthRequest, res: Response) => {
    try {
      const prodId = parseInt(req.params.id, 10);
      const { imageUrl, isMain } = req.body;
      if (!imageUrl) {
        return res.status(400).json({ success: false, error: 'Image URL is required' });
      }

      if (isMain) {
        await updateProductRecord(prodId, { image: imageUrl });
        try {
          await db
            .update(productImages)
            .set({ isMain: false })
            .where(eq(productImages.productId, prodId));
        } catch {}
      }

      const existingProd = localStore.getProductById(prodId);
      if (existingProd) {
        const curImages = existingProd.images || [existingProd.image];
        if (!curImages.includes(imageUrl)) {
          localStore.updateProduct(prodId, { images: [...curImages, imageUrl] });
        }
      }

      let insertedId = Date.now() % 100000;
      try {
        const inserted = await db
          .insert(productImages)
          .values({
            productId: prodId,
            imageUrl,
            displayOrder: Date.now() % 1000,
            isMain: Boolean(isMain),
          })
          .returning();
        insertedId = inserted[0]?.id || insertedId;
      } catch {}

      await logActivity(
        req.admin!.adminId,
        req.admin!.name,
        'ADD_PRODUCT_IMAGE',
        'product_image',
        String(insertedId)
      );

      res.json({
        success: true,
        image: { id: insertedId, productId: prodId, imageUrl, isMain: Boolean(isMain) },
      });
    } catch (err: unknown) {
      console.error('Add image error:', err);
      res.status(500).json({ success: false, error: 'Failed to add image' });
    }
  }
);

app.delete(
  '/api/admin/products/:id/images/:imageId',
  requireAdminAuth(['super_admin', 'staff']),
  async (req: AdminAuthRequest, res: Response) => {
    try {
      const prodId = parseInt(req.params.id, 10);
      const imgId = parseInt(req.params.imageId, 10);

      try {
        await db.delete(productImages).where(eq(productImages.id, imgId));
      } catch {}

      await logActivity(
        req.admin!.adminId,
        req.admin!.name,
        'DELETE_PRODUCT_IMAGE',
        'product_image',
        String(imgId)
      );

      res.json({ success: true, message: 'Image deleted' });
    } catch (err: unknown) {
      console.error('Delete image error:', err);
      res.status(500).json({ success: false, error: 'Failed to delete image' });
    }
  }
);

// 4. Hero Banners Management
app.get(
  '/api/admin/banners',
  requireAdminAuth(['super_admin', 'staff']),
  async (_req: AdminAuthRequest, res: Response) => {
    try {
      const list = await getAllBannersList();
      res.json({ success: true, banners: list });
    } catch (err: unknown) {
      console.error('Admin banners error:', err);
      res.json({ success: true, banners: localStore.getBanners() });
    }
  }
);

app.post(
  '/api/admin/banners',
  requireAdminAuth(['super_admin', 'staff']),
  async (req: AdminAuthRequest, res: Response) => {
    try {
      const { title, subtitle, imageUrl, ctaText, ctaLink, isActive } = req.body;
      let insertedBanner: any = null;
      try {
        const inserted = await db
          .insert(banners)
          .values({
            title,
            subtitle,
            imageUrl,
            ctaText,
            ctaLink,
            isActive: isActive !== undefined ? Boolean(isActive) : true,
            displayOrder: 1,
          })
          .returning();
        insertedBanner = inserted[0];
      } catch {
        insertedBanner = localStore.createBanner({
          title,
          subtitle,
          imageUrl,
          ctaText,
          ctaLink,
          isActive: isActive !== undefined ? Boolean(isActive) : true,
          displayOrder: 1,
        });
      }

      await logActivity(
        req.admin!.adminId,
        req.admin!.name,
        'CREATE_BANNER',
        'banner',
        String(insertedBanner.id)
      );

      res.json({ success: true, banner: insertedBanner });
    } catch (err: unknown) {
      console.error('Create banner error:', err);
      res.status(500).json({ success: false, error: 'Failed to create banner' });
    }
  }
);

app.delete(
  '/api/admin/banners/:id',
  requireAdminAuth(['super_admin', 'staff']),
  async (req: AdminAuthRequest, res: Response) => {
    try {
      const bannerId = parseInt(req.params.id, 10);
      await deleteBannerRecord(bannerId);

      await logActivity(
        req.admin!.adminId,
        req.admin!.name,
        'DELETE_BANNER',
        'banner',
        String(bannerId)
      );

      res.json({ success: true, message: 'Banner deleted' });
    } catch (err: unknown) {
      console.error('Delete banner error:', err);
      res.status(500).json({ success: false, error: 'Failed to delete banner' });
    }
  }
);

app.put(
  '/api/admin/banners/:id',
  requireAdminAuth(['super_admin', 'staff']),
  async (req: AdminAuthRequest, res: Response) => {
    try {
      const bannerId = parseInt(req.params.id, 10);
      const { title, subtitle, imageUrl, ctaText, ctaLink, isActive, displayOrder } = req.body;

      try {
        await db
          .update(banners)
          .set({
            ...(title !== undefined ? { title } : {}),
            ...(subtitle !== undefined ? { subtitle } : {}),
            ...(imageUrl !== undefined ? { imageUrl } : {}),
            ...(ctaText !== undefined ? { ctaText } : {}),
            ...(ctaLink !== undefined ? { ctaLink } : {}),
            ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
            ...(displayOrder !== undefined ? { displayOrder: Number(displayOrder) } : {}),
          })
          .where(eq(banners.id, bannerId));
      } catch {}

      res.json({ success: true, message: 'Banner updated' });
    } catch (err: unknown) {
      console.error('Update banner error:', err);
      res.status(500).json({ success: false, error: 'Failed to update banner' });
    }
  }
);

// 5. Customers List & Order History
app.get(
  '/api/admin/customers',
  requireAdminAuth(['super_admin']),
  async (_req: AdminAuthRequest, res: Response) => {
    try {
      const orderList = await getOrdersList();
      let userList: any[] = [];
      try {
        userList = await db.select().from(users).orderBy(desc(users.id));
      } catch {
        userList = [];
      }

      const phoneMap = new Map<string, any>();
      for (const u of userList) {
        phoneMap.set(u.phone, {
          ...u,
          ordersCount: 0,
          totalSpent: 0,
          lastOrderDate: null,
        });
      }

      for (const o of orderList) {
        if (!phoneMap.has(o.customerPhone)) {
          phoneMap.set(o.customerPhone, {
            id: phoneMap.size + 1,
            name: o.customerName,
            phone: o.customerPhone,
            email: o.customerEmail || '',
            ordersCount: 1,
            totalSpent: o.paymentStatus === 'paid' ? o.totalAmount : 0,
            lastOrderDate: o.createdAt,
          });
        } else {
          const c = phoneMap.get(o.customerPhone);
          c.ordersCount += 1;
          if (o.paymentStatus === 'paid') {
            c.totalSpent += o.totalAmount;
          }
          if (!c.lastOrderDate || new Date(o.createdAt) > new Date(c.lastOrderDate)) {
            c.lastOrderDate = o.createdAt;
          }
        }
      }

      res.json({ success: true, customers: Array.from(phoneMap.values()) });
    } catch (err: unknown) {
      console.error('Admin customers error:', err);
      res.json({ success: true, customers: [] });
    }
  }
);

// 6. Coupons Management
app.get(
  '/api/admin/coupons',
  requireAdminAuth(['super_admin']),
  async (_req: AdminAuthRequest, res: Response) => {
    try {
      const list = await getCouponsList();
      res.json({ success: true, coupons: list });
    } catch (err: unknown) {
      console.error('Admin coupons error:', err);
      res.json({ success: true, coupons: localStore.getCoupons() });
    }
  }
);

app.post(
  '/api/admin/coupons',
  requireAdminAuth(['super_admin']),
  async (req: AdminAuthRequest, res: Response) => {
    try {
      const { code, discountType, discountValue, minOrderAmount, maxDiscount, isActive } =
        req.body;

      const createdCoupon = await createCouponRecord({
        code: String(code).toUpperCase().trim(),
        discountType: discountType || 'percent',
        discountValue: Number(discountValue),
        minOrderAmount: Number(minOrderAmount) || 0,
        maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      });

      await logActivity(
        req.admin!.adminId,
        req.admin!.name,
        'CREATE_COUPON',
        'coupon',
        String(createdCoupon.id)
      );

      res.json({ success: true, coupon: createdCoupon });
    } catch (err: unknown) {
      console.error('Create coupon error:', err);
      res.status(500).json({ success: false, error: 'Failed to create coupon' });
    }
  }
);

app.delete(
  '/api/admin/coupons/:id',
  requireAdminAuth(['super_admin']),
  async (req: AdminAuthRequest, res: Response) => {
    try {
      const couponId = parseInt(req.params.id, 10);
      await deleteCouponRecord(couponId);

      await logActivity(
        req.admin!.adminId,
        req.admin!.name,
        'DELETE_COUPON',
        'coupon',
        String(couponId)
      );

      res.json({ success: true, message: 'Coupon deleted' });
    } catch (err: unknown) {
      console.error('Delete coupon error:', err);
      res.status(500).json({ success: false, error: 'Failed to delete coupon' });
    }
  }
);

app.put(
  '/api/admin/coupons/:id',
  requireAdminAuth(['super_admin']),
  async (req: AdminAuthRequest, res: Response) => {
    try {
      const couponId = parseInt(req.params.id, 10);
      const { code, discountType, discountValue, minOrderAmount, maxDiscount, isActive } = req.body;

      const updated = await updateCouponRecord(couponId, {
        ...(code ? { code: String(code).toUpperCase().trim() } : {}),
        ...(discountType ? { discountType } : {}),
        ...(discountValue !== undefined ? { discountValue: Number(discountValue) } : {}),
        ...(minOrderAmount !== undefined ? { minOrderAmount: Number(minOrderAmount) } : {}),
        ...(maxDiscount !== undefined ? { maxDiscount: Number(maxDiscount) } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
      });

      res.json({ success: true, coupon: updated });
    } catch (err: unknown) {
      console.error('Update coupon error:', err);
      res.status(500).json({ success: false, error: 'Failed to update coupon' });
    }
  }
);

// 7. Sales Reports (Super Admin Only)
app.get(
  '/api/admin/reports/sales',
  requireAdminAuth(['super_admin']),
  async (_req: AdminAuthRequest, res: Response) => {
    try {
      const allOrders = await getOrdersList();
      let allItems: any[] = [];
      try {
        allItems = await db.select().from(orderItems);
      } catch {
        allItems = allOrders.flatMap((o: any) => o.items || []);
      }

      // Group sales by date
      const salesByDate: Record<string, { date: string; orders: number; revenue: number }> = {};
      for (const o of allOrders) {
        if (o.createdAt) {
          const d = new Date(o.createdAt).toISOString().split('T')[0];
          if (!salesByDate[d]) {
            salesByDate[d] = { date: d, orders: 0, revenue: 0 };
          }
          salesByDate[d].orders += 1;
          if (o.paymentStatus === 'paid') {
            salesByDate[d].revenue += o.totalAmount;
          }
        }
      }

      // Group sales by product
      const salesByProduct: Record<
        string,
        { productName: string; quantity: number; revenue: number }
      > = {};
      for (const item of allItems) {
        if (item && item.productName) {
          if (!salesByProduct[item.productName]) {
            salesByProduct[item.productName] = {
              productName: item.productName,
              quantity: 0,
              revenue: 0,
            };
          }
          salesByProduct[item.productName].quantity += (item.quantity || 1);
          salesByProduct[item.productName].revenue += (item.totalPrice || item.unitPrice || 0);
        }
      }

      res.json({
        success: true,
        dailySales: Object.values(salesByDate).sort((a, b) => b.date.localeCompare(a.date)),
        productSales: Object.values(salesByProduct).sort((a, b) => b.revenue - a.revenue),
      });
    } catch (err: unknown) {
      console.error('Sales reports error:', err);
      res.json({
        success: true,
        dailySales: [],
        productSales: [],
      });
    }
  }
);

// 8. Staff Accounts Management (Super Admin Only)
app.get(
  '/api/admin/staff',
  requireAdminAuth(['super_admin']),
  async (_req: AdminAuthRequest, res: Response) => {
    try {
      const staffList = await getAdminsList();
      res.json({
        success: true,
        staff: staffList.map((a) => ({
          id: a.id,
          adminId: a.adminId,
          email: a.email,
          phone: a.phone,
          name: a.name,
          role: a.role,
          isActive: a.isActive,
          mustChangePassword: a.mustChangePassword,
          lastLoginAt: (a as any).lastLoginAt || null,
          createdAt: a.createdAt,
        })),
      });
    } catch (err: unknown) {
      console.error('Staff list error:', err);
      res.json({ success: true, staff: localStore.getAdmins() });
    }
  }
);

app.post(
  '/api/admin/staff',
  requireAdminAuth(['super_admin']),
  async (req: AdminAuthRequest, res: Response) => {
    const clientIp = getClientIp(req);
    try {
      const { name, email, phone, role, temporaryPassword } = req.body;
      const cleanEmail = String(email || '').toLowerCase().trim();
      const cleanName = String(name || '').trim();

      if (!cleanEmail || !cleanName) {
        return res.status(400).json({ success: false, error: 'Staff name aur email dono zaroori hain' });
      }

      // Check if email already exists
      const existing = await db
        .select()
        .from(admins)
        .where(or(eq(admins.email, cleanEmail), eq(admins.adminId, cleanEmail)));

      if (existing.length > 0) {
        return res.status(400).json({ success: false, error: 'Ye email address pehle se registered hai' });
      }

      // Generate 24-hour invite token
      const rawInviteToken = crypto.randomBytes(32).toString('hex');
      const inviteHash = crypto.createHash('sha256').update(rawInviteToken).digest('hex');
      const inviteExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Generate initial password hash
      const initialPass = temporaryPassword || crypto.randomBytes(16).toString('base64');
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(initialPass, salt);

      const inserted = await db
        .insert(admins)
        .values({
          adminId: cleanEmail,
          email: cleanEmail,
          phone: phone ? String(phone).trim() : null,
          passwordHash,
          name: cleanName,
          role: role === 'super_admin' ? 'super_admin' : 'staff',
          isActive: true,
          mustChangePassword: true,
          failedAttempts: 0,
          inviteToken: inviteHash,
          inviteTokenExpiry: inviteExpiry,
        })
        .returning();

      const host = req.get('host') || 'localhost:3000';
      const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
      const appUrl = process.env.APP_URL || `${protocol}://${host}`;
      const inviteLink = `${appUrl}/admin?action=set-password&token=${rawInviteToken}`;

      // Dispatch invite email
      await sendStaffInviteEmail(cleanEmail, cleanName, inviteLink, role === 'super_admin' ? 'Super Admin' : 'Staff');

      await logActivity(
        req.admin!.adminId,
        req.admin!.name,
        'CREATE_STAFF_ACCOUNT',
        'admin',
        String(inserted[0].id),
        { email: cleanEmail, name: cleanName, role },
        clientIp,
        req.admin!.email || req.admin!.adminId
      );

      res.json({
        success: true,
        staff: {
          id: inserted[0].id,
          adminId: inserted[0].adminId,
          email: inserted[0].email,
          phone: inserted[0].phone,
          name: inserted[0].name,
          role: inserted[0].role,
          isActive: inserted[0].isActive,
          mustChangePassword: inserted[0].mustChangePassword,
          createdAt: inserted[0].createdAt,
        },
        inviteLink,
        message: 'Staff account successfully created! Invite link sent (valid for 24 hours).',
      });
    } catch (err: unknown) {
      console.error('Create staff error:', err);
      res.status(500).json({ success: false, error: 'Failed to create staff account' });
    }
  }
);

app.patch(
  '/api/admin/staff/:id',
  requireAdminAuth(['super_admin']),
  async (req: AdminAuthRequest, res: Response) => {
    const clientIp = getClientIp(req);
    try {
      const staffId = parseInt(req.params.id, 10);
      const { name, phone, role, isActive, resendInvite, resetPassword } = req.body;

      const found = await db.select().from(admins).where(eq(admins.id, staffId));
      if (found.length === 0) {
        return res.status(404).json({ success: false, error: 'Staff account not found' });
      }

      const targetStaff = found[0];

      // Prevent disabling or demoting self
      if (staffId === req.admin!.id) {
        if (isActive === false) {
          return res.status(400).json({ success: false, error: 'Aap apna khud ka super admin account disable nahi kar sakte' });
        }
        if (role && role !== 'super_admin') {
          return res.status(400).json({ success: false, error: 'Aap apna role change nahi kar sakte' });
        }
      }

      const updateData: Record<string, unknown> = {};
      if (name) updateData.name = String(name).trim();
      if (phone !== undefined) updateData.phone = phone ? String(phone).trim() : null;
      if (role && ['super_admin', 'staff'].includes(role)) updateData.role = role;
      if (isActive !== undefined) updateData.isActive = Boolean(isActive);

      let inviteLink: string | null = null;

      // Resend 24-hour invite link or trigger password reset
      if (resendInvite || resetPassword) {
        const rawInviteToken = crypto.randomBytes(32).toString('hex');
        const inviteHash = crypto.createHash('sha256').update(rawInviteToken).digest('hex');
        const inviteExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

        updateData.inviteToken = inviteHash;
        updateData.inviteTokenExpiry = inviteExpiry;
        updateData.mustChangePassword = true;
        updateData.failedAttempts = 0;
        updateData.lockedUntil = null;

        const host = req.get('host') || 'localhost:3000';
        const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
        const appUrl = process.env.APP_URL || `${protocol}://${host}`;
        inviteLink = `${appUrl}/admin?action=set-password&token=${rawInviteToken}`;

        if (targetStaff.email) {
          await sendStaffInviteEmail(
            targetStaff.email,
            targetStaff.name,
            inviteLink,
            targetStaff.role === 'super_admin' ? 'Super Admin' : 'Staff'
          );
        }
      }

      const updated = await db
        .update(admins)
        .set(updateData)
        .where(eq(admins.id, staffId))
        .returning();

      await logActivity(
        req.admin!.adminId,
        req.admin!.name,
        'UPDATE_STAFF_ACCOUNT',
        'admin',
        String(staffId),
        { changes: updateData, resendInvite: Boolean(resendInvite) },
        clientIp,
        req.admin!.email || req.admin!.adminId
      );

      res.json({
        success: true,
        staff: updated[0],
        inviteLink,
        message: 'Staff account updated successfully',
      });
    } catch (err: unknown) {
      console.error('Update staff error:', err);
      res.status(500).json({ success: false, error: 'Failed to update staff account' });
    }
  }
);

app.delete(
  '/api/admin/staff/:id',
  requireAdminAuth(['super_admin']),
  async (req: AdminAuthRequest, res: Response) => {
    const clientIp = getClientIp(req);
    try {
      const staffId = parseInt(req.params.id, 10);
      if (staffId === req.admin!.id) {
        return res.status(400).json({ success: false, error: 'Cannot delete your own admin account' });
      }

      const found = await db.select().from(admins).where(eq(admins.id, staffId));
      if (found.length === 0) {
        return res.status(404).json({ success: false, error: 'Staff account not found' });
      }

      await db.delete(admins).where(eq(admins.id, staffId));
      await logActivity(
        req.admin!.adminId,
        req.admin!.name,
        'DELETE_STAFF_ACCOUNT',
        'admin',
        String(staffId),
        { targetEmail: found[0].email, targetName: found[0].name },
        clientIp,
        req.admin!.email || req.admin!.adminId
      );

      res.json({ success: true, message: 'Staff account removed successfully' });
    } catch (err: unknown) {
      console.error('Delete staff error:', err);
      res.status(500).json({ success: false, error: 'Failed to delete staff account' });
    }
  }
);

// 9. Site Settings Management (Super Admin & Staff)
app.get(
  '/api/admin/settings',
  requireAdminAuth(['super_admin', 'staff']),
  async (_req: AdminAuthRequest, res: Response) => {
    try {
      const map = await getSettingsMap();
      res.json({ success: true, settings: map });
    } catch (err: unknown) {
      console.error('Get admin settings error:', err);
      res.status(500).json({ success: false, error: 'Failed to get settings' });
    }
  }
);

app.put(
  '/api/admin/settings',
  requireAdminAuth(['super_admin', 'staff']),
  async (req: AdminAuthRequest, res: Response) => {
    const clientIp = getClientIp(req);
    try {
      const settingsMap = req.body as Record<string, string>;
      for (const [key, val] of Object.entries(settingsMap)) {
        await saveSetting(key, String(val));
      }

      await logActivity(
        req.admin!.adminId,
        req.admin!.name,
        'UPDATE_SETTINGS',
        'settings',
        undefined,
        { keysUpdated: Object.keys(settingsMap) },
        clientIp,
        req.admin!.email || req.admin!.adminId
      );

      res.json({ success: true, message: 'Settings updated successfully' });
    } catch (err: unknown) {
      console.error('Update settings error:', err);
      res.status(500).json({ success: false, error: 'Failed to update settings' });
    }
  }
);

// 10. Activity Log Audit Trail (Super Admin Only)
app.get(
  '/api/admin/activity-logs',
  requireAdminAuth(['super_admin']),
  async (_req: AdminAuthRequest, res: Response) => {
    try {
      const logs = await getActivityLogsList();
      res.json({ success: true, logs });
    } catch (err: unknown) {
      console.error('Activity logs error:', err);
      res.status(500).json({ success: false, error: 'Failed to load activity logs' });
    }
  }
);

// 11. Razorpay Webhook (Handles payment.captured, order.paid, payment.failed)
app.post('/api/razorpay/webhook', async (req: Request, res: Response) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const webhookSignature = req.headers['x-razorpay-signature'] as string;

    if (webhookSecret && webhookSignature) {
      const shasum = crypto.createHmac('sha256', webhookSecret);
      shasum.update(JSON.stringify(req.body));
      const digest = shasum.digest('hex');

      if (digest !== webhookSignature) {
        return res.status(400).json({ status: 'invalid signature' });
      }
    }

    const event = req.body.event;
    const payload = req.body.payload;

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload?.payment?.entity;
      const rzpOrderId = paymentEntity?.order_id;
      const rzpPaymentId = paymentEntity?.id;

      if (rzpOrderId) {
        const foundPayment = await db
          .select()
          .from(payments)
          .where(eq(payments.razorpayOrderId, rzpOrderId));

        if (foundPayment.length > 0) {
          const orderId = foundPayment[0].orderId;

          await db
            .update(payments)
            .set({
              razorpayPaymentId: rzpPaymentId,
              status: 'captured',
            })
            .where(eq(payments.id, foundPayment[0].id));

          await db
            .update(orders)
            .set({
              paymentStatus: 'paid',
              orderStatus: 'Confirmed',
              updatedAt: new Date(),
            })
            .where(eq(orders.id, orderId));

          const shipList = await db
            .select()
            .from(shipments)
            .where(eq(shipments.orderId, orderId));

          if (shipList.length > 0) {
            const s = shipList[0];
            const timeline = s.statusUpdates ? JSON.parse(s.statusUpdates) : [];
            timeline.push({
              status: 'Confirmed',
              timestamp: new Date().toISOString(),
              location: 'SS VASTRA, Sanganer, Jaipur',
              note: 'Payment captured via Razorpay Webhook. Ready for packaging.',
            });
            await db
              .update(shipments)
              .set({
                currentStatus: 'Confirmed',
                statusUpdates: JSON.stringify(timeline),
                updatedAt: new Date(),
              })
              .where(eq(shipments.id, s.id));
          }
        }
      }
    }

    res.json({ status: 'ok' });
  } catch (err: unknown) {
    console.error('Razorpay webhook error:', err);
    res.status(500).json({ status: 'error' });
  }
});

// 12. Customer Orders Lookup by Phone or Email
app.get('/api/customer/orders', async (req: Request, res: Response) => {
  try {
    const { phone, email } = req.query;
    if (!phone && !email) {
      return res.status(400).json({ success: false, error: 'Phone number or email is required' });
    }

    const cleanPhone = phone ? String(phone).replace(/\D/g, '').slice(-10) : '';
    const cleanEmail = email ? String(email).toLowerCase().trim() : '';

    const allOrders = await db.select().from(orders).orderBy(desc(orders.id));
    const matching = allOrders.filter((o) => {
      const matchPhone = cleanPhone && o.customerPhone.replace(/\D/g, '').includes(cleanPhone);
      const matchEmail = cleanEmail && o.customerEmail && o.customerEmail.toLowerCase().trim() === cleanEmail;
      return matchPhone || matchEmail;
    });

    const detailedOrders = await Promise.all(
      matching.map(async (ord) => {
        const items = await db.select().from(orderItems).where(eq(orderItems.orderId, ord.id));
        const ship = await db.select().from(shipments).where(eq(shipments.orderId, ord.id));
        return {
          ...ord,
          items,
          shipment: ship[0] || null,
        };
      })
    );

    res.json({ success: true, orders: detailedOrders });
  } catch (err: unknown) {
    console.error('Customer orders lookup error:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve orders' });
  }
});

// 13. Category Update (Images and Details for Super Admin and Staff)
app.put(
  '/api/admin/categories/:id',
  requireAdminAuth(['super_admin', 'staff']),
  async (req: AdminAuthRequest, res: Response) => {
    try {
      const catId = parseInt(req.params.id, 10);
      const { name, image, description } = req.body;

      const updated = await updateCategoryRecord(catId, {
        ...(name !== undefined ? { name } : {}),
        ...(image !== undefined ? { image } : {}),
        ...(description !== undefined ? { description } : {}),
      });

      await logActivity(
        req.admin!.adminId,
        req.admin!.name,
        'UPDATE_CATEGORY',
        'category',
        String(catId),
        { name, image }
      );

      res.json({ success: true, message: 'Category updated successfully', category: updated });
    } catch (err: unknown) {
      console.error('Update category error:', err);
      res.status(500).json({ success: false, error: 'Failed to update category' });
    }
  }
);


/* ==========================================================================
   SERVER INITIALIZATION & VITE MIDDLEWARE INTEGRATION
   ========================================================================== */

async function startServer() {
  // Seed database with initial products, super admin, categories, coupons, settings
  await seedDatabase();

  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SS VASTRA Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

// Start server in persistent Node/Express environments
if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
  });
}

export default app;
export { app };
