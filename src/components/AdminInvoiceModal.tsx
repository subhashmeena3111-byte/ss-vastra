import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Package,
  Truck,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  Edit3,
  Save,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  FileText,
} from 'lucide-react';
import { Order } from '../types.ts';

interface AdminInvoiceModalProps {
  order: Order | null;
  onClose: () => void;
  settings?: Record<string, string>;
  onOrderUpdated?: (updatedOrder: Order) => void;
}

export const AdminInvoiceModal: React.FC<AdminInvoiceModalProps> = ({
  order,
  onClose,
  settings,
  onOrderUpdated,
}) => {
  const [storeSettings, setStoreSettings] = useState<Record<string, string>>(settings || {});
  const [isCorrectionOpen, setIsCorrectionOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Editable Correction State
  const [customInvoiceNo, setCustomInvoiceNo] = useState('');
  const [customInvoiceDate, setCustomInvoiceDate] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [orderStatus, setOrderStatus] = useState('');
  const [hsnCode, setHsnCode] = useState('5208');
  const [gstRate, setGstRate] = useState<number>(5);
  const [shippingCharge, setShippingCharge] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [invoiceTerms, setInvoiceTerms] = useState('');
  const [signatory, setSignatory] = useState('');

  // Fetch settings if not passed
  useEffect(() => {
    if (!settings || Object.keys(settings).length === 0) {
      fetch('/api/settings')
        .then((r) => r.json())
        .then((d) => {
          if (d.success && d.settings) setStoreSettings(d.settings);
        })
        .catch(() => {});
    } else {
      setStoreSettings(settings);
    }
  }, [settings]);

  // Synchronize state when order changes
  useEffect(() => {
    if (order) {
      setCustomInvoiceNo(`SSV-INV-${order.orderNumber || order.id}`);
      setCustomInvoiceDate(
        order.createdAt
          ? new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : new Date().toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
      );
      setCustomerName(order.customerName || '');
      setCustomerPhone(order.customerPhone || '');
      setCustomerEmail(order.customerEmail || '');
      setShippingAddress(order.shippingAddress || '');
      setCity(order.city || 'Jaipur');
      setState(order.state || 'Rajasthan');
      setPincode(order.pincode || '303905');
      setCourierName((order as any).courierName || (order as any).courierPartner || 'Delhivery Express');
      setTrackingNumber(order.trackingNumber || `SSVTRK${order.id}9812`);
      setPaymentMethod(order.paymentMethod || 'razorpay');
      setPaymentStatus(order.paymentStatus || 'paid');
      setOrderStatus(order.orderStatus || 'Confirmed');
      setDiscountAmount(order.discountAmount || 0);
      setTotalAmount(order.totalAmount || 0);
      setShippingCharge(0);
      setGstRate(5);
      setHsnCode('5208');
      setInvoiceTerms(
        storeSettings.invoice_terms ||
          '1. All handmade garments have slight natural printing variations.\n2. 7-Day easy exchange from delivery date with intact tags.'
      );
      setSignatory(storeSettings.invoice_signatory || 'Subhash Meena (Founder & Proprietor)');
    }
  }, [order, storeSettings]);

  if (!order) return null;

  // Dynamic GST & calculations
  const rawSubtotal = order.items && order.items.length > 0
    ? order.items.reduce(
        (sum, item) => sum + (item.totalPrice || item.unitPrice * item.quantity),
        0
      )
    : totalAmount;

  const currentGrandTotal = Math.max(0, totalAmount + shippingCharge);
  const gstInclusiveAmount = Math.round((currentGrandTotal * gstRate) / (100 + gstRate));
  const taxableAmount = currentGrandTotal - gstInclusiveAmount;
  const halfGst = (gstInclusiveAmount / 2).toFixed(2);

  const storeName = storeSettings.invoice_store_name || storeSettings.store_name || 'SS VASTRA';
  const tagline = storeSettings.invoice_tagline || storeSettings.tagline || 'Elegance in Every Thread • Jaipur Handcraft';
  const address = storeSettings.invoice_address || storeSettings.address || 'Green Vihar Vatika, Sanganer, Jaipur, Rajasthan 303905';
  const phone = storeSettings.invoice_phone || storeSettings.phone || '+91 9783770735';
  const email = storeSettings.invoice_email || storeSettings.email || 'subhashmeena3111@gmail.com';
  const gstin = storeSettings.invoice_gstin || '08AALCS9821M1Z4';
  const msme = storeSettings.invoice_msme || 'UDYAM-RJ-17-0098234';
  const logoUrl = storeSettings.invoice_logo_url;

  const handlePrint = () => {
    window.print();
  };

  const handleResetToOriginal = () => {
    if (!order) return;
    setCustomInvoiceNo(`SSV-INV-${order.orderNumber || order.id}`);
    setCustomerName(order.customerName || '');
    setCustomerPhone(order.customerPhone || '');
    setCustomerEmail(order.customerEmail || '');
    setShippingAddress(order.shippingAddress || '');
    setCity(order.city || 'Jaipur');
    setState(order.state || 'Rajasthan');
    setPincode(order.pincode || '303905');
    setCourierName((order as any).courierName || (order as any).courierPartner || 'Delhivery Express');
    setTrackingNumber(order.trackingNumber || '');
    setPaymentStatus(order.paymentStatus || 'paid');
    setTotalAmount(order.totalAmount || 0);
    setDiscountAmount(order.discountAmount || 0);
    setShippingCharge(0);
    setGstRate(5);
    setSaveStatus('Values reset to original order data.');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleSaveCorrections = async () => {
    if (!order) return;
    setIsSaving(true);
    try {
      const token = localStorage.getItem('ss_vastra_admin_token') || '';
      const payload = {
        customerName,
        customerPhone,
        customerEmail,
        shippingAddress,
        city,
        state,
        pincode,
        totalAmount,
        discountAmount,
        paymentMethod,
        paymentStatus,
        orderStatus,
        courierPartner: courierName,
        trackingNumber,
      };

      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSaveStatus('✓ Invoice corrections saved and synced to database!');
        setTimeout(() => setSaveStatus(null), 3500);
        if (onOrderUpdated && data.order) {
          onOrderUpdated(data.order);
        }
      } else {
        setSaveStatus('Error saving: ' + (data.error || 'Server error'));
        setTimeout(() => setSaveStatus(null), 4000);
      }
    } catch (err: any) {
      setSaveStatus('Save error: ' + (err?.message || 'Network error'));
      setTimeout(() => setSaveStatus(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200 print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-stone-200 my-6 flex flex-col print:border-none print:shadow-none print:rounded-none print:m-0">
        
        {/* Header Actions (Hidden during printing) */}
        <div className="px-6 py-4 bg-stone-50 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-[#2B2320]">Tax Invoice & Official Receipt</span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-[#F7E3E8] text-[#A87A2A] font-semibold border border-[#E9A9BB]/60">
              #{order.orderNumber || order.id}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Correction Toggle Button */}
            <button
              type="button"
              onClick={() => setIsCorrectionOpen(!isCorrectionOpen)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                isCorrectionOpen
                  ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-xs'
                  : 'bg-white border-stone-300 hover:bg-stone-100 text-stone-700'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5 text-[#A87A2A]" />
              <span>{isCorrectionOpen ? 'Close Correction' : '✏️ Invoice Correction (संशोधन)'}</span>
              {isCorrectionOpen ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Print / Save PDF Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#A87A2A] hover:bg-[#8e6520] text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-stone-200 text-stone-600 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Correction Drawer / Panel (Hidden during printing) */}
        {isCorrectionOpen && (
          <div className="bg-amber-50/70 border-b border-amber-200 p-5 space-y-4 print:hidden text-xs text-stone-700 animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-amber-700" />
                <h4 className="font-bold text-amber-900 text-sm">
                  Invoice & Receipt Correction Studio (बिल संशोधन पैनल)
                </h4>
              </div>
              <span className="text-[11px] text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full border border-amber-300">
                Any changes here will update the invoice preview in real-time
              </span>
            </div>

            {saveStatus && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl font-semibold text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{saveStatus}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Col 1: Invoice Metadata */}
              <div className="bg-white p-3.5 rounded-xl border border-amber-200 space-y-2.5 shadow-2xs">
                <h5 className="font-bold text-stone-800 border-b border-stone-100 pb-1">
                  1. Bill & Metadata
                </h5>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-0.5">Custom Invoice No.</label>
                  <input
                    type="text"
                    value={customInvoiceNo}
                    onChange={(e) => setCustomInvoiceNo(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 font-mono text-xs focus:border-[#A87A2A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-0.5">Invoice Date</label>
                  <input
                    type="text"
                    value={customInvoiceDate}
                    onChange={(e) => setCustomInvoiceDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs focus:border-[#A87A2A] focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-0.5">Payment Mode</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-stone-300 text-xs focus:border-[#A87A2A] focus:outline-none"
                    >
                      <option value="cod">Cash on Delivery</option>
                      <option value="razorpay">Razorpay Online</option>
                      <option value="upi">Direct UPI</option>
                      <option value="bank_transfer">Bank Transfer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-0.5">Payment Status</label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-stone-300 text-xs focus:border-[#A87A2A] focus:outline-none"
                    >
                      <option value="paid">Paid & Verified</option>
                      <option value="pending">Pending</option>
                      <option value="refunded">Refunded</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Col 2: Customer & Shipping Address */}
              <div className="bg-white p-3.5 rounded-xl border border-amber-200 space-y-2.5 shadow-2xs">
                <h5 className="font-bold text-stone-800 border-b border-stone-100 pb-1">
                  2. Customer & Address
                </h5>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-0.5">Customer Name</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs focus:border-[#A87A2A] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-0.5">Phone Number</label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs focus:border-[#A87A2A] focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-0.5">Street Address</label>
                  <input
                    type="text"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs focus:border-[#A87A2A] focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-stone-600 mb-0.5">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-2 py-1 rounded-lg border border-stone-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-stone-600 mb-0.5">State</label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full px-2 py-1 rounded-lg border border-stone-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-stone-600 mb-0.5">Pincode</label>
                    <input
                      type="text"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="w-full px-2 py-1 rounded-lg border border-stone-300 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Col 3: Courier, GST Rate & Amounts */}
              <div className="bg-white p-3.5 rounded-xl border border-amber-200 space-y-2.5 shadow-2xs">
                <h5 className="font-bold text-stone-800 border-b border-stone-100 pb-1">
                  3. Courier & Tax Calculations
                </h5>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-0.5">Courier Name</label>
                    <input
                      type="text"
                      value={courierName}
                      onChange={(e) => setCourierName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-0.5">AWB Tracking #</label>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 font-mono text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-0.5">GST Rate (%)</label>
                    <select
                      value={gstRate}
                      onChange={(e) => setGstRate(Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded-lg border border-stone-300 text-xs focus:border-[#A87A2A]"
                    >
                      <option value={0}>0% (Tax Exempt)</option>
                      <option value={5}>5% (Apparel Standard)</option>
                      <option value={12}>12% (Luxury Handcraft)</option>
                      <option value={18}>18% (Standard Goods)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-0.5">HSN Code</label>
                    <input
                      type="text"
                      value={hsnCode}
                      onChange={(e) => setHsnCode(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-stone-300 font-mono text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-0.5">Total Amount (₹)</label>
                    <input
                      type="number"
                      value={totalAmount}
                      onChange={(e) => setTotalAmount(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 font-bold text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-0.5">Shipping Fee (₹)</label>
                    <input
                      type="number"
                      value={shippingCharge}
                      onChange={(e) => setShippingCharge(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions for Correction */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-amber-200">
              <button
                type="button"
                onClick={handleResetToOriginal}
                className="px-3 py-1.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
                <span>Reset to Original Values</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveCorrections}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : '💾 Save Corrections to Order'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Printable Tax Invoice Paper Sheet */}
        <div id="printable-invoice" className="p-8 space-y-6 text-[#2B2320] text-xs">
          
          {/* Top Brand & Legal Metadata */}
          <div className="flex justify-between items-start border-b border-stone-200 pb-6">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={storeName}
                    className="h-10 max-w-[140px] object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#F7E3E8] border border-[#A87A2A] flex items-center justify-center font-serif font-bold text-[#A87A2A] text-sm shadow-xs">
                    SS
                  </div>
                )}
                <div>
                  <h1 className="font-serif text-2xl font-bold tracking-wider text-[#2B2320]">
                    {storeName}
                  </h1>
                </div>
              </div>
              <p className="text-[11px] text-[#A87A2A] font-semibold uppercase tracking-wider">
                {tagline}
              </p>
              <div className="mt-2 text-stone-600 space-y-0.5 text-[11px]">
                <p>{address}</p>
                <p>Phone: {phone} | Email: {email}</p>
                <p className="font-semibold text-stone-700">
                  <span>GSTIN: {gstin} (Jaipur, RJ)</span>
                  {msme && <span className="ml-3">MSME / Udyam: {msme}</span>}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-[#F7E3E8] text-[#A87A2A] font-bold rounded-lg text-xs tracking-wider uppercase mb-2">
                Tax Invoice / Tax Receipt
              </span>
              <table className="text-right text-xs mt-1 ml-auto">
                <tbody>
                  <tr>
                    <td className="text-stone-500 pr-2 font-medium">Invoice No:</td>
                    <td className="font-mono font-bold">{customInvoiceNo}</td>
                  </tr>
                  <tr>
                    <td className="text-stone-500 pr-2 font-medium">Order Date:</td>
                    <td className="font-semibold">{customInvoiceDate}</td>
                  </tr>
                  <tr>
                    <td className="text-stone-500 pr-2 font-medium">Payment Mode:</td>
                    <td className="font-bold text-[#A87A2A] uppercase">
                      {paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Prepaid (Razorpay / UPI)'}
                    </td>
                  </tr>
                  <tr>
                    <td className="text-stone-500 pr-2 font-medium">Status:</td>
                    <td className="font-semibold text-emerald-700 capitalize">
                      {paymentStatus === 'paid' ? 'Paid & Verified' : paymentStatus}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Customer Billed & Shipped To */}
          <div className="grid grid-cols-2 gap-6 bg-[#FBF7F0] p-4 rounded-2xl border border-[#E9A9BB]/40">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
                Billed & Shipped To:
              </span>
              <h3 className="font-bold text-sm text-[#2B2320]">{customerName || 'Valued Customer'}</h3>
              <p className="text-stone-600 mt-1 leading-relaxed">
                {shippingAddress || 'Store Address'}
                <br />
                {city}, {state} - {pincode}
              </p>
              <p className="mt-1 font-mono font-semibold text-stone-700">
                Phone: +91 {customerPhone}
              </p>
              {customerEmail && (
                <p className="text-stone-500">{customerEmail}</p>
              )}
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
                Courier & Dispatch Details:
              </span>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#A87A2A]" />
                  <span className="font-semibold text-stone-800">
                    {courierName || 'Delhivery Express Priority'}
                  </span>
                </div>
                <div>
                  <span className="text-stone-500">AWB Tracking: </span>
                  <span className="font-mono font-bold text-[#A87A2A]">
                    {trackingNumber}
                  </span>
                </div>
                
                {/* Visual Barcode */}
                <div className="mt-2 p-2 bg-white rounded-lg border border-stone-200 inline-block">
                  <div className="h-6 w-44 flex justify-between items-center gap-0.5">
                    {[2, 4, 1, 3, 2, 5, 1, 4, 2, 3, 5, 2, 1, 4, 3, 2, 4, 1, 5, 2, 3, 1].map((w, idx) => (
                      <div
                        key={idx}
                        className="bg-black h-full"
                        style={{ width: `${w * 1.4}px` }}
                      />
                    ))}
                  </div>
                  <div className="text-[9px] font-mono text-center tracking-widest text-stone-600 mt-0.5">
                    *{trackingNumber}*
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-stone-200 rounded-xl overflow-hidden">
              <thead className="bg-[#FBF7F0] border-b border-stone-200 text-stone-700 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Outfit / Item Description</th>
                  <th className="p-3 text-center">HSN/SAC</th>
                  <th className="p-3 text-center">Size</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 text-right">Unit Price</th>
                  <th className="p-3 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {order.items && order.items.length > 0 ? (
                  order.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-3 text-stone-400">{idx + 1}</td>
                      <td className="p-3 font-semibold text-stone-900">
                        {it.productName}
                      </td>
                      <td className="p-3 text-center font-mono text-stone-600">{hsnCode}</td>
                      <td className="p-3 text-center font-medium text-stone-700">{it.size || 'Free Size'}</td>
                      <td className="p-3 text-center font-bold">{it.quantity}</td>
                      <td className="p-3 text-right text-stone-700 font-mono">
                        ₹{it.unitPrice?.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 text-right font-bold text-stone-900 font-mono">
                        ₹{(it.totalPrice || it.unitPrice * it.quantity).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="p-3 text-stone-400">1</td>
                    <td className="p-3 font-semibold text-stone-900">
                      Jaipuri Handcrafted Royal Outfit Set
                    </td>
                    <td className="p-3 text-center font-mono text-stone-600">{hsnCode}</td>
                    <td className="p-3 text-center font-medium text-stone-700">Standard</td>
                    <td className="p-3 text-center font-bold">1</td>
                    <td className="p-3 text-right text-stone-700 font-mono">
                      ₹{totalAmount?.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 text-right font-bold text-stone-900 font-mono">
                      ₹{totalAmount?.toLocaleString('en-IN')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Subtotals & Taxes Breakdown */}
          <div className="flex justify-between items-start pt-2 border-t border-stone-200">
            <div className="max-w-xs space-y-1">
              <span className="font-semibold text-stone-700 block text-[11px]">
                GST Breakdown ({gstRate}%):
              </span>
              <div className="text-[10px] text-stone-500 space-y-0.5 bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                <p>Taxable Value: <span className="font-mono font-semibold text-stone-700">₹{taxableAmount.toLocaleString('en-IN')}</span></p>
                {gstRate > 0 ? (
                  <>
                    <p>CGST ({gstRate / 2}%): ₹{halfGst} | SGST ({gstRate / 2}%): ₹{halfGst}</p>
                    <p className="font-bold text-stone-700">Total GST Inclusive: ₹{gstInclusiveAmount.toLocaleString('en-IN')}</p>
                  </>
                ) : (
                  <p className="text-stone-500 italic">Tax exempt / 0% GST rate applied.</p>
                )}
              </div>
            </div>

            <div className="w-72 bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs space-y-1.5">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal:</span>
                <span className="font-mono">₹{rawSubtotal.toLocaleString('en-IN')}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Discount Applied:</span>
                  <span className="font-mono">-₹{discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-stone-600">
                <span>Shipping & Delivery:</span>
                <span className="font-semibold text-emerald-700">
                  {shippingCharge > 0 ? `₹${shippingCharge}` : 'FREE (Above ₹1,999)'}
                </span>
              </div>
              <div className="pt-2 border-t border-stone-300 flex justify-between font-bold text-sm text-[#2B2320]">
                <span>Total Invoice Value:</span>
                <span className="text-[#A87A2A] font-mono font-extrabold text-base">
                  ₹{currentGrandTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Terms & Signatory */}
          <div className="border-t border-stone-200 pt-4 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-xs text-[10px] text-stone-500 leading-relaxed">
              <span className="font-semibold text-stone-700 block mb-0.5">Return & Exchange Terms:</span>
              <p className="whitespace-pre-line">
                {invoiceTerms}
              </p>
            </div>
            <div className="text-center">
              <div className="w-36 h-12 border border-dashed border-[#A87A2A]/40 rounded-lg flex items-center justify-center mb-1 bg-[#FBF7F0]/60">
                <span className="font-serif italic text-xs text-[#A87A2A] font-bold">SS Vastra Verified</span>
              </div>
              <span className="text-[10px] font-bold text-stone-700 block">
                {signatory}
              </span>
              <span className="text-[9px] text-stone-400 block">Authorized Signatory</span>
            </div>
          </div>

          {/* Bottom Note */}
          <div className="pt-4 border-t border-stone-200 text-center text-stone-500 text-[10px]">
            <p className="font-serif italic text-[#A87A2A] text-xs">
              Dhanyawaad for shopping with SS VASTRA Jaipur!
            </p>
            <p className="mt-0.5">This is a computer-generated tax invoice and requires no physical signature.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
