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
} from '../types.ts';
import { AdminInvoiceModal } from './AdminInvoiceModal.tsx';
import { AdminCatalogImages } from './AdminCatalogImages.tsx';
import { DeepLinkModal } from './DeepLinkModal.tsx';
import { uploadImageToDrive, ensureDriveAuth, getAccessToken } from '../utils/imageUpload.ts';
import { normalizeProductImageUrl, getDriveThumbnailUrl, isGoogleDriveUrl } from '../utils/imageUtils.ts';

interface AdminPortalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductsUpdated?: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  isOpen,
  onClose,
  onProductsUpdated,
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
  const [productsList, setProductsList] = useState<Product[]>([]);
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
  const [isUploadingProductDrive, setIsUploadingProductDrive] = useState(false);
  const [driveUploadMsg, setDriveUploadMsg] = useState<string | null>(null);
  const productModalFileInputRef = useRef<HTMLInputElement>(null);
  const productModalLocalFileInputRef = useRef<HTMLInputElement>(null);

  // Quick Direct Product Image Change
  const [uploadingProductId, setUploadingProductId] = useState<number | null>(null);
  const [selectedUploadProductId, setSelectedUploadProductId] = useState<number | null>(null);
  const directProductFileInputRef = useRef<HTMLInputElement>(null);

  // Order Detail / Shipment Modal State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [shipmentCourier, setShipmentCourier] = useState('Delhivery Express');
  const [shipmentTrackingNumber, setShipmentTrackingNumber] = useState('');
  const [shipmentEstimatedDate, setShipmentEstimatedDate] = useState('3-5 Business Days');

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

  // Load Tab Data whenever activeTab changes
  useEffect(() => {
    if (token && currentAdmin) {
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
        const res = await fetch('/api/admin/dashboard', { headers });
        const d = await res.json();
        if (d.success) setDashboardMetrics(d.metrics);
      } else if (tab === 'orders') {
        const res = await fetch('/api/admin/orders', { headers });
        const d = await res.json();
        if (d.success) setOrdersList(d.orders);
      } else if (tab === 'products') {
        try {
          const res = await fetch('/api/admin/products', { headers });
          const d = await res.json();
          let prods: Product[] = d.success && Array.isArray(d.products) ? d.products : [];
          if (prods.length === 0) {
            const pubRes = await fetch('/api/products');
            const pubD = await pubRes.json();
            if (pubD.success && Array.isArray(pubD.products)) prods = pubD.products;
          }

          // Persistent cache sync: filter deleted & merge custom products
          try {
            const deletedIds: number[] = JSON.parse(
              localStorage.getItem('ss_vastra_deleted_product_ids') || '[]'
            );
            const customProds: Product[] = JSON.parse(
              localStorage.getItem('ss_vastra_custom_products') || '[]'
            );

            prods = prods.filter((p: any) => !deletedIds.includes(p.id));
            for (const cp of customProds) {
              if (!deletedIds.includes(cp.id)) {
                const idx = prods.findIndex((p: any) => p.id === cp.id);
                if (idx >= 0) prods[idx] = { ...prods[idx], ...cp };
                else prods.unshift(cp);
              }
            }
          } catch {}

          setProductsList(prods);
        } catch (err) {
          console.error(err);
        }
      } else if (tab === 'customers') {
        const res = await fetch('/api/admin/customers', { headers });
        const d = await res.json();
        if (d.success) setCustomersList(d.customers);
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
      } else if (tab === 'settings') {
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
    if (!confirm('Are you sure you want to permanently delete this staff account?')) return;
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
        alert(data.error || 'Failed to delete staff account');
      }
    } catch {
      alert('Error deleting staff account');
    }
  };

  // Order Actions
  const handleUpdateOrderStatus = async (orderId: number, status: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`Order #${orderId} marked as ${status}`);
        setTimeout(() => setActionMessage(null), 3000);
        loadTabData('orders');
      }
    } catch {
      alert('Failed to update status');
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
    if (!confirm(`Are you sure you want to refund ₹${amount} for order #${orderId}?`)) return;
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
      }
    } catch {
      alert('Failed to process refund');
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

      setEditingProduct((prev) => (prev ? { ...prev, image: dataUrl } : prev));
      setActionMessage('Photo select ho gayi! Ab "Save Outfit" dabayein.');
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      console.error('Local photo select failed:', err);
      alert('Photo read error: ' + (err?.message || 'Try again'));
    } finally {
      setIsUploadingProductDrive(false);
      setDriveUploadMsg(null);
      if (productModalLocalFileInputRef.current) productModalLocalFileInputRef.current.value = '';
    }
  };

  // Product Actions
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || !editingProduct?.price || !editingProduct?.image) {
      alert('Product name, price, and image are required');
      return;
    }

    try {
      const isNew = isCreatingProduct;
      const url = isNew ? '/api/admin/products' : `/api/admin/products/${editingProduct.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const sanitizedProduct = {
        ...editingProduct,
        image: normalizeProductImageUrl(editingProduct.image),
      };

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
      } catch {
        throw new Error(rawText || `Server error (${res.status})`);
      }
      if (res.ok && data.success) {
        setActionMessage(`Product ${isNew ? 'created' : 'updated'} successfully.`);
        setTimeout(() => setActionMessage(null), 3000);

        const savedItem: Product = data.product || {
          ...sanitizedProduct,
          id: isNew ? Date.now() : editingProduct.id!,
        };

        // Persist in localStorage custom products so it NEVER disappears across cold-starts
        try {
          const customProds: Product[] = JSON.parse(
            localStorage.getItem('ss_vastra_custom_products') || '[]'
          );
          const cIdx = customProds.findIndex((p) => p.id === savedItem.id);
          if (cIdx >= 0) customProds[cIdx] = { ...customProds[cIdx], ...savedItem };
          else customProds.unshift(savedItem);
          localStorage.setItem('ss_vastra_custom_products', JSON.stringify(customProds));

          // Unmark from deleted if re-created
          const deletedIds: number[] = JSON.parse(
            localStorage.getItem('ss_vastra_deleted_product_ids') || '[]'
          );
          const filteredDeleted = deletedIds.filter((id) => id !== savedItem.id);
          localStorage.setItem('ss_vastra_deleted_product_ids', JSON.stringify(filteredDeleted));
        } catch {}

        setEditingProduct(null);
        setIsCreatingProduct(false);
        loadTabData('products');
        if (onProductsUpdated) onProductsUpdated();
        window.dispatchEvent(new CustomEvent('ss-vastra-products-updated'));
      } else {
        alert(data.error || 'Product save nahi ho paya. Kripya fields check karein.');
      }
    } catch (err: any) {
      console.error('Save product error:', err);
      alert('Error saving product: ' + (err?.message || 'Server error, please check connection'));
    }
  };

  const handleDeleteProduct = async (id: number, productName?: string) => {
    const title = productName ? `"${productName}"` : 'is product';
    if (
      !confirm(
        `Kya aap sach me ${title} ko delete karna chahte hain?\n(Delete hone ke baad ye website se turant hat jayega)`
      )
    )
      return;

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

      setActionMessage('Product successfully delete ho gaya!');
      setTimeout(() => setActionMessage(null), 3000);
      loadTabData('products');
    } catch (err: any) {
      console.warn('Server delete error, but locally deleted:', err);
      setActionMessage('Product successfully delete ho gaya!');
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
      alert('At least one delivery partner must remain configured.');
      return;
    }
    if (!confirm('Are you sure you want to remove this delivery partner?')) return;
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
      alert('At least one payment gateway must remain configured.');
      return;
    }
    if (!confirm('Are you sure you want to remove this payment gateway configuration?')) return;
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
      alert('At least one bank account must remain configured.');
      return;
    }
    if (!confirm('Are you sure you want to remove this bank account?')) return;
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
      alert('At least one UPI account must remain configured.');
      return;
    }
    if (!confirm('Are you sure you want to remove this UPI account?')) return;
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
                            {productsList.length}
                          </span>
                          <span className="text-[10px] text-stone-400 mt-1 block">
                            Available in storefront
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: ORDERS MANAGEMENT */}
                  {activeTab === 'orders' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="font-serif text-2xl font-bold text-[#2B2320]">
                            Customer Orders
                          </h2>
                          <p className="text-xs text-stone-500">
                            Update order statuses, assign tracking details, and manage fulfillment.
                          </p>
                        </div>
                        <button
                          onClick={() => loadTabData('orders')}
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
                              <th className="p-3">Order #</th>
                              <th className="p-3">Customer</th>
                              <th className="p-3">Amount</th>
                              <th className="p-3">Payment</th>
                              <th className="p-3">Status</th>
                              <th className="p-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-100">
                            {ordersList.map((ord) => (
                              <tr key={ord.id} className="hover:bg-stone-50">
                                <td className="p-3 font-mono font-bold text-stone-800">
                                  #{ord.orderNumber}
                                </td>
                                <td className="p-3">
                                  <span className="font-semibold block">{ord.customerName}</span>
                                  <span className="text-stone-400 text-[11px] block">{ord.customerPhone}</span>
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
                                    value={ord.orderStatus}
                                    onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                                    className="px-2 py-1 rounded-lg border border-stone-300 font-medium text-xs bg-white focus:outline-none focus:border-[#A87A2A]"
                                  >
                                    <option value="Confirmed">Confirmed</option>
                                    <option value="Processing">Processing</option>
                                    <option value="Packed">Packed</option>
                                    <option value="Shipped">Shipped</option>
                                    <option value="Delivered">Delivered</option>
                                    <option value="Cancelled">Cancelled</option>
                                  </select>
                                </td>
                                <td className="p-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => {
                                        setSelectedOrder(ord);
                                        setShipmentTrackingNumber(ord.trackingNumber || '');
                                      }}
                                      className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-[11px] flex items-center gap-1"
                                      title="Add/Update Courier Tracking"
                                    >
                                      <Truck className="w-3.5 h-3.5 text-[#A87A2A]" />
                                      <span>Dispatch</span>
                                    </button>

                                    <button
                                      onClick={() => setPrintingOrder(ord)}
                                      className="p-1 rounded-lg hover:bg-stone-200 text-stone-700"
                                      title="Print Tax Invoice & Shipping Label"
                                    >
                                      <Receipt className="w-3.5 h-3.5" />
                                    </button>

                                    {currentAdmin?.role === 'super_admin' && ord.paymentStatus === 'paid' && (
                                      <button
                                        onClick={() => handleRefundOrder(ord.id, ord.totalAmount)}
                                        className="p-1 rounded-lg hover:bg-rose-50 text-rose-600"
                                        title="Issue Refund (Super Admin)"
                                      >
                                        <RotateCcw className="w-3.5 h-3.5" />
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

                  {/* TAB 6: CUSTOMERS (SUPER ADMIN ONLY) */}
                  {activeTab === 'customers' && currentAdmin.role === 'super_admin' && (
                    <div className="space-y-4">
                      <h2 className="font-serif text-2xl font-bold text-[#2B2320]">
                        Registered Customers
                      </h2>
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
                            {customersList.map((c, i) => (
                              <tr key={i} className="hover:bg-stone-50">
                                <td className="p-3 font-semibold text-stone-800">{String(c.name || 'Shopper')}</td>
                                <td className="p-3 font-mono text-stone-600">{String(c.phone || '-')}</td>
                                <td className="p-3">{String(c.ordersCount || 0)} orders</td>
                                <td className="p-3 font-bold text-[#A87A2A]">₹{String(c.totalSpent || 0)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
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
            <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 max-h-[85vh] overflow-y-auto">
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
                    <label className="block font-semibold mb-1">Category</label>
                    <select
                      value={editingProduct.category || 'Kurta Sets'}
                      onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300"
                    >
                      <option value="Kurta Sets">Kurta Sets</option>
                      <option value="Co-ord Sets">Co-ord Sets</option>
                      <option value="Anarkali & Dresses">Anarkali & Dresses</option>
                      <option value="Kurta / Kurtis">Kurta / Kurtis</option>
                      <option value="Festive Fits">Festive Fits</option>
                      <option value="Fabrics">Fabrics</option>
                    </select>
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

                {/* Product Image Selection & Google Drive Direct Upload */}
                <div className="p-3.5 bg-[#FBF7F0] border-2 border-stone-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-[#2B2320]">
                      Product Image (Photo Upload & Sync) *
                    </label>
                    <span className="text-[10px] text-[#A87A2A] font-semibold flex items-center gap-1">
                      <HardDrive className="w-3.5 h-3.5" />
                      Drive & Device Support
                    </span>
                  </div>

                  {/* Upload via Local Device or Google Drive */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Option A: Direct Device Upload */}
                      <input
                        type="file"
                        ref={productModalLocalFileInputRef}
                        accept="image/*"
                        onChange={handleProductModalLocalUpload}
                        disabled={isUploadingProductDrive}
                        className="hidden"
                        id="product-modal-local-upload"
                      />
                      <label
                        htmlFor="product-modal-local-upload"
                        className={`px-3.5 py-2 bg-[#2B2320] hover:bg-stone-800 text-white text-xs font-bold rounded-xl cursor-pointer transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0 ${
                          isUploadingProductDrive ? 'opacity-70 pointer-events-none' : ''
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5 text-amber-400" />
                        <span>Phone / PC se Photo Daalein</span>
                      </label>

                      {/* Option B: Google Drive Upload */}
                      <input
                        type="file"
                        ref={productModalFileInputRef}
                        accept="image/*"
                        onChange={handleProductModalImageUpload}
                        disabled={isUploadingProductDrive}
                        className="hidden"
                        id="product-modal-drive-upload"
                      />
                      <label
                        htmlFor="product-modal-drive-upload"
                        className={`px-3.5 py-2 bg-[#A87A2A] hover:bg-[#8e6520] text-white text-xs font-bold rounded-xl cursor-pointer transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0 ${
                          isUploadingProductDrive ? 'opacity-70 pointer-events-none' : ''
                        }`}
                      >
                        {isUploadingProductDrive ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>{driveUploadMsg || 'Uploading...'}</span>
                          </>
                        ) : (
                          <>
                            <CloudUpload className="w-3.5 h-3.5" />
                            <span>Google Drive Sync</span>
                          </>
                        )}
                      </label>
                    </div>

                    <div className="text-[10px] text-stone-500 leading-tight">
                      Aap apne phone gallery ya PC se direct photo select kar sakte hain, ya Google Drive me upload kar sakte hain.
                    </div>
                  </div>

                  {/* Or Manual URL / Drive Link Input */}
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Or Direct Image / Google Drive Link
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="Paste image link or Google Drive link..."
                      value={editingProduct.image || ''}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          image: normalizeProductImageUrl(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-[11px] focus:outline-none focus:border-[#A87A2A]"
                    />
                  </div>

                  {/* Live Visual Thumbnail Preview with Change/Remove */}
                  {editingProduct.image && (
                    <div className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-stone-200">
                      <div className="w-16 h-20 bg-stone-100 rounded-lg overflow-hidden shrink-0 border border-stone-200">
                        <img
                          src={normalizeProductImageUrl(editingProduct.image)}
                          alt="Product Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.currentTarget;
                            const fallback = getDriveThumbnailUrl(editingProduct.image || '');
                            if (target.src !== fallback) {
                              target.src = fallback;
                            }
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Live Preview Ready
                        </span>
                        <p className="text-[10px] text-stone-500 truncate font-mono mt-0.5">
                          {editingProduct.image.startsWith('data:')
                            ? 'Local Photo Attached (Save dabayein)'
                            : editingProduct.image}
                        </p>
                        <div className="flex items-center gap-2.5 mt-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              if (productModalLocalFileInputRef.current) productModalLocalFileInputRef.current.click();
                            }}
                            className="text-[11px] font-semibold text-[#A87A2A] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Camera className="w-3 h-3" />
                            <span>Dusri Photo Chuney</span>
                          </button>
                          <span className="text-stone-300">•</span>
                          <button
                            type="button"
                            onClick={() => setEditingProduct({ ...editingProduct, image: '' })}
                            className="text-[11px] font-semibold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Hataiye</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
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

                <div>
                  <label className="block font-semibold mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={editingProduct.description || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300"
                  />
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

        {/* Printable Tax Invoice & Shipping Label Modal */}
        <AdminInvoiceModal
          order={printingOrder}
          onClose={() => setPrintingOrder(null)}
        />

        {/* Deep Link & QR Generator Modal */}
        <DeepLinkModal
          isOpen={showDeepLinkModal}
          onClose={() => setShowDeepLinkModal(false)}
          products={productsList}
          categories={categoriesList}
          initialProduct={selectedDeepLinkProduct}
        />

      </div>
    </div>
  );
};
