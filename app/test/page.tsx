'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { CheckCircle, XCircle, Loader2, RefreshCw, Database } from 'lucide-react';

interface TestListing {
  id: string;
  title: string;
  type: string;
  area: string;
  status: string;
  verified: boolean;
  created_at: string;
  latitude?: number;
  longitude?: number;
  contact_name?: string;
  contact_phone?: string;
  wheelchair_accessible?: boolean;
  medical_specialties?: string[];
  emergency_services?: boolean;
}

interface TestResponse {
  success: boolean;
  count: number;
  timestamp: string;
  listings: TestListing[];
  error?: string;
  details?: any;
  total_in_db?: number;
}

export default function TestPage() {
  const [data, setData] = useState<TestResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use the existing listings API with test mode
      const response = await fetch('/api/listings?test=true&limit=1000');
      const json = await response.json();
      
      // Transform to match expected format
      if (json.success !== undefined) {
        // Already in test mode format
        setData(json);
      } else {
        // Regular format - convert to test format
        setData({
          success: true,
          count: json.length || 0,
          total_in_db: json.length || 0,
          timestamp: new Date().toISOString(),
          listings: json.map((listing: any) => ({
            id: listing.id,
            title: listing.title,
            type: listing.type,
            area: listing.area,
            status: listing.status,
            verified: listing.verified,
            created_at: listing.created_at || listing.created_date,
            latitude: listing.latitude,
            longitude: listing.longitude,
            contact_name: listing.contact_name,
            contact_phone: listing.contact_phone,
            wheelchair_accessible: listing.wheelchair_accessible,
            medical_specialties: listing.medical_specialties,
            emergency_services: listing.emergency_services,
          }))
        });
      }
      
      if (json.error) {
        setError(json.error || 'Failed to fetch data');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      accommodation: 'bg-blue-100 text-blue-700',
      car_transportation: 'bg-green-100 text-green-700',
      volunteer_request: 'bg-purple-100 text-purple-700',
      fuel_service: 'bg-amber-100 text-amber-700',
      medical_care: 'bg-red-100 text-red-700',
      school: 'bg-teal-100 text-teal-700',
      site_sponsor: 'bg-indigo-100 text-indigo-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Database className="w-6 h-6" />
                API Test - Listings Data
              </CardTitle>
              <Button onClick={fetchData} disabled={loading} variant="outline">
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="flex items-center gap-2 text-gray-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading data...</span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-700">
                  <XCircle className="w-5 h-5" />
                  <span className="font-bold">Error: {error}</span>
                </div>
                {data?.details && (
                  <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto">
                    {JSON.stringify(data.details, null, 2)}
                  </pre>
                )}
              </div>
            )}

            {data && data.success && (
              <div className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-700 mb-1">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-bold">Status</span>
                    </div>
                    <p className="text-2xl font-bold text-green-800">Connected</p>
                  </div>
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-blue-700 mb-1">
                      <Database className="w-5 h-5" />
                      <span className="font-bold">Total Listings</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-800">{data.count}</p>
                  </div>
                  <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-purple-700 mb-1">
                      <span className="font-bold">Last Updated</span>
                    </div>
                    <p className="text-sm text-purple-800">
                      {new Date(data.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Type Breakdown */}
                {data.listings.length > 0 && (
                  <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
                    <h3 className="font-bold text-lg mb-3">Breakdown by Type</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(
                        data.listings.reduce((acc: Record<string, number>, listing) => {
                          acc[listing.type] = (acc[listing.type] || 0) + 1;
                          return acc;
                        }, {})
                      ).map(([type, count]) => (
                        <Badge key={type} className={`${getTypeColor(type)} px-3 py-1`}>
                          {type}: {count}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Listings Table */}
        {data && data.success && data.listings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>All Listings ({data.count})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-gray-300">
                      <th className="text-left p-2 font-bold">ID</th>
                      <th className="text-left p-2 font-bold">Title</th>
                      <th className="text-left p-2 font-bold">Type</th>
                      <th className="text-left p-2 font-bold">Area</th>
                      <th className="text-left p-2 font-bold">Status</th>
                      <th className="text-left p-2 font-bold">Verified</th>
                      <th className="text-left p-2 font-bold">Location</th>
                      <th className="text-left p-2 font-bold">Contact</th>
                      <th className="text-left p-2 font-bold">Accessibility</th>
                      <th className="text-left p-2 font-bold">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.listings.map((listing, idx) => (
                      <tr 
                        key={listing.id} 
                        className={`border-b border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                      >
                        <td className="p-2 text-xs font-mono">{listing.id.substring(0, 8)}...</td>
                        <td className="p-2 font-medium">{listing.title}</td>
                        <td className="p-2">
                          <Badge className={getTypeColor(listing.type)}>
                            {listing.type}
                          </Badge>
                        </td>
                        <td className="p-2">{listing.area}</td>
                        <td className="p-2">
                          <Badge className={
                            listing.status === 'open' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-700'
                          }>
                            {listing.status}
                          </Badge>
                        </td>
                        <td className="p-2">
                          {listing.verified ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-gray-400" />
                          )}
                        </td>
                        <td className="p-2 text-xs">
                          {listing.latitude && listing.longitude ? (
                            <span className="text-green-600">
                              {listing.latitude.toFixed(4)}, {listing.longitude.toFixed(4)}
                            </span>
                          ) : (
                            <span className="text-gray-400">No location</span>
                          )}
                        </td>
                        <td className="p-2 text-xs">
                          {listing.contact_name && (
                            <div>{listing.contact_name}</div>
                          )}
                          {listing.contact_phone && (
                            <div className="text-blue-600">{listing.contact_phone}</div>
                          )}
                          {!listing.contact_name && !listing.contact_phone && (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-2">
                          {listing.wheelchair_accessible && (
                            <Badge className="bg-blue-100 text-blue-700 text-xs">Wheelchair</Badge>
                          )}
                          {listing.emergency_services && (
                            <Badge className="bg-red-100 text-red-700 text-xs ml-1">Emergency</Badge>
                          )}
                          {listing.medical_specialties && listing.medical_specialties.length > 0 && (
                            <Badge className="bg-purple-100 text-purple-700 text-xs ml-1">
                              Medical ({listing.medical_specialties.length})
                            </Badge>
                          )}
                          {!listing.wheelchair_accessible && !listing.emergency_services && 
                           (!listing.medical_specialties || listing.medical_specialties.length === 0) && (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="p-2 text-xs text-gray-600">
                          {new Date(listing.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Raw JSON View */}
        {data && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Raw JSON Response</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto text-xs">
                {JSON.stringify(data, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

