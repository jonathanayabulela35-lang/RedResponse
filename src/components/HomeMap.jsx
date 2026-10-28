import React, { useEffect, useRef } from 'react';

const responsePoints = [
  { point: [-26.195, 28.035], label: 'Medical response', detail: 'Illustrative unit location', kind: 'medical' },
  { point: [-26.178, 28.055], label: 'Fire & rescue', detail: 'Illustrative station', kind: 'fire' },
  { point: [-26.207, 28.018], label: 'Road response', detail: 'Illustrative response point', kind: 'road' },
];

function makeMarker(kind, L) {
  const colour = kind === 'fire' ? '#d97706' : kind === 'road' ? '#475569' : '#c62828';
  return L.divIcon({
    className: 'rr-leaflet-marker-wrap',
    html: `<span class="rr-leaflet-marker" style="--marker-colour:${colour}"><span></span></span>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

export default function HomeMap() {
  const mapElement = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!mapElement.current || mapRef.current) return;
    let cancelled = false;
    let map;
    const cssId = 'rr-leaflet-css';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId; link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    const initMap = () => {
      if (cancelled || !mapElement.current || !window.L) return;
      const L = window.L;
      map = L.map(mapElement.current, { zoomControl: true, scrollWheelZoom: false, attributionControl: true }).setView([-26.195, 28.035], 13);
      mapRef.current = map;
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
      }).addTo(map);
      responsePoints.forEach((item) => {
        L.marker(item.point, { icon: makeMarker(item.kind, L) })
          .bindPopup(`<strong>${item.label}</strong><br/><span>${item.detail}</span>`)
          .addTo(map);
      });
    // Ask the public OSRM routing service for a road-following driving route.
    // Never draw a straight-line substitute if routing is unavailable.
      const start = responsePoints[0].point;
      const destination = responsePoints[1].point;
      const routeUrl = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${destination[1]},${destination[0]}?overview=full&geometries=geojson&steps=false`;
      const routeController = new AbortController();
      fetch(routeUrl, { signal: routeController.signal })
        .then((response) => { if (!response.ok) throw new Error('Routing request failed'); return response.json(); })
        .then((result) => {
          const coordinates = result?.routes?.[0]?.geometry?.coordinates;
          if (!coordinates?.length || !mapRef.current) return;
          L.geoJSON({ type: 'LineString', coordinates }, {
            style: { color: '#ffffff', weight: 8, opacity: 0.95, lineCap: 'round', lineJoin: 'round' },
          }).addTo(map);
          L.geoJSON({ type: 'LineString', coordinates }, {
            style: { color: '#c62828', weight: 4, opacity: 0.95, lineCap: 'round', lineJoin: 'round' },
          }).addTo(map);
        })
        .catch(() => { /* Keep the map free of misleading straight-line routes. */ });
      const resize = () => map.invalidateSize();
      window.addEventListener('resize', resize);
      const timer = window.setTimeout(resize, 150);
      return { timer, resize, routeController };
    };
    let cleanupMap = null;
    const existingScript = document.querySelector('script[data-rr-leaflet]');
    if (window.L) { cleanupMap = initMap(); }
    else if (existingScript) { existingScript.addEventListener('load', () => { if (!cancelled) cleanupMap = initMap(); }, { once: true }); }
    else {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true; script.dataset.rrLeaflet = 'true';
      script.onload = () => { if (!cancelled) cleanupMap = initMap(); };
      document.head.appendChild(script);
    }
    return () => {
      cancelled = true;
      if (cleanupMap) {
        cleanupMap.routeController.abort();
        window.clearTimeout(cleanupMap.timer);
        window.removeEventListener('resize', cleanupMap.resize);
      }
      if (map) map.remove();
      mapRef.current = null;
    };
  }, []);

  return <div className="rr-home-map-shell">
    <div className="rr-home-map" ref={mapElement} aria-label="Illustrative map showing emergency response points in Johannesburg" />
    <div className="rr-map-disclaimer"><span className="rr-map-disclaimer-dot" /> Illustrative map · Locations are not live responder positions</div>
  </div>;
}
