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
  }
}

declare global {
  interface Window {
    google?: typeof google;
  }
}

