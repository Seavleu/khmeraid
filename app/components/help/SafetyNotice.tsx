'use client'

import React from 'react';
import { Shield, Eye, Phone, Heart } from 'lucide-react';

interface SafetyNoticeProps {
  compact?: boolean;
}

export default function SafetyNotice({ compact = false }: SafetyNoticeProps) {
  if (compact) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 flex items-start gap-2">
        <Shield className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-900 leading-tight">
          ទីតាំងដែលបានយល់ព្រមប៉ុណ្ណោះ។ តែងតែបញ្ជាក់តាមទូរស័ព្ទ។
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-6 h-6 text-blue-600" />
        <h3 className="font-bold text-gray-900">Your Safety Matters</h3>
      </div>

      <div className="grid gap-3">
        <div className="flex items-start gap-3">
          <div className="bg-white p-2 rounded-lg shadow-sm">
            <Eye className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <p className="font-medium text-gray-800 text-sm">Consent-Based Sharing</p>
            <p className="text-xs text-gray-600">
              Exact locations are only shown when providers give explicit consent.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="bg-white p-2 rounded-lg shadow-sm">
            <Heart className="w-4 h-4 text-pink-500" />
          </div>
          <div>
            <p className="font-medium text-gray-800 text-sm">Citizen-Offered Help Only</p>
            <p className="text-xs text-gray-600">
              No government camps or sensitive shelters are listed here.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="bg-white p-2 rounded-lg shadow-sm">
            <Phone className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <p className="font-medium text-gray-800 text-sm">Always Confirm by Phone</p>
            <p className="text-xs text-gray-600">
              Availability is approximate. Please call before traveling.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}