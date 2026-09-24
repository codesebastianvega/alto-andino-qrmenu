import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon } from '@iconify/react';

// Custom clean SVG markers to avoid asset loading issues with Webpack/Vite
const createCustomIcon = (bgColor, iconName) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        background-color: ${bgColor};
        width: 36px;
        height: 36px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 14px rgba(0,0,0,0.3);
        border: 2px solid #ffffff;
      ">
        <div style="transform: rotate(45deg); color: white; display: flex; align-items: center; justify-content: center;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36]
  });
};

export default function CoverageMap({
  latitude,
  longitude,
  radiusKm = 5,
  onLocationChange,
  readOnly = false,
  height = '280px',
  sedeName = 'Nuestra Sede'
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);

  // Fallback coordinates: Zipaquirá (5.0260, -74.0040)
  const defaultLat = 5.0260;
  const defaultLng = -74.0040;

  const currentLat = latitude != null && !isNaN(Number(latitude)) ? Number(latitude) : defaultLat;
  const currentLng = longitude != null && !isNaN(Number(longitude)) ? Number(longitude) : defaultLng;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Map only once
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [currentLat, currentLng],
        zoom: 13,
        zoomControl: true,
        attributionControl: false
      });

      // CartoDB Positron / OSM tiles for clean, modern aesthetics
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd'
      }).addTo(map);

      // Sede Marker
      const marker = L.marker([currentLat, currentLng], {
        icon: createCustomIcon('#2f4131', 'solar:shop-2-bold'),
        draggable: !readOnly
      }).addTo(map);

      marker.bindPopup(`<b>${sedeName}</b><br>Punto de partida de domicilios`);

      if (!readOnly && onLocationChange) {
        marker.on('dragend', (e) => {
          const { lat, lng } = e.target.getLatLng();
          onLocationChange({ lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) });
        });

        map.on('click', (e) => {
          const { lat, lng } = e.latlng;
          marker.setLatLng([lat, lng]);
          onLocationChange({ lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) });
        });
      }

      // Coverage Radius Circle
      const circle = L.circle([currentLat, currentLng], {
        radius: (radiusKm || 5) * 1000,
        color: '#10b981',
        weight: 2,
        fillColor: '#10b981',
        fillOpacity: 0.15,
        dashArray: '4, 6'
      }).addTo(map);

      mapInstanceRef.current = map;
      markerRef.current = marker;
      circleRef.current = circle;

      // Ensure proper rendering in modals
      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    }

    return () => {
      // Cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
        circleRef.current = null;
      }
    };
  }, []);

  // Update marker & circle position when coordinates change from props
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current || !circleRef.current) return;
    const newPos = [currentLat, currentLng];
    markerRef.current.setLatLng(newPos);
    circleRef.current.setLatLng(newPos);
    mapInstanceRef.current.panTo(newPos, { animate: true, duration: 0.6 });
  }, [currentLat, currentLng]);

  // Update circle radius when radiusKm changes
  useEffect(() => {
    if (!circleRef.current) return;
    circleRef.current.setRadius((radiusKm || 5) * 1000);
  }, [radiusKm]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-gray-200/90 shadow-sm bg-gray-50">
      <div 
        ref={mapContainerRef} 
        style={{ height, width: '100%' }}
        className="z-0"
      />
      {!readOnly && (
        <div className="absolute top-2.5 left-2.5 z-[400] bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-gray-200/80 shadow-xs flex items-center gap-1.5 text-[11px] font-semibold text-gray-700">
          <Icon icon="solar:hand-shake-bold" className="text-emerald-600 text-sm" />
          <span>Haz clic o arrastra el pin para ubicar tu sede</span>
        </div>
      )}
      <div className="absolute bottom-2.5 right-2.5 z-[400] bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-gray-200/60 shadow-xs text-[10px] font-bold text-emerald-800">
        Cobertura: {radiusKm || 5} km
      </div>
    </div>
  );
}
