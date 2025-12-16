'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Checkbox } from '@/app/components/ui/checkbox';
import { 
  Home, Fuel, HeartHandshake, MapPin, Users, Clock, 
  Phone, Shield, Send, Loader2, CheckCircle, Car,
  Facebook, Stethoscope, X
} from 'lucide-react';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

// Declare global types for Google Maps Extended Component Library
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'gmpx-api-loader': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        'solution-channel'?: string;
      }, HTMLElement>;
      'gmp-map': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        center?: string;
        zoom?: string;
        'map-id'?: string;
      }, HTMLElement & { innerMap?: google.maps.Map }>;
      'gmp-advanced-marker': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        position?: google.maps.LatLng | null;
      }, HTMLElement>;
      'gmpx-place-picker': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        placeholder?: string;
      }, HTMLElement & { value?: any }>;
    }
  }
}

const defaultCenter = {
  lat: 11.5564,
  lng: 104.9282
};

interface SubmitListingFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const typeOptions = [
  { value: 'accommodation', label: 'ស្នាក់នៅ / ទីជម្រក', icon: Home, description: 'ផ្តល់កន្លែងស្នាក់នៅ' },
  { value: 'fuel_service', label: 'សេវាសាំង', icon: Fuel, description: 'ស្ថានីយសាំង ឬការដឹកជញ្ជូន' },
  { value: 'car_transportation', label: 'ដឹកជញ្ជូន', icon: Car, description: 'ផ្តល់សេវាដឹកជញ្ជូន' },
  { value: 'volunteer_request', label: 'ត្រូវការស្ម័គ្រចិត្ត', icon: HeartHandshake, description: 'ត្រូវការជំនួយស្ម័គ្រចិត្ត' },
  { value: 'medical_care', label: 'សេវាសុខាភិបាល', icon: Stethoscope, description: 'មន្ទីរពេទ្យ, ស្ថានីយ៍ពេទ្យ, ឱសថស្ថាន' }
];

