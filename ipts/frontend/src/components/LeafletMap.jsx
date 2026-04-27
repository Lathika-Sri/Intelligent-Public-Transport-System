import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet default icon paths broken by webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const ROUTE_STOPS = {
  R1: [
    { name: 'Gandhipuram Bus Stand', lat: 11.0168, lng: 76.9558 },
    { name: 'Town Hall',             lat: 11.0117, lng: 76.9660 },
    { name: 'Peelamedu Junction',    lat: 11.0245, lng: 77.0076 },
    { name: 'Avinashi Road',         lat: 11.0201, lng: 77.0168 },
    { name: 'RS Puram',              lat: 11.0020, lng: 76.9523 },
  ],
  R2: [
    { name: 'Ukkadam',       lat: 11.0001, lng: 76.9700 },
    { name: 'Sungam Circle', lat: 11.0080, lng: 76.9800 },
    { name: 'Singanallur',   lat: 11.0000, lng: 77.0200 },
    { name: 'Brookefields',  lat: 11.0150, lng: 77.0100 },
    { name: 'Tidel Park',    lat: 11.0230, lng: 77.0300 },
  ],
  R3: [
    { name: 'Hopes College',     lat: 11.0250, lng: 76.9600 },
    { name: 'Ramanathapuram',    lat: 11.0300, lng: 76.9650 },
    { name: 'Saibaba Colony',    lat: 11.0350, lng: 76.9550 },
    { name: 'Race Course',       lat: 11.0290, lng: 76.9480 },
    { name: 'Peelamedu',         lat: 11.0245, lng: 77.0076 },
  ],
};

const ROUTE_COLORS = { R1: '#1D9E75', R2: '#5b8ff9', R3: '#f5c842' };

function lerp(a, b, t) { return a + (b - a) * t; }

function getBusLatLng(bus, stops) {
  const avgSpacing = 8.5 / (stops.length - 1);
  const dist  = bus.distanceToNextStop ?? 1.5;
  const frac  = Math.max(0, Math.min(1, 1 - dist / avgSpacing));
  const curI  = Math.min(bus.currentStopIndex, stops.length - 1);
  const nxtI  = Math.min(bus.currentStopIndex + 1, stops.length - 1);
  return {
    lat: lerp(stops[curI].lat, stops[nxtI].lat, frac),
    lng: lerp(stops[curI].lng, stops[nxtI].lng, frac),
  };
}

function busDivIcon(bus, isSelected) {
  const color = ROUTE_COLORS[bus.routeId] || '#1D9E75';
  const delay = bus.isDelayed
    ? `<div style="position:absolute;top:-5px;right:-5px;width:10px;height:10px;background:#BA7517;border-radius:50%;border:1.5px solid #0D1117;"></div>`
    : '';
  const ring = isSelected
    ? `border:2px solid #fff;box-shadow:0 0 0 3px ${color}66,0 2px 8px rgba(0,0,0,0.6);`
    : `box-shadow:0 2px 8px rgba(0,0,0,0.5);`;
  return L.divIcon({
    className: '',
    iconSize:  [38, 22],
    iconAnchor:[19, 11],
    html: `
      <div style="position:relative;display:inline-block;">
        <div style="
          background:${color};color:#0D1117;
          font-family:'Space Mono',monospace;font-size:9px;font-weight:700;
          padding:4px 7px;border-radius:5px;white-space:nowrap;
          ${ring}
        ">${bus.busId}</div>
        ${delay}
      </div>`,
  });
}

function stopIcon(color) {
  return L.divIcon({
    className: '',
    iconSize:  [12, 12],
    iconAnchor:[6, 6],
    html: `<div style="width:12px;height:12px;border-radius:50%;background:#161B22;border:2px solid ${color};"></div>`,
  });
}

