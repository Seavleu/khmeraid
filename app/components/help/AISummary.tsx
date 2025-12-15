'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Sparkles, MapPin, RefreshCw, Home, Fuel, HeartHandshake, Car, ArrowRight } from 'lucide-react';

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
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl shadow-2xl overflow-hidden">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-full">
              <Sparkles className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="font-bold text-sm sm:text-base text-gray-900">សង្ខេប AI</h3>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={generateSummary}
            disabled={loading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Stats Pills */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {stats.accommodation.total > 0 && (
            <Badge className="bg-blue-100 text-blue-700 border-blue-200 px-2 py-1 flex items-center gap-1">
              <Home className="w-3 h-3" />
              <span className="font-semibold text-xs">{stats.accommodation.total}</span>
            </Badge>
          )}
          {stats.fuel_service.total > 0 && (
            <Badge className="bg-amber-100 text-amber-700 border-amber-200 px-2 py-1 flex items-center gap-1">
              <Fuel className="w-3 h-3" />
              <span className="font-semibold text-xs">{stats.fuel_service.total}</span>
            </Badge>
          )}
          {stats.car_transportation.total > 0 && (
            <Badge className="bg-green-100 text-green-700 border-green-200 px-2 py-1 flex items-center gap-1">
              <Car className="w-3 h-3" />
              <span className="font-semibold text-xs">{stats.car_transportation.total}</span>
            </Badge>
          )}
          {stats.volunteer_request.total > 0 && (
            <Badge className="bg-purple-100 text-purple-700 border-purple-200 px-2 py-1 flex items-center gap-1">
              <HeartHandshake className="w-3 h-3" />
              <span className="font-semibold text-xs">{stats.volunteer_request.total}</span>
            </Badge>
          )}
        </div>

        {/* AI Summary Text */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-gray-200 p-3 mb-3">
          {loading ? (
            <div className="flex items-center gap-2 text-gray-500 text-xs">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>កំពុងបង្កើតសង្ខេប...</span>
            </div>
          ) : error ? (
            <p className="text-red-600 text-xs">{error}</p>
          ) : summaryData ? (
            <p className="text-gray-800 text-xs sm:text-sm leading-relaxed">{summaryData.summary}</p>
          ) : (
            <p className="text-gray-500 text-xs">កំពុងផ្ទុក...</p>
          )}
        </div>

        {/* Location Suggestions */}
        {summaryData && summaryData.suggestions.length > 0 && (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border-2 border-gray-200 p-3">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <h4 className="font-semibold text-xs text-gray-900">តំបន់ផ្សេងទៀតដែលមានជំនួយ:</h4>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {summaryData.suggestions.map((area) => (
                <Badge 
                  key={area}
                  variant="outline"
                  className="text-xs px-2 py-1 cursor-pointer hover:bg-blue-50 transition-colors"
                >
                  {area}
                  <ArrowRight className="w-2.5 h-2.5 ml-1" />
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
