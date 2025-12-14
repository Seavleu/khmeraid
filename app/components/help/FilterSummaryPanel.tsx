'use client'

import React from 'react';
import { Button } from '@/app/components/ui/button';
import { MapPin, Navigation } from 'lucide-react';

interface Listing {
  area?: string;
  latitude?: number;
  longitude?: number;
  [key: string]: any;
}

interface FilterState {
  type: string | null;
  area: string | null;
  familyFriendly: boolean;
  verifiedOnly: boolean;
}

interface FilterSummaryPanelProps {
  listings: Listing[];
  userLocation?: [number, number] | null;
  filters: FilterState;
  onLocationClick: (location: { lat: number; lng: number }) => void;
}

const typeLabels: Record<string, string> = {
  accommodation: 'ស្នាក់នៅ',
  fuel_service: 'សាំង',
  car_transportation: 'ដឹកជញ្ជូន',
  volunteer_request: 'ស្ម័គ្រចិត្ត',
  event: 'ព្រឹត្តិការណ៍',
  site_sponsor: 'ទីតាំងហ្រ្វី',
  school: 'សាលារៀន'
};

export default function FilterSummaryPanel({ 
  listings, 
  userLocation, 
  filters,
  onLocationClick 
}: FilterSummaryPanelProps) {
  if (!filters.type && !filters.area && !filters.familyFriendly && !filters.verifiedOnly) {
    return null;
  }

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Group listings by area
  const groupedByArea = listings.reduce((acc: Record<string, Listing[]>, listing) => {
    if (!listing.area) return acc;
    if (!acc[listing.area]) {
      acc[listing.area] = [];
    }
    acc[listing.area].push(listing);
    return acc;
  }, {});

  // Calculate distances and sort by proximity
  const areaSummaries = Object.entries(groupedByArea).map(([area, items]) => {
    const firstWithCoords = items.find(l => l.latitude && l.longitude);
    let distance = null;
    
    if (userLocation && firstWithCoords && firstWithCoords.latitude && firstWithCoords.longitude) {
      distance = calculateDistance(
        userLocation[0],
        userLocation[1],
        firstWithCoords.latitude,
        firstWithCoords.longitude
      );
    }

    return {
      area,
      count: items.length,
      distance,
      location: firstWithCoords && firstWithCoords.latitude && firstWithCoords.longitude ? {
        lat: firstWithCoords.latitude,
        lng: firstWithCoords.longitude
      } : null
    };
  }).sort((a, b) => {
    if (a.distance === null) return 1;
    if (b.distance === null) return -1;
    return a.distance - b.distance;
  });

  const filterTypeLabel = filters.type ? typeLabels[filters.type] : null;

  return (
    <div className="absolute left-4 top-32 z-10 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border-2 border-gray-200 p-4 max-w-xs">
      <div className="mb-3">
        <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          សង្ខេប
        </h3>
        {filterTypeLabel && (
          <p className="text-sm text-gray-600 mt-1">
            {filterTypeLabel} • {listings.length} ទំនេរ
          </p>
        )}
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {areaSummaries.slice(0, 5).map(({ area, count, distance, location }) => (
          <Button
            key={area}
            variant="ghost"
            className="w-full justify-start text-left p-3 h-auto hover:bg-blue-50"
            onClick={() => {
              if (location && location.lat !== undefined && location.lng !== undefined) {
                onLocationClick({ lat: location.lat, lng: location.lng });
              }
            }}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="font-semibold text-gray-900">{area}</span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                <span>{count} ទំនេរ</span>
                {distance !== null && (
                  <>
                    <span>•</span>
                    <Navigation className="w-3 h-3" />
                    <span>{distance.toFixed(1)} km</span>
                  </>
                )}
              </div>
            </div>
          </Button>
        ))}

        {areaSummaries.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            គ្មានទីតាំងដែលមានកូអរឌីណេ
          </p>
        )}
      </div>

      {areaSummaries.length > 5 && (
        <p className="text-xs text-gray-400 mt-2 text-center">
          និងច្រើនទៀត {areaSummaries.length - 5} តំបន់
        </p>
      )}
    </div>
  );
}