import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const createMiniPin = (color, text) => {
  return L.divIcon({
    className: 'custom-leaflet-minipin',
    html: `
      <div style="
        background-color: ${color};
        color: white;
        padding: 2px 6px;
        border-radius: 8px;
        font-size: 10px;
        font-weight: 800;
        white-space: nowrap;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        border: 1.5px solid white;
        display: flex;
        align-items: center;
        gap: 3px;
      ">
        <span>${text}</span>
      </div>
    `,
    iconSize: [60, 20],
    iconAnchor: [30, 20]
  });
};

export default function CustomerRouteMap({
  sedeCoords,     // [lat, lng]
  customerCoords, // [lat, lng]
  isCovered = true,
  radiusKm = 5,
  distanceKm = null
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (!sedeCoords?.[0] || !customerCoords?.[0]) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        touchZoom: false,
        scrollWheelZoom: false,
        doubleClickZoom: false
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd'
      }).addTo(map);

      // Sede Marker
      L.marker(sedeCoords, {
        icon: createMiniPin('#2f4131', '🏪 Restaurante')
      }).addTo(map);

      // Customer Marker
      L.marker(customerCoords, {
        icon: createMiniPin(isCovered ? '#10b981' : '#e11d48', '📍 Tu Entrega')
      }).addTo(map);

      // Dotted Line connecting Sede and Customer
      L.polyline([sedeCoords, customerCoords], {
        color: isCovered ? '#10b981' : '#e11d48',
        weight: 3,
        dashArray: '6, 8',
        opacity: 0.8
      }).addTo(map);

      // Optional coverage circle around Sede
      if (radiusKm) {
        L.circle(sedeCoords, {
          radius: radiusKm * 1000,
          color: '#10b981',
          weight: 1,
          fillColor: '#10b981',
          fillOpacity: 0.08
        }).addTo(map);
      }

      // Fit bounds to show both points nicely
      const bounds = L.latLngBounds([sedeCoords, customerCoords]);
      map.fitBounds(bounds, { padding: [25, 25] });

      mapInstanceRef.current = map;

      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [sedeCoords, customerCoords, isCovered, radiusKm]);

  return (
    <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-xs h-36 bg-gray-100">
      <div ref={mapContainerRef} className="w-full h-full" />
      {distanceKm !== null && (
        <div className={`absolute top-2 right-2 z-[400] px-2 py-0.5 rounded-md text-[10px] font-bold shadow-xs border ${
          isCovered ? 'bg-white/95 text-emerald-800 border-emerald-200' : 'bg-white/95 text-rose-700 border-rose-200'
        }`}>
          Distancia: {distanceKm} km
        </div>
      )}
    </div>
  );
}
