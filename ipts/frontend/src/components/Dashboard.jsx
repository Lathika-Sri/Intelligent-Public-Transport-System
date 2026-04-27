import React, { useState, useEffect } from 'react';
import LeafletMap from './LeafletMap';
import BusList from './BusList';
import ETAPanel from './ETAPanel';
import TrafficPanel from './TrafficPanel';
import CrowdPanel from './CrowdPanel';
import SmartAdvice from './SmartAdvice';

const ROUTES = ['ALL', 'R1', 'R2', 'R3'];
const RNAMES = { ALL: 'All Routes', R1: 'Route R1', R2: 'Route R2', R3: 'Route R3' };

export default function Dashboard({
  journey, buses, routes,
  selectedBus, etaData, crowdData, advice,
  loading, offline,
  activeRoute, onRouteChange, onBusSelect, onAdvice, onChangeJourney,
}) {
  const [clock, setClock] = useState('');

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);

  const filtered   = activeRoute === 'ALL' ? buses : buses.filter(b => b.routeId === activeRoute);
  const delayed    = buses.filter(b => b.isDelayed).length;
  const highCrowd  = buses.filter(b => b.crowdLevel === 'HIGH').length;
  const avgSpeed   = buses.length ? Math.round(buses.reduce((s, b) => s + b.speedKmh, 0) / buses.length) : 0;
  const selBusObj  = buses.find(b => b.busId === selectedBus);

  return (
    <div className="shell">

      {/* ── Topbar ── */}
      <div className="topbar">
        <div className="topbar-brand">
          <div className="brand-icon-sm">🚌</div>
          <div>
            <div className="brand-name-sm">IPTS</div>
            <div className="brand-sub-sm">Coimbatore Network</div>
          </div>
        </div>

        <button className="journey-pill" onClick={onChangeJourney} title="Change journey">
          <span className="pill-from">{journey.fromLabel}</span>
          <span className="pill-arr">→</span>
          <span className="pill-to">{journey.toLabel}</span>
          <span className="pill-edit">✎</span>
        </button>

        <div className="route-tabs">
          {ROUTES.map(r => (
            <button key={r} className={`rtab ${activeRoute === r ? 'active' : ''}`} onClick={() => onRouteChange(r)}>
              {RNAMES[r]}
            </button>
          ))}
        </div>

        <div className="topbar-right">
          <span className="clock">{clock}</span>
          <div className="live-badge"><div className="live-dot"></div>LIVE</div>
        </div>
      </div>

      {offline && (
        <div className="err-bar">
          ⚠ Cannot reach backend — make sure Spring Boot is running on port 8080 then refresh
        </div>
      )}

      {/* ── Body ── */}
      <div className="body-grid" style={{ flex: 1, overflow: 'hidden' }}>

        {/* Left — bus list */}
        <div className="left-panel">
          <div className="panel-hdr">Active Buses ({filtered.length})</div>
          <div className="bus-scroll">
            {filtered.length === 0
              ? <div className="empty">No buses on this filter</div>
              : <BusList buses={filtered} selectedBus={selectedBus} onBusSelect={onBusSelect} />}
          </div>
        </div>

        {/* Center — Leaflet map */}
        <div className="map-wrap" style={{ position: 'relative' }}>
          {loading && (
            <div className="spinner-wrap">
              <div className="spinner"></div>
              <div className="spinner-txt">Loading live data…</div>
            </div>
          )}

          <LeafletMap
            buses={buses}
            selectedBus={selectedBus}
            journey={journey}
            onBusSelect={onBusSelect}
          />

          {/* Overlay chips */}
          <div className="map-chips">
            <div className="map-chip">Buses: <b>{buses.length}</b></div>
            <div className="map-chip warn">Delayed: <b>{delayed}</b></div>
            <div className="map-chip">🗺️ OpenStreetMap</div>
          </div>

          {/* Legend */}
          <div className="map-legend">
            {Object.entries({ R1: '#1D9E75', R2: '#5b8ff9', R3: '#f5c842' }).map(([r, c]) => (
              <div key={r} className="leg-row">
                <div className="leg-line" style={{ background: c }}></div>
                {r}
              </div>
            ))}
            <div className="leg-row" style={{ marginTop: 5, borderTop: '1px solid #30363D', paddingTop: 5 }}>
              <span style={{ fontSize: 10 }}>🟢 Origin  🟡 Dest</span>
            </div>
          </div>
        </div>

        {/* Right — intelligence panels */}
        <div className="right-panel">

          <div className="rpanel">
            <div className="rpanel-title">ETA Details</div>
            {etaData ? <ETAPanel data={etaData} /> : <div className="hint">← Click a bus</div>}
          </div>

          {selBusObj && (
            <div className="rpanel">
              <div className="rpanel-title">Traffic & Delay Intelligence</div>
              <TrafficPanel bus={selBusObj} />
            </div>
          )}

          {crowdData && (
            <div className="rpanel">
              <div className="rpanel-title">Crowd Info</div>
              <CrowdPanel data={crowdData} />
            </div>
          )}

          <div className="rpanel" style={{ flex: 1 }}>
            <div className="rpanel-title">Smart Advice</div>
            <SmartAdvice
              advice={advice}
              defaultFrom={journey.fromLabel}
              defaultTo={journey.toLabel}
              onSubmit={onAdvice}
            />
          </div>

        </div>
      </div>

      {/* ── Stats bar ── */}
      <div className="stats-bar">
        <div className="stat-blk">
          <div className="stat-v">{buses.length}</div>
          <div className="stat-l">Active Buses</div>
        </div>
        <div className="stat-blk">
          <div className="stat-v" style={{ color: delayed > 0 ? 'var(--amber)' : 'var(--accent)' }}>{delayed}</div>
          <div className="stat-l">Delayed</div>
        </div>
        <div className="stat-blk">
          <div className="stat-v" style={{ color: highCrowd > 0 ? 'var(--red)' : 'var(--accent)' }}>{highCrowd}</div>
          <div className="stat-l">High Crowd</div>
        </div>
        <div className="stat-blk">
          <div className="stat-v">{avgSpeed}</div>
          <div className="stat-l">Avg km/h</div>
        </div>
      </div>

    </div>
  );
}
