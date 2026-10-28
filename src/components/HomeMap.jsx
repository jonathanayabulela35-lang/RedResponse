import React, { useEffect, useRef } from 'react';

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
const responsePoints = [
  { point: [-26.195, 28.035], label: 'Medical response', detail: 'Illustrative response point' },
  { point: [-26.178, 28.055], label: 'Fire and rescue', detail: 'Illustrative station' },
  { point: [-26.207, 28.018], label: 'Road response', detail: 'Illustrative response point' },
];

function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  if (window.__redresponseLeafletPromise) return window.__redresponseLeafletPromise;
  window.__redresponseLeafletPromise = new Promise((resolve, reject) => {
    let css = document.querySelector('link[data-redresponse-leaflet]');
    if (!css) {
      css = document.createElement('link'); css.rel = 'stylesheet'; css.href = LEAFLET_CSS; css.dataset.redresponseLeaflet = 'true'; document.head.appendChild(css);
    }
    let script = document.querySelector('script[data-redresponse-leaflet]');
    if (script) {
      script.addEventListener('load', () => resolve(window.L), { once: true });
      script.addEventListener('error', reject, { once: true });
      return;
    }
    script = document.createElement('script'); script.src = LEAFLET_JS; script.async = true; script.dataset.redresponseLeaflet = 'true';
    script.onload = () => window.L ? resolve(window.L) : reject(new Error('Map library did not initialise'));
    script.onerror = () => reject(new Error('Map library could not be loaded'));
    document.head.appendChild(script);
  });
  return window.__redresponseLeafletPromise;
}

export default function HomeMap() {
  const mapElement = useRef(null);
  const mapRef = useRef(null);
  useEffect(() => {
    let cancelled = false;
    let map;
    let routeController;
    loadLeaflet().then((L) => {
      if (cancelled || !mapElement.current) return;
      map = L.map(mapElement.current, { zoomControl: true, scrollWheelZoom: false, attributionControl: true }).setView([-26.195, 28.035], 13);
      mapRef.current = map;
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
      }).addTo(map);
      const markerIcon = L.divIcon({ className: 'rr-leaflet-marker-wrap', html: '<span class="rr-leaflet-marker" style="--marker-colour:#c62828"><span></span></span>', iconSize: [24, 24], iconAnchor: [12, 12] });
      responsePoints.forEach((item) => L.marker(item.point, { icon: markerIcon }).bindPopup(`<strong>${item.label}</strong><br/><span>${item.detail}</span>`).addTo(map));
      const [origin, destination] = [responsePoints[0].point, responsePoints[1].point];
      const coordinates = `${origin[1]},${origin[0]};${destination[1]},${destination[0]}`;
      routeController = new AbortController();
      fetch(`https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=false`, { signal: routeController.signal })
        .then((response) => { if (!response.ok) throw new Error('Road route unavailable'); return response.json(); })
        .then((result) => {
          const route = result?.routes?.[0]?.geometry?.coordinates;
          if (!route?.length || cancelled || !mapRef.current) return;
          L.polyline(route.map(([lng, lat]) => [lat, lng]), { color: '#c62828', weight: 4, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }).addTo(map);
        }).catch(() => { /* No straight-line fallback: avoid a misleading vehicle route. */ });
      window.setTimeout(() => map?.invalidateSize(), 150);
    }).catch(() => { if (!cancelled && mapElement.current) mapElement.current.setAttribute('data-map-unavailable', 'true'); });
    const resize = () => map?.invalidateSize();
    window.addEventListener('resize', resize);
    return () => { cancelled = true; routeController?.abort(); window.removeEventListener('resize', resize); if (map) map.remove(); mapRef.current = null; };
  }, []);
  return <div className="rr-home-map-shell"><div className="rr-home-map" ref={mapElement} aria-label="Map showing illustrative emergency response points in Johannesburg" /></div>;
}
