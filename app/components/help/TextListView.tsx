'use client'

import React from 'react';
import { Button } from '@/app/components/ui/button';
import { Phone, MapPin, Users, Clock, CheckCircle, AlertCircle, Baby, Home, Fuel, Car, HeartHandshake, XCircle, PauseCircle } from 'lucide-react';

interface Listing {
  id: string;
  title: string;
  type: string;
  status: string;
  area?: string;
  contact_phone?: string;
  capacity_min?: number;
  capacity_max?: number;
  duration_days?: number;
  family_friendly?: boolean;
  notes?: string;
  verified?: boolean;
  [key: string]: any;
}

interface TextListViewProps {
  listings: Listing[];
  onCall?: (phone?: string) => void;
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  accommodation: Home,
  fuel_service: Fuel,
  car_transportation: Car,
  volunteer_request: HeartHandshake
};

const typeLabels: Record<string, string> = {
  accommodation: 'ស្នាក់នៅ',
  fuel_service: 'សេវាសាំង',
  car_transportation: 'ដឹកជញ្ជូន',
  volunteer_request: 'ត្រូវការស្ម័គ្រចិត្ត'
};

const statusIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  open: CheckCircle,
  limited: AlertCircle,
  full: XCircle,
  paused: PauseCircle
};

const statusLabels: Record<string, string> = {
  open: 'បើក',
  limited: 'មានកំណត់',
  full: 'ពេញ',
  paused: 'ផ្អាក'
};

export default function TextListView({ listings, onCall }: TextListViewProps) {
  const handleCall = (phone?: string) => {
    window.location.href = `tel:${(phone || '+1-800-HELP-NOW').replace(/[^0-9+]/g, '')}`;
  };

  if (listings.length === 0) {
    return (
      <div className="text-center py-8 px-4">
        <p className="text-gray-600 text-lg">មិនមានការផ្តល់ជំនួយត្រូវបានរកឃើញ។</p>
        <p className="text-gray-500 mt-2">សូមទូរស័ព្ទទៅខ្សែបន្ទាន់សម្រាប់ជំនួយ។</p>
        <Button 
          onClick={() => handleCall()}
          className="mt-4 bg-[#105090] hover:bg-[#0d3d6f] text-white rounded-2xl"
        >
          <Phone className="w-4 h-4 mr-2" />
          ទូរស័ព្ទខ្សែបន្ទាន់
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Running Text Banner */}
      <div className="bg-[#105090] border-2 border-[#0d3d6f] rounded-2xl p-3 overflow-hidden relative shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 bg-white/20 rounded-full p-2 animate-pulse">
            <Phone className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 overflow-hidden relative">
            <div className="flex animate-marquee whitespace-nowrap">
              <span className="text-sm sm:text-base font-bold text-white inline-block px-4">
                ⚠️ របៀបបណ្តាញយឺត — ទិដ្ឋភាពអត្ថបទតែប៉ុណ្ណោះសម្រាប់ការតភ្ជាប់យឺត — សូមទូរស័ព្ទទៅខ្សែបន្ទាន់សម្រាប់ជំនួយ — 
              </span>
              <span className="text-sm sm:text-base font-bold text-white inline-block px-4">
                ⚠️ របៀបបណ្តាញយឺត — ទិដ្ឋភាពអត្ថបទតែប៉ុណ្ណោះសម្រាប់ការតភ្ជាប់យឺត — សូមទូរស័ព្ទទៅខ្សែបន្ទាន់សម្រាប់ជំនួយ — 
              </span>
            </div>
          </div>
        </div>
      </div>

      {listings.map((listing, index) => (
        <div 
          key={listing.id} 
          className="bg-white/95 backdrop-blur-sm border-2 border-gray-200 rounded-2xl p-4 space-y-2 shadow-2xl"
        >
          {/* Header */}
          <div className="border-b pb-2">
            <p className="font-mono text-sm text-gray-500 flex items-center gap-1.5">
              #{index + 1} — {typeIcons[listing.type] && (() => {
                const Icon = typeIcons[listing.type];
                return <Icon className="w-3.5 h-3.5" />;
              })()}
              {typeLabels[listing.type]}
            </p>
            <h3 className="font-bold text-lg text-gray-900 uppercase">
              {listing.title}
            </h3>
          </div>

          {/* Details */}
          <div className="space-y-1 font-mono text-sm">
            <p className="flex items-center gap-1.5">
              <span className="text-gray-500">ស្ថានភាព:</span>
              {statusIcons[listing.status] && (() => {
                const Icon = statusIcons[listing.status];
                return <Icon className={`w-3.5 h-3.5 ${
                  listing.status === 'open' ? 'text-emerald-700' :
                  listing.status === 'limited' ? 'text-amber-700' :
                  'text-gray-500'
                }`} />;
              })()}
              <span className={
                listing.status === 'open' ? 'text-emerald-700 font-bold' :
                listing.status === 'limited' ? 'text-amber-700 font-bold' :
                'text-gray-500'
              }>
                {statusLabels[listing.status]}
              </span>
            </p>
            
            <p>
              <span className="text-gray-500">តំបន់:</span>{' '}
              {listing.area}
            </p>

            {(listing.capacity_min || listing.capacity_max) && (
              <p>
                <span className="text-gray-500">សមត្ថភាព:</span>{' '}
                {listing.capacity_min || 1} - {listing.capacity_max || '?'} នាក់
              </p>
            )}

            {listing.duration_days && (
              <p>
                <span className="text-gray-500">រយៈពេល:</span>{' '}
                {listing.duration_days} ថ្ងៃ
              </p>
            )}

            {listing.family_friendly && (
              <p className="text-pink-600 font-bold flex items-center gap-1.5">
                <Baby className="w-4 h-4" />
                សមស្របសម្រាប់គ្រួសារ
              </p>
            )}

            {listing.notes && (
              <p className="text-gray-600 italic mt-2 border-l-2 border-gray-300 pl-2">
                {listing.notes}
              </p>
            )}
          </div>

          {/* Call Button */}
          <div className="pt-2 border-t-2 border-gray-200">
            <Button 
              onClick={() => handleCall(listing.contact_phone)}
              className="w-full bg-[#105090] hover:bg-[#0d3d6f] text-white font-bold rounded-2xl py-4 transition-all active:scale-[0.98]"
              size="lg"
            >
              <Phone className="w-5 h-5 mr-2" />
              ទូរស័ព្ទដើម្បីបញ្ជាក់
            </Button>
            {listing.verified && (
              <p className="text-center text-xs text-[#105090] mt-2 flex items-center justify-center gap-1 font-semibold">
                <CheckCircle className="w-3.5 h-3.5" />
                ការផ្តល់ជំនួយបានផ្ទៀងផ្ទាត់
              </p>
            )}
          </div>
        </div>
      ))}

      {/* Footer */}
      <div className="text-center py-4 border-t-2 border-dashed border-gray-300">
        <p className="text-sm text-gray-500">
          សូមបញ្ជាក់ភាពអាចរកបានតាមទូរស័ព្ទមុនពេលធ្វើដំណើរ។
        </p>
        <p className="text-xs text-gray-400 mt-1">
          ការផ្តល់ជំនួយត្រូវបានបង្ហាញតែជាមួយការយល់ព្រមប៉ុណ្ណោះ។
        </p>
      </div>
    </div>
  );
}