'use client'

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseApi } from '@/api/supabaseClient';
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
  Users, TrendingUp, Car, Edit
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
      const data = await supabaseApi.entities.Listing.list('-created_at', 500);
      return data.map((item: any) => ({
        ...item,
        created_date: item.created_at || new Date().toISOString()
      }));
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Listing> }) => supabaseApi.entities.Listing.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-listings'] })
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => supabaseApi.entities.Listing.delete(id),
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
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">បន្ទះគ្រប់គ្រង</h1>
            <p className="text-gray-500">គ្រប់គ្រងការផ្តល់ជំនួយ និងផ្ទៀងផ្ទាត់ការដាក់ស្នើ</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-[#105090]">{stats.total}</p>
              <p className="text-sm text-gray-500">សរុប</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-emerald-600">{stats.open}</p>
              <p className="text-sm text-gray-500">បើក</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-amber-600">{stats.pending}</p>
              <p className="text-sm text-gray-500">កំពុងរង់ចាំ</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{stats.accommodation}</p>
              <p className="text-sm text-gray-500">ស្នាក់នៅ</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-amber-600">{stats.fuel}</p>
              <p className="text-sm text-gray-500">សាំង</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{stats.transport}</p>
              <p className="text-sm text-gray-500">ដឹកជញ្ជូន</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-purple-600">{stats.volunteer}</p>
              <p className="text-sm text-gray-500">ស្ម័គ្រចិត្ត</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="ស្វែងរកការផ្តល់ជំនួយ..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
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
                <SelectTrigger className="w-[150px]">
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-600">ការផ្តល់ជំនួយ</th>
                    <th className="text-left p-4 font-medium text-gray-600">ប្រភេទ</th>
                    <th className="text-left p-4 font-medium text-gray-600">តំបន់</th>
                    <th className="text-left p-4 font-medium text-gray-600">ស្ថានភាព</th>
                    <th className="text-left p-4 font-medium text-gray-600">បានផ្ទៀងផ្ទាត់</th>
                    <th className="text-left p-4 font-medium text-gray-600">សកម្មភាព</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredListings.map((listing: Listing) => {
                    const type = typeConfig[listing.type];
                    const status = statusConfig[listing.status];
                    const TypeIcon = type?.icon || Home;

                    return (
                      <tr key={listing.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${type?.color || 'bg-gray-100'}`}>
                              <TypeIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{listing.title}</p>
                              {listing.contact_phone && (
                                <p className="text-sm text-gray-500">{listing.contact_phone}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge className={type?.color}>{type?.label}</Badge>
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="text-gray-600">{listing.area || 'N/A'}</p>
                            {listing.latitude && listing.longitude ? (
                              <p className="text-xs text-gray-400">📍 {listing.latitude.toFixed(4)}, {listing.longitude.toFixed(4)}</p>
                            ) : (
                              <p className="text-xs text-amber-600">⚠️ គ្មានទីតាំង - សូមទាក់ទងតាមទូរស័ព្ទ</p>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <Select 
                            value={listing.status} 
                            onValueChange={(value) => handleStatusChange(listing.id, value)}
                          >
                            <SelectTrigger className="w-[120px]">
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
                        <td className="p-4">
                          <Button
                            variant={listing.verified ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleVerify(listing.id, !listing.verified)}
                            className={listing.verified ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                          >
                            {listing.verified ? (
                              <>
                                <CheckCircle className="w-4 h-4 mr-1" />
                                បានផ្ទៀងផ្ទាត់
                              </>
                            ) : (
                              'ផ្ទៀងផ្ទាត់'
                            )}
                          </Button>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(listing)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(listing.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredListings.length === 0 && (
                <div className="text-center py-12 text-gray-500">
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