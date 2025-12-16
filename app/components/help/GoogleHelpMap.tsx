'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/app/components/ui/button';
import { 
  Phone, X, Navigation, ChevronUp, AlertCircle, 
  Home, Fuel, Car, HeartHandshake, Clock, MapPin, School,
  CheckCircle, ShieldCheck, ExternalLink, User, MapPin as LocationIcon
} from 'lucide-react';
import ListingCard from '@/app/components/help/ListingCard';
import { DANGEROUS_ZONES_DATA } from '@/app/components/help/DangerousZones';

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
  centerLocation?: { lat: number; lng: number } | null;
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
  onDrawnAreaChange,
  centerLocation
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
  const dangerousZonesRef = useRef<google.maps.Circle[]>([]);

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

  // Create dangerous zone overlays
  useEffect(() => {
    if (!isInitialized || !window.google?.maps) return;

    const mapElement = document.querySelector('gmp-map') as any;
    if (!mapElement?.innerMap) return;

    // Clear existing dangerous zone circles
    dangerousZonesRef.current.forEach(circle => {
      circle.setMap(null);
    });
    dangerousZonesRef.current = [];

    // Create circles for red zones (dangerous)
    DANGEROUS_ZONES_DATA.red.forEach(zone => {
      const coords = DANGEROUS_ZONES_DATA.coordinates[zone as keyof typeof DANGEROUS_ZONES_DATA.coordinates];
      if (coords) {
        const circle = new google.maps.Circle({
          map: mapElement.innerMap,
          center: coords,
          radius: 50000, // 50km radius - adjust as needed
          fillColor: '#DC2626', // Red
          fillOpacity: 0.2,
          strokeColor: '#DC2626',
          strokeOpacity: 0.6,
          strokeWeight: 2,
          zIndex: 0,
        });
        dangerousZonesRef.current.push(circle);
      }
    });

    // Create circles for orange zones (alert)
    DANGEROUS_ZONES_DATA.orange.forEach(zone => {
      const coords = DANGEROUS_ZONES_DATA.coordinates[zone as keyof typeof DANGEROUS_ZONES_DATA.coordinates];
      if (coords) {
        const circle = new google.maps.Circle({
          map: mapElement.innerMap,
          center: coords,
          radius: 50000, // 50km radius - adjust as needed
          fillColor: '#F97316', // Orange
          fillOpacity: 0.15,
          strokeColor: '#F97316',
          strokeOpacity: 0.5,
          strokeWeight: 2,
          zIndex: 0,
        });
        dangerousZonesRef.current.push(circle);
      }
    });

    // Cleanup function
    return () => {
      dangerousZonesRef.current.forEach(circle => {
        circle.setMap(null);
      });
      dangerousZonesRef.current = [];
    };
  }, [isInitialized]);

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

  // Center map when centerLocation changes
  useEffect(() => {
    if (!isInitialized || !centerLocation) return;
    
    const mapElement = document.querySelector('gmp-map') as any;
    if (!mapElement?.innerMap) return;
    
    mapElement.innerMap.panTo(centerLocation);
    mapElement.innerMap.setZoom(12);
  }, [centerLocation, isInitialized]);

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
          {isInitialized && showBottomSheet && selectedMarker && 'title' in selectedMarker && (() => {
            const listing = selectedMarker as Listing;
            const typeConfig: Record<string, { icon: any; label: string; color: string }> = {
              accommodation: { icon: Home, label: 'ស្នាក់នៅ', color: 'bg-blue-100 text-blue-700 border-blue-200' },
              fuel_service: { icon: Fuel, label: 'សេវាសាំង', color: 'bg-amber-100 text-amber-700 border-amber-200' },
              car_transportation: { icon: Car, label: 'ដឹកជញ្ជូន', color: 'bg-green-100 text-green-700 border-green-200' },
              volunteer_request: { icon: HeartHandshake, label: 'ត្រូវការស្ម័គ្រចិត្ត', color: 'bg-purple-100 text-purple-700 border-purple-200' },
              event: { icon: Clock, label: 'ព្រឹត្តិការណ៍', color: 'bg-pink-100 text-pink-700 border-pink-200' },
              site_sponsor: { icon: MapPin, label: 'ទីតាំងហ្រ្វី', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
              school: { icon: School, label: 'សាលារៀន', color: 'bg-teal-100 text-teal-700 border-teal-200' }
            };
            const statusConfig: Record<string, { label: string; color: string }> = {
              open: { label: 'បើក', color: 'bg-emerald-100 text-emerald-700' },
              limited: { label: 'មានកំណត់', color: 'bg-amber-100 text-amber-700' },
              full: { label: 'ពេញ', color: 'bg-red-100 text-red-700' },
              paused: { label: 'ផ្អាក', color: 'bg-gray-100 text-gray-700' }
            };
            const type = typeConfig[listing.type] || typeConfig.accommodation;
            const status = statusConfig[listing.status] || statusConfig.open;
            const TypeIcon = type.icon;

            return (
              <div 
                className={`fixed bottom-0 left-0 right-0 z-[10000] bg-white/95 backdrop-blur-sm rounded-t-2xl border-2 border-gray-200 shadow-2xl transition-all duration-300 ease-out ${
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
                      
                      if (deltaY < -100) {
                        setShowBottomSheet(false);
                        setSelectedMarker(null);
                        onSelectListing(null);
                        document.removeEventListener('touchmove', handleMove);
                        document.removeEventListener('touchend', handleEnd);
                        return;
                      }
                      
                      if (deltaY > 50 && startHeight === 'partial') {
                        setSheetHeight('full');
                      } else if (deltaY < -50 && startHeight === 'full') {
                        setSheetHeight('partial');
                      }
                    };
                    
                    const handleEnd = () => {
                      if (!hasMoved) {
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

                {/* Header */}
                <div className="px-4 pb-3 border-b-2 border-gray-200">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{listing.title}</h3>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-2 ${type.color}`}>
                          <TypeIcon className="w-4 h-4" />
                          <span className="text-xs font-semibold">{type.label}</span>
                      </div>
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${status.color}`}>
                          <span className="text-xs font-semibold">{status.label}</span>
                      </div>
                        {listing.verified && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 border-2 border-emerald-200">
                            <ShieldCheck className="w-4 h-4" />
                            <span className="text-xs font-semibold">បានផ្ទៀងផ្ទាត់</span>
                  </div>
                )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                        onClick={() => setSheetHeight(sheetHeight === 'partial' ? 'full' : 'partial')}
                        className="h-8 w-8 p-0"
                  >
                        <ChevronUp className={`w-4 h-4 transition-transform ${sheetHeight === 'full' ? 'rotate-180' : ''}`} />
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
                        <X className="w-4 h-4" />
                    </Button>
                          </div>
                        </div>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto h-[calc(100%-8rem)] px-4 py-4 space-y-3 scroll-smooth">
                  {/* Location Info */}
                  {listing.area && (
                    <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-2xl border-2 border-gray-200">
                      <LocationIcon className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-600 font-medium mb-0.5">ទីតាំង</p>
                        <p className="text-sm font-semibold text-gray-900">{listing.area}</p>
                        {listing.exact_location && listing.location_consent && (
                          <p className="text-xs text-gray-600 mt-1">{listing.exact_location}</p>
                        )}
                          </div>
                        </div>
                      )}
                      
                  {/* Contact Info */}
                  {(listing.contact_phone || listing.contact_name) && (
                    <div className="space-y-2">
                      {listing.contact_name && (
                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-2xl border-2 border-gray-200">
                          <User className="w-4 h-4 text-gray-600" />
                          <div>
                            <p className="text-xs text-gray-600 font-medium">អ្នកទំនាក់ទំនង</p>
                            <p className="text-sm font-semibold text-gray-900">{listing.contact_name}</p>
                          </div>
                        </div>
                      )}
                      {listing.contact_phone && (
                        <Button
                          onClick={() => {
                            const phone = listing.contact_phone?.replace(/[^0-9+]/g, '') || '';
                            window.location.href = `tel:${phone}`;
                          }}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base py-4 rounded-2xl transition-all active:scale-[0.98]"
                        >
                          <Phone className="w-5 h-5 mr-2" />
                          ទូរស័ព្ទ: {listing.contact_phone}
                        </Button>
                      )}
                        </div>
                      )}
                      
                  {/* Additional Info */}
                  {listing.notes && (
                    <div className="p-3 bg-blue-50 rounded-2xl border-2 border-blue-200">
                      <p className="text-xs text-blue-700 font-medium mb-1">កំណត់ចំណាំ</p>
                      <p className="text-sm text-blue-900 leading-relaxed">{listing.notes}</p>
                        </div>
                      )}

                  {/* Source Info */}
                  {listing.reference_link && (
                    <a
                      href={listing.reference_link}
                              target="_blank"
                              rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-2 p-3 bg-indigo-50 rounded-2xl border-2 border-indigo-200 hover:bg-indigo-100 transition-all"
                    >
                      <ExternalLink className="w-4 h-4 text-indigo-600" />
                      <div className="flex-1">
                        <p className="text-xs text-indigo-700 font-medium">ប្រភពទិន្នន័យ</p>
                        <p className="text-xs text-indigo-600 truncate">{listing.reference_link}</p>
                      </div>
                    </a>
                  )}

                  {/* View Full Details Button */}
                  <Button
                    variant="outline"
                    onClick={() => {
                      onSelectListing(listing);
                      setShowBottomSheet(false);
                    }}
                    className="w-full border-2 rounded-2xl py-3"
                  >
                    មើលព័ត៌មានលម្អិតទាំងអស់
                  </Button>
                          </div>
                        </div>
            );
          })()}

          {/* Help Seeker Info */}
          {isInitialized && showBottomSheet && selectedMarker && !('title' in selectedMarker) && (() => {
            const seeker = selectedMarker as HelpSeeker;
            return (
              <div 
                className="fixed bottom-0 left-0 right-0 z-[10000] bg-white/95 backdrop-blur-sm rounded-t-2xl border-2 border-red-200 shadow-2xl transition-all duration-300 ease-out h-auto max-h-[50vh]"
              >
                {/* Drag Handle */}
                <div className="flex justify-center pt-3 pb-2">
                  <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
                </div>

                {/* Header */}
                <div className="px-4 pb-3 border-b-2 border-red-200">
                  <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-red-100 rounded-full">
                          <AlertCircle className="w-5 h-5 text-red-600" />
                            </div>
                        <h3 className="text-lg font-bold text-red-600">ត្រូវការជំនួយ</h3>
                          </div>
                      <p className="text-base font-semibold text-gray-900">{seeker.name}</p>
                        </div>
                    <Button 
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowBottomSheet(false);
                        setSelectedMarker(null);
                      }}
                      className="h-8 w-8 p-0 flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                  </Button>
                  </div>
                  </div>

                {/* Content */}
                <div className="px-4 py-4 space-y-3">
                  {/* Help Type */}
                  {seeker.help_type && (
                    <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-2xl border-2 border-amber-200">
                      <HeartHandshake className="w-4 h-4 text-amber-600" />
                      <div>
                        <p className="text-xs text-amber-700 font-medium">ប្រភេទជំនួយ</p>
                        <p className="text-sm font-semibold text-amber-900">{seeker.help_type}</p>
          </div>
          </div>
                  )}

                  {/* Urgency */}
                  {seeker.urgency && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 rounded-2xl border-2 border-red-200">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <div>
                        <p className="text-xs text-red-700 font-medium">ការបន្ទាន់</p>
                        <p className="text-sm font-bold text-red-900">{seeker.urgency}</p>
          </div>
          </div>
                  )}

                  {/* Location Info */}
                  {seeker.latitude && seeker.longitude && (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-2xl border-2 border-gray-200">
                      <LocationIcon className="w-4 h-4 text-gray-600" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-600 font-medium">កូអរឌីណេ</p>
                        <p className="text-xs text-gray-900 font-mono">{seeker.latitude.toFixed(6)}, {seeker.longitude.toFixed(6)}</p>
          </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${seeker.latitude},${seeker.longitude}`, '_blank')}
                        className="text-xs h-8 px-2 rounded-2xl border-2"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Maps
                      </Button>
          </div>
                  )}

                  {/* Call to Action */}
                  <div className="pt-2">
                    <p className="text-xs text-gray-600 text-center mb-2">
                      សូមទាក់ទងជាមួយអ្នកដែលត្រូវការជំនួយតាមរយៈផ្លូវការណ៍
                    </p>
          </div>
          </div>
          </div>
            );
          })()}

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
