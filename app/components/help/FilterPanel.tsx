// TEMPORARILY DISABLED - FilterPanel is not functioning properly
// All usages have been commented out in app/home/page.tsx

'use client'

import React from 'react';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Slider } from '@/app/components/ui/slider';
import { 
  Home, Fuel, HeartHandshake, Filter, X, Baby,
  CheckCircle, AlertCircle, Car, Search, ShieldCheck,
  ArrowUpDown, MapPin, Clock
} from 'lucide-react';

interface FilterState {
  type: string | null;
  status: string | null;
  area: string | null;
  familyFriendly: boolean;
  verifiedOnly: boolean;
}

interface FilterPanelProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  areas?: string[];
  compact?: boolean;
  searchKeyword?: string;
  onSearchChange?: (keyword: string) => void;
  sortBy?: 'recent' | 'verified' | 'distance';
  onSortChange?: (sortBy: 'recent' | 'verified' | 'distance') => void;
  radiusKm?: number | null;
  onRadiusChange?: (radius: number | null) => void;
  hasUserLocation?: boolean;
}

const typeFilters = [
  { value: 'all', label: 'ទាំងអស់', icon: Filter },
  { value: 'accommodation', label: 'ស្នាក់នៅ', icon: Home },
  { value: 'fuel_service', label: 'សាំង', icon: Fuel },
  { value: 'car_transportation', label: 'ដឹកជញ្ជូន', icon: Car },
  { value: 'volunteer_request', label: 'ស្ម័គ្រចិត្ត', icon: HeartHandshake },
  { value: 'event', label: 'ព្រឹត្តិការណ៍', icon: Clock }
];

const statusFilters = [
  { value: 'all', label: 'ស្ថានភាពទាំងអស់' },
  { value: 'open', label: 'បើក', icon: CheckCircle },
  { value: 'limited', label: 'មានកំណត់', icon: AlertCircle }
];

