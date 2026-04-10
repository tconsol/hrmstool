import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader, MapPin } from 'lucide-react';

interface GoogleMapProps {
  latitude: number | '';
  longitude: number | '';
  zoom?: number;
  markers?: Array<{ lat: number; lng: number; title: string; color?: string }>;
  onClick?: (lat: number, lng: number) => void;
  draggable?: boolean;
  height?: string;
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Tell TypeScript about the global google object loaded by the Maps script
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google: any;
  }
}

// Singleton: track script load so it only loads once per page
let _scriptState: 'idle' | 'loading' | 'loaded' | 'error' = 'idle';
const _scriptCallbacks: Array<(ok: boolean) => void> = [];

function loadMapsScript(apiKey: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (_scriptState === 'loaded' || window.google?.maps) {
      _scriptState = 'loaded';
      return resolve(true);
    }
    if (_scriptState === 'loading') {
      return _scriptCallbacks.push(resolve) && undefined;
    }
    _scriptState = 'loading';
    _scriptCallbacks.push(resolve);
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    s.async = true;
    s.onload = () => {
      _scriptState = 'loaded';
      _scriptCallbacks.forEach(cb => cb(true));
      _scriptCallbacks.length = 0;
    };
    s.onerror = () => {
      _scriptState = 'error';
      _scriptCallbacks.forEach(cb => cb(false));
      _scriptCallbacks.length = 0;
    };
    document.head.appendChild(s);
  });
}

const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 };

export default function GoogleMap({
  latitude,
  longitude,
  zoom = 16,
  markers = [],
  onClick,
  draggable = true,
  height = '320px',
}: GoogleMapProps) {
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const extraMarkersRef = useRef<any[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const lat = latitude !== '' && !isNaN(Number(latitude)) ? Number(latitude) : null;
  const lng = longitude !== '' && !isNaN(Number(longitude)) ? Number(longitude) : null;

  const initMap = useCallback((container: HTMLDivElement) => {
    if (!window.google?.maps || mapRef.current) return;
    const center = lat && lng ? { lat, lng } : DEFAULT_CENTER;
    const initZoom = lat && lng ? zoom : 5;
    const map = new window.google.maps.Map(container, {
      center,
      zoom: initZoom,
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
      zoomControl: true,
    });
    if (draggable && onClick) {
      map.addListener('click', (e: any) => {
        if (e.latLng) onClick(e.latLng.lat(), e.latLng.lng());
      });
    }
    mapRef.current = map;
    setStatus('ready');
  }, []); // eslint-disable-line

  // Callback ref fires when the div mounts
  const attachContainer = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node;
    if (node && window.google?.maps) {
      initMap(node);
    }
  }, [initMap]);

  // Load script
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) { setStatus('error'); return; }
    loadMapsScript(GOOGLE_MAPS_API_KEY).then((ok) => {
      if (ok && containerRef.current) {
        initMap(containerRef.current);
      } else if (!ok) {
        setStatus('error');
      }
    });
  }, []); // eslint-disable-line

  // Update center when coords change
  useEffect(() => {
    if (!mapRef.current) return;
    const center = lat && lng ? { lat, lng } : DEFAULT_CENTER;
    mapRef.current.setCenter(center);
    mapRef.current.setZoom(lat && lng ? zoom : 5);
  }, [lat, lng, zoom]);

  // Update main marker
  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) return;
    if (lat && lng) {
      if (markerRef.current) {
        markerRef.current.setPosition({ lat, lng });
        markerRef.current.setMap(mapRef.current);
      } else {
        markerRef.current = new window.google.maps.Marker({
          position: { lat, lng },
          map: mapRef.current,
          title: 'Office Location',
          draggable,
          animation: window.google.maps.Animation.DROP,
        });
        if (draggable && onClick) {
          markerRef.current.addListener('dragend', (e: any) => {
            if (e.latLng) onClick(e.latLng.lat(), e.latLng.lng());
          });
        }
      }
    } else if (markerRef.current) {
      markerRef.current.setMap(null);
    }
  }, [lat, lng, draggable, onClick]);

  // Extra markers
  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) return;
    extraMarkersRef.current.forEach(m => m.setMap(null));
    extraMarkersRef.current = [];
    markers.forEach(m => {
      const marker = new window.google.maps.Marker({
        position: { lat: m.lat, lng: m.lng },
        map: mapRef.current,
        title: m.title,
      });
      extraMarkersRef.current.push(marker);
    });
  }, [markers]);

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-600/60 bg-slate-900" style={{ height }}>
      <div ref={attachContainer} className="absolute inset-0 w-full h-full" />

      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-20 gap-3">
          <Loader className="w-6 h-6 animate-spin text-emerald-400" />
          <span className="text-xs text-slate-400">Loading Google Maps…</span>
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-20 gap-2 p-4 text-center">
          <MapPin className="w-8 h-8 text-red-400 opacity-60" />
          <p className="text-red-400 text-sm font-medium">Map failed to load</p>
          <p className="text-slate-500 text-xs">Check VITE_GOOGLE_MAPS_API_KEY in .env</p>
        </div>
      )}

      {status === 'ready' && draggable && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-sm border border-slate-600 px-3 py-1.5 rounded-full text-xs text-slate-300 pointer-events-none z-10 whitespace-nowrap">
          📍 Click map to pin • Drag marker to adjust
        </div>
      )}
    </div>
  );
}
