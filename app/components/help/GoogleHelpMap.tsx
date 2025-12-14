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

  // Set API key on the loader element immediately when it mounts
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setMapError('មិនបានកំណត់រចនាសម្ព័ន្ធ Google Maps API key។ សូមកំណត់ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY នៅក្នុងឯកសារ .env របស់អ្នក។');
      return;
    }

    // Set API key with multiple attempts to ensure it's set
    const setApiKey = () => {
      const loader = document.querySelector('gmpx-api-loader') as HTMLElement;
      if (loader) {
        loader.setAttribute('key', GOOGLE_MAPS_API_KEY);
      }
    };

    // Set immediately and retry
    setApiKey();
    const timer1 = setTimeout(setApiKey, 100);
    const timer2 = setTimeout(setApiKey, 500);
    const timer3 = setTimeout(setApiKey, 1000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  // Initialize map when component mounts
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) return;

    const initMap = async () => {
      try {
        // Wait for the API loader to initialize
        await customElements.whenDefined('gmpx-api-loader');
        
        // Ensure API key is set - try multiple times
        const loader = document.querySelector('gmpx-api-loader') as HTMLElement;
        if (loader) {
          if (!loader.getAttribute('key')) {
            loader.setAttribute('key', GOOGLE_MAPS_API_KEY);
          }
          // Also try setting it as a property
          try {
            (loader as any).key = GOOGLE_MAPS_API_KEY;
          } catch (e) {
            // Ignore if property setting fails
          }
        }
        
        // Wait a bit for the API loader to process the key
        await new Promise(resolve => setTimeout(resolve, 500));

        // Wait for custom elements to be defined
        await customElements.whenDefined('gmp-map');
        await customElements.whenDefined('gmp-advanced-marker');
        // Don't wait for place-picker here - we'll render it conditionally

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

        setIsInitialized(true);
        setMapError(null);
        
        // Set up place picker listener after initialization (it will be rendered conditionally)
        // We'll set this up in a separate effect that runs when isInitialized becomes true
      } catch (error) {
        console.error('Error initializing map:', error);
        setMapError(`Map initialization error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    // Wait for script to load and then initialize
    const timer = setTimeout(initMap, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Set up place picker event listener after map is initialized
  useEffect(() => {
    if (!isInitialized) return;

    // Wait a bit for the place picker to be rendered
    const timer = setTimeout(() => {
      const placePickerElement = document.querySelector('gmpx-place-picker') as any;
      const mapElement = document.querySelector('gmp-map') as any;

      if (placePickerElement && mapElement) {
        const handlePlaceChange = () => {
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
        };

        placePickerElement.addEventListener('gmpx-placechange', handlePlaceChange);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [isInitialized]);

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
                បើកក្នុងផែនទី
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
    <div ref={mapContainerRef} className="w-full h-full relative">
      {/* Google Maps Extended Component Library */}
      {GOOGLE_MAPS_API_KEY ? (
        <>
          {/* API Loader - must be rendered first and have key set immediately */}
          <gmpx-api-loader 
            ref={(el) => {
              if (el && GOOGLE_MAPS_API_KEY) {
                // Set key immediately when element is available
                el.setAttribute('key', GOOGLE_MAPS_API_KEY);
                // Also set as property for web component
                try {
                  (el as any).key = GOOGLE_MAPS_API_KEY;
                } catch (e) {
                  // Ignore if property setting fails
                }
              }
            }}
            solution-channel="GMP_GE_mapsandplacesautocomplete_v2"
          />
          <gmp-map 
            center={`${defaultCenter.lat},${defaultCenter.lng}`}
            zoom="13"
            map-id="DEMO_MAP_ID"
            className="w-full h-full"
          >
            {/* Only render place picker after API is initialized */}
            {isInitialized && (
              <div slot="control-block-start-inline-start" className="p-5">
                <gmpx-place-picker placeholder="បញ្ចូលអាសយដ្ឋាន"></gmpx-place-picker>
              </div>
            )}
            <gmp-advanced-marker></gmp-advanced-marker>
          </gmp-map>

          {/* Error Message */}
          {mapError && (
            <div className="absolute top-5 left-1/2 -translate-x-1/2 z-[10000] bg-white py-3 px-5 rounded-lg shadow-md text-red-600 text-sm max-w-md text-center">
              ⚠️ {mapError}
            </div>
          )}

          {/* Loading Indicator */}
          {!isInitialized && !mapError && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1000] bg-white p-5 rounded-lg shadow-md text-center">
              <div className="w-10 h-10 border-4 border-gray-100 border-t-[#105090] rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-500 text-sm">កំពុងផ្ទុកផែនទី...</p>
            </div>
          )}

          {/* Control Buttons */}
          {isInitialized && userLocation && (
            <div className="absolute top-20 right-5 z-[1000]">
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
            <div className="absolute bottom-5 left-5 right-5 z-[1000] bg-white p-4 rounded-lg shadow-md max-w-md">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="m-0 mb-2 font-bold">
                    {'title' in selectedMarker ? selectedMarker.title : `🆘 ${(selectedMarker as HelpSeeker).name}`}
                  </h3>
                  {'type' in selectedMarker && (
                    <p className="my-1 text-gray-600">{selectedMarker.type}</p>
                  )}
                  {'contact_phone' in selectedMarker && selectedMarker.contact_phone && (
                    <a 
                      href={`tel:${selectedMarker.contact_phone}`}
                      className="flex items-center gap-1 mt-2 text-[#105090] hover:underline"
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
        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500">
          <div className="text-center">
            <p className="text-lg mb-2">🗺️</p>
            <p>មិនបានកំណត់រចនាសម្ព័ន្ធ Google Maps API key</p>
            <p className="text-xs mt-1">
              សូមកំណត់ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY នៅក្នុងឯកសារ .env របស់អ្នក
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
