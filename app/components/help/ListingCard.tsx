'use client'

import React from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { 
  Home, Fuel, HeartHandshake, MapPin, Users, Clock, 
  Phone, CheckCircle, AlertCircle, PauseCircle, XCircle,
  Baby, Car, ExternalLink, Facebook, User, ShieldCheck
} from 'lucide-react';

interface Listing {
  id: string;
  title: string;
  type: string;
  area?: string;
  status: string;
  verified?: boolean;
  contact_phone?: string;
  contact_name?: string;
  facebook_contact?: string;
  exact_location?: string;
  location_consent?: boolean;
  capacity_min?: number;
  capacity_max?: number;
  duration_days?: number;
  family_friendly?: boolean;
  notes?: string;
  reference_link?: string;
  image_url?: string;
  event_date?: string;
  event_time?: string;
  organizer_name?: string;
  organizer_contact?: string;
  [key: string]: any;
}

interface ListingCardProps {
  listing: Listing;
  onSelect?: (listing: Listing) => void;
  compact?: boolean;
}

const typeConfig = {
  accommodation: {
    icon: Home,
    label: 'ស្នាក់នៅ',
    color: 'bg-blue-100 text-blue-700 border-blue-200'
  },
  fuel_service: {
    icon: Fuel,
    label: 'សេវាសាំង',
    color: 'bg-amber-100 text-amber-700 border-amber-200'
  },
  volunteer_request: {
    icon: HeartHandshake,
    label: 'ត្រូវការស្ម័គ្រចិត្ត',
    color: 'bg-purple-100 text-purple-700 border-purple-200'
  },
  car_transportation: {
    icon: Car,
    label: 'ដឹកជញ្ជូន',
    color: 'bg-green-100 text-green-700 border-green-200'
  },
  site_sponsor: {
    icon: MapPin,
    label: 'ទីតាំងហ្រ្វី',
    color: 'bg-indigo-100 text-indigo-700 border-indigo-200'
  },
  school: {
    icon: Home,
    label: 'សាលារៀន',
    color: 'bg-teal-100 text-teal-700 border-teal-200'
  },
  event: {
    icon: Clock,
    label: 'ព្រឹត្តិការណ៍',
    color: 'bg-pink-100 text-pink-700 border-pink-200'
  }
};

const statusConfig = {
  open: {
    icon: CheckCircle,
    label: 'បើក',
    color: 'bg-emerald-100 text-emerald-700'
  },
  limited: {
    icon: AlertCircle,
    label: 'មានកំណត់',
    color: 'bg-amber-100 text-amber-700'
  },
  full: {
    icon: XCircle,
    label: 'ពេញ',
    color: 'bg-red-100 text-red-700'
  },
  paused: {
    icon: PauseCircle,
    label: 'ផ្អាក',
    color: 'bg-gray-100 text-gray-700'
  }
};

