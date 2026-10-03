import React from 'react';
import {
  X,
  Shield,
  FileText,
  RotateCcw,
  Truck,
  Heart,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle2,
  Lock,
  ArrowRight,
} from 'lucide-react';

export type ComplianceTab =
  | 'privacy-policy'
  | 'terms'
  | 'refund-exchange-policy'
  | 'shipping-policy'
  | 'about'
  | 'contact';

interface ComplianceModalProps {
  isOpen: boolean;
  tab: ComplianceTab;
  onClose: () => void;
  onSelectTab: (tab: ComplianceTab) => void;
  businessEmail?: string;
  storePhone?: string;
}

export const ComplianceModal: React.FC<ComplianceModalProps> = ({
  isOpen,
  tab,
  onClose,
  onSelectTab,
  businessEmail = 'contact@ssvastra.com',
  storePhone = '+91 97837 70735',
}) => {
  if (!isOpen) return null;

  const tabs: { id: ComplianceTab; label: string; icon: React.ReactNode }[] = [
    { id: 'privacy-policy', label: 'Privacy Policy', icon: <Shield className="w-4 h-4" /> },
    { id: 'terms', label: 'Terms of Service', icon: <FileText className="w-4 h-4" /> },
    {
      id: 'refund-exchange-policy',
      label: 'Refund & Exchange',
      icon: <RotateCcw className="w-4 h-4" />,
    },
    { id: 'shipping-policy', label: 'Shipping Policy', icon: <Truck className="w-4 h-4" /> },
    { id: 'about', label: 'About SS VASTRA', icon: <Heart className="w-4 h-4" /> },
    { id: 'contact', label: 'Contact & Boutique', icon: <Phone className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-[#E9A9BB]/40 my-6 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#FAF5EE] border-b border-[#E9A9BB]/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F7E3E8] border border-[#E9A9BB] flex items-center justify-center text-[#A87A2A]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#2B2320]">
                Customer Trust & Store Policies
              </h2>
              <p className="text-[11px] sm:text-xs text-[#A87A2A] font-semibold">
                SS VASTRA Jaipur • Sanganer Heritage Atelier
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-200/60 text-stone-600 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation pills */}
        <div className="px-6 py-3 bg-[#FBF7F0] border-b border-stone-200 flex items-center gap-2 overflow-x-auto scrollbar-none">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelectTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                tab === t.id
                  ? 'bg-[#A87A2A] text-white shadow-xs'
                  : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-stone-700 text-xs sm:text-sm leading-relaxed">
          {/* TAB 1: PRIVACY POLICY */}
          {tab === 'privacy-policy' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="border-b border-stone-200 pb-3">
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#2B2320]">
                  Privacy Policy (गोपनीयता नीति)
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Last updated: January 2026 • Compliant with Indian Information Technology Act, 2000
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-stone-900 text-sm">1. Introduction & Overview</h4>
                <p>
                  Welcome to <strong>SS VASTRA</strong> (accessible via our official boutique storefront).
                  We respect the privacy of our esteemed patrons and are deeply committed to protecting
                  the personal information you share with us while browsing our ethnic collections,
                  ordering custom-stitched suits, or contacting our Jaipur atelier.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-stone-900 text-sm">2. Information We Collect</h4>
                <ul className="list-disc pl-5 space-y-1 text-stone-600">
                  <li><strong>Contact Details:</strong> Full Name, Mobile Phone Number, WhatsApp Number, Shipping & Billing Address, and Email ID.</li>
                  <li><strong>Transaction Details:</strong> Payment mode chosen (Razorpay UPI, Credit/Debit Card, NetBanking, or Cash on Delivery), order total, and courier AWB consignment details.</li>
                  <li><strong>Technical Data:</strong> Browser type, device category, IP address, and cookie identifiers utilized solely to maintain shopping cart persistence and prevent fraudulent orders.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-stone-900 text-sm">3. Payment Security & Encryption</h4>
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                  <Lock className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <p className="text-xs text-emerald-900">
                    <strong>Zero Financial Storage:</strong> We do <em>not</em> store your credit card numbers, CVV, NetBanking passwords, or UPI PINs on any server. All electronic payments are processed directly through <strong>Razorpay</strong>, an RBI-authorized, PCI-DSS Level 1 certified payment aggregator with 256-bit bank-grade encryption.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-stone-900 text-sm">4. How We Use Your Information</h4>
                <p>We use your information exclusively to:</p>
                <ul className="list-disc pl-5 space-y-1 text-stone-600">
                  <li>Process, confirm, package, and dispatch your ethnic attire via trusted logistics partners (Delhivery, Blue Dart, Shiprocket).</li>
                  <li>Send automated SMS, WhatsApp, and email tracking notifications for your parcel.</li>
                  <li>Facilitate smooth doorstep size exchanges and customer care inquiries.</li>
                  <li>Prevent fraud, chargebacks, and unauthorized access to customer orders.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-stone-900 text-sm">5. Grievance Officer & Official Inquiries</h4>
                <p>
                  In accordance with the Information Technology Act 2000 and consumer protection guidelines:
                </p>
                <div className="p-3.5 rounded-xl bg-[#FAF5EE] border border-[#E9A9BB]/40 text-xs">
                  <p><strong>Grievance Officer:</strong> Subhash Meena (Founder & Proprietor)</p>
                  <p><strong>Enterprise:</strong> SS VASTRA Jaipur Handcrafted Ethnic Wear</p>
                  <p><strong>Address:</strong> Green Vihar Vatika, Sanganer, Jaipur, Rajasthan 303905</p>
                  <p><strong>Official Business Email:</strong> <a href={`mailto:${businessEmail}`} className="text-[#A87A2A] font-bold underline">{businessEmail}</a></p>
                  <p><strong>Helpline:</strong> {storePhone}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TERMS OF SERVICE */}
          {tab === 'terms' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="border-b border-stone-200 pb-3">
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#2B2320]">
                  Terms of Service & Conditions (नियम एवं शर्तें)
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Governing all retail purchases, digital orders, and COD transactions at SS VASTRA.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-stone-900 text-sm">1. Handcrafted Ethnic Authenticity</h4>
                <p>
                  Each SS VASTRA outfit is handcrafted by experienced Sanganeri artisans using traditional woodblock printing and bespoke tailoring techniques. Because each garment is dyed and stitched with care, subtle nuances in block impression, dye shade, or weave structure are natural hallmarks of genuine Jaipuri craftsmanship and are not considered defects.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-stone-900 text-sm">2. Order Acceptance & Pricing</h4>
                <p>
                  All catalog prices are listed in Indian National Rupees (INR) and are inclusive of all applicable GST taxes. We reserve the right to cancel or decline any order in the rare event of pricing typographic discrepancies, stock depletion, or failed payment authorizations. In such cases, full payment will be refunded promptly to the originating account.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-stone-900 text-sm">3. Order Cancellation Policy</h4>
                <p>
                  Customers may request cancellation of an order within <strong>12 to 24 hours</strong> of placement, provided the parcel has not already been dispatched from our Jaipur atelier. Once a logistics Airway Bill (AWB) has been generated and handed over to Delhivery or Blue Dart, cancellations cannot be processed; however, you may utilize our <strong>7-Day Doorstep Size Exchange</strong> upon receiving the parcel.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-stone-900 text-sm">4. Cash on Delivery (COD) Terms</h4>
                <p>
                  COD is offered as a convenience across serviceable pin codes in India. Customers choosing Cash on Delivery agree to provide an accurate address with valid landmark and be available to receive and pay the delivery executive in cash or via UPI at the time of delivery. Repeated non-acceptance of COD shipments may result in suspension of COD privileges.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-stone-900 text-sm">5. Governing Law & Jurisdiction</h4>
                <p>
                  Any dispute, claim, or controversy arising out of your purchase from SS VASTRA shall be subject to the exclusive jurisdiction of the competent courts in <strong>Jaipur, Rajasthan, India</strong>.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: REFUND & EXCHANGE POLICY */}
          {tab === 'refund-exchange-policy' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="border-b border-stone-200 pb-3">
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#2B2320]">
                  7-Day Doorstep Size Exchange & Refund Policy
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  We guarantee the perfect fit! Transparent, easy size replacements across India.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                <span className="font-bold flex items-center gap-1.5 text-xs sm:text-sm">
                  <CheckCircle2 className="w-4 h-4 text-amber-700" />
                  Hassle-Free 7 Days Window
                </span>
                <p className="text-xs">
                  If your kurta, co-ord set, or anarkali doesn't fit like a dream, simply request a size exchange within <strong>7 days</strong> of parcel delivery.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-stone-900 text-sm">1. How Our Size Exchange Works</h4>
                <ol className="list-decimal pl-5 space-y-1.5 text-stone-600">
                  <li><strong>Initiate Request:</strong> WhatsApp our dedicated support at <strong>{storePhone}</strong> or email <strong>{businessEmail}</strong> with your Order ID and the replacement size needed (e.g. S, M, L, XL, XXL).</li>
                  <li><strong>Reverse Pickup:</strong> We arrange a courier partner (Delhivery / Blue Dart) to pick up the original outfit directly from your doorstep.</li>
                  <li><strong>Dispatch of Replacement:</strong> Once the return parcel passes basic quality verification (unworn, unwashed, original tags attached), your replacement size is dispatched within 24 to 48 hours.</li>
                </ol>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-stone-900 text-sm">2. Refund Guidelines</h4>
                <p>
                  Because our garments are boutique handcrafted editions:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-stone-600">
                  <li><strong>Damaged / Incorrect Item:</strong> In the rare instance you receive a transit-damaged or incorrect garment, notify us within 48 hours with an unboxing photo. We will immediately issue either a brand-new replacement or a <strong>100% full refund</strong>.</li>
                  <li><strong>Out of Stock Replacements:</strong> If your desired exchange size is completely sold out, you may choose store credit or an instant full refund.</li>
                  <li><strong>Refund Settlement Timeline:</strong> Refunds for prepaid orders are credited back to your original payment method (Bank/UPI/Card) within <strong>3 to 5 business days</strong>. For COD orders, refund is remitted via instant UPI transfer.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-stone-900 text-sm">3. Non-Exchangeable Items</h4>
                <p className="text-stone-600">
                  Garments that have been washed, perfumed, altered by an outside tailor, or missing original tags cannot be accepted for exchange or refund.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: SHIPPING & DELIVERY POLICY */}
          {tab === 'shipping-policy' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="border-b border-stone-200 pb-3">
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#2B2320]">
                  Shipping & Delivery Policy (शिपिंग और डिलीवरी नियम)
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Speedy, insured dispatch from our Sanganer atelier directly to all 28,000+ Indian pincodes.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#FAF5EE] border border-[#E9A9BB]/40 text-center">
                  <Clock className="w-5 h-5 text-[#A87A2A] mx-auto mb-1.5" />
                  <span className="font-bold text-xs text-[#2B2320] block">24-48 Hours</span>
                  <span className="text-[11px] text-stone-500">Fast Atelier Dispatch</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#FAF5EE] border border-[#E9A9BB]/40 text-center">
                  <Truck className="w-5 h-5 text-[#A87A2A] mx-auto mb-1.5" />
                  <span className="font-bold text-xs text-[#2B2320] block">3 to 5 Days</span>
                  <span className="text-[11px] text-stone-500">Metro Delivery Transit</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#FAF5EE] border border-[#E9A9BB]/40 text-center">
                  <Shield className="w-5 h-5 text-[#A87A2A] mx-auto mb-1.5" />
                  <span className="font-bold text-xs text-[#2B2320] block">100% Insured</span>
                  <span className="text-[11px] text-stone-500">Tamper-Proof Packaging</span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-stone-900 text-sm">1. Delivery Timeline Across India</h4>
                <ul className="list-disc pl-5 space-y-1 text-stone-600">
                  <li><strong>Tier 1 / Metro Cities (Delhi NCR, Mumbai, Bengaluru, Jaipur, Kolkata, Chennai, Hyderabad):</strong> Delivered in <strong>2 to 4 business days</strong>.</li>
                  <li><strong>Tier 2 / Tier 3 Cities & Regional Towns:</strong> Delivered in <strong>3 to 5 business days</strong>.</li>
                  <li><strong>Remote / Northeast / Jammu & Kashmir Regions:</strong> Delivered in <strong>5 to 7 business days</strong> via India Post Speed Post or Delhivery Surface.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-stone-900 text-sm">2. Shipping Charges & Free Shipping</h4>
                <p>
                  Prepaid orders (Razorpay UPI, Cards, NetBanking) qualify for <strong>FREE EXPRESS SHIPPING</strong> nationwide! For orders below the free-shipping threshold or selected COD areas, a nominal logistics packaging fee of ₹49–₹99 may be displayed at checkout.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-stone-900 text-sm">3. Real-Time Tracking & Notifications</h4>
                <p>
                  As soon as your parcel is sealed and handed to the courier partner, an automated confirmation message containing your <strong>AWB Tracking Number</strong> and direct live courier tracking link will be transmitted to your registered WhatsApp and mobile phone.
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: ABOUT US */}
          {tab === 'about' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="border-b border-stone-200 pb-3">
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#2B2320]">
                  About SS VASTRA (हमारे बारे में)
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Jaipur Handcrafted Ethnic Wear • Direct from the Master Artisans of Sanganer
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-stone-900 text-sm">The Heritage of Sanganer, Jaipur</h4>
                <p>
                  Founded by <strong>Subhash Meena</strong>, <strong>SS VASTRA</strong> was created with a singular, passionate vision: to make authentic, heirloom-quality Rajasthani ethnic fashion accessible to every modern woman without luxury retail markups.
                </p>
                <p>
                  Nestled in the historic artisan quarter of Sanganer, Jaipur—famed worldwide for its 500-year-old woodblock printing techniques—our atelier pairs centuries of traditional dyeing craft with breathable cambric cottons, tailored silhouettes, and meticulous stitching.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-[#FAF5EE] border border-[#E9A9BB]/40 space-y-1.5">
                  <span className="font-serif font-bold text-[#A87A2A] text-sm block">Pure Breathable Fabrics</span>
                  <p className="text-xs text-stone-600">
                    We exclusively source 60x60 cambric cottons, pure mulmul, and curated festive blends designed for effortless grace in Indian climates.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-[#FAF5EE] border border-[#E9A9BB]/40 space-y-1.5">
                  <span className="font-serif font-bold text-[#A87A2A] text-sm block">Empowering Local Artisans</span>
                  <p className="text-xs text-stone-600">
                    Every kurta set, anarkali, and co-ord set directly supports master woodblock carvers, dye-masters, and local female tailors in Rajasthan.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FAF5EE] via-[#FBF7F0] to-[#F7E3E8]/40 border border-[#E9A9BB]/60 text-xs">
                <span className="font-bold text-[#2B2320] block mb-1">Our Registered Sanganer Atelier:</span>
                <p className="text-stone-700">
                  Green Vihar Vatika, Sanganer, Jaipur, Rajasthan 303905, India • Founder & Master Curator: Subhash Meena
                </p>
              </div>
            </div>
          )}

          {/* TAB 6: CONTACT & BOUTIQUE */}
          {tab === 'contact' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="border-b border-stone-200 pb-3">
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#2B2320]">
                  Contact Store & Boutique (संपर्क करें)
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Reach our Jaipur atelier directly for styling advice, order tracking, and bespoke sizing.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[#FAF5EE] border border-[#E9A9BB]/40 space-y-3">
                  <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
                    <MapPin className="w-4 h-4 text-[#A87A2A]" />
                    <span>Showroom & Atelier Address</span>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed font-medium">
                    SS VASTRA Handcrafted Boutique<br />
                    Green Vihar Vatika, Sanganer,<br />
                    Jaipur, Rajasthan 303905, India
                  </p>
                  <div className="pt-2 text-[11px] text-stone-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#A87A2A]" />
                    <span>Open Mon - Sat: 10:00 AM – 8:30 PM IST</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF5EE] border border-[#E9A9BB]/40 space-y-3">
                  <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
                    <Phone className="w-4 h-4 text-[#A87A2A]" />
                    <span>Direct Helpline & WhatsApp</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase font-bold">Helpline / Call:</span>
                      <a href="tel:9783770735" className="font-bold text-[#2B2320] hover:text-[#A87A2A]">
                        +91 97837 70735
                      </a>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase font-bold">Official Business Email:</span>
                      <a href={`mailto:${businessEmail}`} className="font-bold text-[#2B2320] hover:text-[#A87A2A]">
                        {businessEmail}
                      </a>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase font-bold">Instagram Community:</span>
                      <a
                        href="https://instagram.com/SS_vastra"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-[#2B2320] hover:text-[#A87A2A]"
                      >
                        @SS_vastra
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Direct WhatsApp options */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider block mb-2">
                  Instant WhatsApp Department Assistance:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <a
                    href="https://wa.me/919783770735?text=Namaste%20SS%20VASTRA!%20Mujhe%20naye%20outfits%20dekhne%20aur%20order%20karne%20hai."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-white border border-emerald-200 hover:border-emerald-500 text-emerald-900 font-medium flex items-center justify-between"
                  >
                    <span>1. New Orders & Styling</span>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
                  </a>
                  <a
                    href="https://wa.me/919783770735?text=Namaste%20SS%20VASTRA!%20Mujhe%20mere%20parcel%20tracking%20ke%20bare%20me%20puchna%20hai."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-white border border-emerald-200 hover:border-emerald-500 text-emerald-900 font-medium flex items-center justify-between"
                  >
                    <span>2. Order Tracking & Dispatch</span>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Business & GST info line */}
        <div className="px-6 py-3.5 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-stone-500">
          <span>
            SS VASTRA Jaipur • Handcrafted Ethnic Enterprise • Registered Sanganer Atelier (Trade Ref: RJ-JPR-2024-SSV)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#A87A2A] hover:bg-[#8e6520] text-white font-bold text-xs cursor-pointer shadow-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
