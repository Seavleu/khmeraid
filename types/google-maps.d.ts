// Type declarations for Google Maps JavaScript API
declare namespace google {
  namespace maps {
    class Map {
      constructor(element: HTMLElement, options?: MapOptions);
      setOptions(options: MapOptions): void;
      fitBounds(bounds: LatLngBounds): void;
      panTo(location: LatLng | LatLngLiteral): void;
      setCenter(location: LatLng | LatLngLiteral): void;
      setZoom(zoom: number): void;
      addListener(event: string, handler: (e: any) => void): void;
      innerMap?: Map;
    }

    interface MapMouseEvent {
      latLng?: LatLng;
    }

    interface MapOptions {
      center?: LatLng | LatLngLiteral;
      zoom?: number;
      mapTypeControl?: boolean;
      fullscreenControl?: boolean;
      zoomControl?: boolean;
      streetViewControl?: boolean;
    }

    class LatLng {
      constructor(lat: number, lng: number);
      lat(): number;
      lng(): number;
    }

    interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    class LatLngBounds {
      constructor(sw?: LatLng | LatLngLiteral, ne?: LatLng | LatLngLiteral);
    }

    class Circle {
      constructor(options?: CircleOptions);
      setMap(map: Map | null): void;
      setCenter(center: LatLng | LatLngLiteral): void;
      setRadius(radius: number): void;
      getCenter(): LatLng;
      getRadius(): number;
    }

    interface CircleOptions {
      map?: Map;
      center?: LatLng | LatLngLiteral;
      radius?: number;
      fillColor?: string;
      fillOpacity?: number;
      strokeColor?: string;
      strokeOpacity?: number;
      strokeWeight?: number;
      zIndex?: number;
    }

    class InfoWindow {
      constructor(options?: InfoWindowOptions);
      setContent(content: string | HTMLElement): void;
      open(map?: Map, anchor?: any): void;
      close(): void;
    }

    interface InfoWindowOptions {
      content?: string | HTMLElement;
      position?: LatLng | LatLngLiteral;
    }

    namespace marker {
      class AdvancedMarkerElement {
        constructor(options: AdvancedMarkerElementOptions);
        map: Map | null;
        position: LatLng | LatLngLiteral | null;
        addListener(event: string, handler: (e: any) => void): void;
      }

      interface AdvancedMarkerElementOptions {
        map?: Map;
        position?: LatLng | LatLngLiteral;
        title?: string;
        gmpDraggable?: boolean;
      }
    }

    namespace places {
      class Autocomplete {
        constructor(inputField: HTMLInputElement, options?: AutocompleteOptions);
      }

      interface AutocompleteOptions {
        types?: string[];
        fields?: string[];
      }
    }

    class Geocoder {
      constructor();
      geocode(request: GeocoderRequest, callback: (results: GeocoderResult[] | null, status: GeocoderStatus) => void): void;
    }

    interface GeocoderRequest {
      location?: LatLng | LatLngLiteral;
      address?: string;
      placeId?: string;
    }

    interface GeocoderResult {
      formatted_address: string;
      geometry: {
        location: LatLng;
        viewport?: LatLngBounds;
      };
      place_id?: string;
    }

    enum GeocoderStatus {
      OK = 'OK',
      ZERO_RESULTS = 'ZERO_RESULTS',
      OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
      REQUEST_DENIED = 'REQUEST_DENIED',
      INVALID_REQUEST = 'INVALID_REQUEST',
      UNKNOWN_ERROR = 'UNKNOWN_ERROR'
    }
  }
}

declare global {
  interface Window {
    google?: typeof google;
  }
}

