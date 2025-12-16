'use client'

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/app/components/Layout';
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Sheet, SheetContent, SheetTrigger } from '@/app/components/ui/sheet';
import { 
  Map, List, Filter, Plus, Locate, Wifi, WifiOff,
  Menu, X, Search, Home as HomeIcon, Fuel, Car, HeartHandshake, Clock, MapPin, School, AlertCircle, Stethoscope
} from 'lucide-react';
import { Input } from '@/app/components/ui/input';

import ListingCard from '@/app/components/help/ListingCard';
// import FilterPanel from '@/app/components/help/FilterPanel';
import AISummary from '@/app/components/help/AISummary';
import GoogleHelpMap from '@/app/components/help/GoogleHelpMap';
import TextListView from '@/app/components/help/TextListView';
import SafetyNotice from '@/app/components/help/SafetyNotice';
import SubmitListingForm from '@/app/components/forms/SubmitListingForm';
import DetailedListingDialog from '@/app/components/help/DetailedListingDialog';
import SeekHelpDialog from '@/app/components/help/SeekHelpDialog';
import DangerousZones from '@/app/components/help/DangerousZones';
// import FilterSummaryPanel from '@/app/components/help/FilterSummaryPanel';

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
  exact_location?: string;
  family_friendly?: boolean;
  verified?: boolean;
  created_date: string;
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

interface FilterState {
  type: string | null;
  status: string | null;
  area: string | null;
  familyFriendly: boolean;
  verifiedOnly: boolean;
}

interface DrawnArea {
  type: 'polygon' | 'circle';
  coordinates?: Array<{ lat: number; lng: number }>;
  center?: { lat: number; lng: number };
  radius?: number;
}

