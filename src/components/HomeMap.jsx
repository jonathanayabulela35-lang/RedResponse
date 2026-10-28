import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const responsePoints = [
  { point: [-26.195, 28.035], label: 'Medical response', detail: 'Illustrative unit location', kind: 'medical' },
  { point: [-26.178, 28.055], label: 'Fire & rescue', detail: 'Illustrative station', kind: 'fire' },
  { point: [-26.207, 28.018], label: 'Road response', detail: 'Illustrative response point', kind: 'road' },
];

function makeMarker(kind) {
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
    const map = L.map(mapElement.current, { zoomControl: true, scrollWheelZoom: false, attributionControl: true }).setView([-26.195, 28.035], 13);
    mapRef.current = map;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
    }).addTo(map);

    responsePoints.forEach((item) => {
      L.marker(item.point, { icon: makeMarker(item.kind) })
        .bindPopup(`<strong>${item.label}</strong><br/><span>${item.detail}</span>`)
        .addTo(map);
    });
    L.polyline([responsePoints[0].point, [-26.188, 28.046], responsePoints[1].point], {
      color: '#c62828', weight: 4, opacity: 0.85, dashArray: '7 8', lineCap: 'round',
    }).addTo(map);
    const resize = () => map.invalidateSize();
    window.addEventListener('resize', resize);
    const timer = window.setTimeout(resize, 150);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', resize);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return <div className="rr-home-map-shell">
    <div className="rr-home-map" ref={mapElement} aria-label="Illustrative map showing emergency response points in Johannesburg" />
    <div className="rr-map-disclaimer"><span className="rr-map-disclaimer-dot" /> Illustrative map · Locations are not live responder positions</div>
  </div>;
}