export default function ListingCard({ listing, onSelect, compact = false }: ListingCardProps) {
  const type = (listing.type in typeConfig ? typeConfig[listing.type as keyof typeof typeConfig] : typeConfig.accommodation);
  const status = (listing.status in statusConfig ? statusConfig[listing.status as keyof typeof statusConfig] : statusConfig.open);
  const TypeIcon = type.icon;
  const StatusIcon = status.icon;

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    const phone = listing.contact_phone || '+1-800-HELP-NOW';
    window.location.href = `tel:${phone.replace(/[^0-9+]/g, '')}`;
  };

  if (compact) {
    return (
      <div 
        onClick={() => onSelect?.(listing)}
        className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-white/95 backdrop-blur-sm rounded-2xl border-2 border-gray-200 hover:border-[#105090] hover:shadow-2xl transition-all cursor-pointer active:scale-[0.98]"
      >
        <div className={`p-2 sm:p-2.5 rounded-lg flex-shrink-0 ${type.color}`}>
          <TypeIcon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm sm:text-base font-bold text-gray-900 truncate">{listing.title}</p>
          <p className="text-xs sm:text-sm text-gray-600 truncate font-medium">{listing.area}</p>
        </div>
        <Badge className={`${status.color} text-xs sm:text-sm font-semibold px-2 sm:px-2.5 py-0.5 sm:py-1 flex-shrink-0`}>{status.label}</Badge>
      </div>
    );
  }

  return (
    <Card 
      onClick={() => onSelect?.(listing)}
      className="overflow-hidden hover:shadow-2xl transition-all cursor-pointer border-2 border-gray-200 relative hover:border-[#105090] active:scale-[0.98]"
    >
      {/* Verified Badge Ribbon */}
      {listing.verified && (
        <div className="absolute top-3 right-3 z-10 bg-emerald-600 text-white px-3 py-1 rounded-full shadow-lg flex items-center gap-1 text-xs font-bold">
          <ShieldCheck className="w-4 h-4" />
          VERIFIED
        </div>
      )}

      <CardContent className="p-0">
        {/* Image */}
        {listing.image_url && (
          <div className="relative w-full h-48 overflow-hidden bg-gray-100">
            <Image 
              src={listing.image_url} 
              alt={listing.title}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}

        {/* Header */}
        <div className={`p-4 ${type.color} border-b-2 border-gray-200`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TypeIcon className="w-5 h-5" />
              <span className="font-bold text-sm text-gray-900">{type.label}</span>
            </div>
            <Badge className={`${status.color} text-xs px-2 py-0.5`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {status.label}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-2">
          <div>
            <h3 className="font-bold text-lg text-gray-900 leading-tight mb-1">
              {listing.title}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="font-medium">{listing.area}</span>
            </div>
          </div>

          {/* Event Details */}
          {listing.type === 'event' && (
            <div className="space-y-2 border-t-2 border-gray-200 pt-3">
              {listing.event_date && (
                <div className="bg-pink-50 border-2 border-pink-200 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-pink-700" />
                    <p className="text-xs text-pink-700 font-medium">កាលបរិច្ឆេទ</p>
                  </div>
                  <p className="text-base font-bold text-pink-800">
                    {new Date(listing.event_date).toLocaleDateString('km-KH', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                  {listing.event_time && (
                    <p className="text-sm font-semibold text-pink-700 mt-1">
                      ម៉ោង: {listing.event_time}
                    </p>
                  )}
                </div>
              )}
              {listing.organizer_name && (
                <div className="flex items-center gap-2 text-gray-700 bg-gray-50 p-3 rounded-2xl">
                  <User className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">អ្នករៀបចំ</p>
                    <p className="text-sm font-semibold">{listing.organizer_name}</p>
                  </div>
                </div>
              )}
              {listing.organizer_contact && (
                <div className="bg-pink-50 border-2 border-pink-200 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Phone className="w-3.5 h-3.5 text-pink-700" />
                    <p className="text-xs text-pink-700 font-medium">ទំនាក់ទំនងអ្នករៀបចំ</p>
                  </div>
                  <a 
                    href={`tel:${listing.organizer_contact.replace(/[^0-9+]/g, '')}`}
                    className="text-base font-bold text-pink-700 hover:text-pink-800 block"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {listing.organizer_contact}
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Contact Details */}
          <div className="space-y-2">
            {listing.contact_phone && (
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-700" />
                  <p className="text-xs text-emerald-700 font-medium">លេខទូរស័ព្ទ</p>
                </div>
                <a 
                  href={`tel:${listing.contact_phone.replace(/[^0-9+]/g, '')}`}
                  className="text-lg font-bold text-emerald-700 hover:text-emerald-800 block"
                  onClick={(e) => e.stopPropagation()}
                >
                  {listing.contact_phone}
                </a>
              </div>
            )}

            {listing.contact_name && (
              <div className="flex items-center gap-2 text-gray-700 bg-gray-50 p-3 rounded-2xl">
                <User className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">អ្នកទំនាក់ទំនង</p>
                  <p className="text-sm font-semibold">{listing.contact_name}</p>
                </div>
              </div>
            )}

            {listing.facebook_contact && (
              <a
                href={listing.facebook_contact.startsWith('http') ? listing.facebook_contact : `https://facebook.com/${listing.facebook_contact}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2 bg-blue-50 border-2 border-blue-200 p-3 rounded-2xl hover:bg-blue-100 transition-all"
              >
                <Facebook className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-xs text-blue-600 font-medium">ហ្វេសប៊ុក</p>
                  <p className="text-sm font-semibold text-blue-700">ផ្ញើសារតាម Facebook</p>
                </div>
              </a>
            )}

            {listing.exact_location && listing.location_consent && (
              <div className="flex items-start gap-2 text-gray-700 bg-gray-50 p-3 rounded-2xl">
                <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">ទីតាំងពិតប្រាកដ</p>
                  <p className="text-sm">{listing.exact_location}</p>
                </div>
              </div>
            )}
          </div>

          {/* Key Details */}
          <div className="space-y-1.5">
            {(listing.capacity_min || listing.capacity_max) && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Users className="w-4 h-4 text-gray-500" />
                <span>
                  <strong>សមត្ថភាព:</strong> {listing.capacity_min || 1} - {listing.capacity_max || '?'} នាក់
                </span>
              </div>
            )}

            {listing.duration_days && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Clock className="w-4 h-4 text-gray-500" />
                <span>
                  <strong>រយៈពេល:</strong> {listing.duration_days} ថ្ងៃ
                </span>
              </div>
            )}

            {listing.family_friendly && (
              <div className="flex items-center gap-2 text-sm text-pink-600">
                <Baby className="w-4 h-4" />
                <span className="font-semibold">សមស្របសម្រាប់គ្រួសារ</span>
              </div>
            )}
          </div>

          {listing.notes && (
            <div className="bg-gray-50 p-4 rounded-2xl border-2 border-gray-200">
              <p className="text-sm text-gray-700 leading-relaxed">
                {listing.notes}
              </p>
            </div>
          )}

          {/* Reference Link */}
          {listing.reference_link && (
            <a
              href={listing.reference_link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              មើលប្រភពទិន្នន័យ
            </a>
          )}

          {/* Action Button */}
          {listing.contact_phone && (
            <Button 
              onClick={handleCall}
              size="lg"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base rounded-2xl py-4 mt-2 transition-all active:scale-[0.98]"
            >
              <Phone className="w-5 h-5 mr-2" />
              ទូរស័ព្ទឥឡូវនេះ
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}