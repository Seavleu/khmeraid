'use client'

import React from 'react';
import { Shield, Eye, Phone, Heart } from 'lucide-react';

interface SafetyNoticeProps {
  compact?: boolean;
}

export default function SafetyNotice({ compact = false }: SafetyNoticeProps) {
  if (compact) {
    return (
      <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-3 flex items-start gap-2">
        <Shield className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-900 leading-tight">
          បញ្ជាក់ព័ត៑មានទីតាំងតាមទូរស័ព្ទជាមុន។
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border-2 border-blue-200 shadow-2xl">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-5 h-5 text-blue-600" />
        <h3 className="font-bold text-lg text-gray-900">Your Safety Matters</h3>
      </div>

      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <div className="bg-white/95 backdrop-blur-sm p-2 rounded-2xl border-2 border-gray-200 shadow-sm">
            <Eye className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <p className="font-medium text-sm text-gray-900">Consent-Based Sharing</p>
            <p className="text-xs text-gray-600">
              Exact locations are only shown when providers give explicit consent.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <div className="bg-white/95 backdrop-blur-sm p-2 rounded-2xl border-2 border-gray-200 shadow-sm">
            <Heart className="w-4 h-4 text-pink-500" />
          </div>
          <div>
            <p className="font-medium text-sm text-gray-900">Citizen-Offered Help Only</p>
            <p className="text-xs text-gray-600">
              No government camps or sensitive shelters are listed here.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <div className="bg-white/95 backdrop-blur-sm p-2 rounded-2xl border-2 border-gray-200 shadow-sm">
            <Phone className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <p className="font-medium text-sm text-gray-900">Always Confirm by Phone</p>
            <p className="text-xs text-gray-600">
              Availability is approximate. Please call before traveling.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}