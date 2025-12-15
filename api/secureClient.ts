// Secure API Client - Hides backend implementation
import { generateApiToken } from '@/lib/api-crypto';

const API_BASE_URL = '/api/data';

// File upload helper
async function uploadFile(file: File): Promise<{ file_url: string }> {
  const token = await getApiToken();
  
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
    signal: AbortSignal.timeout(30000),
  });
  
  if (!response.ok) {
    throw new Error('Failed to upload file');
  }
  
  return response.json();
}

// Cache for tokens (refresh every hour)
let cachedToken: { token: string; expires: number } | null = null;

// Get or refresh API token
export async function getApiToken(): Promise<string> {
  const now = Date.now();
  
  // Use cached token if still valid (with 5 minute buffer)
  if (cachedToken && now < cachedToken.expires - (5 * 60 * 1000)) {
    return cachedToken.token;
  }
  
  // Fetch new token
  try {
    const response = await fetch(`${API_BASE_URL}/token`, {
      cache: 'no-store',
    });
    
    if (!response.ok) {
      throw new Error('Failed to get token');
    }
    
    const { token } = await response.json();
    cachedToken = {
      token,
      expires: now + (60 * 60 * 1000), // 1 hour
    };
    
    return token;
  } catch (error) {
    console.error('Failed to get API token:', error);
    // Fallback: generate a client-side token (less secure but allows offline)
    return generateApiToken({ type: 'public', scope: 'read' });
  }
}

// Make authenticated API request
async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const token = await getApiToken();
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
    // Add timeout for low bandwidth scenarios
    signal: AbortSignal.timeout(10000),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  
  return response.json();
}

// Types (exported for use in components)
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

// Secure API Client
export const secureApi = {
  entities: {
    Listing: {
      list: async (sort?: string, limit?: number): Promise<Listing[]> => {
        const params = new URLSearchParams();
        if (sort) params.append('sort', sort);
        if (limit) params.append('limit', limit.toString());
        
        const { data } = await apiRequest(`/listings?${params.toString()}`);
        return Array.isArray(data) ? data : [];
      },

      create: async (data: Partial<Listing>): Promise<Listing> => {
        const { data: result } = await apiRequest('/listings', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        return result;
      },

      update: async (id: string, data: Partial<Listing>): Promise<Listing> => {
        const { data: result } = await apiRequest(`/listings/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
        return result;
      },

      delete: async (id: string): Promise<void> => {
        await apiRequest(`/listings/${id}`, {
          method: 'DELETE',
        });
      },

      filter: async (filters: any): Promise<Listing[]> => {
        const params = new URLSearchParams();
        Object.keys(filters).forEach(key => {
          if (filters[key] !== undefined && filters[key] !== null) {
            params.append(key, filters[key].toString());
          }
        });
        
        const { data } = await apiRequest(`/listings?${params.toString()}`);
        return Array.isArray(data) ? data : [];
      },
    },

    HelpSeeker: {
      filter: async (filters: any): Promise<HelpSeeker[]> => {
        const params = new URLSearchParams();
        Object.keys(filters).forEach(key => {
          if (filters[key] !== undefined && filters[key] !== null) {
            params.append(key, filters[key].toString());
          }
        });
        
        const { data } = await apiRequest(`/help-seekers?${params.toString()}`);
        return Array.isArray(data) ? data : [];
      },

      create: async (data: Partial<HelpSeeker>): Promise<HelpSeeker> => {
        const { data: result } = await apiRequest('/help-seekers', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        return result;
      },

      update: async (id: string, data: Partial<HelpSeeker>): Promise<HelpSeeker> => {
        const { data: result } = await apiRequest(`/help-seekers/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
        return result;
      },
    },
  },

  integrations: {
    Core: {
      UploadFile: uploadFile,
    },
  },
};

