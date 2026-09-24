import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon } from '@iconify/react';

const createMiniPin = (color, text) => {
  return L.divIcon({
    className: 'custom-leaflet-minipin',
    html: `
      <div style="
        background-color: ${color};
        color: white;
        padding: 3px 8px;
        border-radius: 10px;
        font-size: 11px;
        font-weight: 800;
        white-space: nowrap;
        box-shadow: 0 3px 8px rgba(0,0,0,0.35);
        border: 2px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span>${text}</span>
      </div>
    `,
    iconSize: [88, 26],
    iconAnchor: [44, 26]
  });
};

export default function CustomerRouteMap({
  sedeCoords,     // [lat, lng]
  customerCoords, // [lat, lng]
  isCovered = true,
  radiusKm = 5,
  distanceKm = null
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // References for mini preview map
  const miniMapContainerRef = useRef(null);
  const miniMapInstanceRef = useRef(null);

  // References for full modal map
  const modalMapContainerRef = useRef(null);
  const modalMapInstanceRef = useRef(null);

  // 1. Initialize Mini Static Preview Map
  useEffect(() => {
    if (!miniMapContainerRef.current) return;
    if (!sedeCoords?.[0] || !customerCoords?.[0]) return;

    if (!miniMapInstanceRef.current) {
      const map = L.map(miniMapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        touchZoom: false,
        scrollWheelZoom: false,
        doubleClickZoom: false
      });

      // Official OpenStreetMap tile layer (Crisp, colorful, no watermark)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      // Sede Marker
      L.marker(sedeCoords, {
        icon: createMiniPin('#2f4131', '🏪 Restaurante')
      }).addTo(map);

      // Customer Marker
      L.marker(customerCoords, {
        icon: createMiniPin(isCovered ? '#059669' : '#e11d48', '📍 Tu Entrega')
      }).addTo(map);

      // Dotted Line connecting Sede and Customer
      L.polyline([sedeCoords, customerCoords], {
        color: isCovered ? '#059669' : '#e11d48',
        weight: 3.5,
        dashArray: '6, 6',
        opacity: 0.9
      }).addTo(map);

      // Fit bounds to show both points nicely
      const bounds = L.latLngBounds([sedeCoords, customerCoords]);
      map.fitBounds(bounds, { padding: [30, 30] });

      miniMapInstanceRef.current = map;

      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    }

    return () => {
      if (miniMapInstanceRef.current) {
        miniMapInstanceRef.current.remove();
        miniMapInstanceRef.current = null;
      }
    };
  }, [sedeCoords, customerCoords, isCovered]);

  // 2. Initialize Full-Screen Interactive Modal Map when modal opens
  useEffect(() => {
    if (!isModalOpen || !modalMapContainerRef.current) return;
    if (!sedeCoords?.[0] || !customerCoords?.[0]) return;

    const timer = setTimeout(() => {
      if (!modalMapContainerRef.current) return;

      const map = L.map(modalMapContainerRef.current, {
        zoomControl: true,
        attributionControl: false,
        dragging: true,
        touchZoom: true,
        scrollWheelZoom: true,
        doubleClickZoom: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      // Sede Marker
      const sedeMarker = L.marker(sedeCoords, {
        icon: createMiniPin('#2f4131', '🏪 Restaurante')
      }).addTo(map);
      sedeMarker.bindPopup('<b>Punto de Despacho</b><br>Cocina / Restaurante');

      // Customer Marker
      const custMarker = L.marker(customerCoords, {
        icon: createMiniPin(isCovered ? '#059669' : '#e11d48', '📍 Tu Entrega')
      }).addTo(map);
      custMarker.bindPopup('<b>Dirección de Entrega</b><br>Ubicación de tu pedido');

      // Dotted Line
      L.polyline([sedeCoords, customerCoords], {
        color: isCovered ? '#059669' : '#e11d48',
        weight: 4,
        dashArray: '8, 8',
        opacity: 0.9
      }).addTo(map);

      // Coverage Circle
      if (radiusKm) {
        L.circle(sedeCoords, {
          radius: radiusKm * 1000,
          color: '#059669',
          weight: 2,
          fillColor: '#10b981',
          fillOpacity: 0.12,
          dashArray: '6, 6'
        }).addTo(map);
      }

      const bounds = L.latLngBounds([sedeCoords, customerCoords]);
      map.fitBounds(bounds, { padding: [50, 50] });

      modalMapInstanceRef.current = map;
      map.invalidateSize();
    }, 150);

    return () => {
      clearTimeout(timer);
      if (modalMapInstanceRef.current) {
        modalMapInstanceRef.current.remove();
        modalMapInstanceRef.current = null;
      }
    };
  }, [isModalOpen, sedeCoords, customerCoords, isCovered, radiusKm]);

  return (
    <>
      {/* Compact Mini Map Card */}
      <div className="relative rounded-2xl overflow-hidden border border-gray-200/90 shadow-xs h-40 bg-gray-100">
        <div ref={miniMapContainerRef} className="w-full h-full" />
        
        {/* Distance Pill */}
        {distanceKm !== null && (
          <div className={`absolute top-2.5 left-2.5 z-[400] px-2.5 py-1 rounded-xl text-[11px] font-extrabold shadow-sm border ${
            isCovered ? 'bg-white/95 text-emerald-800 border-emerald-200' : 'bg-white/95 text-rose-700 border-rose-200'
          }`}>
            Distancia: {distanceKm} km
          </div>
        )}

        {/* Expand / Zoom Button */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="absolute bottom-2.5 right-2.5 z-[400] px-3 py-1.5 rounded-xl bg-white/95 hover:bg-white text-gray-800 hover:text-black text-xs font-bold shadow-md border border-gray-200 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
        >
          <Icon icon="solar:magnifer-zoom-in-bold" className="text-emerald-700 text-sm" />
          <span>Ampliar mapa</span>
        </button>
      </div>

      {/* Full-Screen Interactive Detail Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-gray-100 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isCovered ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}>
                  <Icon icon="solar:routing-2-bold" className="text-xl" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 leading-tight">
                    Detalle de Ruta y Cobertura
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {distanceKm !== null ? `Aprox. ${distanceKm} km de la sede` : 'Verificando distancia'} • {isCovered ? 'Dentro de cobertura' : 'Fuera del radio permitido'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-9 h-9 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors"
              >
                <Icon icon="solar:close-circle-bold" className="text-2xl" />
              </button>
            </div>

            {/* Interactive Leaflet Map Container */}
            <div className="relative flex-1 min-h-[380px] sm:min-h-[460px] w-full bg-gray-100">
              <div ref={modalMapContainerRef} className="w-full h-full" />
              
              {/* Instructions Badge */}
              <div className="absolute top-3 left-14 z-[400] bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-gray-200 shadow-sm text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <Icon icon="solar:cursor-square-bold" className="text-emerald-700" />
                <span>Usa dos dedos o la rueda para hacer zoom</span>
              </div>
            </div>

            {/* Modal Footer with Legend */}
            <div className="px-5 sm:px-6 py-3.5 border-t border-gray-100 bg-gray-50/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-4 text-xs font-semibold text-gray-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-[#2f4131] inline-block" /> Restaurante
                </span>
                <span className="flex items-center gap-1.5">
                  <span className={`w-3 h-3 rounded-md inline-block ${isCovered ? 'bg-emerald-600' : 'bg-rose-600'}`} /> Tu Entrega
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full border-2 border-emerald-500 bg-emerald-100 inline-block" /> Radio ({radiusKm} km)
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-[#2f4131] hover:bg-[#253527] text-white text-xs font-bold transition-all shadow-sm"
              >
                Listo, volver al pedido
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
