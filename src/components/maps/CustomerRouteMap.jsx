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
        cursor: grab;
      ">
        <span>${text}</span>
      </div>
    `,
    iconSize: [96, 26],
    iconAnchor: [48, 26]
  });
};

export default function CustomerRouteMap({
  sedeCoords,     // [lat, lng]
  customerCoords, // [lat, lng]
  isCovered = true,
  radiusKm = 5,
  distanceKm = null,
  onCoordsChange = null,
  externalModalOpen = false,
  onExternalModalClose = null
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (externalModalOpen) {
      setIsModalOpen(true);
    }
  }, [externalModalOpen]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (typeof onExternalModalClose === 'function') {
      onExternalModalClose();
    }
  };

  // References for mini preview map
  const miniMapContainerRef = useRef(null);
  const miniMapInstanceRef = useRef(null);

  // References for full modal map
  const modalMapContainerRef = useRef(null);
  const modalMapInstanceRef = useRef(null);

  const effectiveSede = sedeCoords?.[0] ? sedeCoords : [5.0224, -74.0018];
  const effectiveCustomer = customerCoords?.[0] ? customerCoords : effectiveSede;

  // 1. Initialize Mini Preview Map (with click & drag pin support)
  useEffect(() => {
    if (!miniMapContainerRef.current) return;
    if (!effectiveCustomer?.[0]) return;

    if (miniMapInstanceRef.current) {
      miniMapInstanceRef.current.remove();
      miniMapInstanceRef.current = null;
    }

    const map = L.map(miniMapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      touchZoom: true,
      scrollWheelZoom: false,
      doubleClickZoom: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    if (sedeCoords?.[0]) {
      L.marker(sedeCoords, {
        icon: createMiniPin('#2f4131', '🏪 Restaurante')
      }).addTo(map);
    }

    const custMarker = L.marker(effectiveCustomer, {
      draggable: Boolean(onCoordsChange),
      icon: createMiniPin(isCovered ? '#059669' : '#e11d48', '📍 Tu Entrega')
    }).addTo(map);

    const line = sedeCoords?.[0]
      ? L.polyline([sedeCoords, effectiveCustomer], {
          color: isCovered ? '#059669' : '#e11d48',
          weight: 3.5,
          dashArray: '6, 6',
          opacity: 0.9
        }).addTo(map)
      : null;

    if (onCoordsChange) {
      custMarker.on('dragend', () => {
        const pos = custMarker.getLatLng();
        if (line && sedeCoords?.[0]) line.setLatLngs([sedeCoords, [pos.lat, pos.lng]]);
        onCoordsChange({ lat: pos.lat, lng: pos.lng });
      });

      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        custMarker.setLatLng([lat, lng]);
        if (line && sedeCoords?.[0]) line.setLatLngs([sedeCoords, [lat, lng]]);
        onCoordsChange({ lat, lng });
      });
    }

    if (sedeCoords?.[0] && customerCoords?.[0] && (sedeCoords[0] !== customerCoords[0] || sedeCoords[1] !== customerCoords[1])) {
      const bounds = L.latLngBounds([sedeCoords, customerCoords]);
      map.fitBounds(bounds, { padding: [30, 30] });
    } else {
      map.setView(effectiveCustomer, 15);
    }

    miniMapInstanceRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      if (miniMapInstanceRef.current) {
        miniMapInstanceRef.current.remove();
        miniMapInstanceRef.current = null;
      }
    };
  }, [sedeCoords?.[0], sedeCoords?.[1], customerCoords?.[0], customerCoords?.[1], isCovered]);

  // 2. Initialize Full-Screen Interactive Modal Map with Draggable Pin & Map Click
  useEffect(() => {
    if (!isModalOpen) return;

    let map = null;
    let resizeObserver = null;

    const timer = setTimeout(() => {
      if (!modalMapContainerRef.current) return;

      if (modalMapInstanceRef.current) {
        modalMapInstanceRef.current.remove();
        modalMapInstanceRef.current = null;
      }

      map = L.map(modalMapContainerRef.current, {
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

      if (sedeCoords?.[0]) {
        const sedeMarker = L.marker(sedeCoords, {
          icon: createMiniPin('#2f4131', '🏪 Restaurante')
        }).addTo(map);
        sedeMarker.bindPopup('<b>Punto de Despacho</b><br>Cocina / Restaurante');
      }

      const custMarker = L.marker(effectiveCustomer, {
        draggable: true,
        icon: createMiniPin(isCovered ? '#059669' : '#e11d48', '📍 Arrastra o Toca')
      }).addTo(map);
      custMarker.bindPopup('<b>Punto Exacto de Entrega</b><br>Arrastra este pin o toca tu casa en el mapa');

      const line = sedeCoords?.[0]
        ? L.polyline([sedeCoords, effectiveCustomer], {
            color: isCovered ? '#059669' : '#e11d48',
            weight: 4,
            dashArray: '8, 8',
            opacity: 0.9
          }).addTo(map)
        : null;

      if (radiusKm && sedeCoords?.[0]) {
        L.circle(sedeCoords, {
          radius: radiusKm * 1000,
          color: '#059669',
          weight: 2,
          fillColor: '#10b981',
          fillOpacity: 0.12,
          dashArray: '6, 6'
        }).addTo(map);
      }

      if (onCoordsChange) {
        custMarker.on('dragend', () => {
          const pos = custMarker.getLatLng();
          if (line && sedeCoords?.[0]) line.setLatLngs([sedeCoords, [pos.lat, pos.lng]]);
          onCoordsChange({ lat: pos.lat, lng: pos.lng });
        });

        map.on('click', (e) => {
          const { lat, lng } = e.latlng;
          custMarker.setLatLng([lat, lng]);
          if (line && sedeCoords?.[0]) line.setLatLngs([sedeCoords, [lat, lng]]);
          onCoordsChange({ lat, lng });
        });
      }

      if (sedeCoords?.[0] && customerCoords?.[0] && (sedeCoords[0] !== customerCoords[0] || sedeCoords[1] !== customerCoords[1])) {
        const bounds = L.latLngBounds([sedeCoords, customerCoords]);
        map.fitBounds(bounds, { padding: [50, 50] });
      } else {
        map.setView(effectiveCustomer, 16);
      }

      modalMapInstanceRef.current = map;

      if (window.ResizeObserver && modalMapContainerRef.current) {
        resizeObserver = new ResizeObserver(() => {
          if (map) {
            map.invalidateSize();
          }
        });
        resizeObserver.observe(modalMapContainerRef.current);
      }

      map.invalidateSize();
      setTimeout(() => map && map.invalidateSize(), 150);
      setTimeout(() => map && map.invalidateSize(), 400);
    }, 100);

    return () => {
      clearTimeout(timer);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (modalMapInstanceRef.current) {
        modalMapInstanceRef.current.remove();
        modalMapInstanceRef.current = null;
      }
    };
  }, [isModalOpen, sedeCoords?.[0], sedeCoords?.[1], customerCoords?.[0], customerCoords?.[1], isCovered, radiusKm]);

  return (
    <>
      {/* Compact Mini Map Card */}
      {customerCoords?.[0] && (
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

          {/* Expand / Pin Button */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="absolute bottom-2.5 right-2.5 z-[400] px-3 py-1.5 rounded-xl bg-white/95 hover:bg-white text-gray-800 hover:text-black text-xs font-bold shadow-md border border-gray-200 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <Icon icon="solar:map-point-wave-bold" className="text-emerald-700 text-sm" />
            <span>Mover Pin Exacto en Mapa</span>
          </button>
        </div>
      )}

      {/* Full-Screen Interactive Detail Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[10000] bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-100">
            {/* Modal Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isCovered ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}>
                  <Icon icon="solar:map-point-wave-bold" className="text-xl" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 leading-tight">
                    Fijar Punto Exacto para el Domiciliario
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Toca tu calle/casa en el mapa o arrastra el pin verde • {distanceKm !== null ? `${distanceKm} km de la sede` : 'Ubicación GPS'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="w-9 h-9 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                <Icon icon="solar:close-circle-bold" className="text-2xl" />
              </button>
            </div>

            {/* Interactive Leaflet Map Container with EXPLICIT pixel height */}
            <div className="relative w-full bg-gray-100" style={{ height: '420px', minHeight: '420px' }}>
              <div ref={modalMapContainerRef} style={{ width: '100%', height: '100%' }} className="z-0" />

              {/* Instructions Badge */}
              <div className="absolute top-3 left-14 right-3 z-[400] bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-emerald-200 shadow-sm text-xs font-bold text-emerald-900 flex items-center gap-1.5 w-fit">
                <Icon icon="solar:cursor-square-bold" className="text-emerald-700 shrink-0" />
                <span>Toca exactamente donde quieres recibir el pedido o arrastra el pin</span>
              </div>
            </div>

            {/* Modal Footer with Legend */}
            <div className="px-5 sm:px-6 py-3.5 border-t border-gray-100 bg-gray-50/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-4 text-xs font-semibold text-gray-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-[#2f4131] inline-block" /> Restaurante
                </span>
                <span className="flex items-center gap-1.5">
                  <span className={`w-3 h-3 rounded-md inline-block ${isCovered ? 'bg-emerald-600' : 'bg-rose-600'}`} /> Punto de Entrega
                </span>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all shadow-sm cursor-pointer"
              >
                ✓ Confirmar este Punto en el Mapa
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
