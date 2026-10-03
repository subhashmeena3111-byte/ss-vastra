import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Lock,
  User,
  ShieldCheck,
  ShieldAlert,
  Package,
  ShoppingBag,
  Users,
  Tag,
  BarChart3,
  Settings as SettingsIcon,
  FileText,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Truck,
  RotateCcw,
  LogOut,
  RefreshCw,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  Phone,
  Copy,
  Check,
  Clock,
  UserCheck,
  UserX,
  ExternalLink,
  Receipt,
  Download,
  Image as ImageIcon,
  HardDrive,
  Loader2,
  CloudUpload,
  Upload,
  Camera,
  Link as LinkIcon,
  Share2,
  CreditCard,
  Landmark,
  QrCode,
  Building,
  Smartphone,
  Database,
  Edit,
  Edit3,
  Activity,
  Globe,
  LogIn,
  UserPlus,
  Printer,
  SlidersHorizontal,
  Save,
  FileEdit,
  Undo2,
  Film,
  Video,
  Palette,
  MessageSquare,
  Sparkles,
  MessageCircle,
} from 'lucide-react';
import {
  AdminUser,
  Order,
  Product,
  Coupon,
  ActivityLog,
  DeliveryPartner,
  PaymentGateway,
  BankAccount,
  UpiAccount,
  VideoReel,
} from '../types.ts';
import { AdminInvoiceModal } from './AdminInvoiceModal.tsx';
import { AdminCatalogImages } from './AdminCatalogImages.tsx';
import { AdminDataManager } from './AdminDataManager.tsx';
import { DeepLinkModal } from './DeepLinkModal.tsx';
import { uploadImageToDrive, ensureDriveAuth, getAccessToken } from '../utils/imageUpload.ts';
import { normalizeProductImageUrl, getDriveThumbnailUrl, isGoogleDriveUrl, normalizeVideoUrl, extractDriveFileId } from '../utils/imageUtils.ts';
import { sanitizeProduct, sanitizeProductList } from '../utils/productUtils.ts';
import { getDefaultProducts } from '../data/defaultProducts.ts';

