import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ChevronRight, Crosshair, MapPin, Navigation, RefreshCw, ShieldCheck } from 'lucide-react';
import { IconBadge, StatusPill, Priority } from '../components/operations/OperationalComponents.jsx';

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  return new Promise((resolve, reject) => {
    let css = document.querySelector('link[data-redresponse-leaflet]');
    if (!css) {
      css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = LEAFLET_CSS;
      css.dataset.redresponseLeaflet = 'true';
      document.head.appendChild(css);
    }
    const existing = document.querySelector('script[data-redresponse-leaflet]');
    if (existing) {
      existing.addEventListener('load', () => window.L ? resolve(window.L) : reject(new Error('Map library could not be loaded.')),{once:true});
      existing.addEventListener('error', () => reject(new Error('Map library could not be loaded.')),{once:true});
      if (window.L) resolve(window.L);
      return;
    }
    const script = document.createElement('script');
    script.src = LEAFLET_JS;
    script.async = true;
    script.dataset.redresponseLeaflet = 'true';
    script.onload = () => window.L ? resolve(window.L) : reject(new Error('Map library could not be loaded.'));
    script.onerror = () => reject(new Error('Map library could not be loaded.'));
    document.head.appendChild(script);
  });
}

export default function LiveMapPage({ incidents = [], units = [], setSelected, go }) {
  const mapElement = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const accuracyRef = useRef(null);
  const watchRef = useRef(null);
  const [position, setPosition] = useState(null);
  const [locationStatus, setLocationStatus] = useState('Requesting dispatch device location…');
  const [mapError, setMapError] = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);
  const active = incidents.filter(i => !['Resolved', 'Closed'].includes(i.status));

  useEffect(() => {
    let cancelled = false;
    let leafletMap;
    let leaflet;
    const start = async () => {
      try {
        leaflet = await loadLeaflet();
        if (cancelled || !mapElement.current) return;
        leafletMap = leaflet.map(mapElement.current, { zoomControl: true }).setView([-29, 24], 5);
        mapRef.current = leafletMap;
        leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
        }).addTo(leafletMap);
        if (!navigator.geolocation) {
          setLocationStatus('Location is not supported by this browser.');
          setMapError('Enable a supported browser location source to centre the map on dispatch.');
          return;
        }
        watchRef.current = navigator.geolocation.watchPosition((result) => {
          if (cancelled || !mapRef.current) return;
          const { latitude, longitude, accuracy } = result.coords;
          const next = { lat: latitude, lon: longitude, accuracy: Math.round(accuracy || 0) };
          setPosition(next);
          setLastUpdate(new Date());
          setLocationStatus('Dispatch location updating');
          setMapError('');
          const point = [latitude, longitude];
          if (!markerRef.current) {
            markerRef.current = leaflet.marker(point, {
              title: 'Dispatch device location',
              icon: leaflet.divIcon({ className: 'rr-dispatch-marker-wrap', html: '<span class="rr-dispatch-marker"><span></span></span>', iconSize: [26, 26], iconAnchor: [13, 13] })
            }).addTo(mapRef.current).bindPopup('<strong>Dispatch location</strong><br/>Current device position');
            accuracyRef.current = leaflet.circle(point, { radius: Math.max(accuracy || 0, 15), color: '#d92d20', weight: 1, fillColor: '#d92d20', fillOpacity: 0.09 }).addTo(mapRef.current);
            mapRef.current.setView(point, 16);
          } else {
            markerRef.current.setLatLng(point);
            accuracyRef.current.setLatLng(point).setRadius(Math.max(accuracy || 0, 15));
          }
        }, (error) => {
          if (cancelled) return;
          const message = error.code === 1
            ? 'Location permission was denied. Allow location access in your browser to show dispatch here.'
            : error.code === 2
              ? 'The device location is currently unavailable. Check device location services and try again.'
              : 'The device location request timed out. Try locating dispatch again.';
          setLocationStatus('Waiting for dispatch location');
          setMapError(message);
        }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 });
      } catch {
        if (!cancelled) {
          setLocationStatus('Map could not be loaded');
          setMapError('The map service could not be reached. Check your internet connection and reload this page.');
        }
      }
    };
    start();
    return () => {
      cancelled = true;
      if (watchRef.current !== null && navigator.geolocation) navigator.geolocation.clearWatch(watchRef.current);
      if (leafletMap) leafletMap.remove();
      mapRef.current = null;
    };
  }, []);

  const locateDispatch = () => {
    if (position && mapRef.current) mapRef.current.setView([position.lat, position.lon], 16, { animate: true });
    else if (navigator.geolocation && watchRef.current === null) {
      setLocationStatus('Requesting dispatch device location…');
      setMapError('Reload the page to restart the location request.');
    }
  };

  return <>
    <div className="page-heading">
      <div>
        <div className="eyebrow">DISPATCH OPERATIONS</div>
        <h1>Live map</h1>
        <p>The map opens on the dispatch device’s current location and follows it while this page is open.</p>
      </div>
      <button className="btn btn-secondary" onClick={locateDispatch}><Crosshair size={15}/> Locate dispatch</button>
    </div>

    <div className="rr-live-map-layout">
      <section className="panel rr-live-map-panel">
        <div className="rr-live-map-toolbar">
          <div className="rr-live-map-status"><span className={`rr-map-status-dot ${position ? 'is-located' : ''}`}/><div><strong>{position ? 'Dispatch location' : 'Finding dispatch location'}</strong><span>{locationStatus}</span></div></div>
          <div className="rr-live-map-meta">{position ? `Accuracy ±${position.accuracy} m` : 'Device location required'}</div>
        </div>
        <div className="rr-live-map-canvas" ref={mapElement} aria-label="Live map showing the dispatch device location" />
        {mapError && <div className="rr-map-message"><AlertTriangle size={17}/><span>{mapError}</span></div>}
        <div className="rr-live-map-footer"><span><span className="rr-map-legend-dot"/> Dispatch device</span><span>{lastUpdate ? `Last location update ${lastUpdate.toLocaleTimeString('en-ZA', {hour:'2-digit', minute:'2-digit', second:'2-digit'})}` : 'Waiting for a location fix'}</span></div>
      </section>

      <aside className="panel rr-live-map-side">
        <div className="panel-header"><div><h2>Active incidents</h2><p>{active.length} open incident{active.length === 1 ? '' : 's'} in this organisation</p></div><span className="rr-map-count">{active.length}</span></div>
        {active.length ? <div className="rr-live-incident-list">{active.map(i => <button className="rr-live-incident" key={i.id} onClick={() => { setSelected?.(i.id); go?.('Live incidents'); }}><IconBadge category={i.category}/><span className="rr-live-incident-copy"><strong>{i.id} · {i.type}</strong><small>{i.address || 'Address not recorded'}</small><span className="rr-live-incident-tags"><Priority value={i.priority}/><StatusPill status={i.status}/></span></span><ChevronRight size={15}/></button>)}</div> : <div className="empty-state rr-live-map-empty"><MapPin size={23}/><strong>No active incidents</strong><span>New incidents will appear here as they are recorded.</span></div>}
        <div className="rr-live-map-side-note"><ShieldCheck size={16}/><span>Only the dispatch device location is shown live here. Responder unit tracking will appear when units send validated GPS coordinates.</span></div>
      </aside>
    </div>
  </>;
}
