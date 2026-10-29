import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ChevronRight, Crosshair, MapPin, Navigation, Plus, ShieldCheck, X, LoaderCircle } from 'lucide-react';
import { IconBadge, StatusPill, Priority } from '../components/operations/OperationalComponents.jsx';
import { supabase } from '../lib/supabaseClient.js';

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  return new Promise((resolve, reject) => {
    let css = document.querySelector('link[data-redresponse-leaflet]');
    if (!css) { css = document.createElement('link'); css.rel = 'stylesheet'; css.href = LEAFLET_CSS; css.dataset.redresponseLeaflet = 'true'; document.head.appendChild(css); }
    const existing = document.querySelector('script[data-redresponse-leaflet]');
    if (existing) {
      existing.addEventListener('load', () => window.L ? resolve(window.L) : reject(new Error('Map library could not be loaded.')), { once: true });
      existing.addEventListener('error', () => reject(new Error('Map library could not be loaded.')), { once: true });
      if (window.L) resolve(window.L);
      return;
    }
    const script = document.createElement('script'); script.src = LEAFLET_JS; script.async = true; script.dataset.redresponseLeaflet = 'true';
    script.onload = () => window.L ? resolve(window.L) : reject(new Error('Map library could not be loaded.'));
    script.onerror = () => reject(new Error('Map library could not be loaded.'));
    document.head.appendChild(script);
  });
}

const serviceType = { medical: 'Medical emergency', fire_rescue: 'Fire / smoke', police: 'Public safety', road_response: 'Road collision' };
const km = metres => metres >= 1000 ? `${(metres / 1000).toFixed(1)} km` : `${Math.round(metres)} m`;

