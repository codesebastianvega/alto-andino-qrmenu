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
        width: 38px;
        height: 38px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 14px rgba(0,0,0,0.35);
        border: 2.5px solid #ffffff;
      ">
        <div style="transform: rotate(45deg); color: white; display: flex; align-items: center; justify-content: center;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38]
  });
};

export default function CoverageMap({
  latitude,
  longitude,
  radiusKm = 5,
  onLocationChange,
  readOnly = false,
  height = '300px',
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
        zoom: 14,
        zoomControl: true,
        attributionControl: false
      });

      // Official OpenStreetMap tile layer (Crisp, colorful, 100% free, NO watermarks/API keys)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
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

      // Coverage Radius Circle (meters)
      const circle = L.circle([currentLat, currentLng], {
        radius: (radiusKm || 5) * 1000,
        color: '#059669',
        weight: 2.5,
        fillColor: '#10b981',
        fillOpacity: 0.18,
        dashArray: '6, 6'
      }).addTo(map);

      mapInstanceRef.current = map;
      markerRef.current = marker;
      circleRef.current = circle;

      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    }

    return () => {
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
        <div className="absolute top-3 left-12 z-[400] bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-gray-200/80 shadow-sm flex items-center gap-1.5 text-xs font-semibold text-gray-800">
          <Icon icon="solar:hand-shake-bold" className="text-emerald-700 text-sm" />
          <span>Arrastra el pin o toca el mapa para fijar tu sede</span>
        </div>
      )}
      <div className="absolute bottom-3 right-3 z-[400] bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-gray-200 shadow-sm text-xs font-bold text-emerald-900 flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
        <span>Radio: {radiusKm || 5} km (Diámetro: {((radiusKm || 5) * 2).toFixed(1)} km)</span>
      </div>
    </div>
  );
}
