import React, { useState } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
} from '@vis.gl/react-google-maps';
import { MapPin, Navigation, Clock, Phone, Mail, Sparkles, Compass } from 'lucide-react';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyBBPw5H_jZpEaM2b9k_IJr8f0SSEqm3C5c';
const SS_VASTRA_LOCATION = { lat: 26.8184, lng: 75.7624 };

interface StoreLocationMapProps {
  onScheduleAppointment?: () => void;
}

export const StoreLocationMap: React.FC<StoreLocationMapProps> = ({
  onScheduleAppointment,
}) => {
  const [infoOpen, setInfoOpen] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Calculate distance between user and SS VASTRA store
  const handleGetDirections = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const uLat = pos.coords.latitude;
        const uLng = pos.coords.longitude;
        setUserLocation({ lat: uLat, lng: uLng });

        // Haversine formula calculation
        const R = 6371; // Earth radius in km
        const dLat = ((uLat - SS_VASTRA_LOCATION.lat) * Math.PI) / 180;
        const dLng = ((uLng - SS_VASTRA_LOCATION.lng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((SS_VASTRA_LOCATION.lat * Math.PI) / 180) *
            Math.cos((uLat * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const dist = Math.round(R * c * 10) / 10;
        setDistanceKm(dist);
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
      }
    );
  };

  return (
    <section id="store-location" className="py-12 sm:py-16 bg-[#F7E3E8]/30 border-y border-[#E9A9BB]/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#A87A2A]/10 text-[#A87A2A] text-xs font-semibold uppercase tracking-wider mb-2">
            <Compass className="w-3.5 h-3.5" />
            <span>Visit Our Experience Center</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#2B2320]">
            Experience Sanganer's Living Heritage
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-2">
            Walk into our flagship boutique & artisan atelier in Sanganer, Jaipur. Feel our handcrafted pure mulmul, explore custom tailoring, and witness real wooden block printing.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Store Info Card */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#E9A9BB]/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-emerald-700 tracking-wide uppercase">
                  Flagship Store Open Now
                </span>
              </div>

              <h3 className="font-serif text-2xl font-bold text-[#2B2320]">
                SS VASTRA Flagship & Atelier
              </h3>
              <p className="text-xs text-[#A87A2A] font-medium mt-0.5">
                Ladies Fashion, Fabrics & Handcrafted Gotapatti
              </p>

              <div className="mt-6 space-y-4 text-xs sm:text-sm text-stone-600">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-[#FBF7F0] text-[#A87A2A] shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-[#2B2320] font-semibold">Store Address:</strong>
                    <span>Green Vihar Vatika, Sanganer, Jaipur, Rajasthan 303905</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-[#FBF7F0] text-[#A87A2A] shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-[#2B2320] font-semibold">Boutique Hours:</strong>
                    <span>Monday - Saturday: 10:00 AM - 8:30 PM</span>
                    <span className="block text-stone-500 text-xs mt-0.5">Sunday: 11:00 AM - 6:00 PM</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-[#FBF7F0] text-[#A87A2A] shrink-0 mt-0.5">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-[#2B2320] font-semibold">Customer Helpline:</strong>
                    <a
                      href="tel:9783770735"
                      className="text-[#A87A2A] font-semibold hover:underline"
                    >
                      +91 9783770735
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-[#FBF7F0] text-[#A87A2A] shrink-0 mt-0.5">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-[#2B2320] font-semibold">Email Desk:</strong>
                    <span className="text-stone-700">subhashmeena3111@gmail.com</span>
                  </div>
                </div>
              </div>

              {/* Distance Display if Calculated */}
              {distanceKm !== null && (
                <div className="mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
                  <span>Your distance to SS VASTRA:</span>
                  <span className="font-bold text-sm">{distanceKm} km away</span>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-stone-100 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleGetDirections}
                disabled={isLocating}
                className="flex-1 py-3 px-4 rounded-2xl bg-[#A87A2A] hover:bg-[#8e6520] text-white font-medium text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>{isLocating ? 'Locating...' : 'Get Distance & Directions'}</span>
              </button>

              {onScheduleAppointment && (
                <button
                  type="button"
                  onClick={onScheduleAppointment}
                  className="py-3 px-4 rounded-2xl bg-stone-900 hover:bg-black text-white font-medium text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Book VIP Fitting</span>
                </button>
              )}
            </div>
          </div>

          {/* Interactive Google Map with @vis.gl/react-google-maps */}
          <div className="lg:col-span-7 bg-white rounded-3xl overflow-hidden shadow-sm border border-[#E9A9BB]/40 h-[400px] lg:h-auto min-h-[380px] relative">
            <APIProvider apiKey={API_KEY}>
              <Map
                mapId="DEMO_MAP_ID"
                defaultCenter={SS_VASTRA_LOCATION}
                defaultZoom={14}
                gestureHandling="cooperative"
                disableDefaultUI={false}
                style={{ width: '100%', height: '100%', minHeight: '380px' }}
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              >
                {/* Store Pin */}
                <AdvancedMarker
                  position={SS_VASTRA_LOCATION}
                  title="SS VASTRA - Sanganer Jaipur"
                  onClick={() => setInfoOpen(true)}
                >
                  <div className="relative group cursor-pointer">
                    <div className="w-10 h-10 rounded-2xl bg-[#A87A2A] border-2 border-white shadow-xl flex items-center justify-center text-white text-base">
                      👗
                    </div>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#A87A2A] rotate-45" />
                  </div>
                </AdvancedMarker>

                {/* User Pin if directions tapped */}
                {userLocation && (
                  <AdvancedMarker position={userLocation} title="Your Location">
                    <div className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white ring-4 ring-blue-300" />
                  </AdvancedMarker>
                )}

                {/* Information window */}
                {infoOpen && (
                  <InfoWindow
                    position={SS_VASTRA_LOCATION}
                    onCloseClick={() => setInfoOpen(false)}
                  >
                    <div className="p-1 max-w-[220px]">
                      <div className="font-serif font-bold text-sm text-[#2B2320]">
                        SS VASTRA Showroom
                      </div>
                      <p className="text-[11px] text-stone-600 mt-0.5">
                        Green Vihar Vatika, Sanganer, Jaipur 303905
                      </p>
                      <div className="mt-2 text-[10px] text-[#A87A2A] font-semibold flex items-center gap-1">
                        <span>📞 +91 9783770735</span>
                      </div>
                      <a
                        href="https://wa.me/919783770735?text=Hello%20SS%20VASTRA%2C%20I%20am%20visiting%20your%20Sanganer%20store."
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block mt-2 px-2.5 py-1 bg-[#A87A2A] text-white text-[10px] font-medium rounded-lg"
                      >
                        Message on WhatsApp
                      </a>
                    </div>
                  </InfoWindow>
                )}
              </Map>
            </APIProvider>
          </div>
        </div>
      </div>
    </section>
  );
};
