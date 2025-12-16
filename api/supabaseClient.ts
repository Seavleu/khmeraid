// Base44 API Client (Temporary)
// Using base44 API endpoints directly

const BASE44_API_URL = 'https://app.base44.com/api/apps/693e2182609fd8b658845d5b';
const BASE44_API_KEY = '992ddf25dee2456e916794cbd4399325';

// Types
export interface Listing {
  id: string;
  title: string;
  type: string;
  area: string;
  exact_location?: string | null;
  location_consent?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  capacity_min?: number | null;
  capacity_max?: number | null;
  status: string;
  family_friendly?: boolean;
  // Accessibility features
  wheelchair_accessible?: boolean;
  accessible_parking?: boolean;
  accessible_restrooms?: boolean;
  accessible_entrance?: boolean;
  elevator_available?: boolean;
  ramp_available?: boolean;
  sign_language_available?: boolean;
  braille_available?: boolean;
  hearing_loop_available?: boolean;
  // Medical care specific
  medical_specialties?: string[];
  emergency_services?: boolean;
  hours_24?: boolean;
  insurance_accepted?: boolean;
  notes?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  facebook_contact?: string | null;
  image_url?: string | null;
  reference_link?: string | null;
  google_maps_link?: string | null;
  duration_days?: number | null;
  expires_at?: Date | string | null;
  verified?: boolean;
  opening_hours?: string | null;
  services_offered?: string[];
  average_rating?: number | null;
  review_count?: number;
  event_date?: Date | string | null;
  event_time?: string | null;
  event_end_date?: Date | string | null;
  organizer_name?: string | null;
  organizer_contact?: string | null;
  created_at?: Date | string;
  updated_at?: Date | string;
  [key: string]: any;
}

export interface HelpSeeker {
  id: string;
  name: string;
  phone: string;
  latitude: number;
  longitude: number;
  help_type: string;
  urgency?: string;
  status?: string;
  notes?: string | null;
  last_updated?: Date | string | null;
  shared_with_contacts?: string[];
  share_token?: string | null;
  created_at?: Date | string;
  updated_at?: Date | string;
  [key: string]: any;
}

