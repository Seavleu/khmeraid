'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/app/components/ui/button';
import { Phone, X, Navigation, ChevronUp } from 'lucide-react';
import ListingCard from '@/app/components/help/ListingCard';

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
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [sheetHeight, setSheetHeight] = useState<'partial' | 'full'>('partial');
  const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const userLocationMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const userLocationCircleRef = useRef<google.maps.Circle | null>(null);

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
          gestureHandling: 'greedy', // Allow one-finger panning on mobile
          disableDoubleClickZoom: false, // Allow double-click to zoom
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

  // Create and update user location marker
  useEffect(() => {
    if (!isInitialized || !window.google?.maps || !userLocation) {
      // Clean up existing markers
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.map = null;
        userLocationMarkerRef.current = null;
      }
      if (userLocationCircleRef.current) {
        userLocationCircleRef.current.setMap(null);
        userLocationCircleRef.current = null;
      }
      return;
    }

    const mapElement = document.querySelector('gmp-map') as any;
    if (!mapElement?.innerMap) return;

    const position = { lat: userLocation[0], lng: userLocation[1] };

    // Remove old marker if exists
    if (userLocationMarkerRef.current) {
      userLocationMarkerRef.current.map = null;
    }
    if (userLocationCircleRef.current) {
      userLocationCircleRef.current.setMap(null);
    }

    try {
      // Create accuracy circle (typical GPS accuracy is 10-20 meters)
      const accuracyCircle = new google.maps.Circle({
        map: mapElement.innerMap,
        center: position,
        radius: 20, // 20 meters radius
        fillColor: '#4285F4',
        fillOpacity: 0.15,
        strokeColor: '#4285F4',
        strokeOpacity: 0.3,
        strokeWeight: 1,
        zIndex: 1,
      });
      userLocationCircleRef.current = accuracyCircle;

      // Create user location marker (blue dot like Google Maps)
      const userMarker = new google.maps.marker.AdvancedMarkerElement({
        map: mapElement.innerMap,
        position: position,
        title: 'ទីតាំងរបស់អ្នក',
        zIndex: 2,
        content: (() => {
          const container = document.createElement('div');
          container.style.width = '20px';
          container.style.height = '20px';
          container.style.position = 'relative';
          
          // Outer pulsing circle
          const pulse = document.createElement('div');
          pulse.style.width = '20px';
          pulse.style.height = '20px';
          pulse.style.borderRadius = '50%';
          pulse.style.backgroundColor = '#4285F4';
          pulse.style.opacity = '0.4';
          pulse.style.position = 'absolute';
          pulse.style.top = '0';
          pulse.style.left = '0';
          pulse.style.animation = 'pulse 2s infinite';
          
          // Inner solid circle
          const dot = document.createElement('div');
          dot.style.width = '12px';
          dot.style.height = '12px';
          dot.style.borderRadius = '50%';
          dot.style.backgroundColor = '#4285F4';
          dot.style.border = '2px solid white';
          dot.style.position = 'absolute';
          dot.style.top = '4px';
          dot.style.left = '4px';
          dot.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
          
          container.appendChild(pulse);
          container.appendChild(dot);
          
          return container;
        })(),
      });

      userLocationMarkerRef.current = userMarker;

      // Center map on user location
      mapElement.setAttribute('center', `${userLocation[0]},${userLocation[1]}`);
      mapElement.setAttribute('zoom', '15');
    } catch (error) {
      console.error('Error creating user location marker:', error);
    }

    // Cleanup function
    return () => {
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.map = null;
        userLocationMarkerRef.current = null;
      }
      if (userLocationCircleRef.current) {
        userLocationCircleRef.current.setMap(null);
        userLocationCircleRef.current = null;
      }
    };
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
          setShowBottomSheet(true);
          setSheetHeight('partial');
          
          // Zoom to marker location with smooth animation
          if (mapElement.innerMap && listing.latitude && listing.longitude) {
            const position = { lat: listing.latitude, lng: listing.longitude };
            mapElement.innerMap.setCenter(position);
            const currentZoom = mapElement.innerMap.getZoom() || 13;
            // Smooth zoom to at least level 15
            mapElement.innerMap.setZoom(Math.max(currentZoom + 1, 15));
          }
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
          title: `${seeker.name}`,
        });

        marker.addListener('click', () => {
          setSelectedMarker(seeker);
          setShowBottomSheet(true);
          setSheetHeight('partial');
          
          // Zoom to marker location with smooth animation
          if (mapElement.innerMap && seeker.latitude && seeker.longitude) {
            const position = { lat: seeker.latitude, lng: seeker.longitude };
            mapElement.innerMap.setCenter(position);
            const currentZoom = mapElement.innerMap.getZoom() || 13;
            mapElement.innerMap.setZoom(Math.max(currentZoom + 1, 15));
          }
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
      if (mapElement?.innerMap) {
        const position = { lat: userLocation[0], lng: userLocation[1] };
        mapElement.innerMap.setCenter(position);
        mapElement.innerMap.setZoom(15);
        onRecenterRequest?.();
      }
    }
  }, [userLocation, onRecenterRequest]);

  return (
    <div ref={mapContainerRef} className="w-full h-full relative touch-pan-x touch-pan-y" style={{ touchAction: 'pan-x pan-y pinch-zoom' }}>
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
            style={{ touchAction: 'pan-x pan-y pinch-zoom' }}
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
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-white/95 backdrop-blur-sm p-5 rounded-2xl border-2 border-gray-200 shadow-2xl text-center">
              <div className="w-10 h-10 border-4 border-gray-200 border-t-[#105090] rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-500 text-sm">កំពុងផ្ទុកផែនទី...</p>
            </div>
          )}

          {/* Control Buttons */}
          {isInitialized && userLocation && (
            <div className="absolute top-20 right-5 z-20">
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

          {/* Bottom Sheet for Listing Details */}
          {isInitialized && showBottomSheet && selectedMarker && 'title' in selectedMarker && (
            <div 
              className={`fixed bottom-0 left-0 right-0 z-[10000] bg-white rounded-t-3xl shadow-2xl transition-all duration-300 ease-out ${
                sheetHeight === 'full' ? 'h-[95vh]' : 'h-[60vh] sm:h-[65vh]'
              }`}
              style={{ 
                transform: showBottomSheet ? 'translateY(0)' : 'translateY(100%)',
                touchAction: 'pan-y'
              }}
            >
              {/* Drag Handle */}
              <div 
                className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none"
                onTouchStart={(e) => {
                  e.preventDefault();
                  const startY = e.touches[0].clientY;
                  const startHeight = sheetHeight;
                  let hasMoved = false;
                  
                  const handleMove = (moveEvent: TouchEvent) => {
                    moveEvent.preventDefault();
                    const currentY = moveEvent.touches[0].clientY;
                    const deltaY = startY - currentY;
                    hasMoved = Math.abs(deltaY) > 10;
                    
                    // Swipe down to dismiss if dragging down significantly
                    if (deltaY < -100) {
                      setShowBottomSheet(false);
                      setSelectedMarker(null);
                      onSelectListing(null);
                      document.removeEventListener('touchmove', handleMove);
                      document.removeEventListener('touchend', handleEnd);
                      return;
                    }
                    
                    // Toggle between partial and full
                    if (deltaY > 50 && startHeight === 'partial') {
                      setSheetHeight('full');
                    } else if (deltaY < -50 && startHeight === 'full') {
                      setSheetHeight('partial');
                    }
                  };
                  
                  const handleEnd = () => {
                    if (!hasMoved) {
                      // If no significant movement, toggle height
                      setSheetHeight(startHeight === 'partial' ? 'full' : 'partial');
                    }
                    document.removeEventListener('touchmove', handleMove);
                    document.removeEventListener('touchend', handleEnd);
                  };
                  
                  document.addEventListener('touchmove', handleMove, { passive: false });
                  document.addEventListener('touchend', handleEnd);
                }}
                onClick={() => setSheetHeight(sheetHeight === 'partial' ? 'full' : 'partial')}
              >
                <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
              </div>

              {/* Header with Close Button */}
              <div className="flex items-center justify-between px-4 pb-3 border-b">
                <h3 className="text-lg font-bold text-gray-900">ព័ត៌មានលម្អិត</h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSheetHeight(sheetHeight === 'partial' ? 'full' : 'partial')}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronUp className={`w-5 h-5 transition-transform ${sheetHeight === 'full' ? 'rotate-180' : ''}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowBottomSheet(false);
                      setSelectedMarker(null);
                      onSelectListing(null);
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto h-[calc(100%-4rem)] px-2 sm:px-4 py-3 sm:py-4 scroll-smooth">
                <ListingCard 
                  listing={selectedMarker as Listing} 
                  onSelect={(listing) => {
                    setSelectedMarker(listing);
                    onSelectListing(listing);
                  }}
                />
              </div>
            </div>
          )}

          {/* Help Seeker Info (simpler display) */}
          {isInitialized && showBottomSheet && selectedMarker && !('title' in selectedMarker) && (
            <div 
              className="fixed bottom-0 left-0 right-0 z-[10000] bg-white rounded-t-3xl shadow-2xl transition-all duration-300 ease-out h-auto max-h-[40vh]"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  ត្រូវការជំនួយ
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowBottomSheet(false);
                    setSelectedMarker(null);
                  }}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="px-4 py-4">
                <p className="font-semibold text-lg mb-2">{(selectedMarker as HelpSeeker).name}</p>
                {(selectedMarker as HelpSeeker).help_type && (
                  <p className="text-gray-600 mb-1">ប្រភេទ: {(selectedMarker as HelpSeeker).help_type}</p>
                )}
                {(selectedMarker as HelpSeeker).urgency && (
                  <p className="text-red-600 font-medium">ការបន្ទាន់: {(selectedMarker as HelpSeeker).urgency}</p>
                )}
              </div>
            </div>
          )}

          {/* Backdrop */}
          {showBottomSheet && (
            <div 
              className="fixed inset-0 bg-black/20 z-[9999] transition-opacity"
              onClick={() => {
                setShowBottomSheet(false);
                setSelectedMarker(null);
                onSelectListing(null);
              }}
            />
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
