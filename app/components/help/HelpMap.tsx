'use client'

import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Phone, Home, Fuel, HeartHandshake, Navigation, Car, RefreshCw, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Listing {
  id: string;
  title: string;
  type: string;
  status: string;
  area?: string;
  latitude?: number;
  longitude?: number;
  contact_phone?: string;
  verified?: boolean;
  [key: string]: any;
}

// Custom icons for different types
const createCustomIcon = (type: string, status: string, verified: boolean) => {
  const colors: Record<string, { bg: string; border: string }> = {
    accommodation: { bg: '#3B82F6', border: '#1D4ED8' },
    fuel_service: { bg: '#F59E0B', border: '#D97706' },
    car_transportation: { bg: '#10B981', border: '#059669' },
    volunteer_request: { bg: '#8B5CF6', border: '#7C3AED' }
  };

  const statusOpacity: Record<string, number> = {
    open: 1,
    limited: 0.8,
    full: 0.4,
    paused: 0.3
  };

  const color = colors[type] || colors.accommodation;
  const opacity = statusOpacity[status] || 1;

  const verifiedBadge = verified ? `
    <div style="
      position: absolute;
      top: -8px;
      right: -8px;
      background: #10B981;
      border: 2px solid white;
      border-radius: 50%;
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      transform: rotate(45deg);
    ">✓</div>
  ` : '';

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="position: relative;">
        <div style="
          width: 36px;
          height: 36px;
          background: ${color.bg};
          border: 3px solid ${color.border};
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          opacity: ${opacity};
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">
          <div style="transform: rotate(45deg); color: white; font-size: 14px;">
            ${type === 'accommodation' ? '🏠' : type === 'fuel_service' ? '⛽' : type === 'car_transportation' ? '🚗' : '🤝'}
          </div>
        </div>
        ${verifiedBadge}
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36]
  });
};

