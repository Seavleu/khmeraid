'use client'

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '@/app/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { 
  CheckCircle, XCircle, Pause, Play, Trash2, Search,
  Home, Fuel, HeartHandshake, Eye, Clock, AlertTriangle,
  Users, TrendingUp, Car, Edit, MapPin
} from 'lucide-react';
import EditListingDialog from '@/app/components/admin/EditListingDialog';

interface Listing {
  id: string;
  title: string;
  type: string;
  area?: string;
  status: string;
  verified: boolean;
  latitude?: number;
  longitude?: number;
  contact_phone?: string;
  created_date: string;
  [key: string]: any;
}

const typeConfig: Record<string, { icon: any; label: string; color: string }> = {
  accommodation: { icon: Home, label: 'ស្នាក់នៅ', color: 'bg-blue-100 text-blue-700' },
  fuel_service: { icon: Fuel, label: 'សាំង', color: 'bg-amber-100 text-amber-700' },
  car_transportation: { icon: Car, label: 'ដឹកជញ្ជូន', color: 'bg-green-100 text-green-700' },
  volunteer_request: { icon: HeartHandshake, label: 'ស្ម័គ្រចិត្ត', color: 'bg-purple-100 text-purple-700' }
};

const statusConfig: Record<string, { label: string; color: string }> = {
  open: { label: 'បើក', color: 'bg-emerald-100 text-emerald-700' },
  limited: { label: 'មានកំណត់', color: 'bg-amber-100 text-amber-700' },
  full: { label: 'ពេញ', color: 'bg-red-100 text-red-700' },
  paused: { label: 'ផ្អាក', color: 'bg-gray-100 text-gray-700' }
};

