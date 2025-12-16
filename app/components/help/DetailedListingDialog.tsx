'use client'

import React from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { 
  Home, Fuel, HeartHandshake, MapPin, Clock, 
  Phone, CheckCircle, AlertCircle, PauseCircle, XCircle,
  Baby, Car, Facebook, User, ShieldCheck, ExternalLink,
  Stethoscope, Clock as ClockIcon, CreditCard, Navigation, Link as LinkIcon
} from 'lucide-react';

import type { LucideIcon } from 'lucide-react';

const typeConfig: Record<string, { icon: LucideIcon; label: string; color: string }> = {
  accommodation: { icon: Home, label: 'ស្នាក់នៅ', color: 'bg-blue-100 text-blue-700' },
  fuel_service: { icon: Fuel, label: 'សេវាសាំង', color: 'bg-amber-100 text-amber-700' },
  volunteer_request: { icon: HeartHandshake, label: 'ត្រូវការស្ម័គ្រចិត្ត', color: 'bg-purple-100 text-purple-700' },
  car_transportation: { icon: Car, label: 'ដឹកជញ្ជូន', color: 'bg-green-100 text-green-700' },
  medical_care: { icon: Stethoscope, label: 'សេវាសុខាភិបាល', color: 'bg-red-100 text-red-700' },
  site_sponsor: { icon: MapPin, label: 'ទីតាំងហ្រ្វី', color: 'bg-indigo-100 text-indigo-700' },
  school: { icon: Home, label: 'សាលារៀន', color: 'bg-teal-100 text-teal-700' },
  event: { icon: Clock, label: 'ព្រឹត្តិការណ៍', color: 'bg-pink-100 text-pink-700' }
};

const statusConfig: Record<string, { icon: LucideIcon; label: string; color: string }> = {
  open: { icon: CheckCircle, label: 'បើក', color: 'bg-emerald-100 text-emerald-700' },
  limited: { icon: AlertCircle, label: 'មានកំណត់', color: 'bg-amber-100 text-amber-700' },
  full: { icon: XCircle, label: 'ពេញ', color: 'bg-red-100 text-red-700' },
  paused: { icon: PauseCircle, label: 'ផ្អាក', color: 'bg-gray-100 text-gray-700' }
};

interface Listing {
  id: string;
  title: string;
  type: string;
  status: string;
  area?: string;
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
  verified?: boolean;
  [key: string]: any;
}

interface DetailedListingDialogProps {
  listing: Listing | null;
  open: boolean;
  onClose: () => void;
}