function pinIcon(color, label) {
  return L.divIcon({
    className: '',
    iconSize:  [28, 28],
    iconAnchor:[14, 28],
    html: `
      <div style="
        width:28px;height:28px;border-radius:50% 50% 50% 0;
        background:${color};transform:rotate(-45deg);
        border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.5);
        display:flex;align-items:center;justify-content:center;
      ">
        <span style="transform:rotate(45deg);color:#fff;font-size:11px;font-weight:700;font-family:'Space Mono',monospace;">${label}</span>
      </div>`,
  });
}

export default function LeafletMap({ buses, selectedBus, journey, onBusSelect }) {
  const mapRef      = useRef(null);
  const mapObj      = useRef(null);
  const markersRef  = useRef({});       // busId → Leaflet marker
  const polylinesRef = useRef({});      // routeId → polyline
  const stopMkRef   = useRef([]);       // stop circle markers
  const journeyMkRef = useRef([]);      // origin / dest pin markers
  const journeyPoly = useRef(null);
  const smoothRef   = useRef({});       // busId → {lat, lng} smooth position
  const animRef     = useRef(null);
  const busesRef    = useRef(buses);

  useEffect(() => { busesRef.current = buses; }, [buses]);

  // ── Init map (once) ───────────────────────────────────────────────────────
  useEffect(() => {
    if (mapObj.current) return;

    const map = L.map(mapRef.current, {
      center:     [11.0168, 76.9800],
      zoom:       13,
      zoomControl: true,
    });

    // Dark tile layer from CartoDB
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution: '© OpenStreetMap contributors © CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      }
    ).addTo(map);

    mapObj.current = map;

    // Draw route polylines + stop markers
    Object.entries(ROUTE_STOPS).forEach(([routeId, stops]) => {
      const color = ROUTE_COLORS[routeId];
      const latlngs = stops.map(s => [s.lat, s.lng]);

      const poly = L.polyline(latlngs, {
        color, weight: 3, opacity: 0.8, smoothFactor: 1,
      }).addTo(map);
      polylinesRef.current[routeId] = poly;

      stops.forEach((stop, i) => {
        const mk = L.marker([stop.lat, stop.lng], { icon: stopIcon(color), zIndexOffset: 10 })
          .addTo(map)
          .bindTooltip(stop.name, { direction: 'top', className: 'leaflet-dark-tooltip', offset: [0, -6] });
        stopMkRef.current.push(mk);
      });
    });

    return () => {
      cancelAnimationFrame(animRef.current);
      map.remove();
      mapObj.current = null;
    };
  }, []);

  // ── Journey pins + dashed line ────────────────────────────────────────────
  useEffect(() => {
    if (!mapObj.current) return;
    // Clear previous
    journeyMkRef.current.forEach(m => m.remove());
    journeyMkRef.current = [];
    if (journeyPoly.current) { journeyPoly.current.remove(); journeyPoly.current = null; }

    const { fromCoords, toCoords, fromLabel, toLabel } = journey;

    if (fromCoords) {
      const mk = L.marker([fromCoords.lat, fromCoords.lng], { icon: pinIcon('#1D9E75', 'A'), zIndexOffset: 500 })
        .addTo(mapObj.current)
        .bindTooltip(`From: ${fromLabel}`, { direction: 'top' });
      journeyMkRef.current.push(mk);
    }

    if (toCoords) {
      const mk = L.marker([toCoords.lat, toCoords.lng], { icon: pinIcon('#f5c842', 'B'), zIndexOffset: 500 })
        .addTo(mapObj.current)
        .bindTooltip(`To: ${toLabel}`, { direction: 'top' });
      journeyMkRef.current.push(mk);
    }

    if (fromCoords && toCoords) {
      journeyPoly.current = L.polyline(
        [[fromCoords.lat, fromCoords.lng], [toCoords.lat, toCoords.lng]],
        { color: '#1D9E75', weight: 2, opacity: 0.5, dashArray: '8 6' }
      ).addTo(mapObj.current);

      const bounds = L.latLngBounds(
        [fromCoords.lat, fromCoords.lng],
        [toCoords.lat, toCoords.lng]
      );
      mapObj.current.fitBounds(bounds, { padding: [60, 60] });
    }
  }, [journey]);

  // ── Create / update bus markers ───────────────────────────────────────────
  useEffect(() => {
    if (!mapObj.current) return;

    buses.forEach(bus => {
      const stops = ROUTE_STOPS[bus.routeId];
      if (!stops) return;

      const targetPos = getBusLatLng(bus, stops);

      if (!smoothRef.current[bus.busId]) {
        smoothRef.current[bus.busId] = { ...targetPos };
      }

      const isSel = bus.busId === selectedBus;

      if (!markersRef.current[bus.busId]) {
        const mk = L.marker(
          [targetPos.lat, targetPos.lng],
          { icon: busDivIcon(bus, isSel), zIndexOffset: isSel ? 1000 : 100 }
        ).addTo(mapObj.current);

        mk.on('click', () => onBusSelect(bus.busId));
        mk.bindTooltip(
          `Bus ${bus.busId} · ${bus.routeId}<br/>Speed: ${Math.round(bus.speedKmh)} km/h<br/>Crowd: ${bus.crowdLevel}<br/>ETA: ${Math.round(bus.etaToNextStop)} min${bus.isDelayed ? '<br/>⚠ Delayed' : ''}`,
          { direction: 'top', className: 'leaflet-dark-tooltip', offset: [0, -10] }
        );
        markersRef.current[bus.busId] = mk;
      } else {
        // Update icon (selection state / delay may have changed)
        markersRef.current[bus.busId].setIcon(busDivIcon(bus, isSel));
        markersRef.current[bus.busId].setZIndexOffset(isSel ? 1000 : 100);
        markersRef.current[bus.busId].setTooltipContent(
          `Bus ${bus.busId} · ${bus.routeId}<br/>Speed: ${Math.round(bus.speedKmh)} km/h<br/>Crowd: ${bus.crowdLevel}<br/>ETA: ${Math.round(bus.etaToNextStop)} min${bus.isDelayed ? '<br/>⚠ Delayed' : ''}`
        );
      }

      // Update smooth target
      smoothRef.current[bus.busId] = targetPos;
    });

    // Highlight / dim polylines
    Object.entries(polylinesRef.current).forEach(([routeId, poly]) => {
      if (!selectedBus) {
        poly.setStyle({ opacity: 0.8, weight: 3 });
      } else {
        const selRoute = buses.find(b => b.busId === selectedBus)?.routeId;
        poly.setStyle({
          opacity: routeId === selRoute ? 1 : 0.2,
          weight:  routeId === selRoute ? 4.5 : 2,
        });
      }
    });
  }, [buses, selectedBus]);

  // ── Smooth animation loop: gradually moves markers ────────────────────────
  useEffect(() => {
    const animate = () => {
      Object.entries(smoothRef.current).forEach(([busId, target]) => {
        const mk = markersRef.current[busId];
        if (!mk) return;
        const cur = mk.getLatLng();
        const newLat = lerp(cur.lat, target.lat, 0.07);
        const newLng = lerp(cur.lng, target.lng, 0.07);
        mk.setLatLng([newLat, newLng]);
      });
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <>
      <style>{`
        .leaflet-dark-tooltip {
          background: rgba(22,27,34,0.95) !important;
          border: 1px solid #30363D !important;
          color: #E6EDF3 !important;
          border-radius: 7px !important;
          font-family: 'DM Sans', sans-serif !important;
          font-size: 11px !important;
          padding: 6px 9px !important;
          line-height: 1.5 !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
        }
        .leaflet-dark-tooltip::before { display:none; }
        .leaflet-control-attribution { display:none !important; }
        .leaflet-control-zoom a {
          background: #21262D !important; color: #E6EDF3 !important;
          border-color: #30363D !important;
        }
        .leaflet-control-zoom a:hover { background: #2D333B !important; }
      `}</style>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
    </>
  );
}
