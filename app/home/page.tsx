'use client'

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabaseApi } from '@/api/supabaseClient';
import Layout from '@/app/components/Layout';
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Sheet, SheetContent, SheetTrigger } from '@/app/components/ui/sheet';
import { 
  Map, List, Filter, Plus, Locate, Wifi, WifiOff,
  Menu, X, Search
} from 'lucide-react';
import { Input } from '@/app/components/ui/input';

import ListingCard from '@/app/components/help/ListingCard';
import FilterPanel from '@/app/components/help/FilterPanel';
import AISummary from '@/app/components/help/AISummary';
import GoogleHelpMap from '@/app/components/help/GoogleHelpMap';
import TextListView from '@/app/components/help/TextListView';
import SafetyNotice from '@/app/components/help/SafetyNotice';
import SubmitListingForm from '@/app/components/forms/SubmitListingForm';
import DetailedListingDialog from '@/app/components/help/DetailedListingDialog';
import SeekHelpDialog from '@/app/components/help/SeekHelpDialog';
import FilterSummaryPanel from '@/app/components/help/FilterSummaryPanel';

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
  const [showFilters, setShowFilters] = useState<boolean>(false);
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
  const [filters, setFilters] = useState<FilterState>({
    type: null,
    status: null,
    area: null,
    familyFriendly: false,
    verifiedOnly: false
  });

  // Fetch listings with real-time updates (refetch every 10 seconds)
  const { data: listings = [], isLoading, refetch } = useQuery({
    queryKey: ['listings'],
    queryFn: async () => {
      const data = await supabaseApi.entities.Listing.list('-created_at', 100);
      return data.map((item: any) => ({
        ...item,
        created_date: item.created_at || new Date().toISOString()
      }));
    },
    refetchInterval: 10000, // Auto-refresh every 10 seconds
    refetchIntervalInBackground: true
  });

  // Fetch help seekers with real-time updates
  const { data: helpSeekers = [] } = useQuery<HelpSeeker[]>({
    queryKey: ['helpSeekers'],
    queryFn: () => supabaseApi.entities.HelpSeeker.filter({ status: 'active' }),
    refetchInterval: 10000,
    refetchIntervalInBackground: true
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

  // Get unique areas
  const areas: string[] = [...new Set((listings || []).map((l: Listing) => l.area).filter(Boolean) as string[])];

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
      <header className="bg-white border-b z-50 shadow-sm shrink-0">
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </Button>
            <h1 className="text-2xl font-bold text-[#105090]">
              ជំនួយពលរដ្ឋកម្ពុជា
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLowBandwidth(!lowBandwidth)}
            >
              {lowBandwidth ? <WifiOff className="w-6 h-6" /> : <Wifi className="w-6 h-6" />}
            </Button>

            <Button
              size="lg"
              onClick={() => setShowSeekHelp(true)}
              className="bg-red-600 hover:bg-red-700 text-white rounded-full font-bold"
            >
              🆘 ត្រូវការជំនួយ
            </Button>

            <Sheet open={showSubmitForm} onOpenChange={setShowSubmitForm}>
              <SheetTrigger asChild>
                <Button 
                  size="lg"
                  className="rounded-full font-bold text-base bg-[#105090] hover:bg-[#0d3d6f]"
                >
                  <Plus className="w-5 h-5 mr-2" />
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
            />
          </div>
        ) : (
          <div className="absolute inset-0 overflow-auto bg-gray-50 p-4">
            {/* Filters for Low Bandwidth Mode */}
            <div className="sticky top-0 bg-white z-10 p-4 border-b shadow-sm mb-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">តម្រង ({filteredListings.length} ទំនេរ)</h3>
                <Sheet open={showFilters} onOpenChange={setShowFilters}>
                  <SheetTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Filter className="w-4 h-4 mr-2" />
                      ច្រើនទៀត
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-2xl overflow-y-auto">
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
                </Sheet>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="ស្វែងរក..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Quick Filters */}
              <div className="flex flex-wrap gap-2">
                {['all', 'accommodation', 'fuel_service', 'car_transportation', 'volunteer_request', 'event'].map((type) => (
                  <Button
                    key={type}
                    size="sm"
                    variant={filters.type === type || (type === 'all' && !filters.type) ? 'default' : 'outline'}
                    onClick={() => setFilters({...filters, type: type === 'all' ? null : type})}
                    className={`text-xs ${filters.type === type || (type === 'all' && !filters.type) 
                      ? 'bg-[#105090] hover:bg-[#0d3d6f] text-white' 
                      : ''}`}
                  >
                    {type === 'all' ? 'ទាំងអស់' : 
                     type === 'accommodation' ? '🏠' :
                     type === 'fuel_service' ? '⛽' :
                     type === 'car_transportation' ? '🚗' : 
                     type === 'volunteer_request' ? '🤝' : '📅'}
                  </Button>
                ))}
              </div>
            </div>

            <TextListView listings={filteredListings} />
          </div>
        )}

        {/* Overlay Controls */}
        {!lowBandwidth && (
          <>
            {/* Top Controls Bar */}
            <div className="absolute top-4 left-4 right-4 z-10 flex items-center gap-2 flex-wrap">
              {/* Filter Pills */}
              <div className="bg-white rounded-full shadow-lg p-1.5 flex items-center gap-2 flex-wrap">
                  {['all', 'accommodation', 'fuel_service', 'car_transportation', 'volunteer_request', 'event', 'site_sponsor', 'school'].map((type) => (
                    <Button
                      key={type}
                      size="lg"
                      variant={filters.type === type || (type === 'all' && !filters.type) ? 'default' : 'ghost'}
                      onClick={() => setFilters({...filters, type: type === 'all' ? null : type})}
                      className={`rounded-full text-base font-semibold px-4 ${filters.type === type || (type === 'all' && !filters.type) 
                        ? 'bg-[#105090] hover:bg-[#0d3d6f] text-white' 
                        : ''}`}
                    >
                    {type === 'all' ? '🔍 ទាំងអស់' : 
                     type === 'accommodation' ? '🏠 ស្នាក់នៅ' :
                     type === 'fuel_service' ? '⛽ សាំង' :
                     type === 'car_transportation' ? '🚗 ដឹកជញ្ជូន' : 
                     type === 'volunteer_request' ? '🤝 ស្ម័គ្រចិត្ត' :
                     type === 'event' ? '📅 ព្រឹត្តិការណ៍' :
                     type === 'site_sponsor' ? '📍 ទីតាំង' : '🏫 សាលា'}
                  </Button>
                ))}
              </div>

              {/* Locate Button */}
              <Button
                size="sm"
                onClick={handleLocate}
                className="bg-white rounded-full shadow-lg"
                variant="ghost"
              >
                <Locate className="w-4 h-4" />
              </Button>

              {/* More Filters */}
              <Sheet open={showFilters} onOpenChange={setShowFilters}>
                <SheetTrigger asChild>
                  <Button 
                    size="sm"
                    variant="ghost"
                    className="bg-white rounded-full shadow-lg"
                  >
                    <Filter className="w-4 h-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-2xl overflow-y-auto">
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
              </Sheet>
            </div>

            {/* Results Count Badge */}
            <div className="absolute top-20 left-4 z-10 bg-white rounded-full shadow-lg px-5 py-3 flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-lg font-bold">{filteredListings.length} ទំនេរ</span>
              {drawnArea && (
                <span className="text-sm text-gray-500">🔍 តំបន់ផ្ទាល់ខ្លួន</span>
              )}
            </div>

            {/* Filter Summary Panel */}
            {!sidebarOpen && (
              <FilterSummaryPanel
                listings={filteredListings}
                userLocation={userLocation}
                filters={filters}
                onLocationClick={(location) => {
                  // Create a minimal listing object for map selection
                  const tempListing: Partial<Listing> = {
                    id: 'temp',
                    title: 'Selected Location',
                    type: 'site_sponsor',
                    status: 'open',
                    latitude: location.lat,
                    longitude: location.lng,
                    created_date: new Date().toISOString()
                  };
                  setSelectedListing(tempListing as Listing);
                }}
              />
            )}
          </>
        )}

        {/* Collapsible Sidebar */}
        <div 
          className={`absolute top-0 bottom-0 left-0 z-20 bg-white shadow-2xl transition-transform duration-300 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } w-full sm:w-96 overflow-hidden flex flex-col`}
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-teal-50 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold text-gray-900">ជំនួយដែលមាន</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <AISummary listings={filteredListings} userLocation={userArea} />
          </div>

          {/* Sidebar Filters */}
          <div className="p-4 border-b bg-white shrink-0 space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="ស្វែងរក..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-10 text-base"
              />
            </div>

            {/* Quick Type Filters */}
            <div className="flex flex-wrap gap-2">
              {['all', 'accommodation', 'fuel_service', 'car_transportation', 'volunteer_request', 'event'].map((type) => (
                <Button
                  key={type}
                  size="sm"
                  variant={filters.type === type || (type === 'all' && !filters.type) ? 'default' : 'outline'}
                  onClick={() => setFilters({...filters, type: type === 'all' ? null : type})}
                  className={`text-xs font-semibold ${filters.type === type || (type === 'all' && !filters.type) 
                    ? 'bg-[#105090] hover:bg-[#0d3d6f] text-white' 
                    : ''}`}
                >
                  {type === 'all' ? 'ទាំងអស់' : 
                   type === 'accommodation' ? '🏠' :
                   type === 'fuel_service' ? '⛽' :
                   type === 'car_transportation' ? '🚗' : 
                   type === 'volunteer_request' ? '🤝' : '📅'}
                </Button>
              ))}
            </div>

            {/* More Filters Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(true)}
              className="w-full text-sm font-semibold"
            >
              <Filter className="w-4 h-4 mr-2" />
              ច្រើនទៀត
            </Button>
          </div>

          {/* Listings */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full mx-auto" />
                <p className="text-gray-500 mt-3 text-sm">Loading...</p>
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No listings found</p>
                <Button 
                  variant="link" 
                  onClick={() => {
                    setFilters({ type: null, status: null, area: null, familyFriendly: false, verifiedOnly: false });
                    setSearchKeyword('');
                    setRadiusKm(null);
                    setDrawnArea(null);
                  }}
                  className="text-[#105090]"
                  size="sm"
                >
                  Clear all filters
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
                  className={`cursor-pointer transition-all ${
                    selectedListing?.id === listing.id 
                      ? 'ring-2 ring-blue-500' 
                      : ''
                  }`}
                >
                  <ListingCard listing={listing} compact />
                </div>
              ))
            )}
          </div>

          {/* Sidebar Footer */}
          <div className="p-3 border-t bg-gray-50 shrink-0">
            <SafetyNotice compact />
          </div>
        </div>

        {/* Toggle Sidebar Button (when closed) */}
        {!sidebarOpen && !lowBandwidth && (
          <Button
            onClick={() => setSidebarOpen(true)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white shadow-xl rounded-full w-12 h-12 p-0"
            variant="ghost"
          >
            <Menu className="w-6 h-6" />
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