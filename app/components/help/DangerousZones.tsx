'use client'

import React from 'react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { AlertTriangle, MapPin } from 'lucide-react';

interface DangerousZonesProps {
  className?: string;
}

// Define dangerous zones
const RED_ZONES = [
  'បាត់ដំបង',
'ឧត្តរមានជ័យ',
'បន្ទាយមានជ័យ',
'ពោធិសាត់',
  'កោះកុង',
  'ព្រះវិហារ'
];

const ORANGE_ZONES = [
  'សៀមរាប'
]; 

export default function DangerousZones({ className = '' }: DangerousZonesProps) {
  return (
    <Card className={`bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-xl sm:rounded-2xl shadow-lg overflow-hidden ${className}`}>
      <CardContent className="p-2 sm:p-3 md:p-4">
        <div className="flex items-center gap-2 mb-2 sm:mb-3">
          <div className="p-1.5 sm:p-2 bg-red-100 rounded-full">
            <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
          </div>
          <h3 className="font-bold text-xs sm:text-sm md:text-base text-gray-900">តំបន់គ្រោះថ្នាក់</h3>
        </div>

        {/* Red Zone - Dangerous */}
        <div className="mb-2 sm:mb-3">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-600 rounded-full flex-shrink-0" />
            <h4 className="font-semibold text-[10px] sm:text-xs text-red-900">តំបន់ក្រហម - គ្រោះថ្នាក់</h4>
          </div>
          <div className="flex flex-wrap gap-1 sm:gap-1.5">
            {RED_ZONES.map((zone) => (
              <Badge
                key={zone}
                className="bg-red-100 text-red-800 border-red-300 px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium"
              >
                <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                {zone}
              </Badge>
            ))}
          </div>
        </div>

        {/* Orange Zone - Alert */}
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-orange-500 rounded-full flex-shrink-0" />
            <h4 className="font-semibold text-[10px] sm:text-xs text-orange-900">តំបន់ទឹកក្រូច - ព្រមាន</h4>
          </div>
          <div className="flex flex-wrap gap-1 sm:gap-1.5">
            {ORANGE_ZONES.map((zone) => (
              <Badge
                key={zone}
                className="bg-orange-100 text-orange-800 border-orange-300 px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium"
              >
                <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                {zone}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Export zone data for use in map component
export const DANGEROUS_ZONES_DATA = {
  red: RED_ZONES,
  orange: ORANGE_ZONES,
  // Approximate coordinates for each zone (you may want to refine these)
  coordinates: {
    'Battambang': { lat: 13.0957, lng: 103.2022 },
    'Oudar Meanchey': { lat: 14.1603, lng: 103.6208 },
    'Banteay Meanchey': { lat: 13.5872, lng: 102.9847 },
    'Pursat': { lat: 12.5389, lng: 103.9192 },
    'Koh Kong': { lat: 11.6153, lng: 103.3583 },
    'Preah Vihear': { lat: 13.7894, lng: 104.9833 },
    'Siem Reap': { lat: 13.4125, lng: 103.8670 },
  }
};

