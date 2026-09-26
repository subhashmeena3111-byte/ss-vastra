export interface Product {
  id: number;
  slug: string;
  name: string;
  category: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  sizes: string[];
  stock: number;
  image: string;
  gallery?: string[];
  description: string;
  fabric?: string;
  color?: string;
  highlights?: string[];
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isFeatured?: boolean;
  isActive?: boolean;
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  icon?: string;
  image?: string;
  description?: string;
  displayOrder?: number;
}

export interface Banner {
  id: number;
  title: string;
  subtitle?: string;
  imageUrl: string;
  ctaText?: string;
  ctaLink?: string;
  badge?: string;
  displayOrder?: number;
  isActive: boolean;
  createdAt?: string;
}

export interface CartItem {
  product: Product;
  size: string;
  quantity: number;
}

export interface ShipmentUpdate {
  status: string;
  timestamp: string;
  location: string;
  note: string;
}

export interface Shipment {
  id: number;
  orderId: number;
  courierName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  currentStatus: string;
  statusUpdates?: ShipmentUpdate[];
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  productImage?: string;
  size: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: string;
  city: string;
  state: string;
  pincode: string;
  totalAmount: number;
  discountAmount: number;
  couponCode?: string;
  paymentMethod: 'razorpay' | 'cod' | 'upi' | 'bank_transfer' | string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  orderStatus:
    | 'Placed'
    | 'Confirmed'
    | 'Packed'
    | 'Shipped'
    | 'Out for Delivery'
    | 'Delivered'
    | 'Cancelled'
    | 'Returned';
  notes?: string;
  trackingNumber?: string;
  courierName?: string;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
  shipment?: Shipment;
}

export interface Coupon {
  id: number;
  code: string;
  discountType: 'percent' | 'flat';
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
  isActive: boolean;
  expiryDate?: string;
}

export interface AdminUser {
  id: number;
  adminId: string;
  email?: string;
  phone?: string | null;
  name: string;
  role: 'super_admin' | 'staff';
  isActive?: boolean;
  mustChangePassword?: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
}

export interface ActivityLog {
  id: number;
  adminId: string;
  adminName?: string;
  userEmail?: string;
  action: string;
  entity: string;
  entityId?: string;
  ipAddress?: string;
  details?: string;
  createdAt: string;
}

export interface StoreSettings {
  store_name?: string;
  tagline?: string;
  category?: string;
  address?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  instagram?: string;
  cod_enabled?: string;
  shipping_fee?: string;
  free_shipping_threshold?: string;
  razorpay_key_id?: string;
  [key: string]: string | undefined;
}

export interface DeliveryPartner {
  id: string;
  name: string;
  trackingUrlTemplate: string;
  estimatedDays: string;
  phone?: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface PaymentGateway {
  id: string;
  name: string;
  provider: 'razorpay' | 'phonepe' | 'cashfree' | 'paytm' | 'payu' | 'stripe' | 'custom';
  keyId: string;
  keySecret?: string;
  webhookSecret?: string;
  mode: 'test' | 'live';
  isActive: boolean;
  isDefault: boolean;
  instructions?: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  ifsc: string;
  accountType: 'Current Account' | 'Savings Account';
  branch?: string;
  upiId?: string;
  instructions?: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface UpiAccount {
  id: string;
  title: string;
  upiId: string;
  payeeName: string;
  phone?: string;
  qrImageUrl?: string;
  isDefault: boolean;
  isActive: boolean;
}