export default function LiveMapPage({ incidents = [], units = [], setSelected, go, organization, setIncidents, notify }) {
  const mapElement = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const accuracyRef = useRef(null);
  const watchRef = useRef(null);
  const destinationMarkerRef = useRef(null);
  const routeRef = useRef(null);
  const [position, setPosition] = useState(null);
  const [locationStatus, setLocationStatus] = useState('Requesting dispatch device location…');
  const [mapError, setMapError] = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [streetAddress, setStreetAddress] = useState('');
  const [block, setBlock] = useState('');
  const [floor, setFloor] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [details, setDetails] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [routeSummary, setRouteSummary] = useState('');
  const active = incidents.filter(i => !['Resolved', 'Closed'].includes(i.status));

  useEffect(() => {
    let cancelled = false;
    let leafletMap;
    const start = async () => {
      try {
        const leaflet = await loadLeaflet();
        if (cancelled || !mapElement.current) return;
        leafletMap = leaflet.map(mapElement.current, { zoomControl: true }).setView([-29, 24], 5);
        mapRef.current = leafletMap;
        leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors' }).addTo(leafletMap);
        if (!navigator.geolocation) { setLocationStatus('Location is not supported by this browser.'); setMapError('Enable a supported browser location source to centre the map on dispatch.'); return; }
        watchRef.current = navigator.geolocation.watchPosition(result => {
          if (cancelled || !mapRef.current) return;
          const { latitude, longitude, accuracy } = result.coords;
          const next = { lat: latitude, lon: longitude, accuracy: Math.round(accuracy || 0) };
          setPosition(next); setLastUpdate(new Date()); setLocationStatus('Dispatch location updating'); setMapError('');
          const point = [latitude, longitude];
          if (!markerRef.current) {
            markerRef.current = leaflet.marker(point, { title: 'Dispatch device location', icon: leaflet.divIcon({ className: 'rr-dispatch-marker-wrap', html: '<span class="rr-dispatch-marker"><span></span></span>', iconSize: [26, 26], iconAnchor: [13, 13] }) }).addTo(mapRef.current).bindPopup('<strong>Dispatch location</strong><br/>Current device position');
            accuracyRef.current = leaflet.circle(point, { radius: Math.max(accuracy || 0, 15), color: '#d92d20', weight: 1, fillColor: '#d92d20', fillOpacity: 0.09 }).addTo(mapRef.current);
            mapRef.current.setView(point, 16);
          } else { markerRef.current.setLatLng(point); accuracyRef.current.setLatLng(point).setRadius(Math.max(accuracy || 0, 15)); }
        }, error => {
          if (cancelled) return;
          const message = error.code === 1 ? 'Location permission was denied. Allow location access in your browser to show dispatch here.' : error.code === 2 ? 'The device location is currently unavailable. Check device location services and try again.' : 'The device location request timed out. Try locating dispatch again.';
          setLocationStatus('Waiting for dispatch location'); setMapError(message);
        }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 });
      } catch { if (!cancelled) { setLocationStatus('Map could not be loaded'); setMapError('The map service could not be reached. Check your internet connection and reload this page.'); } }
    };
    start();
    return () => { cancelled = true; if (watchRef.current !== null && navigator.geolocation) navigator.geolocation.clearWatch(watchRef.current); if (leafletMap) leafletMap.remove(); mapRef.current = null; };
  }, []);

  const showRoute = async (destination, label) => {
    const leaflet = window.L;
    if (!leaflet || !mapRef.current) return;
    if (destinationMarkerRef.current) destinationMarkerRef.current.remove();
    if (routeRef.current) routeRef.current.remove();
    destinationMarkerRef.current = leaflet.marker([destination.lat, destination.lon], { title: 'Incident location' }).addTo(mapRef.current).bindPopup(`<strong>Incident location</strong><br/>${label.replace(/[&<>"']/g, '')}`);
    setRouteSummary('Calculating road route…');
    if (!position) { mapRef.current.setView([destination.lat, destination.lon], 16); setRouteSummary('Incident location pinned. Allow dispatch location to calculate the route and distance.'); return; }
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${position.lon},${position.lat};${destination.lon},${destination.lat}?overview=full&geometries=geojson`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Route service unavailable');
      const data = await response.json();
      const route = data.routes?.[0];
      if (!route) throw new Error('No road route found');
      routeRef.current = leaflet.geoJSON(route.geometry, { style: { color: '#d92d20', weight: 5, opacity: 0.88 } }).addTo(mapRef.current);
      mapRef.current.fitBounds(routeRef.current.getBounds().pad(0.16));
      setRouteSummary(`Road route ${km(route.distance)} · estimated drive ${Math.max(1, Math.round(route.duration / 60))} min`);
    } catch {
      const straightLine = leaflet.polyline([[position.lat, position.lon], [destination.lat, destination.lon]], { color: '#d92d20', weight: 3, dashArray: '7 8', opacity: 0.8 }).addTo(mapRef.current);
      routeRef.current = straightLine;
      mapRef.current.fitBounds(leaflet.latLngBounds([[position.lat, position.lon], [destination.lat, destination.lon]]).pad(0.18));
      const distance = mapRef.current.distance([position.lat, position.lon], [destination.lat, destination.lon]);
      setRouteSummary(`Direct distance ${km(distance)} · road route could not be loaded, so this line is not a driving route`);
    }
  };

  const createIncident = async event => {
    event.preventDefault(); setFormError('');
    if (!supabase || !organization?.id) { setFormError('The organisation database is not connected.'); return; }
    if (!position) { setFormError('Dispatch location is not available yet. Allow location access before creating an incident so the map can calculate the distance.'); return; }
    const fullAddress = [streetAddress.trim(), block.trim() ? `Block ${block.trim()}` : '', floor.trim() ? `Floor ${floor.trim()}` : '', unitNumber.trim() ? `Unit ${unitNumber.trim()}` : ''].filter(Boolean).join(', ');
    setSaving(true);
    try {
      // Apartment block, floor and unit details are useful for responders but are
      // rarely indexed by map providers. Geocode the street address separately.
      const addressQuery = streetAddress.trim();
      let geoResult = null;
      let lookupServiceFailed = false;

      try {
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=za&q=${encodeURIComponent(`${addressQuery}, South Africa`)}`;
        const geoResponse = await fetch(nominatimUrl, { headers: { Accept: 'application/json' } });
        if (geoResponse.ok) {
          const geoResults = await geoResponse.json();
          if (geoResults.length) geoResult = { lat: Number(geoResults[0].lat), lon: Number(geoResults[0].lon) };
        } else lookupServiceFailed = true;
      } catch { lookupServiceFailed = true; }

      // Fallback geocoder helps with addresses that Nominatim does not index.
      if (!geoResult) {
        try {
          const photonUrl = `https://photon.komoot.io/api/?limit=1&lang=en&q=${encodeURIComponent(`${addressQuery}, South Africa`)}`;
          const photonResponse = await fetch(photonUrl, { headers: { Accept: 'application/json' } });
          if (photonResponse.ok) {
            const photonData = await photonResponse.json();
            const coordinates = photonData.features?.[0]?.geometry?.coordinates;
            if (coordinates?.length === 2 && Number.isFinite(Number(coordinates[0])) && Number.isFinite(Number(coordinates[1]))) {
              geoResult = { lat: Number(coordinates[1]), lon: Number(coordinates[0]) };
            }
          } else lookupServiceFailed = true;
        } catch { lookupServiceFailed = true; }
      }

      if (!geoResult) {
        if (lookupServiceFailed) throw new Error('Address lookup is temporarily unavailable. Check your connection and try again. Include the street name, suburb and city in the street address.');
        throw new Error('We could not locate that street address. Include the street name, suburb and city, then try again. Apartment block, floor and unit details are saved for responders but are not used to search the map.');
      }
      const destination = geoResult;
      const type = serviceType[organization.organization_type] || 'Incident';
      const { data, error } = await supabase.from('incidents').insert({
        organization_id: organization.id,
        created_by: organization.userId,
        incident_type: type,
        priority: 'medium',
        status: 'new',
        address_text: fullAddress,
        description: details.trim(),
        intake_source: 'operator_entered',
        location_source: 'address_geocoded',
        location: `SRID=4326;POINT(${destination.lon} ${destination.lat})`,
        location_confirmed: false
      }).select('*').single();
      if (error) throw error;
      const item = { dbId: data.id, id: `RR-${data.incident_number}`, type: data.incident_type || type, category: organization.organization_type, priority: 'Medium', status: 'New', address: fullAddress, area: organization.name, time: new Date(data.opened_at || Date.now()).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }), elapsed: '', coords: 'Address located on map', coordinates: destination, locationConfirmed: false, units: [], detail: details.trim(), source: 'Operator entered', shared: false };
      setIncidents?.(previous => [item, ...previous]);
      setSelected?.(item.id);
      setShowCreate(false);
      setStreetAddress(''); setBlock(''); setFloor(''); setUnitNumber(''); setDetails('');
      await showRoute(destination, fullAddress);
      notify?.(`${item.id} created and location added to the map`);
    } catch (error) { setFormError(error.message || 'Could not create the incident. Please try again.'); }
    finally { setSaving(false); }
  };

  const locateDispatch = () => { if (position && mapRef.current) mapRef.current.setView([position.lat, position.lon], 16, { animate: true }); else if (navigator.geolocation) { setLocationStatus('Requesting dispatch device location…'); navigator.geolocation.getCurrentPosition(() => {}, () => {}, { enableHighAccuracy: true, timeout: 15000 }); setMapError('Still waiting for the device location. Check browser location permission and try again.'); } };

  return <>
    <div className="page-heading">
      <div><div className="eyebrow">DISPATCH OPERATIONS</div><h1>Live map</h1><p>Create an incident from the map and see its road route and distance from dispatch.</p></div>
      <div className="rr-live-map-actions"><button className="btn btn-secondary" onClick={locateDispatch}><Crosshair size={15}/> Locate dispatch</button><button className="btn btn-primary" onClick={() => { setFormError(''); setShowCreate(true); }}><Plus size={16}/> Add incident</button></div>
    </div>
    <div className="rr-live-map-layout">
      <section className="panel rr-live-map-panel">
        <div className="rr-live-map-toolbar"><div className="rr-live-map-status"><span className={`rr-map-status-dot ${position ? 'is-located' : ''}`}/><div><strong>{position ? 'Dispatch location' : 'Finding dispatch location'}</strong><span>{locationStatus}</span></div></div><div className="rr-live-map-meta">{routeSummary || (position ? `Accuracy ±${position.accuracy} m` : 'Device location required')}</div></div>
        <div className="rr-live-map-canvas" ref={mapElement} aria-label="Live map showing dispatch and incident location" />
        {mapError && <div className="rr-map-message"><AlertTriangle size={17}/><span>{mapError}</span></div>}
        <div className="rr-live-map-footer"><span><span className="rr-map-legend-dot"/> Dispatch device <span className="rr-map-legend-destination"/> Incident location</span><span>{lastUpdate ? `Last location update ${lastUpdate.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Waiting for a location fix'}</span></div>
      </section>
      <aside className="panel rr-live-map-side">
        <div className="panel-header"><div><h2>Active incidents</h2><p>{active.length} open incident{active.length === 1 ? '' : 's'} in this organisation</p></div><span className="rr-map-count">{active.length}</span></div>
        {active.length ? <div className="rr-live-incident-list">{active.map(i => <button className="rr-live-incident" key={i.id} onClick={() => { if (i.coordinates) showRoute(i.coordinates, i.address || i.id); setSelected?.(i.id); }}><IconBadge category={i.category}/><span className="rr-live-incident-copy"><strong>{i.id} · {i.type}</strong><small>{i.address || 'Address not recorded'}</small><span className="rr-live-incident-tags"><Priority value={i.priority}/><StatusPill status={i.status}/></span></span><ChevronRight size={15}/></button>)}</div> : <div className="empty-state rr-live-map-empty"><MapPin size={23}/><strong>No active incidents</strong><span>Add an incident to pin its location and calculate the route from dispatch.</span></div>}
        <div className="rr-live-map-side-note"><ShieldCheck size={16}/><span>The route uses the address location returned by OpenStreetMap and road routing where available. Confirm the pin and entrance with the caller before dispatching responders.</span></div>
      </aside>
    </div>
    {showCreate && <div className="modal-backdrop" onClick={() => !saving && setShowCreate(false)}><div className="modal rr-map-create-modal" onClick={event => event.stopPropagation()}><div className="modal-header"><div><span className="modal-kicker">INCIDENT INTAKE</span><h2>Add incident</h2><p>Enter the address and the details provided to dispatch.</p></div><button className="icon-button" onClick={() => !saving && setShowCreate(false)} disabled={saving} aria-label="Close"><X size={19}/></button></div>
      <form onSubmit={createIncident}>
        <label>Street address<input required value={streetAddress} onChange={event => setStreetAddress(event.target.value)} placeholder="Street name, suburb and city" /></label>
        <label>Apartment block <span className="rr-optional">Optional</span><input value={block} onChange={event => setBlock(event.target.value)} placeholder="Block / tower name or number" /></label>
        <div className="form-two"><label>Apartment floor <span className="rr-optional">Optional</span><input value={floor} onChange={event => setFloor(event.target.value)} placeholder="Floor" /></label><label>Apartment unit number <span className="rr-optional">Optional</span><input value={unitNumber} onChange={event => setUnitNumber(event.target.value)} placeholder="Unit number" /></label></div>
        <label>Incident details<textarea required rows="4" value={details} onChange={event => setDetails(event.target.value)} placeholder="Describe what has happened and any important access information…" /></label>
        {formError && <div className="rr-map-form-error"><AlertTriangle size={15}/><span>{formError}</span></div>}
        <div className="form-note"><Navigation size={15}/><span>Use the street name, suburb and city. Apartment details are saved for responders but do not affect map lookup. A road route and distance from dispatch will be shown after the incident is saved.</span></div>
        <div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)} disabled={saving}>Cancel</button><button className="btn btn-primary" type="submit" disabled={saving}>{saving ? <><LoaderCircle size={16} className="rr-spin-icon"/> Locating and saving…</> : <><Plus size={16}/> Create incident</>}</button></div>
      </form>
    </div></div>}
  </>;
}