// API Client
export const supabaseApi = {
  entities: {
    Listing: {
      list: async (sort?: string, limit?: number): Promise<Listing[]> => {
        try {
          const params = new URLSearchParams();
          if (sort) params.append('sort', sort);
          if (limit) params.append('limit', limit.toString());

          const response = await fetch(`${BASE44_API_URL}/entities/Listing?${params.toString()}`, {
            headers: {    
              'api_key': BASE44_API_KEY,
              'Content-Type': 'application/json'
            },
            signal: AbortSignal.timeout(10000), // 10 second timeout for low bandwidth
            cache: 'default' // Allow browser caching
          });
          if (!response.ok) throw new Error('Failed to fetch listings');
          const data = await response.json();
          return Array.isArray(data) ? data : data.items || data.results || [];
        } catch (error) {
          console.error('Error fetching listings:', error);
          throw error;
        }
      },

      create: async (data: Partial<Listing>): Promise<Listing> => {
        try {
          const response = await fetch(`${BASE44_API_URL}/entities/Listing`, {
            method: 'POST',
            headers: {
              'api_key': BASE44_API_KEY,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data),
            signal: AbortSignal.timeout(15000), // 15 second timeout for low bandwidth
          });
          if (!response.ok) throw new Error('Failed to create listing');
          return await response.json();
        } catch (error) {
          console.error('Error creating listing:', error);
          throw error;
        }
      },

      update: async (id: string, data: Partial<Listing>): Promise<Listing> => {
        try {
          const response = await fetch(`${BASE44_API_URL}/entities/Listing/${id}`, {
            method: 'PUT',
            headers: {
              'api_key': BASE44_API_KEY,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data),
            signal: AbortSignal.timeout(15000), // 15 second timeout for low bandwidth
          });
          if (!response.ok) throw new Error('Failed to update listing');
          return await response.json();
        } catch (error) {
          console.error('Error updating listing:', error);
          throw error;
        }
      },

      delete: async (id: string): Promise<void> => {
        try {
          const response = await fetch(`${BASE44_API_URL}/entities/Listing/${id}`, {
            method: 'DELETE',
            headers: {
              'api_key': BASE44_API_KEY,
              'Content-Type': 'application/json'
            },
            signal: AbortSignal.timeout(10000), // 10 second timeout for low bandwidth
          });
          if (!response.ok) throw new Error('Failed to delete listing');
        } catch (error) {
          console.error('Error deleting listing:', error);
          throw error;
        }
      },

      filter: async (filters: any): Promise<Listing[]> => {
        try {
          const params = new URLSearchParams();
          // Build filter query - base44 might use different filter syntax
          Object.keys(filters).forEach(key => {
            if (filters[key] !== undefined && filters[key] !== null) {
              params.append(key, filters[key].toString());
            }
          });

          const response = await fetch(`${BASE44_API_URL}/entities/Listing?${params.toString()}`, {
            headers: {
              'api_key': BASE44_API_KEY,
              'Content-Type': 'application/json'
            },
            signal: AbortSignal.timeout(10000), // 10 second timeout for low bandwidth
            cache: 'default' // Allow browser caching
          });
          if (!response.ok) throw new Error('Failed to filter listings');
          const data = await response.json();
          return Array.isArray(data) ? data : data.items || data.results || [];
        } catch (error) {
          console.error('Error filtering listings:', error);
          throw error;
        }
      },
    },

    HelpSeeker: {
      filter: async (filters: any): Promise<HelpSeeker[]> => {
        try {
          const params = new URLSearchParams();
          Object.keys(filters).forEach(key => {
            if (filters[key] !== undefined && filters[key] !== null) {
              params.append(key, filters[key].toString());
            }
          });

          const response = await fetch(`${BASE44_API_URL}/entities/HelpSeeker?${params.toString()}`, {
            headers: {
              'api_key': BASE44_API_KEY,
              'Content-Type': 'application/json'
            }
          });
          if (!response.ok) throw new Error('Failed to filter help seekers');
          const data = await response.json();
          return Array.isArray(data) ? data : data.items || data.results || [];
        } catch (error) {
          console.error('Error filtering help seekers:', error);
          throw error;
        }
      },

      create: async (data: Partial<HelpSeeker>): Promise<HelpSeeker> => {
        try {
          const response = await fetch(`${BASE44_API_URL}/entities/HelpSeeker`, {
            method: 'POST',
            headers: {
              'api_key': BASE44_API_KEY,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data),
          });
          if (!response.ok) throw new Error('Failed to create help seeker');
          return await response.json();
        } catch (error) {
          console.error('Error creating help seeker:', error);
          throw error;
        }
      },

      update: async (id: string, data: Partial<HelpSeeker>): Promise<HelpSeeker> => {
        try {
          const response = await fetch(`${BASE44_API_URL}/entities/HelpSeeker/${id}`, {
            method: 'PUT',
            headers: {
              'api_key': BASE44_API_KEY,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data),
          });
          if (!response.ok) throw new Error('Failed to update help seeker');
          return await response.json();
        } catch (error) {
          console.error('Error updating help seeker:', error);
          throw error;
        }
      },
    },
  },

  auth: {
    me: async () => {
      try {
        // For base44, you might need to use their auth endpoint
        // This is a placeholder - adjust based on base44's auth API
        // For now, returning empty email as base44 might not have auth
        return { email: '' };
      } catch (error) {
        console.error('Error getting user:', error);
        return { email: '' };
      }
    },
  },

  integrations: {
    Core: {
      UploadFile: async ({ file }: { file: File }): Promise<{ file_url: string }> => {
        try {
          // For base44, you might need to use their file upload endpoint
          // This is a placeholder - adjust based on base44's file upload API
          const formData = new FormData();
          formData.append('file', file);

          const response = await fetch(`${BASE44_API_URL}/integrations/Core/UploadFile`, {
            method: 'POST',
            headers: {
              'api_key': BASE44_API_KEY,
            },
            body: formData,
            signal: AbortSignal.timeout(30000), // 30 second timeout for file uploads on low bandwidth
          });

          if (!response.ok) throw new Error('Failed to upload file');
          const result = await response.json();
          return { file_url: result.file_url || result.url || '' };
        } catch (error) {
          console.error('Error uploading file:', error);
          throw error;
        }
      },
    },
  },
};