export default function DetailedListingDialog({ listing, open, onClose }: DetailedListingDialogProps) {
  if (!listing) return null;

  const type = typeConfig[listing.type] || typeConfig.accommodation;
  const status = statusConfig[listing.status] || statusConfig.open;
  const TypeIcon = type.icon;
  const StatusIcon = status.icon;

  const handleCall = () => {
    const phone = listing.contact_phone || '+1-800-HELP-NOW';
    window.location.href = `tel:${phone.replace(/[^0-9+]/g, '')}`;
  };

  const getDirectionsUrl = () => {
    if (listing.latitude && listing.longitude) {
      return `https://www.google.com/maps/dir/?api=1&destination=${listing.latitude},${listing.longitude}`;
    }
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-3 sm:p-6">
        <DialogHeader className="pb-2 sm:pb-4">
          <DialogTitle className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900 pr-6 sm:pr-8">
            {listing.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4 lg:space-y-6 py-2 sm:py-4">
          {/* Image */}
          {listing.image_url && (
            <div className="relative w-full h-32 sm:h-48 lg:h-64 overflow-hidden rounded-lg sm:rounded-xl lg:rounded-2xl bg-gray-100 border border-gray-200 sm:border-2">
              <Image 
                src={listing.image_url} 
                alt={listing.title}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}

          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <Badge className={`${type.color} text-[10px] sm:text-xs lg:text-sm font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl lg:rounded-2xl`}>
              <TypeIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 mr-1 sm:mr-1.5" />
              {type.label}
            </Badge>
            <Badge className={`${status.color} text-[10px] sm:text-xs lg:text-sm font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl lg:rounded-2xl`}>
              <StatusIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 mr-1 sm:mr-1.5" />
              {status.label}
            </Badge>
            {listing.verified && (
              <Badge className="bg-emerald-600 text-white text-[10px] sm:text-xs lg:text-sm font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl lg:rounded-2xl">
                <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 mr-1 sm:mr-1.5" />
                បានផ្ទៀងផ្ទាត់
              </Badge>
            )}
            {listing.family_friendly && (
              <Badge className="bg-pink-100 text-pink-700 text-[10px] sm:text-xs lg:text-sm font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl lg:rounded-2xl">
                <Baby className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 mr-1 sm:mr-1.5" />
                គ្រួសារ
              </Badge>
            )}
          </div>

          {/* Event Details */}
          {listing.type === 'event' && (
            <div className="space-y-2 bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg sm:rounded-xl lg:rounded-2xl p-2.5 sm:p-3 lg:p-4 border border-pink-200 sm:border-2">
              <h3 className="text-sm sm:text-base lg:text-lg font-bold text-pink-900 flex items-center gap-1.5 sm:gap-2">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                ព័ត៌មានព្រឹត្តិការណ៍
              </h3>
              
              {listing.event_date && (
                <div className="bg-white/95 backdrop-blur-sm rounded-lg sm:rounded-xl lg:rounded-2xl p-2.5 sm:p-3 lg:p-4 border border-pink-200 sm:border-2">
                  <p className="text-[10px] sm:text-xs text-pink-700 font-medium mb-0.5 sm:mb-1">កាលបរិច្ឆេទ</p>
                  <p className="text-xs sm:text-sm lg:text-base font-bold text-pink-900">
                    {new Date(listing.event_date).toLocaleDateString('km-KH', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                  {listing.event_time && (
                    <p className="text-[10px] sm:text-xs lg:text-sm font-bold text-pink-800 mt-0.5 sm:mt-1">
                      ម៉ោង: {listing.event_time}
                    </p>
                  )}
                  {listing.event_end_date && (
                    <p className="text-[10px] sm:text-xs font-semibold text-pink-700 mt-0.5 sm:mt-1">
                      រហូតដល់: {new Date(listing.event_end_date).toLocaleDateString('km-KH')}
                    </p>
                  )}
                </div>
              )}

              {listing.organizer_name && (
                <div className="bg-white/95 backdrop-blur-sm rounded-lg sm:rounded-xl lg:rounded-2xl p-2.5 sm:p-3 lg:p-4 border border-pink-200 sm:border-2">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                    <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-700" />
                    <p className="text-[10px] sm:text-xs text-pink-700 font-medium">អ្នករៀបចំព្រឹត្តិការណ៍</p>
                  </div>
                  <p className="text-xs sm:text-sm lg:text-base font-bold text-pink-900">{listing.organizer_name}</p>
                </div>
              )}

              {listing.organizer_contact && (
                <div className="bg-white/95 backdrop-blur-sm rounded-lg sm:rounded-xl lg:rounded-2xl p-2.5 sm:p-3 lg:p-4 border border-pink-200 sm:border-2">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                    <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-700" />
                    <p className="text-[10px] sm:text-xs text-pink-700 font-medium">ទំនាក់ទំនងអ្នករៀបចំ</p>
                  </div>
                  <p className="text-sm sm:text-base lg:text-lg font-bold text-pink-900 mb-1.5 sm:mb-2">{listing.organizer_contact}</p>
                  <Button 
                    onClick={() => window.location.href = `tel:${listing.organizer_contact.replace(/[^0-9+]/g, '')}`}
                    size="sm"
                    className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs sm:text-sm lg:text-base py-2 sm:py-3 lg:py-4 h-8 sm:h-10 lg:h-12 rounded-lg sm:rounded-xl lg:rounded-2xl"
                  >
                    <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 mr-1.5 sm:mr-2" />
                    ទាក់ទងអ្នករៀបចំ
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Contact Phone - Prominent */}
          {listing.contact_phone && (
            <div className="bg-emerald-50 rounded-lg sm:rounded-xl lg:rounded-2xl p-2.5 sm:p-3 lg:p-4 border border-emerald-200 sm:border-2">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-700" />
                <p className="text-[10px] sm:text-xs text-emerald-700 font-medium">លេខទូរស័ព្ទ</p>
              </div>
              <p className="text-sm sm:text-base lg:text-lg font-bold text-emerald-800 mb-1.5 sm:mb-2">{listing.contact_phone}</p>
              <Button 
                onClick={handleCall}
                size="sm"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm lg:text-base py-2 sm:py-3 lg:py-4 rounded-lg sm:rounded-xl lg:rounded-2xl h-8 sm:h-10 lg:h-12"
              >
                <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 mr-1.5 sm:mr-2" />
                ទូរស័ព្ទឥឡូវនេះ
              </Button>
            </div>
          )}

          {/* Location */}
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              ទីតាំង
            </h3>
            
            {listing.area && (
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-sm text-gray-600 font-semibold mb-1">តំបន់/ក្រុង</p>
                <p className="text-2xl font-bold text-gray-900">{listing.area}</p>
              </div>
            )}

            {listing.exact_location && listing.location_consent && (
              <div className="bg-blue-50 rounded-2xl p-4 border-2 border-blue-200">
                <p className="text-sm text-blue-700 font-semibold mb-1">ទីតាំងពិតប្រាកដ</p>
                <p className="text-lg text-blue-900 font-medium">{listing.exact_location}</p>
              </div>
            )}

            {!listing.latitude || !listing.longitude ? (
              <div className="bg-amber-50 rounded-2xl p-4 border-2 border-amber-200">
                <p className="text-base text-amber-800 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  គ្មានពិกូអរទិន្នន័យលើផែនទី - សូមទាក់ទងតាមទូរស័ព្ទ
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Coordinates: {listing.latitude.toFixed(6)}, {listing.longitude.toFixed(6)}
              </p>
            )}
          </div>

          {/* Contact Details */}
          {listing.contact_name && (
            <div className="bg-gray-50 rounded-lg sm:rounded-xl lg:rounded-2xl p-2.5 sm:p-3 lg:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <User className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-gray-600 flex-shrink-0" />
                <div>
                  <p className="text-[10px] sm:text-xs lg:text-sm text-gray-600 font-semibold">អ្នកទំនាក់ទំនង</p>
                  <p className="text-sm sm:text-base lg:text-xl font-bold text-gray-900">{listing.contact_name}</p>
                </div>
              </div>
            </div>
          )}

          {/* Facebook */}
          {listing.facebook_contact && (
            <a
              href={listing.facebook_contact.startsWith('http') ? listing.facebook_contact : `https://facebook.com/${listing.facebook_contact}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 sm:gap-3 lg:gap-4 bg-blue-50 border border-blue-200 sm:border-2 p-2.5 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl lg:rounded-2xl hover:bg-blue-100 transition-all"
            >
              <Facebook className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-blue-600 flex-shrink-0" />
              <div>
                <p className="text-[10px] sm:text-xs lg:text-sm text-blue-600 font-semibold">ហ្វេសប៊ុក</p>
                <p className="text-xs sm:text-sm lg:text-lg font-bold text-blue-700">ផ្ញើសារតាម Facebook</p>
              </div>
            </a>
          )}

          {/* Opening Hours */}
          {listing.opening_hours && (
            <div className="bg-indigo-50 rounded-lg sm:rounded-xl lg:rounded-2xl p-2.5 sm:p-3 lg:p-4 border border-indigo-200 sm:border-2">
              <div className="flex items-center gap-2 sm:gap-3">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-indigo-600 flex-shrink-0" />
                <div>
                  <p className="text-[10px] sm:text-xs lg:text-sm text-indigo-600 font-semibold">ម៉ោងបើក</p>
                  <p className="text-sm sm:text-base lg:text-xl font-bold text-indigo-900">{listing.opening_hours}</p>
                </div>
              </div>
            </div>
          )}


          {/* Medical Care Details */}
          {listing.type === 'medical_care' && (
            <div className="space-y-2 sm:space-y-3">
              <h3 className="text-sm sm:text-base lg:text-xl font-bold text-gray-900 flex items-center gap-1.5 sm:gap-2">
                <Stethoscope className="w-4 h-4 sm:w-5 sm:h-5" />
                ព័ត៌មានសេវាសុខាភិបាល
              </h3>
              
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {listing.emergency_services && (
                  <div className="bg-red-50 rounded-lg sm:rounded-xl lg:rounded-2xl p-2 sm:p-3 lg:p-4 border border-red-200 sm:border-2">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                      <p className="text-[10px] sm:text-xs lg:text-sm text-red-700 font-semibold">សេវាសង្គ្រោះបន្ទាន់</p>
                    </div>
                    <p className="text-xs sm:text-sm lg:text-lg font-bold text-red-900">មាន</p>
                  </div>
                )}
                
                {listing.hours_24 && (
                  <div className="bg-green-50 rounded-lg sm:rounded-xl lg:rounded-2xl p-2 sm:p-3 lg:p-4 border border-green-200 sm:border-2">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                      <ClockIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                      <p className="text-[10px] sm:text-xs lg:text-sm text-green-700 font-semibold">ម៉ោងបើក</p>
                    </div>
                    <p className="text-xs sm:text-sm lg:text-lg font-bold text-green-900">24/7</p>
                  </div>
                )}
                
                {listing.insurance_accepted && (
                  <div className="bg-emerald-50 rounded-lg sm:rounded-xl lg:rounded-2xl p-2 sm:p-3 lg:p-4 border border-emerald-200 sm:border-2">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                      <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                      <p className="text-[10px] sm:text-xs lg:text-sm text-emerald-700 font-semibold">ធានារ៉ាប់រង</p>
                    </div>
                    <p className="text-xs sm:text-sm lg:text-lg font-bold text-emerald-900">ទទួលយក</p>
                  </div>
                )}
              </div>

              {listing.medical_specialties && listing.medical_specialties.length > 0 && (
                <div className="bg-red-50 rounded-lg sm:rounded-xl lg:rounded-2xl p-2.5 sm:p-3 lg:p-4 border border-red-200 sm:border-2">
                  <p className="text-[10px] sm:text-xs lg:text-sm text-red-700 font-semibold mb-1.5 sm:mb-2">ជំនាញពេទ្យ</p>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {listing.medical_specialties.map((specialty: string, idx: number) => (
                      <Badge key={idx} className="bg-red-100 text-red-700 border border-red-300 sm:border-2 text-[10px] sm:text-xs lg:text-sm px-2 sm:px-3 py-0.5 sm:py-1 font-semibold">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}


          {/* Notes */}
          {listing.notes && (
            <div className="space-y-2 sm:space-y-3">
              <h3 className="text-sm sm:text-base lg:text-xl font-bold text-gray-900">📝 កំណត់ចំណាំ</h3>
              <div className="bg-yellow-50 rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-5 border border-yellow-200 sm:border-2">
                <p className="text-xs sm:text-sm lg:text-lg text-gray-800 leading-relaxed font-medium">
                  {listing.notes}
                </p>
              </div>
            </div>
          )}

          {/* Directions & Maps */}
          {listing.latitude && listing.longitude && (
            <div className="space-y-2 sm:space-y-3">
              <h3 className="text-sm sm:text-base lg:text-xl font-bold text-gray-900 flex items-center gap-1.5 sm:gap-2">
                <Navigation className="w-4 h-4 sm:w-5 sm:h-5" />
                ទិសដៅ
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {getDirectionsUrl() && (
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm lg:text-base py-2 sm:py-3 lg:py-4 h-8 sm:h-10 lg:h-12 rounded-lg sm:rounded-xl lg:rounded-2xl"
                    onClick={() => window.open(getDirectionsUrl()!, '_blank')}
                  >
                    <Navigation className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 mr-1.5 sm:mr-2" />
                    ទិសដៅ
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs sm:text-sm lg:text-base font-bold py-2 sm:py-3 lg:py-4 h-8 sm:h-10 lg:h-12 rounded-lg sm:rounded-xl lg:rounded-2xl"
                  onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${listing.latitude},${listing.longitude}`, '_blank')}
                >
                  <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 mr-1.5 sm:mr-2" />
                  មើលក្នុង Google Maps
                </Button>
              </div>
            </div>
          )}

          {/* Reference Link */}
          {listing.reference_link && (
            <div className="space-y-2 sm:space-y-3">
              <h3 className="text-sm sm:text-base lg:text-xl font-bold text-gray-900 flex items-center gap-1.5 sm:gap-2">
                <LinkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                ប្រភពទិន្នន័យ
              </h3>
              <a
                href={listing.reference_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 sm:gap-3 bg-blue-50 border border-blue-200 sm:border-2 p-2.5 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl lg:rounded-2xl hover:bg-blue-100 transition-all"
              >
                <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs lg:text-sm text-blue-600 font-semibold">មើលប្រភពទិន្នន័យ</p>
                  <p className="text-xs sm:text-sm lg:text-base text-blue-700 font-medium truncate">{listing.reference_link}</p>
                </div>
              </a>
            </div>
          )}

          {/* Google Maps Link (if no coordinates but has link) */}
          {listing.google_maps_link && !listing.latitude && (
            <div className="space-y-2 sm:space-y-3">
              <h3 className="text-sm sm:text-base lg:text-xl font-bold text-gray-900 flex items-center gap-1.5 sm:gap-2">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                ទីតាំង
              </h3>
              <a
                href={listing.google_maps_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 sm:gap-3 bg-green-50 border border-green-200 sm:border-2 p-2.5 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl lg:rounded-2xl hover:bg-green-100 transition-all"
              >
                <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-green-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs lg:text-sm text-green-600 font-semibold">មើលក្នុង Google Maps</p>
                  <p className="text-xs sm:text-sm lg:text-base text-green-700 font-medium truncate">{listing.google_maps_link}</p>
                </div>
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}