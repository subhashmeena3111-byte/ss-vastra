import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  RotateCcw,
  Loader2,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';

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
  const [step, setStep] = useState<'input' | 'otp'>('input');

  const [phone, setPhone] = useState(() => localStorage.getItem('ss_vastra_customer_phone') || '');
  const [name, setName] = useState(() => localStorage.getItem('ss_vastra_customer_name') || '');
  const [email, setEmail] = useState(() => localStorage.getItem('ss_vastra_customer_email') || '');
  const [address, setAddress] = useState(() => localStorage.getItem('ss_vastra_customer_address') || '');
  const [pincode, setPincode] = useState(() => localStorage.getItem('ss_vastra_customer_pincode') || '303905');

  // OTP state
  const [otpCode, setOtpCode] = useState('');
  const [receivedOtp, setReceivedOtp] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (step === 'otp' && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, timerSeconds]);

  if (!isOpen) return null;

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length < 10) {
      setError('Kripya valid 10-digit mobile number enter karein');
      return;
    }

    if (mode === 'signup' && !name.trim()) {
      setError('Kripya apna poora naam enter karein');
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await fetch('/api/customer/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          name: name.trim(),
          email: email.trim(),
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      setStep('otp');
      setTimerSeconds(60);
      setOtpCode('');
      if (data.otp) {
        setReceivedOtp(data.otp);
      }
    } catch (err: any) {
      setError(err?.message || 'OTP bhejne mein dikkat aayi. Kripya punah prayas karein.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const cleanOtp = otpCode.trim();

    if (cleanOtp.length !== 6) {
      setError('Kripya 6-digit OTP enter karein');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const res = await fetch('/api/customer/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          otp: cleanOtp,
          name: name.trim(),
          email: email.trim(),
          address: address.trim(),
          pincode: pincode.trim(),
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Invalid OTP code');
      }

      const verifiedUser = data.user || {
        name: name.trim() || 'Valued Customer',
        phone: cleanPhone,
        email: email.trim(),
        address: address.trim(),
        city: 'Jaipur',
        pincode: pincode.trim(),
      };

      const profile: CustomerProfile = {
        name: verifiedUser.name,
        phone: verifiedUser.phone,
        email: verifiedUser.email || '',
        address: verifiedUser.address || '',
        city: 'Jaipur',
        pincode: verifiedUser.pincode || '303905',
      };

      // Save to localStorage
      localStorage.setItem('ss_vastra_customer_phone', cleanPhone);
      if (profile.name) localStorage.setItem('ss_vastra_customer_name', profile.name);
      if (profile.email) localStorage.setItem('ss_vastra_customer_email', profile.email);
      if (profile.address) localStorage.setItem('ss_vastra_customer_address', profile.address);
      if (profile.pincode) localStorage.setItem('ss_vastra_customer_pincode', profile.pincode);
      if (data.token) localStorage.setItem('ss_vastra_auth_token', data.token);

      setSuccessMsg(
        mode === 'login'
          ? `Namaste ${profile.name}! Aap safaltapoorvak verify ho chuke hain.`
          : `Swagat hai ${profile.name}! Aapka account safalta se ban chuka hai.`
      );

      setTimeout(() => {
        onLoginSuccess(profile);
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'OTP verify nahi ho paya. Kripya sahi OTP dalein.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#FBF7F0] rounded-3xl shadow-2xl overflow-hidden border border-[#E9A9BB]/40 my-6">
        
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E9A9BB]/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F7E3E8] border border-[#A87A2A]/30 flex items-center justify-center text-[#A87A2A]">
              {step === 'otp' ? <KeyRound className="w-5 h-5" /> : <User className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-[#2B2320]">
                {step === 'otp'
                  ? 'Verify 6-Digit OTP'
                  : mode === 'login'
                  ? 'Customer Sign In'
                  : 'Create Customer Account'}
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

        {/* Tab switch (only in input step) */}
        {step === 'input' && (
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
        )}

        {/* Form Body */}
        <div className="p-6 bg-white">
          {successMsg ? (
            <div className="py-8 text-center animate-in fade-in">
              <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-3 animate-bounce" />
              <h3 className="font-serif text-lg font-bold text-[#2B2320]">{successMsg}</h3>
              <p className="text-xs text-stone-500 mt-1">Profile updated & verified!</p>
            </div>
          ) : step === 'input' ? (
            /* STEP 1: Phone & Details Form */
            <form onSubmit={handleSendOtp} className="space-y-4">
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
                disabled={isSendingOtp}
                className="w-full mt-2 py-3 bg-[#A87A2A] hover:bg-[#8e6520] text-white rounded-xl text-sm font-semibold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSendingOtp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending 6-Digit OTP...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Get 6-Digit OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-[11px] text-stone-400 text-center mt-3">
                Instant 6-digit OTP will be sent to your mobile number.
              </p>
            </form>
          ) : (
            /* STEP 2: Real-time 6-Digit OTP Verification */
            <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between bg-[#FBF7F0] p-3 rounded-2xl border border-[#E9A9BB]/40">
                <div className="flex items-center gap-2 text-xs">
                  <Phone className="w-4 h-4 text-[#A87A2A]" />
                  <span className="font-semibold text-stone-700">+91 {phone.replace(/\D/g, '').slice(-10)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep('input');
                    setError(null);
                  }}
                  className="text-xs text-[#A87A2A] font-bold hover:underline flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Change</span>
                </button>
              </div>

              {/* Real-time OTP Quick Paste Assist Box */}
              {receivedOtp && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Your verification OTP: <strong className="font-mono text-sm tracking-widest font-bold text-emerald-700">{receivedOtp}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOtpCode(receivedOtp)}
                    className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[11px] font-bold hover:bg-emerald-700 transition-colors cursor-pointer"
                  >
                    Auto-Fill
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5 text-center">
                  Enter 6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  autoFocus
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • • • •"
                  className="w-full text-center tracking-[0.5em] font-mono font-bold text-2xl py-3 bg-[#FBF7F0] border-2 border-[#A87A2A]/40 focus:border-[#A87A2A] rounded-2xl text-[#2B2320] focus:outline-none"
                />
              </div>

              {error && <p className="text-xs text-rose-600 font-medium text-center">{error}</p>}

              <button
                type="submit"
                disabled={isVerifyingOtp || otpCode.length !== 6}
                className="w-full py-3 bg-[#A87A2A] hover:bg-[#8e6520] text-white rounded-xl text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isVerifyingOtp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying OTP...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Verify OTP & Continue</span>
                  </>
                )}
              </button>

              {/* Resend OTP */}
              <div className="flex items-center justify-between text-xs text-stone-500 pt-2 border-t border-stone-100">
                <span>Didn't receive code?</span>
                {timerSeconds > 0 ? (
                  <span className="text-stone-400 font-medium">
                    Resend in <strong className="font-mono text-stone-600">{timerSeconds}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={isSendingOtp}
                    onClick={() => handleSendOtp()}
                    className="text-[#A87A2A] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Resend OTP</span>
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
