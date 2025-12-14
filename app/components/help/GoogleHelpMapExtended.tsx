'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/app/components/ui/button';
import { Phone, X, Navigation } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

interface Listing {
  id: string;
  title: string;
  type: string;
  status: string;
  area?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  contact_name?: string;
  contact_phone?: string;
  exact_location?: string;
  family_friendly?: boolean;
  verified?: boolean;
  [key: string]: any;
}

interface HelpSeeker {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  help_type?: string;
  urgency?: string;
  [key: string]: any;
}

interface DrawnArea {
  type: 'polygon' | 'circle';
  coordinates?: Array<{ lat: number; lng: number }>;
  center?: { lat: number; lng: number };
  radius?: number;
}

interface GoogleHelpMapProps {
  listings: Listing[];
  onSelectListing?: (listing: Listing | null) => void;
  userLocation?: [number, number] | null;
  selectedListing?: Listing | null;
  onRecenterRequest?: () => void;
  helpSeekers?: HelpSeeker[];
  onDrawnAreaChange?: (area: DrawnArea | null) => void;
}

// Declare global types for Google Maps Extended Component Library
// Note: These types are also declared in GoogleHelpMap.tsx, but we need them here too
// The key property is removed to avoid type conflicts
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

export default function GoogleHelpMapExtended({
  listings,
  onSelectListing,
  userLocation,
  selectedListing,
  onRecenterRequest,
  helpSeekers = [],
  onDrawnAreaChange
}: GoogleHelpMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const apiLoaderRef = useRef<any>(null);
  const [selectedMarker, setSelectedMarker] = useState<Listing | HelpSeeker | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const defaultCenter = { lat: 11.5564, lng: 104.9282 }; // Phnom Penh, Cambodia

  // Initialize map when component mounts
  useEffect(() => {
    const initMap = async () => {
      try {
        // Wait for custom elements to be defined
        await customElements.whenDefined('gmp-map');
        await customElements.whenDefined('gmp-advanced-marker');
        await customElements.whenDefined('gmpx-place-picker');

        const mapElement = document.querySelector('gmp-map') as any;
        const placePickerElement = document.querySelector('gmpx-place-picker') as any;

        if (!mapElement) return;

        // Initialize InfoWindow
        if (window.google?.maps) {
          infoWindowRef.current = new google.maps.InfoWindow();
        }

        // Set map options
        if (mapElement.innerMap) {
          mapElement.innerMap.setOptions({
            mapTypeControl: false,
            fullscreenControl: true,
            zoomControl: true,
            streetViewControl: false,
          });
        }

        // Handle place picker changes
        if (placePickerElement) {
          placePickerElement.addEventListener('gmpx-placechange', () => {
            const place = placePickerElement.value;
            
            if (!place?.location) {
              infoWindowRef.current?.close();
              return;
            }

            if (place.viewport && mapElement.innerMap) {
              mapElement.innerMap.fitBounds(place.viewport);
            } else {
              mapElement.setAttribute('center', `${place.location.lat()},${place.location.lng()}`);
              mapElement.setAttribute('zoom', '17');
            }
          });
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    // Wait a bit for the script to load
    const timer = setTimeout(initMap, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Update map center when user location changes
  useEffect(() => {
    if (isInitialized && userLocation) {
      const mapElement = document.querySelector('gmp-map') as any;
      if (mapElement) {
        mapElement.setAttribute('center', `${userLocation[0]},${userLocation[1]}`);
        mapElement.setAttribute('zoom', '15');
      }
    }
  }, [userLocation, isInitialized]);

  // Create markers for listings
  useEffect(() => {
    if (!isInitialized || !window.google?.maps) return;

    const mapElement = document.querySelector('gmp-map') as any;
    if (!mapElement?.innerMap) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      marker.map = null;
    });
    markersRef.current.clear();

    // Create markers for each listing
    listings.forEach(listing => {
      if (!listing.latitude || !listing.longitude) return;

      const position = { lat: listing.latitude, lng: listing.longitude };
      
      try {
        // Create marker using AdvancedMarkerElement
        const marker = new google.maps.marker.AdvancedMarkerElement({
          map: mapElement.innerMap,
          position: position,
          title: listing.title,
        });

        // Add click listener
        marker.addListener('click', () => {
          setSelectedMarker(listing);
          onSelectListing?.(listing);
          
          // Create info window content
          const content = `
            <div style="padding: 8px; max-width: 300px;">
              <h3 style="margin: 0 0 8px 0; font-weight: bold;">${listing.title}</h3>
              <p style="margin: 4px 0; color: #666;">${listing.type}</p>
              ${listing.contact_phone ? `<p style="margin: 4px 0;"><a href="tel:${listing.contact_phone}">${listing.contact_phone}</a></p>` : ''}
              ${listing.notes ? `<p style="margin: 4px 0;">${listing.notes}</p>` : ''}
              <button onclick="window.open('https://www.google.com/maps/search/?api=1&query=${listing.latitude},${listing.longitude}', '_blank')" 
                      style="margin-top: 8px; padding: 4px 8px; background: #105090; color: white; border: none; border-radius: 4px; cursor: pointer;">
                Open in Maps
              </button>
            </div>
          `;
          
          infoWindowRef.current?.setContent(content);
          infoWindowRef.current?.open(mapElement.innerMap, marker);
        });

        markersRef.current.set(listing.id, marker);
      } catch (error) {
        console.error('Error creating marker:', error);
      }
    });

    // Create markers for help seekers
    helpSeekers.forEach(seeker => {
      if (!seeker.latitude || !seeker.longitude) return;

      const position = { lat: seeker.latitude, lng: seeker.longitude };
      
      try {
        const marker = new google.maps.marker.AdvancedMarkerElement({
          map: mapElement.innerMap,
          position: position,
          title: `រកជំនួយ ${seeker.name}`,
        });

        marker.addListener('click', () => {
          setSelectedMarker(seeker);
          
          const content = `
            <div style="padding: 8px; max-width: 300px;">
              <h3 style="margin: 0 0 8px 0; font-weight: bold; color: red;">🆘 ${seeker.name}</h3>
              <p style="margin: 4px 0;">Help Type: ${seeker.help_type || 'General'}</p>
              <p style="margin: 4px 0;">Urgency: ${seeker.urgency || 'Unknown'}</p>
            </div>
          `;
          
          infoWindowRef.current?.setContent(content);
          infoWindowRef.current?.open(mapElement.innerMap, marker);
        });

        markersRef.current.set(`help-${seeker.id}`, marker);
      } catch (error) {
        console.error('Error creating help seeker marker:', error);
      }
    });
  }, [listings, helpSeekers, isInitialized, onSelectListing]);

  const handleRecenter = useCallback(() => {
    if (userLocation) {
      const mapElement = document.querySelector('gmp-map') as any;
      if (mapElement) {
        mapElement.setAttribute('center', `${userLocation[0]},${userLocation[1]}`);
        mapElement.setAttribute('zoom', '15');
        onRecenterRequest?.();
      }
    }
  }, [userLocation, onRecenterRequest]);

  // Set API key on the loader element immediately when it mounts
  useEffect(() => {
    if (apiLoaderRef.current && GOOGLE_MAPS_API_KEY) {
      apiLoaderRef.current.setAttribute('key', GOOGLE_MAPS_API_KEY);
    }
  }, []);

  return (
    <div ref={mapContainerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Google Maps Extended Component Library */}
      {GOOGLE_MAPS_API_KEY ? (
        <gmpx-api-loader 
          ref={(el) => {
            apiLoaderRef.current = el;
            if (el && GOOGLE_MAPS_API_KEY) {
              el.setAttribute('key', GOOGLE_MAPS_API_KEY);
            }
          }}
          solution-channel="GMP_GE_mapsandplacesautocomplete_v2"
        />
      ) : (
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
          Google Maps API key not configured. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your .env file.
        </div>
      )}
      
      <gmp-map 
        center={`${defaultCenter.lat},${defaultCenter.lng}`}
        zoom="13"
        map-id="DEMO_MAP_ID"
        style={{ width: '100%', height: '100%' }}
      >
        <div slot="control-block-start-inline-start" style={{ padding: '20px' }}>
          <gmpx-place-picker placeholder="Enter an address"></gmpx-place-picker>
        </div>
        <gmp-advanced-marker></gmp-advanced-marker>
      </gmp-map>

      {/* Control Buttons */}
      {userLocation && (
        <div style={{ position: 'absolute', top: '80px', right: '20px', zIndex: 1000 }}>
          <Button
            onClick={handleRecenter}
            className="bg-white shadow-lg rounded-full"
            variant="ghost"
            size="sm"
          >
            <Navigation className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Selected Marker Info */}
      {selectedMarker && (
        <div style={{ 
          position: 'absolute', 
          bottom: '20px', 
          left: '20px', 
          right: '20px',
          zIndex: 1000,
          background: 'white',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          maxWidth: '400px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>
                {'title' in selectedMarker ? selectedMarker.title : `🆘 ${(selectedMarker as HelpSeeker).name}`}
              </h3>
              {'type' in selectedMarker && (
                <p style={{ margin: '4px 0', color: '#666' }}>{selectedMarker.type}</p>
              )}
              {'contact_phone' in selectedMarker && selectedMarker.contact_phone && (
                <a 
                  href={`tel:${selectedMarker.contact_phone}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', color: '#105090' }}
                >
                  <Phone className="w-4 h-4" />
                  {selectedMarker.contact_phone}
                </a>
              )}
            </div>
            <Button
              onClick={() => {
                setSelectedMarker(null);
                onSelectListing?.(null);
                infoWindowRef.current?.close();
              }}
              variant="ghost"
              size="sm"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
