'use client'

import React from 'react';
import { Phone, PhoneCall } from 'lucide-react';
import { Button } from '@/app/components/ui/button';

interface HotlineBannerProps {
  phoneNumber?: string;
  compact?: boolean;
}

export default function HotlineBanner({ phoneNumber = "+1-800-HELP-NOW", compact = false }: HotlineBannerProps) {
  const handleCall = () => {
    window.location.href = `tel:${phoneNumber.replace(/[^0-9+]/g, '')}`;
  };

  if (compact) {
    return (
      <Button 
        onClick={handleCall}
        className="text-white font-bold rounded-full shadow-lg flex items-center gap-2 px-4 py-2 hover:opacity-90"
        style={{ backgroundColor: '#105090' }}
      >
        <PhoneCall className="w-5 h-5 animate-pulse" />
        <span className="text-sm">Call Hotline</span>
      </Button>
    );
  }

  return (
    <div className="text-white p-4 rounded-2xl shadow-xl" style={{ background: 'linear-gradient(to right, #105090, #1976d2)' }}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-3 rounded-full">
            <Phone className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-emerald-100 font-medium">24/7 Helpline</p>
            <p className="text-2xl font-bold tracking-wide">{phoneNumber}</p>
          </div>
        </div>
        <Button 
          onClick={handleCall}
          size="lg"
          className="bg-white font-bold rounded-full shadow-md flex items-center gap-2 px-6 hover:bg-gray-50"
          style={{ color: '#105090' }}
        >
          <PhoneCall className="w-5 h-5" />
          Call Now
        </Button>
      </div>
      <p className="text-white text-sm mt-3 text-center opacity-90">
        Always confirm availability by phone before traveling
      </p>
    </div>
  );
}