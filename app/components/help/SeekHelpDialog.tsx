'use client'

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Badge } from '@/app/components/ui/badge';
import { supabaseApi } from '@/api/supabaseClient';
import { 
  AlertCircle, Phone, MapPin, Share2, Copy, Check,
  Heart, Home, Utensils, Car, HelpCircle, X
} from 'lucide-react';

const helpTypes = [
  { value: 'medical', label: 'វេជ្ជសាស្រ្ត', icon: Heart, color: 'bg-red-500' },
  { value: 'shelter', label: 'ទីជម្រក', icon: Home, color: 'bg-blue-500' },
  { value: 'food', label: 'អាហារ', icon: Utensils, color: 'bg-green-500' },
  { value: 'transportation', label: 'ដឹកជញ្ជូន', icon: Car, color: 'bg-purple-500' },
  { value: 'other', label: 'ផ្សេងៗ', icon: HelpCircle, color: 'bg-gray-500' }
];

const urgencyLevels = [
  { value: 'low', label: 'ទាប', color: 'bg-gray-500' },
  { value: 'medium', label: 'មធ្យម', color: 'bg-yellow-500' },
  { value: 'high', label: 'ខ្ពស់', color: 'bg-orange-500' },
  { value: 'critical', label: 'ធ្ងន់ធ្ងរ', color: 'bg-red-600' }
];

interface SeekHelpDialogProps {
  open: boolean;
  onClose: () => void;
  userLocation?: [number, number] | null;
}

