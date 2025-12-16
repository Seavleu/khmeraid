'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Switch } from '@/app/components/ui/switch';
import { MapPin, Save, X, Search } from 'lucide-react';

interface Listing {
  id?: string;
  title?: string;
  type?: string;
  area?: string;
  status?: string;
  latitude?: number;
  longitude?: number;
  exact_location?: string;
  contact_name?: string;
  contact_phone?: string;
  opening_hours?: string;
  capacity_min?: number;
  capacity_max?: number;
  notes?: string;
  services_offered?: string[];
  family_friendly?: boolean;
  verified?: boolean;
  location_consent?: boolean;
  [key: string]: any;
}

interface EditListingDialogProps {
  listing: Listing | null;
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<Listing>) => void;
}

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

export default function EditListingDialog({ listing, open, onClose, onSave }: EditListingDialogProps) {
  const [formData, setFormData] = useState<Partial<Listing>>(listing || {});
  const [searchValue, setSearchValue] = useState<string>('');
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(
    listing?.latitude && listing?.longitude
      ? { lat: listing.latitude, lng: listing.longitude }
      : null
  );
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Update marker position function
  // Note: Marker creation is handled by the useEffect that watches markerPosition
  const updateMarkerPosition = useCallback((lat: number, lng: number) => {
    setMarkerPosition({ lat, lng });
    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng
    }));

    // Update marker position if map is initialized and marker exists
    if (isMapInitialized && mapRef.current && markerRef.current) {
      // Update existing marker position
      markerRef.current.position = { lat, lng };
      // Center map on marker
      mapRef.current.panTo({ lat, lng });
    }
    // If marker doesn't exist, the useEffect watching markerPosition will create it
  }, [isMapInitialized]);

  // Create marker function - must be defined before useEffects that use it
  const createMarker = useCallback((lat: number, lng: number, map: google.maps.Map) => {
    if (!window.google?.maps) return;

    // Remove existing marker
    if (markerRef.current) {
      markerRef.current.map = null;
      markerRef.current = null;
    }

    // Create new marker
    const marker = new google.maps.marker.AdvancedMarkerElement({
      map: map,
      position: { lat, lng },
      gmpDraggable: true,
    });

    // Add drag end listener
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
        updateMarkerPosition(newLat, newLng);
      }
    });

    markerRef.current = marker;
    // Center map on marker
    map.panTo({ lat, lng });
    map.setZoom(15);
  }, [updateMarkerPosition]);

  // Update form data when listing changes
  useEffect(() => {
    if (listing) {
      setFormData(listing);
      if (listing.latitude && listing.longitude) {
        const newPosition = { lat: listing.latitude, lng: listing.longitude };
        setMarkerPosition(newPosition);
      } else {
        setMarkerPosition(null);
      }
    }
  }, [listing]);

  // Update marker when markerPosition changes and map is initialized
  useEffect(() => {
    if (!isMapInitialized || !mapRef.current) return;

    if (markerPosition) {
      if (markerRef.current) {
        // Update existing marker
        markerRef.current.position = markerPosition;
        mapRef.current.panTo(markerPosition);
        mapRef.current.setZoom(15);
      } else {
        // Create new marker
        createMarker(markerPosition.lat, markerPosition.lng, mapRef.current);
      }
    } else {
      // Remove marker if no position
      if (markerRef.current) {
        markerRef.current.map = null;
        markerRef.current = null;
      }
      mapRef.current.setCenter(defaultCenter);
      mapRef.current.setZoom(11);
    }
  }, [markerPosition, isMapInitialized, createMarker]);

  // Initialize map when dialog opens
  useEffect(() => {
    if (!open || !GOOGLE_MAPS_API_KEY) return;

    const initMap = async () => {
      try {
        // Wait for custom elements to be defined
        await customElements.whenDefined('gmpx-api-loader');
        await customElements.whenDefined('gmp-map');
        await customElements.whenDefined('gmp-advanced-marker');
        await customElements.whenDefined('gmpx-place-picker');

        // Set API key on all loaders
        const loaders = document.querySelectorAll('gmpx-api-loader') as NodeListOf<HTMLElement>;
        loaders.forEach(loader => {
          if (loader) {
            loader.setAttribute('key', GOOGLE_MAPS_API_KEY);
            try {
              (loader as any).key = GOOGLE_MAPS_API_KEY;
            } catch (e) {
              // Ignore if property setting fails
            }
          }
        });

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

        const mapElement = document.querySelector('#edit-listing-map') as any;
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
          gestureHandling: 'greedy', // Allow one-finger panning on mobile
        });

        // Center map on marker position if it exists, otherwise use default
        const center = markerPosition || defaultCenter;
        mapElement.innerMap.setCenter(center);
        mapElement.innerMap.setZoom(markerPosition ? 15 : 11);

        // Add click listener to map
        mapElement.innerMap.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            updateMarkerPosition(lat, lng);
          }
        });

        // Handle place picker changes - wait a bit for it to be rendered
        setTimeout(() => {
          const placePickerElement = document.querySelector('#edit-listing-place-picker') as any;
          if (placePickerElement) {
            const handlePlaceChange = () => {
              const place = placePickerElement.value;
              
              if (!place?.location) return;

              const lat = place.location.lat();
              const lng = place.location.lng();
              updateMarkerPosition(lat, lng);

              // Update exact location
              setFormData((prev) => ({
                ...prev,
                exact_location: place.formattedAddress || place.name || prev.exact_location
              }));

              // Center map on new location
              if (mapElement.innerMap) {
                if (place.viewport) {
                  mapElement.innerMap.fitBounds(place.viewport);
                } else {
                  mapElement.innerMap.panTo({ lat, lng });
                  mapElement.innerMap.setZoom(15);
                }
              }

              setSearchValue('');
            };

            placePickerElement.addEventListener('gmpx-placechange', handlePlaceChange);
          }
        }, 500);

        // Create initial marker if position exists
        if (markerPosition) {
          createMarker(markerPosition.lat, markerPosition.lng, mapElement.innerMap);
        } else {
          // Center on default location
          mapElement.innerMap.setCenter(defaultCenter);
          mapElement.innerMap.setZoom(11);
        }

        setIsMapInitialized(true);
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    const timer = setTimeout(initMap, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, GOOGLE_MAPS_API_KEY, markerPosition, createMarker, updateMarkerPosition]);

  const handleInputChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const mapCenter = markerPosition || defaultCenter;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[#105090]" />
            <span className="truncate">កែសម្រួលការផ្តល់ជំនួយ: {listing?.title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <Label className="text-xs sm:text-sm">ចំណងជើង</Label>
              <Input
                value={formData.title || ''}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="h-9 sm:h-10 text-sm sm:text-base"
              />
            </div>
            <div>
              <Label className="text-xs sm:text-sm">ប្រភេទ</Label>
              <Select 
                value={formData.type || ''} 
                onValueChange={(value) => handleInputChange('type', value)}
              >
                <SelectTrigger className="h-9 sm:h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="accommodation">ស្នាក់នៅ</SelectItem>
                  <SelectItem value="fuel_service">សេវាសាំង</SelectItem>
                  <SelectItem value="car_transportation">ដឹកជញ្ជូន</SelectItem>
                  <SelectItem value="volunteer_request">ត្រូវការស្ម័គ្រចិត្ត</SelectItem>
                  <SelectItem value="event">ព្រឹត្តិការណ៍</SelectItem>
                  <SelectItem value="site_sponsor">ទីតាំងហ្រ្វី</SelectItem>
                  <SelectItem value="school">សាលា</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <Label className="text-xs sm:text-sm">តំបន់/ទីក្រុង</Label>
              <Input
                value={formData.area || ''}
                onChange={(e) => handleInputChange('area', e.target.value)}
                placeholder="ទីក្រុង ឬតំបន់ទូទៅ"
                className="h-9 sm:h-10 text-sm sm:text-base"
              />
            </div>
            <div>
              <Label className="text-xs sm:text-sm">ស្ថានភាព</Label>
              <Select 
                value={formData.status || 'open'} 
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger className="h-9 sm:h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">បើក</SelectItem>
                  <SelectItem value="limited">មានកំណត់</SelectItem>
                  <SelectItem value="full">ពេញ</SelectItem>
                  <SelectItem value="paused">ផ្អាក</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs sm:text-sm">ទីតាំងពិតប្រាកដ (ស្រេចចិត្ត)</Label>
            <Input
              value={formData.exact_location || ''}
              onChange={(e) => handleInputChange('exact_location', e.target.value)}
              placeholder="អាសយដ្ឋានពេញលេញ ប្រសិនបើមាន"
              className="h-9 sm:h-10 text-sm sm:text-base"
            />
          </div>

          {/* Map for pinning location */}
          <div>
            <Label className="flex items-center justify-between mb-2 text-xs sm:text-sm">
              <span>គូសទីតាំងនៅលើផែនទី</span>
              {markerPosition && (
                <span className="text-xs text-gray-500 font-mono">
                  {markerPosition.lat.toFixed(6)}, {markerPosition.lng.toFixed(6)}
                </span>
              )}
            </Label>

            {GOOGLE_MAPS_API_KEY ? (
              <>
                {/* API Loader - must be rendered first */}
                <gmpx-api-loader 
                  ref={(el) => {
                    if (el && GOOGLE_MAPS_API_KEY) {
                      el.setAttribute('key', GOOGLE_MAPS_API_KEY);
                      try {
                        (el as any).key = GOOGLE_MAPS_API_KEY;
                      } catch (e) {
                        // Ignore
                      }
                    }
                  }}
                  solution-channel="GMP_GE_mapsandplacesautocomplete_v2"
                />

                {/* Location Search */}
                {isMapInitialized && (
                  <div className="mb-2 sm:mb-3">
                    <div className="relative">
                      <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 z-10" />
                      <gmpx-place-picker 
                        id="edit-listing-place-picker"
                        placeholder="ស្វែងរកទីតាំង..."
                        className="w-full h-9 sm:h-10"
                        style={{ paddingLeft: '2.5rem' }}
                      />
                    </div>
                  </div>
                )}

                <div className="border rounded-lg overflow-hidden h-[250px] sm:h-[300px] lg:h-[350px] relative touch-pan-x touch-pan-y" style={{ touchAction: 'pan-x pan-y pinch-zoom' }}>
                  <gmp-map
                    id="edit-listing-map"
                    center={`${mapCenter.lat},${mapCenter.lng}`}
                    zoom={markerPosition ? '15' : '11'}
                    map-id="DEMO_MAP_ID"
                    className="w-full h-full"
                    style={{ touchAction: 'pan-x pan-y pinch-zoom' }}
                  />
                  {!isMapInitialized && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 z-10">
                      <div className="text-center">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 border-3 sm:border-4 border-gray-200 border-t-[#105090] rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-xs text-gray-600">កំពុងផ្ទុកផែនទី...</p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="border rounded-lg p-4 sm:p-8 text-center text-gray-500 h-[250px] sm:h-[300px] flex items-center justify-center">
                <p className="text-xs sm:text-sm">Google Maps API key not configured</p>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1.5 sm:mt-2 flex items-center gap-1.5">
              <Search className="w-3 h-3" />
              <span>ស្វែងរកទីតាំងខាងលើ, ចុចលើផែនទី, ឬទាញសញ្ញាសម្គាល់ដើម្បីគូសទីតាំងពិតប្រាកដ</span>
            </p>
          </div>

          {/* Contact & Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <Label className="text-xs sm:text-sm">ឈ្មោះទំនាក់ទំនង</Label>
              <Input
                value={formData.contact_name || ''}
                onChange={(e) => handleInputChange('contact_name', e.target.value)}
                className="h-9 sm:h-10 text-sm sm:text-base"
              />
            </div>
            <div>
              <Label className="text-xs sm:text-sm">លេខទូរស័ព្ទទំនាក់ទំនង</Label>
              <Input
                value={formData.contact_phone || ''}
                onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                className="h-9 sm:h-10 text-sm sm:text-base"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <Label className="text-xs sm:text-sm">ម៉ោងបើក</Label>
              <Input
                value={formData.opening_hours || ''}
                onChange={(e) => handleInputChange('opening_hours', e.target.value)}
                placeholder="ឧ. 24/7, 8AM-6PM"
                className="h-9 sm:h-10 text-sm sm:text-base"
              />
            </div>
            <div>
              <Label className="text-xs sm:text-sm">សមត្ថភាព (អប្បបរមា-អតិបរមា)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={formData.capacity_min || ''}
                  onChange={(e) => handleInputChange('capacity_min', parseInt(e.target.value))}
                  placeholder="អប្បបរមា"
                  className="h-9 sm:h-10 text-sm sm:text-base"
                />
                <Input
                  type="number"
                  value={formData.capacity_max || ''}
                  onChange={(e) => handleInputChange('capacity_max', parseInt(e.target.value))}
                  placeholder="អតិបរមា"
                  className="h-9 sm:h-10 text-sm sm:text-base"
                />
              </div>
            </div>
          </div>

          <div>
            <Label className="text-xs sm:text-sm">កំណត់ចំណាំ</Label>
            <Textarea
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className="text-sm sm:text-base"
            />
          </div>

          <div>
            <Label className="text-xs sm:text-sm">សេវាដែលផ្តល់ (ដាក់ក្បៀសដោយក្បៀស)</Label>
            <Input
              value={formData.services_offered?.join(', ') || ''}
              onChange={(e) => handleInputChange('services_offered', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
              placeholder="WiFi, Parking, Food, ជាដើម"
              className="h-9 sm:h-10 text-sm sm:text-base"
            />
          </div>

          {/* Toggles */}
          <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
            <Label className="text-xs sm:text-sm">សមស្របសម្រាប់គ្រួសារ</Label>
            <Switch
              checked={formData.family_friendly || false}
              onCheckedChange={(checked) => handleInputChange('family_friendly', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
            <Label className="text-xs sm:text-sm">បានផ្ទៀងផ្ទាត់</Label>
            <Switch
              checked={formData.verified || false}
              onCheckedChange={(checked) => handleInputChange('verified', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
            <Label className="text-xs sm:text-sm">ការយល់ព្រមទីតាំង (បង្ហាញទីតាំងពិតប្រាកដជាសាធារណៈ)</Label>
            <Switch
              checked={formData.location_consent || false}
              onCheckedChange={(checked) => handleInputChange('location_consent', checked)}
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm">
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            បោះបង់
          </Button>
          <Button onClick={handleSave} className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm bg-[#105090] hover:bg-[#0d3d6f]">
            <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            រក្សាទុកការផ្លាស់ប្តូរ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