interface AdminPortalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductsUpdated?: () => void;
  initialProducts?: Product[];
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  isOpen,
  onClose,
  onProductsUpdated,
  initialProducts = [],
}) => {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('ss_vastra_admin_token');
    } catch {
      return null;
    }
  });
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(() => {
    try {
      const saved = localStorage.getItem('ss_vastra_admin_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Active Tab: dashboard, orders, products, customers, coupons, reports, staff, settings, activity
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Deep Link & QR Modal State
  const [showDeepLinkModal, setShowDeepLinkModal] = useState<boolean>(false);
  const [selectedDeepLinkProduct, setSelectedDeepLinkProduct] = useState<Product | null>(null);

  // Auth Views: 'login' | 'forgot_password' | 'reset_password' | 'set_staff_password'
  const [authView, setAuthView] = useState<
    'login' | 'forgot_password' | 'reset_password' | 'set_staff_password'
  >('login');

  // Demo Data Enabled Flag (default false in production, enabled only via env)
  const isDemoEnabled =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ENABLE_DEMO === 'true') ||
    (typeof process !== 'undefined' && (process.env?.NEXT_PUBLIC_ENABLE_DEMO === 'true' || process.env?.VITE_ENABLE_DEMO === 'true'));

  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [requireOtp, setRequireOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpMessage, setOtpMessage] = useState<string | null>(null);

  // Forgot Password States
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isSendingForgot, setIsSendingForgot] = useState(false);

  // Reset Password & Staff Invite States
  const [resetTokenParam, setResetTokenParam] = useState('');
  const [newResetPassword, setNewResetPassword] = useState('');
  const [confirmResetPassword, setConfirmResetPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetStatus, setResetStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Force Change Password on First Login
  const [mustChangePass, setMustChangePass] = useState(false);
  const [forceNewPassword, setForceNewPassword] = useState('');
  const [forceConfirmPassword, setForceConfirmPassword] = useState('');
  const [showForcePassword, setShowForcePassword] = useState(false);
  const [forcePassError, setForcePassError] = useState<string | null>(null);
  const [isForceSaving, setIsForceSaving] = useState(false);

  // Session Inactivity Warning / Notice
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);

  // Data states
  const [dashboardMetrics, setDashboardMetrics] = useState<Record<string, unknown> | null>(null);
  const [ordersList, setOrdersList] = useState<Order[]>([]);
  const [productsList, setProductsList] = useState<Product[]>(() => initialProducts || []);

  useEffect(() => {
    if (initialProducts && initialProducts.length > 0 && productsList.length === 0) {
      setProductsList(initialProducts);
    }
  }, [initialProducts]);
  const [customersList, setCustomersList] = useState<Record<string, unknown>[]>([]);
  const [couponsList, setCouponsList] = useState<Coupon[]>([]);
  const [salesReports, setSalesReports] = useState<Record<string, unknown> | null>(null);
  const [staffList, setStaffList] = useState<AdminUser[]>([]);
  const [activityLogsList, setActivityLogsList] = useState<ActivityLog[]>([]);
  const [settingsMap, setSettingsMap] = useState<Record<string, string>>({});

  const categoriesList = useMemo(() => {
    const defaultCats = [
      { id: 1, name: 'Kurta Sets', image: '', slug: 'kurta-sets' },
      { id: 2, name: 'Anarkali Suits', image: '', slug: 'anarkali-suits' },
      { id: 3, name: 'Sarees', image: '', slug: 'sarees' },
      { id: 4, name: 'Lehenga Choli', image: '', slug: 'lehenga-choli' },
      { id: 5, name: 'Co-ord Sets', image: '', slug: 'co-ord-sets' },
      { id: 6, name: 'Dupattas', image: '', slug: 'dupattas' },
    ];
    const uniqueNames = Array.from(new Set(productsList.map((p) => p.category).filter(Boolean)));
    if (uniqueNames.length === 0) return defaultCats;
    return uniqueNames.map((name, idx) => ({
      id: idx + 1,
      name,
      image: '',
      slug: name.toLowerCase().replace(/\s+/g, '-'),
    }));
  }, [productsList]);

  // Product Edit / Create Modal State
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{ id: number; name: string } | null>(null);
  const [isUploadingProductDrive, setIsUploadingProductDrive] = useState(false);
  const [driveUploadMsg, setDriveUploadMsg] = useState<string | null>(null);
  const productModalFileInputRef = useRef<HTMLInputElement>(null);
  const productModalLocalFileInputRef = useRef<HTMLInputElement>(null);

  // Quick Direct Product Image Change
  const [uploadingProductId, setUploadingProductId] = useState<number | null>(null);
  const [selectedUploadProductId, setSelectedUploadProductId] = useState<number | null>(null);
  const directProductFileInputRef = useRef<HTMLInputElement>(null);
  const invoiceLogoFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingInvoiceLogo, setIsUploadingInvoiceLogo] = useState(false);

  // Order Detail / Shipment Modal State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [shipmentCourier, setShipmentCourier] = useState('Delhivery Express');
  const [shipmentTrackingNumber, setShipmentTrackingNumber] = useState('');
  const [shipmentEstimatedDate, setShipmentEstimatedDate] = useState('3-5 Business Days');

  // Multi-Photo Studio (3-4 Photos) State
  const [photoSlot1, setPhotoSlot1] = useState('');
  const [photoSlot2, setPhotoSlot2] = useState('');
  const [photoSlot3, setPhotoSlot3] = useState('');
  const [photoSlot4, setPhotoSlot4] = useState('');
  const batchPhotosInputRef = useRef<HTMLInputElement>(null);
  const slot1InputRef = useRef<HTMLInputElement>(null);
  const slot2InputRef = useRef<HTMLInputElement>(null);
  const slot3InputRef = useRef<HTMLInputElement>(null);
  const slot4InputRef = useRef<HTMLInputElement>(null);

  // Custom Category & Color Input States
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [newColorInput, setNewColorInput] = useState('');

  // Video Reels Studio State
  const [reelsList, setReelsList] = useState<VideoReel[]>([]);
  const [editingReel, setEditingReel] = useState<Partial<VideoReel> | null>(null);
  const [showReelModal, setShowReelModal] = useState(false);
  const [isSavingReel, setIsSavingReel] = useState(false);
  const [isUploadingReelVideo, setIsUploadingReelVideo] = useState(false);
  const [reelVideoUploadMsg, setReelVideoUploadMsg] = useState<string | null>(null);
  const [isUploadingReelPoster, setIsUploadingReelPoster] = useState(false);
  const reelVideoFileInputRef = useRef<HTMLInputElement>(null);
  const reelPosterFileInputRef = useRef<HTMLInputElement>(null);

  // Admin Profile & Password Update State
  const [adminProfileForm, setAdminProfileForm] = useState({
    name: '',
    adminId: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileUpdateMsg, setProfileUpdateMsg] = useState<{ success?: boolean; message?: string } | null>(null);

  // Manual Customer Order CRUD State
  const [showAddOrderModal, setShowAddOrderModal] = useState(false);
  const [editingOrderModal, setEditingOrderModal] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [newOrderForm, setNewOrderForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    shippingAddress: '',
    city: 'Jaipur',
    state: 'Rajasthan',
    pincode: '303905',
    totalAmount: 1999,
    discountAmount: 0,
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    orderStatus: 'Confirmed',
    notes: '',
    courierPartner: 'Delhivery Express',
    trackingNumber: '',
    itemName: 'Royal Handblock Anarkali Set',
    itemSize: 'M',
    itemQuantity: 1,
    itemPrice: 1999,
  });

  // Tracking Modal & Checkpoint Event State
  const [trackingModalOrder, setTrackingModalOrder] = useState<Order | null>(null);
  const [trackingForm, setTrackingForm] = useState({
    courierPartner: 'Delhivery Express',
    trackingNumber: '',
    trackingUrl: '',
    estimatedDelivery: '3 to 5 Business Days',
    status: 'Shipped',
    newCheckpointStatus: 'In Transit',
    newCheckpointLocation: 'Jaipur Fulfillment Center',
    newCheckpointNote: 'Dispatched and scanned at hub',
  });

  // Customer Analytics & Traffic State
  const [customerSubTab, setCustomerSubTab] = useState<'registered' | 'activities' | 'traffic'>('registered');
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerActivityData, setCustomerActivityData] = useState<{
    summary?: {
      totalVisits: number;
      todayVisits: number;
      uniqueVisitors: number;
      totalSignups: number;
      todayLogins: number;
      totalCustomerActivities: number;
    };
    visitors?: Array<{
      id: number;
      visitorId: string;
      page: string;
      referrer?: string;
      deviceType?: string;
      ipAddress?: string;
      createdAt: string;
    }>;
    activities?: Array<{
      id: number;
      type: string;
      phone?: string;
      name?: string;
      email?: string;
      details?: string;
      ipAddress?: string;
      createdAt: string;
    }>;
  }>({});

  // Staff Account Creation Modal State
  const [showCreateStaffModal, setShowCreateStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'staff' as 'staff' | 'super_admin',
    temporaryPassword: '',
  });
  const [isCreatingStaff, setIsCreatingStaff] = useState(false);
  const [createStaffError, setCreateStaffError] = useState<string | null>(null);
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Loading & Action Toast
  const [loadingData, setLoadingData] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Settings & Configuration Management State
  const [settingsSubTab, setSettingsSubTab] = useState<'gateway' | 'bank' | 'upi' | 'delivery' | 'store'>('gateway');
  const [showSecretKeys, setShowSecretKeys] = useState(false);
  
  // Delivery Partner State
  const [showAddDeliveryModal, setShowAddDeliveryModal] = useState(false);
  const [newPartnerForm, setNewPartnerForm] = useState<Omit<DeliveryPartner, 'id'>>({
    name: '',
    trackingUrlTemplate: 'https://',
    estimatedDays: '2 to 4 Business Days',
    phone: '',
    isDefault: false,
    isActive: true,
  });

  // Payment Gateway State
  const [showAddGatewayModal, setShowAddGatewayModal] = useState(false);
  const [newGatewayForm, setNewGatewayForm] = useState<Omit<PaymentGateway, 'id'>>({
    name: '',
    provider: 'razorpay',
    keyId: '',
    keySecret: '',
    webhookSecret: '',
    mode: 'test',
    isActive: true,
    isDefault: false,
    instructions: '',
  });

  // Bank Account State
  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [newBankForm, setNewBankForm] = useState<Omit<BankAccount, 'id'>>({
    bankName: '',
    accountHolder: '',
    accountNumber: '',
    ifsc: '',
    accountType: 'Current Account',
    branch: '',
    upiId: '',
    instructions: '',
    isDefault: false,
    isActive: true,
  });

  // UPI Account State
  const [showAddUpiModal, setShowAddUpiModal] = useState(false);
  const [newUpiForm, setNewUpiForm] = useState<Omit<UpiAccount, 'id'>>({
    title: '',
    upiId: '',
    payeeName: '',
    phone: '',
    qrImageUrl: '',
    isDefault: false,
    isActive: true,
  });

  const upiQrFileInputRef = useRef<HTMLInputElement>(null);
  const newUpiQrFileInputRef = useRef<HTMLInputElement>(null);

  // Parse delivery partners list
  const deliveryPartnersList: DeliveryPartner[] = useMemo(() => {
    try {
      if (settingsMap['delivery_partners']) {
        const parsed = JSON.parse(settingsMap['delivery_partners']);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return [
      {
        id: 'delhivery',
        name: 'Delhivery Express',
        trackingUrlTemplate: 'https://www.delhivery.com/track/package/{TRACKING_NO}',
        estimatedDays: '2 to 4 Business Days',
        phone: '1800 102 4567',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'shiprocket',
        name: 'Shiprocket Direct',
        trackingUrlTemplate: 'https://shiprocket.co/tracking/{TRACKING_NO}',
        estimatedDays: '3 to 5 Business Days',
        phone: '011 4056 1234',
        isDefault: false,
        isActive: true,
      },
      {
        id: 'bluedart',
        name: 'Blue Dart Express',
        trackingUrlTemplate: 'https://www.bluedart.com/tracking?numbers={TRACKING_NO}',
        estimatedDays: '1 to 3 Business Days',
        phone: '1860 233 1234',
        isDefault: false,
        isActive: true,
      },
      {
        id: 'dtdc',
        name: 'DTDC Courier',
        trackingUrlTemplate: 'https://www.dtdc.in/tracking/shipment-tracking.asp?trkType=AWB&strCnno={TRACKING_NO}',
        estimatedDays: '3 to 5 Business Days',
        phone: '080 2536 5032',
        isDefault: false,
        isActive: true,
      },
      {
        id: 'indiapost',
        name: 'India Post Speed Post',
        trackingUrlTemplate: 'https://www.indiapost.gov.in/_layouts/15/dpt.cpt.infrastructure/pages/trackconsignment.aspx?consignment={TRACKING_NO}',
        estimatedDays: '4 to 7 Business Days',
        phone: '1800 266 6868',
        isDefault: false,
        isActive: true,
      },
    ];
  }, [settingsMap['delivery_partners']]);

  // Parse payment gateways list
  const paymentGatewaysList: PaymentGateway[] = useMemo(() => {
    try {
      if (settingsMap['payment_gateways_list']) {
        const parsed = JSON.parse(settingsMap['payment_gateways_list']);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return [
      {
        id: 'gw_razorpay',
        name: 'Razorpay Payment Gateway',
        provider: 'razorpay',
        keyId: settingsMap['razorpay_key_id'] || 'rzp_test_placeholder_key',
        keySecret: settingsMap['razorpay_key_secret'] || '',
        mode: (settingsMap['payment_gateway_mode'] as 'test' | 'live') || 'test',
        isActive: settingsMap['gateway_enabled'] !== 'false',
        isDefault: (settingsMap['payment_gateway_provider'] || 'razorpay') === 'razorpay',
        instructions: 'Accepts UPI, Debit/Credit Cards, NetBanking, and Wallets.',
      },
      {
        id: 'gw_phonepe',
        name: 'PhonePe PG',
        provider: 'phonepe',
        keyId: settingsMap['phonepe_merchant_id'] || 'MERCHANTUAT',
        keySecret: settingsMap['phonepe_salt_key'] || '',
        mode: 'test',
        isActive: false,
        isDefault: (settingsMap['payment_gateway_provider'] || '') === 'phonepe',
        instructions: 'Direct PhonePe QR and Intent payments.',
      },
      {
        id: 'gw_paytm',
        name: 'Paytm Business All-in-One',
        provider: 'paytm',
        keyId: '',
        keySecret: '',
        mode: 'test',
        isActive: false,
        isDefault: (settingsMap['payment_gateway_provider'] || '') === 'paytm',
        instructions: 'Paytm Wallet, Postpaid, and UPI.',
      },
      {
        id: 'gw_cashfree',
        name: 'Cashfree Payments',
        provider: 'cashfree',
        keyId: settingsMap['cashfree_app_id'] || '',
        keySecret: '',
        mode: 'test',
        isActive: false,
        isDefault: (settingsMap['payment_gateway_provider'] || '') === 'cashfree',
        instructions: 'Cashfree auto-collect and cards gateway.',
      },
    ];
  }, [
    settingsMap['payment_gateways_list'],
    settingsMap['razorpay_key_id'],
    settingsMap['razorpay_key_secret'],
    settingsMap['payment_gateway_provider'],
    settingsMap['payment_gateway_mode'],
    settingsMap['gateway_enabled'],
    settingsMap['phonepe_merchant_id'],
    settingsMap['phonepe_salt_key'],
    settingsMap['cashfree_app_id'],
  ]);

  // Parse bank accounts list
  const bankAccountsList: BankAccount[] = useMemo(() => {
    try {
      if (settingsMap['bank_accounts_list']) {
        const parsed = JSON.parse(settingsMap['bank_accounts_list']);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return [
      {
        id: 'bank_sbi_primary',
        bankName: settingsMap['bank_name'] || 'State Bank of India (SBI)',
        accountHolder: settingsMap['bank_account_holder'] || 'SS VASTRA - SUBHASH MEENA',
        accountNumber: settingsMap['bank_account_number'] || '38920100054231',
        ifsc: settingsMap['bank_ifsc'] || 'SBIN0031114',
        accountType: (settingsMap['bank_account_type'] as 'Current Account' | 'Savings Account') || 'Current Account',
        branch: settingsMap['bank_branch'] || 'Sanganer Branch, Jaipur, Rajasthan',
        upiId: settingsMap['upi_id'] || '9783770735@upi',
        instructions: settingsMap['bank_instructions'] || 'Transfer via IMPS / NEFT and share screenshot on WhatsApp helpline.',
        isDefault: true,
        isActive: settingsMap['bank_transfer_enabled'] !== 'false',
      },
      {
        id: 'bank_hdfc_secondary',
        bankName: 'HDFC Bank',
        accountHolder: 'SS VASTRA JAIPUR',
        accountNumber: '50200084729112',
        ifsc: 'HDFC0001832',
        accountType: 'Current Account',
        branch: 'Tonk Road Branch, Jaipur',
        upiId: 'ssvastra@okhdfcbank',
        instructions: 'Instant RTGS/NEFT settlement account.',
        isDefault: false,
        isActive: true,
      },
    ];
  }, [
    settingsMap['bank_accounts_list'],
    settingsMap['bank_name'],
    settingsMap['bank_account_holder'],
    settingsMap['bank_account_number'],
    settingsMap['bank_ifsc'],
    settingsMap['bank_account_type'],
    settingsMap['bank_branch'],
    settingsMap['bank_instructions'],
    settingsMap['upi_id'],
    settingsMap['bank_transfer_enabled'],
  ]);

  // Parse UPI accounts list
  const upiAccountsList: UpiAccount[] = useMemo(() => {
    try {
      if (settingsMap['upi_accounts_list']) {
        const parsed = JSON.parse(settingsMap['upi_accounts_list']);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return [
      {
        id: 'upi_primary_gpay',
        title: 'Primary Google Pay / PhonePe UPI',
        upiId: settingsMap['upi_id'] || '9783770735@upi',
        payeeName: settingsMap['upi_name'] || 'SS VASTRA JAIPUR',
        phone: settingsMap['upi_number'] || '9783770735',
        qrImageUrl: settingsMap['upi_qr_image'] || 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi%3A%2F%2Fpay%3Fpa%3D9783770735%40upi%26pn%3DSS%2520VASTRA%2520JAIPUR%26cu%3DINR',
        isDefault: true,
        isActive: settingsMap['upi_enabled'] !== 'false',
      },
      {
        id: 'upi_axis_merchant',
        title: 'Axis Bank Business UPI ID',
        upiId: settingsMap['upi_secondary_id'] || 'ssvastra@okaxis',
        payeeName: settingsMap['upi_name'] || 'SS VASTRA JAIPUR',
        phone: settingsMap['upi_number'] || '9783770735',
        qrImageUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi%3A%2F%2Fpay%3Fpa%3Dssvastra%40okaxis%26pn%3DSS%2520VASTRA%2520JAIPUR%26cu%3DINR',
        isDefault: false,
        isActive: true,
      },
    ];
  }, [
    settingsMap['upi_accounts_list'],
    settingsMap['upi_id'],
    settingsMap['upi_name'],
    settingsMap['upi_number'],
    settingsMap['upi_qr_image'],
    settingsMap['upi_secondary_id'],
    settingsMap['upi_enabled'],
  ]);

  // Detect URL search params on mount or URL change (?action=reset-password / ?action=set-password)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const action = params.get('action');
      const actionToken = params.get('token');

      if (action === 'reset-password' && actionToken) {
        setAuthView('reset_password');
        setResetTokenParam(actionToken);
      } else if (action === 'set-password' && actionToken) {
        setAuthView('set_staff_password');
        setResetTokenParam(actionToken);
      }
    } catch {
      // ignore url parsing error
    }
  }, [isOpen]);

  // Ensure noindex robots tag for search engines when admin is open
  useEffect(() => {
    let metaRobots = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (isOpen || window.location.pathname.startsWith('/admin')) {
      if (!metaRobots) {
        metaRobots = document.createElement('meta');
        metaRobots.name = 'robots';
        document.head.appendChild(metaRobots);
      }
      metaRobots.content = 'noindex, nofollow';
    }
  }, [isOpen]);

  // Check auth & load profile
  useEffect(() => {
    if (token) {
      verifyAdminProfile();
    }
  }, [token]);

  // Load Tab Data whenever activeTab changes & preload settings
  useEffect(() => {
    if (token && currentAdmin) {
      fetch('/api/settings')
        .then((r) => r.json())
        .then((d) => {
          if (d.success && d.settings) setSettingsMap(d.settings);
        })
        .catch(() => {});
      loadTabData(activeTab);
    }
  }, [activeTab, token, currentAdmin]);

  // 30-Minute Inactivity Auto-Logout Timer
  useEffect(() => {
    if (!token || !currentAdmin) return;

    let inactivityTimer: ReturnType<typeof setTimeout>;
    const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in ms

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        handleLogout();
        setSessionNotice(
          'Aapki session 30 minute tak inactive rehne ke karan auto-logout ho gayi hai. Kripya punah login karein.'
        );
      }, INACTIVITY_TIMEOUT);
    };

    const trackedEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    trackedEvents.forEach((evt) => window.addEventListener(evt, resetTimer));

    resetTimer();

    return () => {
      clearTimeout(inactivityTimer);
      trackedEvents.forEach((evt) => window.removeEventListener(evt, resetTimer));
    };
  }, [token, currentAdmin]);

  const verifyAdminProfile = async () => {
    try {
      const res = await fetch('/api/admin/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      const data = await res.json();
      if (data.success && data.admin) {
        setCurrentAdmin(data.admin);
        localStorage.setItem('ss_vastra_admin_user', JSON.stringify(data.admin));
        if (data.admin.mustChangePassword) {
          setMustChangePass(true);
        }
      }
    } catch {
      // Do not log out on temporary network glitch if session is already stored
    }
  };

  const handleLogout = async () => {
    try {
      if (token) {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {
      // ignore
    }
    localStorage.removeItem('ss_vastra_admin_token');
    localStorage.removeItem('ss_vastra_admin_user');
    setToken(null);
    setCurrentAdmin(null);
    setMustChangePass(false);
    setActiveTab('dashboard');
  };

  // 1. Login Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);
    setSessionNotice(null);

    const cleanInput = loginEmail.trim();
    const cleanPass = loginPassword.trim();
    const isMasterPass =
      cleanPass === 'Meena9829@' ||
      cleanPass === 'Meena@9829' ||
      cleanPass.toLowerCase() === 'meena9829@' ||
      cleanPass.toLowerCase() === 'meena@9829' ||
      cleanPass.toLowerCase() === 'meena9829';

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanInput,
          password: cleanPass,
          otp: requireOtp ? otpCode.trim() : undefined,
          requireOtp,
        }),
      });
      const data = await res.json();

      if (data.requireOtp) {
        setRequireOtp(true);
        setOtpMessage(data.message || 'OTP verification code sent to your email.');
        setIsLoggingIn(false);
        return;
      }

      if (data.success && data.token) {
        localStorage.setItem('ss_vastra_admin_token', data.token);
        localStorage.setItem('ss_vastra_admin_user', JSON.stringify(data.admin));
        setToken(data.token);
        setCurrentAdmin(data.admin);
        setRequireOtp(false);
        setOtpCode('');
        if (data.admin.mustChangePassword) {
          setMustChangePass(true);
        }
        return;
      }

      // If backend returned error but user entered master owner password
      if (isMasterPass) {
        const fallbackAdmin: AdminUser = {
          id: 1,
          adminId: '1000',
          email: 'subhashmeena3111@gmail.com',
          phone: '9783770735',
          name: 'Subhash Meena (SS VASTRA Owner)',
          role: 'super_admin',
          mustChangePassword: false,
          isActive: true,
          createdAt: new Date().toISOString(),
        };
        const tokenVal = 'ssv_token_' + Date.now();
        localStorage.setItem('ss_vastra_admin_token', tokenVal);
        localStorage.setItem('ss_vastra_admin_user', JSON.stringify(fallbackAdmin));
        setToken(tokenVal);
        setCurrentAdmin(fallbackAdmin);
        setRequireOtp(false);
        setOtpCode('');
        return;
      }

      setLoginError(data.error || 'Admin ID ya password galat hai');
    } catch {
      // Network/Server glitch fallback with master password
      if (isMasterPass) {
        const fallbackAdmin: AdminUser = {
          id: 1,
          adminId: '1000',
          email: 'subhashmeena3111@gmail.com',
          phone: '9783770735',
          name: 'Subhash Meena (SS VASTRA Owner)',
          role: 'super_admin',
          mustChangePassword: false,
          isActive: true,
          createdAt: new Date().toISOString(),
        };
        const tokenVal = 'ssv_token_' + Date.now();
        localStorage.setItem('ss_vastra_admin_token', tokenVal);
        localStorage.setItem('ss_vastra_admin_user', JSON.stringify(fallbackAdmin));
        setToken(tokenVal);
        setCurrentAdmin(fallbackAdmin);
        setRequireOtp(false);
        setOtpCode('');
        return;
      }
      setLoginError('Admin ID ya password galat hai');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // 2. Forgot Password Handler
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingForgot(true);
    setForgotStatus(null);

    try {
      const res = await fetch('/api/admin/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const data = await res.json();
      setForgotStatus({
        success: true,
        message:
          data.message ||
          'Agar ye email registered hai, to password reset link email par bhej diya gaya hai (valid for 30 minutes).',
      });
    } catch {
      setForgotStatus({
        success: false,
        message: 'Request bhejte samay error aaya. Kripya punah prayas karein.',
      });
    } finally {
      setIsSendingForgot(false);
    }
  };

  // 3. Reset Password Handler (30 min token)
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newResetPassword)) {
      setResetStatus({
        success: false,
        message: 'Password kam se kam 8 aksharon ka hona chahiye aur usme letters aur numbers dono hone chahiye.',
      });
      return;
    }
    if (newResetPassword !== confirmResetPassword) {
      setResetStatus({ success: false, message: 'Passwords aapas me match nahi ho rahe hain.' });
      return;
    }

    setIsResetting(true);
    setResetStatus(null);

    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetTokenParam,
          newPassword: newResetPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResetStatus({
          success: true,
          message: data.message || 'Password safalta se reset ho gaya hai! Ab aap naye password se login kar sakte hain.',
        });
      } else {
        setResetStatus({ success: false, message: data.error || 'Password reset nahi ho saka.' });
      }
    } catch {
      setResetStatus({ success: false, message: 'Server se connect nahi ho saka.' });
    } finally {
      setIsResetting(false);
    }
  };

  // 4. Staff Account Activation Handler (24 hour invite link)
  const handleSetStaffPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newResetPassword)) {
      setResetStatus({
        success: false,
        message: 'Password kam se kam 8 aksharon ka hona chahiye aur usme letters aur numbers dono hone chahiye.',
      });
      return;
    }
    if (newResetPassword !== confirmResetPassword) {
      setResetStatus({ success: false, message: 'Passwords aapas me match nahi ho rahe hain.' });
      return;
    }

    setIsResetting(true);
    setResetStatus(null);

    try {
      const res = await fetch('/api/admin/set-staff-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetTokenParam,
          newPassword: newResetPassword,
        }),
      });
      const data = await res.json();
      if (data.success && data.token) {
        localStorage.setItem('ss_vastra_admin_token', data.token);
        setToken(data.token);
        setCurrentAdmin(data.admin);
        setAuthView('login');
        setActionMessage('Account successfully activated! Welcome to SS VASTRA.');
        setTimeout(() => setActionMessage(null), 3000);
      } else {
        setResetStatus({ success: false, message: data.error || 'Activation failed.' });
      }
    } catch {
      setResetStatus({ success: false, message: 'Server connection error.' });
    } finally {
      setIsResetting(false);
    }
  };

  // 5. Force Change Password on First Login
  const handleForceChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(forceNewPassword)) {
      setForcePassError(
        'Password kam se kam 8 aksharon ka hona chahiye aur usme letters aur numbers dono hone chahiye.'
      );
      return;
    }
    if (forceNewPassword !== forceConfirmPassword) {
      setForcePassError('Passwords do not match');
      return;
    }

    setIsForceSaving(true);
    setForcePassError(null);

    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword: forceNewPassword }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.token) {
          localStorage.setItem('ss_vastra_admin_token', data.token);
          setToken(data.token);
        }
        setMustChangePass(false);
        setActionMessage('Password successfully updated! Welcome to SS VASTRA Dashboard.');
        setTimeout(() => setActionMessage(null), 4000);
      } else {
        setForcePassError(data.error || 'Failed to update password');
      }
    } catch {
      setForcePassError('Server error while updating password');
    } finally {
      setIsForceSaving(false);
    }
  };

  // Load Tab Data
  const loadTabData = async (tab: string) => {
    setLoadingData(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      if (tab === 'dashboard') {
        const [dashRes, prodsRes, ordersRes] = await Promise.allSettled([
          fetch('/api/admin/dashboard', { headers }).then((r) => r.json()),
          fetch('/api/admin/products', { headers }).then((r) => r.json()),
          fetch('/api/admin/orders', { headers }).then((r) => r.json()),
        ]);
        if (dashRes.status === 'fulfilled' && dashRes.value?.success) {
          setDashboardMetrics(dashRes.value.metrics);
        }
        if (prodsRes.status === 'fulfilled' && prodsRes.value?.success && Array.isArray(prodsRes.value.products)) {
          setProductsList(prodsRes.value.products);
        }
        if (ordersRes.status === 'fulfilled' && ordersRes.value?.success && Array.isArray(ordersRes.value.orders)) {
          setOrdersList(ordersRes.value.orders);
        }
      } else if (tab === 'orders') {
        const res = await fetch('/api/admin/orders', { headers });
        const d = await res.json();
        if (d.success) setOrdersList(d.orders);
      } else if (tab === 'products') {
        try {
          const res = await fetch('/api/admin/products', { headers });
          let prods: Product[] = [];
          if (res.ok) {
            const d = await res.json();
            if (d.success && Array.isArray(d.products)) prods = d.products;
          }
          if (prods.length === 0) {
            const pubRes = await fetch('/api/products');
            if (pubRes.ok) {
              const pubD = await pubRes.json();
              if (pubD.success && Array.isArray(pubD.products)) prods = pubD.products;
            }
          }

          // If server returned active products, update local storage cache safely
          if (prods.length > 0) {
            try {
              const activeIds = new Set(prods.map((p) => p.id));
              const deletedIds: number[] = JSON.parse(
                localStorage.getItem('ss_vastra_deleted_product_ids') || '[]'
              );
              const validDeletedIds = deletedIds.filter((id) => !activeIds.has(id));
              localStorage.setItem('ss_vastra_deleted_product_ids', JSON.stringify(validDeletedIds));
            } catch {}
          }

          // Merge any custom draft products (excluding deleted IDs)
          try {
            const deletedIds: number[] = JSON.parse(
              localStorage.getItem('ss_vastra_deleted_product_ids') || '[]'
            );
            if (prods.length === 0 && !deletedIds.includes(1)) {
              prods = getDefaultProducts();
            }
            const rawCustom = JSON.parse(
              localStorage.getItem('ss_vastra_custom_products') || '[]'
            );
            const customProds: Product[] = sanitizeProductList(rawCustom).filter(
              (cp) => !deletedIds.includes(cp.id)
            );
            for (const cp of customProds) {
              const idx = prods.findIndex((p: any) => p.id === cp.id);
              if (idx >= 0) prods[idx] = { ...prods[idx], ...cp };
              else prods.unshift(cp);
            }
          } catch {}

          setProductsList(sanitizeProductList(prods));
        } catch (err) {
          console.error(err);
        }
      } else if (tab === 'customers') {
        const res = await fetch('/api/admin/customers', { headers });
        const d = await res.json();
        if (d.success) setCustomersList(d.customers);

        try {
          const actRes = await fetch('/api/admin/customer-activity', { headers });
          const actD = await actRes.json();
          if (actD.success) {
            setCustomerActivityData({
              summary: actD.summary,
              visitors: actD.visitors,
              activities: actD.activities,
            });
          }
        } catch {}
      } else if (tab === 'coupons') {
        const res = await fetch('/api/admin/coupons', { headers });
        const d = await res.json();
        if (d.success) setCouponsList(d.coupons);
      } else if (tab === 'reports') {
        const res = await fetch('/api/admin/reports/sales', { headers });
        const d = await res.json();
        if (d.success) setSalesReports(d);
      } else if (tab === 'staff') {
        const res = await fetch('/api/admin/staff', { headers });
        const d = await res.json();
        if (d.success) setStaffList(d.staff);
      } else if (tab === 'settings' || tab === 'receipts') {
        const res = await fetch('/api/settings');
        const d = await res.json();
        if (d.success) setSettingsMap(d.settings);
      } else if (tab === 'activity') {
        const res = await fetch('/api/admin/activity-logs', { headers });
        const d = await res.json();
        if (d.success) setActivityLogsList(d.logs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  // Staff Account Actions
  const handleCreateStaffAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingStaff(true);
    setCreateStaffError(null);
    setGeneratedInviteLink(null);

    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(staffForm),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage('Staff account created and 24-hr invite link sent!');
        setTimeout(() => setActionMessage(null), 4000);
        if (data.inviteLink) {
          setGeneratedInviteLink(data.inviteLink);
        } else {
          setShowCreateStaffModal(false);
        }
        setStaffForm({
          name: '',
          email: '',
          phone: '',
          role: 'staff',
          temporaryPassword: '',
        });
        loadTabData('staff');
      } else {
        setCreateStaffError(data.error || 'Failed to create staff account');
      }
    } catch {
      setCreateStaffError('Error communicating with server');
    } finally {
      setIsCreatingStaff(false);
    }
  };

  const handleToggleStaffStatus = async (staffId: number, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/staff/${staffId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`Staff account ${!currentStatus ? 'activated' : 'disabled'}`);
        setTimeout(() => setActionMessage(null), 3000);
        loadTabData('staff');
      } else {
        alert(data.error || 'Action failed');
      }
    } catch {
      alert('Error updating staff status');
    }
  };

  const handleResendStaffInvite = async (staffId: number) => {
    try {
      const res = await fetch(`/api/admin/staff/${staffId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ resendInvite: true }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage('New 24-hr invite link generated & emailed!');
        setTimeout(() => setActionMessage(null), 4000);
        if (data.inviteLink) {
          setGeneratedInviteLink(data.inviteLink);
          setShowCreateStaffModal(true);
        }
        loadTabData('staff');
      } else {
        alert(data.error || 'Failed to resend invite');
      }
    } catch {
      alert('Error requesting invite resend');
    }
  };

  const handleDeleteStaffAccount = async (staffId: number) => {
    try {
      const res = await fetch(`/api/admin/staff/${staffId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage('Staff account removed successfully');
        setTimeout(() => setActionMessage(null), 3000);
        loadTabData('staff');
      } else {
        setActionMessage(data.error || 'Failed to delete staff account');
      }
    } catch {
      setActionMessage('Error deleting staff account');
    }
  };

  // Helper to normalize status strings to exact option values
  const getFormattedStatus = (statusStr?: string) => {
    const s = String(statusStr || 'Placed').trim().toLowerCase();
    if (s === 'confirmed') return 'Confirmed';
    if (s === 'processing') return 'Processing';
    if (s === 'packed') return 'Packed';
    if (s === 'shipped') return 'Shipped';
    if (s === 'out for delivery' || s === 'out_for_delivery') return 'Out for Delivery';
    if (s === 'delivered') return 'Delivered';
    if (s === 'cancelled' || s === 'canceled') return 'Cancelled';
    if (s === 'returned') return 'Returned';
    return 'Placed';
  };

  // Order Actions
  const handleUpdateOrderStatus = async (orderId: number, status: string) => {
    const formatted = getFormattedStatus(status);

    // 1. Instant optimistic update in ordersList state
    setOrdersList((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, orderStatus: formatted, status: formatted } : o))
    );

    // 2. Also persist in localStorage so Track Order & Customer view reflect change immediately
    try {
      const stored = localStorage.getItem('ss_vastra_customer_orders');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const updated = parsed.map((o: any) =>
            o.id === orderId || o.orderNumber === String(orderId)
              ? { ...o, orderStatus: formatted, status: formatted }
              : o
          );
          localStorage.setItem('ss_vastra_customer_orders', JSON.stringify(updated));
        }
      }
    } catch {}

    setActionMessage(`Order #${orderId} ka status ab "${formatted}" set ho gaya hai!`);
    setTimeout(() => setActionMessage(null), 3500);

    // 3. Sync with backend API in background
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: formatted }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.success && data.order) {
          setOrdersList((prev) =>
            prev.map((o) => (o.id === orderId ? { ...o, ...data.order } : o))
          );
        }
      }
    } catch (err) {
      console.warn('Order status sync note:', err);
    }
  };

  const handleSendWhatsAppOrderNotification = (ord: Order) => {
    const cleanPhone = (ord.customerPhone || '').replace(/\D/g, '').slice(-10);
    if (!cleanPhone) {
      alert('Is order me customer mobile number uplabdh nahi hai.');
      return;
    }
    const currentStatus = ord.orderStatus || ord.status || 'Confirmed';
    const statusEmojis: Record<string, string> = {
      Placed: '📝',
      Confirmed: '✅',
      Processing: '🧵',
      Packed: '📦',
      Shipped: '🚚',
      'In Transit': '✈️',
      'Out for Delivery': '🛵',
      Delivered: '🎉',
      Cancelled: '❌',
      Returned: '↩️',
    };
    const emoji = statusEmojis[currentStatus] || '✨';
    const trackingLink = `https://ss-vastra-ten.vercel.app/?track=${ord.orderNumber}&phone=${cleanPhone}`;

    const text = `Namaste ${ord.customerName}! 🌸\n\nSS VASTRA Jaipur ki taraf se aapka order update:\n${emoji} *Order #${ord.orderNumber}* ka status abhi *${currentStatus.toUpperCase()}* ho gaya hai.\n\n💰 Total Amount: ₹${ord.totalAmount.toLocaleString('en-IN')}\n💳 Payment: ${(ord.paymentStatus || 'pending').toUpperCase()} (${(ord.paymentMethod || 'COD').toUpperCase()})\n\n📍 Live Tracking & Delivery Details:\n${trackingLink}\n\nKisi bhi sahayata ke liye hume WhatsApp par reply karein.\nDhanyawad,\n*SS VASTRA Jaipur* - Authentic Handcrafted Fashion`;

    const waUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  // Video Reels Studio Handlers
  const loadReelsData = async () => {
    try {
      const res = await fetch('/api/reels');
      const data = await res.json();
      if (data.success && Array.isArray(data.reels)) {
        setReelsList(data.reels);
      }
    } catch {}
  };

  const handleReelVideoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeMb = file.size / (1024 * 1024);
    setIsUploadingReelVideo(true);
    setReelVideoUploadMsg(`Video load ho rahi hai (${sizeMb.toFixed(1)} MB)...`);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const dataUrl = event.target?.result as string;
          setReelVideoUploadMsg('Cloud storage par upload ho rahi hai...');

          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              video: dataUrl,
              fileName: file.name,
            }),
          });
          const data = await res.json();
          const finalUrl = data.success && data.url ? data.url : dataUrl;
          setEditingReel((prev) => (prev ? { ...prev, videoUrl: finalUrl } : prev));
          setReelVideoUploadMsg(null);
          setActionMessage('Video reel successfully upload ho gayi!');
          setTimeout(() => setActionMessage(null), 3000);
        } catch {
          // Fallback to dataUrl directly
          const dataUrl = event.target?.result as string;
          setEditingReel((prev) => (prev ? { ...prev, videoUrl: dataUrl } : prev));
          setReelVideoUploadMsg(null);
        } finally {
          setIsUploadingReelVideo(false);
          if (reelVideoFileInputRef.current) reelVideoFileInputRef.current.value = '';
        }
      };
      reader.onerror = () => {
        alert('Video read karne me error aayi. Kripya doosri video chunein ya Google Drive link paste karein.');
        setIsUploadingReelVideo(false);
        setReelVideoUploadMsg(null);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      alert('Upload error: ' + (err?.message || 'Error'));
      setIsUploadingReelVideo(false);
      setReelVideoUploadMsg(null);
    }
  };

  const handleReelPosterFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingReelPoster(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: dataUrl,
              fileName: file.name,
            }),
          });
          const data = await res.json();
          const finalUrl = data.success && data.url ? data.url : dataUrl;
          setEditingReel((prev) => (prev ? { ...prev, posterUrl: finalUrl } : prev));
        } catch {
          setEditingReel((prev) => (prev ? { ...prev, posterUrl: dataUrl } : prev));
        } finally {
          setIsUploadingReelPoster(false);
          if (reelPosterFileInputRef.current) reelPosterFileInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setIsUploadingReelPoster(false);
    }
  };

  const handleSaveReel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReel || !editingReel.title || !editingReel.videoUrl) {
      alert('Kripya Reel Title aur Video MP4 URL dono bharein.');
      return;
    }
    setIsSavingReel(true);
    try {
      const isEdit = Boolean(editingReel.id);
      const url = isEdit ? `/api/admin/reels/${editingReel.id}` : '/api/admin/reels';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingReel),
      });

      const data = await res.json();
      if (data.success) {
        setActionMessage(isEdit ? 'Reel successfully updated!' : 'New video reel added successfully!');
        setTimeout(() => setActionMessage(null), 3000);
        setShowReelModal(false);
        setEditingReel(null);
        loadReelsData();
        window.dispatchEvent(new CustomEvent('ss-vastra-reels-updated'));
      } else {
        alert(data.error || 'Failed to save reel');
      }
    } catch {
      alert('Server error saving reel');
    } finally {
      setIsSavingReel(false);
    }
  };

  const handleDeleteReel = async (id: number, title: string) => {
    if (!window.confirm(`Kya aap reel "${title}" ko delete karna chahte hain?`)) return;
    try {
      const res = await fetch(`/api/admin/reels/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage('Reel successfully removed');
        setTimeout(() => setActionMessage(null), 3000);
        loadReelsData();
        window.dispatchEvent(new CustomEvent('ss-vastra-reels-updated'));
      }
    } catch {
      alert('Failed to delete reel');
    }
  };

  // Admin Profile & Credentials Update Handler
  const handleUpdateAdminProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileUpdateMsg(null);

    if (adminProfileForm.newPassword) {
      if (adminProfileForm.newPassword.length < 8) {
        setProfileUpdateMsg({ success: false, message: 'Naya password kam se kam 8 characters ka hona chahiye.' });
        return;
      }
      if (adminProfileForm.newPassword !== adminProfileForm.confirmPassword) {
        setProfileUpdateMsg({ success: false, message: 'New Password aur Confirm Password match nahi kar rahe hain.' });
        return;
      }
    }

    setIsUpdatingProfile(true);
    try {
      const res = await fetch('/api/admin/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: adminProfileForm.name.trim() || undefined,
          email: adminProfileForm.email.trim() || undefined,
          adminId: adminProfileForm.adminId.trim() || undefined,
          phone: adminProfileForm.phone.trim() || undefined,
          currentPassword: adminProfileForm.currentPassword || undefined,
          newPassword: adminProfileForm.newPassword || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setProfileUpdateMsg({ success: true, message: 'Admin profile aur credentials safalta se update ho gaye hain!' });
        if (data.token) {
          localStorage.setItem('ss_vastra_admin_token', data.token);
          setToken(data.token);
        }
        if (data.admin) {
          localStorage.setItem('ss_vastra_admin_user', JSON.stringify(data.admin));
          setCurrentAdmin(data.admin);
        }
        setAdminProfileForm((prev) => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }));
      } else {
        setProfileUpdateMsg({ success: false, message: data.error || 'Profile update nahi ho saka.' });
      }
    } catch {
      setProfileUpdateMsg({ success: false, message: 'Server se connect nahi ho saka.' });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePaymentStatus = async (orderId: number, paymentStatus: 'paid' | 'pending' | 'failed' | 'refunded') => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/payment-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ paymentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`Order #${orderId} payment marked as ${paymentStatus.toUpperCase()}`);
        setTimeout(() => setActionMessage(null), 3000);
        loadTabData('orders');
      }
    } catch {
      alert('Failed to update payment status');
    }
  };

  const handleUpdateShipment = async (orderId: number) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/shipment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courierName: shipmentCourier,
          trackingNumber: shipmentTrackingNumber,
          estimatedDelivery: shipmentEstimatedDate,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage('Tracking and dispatch details saved!');
        setTimeout(() => setActionMessage(null), 3000);
        setSelectedOrder(null);
        loadTabData('orders');
      }
    } catch {
      alert('Failed to update shipment');
    }
  };

  const handleRefundOrder = async (orderId: number, amount: number) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount, reason: 'Customer requested cancellation/refund' }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`Refund of ₹${amount} initiated successfully.`);
        setTimeout(() => setActionMessage(null), 3000);
        loadTabData('orders');
      } else {
        setActionMessage(data.error || 'Failed to process refund');
      }
    } catch {
      setActionMessage('Failed to process refund');
    }
  };

  // Upload photo directly to user's Google Drive and get high-speed preview URL
  const handleProductModalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingProductDrive(true);
      setDriveUploadMsg('Google Drive se connect ho raha hai...');

      let driveToken = await getAccessToken();
      if (!driveToken) {
        driveToken = await ensureDriveAuth();
      }

      setDriveUploadMsg('Photo optimize ho rahi hai (Auto-resizing)...');

      // Client-side auto resize & compress to JPEG Blob
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

      setDriveUploadMsg('Google Drive folder "SS VASTRA Product Images" mein upload ho raha hai...');

      const safeName = (editingProduct?.name || 'product')
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase();
      const fileName = `${safeName}_${Date.now()}.jpg`;

      // Upload directly to Google Drive & make readable by storefront
      const uploadResult = await uploadImageToDrive(
        driveToken,
        optimizedBlob,
        fileName,
        'SS VASTRA Product Images'
      );

      setEditingProduct((prev) => (prev ? { ...prev, image: uploadResult.directUrl } : prev));
      setActionMessage('Photo successfully Google Drive mein upload ho gayi!');
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      console.error('Google Drive product upload failed:', err);
      alert('Google Drive upload error: ' + (err?.message || 'Upload nahi ho paya.'));
    } finally {
      setIsUploadingProductDrive(false);
      setDriveUploadMsg(null);
      if (productModalFileInputRef.current) productModalFileInputRef.current.value = '';
    }
  };

  // Directly trigger photo picker for a product card
  const handleOpenDirectPhotoPicker = (productId: number) => {
    setSelectedUploadProductId(productId);
    if (directProductFileInputRef.current) {
      directProductFileInputRef.current.value = '';
      directProductFileInputRef.current.click();
    }
  };

  // Process chosen photo file for the product
  const handleDirectFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const targetProductId = selectedUploadProductId;
    if (!file || !targetProductId) return;

    try {
      setUploadingProductId(targetProductId);
      setActionMessage('Photo optimize ho rahi hai (Auto-compressing)...');

      // 1. Client-side image resize / compression to high-quality JPEG
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 1000;
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
              resolve(canvas.toDataURL('image/jpeg', 0.78));
            } else {
              resolve(event.target?.result as string);
            }
          };
          img.onerror = () => reject(new Error('Image decode error'));
          img.src = event.target?.result as string;
        };
        reader.onerror = () => reject(new Error('File read error'));
        reader.readAsDataURL(file);
      });

      // 2. Try Google Drive upload if token available, else use optimized data URL
      let finalImageUrl = dataUrl;
      try {
        const driveToken = await getAccessToken();
        if (driveToken) {
          setActionMessage('Google Drive mein photo upload ho rahi hai...');
          const blob = await (await fetch(dataUrl)).blob();
          const targetProd = productsList.find((p) => p.id === targetProductId);
          const safeName = (targetProd?.name || 'outfit').replace(/[^a-z0-9]/gi, '_').toLowerCase();
          const driveResult = await uploadImageToDrive(
            driveToken,
            blob,
            `${safeName}_${Date.now()}.jpg`,
            'SS VASTRA Product Images'
          );
          if (driveResult?.directUrl) {
            finalImageUrl = driveResult.directUrl;
          }
        }
      } catch (driveErr) {
        console.warn('Google Drive direct upload skipped, using direct optimized image storage:', driveErr);
      }

      // 3. Update product image in database via PATCH
      setActionMessage('Product photo database mein update ho rahi hai...');
      const res = await fetch(`/api/admin/products/${targetProductId}/image`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ image: finalImageUrl }),
      });

      const data = await res.json();
      if (data.success) {
        // Update local state in productsList
        setProductsList((prev) =>
          prev.map((p) => (p.id === targetProductId ? { ...p, image: finalImageUrl } : p))
        );
        setActionMessage('Photo successfully change aur save ho gayi!');
        setTimeout(() => setActionMessage(null), 3500);
        if (onProductsUpdated) onProductsUpdated();
      } else {
        alert(data.error || 'Photo update nahi ho payi');
      }
    } catch (err: any) {
      console.error('Direct photo change error:', err);
      alert('Error updating photo: ' + (err?.message || 'Try again'));
    } finally {
      setUploadingProductId(null);
      setSelectedUploadProductId(null);
      if (directProductFileInputRef.current) directProductFileInputRef.current.value = '';
    }
  };

  // Upload local photo directly from device inside product modal
  const handleProductModalLocalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingProductDrive(true);
      setDriveUploadMsg('Photo process ho rahi hai...');

      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 1000;
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
              resolve(canvas.toDataURL('image/jpeg', 0.78));
            } else {
              resolve(event.target?.result as string);
            }
          };
          img.onerror = () => reject(new Error('Image decode error'));
          img.src = event.target?.result as string;
        };
        reader.onerror = () => reject(new Error('File read error'));
        reader.readAsDataURL(file);
      });

      let finalUrl = dataUrl;
      try {
        setDriveUploadMsg('Cloud me photo save ho rahi hai...');
        const upRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: dataUrl, fileName: file.name }),
        });
        const upData = await upRes.json();
        if (upData.success && upData.url) {
          finalUrl = upData.url;
        }
      } catch (upErr) {
        console.warn('Upload API note, fallback to dataUrl:', upErr);
      }

      setEditingProduct((prev) => (prev ? { ...prev, image: finalUrl } : prev));
      setActionMessage('Photo select ho gayi! Ab "Save Changes" dabayein.');
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      console.error('Local photo select failed:', err);
      setActionMessage('Photo read error: ' + (err?.message || 'Try again'));
      setTimeout(() => setActionMessage(null), 3500);
    } finally {
      setIsUploadingProductDrive(false);
      setDriveUploadMsg(null);
      if (productModalLocalFileInputRef.current) productModalLocalFileInputRef.current.value = '';
    }
  };

  const handleInvoiceLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingInvoiceLogo(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 450;
          const MAX_HEIGHT = 160;
          let width = img.width;
          let height = img.height;
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
          }
          const base64 = canvas.toDataURL('image/png');

          try {
            const upRes = await fetch('/api/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image: base64, fileName: 'invoice_logo' }),
            });
            const upData = await upRes.json();
            const finalLogo = upData.url || base64;
            setSettingsMap((prev) => ({ ...prev, invoice_logo_url: finalLogo }));
            setActionMessage('Receipt logo uploaded and updated!');
            setTimeout(() => setActionMessage(null), 3000);
          } catch {
            setSettingsMap((prev) => ({ ...prev, invoice_logo_url: base64 }));
          } finally {
            setIsUploadingInvoiceLogo(false);
            if (invoiceLogoFileInputRef.current) invoiceLogoFileInputRef.current.value = '';
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch {
      setIsUploadingInvoiceLogo(false);
    }
  };

  // Multi-Photo Studio Helpers (3-4 Photos)
  const processImageFileToUrl = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 900;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
          }
          const base64 = canvas.toDataURL('image/jpeg', 0.72);

          try {
            const upRes = await fetch('/api/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image: base64, fileName: file.name }),
            });
            const upData = await upRes.json();
            if (upData.success && upData.url) {
              resolve(upData.url);
              return;
            }
          } catch {}
          resolve(base64);
        };
        img.onerror = () => resolve(event.target?.result as string);
        img.src = event.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const handleBatchPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingProductDrive(true);
    setDriveUploadMsg(`${files.length} photos process ho rahi hain...`);

    try {
      const urls: string[] = [];
      for (let i = 0; i < Math.min(files.length, 4); i++) {
        const url = await processImageFileToUrl(files[i]);
        if (url) urls.push(url);
      }

      if (urls[0]) setPhotoSlot1(urls[0]);
      if (urls[1]) setPhotoSlot2(urls[1]);
      if (urls[2]) setPhotoSlot3(urls[2]);
      if (urls[3]) setPhotoSlot4(urls[3]);

      if (urls[0]) {
        setEditingProduct((prev) => (prev ? { ...prev, image: urls[0] } : prev));
      }

      setActionMessage(`${urls.length} photos successfully attach ho gayi hain!`);
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err: any) {
      setActionMessage('Batch upload error: ' + (err?.message || 'Try again'));
      setTimeout(() => setActionMessage(null), 3500);
    } finally {
      setIsUploadingProductDrive(false);
      setDriveUploadMsg(null);
      if (batchPhotosInputRef.current) batchPhotosInputRef.current.value = '';
    }
  };

  const handleSingleSlotUpload = async (slotNumber: 1 | 2 | 3 | 4, file: File) => {
    setIsUploadingProductDrive(true);
    setDriveUploadMsg(`Slot ${slotNumber} photo upload ho rahi hai...`);
    try {
      const url = await processImageFileToUrl(file);
      if (slotNumber === 1) {
        setPhotoSlot1(url);
        setEditingProduct((prev) => (prev ? { ...prev, image: url } : prev));
      } else if (slotNumber === 2) {
        setPhotoSlot2(url);
      } else if (slotNumber === 3) {
        setPhotoSlot3(url);
      } else if (slotNumber === 4) {
        setPhotoSlot4(url);
      }
      setActionMessage(`Photo slot ${slotNumber} ready!`);
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      setActionMessage('Upload error: ' + (err?.message || 'Try again'));
      setTimeout(() => setActionMessage(null), 3000);
    } finally {
      setIsUploadingProductDrive(false);
      setDriveUploadMsg(null);
    }
  };

  const handleSwapSlotWithCover = (slotNumber: 2 | 3 | 4) => {
    let targetSlotVal = '';
    if (slotNumber === 2) {
      targetSlotVal = photoSlot2;
      setPhotoSlot2(photoSlot1);
    } else if (slotNumber === 3) {
      targetSlotVal = photoSlot3;
      setPhotoSlot3(photoSlot1);
    } else if (slotNumber === 4) {
      targetSlotVal = photoSlot4;
      setPhotoSlot4(photoSlot1);
    }
    setPhotoSlot1(targetSlotVal);
    setEditingProduct((prev) => (prev ? { ...prev, image: targetSlotVal } : prev));
    setActionMessage(`Slot ${slotNumber} ko Main Cover Photo bana diya gaya hai!`);
    setTimeout(() => setActionMessage(null), 3000);
  };

  // Order CRUD Handlers
  const handleCreateManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderForm.customerName || !newOrderForm.customerPhone || !newOrderForm.shippingAddress) {
      setActionMessage('Customer Name, Phone number aur Address bharna zaroori hai.');
      setTimeout(() => setActionMessage(null), 3500);
      return;
    }

    setIsSavingOrder(true);
    try {
      const payload = {
        customerName: newOrderForm.customerName,
        customerPhone: newOrderForm.customerPhone,
        customerEmail: newOrderForm.customerEmail,
        shippingAddress: newOrderForm.shippingAddress,
        city: newOrderForm.city,
        state: newOrderForm.state,
        pincode: newOrderForm.pincode,
        totalAmount: Number(newOrderForm.totalAmount),
        discountAmount: Number(newOrderForm.discountAmount) || 0,
        paymentMethod: newOrderForm.paymentMethod,
        paymentStatus: newOrderForm.paymentStatus,
        orderStatus: newOrderForm.orderStatus,
        notes: newOrderForm.notes,
        courierPartner: newOrderForm.courierPartner,
        trackingNumber: newOrderForm.trackingNumber,
        items: [
          {
            productName: newOrderForm.itemName || 'Custom SS Vastra Outfit',
            size: newOrderForm.itemSize || 'M',
            quantity: Number(newOrderForm.itemQuantity) || 1,
            unitPrice: Number(newOrderForm.itemPrice) || Number(newOrderForm.totalAmount),
            totalPrice: Number(newOrderForm.totalAmount),
          },
        ],
      };

      const res = await fetch('/api/admin/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage(data.message || 'Customer order created successfully!');
        setTimeout(() => setActionMessage(null), 3500);
        setShowAddOrderModal(false);
        loadTabData('orders');
      } else {
        setActionMessage(data.error || 'Failed to create order');
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (err: any) {
      setActionMessage('Error creating order: ' + (err?.message || 'Server error'));
      setTimeout(() => setActionMessage(null), 4000);
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleUpdateOrderDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrderModal) return;

    setIsSavingOrder(true);
    try {
      const res = await fetch(`/api/admin/orders/${editingOrderModal.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingOrderModal),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage('Order details updated successfully!');
        setTimeout(() => setActionMessage(null), 3500);
        setEditingOrderModal(null);
        loadTabData('orders');
      } else {
        setActionMessage(data.error || 'Failed to update order');
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (err: any) {
      setActionMessage('Error updating order: ' + (err?.message || 'Server error'));
      setTimeout(() => setActionMessage(null), 4000);
    } finally {
      setIsSavingOrder(false);
    }
  };

  const executeDeleteOrder = async (orderId: number) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage('Order permanently removed.');
        setTimeout(() => setActionMessage(null), 3500);
        setOrderToDelete(null);
        loadTabData('orders');
      } else {
        setActionMessage(data.error || 'Failed to delete order');
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (err: any) {
      setActionMessage('Error deleting order: ' + (err?.message || 'Server error'));
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  // Tracking Management Handlers
  const handleOpenTrackingModal = (ord: Order) => {
    setTrackingModalOrder(ord);
    const ship = (ord as any).shipment || {};
    setTrackingForm({
      courierPartner: ship.courierPartner || ship.courierName || 'Delhivery Express',
      trackingNumber: ship.trackingNumber || ord.trackingNumber || '',
      trackingUrl: ship.trackingUrl || (ship.trackingNumber ? `https://www.delhivery.com/track/package/${ship.trackingNumber}` : ''),
      estimatedDelivery: ship.estimatedDelivery || '3 to 5 Business Days',
      status: ord.orderStatus || 'Shipped',
      newCheckpointStatus: 'In Transit',
      newCheckpointLocation: 'Jaipur Fulfillment Hub',
      newCheckpointNote: `Order dispatched via ${ship.courierPartner || 'Delhivery Express'}`,
    });
  };

  const handleSaveTrackingDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingModalOrder) return;

    try {
      const res = await fetch(`/api/admin/orders/${trackingModalOrder.id}/tracking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courierPartner: trackingForm.courierPartner,
          trackingNumber: trackingForm.trackingNumber,
          trackingUrl: trackingForm.trackingUrl,
          estimatedDelivery: trackingForm.estimatedDelivery,
          status: trackingForm.status,
          note: trackingForm.newCheckpointNote,
          location: trackingForm.newCheckpointLocation,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage('Tracking and shipment details updated successfully!');
        setTimeout(() => setActionMessage(null), 3500);
        setTrackingModalOrder(null);
        loadTabData('orders');
      } else {
        setActionMessage(data.error || 'Failed to update tracking');
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (err: any) {
      setActionMessage('Error updating tracking: ' + (err?.message || 'Server error'));
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const handleRemoveTracking = async (orderId: number) => {
    if (!confirm('Kya aap is order ki tracking details remove karna chahte hain?')) return;

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/tracking`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage('Order tracking details removed successfully.');
        setTimeout(() => setActionMessage(null), 3500);
        setTrackingModalOrder(null);
        loadTabData('orders');
      } else {
        setActionMessage(data.error || 'Failed to remove tracking');
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (err: any) {
      setActionMessage('Error removing tracking: ' + (err?.message || 'Server error'));
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  // Product Actions
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCover = photoSlot1 || photoSlot2 || photoSlot3 || photoSlot4 || editingProduct?.image || '';
    if (!editingProduct?.name || !editingProduct?.price || !finalCover) {
      setActionMessage('Kripya Product Title, Price, aur Photo (Slot 1) daalein.');
      setTimeout(() => setActionMessage(null), 3500);
      return;
    }

    const isNew = isCreatingProduct;
    const allSlots = [photoSlot1, photoSlot2, photoSlot3, photoSlot4].filter(Boolean);
    const extraSlots = [photoSlot2, photoSlot3, photoSlot4].filter(Boolean);

    const sanitizedProduct = {
      ...editingProduct,
      image: normalizeProductImageUrl(finalCover),
      gallery: allSlots.length > 0 ? allSlots : [finalCover],
      images: allSlots.length > 0 ? allSlots : [finalCover],
      extraImages: extraSlots,
    };

    const persistLocally = (prodToSave: Product) => {
      try {
        const rawCustom = JSON.parse(
          localStorage.getItem('ss_vastra_custom_products') || '[]'
        );
        const customProds: Product[] = sanitizeProductList(rawCustom);
        const cIdx = customProds.findIndex((p) => p.id === prodToSave.id);
        if (cIdx >= 0) customProds[cIdx] = { ...customProds[cIdx], ...prodToSave };
        else customProds.unshift(prodToSave);

        try {
          localStorage.setItem('ss_vastra_custom_products', JSON.stringify(customProds.slice(0, 50)));
        } catch (storageErr) {
          console.warn('LocalStorage save note:', storageErr);
        }

        const deletedIds: number[] = JSON.parse(
          localStorage.getItem('ss_vastra_deleted_product_ids') || '[]'
        );
        const filteredDeleted = deletedIds.filter((id) => id !== prodToSave.id);
        localStorage.setItem('ss_vastra_deleted_product_ids', JSON.stringify(filteredDeleted));
      } catch {}

      setProductsList((prev) => {
        const idx = prev.findIndex((p) => p.id === prodToSave.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = prodToSave;
          return sanitizeProductList(updated);
        }
        return sanitizeProductList([prodToSave, ...prev]);
      });

      setEditingProduct(null);
      setIsCreatingProduct(false);
      setPhotoSlot1('');
      setPhotoSlot2('');
      setPhotoSlot3('');
      setPhotoSlot4('');
      if (onProductsUpdated) onProductsUpdated();
      window.dispatchEvent(new CustomEvent('ss-vastra-products-updated'));
    };

    try {
      const url = isNew ? '/api/admin/products' : `/api/admin/products/${editingProduct.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(sanitizedProduct),
      });
      const rawText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(rawText);
      } catch {}

      if (res.ok && data.success) {
        const rawSaved: Product = data.product || {
          ...sanitizedProduct,
          id: isNew ? Date.now() : editingProduct.id!,
        };
        const savedItem: Product = sanitizeProduct(rawSaved);
        persistLocally(savedItem);
        setActionMessage(`Product ${isNew ? 'safalata se add ho gaya' : 'safalata se update ho gaya'}!`);
        setTimeout(() => setActionMessage(null), 3000);
        loadTabData('products');
      } else {
        // Optimistic fallback on server error
        const fallbackItem: Product = sanitizeProduct({
          ...sanitizedProduct,
          id: isNew ? Date.now() : (editingProduct.id || Date.now()),
          slug: sanitizedProduct.slug || sanitizedProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(100 + Math.random() * 900),
          isActive: true,
          createdAt: new Date().toISOString(),
        });
        persistLocally(fallbackItem);
        setActionMessage(`Product catalog me save ho gaya (${isNew ? 'Naya Product Added' : 'Product Updated'})!`);
        setTimeout(() => setActionMessage(null), 3500);
      }
    } catch (err: any) {
      console.warn('Network issue saving product, applying optimistic local save:', err);
      // Optimistic fallback on network/timeout error
      const fallbackItem: Product = sanitizeProduct({
        ...sanitizedProduct,
        id: isNew ? Date.now() : (editingProduct.id || Date.now()),
        slug: sanitizedProduct.slug || sanitizedProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(100 + Math.random() * 900),
        isActive: true,
        createdAt: new Date().toISOString(),
      });
      persistLocally(fallbackItem);
      setActionMessage(`Product catalog me save ho gaya (${isNew ? 'Naya Product Added' : 'Product Updated'})!`);
      setTimeout(() => setActionMessage(null), 3500);
    }
  };

  const handleDeleteProduct = (id: number, productName?: string) => {
    setProductToDelete({ id, name: productName || 'is product' });
  };

  const executeDeleteProduct = async (id: number, productName?: string) => {
    // 1. Immediately remove from local state
    setProductsList((prev) => prev.filter((p) => p.id !== id));
    if (editingProduct?.id === id) {
      setEditingProduct(null);
    }

    // 2. Persist deletion in localStorage so it NEVER reappears even if Vercel serverless restarts
    try {
      const deletedIds: number[] = JSON.parse(
        localStorage.getItem('ss_vastra_deleted_product_ids') || '[]'
      );
      if (!deletedIds.includes(id)) {
        deletedIds.push(id);
        localStorage.setItem('ss_vastra_deleted_product_ids', JSON.stringify(deletedIds));
      }
      const customProds: any[] = JSON.parse(
        localStorage.getItem('ss_vastra_custom_products') || '[]'
      );
      const filteredCustom = customProds.filter((p) => p.id !== id);
      localStorage.setItem('ss_vastra_custom_products', JSON.stringify(filteredCustom));
    } catch {}

    // 3. Dispatch global sync event
    if (onProductsUpdated) onProductsUpdated();
    window.dispatchEvent(new CustomEvent('ss-vastra-products-updated'));

    // 4. Send DELETE request to server
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const rawText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(rawText);
      } catch {}

      setActionMessage('Outfit website se delete ho gaya!');
      setTimeout(() => setActionMessage(null), 3000);
      loadTabData('products');
    } catch (err: any) {
      console.warn('Server delete error, but locally deleted:', err);
      setActionMessage('Outfit website se delete ho gaya!');
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  // Settings Save
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settingsMap),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage('Store settings updated successfully!');
        setTimeout(() => setActionMessage(null), 3000);
      }
    } catch {
      alert('Failed to update settings');
    }
  };

  // Helper to save any subset of settings
  const handleSaveSettingsMap = async (updated: Record<string, string>, successMsg = 'Settings saved successfully!') => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      if (data.success) {
        setSettingsMap(updated);
        setActionMessage(successMsg);
        setTimeout(() => setActionMessage(null), 3000);
      } else {
        alert(data.error || 'Failed to update settings');
      }
    } catch {
      alert('Network error updating settings');
    }
  };

  // Delivery Partners helpers
  const handleSavePartnersList = async (updatedList: DeliveryPartner[]) => {
    const defaultPartner = updatedList.find((p) => p.isDefault) || updatedList[0];
    const updated = {
      ...settingsMap,
      delivery_partners: JSON.stringify(updatedList),
      ...(defaultPartner ? { default_delivery_partner: defaultPartner.id } : {}),
    };
    await handleSaveSettingsMap(updated, 'Delivery partners updated successfully!');
  };

  const handleTogglePartner = async (id: string) => {
    const updated = deliveryPartnersList.map((p) =>
      p.id === id ? { ...p, isActive: !p.isActive } : p
    );
    await handleSavePartnersList(updated);
  };

  const handleSetDefaultPartner = async (id: string) => {
    const updated = deliveryPartnersList.map((p) => ({
      ...p,
      isDefault: p.id === id,
    }));
    await handleSavePartnersList(updated);
  };

  const handleDeletePartner = async (id: string) => {
    if (deliveryPartnersList.length <= 1) {
      setActionMessage('At least one delivery partner must remain configured.');
      setTimeout(() => setActionMessage(null), 3000);
      return;
    }
    const updated = deliveryPartnersList.filter((p) => p.id !== id);
    if (!updated.some((p) => p.isDefault) && updated.length > 0) {
      updated[0].isDefault = true;
    }
    await handleSavePartnersList(updated);
  };

  const handleAddPartnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartnerForm.name.trim()) {
      alert('Please enter courier partner name');
      return;
    }
    const newId = newPartnerForm.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '_' + Date.now();
    let updatedList = [...deliveryPartnersList];
    if (newPartnerForm.isDefault) {
      updatedList = updatedList.map((p) => ({ ...p, isDefault: false }));
    }
    const newPartner: DeliveryPartner = {
      id: newId,
      name: newPartnerForm.name.trim(),
      trackingUrlTemplate: newPartnerForm.trackingUrlTemplate.trim() || 'https://www.delhivery.com/track/package/{TRACKING_NO}',
      estimatedDays: newPartnerForm.estimatedDays.trim() || '2 to 4 Business Days',
      phone: newPartnerForm.phone?.trim() || '',
      isDefault: newPartnerForm.isDefault,
      isActive: newPartnerForm.isActive,
    };
    updatedList.push(newPartner);
    await handleSavePartnersList(updatedList);
    setShowAddDeliveryModal(false);
    setNewPartnerForm({
      name: '',
      trackingUrlTemplate: 'https://',
      estimatedDays: '2 to 4 Business Days',
      phone: '',
      isDefault: false,
      isActive: true,
    });
  };

  // Payment Gateways helpers
  const handleSaveGatewaysList = async (updatedList: PaymentGateway[]) => {
    const defaultGw = updatedList.find((g) => g.isDefault) || updatedList[0];
    const updated: Record<string, string> = {
      ...settingsMap,
      payment_gateways_list: JSON.stringify(updatedList),
    };
    if (defaultGw) {
      updated.payment_gateway_provider = defaultGw.provider;
      updated.payment_gateway_mode = defaultGw.mode;
      if (defaultGw.provider === 'razorpay') {
        if (defaultGw.keyId) updated.razorpay_key_id = defaultGw.keyId;
        if (defaultGw.keySecret) updated.razorpay_key_secret = defaultGw.keySecret;
      } else if (defaultGw.provider === 'phonepe') {
        if (defaultGw.keyId) updated.phonepe_merchant_id = defaultGw.keyId;
        if (defaultGw.keySecret) updated.phonepe_salt_key = defaultGw.keySecret;
      } else if (defaultGw.provider === 'cashfree') {
        if (defaultGw.keyId) updated.cashfree_app_id = defaultGw.keyId;
      }
    }
    await handleSaveSettingsMap(updated, 'Payment gateways list updated successfully!');
  };

  const handleToggleGateway = async (id: string) => {
    const updated = paymentGatewaysList.map((g) =>
      g.id === id ? { ...g, isActive: !g.isActive } : g
    );
    await handleSaveGatewaysList(updated);
  };

  const handleSetDefaultGateway = async (id: string) => {
    const updated = paymentGatewaysList.map((g) => ({
      ...g,
      isDefault: g.id === id,
      isActive: g.id === id ? true : g.isActive,
    }));
    await handleSaveGatewaysList(updated);
  };

  const handleDeleteGateway = async (id: string) => {
    if (paymentGatewaysList.length <= 1) {
      setActionMessage('At least one payment gateway must remain configured.');
      setTimeout(() => setActionMessage(null), 3000);
      return;
    }
    const updated = paymentGatewaysList.filter((g) => g.id !== id);
    if (!updated.some((g) => g.isDefault) && updated.length > 0) {
      updated[0].isDefault = true;
    }
    await handleSaveGatewaysList(updated);
  };

  const handleAddGatewaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGatewayForm.name.trim()) {
      alert('Please enter gateway title/name');
      return;
    }
    const newId = 'gw_' + newGatewayForm.provider + '_' + Date.now();
    let updatedList = [...paymentGatewaysList];
    if (newGatewayForm.isDefault) {
      updatedList = updatedList.map((g) => ({ ...g, isDefault: false }));
    }
    const newGw: PaymentGateway = {
      id: newId,
      name: newGatewayForm.name.trim(),
      provider: newGatewayForm.provider,
      keyId: newGatewayForm.keyId.trim(),
      keySecret: newGatewayForm.keySecret?.trim() || '',
      webhookSecret: newGatewayForm.webhookSecret?.trim() || '',
      mode: newGatewayForm.mode,
      isActive: newGatewayForm.isActive,
      isDefault: newGatewayForm.isDefault || updatedList.length === 0,
      instructions: newGatewayForm.instructions?.trim() || '',
    };
    updatedList.push(newGw);
    await handleSaveGatewaysList(updatedList);
    setShowAddGatewayModal(false);
    setNewGatewayForm({
      name: '',
      provider: 'razorpay',
      keyId: '',
      keySecret: '',
      webhookSecret: '',
      mode: 'test',
      isActive: true,
      isDefault: false,
      instructions: '',
    });
  };

  // Bank Accounts helpers
  const handleSaveBankList = async (updatedList: BankAccount[]) => {
    const defaultBank = updatedList.find((b) => b.isDefault) || updatedList[0];
    const updated: Record<string, string> = {
      ...settingsMap,
      bank_accounts_list: JSON.stringify(updatedList),
    };
    if (defaultBank) {
      updated.bank_name = defaultBank.bankName;
      updated.bank_account_holder = defaultBank.accountHolder;
      updated.bank_account_number = defaultBank.accountNumber;
      updated.bank_ifsc = defaultBank.ifsc;
      updated.bank_account_type = defaultBank.accountType;
      if (defaultBank.branch) updated.bank_branch = defaultBank.branch;
      if (defaultBank.instructions) updated.bank_instructions = defaultBank.instructions;
    }
    await handleSaveSettingsMap(updated, 'Bank accounts list updated successfully!');
  };

  const handleToggleBank = async (id: string) => {
    const updated = bankAccountsList.map((b) =>
      b.id === id ? { ...b, isActive: !b.isActive } : b
    );
    await handleSaveBankList(updated);
  };

  const handleSetDefaultBank = async (id: string) => {
    const updated = bankAccountsList.map((b) => ({
      ...b,
      isDefault: b.id === id,
      isActive: b.id === id ? true : b.isActive,
    }));
    await handleSaveBankList(updated);
  };

  const handleDeleteBank = async (id: string) => {
    if (bankAccountsList.length <= 1) {
      setActionMessage('At least one bank account must remain configured.');
      setTimeout(() => setActionMessage(null), 3000);
      return;
    }
    const updated = bankAccountsList.filter((b) => b.id !== id);
    if (!updated.some((b) => b.isDefault) && updated.length > 0) {
      updated[0].isDefault = true;
    }
    await handleSaveBankList(updated);
  };

  const handleAddBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankForm.bankName.trim() || !newBankForm.accountNumber.trim()) {
      alert('Please fill in bank name and account number');
      return;
    }
    const newId = 'bank_' + Date.now();
    let updatedList = [...bankAccountsList];
    if (newBankForm.isDefault) {
      updatedList = updatedList.map((b) => ({ ...b, isDefault: false }));
    }
    const newBank: BankAccount = {
      id: newId,
      bankName: newBankForm.bankName.trim(),
      accountHolder: newBankForm.accountHolder.trim() || 'SS VASTRA JAIPUR',
      accountNumber: newBankForm.accountNumber.trim(),
      ifsc: newBankForm.ifsc.trim().toUpperCase(),
      accountType: newBankForm.accountType,
      branch: newBankForm.branch?.trim() || '',
      upiId: newBankForm.upiId?.trim() || '',
      instructions: newBankForm.instructions?.trim() || '',
      isDefault: newBankForm.isDefault || updatedList.length === 0,
      isActive: newBankForm.isActive,
    };
    updatedList.push(newBank);
    await handleSaveBankList(updatedList);
    setShowAddBankModal(false);
    setNewBankForm({
      bankName: '',
      accountHolder: '',
      accountNumber: '',
      ifsc: '',
      accountType: 'Current Account',
      branch: '',
      upiId: '',
      instructions: '',
      isDefault: false,
      isActive: true,
    });
  };

  // UPI Accounts helpers
  const handleSaveUpiList = async (updatedList: UpiAccount[]) => {
    const defaultUpi = updatedList.find((u) => u.isDefault) || updatedList[0];
    const updated: Record<string, string> = {
      ...settingsMap,
      upi_accounts_list: JSON.stringify(updatedList),
    };
    if (defaultUpi) {
      updated.upi_id = defaultUpi.upiId;
      updated.upi_name = defaultUpi.payeeName;
      if (defaultUpi.phone) updated.upi_number = defaultUpi.phone;
      if (defaultUpi.qrImageUrl) updated.upi_qr_image = defaultUpi.qrImageUrl;
    }
    await handleSaveSettingsMap(updated, 'UPI accounts list updated successfully!');
  };

  const handleToggleUpi = async (id: string) => {
    const updated = upiAccountsList.map((u) =>
      u.id === id ? { ...u, isActive: !u.isActive } : u
    );
    await handleSaveUpiList(updated);
  };

  const handleSetDefaultUpi = async (id: string) => {
    const updated = upiAccountsList.map((u) => ({
      ...u,
      isDefault: u.id === id,
      isActive: u.id === id ? true : u.isActive,
    }));
    await handleSaveUpiList(updated);
  };

  const handleDeleteUpi = async (id: string) => {
    if (upiAccountsList.length <= 1) {
      setActionMessage('At least one UPI account must remain configured.');
      setTimeout(() => setActionMessage(null), 3000);
      return;
    }
    const updated = upiAccountsList.filter((u) => u.id !== id);
    if (!updated.some((u) => u.isDefault) && updated.length > 0) {
      updated[0].isDefault = true;
    }
    await handleSaveUpiList(updated);
  };

  const handleAddUpiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUpiForm.upiId.trim()) {
      alert('Please enter a valid UPI VPA ID (e.g. name@bank)');
      return;
    }
    const newId = 'upi_' + Date.now();
    let updatedList = [...upiAccountsList];
    if (newUpiForm.isDefault) {
      updatedList = updatedList.map((u) => ({ ...u, isDefault: false }));
    }
    const finalQr =
      newUpiForm.qrImageUrl ||
      `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(
        `upi://pay?pa=${newUpiForm.upiId.trim()}&pn=${encodeURIComponent(
          newUpiForm.payeeName.trim() || 'SS VASTRA JAIPUR'
        )}&cu=INR`
      )}`;

    const newUpi: UpiAccount = {
      id: newId,
      title: newUpiForm.title.trim() || newUpiForm.upiId.trim(),
      upiId: newUpiForm.upiId.trim(),
      payeeName: newUpiForm.payeeName.trim() || 'SS VASTRA JAIPUR',
      phone: newUpiForm.phone?.trim() || '',
      qrImageUrl: finalQr,
      isDefault: newUpiForm.isDefault || updatedList.length === 0,
      isActive: newUpiForm.isActive,
    };
    updatedList.push(newUpi);
    await handleSaveUpiList(updatedList);
    setShowAddUpiModal(false);
    setNewUpiForm({
      title: '',
      upiId: '',
      payeeName: '',
      phone: '',
      qrImageUrl: '',
      isDefault: false,
      isActive: true,
    });
  };

  const handleNewUpiQrFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const base64 = evt.target?.result as string;
        if (base64) {
          setNewUpiForm((prev) => ({ ...prev, qrImageUrl: base64 }));
        }
      };
      reader.readAsDataURL(file);
    } catch {
      alert('Failed to read image file');
    }
  };

  const handleGenerateNewUpiQr = () => {
    if (!newUpiForm.upiId.trim()) {
      alert('Please enter UPI ID first');
      return;
    }
    const qr = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(
      `upi://pay?pa=${newUpiForm.upiId.trim()}&pn=${encodeURIComponent(
        newUpiForm.payeeName.trim() || 'SS VASTRA JAIPUR'
      )}&cu=INR`
    )}`;
    setNewUpiForm((prev) => ({ ...prev, qrImageUrl: qr }));
  };

  const handleUpiQrFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const base64 = evt.target?.result as string;
        if (base64) {
          const updated = { ...settingsMap, upi_qr_image: base64 };
          await handleSaveSettingsMap(updated, 'UPI QR code uploaded successfully!');
        }
      };
      reader.readAsDataURL(file);
    } catch {
      alert('Failed to read image file');
    }
  };

  const handleGenerateNpciQr = async () => {
    const upiId = settingsMap['upi_id'] || '9783770735@upi';
    const upiName = settingsMap['upi_name'] || 'SS VASTRA JAIPUR';
    const generatedUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(
      `upi://pay?pa=${upiId}&pn=${upiName}&cu=INR`
    )}`;
    const updated = { ...settingsMap, upi_qr_image: generatedUrl };
    await handleSaveSettingsMap(updated, 'NPCI QR code generated and saved!');
  };

  const handleExportReportsCSV = () => {
    const pSales = ((salesReports as { productSales?: { productName: string; quantity: number; revenue: number }[] })?.productSales || []);
    let csv = 'Outfit / Product Name,Units Sold,Revenue (INR)\n';
    pSales.forEach((p) => {
      csv += `"${p.productName.replace(/"/g, '""')}",${p.quantity},${p.revenue}\n`;
    });
    if (ordersList.length > 0) {
      csv += '\nOrder Number,Customer Name,Phone,Amount (INR),Order Status,Payment Mode,Payment Status\n';
      ordersList.forEach((ord) => {
        csv += `"${ord.orderNumber}","${ord.customerName}","${ord.customerPhone}",${ord.totalAmount},"${ord.orderStatus}","${ord.paymentMethod}","${ord.paymentStatus}"\n`;
      });
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ss_vastra_sales_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  // Check if current staff has permission to view current tab
  const isSuperAdminOnlyTab = [
    'staff',
    'settings',
    'reports',
    'customers',
    'coupons',
    'activity',
  ].includes(activeTab);
  const isAccessDenied = currentAdmin?.role === 'staff' && isSuperAdminOnlyTab;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/65 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden my-4 border border-[#E9A9BB]/40 h-[92vh] flex flex-col">
        
        {/* Top Header Bar */}
        <div className="p-3.5 sm:p-4 bg-[#2B2320] text-white flex items-center justify-between shrink-0 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#A87A2A] flex items-center justify-center p-0.5 shadow-xs">
              <img src="/icon.svg" alt="SS VASTRA" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="font-serif font-bold text-base sm:text-lg tracking-wider text-amber-200">
                SS VASTRA Admin Portal
              </span>
              <span className="text-[11px] text-stone-400 block -mt-0.5">
                {currentAdmin
                  ? `Logged in: ${currentAdmin.name} • ${
                      currentAdmin.role === 'super_admin' ? 'Super Admin' : 'Staff Member'
                    }`
                  : 'Secure Commerce Management Console'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedDeepLinkProduct(null);
                setShowDeepLinkModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#A87A2A] hover:bg-[#8e6520] text-xs text-white font-bold transition-all shadow-xs"
              title="Generate Deep Links & QR Codes for marketing & WhatsApp"
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Deep Links & QR</span>
            </button>

            {currentAdmin && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-rose-900/60 text-xs text-stone-200 hover:text-white transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline font-semibold">Logout</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white transition-colors"
              aria-label="Close admin"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Toast Message */}
        {actionMessage && (
          <div className="bg-emerald-600 text-white text-xs font-semibold px-4 py-2 text-center flex items-center justify-center gap-2 animate-in fade-in shrink-0">
            <CheckCircle className="w-4 h-4" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Inactivity Notice Toast */}
        {sessionNotice && (
          <div className="bg-amber-600 text-white text-xs font-semibold px-4 py-2 text-center flex items-center justify-center gap-2 animate-in fade-in shrink-0">
            <Clock className="w-4 h-4" />
            <span>{sessionNotice}</span>
          </div>
        )}

        {/* Force Change Password Modal (First Super Admin Login) */}
        {mustChangePass && (
          <div className="absolute inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-[#A87A2A]">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-[#A87A2A] mb-3">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-[#2B2320] mb-1">
                Set Your New Password
              </h3>
              <p className="text-xs text-stone-600 mb-4 leading-relaxed">
                As per SS VASTRA security protocol, you must set a strong, personal password upon first login before accessing the store dashboard.
              </p>

              {forcePassError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs mb-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{forcePassError}</span>
                </div>
              )}

              <form onSubmit={handleForceChangePassword} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    New Password (Min. 8 characters, letters & numbers)
                  </label>
                  <div className="relative">
                    <input
                      type={showForcePassword ? 'text' : 'password'}
                      required
                      value={forceNewPassword}
                      onChange={(e) => setForceNewPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 pr-10 focus:outline-none focus:border-[#A87A2A]"
                      placeholder="Enter strong new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowForcePassword(!showForcePassword)}
                      className="absolute right-3 top-3 text-stone-400 hover:text-stone-600"
                    >
                      {showForcePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type={showForcePassword ? 'text' : 'password'}
                    required
                    value={forceConfirmPassword}
                    onChange={(e) => setForceConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                    placeholder="Re-enter new password"
                  />
                </div>

                <div className="p-2.5 rounded-xl bg-amber-50 text-[11px] text-amber-900 border border-amber-200">
                  Password rule: Kam se kam 8 akshar, jisme letters aur numbers dono shamil hon.
                </div>

                <button
                  type="submit"
                  disabled={isForceSaving}
                  className="w-full py-3 rounded-xl bg-[#A87A2A] hover:bg-[#8e6520] text-white font-bold text-xs uppercase tracking-wider shadow-md transition-colors disabled:opacity-50 mt-2"
                >
                  {isForceSaving ? 'Saving New Password...' : 'Save Password & Enter Dashboard'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* NOT LOGGED IN / AUTH FLOWS */}
        {!token || !currentAdmin ? (
          <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-[#FBF7F0] overflow-y-auto">
            <div className="w-full max-w-md bg-white p-6 sm:p-9 rounded-3xl shadow-xl border border-[#E9A9BB]/40">
              
              {/* Brand Logo & Title on Cream Card */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-[#FBF7F0] p-2 mx-auto mb-3 border-2 border-[#A87A2A]/40 flex items-center justify-center shadow-xs">
                  <img src="/icon.svg" alt="SS VASTRA" className="w-full h-full object-contain" />
                </div>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2B2320]">
                  SS VASTRA
                </h1>
                <p className="text-xs uppercase tracking-[0.2em] font-semibold text-[#A87A2A] mt-0.5">
                  Jaipur Ethnic Couture • Admin Panel
                </p>
              </div>

              {/* View 1: Standard Login Page */}
              {authView === 'login' && (
                <div>
                  <div className="text-center mb-5">
                    <h2 className="font-serif text-xl font-bold text-[#2B2320]">
                      {requireOtp ? 'Two-Factor Verification' : 'Admin Sign In'}
                    </h2>
                    <p className="text-xs text-stone-500 mt-1">
                      {requireOtp
                        ? 'Enter the 6-digit OTP code sent to your registered email.'
                        : 'Sign in with your email and password to access the store.'}
                    </p>
                  </div>

                  {loginError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs mb-4 flex items-center gap-2 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  {otpMessage && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs mb-4 flex items-center gap-2 animate-in fade-in">
                      <Mail className="w-4 h-4 shrink-0 text-[#A87A2A]" />
                      <span>{otpMessage}</span>
                    </div>
                  )}

                  <form onSubmit={handleLogin} className="space-y-4 text-xs">
                    {!requireOtp ? (
                      <>
                        {/* Email Field */}
                        <div>
                          <label className="block font-semibold text-stone-700 mb-1">
                            Email
                          </label>
                          <div className="relative">
                            <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                            <input
                              type="email"
                              required
                              placeholder="e.g. subhashmeena3111@gmail.com"
                              value={loginEmail}
                              onChange={(e) => setLoginEmail(e.target.value)}
                              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A] text-xs"
                            />
                          </div>
                        </div>

                        {/* Password Field with Show/Hide Toggle */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="font-semibold text-stone-700">
                              Password
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setAuthView('forgot_password');
                                setForgotStatus(null);
                              }}
                              className="text-[11px] font-semibold text-[#A87A2A] hover:underline"
                            >
                              Forgot password?
                            </button>
                          </div>
                          <div className="relative">
                            <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                            <input
                              type={showPassword ? 'text' : 'password'}
                              required
                              placeholder="Enter your password"
                              value={loginPassword}
                              onChange={(e) => setLoginPassword(e.target.value)}
                              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A] text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-600"
                              tabIndex={-1}
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      /* 2FA OTP Field */
                      <div>
                        <label className="block font-semibold text-stone-700 mb-1">
                          6-Digit Verification Code
                        </label>
                        <div className="relative">
                          <KeyRound className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                          <input
                            type="text"
                            maxLength={6}
                            required
                            placeholder="123456"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value)}
                            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 font-mono text-center tracking-widest text-base font-bold focus:outline-none focus:border-[#A87A2A]"
                          />
                        </div>
                      </div>
                    )}

                    {/* Gold Action Button */}
                    <button
                      type="submit"
                      disabled={isLoggingIn}
                      className="w-full py-3 rounded-xl bg-[#A87A2A] hover:bg-[#8e6520] text-white font-bold text-xs uppercase tracking-wider shadow-md transition-colors disabled:opacity-50 mt-2"
                    >
                      {isLoggingIn
                        ? 'Logging In...'
                        : requireOtp
                        ? 'Verify OTP & Enter'
                        : 'Login'}
                    </button>

                    {requireOtp && (
                      <button
                        type="button"
                        onClick={() => {
                          setRequireOtp(false);
                          setOtpCode('');
                          setOtpMessage(null);
                        }}
                        className="w-full text-center text-xs text-stone-500 hover:text-stone-800 underline"
                      >
                        Cancel OTP & Back to Password
                      </button>
                    )}
                  </form>
                </div>
              )}

              {/* View 2: Forgot Password Request */}
              {authView === 'forgot_password' && (
                <div>
                  <div className="text-center mb-5">
                    <h2 className="font-serif text-xl font-bold text-[#2B2320]">
                      Forgot Password?
                    </h2>
                    <p className="text-xs text-stone-500 mt-1">
                      Enter your registered email address to receive a secure password reset link (valid for 30 minutes).
                    </p>
                  </div>

                  {forgotStatus && (
                    <div
                      className={`p-3 rounded-xl text-xs mb-4 flex items-center gap-2 ${
                        forgotStatus.success
                          ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                          : 'bg-rose-50 border border-rose-200 text-rose-700'
                      }`}
                    >
                      {forgotStatus.success ? (
                        <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      )}
                      <span>{forgotStatus.message}</span>
                    </div>
                  )}

                  <form onSubmit={handleForgotPassword} className="space-y-4 text-xs">
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">
                        Registered Email Address
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                        <input
                          type="email"
                          required
                          placeholder="subhashmeena3111@gmail.com"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSendingForgot}
                      className="w-full py-3 rounded-xl bg-[#A87A2A] hover:bg-[#8e6520] text-white font-bold text-xs uppercase tracking-wider shadow-md transition-colors disabled:opacity-50"
                    >
                      {isSendingForgot ? 'Sending Link...' : 'Email Reset Link'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAuthView('login');
                        setForgotStatus(null);
                      }}
                      className="w-full text-center text-xs font-semibold text-stone-600 hover:text-stone-900 underline"
                    >
                      ← Back to Login
                    </button>
                  </form>
                </div>
              )}

              {/* View 3: Reset Password via 30-min Token */}
              {authView === 'reset_password' && (
                <div>
                  <div className="text-center mb-5">
                    <h2 className="font-serif text-xl font-bold text-[#2B2320]">
                      Reset Your Password
                    </h2>
                    <p className="text-xs text-stone-500 mt-1">
                      Enter a new strong password for your SS VASTRA admin account.
                    </p>
                  </div>

                  {resetStatus && (
                    <div
                      className={`p-3 rounded-xl text-xs mb-4 flex items-center gap-2 ${
                        resetStatus.success
                          ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                          : 'bg-rose-50 border border-rose-200 text-rose-700'
                      }`}
                    >
                      {resetStatus.success ? (
                        <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      )}
                      <span>{resetStatus.message}</span>
                    </div>
                  )}

                  {resetStatus?.success ? (
                    <button
                      type="button"
                      onClick={() => {
                        setAuthView('login');
                        setResetStatus(null);
                        window.history.pushState(null, '', '/admin');
                      }}
                      className="w-full py-3 rounded-xl bg-[#A87A2A] hover:bg-[#8e6520] text-white font-bold text-xs uppercase tracking-wider shadow-md transition-colors"
                    >
                      Sign In with New Password
                    </button>
                  ) : (
                    <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
                      <div>
                        <label className="block font-semibold text-stone-700 mb-1">
                          New Password (Min. 8 characters, letters & numbers)
                        </label>
                        <div className="relative">
                          <input
                            type={showResetPassword ? 'text' : 'password'}
                            required
                            placeholder="Enter new password"
                            value={newResetPassword}
                            onChange={(e) => setNewResetPassword(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 pr-10 focus:outline-none focus:border-[#A87A2A]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowResetPassword(!showResetPassword)}
                            className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-600"
                          >
                            {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-stone-700 mb-1">
                          Confirm New Password
                        </label>
                        <input
                          type={showResetPassword ? 'text' : 'password'}
                          required
                          placeholder="Confirm new password"
                          value={confirmResetPassword}
                          onChange={(e) => setConfirmResetPassword(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isResetting}
                        className="w-full py-3 rounded-xl bg-[#A87A2A] hover:bg-[#8e6520] text-white font-bold text-xs uppercase tracking-wider shadow-md transition-colors disabled:opacity-50"
                      >
                        {isResetting ? 'Resetting Password...' : 'Save New Password'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAuthView('login');
                          setResetStatus(null);
                          window.history.pushState(null, '', '/admin');
                        }}
                        className="w-full text-center text-xs font-semibold text-stone-600 hover:text-stone-900 underline"
                      >
                        ← Back to Login
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* View 4: Staff Invite Set Password (24-hr validity) */}
              {authView === 'set_staff_password' && (
                <div>
                  <div className="text-center mb-5">
                    <h2 className="font-serif text-xl font-bold text-[#2B2320]">
                      Activate Staff Account
                    </h2>
                    <p className="text-xs text-stone-500 mt-1">
                      Welcome to SS VASTRA! Please set your password to activate your staff login (invite link valid for 24 hours).
                    </p>
                  </div>

                  {resetStatus && !resetStatus.success && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs mb-4 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{resetStatus.message}</span>
                    </div>
                  )}

                  <form onSubmit={handleSetStaffPassword} className="space-y-4 text-xs">
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">
                        Choose Password (Min. 8 characters, letters & numbers)
                      </label>
                      <div className="relative">
                        <input
                          type={showResetPassword ? 'text' : 'password'}
                          required
                          placeholder="Create strong password"
                          value={newResetPassword}
                          onChange={(e) => setNewResetPassword(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 pr-10 focus:outline-none focus:border-[#A87A2A]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowResetPassword(!showResetPassword)}
                          className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-600"
                        >
                          {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">
                        Confirm Password
                      </label>
                      <input
                        type={showResetPassword ? 'text' : 'password'}
                        required
                        placeholder="Confirm chosen password"
                        value={confirmResetPassword}
                        onChange={(e) => setConfirmResetPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isResetting}
                      className="w-full py-3 rounded-xl bg-[#A87A2A] hover:bg-[#8e6520] text-white font-bold text-xs uppercase tracking-wider shadow-md transition-colors disabled:opacity-50"
                    >
                      {isResetting ? 'Activating Account...' : 'Set Password & Login'}
                    </button>
                  </form>
                </div>
              )}

            </div>
          </div>
        ) : (
          /* LOGGED IN DASHBOARD VIEW */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-60 bg-[#1F1A18] text-stone-300 p-3 shrink-0 flex md:flex-col overflow-x-auto md:overflow-y-auto gap-1 border-r border-stone-800">
              
              {/* User Identity Pill in Sidebar */}
              <div className="hidden md:flex items-center gap-2.5 p-3 rounded-2xl bg-stone-900 border border-stone-800 mb-2">
                <div className="w-9 h-9 rounded-xl bg-[#A87A2A]/20 border border-[#A87A2A]/40 flex items-center justify-center text-[#A87A2A] font-bold">
                  {currentAdmin.name.charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <span className="text-xs font-bold text-white block truncate">
                    {currentAdmin.name}
                  </span>
                  <span className="text-[10px] text-amber-300/80 font-mono block truncate">
                    {currentAdmin.role === 'super_admin' ? 'Super Admin' : 'Staff Member'}
                  </span>
                </div>
              </div>

              {/* Navigation Items */}
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                  activeTab === 'dashboard'
                    ? 'bg-[#A87A2A] text-white shadow-xs'
                    : 'hover:bg-stone-800 hover:text-white'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => setActiveTab('orders')}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                  activeTab === 'orders'
                    ? 'bg-[#A87A2A] text-white shadow-xs'
                    : 'hover:bg-stone-800 hover:text-white'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Orders & Fulfillment</span>
              </button>

              <button
                onClick={() => setActiveTab('products')}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                  activeTab === 'products'
                    ? 'bg-[#A87A2A] text-white shadow-xs'
                    : 'hover:bg-stone-800 hover:text-white'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Catalog & Stock</span>
              </button>

              <button
                onClick={() => setActiveTab('catalog_images')}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                  activeTab === 'catalog_images'
                    ? 'bg-[#A87A2A] text-white shadow-xs'
                    : 'hover:bg-stone-800 hover:text-white'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>Images & Banners</span>
              </button>

              {isDemoEnabled && (
                <button
                  onClick={() => setActiveTab('data_manager')}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                    activeTab === 'data_manager'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'hover:bg-stone-800 hover:text-white text-amber-300'
                  }`}
                >
                  <Database className="w-4 h-4 text-amber-400" />
                  <span className="font-bold">Demo Data Manager</span>
                </button>
              )}

              <button
                onClick={() => setActiveTab('receipts')}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                  activeTab === 'receipts'
                    ? 'bg-[#A87A2A] text-white shadow-xs'
                    : 'hover:bg-stone-800 hover:text-white'
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span>Invoices & Receipts</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('reels');
                  loadReelsData();
                }}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                  activeTab === 'reels'
                    ? 'bg-[#A87A2A] text-white shadow-xs'
                    : 'hover:bg-stone-800 hover:text-white'
                }`}
              >
                <Film className="w-4 h-4" />
                <span>Video Reels (9:16)</span>
              </button>

              {/* Super Admin Restricted Tabs */}
              {currentAdmin.role === 'super_admin' ? (
                <>
                  <div className="hidden md:block my-2 border-t border-stone-800" />
                  <span className="hidden md:block px-3 text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Super Admin Only
                  </span>

                  <button
                    onClick={() => setActiveTab('staff')}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                      activeTab === 'staff'
                        ? 'bg-[#A87A2A] text-white shadow-xs'
                        : 'hover:bg-stone-800 hover:text-white'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Staff Accounts</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('reports')}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                      activeTab === 'reports'
                        ? 'bg-[#A87A2A] text-white shadow-xs'
                        : 'hover:bg-stone-800 hover:text-white'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Sales Reports</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('customers')}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                      activeTab === 'customers'
                        ? 'bg-[#A87A2A] text-white shadow-xs'
                        : 'hover:bg-stone-800 hover:text-white'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Customers</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('coupons')}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                      activeTab === 'coupons'
                        ? 'bg-[#A87A2A] text-white shadow-xs'
                        : 'hover:bg-stone-800 hover:text-white'
                    }`}
                  >
                    <Tag className="w-4 h-4" />
                    <span>Coupons</span>
                  </button>

                  {/* Payments & Logistics Quick Navigation */}
                  <div className="pt-2 pb-1 px-3 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                    Payments & Logistics
                  </div>

                  <button
                    onClick={() => {
                      setActiveTab('settings');
                      setSettingsSubTab('gateway');
                    }}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                      activeTab === 'settings' && settingsSubTab === 'gateway'
                        ? 'bg-[#A87A2A] text-white shadow-xs'
                        : 'hover:bg-stone-800 hover:text-white text-stone-300'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Payment Gateways</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('settings');
                      setSettingsSubTab('bank');
                    }}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                      activeTab === 'settings' && settingsSubTab === 'bank'
                        ? 'bg-[#A87A2A] text-white shadow-xs'
                        : 'hover:bg-stone-800 hover:text-white text-stone-300'
                    }`}
                  >
                    <Landmark className="w-4 h-4" />
                    <span>Bank Accounts</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('settings');
                      setSettingsSubTab('upi');
                    }}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                      activeTab === 'settings' && settingsSubTab === 'upi'
                        ? 'bg-[#A87A2A] text-white shadow-xs'
                        : 'hover:bg-stone-800 hover:text-white text-stone-300'
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span>UPI & QR Codes</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('settings');
                      setSettingsSubTab('delivery');
                    }}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                      activeTab === 'settings' && settingsSubTab === 'delivery'
                        ? 'bg-[#A87A2A] text-white shadow-xs'
                        : 'hover:bg-stone-800 hover:text-white text-stone-300'
                    }`}
                  >
                    <Truck className="w-4 h-4" />
                    <span>Delivery Partners</span>
                  </button>

                  <div className="pt-2 pb-1 px-3 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                    Store Settings
                  </div>

                  <button
                    onClick={() => {
                      setActiveTab('settings');
                      setSettingsSubTab('store');
                    }}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                      activeTab === 'settings' && settingsSubTab === 'store'
                        ? 'bg-[#A87A2A] text-white shadow-xs'
                        : 'hover:bg-stone-800 hover:text-white text-stone-300'
                    }`}
                  >
                    <SettingsIcon className="w-4 h-4" />
                    <span>Store Profile & Contact</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('activity')}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                      activeTab === 'activity'
                        ? 'bg-[#A87A2A] text-white shadow-xs'
                        : 'hover:bg-stone-800 hover:text-white text-stone-300'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Activity Log</span>
                  </button>
                </>
              ) : null}
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-4 sm:p-6 overflow-y-auto bg-[#FBF7F0]">
              
              {/* Access Denied View for Staff trying to open Super Admin section */}
              {isAccessDenied ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-3xl border border-stone-200 shadow-sm my-6">
                  <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mb-4 shadow-xs">
                    <ShieldAlert className="w-8 h-8" />
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-[#2B2320] mb-2">
                    Access Denied
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 max-w-md mb-6 leading-relaxed">
                    Aapke staff account ke paas is section ko access karne ki permission nahi hai. Ye section kewal Super Admin ke liye uplabdh hai.
                  </p>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="px-6 py-2.5 rounded-xl bg-[#A87A2A] hover:bg-[#8e6520] text-white font-bold text-xs shadow-md transition-colors"
                  >
                    Go to Orders Management
                  </button>
                </div>
              ) : (
                <>
                  {/* TAB 1: DASHBOARD */}
                  {activeTab === 'dashboard' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="font-serif text-2xl font-bold text-[#2B2320]">
                            Store Operations Overview
                          </h2>
                          <p className="text-xs text-stone-500">Live PostgreSQL Database Metrics</p>
                        </div>
                        <button
                          onClick={() => loadTabData('dashboard')}
                          className="p-2 rounded-xl bg-white border border-stone-200 text-stone-600 hover:text-[#A87A2A] text-xs font-semibold shadow-xs"
                          title="Refresh"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Metrics Cards */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <div className="p-4 rounded-2xl bg-white border border-[#E9A9BB]/40 shadow-xs">
                          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                            Today's Revenue
                          </span>
                          <span className="font-serif text-2xl font-bold text-[#A87A2A] block mt-1">
                            ₹{(dashboardMetrics as { todayRevenue?: number })?.todayRevenue || 0}
                          </span>
                          <span className="text-[10px] text-stone-400 mt-1 block">
                            {(dashboardMetrics as { todayOrdersCount?: number })?.todayOrdersCount || 0} orders today
                          </span>
                        </div>

                        <div className="p-4 rounded-2xl bg-white border border-[#E9A9BB]/40 shadow-xs">
                          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                            Total Revenue
                          </span>
                          <span className="font-serif text-2xl font-bold text-[#2B2320] block mt-1">
                            ₹{((dashboardMetrics as { totalRevenue?: number })?.totalRevenue || 0).toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] text-stone-400 mt-1 block">
                            Across {(dashboardMetrics as { totalOrdersCount?: number })?.totalOrdersCount || 0} lifetime orders
                          </span>
                        </div>

                        <div className="p-4 rounded-2xl bg-white border border-[#E9A9BB]/40 shadow-xs">
                          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                            Pending Shipments
                          </span>
                          <span className="font-serif text-2xl font-bold text-amber-700 block mt-1">
                            {(dashboardMetrics as { pendingShipments?: number })?.pendingShipments || 0}
                          </span>
                          <span className="text-[10px] text-stone-400 mt-1 block">
                            Needs packing / dispatch
                          </span>
                        </div>

                        <div className="p-4 rounded-2xl bg-white border border-[#E9A9BB]/40 shadow-xs">
                          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                            Active Catalog
                          </span>
                          <span className="font-serif text-2xl font-bold text-emerald-700 block mt-1">
                            {(dashboardMetrics as { totalProductsCount?: number })?.totalProductsCount ?? (productsList.length > 0 ? productsList.length : (initialProducts?.length || 0))}
                          </span>
                          <span className="text-[10px] text-stone-400 mt-1 block">
                            Available in storefront
                          </span>
                        </div>
                      </div>

                      {/* 7-Day Revenue & Performance Chart */}
                      <div className="p-5 rounded-2xl bg-white border border-[#E9A9BB]/40 shadow-xs space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-serif text-lg font-bold text-[#2B2320]">
                              7-Day Revenue Performance
                            </h3>
                            <p className="text-xs text-stone-500">Daily sales trend over the past week</p>
                          </div>
                          <span className="text-xs font-bold text-[#A87A2A] bg-[#F7E3E8] px-2.5 py-1 rounded-full border border-[#E9A9BB]/50">
                            ₹{ordersList.slice(-7).reduce((acc, curr) => acc + (curr.totalAmount || 0), 0).toLocaleString('en-IN')} Week Sales
                          </span>
                        </div>

                        {/* Chart Bars */}
                        {(() => {
                          const days = Array.from({ length: 7 }, (_, i) => {
                            const d = new Date();
                            d.setDate(d.getDate() - (6 - i));
                            const dateStr = d.toISOString().split('T')[0];
                            const dayName = d.toLocaleDateString('en-IN', { weekday: 'short' });
                            const dayOrders = ordersList.filter((o) => (o.createdAt || '').startsWith(dateStr));
                            const rev = dayOrders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
                            return { dateStr, dayName, rev, count: dayOrders.length };
                          });
                          const maxRev = Math.max(...days.map((d) => d.rev), 1000);

                          return (
                            <div className="grid grid-cols-7 gap-2 pt-4 items-end h-44 border-b border-stone-200 pb-2">
                              {days.map((d, idx) => {
                                const heightPercent = Math.max(8, Math.round((d.rev / maxRev) * 100));
                                return (
                                  <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                                    <span className="text-[10px] font-bold text-stone-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                      ₹{d.rev}
                                    </span>
                                    <div
                                      style={{ height: `${heightPercent}%` }}
                                      className={`w-full max-w-[40px] rounded-t-lg transition-all duration-500 ${
                                        d.rev > 0 ? 'bg-gradient-to-t from-[#A87A2A] to-[#D4AF37] shadow-xs' : 'bg-stone-100'
                                      }`}
                                    />
                                    <span className="text-[11px] font-medium text-stone-600">
                                      {d.dayName}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Low-Stock Alerts */}
                      {(() => {
                        const lowStock = productsList.filter((p) => p.isActive !== false && p.stock !== undefined && p.stock <= 10);
                        return (
                          <div className="p-5 rounded-2xl bg-white border border-[#E9A9BB]/40 shadow-xs space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <AlertCircle className={`w-4 h-4 ${lowStock.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`} />
                                <h3 className="font-serif text-lg font-bold text-[#2B2320]">
                                  Inventory & Stock Alerts
                                </h3>
                              </div>
                              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${lowStock.length > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                {lowStock.length > 0 ? `${lowStock.length} Low-Stock Outfits` : 'Stock Healthy (✓)'}
                              </span>
                            </div>

                            {lowStock.length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                                {lowStock.map((prod) => (
                                  <div
                                    key={prod.id}
                                    className="p-3 rounded-xl border border-amber-200 bg-amber-50/40 flex items-center justify-between gap-3"
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-stone-100 shrink-0">
                                        <img
                                          src={prod.image}
                                          alt={prod.name}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            e.currentTarget.src = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80';
                                          }}
                                        />
                                      </div>
                                      <div className="truncate">
                                        <p className="text-xs font-bold text-[#2B2320] truncate">{prod.name}</p>
                                        <span className="text-[11px] font-semibold text-rose-700">
                                          Only {prod.stock} units left
                                        </span>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveTab('products');
                                        setEditingProduct(prod);
                                        setShowProductForm(true);
                                      }}
                                      className="px-2.5 py-1 rounded-lg bg-[#A87A2A] hover:bg-[#8e6520] text-white text-[11px] font-bold shrink-0 transition-colors cursor-pointer"
                                    >
                                      Restock
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-stone-500 py-1">
                                Sabhi outfits me paryapt stock upalabdha hai. Jab kisi outfit ka stock 10 se kam hoga, woh yahan alert ke roop me dikhega.
                              </p>
                            )}
                          </div>
                        );
                      })()}

                      {/* Recent Orders Table with Empty State */}
                      <div className="p-5 rounded-2xl bg-white border border-[#E9A9BB]/40 shadow-xs space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-serif text-lg font-bold text-[#2B2320]">
                              Recent Customer Orders
                            </h3>
                            <p className="text-xs text-stone-500">Latest online and COD bookings</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveTab('orders')}
                            className="text-xs font-bold text-[#A87A2A] hover:underline cursor-pointer"
                          >
                            View All ({ordersList.length}) →
                          </button>
                        </div>

                        {ordersList.length === 0 ? (
                          <div className="py-10 text-center rounded-2xl bg-[#FBF7F0] border border-dashed border-[#E9A9BB]/60 space-y-3">
                            <Package className="w-10 h-10 text-stone-400 mx-auto stroke-1" />
                            <div>
                              <h4 className="font-serif text-base font-bold text-[#2B2320]">
                                No Customer Orders Yet
                              </h4>
                              <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
                                When customers place orders via COD or Razorpay payment gateway on the storefront, orders will appear here automatically.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveTab('orders');
                                setNewOrderForm({
                                  customerName: '',
                                  customerPhone: '',
                                  customerEmail: '',
                                  shippingAddress: '',
                                  city: 'Jaipur',
                                  state: 'Rajasthan',
                                  pincode: '303905',
                                  totalAmount: 1999,
                                  discountAmount: 0,
                                  paymentMethod: 'cod',
                                  paymentStatus: 'pending',
                                  orderStatus: 'Confirmed',
                                  notes: '',
                                  courierPartner: 'Delhivery Express',
                                  trackingNumber: '',
                                  itemName: 'Royal Handblock Anarkali Set',
                                  itemSize: 'M',
                                  itemQuantity: 1,
                                  itemPrice: 1999,
                                });
                                setShowAddOrderModal(true);
                              }}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#A87A2A] hover:bg-[#8e6520] text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>+ Create Manual Order</span>
                            </button>
                          </div>
                        ) : (
                          <div className="overflow-x-auto rounded-xl border border-stone-200">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-[#FAF5EE] text-stone-600 font-bold uppercase tracking-wider text-[10px] border-b border-stone-200">
                                <tr>
                                  <th className="px-3.5 py-2.5">Order ID</th>
                                  <th className="px-3.5 py-2.5">Customer</th>
                                  <th className="px-3.5 py-2.5">Amount</th>
                                  <th className="px-3.5 py-2.5">Payment</th>
                                  <th className="px-3.5 py-2.5">Status</th>
                                  <th className="px-3.5 py-2.5">Date</th>
                                  <th className="px-3.5 py-2.5 text-right">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-stone-100">
                                {ordersList.slice(0, 5).map((order) => (
                                  <tr key={order.id} className="hover:bg-stone-50 transition-colors">
                                    <td className="px-3.5 py-2.5 font-mono font-bold text-[#A87A2A]">
                                      #{order.id}
                                    </td>
                                    <td className="px-3.5 py-2.5">
                                      <p className="font-semibold text-stone-900">{order.customerName}</p>
                                      <p className="text-[10px] text-stone-500">{order.customerPhone}</p>
                                    </td>
                                    <td className="px-3.5 py-2.5 font-bold text-stone-900">
                                      ₹{(order.totalAmount || 0).toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-3.5 py-2.5">
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        order.paymentStatus === 'paid'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : 'bg-amber-100 text-amber-800'
                                      }`}>
                                        {order.paymentMethod?.toUpperCase() || 'COD'} ({order.paymentStatus})
                                      </span>
                                    </td>
                                    <td className="px-3.5 py-2.5">
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700">
                                        {order.orderStatus || 'Confirmed'}
                                      </span>
                                    </td>
                                    <td className="px-3.5 py-2.5 text-stone-500 text-[11px]">
                                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : 'Recent'}
                                    </td>
                                    <td className="px-3.5 py-2.5 text-right">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveTab('orders');
                                          setViewingOrder(order);
                                        }}
                                        className="text-[#A87A2A] hover:underline font-bold text-xs cursor-pointer"
                                      >
                                        Manage →
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 2: ORDERS MANAGEMENT */}
                  {activeTab === 'orders' && (
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="font-serif text-2xl font-bold text-[#2B2320]">
                              Customer Orders & Fulfillment
                            </h2>
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#A87A2A]/10 text-[#A87A2A] border border-[#A87A2A]/20">
                              {ordersList.length} Orders
                            </span>
                          </div>
                          <p className="text-xs text-stone-500">
                            Add manual customer orders, update delivery statuses, manage live courier tracking, or remove orders.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setNewOrderForm({
                                customerName: '',
                                customerPhone: '',
                                customerEmail: '',
                                shippingAddress: '',
                                city: 'Jaipur',
                                state: 'Rajasthan',
                                pincode: '303905',
                                totalAmount: 1999,
                                discountAmount: 0,
                                paymentMethod: 'cod',
                                paymentStatus: 'pending',
                                orderStatus: 'Confirmed',
                                notes: '',
                                courierPartner: 'Delhivery Express',
                                trackingNumber: '',
                                itemName: 'Royal Handblock Anarkali Set',
                                itemSize: 'M',
                                itemQuantity: 1,
                                itemPrice: 1999,
                              });
                              setShowAddOrderModal(true);
                            }}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#A87A2A] hover:bg-[#8e6520] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            <span>+ Add Customer Order</span>
                          </button>
                          <button
                            onClick={() => loadTabData('orders')}
                            className="p-2 rounded-xl bg-white border border-stone-200 text-stone-600 hover:text-[#A87A2A] text-xs font-semibold shadow-xs"
                            title="Refresh"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#FBF7F0] border-b border-stone-200 text-stone-600 uppercase font-semibold">
                            <tr>
                              <th className="p-3">Order #</th>
                              <th className="p-3">Customer</th>
                              <th className="p-3">Amount</th>
                              <th className="p-3">Payment</th>
                              <th className="p-3">Status</th>
                              <th className="p-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-100">
                            {ordersList.map((ord) => {
                              const ship = (ord as any).shipment;
                              const hasTracking = ship && ship.trackingNumber;
                              return (
                                <tr key={ord.id} className="hover:bg-stone-50">
                                  <td className="p-3 font-mono">
                                    <span className="font-bold text-stone-800 block">#{ord.orderNumber}</span>
                                    <span className="text-[10px] text-stone-400 block">
                                      {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString('en-IN') : 'Recent'}
                                    </span>
                                    {hasTracking && (
                                      <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-mono text-[9px] font-bold border border-blue-200/60">
                                        <Truck className="w-2.5 h-2.5" />
                                        {ship.courierPartner || 'Courier'}: {ship.trackingNumber}
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3">
                                    <span className="font-semibold block">{ord.customerName}</span>
                                    <span className="text-stone-400 text-[11px] block">{ord.customerPhone}</span>
                                    {ord.city && (
                                      <span className="text-stone-400 text-[10px] block">{ord.city}, {ord.state || 'RJ'}</span>
                                    )}
                                  </td>
                                  <td className="p-3 font-bold text-stone-900">
                                    ₹{ord.totalAmount}
                                  </td>
                                  <td className="p-3">
                                    <div className="flex flex-col gap-1 items-start">
                                      <div className="flex items-center gap-1.5">
                                        <span
                                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                            ord.paymentStatus === 'paid'
                                              ? 'bg-emerald-100 text-emerald-800'
                                              : 'bg-amber-100 text-amber-800'
                                          }`}
                                        >
                                          {ord.paymentStatus}
                                        </span>
                                        {ord.paymentStatus !== 'paid' && (
                                          <button
                                            onClick={() => handleUpdatePaymentStatus(ord.id, 'paid')}
                                            className="text-[10px] text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
                                            title="Verify & Mark Payment Received"
                                          >
                                            Mark Paid
                                          </button>
                                        )}
                                      </div>
                                      <span className="text-[10px] text-stone-500 font-medium">
                                        {ord.paymentMethod === 'cod'
                                          ? '💵 Cash on Delivery'
                                          : ord.paymentMethod === 'upi'
                                          ? '📱 Direct UPI'
                                          : ord.paymentMethod === 'bank_transfer'
                                          ? '🏦 Bank Transfer'
                                          : '💳 Razorpay Gateway'}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <select
                                      value={getFormattedStatus(ord.orderStatus || ord.status || 'Placed')}
                                      onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                                      className="px-2 py-1 rounded-lg border border-stone-300 font-medium text-xs bg-white focus:outline-none focus:border-[#A87A2A]"
                                    >
                                      <option value="Placed">Placed</option>
                                      <option value="Confirmed">Confirmed</option>
                                      <option value="Processing">Processing</option>
                                      <option value="Packed">Packed</option>
                                      <option value="Shipped">Shipped</option>
                                      <option value="Out for Delivery">Out for Delivery</option>
                                      <option value="Delivered">Delivered</option>
                                      <option value="Cancelled">Cancelled</option>
                                      <option value="Returned">Returned</option>
                                    </select>
                                  </td>
                                  <td className="p-3 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleSendWhatsAppOrderNotification(ord)}
                                        className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-[11px] flex items-center gap-1 border border-emerald-300 transition-colors shadow-2xs cursor-pointer"
                                        title="Customer ko WhatsApp par Order Confirmation / Update bhejein"
                                      >
                                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>WhatsApp</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleOpenTrackingModal(ord)}
                                        className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-[#A87A2A] font-semibold text-[11px] flex items-center gap-1 border border-amber-200/60"
                                        title="Manage Courier Tracking & Live Timeline"
                                      >
                                        <Truck className="w-3.5 h-3.5" />
                                        <span>Tracking</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => setEditingOrderModal(ord)}
                                        className="p-1 rounded-lg hover:bg-stone-200 text-stone-700"
                                        title="Edit Order Details & Customer Info"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => setPrintingOrder(ord)}
                                        className="p-1 rounded-lg hover:bg-stone-200 text-stone-700"
                                        title="Print Tax Invoice & Shipping Label"
                                      >
                                        <Receipt className="w-3.5 h-3.5" />
                                      </button>

                                      {currentAdmin?.role === 'super_admin' && ord.paymentStatus === 'paid' && (
                                        <button
                                          type="button"
                                          onClick={() => handleRefundOrder(ord.id, ord.totalAmount)}
                                          className="p-1 rounded-lg hover:bg-rose-50 text-rose-600"
                                          title="Issue Refund (Super Admin)"
                                        >
                                          <RotateCcw className="w-3.5 h-3.5" />
                                        </button>
                                      )}

                                      <button
                                        type="button"
                                        onClick={() => setOrderToDelete(ord)}
                                        className="p-1 rounded-lg hover:bg-rose-50 text-rose-600"
                                        title="Remove / Delete Order"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: PRODUCTS & CATALOG */}
                  {activeTab === 'products' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="font-serif text-2xl font-bold text-[#2B2320]">
                            Catalog Management
                          </h2>
                          <p className="text-xs text-stone-500">
                            Create new outfits, modify pricing, stock levels, and catalog images.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setEditingProduct({
                              name: '',
                              category: 'Kurta Sets',
                              price: 1999,
                              originalPrice: 2999,
                              stock: 50,
                              image: '',
                              fabric: 'Pure Cotton Mulmul',
                              description: '',
                              isNewArrival: true,
                              isBestSeller: false,
                            });
                            setIsCreatingProduct(true);
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#A87A2A] hover:bg-[#8e6520] text-white font-bold text-xs shadow-sm transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add New Outfit</span>
                        </button>
                      </div>

                      {/* Demo Data Quick Notice & Manager Banner */}
                      {productsList.some((p) => Boolean(p.isDemo)) && (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                              <Database className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-amber-900">
                                  Demo Data Active ({productsList.filter((p) => Boolean(p.isDemo)).length} Sample Outfits)
                                </span>
                                <span className="bg-amber-200 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  Samples
                                </span>
                              </div>
                              <p className="text-[11px] text-amber-700">
                                Aap "Demo Data Manager" se demo kapde ek click me hata sakte hain ya live mode select kar sakte hain.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setActiveTab('data_manager')}
                              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                            >
                              <Database className="w-3.5 h-3.5" />
                              <span>Open Demo Data Manager</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Hidden File Input for 1-Click Product Image Change */}
                      <input
                        type="file"
                        ref={directProductFileInputRef}
                        accept="image/*"
                        onChange={handleDirectFileChosen}
                        className="hidden"
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {productsList.map((p) => (
                          <div
                            key={p.id}
                            className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs flex flex-col"
                          >
                            <div className="h-44 bg-stone-100 overflow-hidden relative group">
                              <img
                                src={normalizeProductImageUrl(p.image)}
                                alt={p.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  const fallback = getDriveThumbnailUrl(p.image);
                                  if (target.src !== fallback) {
                                    target.src = fallback;
                                  }
                                }}
                              />
                              <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold shadow-xs ${
                                Boolean(p.isDemo) ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              }`}>
                                {Boolean(p.isDemo) ? '🟡 DEMO' : '🟢 LIVE'}
                              </span>
                              <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-white/90 text-stone-800 text-[10px] font-bold shadow-xs">
                                {p.category}
                              </span>

                              {/* Quick Direct Upload / Change Photo Overlay */}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenDirectPhotoPicker(p.id)}
                                  disabled={uploadingProductId === p.id}
                                  className="px-3.5 py-2 rounded-xl bg-white text-stone-900 font-bold text-xs shadow-lg hover:bg-[#A87A2A] hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Camera className="w-4 h-4 text-[#A87A2A]" />
                                  <span>Photo Badlein</span>
                                </button>
                              </div>

                              {/* Loading indicator when uploading */}
                              {uploadingProductId === p.id && (
                                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white text-xs font-semibold z-10">
                                  <Loader2 className="w-6 h-6 animate-spin text-[#A87A2A] mb-1.5" />
                                  <span>Photo Badli Ja Rahi Hai...</span>
                                </div>
                              )}
                            </div>
                            <div className="p-3.5 flex-1 flex flex-col justify-between">
                              <div>
                                <h3 className="font-semibold text-stone-900 text-xs line-clamp-1">{p.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="font-bold text-[#A87A2A]">₹{p.price}</span>
                                  {p.originalPrice && (
                                    <span className="text-[11px] line-through text-stone-400">
                                      ₹{p.originalPrice}
                                    </span>
                                  )}
                                  <span className="text-[11px] text-stone-500 ml-auto font-medium">
                                    Stock: {p.stock}
                                  </span>
                                </div>
                              </div>

                              <div className="flex gap-1.5 mt-3 pt-3 border-t border-stone-100">
                                <button
                                  type="button"
                                  onClick={() => handleOpenDirectPhotoPicker(p.id)}
                                  disabled={uploadingProductId === p.id}
                                  className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-[#A87A2A] font-semibold text-xs flex items-center justify-center gap-1 transition-colors border border-amber-200/60"
                                  title="Change Product Photo directly"
                                >
                                  <Camera className="w-3.5 h-3.5" />
                                  <span>Photo</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingProduct(p);
                                    setIsCreatingProduct(false);
                                  }}
                                  className="flex-1 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs transition-colors text-center"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedDeepLinkProduct(p);
                                    setShowDeepLinkModal(true);
                                  }}
                                  className="p-1.5 rounded-lg text-[#A87A2A] hover:bg-amber-50 transition-colors"
                                  title="Generate Deep Link & QR Code"
                                >
                                  <LinkIcon className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProduct(p.id, p.name)}
                                  className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                  title={`Delete ${p.name}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB: CATALOG IMAGES & BANNERS (SUPER ADMIN & STAFF) */}
                  {activeTab === 'catalog_images' && (
                    <AdminCatalogImages
                      products={productsList}
                      token={token}
                      onRefreshProducts={() => loadTabData('products')}
                    />
                  )}

                  {/* TAB: DEMO DATA MANAGER & PURGE CONTROLS */}
                  {activeTab === 'data_manager' && isDemoEnabled && (
                    <AdminDataManager
                      token={token}
                      products={productsList}
                      onRefreshAll={() => {
                        loadTabData('products');
                        if (onProductsUpdated) onProductsUpdated();
                      }}
                    />
                  )}

                  {/* TAB: INVOICES & RECEIPTS (SUPER ADMIN & STAFF) */}
                  {activeTab === 'receipts' && (
                    <div className="space-y-6 animate-in fade-in">
                      {/* Hidden Logo File Input */}
                      <input
                        type="file"
                        ref={invoiceLogoFileInputRef}
                        onChange={handleInvoiceLogoUpload}
                        accept="image/*"
                        className="hidden"
                      />

                      {/* Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="font-serif text-2xl font-bold text-[#2B2320]">
                              Invoices, Bills & Receipts Manager
                            </h2>
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#F7E3E8] text-[#A87A2A] border border-[#E9A9BB]/60">
                              GST & MSME Ready
                            </span>
                          </div>
                          <p className="text-xs text-stone-500 mt-1">
                            Live customization of GSTIN, MSME / Udyam registration, brand logo, store contact, and printable receipt layout.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => window.print()}
                            className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-stone-300"
                          >
                            <Printer className="w-4 h-4 text-[#A87A2A]" />
                            <span>Print Sample Sheet</span>
                          </button>
                        </div>
                      </div>

                      {/* INVOICE CORRECTION & ORDER PICKER BAR */}
                      <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                            <FileEdit className="w-5 h-5 text-amber-700" />
                          </div>
                          <div>
                            <span className="font-bold text-xs text-amber-950 block">Customer Order Invoice Correction (बिल संशोधन)</span>
                            <span className="text-[11px] text-amber-800">Kisi bhi customer order ka bill/invoice select karke usme live correction karein aur save karein</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            onChange={(e) => {
                              const ordId = Number(e.target.value);
                              const found = ordersList.find((o) => o.id === ordId);
                              if (found) setPrintingOrder(found);
                            }}
                            defaultValue=""
                            className="px-3 py-2 rounded-xl bg-white border border-amber-300 text-xs font-semibold text-stone-800 focus:outline-none focus:border-[#A87A2A]"
                          >
                            <option value="" disabled>-- Order Chunein (Select Order to Correct) --</option>
                            {ordersList.map((ord) => (
                              <option key={ord.id} value={ord.id}>
                                #{ord.orderNumber || ord.id} - {ord.customerName} (₹{ord.totalAmount})
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={() => {
                              if (ordersList.length > 0) {
                                setPrintingOrder(ordersList[0]);
                              } else {
                                alert('Koi order uplabdh nahi hai. Aap Orders tab se Naya Order bana sakte hain.');
                              }
                            }}
                            className="px-4 py-2 rounded-xl bg-[#A87A2A] hover:bg-[#8e6520] text-white text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Correct Invoice</span>
                          </button>
                        </div>
                      </div>

                      {/* 2-Column Grid: Left Config, Right Live Preview */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        
                        {/* LEFT: Configuration Form (5 cols) */}
                        <form onSubmit={handleSaveSettings} className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4 text-xs">
                          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                            <span className="font-serif font-bold text-sm text-[#2B2320]">
                              Invoice Metadata & Legal Settings
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setSettingsMap((prev) => ({
                                    ...prev,
                                    invoice_store_name: 'SS VASTRA',
                                    invoice_tagline: 'Elegance in Every Thread • Jaipur Handcraft',
                                    invoice_gstin: '08AALCS9821M1Z4',
                                    invoice_msme: 'UDYAM-RJ-17-0098234',
                                    invoice_address: 'Green Vihar Vatika, Sanganer, Jaipur, Rajasthan 303905',
                                    invoice_phone: '+91 9783770735',
                                    invoice_email: 'subhashmeena3111@gmail.com',
                                    invoice_signatory: 'Subhash Meena (Founder & Proprietor)',
                                  }));
                                  setActionMessage('Standard Jaipur GST & MSME template auto-filled!');
                                  setTimeout(() => setActionMessage(null), 3000);
                                }}
                                className="px-2 py-0.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 font-semibold text-[10px] transition-colors cursor-pointer"
                                title="Auto-populate standard Jaipur GST & MSME values"
                              >
                                Auto-Fill GST Template
                              </button>
                            </div>
                          </div>

                          {/* Brand Name & Tagline */}
                          <div className="space-y-3">
                            <div>
                              <label className="block font-semibold text-stone-700 mb-1">
                                Store / Business Legal Name
                              </label>
                              <input
                                type="text"
                                value={settingsMap['invoice_store_name'] || settingsMap['store_name'] || 'SS VASTRA'}
                                onChange={(e) => setSettingsMap({ ...settingsMap, invoice_store_name: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A] font-semibold text-stone-800"
                              />
                            </div>

                            <div>
                              <label className="block font-semibold text-stone-700 mb-1">
                                Subtitle / Brand Tagline
                              </label>
                              <input
                                type="text"
                                value={settingsMap['invoice_tagline'] || settingsMap['tagline'] || 'Elegance in Every Thread • Jaipur Handcraft'}
                                onChange={(e) => setSettingsMap({ ...settingsMap, invoice_tagline: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                              />
                            </div>
                          </div>

                          {/* GSTIN & MSME Numbers */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div>
                              <label className="block font-semibold text-stone-700 mb-1">
                                GSTIN Number (Jaipur, RJ)
                              </label>
                              <input
                                type="text"
                                value={settingsMap['invoice_gstin'] || '08AALCS9821M1Z4'}
                                onChange={(e) => setSettingsMap({ ...settingsMap, invoice_gstin: e.target.value.toUpperCase() })}
                                placeholder="08AALCS9821M1Z4"
                                className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A] font-mono font-bold text-xs"
                              />
                            </div>

                            <div>
                              <label className="block font-semibold text-stone-700 mb-1">
                                MSME / Udyam Number
                              </label>
                              <input
                                type="text"
                                value={settingsMap['invoice_msme'] || 'UDYAM-RJ-17-0098234'}
                                onChange={(e) => setSettingsMap({ ...settingsMap, invoice_msme: e.target.value.toUpperCase() })}
                                placeholder="UDYAM-RJ-17-0098234"
                                className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A] font-mono font-bold text-xs"
                              />
                            </div>
                          </div>

                          {/* Logo Upload & URL */}
                          <div className="p-3.5 bg-[#FBF7F0] rounded-xl border border-[#E9A9BB]/40 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-stone-700">Official Receipt Logo</span>
                              <button
                                type="button"
                                disabled={isUploadingInvoiceLogo}
                                onClick={() => invoiceLogoFileInputRef.current?.click()}
                                className="px-2.5 py-1 rounded-lg bg-[#A87A2A] hover:bg-[#8e6520] text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                              >
                                {isUploadingInvoiceLogo ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    <span>Uploading...</span>
                                  </>
                                ) : (
                                  <>
                                    <Upload className="w-3 h-3" />
                                    <span>Upload Logo</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <input
                              type="text"
                              value={settingsMap['invoice_logo_url'] || ''}
                              onChange={(e) => setSettingsMap({ ...settingsMap, invoice_logo_url: e.target.value })}
                              placeholder="Or enter image URL (https://...)"
                              className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-[11px] focus:outline-none focus:border-[#A87A2A]"
                            />
                            {settingsMap['invoice_logo_url'] && (
                              <div className="flex items-center gap-2 pt-1">
                                <span className="text-[10px] text-stone-500">Logo Preview:</span>
                                <img
                                  src={settingsMap['invoice_logo_url']}
                                  alt="Logo Preview"
                                  className="h-8 max-w-[120px] object-contain rounded bg-white p-1 border border-stone-200"
                                />
                              </div>
                            )}
                          </div>

                          {/* Address & Contact */}
                          <div>
                            <label className="block font-semibold text-stone-700 mb-1">
                              Registered Store Address
                            </label>
                            <textarea
                              rows={2}
                              value={settingsMap['invoice_address'] || settingsMap['address'] || 'Green Vihar Vatika, Sanganer, Jaipur, Rajasthan 303905'}
                              onChange={(e) => setSettingsMap({ ...settingsMap, invoice_address: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block font-semibold text-stone-700 mb-1">
                                Billing Phone
                              </label>
                              <input
                                type="text"
                                value={settingsMap['invoice_phone'] || settingsMap['phone'] || '+91 9783770735'}
                                onChange={(e) => setSettingsMap({ ...settingsMap, invoice_phone: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                              />
                            </div>
                            <div>
                              <label className="block font-semibold text-stone-700 mb-1">
                                Billing Email
                              </label>
                              <input
                                type="email"
                                value={settingsMap['invoice_email'] || settingsMap['email'] || 'subhashmeena3111@gmail.com'}
                                onChange={(e) => setSettingsMap({ ...settingsMap, invoice_email: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                              />
                            </div>
                          </div>

                          {/* Signatory & Terms */}
                          <div>
                            <label className="block font-semibold text-stone-700 mb-1">
                              Authorized Signatory Name & Title
                            </label>
                            <input
                              type="text"
                              value={settingsMap['invoice_signatory'] || 'Subhash Meena (Founder & Proprietor)'}
                              onChange={(e) => setSettingsMap({ ...settingsMap, invoice_signatory: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-stone-700 mb-1">
                              Invoice Terms & Return Policy (Printed at Bottom)
                            </label>
                            <textarea
                              rows={2}
                              value={settingsMap['invoice_terms'] || '1. All handmade garments have slight natural printing variations.\n2. 7-Day easy exchange from delivery date with intact tags.'}
                              onChange={(e) => setSettingsMap({ ...settingsMap, invoice_terms: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                            />
                          </div>

                          {/* Submit button */}
                          <button
                            type="submit"
                            className="w-full py-3 bg-[#A87A2A] hover:bg-[#8e6520] text-white rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Save Invoice & Receipt Settings</span>
                          </button>
                        </form>

                        {/* RIGHT: Live Dynamic Tax Invoice Preview (7 cols) */}
                        <div className="lg:col-span-7 space-y-3">
                          <div className="flex items-center justify-between px-1">
                            <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">
                              📄 Real-Time Dynamic Tax Invoice Preview
                            </span>
                            <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                              Live Synced
                            </span>
                          </div>

                          {/* Printable Invoice Paper Simulation */}
                          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-md space-y-6 text-[#2B2320] text-xs">
                            
                            {/* Invoice Header */}
                            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-200 pb-5">
                              <div>
                                <div className="flex items-center gap-2.5 mb-1.5">
                                  {settingsMap['invoice_logo_url'] ? (
                                    <img
                                      src={settingsMap['invoice_logo_url']}
                                      alt="Logo"
                                      className="h-10 max-w-[140px] object-contain rounded-lg"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-[#F7E3E8] border border-[#A87A2A] flex items-center justify-center font-serif font-bold text-[#A87A2A] text-sm shadow-xs">
                                      SS
                                    </div>
                                  )}
                                  <div>
                                    <h1 className="font-serif text-2xl font-bold tracking-wider text-[#2B2320]">
                                      {settingsMap['invoice_store_name'] || settingsMap['store_name'] || 'SS VASTRA'}
                                    </h1>
                                  </div>
                                </div>
                                <p className="text-[11px] text-[#A87A2A] font-semibold uppercase tracking-wider">
                                  {settingsMap['invoice_tagline'] || settingsMap['tagline'] || 'Elegance in Every Thread • Jaipur Handcraft'}
                                </p>
                                <div className="mt-2 text-stone-600 space-y-0.5 text-[11px]">
                                  <p>{settingsMap['invoice_address'] || settingsMap['address'] || 'Green Vihar Vatika, Sanganer, Jaipur, Rajasthan 303905'}</p>
                                  <p>Phone: {settingsMap['invoice_phone'] || settingsMap['phone'] || '+91 9783770735'} | Email: {settingsMap['invoice_email'] || settingsMap['email'] || 'subhashmeena3111@gmail.com'}</p>
                                  <p className="font-semibold text-stone-700">
                                    <span>GSTIN: {settingsMap['invoice_gstin'] || '08AALCS9821M1Z4'} (Jaipur, RJ)</span>
                                    {(settingsMap['invoice_msme'] || 'UDYAM-RJ-17-0098234') && (
                                      <span className="ml-3">MSME: {settingsMap['invoice_msme'] || 'UDYAM-RJ-17-0098234'}</span>
                                    )}
                                  </p>
                                </div>
                              </div>

                              <div className="text-right">
                                <span className="inline-block px-3 py-1 bg-[#F7E3E8] text-[#A87A2A] font-bold rounded-lg text-xs tracking-wider uppercase mb-2">
                                  Tax Invoice
                                </span>
                                <table className="text-right text-xs mt-1 ml-auto">
                                  <tbody>
                                    <tr>
                                      <td className="text-stone-500 pr-2 font-medium">Invoice No:</td>
                                      <td className="font-mono font-bold">SSV-INV-2026-9829</td>
                                    </tr>
                                    <tr>
                                      <td className="text-stone-500 pr-2 font-medium">Date:</td>
                                      <td className="font-semibold">
                                        {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="text-stone-500 pr-2 font-medium">Payment Mode:</td>
                                      <td className="font-bold text-[#A87A2A] uppercase">Prepaid (Razorpay)</td>
                                    </tr>
                                    <tr>
                                      <td className="text-stone-500 pr-2 font-medium">Status:</td>
                                      <td className="font-semibold text-emerald-700">Paid & Verified</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* Customer Billed & Shipped To */}
                            <div className="grid grid-cols-2 gap-4 bg-[#FBF7F0] p-4 rounded-2xl border border-[#E9A9BB]/40">
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
                                  Billed & Shipped To:
                                </span>
                                <p className="font-serif font-bold text-stone-900 text-sm">Priya Sharma</p>
                                <p className="text-stone-600 mt-0.5">Plot 45, Model Town, Malviya Nagar</p>
                                <p className="text-stone-600">Jaipur, Rajasthan - 302017</p>
                                <p className="text-stone-600">Phone: +91 9829123456</p>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
                                  Fulfillment & Courier:
                                </span>
                                <p className="font-semibold text-stone-800">Delhivery Express Priority</p>
                                <p className="text-stone-600">AWB Tracking: <code className="font-mono text-[#A87A2A]">SSVTRK9829773</code></p>
                                <p className="text-stone-600">Est. Delivery: 2-4 Business Days</p>
                              </div>
                            </div>

                            {/* Line Items Table */}
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="border-b-2 border-stone-200 text-stone-500 text-[11px] uppercase tracking-wider">
                                    <th className="py-2">Item Description</th>
                                    <th className="py-2 text-center">HSN/SAC</th>
                                    <th className="py-2 text-center">Size</th>
                                    <th className="py-2 text-center">Qty</th>
                                    <th className="py-2 text-right">Unit Price</th>
                                    <th className="py-2 text-right">Amount (₹)</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                  <tr>
                                    <td className="py-2.5 font-medium text-stone-900">
                                      Jaipuri Handblock Pure Cambric Anarkali Set
                                    </td>
                                    <td className="py-2.5 text-center font-mono text-stone-600">5208</td>
                                    <td className="py-2.5 text-center font-semibold">M</td>
                                    <td className="py-2.5 text-center">1</td>
                                    <td className="py-2.5 text-right font-mono">₹2,499</td>
                                    <td className="py-2.5 text-right font-mono font-bold">₹2,499</td>
                                  </tr>
                                  <tr>
                                    <td className="py-2.5 font-medium text-stone-900">
                                      Pure Organza Gotapatti Border Dupatta
                                    </td>
                                    <td className="py-2.5 text-center font-mono text-stone-600">5208</td>
                                    <td className="py-2.5 text-center font-semibold">Free</td>
                                    <td className="py-2.5 text-center">1</td>
                                    <td className="py-2.5 text-right font-mono">₹799</td>
                                    <td className="py-2.5 text-right font-mono font-bold">₹799</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>

                            {/* Subtotals & Taxes */}
                            <div className="border-t border-stone-200 pt-4 flex justify-between">
                              <div className="w-1/2 pr-4 space-y-1">
                                <span className="font-semibold text-stone-700 block text-[11px]">GST Breakdown:</span>
                                <div className="text-[10px] text-stone-500 space-y-0.5">
                                  <p>CGST (2.5%): ₹79 | SGST (2.5%): ₹79</p>
                                  <p>Total GST Inclusive: ₹158 (5% Apparel GST)</p>
                                </div>
                              </div>
                              <div className="w-1/2 pl-4 text-right space-y-1 text-xs">
                                <div className="flex justify-between text-stone-600">
                                  <span>Subtotal:</span>
                                  <span className="font-mono">₹3,298</span>
                                </div>
                                <div className="flex justify-between text-stone-600">
                                  <span>Shipping:</span>
                                  <span className="text-emerald-700 font-bold">FREE (Above ₹1,999)</span>
                                </div>
                                <div className="flex justify-between text-stone-900 font-bold text-sm pt-2 border-t border-stone-200">
                                  <span>Total Invoice Value:</span>
                                  <span className="text-[#A87A2A] font-mono font-extrabold text-base">₹3,298</span>
                                </div>
                              </div>
                            </div>

                            {/* Footer & Signatory */}
                            <div className="border-t border-stone-200 pt-4 flex flex-wrap items-end justify-between gap-4">
                              <div className="max-w-xs text-[10px] text-stone-500 leading-relaxed">
                                <span className="font-semibold text-stone-700 block mb-0.5">Terms & Return Policy:</span>
                                <p className="whitespace-pre-line">
                                  {settingsMap['invoice_terms'] || '1. All handmade garments have slight natural printing variations.\n2. 7-Day easy exchange from delivery date with intact tags.'}
                                </p>
                              </div>
                              <div className="text-center">
                                <div className="w-36 h-12 border border-dashed border-[#A87A2A]/40 rounded-lg flex items-center justify-center mb-1 bg-[#FBF7F0]/60">
                                  <span className="font-serif italic text-xs text-[#A87A2A] font-bold">SS Vastra Verified</span>
                                </div>
                                <span className="text-[10px] font-bold text-stone-700 block">
                                  {settingsMap['invoice_signatory'] || 'Subhash Meena (Founder & Proprietor)'}
                                </span>
                                <span className="text-[9px] text-stone-400 block">Authorized Signatory</span>
                              </div>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  )}

                  {/* TAB: VIDEO REELS STUDIO (9:16 PORTRAIT) */}
                  {activeTab === 'reels' && (
                    <div className="space-y-6 animate-in fade-in">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="font-serif text-2xl font-bold text-[#2B2320]">
                              Video Reels Studio (9:16 Portrait)
                            </h2>
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#F7E3E8] text-[#A87A2A] border border-[#E9A9BB]/60">
                              Watch • Love • Shop
                            </span>
                          </div>
                          <p className="text-xs text-stone-500 mt-1">
                            Homepage par vastramaniaa.com jaisa 9:16 mobile video reels section manage karein. Har video ke sath outfit product pin karein.
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={loadReelsData}
                            className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
                            title="Refresh Reels"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingReel({
                                title: '',
                                videoUrl: '',
                                posterUrl: '',
                                productTitle: '',
                                productPrice: 1999,
                                productImage: '',
                                badge: 'Trending 🔥',
                                displayOrder: (reelsList.length || 0) + 1,
                                isActive: true,
                              });
                              setShowReelModal(true);
                            }}
                            className="px-4 py-2 rounded-xl bg-[#A87A2A] hover:bg-[#8e6520] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                          >
                            <Plus className="w-4 h-4" />
                            <span>+ Add New Reel (9:16)</span>
                          </button>
                        </div>
                      </div>

                      {/* Reels Cards Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {reelsList.map((reel) => (
                          <div
                            key={reel.id}
                            className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                          >
                            {/* 9:16 Video Preview Card */}
                            <div className="aspect-[9/16] bg-stone-900 relative overflow-hidden group">
                              <video
                                src={normalizeVideoUrl(reel.videoUrl)}
                                poster={reel.posterUrl ? normalizeProductImageUrl(reel.posterUrl) : undefined}
                                loop
                                muted
                                playsInline
                                onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                                onMouseLeave={(e) => {
                                  e.currentTarget.pause();
                                  e.currentTarget.currentTime = 0;
                                }}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                              {/* Top Badge */}
                              <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                                <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold border border-white/20">
                                  {reel.badge || 'Trending 🔥'}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    reel.isActive !== false ? 'bg-emerald-500 text-white' : 'bg-stone-500 text-white'
                                  }`}
                                >
                                  {reel.isActive !== false ? 'Active' : 'Hidden'}
                                </span>
                              </div>

                              {/* Bottom Pinned Product Pill Preview */}
                              <div className="absolute bottom-3 left-3 right-3 p-2 bg-white/95 backdrop-blur-md rounded-xl border border-white/40 flex items-center gap-2">
                                <div className="w-9 h-11 rounded-lg overflow-hidden shrink-0 border border-stone-200 bg-stone-100">
                                  <img
                                    src={normalizeProductImageUrl(reel.productImage || reel.posterUrl)}
                                    alt={reel.productTitle || reel.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[11px] font-bold text-[#2B2320] truncate">
                                    {reel.productTitle || reel.title}
                                  </p>
                                  <p className="text-[10px] font-extrabold text-[#A87A2A]">
                                    ₹{(reel.productPrice || 1999).toLocaleString('en-IN')}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Card Footer Controls */}
                            <div className="p-4 border-t border-stone-100 space-y-2">
                              <div className="flex items-center justify-between">
                                <h3 className="font-serif text-sm font-bold text-[#2B2320] truncate">
                                  {reel.title}
                                </h3>
                                <span className="text-[10px] text-stone-400 font-mono">
                                  Order #{reel.displayOrder || 1}
                                </span>
                              </div>

                              <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingReel(reel);
                                    setShowReelModal(true);
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteReel(reel.id, reel.title)}
                                  className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {reelsList.length === 0 && (
                        <div className="text-center py-16 bg-white rounded-3xl border border-stone-200 p-8">
                          <Film className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                          <h3 className="font-serif text-lg font-bold text-[#2B2320] mb-1">
                            Koi Video Reel Uplabdh Nahi Hai
                          </h3>
                          <p className="text-xs text-stone-500 max-w-md mx-auto mb-4">
                            Apne phone se capture kiya 9:16 vertical video ya mixkit video URL daalein aur storefront par live dikhayein.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingReel({
                                title: 'SS VASTRA Festive Drape Look',
                                videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-fashion-model-in-an-orange-dress-41130-large.mp4',
                                posterUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800',
                                productTitle: 'Pure Cambric Cotton Jaipuri Anarkali Suit',
                                productPrice: 2499,
                                productImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800',
                                badge: 'Trending 🔥',
                                displayOrder: 1,
                                isActive: true,
                              });
                              setShowReelModal(true);
                            }}
                            className="px-4 py-2 bg-[#A87A2A] text-white rounded-xl text-xs font-bold hover:bg-[#8e6520]"
                          >
                            + Pehli 9:16 Video Reel Add Karein
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 4: STAFF ACCOUNTS (SUPER ADMIN ONLY) */}
                  {activeTab === 'staff' && currentAdmin.role === 'super_admin' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="font-serif text-2xl font-bold text-[#2B2320]">
                            Staff Accounts & Access Control
                          </h2>
                          <p className="text-xs text-stone-500">
                            Super Admin exclusive: create staff, send 24-hr setup links, toggle active status, and reset credentials.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setStaffForm({
                              name: '',
                              email: '',
                              phone: '',
                              role: 'staff',
                              temporaryPassword: '',
                            });
                            setCreateStaffError(null);
                            setGeneratedInviteLink(null);
                            setShowCreateStaffModal(true);
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#A87A2A] hover:bg-[#8e6520] text-white font-bold text-xs shadow-sm transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Create Staff Account</span>
                        </button>
                      </div>

                      {/* Staff Accounts Table */}
                      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#FBF7F0] border-b border-stone-200 text-stone-600 uppercase font-semibold">
                            <tr>
                              <th className="p-3">Staff Name & Email</th>
                              <th className="p-3">Phone</th>
                              <th className="p-3">Role</th>
                              <th className="p-3">Status</th>
                              <th className="p-3">Last Login</th>
                              <th className="p-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-100">
                            {staffList.map((st) => (
                              <tr key={st.id} className="hover:bg-stone-50">
                                <td className="p-3">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-[#A87A2A] flex items-center justify-center font-bold text-xs">
                                      {st.name.charAt(0)}
                                    </div>
                                    <div>
                                      <span className="font-semibold text-stone-900 block">{st.name}</span>
                                      <span className="text-stone-500 text-[11px] block">{st.email || st.adminId}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-3 text-stone-600">{st.phone || '-'}</td>
                                <td className="p-3">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                      st.role === 'super_admin'
                                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                        : 'bg-stone-100 text-stone-700'
                                    }`}
                                  >
                                    {st.role === 'super_admin' ? 'Super Admin' : 'Staff'}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <span
                                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                      st.isActive !== false
                                        ? 'bg-emerald-50 text-emerald-800'
                                        : 'bg-rose-50 text-rose-700'
                                    }`}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        st.isActive !== false ? 'bg-emerald-500' : 'bg-rose-500'
                                      }`}
                                    />
                                    {st.isActive !== false ? 'Active' : 'Disabled'}
                                  </span>
                                </td>
                                <td className="p-3 text-stone-500 text-[11px]">
                                  {st.lastLoginAt
                                    ? new Date(st.lastLoginAt).toLocaleString('en-IN')
                                    : 'Never'}
                                </td>
                                <td className="p-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {/* Enable / Disable Button */}
                                    {st.id !== currentAdmin.id && (
                                      <button
                                        onClick={() => handleToggleStaffStatus(st.id, st.isActive !== false)}
                                        className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 ${
                                          st.isActive !== false
                                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-800'
                                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                                        }`}
                                        title={st.isActive !== false ? 'Disable staff access' : 'Enable staff access'}
                                      >
                                        {st.isActive !== false ? (
                                          <>
                                            <UserX className="w-3.5 h-3.5" />
                                            <span>Disable</span>
                                          </>
                                        ) : (
                                          <>
                                            <UserCheck className="w-3.5 h-3.5" />
                                            <span>Enable</span>
                                          </>
                                        )}
                                      </button>
                                    )}

                                    {/* Resend 24-hr Invite Link */}
                                    <button
                                      onClick={() => handleResendStaffInvite(st.id)}
                                      className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-[11px] flex items-center gap-1"
                                      title="Resend 24-hour set password link"
                                    >
                                      <Mail className="w-3.5 h-3.5 text-[#A87A2A]" />
                                      <span>Invite Link</span>
                                    </button>

                                    {/* Delete Button */}
                                    {st.id !== currentAdmin.id && (
                                      <button
                                        onClick={() => handleDeleteStaffAccount(st.id)}
                                        className="p-1 rounded-lg hover:bg-rose-50 text-rose-500"
                                        title="Delete staff account"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB 5: SALES REPORTS (SUPER ADMIN ONLY) */}
                  {activeTab === 'reports' && currentAdmin.role === 'super_admin' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="font-serif text-2xl font-bold text-[#2B2320]">
                            Sales Analytics & Performance
                          </h2>
                          <p className="text-xs text-stone-500">
                            Super Admin exclusive: daily revenue, outfit breakdown, and financial audits.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleExportReportsCSV}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#A87A2A] hover:bg-[#8e6520] text-white font-bold text-xs shadow-xs transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          <span>Export to Excel (CSV)</span>
                        </button>
                      </div>

                      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                        <h3 className="font-serif text-base font-bold text-[#2B2320] mb-3">
                          Revenue by Outfit
                        </h3>
                        <div className="space-y-2">
                          {((salesReports as { productSales?: { productName: string; quantity: number; revenue: number }[] })?.productSales || []).map((p, i) => (
                            <div key={i} className="flex justify-between items-center text-xs py-1.5 border-b border-stone-100">
                              <span className="font-medium text-stone-800">{p.productName}</span>
                              <div className="flex gap-4">
                                <span className="text-stone-500">{p.quantity} units sold</span>
                                <span className="font-bold text-[#A87A2A]">₹{p.revenue.toLocaleString('en-IN')}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 6: CUSTOMERS & TRAFFIC ANALYTICS (SUPER ADMIN ONLY) */}
                  {activeTab === 'customers' && currentAdmin.role === 'super_admin' && (
                    <div className="space-y-5 animate-in fade-in">
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="font-serif text-2xl font-bold text-[#2B2320]">
                              Customers & Traffic Intelligence
                            </h2>
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#A87A2A]/10 text-[#A87A2A] border border-[#A87A2A]/20">
                              Real-Time Tracking
                            </span>
                          </div>
                          <p className="text-xs text-stone-500">
                            Monitor registered shoppers, live website visits, user devices, and login/signup authentication events.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => loadTabData('customers')}
                          className="self-start sm:self-auto p-2 rounded-xl bg-white border border-stone-200 text-stone-600 hover:text-[#A87A2A] text-xs font-semibold shadow-xs"
                          title="Refresh Traffic Data"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Overview Metrics Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs">
                          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                            Registered Customers
                          </span>
                          <span className="font-serif text-2xl font-bold text-[#2B2320] block mt-1">
                            {customersList.length}
                          </span>
                          <span className="text-[10px] text-stone-400 mt-1 block">
                            Verified shoppers with accounts
                          </span>
                        </div>

                        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs">
                          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                            Total Website Visits
                          </span>
                          <span className="font-serif text-2xl font-bold text-[#A87A2A] block mt-1">
                            {customerActivityData.summary?.totalVisits ?? (customerActivityData.visitors?.length || 0)}
                          </span>
                          <span className="text-[10px] text-stone-400 mt-1 block">
                            {customerActivityData.summary?.uniqueVisitors || 0} unique visitors
                          </span>
                        </div>

                        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs">
                          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                            Today's Site Traffic
                          </span>
                          <span className="font-serif text-2xl font-bold text-emerald-700 block mt-1">
                            {customerActivityData.summary?.todayVisits || 0}
                          </span>
                          <span className="text-[10px] text-stone-400 mt-1 block">
                            Page views recorded today
                          </span>
                        </div>

                        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs">
                          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                            Logins & Signups
                          </span>
                          <span className="font-serif text-2xl font-bold text-blue-700 block mt-1">
                            {customerActivityData.activities?.length || 0}
                          </span>
                          <span className="text-[10px] text-stone-400 mt-1 block">
                            {customerActivityData.summary?.todayLogins || 0} active today
                          </span>
                        </div>
                      </div>

                      {/* Sub-Tab Navigation & Filter */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-2">
                        <div className="flex items-center gap-2 overflow-x-auto">
                          <button
                            type="button"
                            onClick={() => setCustomerSubTab('registered')}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                              customerSubTab === 'registered'
                                ? 'bg-[#A87A2A] text-white shadow-xs'
                                : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
                            }`}
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>Registered Shoppers ({customersList.length})</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setCustomerSubTab('activities')}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                              customerSubTab === 'activities'
                                ? 'bg-[#A87A2A] text-white shadow-xs'
                                : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
                            }`}
                          >
                            <LogIn className="w-3.5 h-3.5" />
                            <span>Logins & Signups ({customerActivityData.activities?.length || 0})</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setCustomerSubTab('traffic')}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                              customerSubTab === 'traffic'
                                ? 'bg-[#A87A2A] text-white shadow-xs'
                                : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
                            }`}
                          >
                            <Globe className="w-3.5 h-3.5" />
                            <span>Website Traffic ({customerActivityData.visitors?.length || 0})</span>
                          </button>
                        </div>

                        {/* Search Filter */}
                        <div className="w-full sm:w-64">
                          <input
                            type="text"
                            placeholder="Search by name, phone, IP..."
                            value={customerSearch}
                            onChange={(e) => setCustomerSearch(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs bg-white focus:outline-none focus:border-[#A87A2A]"
                          />
                        </div>
                      </div>

                      {/* SUB-VIEW 1: REGISTERED CUSTOMERS */}
                      {customerSubTab === 'registered' && (
                        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-[#FBF7F0] border-b border-stone-200 text-stone-600 uppercase font-semibold">
                              <tr>
                                <th className="p-3">Customer</th>
                                <th className="p-3">Phone</th>
                                <th className="p-3">Orders</th>
                                <th className="p-3">Total Spend</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                              {customersList
                                .filter((c) => {
                                  if (!customerSearch.trim()) return true;
                                  const q = customerSearch.toLowerCase();
                                  return (
                                    (c.name && c.name.toLowerCase().includes(q)) ||
                                    (c.phone && c.phone.includes(q))
                                  );
                                })
                                .map((c, i) => (
                                  <tr key={i} className="hover:bg-stone-50">
                                    <td className="p-3">
                                      <span className="font-semibold text-stone-800 block">{String(c.name || 'Shopper')}</span>
                                    </td>
                                    <td className="p-3 font-mono text-stone-600">{String(c.phone || '-')}</td>
                                    <td className="p-3">
                                      <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[11px] font-semibold">
                                        {String(c.ordersCount || 0)} orders
                                      </span>
                                    </td>
                                    <td className="p-3 font-bold text-[#A87A2A]">₹{String(c.totalSpent || 0)}</td>
                                  </tr>
                                ))}
                              {customersList.length === 0 && (
                                <tr>
                                  <td colSpan={4} className="p-8 text-center text-stone-400">
                                    Abhi tak koi registered customer record nahi mila.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* SUB-VIEW 2: LOGINS & SIGNUPS ACTIVITY FEED */}
                      {customerSubTab === 'activities' && (
                        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-[#FBF7F0] border-b border-stone-200 text-stone-600 uppercase font-semibold">
                              <tr>
                                <th className="p-3">Time</th>
                                <th className="p-3">Event Type</th>
                                <th className="p-3">Phone / Customer</th>
                                <th className="p-3">Client IP</th>
                                <th className="p-3">Details</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                              {(customerActivityData.activities || [])
                                .filter((a) => {
                                  if (!customerSearch.trim()) return true;
                                  const q = customerSearch.toLowerCase();
                                  return (
                                    (a.phone && a.phone.includes(q)) ||
                                    (a.name && a.name.toLowerCase().includes(q)) ||
                                    (a.type && a.type.toLowerCase().includes(q)) ||
                                    (a.ipAddress && a.ipAddress.includes(q))
                                  );
                                })
                                .map((act) => (
                                  <tr key={act.id} className="hover:bg-stone-50">
                                    <td className="p-3 font-mono text-[11px] text-stone-500 whitespace-nowrap">
                                      {act.createdAt ? new Date(act.createdAt).toLocaleString('en-IN') : '-'}
                                    </td>
                                    <td className="p-3">
                                      <span
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                          act.type === 'signup'
                                            ? 'bg-purple-100 text-purple-800'
                                            : act.type === 'login'
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : act.type === 'order'
                                            ? 'bg-amber-100 text-amber-800'
                                            : 'bg-blue-100 text-blue-800'
                                        }`}
                                      >
                                        {act.type}
                                      </span>
                                    </td>
                                    <td className="p-3">
                                      <span className="font-semibold text-stone-800 block">{act.name || 'Shopper'}</span>
                                      <span className="font-mono text-stone-400 text-[11px] block">{act.phone ? `+91 ${act.phone}` : '-'}</span>
                                    </td>
                                    <td className="p-3 font-mono text-stone-500 text-[11px]">
                                      {act.ipAddress || '127.0.0.1'}
                                    </td>
                                    <td className="p-3 text-stone-600">
                                      {act.details || '-'}
                                    </td>
                                  </tr>
                                ))}
                              {(!customerActivityData.activities || customerActivityData.activities.length === 0) && (
                                <tr>
                                  <td colSpan={5} className="p-8 text-center text-stone-400">
                                    Koi customer login/signup activity record nahi hui hai abhi tak.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* SUB-VIEW 3: WEBSITE VISITOR TRAFFIC LOGS */}
                      {customerSubTab === 'traffic' && (
                        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-[#FBF7F0] border-b border-stone-200 text-stone-600 uppercase font-semibold">
                              <tr>
                                <th className="p-3">Time</th>
                                <th className="p-3">Visitor ID</th>
                                <th className="p-3">Page Visited</th>
                                <th className="p-3">Device / Platform</th>
                                <th className="p-3">Referrer / Source</th>
                                <th className="p-3">Client IP</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                              {(customerActivityData.visitors || [])
                                .filter((v) => {
                                  if (!customerSearch.trim()) return true;
                                  const q = customerSearch.toLowerCase();
                                  return (
                                    (v.visitorId && v.visitorId.toLowerCase().includes(q)) ||
                                    (v.page && v.page.toLowerCase().includes(q)) ||
                                    (v.ipAddress && v.ipAddress.includes(q)) ||
                                    (v.deviceType && v.deviceType.toLowerCase().includes(q))
                                  );
                                })
                                .map((vis) => (
                                  <tr key={vis.id} className="hover:bg-stone-50">
                                    <td className="p-3 font-mono text-[11px] text-stone-500 whitespace-nowrap">
                                      {vis.createdAt ? new Date(vis.createdAt).toLocaleString('en-IN') : '-'}
                                    </td>
                                    <td className="p-3 font-mono text-stone-700 text-[11px]">
                                      {vis.visitorId}
                                    </td>
                                    <td className="p-3 font-mono text-stone-800 font-semibold">
                                      {vis.page || '/'}
                                    </td>
                                    <td className="p-3">
                                      <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px] font-bold">
                                        {vis.deviceType || 'Desktop'}
                                      </span>
                                    </td>
                                    <td className="p-3 text-stone-500 truncate max-w-xs">
                                      {vis.referrer || 'Direct Visit'}
                                    </td>
                                    <td className="p-3 font-mono text-stone-400 text-[11px]">
                                      {vis.ipAddress || '127.0.0.1'}
                                    </td>
                                  </tr>
                                ))}
                              {(!customerActivityData.visitors || customerActivityData.visitors.length === 0) && (
                                <tr>
                                  <td colSpan={6} className="p-8 text-center text-stone-400">
                                    Koi visitor session log abhi tak record nahi hua hai.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 7: COUPONS (SUPER ADMIN ONLY) */}
                  {activeTab === 'coupons' && currentAdmin.role === 'super_admin' && (
                    <div className="space-y-4">
                      <h2 className="font-serif text-2xl font-bold text-[#2B2320]">
                        Coupons & Discount Codes
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {couponsList.map((cp) => (
                          <div key={cp.id} className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs flex justify-between items-center">
                            <div>
                              <span className="font-mono font-bold text-sm text-[#A87A2A] block">{cp.code}</span>
                              <span className="text-xs text-stone-500">
                                {cp.discountType === 'percent' ? `${cp.discountValue}% OFF` : `₹${cp.discountValue} FLAT OFF`}
                              </span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Active
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 8: PAYMENTS, BANK, UPI & LOGISTICS SETTINGS (SUPER ADMIN ONLY) */}
                  {activeTab === 'settings' && currentAdmin.role === 'super_admin' && (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h2 className="font-serif text-2xl font-bold text-[#2B2320]">
                            Store Configuration & Logistics
                          </h2>
                          <p className="text-xs text-stone-500">
                            Configure Payment Gateways, Bank Transfer, UPI & QR, Delivery Partners, and Store Details.
                          </p>
                        </div>
                        {actionMessage && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold shadow-xs">
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                            <span>{actionMessage}</span>
                          </div>
                        )}
                      </div>

                      {/* Sub-Tabs Navigation */}
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-stone-200">
                        <button
                          type="button"
                          onClick={() => setSettingsSubTab('gateway')}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors shrink-0 ${
                            settingsSubTab === 'gateway'
                              ? 'bg-[#A87A2A] text-white shadow-xs'
                              : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
                          }`}
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>Payment Gateways ({paymentGatewaysList.length})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSettingsSubTab('bank')}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors shrink-0 ${
                            settingsSubTab === 'bank'
                              ? 'bg-[#A87A2A] text-white shadow-xs'
                              : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
                          }`}
                        >
                          <Landmark className="w-4 h-4" />
                          <span>Bank Accounts ({bankAccountsList.length})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSettingsSubTab('upi')}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors shrink-0 ${
                            settingsSubTab === 'upi'
                              ? 'bg-[#A87A2A] text-white shadow-xs'
                              : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
                          }`}
                        >
                          <QrCode className="w-4 h-4" />
                          <span>UPI & QR Codes ({upiAccountsList.length})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSettingsSubTab('delivery')}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors shrink-0 ${
                            settingsSubTab === 'delivery'
                              ? 'bg-[#A87A2A] text-white shadow-xs'
                              : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
                          }`}
                        >
                          <Truck className="w-4 h-4" />
                          <span>Delivery Partners ({deliveryPartnersList.length})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSettingsSubTab('store')}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors shrink-0 ${
                            settingsSubTab === 'store'
                              ? 'bg-[#A87A2A] text-white shadow-xs'
                              : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
                          }`}
                        >
                          <Building className="w-4 h-4" />
                          <span>Store & Contact Info</span>
                        </button>
                      </div>

                      {/* SUB-TAB 1: PAYMENT GATEWAYS & COD */}
                      {settingsSubTab === 'gateway' && (
                        <div className="space-y-6">
                          {/* Configured Gateways Header & Action */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                            <div>
                              <h3 className="font-serif text-lg font-bold text-[#2B2320]">
                                Payment Gateways Management
                              </h3>
                              <p className="text-xs text-stone-500">
                                Add and manage Razorpay, PhonePe, Paytm, Cashfree, PayU, and Stripe payment gateways.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowAddGatewayModal(true)}
                              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#A87A2A] text-white font-bold text-xs hover:bg-[#8e6520] transition-colors shadow-xs"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Add Payment Gateway</span>
                            </button>
                          </div>

                          {/* Gateways Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {paymentGatewaysList.map((gw) => (
                              <div
                                key={gw.id}
                                className={`p-4 rounded-2xl bg-white border transition-all shadow-xs flex flex-col justify-between ${
                                  gw.isDefault
                                    ? 'border-[#A87A2A] ring-1 ring-[#A87A2A]/30'
                                    : 'border-stone-200'
                                }`}
                              >
                                <div>
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2">
                                      <div className="p-2 rounded-xl bg-amber-50 text-[#A87A2A] border border-amber-100">
                                        <CreditCard className="w-5 h-5" />
                                      </div>
                                      <div>
                                        <h4 className="font-bold text-sm text-[#2B2320]">
                                          {gw.name}
                                        </h4>
                                        <span className="text-[10px] uppercase font-semibold text-stone-500 tracking-wider">
                                          {gw.provider}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                      {gw.isDefault && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                          Default Gateway
                                        </span>
                                      )}
                                      <span
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                          gw.mode === 'live'
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : 'bg-amber-100 text-amber-800'
                                        }`}
                                      >
                                        {gw.mode === 'live' ? 'Live Mode' : 'Test Mode'}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="space-y-1.5 text-xs text-stone-600 my-3">
                                    {gw.keyId && (
                                      <div className="flex items-center justify-between text-[11px] bg-stone-50 px-2.5 py-1.5 rounded-lg border border-stone-200/60 font-mono">
                                        <span className="text-stone-400">Key ID:</span>
                                        <span className="font-bold text-stone-700 truncate max-w-[170px]">
                                          {gw.keyId}
                                        </span>
                                      </div>
                                    )}
                                    {gw.instructions && (
                                      <p className="text-[11px] text-stone-500 italic mt-1">
                                        {gw.instructions}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleGateway(gw.id)}
                                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                                        gw.isActive
                                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                      }`}
                                    >
                                      {gw.isActive ? 'Active' : 'Inactive'}
                                    </button>

                                    {!gw.isDefault && (
                                      <button
                                        type="button"
                                        onClick={() => handleSetDefaultGateway(gw.id)}
                                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-[#A87A2A] hover:bg-amber-50 border border-[#A87A2A]/20"
                                      >
                                        Set Default
                                      </button>
                                    )}
                                  </div>

                                  {paymentGatewaysList.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteGateway(gw.id)}
                                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                      title="Delete Gateway"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Quick Global Parameters Form */}
                          <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-5">
                            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                              <div>
                                <h3 className="font-serif text-lg font-bold text-[#2B2320]">
                                  Global Gateway Controls & Credentials
                                </h3>
                                <p className="text-xs text-stone-500">
                                  Directly adjust environment mode, active credentials, and cash on delivery availability.
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setShowSecretKeys(!showSecretKeys)}
                                className="flex items-center gap-1.5 text-xs text-stone-600 hover:text-[#A87A2A] font-medium"
                              >
                                {showSecretKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                <span>{showSecretKeys ? 'Hide Secret Keys' : 'Show Secret Keys'}</span>
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                              <div>
                                <label className="block font-semibold text-stone-700 mb-1">
                                  Primary Payment Gateway Provider
                                </label>
                                <select
                                  value={settingsMap['payment_gateway_provider'] || 'razorpay'}
                                  onChange={(e) => setSettingsMap({ ...settingsMap, payment_gateway_provider: e.target.value })}
                                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                                >
                                  <option value="razorpay">Razorpay (Cards, UPI, NetBanking, Wallets)</option>
                                  <option value="phonepe">PhonePe Payment Gateway</option>
                                  <option value="cashfree">Cashfree Payments</option>
                                  <option value="paytm">Paytm All-in-One Gateway</option>
                                  <option value="stripe">Stripe Global Payments</option>
                                </select>
                              </div>

                              <div>
                                <label className="block font-semibold text-stone-700 mb-1">
                                  Gateway Environment Mode
                                </label>
                                <select
                                  value={settingsMap['payment_gateway_mode'] || 'test'}
                                  onChange={(e) => setSettingsMap({ ...settingsMap, payment_gateway_mode: e.target.value })}
                                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                                >
                                  <option value="test">Test / Sandbox Mode (Safe for Testing)</option>
                                  <option value="live">Live / Production Mode (Real Transactions)</option>
                                </select>
                              </div>

                              <div>
                                <label className="block font-semibold text-stone-700 mb-1">
                                  Accept Online Payments at Checkout
                                </label>
                                <select
                                  value={settingsMap['gateway_enabled'] || 'true'}
                                  onChange={(e) => setSettingsMap({ ...settingsMap, gateway_enabled: e.target.value })}
                                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                                >
                                  <option value="true">Enabled (Show Online Gateway)</option>
                                  <option value="false">Disabled (Hide Online Gateway)</option>
                                </select>
                              </div>

                              <div>
                                <label className="block font-semibold text-stone-700 mb-1">
                                  Cash on Delivery (COD)
                                </label>
                                <select
                                  value={settingsMap['cod_enabled'] || 'true'}
                                  onChange={(e) => setSettingsMap({ ...settingsMap, cod_enabled: e.target.value })}
                                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                                >
                                  <option value="true">Enabled (Accept COD)</option>
                                  <option value="false">Disabled (Prepaid Orders Only)</option>
                                </select>
                              </div>
                            </div>

                            {/* Razorpay Credentials */}
                            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3 text-xs">
                              <h4 className="font-bold text-stone-800 flex items-center gap-1.5">
                                <CreditCard className="w-4 h-4 text-[#A87A2A]" />
                                <span>Razorpay Configuration</span>
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <label className="block font-semibold text-stone-600 mb-1">
                                    Razorpay Key ID
                                  </label>
                                  <input
                                    type="text"
                                    value={settingsMap['razorpay_key_id'] || ''}
                                    placeholder="rzp_live_xxxxxxxx or rzp_test_xxxxxxxx"
                                    onChange={(e) => setSettingsMap({ ...settingsMap, razorpay_key_id: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono bg-white focus:outline-none focus:border-[#A87A2A]"
                                  />
                                </div>
                                <div>
                                  <label className="block font-semibold text-stone-600 mb-1">
                                    Razorpay Key Secret
                                  </label>
                                  <input
                                    type={showSecretKeys ? 'text' : 'password'}
                                    value={settingsMap['razorpay_key_secret'] || ''}
                                    placeholder="Enter your Razorpay Secret"
                                    onChange={(e) => setSettingsMap({ ...settingsMap, razorpay_key_secret: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono bg-white focus:outline-none focus:border-[#A87A2A]"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Alternate Gateways: PhonePe & Cashfree */}
                            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3 text-xs">
                              <h4 className="font-bold text-stone-800 flex items-center gap-1.5">
                                <Smartphone className="w-4 h-4 text-[#A87A2A]" />
                                <span>PhonePe & Cashfree Credentials (Optional)</span>
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                  <label className="block font-semibold text-stone-600 mb-1">PhonePe Merchant ID</label>
                                  <input
                                    type="text"
                                    value={settingsMap['phonepe_merchant_id'] || ''}
                                    placeholder="MERCHANTUAT or LIVE MID"
                                    onChange={(e) => setSettingsMap({ ...settingsMap, phonepe_merchant_id: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono bg-white"
                                  />
                                </div>
                                <div>
                                  <label className="block font-semibold text-stone-600 mb-1">PhonePe Salt Key</label>
                                  <input
                                    type={showSecretKeys ? 'text' : 'password'}
                                    value={settingsMap['phonepe_salt_key'] || ''}
                                    placeholder="Salt Key"
                                    onChange={(e) => setSettingsMap({ ...settingsMap, phonepe_salt_key: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono bg-white"
                                  />
                                </div>
                                <div>
                                  <label className="block font-semibold text-stone-600 mb-1">Cashfree App ID</label>
                                  <input
                                    type="text"
                                    value={settingsMap['cashfree_app_id'] || ''}
                                    placeholder="CF App ID"
                                    onChange={(e) => setSettingsMap({ ...settingsMap, cashfree_app_id: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono bg-white"
                                  />
                                </div>
                              </div>
                            </div>

                            <button
                              type="submit"
                              className="px-6 py-2.5 rounded-xl bg-[#A87A2A] text-white font-bold text-xs hover:bg-[#8e6520] transition-colors shadow-sm"
                            >
                              Save Payment Gateway Settings
                            </button>
                          </form>
                        </div>
                      )}

                      {/* SUB-TAB 2: BANK ACCOUNT DETAILS */}
                      {settingsSubTab === 'bank' && (
                        <div className="space-y-6">
                          {/* Configured Bank Accounts Header & Action */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                            <div>
                              <h3 className="font-serif text-lg font-bold text-[#2B2320]">
                                Bank Accounts Management
                              </h3>
                              <p className="text-xs text-stone-500">
                                Configure company bank accounts for direct IMPS, NEFT, and RTGS wire payments at checkout.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowAddBankModal(true)}
                              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#A87A2A] text-white font-bold text-xs hover:bg-[#8e6520] transition-colors shadow-xs"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Add Bank Account</span>
                            </button>
                          </div>

                          {/* Bank Accounts Cards Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {bankAccountsList.map((bank) => (
                              <div
                                key={bank.id}
                                className={`p-4 rounded-2xl bg-white border transition-all shadow-xs flex flex-col justify-between ${
                                  bank.isDefault
                                    ? 'border-[#A87A2A] ring-1 ring-[#A87A2A]/30'
                                    : 'border-stone-200'
                                }`}
                              >
                                <div>
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2">
                                      <div className="p-2 rounded-xl bg-amber-50 text-[#A87A2A] border border-amber-100">
                                        <Landmark className="w-5 h-5" />
                                      </div>
                                      <div>
                                        <h4 className="font-bold text-sm text-[#2B2320]">
                                          {bank.bankName}
                                        </h4>
                                        <span className="text-[10px] uppercase font-semibold text-stone-500">
                                          {bank.accountType}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                      {bank.isDefault && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                          Primary Account
                                        </span>
                                      )}
                                      <span
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                          bank.isActive
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : 'bg-stone-100 text-stone-600'
                                        }`}
                                      >
                                        {bank.isActive ? 'Active' : 'Inactive'}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="space-y-2 text-xs my-3 bg-stone-50 p-3 rounded-xl border border-stone-200/60 font-mono">
                                    <div className="flex items-center justify-between">
                                      <span className="text-stone-400 text-[10px] font-sans">A/C No:</span>
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-bold text-stone-800 tracking-wider">
                                          {bank.accountNumber}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            navigator.clipboard.writeText(bank.accountNumber);
                                            setActionMessage('Account number copied!');
                                            setTimeout(() => setActionMessage(null), 2000);
                                          }}
                                          className="text-stone-400 hover:text-[#A87A2A]"
                                          title="Copy A/C No"
                                        >
                                          <Copy className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                      <span className="text-stone-400 text-[10px] font-sans">IFSC:</span>
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-bold text-[#A87A2A]">
                                          {bank.ifsc}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            navigator.clipboard.writeText(bank.ifsc);
                                            setActionMessage('IFSC code copied!');
                                            setTimeout(() => setActionMessage(null), 2000);
                                          }}
                                          className="text-stone-400 hover:text-[#A87A2A]"
                                          title="Copy IFSC"
                                        >
                                          <Copy className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>

                                    <div className="pt-1.5 border-t border-stone-200/60 font-sans text-[11px] text-stone-600">
                                      <div className="text-stone-400 text-[9px] uppercase">Beneficiary</div>
                                      <div className="font-semibold truncate">{bank.accountHolder}</div>
                                      {bank.branch && (
                                        <div className="text-[10px] text-stone-500 mt-0.5 truncate">
                                          📍 {bank.branch}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleBank(bank.id)}
                                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                                        bank.isActive
                                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                      }`}
                                    >
                                      {bank.isActive ? 'Active' : 'Inactive'}
                                    </button>

                                    {!bank.isDefault && (
                                      <button
                                        type="button"
                                        onClick={() => handleSetDefaultBank(bank.id)}
                                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-[#A87A2A] hover:bg-amber-50 border border-[#A87A2A]/20"
                                      >
                                        Set Primary
                                      </button>
                                    )}
                                  </div>

                                  {bankAccountsList.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteBank(bank.id)}
                                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                      title="Delete Bank Account"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          <form onSubmit={handleSaveSettings} className="lg:col-span-2 bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4 text-xs">
                            <div className="pb-3 border-b border-stone-100">
                              <h3 className="font-serif text-lg font-bold text-[#2B2320]">
                                Store Bank Account Configuration
                              </h3>
                              <p className="text-xs text-stone-500">
                                Customers can pay directly via IMPS / NEFT / RTGS to this account during checkout.
                              </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block font-semibold text-stone-700 mb-1">
                                  Enable Direct Bank Transfer at Checkout
                                </label>
                                <select
                                  value={settingsMap['bank_transfer_enabled'] || 'true'}
                                  onChange={(e) => setSettingsMap({ ...settingsMap, bank_transfer_enabled: e.target.value })}
                                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                                >
                                  <option value="true">Enabled (Allow Bank Transfer)</option>
                                  <option value="false">Disabled (Hide Bank Transfer)</option>
                                </select>
                              </div>

                              <div>
                                <label className="block font-semibold text-stone-700 mb-1">
                                  Bank Name
                                </label>
                                <input
                                  type="text"
                                  value={settingsMap['bank_name'] || 'State Bank of India (SBI)'}
                                  placeholder="e.g. State Bank of India / HDFC Bank"
                                  onChange={(e) => setSettingsMap({ ...settingsMap, bank_name: e.target.value })}
                                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                                />
                              </div>

                              <div>
                                <label className="block font-semibold text-stone-700 mb-1">
                                  Account Holder / Beneficiary Name
                                </label>
                                <input
                                  type="text"
                                  value={settingsMap['bank_account_holder'] || 'SS VASTRA - SUBHASH MEENA'}
                                  placeholder="e.g. SS VASTRA"
                                  onChange={(e) => setSettingsMap({ ...settingsMap, bank_account_holder: e.target.value })}
                                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                                />
                              </div>

                              <div>
                                <label className="block font-semibold text-stone-700 mb-1">
                                  Bank Account Number
                                </label>
                                <input
                                  type="text"
                                  value={settingsMap['bank_account_number'] || '38920100054231'}
                                  placeholder="Enter 9-18 digit account number"
                                  onChange={(e) => setSettingsMap({ ...settingsMap, bank_account_number: e.target.value })}
                                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono font-bold focus:outline-none focus:border-[#A87A2A]"
                                />
                              </div>

                              <div>
                                <label className="block font-semibold text-stone-700 mb-1">
                                  Bank IFSC Code
                                </label>
                                <input
                                  type="text"
                                  value={settingsMap['bank_ifsc'] || 'SBIN0031114'}
                                  placeholder="e.g. SBIN0031114"
                                  onChange={(e) => setSettingsMap({ ...settingsMap, bank_ifsc: e.target.value.toUpperCase() })}
                                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono font-bold uppercase focus:outline-none focus:border-[#A87A2A]"
                                />
                              </div>

                              <div>
                                <label className="block font-semibold text-stone-700 mb-1">
                                  Account Type
                                </label>
                                <select
                                  value={settingsMap['bank_account_type'] || 'Current Account'}
                                  onChange={(e) => setSettingsMap({ ...settingsMap, bank_account_type: e.target.value })}
                                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                                >
                                  <option value="Current Account">Current Account (Business)</option>
                                  <option value="Savings Account">Savings Account</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="block font-semibold text-stone-700 mb-1">
                                Branch Name & Location
                              </label>
                              <input
                                type="text"
                                value={settingsMap['bank_branch'] || 'Sanganer Branch, Jaipur, Rajasthan'}
                                placeholder="e.g. Sanganer Branch, Jaipur 303905"
                                onChange={(e) => setSettingsMap({ ...settingsMap, bank_branch: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                              />
                            </div>

                            <div>
                              <label className="block font-semibold text-stone-700 mb-1">
                                Customer Payment Instructions (Shown at Checkout)
                              </label>
                              <textarea
                                rows={2}
                                value={settingsMap['bank_instructions'] || 'Kripya NEFT / IMPS transfer ke baad transaction reference (UTR) number aur payment screenshot WhatsApp helpline par share karein.'}
                                onChange={(e) => setSettingsMap({ ...settingsMap, bank_instructions: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                              />
                            </div>

                            <button
                              type="submit"
                              className="px-6 py-2.5 rounded-xl bg-[#A87A2A] text-white font-bold text-xs hover:bg-[#8e6520] transition-colors shadow-sm"
                            >
                              Save Bank Account Details
                            </button>
                          </form>

                          {/* Visual Live Card Preview */}
                          <div className="space-y-4">
                            <h4 className="font-serif text-sm font-bold text-[#2B2320]">
                              Customer Preview Card
                            </h4>
                            <div className="p-5 rounded-2xl bg-linear-to-br from-[#2B2320] via-stone-800 to-stone-900 text-white shadow-lg relative overflow-hidden border border-stone-700">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-[#A87A2A]/15 rounded-full blur-2xl pointer-events-none" />
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                  <Landmark className="w-5 h-5 text-[#E9A9BB]" />
                                  <span className="font-bold text-xs uppercase tracking-wider text-stone-200">
                                    {settingsMap['bank_name'] || 'State Bank of India'}
                                  </span>
                                </div>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#A87A2A] text-white">
                                  {settingsMap['bank_account_type'] || 'Current'}
                                </span>
                              </div>

                              <div className="space-y-2 font-mono my-4">
                                <div className="text-[10px] text-stone-400">Account Number</div>
                                <div className="text-base font-bold tracking-widest text-[#FBF7F0]">
                                  {settingsMap['bank_account_number'] || '38920100054231'}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-[11px] pt-3 border-t border-stone-700/60">
                                <div>
                                  <span className="text-stone-400 block text-[9px] uppercase">Account Holder</span>
                                  <span className="font-semibold text-stone-200 truncate block">
                                    {settingsMap['bank_account_holder'] || 'SS VASTRA'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-stone-400 block text-[9px] uppercase">IFSC Code</span>
                                  <span className="font-mono font-bold text-[#E9A9BB]">
                                    {settingsMap['bank_ifsc'] || 'SBIN0031114'}
                                  </span>
                                </div>
                              </div>

                              <div className="mt-3 text-[10px] text-stone-400 flex items-center gap-1">
                                <span>📍 {settingsMap['bank_branch'] || 'Sanganer, Jaipur'}</span>
                              </div>
                            </div>
                            <p className="text-[11px] text-stone-500 italic">
                              This exact card with one-click copy buttons is displayed to customers who choose Bank Transfer at checkout.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                      {/* SUB-TAB 3: UPI & QR CODE CONFIGURATION */}
                      {settingsSubTab === 'upi' && (
                        <div className="space-y-6">
                          {/* Configured UPI Accounts Header & Action */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                            <div>
                              <h3 className="font-serif text-lg font-bold text-[#2B2320]">
                                UPI IDs & QR Codes Management
                              </h3>
                              <p className="text-xs text-stone-500">
                                Configure merchant UPI VPAs and payment QR codes for seamless checkout across Google Pay, PhonePe, Paytm, and BHIM.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowAddUpiModal(true)}
                              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#A87A2A] text-white font-bold text-xs hover:bg-[#8e6520] transition-colors shadow-xs"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Add UPI Account / QR</span>
                            </button>
                          </div>

                          {/* UPI Accounts Cards Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {upiAccountsList.map((upi) => (
                              <div
                                key={upi.id}
                                className={`p-4 rounded-2xl bg-white border transition-all shadow-xs flex flex-col justify-between ${
                                  upi.isDefault
                                    ? 'border-[#A87A2A] ring-1 ring-[#A87A2A]/30'
                                    : 'border-stone-200'
                                }`}
                              >
                                <div>
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2">
                                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#A87A2A] border border-amber-100 flex items-center justify-center shrink-0 overflow-hidden">
                                        {(upi.qrImageUrl || (upi as any).qrImage) ? (
                                          <img
                                            src={upi.qrImageUrl || (upi as any).qrImage}
                                            alt="QR"
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <QrCode className="w-5 h-5" />
                                        )}
                                      </div>
                                      <div>
                                        <h4 className="font-bold text-sm text-[#2B2320]">
                                          {upi.title}
                                        </h4>
                                        <span className="text-[10px] text-stone-500 truncate block max-w-[140px]">
                                          {upi.payeeName}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                      {upi.isDefault && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                          Primary UPI
                                        </span>
                                      )}
                                      <span
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                          upi.isActive
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : 'bg-stone-100 text-stone-600'
                                        }`}
                                      >
                                        {upi.isActive ? 'Active' : 'Inactive'}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="space-y-2 text-xs my-3 bg-stone-50 p-3 rounded-xl border border-stone-200/60">
                                    <div className="flex items-center justify-between font-mono">
                                      <span className="text-stone-400 text-[10px] font-sans">UPI VPA:</span>
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-bold text-[#A87A2A]">
                                          {upi.upiId}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            navigator.clipboard.writeText(upi.upiId);
                                            setActionMessage('UPI ID copied!');
                                            setTimeout(() => setActionMessage(null), 2000);
                                          }}
                                          className="text-stone-400 hover:text-[#A87A2A]"
                                          title="Copy UPI ID"
                                        >
                                          <Copy className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>

                                    {(upi.phone || (upi as any).phoneNumber) && (
                                      <div className="flex items-center justify-between text-[11px] text-stone-600">
                                        <span className="text-stone-400 text-[10px]">Mobile:</span>
                                        <span className="font-mono font-medium">{upi.phone || (upi as any).phoneNumber}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleUpi(upi.id)}
                                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                                        upi.isActive
                                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                      }`}
                                    >
                                      {upi.isActive ? 'Active' : 'Inactive'}
                                    </button>

                                    {!upi.isDefault && (
                                      <button
                                        type="button"
                                        onClick={() => handleSetDefaultUpi(upi.id)}
                                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-[#A87A2A] hover:bg-amber-50 border border-[#A87A2A]/20"
                                      >
                                        Set Primary
                                      </button>
                                    )}
                                  </div>

                                  {upiAccountsList.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteUpi(upi.id)}
                                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                      title="Delete UPI Account"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          <form onSubmit={handleSaveSettings} className="lg:col-span-2 bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4 text-xs">
                            <div className="pb-3 border-b border-stone-100">
                              <h3 className="font-serif text-lg font-bold text-[#2B2320]">
                                Direct UPI & QR Code Settings
                              </h3>
                              <p className="text-xs text-stone-500">
                                Enable frictionless payments with Google Pay, PhonePe, Paytm, BHIM, and Cred via custom QR code.
                              </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block font-semibold text-stone-700 mb-1">
                                  Enable Direct UPI & QR at Checkout
                                </label>
                                <select
                                  value={settingsMap['upi_enabled'] || 'true'}
                                  onChange={(e) => setSettingsMap({ ...settingsMap, upi_enabled: e.target.value })}
                                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                                >
                                  <option value="true">Enabled (Allow UPI & QR)</option>
                                  <option value="false">Disabled (Hide UPI Option)</option>
                                </select>
                              </div>

                              <div>
                                <label className="block font-semibold text-stone-700 mb-1">
                                  Primary UPI VPA ID
                                </label>
                                <input
                                  type="text"
                                  value={settingsMap['upi_id'] || '9783770735@upi'}
                                  placeholder="e.g. 9783770735@upi / ssvastra@okaxis"
                                  onChange={(e) => setSettingsMap({ ...settingsMap, upi_id: e.target.value })}
                                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono font-bold focus:outline-none focus:border-[#A87A2A]"
                                />
                              </div>

                              <div>
                                <label className="block font-semibold text-stone-700 mb-1">
                                  Merchant / Business Name on UPI
                                </label>
                                <input
                                  type="text"
                                  value={settingsMap['upi_name'] || 'SS VASTRA JAIPUR'}
                                  placeholder="e.g. SS VASTRA JAIPUR"
                                  onChange={(e) => setSettingsMap({ ...settingsMap, upi_name: e.target.value })}
                                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                                />
                              </div>

                              <div>
                                <label className="block font-semibold text-stone-700 mb-1">
                                  UPI Linked Mobile Number
                                </label>
                                <input
                                  type="text"
                                  value={settingsMap['upi_number'] || '9783770735'}
                                  placeholder="10-digit mobile number"
                                  onChange={(e) => setSettingsMap({ ...settingsMap, upi_number: e.target.value })}
                                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono focus:outline-none focus:border-[#A87A2A]"
                                />
                              </div>

                              <div>
                                <label className="block font-semibold text-stone-700 mb-1">
                                  Secondary / Alternate UPI ID (Optional)
                                </label>
                                <input
                                  type="text"
                                  value={settingsMap['upi_secondary_id'] || 'ssvastra@okaxis'}
                                  placeholder="e.g. ssvastra@okaxis"
                                  onChange={(e) => setSettingsMap({ ...settingsMap, upi_secondary_id: e.target.value })}
                                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono focus:outline-none focus:border-[#A87A2A]"
                                />
                              </div>

                              <div>
                                <label className="block font-semibold text-stone-700 mb-1">
                                  UPI QR Image URL / Source
                                </label>
                                <input
                                  type="text"
                                  value={settingsMap['upi_qr_image'] || ''}
                                  placeholder="https://... or click Upload / Auto-Generate"
                                  onChange={(e) => setSettingsMap({ ...settingsMap, upi_qr_image: e.target.value })}
                                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-[11px] font-mono"
                                />
                              </div>
                            </div>

                            {/* QR Code Action Buttons */}
                            <div className="pt-2 flex flex-wrap items-center gap-2">
                              <input
                                ref={upiQrFileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleUpiQrFileChange}
                              />
                              <button
                                type="button"
                                onClick={() => upiQrFileInputRef.current?.click()}
                                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold transition-colors"
                              >
                                <Upload className="w-3.5 h-3.5 text-[#A87A2A]" />
                                <span>Upload QR Image from Device</span>
                              </button>

                              <button
                                type="button"
                                onClick={handleGenerateNpciQr}
                                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#A87A2A]/10 hover:bg-[#A87A2A]/20 text-[#A87A2A] font-bold transition-colors"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                                <span>Generate NPCI Dynamic QR from UPI ID</span>
                              </button>
                            </div>

                            <div className="pt-2">
                              <button
                                type="submit"
                                className="px-6 py-2.5 rounded-xl bg-[#A87A2A] text-white font-bold text-xs hover:bg-[#8e6520] transition-colors shadow-sm"
                              >
                                Save UPI Configuration
                              </button>
                            </div>
                          </form>

                          {/* Visual Live UPI Preview */}
                          <div className="space-y-4">
                            <h4 className="font-serif text-sm font-bold text-[#2B2320]">
                              Checkout UPI Preview
                            </h4>
                            <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-sm flex flex-col items-center text-center space-y-3">
                              <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                                Scan & Pay using any UPI App
                              </span>

                              <div className="w-44 h-44 p-2 bg-white rounded-2xl border-2 border-[#A87A2A]/40 shadow-inner flex items-center justify-center overflow-hidden">
                                {settingsMap['upi_qr_image'] ? (
                                  <img
                                    src={settingsMap['upi_qr_image']}
                                    alt="UPI QR Code"
                                    className="w-full h-full object-contain"
                                  />
                                ) : (
                                  <QrCode className="w-20 h-20 text-stone-300" />
                                )}
                              </div>

                              <div>
                                <span className="font-bold text-sm text-[#2B2320] block">
                                  {settingsMap['upi_name'] || 'SS VASTRA JAIPUR'}
                                </span>
                                <div className="mt-1 px-3 py-1 bg-stone-100 rounded-lg font-mono font-bold text-xs text-[#A87A2A]">
                                  {settingsMap['upi_id'] || '9783770735@upi'}
                                </div>
                              </div>

                              <div className="flex items-center justify-center gap-2 pt-2 text-[10px] text-stone-500">
                                <span>GPay</span> • <span>PhonePe</span> • <span>Paytm</span> • <span>BHIM</span> • <span>Cred</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                      {/* SUB-TAB 4: DELIVERY & COURIER PARTNERS */}
                      {settingsSubTab === 'delivery' && (
                        <div className="space-y-6">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                            <div>
                              <h3 className="font-serif text-lg font-bold text-[#2B2320]">
                                Delivery & Courier Partners
                              </h3>
                              <p className="text-xs text-stone-500">
                                Manage express logistics couriers, live tracking URL patterns, and default shipping partner.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowAddDeliveryModal(true)}
                              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#A87A2A] text-white font-bold text-xs hover:bg-[#8e6520] transition-colors shadow-xs"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Add Courier Partner</span>
                            </button>
                          </div>

                          {/* Courier Partners Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {deliveryPartnersList.map((partner) => (
                              <div
                                key={partner.id}
                                className={`p-4 rounded-2xl bg-white border transition-all shadow-xs flex flex-col justify-between ${
                                  partner.isDefault
                                    ? 'border-[#A87A2A] ring-1 ring-[#A87A2A]/30'
                                    : 'border-stone-200'
                                }`}
                              >
                                <div>
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2">
                                      <Truck className={`w-5 h-5 ${partner.isDefault ? 'text-[#A87A2A]' : 'text-stone-600'}`} />
                                      <h4 className="font-bold text-sm text-[#2B2320]">
                                        {partner.name}
                                      </h4>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      {partner.isDefault && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                          Default
                                        </span>
                                      )}
                                      <span
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                          partner.isActive
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : 'bg-stone-100 text-stone-500'
                                        }`}
                                      >
                                        {partner.isActive ? 'Active' : 'Inactive'}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="space-y-1.5 text-xs text-stone-600 my-3">
                                    <div className="flex items-center gap-1.5">
                                      <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                                      <span>ETA: <strong>{partner.estimatedDays}</strong></span>
                                    </div>
                                    {partner.phone && (
                                      <div className="flex items-center gap-1.5">
                                        <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                                        <span>Helpline: {partner.phone}</span>
                                      </div>
                                    )}
                                    <div className="font-mono text-[10px] text-stone-400 truncate bg-stone-50 p-1.5 rounded-lg border border-stone-100">
                                      {partner.trackingUrlTemplate}
                                    </div>
                                  </div>
                                </div>

                                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                                  {!partner.isDefault ? (
                                    <button
                                      type="button"
                                      onClick={() => handleSetDefaultPartner(partner.id)}
                                      className="text-stone-600 hover:text-[#A87A2A] font-semibold text-[11px]"
                                    >
                                      Set as Default
                                    </button>
                                  ) : (
                                    <span className="text-[11px] text-[#A87A2A] font-bold">Primary Partner</span>
                                  )}

                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleTogglePartner(partner.id)}
                                      className={`px-2 py-1 rounded-lg text-[11px] font-medium ${
                                        partner.isActive
                                          ? 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                                          : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                                      }`}
                                    >
                                      {partner.isActive ? 'Deactivate' : 'Activate'}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleDeletePartner(partner.id)}
                                      className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                                      title="Remove Partner"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* How to Attach Delivery Partner to Website (Step-by-Step Guide) */}
                          <div className="mt-6 p-5 rounded-2xl bg-gradient-to-br from-[#FAF5EE] via-[#FBF7F0] to-[#F7E3E8]/30 border border-[#E9A9BB]/60 shadow-xs space-y-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-[#A87A2A] text-white flex items-center justify-center">
                                <Truck className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="font-serif font-bold text-base text-[#2B2320]">
                                  Delivery Partner (Shiprocket / Delhivery) Ko Website Se Kaise Attach Karein?
                                </h4>
                                <p className="text-xs text-stone-600">
                                  Apne courier partner ko SS VASTRA portal se connect karke automated live tracking shuru karne ke aasan steps:
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                              <div className="p-3.5 bg-white rounded-xl border border-stone-200 shadow-2xs space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-[#A87A2A] text-white flex items-center justify-center font-bold text-[10px]">1</span>
                                  <strong className="text-stone-900">Shiprocket / Delhivery Account</strong>
                                </div>
                                <p className="text-stone-600 pl-7 text-[11px] leading-relaxed">
                                  <a href="https://app.shiprocket.in" target="_blank" rel="noreferrer" className="text-[#A87A2A] font-bold underline">Shiprocket</a> ya <a href="https://one.delhivery.com" target="_blank" rel="noreferrer" className="text-[#A87A2A] font-bold underline">Delhivery Direct</a> par free seller account sign up karein.
                                </p>
                              </div>

                              <div className="p-3.5 bg-white rounded-xl border border-stone-200 shadow-2xs space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-[#A87A2A] text-white flex items-center justify-center font-bold text-[10px]">2</span>
                                  <strong className="text-stone-900">Jaipur Workshop Pickup Pincode</strong>
                                </div>
                                <p className="text-stone-600 pl-7 text-[11px] leading-relaxed">
                                  Courier dashboard me Pickup Address: <strong>Green Vihar Vatika, Sanganer, Jaipur (303905)</strong> add karein.
                                </p>
                              </div>

                              <div className="p-3.5 bg-white rounded-xl border border-stone-200 shadow-2xs space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-[#A87A2A] text-white flex items-center justify-center font-bold text-[10px]">3</span>
                                  <strong className="text-stone-900">Live Webhook Integration URL</strong>
                                </div>
                                <p className="text-stone-600 pl-7 text-[11px] leading-relaxed">
                                  Apne courier dashboard me Webhook URL paste karein:
                                  <code className="block mt-1 font-mono text-[10px] text-[#A87A2A] bg-stone-50 p-1 rounded border border-stone-200 truncate">
                                    https://ss-vastra-ten.vercel.app/api/webhooks/shipping
                                  </code>
                                </p>
                              </div>

                              <div className="p-3.5 bg-white rounded-xl border border-stone-200 shadow-2xs space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-[#A87A2A] text-white flex items-center justify-center font-bold text-[10px]">4</span>
                                  <strong className="text-stone-900">1-Click Live Customer Tracking</strong>
                                </div>
                                <p className="text-stone-600 pl-7 text-[11px] leading-relaxed">
                                  Orders me AWB generate hote hi customer ko WhatsApp par tracking link mil jayega aur website par live tracking connect ho jayegi.
                                </p>
                              </div>
                            </div>

                            {/* Live AWB Link & Tracker Simulator */}
                            <div className="p-4 bg-white rounded-xl border border-[#A87A2A]/40 space-y-3">
                              <h5 className="font-bold text-xs text-[#2B2320] flex items-center gap-2">
                                <Sparkles className="w-3.5 h-3.5 text-[#A87A2A]" />
                                <span>Live Courier Link & AWB Tester Tool (Admin Studio)</span>
                              </h5>
                              <p className="text-[11px] text-stone-500">
                                Koi bhi AWB number yahan test karein aur dekhein customer ko live tracking kaisa dikhega:
                              </p>
                              <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                  type="text"
                                  id="adminTestAwbInput"
                                  placeholder="Enter AWB (e.g. DEL789123456 or SSVTRK26890)"
                                  defaultValue="SSVTRK26890"
                                  className="flex-1 px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs focus:outline-none focus:border-[#A87A2A]"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const input = (document.getElementById('adminTestAwbInput') as HTMLInputElement)?.value || 'SSVTRK26890';
                                    const primary = deliveryPartnersList.find((p) => p.isDefault) || deliveryPartnersList[0];
                                    const tmpl = primary?.trackingUrlTemplate || 'https://www.delhivery.com/track/package/{TRACKING_NO}';
                                    const url = tmpl.replace('{TRACKING_NO}', input.trim());
                                    window.open(url, '_blank');
                                  }}
                                  className="px-4 py-2 rounded-xl bg-[#A87A2A] hover:bg-[#8e6520] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                                >
                                  <span>Test Live Tracking Link</span>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* SUB-TAB 5: STORE & CONTACT INFO */}
                      {settingsSubTab === 'store' && (
                        <form onSubmit={handleSaveSettings} className="space-y-5 max-w-3xl bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
                          <div>
                            <h3 className="font-serif text-lg font-bold text-[#2B2320]">
                              Store Profile & Support Contact
                            </h3>
                            <p className="text-xs text-stone-500">
                              Update official brand name, physical store address, and WhatsApp contact link.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            <div>
                              <label className="block font-semibold text-stone-700 mb-1">
                                Store Brand Name
                              </label>
                              <input
                                type="text"
                                value={settingsMap['store_name'] || 'SS VASTRA'}
                                onChange={(e) => setSettingsMap({ ...settingsMap, store_name: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                              />
                            </div>

                            <div>
                              <label className="block font-semibold text-stone-700 mb-1">
                                Store Tagline
                              </label>
                              <input
                                type="text"
                                value={settingsMap['tagline'] || 'Elegance in Every Thread'}
                                onChange={(e) => setSettingsMap({ ...settingsMap, tagline: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                              />
                            </div>

                            <div>
                              <label className="block font-semibold text-stone-700 mb-1">
                                Support Phone Number
                              </label>
                              <input
                                type="text"
                                value={settingsMap['phone'] || '9783770735'}
                                onChange={(e) => setSettingsMap({ ...settingsMap, phone: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                              />
                            </div>

                            <div>
                              <label className="block font-semibold text-stone-700 mb-1">
                                Official Email
                              </label>
                              <input
                                type="email"
                                value={settingsMap['email'] || 'subhashmeena3111@gmail.com'}
                                onChange={(e) => setSettingsMap({ ...settingsMap, email: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                              />
                            </div>

                            <div>
                              <label className="block font-semibold text-stone-700 mb-1">
                                WhatsApp Order Link
                              </label>
                              <input
                                type="text"
                                value={settingsMap['whatsapp'] || 'https://wa.me/919783770735'}
                                onChange={(e) => setSettingsMap({ ...settingsMap, whatsapp: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                              />
                            </div>

                            <div>
                              <label className="block font-semibold text-stone-700 mb-1">
                                Free Shipping Threshold (₹)
                              </label>
                              <input
                                type="number"
                                value={settingsMap['free_shipping_threshold'] || '1999'}
                                onChange={(e) => setSettingsMap({ ...settingsMap, free_shipping_threshold: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block font-semibold text-stone-700 mb-1">
                              Store Physical Address
                            </label>
                            <input
                              type="text"
                              value={settingsMap['address'] || 'Green Vihar Vatika, Sanganer, Jaipur 303905'}
                              onChange={(e) => setSettingsMap({ ...settingsMap, address: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                            />
                          </div>

                          {/* GST & Legal Business Identification */}
                          <div className="pt-3 border-t border-stone-100">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="font-serif font-bold text-stone-800 text-sm">
                                GST & Business Tax Identification
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F7E3E8] text-[#A87A2A] border border-[#E9A9BB]/60">
                                Invoices & Bills
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                              <div>
                                <label className="block font-semibold text-stone-700 mb-1">
                                  GSTIN (GST Number)
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. 08AAAAA0000A1Z5"
                                  value={settingsMap['invoice_gstin'] || ''}
                                  onChange={(e) => setSettingsMap({ ...settingsMap, invoice_gstin: e.target.value.toUpperCase() })}
                                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono focus:outline-none focus:border-[#A87A2A]"
                                />
                                <p className="text-[10px] text-stone-400 mt-1">Ye number tax invoices aur customer bills par print hoga.</p>
                              </div>

                              <div>
                                <label className="block font-semibold text-stone-700 mb-1">
                                  MSME / Udyam Registration No.
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. UDYAM-RJ-17-0012345"
                                  value={settingsMap['invoice_msme'] || ''}
                                  onChange={(e) => setSettingsMap({ ...settingsMap, invoice_msme: e.target.value.toUpperCase() })}
                                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono focus:outline-none focus:border-[#A87A2A]"
                                />
                                <p className="text-[10px] text-stone-400 mt-1">Udyam / MSME registration number for official receipts.</p>
                              </div>
                            </div>

                            <div className="mt-3 p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <Receipt className="w-4 h-4 text-[#A87A2A] shrink-0" />
                                <span className="text-[11px] text-amber-900 font-medium">
                                  Full invoice templates, receipt logo & billing controls "Invoices & Receipts" tab me bhi available hain.
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setActiveTab('receipts')}
                                className="px-3 py-1 bg-[#A87A2A] text-white text-[11px] font-bold rounded-lg hover:bg-[#8e6520] transition-colors shrink-0"
                              >
                                Open Invoices & Receipts
                              </button>
                            </div>
                          </div>

                          {/* Multiple WhatsApp Helplines Configuration (2+ Numbers) */}
                          <div className="pt-4 border-t border-stone-100 space-y-3">
                            <div className="flex items-center gap-2">
                              <MessageCircle className="w-5 h-5 text-emerald-600" />
                              <div>
                                <span className="font-serif font-bold text-stone-800 text-sm">
                                  Multiple WhatsApp Support Helplines (2+ Numbers)
                                </span>
                                <p className="text-[10px] text-stone-500">
                                  Storefront ke floating WhatsApp widget me yeh departments aur mobile numbers live dikhenge.
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                              {/* Channel 1 */}
                              <div className="p-3 bg-[#FBF7F0] border border-stone-200 rounded-xl space-y-1.5">
                                <span className="font-bold text-[#A87A2A] text-[11px] block">
                                  Channel 1: Styling & New Orders
                                </span>
                                <div>
                                  <label className="text-[10px] text-stone-600 block">Agent / Staff Name</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. Pooja (Styling & Orders)"
                                    value={settingsMap['support_name_1'] || ''}
                                    onChange={(e) => setSettingsMap({ ...settingsMap, support_name_1: e.target.value })}
                                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs bg-white"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-stone-600 block">WhatsApp Number (10 digits)</label>
                                  <input
                                    type="tel"
                                    placeholder="9783770735"
                                    value={settingsMap['support_whatsapp_1'] || ''}
                                    onChange={(e) => setSettingsMap({ ...settingsMap, support_whatsapp_1: e.target.value })}
                                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs bg-white font-mono"
                                  />
                                </div>
                              </div>

                              {/* Channel 2 */}
                              <div className="p-3 bg-[#FBF7F0] border border-stone-200 rounded-xl space-y-1.5">
                                <span className="font-bold text-amber-700 text-[11px] block">
                                  Channel 2: Delivery & Tracking Help
                                </span>
                                <div>
                                  <label className="text-[10px] text-stone-600 block">Agent / Staff Name</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. Ramesh (Dispatch & Delivery)"
                                    value={settingsMap['support_name_2'] || ''}
                                    onChange={(e) => setSettingsMap({ ...settingsMap, support_name_2: e.target.value })}
                                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs bg-white"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-stone-600 block">WhatsApp Number (10 digits)</label>
                                  <input
                                    type="tel"
                                    placeholder="9829012345"
                                    value={settingsMap['support_whatsapp_2'] || ''}
                                    onChange={(e) => setSettingsMap({ ...settingsMap, support_whatsapp_2: e.target.value })}
                                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs bg-white font-mono"
                                  />
                                </div>
                              </div>

                              {/* Channel 3 */}
                              <div className="p-3 bg-[#FBF7F0] border border-stone-200 rounded-xl space-y-1.5">
                                <span className="font-bold text-emerald-700 text-[11px] block">
                                  Channel 3: Custom Sizing & Atelier
                                </span>
                                <div>
                                  <label className="text-[10px] text-stone-600 block">Agent / Staff Name</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. Masterji (Jaipur Atelier)"
                                    value={settingsMap['support_name_3'] || ''}
                                    onChange={(e) => setSettingsMap({ ...settingsMap, support_name_3: e.target.value })}
                                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs bg-white"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-stone-600 block">WhatsApp Number (10 digits)</label>
                                  <input
                                    type="tel"
                                    placeholder="9414012345"
                                    value={settingsMap['support_whatsapp_3'] || ''}
                                    onChange={(e) => setSettingsMap({ ...settingsMap, support_whatsapp_3: e.target.value })}
                                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs bg-white font-mono"
                                  />
                                </div>
                              </div>

                              {/* Channel 4 */}
                              <div className="p-3 bg-[#FBF7F0] border border-stone-200 rounded-xl space-y-1.5">
                                <span className="font-bold text-sky-700 text-[11px] block">
                                  Channel 4: Wholesale & B2B / Owner Direct
                                </span>
                                <div>
                                  <label className="text-[10px] text-stone-600 block">Agent / Staff Name</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. Subhash Meena (Founder & B2B)"
                                    value={settingsMap['support_name_4'] || ''}
                                    onChange={(e) => setSettingsMap({ ...settingsMap, support_name_4: e.target.value })}
                                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs bg-white"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-stone-600 block">WhatsApp Number (10 digits)</label>
                                  <input
                                    type="tel"
                                    placeholder="7014897197"
                                    value={settingsMap['support_whatsapp_4'] || ''}
                                    onChange={(e) => setSettingsMap({ ...settingsMap, support_whatsapp_4: e.target.value })}
                                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs bg-white font-mono"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Admin Login ID, Email & Password Change Form */}
                          <div className="pt-4 border-t border-stone-200 space-y-3">
                            <div className="flex items-center gap-2">
                              <Lock className="w-5 h-5 text-[#A87A2A]" />
                              <div>
                                <span className="font-serif font-bold text-stone-800 text-sm">
                                  Admin Credentials & Password Security
                                </span>
                                <p className="text-[10px] text-stone-500">
                                  Apna Admin Name, Login ID, Email aur Password yahan se direct update karein.
                                </p>
                              </div>
                            </div>

                            {profileUpdateMsg && (
                              <div
                                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                                  profileUpdateMsg.success
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                                }`}
                              >
                                {profileUpdateMsg.success ? (
                                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                                ) : (
                                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                )}
                                <span>{profileUpdateMsg.message}</span>
                              </div>
                            )}

                            <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-3 text-xs">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block font-semibold text-stone-700 mb-1">
                                    Admin Full Name
                                  </label>
                                  <input
                                    type="text"
                                    placeholder={currentAdmin.name || 'Admin Name'}
                                    value={adminProfileForm.name}
                                    onChange={(e) => setAdminProfileForm({ ...adminProfileForm, name: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-[#A87A2A]"
                                  />
                                </div>

                                <div>
                                  <label className="block font-semibold text-stone-700 mb-1">
                                    Admin Login ID / Username
                                  </label>
                                  <input
                                    type="text"
                                    placeholder={currentAdmin.adminId || 'admin'}
                                    value={adminProfileForm.adminId}
                                    onChange={(e) => setAdminProfileForm({ ...adminProfileForm, adminId: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white font-mono focus:outline-none focus:border-[#A87A2A]"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block font-semibold text-stone-700 mb-1">
                                    Admin Registered Email
                                  </label>
                                  <input
                                    type="email"
                                    placeholder={currentAdmin.email || 'admin@ssvastra.com'}
                                    value={adminProfileForm.email}
                                    onChange={(e) => setAdminProfileForm({ ...adminProfileForm, email: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-[#A87A2A]"
                                  />
                                </div>

                                <div>
                                  <label className="block font-semibold text-stone-700 mb-1">
                                    Admin Mobile Number
                                  </label>
                                  <input
                                    type="tel"
                                    placeholder={currentAdmin.phone || '9783770735'}
                                    value={adminProfileForm.phone}
                                    onChange={(e) => setAdminProfileForm({ ...adminProfileForm, phone: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white font-mono focus:outline-none focus:border-[#A87A2A]"
                                  />
                                </div>
                              </div>

                              {/* Password Change Sub-section */}
                              <div className="pt-2 border-t border-stone-200">
                                <span className="font-bold text-stone-800 text-xs block mb-2">
                                  Change Password (Password Badlein - Optional)
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-[11px] text-stone-600 mb-1">
                                      New Password (Min. 8 characters)
                                    </label>
                                    <div className="relative">
                                      <input
                                        type={showAdminPass ? 'text' : 'password'}
                                        placeholder="Enter strong new password"
                                        value={adminProfileForm.newPassword}
                                        onChange={(e) => setAdminProfileForm({ ...adminProfileForm, newPassword: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-[#A87A2A]"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setShowAdminPass(!showAdminPass)}
                                        className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700"
                                      >
                                        {showAdminPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                      </button>
                                    </div>
                                  </div>

                                  <div>
                                    <label className="block text-[11px] text-stone-600 mb-1">
                                      Confirm New Password
                                    </label>
                                    <input
                                      type={showAdminPass ? 'text' : 'password'}
                                      placeholder="Re-enter new password"
                                      value={adminProfileForm.confirmPassword}
                                      onChange={(e) => setAdminProfileForm({ ...adminProfileForm, confirmPassword: e.target.value })}
                                      className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-[#A87A2A]"
                                    />
                                  </div>
                                </div>

                                <div className="mt-3 flex items-center justify-end">
                                  <button
                                    type="button"
                                    onClick={handleUpdateAdminProfile}
                                    disabled={isUpdatingProfile}
                                    className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-black text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                                  >
                                    <Save className="w-3.5 h-3.5" />
                                    <span>{isUpdatingProfile ? 'Updating Credentials...' : 'Save New Admin Credentials'}</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="px-6 py-2.5 rounded-xl bg-[#A87A2A] text-white font-bold text-xs hover:bg-[#8e6520] transition-colors shadow-sm"
                          >
                            Save Store Information
                          </button>
                        </form>
                      )}
                    </div>
                  )}

                  {/* TAB 9: ACTIVITY LOG (SUPER ADMIN ONLY) */}
                  {activeTab === 'activity' && currentAdmin.role === 'super_admin' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="font-serif text-2xl font-bold text-[#2B2320]">
                            Audit Trail & Activity Log
                          </h2>
                          <p className="text-xs text-stone-500">
                            Complete log of logins, logouts, failed attempts, catalog edits, and order updates with IP & timestamps.
                          </p>
                        </div>
                        <button
                          onClick={() => loadTabData('activity')}
                          className="p-2 rounded-xl bg-white border border-stone-200 text-stone-600 hover:text-[#A87A2A] text-xs font-semibold shadow-xs"
                          title="Refresh"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#FBF7F0] border-b border-stone-200 text-stone-600 uppercase font-semibold">
                            <tr>
                              <th className="p-3">Timestamp</th>
                              <th className="p-3">User Email / Admin</th>
                              <th className="p-3">Action</th>
                              <th className="p-3">Target Entity</th>
                              <th className="p-3">Client IP</th>
                              <th className="p-3">Details</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-100">
                            {activityLogsList.map((log) => (
                              <tr key={log.id} className="hover:bg-stone-50">
                                <td className="p-3 text-stone-500 font-mono text-[11px] whitespace-nowrap">
                                  {new Date(log.createdAt).toLocaleString('en-IN')}
                                </td>
                                <td className="p-3">
                                  <span className="font-semibold text-stone-800 block">
                                    {log.userEmail || log.adminId}
                                  </span>
                                  {log.adminName && (
                                    <span className="text-[10px] text-stone-400 block">{log.adminName}</span>
                                  )}
                                </td>
                                <td className="p-3">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                      log.action.includes('FAIL')
                                        ? 'bg-rose-100 text-rose-800'
                                        : log.action.includes('LOGIN')
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : log.action.includes('CREATE')
                                        ? 'bg-blue-100 text-blue-800'
                                        : log.action.includes('DELETE')
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-amber-100 text-amber-800'
                                    }`}
                                  >
                                    {log.action}
                                  </span>
                                </td>
                                <td className="p-3 text-stone-600">
                                  {log.entity} {log.entityId ? `#${log.entityId}` : ''}
                                </td>
                                <td className="p-3 font-mono text-[11px] text-stone-500">
                                  {log.ipAddress || '127.0.0.1'}
                                </td>
                                <td className="p-3 text-stone-500 font-mono text-[10px] truncate max-w-xs">
                                  {log.details || '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </main>
          </div>
        )}

        {/* Modal: Create Staff Account */}
        {showCreateStaffModal && (
          <div className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#A87A2A]" />
                  <h3 className="font-serif text-lg font-bold text-[#2B2320]">
                    Create Staff Account
                  </h3>
                </div>
                <button
                  onClick={() => setShowCreateStaffModal(false)}
                  className="p-1.5 rounded-full text-stone-400 hover:text-stone-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {generatedInviteLink ? (
                <div className="space-y-4 text-xs">
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                    <span className="font-bold block mb-1">Staff Account Successfully Created!</span>
                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                      An invitation email has been sent. You can also copy the direct 24-hour setup link below to share with the staff member:
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 font-mono text-[11px] text-stone-800 break-all select-all">
                    {generatedInviteLink}
                  </div>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedInviteLink);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 3000);
                    }}
                    className="w-full py-2.5 rounded-xl bg-[#A87A2A] hover:bg-[#8e6520] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
                  >
                    {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'Copied to Clipboard!' : 'Copy 24-Hour Invite Link'}</span>
                  </button>

                  <button
                    onClick={() => setShowCreateStaffModal(false)}
                    className="w-full py-2 text-stone-500 hover:text-stone-800 text-center font-semibold text-xs"
                  >
                    Close Modal
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCreateStaffAccount} className="space-y-3.5 text-xs">
                  {createStaffError && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                      {createStaffError}
                    </div>
                  )}

                  <div>
                    <label className="block font-semibold mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Sharma"
                      value={staffForm.name}
                      onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="ramesh@ssvastra.com"
                      value={staffForm.email}
                      onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+91 9876543210"
                      value={staffForm.phone}
                      onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Role & Permissions</label>
                    <select
                      value={staffForm.role}
                      onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value as 'staff' | 'super_admin' })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                    >
                      <option value="staff">Staff (Orders & Catalog Management)</option>
                      <option value="super_admin">Super Admin (Full Access)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">
                      Temporary Password (Optional)
                    </label>
                    <input
                      type="password"
                      placeholder="Leave blank for auto-generated password"
                      value={staffForm.temporaryPassword}
                      onChange={(e) => setStaffForm({ ...staffForm, temporaryPassword: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                    />
                    <span className="text-[10px] text-stone-500 mt-1 block">
                      Staff will receive an email invite valid for 24 hours to set their own password.
                    </span>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => setShowCreateStaffModal(false)}
                      className="px-4 py-2 rounded-xl border border-stone-300 text-stone-600 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreatingStaff}
                      className="px-5 py-2 rounded-xl bg-[#A87A2A] hover:bg-[#8e6520] text-white font-bold disabled:opacity-50"
                    >
                      {isCreatingStaff ? 'Creating...' : 'Create & Send Invite'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Modal: Edit / Add Product */}
        {editingProduct && (
          <div className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 max-h-[88vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
                <h3 className="font-serif text-lg font-bold text-[#2B2320]">
                  {isCreatingProduct ? 'Create New Outfit' : 'Edit Product'}
                </h3>
                <button
                  onClick={() => setEditingProduct(null)}
                  className="p-1.5 rounded-full text-stone-400 hover:text-stone-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Product Title</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-semibold">Category</label>
                      <button
                        type="button"
                        onClick={() => setIsCustomCategory(!isCustomCategory)}
                        className="text-[10px] text-[#A87A2A] font-bold hover:underline cursor-pointer"
                      >
                        {isCustomCategory ? '← List me se chunein' : '➕ Custom Text likhein'}
                      </button>
                    </div>
                    {isCustomCategory ? (
                      <input
                        type="text"
                        placeholder="e.g. Bridal Lehengas, Organza Dupattas..."
                        value={editingProduct.category || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-[#A87A2A] focus:outline-none focus:ring-1 focus:ring-[#A87A2A]"
                      />
                    ) : (
                      <select
                        value={editingProduct.category || 'Kurta Sets'}
                        onChange={(e) => {
                          if (e.target.value === '__custom__') {
                            setIsCustomCategory(true);
                            setEditingProduct({ ...editingProduct, category: '' });
                          } else {
                            setEditingProduct({ ...editingProduct, category: e.target.value });
                          }
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300"
                      >
                        {categoriesList.map((c) => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                        <option value="__custom__">➕ + Enter Custom Category (New Category likhein)</option>
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Stock Count</label>
                    <input
                      type="number"
                      required
                      value={editingProduct.stock ?? 50}
                      onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Selling Price (₹)</label>
                    <input
                      type="number"
                      required
                      value={editingProduct.price || 0}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Original Price (₹)</label>
                    <input
                      type="number"
                      value={editingProduct.originalPrice || 0}
                      onChange={(e) => setEditingProduct({ ...editingProduct, originalPrice: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300"
                    />
                  </div>
                </div>

                {/* Outfit Multi-Photo Studio (3 to 4 Photos) */}
                <div className="p-4 bg-[#FBF7F0] border-2 border-stone-200 rounded-2xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <label className="block text-xs font-bold text-[#2B2320]">
                          Outfit Multi-Photo Studio (3 to 4 Photos) *
                        </label>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#A87A2A]/10 text-[#A87A2A] border border-[#A87A2A]/20">
                          Multi-Angle Carousel Ready
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-500 mt-0.5">
                        Ek outfit ke sath 3-4 photos add karein: Front Cover, Detail / Neck, Back View, aur Fabric Look.
                      </p>
                    </div>

                    {/* Batch Upload Button */}
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      ref={batchPhotosInputRef}
                      onChange={handleBatchPhotoUpload}
                      className="hidden"
                      id="batch-photos-upload"
                    />
                    <label
                      htmlFor="batch-photos-upload"
                      className="px-3.5 py-1.5 bg-[#A87A2A] hover:bg-[#8e6520] text-white text-xs font-bold rounded-xl cursor-pointer transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Ek Sath 3-4 Photos Chuney</span>
                    </label>
                  </div>

                  {/* 4 Dedicated Photo Slots Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                    {/* Slot 1: Front / Main Cover */}
                    <div className="bg-white p-2.5 rounded-xl border-2 border-[#A87A2A] flex flex-col justify-between shadow-2xs relative group">
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="text-[10px] font-bold text-[#A87A2A] uppercase tracking-wide truncate">
                            Slot 1: Cover
                          </span>
                          <span className="text-[9px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded-full">
                            Main
                          </span>
                        </div>

                        <div className="aspect-[3/4] bg-stone-100 rounded-lg overflow-hidden border border-stone-200 relative mb-2">
                          {photoSlot1 ? (
                            <img
                              src={normalizeProductImageUrl(photoSlot1)}
                              alt="Slot 1"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const fallback = getDriveThumbnailUrl(photoSlot1);
                                if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 p-2 text-center">
                              <ImageIcon className="w-6 h-6 mb-1 opacity-50" />
                              <span className="text-[10px] font-semibold">Front Cover Photo</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <input
                          type="file"
                          accept="image/*"
                          ref={slot1InputRef}
                          onChange={(e) => e.target.files?.[0] && handleSingleSlotUpload(1, e.target.files[0])}
                          className="hidden"
                          id="slot1-upload"
                        />
                        <label
                          htmlFor="slot1-upload"
                          className="w-full py-1 text-center bg-stone-800 hover:bg-black text-white text-[10px] font-bold rounded-lg cursor-pointer block transition-colors"
                        >
                          {photoSlot1 ? 'Change Photo' : '+ Photo Daalein'}
                        </label>
                        {photoSlot1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setPhotoSlot1('');
                              setEditingProduct((prev) => (prev ? { ...prev, image: '' } : prev));
                            }}
                            className="w-full py-0.5 text-center text-rose-600 hover:text-rose-800 text-[10px] font-semibold cursor-pointer"
                          >
                            Hataiye
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Slot 2: Close-up / Neck & Embroidery */}
                    <div className="bg-white p-2.5 rounded-xl border border-stone-200 flex flex-col justify-between shadow-2xs relative group">
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="text-[10px] font-bold text-stone-700 uppercase tracking-wide truncate">
                            Slot 2: Detail
                          </span>
                          <span className="text-[9px] bg-stone-100 text-stone-600 font-medium px-1.5 py-0.2 rounded-full">
                            Close-up
                          </span>
                        </div>

                        <div className="aspect-[3/4] bg-stone-100 rounded-lg overflow-hidden border border-stone-200 relative mb-2">
                          {photoSlot2 ? (
                            <img
                              src={normalizeProductImageUrl(photoSlot2)}
                              alt="Slot 2"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const fallback = getDriveThumbnailUrl(photoSlot2);
                                if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 p-2 text-center">
                              <ImageIcon className="w-6 h-6 mb-1 opacity-50" />
                              <span className="text-[10px]">Neck / Detail</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <input
                          type="file"
                          accept="image/*"
                          ref={slot2InputRef}
                          onChange={(e) => e.target.files?.[0] && handleSingleSlotUpload(2, e.target.files[0])}
                          className="hidden"
                          id="slot2-upload"
                        />
                        <label
                          htmlFor="slot2-upload"
                          className="w-full py-1 text-center bg-stone-100 hover:bg-stone-200 text-stone-800 text-[10px] font-bold rounded-lg cursor-pointer block transition-colors"
                        >
                          {photoSlot2 ? 'Change' : '+ Add Photo'}
                        </label>
                        {photoSlot2 && (
                          <div className="flex items-center justify-between text-[9px] pt-0.5">
                            <button
                              type="button"
                              onClick={() => handleSwapSlotWithCover(2)}
                              className="text-[#A87A2A] font-bold hover:underline"
                              title="Make Cover Photo"
                            >
                              Set Cover
                            </button>
                            <button
                              type="button"
                              onClick={() => setPhotoSlot2('')}
                              className="text-rose-600 hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Slot 3: Back View / Drape / Dupatta */}
                    <div className="bg-white p-2.5 rounded-xl border border-stone-200 flex flex-col justify-between shadow-2xs relative group">
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="text-[10px] font-bold text-stone-700 uppercase tracking-wide truncate">
                            Slot 3: Back
                          </span>
                          <span className="text-[9px] bg-stone-100 text-stone-600 font-medium px-1.5 py-0.2 rounded-full">
                            Drape
                          </span>
                        </div>

                        <div className="aspect-[3/4] bg-stone-100 rounded-lg overflow-hidden border border-stone-200 relative mb-2">
                          {photoSlot3 ? (
                            <img
                              src={normalizeProductImageUrl(photoSlot3)}
                              alt="Slot 3"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const fallback = getDriveThumbnailUrl(photoSlot3);
                                if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 p-2 text-center">
                              <ImageIcon className="w-6 h-6 mb-1 opacity-50" />
                              <span className="text-[10px]">Back / Dupatta</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <input
                          type="file"
                          accept="image/*"
                          ref={slot3InputRef}
                          onChange={(e) => e.target.files?.[0] && handleSingleSlotUpload(3, e.target.files[0])}
                          className="hidden"
                          id="slot3-upload"
                        />
                        <label
                          htmlFor="slot3-upload"
                          className="w-full py-1 text-center bg-stone-100 hover:bg-stone-200 text-stone-800 text-[10px] font-bold rounded-lg cursor-pointer block transition-colors"
                        >
                          {photoSlot3 ? 'Change' : '+ Add Photo'}
                        </label>
                        {photoSlot3 && (
                          <div className="flex items-center justify-between text-[9px] pt-0.5">
                            <button
                              type="button"
                              onClick={() => handleSwapSlotWithCover(3)}
                              className="text-[#A87A2A] font-bold hover:underline"
                              title="Make Cover Photo"
                            >
                              Set Cover
                            </button>
                            <button
                              type="button"
                              onClick={() => setPhotoSlot3('')}
                              className="text-rose-600 hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Slot 4: Fabric Texture / Styling / Real Model Look */}
                    <div className="bg-white p-2.5 rounded-xl border border-stone-200 flex flex-col justify-between shadow-2xs relative group">
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="text-[10px] font-bold text-stone-700 uppercase tracking-wide truncate">
                            Slot 4: Look
                          </span>
                          <span className="text-[9px] bg-stone-100 text-stone-600 font-medium px-1.5 py-0.2 rounded-full">
                            Texture
                          </span>
                        </div>

                        <div className="aspect-[3/4] bg-stone-100 rounded-lg overflow-hidden border border-stone-200 relative mb-2">
                          {photoSlot4 ? (
                            <img
                              src={normalizeProductImageUrl(photoSlot4)}
                              alt="Slot 4"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const fallback = getDriveThumbnailUrl(photoSlot4);
                                if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 p-2 text-center">
                              <ImageIcon className="w-6 h-6 mb-1 opacity-50" />
                              <span className="text-[10px]">Fabric / Styling</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <input
                          type="file"
                          accept="image/*"
                          ref={slot4InputRef}
                          onChange={(e) => e.target.files?.[0] && handleSingleSlotUpload(4, e.target.files[0])}
                          className="hidden"
                          id="slot4-upload"
                        />
                        <label
                          htmlFor="slot4-upload"
                          className="w-full py-1 text-center bg-stone-100 hover:bg-stone-200 text-stone-800 text-[10px] font-bold rounded-lg cursor-pointer block transition-colors"
                        >
                          {photoSlot4 ? 'Change' : '+ Add Photo'}
                        </label>
                        {photoSlot4 && (
                          <div className="flex items-center justify-between text-[9px] pt-0.5">
                            <button
                              type="button"
                              onClick={() => handleSwapSlotWithCover(4)}
                              className="text-[#A87A2A] font-bold hover:underline"
                              title="Make Cover Photo"
                            >
                              Set Cover
                            </button>
                            <button
                              type="button"
                              onClick={() => setPhotoSlot4('')}
                              className="text-rose-600 hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* URL paste input for Slot 1 if needed */}
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Or Direct Image / Google Drive Link (Slot 1 Cover)
                    </label>
                    <input
                      type="text"
                      placeholder="Paste image link or select photos above..."
                      value={photoSlot1 || ''}
                      onChange={(e) => {
                        const val = normalizeProductImageUrl(e.target.value);
                        setPhotoSlot1(val);
                        setEditingProduct((prev) => (prev ? { ...prev, image: val } : prev));
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-[11px] focus:outline-none focus:border-[#A87A2A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Fabric & Material</label>
                  <input
                    type="text"
                    value={editingProduct.fabric || ''}
                    placeholder="e.g. Sanganeri Cambric Cotton 60s"
                    onChange={(e) => setEditingProduct({ ...editingProduct, fabric: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300"
                  />
                </div>

                {/* Product Multi-Colors Studio */}
                <div className="p-3.5 bg-[#FBF7F0] border border-[#E9A9BB]/40 rounded-2xl space-y-2.5">
                  <div>
                    <label className="block text-xs font-bold text-[#2B2320]">
                      Product Color Options (Multi-Color Swatches)
                    </label>
                    <p className="text-[10px] text-stone-500">
                      Storefront par customer inme se apna pasandeeda rang select kar sakte hain.
                    </p>
                  </div>

                  {/* Active Selected Colors */}
                  <div className="flex items-center gap-1.5 flex-wrap min-h-[38px] p-2 bg-white rounded-xl border border-stone-200">
                    {(editingProduct.colors && editingProduct.colors.length > 0
                      ? editingProduct.colors
                      : editingProduct.color
                      ? [editingProduct.color]
                      : []
                    ).map((col, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-800 border border-stone-300 shadow-2xs"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-stone-400"
                          style={{
                            backgroundColor:
                              col.toLowerCase().includes('pink') ? '#f472b6' :
                              col.toLowerCase().includes('red') || col.toLowerCase().includes('maroon') ? '#991b1b' :
                              col.toLowerCase().includes('blue') ? '#1e40af' :
                              col.toLowerCase().includes('green') ? '#15803d' :
                              col.toLowerCase().includes('yellow') || col.toLowerCase().includes('mustard') ? '#eab308' :
                              col.toLowerCase().includes('white') ? '#fafaf9' :
                              col.toLowerCase().includes('black') ? '#18181b' : '#A87A2A'
                          }}
                        />
                        <span>{col}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const current = editingProduct.colors || (editingProduct.color ? [editingProduct.color] : []);
                            const filtered = current.filter((_, i) => i !== idx);
                            setEditingProduct({ ...editingProduct, colors: filtered, color: filtered[0] || '' });
                          }}
                          className="text-stone-400 hover:text-rose-600 font-bold ml-0.5 cursor-pointer text-sm"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {(!editingProduct.colors || editingProduct.colors.length === 0) && !editingProduct.color && (
                      <span className="text-xs text-stone-400 italic">Koi color add nahi kiya gaya hai.</span>
                    )}
                  </div>

                  {/* Quick Color Presets */}
                  <div className="flex items-center gap-1 flex-wrap pt-0.5">
                    <span className="text-[10px] text-stone-500 font-semibold">Quick Add:</span>
                    {['Rani Pink', 'Mustard Yellow', 'Pista Green', 'Royal Blue', 'Blush Peach', 'Maroon', 'Midnight Black', 'Ivory White'].map((quickCol) => (
                      <button
                        key={quickCol}
                        type="button"
                        onClick={() => {
                          const current = editingProduct.colors || (editingProduct.color ? [editingProduct.color] : []);
                          if (!current.includes(quickCol)) {
                            const updated = [...current, quickCol];
                            setEditingProduct({ ...editingProduct, colors: updated, color: updated[0] });
                          }
                        }}
                        className="px-2 py-0.5 rounded-md bg-white hover:bg-stone-100 border border-stone-200 text-[10px] text-stone-700 font-medium cursor-pointer transition-colors"
                      >
                        + {quickCol}
                      </button>
                    ))}
                  </div>

                  {/* Custom Color Input */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Type custom color name (e.g. Teal Green, Wine Red)..."
                      value={newColorInput}
                      onChange={(e) => setNewColorInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newColorInput.trim()) {
                            const current = editingProduct.colors || (editingProduct.color ? [editingProduct.color] : []);
                            if (!current.includes(newColorInput.trim())) {
                              const updated = [...current, newColorInput.trim()];
                              setEditingProduct({ ...editingProduct, colors: updated, color: updated[0] });
                            }
                            setNewColorInput('');
                          }
                        }
                      }}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-[#A87A2A]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newColorInput.trim()) {
                          const current = editingProduct.colors || (editingProduct.color ? [editingProduct.color] : []);
                          if (!current.includes(newColorInput.trim())) {
                            const updated = [...current, newColorInput.trim()];
                            setEditingProduct({ ...editingProduct, colors: updated, color: updated[0] });
                          }
                          setNewColorInput('');
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#A87A2A] text-white text-xs font-bold hover:bg-[#8e6520] cursor-pointer shrink-0"
                    >
                      + Add Rang
                    </button>
                  </div>
                </div>

                {/* Description Studio with One-Click Templates & Live Formats */}
                <div className="space-y-2 p-3 bg-stone-50 rounded-2xl border border-stone-200">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-xs text-[#2B2320]">
                      Product Description & Styling Formats
                    </label>
                    <span className="text-[10px] text-[#A87A2A] font-semibold">
                      ✨ Click template to auto-fill format
                    </span>
                  </div>

                  {/* 4 One-Click Description Formats (Vastramaniaa, Specs, Anarkali, Minimal) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const vastraFormat = `${editingProduct.name || 'Royal Handcrafted Kurti Set'} with elegant silhouette — effortless everyday elegance.\n\n* Solid sweetheart neckline with graceful back detailing\n* Dramatic bell sleeves for a fluid, feminine silhouette\n* Flowy farshi / straight bottom for flattering flare\n* Soft, breathable pure natural fabric\n* Handcrafted with authentic Jaipur artisan craft\n* Sizes XS–5XL — made for every woman\n\nSet Includes: Kurta + Bottom + Dupatta\nFabric: ${editingProduct.fabric || 'Pure Cambric Cotton 60s'}\nWork: Authentic Jaipur Block Print & Gotapatti\nOccasion: Festive, Weddings & Elegant Day Wear`;
                        setEditingProduct({ ...editingProduct, description: vastraFormat });
                      }}
                      className="p-1.5 rounded-xl bg-white hover:bg-[#FAF5EE] border border-amber-300 text-stone-800 text-[11px] font-bold text-left shadow-2xs hover:border-[#A87A2A] transition-colors cursor-pointer"
                    >
                      <span className="text-[#A87A2A] block text-[10px]">Format 1:</span>
                      💎 Vastramaniaa Style
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const specsFormat = `Pure Handblock Printed 3-Piece Suit Set — SS VASTRA\n\n* Elegant V-neckline with delicate hand-embroidery\n* Comfortable 3/4 sleeves with gotapatti detailing\n* Tailored straight pant with elasticated waistband & pocket\n* Lightweight matching dupatta with artisan decorative border\n\nFabric: ${editingProduct.fabric || '100% Pure Jaipuri Cotton Mulmul'}\nSet Includes: Kurta, Pant & Dupatta\nKurta Length: 44 inches | Pant Length: 38 inches\nWork: Authentic Sanganeri Handblock Print\nCare: Gentle cold hand wash or dry clean`;
                        setEditingProduct({ ...editingProduct, description: specsFormat });
                      }}
                      className="p-1.5 rounded-xl bg-white hover:bg-[#FAF5EE] border border-stone-200 text-stone-800 text-[11px] font-bold text-left shadow-2xs hover:border-[#A87A2A] transition-colors cursor-pointer"
                    >
                      <span className="text-stone-400 block text-[10px]">Format 2:</span>
                      📋 3-Piece Suit Specs
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const anarkaliFormat = `Royal Kalidar Anarkali Suit Set with Banarasi Border — SS VASTRA\n\n* 4.5 Meter flared Kalidar silhouette for royal festive drape\n* Intricate Zari & Gotapatti hand-embroidery on yoke\n* Contrast Banarasi zari border on hemline\n* Full-length sheer organza dupatta with gotapatti tassels\n\nFabric: Pure Chanderi Silk Blend\nInner Lining: Soft Cotton Malmal\nSet Includes: Flared Anarkali + Churidar / Pant + Dupatta\nOccasion: Weddings, Festive Celebrations, Diwali & Eid`;
                        setEditingProduct({ ...editingProduct, description: anarkaliFormat });
                      }}
                      className="p-1.5 rounded-xl bg-white hover:bg-[#FAF5EE] border border-stone-200 text-stone-800 text-[11px] font-bold text-left shadow-2xs hover:border-[#A87A2A] transition-colors cursor-pointer"
                    >
                      <span className="text-stone-400 block text-[10px]">Format 3:</span>
                      ✨ Royal Festive Anarkali
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const minimalFormat = `Everyday Chic Straight Kurti Set — SS VASTRA\n\n* Clean contemporary straight silhouette\n* Breathable all-day comfort cotton\n* Side slits for ease of movement\n* Minimal pastel floral motifs\n\nFabric: Pure Breathable Cotton\nFit: Regular Comfort Fit\nWash Care: Machine wash gentle or cold hand wash`;
                        setEditingProduct({ ...editingProduct, description: minimalFormat });
                      }}
                      className="p-1.5 rounded-xl bg-white hover:bg-[#FAF5EE] border border-stone-200 text-stone-800 text-[11px] font-bold text-left shadow-2xs hover:border-[#A87A2A] transition-colors cursor-pointer"
                    >
                      <span className="text-stone-400 block text-[10px]">Format 4:</span>
                      🌿 Minimalist Daily Wear
                    </button>
                  </div>

                  <textarea
                    rows={6}
                    value={editingProduct.description || ''}
                    placeholder="Type description, or click one of the 4 format buttons above..."
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    className="w-full p-3 rounded-xl border border-stone-300 font-sans text-xs leading-relaxed focus:outline-none focus:border-[#A87A2A] bg-white"
                  />

                  {/* Quick Helper Insert Buttons */}
                  <div className="flex items-center gap-2 flex-wrap text-[11px]">
                    <span className="text-stone-500 font-medium">Quick add:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const cur = editingProduct.description || '';
                        setEditingProduct({
                          ...editingProduct,
                          description: cur ? `${cur}\n* New Feature Highlight` : '* New Feature Highlight',
                        });
                      }}
                      className="px-2 py-0.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 cursor-pointer"
                    >
                      + Bullet Point (*)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const cur = editingProduct.description || '';
                        setEditingProduct({
                          ...editingProduct,
                          description: cur ? `${cur}\nFabric: 100% Pure Cotton\nWork: Handblock Print` : 'Fabric: 100% Pure Cotton',
                        });
                      }}
                      className="px-2 py-0.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 cursor-pointer"
                    >
                      + Spec Tag (Key: Value)
                    </button>
                    {editingProduct.description && (
                      <button
                        type="button"
                        onClick={() => setEditingProduct({ ...editingProduct, description: '' })}
                        className="px-2 py-0.5 rounded-lg text-rose-600 hover:bg-rose-50 ml-auto cursor-pointer"
                      >
                        Clear Description
                      </button>
                    )}
                  </div>
                </div>

                {/* 4 Feature Badges & Flags */}
                <div className="p-3 bg-[#FBF7F0] border border-[#E9A9BB]/40 rounded-2xl space-y-2">
                  <label className="block font-bold text-xs text-[#2B2320]">
                    Catalog Placement & Special Badges
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      editingProduct.isSpotlight || editingProduct.isFeatured ? 'bg-amber-50 border-[#A87A2A] font-bold text-[#A87A2A]' : 'bg-white border-stone-200 text-stone-700'
                    }`}>
                      <input
                        type="checkbox"
                        checked={Boolean(editingProduct.isSpotlight || editingProduct.isFeatured)}
                        onChange={(e) => setEditingProduct({ ...editingProduct, isSpotlight: e.target.checked, isFeatured: e.target.checked })}
                        className="rounded accent-[#A87A2A]"
                      />
                      <span>⭐ Add to Spotlight</span>
                    </label>

                    <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      editingProduct.isOutfit ? 'bg-pink-50 border-[#E9A9BB] font-bold text-pink-800' : 'bg-white border-stone-200 text-stone-700'
                    }`}>
                      <input
                        type="checkbox"
                        checked={Boolean(editingProduct.isOutfit)}
                        onChange={(e) => setEditingProduct({ ...editingProduct, isOutfit: e.target.checked })}
                        className="rounded accent-[#A87A2A]"
                      />
                      <span>👗 Add to Outfit (Look)</span>
                    </label>

                    <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      editingProduct.isNewArrival ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-800' : 'bg-white border-stone-200 text-stone-700'
                    }`}>
                      <input
                        type="checkbox"
                        checked={Boolean(editingProduct.isNewArrival)}
                        onChange={(e) => setEditingProduct({ ...editingProduct, isNewArrival: e.target.checked })}
                        className="rounded accent-emerald-600"
                      />
                      <span>🌟 Add to New Arrival</span>
                    </label>

                    <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      editingProduct.isBestSeller ? 'bg-rose-50 border-rose-300 font-bold text-rose-800' : 'bg-white border-stone-200 text-stone-700'
                    }`}>
                      <input
                        type="checkbox"
                        checked={Boolean(editingProduct.isBestSeller)}
                        onChange={(e) => setEditingProduct({ ...editingProduct, isBestSeller: e.target.checked })}
                        className="rounded accent-rose-600"
                      />
                      <span>🔥 Add to Best Seller</span>
                    </label>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-stone-100">
                  {editingProduct.id ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(editingProduct.id!, editingProduct.name)}
                      className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Is product ko hamesha ke liye delete karein"
                    >
                      <Trash2 className="w-4 h-4 text-rose-600" />
                      <span>Delete Outfit (Hataiye)</span>
                    </button>
                  ) : (
                    <div />
                  )}
                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      type="button"
                      onClick={() => setEditingProduct(null)}
                      className="px-4 py-2 rounded-xl border border-stone-300 text-stone-600 font-semibold text-xs hover:bg-stone-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-[#A87A2A] text-white font-bold text-xs hover:bg-[#8e6520] transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Confirm Outfit Deletion (Zero iframe prompt block) */}
        {productToDelete && (
          <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 text-center animate-in fade-in zoom-in-95 duration-150">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-lg text-stone-900 mb-1">
                Outfit Delete Karein?
              </h3>
              <p className="text-xs text-stone-600 mb-5 leading-relaxed">
                Kya aap sach me <span className="font-bold text-stone-800">"{productToDelete.name}"</span> ko website se delete karna chahte hain? Delete hone ke baad ye website se turant hat jayega.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setProductToDelete(null)}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-stone-300 text-stone-700 font-semibold text-xs hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const { id, name } = productToDelete;
                    setProductToDelete(null);
                    executeDeleteProduct(id, name);
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-sm"
                >
                  Haan, Delete Karein
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Update Courier & Shipment */}
        {selectedOrder && (
          <div className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-stone-200">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-[#A87A2A]" />
                  <h3 className="font-serif text-lg font-bold text-[#2B2320]">
                    Dispatch Details: #{selectedOrder.orderNumber}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1.5 rounded-full text-stone-400 hover:text-stone-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Courier Partner</label>
                  <select
                    value={shipmentCourier}
                    onChange={(e) => {
                      const selectedVal = e.target.value;
                      setShipmentCourier(selectedVal);
                      const matched = deliveryPartnersList.find((p) => p.name === selectedVal);
                      if (matched) {
                        setShipmentEstimatedDate(matched.estimatedDays);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white"
                  >
                    {deliveryPartnersList
                      .filter((p) => p.isActive)
                      .map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name} {p.isDefault ? '⭐ (Default)' : ''}
                        </option>
                      ))}
                    <option value="Other Courier">Other / Custom Courier</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Tracking Number / AWB</label>
                  <input
                    type="text"
                    value={shipmentTrackingNumber}
                    onChange={(e) => setShipmentTrackingNumber(e.target.value)}
                    placeholder="e.g. 142389201948"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Estimated Delivery Window</label>
                  <input
                    type="text"
                    value={shipmentEstimatedDate}
                    onChange={(e) => setShipmentEstimatedDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleUpdateShipment(selectedOrder.id)}
                  className="w-full py-2.5 rounded-xl bg-[#A87A2A] text-white font-bold text-xs hover:bg-[#8e6520] transition-colors mt-2"
                >
                  Save & Notify Customer Tracking
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Payment Gateway Modal */}
        {showAddGatewayModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#A87A2A]" />
                  <h3 className="font-serif text-lg font-bold text-[#2B2320]">
                    Add Payment Gateway
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddGatewayModal(false)}
                  className="p-1 rounded-lg hover:bg-stone-100 text-stone-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Provider Quick Selector */}
              <div className="mb-4">
                <label className="block text-[11px] font-semibold text-stone-600 mb-1.5">
                  Select Gateway Provider
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'razorpay', label: 'Razorpay', defaultName: 'Razorpay Standard PG' },
                    { id: 'phonepe', label: 'PhonePe', defaultName: 'PhonePe PG Direct' },
                    { id: 'paytm', label: 'Paytm', defaultName: 'Paytm All-in-One' },
                    { id: 'cashfree', label: 'Cashfree', defaultName: 'Cashfree PG' },
                    { id: 'payu', label: 'PayU Money', defaultName: 'PayU India' },
                    { id: 'stripe', label: 'Stripe', defaultName: 'Stripe International' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() =>
                        setNewGatewayForm({
                          ...newGatewayForm,
                          provider: p.id as any,
                          name: newGatewayForm.name ? newGatewayForm.name : p.defaultName,
                        })
                      }
                      className={`px-2.5 py-2 rounded-xl text-xs font-bold border text-center transition-all ${
                        newGatewayForm.provider === p.id
                          ? 'bg-[#A87A2A] text-white border-[#A87A2A] shadow-xs'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleAddGatewaySubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Gateway Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newGatewayForm.name}
                    placeholder="e.g. Razorpay Standard Checkout"
                    onChange={(e) => setNewGatewayForm({ ...newGatewayForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Environment Mode
                    </label>
                    <select
                      value={newGatewayForm.mode}
                      onChange={(e) =>
                        setNewGatewayForm({ ...newGatewayForm, mode: e.target.value as 'test' | 'live' })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                    >
                      <option value="test">Test / Sandbox Mode</option>
                      <option value="live">Live / Production</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Key ID / Merchant ID *
                    </label>
                    <input
                      type="text"
                      required
                      value={newGatewayForm.keyId}
                      placeholder="rzp_live_xxx or Merchant ID"
                      onChange={(e) => setNewGatewayForm({ ...newGatewayForm, keyId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-[11px] focus:outline-none focus:border-[#A87A2A]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Key Secret / Salt Key
                    </label>
                    <input
                      type="password"
                      value={newGatewayForm.keySecret || ''}
                      placeholder="Enter Secret Key"
                      onChange={(e) => setNewGatewayForm({ ...newGatewayForm, keySecret: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-[11px] focus:outline-none focus:border-[#A87A2A]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Webhook Secret (Optional)
                    </label>
                    <input
                      type="text"
                      value={newGatewayForm.webhookSecret || ''}
                      placeholder="whsec_xxx"
                      onChange={(e) => setNewGatewayForm({ ...newGatewayForm, webhookSecret: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-[11px] focus:outline-none focus:border-[#A87A2A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Customer Instructions / Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={newGatewayForm.instructions || ''}
                    placeholder="Pay securely using Credit/Debit Cards, UPI, NetBanking, and Wallets."
                    onChange={(e) => setNewGatewayForm({ ...newGatewayForm, instructions: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                  />
                </div>

                <div className="p-3 bg-stone-50 rounded-xl space-y-2 border border-stone-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newGatewayForm.isDefault}
                      onChange={(e) => setNewGatewayForm({ ...newGatewayForm, isDefault: e.target.checked })}
                      className="rounded text-[#A87A2A] focus:ring-[#A87A2A]"
                    />
                    <span className="font-semibold text-stone-700">Set as Primary / Default Gateway</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newGatewayForm.isActive}
                      onChange={(e) => setNewGatewayForm({ ...newGatewayForm, isActive: e.target.checked })}
                      className="rounded text-[#A87A2A] focus:ring-[#A87A2A]"
                    />
                    <span className="font-semibold text-stone-700">Activate Immediately at Checkout</span>
                  </label>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddGatewayModal(false)}
                    className="px-4 py-2 rounded-xl border border-stone-300 text-stone-600 hover:bg-stone-50 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#A87A2A] hover:bg-[#8e6520] text-white font-bold transition-colors shadow-xs"
                  >
                    Save Payment Gateway
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Bank Account Modal */}
        {showAddBankModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
                <div className="flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-[#A87A2A]" />
                  <h3 className="font-serif text-lg font-bold text-[#2B2320]">
                    Add Store Bank Account
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddBankModal(false)}
                  className="p-1 rounded-lg hover:bg-stone-100 text-stone-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Popular Banks Quick Selector */}
              <div className="mb-4">
                <label className="block text-[11px] font-semibold text-stone-600 mb-1.5">
                  Popular Indian Banks (Click to auto-fill)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { name: 'State Bank of India (SBI)', ifsc: 'SBIN0' },
                    { name: 'HDFC Bank', ifsc: 'HDFC0' },
                    { name: 'ICICI Bank', ifsc: 'ICIC0' },
                    { name: 'Axis Bank', ifsc: 'UTIB0' },
                    { name: 'Punjab National Bank (PNB)', ifsc: 'PUNB0' },
                    { name: 'Bank of Baroda', ifsc: 'BARB0' },
                    { name: 'Kotak Mahindra Bank', ifsc: 'KKBK0' },
                  ].map((bank) => (
                    <button
                      key={bank.name}
                      type="button"
                      onClick={() =>
                        setNewBankForm({
                          ...newBankForm,
                          bankName: bank.name,
                          ifsc: newBankForm.ifsc || bank.ifsc,
                        })
                      }
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-stone-50 border border-stone-200 hover:bg-amber-50 hover:border-[#A87A2A]/40 text-stone-700 transition-colors"
                    >
                      {bank.name.split(' (')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleAddBankSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Bank Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newBankForm.bankName}
                      placeholder="e.g. State Bank of India"
                      onChange={(e) => setNewBankForm({ ...newBankForm, bankName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Account Type
                    </label>
                    <select
                      value={newBankForm.accountType}
                      onChange={(e) =>
                        setNewBankForm({ ...newBankForm, accountType: e.target.value as any })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                    >
                      <option value="Current Account">Current Account (Business)</option>
                      <option value="Savings Account">Savings Account</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Beneficiary / Account Holder Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newBankForm.accountHolder}
                    placeholder="e.g. SS VASTRA JAIPUR"
                    onChange={(e) => setNewBankForm({ ...newBankForm, accountHolder: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Bank Account Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={newBankForm.accountNumber}
                      placeholder="Enter 9-18 digit account number"
                      onChange={(e) => setNewBankForm({ ...newBankForm, accountNumber: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono font-bold focus:outline-none focus:border-[#A87A2A]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Bank IFSC Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={newBankForm.ifsc}
                      placeholder="e.g. SBIN0031114"
                      onChange={(e) => setNewBankForm({ ...newBankForm, ifsc: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono font-bold uppercase focus:outline-none focus:border-[#A87A2A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Branch Name & Location (Optional)
                  </label>
                  <input
                    type="text"
                    value={newBankForm.branch || ''}
                    placeholder="e.g. Sanganer Branch, Jaipur, Rajasthan"
                    onChange={(e) => setNewBankForm({ ...newBankForm, branch: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Payment Instructions (Shown to customer at checkout)
                  </label>
                  <textarea
                    rows={2}
                    value={newBankForm.instructions || ''}
                    placeholder="Kripya IMPS / NEFT transfer ke baad transaction UTR WhatsApp par send karein."
                    onChange={(e) => setNewBankForm({ ...newBankForm, instructions: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                  />
                </div>

                <div className="p-3 bg-stone-50 rounded-xl space-y-2 border border-stone-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newBankForm.isDefault}
                      onChange={(e) => setNewBankForm({ ...newBankForm, isDefault: e.target.checked })}
                      className="rounded text-[#A87A2A] focus:ring-[#A87A2A]"
                    />
                    <span className="font-semibold text-stone-700">Set as Primary Bank Account</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newBankForm.isActive}
                      onChange={(e) => setNewBankForm({ ...newBankForm, isActive: e.target.checked })}
                      className="rounded text-[#A87A2A] focus:ring-[#A87A2A]"
                    />
                    <span className="font-semibold text-stone-700">Activate Immediately for Checkout</span>
                  </label>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddBankModal(false)}
                    className="px-4 py-2 rounded-xl border border-stone-300 text-stone-600 hover:bg-stone-50 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#A87A2A] hover:bg-[#8e6520] text-white font-bold transition-colors shadow-xs"
                  >
                    Save Bank Account
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add UPI Account Modal */}
        {showAddUpiModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-[#A87A2A]" />
                  <h3 className="font-serif text-lg font-bold text-[#2B2320]">
                    Add UPI Account & QR Code
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddUpiModal(false)}
                  className="p-1 rounded-lg hover:bg-stone-100 text-stone-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* UPI Quick Templates */}
              <div className="mb-4">
                <label className="block text-[11px] font-semibold text-stone-600 mb-1.5">
                  Popular UPI Apps (Click to preset title)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Google Pay', title: 'Google Pay Official' },
                    { label: 'PhonePe', title: 'PhonePe Business' },
                    { label: 'Paytm UPI', title: 'Paytm All-in-One' },
                    { label: 'BHIM UPI', title: 'BHIM NPCI' },
                    { label: 'Cred Pay', title: 'Cred UPI' },
                  ].map((app) => (
                    <button
                      key={app.label}
                      type="button"
                      onClick={() =>
                        setNewUpiForm({
                          ...newUpiForm,
                          title: app.title,
                        })
                      }
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-stone-50 border border-stone-200 hover:bg-amber-50 hover:border-[#A87A2A]/40 text-stone-700 transition-colors"
                    >
                      {app.label}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleAddUpiSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    UPI Account Title / Label *
                  </label>
                  <input
                    type="text"
                    required
                    value={newUpiForm.title}
                    placeholder="e.g. SS Vastra Official PhonePe / GPay"
                    onChange={(e) => setNewUpiForm({ ...newUpiForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      UPI ID (VPA) *
                    </label>
                    <input
                      type="text"
                      required
                      value={newUpiForm.upiId}
                      placeholder="e.g. 9783770735@upi or ssvastra@okaxis"
                      onChange={(e) => setNewUpiForm({ ...newUpiForm, upiId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono font-bold focus:outline-none focus:border-[#A87A2A]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Payee / Merchant Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newUpiForm.payeeName}
                      placeholder="e.g. SS VASTRA JAIPUR"
                      onChange={(e) => setNewUpiForm({ ...newUpiForm, payeeName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Linked Mobile Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={newUpiForm.phone || ''}
                    placeholder="e.g. 9783770735"
                    onChange={(e) => setNewUpiForm({ ...newUpiForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono focus:outline-none focus:border-[#A87A2A]"
                  />
                </div>

                {/* QR Code generator and upload */}
                <div className="p-3 bg-stone-50 rounded-xl space-y-3 border border-stone-200">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-stone-800">UPI Payment QR Code</span>
                    <span className="text-[10px] text-stone-500">Auto-generate or upload</span>
                  </div>

                  <input
                    ref={newUpiQrFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleNewUpiQrFileChange}
                  />

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleGenerateNewUpiQr}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#A87A2A] text-white font-bold hover:bg-[#8e6520] transition-colors"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Auto-Generate NPCI QR</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => newUpiQrFileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 font-semibold transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5 text-stone-500" />
                      <span>Upload Custom QR</span>
                    </button>
                  </div>

                  {newUpiForm.qrImageUrl && (
                    <div className="flex items-center gap-3 pt-2 border-t border-stone-200">
                      <img
                        src={newUpiForm.qrImageUrl}
                        alt="QR Preview"
                        className="w-14 h-14 object-contain rounded-lg border border-stone-300 bg-white p-1"
                      />
                      <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>QR Code ready for checkout</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-stone-50 rounded-xl space-y-2 border border-stone-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newUpiForm.isDefault}
                      onChange={(e) => setNewUpiForm({ ...newUpiForm, isDefault: e.target.checked })}
                      className="rounded text-[#A87A2A] focus:ring-[#A87A2A]"
                    />
                    <span className="font-semibold text-stone-700">Set as Primary UPI ID</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newUpiForm.isActive}
                      onChange={(e) => setNewUpiForm({ ...newUpiForm, isActive: e.target.checked })}
                      className="rounded text-[#A87A2A] focus:ring-[#A87A2A]"
                    />
                    <span className="font-semibold text-stone-700">Activate Immediately for Customers</span>
                  </label>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddUpiModal(false)}
                    className="px-4 py-2 rounded-xl border border-stone-300 text-stone-600 hover:bg-stone-50 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#A87A2A] hover:bg-[#8e6520] text-white font-bold transition-colors shadow-xs"
                  >
                    Save UPI Account
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Delivery Partner Modal */}
        {showAddDeliveryModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-[#A87A2A]" />
                  <h3 className="font-serif text-lg font-bold text-[#2B2320]">
                    Add New Delivery Partner
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddDeliveryModal(false)}
                  className="p-1 rounded-lg hover:bg-stone-100 text-stone-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Logistics Presets */}
              <div className="mb-4">
                <label className="block text-[11px] font-semibold text-stone-600 mb-1.5">
                  Popular Indian Logistics Partners (Click to auto-fill)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    {
                      name: 'Delhivery',
                      url: 'https://www.delhivery.com/track/package/{TRACKING_NO}',
                      days: '2 to 4 Business Days',
                      phone: '1800 102 4567',
                    },
                    {
                      name: 'Shiprocket',
                      url: 'https://shiprocket.co/tracking/{TRACKING_NO}',
                      days: '3 to 5 Business Days',
                      phone: '011 4118 7666',
                    },
                    {
                      name: 'Blue Dart',
                      url: 'https://www.bluedart.com/tracking?track={TRACKING_NO}',
                      days: '1 to 3 Business Days',
                      phone: '1860 233 1234',
                    },
                    {
                      name: 'DTDC Courier',
                      url: 'https://www.dtdc.in/tracking/shipment-tracking.asp?strCnno={TRACKING_NO}',
                      days: '2 to 5 Business Days',
                      phone: '080 2536 5032',
                    },
                    {
                      name: 'India Post Speed Post',
                      url: 'https://www.indiapost.gov.in/_layouts/15/dpt.cept.tracking/trackconsignment.aspx?consNo={TRACKING_NO}',
                      days: '4 to 7 Business Days',
                      phone: '1800 266 6868',
                    },
                    {
                      name: 'Shadowfax',
                      url: 'https://tracker.shadowfax.in/track?orderId={TRACKING_NO}',
                      days: '2 to 4 Business Days',
                      phone: '080 6817 2500',
                    },
                    {
                      name: 'XpressBees',
                      url: 'https://www.xpressbees.com/track?awb={TRACKING_NO}',
                      days: '2 to 4 Business Days',
                      phone: '020 4911 1900',
                    },
                    {
                      name: 'Porter Express',
                      url: 'https://porter.in/track?orderId={TRACKING_NO}',
                      days: 'Same / Next Day',
                      phone: '022 4410 4410',
                    },
                  ].map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() =>
                        setNewPartnerForm({
                          ...newPartnerForm,
                          name: p.name,
                          trackingUrlTemplate: p.url,
                          estimatedDays: p.days,
                          phone: p.phone,
                        })
                      }
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-stone-50 border border-stone-200 hover:bg-amber-50 hover:border-[#A87A2A]/40 text-stone-700 transition-colors"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleAddPartnerSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Courier Partner Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newPartnerForm.name}
                    placeholder="e.g. Shadowfax, XpressBees, Porter, Blue Dart"
                    onChange={(e) => setNewPartnerForm({ ...newPartnerForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Tracking URL Template *
                  </label>
                  <input
                    type="text"
                    required
                    value={newPartnerForm.trackingUrlTemplate}
                    placeholder="https://example.com/track/{TRACKING_NO}"
                    onChange={(e) => setNewPartnerForm({ ...newPartnerForm, trackingUrlTemplate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-[11px] focus:outline-none focus:border-[#A87A2A]"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">
                    Use <code className="bg-stone-100 px-1 rounded text-[#A87A2A]">{'{TRACKING_NO}'}</code> where the tracking AWB will be dynamically inserted.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Estimated Delivery Days
                    </label>
                    <input
                      type="text"
                      value={newPartnerForm.estimatedDays}
                      placeholder="e.g. 2 to 4 Business Days"
                      onChange={(e) => setNewPartnerForm({ ...newPartnerForm, estimatedDays: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Support Helpline / Phone
                    </label>
                    <input
                      type="text"
                      value={newPartnerForm.phone || ''}
                      placeholder="e.g. 1800 102 4567"
                      onChange={(e) => setNewPartnerForm({ ...newPartnerForm, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                    />
                  </div>
                </div>

                <div className="p-3 bg-stone-50 rounded-xl space-y-2 border border-stone-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newPartnerForm.isDefault}
                      onChange={(e) => setNewPartnerForm({ ...newPartnerForm, isDefault: e.target.checked })}
                      className="rounded text-[#A87A2A] focus:ring-[#A87A2A]"
                    />
                    <span className="font-semibold text-stone-700">Set as Default Courier Partner for New Orders</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newPartnerForm.isActive}
                      onChange={(e) => setNewPartnerForm({ ...newPartnerForm, isActive: e.target.checked })}
                      className="rounded text-[#A87A2A] focus:ring-[#A87A2A]"
                    />
                    <span className="font-semibold text-stone-700">Activate Immediately for Fulfillment</span>
                  </label>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddDeliveryModal(false)}
                    className="px-4 py-2 rounded-xl border border-stone-300 text-stone-600 hover:bg-stone-50 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#A87A2A] hover:bg-[#8e6520] text-white font-bold transition-colors shadow-xs"
                  >
                    Add Courier Partner
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ADD MANUAL CUSTOMER ORDER MODAL */}
        {showAddOrderModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-stone-200">
              <div className="flex items-center justify-between pb-4 border-b border-stone-200">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#A87A2A]/10 text-[#A87A2A] flex items-center justify-center">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-stone-900 text-lg">Naya Customer Order Add Karein</h3>
                    <p className="text-xs text-stone-500">Phone/WhatsApp ya Store se aaya naya customer order create karein</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddOrderModal(false)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateManualOrder} className="space-y-5 pt-4 text-xs">
                {/* Customer Details */}
                <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                  <h4 className="font-bold text-stone-800 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-[#A87A2A]" /> Customer Contact Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Customer Full Name *</label>
                      <input
                        type="text"
                        required
                        value={newOrderForm.customerName}
                        placeholder="e.g. Priya Sharma"
                        onChange={(e) => setNewOrderForm({ ...newOrderForm, customerName: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Phone Number (10 digits) *</label>
                      <input
                        type="tel"
                        required
                        value={newOrderForm.customerPhone}
                        placeholder="e.g. 9876543210"
                        onChange={(e) => setNewOrderForm({ ...newOrderForm, customerPhone: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-stone-700 mb-1">Email Address (Optional)</label>
                      <input
                        type="email"
                        value={newOrderForm.customerEmail}
                        placeholder="customer@gmail.com"
                        onChange={(e) => setNewOrderForm({ ...newOrderForm, customerEmail: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                      />
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                  <h4 className="font-bold text-stone-800 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-[#A87A2A]" /> Shipping Address
                  </h4>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">House / Flat, Street, Landmark *</label>
                    <textarea
                      required
                      rows={2}
                      value={newOrderForm.shippingAddress}
                      placeholder="e.g. House No. 42, Near Raj Mandir, MI Road"
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, shippingAddress: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">City *</label>
                      <input
                        type="text"
                        required
                        value={newOrderForm.city}
                        onChange={(e) => setNewOrderForm({ ...newOrderForm, city: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">State *</label>
                      <input
                        type="text"
                        required
                        value={newOrderForm.state}
                        onChange={(e) => setNewOrderForm({ ...newOrderForm, state: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Pincode *</label>
                      <input
                        type="text"
                        required
                        value={newOrderForm.pincode}
                        placeholder="302001"
                        onChange={(e) => setNewOrderForm({ ...newOrderForm, pincode: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                      />
                    </div>
                  </div>
                </div>

                {/* Outfit & Pricing */}
                <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                  <h4 className="font-bold text-stone-800 flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-[#A87A2A]" /> Outfit Item Details & Pricing
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Outfit / Product Name *</label>
                      <input
                        type="text"
                        required
                        value={newOrderForm.itemName}
                        placeholder="e.g. Royal Handblock Anarkali Suit"
                        onChange={(e) => setNewOrderForm({ ...newOrderForm, itemName: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-semibold text-stone-700 mb-1">Size</label>
                        <select
                          value={newOrderForm.itemSize}
                          onChange={(e) => setNewOrderForm({ ...newOrderForm, itemSize: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                        >
                          {['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size', 'Custom'].map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-stone-700 mb-1">Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={newOrderForm.itemQuantity}
                          onChange={(e) => {
                            const q = Number(e.target.value) || 1;
                            setNewOrderForm((prev) => ({
                              ...prev,
                              itemQuantity: q,
                              totalAmount: (Number(prev.itemPrice) || 0) * q - (Number(prev.discountAmount) || 0),
                            }));
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Unit Price (₹) *</label>
                      <input
                        type="number"
                        required
                        value={newOrderForm.itemPrice}
                        onChange={(e) => {
                          const p = Number(e.target.value) || 0;
                          setNewOrderForm((prev) => ({
                            ...prev,
                            itemPrice: p,
                            totalAmount: p * (Number(prev.itemQuantity) || 1) - (Number(prev.discountAmount) || 0),
                          }));
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Total Order Amount (₹) *</label>
                      <input
                        type="number"
                        required
                        value={newOrderForm.totalAmount}
                        onChange={(e) => setNewOrderForm({ ...newOrderForm, totalAmount: Number(e.target.value) || 0 })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold text-stone-900 focus:outline-none focus:border-[#A87A2A]"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment, Status & Tracking */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Payment Method</label>
                    <select
                      value={newOrderForm.paymentMethod}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, paymentMethod: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                    >
                      <option value="cod">Cash on Delivery (COD)</option>
                      <option value="razorpay">Razorpay Online</option>
                      <option value="upi">Direct UPI Transfer</option>
                      <option value="bank_transfer">Bank NEFT/IMPS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Payment Status</label>
                    <select
                      value={newOrderForm.paymentStatus}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, paymentStatus: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="refunded">Refunded</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Order Status</label>
                    <select
                      value={newOrderForm.orderStatus}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, orderStatus: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                    >
                      <option value="Confirmed">Confirmed</option>
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Optional Courier & Tracking */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Courier Partner</label>
                    <input
                      type="text"
                      value={newOrderForm.courierPartner}
                      placeholder="e.g. Delhivery Express"
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, courierPartner: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">AWB Tracking Number</label>
                    <input
                      type="text"
                      value={newOrderForm.trackingNumber}
                      placeholder="e.g. DL982736154IN"
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, trackingNumber: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono focus:outline-none focus:border-[#A87A2A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Order Notes (Customer / Admin)</label>
                  <input
                    type="text"
                    value={newOrderForm.notes}
                    placeholder="e.g. Urgent wedding order, customer requested golden dupatta"
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, notes: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                  />
                </div>

                <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddOrderModal(false)}
                    className="px-4 py-2 rounded-xl border border-stone-300 text-stone-600 hover:bg-stone-50 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingOrder}
                    className="px-5 py-2 rounded-xl bg-[#A87A2A] hover:bg-[#8e6520] text-white font-bold transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    {isSavingOrder ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Create & Save Order</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EDIT / UPDATE CUSTOMER ORDER MODAL */}
        {editingOrderModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-stone-200">
              <div className="flex items-center justify-between pb-4 border-b border-stone-200">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Edit className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-stone-900 text-lg">
                      Order #{editingOrderModal.orderNumber || editingOrderModal.id} Update Karein
                    </h3>
                    <p className="text-xs text-stone-500">Customer details, address ya status modify karein</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingOrderModal(null)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateOrderDetails} className="space-y-4 pt-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Customer Name</label>
                    <input
                      type="text"
                      required
                      value={editingOrderModal.customerName || ''}
                      onChange={(e) => setEditingOrderModal({ ...editingOrderModal, customerName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={editingOrderModal.customerPhone || ''}
                      onChange={(e) => setEditingOrderModal({ ...editingOrderModal, customerPhone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Customer Email</label>
                  <input
                    type="email"
                    value={editingOrderModal.customerEmail || ''}
                    onChange={(e) => setEditingOrderModal({ ...editingOrderModal, customerEmail: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Shipping Address</label>
                  <textarea
                    rows={2}
                    value={editingOrderModal.shippingAddress || ''}
                    onChange={(e) => setEditingOrderModal({ ...editingOrderModal, shippingAddress: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">City</label>
                    <input
                      type="text"
                      value={editingOrderModal.city || ''}
                      onChange={(e) => setEditingOrderModal({ ...editingOrderModal, city: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">State</label>
                    <input
                      type="text"
                      value={editingOrderModal.state || ''}
                      onChange={(e) => setEditingOrderModal({ ...editingOrderModal, state: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Pincode</label>
                    <input
                      type="text"
                      value={editingOrderModal.pincode || ''}
                      onChange={(e) => setEditingOrderModal({ ...editingOrderModal, pincode: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Total Amount (₹)</label>
                    <input
                      type="number"
                      value={editingOrderModal.totalAmount || 0}
                      onChange={(e) => setEditingOrderModal({ ...editingOrderModal, totalAmount: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold focus:outline-none focus:border-[#A87A2A]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Payment Status</label>
                    <select
                      value={editingOrderModal.paymentStatus || 'pending'}
                      onChange={(e) => setEditingOrderModal({ ...editingOrderModal, paymentStatus: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="refunded">Refunded</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Order Status</label>
                    <select
                      value={editingOrderModal.orderStatus || 'Confirmed'}
                      onChange={(e) => setEditingOrderModal({ ...editingOrderModal, orderStatus: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                    >
                      <option value="Placed">Placed</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Courier Partner</label>
                    <input
                      type="text"
                      value={(editingOrderModal as any).courierPartner || (editingOrderModal as any).courierName || ''}
                      placeholder="e.g. Delhivery Express"
                      onChange={(e) => setEditingOrderModal({ ...editingOrderModal, courierPartner: e.target.value } as any)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Tracking Number</label>
                    <input
                      type="text"
                      value={editingOrderModal.trackingNumber || ''}
                      placeholder="AWB Tracking #"
                      onChange={(e) => setEditingOrderModal({ ...editingOrderModal, trackingNumber: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono focus:outline-none focus:border-[#A87A2A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Notes</label>
                  <input
                    type="text"
                    value={(editingOrderModal as any).notes || ''}
                    placeholder="Customer notes"
                    onChange={(e) => setEditingOrderModal({ ...editingOrderModal, notes: e.target.value } as any)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                  />
                </div>

                <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingOrderModal(null)}
                    className="px-4 py-2 rounded-xl border border-stone-300 text-stone-600 hover:bg-stone-50 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingOrder}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    {isSavingOrder ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Update Order</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DELETE ORDER CONFIRMATION MODAL */}
        {orderToDelete && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-stone-900 text-base">Order Remove Karein?</h3>
                  <p className="text-xs text-stone-500">Order #{orderToDelete.orderNumber || orderToDelete.id}</p>
                </div>
              </div>

              <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-xs text-red-800 space-y-1 mb-5">
                <p className="font-bold">Kya aap is order ko database se permanently delete karna chahte hain?</p>
                <p className="text-red-700">Customer: <span className="font-semibold">{orderToDelete.customerName}</span> ({orderToDelete.customerPhone})</p>
                <p className="text-red-700">Amount: <span className="font-semibold">₹{orderToDelete.totalAmount}</span></p>
                <p className="text-[11px] text-red-600 mt-2">Yeh action undo nahi kiya ja sakta.</p>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOrderToDelete(null)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-600 hover:bg-stone-50 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => executeDeleteOrder(orderToDelete.id)}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Haan, Delete Karein</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ORDER TRACKING & LIVE CHECKPOINT MODAL */}
        {trackingModalOrder && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-stone-200">
              <div className="flex items-center justify-between pb-4 border-b border-stone-200">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-stone-900 text-lg">
                      Live Shipment & Tracking - #{trackingModalOrder.orderNumber || trackingModalOrder.id}
                    </h3>
                    <p className="text-xs text-stone-500">
                      Customer: {trackingModalOrder.customerName} ({trackingModalOrder.customerPhone})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setTrackingModalOrder(null)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveTrackingDetails} className="space-y-4 pt-4 text-xs">
                {/* Courier Partner Selection & Presets */}
                <div className="space-y-1.5">
                  <label className="block font-semibold text-stone-700">Courier Partner Chunein</label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { name: 'Delhivery Express', url: 'https://www.delhivery.com/track/package/{AWB}' },
                      { name: 'Shiprocket', url: 'https://shiprocket.co/tracking/{AWB}' },
                      { name: 'Blue Dart', url: 'https://www.bluedart.com/tracking?handler=traking_awb&numbers={AWB}' },
                      { name: 'DTDC Express', url: 'https://www.dtdc.in/tracking/shipment-tracking.asp?trkType=AWB&strCnno={AWB}' },
                      { name: 'Shadowfax', url: 'https://tracker.shadowfax.in/#/track/{AWB}' },
                      { name: 'India Post (Speed Post)', url: 'https://www.indiapost.gov.in/_layouts/15/dpt.ptc.track/track.aspx?track_number={AWB}' },
                    ].map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => {
                          const awb = trackingForm.trackingNumber || `DEL${trackingModalOrder.id}${Math.floor(100000 + Math.random() * 900000)}`;
                          setTrackingForm((prev) => ({
                            ...prev,
                            courierPartner: c.name,
                            trackingNumber: prev.trackingNumber || awb,
                            trackingUrl: c.url.replace('{AWB}', prev.trackingNumber || awb),
                          }));
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer border ${
                          trackingForm.courierPartner === c.name
                            ? 'bg-[#A87A2A] text-white border-[#A87A2A]'
                            : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Selected Courier</label>
                    <input
                      type="text"
                      required
                      value={trackingForm.courierPartner}
                      placeholder="e.g. Delhivery Express"
                      onChange={(e) => setTrackingForm({ ...trackingForm, courierPartner: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-stone-700">AWB Tracking Number</label>
                      <button
                        type="button"
                        onClick={() => {
                          const prefix = trackingForm.courierPartner.toLowerCase().includes('shiprocket')
                            ? 'SR'
                            : trackingForm.courierPartner.toLowerCase().includes('dtdc')
                            ? 'DTDC'
                            : trackingForm.courierPartner.toLowerCase().includes('blue')
                            ? 'BD'
                            : 'DEL';
                          const autoAwb = `${prefix}${trackingModalOrder.id}${Math.floor(100000 + Math.random() * 900000)}`;
                          const urlTemplate = trackingForm.courierPartner.toLowerCase().includes('shiprocket')
                            ? `https://shiprocket.co/tracking/${autoAwb}`
                            : `https://www.delhivery.com/track/package/${autoAwb}`;
                          setTrackingForm((prev) => ({
                            ...prev,
                            trackingNumber: autoAwb,
                            trackingUrl: urlTemplate,
                          }));
                        }}
                        className="text-[10px] text-[#A87A2A] font-bold hover:underline cursor-pointer"
                      >
                        ⚡ Auto-Generate AWB
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={trackingForm.trackingNumber}
                      placeholder="e.g. DEL789123456IN"
                      onChange={(e) => {
                        const val = e.target.value;
                        setTrackingForm((prev) => ({
                          ...prev,
                          trackingNumber: val,
                          trackingUrl: val ? `https://www.delhivery.com/track/package/${val}` : prev.trackingUrl,
                        }));
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono focus:outline-none focus:border-[#A87A2A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Live Official Tracking URL</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={trackingForm.trackingUrl}
                      placeholder="https://www.delhivery.com/track/package/..."
                      onChange={(e) => setTrackingForm({ ...trackingForm, trackingUrl: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-[11px] focus:outline-none focus:border-[#A87A2A]"
                    />
                    {trackingForm.trackingUrl && (
                      <a
                        href={trackingForm.trackingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-[#A87A2A] hover:bg-[#8e6520] text-white flex items-center gap-1.5 shrink-0 font-bold transition-colors shadow-xs"
                        title="Test Official Live Tracking Link"
                      >
                        <span>Test Link</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Estimated Delivery</label>
                    <input
                      type="text"
                      value={trackingForm.estimatedDelivery}
                      placeholder="e.g. 3 to 5 Business Days"
                      onChange={(e) => setTrackingForm({ ...trackingForm, estimatedDelivery: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Order Status</label>
                    <select
                      value={trackingForm.status}
                      onChange={(e) => setTrackingForm({ ...trackingForm, status: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                    >
                      <option value="Confirmed">Confirmed</option>
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="In Transit">In Transit</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  </div>
                </div>

                {/* Add Live Checkpoint Timeline Section */}
                <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/80 space-y-3">
                  <h4 className="font-bold text-amber-900 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-700" /> Naya Timeline Checkpoint Add Karein
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Checkpoint Status</label>
                      <select
                        value={trackingForm.newCheckpointStatus}
                        onChange={(e) => setTrackingForm({ ...trackingForm, newCheckpointStatus: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-[#A87A2A]"
                      >
                        <option value="Dispatched">Dispatched from Warehouse</option>
                        <option value="In Transit">In Transit</option>
                        <option value="Arrived at Hub">Arrived at Courier Hub</option>
                        <option value="Out for Delivery">Out for Delivery</option>
                        <option value="Delivered">Delivered to Customer</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Location / Hub</label>
                      <input
                        type="text"
                        value={trackingForm.newCheckpointLocation}
                        placeholder="e.g. Jaipur Sorting Facility"
                        onChange={(e) => setTrackingForm({ ...trackingForm, newCheckpointLocation: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-[#A87A2A]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Checkpoint Note / Update Message</label>
                    <input
                      type="text"
                      value={trackingForm.newCheckpointNote}
                      placeholder="e.g. Package scanned and out for delivery"
                      onChange={(e) => setTrackingForm({ ...trackingForm, newCheckpointNote: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-[#A87A2A]"
                    />
                  </div>
                </div>

                {/* Display Current Timeline Events if available (Crash-Proof Parsing) */}
                {(() => {
                  const ship = (trackingModalOrder as any)?.shipment;
                  if (!ship) return null;
                  let raw = ship.events ?? ship.statusUpdates;
                  if (!raw) return null;
                  if (typeof raw === 'string') {
                    try {
                      raw = JSON.parse(raw);
                    } catch {
                      raw = [{ status: 'Status', description: raw, timestamp: new Date().toISOString() }];
                    }
                  }
                  const safeList = Array.isArray(raw) ? raw : (typeof raw === 'object' ? Object.values(raw) : []);
                  if (safeList.length === 0) return null;

                  return (
                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                      <h5 className="font-bold text-stone-700 mb-2">Past Tracking Timeline:</h5>
                      <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                        {safeList.map((ev: any, idx: number) => (
                          <div key={idx} className="flex items-start gap-2 text-[11px] pb-2 border-b border-stone-200 last:border-0 last:pb-0">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <span className="font-bold text-stone-800">{ev.status || ev.title}</span>
                              {ev.location && <span className="text-stone-500"> • {ev.location}</span>}
                              <p className="text-stone-600">{ev.note || ev.description}</p>
                            </div>
                            <span className="text-[10px] text-stone-400 shrink-0">
                              {ev.timestamp ? new Date(ev.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleRemoveTracking(trackingModalOrder.id)}
                    className="px-3 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-bold transition-colors flex items-center gap-1.5"
                    title="Remove AWB & Courier Details"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Remove Tracking</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTrackingModalOrder(null)}
                      className="px-4 py-2 rounded-xl border border-stone-300 text-stone-600 hover:bg-stone-50 font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition-colors shadow-xs flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Save Tracking Details</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Printable Tax Invoice & Shipping Label Modal */}
        <AdminInvoiceModal
          order={printingOrder}
          onClose={() => setPrintingOrder(null)}
          settings={settingsMap}
          onOrderUpdated={(updated) => {
            setOrdersList((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
            setPrintingOrder(updated);
            setActionMessage('Invoice corrections successfully saved to order!');
            setTimeout(() => setActionMessage(null), 3500);
          }}
        />

        {/* Deep Link & QR Generator Modal */}
        <DeepLinkModal
          isOpen={showDeepLinkModal}
          onClose={() => setShowDeepLinkModal(false)}
          products={productsList}
          categories={categoriesList}
          initialProduct={selectedDeepLinkProduct}
        />

        {/* Video Reel Add / Edit Modal (9:16 Portrait) */}
        {showReelModal && editingReel && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden my-6 border border-stone-200">
              <div className="px-6 py-4 bg-[#FBF7F0] border-b border-stone-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#F7E3E8] border border-[#A87A2A]/40 flex items-center justify-center text-[#A87A2A]">
                    <Film className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#2B2320]">
                      {editingReel.id ? 'Edit Video Reel (9:16)' : 'Add New Video Reel (9:16)'}
                    </h3>
                    <p className="text-[10px] text-stone-500">
                      Mobile portrait video reel for homepage "Watch, Love & Shop" section
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReelModal(false)}
                  className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveReel} className="p-6 space-y-4 text-xs">
                {/* Reel Title */}
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Reel Title / Caption *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Anarkali Handblock Drape Look"
                    value={editingReel.title || ''}
                    onChange={(e) => setEditingReel({ ...editingReel, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                  />
                </div>

                {/* 9:16 Video Upload (Direct PC/Mobile & Google Drive) */}
                <div className="p-4 bg-gradient-to-br from-[#FBF7F0] to-[#F5ECE1] border-2 border-[#A87A2A]/30 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-stone-800 text-xs flex items-center gap-1.5">
                      <Film className="w-4 h-4 text-[#A87A2A]" />
                      <span>9:16 Portrait Reel Video *</span>
                    </label>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#A87A2A]/10 text-[#A87A2A] font-bold">
                      PC • Mobile • Google Drive
                    </span>
                  </div>

                  {/* Direct Device Video Upload Button */}
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={reelVideoFileInputRef}
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime,video/*"
                      onChange={handleReelVideoFileSelect}
                      className="hidden"
                      id="admin-reel-video-file"
                    />
                    <label
                      htmlFor="admin-reel-video-file"
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-sm ${
                        isUploadingReelVideo
                          ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                          : 'bg-[#2B2320] hover:bg-stone-800 text-white'
                      }`}
                    >
                      {isUploadingReelVideo ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                          <span>{reelVideoUploadMsg || 'Video Upload Ho Rahi Hai...'}</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 text-amber-400" />
                          <span>📁 Phone / PC se Video Upload Karein</span>
                        </>
                      )}
                    </label>
                  </div>

                  {/* Video URL or Google Drive Paste Input */}
                  <div>
                    <label className="block text-[10px] font-semibold text-stone-600 mb-1">
                      Ya Google Drive / Cloud Video URL Paste Karein:
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="https://drive.google.com/file/d/... ya direct .mp4 link"
                        value={editingReel.videoUrl || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const normalized = normalizeVideoUrl(val);
                          setEditingReel({ ...editingReel, videoUrl: normalized });
                        }}
                        className="w-full px-3 py-2 pr-8 rounded-xl border border-stone-300 font-mono text-[11px] bg-white focus:outline-none focus:border-[#A87A2A]"
                      />
                      {editingReel.videoUrl && (
                        <button
                          type="button"
                          onClick={() => setEditingReel({ ...editingReel, videoUrl: '' })}
                          className="absolute right-2 top-2.5 text-stone-400 hover:text-rose-600"
                          title="Clear Video URL"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Google Drive Tip Banner */}
                  <div className="p-2.5 bg-amber-50/80 rounded-xl border border-amber-200/80 text-[10.5px] text-amber-900 flex items-start gap-2">
                    <CloudUpload className="w-4 h-4 text-[#A87A2A] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Google Drive Video Kaise Use Karein?</p>
                      <p className="text-[9.5px] text-stone-600 leading-relaxed">
                        Drive me video upload karein ➔ "Share" ➔ "Anyone with link" (Viewer) karein ➔ link yahan paste karein. Hamara system ise auto-streamable video bana dega!
                      </p>
                    </div>
                  </div>

                  {/* Video Live Preview inside Modal */}
                  {editingReel.videoUrl && (
                    <div className="p-3 bg-stone-900 rounded-2xl text-center space-y-2">
                      <div className="flex items-center justify-between text-stone-300 text-[10px] px-1 font-bold">
                        <span className="flex items-center gap-1 text-emerald-400">
                          <Check className="w-3.5 h-3.5" />
                          <span>Video Attached & Ready</span>
                        </span>
                        <span className="text-stone-400 font-mono text-[9px] truncate max-w-[200px]">
                          {editingReel.videoUrl.slice(0, 35)}...
                        </span>
                      </div>

                      <div className="relative max-w-[180px] aspect-[9/16] mx-auto rounded-xl overflow-hidden border border-white/20 shadow-lg bg-black">
                        <video
                          key={editingReel.videoUrl}
                          src={normalizeVideoUrl(editingReel.videoUrl)}
                          poster={editingReel.posterUrl}
                          controls
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Poster / Cover Image (Device & URL) */}
                <div className="p-3 bg-[#FBF7F0] border border-stone-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block font-semibold text-stone-700 text-[11px]">
                      Cover / Poster Photo (Optional)
                    </label>
                    <span className="text-[9.5px] text-stone-500">Video se pehle dikhega</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={reelPosterFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleReelPosterFileSelect}
                      className="hidden"
                      id="admin-reel-poster-file"
                    />
                    <label
                      htmlFor="admin-reel-poster-file"
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                        isUploadingReelPoster
                          ? 'bg-stone-300 text-stone-500'
                          : 'bg-stone-800 hover:bg-stone-700 text-white'
                      }`}
                    >
                      {isUploadingReelPoster ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Uploading Cover...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3 h-3 text-amber-400" />
                          <span>📁 Cover Photo Daalein</span>
                        </>
                      )}
                    </label>
                  </div>

                  <input
                    type="text"
                    placeholder="Ya Cover Photo link / Google Drive image link paste karein..."
                    value={editingReel.posterUrl || ''}
                    onChange={(e) => setEditingReel({ ...editingReel, posterUrl: normalizeProductImageUrl(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-[11px] bg-white focus:outline-none focus:border-[#A87A2A]"
                  />

                  {editingReel.posterUrl && (
                    <div className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-stone-200">
                      <img
                        src={normalizeProductImageUrl(editingReel.posterUrl)}
                        alt="Poster Preview"
                        className="w-10 h-14 object-cover rounded border"
                      />
                      <span className="text-[10px] text-stone-600 font-medium truncate flex-1">
                        Cover Preview Ready
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingReel({ ...editingReel, posterUrl: '' })}
                        className="text-[10px] text-rose-600 hover:underline font-bold px-1"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* Linked Outfit Product */}
                <div className="p-3 bg-[#FBF7F0] border border-stone-200 rounded-2xl space-y-2.5">
                  <label className="block font-bold text-stone-800 text-[11px]">
                    Pin Outfit Product (Video ke niche buy button)
                  </label>
                  <div>
                    <label className="block text-[10px] text-stone-600 mb-0.5">
                      Select From Store Catalog
                    </label>
                    <select
                      value={editingReel.productId || ''}
                      onChange={(e) => {
                        const pid = parseInt(e.target.value, 10);
                        const found = productsList.find((p) => p.id === pid);
                        if (found) {
                          setEditingReel({
                            ...editingReel,
                            productId: found.id,
                            productTitle: found.name,
                            productPrice: found.price,
                            productImage: found.image,
                          });
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white"
                    >
                      <option value="">-- Choose Product From Catalog --</option>
                      {productsList.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (₹{p.price.toLocaleString('en-IN')})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-[10px] text-stone-600 mb-0.5">Product Title</label>
                      <input
                        type="text"
                        placeholder="Outfit Title"
                        value={editingReel.productTitle || ''}
                        onChange={(e) => setEditingReel({ ...editingReel, productTitle: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-stone-600 mb-0.5">Price (₹)</label>
                      <input
                        type="number"
                        placeholder="1999"
                        value={editingReel.productPrice || ''}
                        onChange={(e) => setEditingReel({ ...editingReel, productPrice: parseInt(e.target.value, 10) || 0 })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-stone-600 mb-0.5">Product Thumbnail Image URL</label>
                    <input
                      type="url"
                      placeholder="Outfit image URL"
                      value={editingReel.productImage || ''}
                      onChange={(e) => setEditingReel({ ...editingReel, productImage: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white font-mono text-[10px]"
                    />
                  </div>
                </div>

                {/* Badge & Order */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Badge Text</label>
                    <input
                      type="text"
                      placeholder="Trending 🔥"
                      value={editingReel.badge || ''}
                      onChange={(e) => setEditingReel({ ...editingReel, badge: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                    />
                    <div className="flex gap-1 flex-wrap mt-1">
                      {['Trending 🔥', 'New Arrival ✨', 'Best Seller 👑', 'Must Have 💖'].map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setEditingReel({ ...editingReel, badge: b })}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-stone-100 hover:bg-stone-200 border border-stone-200"
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Display Order</label>
                    <input
                      type="number"
                      value={editingReel.displayOrder ?? 1}
                      onChange={(e) => setEditingReel({ ...editingReel, displayOrder: parseInt(e.target.value, 10) || 1 })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono focus:outline-none focus:border-[#A87A2A]"
                    />
                    <label className="flex items-center gap-2 mt-2 cursor-pointer font-bold text-stone-700">
                      <input
                        type="checkbox"
                        checked={editingReel.isActive !== false}
                        onChange={(e) => setEditingReel({ ...editingReel, isActive: e.target.checked })}
                        className="rounded accent-[#A87A2A]"
                      />
                      <span>Show Live on Homepage</span>
                    </label>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowReelModal(false)}
                    className="px-4 py-2 rounded-xl border border-stone-300 text-stone-600 hover:bg-stone-50 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingReel}
                    className="px-5 py-2 rounded-xl bg-[#A87A2A] hover:bg-[#8e6520] text-white font-bold transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingReel ? 'Saving Reel...' : 'Save Video Reel'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
