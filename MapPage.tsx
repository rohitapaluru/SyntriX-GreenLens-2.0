import React, { useEffect, useRef, useState } from 'react';
import type { Report } from './types';

declare const L: any; // Leaflet is loaded via index.html <script>; satisfy TypeScript

type WasteItem = {
  id: string;
  lat: number;
  lng: number;
  type: string;
  description?: string;
  imageUrl?: string;
  distanceMeters?: number;
};

function metersToLatLngOffset(meters: number) {
  // approximate conversions
  const latOffset = meters / 111320; // ~ meters per degree latitude
  const lngOffset = meters / (111320 * Math.cos(0)); // will adjust per-lat later when used
  return { latOffset, lngOffset };
}

function randomNearby(lat: number, lng: number, maxMeters = 500, count = 8): WasteItem[] {
  const items: WasteItem[] = [];
  for (let i = 0; i < count; i++) {
    const r = Math.random() * maxMeters;
    const bearing = Math.random() * Math.PI * 2;
    // rough meters -> degrees
    const latDelta = (r * Math.cos(bearing)) / 111320;
    const lngDelta = (r * Math.sin(bearing)) / (111320 * Math.cos(lat * (Math.PI / 180)));
    items.push({
      id: `w-${Date.now()}-${i}`,
      lat: lat + latDelta,
      lng: lng + lngDelta,
      type: ['Plastic', 'Glass', 'Metal', 'Organic', 'Other'][Math.floor(Math.random() * 5)],
      description: ['Bottle', 'Bag', 'Can', 'Food waste', 'Mixed debris'][Math.floor(Math.random() * 5)],
      imageUrl: undefined,
      distanceMeters: Math.round(r),
    });
  }
  return items;
}

export default function MapPage() {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const markerLayerRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const watchIdRef = useRef<number | null>(null);
  const [status, setStatus] = useState<string>('Waiting for location...');
  const [wasteItems, setWasteItems] = useState<WasteItem[]>([]);
  const [zoomToUser, setZoomToUser] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize map once
    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current, { zoomControl: true }).setView([0, 0], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapRef.current);

      markerLayerRef.current = L.layerGroup().addTo(mapRef.current);
    }

    // Request and watch position
    if (!navigator.geolocation) {
      setStatus('Geolocation not supported by your browser.');
      return;
    }

    setStatus('Requesting location...');
    const success = (pos: GeolocationPosition) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setStatus('Location acquired');

      // center or pan map
      if (zoomToUser) {
        mapRef.current.setView([lat, lng], 15);
      } else {
        mapRef.current.panTo([lat, lng]);
      }

      // create or move user marker
      if (!userMarkerRef.current) {
        userMarkerRef.current = L.marker([lat, lng], {
          title: 'You',
          riseOnHover: true,
        }).addTo(mapRef.current);
        userMarkerRef.current.bindPopup('<strong>You are here</strong>');
      } else {
        userMarkerRef.current.setLatLng([lat, lng]);
      }

      // generate nearby waste items (mock) and add to map
      const generated = randomNearby(lat, lng, 700, 10);
      setWasteItems(generated);

      // update marker layer
      markerLayerRef.current.clearLayers();
      generated.forEach(item => {
        // use emoji icon for quick visualization
        const emoji = item.type === 'Plastic' ? '🧴'
          : item.type === 'Glass' ? '🍾'
          : item.type === 'Metal' ? '🥫'
          : item.type === 'Organic' ? '🍌'
          : '🗑️';

        const icon = L.divIcon({
          className: 'waste-marker',
          html: `<div style="font-size:20px;text-align:center">${emoji}</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 28],
        });

        const m = L.marker([item.lat, item.lng], { icon }).addTo(markerLayerRef.current);
        const popupHtml = `
          <div style="max-width:220px">
            <strong>${item.description || item.type}</strong><br/>
            <small>${item.type} • ${item.distanceMeters ?? '—'} m away</small>
            ${item.imageUrl ? `<div style="margin-top:6px"><img src="${item.imageUrl}" style="width:100%;border-radius:6px" /></div>` : ''}
          </div>
        `;
        m.bindPopup(popupHtml);
      });
    };

    const error = (err: GeolocationPositionError) => {
      setStatus(`Unable to get location: ${err.message}`);
    };

    // start watching position for live updates
    const id = navigator.geolocation.watchPosition(success, error, {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 15000,
    });
    watchIdRef.current = id;

    return () => {
      // cleanup
      if (watchIdRef.current !== null && navigator.geolocation.clearWatch) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoomToUser]);

  // allow adding user's submitted reports as markers
  const addReportMarkers = (reports: Report[] | undefined) => {
    if (!reports || !markerLayerRef.current) return;
    reports.forEach(r => {
      if (!r.location) return;
      const icon = L.divIcon({
        className: 'report-marker',
        html: `<div style="font-size:18px">📷</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      });
      const m = L.marker([r.location.lat, r.location.lng], { icon }).addTo(markerLayerRef.current);
      const popupHtml = `<div><strong>${r.description ?? 'Report'}</strong><br/><small>${r.wasteType ?? ''}</small>
        ${r.imageUrl ? `<div style="margin-top:6px"><img src="${r.imageUrl}" style="width:160px;border-radius:6px" /></div>` : ''}</div>`;
      m.bindPopup(popupHtml);
    });
  };

  // optionally expose a small control / legend
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Live Map</h2>
        <div className="flex items-center gap-3">
          <button
            className="px-3 py-1 bg-emerald-600 text-white rounded"
            onClick={() => setZoomToUser(z => !z)}
          >
            {zoomToUser ? 'Pan (stay zoomed)' : 'Auto-zoom to me'}
          </button>
          <div className="text-sm text-slate-500">{status}</div>
        </div>
      </div>

      <div ref={containerRef} id="map" style={{ height: 560, borderRadius: 8, overflow: 'hidden' }} />

      <div className="text-sm text-slate-600">
        Legend: 🧴 Plastic • 🍾 Glass • 🥫 Metal • 🍌 Organic • 🗑️ Other • 📷 your reports
      </div>
    </div>
  );
}