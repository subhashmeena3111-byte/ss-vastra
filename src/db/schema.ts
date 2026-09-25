import { pgTable, serial, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. Users table (Customer accounts linked with Firebase Auth or Guest)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase UID or guest session token
  email: text('email'),
  phone: text('phone'),
  name: text('name'),
  role: text('role').notNull().default('customer'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 2. Admins table (Super Admin & Staff with bcrypt hash and lockouts)
export const admins = pgTable('admins', {
  id: serial('id').primaryKey(),
  adminId: text('admin_id').notNull().unique(),
  email: text('email'),
  phone: text('phone'),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull().default('staff'), // 'super_admin' or 'staff'
  isActive: boolean('is_active').default(true),
  mustChangePassword: boolean('must_change_password').default(false),
  failedAttempts: integer('failed_attempts').default(0),
  lockedUntil: timestamp('locked_until'),
  resetToken: text('reset_token'),
  resetTokenExpiry: timestamp('reset_token_expiry'),
  inviteToken: text('invite_token'),
  inviteTokenExpiry: timestamp('invite_token_expiry'),
  otpCode: text('otp_code'),
  otpExpiry: timestamp('otp_expiry'),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 3. Roles & Permissions table
export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(), // 'super_admin', 'staff'
  permissions: text('permissions').notNull(), // JSON string array of permissions
});

// 4. Categories table
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  icon: text('icon'),
  image: text('image'),
  description: text('description'),
  displayOrder: integer('display_order').default(0),
});

// 5. Products table
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  price: integer('price').notNull(),
  originalPrice: integer('original_price').notNull(),
  discountPercent: integer('discount_percent').notNull().default(0),
  sizes: text('sizes').notNull(), // JSON string array e.g. ["XS","S","M","L","XL","XXL","3XL"]
  stock: integer('stock').notNull().default(50),
  image: text('image').notNull(),
  description: text('description').notNull(),
  fabric: text('fabric'),
  color: text('color'),
  highlights: text('highlights'), // JSON string array
  isNewArrival: boolean('is_new_arrival').default(false),
  isBestSeller: boolean('is_best_seller').default(false),
  isFeatured: boolean('is_featured').default(false),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// 6. Product Images table (Multi-image, reorderable, main image flag)
export const productImages = pgTable('product_images', {
  id: serial('id').primaryKey(),
  productId: integer('product_id')
    .references(() => products.id, { onDelete: 'cascade' })
    .notNull(),
  imageUrl: text('image_url').notNull(),
  displayOrder: integer('display_order').default(0),
  isMain: boolean('is_main').default(false),
});

// 7. Orders table
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(),
  userId: integer('user_id').references(() => users.id),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone').notNull(),
  customerEmail: text('customer_email'),
  shippingAddress: text('shipping_address').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  pincode: text('pincode').notNull(),
  totalAmount: integer('total_amount').notNull(),
  discountAmount: integer('discount_amount').default(0),
  couponCode: text('coupon_code'),
  paymentMethod: text('payment_method').notNull(), // 'razorpay', 'cod'
  paymentStatus: text('payment_status').notNull().default('pending'), // 'pending', 'paid', 'failed', 'refunded'
  orderStatus: text('order_status').notNull().default('Placed'), // Placed, Confirmed, Packed, Shipped, Out for Delivery, Delivered, Cancelled, Returned
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 8. Order Items table
export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .references(() => orders.id, { onDelete: 'cascade' })
    .notNull(),
  productId: integer('product_id').references(() => products.id),
  productName: text('product_name').notNull(),
  productImage: text('product_image'),
  size: text('size').notNull(),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: integer('unit_price').notNull(),
  totalPrice: integer('total_price').notNull(),
});

// 9. Payments table (Razorpay verification, signatures, and refunds)
export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .references(() => orders.id, { onDelete: 'cascade' })
    .notNull(),
  razorpayOrderId: text('razorpay_order_id'),
  razorpayPaymentId: text('razorpay_payment_id'),
  razorpaySignature: text('razorpay_signature'),
  amount: integer('amount').notNull(),
  currency: text('currency').default('INR'),
  status: text('status').notNull().default('created'), // 'created', 'authorized', 'captured', 'failed', 'refunded'
  refundId: text('refund_id'),
  refundAmount: integer('refund_amount'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 10. Shipments & Delivery Tracking table
export const shipments = pgTable('shipments', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .references(() => orders.id, { onDelete: 'cascade' })
    .notNull(),
  courierName: text('courier_name'),
  trackingNumber: text('tracking_number'),
  trackingUrl: text('tracking_url'),
  estimatedDelivery: text('estimated_delivery'),
  currentStatus: text('current_status').notNull().default('Placed'),
  statusUpdates: text('status_updates'), // JSON array of timeline steps: [{ status, timestamp, location, note }]
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 11. Coupons table
export const coupons = pgTable('coupons', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  discountType: text('discount_type').notNull().default('percent'), // 'percent' or 'flat'
  discountValue: integer('discount_value').notNull(),
  minOrderAmount: integer('min_order_amount').default(0),
  maxDiscount: integer('max_discount'),
  isActive: boolean('is_active').default(true),
  expiryDate: text('expiry_date'),
});

// 12. Banners table (Hero banners & category promotions)
export const banners = pgTable('banners', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  imageUrl: text('image_url').notNull(),
  ctaText: text('cta_text'),
  ctaLink: text('cta_link'),
  isActive: boolean('is_active').default(true),
  displayOrder: integer('display_order').default(0),
});

// 13. Activity Logs table (Audit trail: who changed what and when)
export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  adminId: text('admin_id').notNull(),
  adminName: text('admin_name'),
  userEmail: text('user_email'),
  action: text('action').notNull(), // 'LOGIN', 'LOGOUT', 'FAILED_LOGIN', 'CREATE_PRODUCT', etc.
  entity: text('entity').notNull(),
  entityId: text('entity_id'),
  ipAddress: text('ip_address'),
  details: text('details'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 14. Settings table (Store config, COD toggle, shipping charges, contact info)
export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  description: text('description'),
});

// Relationships
export const productsRelations = relations(products, ({ many }) => ({
  images: many(productImages),
  orderItems: many(orderItems),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
  payment: many(payments),
  shipment: many(shipments),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));