export default function SubmitListingForm({ onSuccess, onCancel }: SubmitListingFormProps) {
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [showMapPicker, setShowMapPicker] = useState<boolean>(false);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    area: '',
    exact_location: '',
    location_consent: false,
    latitude: null as number | null,
    longitude: null as number | null,
    capacity_min: '',
    capacity_max: '',
    status: 'open',
    family_friendly: false,
    // Accessibility fields
    wheelchair_accessible: false,
    accessible_parking: false,
    accessible_restrooms: false,
    accessible_entrance: false,
    elevator_available: false,
    ramp_available: false,
    sign_language_available: false,
    braille_available: false,
    hearing_loop_available: false,
    // Medical care fields
    medical_specialties: [] as string[],
    emergency_services: false,
    hours_24: false,
    insurance_accepted: false,
    notes: '',
    contact_name: '',
    contact_phone: '',
    facebook_contact: '',
    image_url: '',
    reference_link: '',
    google_maps_link: '',
    duration_days: '',
    opening_hours: '',
    services_offered: [] as string[],
    average_rating: '',
    review_count: '',
    event_date: '',
    event_time: '',
    event_end_date: '',
    organizer_name: '',
    organizer_contact: ''
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Create marker function
  const createMarker = useCallback((lat: number, lng: number, map: google.maps.Map) => {
    if (markerRef.current) {
      markerRef.current.map = null;
    }
    
    const marker = new google.maps.marker.AdvancedMarkerElement({
      map,
      position: { lat, lng },
      title: 'Selected Location',
      gmpDraggable: true
    });

    // Add drag end listener to update position
    marker.addListener('dragend', (e: any) => {
      const position = e.latLng || (e.target?.position || marker.position);
      if (position) {
        let newLat: number, newLng: number;
        if (typeof position.lat === 'function') {
          newLat = position.lat();
          newLng = position.lng();
        } else {
          newLat = position.lat;
          newLng = position.lng;
        }
        
        setFormData(prev => ({ ...prev, latitude: newLat, longitude: newLng }));

        // Reverse geocode to get address
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: { lat: newLat, lng: newLng } }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            setFormData(prev => ({ ...prev, exact_location: results[0].formatted_address }));
          }
        });
      }
    });
    
    markerRef.current = marker;
  }, []);

  // Initialize map when map picker is shown
  useEffect(() => {
    if (!showMapPicker || !GOOGLE_MAPS_API_KEY || step !== 3) return;

    const initMap = async () => {
      try {
        // Wait for custom elements to be defined
        await customElements.whenDefined('gmpx-api-loader');
        await customElements.whenDefined('gmp-map');
        await customElements.whenDefined('gmp-advanced-marker');
        await customElements.whenDefined('gmpx-place-picker');

        // Set API key on loader
        const loader = document.querySelector('#form-map-loader') as any;
        if (loader) {
          loader.setAttribute('key', GOOGLE_MAPS_API_KEY);
          try {
            loader.key = GOOGLE_MAPS_API_KEY;
          } catch (e) {
            // Ignore
          }
        }

        // Wait for Google Maps API to load
        let retries = 0;
        while (!window.google?.maps && retries < 30) {
          await new Promise(resolve => setTimeout(resolve, 200));
          retries++;
        }

        if (!window.google?.maps) {
          console.error('Google Maps API failed to load');
          return;
        }

        const mapElement = document.querySelector('#form-location-map') as any;
        if (!mapElement) return;

        // Wait for innerMap to be available
        let mapRetries = 0;
        while (!mapElement.innerMap && mapRetries < 50) {
          await new Promise(resolve => setTimeout(resolve, 100));
          mapRetries++;
        }

        if (!mapElement.innerMap) {
          console.error('Map failed to initialize');
          return;
        }

        mapRef.current = mapElement.innerMap;

        // Set map options
        mapElement.innerMap.setOptions({
          mapTypeControl: false,
          fullscreenControl: true,
          zoomControl: true,
          streetViewControl: false,
        });

        // Center map on existing location or default
        const center = formData.latitude && formData.longitude
          ? { lat: formData.latitude, lng: formData.longitude }
          : defaultCenter;
        
        mapElement.innerMap.setCenter(center);
        mapElement.innerMap.setZoom(formData.latitude && formData.longitude ? 15 : 11);

        // Create marker if location exists
        if (formData.latitude && formData.longitude) {
          createMarker(formData.latitude, formData.longitude, mapElement.innerMap);
        }

        // Add click listener to map
        mapElement.innerMap.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            
            // Update form data
            handleChange('latitude', lat);
            handleChange('longitude', lng);
            
            // Update marker
            if (markerRef.current) {
              markerRef.current.position = { lat, lng };
              mapElement.innerMap.panTo({ lat, lng });
            } else {
              createMarker(lat, lng, mapElement.innerMap);
            }

            // Reverse geocode to get address
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
              if (status === 'OK' && results && results[0]) {
                handleChange('exact_location', results[0].formatted_address);
              }
            });
          }
        });

        // Setup place picker
        setTimeout(() => {
          const placePickerElement = document.querySelector('#form-place-picker') as any;
          if (placePickerElement) {
            const handlePlaceChange = () => {
              const place = placePickerElement.value;
              
              if (!place?.location) return;

              const lat = place.location.lat();
              const lng = place.location.lng();
              
              // Update form data
              handleChange('latitude', lat);
              handleChange('longitude', lng);
              handleChange('exact_location', place.formattedAddress || place.name || formData.exact_location);

              // Update marker
              if (markerRef.current) {
                markerRef.current.position = { lat, lng };
              } else {
                createMarker(lat, lng, mapElement.innerMap);
              }

              // Center map on new location
              if (place.viewport) {
                mapElement.innerMap.fitBounds(place.viewport);
              } else {
                mapElement.innerMap.panTo({ lat, lng });
                mapElement.innerMap.setZoom(15);
              }
            };

            placePickerElement.addEventListener('gmpx-placechange', handlePlaceChange);
          }
        }, 500);

        setIsMapInitialized(true);
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    initMap();
  }, [showMapPicker, step, formData.latitude, formData.longitude, createMarker]);

  // Cleanup marker when map picker closes
  useEffect(() => {
    if (!showMapPicker && markerRef.current) {
      markerRef.current.map = null;
      markerRef.current = null;
      setIsMapInitialized(false);
    }
  }, [showMapPicker]);

  const handleSubmit = async () => {
    setLoading(true);
    
      // Ensure all required fields are properly set
      // Ensure all required fields are properly set
      const listingData = {
      title: formData.title.trim(),
      type: formData.type.trim(),
      area: formData.area.trim(),
      exact_location: formData.exact_location?.trim() || null,
      location_consent: Boolean(formData.location_consent),
      latitude: formData.latitude || null,
      longitude: formData.longitude || null,
      capacity_min: formData.capacity_min ? parseInt(formData.capacity_min) : null,
      capacity_max: formData.capacity_max ? parseInt(formData.capacity_max) : null,
      duration_days: formData.duration_days ? parseInt(formData.duration_days) : null,
      status: formData.status || 'open',
      family_friendly: Boolean(formData.family_friendly),
      wheelchair_accessible: Boolean(formData.wheelchair_accessible),
      accessible_parking: Boolean(formData.accessible_parking),
      accessible_restrooms: Boolean(formData.accessible_restrooms),
      accessible_entrance: Boolean(formData.accessible_entrance),
      elevator_available: Boolean(formData.elevator_available),
      ramp_available: Boolean(formData.ramp_available),
      sign_language_available: Boolean(formData.sign_language_available),
      braille_available: Boolean(formData.braille_available),
      hearing_loop_available: Boolean(formData.hearing_loop_available),
      medical_specialties: Array.isArray(formData.medical_specialties) ? formData.medical_specialties : [],
      emergency_services: Boolean(formData.emergency_services),
      hours_24: Boolean(formData.hours_24),
      insurance_accepted: Boolean(formData.insurance_accepted),
      notes: formData.notes?.trim() || null,
      contact_name: formData.contact_name?.trim() || null,
      contact_phone: formData.contact_phone?.trim() || null,
      facebook_contact: formData.facebook_contact?.trim() || null,
      image_url: formData.image_url?.trim() || null,
      reference_link: formData.reference_link?.trim() || null,
      google_maps_link: formData.google_maps_link?.trim() || null,
      verified: false,
      expires_at: formData.duration_days 
        ? new Date(Date.now() + parseInt(formData.duration_days) * 24 * 60 * 60 * 1000).toISOString()
        : null,
      opening_hours: formData.opening_hours?.trim() || null,
      services_offered: Array.isArray(formData.services_offered) ? formData.services_offered : [],
      average_rating: formData.average_rating ? parseFloat(formData.average_rating) : null,
      review_count: formData.review_count ? parseInt(formData.review_count) : 0,
      event_date: formData.event_date || null,
      event_time: formData.event_time?.trim() || null,
      event_end_date: formData.event_end_date || null,
      organizer_name: formData.organizer_name?.trim() || null,
      organizer_contact: formData.organizer_contact?.trim() || null,
    };

    try {
      // Validate required fields before submitting
      if (!formData.title || formData.title.trim() === '') {
        alert('សូមបំពេញចំណងជើង (Title is required)');
        setLoading(false);
        return;
      }
      if (!formData.type || formData.type.trim() === '') {
        alert('សូមជ្រើសរើសប្រភេទជំនួយ (Type is required)');
        setLoading(false);
        return;
      }
      if (!formData.area || formData.area.trim() === '') {
        alert('សូមបំពេញតំបន់ (Area is required)');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(listingData),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || `Failed to create listing (${res.status})`;
        
        // Log full error details for debugging
        console.error('Failed to submit listing:', {
          status: res.status,
          errorMessage,
          errorData,
          submittedData: listingData
        });
        
        // Show user-friendly error message
        let userMessage = errorMessage;
        if (errorData.details?.code === '23505') { // Unique violation
          userMessage = 'ព័ត៌មាននេះមានរួចហើយ (This information already exists)';
        } else if (errorData.details?.code === '23502') { // Not null violation
          userMessage = 'សូមបំពេញព័ត៌មានដែលត្រូវការ (Please fill in required information)';
        } else if (res.status === 400) {
          userMessage = errorData.message || 'ព័ត៌មានមិនត្រឹមត្រូវ (Invalid information)';
        } else if (res.status === 500) {
          userMessage = 'មានបញ្ហានៅលើម៉ាស៊ីនមេ (Server error). សូមព្យាយាមម្តងទៀត។';
        }
        
        alert(`មានបញ្ហា: ${userMessage}`);
        throw new Error(errorMessage);
      }
      
      const result = await res.json();
      setSubmitted(true);
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (error: any) {
      console.error('Failed to submit listing:', error);
      if (!error.message?.includes('មានបញ្ហា')) {
        alert(`មានបញ្ហាក្នុងការដាក់ស្នើ: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card className="border-0 shadow-xl">
        <CardContent className="p-8 text-center">
          <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">សូមអរគុណ!</h3>
          <p className="text-gray-600">
            ការផ្តល់ជំនួយរបស់អ្នកត្រូវបានដាក់ស្នើសម្រាប់ការពិនិត្យ។ ក្រុមរបស់យើងនឹងផ្ទៀងផ្ទាត់វាឆាប់ៗនេះ។
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white">
        <CardTitle className="flex items-center gap-2">
          <HeartHandshake className="w-6 h-6" />
          ផ្តល់ជំនួយ
        </CardTitle>
        <p className="text-teal-100 text-sm">
          ចែករំលែកធនធានរបស់អ្នកជាមួយអ្នកដែលត្រូវការ
        </p>
      </CardHeader>

      <CardContent className="p-6">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1">
              <div className={`h-2 rounded-full ${s <= step ? 'bg-teal-500' : 'bg-gray-200'}`} />
            </div>
          ))}
        </div>

        {/* Step 1: Type Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">តើអ្នកផ្តល់ជំនួយប្រភេទអ្វី?</h3>
            <div className="grid gap-3">
              {typeOptions.map(({ value, label, icon: Icon, description }) => (
                <div
                  key={value}
                  onClick={() => handleChange('type', value)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.type === value 
                      ? 'border-teal-500 bg-teal-50' 
                      : 'border-gray-200 hover:border-teal-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${formData.type === value ? 'bg-teal-100' : 'bg-gray-100'}`}>
                      <Icon className={`w-5 h-5 ${formData.type === value ? 'text-teal-600' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{label}</p>
                      <p className="text-sm text-gray-500">{description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button 
              onClick={() => setStep(2)} 
              disabled={!formData.type}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              បន្ត
            </Button>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">ប្រាប់យើងបន្ថែម</h3>
            
            <div className="space-y-2">
              <Label>ចំណងជើង / ឈ្មោះ *</Label>
              <Input 
                placeholder="ឧ. បន្ទប់ដែលមាននៅកណ្តាលទីក្រុង"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>តំបន់ / សង្កាត់ *</Label>
              <Input 
                placeholder="ឧ. កណ្តាលទីក្រុង, ខណ្ឌខាងជើង"
                value={formData.area}
                onChange={(e) => handleChange('area', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>សមត្ថភាពអប្បបរមា</Label>
                <Input 
                  type="number"
                  placeholder="1"
                  value={formData.capacity_min}
                  onChange={(e) => handleChange('capacity_min', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>សមត្ថភាពអតិបរមា</Label>
                <Input 
                  type="number"
                  placeholder="4"
                  value={formData.capacity_max}
                  onChange={(e) => handleChange('capacity_max', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>តើវាមានរយៈពេលប៉ុន្មាន? (ថ្ងៃ)</Label>
              <Input 
                type="number"
                placeholder="7"
                value={formData.duration_days}
                onChange={(e) => handleChange('duration_days', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>កំណត់ចំណាំបន្ថែម</Label>
              <Textarea 
                placeholder="តម្រូវការ, សេវាកម្ម, ឬការណែនាំពិសេស..."
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                className="h-24"
              />
            </div>

            <div className="space-y-2">
              <Label>តំណភ្ជាប់រូបភាព (ស្រេចចិត្ត)</Label>
              <Input 
                placeholder="https://example.com/image.jpg"
                value={formData.image_url}
                onChange={(e) => handleChange('image_url', e.target.value)}
              />
              <p className="text-xs text-gray-500">
                បិទភ្ជាប់រូបភាពពីគេហទំព័រផ្សេងៗ (ប្រសិនបើមាន)
              </p>
            </div>

            <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-xl">
              <Checkbox 
                id="family"
                checked={formData.family_friendly}
                onChange={(e) => handleChange('family_friendly', e.target.checked)}
              />
              <Label htmlFor="family" className="text-pink-700 cursor-pointer">
                សមស្របសម្រាប់គ្រួសារដែលមានកូន
              </Label>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                ត្រលប់
              </Button>
              <Button 
                onClick={() => setStep(3)} 
                disabled={!formData.title || !formData.area}
                className="flex-1 bg-teal-600 hover:bg-teal-700"
              >
                បន្ត
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Location & Contact */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">ទីតាំង & ទំនាក់ទំនង</h3>
            
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800">ការជូនដំណឹងអំពីភាពឯកជន</p>
                  <p className="text-blue-600">
                    អាសយដ្ឋានពិតប្រាកដរបស់អ្នកនឹងត្រូវបានបង្ហាញតែប្រសិនបើអ្នកយល់ព្រមខាងក្រោមប៉ុណ្ណោះ។ 
                    បើមិនដូច្នោះទេ, មានតែឈ្មោះតំបន់ប៉ុណ្ណោះដែលនឹងត្រូវបានបង្ហាញ។
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>អាសយដ្ឋានពិតប្រាកដ (ស្រេចចិត្ត)</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input 
                    placeholder="123 ផ្លូវធំ ឬចុចលើផែនទីដើម្បីជ្រើសរើស"
                    value={formData.exact_location}
                    onChange={(e) => handleChange('exact_location', e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant={showMapPicker ? "default" : "outline"}
                    onClick={() => setShowMapPicker(!showMapPicker)}
                    className="flex-shrink-0"
                  >
                    <MapPin className="w-4 h-4 mr-1" />
                    {showMapPicker ? 'លាក់ផែនទី' : 'បើកផែនទី'}
                  </Button>
                </div>
                {formData.latitude && formData.longitude && (
                  <div className="flex items-center gap-2 text-xs text-gray-600 bg-green-50 p-2 rounded">
                    <MapPin className="w-3 h-3 text-green-600" />
                    <span>ទីតាំង: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        handleChange('latitude', null);
                        handleChange('longitude', null);
                        if (markerRef.current) {
                          markerRef.current.map = null;
                          markerRef.current = null;
                        }
                      }}
                      className="h-5 w-5 p-0 ml-auto"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}
                {showMapPicker && GOOGLE_MAPS_API_KEY && (
                  <div className="relative w-full h-64 rounded-lg overflow-hidden border-2 border-gray-200">
                    <gmpx-api-loader 
                      id="form-map-loader"
                      key={GOOGLE_MAPS_API_KEY}
                      solution-channel="GMP_GE_mapsandplacesautocomplete_v2"
                    />
                    <gmp-map 
                      id="form-location-map"
                      center={`${formData.latitude || defaultCenter.lat},${formData.longitude || defaultCenter.lng}`}
                      zoom={formData.latitude && formData.longitude ? "15" : "11"}
                      map-id="DEMO_MAP_ID"
                      className="w-full h-full"
                    >
                      <gmp-advanced-marker></gmp-advanced-marker>
                    </gmp-map>
                    {/* Place Picker - Searchable */}
                    {isMapInitialized && (
                      <div className="absolute top-2 left-2 right-2 z-10">
                        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-1">
                          <style jsx>{`
                            #form-place-picker {
                              display: block;
                              width: 100%;
                            }
                            #form-place-picker::part(input) {
                              height: 32px !important;
                              font-size: 12px !important;
                              padding: 4px 8px !important;
                              border: none !important;
                              outline: none !important;
                            }
                            @media (min-width: 640px) {
                              #form-place-picker::part(input) {
                                height: 36px !important;
                                font-size: 13px !important;
                                padding: 6px 10px !important;
                              }
                            }
                          `}</style>
                          <gmpx-place-picker 
                            id="form-place-picker"
                            placeholder="ស្វែងរកទីតាំង..."
                            className="w-full"
                          />
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium text-gray-700 shadow-sm">
                      ចុចលើផែនទីឬស្វែងរកដើម្បីជ្រើសរើសទីតាំង
                    </div>
                  </div>
                )}
                {showMapPicker && !GOOGLE_MAPS_API_KEY && (
                  <div className="w-full h-64 rounded-lg border-2 border-gray-200 flex items-center justify-center bg-gray-50">
                    <p className="text-sm text-gray-500">Google Maps API key is not configured</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <Checkbox 
                id="consent"
                checked={formData.location_consent}
                onChange={(e) => handleChange('location_consent', e.target.checked)}
              />
              <Label htmlFor="consent" className="text-gray-700 cursor-pointer">
                ខ្ញុំយល់ព្រមឱ្យបង្ហាញទីតាំងពិតប្រាកដរបស់ខ្ញុំនៅលើផែនទី
              </Label>
            </div>

            <div className="space-y-2">
              <Label>ឈ្មោះទំនាក់ទំនង (ស្រេចចិត្ត)</Label>
              <Input 
                placeholder="ឈ្មោះរបស់អ្នក"
                value={formData.contact_name}
                onChange={(e) => handleChange('contact_name', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>លេខទូរស័ព្ទទំនាក់ទំនង (ស្រេចចិត្ត)</Label>
              <Input 
                placeholder="+855 12 345 678"
                value={formData.contact_phone}
                onChange={(e) => handleChange('contact_phone', e.target.value)}
              />
              <p className="text-xs text-gray-500">
                ប្រសិនបើផ្តល់, អ្នកស្វែងរកអាចទូរស័ព្ទទៅអ្នកដោយផ្ទាល់
              </p>
            </div>

            <div className="space-y-2">
              <Label>ទំនាក់ទំនង Facebook (ស្រេចចិត្ត)</Label>
              <div className="flex items-center gap-2">
                <Facebook className="w-5 h-5 text-blue-600" />
                <Input 
                  placeholder="facebook.com/username ឬតំណភ្ជាប់ប្រូហ្វាល"
                  value={formData.facebook_contact}
                  onChange={(e) => handleChange('facebook_contact', e.target.value)}
                />
              </div>
              <p className="text-xs text-gray-500">
                ប្រូហ្វាល់ Facebook ឬទំព័រសម្រាប់ទំនាក់ទំនងជំនួស
              </p>
            </div>

            <div className="space-y-2">
              <Label>តំណភ្ជាប់យោង (ស្រេចចិត្ត)</Label>
              <Input 
                placeholder="https://source-website.com/data"
                value={formData.reference_link}
                onChange={(e) => handleChange('reference_link', e.target.value)}
              />
              <p className="text-xs text-gray-500">
                តំណភ្ជាប់ទៅកន្លែងដែលទិន្នន័យនេះមកពី
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                ត្រលប់
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={loading}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    កំពុងដាក់ស្នើ...
                  </> 
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    ដាក់ស្នើការផ្តល់ជំនួយ
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Cancel */}
        {onCancel && (
          <Button 
            variant="ghost" 
            onClick={onCancel} 
            className="w-full mt-4 text-gray-500"
          >
            បោះបង់
          </Button>
        )}
      </CardContent>
    </Card>
  );
}