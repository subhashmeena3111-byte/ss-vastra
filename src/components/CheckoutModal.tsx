import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Banknote,
  ShieldCheck,
  CheckCircle2,
  Truck,
  ArrowRight,
  AlertCircle,
  Copy,
  ExternalLink,
  QrCode,
  Landmark,
  Smartphone,
  Check,
} from 'lucide-react';
import { CartItem } from '../types.ts';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  couponDiscount: number;
  couponCode: string;
  onOrderSuccess: (orderData: {
    orderNumber: string;
    totalAmount: number;
    phone: string;
    trackingNumber?: string;
  }) => void;
  onClearCart: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  couponDiscount,
  couponCode,
  onOrderSuccess,
  onClearCart,
}) => {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    shippingAddress: '',
    city: 'Jaipur',
    state: 'Rajasthan',
    pincode: '303905',
    notes: '',
  });

  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'upi' | 'bank_transfer' | 'cod'>('razorpay');
  const [storeSettings, setStoreSettings] = useState<Record<string, string>>({});
  const [upiUtrNumber, setUpiUtrNumber] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/settings')
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.settings) {
            setStoreSettings(data.settings);
            if (data.settings.gateway_enabled === 'false') {
              if (data.settings.upi_enabled !== 'false') {
                setPaymentMethod('upi');
              } else if (data.settings.cod_enabled !== 'false') {
                setPaymentMethod('cod');
              } else if (data.settings.bank_transfer_enabled !== 'false') {
                setPaymentMethod('bank_transfer');
              }
            }
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  const copyToClipboard = (text: string, label: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedField(label);
      setTimeout(() => setCopiedField(null), 2500);
    } catch {
      // fallback
    }
  };

  // Success state inside modal
  const [placedOrder, setPlacedOrder] = useState<{
    orderNumber: string;
    totalAmount: number;
    paymentStatus: string;
    trackingNumber?: string;
    trackingUrl?: string;
    estimatedDelivery?: string;
  } | null>(null);

  if (!isOpen) return null;

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const totalAmount = Math.max(0, subtotal - couponDiscount);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName.trim() || !formData.customerPhone.trim() || !formData.shippingAddress.trim()) {
      setErrorMessage('Please fill in your name, phone number, and delivery address.');
      return;
    }

    if (formData.customerPhone.replace(/\D/g, '').length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        ...formData,
        notes: upiUtrNumber
          ? `${formData.notes ? formData.notes + ' | ' : ''}UTR / Ref: ${upiUtrNumber}`
          : formData.notes,
        items: items.map((i) => ({
          productId: i.product.id,
          size: i.size,
          quantity: i.quantity,
        })),
        couponCode: couponCode || null,
        paymentMethod,
      };

      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to place order');
      }

      const { order, shipment, razorpayOrder, razorpayKeyId } = data;

      // Save customer contact details for future session autofill & My Orders
      try {
        localStorage.setItem('ss_vastra_customer_name', formData.customerName);
        localStorage.setItem('ss_vastra_customer_phone', formData.customerPhone);
        if (formData.customerEmail) localStorage.setItem('ss_vastra_customer_email', formData.customerEmail);
        localStorage.setItem('ss_vastra_customer_address', `${formData.shippingAddress}, ${formData.city}, ${formData.state} ${formData.pincode}`);
      } catch {
        // ignore
      }

      // Handle Online Payment via Razorpay
      if (paymentMethod === 'razorpay') {
        // Check if Razorpay script is loaded or dynamically load it
        const loadRazorpayScript = (): Promise<boolean> => {
          return new Promise((resolve) => {
            if ((window as unknown as { Razorpay?: unknown }).Razorpay) {
              resolve(true);
              return;
            }
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
          });
        };

        const scriptLoaded = await loadRazorpayScript();

        // If Razorpay SDK is available and key is configured
        if (scriptLoaded && (window as unknown as { Razorpay: new (options: unknown) => { open: () => void } }).Razorpay && razorpayKeyId && !razorpayKeyId.includes('placeholder')) {
          const options = {
            key: razorpayKeyId,
            amount: razorpayOrder.amount,
            currency: 'INR',
            name: 'SS VASTRA',
            description: `Order ${order.orderNumber}`,
            image: '/icon.svg',
            order_id: razorpayOrder.id,
            handler: async function (response: {
              razorpay_payment_id: string;
              razorpay_order_id: string;
              razorpay_signature: string;
            }) {
              // Verify on backend
              await fetch('/api/payments/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderId: order.id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpaySignature: response.razorpay_signature,
                }),
              });

              onClearCart();
              setPlacedOrder({
                orderNumber: order.orderNumber,
                totalAmount: order.totalAmount,
                paymentStatus: 'paid',
                trackingNumber: shipment?.trackingNumber,
                trackingUrl: shipment?.trackingUrl,
                estimatedDelivery: shipment?.estimatedDelivery,
              });
              onOrderSuccess({
                orderNumber: order.orderNumber,
                totalAmount: order.totalAmount,
                phone: formData.customerPhone,
                trackingNumber: shipment?.trackingNumber,
              });
            },
            prefill: {
              name: formData.customerName,
              email: formData.customerEmail,
              contact: formData.customerPhone,
            },
            theme: {
              color: '#A87A2A',
            },
          };

          const rzp = new (window as unknown as { Razorpay: new (options: unknown) => { open: () => void } }).Razorpay(options);
          rzp.open();
        } else {
          // Development / Sandbox Simulated Razorpay Payment verification
          const simRes = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: order.id,
              razorpayOrderId: razorpayOrder?.id || `sim_ord_${Date.now()}`,
              razorpayPaymentId: `sim_pay_${Date.now()}`,
              razorpaySignature: 'sim_sig',
              isTestSimulation: true,
            }),
          });
          await simRes.json();

          onClearCart();
          setPlacedOrder({
            orderNumber: order.orderNumber,
            totalAmount: order.totalAmount,
            paymentStatus: 'paid (sandbox verified)',
            trackingNumber: shipment?.trackingNumber,
            trackingUrl: shipment?.trackingUrl,
            estimatedDelivery: shipment?.estimatedDelivery,
          });
          onOrderSuccess({
            orderNumber: order.orderNumber,
            totalAmount: order.totalAmount,
            phone: formData.customerPhone,
            trackingNumber: shipment?.trackingNumber,
          });
        }
      } else if (paymentMethod === 'upi') {
        // Direct UPI Payment
        onClearCart();
        setPlacedOrder({
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          paymentStatus: 'pending (UPI verification)',
          trackingNumber: shipment?.trackingNumber,
          trackingUrl: shipment?.trackingUrl,
          estimatedDelivery: shipment?.estimatedDelivery,
        });
        onOrderSuccess({
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          phone: formData.customerPhone,
          trackingNumber: shipment?.trackingNumber,
        });
      } else if (paymentMethod === 'bank_transfer') {
        // Direct Bank Transfer
        onClearCart();
        setPlacedOrder({
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          paymentStatus: 'pending (Bank Transfer verification)',
          trackingNumber: shipment?.trackingNumber,
          trackingUrl: shipment?.trackingUrl,
          estimatedDelivery: shipment?.estimatedDelivery,
        });
        onOrderSuccess({
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          phone: formData.customerPhone,
          trackingNumber: shipment?.trackingNumber,
        });
      } else {
        // Cash on Delivery
        onClearCart();
        setPlacedOrder({
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          paymentStatus: 'pending (COD)',
          trackingNumber: shipment?.trackingNumber,
          trackingUrl: shipment?.trackingUrl,
          estimatedDelivery: shipment?.estimatedDelivery,
        });
        onOrderSuccess({
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          phone: formData.customerPhone,
          trackingNumber: shipment?.trackingNumber,
        });
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(
        err instanceof Error ? err.message : 'An error occurred while placing order'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden my-6 border border-[#E9A9BB]/40 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6 bg-[#FBF7F0] border-b border-[#E9A9BB]/30 flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#A87A2A] block">
              SS VASTRA • Safe & Secure
            </span>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#2B2320]">
              {placedOrder ? 'Order Confirmed!' : 'Checkout & Delivery Details'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-500 hover:text-black rounded-full hover:bg-stone-200/50 transition-colors"
            aria-label="Close checkout"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {placedOrder ? (
            /* Order Success View */
            <div className="flex flex-col items-center text-center py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4 animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <span className="text-xs uppercase tracking-widest text-[#A87A2A] font-bold">
                Shukriya! Thank You
              </span>
              <h3 className="font-serif text-2xl font-bold text-[#2B2320] mt-1 mb-2">
                Order #{placedOrder.orderNumber}
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 max-w-md mb-6">
                Your ethnic wear order has been placed successfully. Our Sanganer team is preparing your package with utmost care.
              </p>

              {/* Order summary card */}
              <div className="w-full bg-[#FBF7F0] p-4 rounded-2xl border border-[#E9A9BB]/40 text-left space-y-2.5 mb-6 text-xs sm:text-sm">
                <div className="flex justify-between border-b border-stone-200/60 pb-2">
                  <span className="text-stone-500">Total Paid / Payable:</span>
                  <span className="font-bold text-[#A87A2A]">
                    ₹{placedOrder.totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between border-b border-stone-200/60 pb-2">
                  <span className="text-stone-500">Payment Status:</span>
                  <span className="font-semibold capitalize text-emerald-700">
                    {placedOrder.paymentStatus}
                  </span>
                </div>
                <div className="flex justify-between border-b border-stone-200/60 pb-2">
                  <span className="text-stone-500">Courier Partner:</span>
                  <span className="font-semibold text-stone-800">
                    Delhivery / BlueDart Express
                  </span>
                </div>
                {placedOrder.trackingNumber && (
                  <div className="flex justify-between items-center">
                    <span className="text-stone-500">AWB Tracking Number:</span>
                    <span className="font-mono font-bold text-[#2B2320] bg-white px-2 py-0.5 rounded border border-stone-200">
                      {placedOrder.trackingNumber}
                    </span>
                  </div>
                )}
                {placedOrder.estimatedDelivery && (
                  <div className="flex justify-between">
                    <span className="text-stone-500">Estimated Delivery:</span>
                    <span className="font-semibold text-stone-800">
                      {placedOrder.estimatedDelivery}
                    </span>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <a
                  href={`https://wa.me/919783770735?text=${encodeURIComponent(
                    placedOrder.paymentStatus.includes('UPI') || placedOrder.paymentStatus.includes('Bank Transfer')
                      ? `Namaste SS VASTRA! Mainne order place kiya hai:\nOrder No: ${placedOrder.orderNumber}\nAmount: ₹${placedOrder.totalAmount} (${placedOrder.paymentStatus})\nMain yahan payment screenshot attach kar raha hoon.`
                      : `Namaste SS VASTRA! Mainne abhi order place kiya hai:\nOrder No: ${placedOrder.orderNumber}\nAmount: ₹${placedOrder.totalAmount}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors"
                >
                  <span>
                    {placedOrder.paymentStatus.includes('UPI') || placedOrder.paymentStatus.includes('Bank Transfer')
                      ? 'Send Payment Screenshot on WhatsApp'
                      : 'Share on WhatsApp'}
                  </span>
                  <ExternalLink className="w-4 h-4" />
                </a>

                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#A87A2A] hover:bg-[#8e6520] text-white font-bold text-xs shadow-md transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          ) : (
            /* Checkout Form View */
            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Section 1: Customer Info */}
              <div>
                <h3 className="text-xs font-bold text-[#2B2320] uppercase tracking-wider mb-3">
                  1. Contact Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="customerName"
                      required
                      placeholder="e.g. Priya Sharma"
                      value={formData.customerName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Phone Number (WhatsApp preferred) *
                    </label>
                    <input
                      type="tel"
                      name="customerPhone"
                      required
                      placeholder="e.g. 9876543210"
                      value={formData.customerPhone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      name="customerEmail"
                      placeholder="e.g. priya@example.com"
                      value={formData.customerEmail}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Delivery Address */}
              <div>
                <h3 className="text-xs font-bold text-[#2B2320] uppercase tracking-wider mb-3">
                  2. Delivery Address
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      House / Flat / Street Address *
                    </label>
                    <textarea
                      name="shippingAddress"
                      required
                      rows={2}
                      placeholder="e.g. Flat 302, Royal Palms, Tonk Road"
                      value={formData.shippingAddress}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      name="state"
                      required
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Pincode *
                    </label>
                    <input
                      type="text"
                      name="pincode"
                      required
                      value={formData.pincode}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Payment Method Selection */}
              <div>
                <h3 className="text-xs font-bold text-[#2B2320] uppercase tracking-wider mb-3">
                  3. Select Payment Method
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Razorpay Gateway Option */}
                  {storeSettings['gateway_enabled'] !== 'false' && (
                    <label
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        paymentMethod === 'razorpay'
                          ? 'border-[#A87A2A] bg-[#F7E3E8]/40 ring-2 ring-[#A87A2A]/20'
                          : 'border-stone-200 hover:border-stone-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="razorpay"
                        checked={paymentMethod === 'razorpay'}
                        onChange={() => setPaymentMethod('razorpay')}
                        className="mt-0.5 text-[#A87A2A] focus:ring-[#A87A2A]"
                      />
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-xs text-[#2B2320]">
                          <CreditCard className="w-4 h-4 text-[#A87A2A]" />
                          <span>Online Payment Gateway</span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          Cards, NetBanking, Google Pay, PhonePe & Wallets.
                        </p>
                        <span className="inline-block text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded mt-1">
                          Instant Confirmation
                        </span>
                      </div>
                    </label>
                  )}

                  {/* Direct UPI & QR Option */}
                  {storeSettings['upi_enabled'] !== 'false' && (
                    <label
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        paymentMethod === 'upi'
                          ? 'border-[#A87A2A] bg-[#F7E3E8]/40 ring-2 ring-[#A87A2A]/20'
                          : 'border-stone-200 hover:border-stone-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="upi"
                        checked={paymentMethod === 'upi'}
                        onChange={() => setPaymentMethod('upi')}
                        className="mt-0.5 text-[#A87A2A] focus:ring-[#A87A2A]"
                      />
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-xs text-[#2B2320]">
                          <QrCode className="w-4 h-4 text-[#A87A2A]" />
                          <span>Direct UPI / QR Code Scan</span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          Scan QR with GPay, PhonePe, Paytm or transfer via UPI ID.
                        </p>
                        <span className="inline-block text-[10px] font-semibold text-[#A87A2A] bg-[#FBF7F0] border border-[#A87A2A]/30 px-1.5 py-0.2 rounded mt-1">
                          0% Transaction Fee
                        </span>
                      </div>
                    </label>
                  )}

                  {/* Direct Bank Transfer Option */}
                  {storeSettings['bank_transfer_enabled'] !== 'false' && (
                    <label
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        paymentMethod === 'bank_transfer'
                          ? 'border-[#A87A2A] bg-[#F7E3E8]/40 ring-2 ring-[#A87A2A]/20'
                          : 'border-stone-200 hover:border-stone-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="bank_transfer"
                        checked={paymentMethod === 'bank_transfer'}
                        onChange={() => setPaymentMethod('bank_transfer')}
                        className="mt-0.5 text-[#A87A2A] focus:ring-[#A87A2A]"
                      />
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-xs text-[#2B2320]">
                          <Landmark className="w-4 h-4 text-[#A87A2A]" />
                          <span>Direct Bank Transfer (NEFT / IMPS)</span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          Direct transfer to our official State Bank of India account.
                        </p>
                        <span className="inline-block text-[10px] font-semibold text-stone-700 bg-stone-100 px-1.5 py-0.2 rounded mt-1">
                          Best for Wholesale / Bulk
                        </span>
                      </div>
                    </label>
                  )}

                  {/* Cash on Delivery Option */}
                  {storeSettings['cod_enabled'] !== 'false' && (
                    <label
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        paymentMethod === 'cod'
                          ? 'border-[#A87A2A] bg-[#F7E3E8]/40 ring-2 ring-[#A87A2A]/20'
                          : 'border-stone-200 hover:border-stone-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={paymentMethod === 'cod'}
                        onChange={() => setPaymentMethod('cod')}
                        className="mt-0.5 text-[#A87A2A] focus:ring-[#A87A2A]"
                      />
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-xs text-[#2B2320]">
                          <Banknote className="w-4 h-4 text-[#A87A2A]" />
                          <span>Cash on Delivery (COD)</span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          Pay cash directly to courier agent upon doorstep delivery.
                        </p>
                      </div>
                    </label>
                  )}
                </div>

                {/* Sub-panel: UPI Details & QR Code */}
                {paymentMethod === 'upi' && (
                  <div className="mt-3 p-4 rounded-2xl bg-[#FBF7F0] border border-[#A87A2A]/30 animate-in fade-in space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                      <div className="flex items-center gap-2">
                        <QrCode className="w-4 h-4 text-[#A87A2A]" />
                        <span className="text-xs font-bold text-[#2B2320]">Scan & Pay ₹{totalAmount.toLocaleString('en-IN')} via UPI</span>
                      </div>
                      <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-stone-200 text-stone-600">
                        {storeSettings['upi_merchant_name'] || 'SS VASTRA JAIPUR'}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      {/* QR Code */}
                      <div className="p-2 bg-white rounded-xl border border-stone-200 shadow-xs flex flex-col items-center shrink-0">
                        <img
                          src={
                            storeSettings['upi_qr_image_url'] ||
                            `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                              `upi://pay?pa=${storeSettings['upi_id'] || 'subhashmeena3111@sbi'}&pn=${encodeURIComponent(
                                storeSettings['upi_merchant_name'] || 'SS Vastra'
                              )}&am=${totalAmount}&cu=INR`
                            )}`
                          }
                          alt="UPI QR Code"
                          className="w-32 h-32 object-contain"
                        />
                        <span className="text-[10px] text-stone-500 font-semibold mt-1">BHIM UPI QR</span>
                      </div>

                      {/* UPI ID & Info */}
                      <div className="flex-1 space-y-2.5 text-xs w-full">
                        <div>
                          <span className="text-[11px] text-stone-500 block mb-0.5">Official UPI ID:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-stone-900 bg-white px-3 py-1.5 rounded-lg border border-stone-200 text-xs flex-1">
                              {storeSettings['upi_id'] || 'subhashmeena3111@sbi'}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(storeSettings['upi_id'] || 'subhashmeena3111@sbi', 'upi')}
                              className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs flex items-center gap-1 shrink-0"
                            >
                              {copiedField === 'upi' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{copiedField === 'upi' ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Mobile deep link */}
                        <div>
                          <a
                            href={`upi://pay?pa=${storeSettings['upi_id'] || 'subhashmeena3111@sbi'}&pn=${encodeURIComponent(
                              storeSettings['upi_merchant_name'] || 'SS Vastra'
                            )}&am=${totalAmount}&cu=INR`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors"
                          >
                            <Smartphone className="w-3.5 h-3.5" />
                            <span>Open in GPay / PhonePe / Paytm</span>
                          </a>
                        </div>

                        {/* Optional UTR input */}
                        <div>
                          <label className="block text-[11px] text-stone-600 font-semibold mb-0.5">
                            UPI Reference Number / UTR (Optional, after paying):
                          </label>
                          <input
                            type="text"
                            value={upiUtrNumber}
                            onChange={(e) => setUpiUtrNumber(e.target.value)}
                            placeholder="e.g. 423985124018"
                            className="w-full px-2.5 py-1.5 bg-white text-xs rounded-lg border border-stone-300 font-mono focus:outline-none focus:border-[#A87A2A]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-panel: Bank Transfer Details */}
                {paymentMethod === 'bank_transfer' && (
                  <div className="mt-3 p-4 rounded-2xl bg-[#FBF7F0] border border-[#A87A2A]/30 animate-in fade-in space-y-3 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                      <div className="flex items-center gap-2">
                        <Landmark className="w-4 h-4 text-[#A87A2A]" />
                        <span className="font-bold text-[#2B2320]">Official Bank Account for IMPS / NEFT</span>
                      </div>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded">
                        Amount: ₹{totalAmount.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-stone-700">
                      <div className="p-2.5 bg-white rounded-xl border border-stone-200">
                        <span className="text-[10px] text-stone-500 uppercase tracking-wider block">Bank Name</span>
                        <span className="font-bold text-stone-900">{storeSettings['bank_name'] || 'State Bank of India'}</span>
                      </div>

                      <div className="p-2.5 bg-white rounded-xl border border-stone-200">
                        <span className="text-[10px] text-stone-500 uppercase tracking-wider block">Account Holder</span>
                        <span className="font-bold text-stone-900">{storeSettings['bank_account_holder'] || 'Subhash Meena (SS Vastra)'}</span>
                      </div>

                      <div className="p-2.5 bg-white rounded-xl border border-stone-200 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-stone-500 uppercase tracking-wider block">Account Number</span>
                          <span className="font-mono font-bold text-stone-900">{storeSettings['bank_account_number'] || '43644079836'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(storeSettings['bank_account_number'] || '43644079836', 'acc')}
                          className="px-2 py-1 bg-stone-100 hover:bg-stone-200 rounded text-[11px] font-semibold flex items-center gap-1"
                        >
                          {copiedField === 'acc' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedField === 'acc' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>

                      <div className="p-2.5 bg-white rounded-xl border border-stone-200 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-stone-500 uppercase tracking-wider block">IFSC Code</span>
                          <span className="font-mono font-bold text-stone-900">{storeSettings['bank_ifsc'] || 'SBIN0032415'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(storeSettings['bank_ifsc'] || 'SBIN0032415', 'ifsc')}
                          className="px-2 py-1 bg-stone-100 hover:bg-stone-200 rounded text-[11px] font-semibold flex items-center gap-1"
                        >
                          {copiedField === 'ifsc' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedField === 'ifsc' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="text-[11px] text-stone-500 bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-amber-800">
                      💡 <strong>Note:</strong> Transfer ₹{totalAmount.toLocaleString('en-IN')} using IMPS or NEFT. After placing the order, send payment proof to our WhatsApp with your Order ID for instant dispatch.
                    </div>
                  </div>
                )}
              </div>

              {/* Order Summary Snapshot */}
              <div className="p-4 rounded-2xl bg-[#FBF7F0] border border-[#E9A9BB]/40 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-stone-600">Items Subtotal:</span>
                  <span className="font-semibold">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Coupon Discount ({couponCode}):</span>
                    <span>-₹{couponDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-stone-600">Express Delivery:</span>
                  <span className="font-semibold text-emerald-700">FREE</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#2B2320] pt-2 border-t border-stone-200">
                  <span>Grand Total:</span>
                  <span className="text-[#A87A2A]">₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl bg-[#A87A2A] hover:bg-[#8e6520] text-white font-bold text-sm tracking-wide shadow-lg active:scale-98 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Processing Order...</span>
                ) : (
                  <>
                    <span>
                      {paymentMethod === 'razorpay'
                        ? `Pay ₹${totalAmount.toLocaleString('en-IN')} via Razorpay`
                        : paymentMethod === 'upi'
                        ? `Confirm UPI Order for ₹${totalAmount.toLocaleString('en-IN')}`
                        : paymentMethod === 'bank_transfer'
                        ? `Confirm Bank Transfer for ₹${totalAmount.toLocaleString('en-IN')}`
                        : `Place COD Order for ₹${totalAmount.toLocaleString('en-IN')}`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
