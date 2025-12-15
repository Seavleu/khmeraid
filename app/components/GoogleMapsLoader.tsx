'use client'

import { useEffect, useState } from 'react'

export default function GoogleMapsLoader() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || typeof window === 'undefined') return;

    const ensureLoader = () => {
      const existingLoader = document.querySelector('gmpx-api-loader');
      if (existingLoader) {
        // Update existing loader if needed
        if (!existingLoader.getAttribute('key')) {
          existingLoader.setAttribute('key', apiKey);
        }
        return;
      }

      // Wait for custom elements to be defined
      if (!customElements.get('gmpx-api-loader')) {
        // Wait a bit for the script to load
        setTimeout(ensureLoader, 100);
        return;
      }

      // Create single global loader
      const loader = document.createElement('gmpx-api-loader');
      loader.setAttribute('key', apiKey);
      loader.setAttribute('solution-channel', 'GMP_GE_mapsandplacesautocomplete_v2');
      loader.style.display = 'none'; // Hide it, we just need it for API loading
      document.body.appendChild(loader);
    };

    ensureLoader();
  }, [mounted]);

  // Return null to avoid hydration issues
  return null;
}

