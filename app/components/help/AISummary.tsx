'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Sparkles, MapPin, RefreshCw, Home, Fuel, HeartHandshake, Car, ArrowRight, Clock, School, Stethoscope } from 'lucide-react';

interface Listing {
  type: string;
  status: string;
  area?: string;
  latitude?: number;
  longitude?: number;
  [key: string]: any;
}

interface AISummaryProps {
  listings: Listing[];
  userLocation?: { lat: number; lng: number } | null;
  selectedCity?: string | null;
}

interface SummaryResponse {
  summary: string;
  suggestions: string[];
  stats: Record<string, { open: number; limited: number; total: number }>;
  locationStats: Record<string, any>;
}

export default function AISummary({ listings, userLocation, selectedCity }: AISummaryProps) {
  const [summaryData, setSummaryData] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const generateSummary = async () => {
    if (!listings || listings.length === 0) {
      setSummaryData({
        summary: 'មិនមានជំនួយនៅក្នុងតំបន់នេះនៅពេលនេះទេ។ សូមទូរស័ព្ទទៅខ្សែបន្ទាន់របស់យើង។',
        suggestions: [],
        stats: {},
        locationStats: {},
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listings,
          userLocation,
          selectedCity,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const data: SummaryResponse = await response.json();
      setSummaryData(data);
    } catch (err: any) {
      console.error('Summary generation error:', err);
      setError('មិនអាចបង្កើតសង្ខេបបាន។ សូមព្យាយាមម្តងទៀត។');
      
      // Fallback to basic stats
      const counts: Record<string, { open: number; limited: number; total: number }> = {
        accommodation: { open: 0, limited: 0, total: 0 },
        fuel_service: { open: 0, limited: 0, total: 0 },
        car_transportation: { open: 0, limited: 0, total: 0 },
        volunteer_request: { open: 0, limited: 0, total: 0 },
        medical_care: { open: 0, limited: 0, total: 0 },
        event: { open: 0, limited: 0, total: 0 },
        site_sponsor: { open: 0, limited: 0, total: 0 },
        school: { open: 0, limited: 0, total: 0 },
      };

      listings.forEach(l => {
        if (l.type in counts) {
          if (l.status === 'open') counts[l.type].open++;
          if (l.status === 'limited') counts[l.type].limited++;
          counts[l.type].total = counts[l.type].open + counts[l.type].limited;
        }
      });

      setSummaryData({
        summary: 'កំពុងផ្ទុកទិន្នន័យ...',
        suggestions: [],
        stats: counts,
        locationStats: {},
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listings, userLocation, selectedCity]);

  // Get stats from summary data or calculate fallback
  const stats = summaryData?.stats || {
    accommodation: { total: listings.filter(l => l.type === 'accommodation' && l.status !== 'full' && l.status !== 'paused').length },
    fuel_service: { total: listings.filter(l => l.type === 'fuel_service' && l.status !== 'full' && l.status !== 'paused').length },
    car_transportation: { total: listings.filter(l => l.type === 'car_transportation' && l.status !== 'full' && l.status !== 'paused').length },
    volunteer_request: { total: listings.filter(l => l.type === 'volunteer_request' && l.status !== 'full' && l.status !== 'paused').length },
    medical_care: { total: listings.filter(l => l.type === 'medical_care' && l.status !== 'full' && l.status !== 'paused').length },
    event: { total: listings.filter(l => l.type === 'event' && l.status !== 'full' && l.status !== 'paused').length },
    site_sponsor: { total: listings.filter(l => l.type === 'site_sponsor' && l.status !== 'full' && l.status !== 'paused').length },
    school: { total: listings.filter(l => l.type === 'school' && l.status !== 'full' && l.status !== 'paused').length },
  };

  // Ensure all stats have total property with safe defaults
  const safeStats = {
    accommodation: { total: stats.accommodation?.total || 0 },
    fuel_service: { total: stats.fuel_service?.total || 0 },
    car_transportation: { total: stats.car_transportation?.total || 0 },
    volunteer_request: { total: stats.volunteer_request?.total || 0 },
    medical_care: { total: stats.medical_care?.total || 0 },
    event: { total: stats.event?.total || 0 },
    site_sponsor: { total: stats.site_sponsor?.total || 0 },
    school: { total: stats.school?.total || 0 },
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm overflow-hidden">
      <CardContent className="p-1.5 sm:p-2">
        <div className="flex items-center justify-between mb-1 sm:mb-1.5">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <div className="p-1 bg-blue-100 rounded-full">
              <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-600" />
            </div>
            <h3 className="font-bold text-[10px] sm:text-xs text-gray-900">សង្ខេប AI</h3>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={generateSummary}
            disabled={loading}
            className="h-6 w-6 sm:h-7 sm:w-7 p-0"
          >
            <RefreshCw className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Stats Pills */}
        <div className="flex flex-wrap gap-1 mb-1 sm:mb-1.5">
          {safeStats.accommodation.total > 0 && (
            <Badge className="bg-blue-100 text-blue-700 border-blue-200 px-1 py-0.5 flex items-center gap-0.5">
              <Home className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
              <span className="font-semibold text-[9px] sm:text-[10px]">{safeStats.accommodation.total}</span>
            </Badge>
          )}
          {safeStats.fuel_service.total > 0 && (
            <Badge className="bg-amber-100 text-amber-700 border-amber-200 px-1 py-0.5 flex items-center gap-0.5">
              <Fuel className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
              <span className="font-semibold text-[9px] sm:text-[10px]">{safeStats.fuel_service.total}</span>
            </Badge>
          )}
          {safeStats.car_transportation.total > 0 && (
            <Badge className="bg-green-100 text-green-700 border-green-200 px-1 py-0.5 flex items-center gap-0.5">
              <Car className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
              <span className="font-semibold text-[9px] sm:text-[10px]">{safeStats.car_transportation.total}</span>
            </Badge>
          )}
          {safeStats.volunteer_request.total > 0 && (
            <Badge className="bg-purple-100 text-purple-700 border-purple-200 px-1 py-0.5 flex items-center gap-0.5">
              <HeartHandshake className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
              <span className="font-semibold text-[9px] sm:text-[10px]">{safeStats.volunteer_request.total}</span>
            </Badge>
          )}
          {safeStats.medical_care.total > 0 && (
            <Badge className="bg-red-100 text-red-700 border-red-200 px-1 py-0.5 flex items-center gap-0.5">
              <Stethoscope className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
              <span className="font-semibold text-[9px] sm:text-[10px]">{safeStats.medical_care.total}</span>
            </Badge>
          )}
          {safeStats.event.total > 0 && (
            <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 px-1 py-0.5 flex items-center gap-0.5">
              <Clock className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
              <span className="font-semibold text-[9px] sm:text-[10px]">{safeStats.event.total}</span>
            </Badge>
          )}
          {safeStats.site_sponsor.total > 0 && (
            <Badge className="bg-teal-100 text-teal-700 border-teal-200 px-1 py-0.5 flex items-center gap-0.5">
              <MapPin className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
              <span className="font-semibold text-[9px] sm:text-[10px]">{safeStats.site_sponsor.total}</span>
            </Badge>
          )}
          {safeStats.school.total > 0 && (
            <Badge className="bg-cyan-100 text-cyan-700 border-cyan-200 px-1 py-0.5 flex items-center gap-0.5">
              <School className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
              <span className="font-semibold text-[9px] sm:text-[10px]">{safeStats.school.total}</span>
            </Badge>
          )}
        </div>

        {/* AI Summary Text */}
        <div className="bg-white/80 backdrop-blur-sm rounded-md border border-gray-200 p-1.5 sm:p-2 max-h-16 sm:max-h-20 overflow-y-auto">
          {loading ? (
            <div className="flex items-center gap-1 text-gray-500 text-[9px] sm:text-[10px]">
              <RefreshCw className="w-2 h-2 sm:w-2.5 sm:h-2.5 animate-spin" />
              <span>កំពុងបង្កើតសង្ខេប...</span>
            </div>
          ) : error ? (
            <p className="text-red-600 text-[9px] sm:text-[10px]">{error}</p>
          ) : summaryData ? (
            <p className="text-gray-800 text-[9px] sm:text-[10px] leading-tight">{summaryData.summary}</p>
          ) : (
            <p className="text-gray-500 text-[9px] sm:text-[10px]">កំពុងផ្ទុក...</p>
          )}
        </div>

        {/* Location Suggestions */}
        {summaryData && summaryData.suggestions.length > 0 && (
          <div className="bg-white/60 backdrop-blur-sm rounded-md border border-gray-200 p-1.5 sm:p-2 mt-1">
            <div className="flex items-center gap-1 mb-1">
              <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-600" />
              <h4 className="font-semibold text-[9px] sm:text-[10px] text-gray-900">តំបន់ផ្សេងទៀត:</h4>
            </div>
            <div className="flex flex-wrap gap-1">
              {summaryData.suggestions.map((area) => (
                <Badge 
                  key={area}
                  variant="outline"
                  className="text-[9px] sm:text-[10px] px-1 py-0.5 cursor-pointer hover:bg-blue-50 transition-colors"
                >
                  {area}
                  <ArrowRight className="w-1.5 h-1.5 sm:w-2 sm:h-2 ml-0.5" />
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
