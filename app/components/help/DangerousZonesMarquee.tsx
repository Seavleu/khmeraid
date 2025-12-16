'use client'

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { DANGEROUS_ZONES_DATA } from './DangerousZones';

export default function DangerousZonesMarquee() {
  const redZonesText = DANGEROUS_ZONES_DATA.red.join(', ');
  const orangeZonesText = DANGEROUS_ZONES_DATA.orange.join(', ');
  
  const marqueeText = `⚠️ តំបន់ក្រហម - គ្រោះថ្នាក់: ${redZonesText} | តំបន់ទឹកក្រូច - ព្រមាន: ${orangeZonesText}`;
  
  // Duplicate text for seamless loop
  const duplicatedText = `${marqueeText} • ${marqueeText} • ${marqueeText} • `;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-r from-red-600 via-red-500 to-orange-500 border-t-2 border-red-700 shadow-2xl pointer-events-none">
      <div className="h-8 sm:h-10 flex items-center overflow-hidden relative">
        {/* Left gradient fade */}
        <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-r from-red-600 to-transparent z-10 pointer-events-none" />
        
        {/* Right gradient fade */}
        <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-l from-orange-500 to-transparent z-10 pointer-events-none" />
        
        {/* Marquee content */}
        <div className="flex items-center gap-3 animate-marquee whitespace-nowrap">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white animate-pulse flex-shrink-0" />
            <span className="text-white text-[10px] sm:text-xs font-semibold">
              {duplicatedText}
            </span>
          </div>
        </div>
        
        {/* Duplicate for seamless loop */}
        <div className="flex items-center gap-3 animate-marquee whitespace-nowrap absolute left-full">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white animate-pulse flex-shrink-0" />
            <span className="text-white text-[10px] sm:text-xs font-semibold">
              {duplicatedText}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