export default function SeekHelpDialog({ open, onClose, userLocation }: SeekHelpDialogProps) {
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeRequest, setActiveRequest] = useState<any>(null);
  const [shareLink, setShareLink] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    help_type: 'shelter',
    urgency: 'medium',
    notes: '',
    shared_with_contacts: ''
  });

  // Check for active request on mount
  useEffect(() => {
    if (open) {
      checkActiveRequest();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Update location periodically if there's an active request
  useEffect(() => {
    if (!activeRequest) return;
    
    const interval = setInterval(() => {
      updateLocation();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRequest]);

  const checkActiveRequest = async () => {
    try {
      // Check for active requests by phone number from form data
      if (formData.phone) {
        const requests = await supabaseApi.entities.HelpSeeker.filter({ 
          status: 'active' 
        });
        // Find request matching the phone number
        const userRequest = requests.find(r => r.phone === formData.phone);
        if (userRequest) {
          setActiveRequest(userRequest);
          generateShareLink(userRequest.share_token || userRequest.id);
        }
      }
    } catch (error) {
      console.error('Error checking active request:', error);
    }
  };

  const updateLocation = async () => {
    if (!navigator.geolocation || !activeRequest) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await supabaseApi.entities.HelpSeeker.update(activeRequest.id, {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            last_updated: new Date().toISOString()
          });
        } catch (error) {
          console.error('Error updating location:', error);
        }
      },
      (error) => console.error('Location error:', error)
    );
  };

  const handleSubmit = async () => {
    if (!userLocation) {
      alert('ត្រូវការទីតាំងរបស់អ្នក។ សូមអនុញ្ញាតការចូលប្រើទីតាំង។');
      return;
    }

    setLoading(true);
    try {
      const shareToken = Math.random().toString(36).substring(2, 15);
      const contactsArray = formData.shared_with_contacts
        .split(',')
        .map(c => c.trim())
        .filter(c => c);

      const newRequest = await supabaseApi.entities.HelpSeeker.create({
        ...formData,
        latitude: userLocation[0],
        longitude: userLocation[1],
        last_updated: new Date().toISOString(),
        shared_with_contacts: contactsArray,
        share_token: shareToken,
        status: 'active'
      });

      setActiveRequest(newRequest);
      generateShareLink(shareToken);

      // Send SMS/email to trusted contacts
      if (contactsArray.length > 0) {
        await notifyContacts(contactsArray, shareToken, newRequest);
      }

      setStep(3);
    } catch (error) {
      console.error('Error creating help request:', error);
      alert('មានបញ្ហាក្នុងការបង្កើតសំណើ។ សូមព្យាយាមម្តងទៀត។');
    } finally {
      setLoading(false);
    }
  };

  const notifyContacts = async (contacts: any[], token: string, request: any) => {
    const shareUrl = `${window.location.origin}?track=${token}`;
    const message = `${request.name} ត្រូវការជំនួយ។ តាមដានទីតាំង: ${shareUrl}`;

    for (const contact of contacts) {
      try {
        if (contact.includes('@')) {
          // Email sending functionality - implement based on your backend
          // await supabaseApi.integrations.Core.SendEmail({
          //   to: contact,
          //   subject: 'សំណើជំនួយបន្ទាន់',
          //   body: message
          // });
          console.log('Email would be sent to:', contact, 'with message:', message);
        }
      } catch (error) {
        console.error('Error notifying contact:', error);
      }
    }
  };

  const generateShareLink = (token: string) => {
    const url = `${window.location.origin}?track=${token}`;
    setShareLink(url);
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCancel = async () => {
    if (!activeRequest) return;
    
    setLoading(true);
    try {
      await supabaseApi.entities.HelpSeeker.update(activeRequest.id, {
        status: 'cancelled'
      });
      setActiveRequest(null);
      onClose();
    } catch (error) {
      console.error('Error cancelling request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkHelped = async () => {
    if (!activeRequest) return;
    
    setLoading(true);
    try {
      await supabaseApi.entities.HelpSeeker.update(activeRequest.id, {
        status: 'helped'
      });
      setActiveRequest(null);
      onClose();
    } catch (error) {
      console.error('Error updating request:', error);
    } finally {
      setLoading(false);
    }
  };

  if (activeRequest) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-red-600 flex items-center gap-2">
              <AlertCircle className="w-6 h-6 animate-pulse" />
              សំណើជំនួយសកម្ម
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <p className="text-sm font-semibold text-red-700">ទីតាំងរបស់អ្នកកំពុងត្រូវបានតាមដាន</p>
              </div>
              <p className="text-xs text-red-600">
                ទីតាំងធ្វើបច្ចុប្បន្នភាពស្វ័យប្រវត្តិរាល់ 30 វិនាទី
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">ប្រភេទជំនួយ</p>
              <Badge className={`${helpTypes.find(t => t.value === activeRequest.help_type)?.color} text-white text-base px-4 py-2`}>
                {helpTypes.find(t => t.value === activeRequest.help_type)?.label}
              </Badge>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">កម្រិតបន្ទាន់</p>
              <Badge className={`${urgencyLevels.find(u => u.value === activeRequest.urgency)?.color} text-white text-base px-4 py-2`}>
                {urgencyLevels.find(u => u.value === activeRequest.urgency)?.label}
              </Badge>
            </div>

            {shareLink && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-blue-700 mb-2 flex items-center gap-2">
                  <Share2 className="w-4 h-4" />
                  តំណភ្ជាប់ចែករំលែកទីតាំង
                </p>
                <div className="flex gap-2">
                  <Input value={shareLink} readOnly className="text-xs" />
                  <Button onClick={copyShareLink} size="sm" variant="outline">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  ចែករំលែកតំណនេះជាមួយមនុស្សដែលអ្នកទុកចិត្ត
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleMarkHelped}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                disabled={loading}
              >
                <Check className="w-4 h-4 mr-2" />
                បានទទួលជំនួយ
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                className="flex-1"
                disabled={loading}
              >
                <X className="w-4 h-4 mr-2" />
                បោះបង់
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-red-600">
            ខ្ញុំត្រូវការជំនួយឥឡូវនេះ
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-red-700 mb-2">
                ✓ ទីតាំងរបស់អ្នកនឹងត្រូវបានតាមដានពេញម៉ោង
              </p>
              <p className="text-xs text-red-600">
                ✓ ចែករំលែកទីតាំងជាមួយមនុស្សដែលអ្នកទុកចិត្ត
              </p>
              <p className="text-xs text-red-600">
                ✓ បង្ហាញលើផែនទីសាធារណៈសម្រាប់អ្នកជួយ
              </p>
            </div>

            <div className="space-y-3">
              <Input
                placeholder="ឈ្មោះរបស់អ្នក *"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
              <Input
                placeholder="លេខទូរស័ព្ទ *"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">ប្រភេទជំនួយ *</p>
                <div className="grid grid-cols-2 gap-2">
                  {helpTypes.map(({ value, label, icon: Icon, color }) => (
                    <Button
                      key={value}
                      variant={formData.help_type === value ? 'default' : 'outline'}
                      className={formData.help_type === value ? `${color} text-white` : ''}
                      onClick={() => setFormData({...formData, help_type: value})}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">កម្រិតបន្ទាន់ *</p>
                <div className="grid grid-cols-2 gap-2">
                  {urgencyLevels.map(({ value, label, color }) => (
                    <Button
                      key={value}
                      variant={formData.urgency === value ? 'default' : 'outline'}
                      className={formData.urgency === value ? `${color} text-white` : ''}
                      onClick={() => setFormData({...formData, urgency: value})}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              <Textarea
                placeholder="ព័ត៌មានបន្ថែម (ស្រេចចិត្ត)"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={3}
              />

              <Input
                placeholder="ទូរស័ព្ទ/អ៊ីមែលមនុស្សទុកចិត្ត (បំបែកដោយសញ្ញាក្បៀស)"
                value={formData.shared_with_contacts}
                onChange={(e) => setFormData({...formData, shared_with_contacts: e.target.value})}
              />
            </div>

            <Button
              onClick={handleSubmit}
              className="w-full bg-red-600 hover:bg-red-700 text-white text-lg py-6"
              disabled={loading || !formData.name || !formData.phone}
            >
              {loading ? 'កំពុងដំណើរការ...' : 'ចាប់ផ្តើមតាមដាន & ស្វែងរកជំនួយ'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}