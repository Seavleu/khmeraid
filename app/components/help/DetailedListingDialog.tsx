'use client'

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { 
  Home, Fuel, HeartHandshake, MapPin, Users, Clock, 
  Phone, CheckCircle, AlertCircle, PauseCircle, XCircle,
  Baby, Car, Facebook, User, ShieldCheck, ExternalLink, Star, MessageCircle
} from 'lucide-react';

import type { LucideIcon } from 'lucide-react';

const typeConfig: Record<string, { icon: LucideIcon; label: string; color: string }> = {
  accommodation: { icon: Home, label: 'ស្នាក់នៅ', color: 'bg-blue-100 text-blue-700' },
  fuel_service: { icon: Fuel, label: 'សេវាសាំង', color: 'bg-amber-100 text-amber-700' },
  volunteer_request: { icon: HeartHandshake, label: 'ត្រូវការស្ម័គ្រចិត្ត', color: 'bg-purple-100 text-purple-700' },
  car_transportation: { icon: Car, label: 'ដឹកជញ្ជូន', color: 'bg-green-100 text-green-700' },
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 pr-8">
            {listing.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Image */}
          {listing.image_url && (
            <div className="w-full h-64 overflow-hidden rounded-xl bg-gray-100">
              <img 
                src={listing.image_url} 
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Badges */}
          <div className="flex flex-wrap gap-3">
            <Badge className={`${type.color} text-base font-bold px-4 py-2`}>
              <TypeIcon className="w-5 h-5 mr-2" />
              {type.label}
            </Badge>
            <Badge className={`${status.color} text-base font-bold px-4 py-2`}>
              <StatusIcon className="w-5 h-5 mr-2" />
              {status.label}
            </Badge>
            {listing.verified && (
              <Badge className="bg-emerald-600 text-white text-base font-bold px-4 py-2">
                <ShieldCheck className="w-5 h-5 mr-2" />
                បានផ្ទៀងផ្ទាត់
              </Badge>
            )}
            {listing.family_friendly && (
              <Badge className="bg-pink-100 text-pink-700 text-base font-bold px-4 py-2">
                <Baby className="w-5 h-5 mr-2" />
                គ្រួសារ
              </Badge>
            )}
          </div>

          {/* Event Details */}
          {listing.type === 'event' && (
            <div className="space-y-4 bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-6 border-3 border-pink-200">
              <h3 className="text-2xl font-bold text-pink-900 flex items-center gap-3">
                📅 ព័ត៌មានព្រឹត្តិការណ៍
              </h3>
              
              {listing.event_date && (
                <div className="bg-white rounded-xl p-5 border-2 border-pink-300">
                  <p className="text-sm text-pink-700 font-semibold mb-2">កាលបរិច្ឆេទ</p>
                  <p className="text-3xl font-bold text-pink-900">
                    {new Date(listing.event_date).toLocaleDateString('km-KH', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                  {listing.event_time && (
                    <p className="text-2xl font-bold text-pink-800 mt-3">
                      ម៉ោង: {listing.event_time}
                    </p>
                  )}
                  {listing.event_end_date && (
                    <p className="text-lg font-semibold text-pink-700 mt-2">
                      រហូតដល់: {new Date(listing.event_end_date).toLocaleDateString('km-KH')}
                    </p>
                  )}
                </div>
              )}

              {listing.organizer_name && (
                <div className="bg-white rounded-xl p-5 border-2 border-pink-300">
                  <div className="flex items-center gap-3 mb-2">
                    <User className="w-7 h-7 text-pink-700" />
                    <p className="text-sm text-pink-700 font-semibold">អ្នករៀបចំព្រឹត្តិការណ៍</p>
                  </div>
                  <p className="text-2xl font-bold text-pink-900">{listing.organizer_name}</p>
                </div>
              )}

              {listing.organizer_contact && (
                <div className="bg-white rounded-xl p-5 border-2 border-pink-300">
                  <div className="flex items-center gap-3 mb-2">
                    <Phone className="w-7 h-7 text-pink-700" />
                    <p className="text-sm text-pink-700 font-semibold">ទំនាក់ទំនងអ្នករៀបចំ</p>
                  </div>
                  <p className="text-3xl font-bold text-pink-900 mb-4">{listing.organizer_contact}</p>
                  <Button 
                    onClick={() => window.location.href = `tel:${listing.organizer_contact.replace(/[^0-9+]/g, '')}`}
                    size="lg"
                    className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold text-xl py-7"
                  >
                    <Phone className="w-7 h-7 mr-3" />
                    ទាក់ទងអ្នករៀបចំ
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Contact Phone - Prominent */}
          {listing.contact_phone && (
            <div className="bg-emerald-50 rounded-xl p-5 border-3 border-emerald-300">
              <div className="flex items-center gap-3 mb-2">
                <Phone className="w-7 h-7 text-emerald-700" />
                <p className="text-lg text-emerald-700 font-bold">លេខទូរស័ព្ទ</p>
              </div>
              <p className="text-3xl font-bold text-emerald-800 mb-4">{listing.contact_phone}</p>
              <Button 
                onClick={handleCall}
                size="lg"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xl py-7"
              >
                <Phone className="w-7 h-7 mr-3" />
                ទូរស័ព្ទឥឡូវនេះ
              </Button>
            </div>
          )}

          {/* Location */}
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-gray-900">📍 ទីតាំង</h3>
            
            {listing.area && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-600 font-semibold mb-1">តំបន់/ក្រុង</p>
                <p className="text-2xl font-bold text-gray-900">{listing.area}</p>
              </div>
            )}

            {listing.exact_location && listing.location_consent && (
              <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                <p className="text-sm text-blue-700 font-semibold mb-1">ទីតាំងពិតប្រាកដ</p>
                <p className="text-lg text-blue-900 font-medium">{listing.exact_location}</p>
              </div>
            )}

            {!listing.latitude || !listing.longitude ? (
              <div className="bg-amber-50 rounded-xl p-4 border-2 border-amber-200">
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
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <User className="w-6 h-6 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600 font-semibold">អ្នកទំនាក់ទំនង</p>
                  <p className="text-xl font-bold text-gray-900">{listing.contact_name}</p>
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
              className="flex items-center gap-4 bg-blue-50 border-2 border-blue-200 p-4 rounded-xl hover:bg-blue-100 transition-all"
            >
              <Facebook className="w-7 h-7 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600 font-semibold">ហ្វេសប៊ុក</p>
                <p className="text-lg font-bold text-blue-700">ផ្ញើសារតាម Facebook</p>
              </div>
            </a>
          )}

          {/* Opening Hours */}
          {listing.opening_hours && (
            <div className="bg-indigo-50 rounded-xl p-4 border-2 border-indigo-200">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-indigo-600" />
                <div>
                  <p className="text-sm text-indigo-600 font-semibold">ម៉ោងបើក</p>
                  <p className="text-xl font-bold text-indigo-900">{listing.opening_hours}</p>
                </div>
              </div>
            </div>
          )}

          {/* Capacity & Duration */}
          {(listing.capacity_min || listing.capacity_max || listing.duration_days) && (
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-gray-900">ℹ️ ព័ត៌មានលម្អិត</h3>
              
              {(listing.capacity_min || listing.capacity_max) && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <Users className="w-6 h-6 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-600 font-semibold">សមត្ថភាព</p>
                      <p className="text-xl font-bold text-gray-900">
                        {listing.capacity_min || 1} - {listing.capacity_max || '?'} នាក់
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {listing.duration_days && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <Clock className="w-6 h-6 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-600 font-semibold">រយៈពេល</p>
                      <p className="text-xl font-bold text-gray-900">{listing.duration_days} ថ្ងៃ</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Services Offered */}
          {listing.services_offered && listing.services_offered.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-gray-900">✓ សេវាកម្មផ្តល់ជូន</h3>
              <div className="flex flex-wrap gap-2">
                {listing.services_offered?.map((service: string, idx: number) => (
                  <Badge key={idx} className="bg-green-50 text-green-700 border-2 border-green-200 text-base px-4 py-2 font-semibold">
                    {service}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Rating */}
          {listing.average_rating > 0 && (
            <div className="bg-amber-50 rounded-xl p-4 border-2 border-amber-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i}
                      className={`w-6 h-6 ${i < Math.floor(listing.average_rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 text-lg text-gray-600">
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-bold">{listing.review_count || 0}</span>
                </div>
              </div>
              <p className="text-2xl font-bold text-amber-800">
                {listing.average_rating.toFixed(1)} / 5.0
              </p>
            </div>
          )}

          {/* Notes */}
          {listing.notes && (
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-gray-900">📝 កំណត់ចំណាំ</h3>
              <div className="bg-yellow-50 rounded-xl p-5 border-2 border-yellow-200">
                <p className="text-lg text-gray-800 leading-relaxed font-medium">
                  {listing.notes}
                </p>
              </div>
            </div>
          )}

          {/* Reference Link */}
          {listing.reference_link && (
            <a
              href={listing.reference_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-blue-600 hover:text-blue-800 text-lg font-bold"
            >
              <ExternalLink className="w-6 h-6" />
              មើលប្រភពទិន្នន័យ
            </a>
          )}

          {/* Google Maps Link */}
          {listing.latitude && listing.longitude && (
            <Button
              variant="outline"
              size="lg"
              className="w-full text-lg font-bold py-6"
              onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${listing.latitude},${listing.longitude}`, '_blank')}
            >
              <ExternalLink className="w-6 h-6 mr-2" />
              មើលក្នុង Google Maps
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}