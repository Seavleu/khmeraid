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

const typeLabels: Record<string, string> = {
  accommodation: '🏠 ស្នាក់នៅ',
  fuel_service: '⛽ សេវាសាំង',
  car_transportation: '🚗 ដឹកជញ្ជូន',
  volunteer_request: '🤝 ត្រូវការស្ម័គ្រចិត្ត'
};

const statusLabels: Record<string, string> = {
  open: '✅ បើក',
  limited: '⚠️ មានកំណត់',
  full: '❌ ពេញ',
  paused: '⏸️ ផ្អាក'
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
          className="mt-4 bg-emerald-600 hover:bg-emerald-700"
        >
          <Phone className="w-4 h-4 mr-2" />
          ទូរស័ព្ទខ្សែបន្ទាន់
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r-lg">
        <p className="text-sm text-amber-800">
          <strong>📱 របៀបបណ្តាញយឺត</strong> — ទិដ្ឋភាពអត្ថបទតែប៉ុណ្ណោះសម្រាប់ការតភ្ជាប់យឺត
        </p>
      </div>

      {listings.map((listing, index) => (
        <div 
          key={listing.id} 
          className="bg-white border-2 border-gray-200 rounded-lg p-4 space-y-2"
        >
          {/* Header */}
          <div className="border-b pb-2">
            <p className="font-mono text-sm text-gray-500">
              #{index + 1} — {typeLabels[listing.type]}
            </p>
            <h3 className="font-bold text-lg text-gray-900 uppercase">
              {listing.title}
            </h3>
          </div>

          {/* Details */}
          <div className="space-y-1 font-mono text-sm">
            <p>
              <span className="text-gray-500">ស្ថានភាព:</span>{' '}
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
              <p className="text-pink-600 font-bold">
                👨‍👩‍👧‍👦 សមស្របសម្រាប់គ្រួសារ
              </p>
            )}

            {listing.notes && (
              <p className="text-gray-600 italic mt-2 border-l-2 border-gray-300 pl-2">
                {listing.notes}
              </p>
            )}
          </div>

          {/* Call Button */}
          <div className="pt-2 border-t">
            <Button 
              onClick={() => handleCall(listing.contact_phone)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold"
              size="lg"
            >
              <Phone className="w-5 h-5 mr-2" />
              ទូរស័ព្ទដើម្បីបញ្ជាក់
            </Button>
            {listing.verified && (
              <p className="text-center text-xs text-emerald-600 mt-1">
                ✓ ការផ្តល់ជំនួយបានផ្ទៀងផ្ទាត់
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