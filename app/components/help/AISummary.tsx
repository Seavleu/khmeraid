'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Sparkles, MapPin, RefreshCw, Phone, Home, Fuel, HeartHandshake, Car } from 'lucide-react';

interface Listing {
  type: string;
  status: string;
  [key: string]: any;
}

interface AISummaryProps {
  listings: Listing[];
  userLocation?: string;
}

export default function AISummary({ listings, userLocation }: AISummaryProps) {
  const [summary, setSummary] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const generateSummary = async () => {
    if (!listings || listings.length === 0) {
      setSummary('មិនមានជំនួយនៅក្នុងតំបន់នេះនៅពេលនេះទេ។ សូមទូរស័ព្ទទៅខ្សែបន្ទាន់របស់យើង។');
      return;
    }

    setLoading(true);
    
    // Count by type and status
    const counts: Record<string, { open: number; limited: number }> = {
      accommodation: { open: 0, limited: 0 },
      fuel_service: { open: 0, limited: 0 },
      car_transportation: { open: 0, limited: 0 },
      volunteer_request: { open: 0, limited: 0 }
    };

    listings.forEach(l => {
      if (l.type in counts && (l.status === 'open' || l.status === 'limited')) {
        const typeCounts = counts[l.type];
        if (typeCounts && (l.status === 'open' || l.status === 'limited')) {
          typeCounts[l.status as 'open' | 'limited']++;
        }
      }
    });

    const prompt = `You are a helpful assistant for a citizen help coordination platform during an emergency in Cambodia. 
    Generate a brief, warm, and reassuring summary in Khmer language (2-3 sentences max) based on these available resources:

- Accommodations: ${counts.accommodation.open} open, ${counts.accommodation.limited} limited availability
- Fuel Services: ${counts.fuel_service.open} open, ${counts.fuel_service.limited} limited
- Car Transportation: ${counts.car_transportation.open} open, ${counts.car_transportation.limited} limited
- Volunteer Requests: ${counts.volunteer_request.open} open, ${counts.volunteer_request.limited} limited

${userLocation ? `User's approximate area: ${userLocation}` : 'User location not specified'}

Important: Write in Khmer language. Keep it simple, use plain language, and always remind them to call the hotline to confirm availability. Don't mention exact numbers if they're zero.`;

    try {
      // TODO: Implement LLM integration with your preferred service
      // For now, using fallback summary
      throw new Error('LLM not configured');
    } catch (error) {
      // Fallback summary
      const parts = [];
      const totalAccom = counts.accommodation.open + counts.accommodation.limited;
      const totalFuel = counts.fuel_service.open + counts.fuel_service.limited;
      const totalVol = counts.volunteer_request.open + counts.volunteer_request.limited;

      if (totalAccom > 0) parts.push(`${totalAccom} accommodation${totalAccom > 1 ? 's' : ''}`);
      if (totalFuel > 0) parts.push(`${totalFuel} fuel service${totalFuel > 1 ? 's' : ''}`);
      if (totalVol > 0) parts.push(`${totalVol} volunteer need${totalVol > 1 ? 's' : ''}`);

      if (parts.length > 0) {
        setSummary(`មាននៅជិតអ្នក: ${parts.join(', ')}។ សូមទូរស័ព្ទទៅខ្សែបន្ទាន់ដើម្បីបញ្ជាក់មុនពេលធ្វើដំណើរ។`);
      } else {
        setSummary('ធនធានមានកំណត់។ សូមទូរស័ព្ទទៅខ្សែបន្ទាន់របស់យើងសម្រាប់ជំនួយផ្ទាល់ខ្លួន។');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listings, userLocation]);

  // Count stats for display
  const stats = {
    accommodation: listings.filter(l => l.type === 'accommodation' && l.status !== 'full' && l.status !== 'paused').length,
    fuel: listings.filter(l => l.type === 'fuel_service' && l.status !== 'full' && l.status !== 'paused').length,
    transport: listings.filter(l => l.type === 'car_transportation' && l.status !== 'full' && l.status !== 'paused').length,
    volunteer: listings.filter(l => l.type === 'volunteer_request' && l.status !== 'full' && l.status !== 'paused').length
  };

  return (
    <div className="bg-gradient-to-br from-teal-50 to-blue-50 border-0 rounded-xl overflow-hidden p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <h3 className="font-bold text-sm text-gray-900">សង្ខេបរហ័ស</h3>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={generateSummary}
            disabled={loading}
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Stats Pills */}
        <div className="flex flex-wrap gap-1 mb-2">
          <div className="bg-white/80 px-2 py-1 rounded-full flex items-center gap-1 text-xs">
            <Home className="w-3 h-3 text-blue-600" />
            <span className="font-semibold">{stats.accommodation}</span>
          </div>
          <div className="bg-white/80 px-2 py-1 rounded-full flex items-center gap-1 text-xs">
            <Fuel className="w-3 h-3 text-amber-600" />
            <span className="font-semibold">{stats.fuel}</span>
          </div>
          <div className="bg-white/80 px-2 py-1 rounded-full flex items-center gap-1 text-xs">
            <Car className="w-3 h-3 text-green-600" />
            <span className="font-semibold">{stats.transport}</span>
          </div>
          <div className="bg-white/80 px-2 py-1 rounded-full flex items-center gap-1 text-xs">
            <HeartHandshake className="w-3 h-3 text-purple-600" />
            <span className="font-semibold">{stats.volunteer}</span>
          </div>
        </div>

        {/* AI Summary Text */}
        <div className="bg-white/60 rounded-lg p-2">
          {loading ? (
            <div className="flex items-center gap-2 text-gray-500 text-xs">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>កំពុងផ្ទុក...</span>
            </div>
          ) : (
            <p className="text-gray-700 text-xs leading-relaxed">{summary}</p>
          )}
        </div>
    </div>
  );
}