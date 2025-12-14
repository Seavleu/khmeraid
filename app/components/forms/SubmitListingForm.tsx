'use client'

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Checkbox } from '@/app/components/ui/checkbox';
import { 
  Home, Fuel, HeartHandshake, MapPin, Users, Clock, 
  Phone, Shield, Send, Loader2, CheckCircle, Car,
  Upload, Image as ImageIcon, Facebook
} from 'lucide-react';
import { supabaseApi } from '@/api/supabaseClient';

interface SubmitListingFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const typeOptions = [
  { value: 'accommodation', label: 'Accommodation / Shelter', icon: Home, description: 'Offer a place to stay' },
  { value: 'fuel_service', label: 'Fuel Service', icon: Fuel, description: 'Fuel station or delivery' },
  { value: 'car_transportation', label: 'Car Transportation', icon: Car, description: 'Offer transportation service' },
  { value: 'volunteer_request', label: 'Volunteer Request', icon: HeartHandshake, description: 'Need volunteer help' }
];

export default function SubmitListingForm({ onSuccess, onCancel }: SubmitListingFormProps) {
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    area: '',
    exact_location: '',
    location_consent: false,
    latitude: null as number | null,
    longitude: null as number | null,
    capacity_min: '',
    capacity_max: '',
    status: 'open',
    family_friendly: false,
    notes: '',
    contact_name: '',
    contact_phone: '',
    facebook_contact: '',
    image_url: '',
    reference_link: '',
    duration_days: ''
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const { file_url } = await supabaseApi.integrations.Core.UploadFile({ file });
      handleChange('image_url', file_url);
      setImagePreview(URL.createObjectURL(file));
    } catch (error) {
      console.error('Image upload failed:', error);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    const listingData = {
      ...formData,
      capacity_min: formData.capacity_min ? parseInt(formData.capacity_min) : null,
      capacity_max: formData.capacity_max ? parseInt(formData.capacity_max) : null,
      duration_days: formData.duration_days ? parseInt(formData.duration_days) : null,
      verified: false,
      expires_at: formData.duration_days 
        ? new Date(Date.now() + parseInt(formData.duration_days) * 24 * 60 * 60 * 1000).toISOString()
        : null
    };

    try {
      await supabaseApi.entities.Listing.create(listingData);
      setSubmitted(true);
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (error) {
      console.error('Failed to submit listing:', error);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card className="border-0 shadow-xl">
        <CardContent className="p-8 text-center">
          <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Thank You!</h3>
          <p className="text-gray-600">
            Your listing has been submitted for review. Our team will verify it shortly.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white">
        <CardTitle className="flex items-center gap-2">
          <HeartHandshake className="w-6 h-6" />
          Offer Help
        </CardTitle>
        <p className="text-teal-100 text-sm">
          Share your resources with those in need
        </p>
      </CardHeader>

      <CardContent className="p-6">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1">
              <div className={`h-2 rounded-full ${s <= step ? 'bg-teal-500' : 'bg-gray-200'}`} />
            </div>
          ))}
        </div>

        {/* Step 1: Type Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">What type of help are you offering?</h3>
            <div className="grid gap-3">
              {typeOptions.map(({ value, label, icon: Icon, description }) => (
                <div
                  key={value}
                  onClick={() => handleChange('type', value)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.type === value 
                      ? 'border-teal-500 bg-teal-50' 
                      : 'border-gray-200 hover:border-teal-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${formData.type === value ? 'bg-teal-100' : 'bg-gray-100'}`}>
                      <Icon className={`w-5 h-5 ${formData.type === value ? 'text-teal-600' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{label}</p>
                      <p className="text-sm text-gray-500">{description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button 
              onClick={() => setStep(2)} 
              disabled={!formData.type}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              Continue
            </Button>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Tell us more</h3>
            
            <div className="space-y-2">
              <Label>Title / Name *</Label>
              <Input 
                placeholder="e.g., Room available in city center"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Area / Neighborhood *</Label>
              <Input 
                placeholder="e.g., Downtown, North District"
                value={formData.area}
                onChange={(e) => handleChange('area', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Capacity</Label>
                <Input 
                  type="number"
                  placeholder="1"
                  value={formData.capacity_min}
                  onChange={(e) => handleChange('capacity_min', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Capacity</Label>
                <Input 
                  type="number"
                  placeholder="4"
                  value={formData.capacity_max}
                  onChange={(e) => handleChange('capacity_max', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>How long is this available? (days)</Label>
              <Input 
                type="number"
                placeholder="7"
                value={formData.duration_days}
                onChange={(e) => handleChange('duration_days', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Additional Notes</Label>
              <Textarea 
                placeholder="Any requirements, amenities, or special instructions..."
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                className="h-24"
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Upload Photo (optional)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center">
                {imagePreview ? (
                  <div className="space-y-2">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setImagePreview(null);
                        handleChange('image_url', '');
                      }}
                    >
                      Remove Photo
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                    <div className="flex flex-col items-center gap-2">
                      {uploadingImage ? (
                        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                      )}
                      <p className="text-sm text-gray-600">
                        {uploadingImage ? 'Uploading...' : 'Click to upload photo'}
                      </p>
                      <p className="text-xs text-gray-400">
                        Photo of place, vehicle, or relevant image
                      </p>
                    </div>
                  </label>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-xl">
              <Checkbox 
                id="family"
                checked={formData.family_friendly}
                onCheckedChange={(checked) => handleChange('family_friendly', checked)}
              />
              <Label htmlFor="family" className="text-pink-700 cursor-pointer">
                Suitable for families with children
              </Label>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={() => setStep(3)} 
                disabled={!formData.title || !formData.area}
                className="flex-1 bg-teal-600 hover:bg-teal-700"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Location & Contact */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Location & Contact</h3>
            
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800">Privacy Notice</p>
                  <p className="text-blue-600">
                    Your exact address will only be shown if you consent below. 
                    Otherwise, only the area name will be displayed.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Exact Address (optional)</Label>
              <Input 
                placeholder="123 Main Street"
                value={formData.exact_location}
                onChange={(e) => handleChange('exact_location', e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <Checkbox 
                id="consent"
                checked={formData.location_consent}
                onCheckedChange={(checked) => handleChange('location_consent', checked)}
              />
              <Label htmlFor="consent" className="text-gray-700 cursor-pointer">
                I consent to showing my exact location on the map
              </Label>
            </div>

            <div className="space-y-2">
              <Label>Contact Name (optional)</Label>
              <Input 
                placeholder="Your name"
                value={formData.contact_name}
                onChange={(e) => handleChange('contact_name', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Contact Phone (optional)</Label>
              <Input 
                placeholder="+855 12 345 678"
                value={formData.contact_phone}
                onChange={(e) => handleChange('contact_phone', e.target.value)}
              />
              <p className="text-xs text-gray-500">
                If provided, seekers can call you directly
              </p>
            </div>

            <div className="space-y-2">
              <Label>Facebook Contact (optional)</Label>
              <div className="flex items-center gap-2">
                <Facebook className="w-5 h-5 text-blue-600" />
                <Input 
                  placeholder="facebook.com/username or profile link"
                  value={formData.facebook_contact}
                  onChange={(e) => handleChange('facebook_contact', e.target.value)}
                />
              </div>
              <p className="text-xs text-gray-500">
                Facebook profile or page for alternative contact
              </p>
            </div>

            <div className="space-y-2">
              <Label>Reference Link (optional)</Label>
              <Input 
                placeholder="https://source-website.com/data"
                value={formData.reference_link}
                onChange={(e) => handleChange('reference_link', e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Link to where this data came from
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={loading}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Listing
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Cancel */}
        {onCancel && (
          <Button 
            variant="ghost" 
            onClick={onCancel} 
            className="w-full mt-4 text-gray-500"
          >
            Cancel
          </Button>
        )}
      </CardContent>
    </Card>
  );
}