function LocationMarker({ position }: { position?: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    if (position) {
      map.flyTo(position, 13);
    }
  }, [position, map]);

  if (!position) return null;

  return (
    <Marker 
      position={position}
      icon={L.divIcon({
        className: 'user-location-marker',
        html: `
          <div style="
            width: 20px;
            height: 20px;
            background: #10B981;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.3), 0 2px 8px rgba(0,0,0,0.3);
          "></div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      })}
    >
      <Popup>Your location</Popup>
    </Marker>
  );
}

function MapUpdater({ listings, center }: { listings: Listing[]; center?: [number, number] }) {
  const map = useMap();
  const [prevListingsCount, setPrevListingsCount] = useState(0);

  useEffect(() => {
    // If new listings appear, show visual feedback
    if (listings.length > prevListingsCount) {
      // Flash effect or notification
      const notification = new L.Control({ position: 'topright' });
      notification.onAdd = function() {
        const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        div.innerHTML = `
          <div style="
            background: #10B981;
            color: white;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: bold;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease-out;
          ">
            ${listings.length - prevListingsCount} New Listing${listings.length - prevListingsCount > 1 ? 's' : ''}!
          </div>
        `;
        setTimeout(() => {
          if (div.parentNode) {
            div.parentNode.removeChild(div);
          }
        }, 3000);
        return div;
      };
      notification.addTo(map);
    }
    setPrevListingsCount(listings.length);
  }, [listings.length, prevListingsCount, map]);

  return null;
}

interface HelpMapProps {
  listings: Listing[];
  onSelectListing: (listing: Listing | null) => void;
  center?: [number, number];
  userLocation?: [number, number] | null;
}

export default function HelpMap({ 
  listings, 
  onSelectListing, 
  center = [12.5657, 104.9910], // Default Phnom Penh, Cambodia
  userLocation 
}: HelpMapProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  
  // Detect when listings change
  useEffect(() => {
    setIsUpdating(true);
    const timer = setTimeout(() => setIsUpdating(false), 500);
    return () => clearTimeout(timer);
  }, [listings]);

  const handleMarkerClick = (listing: Listing) => {
    setSelectedId(listing.id);
    onSelectListing?.(listing);
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${(phone || '+1-800-HELP-NOW').replace(/[^0-9+]/g, '')}`;
  };

  const openInGoogleMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
  };

  // Filter listings with valid coordinates
  const mappableListings = listings.filter(l => 
    l.latitude && l.longitude && l.location_consent !== false
  );

  const statusLabels: Record<string, string> = {
    open: 'Open',
    limited: 'Limited',
    full: 'Full',
    paused: 'Paused'
  };

  const typeLabels: Record<string, string> = {
    accommodation: 'Accommodation',
    fuel_service: 'Fuel Service',
    car_transportation: 'Car Transportation',
    volunteer_request: 'Volunteer Request'
  };

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-lg border border-gray-200">
      {/* Real-time update indicator */}
      {isUpdating && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-green-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-semibold">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Updating map...
        </div>
      )}

      {/* Open in Google Maps button */}
      <Button
        onClick={() => openInGoogleMaps(center[0], center[1])}
        className="absolute top-4 right-4 z-[1000] bg-white hover:bg-gray-50 text-gray-700 shadow-lg border-2"
        size="sm"
      >
        <ExternalLink className="w-4 h-4 mr-2" />
        Open in Google Maps
      </Button>

      <MapContainer 
        center={center} 
        zoom={11} 
        style={{ height: '100%', minHeight: '400px', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {userLocation && <LocationMarker position={userLocation} />}
        <MapUpdater listings={mappableListings} center={center} />

        {mappableListings.map((listing) => {
          if (!listing.latitude || !listing.longitude) return null;
          return (
            <Marker
              key={listing.id}
              position={[listing.latitude, listing.longitude]}
              icon={createCustomIcon(listing.type, listing.status, listing.verified || false)}
              eventHandlers={{
                click: () => handleMarkerClick(listing)
              }}
            >
            <Popup>
              <div className="p-2 min-w-[240px]">
                {listing.image_url && (
                  <img 
                    src={listing.image_url} 
                    alt={listing.title}
                    className="w-full h-24 object-cover rounded-lg mb-2"
                  />
                )}
                <h4 className="font-bold text-gray-900 mb-2">{listing.title}</h4>
                <div className="flex gap-2 mb-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {typeLabels[listing.type]}
                  </Badge>
                  <Badge 
                    className={`text-xs ${
                      listing.status === 'open' ? 'bg-emerald-100 text-emerald-700' :
                      listing.status === 'limited' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {statusLabels[listing.status]}
                  </Badge>
                  {listing.verified && (
                    <Badge className="text-xs bg-emerald-600 text-white">
                      ✓ Verified
                    </Badge>
                  )}
                </div>
                {listing.contact_phone && (
                  <p className="text-sm text-gray-600 mb-1 font-semibold">
                    📞 {listing.contact_phone}
                  </p>
                )}
                {listing.exact_location && (
                  <p className="text-xs text-gray-500 mb-2">
                    📍 {listing.exact_location}
                  </p>
                )}
                {listing.capacity_max && (
                  <p className="text-sm text-gray-600 mb-2">
                    Capacity: up to {listing.capacity_max}
                  </p>
                )}
                <div className="space-y-2">
                  {listing.contact_phone && (
                    <Button 
                      size="sm" 
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => handleCall(listing.contact_phone || '')}
                    >
                      <Phone className="w-3 h-3 mr-1" />
                      Call Now
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      if (listing.latitude && listing.longitude) {
                        openInGoogleMaps(listing.latitude, listing.longitude);
                      }
                    }}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    View in Google Maps
                  </Button>
                </div>
              </div>
            </Popup>
          </Marker>
          );
        })}
      </MapContainer>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg z-[1000]">
        <p className="text-sm font-bold text-gray-700 mb-3">Legend</p>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="w-5 h-5 rounded-full bg-blue-500"></span>
            <span className="font-medium">Accommodation</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-5 h-5 rounded-full bg-amber-500"></span>
            <span className="font-medium">Fuel</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-5 h-5 rounded-full bg-green-500"></span>
            <span className="font-medium">Transportation</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-5 h-5 rounded-full bg-purple-500"></span>
            <span className="font-medium">Volunteer</span>
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg z-[1000] max-w-[200px]">
        <p className="text-xs text-gray-500">
          📍 Locations shown with consent only
        </p>
      </div>
    </div>
  );
}