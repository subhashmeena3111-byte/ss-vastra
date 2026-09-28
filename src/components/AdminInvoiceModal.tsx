import React from 'react';
import { X, Printer, Package, Truck, ShieldCheck, MapPin, Phone, Mail } from 'lucide-react';
import { Order } from '../types.ts';

interface AdminInvoiceModalProps {
  order: Order | null;
  onClose: () => void;
}

export const AdminInvoiceModal: React.FC<AdminInvoiceModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const invoiceNumber = `SSV-INV-${order.orderNumber || order.id}`;
  const invoiceDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN');

  const subtotal = order.items
    ? order.items.reduce(
        (sum, item) => sum + (item.totalPrice || item.unitPrice * item.quantity),
        0
      )
    : order.totalAmount;

  const discount = order.discountAmount || 0;
  const gstEstimated = Math.round((order.totalAmount * 5) / 105); // 5% GST inclusive for garments
  const taxableAmount = order.totalAmount - gstEstimated;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200 print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-stone-200 my-6 flex flex-col print:border-none print:shadow-none print:rounded-none print:m-0">
        
        {/* Header Actions (Hidden when printing) */}
        <div className="px-6 py-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-[#2B2320]">Tax Invoice & Shipping Label</span>
            <span className="text-xs text-stone-500">#{order.orderNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#A87A2A] hover:bg-[#8e6520] text-white font-bold text-xs transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-stone-200 text-stone-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div id="printable-invoice" className="p-8 space-y-6 text-[#2B2320] text-xs">
          
          {/* Top Brand & Invoice Metadata */}
          <div className="flex justify-between items-start border-b border-stone-200 pb-6">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-8 h-8 rounded-full bg-[#F7E3E8] border border-[#A87A2A] flex items-center justify-center font-serif font-bold text-[#A87A2A] text-sm">
                  SS
                </div>
                <h1 className="font-serif text-2xl font-bold tracking-wider text-[#2B2320]">
                  SS VASTRA
                </h1>
              </div>
              <p className="text-[11px] text-[#A87A2A] font-semibold uppercase tracking-wider">
                Elegance in Every Thread • Jaipur Handcraft
              </p>
              <div className="mt-2 text-stone-600 space-y-0.5 text-[11px]">
                <p>Green Vihar Vatika, Sanganer, Jaipur, Rajasthan 303905</p>
                <p>Phone: +91 9783770735 | Email: subhashmeena3111@gmail.com</p>
                <p>GSTIN: 08AALCS9821M1Z4 (Jaipur, RJ)</p>
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
                    <td className="font-mono font-bold">{invoiceNumber}</td>
                  </tr>
                  <tr>
                    <td className="text-stone-500 pr-2 font-medium">Order Date:</td>
                    <td className="font-semibold">{invoiceDate}</td>
                  </tr>
                  <tr>
                    <td className="text-stone-500 pr-2 font-medium">Payment Mode:</td>
                    <td className="font-bold text-[#A87A2A] uppercase">
                      {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Prepaid (Razorpay)'}
                    </td>
                  </tr>
                  <tr>
                    <td className="text-stone-500 pr-2 font-medium">Status:</td>
                    <td className="font-semibold text-emerald-700 capitalize">
                      {order.paymentStatus || 'Paid'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Billing & Shipping Address */}
          <div className="grid grid-cols-2 gap-6 bg-[#FBF7F0] p-4 rounded-2xl border border-[#E9A9BB]/40">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
                Customer & Delivery Address
              </span>
              <h3 className="font-bold text-sm text-[#2B2320]">{order.customerName}</h3>
              <p className="text-stone-600 mt-1 leading-relaxed">
                {order.shippingAddress}
                <br />
                {order.city || 'Jaipur'}, {order.state || 'Rajasthan'} - {order.pincode || '303905'}
              </p>
              <p className="mt-1 font-mono font-semibold text-stone-700">
                Phone: +91 {order.customerPhone}
              </p>
              {order.customerEmail && (
                <p className="text-stone-500">{order.customerEmail}</p>
              )}
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
                Courier & Dispatch Details
              </span>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#A87A2A]" />
                  <span className="font-semibold text-stone-800">
                    {order.courierName || 'Delhivery Express / BlueDart'}
                  </span>
                </div>
                <div>
                  <span className="text-stone-500">AWB Tracking: </span>
                  <span className="font-mono font-bold text-[#A87A2A]">
                    {order.trackingNumber || `SSVTRK${order.id}9812`}
                  </span>
                </div>
                {/* Barcode Mock Visual */}
                <div className="mt-2 p-2 bg-white rounded-lg border border-stone-200 inline-block">
                  <div className="h-6 w-40 flex justify-between items-center gap-0.5">
                    {[2, 4, 1, 3, 2, 5, 1, 4, 2, 3, 5, 2, 1, 4, 3, 2, 4, 1, 5, 2].map((w, idx) => (
                      <div
                        key={idx}
                        className="bg-black h-full"
                        style={{ width: `${w * 1.5}px` }}
                      />
                    ))}
                  </div>
                  <div className="text-[9px] font-mono text-center tracking-widest text-stone-600 mt-0.5">
                    *{order.trackingNumber || `SSVTRK${order.id}9812`}*
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-stone-200 rounded-xl overflow-hidden">
              <thead className="bg-[#FBF7F0] border-b border-stone-200 text-stone-700 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Outfit Description</th>
                  <th className="p-3">Size</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 text-right">Unit Price</th>
                  <th className="p-3 text-right">Total</th>
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
                      <td className="p-3 font-medium text-stone-700">{it.size || 'Free Size'}</td>
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
                      Jaipuri Handcrafted Ladies Outfit Set
                    </td>
                    <td className="p-3 font-medium text-stone-700">Standard</td>
                    <td className="p-3 text-center font-bold">1</td>
                    <td className="p-3 text-right text-stone-700 font-mono">
                      ₹{order.totalAmount?.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 text-right font-bold text-stone-900 font-mono">
                      ₹{order.totalAmount?.toLocaleString('en-IN')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Summary Calculation */}
          <div className="flex justify-between items-start pt-2">
            <div className="max-w-xs text-stone-500 text-[11px] leading-relaxed">
              <p className="font-semibold text-stone-700 mb-1">Return / Exchange Terms:</p>
              <p>
                Products can be exchanged within 7 days of delivery in pristine, unworn condition with tags attached.
                For assistance, WhatsApp <strong>9783770735</strong>.
              </p>
            </div>

            <div className="w-64 bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs space-y-1.5">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal:</span>
                <span className="font-mono">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Coupon Discount:</span>
                  <span className="font-mono">-₹{discount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-stone-600">
                <span>Shipping Charges:</span>
                <span className="font-semibold text-emerald-700">FREE</span>
              </div>
              <div className="flex justify-between text-stone-500 text-[10px]">
                <span>Taxable Value (approx):</span>
                <span className="font-mono">₹{taxableAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-stone-500 text-[10px]">
                <span>GST (5% included):</span>
                <span className="font-mono">₹{gstEstimated.toLocaleString('en-IN')}</span>
              </div>
              <div className="pt-2 border-t border-stone-300 flex justify-between font-bold text-sm text-[#2B2320]">
                <span>Grand Total:</span>
                <span className="text-[#A87A2A] font-mono">₹{order.totalAmount?.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="pt-6 border-t border-stone-200 text-center text-stone-500 text-[10px]">
            <p className="font-serif italic text-[#A87A2A] text-xs">
              Dhanyawaad for shopping with SS VASTRA Jaipur!
            </p>
            <p className="mt-1">This is a computer-generated tax invoice and requires no physical signature.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
