import React, { useState } from 'react';
import { X, User, Phone, Mail, MapPin, CheckCircle, ArrowRight } from 'lucide-react';

interface CustomerProfile {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  pincode: string;
}

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (profile: CustomerProfile) => void;
}

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [phone, setPhone] = useState(() => localStorage.getItem('ss_vastra_customer_phone') || '');
  const [name, setName] = useState(() => localStorage.getItem('ss_vastra_customer_name') || '');
  const [email, setEmail] = useState(() => localStorage.getItem('ss_vastra_customer_email') || '');
  const [address, setAddress] = useState(() => localStorage.getItem('ss_vastra_customer_address') || '');
  const [pincode, setPincode] = useState(() => localStorage.getItem('ss_vastra_customer_pincode') || '303905');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError('Kripya valid 10-digit mobile number enter karein');
      return;
    }

    if (mode === 'signup' && !name.trim()) {
      setError('Kripya apna naam enter karein');
      return;
    }

    const profile: CustomerProfile = {
      name: name.trim() || 'Valued Customer',
      phone: cleanPhone,
      email: email.trim(),
      address: address.trim(),
      city: 'Jaipur',
      pincode: pincode.trim(),
    };

    // Save to localStorage
    localStorage.setItem('ss_vastra_customer_phone', cleanPhone);
    if (profile.name) localStorage.setItem('ss_vastra_customer_name', profile.name);
    if (profile.email) localStorage.setItem('ss_vastra_customer_email', profile.email);
    if (profile.address) localStorage.setItem('ss_vastra_customer_address', profile.address);
    if (profile.pincode) localStorage.setItem('ss_vastra_customer_pincode', profile.pincode);

    setSuccessMsg(
      mode === 'login'
        ? `Namaste ${profile.name}! Aap safaltapoorvak login ho chuke hain.`
        : `Swagat hai ${profile.name}! Aapka account ban chuka hai.`
    );

    setTimeout(() => {
      onLoginSuccess(profile);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#FBF7F0] rounded-3xl shadow-2xl overflow-hidden border border-[#E9A9BB]/40 my-6">
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E9A9BB]/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F7E3E8] border border-[#A87A2A]/30 flex items-center justify-center text-[#A87A2A]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-[#2B2320]">
                {mode === 'login' ? 'Customer Sign In' : 'Create Customer Account'}
              </h2>
              <p className="text-xs text-stone-500">SS VASTRA Jaipur Club</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-100 text-stone-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-stone-200 bg-stone-50 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-3 text-center transition-colors ${
              mode === 'login'
                ? 'bg-white text-[#A87A2A] border-b-2 border-[#A87A2A]'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Sign In (Login)
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            className={`flex-1 py-3 text-center transition-colors ${
              mode === 'signup'
                ? 'bg-white text-[#A87A2A] border-b-2 border-[#A87A2A]'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            New Customer (Sign Up)
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 bg-white">
          {successMsg ? (
            <div className="py-8 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
              <h3 className="font-serif text-lg font-bold text-[#2B2320]">{successMsg}</h3>
              <p className="text-xs text-stone-500 mt-1">Profile updated!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Poora Naam (Full Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full px-3.5 py-2.5 bg-[#FBF7F0] border border-[#E9A9BB]/50 rounded-xl text-sm text-[#2B2320] focus:outline-none focus:ring-2 focus:ring-[#A87A2A]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Mobile Number (WhatsApp) *
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-500">
                    +91
                  </div>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9783770735"
                    className="w-full pl-12 pr-3.5 py-2.5 bg-[#FBF7F0] border border-[#E9A9BB]/50 rounded-xl text-sm text-[#2B2320] focus:outline-none focus:ring-2 focus:ring-[#A87A2A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="priya@example.com"
                  className="w-full px-3.5 py-2.5 bg-[#FBF7F0] border border-[#E9A9BB]/50 rounded-xl text-sm text-[#2B2320] focus:outline-none focus:ring-2 focus:ring-[#A87A2A]"
                />
              </div>

              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Delivery Address
                    </label>
                    <textarea
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Ghar / Flat no, colony, landmark..."
                      className="w-full px-3.5 py-2 bg-[#FBF7F0] border border-[#E9A9BB]/50 rounded-xl text-sm text-[#2B2320] focus:outline-none focus:ring-2 focus:ring-[#A87A2A]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Pincode
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        placeholder="303905"
                        className="w-full px-3 py-2 bg-[#FBF7F0] border border-[#E9A9BB]/50 rounded-xl text-sm text-[#2B2320] focus:outline-none focus:ring-2 focus:ring-[#A87A2A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        disabled
                        value="Jaipur / All India"
                        className="w-full px-3 py-2 bg-stone-100 border border-stone-200 rounded-xl text-sm text-stone-500"
                      />
                    </div>
                  </div>
                </>
              )}

              {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

              <button
                type="submit"
                className="w-full mt-2 py-3 bg-[#A87A2A] hover:bg-[#8e6520] text-white rounded-xl text-sm font-semibold transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>{mode === 'login' ? 'Login with OTP / Mobile' : 'Complete Registration'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[11px] text-stone-400 text-center mt-3">
                By logging in, you agree to receive order status updates and delivery tracking on WhatsApp.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
