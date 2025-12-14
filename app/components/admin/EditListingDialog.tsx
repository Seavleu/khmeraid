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

  // Update form data when listing changes
  useEffect(() => {
    if (listing) {
      setFormData(listing);
      if (listing.latitude && listing.longitude) {
        setMarkerPosition({ lat: listing.latitude, lng: listing.longitude });
      } else {
        setMarkerPosition(null);
      }
    }
  }, [listing]);

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

        // Set API key
        const loader = document.querySelector('gmpx-api-loader') as HTMLElement;
        if (loader) {
          loader.setAttribute('key', GOOGLE_MAPS_API_KEY);
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
        });

        // Add click listener to map
        mapElement.innerMap.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            updateMarkerPosition(lat, lng);
          }
        });

        // Handle place picker changes
        const placePickerElement = document.querySelector('#edit-listing-place-picker') as any;
        if (placePickerElement) {
          placePickerElement.addEventListener('gmpx-placechange', () => {
            const place = placePickerElement.value;
            
            if (!place?.location) return;

            const lat = place.location.lat();
            const lng = place.location.lng();
            updateMarkerPosition(lat, lng);

            // Update exact location
            setFormData({
              ...formData,
              exact_location: place.formattedAddress || place.name || formData.exact_location
            });

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
          });
        }

        // Create initial marker if position exists
        if (markerPosition) {
          createMarker(markerPosition.lat, markerPosition.lng, mapElement.innerMap);
        }

        setIsMapInitialized(true);
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    const timer = setTimeout(initMap, 500);
    return () => clearTimeout(timer);
  }, [open, GOOGLE_MAPS_API_KEY]);

  const createMarker = (lat: number, lng: number, map: google.maps.Map) => {
    if (!window.google?.maps) return;

    // Remove existing marker
    if (markerRef.current) {
      markerRef.current.map = null;
    }

    // Create new marker
    const marker = new google.maps.marker.AdvancedMarkerElement({
      map: map,
      position: { lat, lng },
      draggable: true,
    });

    // Add drag end listener
    marker.addListener('dragend', (e: any) => {
      const position = e.latLng || e.target.position;
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
  };

  const updateMarkerPosition = (lat: number, lng: number) => {
    setMarkerPosition({ lat, lng });
    setFormData({
      ...formData,
      latitude: lat,
      longitude: lng
    });

    // Update marker position if map is initialized
    if (isMapInitialized && mapRef.current && markerRef.current) {
      markerRef.current.position = { lat, lng };
    } else if (isMapInitialized && mapRef.current) {
      createMarker(lat, lng, mapRef.current);
    }
  };

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
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" style={{ color: '#105090' }} />
            Edit Listing: {listing?.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Title</Label>
              <Input
                value={formData.title || ''}
                onChange={(e) => handleInputChange('title', e.target.value)}
              />
            </div>
            <div>
              <Label>Type</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => handleInputChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="accommodation">Accommodation</SelectItem>
                  <SelectItem value="fuel_service">Fuel Service</SelectItem>
                  <SelectItem value="car_transportation">Transportation</SelectItem>
                  <SelectItem value="volunteer_request">Volunteer Request</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="site_sponsor">Site Sponsor</SelectItem>
                  <SelectItem value="school">School</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Area/City</Label>
              <Input
                value={formData.area || ''}
                onChange={(e) => handleInputChange('area', e.target.value)}
                placeholder="City or general area"
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="limited">Limited</SelectItem>
                  <SelectItem value="full">Full</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Exact Location (Optional)</Label>
            <Input
              value={formData.exact_location || ''}
              onChange={(e) => handleInputChange('exact_location', e.target.value)}
              placeholder="Full address if available"
            />
          </div>

          {/* Map for pinning location */}
          <div>
            <Label className="flex items-center justify-between mb-2">
              <span>Pin Location on Map</span>
              {markerPosition && (
                <span className="text-xs text-gray-500">
                  {markerPosition.lat.toFixed(6)}, {markerPosition.lng.toFixed(6)}
                </span>
              )}
            </Label>

            {/* Location Search */}
            {GOOGLE_MAPS_API_KEY && (
              <div className="mb-3">
                <gmpx-api-loader 
                  solution-channel="GMP_GE_mapsandplacesautocomplete_v2"
                />
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                  <gmpx-place-picker 
                    id="edit-listing-place-picker"
                    placeholder="Search for a location..."
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            )}

            {GOOGLE_MAPS_API_KEY ? (
              <div className="border rounded-lg overflow-hidden" style={{ height: '300px', position: 'relative' }}>
                <gmpx-api-loader 
                  solution-channel="GMP_GE_mapsandplacesautocomplete_v2"
                />
                <gmp-map
                  id="edit-listing-map"
                  center={`${mapCenter.lat},${mapCenter.lng}`}
                  zoom={markerPosition ? '14' : '11'}
                  map-id="DEMO_MAP_ID"
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            ) : (
              <div className="border rounded-lg p-8 text-center text-gray-500" style={{ height: '300px' }}>
                Google Maps API key not configured
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              🔍 Search for a location above, click on the map, or drag the marker to pin exact location
            </p>
          </div>

          {/* Contact & Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Contact Name</Label>
              <Input
                value={formData.contact_name || ''}
                onChange={(e) => handleInputChange('contact_name', e.target.value)}
              />
            </div>
            <div>
              <Label>Contact Phone</Label>
              <Input
                value={formData.contact_phone || ''}
                onChange={(e) => handleInputChange('contact_phone', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Opening Hours</Label>
              <Input
                value={formData.opening_hours || ''}
                onChange={(e) => handleInputChange('opening_hours', e.target.value)}
                placeholder="e.g., 24/7, 8AM-6PM"
              />
            </div>
            <div>
              <Label>Capacity (Min-Max)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={formData.capacity_min || ''}
                  onChange={(e) => handleInputChange('capacity_min', parseInt(e.target.value))}
                  placeholder="Min"
                />
                <Input
                  type="number"
                  value={formData.capacity_max || ''}
                  onChange={(e) => handleInputChange('capacity_max', parseInt(e.target.value))}
                  placeholder="Max"
                />
              </div>
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <Label>Services Offered (comma-separated)</Label>
            <Input
              value={formData.services_offered?.join(', ') || ''}
              onChange={(e) => handleInputChange('services_offered', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
              placeholder="WiFi, Parking, Food, etc."
            />
          </div>

          {/* Toggles */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <Label>Family Friendly</Label>
            <Switch
              checked={formData.family_friendly || false}
              onCheckedChange={(checked) => handleInputChange('family_friendly', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <Label>Verified</Label>
            <Switch
              checked={formData.verified || false}
              onCheckedChange={(checked) => handleInputChange('verified', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <Label>Location Consent (Show exact location publicly)</Label>
            <Switch
              checked={formData.location_consent || false}
              onCheckedChange={(checked) => handleInputChange('location_consent', checked)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} style={{ backgroundColor: '#105090' }}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