export default function Admin() {
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const queryClient = useQueryClient();

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['admin-listings'],
    queryFn: async () => {
      const res = await fetch('/api/listings?sort=-created_at&limit=500');
      if (!res.ok) throw new Error('Failed to fetch listings');
      const data = await res.json();
      return data.map((item: any) => ({
        ...item,
        created_date: item.created_date || item.created_at || new Date().toISOString()
      }));
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Listing> }) => {
      const res = await fetch(`/api/listings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update listing');
      return await res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-listings'] })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/listings/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete listing');
      return await res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-listings'] })
  });

  const handleStatusChange = (id: string, status: string) => {
    updateMutation.mutate({ id, data: { status } });
  };

  const handleVerify = (id: string, verified: boolean) => {
    updateMutation.mutate({ id, data: { verified } });
  };

  const handleDelete = (id: string) => {
    if (confirm('តើអ្នកប្រាកដថាចង់លុបការផ្តល់ជំនួយនេះ?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (listing: Listing) => {
    setEditingListing(listing);
  };

  const handleSave = (updatedData: Partial<Listing>) => {
    if (editingListing) {
      updateMutation.mutate({ 
        id: editingListing.id, 
        data: updatedData 
      });
    }
  };

  // Filter listings
  const filteredListings = (listings || []).filter((l: Listing) => {
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    if (typeFilter !== 'all' && l.type !== typeFilter) return false;
    if (search && !l.title.toLowerCase().includes(search.toLowerCase()) && 
        !l.area?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Stats
  const stats = {
    total: (listings || []).length,
    open: (listings || []).filter((l: Listing) => l.status === 'open').length,
    pending: (listings || []).filter((l: Listing) => !l.verified).length,
    accommodation: (listings || []).filter((l: Listing) => l.type === 'accommodation').length,
    fuel: (listings || []).filter((l: Listing) => l.type === 'fuel_service').length,
    transport: (listings || []).filter((l: Listing) => l.type === 'car_transportation').length,
    volunteer: (listings || []).filter((l: Listing) => l.type === 'volunteer_request').length
  };

  return (
    <Layout currentPageName="Admin">
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4 lg:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">បន្ទះគ្រប់គ្រង</h1>
            <p className="text-xs sm:text-sm text-gray-500">គ្រប់គ្រងការផ្តល់ជំនួយ និងផ្ទៀងផ្ទាត់ការដាក់ស្នើ</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 sm:gap-3 lg:gap-4">
          <Card>
            <CardContent className="p-2 sm:p-3 lg:p-4 text-center">
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#105090]">{stats.total}</p>
              <p className="text-xs sm:text-sm text-gray-500">សរុប</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-2 sm:p-3 lg:p-4 text-center">
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-600">{stats.open}</p>
              <p className="text-xs sm:text-sm text-gray-500">បើក</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-2 sm:p-3 lg:p-4 text-center">
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-amber-600">{stats.pending}</p>
              <p className="text-xs sm:text-sm text-gray-500">កំពុងរង់ចាំ</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-2 sm:p-3 lg:p-4 text-center">
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600">{stats.accommodation}</p>
              <p className="text-xs sm:text-sm text-gray-500">ស្នាក់នៅ</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-2 sm:p-3 lg:p-4 text-center">
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-amber-600">{stats.fuel}</p>
              <p className="text-xs sm:text-sm text-gray-500">សាំង</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-2 sm:p-3 lg:p-4 text-center">
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">{stats.transport}</p>
              <p className="text-xs sm:text-sm text-gray-500">ដឹកជញ្ជូន</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-2 sm:p-3 lg:p-4 text-center">
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-600">{stats.volunteer}</p>
              <p className="text-xs sm:text-sm text-gray-500">ស្ម័គ្រចិត្ត</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-2 sm:p-3 lg:p-4">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4">
              <div className="flex-1 min-w-0">
                <div className="relative">
                  <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                  <Input
                    placeholder="ស្វែងរកការផ្តល់ជំនួយ..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 sm:pl-10 h-9 sm:h-10 text-sm sm:text-base"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[140px] lg:w-[150px] h-9 sm:h-10 text-sm">
                  <SelectValue placeholder="ស្ថានភាព" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ស្ថានភាពទាំងអស់</SelectItem>
                  <SelectItem value="open">បើក</SelectItem>
                  <SelectItem value="limited">មានកំណត់</SelectItem>
                  <SelectItem value="full">ពេញ</SelectItem>
                  <SelectItem value="paused">ផ្អាក</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[140px] lg:w-[150px] h-9 sm:h-10 text-sm">
                  <SelectValue placeholder="ប្រភេទ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ប្រភេទទាំងអស់</SelectItem>
                  <SelectItem value="accommodation">ស្នាក់នៅ</SelectItem>
                  <SelectItem value="fuel_service">សាំង</SelectItem>
                  <SelectItem value="car_transportation">ដឹកជញ្ជូន</SelectItem>
                  <SelectItem value="volunteer_request">ស្ម័គ្រចិត្ត</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Listings Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto scrollbar-hide">
              {/* Mobile Card View */}
              <div className="block sm:hidden space-y-2 p-2">
                {filteredListings.map((listing: Listing) => {
                  const type = typeConfig[listing.type];
                  const status = statusConfig[listing.status];
                  const TypeIcon = type?.icon || Home;

                  return (
                    <div key={listing.id} className="bg-white border rounded-lg p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className={`p-1.5 rounded-lg flex-shrink-0 ${type?.color || 'bg-gray-100'}`}>
                            <TypeIcon className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm text-gray-900 truncate">{listing.title}</p>
                            {listing.contact_phone && (
                              <p className="text-xs text-gray-500 truncate">{listing.contact_phone}</p>
                            )}
                          </div>
                        </div>
                        <Badge className={`${type?.color} text-xs px-2 py-0.5`}>{type?.label}</Badge>
                      </div>
                      
                      <div className="text-xs text-gray-600">
                        <p>{listing.area || 'N/A'}</p>
                        {listing.latitude && listing.longitude ? (
                          <p className="text-gray-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {listing.latitude.toFixed(4)}, {listing.longitude.toFixed(4)}
                          </p>
                        ) : (
                          <p className="text-amber-600 flex items-center gap-1 mt-0.5">
                            <AlertTriangle className="w-3 h-3" />
                            គ្មានទីតាំង
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Select 
                          value={listing.status} 
                          onValueChange={(value) => handleStatusChange(listing.id, value)}
                        >
                          <SelectTrigger className="h-8 text-xs flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">បើក</SelectItem>
                            <SelectItem value="limited">មានកំណត់</SelectItem>
                            <SelectItem value="full">ពេញ</SelectItem>
                            <SelectItem value="paused">ផ្អាក</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant={listing.verified ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleVerify(listing.id, !listing.verified)}
                          className={`h-8 text-xs ${listing.verified ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                        >
                          {listing.verified ? (
                            <CheckCircle className="w-3.5 h-3.5" />
                          ) : (
                            'ផ្ទៀង'
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(listing)}
                          className="h-8 w-8 p-0 text-blue-600"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(listing.id)}
                          className="h-8 w-8 p-0 text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {filteredListings.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    មិនមានការផ្តល់ជំនួយត្រូវបានរកឃើញ
                  </div>
                )}
              </div>

              {/* Desktop Table View */}
              <table className="w-full hidden sm:table">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-2 sm:p-3 lg:p-4 font-medium text-xs sm:text-sm text-gray-600">ការផ្តល់ជំនួយ</th>
                    <th className="text-left p-2 sm:p-3 lg:p-4 font-medium text-xs sm:text-sm text-gray-600">ប្រភេទ</th>
                    <th className="text-left p-2 sm:p-3 lg:p-4 font-medium text-xs sm:text-sm text-gray-600">តំបន់</th>
                    <th className="text-left p-2 sm:p-3 lg:p-4 font-medium text-xs sm:text-sm text-gray-600">ស្ថានភាព</th>
                    <th className="text-left p-2 sm:p-3 lg:p-4 font-medium text-xs sm:text-sm text-gray-600">បានផ្ទៀងផ្ទាត់</th>
                    <th className="text-left p-2 sm:p-3 lg:p-4 font-medium text-xs sm:text-sm text-gray-600">សកម្មភាព</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredListings.map((listing: Listing) => {
                    const type = typeConfig[listing.type];
                    const status = statusConfig[listing.status];
                    const TypeIcon = type?.icon || Home;

                    return (
                      <tr key={listing.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 sm:p-3 lg:p-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${type?.color || 'bg-gray-100'}`}>
                              <TypeIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm sm:text-base text-gray-900 truncate">{listing.title}</p>
                              {listing.contact_phone && (
                                <p className="text-xs sm:text-sm text-gray-500 truncate">{listing.contact_phone}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-2 sm:p-3 lg:p-4">
                          <Badge className={`${type?.color} text-xs sm:text-sm px-2 py-0.5`}>{type?.label}</Badge>
                        </td>
                        <td className="p-2 sm:p-3 lg:p-4">
                          <div>
                            <p className="text-xs sm:text-sm text-gray-600">{listing.area || 'N/A'}</p>
                            {listing.latitude && listing.longitude ? (
                              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3" />
                                {listing.latitude.toFixed(4)}, {listing.longitude.toFixed(4)}
                              </p>
                            ) : (
                              <p className="text-xs text-amber-600 flex items-center gap-1 mt-0.5">
                                <AlertTriangle className="w-3 h-3" />
                                គ្មានទីតាំង
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="p-2 sm:p-3 lg:p-4">
                          <Select 
                            value={listing.status} 
                            onValueChange={(value) => handleStatusChange(listing.id, value)}
                          >
                            <SelectTrigger className="w-[100px] sm:w-[120px] h-8 sm:h-10 text-xs sm:text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">បើក</SelectItem>
                              <SelectItem value="limited">មានកំណត់</SelectItem>
                              <SelectItem value="full">ពេញ</SelectItem>
                              <SelectItem value="paused">ផ្អាក</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-2 sm:p-3 lg:p-4">
                          <Button
                            variant={listing.verified ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleVerify(listing.id, !listing.verified)}
                            className={`h-8 sm:h-9 text-xs sm:text-sm ${listing.verified ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                          >
                            {listing.verified ? (
                              <>
                                <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                                <span className="hidden sm:inline">បានផ្ទៀងផ្ទាត់</span>
                                <span className="sm:hidden">ផ្ទៀង</span>
                              </>
                            ) : (
                              'ផ្ទៀងផ្ទាត់'
                            )}
                          </Button>
                        </td>
                        <td className="p-2 sm:p-3 lg:p-4">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(listing)}
                              className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(listing.id)}
                              className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredListings.length === 0 && (
                <div className="text-center py-8 sm:py-12 text-gray-500 text-sm sm:text-base hidden sm:block">
                  មិនមានការផ្តល់ជំនួយត្រូវបានរកឃើញ
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      {editingListing && (
        <EditListingDialog
          listing={editingListing}
          open={!!editingListing}
          onClose={() => setEditingListing(null)}
          onSave={handleSave}
        />
      )}
    </div>
    </Layout>
  );
}