export default function FilterPanel({ 
  filters, 
  onFilterChange, 
  areas = [],
  compact = false,
  searchKeyword = '',
  onSearchChange,
  sortBy = 'recent',
  onSortChange,
  radiusKm = null,
  onRadiusChange,
  hasUserLocation = false
}: FilterPanelProps) {
  const handleTypeChange = (type: string) => {
    onFilterChange({ ...filters, type: type === 'all' ? null : type });
  };

  const handleStatusChange = (status: string) => {
    onFilterChange({ ...filters, status: status === 'all' ? null : status });
  };

  const handleAreaChange = (area: string) => {
    onFilterChange({ ...filters, area: area === 'all' ? null : area });
  };

  const handleFamilyToggle = () => {
    onFilterChange({ ...filters, familyFriendly: !filters.familyFriendly });
  };

  const handleVerifiedToggle = () => {
    onFilterChange({ ...filters, verifiedOnly: !filters.verifiedOnly });
  };

  const clearFilters = () => {
    onFilterChange({ type: null, status: null, area: null, familyFriendly: false, verifiedOnly: false });
    onSearchChange?.('');
    onRadiusChange?.(null);
  };

  const hasActiveFilters = filters.type || filters.status || filters.area || filters.familyFriendly || filters.verifiedOnly || searchKeyword || radiusKm;

  if (compact) {
    return (
      <div className="flex flex-wrap gap-3 p-4 bg-white rounded-xl shadow-sm border-2 border-gray-100">
        {typeFilters.map(({ value, label, icon: Icon }) => (
          <Button
            key={value}
            variant={filters.type === value || (value === 'all' && !filters.type) ? 'default' : 'outline'}
            size="lg"
            onClick={() => handleTypeChange(value)}
            style={filters.type === value || (value === 'all' && !filters.type) 
              ? { backgroundColor: '#105090' } 
              : {}}
            className={`rounded-full text-sm font-semibold px-4 ${
              filters.type === value || (value === 'all' && !filters.type)
                ? 'text-white hover:opacity-90'
                : 'border-2'
            }`}
          >
            <Icon className="w-4 h-4 mr-2" />
            {label}
          </Button>
        ))}
        <Button
          variant={filters.familyFriendly ? 'default' : 'outline'}
          size="lg"
          onClick={handleFamilyToggle}
          className={`rounded-full text-sm font-semibold px-4 ${
            filters.familyFriendly ? 'bg-pink-500 hover:bg-pink-600' : 'border-2'
          }`}
        >
          <Baby className="w-4 h-4 mr-2" />
          គ្រួសារ
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-3 sm:p-4 space-y-3 sm:space-y-4 max-h-[85vh] overflow-y-auto scroll-smooth">
      <div className="flex items-center justify-between sticky top-0 bg-white pb-2 border-b z-10">
        <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 flex items-center gap-1.5 sm:gap-2">
          <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600" />
          ស្វែងរក & តម្រង
        </h3>
        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters}
            className="text-gray-500 hover:text-gray-700 h-7 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
            <span className="hidden sm:inline">លុបទាំងអស់</span>
            <span className="sm:hidden">លុប</span>
          </Button>
        )}
      </div>

      {/* Keyword Search */}
      {onSearchChange && (
        <div className="space-y-1.5 sm:space-y-2">
          <p className="text-xs sm:text-sm font-medium text-gray-600 flex items-center gap-1.5 sm:gap-2">
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            ស្វែងរកពាក្យគន្លឹះ
          </p>
          <Input
            placeholder="ស្វែងរកក្នុងចំណងជើង កំណត់ចំណាំ តំបន់..."
            value={searchKeyword}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-9 sm:h-10 text-sm sm:text-base"
          />
        </div>
      )}

      {/* Sort Options */}
      {onSortChange && (
        <div className="space-y-1.5 sm:space-y-2">
          <p className="text-xs sm:text-sm font-medium text-gray-600 flex items-center gap-1.5 sm:gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            តម្រៀបតាម
          </p>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <Button
              variant={sortBy === 'recent' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onSortChange('recent')}
              style={sortBy === 'recent' ? { backgroundColor: '#105090' } : {}}
              className="rounded-full text-xs sm:text-sm px-2 sm:px-3 py-1 h-auto"
            >
              ថ្មីៗបំផុត
            </Button>
            <Button
              variant={sortBy === 'verified' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onSortChange('verified')}
              style={sortBy === 'verified' ? { backgroundColor: '#105090' } : {}}
              className="rounded-full text-xs sm:text-sm px-2 sm:px-3 py-1 h-auto"
            >
              <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1" />
              បានផ្ទៀងផ្ទាត់
            </Button>
            {hasUserLocation && (
              <Button
                variant={sortBy === 'distance' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onSortChange('distance')}
                style={sortBy === 'distance' ? { backgroundColor: '#105090' } : {}}
                className="rounded-full text-xs sm:text-sm px-2 sm:px-3 py-1 h-auto"
              >
                <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1" />
                ជិតបំផុត
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Radius Search */}
      {onRadiusChange && hasUserLocation && (
        <div className="space-y-2 sm:space-y-3 bg-blue-50 p-2.5 sm:p-3 rounded-xl border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-1.5 sm:gap-2">
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
              ស្វែងរកតាមរ៉ាដ្យុស
            </p>
            {radiusKm && (
              <Badge variant="outline" className="text-blue-700 border-blue-300 bg-white text-xs px-2 py-0.5">
                {radiusKm} km
              </Badge>
            )}
          </div>
          <Slider
            value={[radiusKm || 50]}
            onValueChange={(val) => onRadiusChange(val[0])}
            min={1}
            max={100}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>1 km</span>
            <span>100 km</span>
          </div>
          {radiusKm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRadiusChange(null)}
              className="w-full text-xs h-7 sm:h-8"
              >
              លុបកំណត់រ៉ាដ្យុស
              </Button>
          )}
        </div>
      )}

      <div className="bg-purple-50 border-2 border-purple-200 p-2.5 sm:p-3 rounded-xl">
        <p className="text-xs sm:text-sm font-medium text-purple-700 mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
          ✏️ ស្វែងរកតាមតំបន់ផ្ទាល់ខ្លួន
        </p>
        <p className="text-xs text-gray-600 leading-relaxed">
          ប្រើប៊ូតុង &quot;គូរតំបន់ស្វែងរក&quot; នៅលើផែនទីដើម្បីគូររង្វង់ឬពហុកោណលើផែនទី។ មានតែទីតាំងនៅក្នុងតំបន់ដែលបានគូរប៉ុណ្ណោះដែលនឹងត្រូវបានបង្ហាញ។
        </p>
      </div>

      {/* Type Filter */}
      <div className="space-y-1.5 sm:space-y-2">
        <p className="text-xs sm:text-sm font-medium text-gray-600">ប្រភេទជំនួយ</p>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {typeFilters.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              variant={filters.type === value || (value === 'all' && !filters.type) ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleTypeChange(value)}
              style={filters.type === value || (value === 'all' && !filters.type)
                ? { backgroundColor: '#105090' }
                : {}}
              className={`rounded-full text-xs sm:text-sm px-2 sm:px-3 py-1 h-auto transition-all ${
                filters.type === value || (value === 'all' && !filters.type)
                  ? 'text-white hover:opacity-90'
                  : ''
              }`}
            >
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Status Filter */}
      <div className="space-y-1.5 sm:space-y-2">
        <p className="text-xs sm:text-sm font-medium text-gray-600">ភាពអាចរកបាន</p>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {statusFilters.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              variant={filters.status === value || (value === 'all' && !filters.status) ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusChange(value)}
              style={filters.status === value || (value === 'all' && !filters.status)
                ? { backgroundColor: '#105090' }
                : {}}
              className={`rounded-full text-xs sm:text-sm px-2 sm:px-3 py-1 h-auto transition-all ${
                filters.status === value || (value === 'all' && !filters.status)
                  ? 'text-white hover:opacity-90'
                  : ''
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />}
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Area Filter */}
      {areas.length > 0 && (
        <div className="space-y-1.5 sm:space-y-2">
          <p className="text-xs sm:text-sm font-medium text-gray-600">តំបន់</p>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <Badge
              variant={!filters.area ? 'default' : 'outline'}
              style={!filters.area ? { backgroundColor: '#105090' } : {}}
              className="cursor-pointer text-xs px-2 py-0.5 transition-all hover:scale-105"
              onClick={() => handleAreaChange('all')}
            >
              តំបន់ទាំងអស់
            </Badge>
            {areas.slice(0, 6).map((area) => (
              <Badge
                key={area}
                variant={filters.area === area ? 'default' : 'outline'}
                style={filters.area === area ? { backgroundColor: '#105090' } : {}}
                className="cursor-pointer text-xs px-2 py-0.5 transition-all hover:scale-105"
                onClick={() => handleAreaChange(area)}
              >
                {area}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Special Toggles */}
      <div className="space-y-1.5 sm:space-y-2">
        <p className="text-xs sm:text-sm font-medium text-gray-600">តម្រងពិសេស</p>

        {/* Verified Only */}
        <div 
          className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl cursor-pointer transition-all ${
            filters.verifiedOnly 
              ? 'bg-emerald-50 border-2 border-emerald-200' 
              : 'bg-gray-50 border-2 border-transparent hover:border-gray-200'
          }`}
          onClick={handleVerifiedToggle}
        >
          <ShieldCheck className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${filters.verifiedOnly ? 'text-emerald-600' : 'text-gray-400'}`} />
          <span className={`font-medium text-xs sm:text-sm ${filters.verifiedOnly ? 'text-emerald-700' : 'text-gray-600'}`}>
            អ្នកផ្តល់សេវាបានផ្ទៀងផ្ទាត់ប៉ុណ្ណោះ
          </span>
        </div>

        {/* Family Friendly */}
        <div 
          className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl cursor-pointer transition-all ${
            filters.familyFriendly 
              ? 'bg-pink-50 border-2 border-pink-200' 
              : 'bg-gray-50 border-2 border-transparent hover:border-gray-200'
          }`}
          onClick={handleFamilyToggle}
        >
          <Baby className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${filters.familyFriendly ? 'text-pink-500' : 'text-gray-400'}`} />
          <span className={`font-medium text-xs sm:text-sm ${filters.familyFriendly ? 'text-pink-700' : 'text-gray-600'}`}>
            សមស្របសម្រាប់គ្រួសារប៉ុណ្ណោះ
          </span>
        </div>
      </div>
      </div>
      );
      }