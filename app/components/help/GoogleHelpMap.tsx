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
  onSelectListing: (listing: Listing | null) => void;
  userLocation?: [number, number] | null;
  selectedListing?: Listing | null;
  onRecenterRequest?: () => void;
  helpSeekers?: HelpSeeker[];
  onDrawnAreaChange?: (area: DrawnArea | null) => void;
}

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

export default function GoogleHelpMap({
  listings,
  onSelectListing,
  userLocation,
  selectedListing,
  onRecenterRequest,
  helpSeekers = [],
  onDrawnAreaChange
}: GoogleHelpMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [selectedMarker, setSelectedMarker] = useState<Listing | HelpSeeker | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const defaultCenter = { lat: 11.5564, lng: 104.9282 }; // Phnom Penh, Cambodia

  const apiLoaderRef = useRef<HTMLElement>(null);

  // Set API key on the loader element immediately when it mounts
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setMapError('Google Maps API key not configured. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your .env file.');
      return;
    }

    // Set API key immediately when ref is available
    if (apiLoaderRef.current) {
      apiLoaderRef.current.setAttribute('key', GOOGLE_MAPS_API_KEY);
    }
  }, []);

  // Initialize map when component mounts
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) return;

    const initMap = async () => {
      try {
        // Wait for the API loader to initialize
        await customElements.whenDefined('gmpx-api-loader');
        
        // Ensure API key is set
        const loader = document.querySelector('gmpx-api-loader') as HTMLElement;
        if (loader && !loader.getAttribute('key')) {
          loader.setAttribute('key', GOOGLE_MAPS_API_KEY);
        }

        // Wait for custom elements to be defined
        await customElements.whenDefined('gmp-map');
        await customElements.whenDefined('gmp-advanced-marker');
        await customElements.whenDefined('gmpx-place-picker');

        // Wait for Google Maps API to load
        let retries = 0;
        while (!window.google?.maps && retries < 30) {
          await new Promise(resolve => setTimeout(resolve, 200));
          retries++;
        }

        if (!window.google?.maps) {
          setMapError('Google Maps API failed to load. Please check your API key.');
          return;
        }

        const mapElement = document.querySelector('gmp-map') as any;
        const placePickerElement = document.querySelector('gmpx-place-picker') as any;

        if (!mapElement) {
          setMapError('Map element not found');
          return;
        }

        // Initialize InfoWindow
        infoWindowRef.current = new google.maps.InfoWindow();

        // Wait for innerMap to be available
        let mapRetries = 0;
        while (!mapElement.innerMap && mapRetries < 50) {
          await new Promise(resolve => setTimeout(resolve, 100));
          mapRetries++;
        }

        if (!mapElement.innerMap) {
          setMapError('Map failed to initialize');
          return;
        }

        // Set map options
        mapElement.innerMap.setOptions({
          mapTypeControl: false,
          fullscreenControl: true,
          zoomControl: true,
          streetViewControl: false,
        });

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
        setMapError(null);
      } catch (error) {
        console.error('Error initializing map:', error);
        setMapError(`Map initialization error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    // Wait for script to load and then initialize
    const timer = setTimeout(initMap, 1000);
    return () => clearTimeout(timer);
  }, [GOOGLE_MAPS_API_KEY]);

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
    if (!isInitialized || !window.google?.maps || !GOOGLE_MAPS_API_KEY) return;

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
          onSelectListing(listing);
          
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
          title: `🆘 ${seeker.name}`,
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

  return (
    <div ref={mapContainerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Google Maps Extended Component Library */}
      {GOOGLE_MAPS_API_KEY ? (
        <>
          <gmpx-api-loader 
            ref={(el) => {
              apiLoaderRef.current = el as HTMLElement;
              if (el && GOOGLE_MAPS_API_KEY) {
                el.setAttribute('key', GOOGLE_MAPS_API_KEY);
              }
            }}
            solution-channel="GMP_GE_mapsandplacesautocomplete_v2"
          />
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

          {/* Error Message */}
          {mapError && (
            <div style={{
              position: 'absolute',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10000,
              background: 'white',
              padding: '12px 20px',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              color: '#dc2626',
              fontSize: '14px',
              maxWidth: '400px',
              textAlign: 'center'
            }}>
              ⚠️ {mapError}
            </div>
          )}

          {/* Loading Indicator */}
          {!isInitialized && !mapError && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1000,
              background: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                border: '4px solid #f3f4f6',
                borderTop: '4px solid #105090',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 12px'
              }} />
              <p style={{ color: '#6b7280', fontSize: '14px' }}>Loading map...</p>
            </div>
          )}

          {/* Control Buttons */}
          {isInitialized && userLocation && (
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
          {isInitialized && selectedMarker && (
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
                    onSelectListing(null);
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
        </>
      ) : (
        <div style={{ 
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: '#f3f4f6',
          color: '#6b7280'
        }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '18px', marginBottom: '8px' }}>🗺️</p>
            <p>Google Maps API key not configured</p>
            <p style={{ fontSize: '12px', marginTop: '4px' }}>
              Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your .env file
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