export default function Home() {
  const [lowBandwidth, setLowBandwidth] = useState<boolean>(false);
  // const [showFilters, setShowFilters] = useState<boolean>(false);
  const [showSubmitForm, setShowSubmitForm] = useState<boolean>(false);
  const [showSeekHelp, setShowSeekHelp] = useState<boolean>(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [detailedListing, setDetailedListing] = useState<Listing | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [userArea, setUserArea] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [sortBy, setSortBy] = useState<'recent' | 'distance' | 'verified'>('recent');
  const [radiusKm, setRadiusKm] = useState<number | null>(null);
  const [drawnArea, setDrawnArea] = useState<DrawnArea | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [showOfflineAlert, setShowOfflineAlert] = useState<boolean>(false);
  const [filters, setFilters] = useState<FilterState>({
    type: null,
    status: null,
    area: null,
    familyFriendly: false,
    verifiedOnly: false
  });

  // Monitor internet connectivity
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineAlert(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineAlert(true);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      // Check initial status
      setIsOnline(navigator.onLine);
      if (!navigator.onLine) {
        setShowOfflineAlert(true);
      }

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // Fetch listings with real-time updates (refetch every 10 seconds)
  const { data: listings = [], isLoading, refetch } = useQuery({
    queryKey: ['listings'],
    queryFn: async () => {
      const res = await fetch('/api/listings?sort=-created_at&limit=100');
      if (!res.ok) throw new Error('Failed to fetch listings');
      const data = await res.json();
      return data.map((item: any) => ({
        ...item,
        created_date: item.created_date || item.created_at || new Date().toISOString()
      }));
    },
    refetchInterval: isOnline ? 10000 : false, // Auto-refresh every 10 seconds only when online
    refetchIntervalInBackground: isOnline,
    enabled: isOnline || lowBandwidth // Allow query when online or in offline mode
  });

  // Fetch help seekers with real-time updates
  const { data: helpSeekers = [] } = useQuery<HelpSeeker[]>({
    queryKey: ['helpSeekers'],
    queryFn: async () => {
      const res = await fetch('/api/help-seekers?status=active');
      if (!res.ok) throw new Error('Failed to fetch help seekers');
      return await res.json();
    },
    refetchInterval: isOnline ? 10000 : false,
    refetchIntervalInBackground: isOnline,
    enabled: isOnline || lowBandwidth
  });

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Check if point is inside polygon
  const isPointInPolygon = (point: { lat: number; lng: number }, polygon: Array<{ lat: number; lng: number }>): boolean => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lat, yi = polygon[i].lng;
      const xj = polygon[j].lat, yj = polygon[j].lng;
      const intersect = ((yi > point.lng) !== (yj > point.lng))
        && (point.lat < (xj - xi) * (point.lng - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  // Check if point is inside circle
  const isPointInCircle = (point: { lat: number; lng: number }, center: { lat: number; lng: number }, radius: number): boolean => {
    const distance = calculateDistance(point.lat, point.lng, center.lat, center.lng);
    return distance * 1000 <= radius; // radius is in meters
  };

  // Filter and sort listings
  let filteredListings = (listings || []).filter((listing: Listing) => {
    // Basic filters
    if (filters.type && listing.type !== filters.type) return false;
    if (filters.status && listing.status !== filters.status) return false;
    if (filters.area && listing.area !== filters.area) return false;
    if (filters.familyFriendly && !listing.family_friendly) return false;
    if (filters.verifiedOnly && !listing.verified) return false;
    if (listing.status === 'full' || listing.status === 'paused') return false;

    // Keyword search (search in title, notes, area, contact_name)
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase();
      const searchableText = [
        listing.title,
        listing.notes,
        listing.area,
        listing.contact_name,
        listing.exact_location
      ].filter(Boolean).join(' ').toLowerCase();
      
      if (!searchableText.includes(keyword)) return false;
    }

    // Radius search (only if user location and radius are set)
    if (radiusKm && userLocation && listing.latitude && listing.longitude) {
      const distance = calculateDistance(
        userLocation[0], 
        userLocation[1], 
        listing.latitude, 
        listing.longitude
      );
      if (distance > radiusKm) return false;
    }

    // Drawn area search (polygon or circle)
    if (drawnArea && listing.latitude && listing.longitude) {
      const point = { lat: listing.latitude, lng: listing.longitude };

      if (drawnArea.type === 'polygon') {
        if (!drawnArea.coordinates || !isPointInPolygon(point, drawnArea.coordinates)) return false;
      } else if (drawnArea.type === 'circle') {
        if (!drawnArea.center || !drawnArea.radius || !isPointInCircle(point, drawnArea.center, drawnArea.radius)) return false;
      }
    }

    return true;
  });

  // Sort listings
  filteredListings = [...filteredListings].sort((a, b) => {
    if (sortBy === 'verified') {
      if (a.verified && !b.verified) return -1;
      if (!a.verified && b.verified) return 1;
    }
    
    if (sortBy === 'distance' && userLocation) {
      const distA = (a.latitude && a.longitude) 
        ? calculateDistance(userLocation[0], userLocation[1], a.latitude, a.longitude)
        : Infinity;
      const distB = (b.latitude && b.longitude)
        ? calculateDistance(userLocation[0], userLocation[1], b.latitude, b.longitude)
        : Infinity;
      return distA - distB;
    }

    // Default: recent (by created_date)
    return new Date(b.created_date).getTime() - new Date(a.created_date).getTime();
  });

  // Get unique areas/cities
  const areas: string[] = [...new Set((listings || []).map((l: Listing) => l.area).filter(Boolean) as string[])];
  
  // Calculate city centers (average coordinates of listings in each city)
  const cityCenters = useMemo(() => {
    const centers: Record<string, { lat: number; lng: number; count: number }> = {};
    
    listings.forEach((listing: Listing) => {
      if (listing.area && listing.latitude && listing.longitude) {
        if (!centers[listing.area]) {
          centers[listing.area] = { lat: 0, lng: 0, count: 0 };
        }
        centers[listing.area].lat += listing.latitude;
        centers[listing.area].lng += listing.longitude;
        centers[listing.area].count += 1;
      }
    });
    
    // Calculate averages
    const result: Record<string, { lat: number; lng: number }> = {};
    Object.keys(centers).forEach((city) => {
      const center = centers[city];
      result[city] = {
        lat: center.lat / center.count,
        lng: center.lng / center.count,
      };
    });
    
    return result;
  }, [listings]);
  
  // Selected city center for map
  const [selectedCityCenter, setSelectedCityCenter] = useState<{ lat: number; lng: number } | null>(null);
  
  // Update map center when city filter changes
  useEffect(() => {
    if (filters.area && cityCenters[filters.area]) {
      setSelectedCityCenter(cityCenters[filters.area]);
    } else {
      setSelectedCityCenter(null);
    }
  }, [filters.area, cityCenters]);

  // Get user location
  const handleLocate = (): void => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
          setUserArea('Your Location');
        },
        (error) => {
          console.error('Location error:', error);
        }
      );
    }
  };

  // Auto-detect user location on mount
  useEffect(() => {
    handleLocate();
  }, []);

  // Auto-detect connection speed
  useEffect(() => {
    if ('connection' in navigator) {
      const conn = (navigator as any).connection;
      if (conn && (conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g')) {
        setLowBandwidth(true);
      }
    }
  }, []);

  return (
    <Layout>
    <div className="h-screen overflow-hidden flex flex-col">
      {/* Compact Header */}
      <header className="bg-white border-b z-50 shadow-sm shrink-0 transition-all">
        <div className="px-2 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden h-8 w-8 p-0 flex-shrink-0"
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <h1 className="text-base sm:text-xl lg:text-2xl font-bold text-[#105090] truncate">
              ចង់ជួយ
            </h1>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLowBandwidth(!lowBandwidth)}
              className="h-8 w-8 p-0 hidden sm:flex"
            >
              {lowBandwidth ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
            </Button>

            <Button
              size="sm"
              onClick={() => setShowSeekHelp(true)}
              className="bg-red-600 hover:bg-red-700 text-white rounded-full font-semibold text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 h-auto transition-all"
            >
              <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1.5" />
              <span className="hidden xs:inline">ត្រូវការជំនួយ</span>
            </Button>

            <Sheet open={showSubmitForm} onOpenChange={setShowSubmitForm}>
              <SheetTrigger asChild>
                <Button 
                  size="sm"
                  className="rounded-full font-semibold text-xs sm:text-sm bg-[#105090] hover:bg-[#0d3d6f] px-2 sm:px-4 py-1.5 sm:py-2 h-auto transition-all"
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">ផ្តល់ជំនួយ</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-md">
                <SubmitListingForm 
                  onSuccess={() => {
                    setShowSubmitForm(false);
                    refetch();
                  }}
                  onCancel={() => setShowSubmitForm(false)}
                />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content: Map + Sidebar */}
      <div className="flex-1 relative overflow-hidden">
        {/* Offline Alert */}
        {showOfflineAlert && !lowBandwidth && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] bg-amber-50 border-2 border-amber-200 rounded-2xl shadow-2xl p-4 max-w-md mx-4">
            <div className="flex items-start gap-3">
              <WifiOff className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-bold text-sm text-gray-900 mb-1">គ្មានការភ្ជាប់អ៊ីនធឺណិត</h3>
                <p className="text-xs text-gray-600 mb-3">អ្នកអាចប្តូរទៅរបៀបអនឡាញដើម្បីមើលទិន្នន័យដែលបានផ្ទុករួច។</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setLowBandwidth(true);
                      setShowOfflineAlert(false);
                    }}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-8 px-3 rounded-2xl"
                  >
                    ប្តូរទៅរបៀបអនឡាញ
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowOfflineAlert(false)}
                    className="text-xs h-8 px-3 rounded-2xl border-2"
                  >
                    បិទ
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Full Screen Map */}
        {!lowBandwidth ? (
          <div className="absolute inset-0">
            <GoogleHelpMap 
              listings={filteredListings}
              onSelectListing={(listing) => {
                if (listing) {
                  // Ensure created_date exists
                  const listingWithDate = {
                    ...listing,
                    created_date: listing.created_date || (listing as any).created_at || new Date().toISOString()
                  };
                  setSelectedListing(listingWithDate);
                } else {
                  setSelectedListing(null);
                }
              }}
              userLocation={userLocation}
              selectedListing={selectedListing}
              onRecenterRequest={handleLocate}
              helpSeekers={helpSeekers}
              onDrawnAreaChange={setDrawnArea}
              centerLocation={selectedCityCenter}
            />
          </div>
        ) : (
          <div className="absolute inset-0 overflow-auto bg-gray-50 p-2 sm:p-4 scroll-smooth">
            {/* Filters for Low Bandwidth Mode */}
            <div className="sticky top-0 bg-white z-10 p-2 sm:p-3 lg:p-4 border-b shadow-sm mb-2 sm:mb-4 space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm sm:text-base lg:text-lg">តម្រង ({filteredListings.length} ទំនេរ)</h3>
                {/* <Sheet open={showFilters} onOpenChange={setShowFilters}>
                  <SheetTrigger asChild>
                    <Button size="sm" variant="outline" className="h-7 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm">
                      <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
                      ច្រើនទៀត
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-auto max-h-[85vh] rounded-t-2xl overflow-y-auto">
                    <FilterPanel 
                      filters={filters} 
                      onFilterChange={setFilters}
                      areas={areas}
                      searchKeyword={searchKeyword}
                      onSearchChange={setSearchKeyword}
                      sortBy={sortBy}
                      onSortChange={setSortBy}
                      radiusKm={radiusKm}
                      onRadiusChange={setRadiusKm}
                      hasUserLocation={!!userLocation}
                    />
                  </SheetContent>
                </Sheet> */}
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                <Input
                  placeholder="ស្វែងរក..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="pl-8 sm:pl-10 h-9 sm:h-10 text-sm sm:text-base"
                />
              </div>

              {/* City Filter for Offline Mode */}
              {areas.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-2 sm:p-2.5 border border-gray-200">
                  <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#105090]" />
                    តម្រងតាមទីក្រុង
                  </label>
                  <select
                    value={filters.area || 'all'}
                    onChange={(e) => {
                      const area = e.target.value === 'all' ? null : e.target.value;
                      setFilters({...filters, area});
                    }}
                    className="w-full text-xs sm:text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 outline-none focus:ring-2 focus:ring-[#105090] focus:border-[#105090]"
                  >
                    <option value="all">ទាំងអស់</option>
                    {areas.sort().map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Quick Filters */}
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {['all', 'accommodation', 'fuel_service', 'car_transportation', 'volunteer_request', 'event'].map((type) => {
                  const getIcon = () => {
                    switch(type) {
                      case 'all': return Filter;
                      case 'accommodation': return HomeIcon;
                      case 'fuel_service': return Fuel;
                      case 'car_transportation': return Car;
                      case 'volunteer_request': return HeartHandshake;
                      case 'event': return Clock;
                      default: return Filter;
                    }
                  };
                  const Icon = getIcon();
                  const isActive = filters.type === type || (type === 'all' && !filters.type);
                  return (
                    <Button
                      key={type}
                      size="sm"
                      variant={isActive ? 'default' : 'outline'}
                      onClick={() => setFilters({...filters, type: type === 'all' ? null : type})}
                      style={isActive ? { backgroundColor: '#105090' } : {}}
                      className={`rounded-full text-xs sm:text-sm px-2 sm:px-3 py-1 h-auto transition-all ${
                        isActive
                          ? 'text-white hover:opacity-90'
                          : ''
                      }`}
                    >
                      {type === 'all' ? (
                        <>
                          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                          ទាំងអស់
                        </>
                      ) : (
                        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>

            <TextListView listings={filteredListings} />
          </div>
        )}

        {/* Overlay Controls */}
        {!lowBandwidth && (
          <>
            {/* Top Controls Bar */}
            <div className="absolute top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 z-10 flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {/* City Filter */}
              {areas.length > 0 && (
                <div className="bg-white rounded-full shadow-lg px-2 sm:px-3 py-1 sm:py-1.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#105090] flex-shrink-0" />
                  <select
                    value={filters.area || 'all'}
                    onChange={(e) => {
                      const area = e.target.value === 'all' ? null : e.target.value;
                      setFilters({...filters, area});
                    }}
                    className="text-xs sm:text-sm font-medium text-gray-900 bg-transparent border-none outline-none cursor-pointer pr-4 appearance-none"
                  >
                    <option value="all">ទាំងអស់</option>
                    {areas.sort().map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {/* Filter Pills - Scrollable on mobile */}
              <div className="bg-white rounded-full shadow-lg p-1 sm:p-1.5 flex items-center gap-1 sm:gap-2 flex-wrap max-w-[calc(100%-5rem)] sm:max-w-none overflow-x-auto scrollbar-hide">
                  {['all', 'accommodation', 'fuel_service', 'car_transportation', 'volunteer_request', 'medical_care', 'event', 'site_sponsor', 'school'].map((type) => {
                    const getIcon = () => {
                      switch(type) {
                        case 'all': return Filter;
                        case 'accommodation': return HomeIcon;
                        case 'fuel_service': return Fuel;
                        case 'car_transportation': return Car;
                        case 'volunteer_request': return HeartHandshake;
                        case 'medical_care': return Stethoscope;
                        case 'event': return Clock;
                        case 'site_sponsor': return MapPin;
                        case 'school': return School;
                        default: return Filter;
                      }
                    };
                    const Icon = getIcon();
                    const getLabel = () => {
                      switch(type) {
                        case 'all': return 'ទាំងអស់';
                        case 'accommodation': return 'ស្នាក់នៅ';
                        case 'fuel_service': return 'សាំង';
                        case 'car_transportation': return 'ដឹកជញ្ជូន';
                        case 'volunteer_request': return 'ស្ម័គ្រចិត្ត';
                        case 'medical_care': return 'សុខាភិបាល';
                        case 'event': return 'ព្រឹត្តិការណ៍';
                        case 'site_sponsor': return 'ទីតាំងហ្រ្វី';
                        case 'school': return 'សាលា';
                        default: return '';
                      }
                    };
                    return (
                      <Button
                        key={type}
                        size="sm"
                        variant={filters.type === type || (type === 'all' && !filters.type) ? 'default' : 'ghost'}
                        onClick={() => setFilters({...filters, type: type === 'all' ? null : type})}
                        className={`rounded-full text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 sm:py-1.5 h-auto transition-all ${filters.type === type || (type === 'all' && !filters.type) 
                          ? 'bg-[#105090] hover:bg-[#0d3d6f] text-white' 
                          : ''}`}
                      >
                        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1.5" />
                        <span className="hidden sm:inline">{getLabel()}</span>
                      </Button>
                    );
                  })}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                {/* Locate Button */}
                <Button
                  size="sm"
                  onClick={handleLocate}
                  className="bg-white rounded-full shadow-lg h-8 w-8 p-0 transition-all hover:scale-105"
                  variant="ghost"
                >
                  <Locate className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Button>

                {/* More Filters */}
                {/* <Sheet open={showFilters} onOpenChange={setShowFilters}>
                  <SheetTrigger asChild>
                    <Button 
                      size="sm"
                      variant="ghost"
                      className="bg-white rounded-full shadow-lg h-8 w-8 p-0 transition-all hover:scale-105"
                    >
                      <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-auto max-h-[85vh] rounded-t-2xl overflow-y-auto">
                    <FilterPanel 
                      filters={filters} 
                      onFilterChange={setFilters}
                      areas={areas}
                      searchKeyword={searchKeyword}
                      onSearchChange={setSearchKeyword}
                      sortBy={sortBy}
                      onSortChange={setSortBy}
                      radiusKm={radiusKm}
                      onRadiusChange={setRadiusKm}
                      hasUserLocation={!!userLocation}
                    />
                  </SheetContent>
                </Sheet> */}
              </div>
            </div>

            {/* Results Count Badge */}
            <div className="absolute top-14 sm:top-20 left-2 sm:left-4 z-10 bg-white rounded-full shadow-lg px-2.5 sm:px-4 py-1.5 sm:py-2 flex items-center gap-2 sm:gap-3 transition-all">
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs sm:text-base font-bold">{filteredListings.length} ទំនេរ</span>
              {drawnArea && (
                <span className="text-xs text-gray-500 hidden sm:flex items-center gap-1">
                  <Search className="w-3 h-3" />
                  តំបន់ផ្ទាល់ខ្លួន
                </span>
              )}
            </div>

          </>
        )}

        {/* Collapsible Sidebar */}
        <div 
          className={`absolute top-0 bottom-0 left-0 z-30 bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } w-full sm:w-96 overflow-hidden flex flex-col`}
        >
          {/* Sidebar Header */}
          <div className="p-2 sm:p-3 border-b bg-gradient-to-r from-blue-50 to-teal-50 shrink-0">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">ជំនួយដែលមាន</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="h-7 w-7 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <AISummary 
              listings={filteredListings} 
              userLocation={userLocation ? { lat: userLocation[0], lng: userLocation[1] } : null}
              selectedCity={filters.area || null}
            />
            <div className="mt-2 sm:mt-3">
              <DangerousZones />
            </div>
          </div>

          {/* Sidebar Filters */}
          <div className="p-2 sm:p-3 border-b bg-white shrink-0 space-y-2 sm:space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-4 sm:h-4 text-gray-400" />
              <Input
                placeholder="ស្វែងរក..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-8 sm:pl-10 text-sm sm:text-base h-9 sm:h-10"
              />
            </div>

            {/* Quick Type Filters */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {['all', 'accommodation', 'fuel_service', 'car_transportation', 'volunteer_request', 'event'].map((type) => {
                const getIcon = () => {
                  switch(type) {
                    case 'all': return Filter;
                    case 'accommodation': return HomeIcon;
                    case 'fuel_service': return Fuel;
                    case 'car_transportation': return Car;
                    case 'volunteer_request': return HeartHandshake;
                    case 'event': return Clock;
                    default: return Filter;
                  }
                };
                const Icon = getIcon();
                const isActive = filters.type === type || (type === 'all' && !filters.type);
                return (
                  <Button
                    key={type}
                    size="sm"
                    variant={isActive ? 'default' : 'outline'}
                    onClick={() => setFilters({...filters, type: type === 'all' ? null : type})}
                    style={isActive ? { backgroundColor: '#105090' } : {}}
                    className={`rounded-full text-xs sm:text-sm px-2 sm:px-3 py-1 h-auto transition-all ${
                      isActive
                        ? 'text-white hover:opacity-90'
                        : ''
                    }`}
                  >
                    {type === 'all' ? (
                      <>
                        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                        ទាំងអស់
                      </>
                    ) : (
                      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    )}
                  </Button>
                );
              })}
            </div>

            {/* More Filters Button */}
            {/* <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(true)}
              className="w-full text-xs sm:text-sm font-medium h-8 sm:h-9"
            >
              <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
              ច្រើនទៀត
            </Button> */}
          </div>

          {/* Listings */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-2 sm:space-y-3 scroll-smooth">
            {isLoading ? (
              <div className="text-center py-8 sm:py-12">
                <div className="animate-spin w-6 h-6 sm:w-8 sm:h-8 border-3 sm:border-4 border-teal-500 border-t-transparent rounded-full mx-auto" />
                <p className="text-gray-500 mt-2 sm:mt-3 text-xs sm:text-sm">កំពុងផ្ទុក...</p>
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <p className="text-gray-500 text-sm sm:text-base">មិនមានជំនួយ</p>
                <Button 
                  variant="link" 
                  onClick={() => {
                    setFilters({ type: null, status: null, area: null, familyFriendly: false, verifiedOnly: false });
                    setSearchKeyword('');
                    setRadiusKm(null);
                    setDrawnArea(null);
                  }}
                  className="text-[#105090] text-xs sm:text-sm mt-2"
                  size="sm"
                >
                  លុបតម្រងទាំងអស់
                </Button>
              </div>
            ) : (
              filteredListings.map((listing: Listing) => (
                <div
                  key={listing.id}
                  onClick={() => {
                    setSelectedListing(listing);
                    setDetailedListing(listing);
                  }}
                  className={`cursor-pointer transition-all transform hover:scale-[1.02] ${
                    selectedListing?.id === listing.id 
                      ? 'ring-2 ring-blue-500 rounded-lg' 
                      : ''
                  }`}
                >
                  <ListingCard listing={listing} compact />
                </div>
              ))
            )}
          </div>

          {/* Sidebar Footer */}
          <div className="p-2 sm:p-3 border-t bg-gray-50 shrink-0">
            <SafetyNotice compact />
          </div>
        </div>

        {/* Toggle Sidebar Button (when closed) */}
        {!sidebarOpen && !lowBandwidth && (
          <Button
            onClick={() => setSidebarOpen(true)}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 bg-white shadow-xl rounded-full w-10 h-10 sm:w-12 sm:h-12 p-0 transition-all hover:scale-110"
            variant="ghost"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
          </Button>
        )}
      </div>

      {/* Detailed Listing Dialog */}
      <DetailedListingDialog
        listing={detailedListing}
        open={!!detailedListing}
        onClose={() => setDetailedListing(null)}
      />

      {/* Seek Help Dialog */}
      <SeekHelpDialog
        open={showSeekHelp}
        onClose={() => setShowSeekHelp(false)}
        userLocation={userLocation}
      />
    </div>
    </Layout>
  );
}