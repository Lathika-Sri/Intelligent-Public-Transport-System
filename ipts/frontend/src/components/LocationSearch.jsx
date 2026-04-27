import React, { useState, useRef } from 'react';

const STOPS = [
  { name: 'Gandhipuram Bus Stand', area: 'Coimbatore Central', lat: 11.0168, lng: 76.9558, icon: '🚏' },
  { name: 'Town Hall',             area: 'Coimbatore Central', lat: 11.0117, lng: 76.9660, icon: '🏛️' },
  { name: 'Peelamedu Junction',    area: 'East Coimbatore',    lat: 11.0245, lng: 77.0076, icon: '🚏' },
  { name: 'Avinashi Road',         area: 'East Coimbatore',    lat: 11.0201, lng: 77.0168, icon: '🛣️' },
  { name: 'RS Puram',              area: 'South Coimbatore',   lat: 11.0020, lng: 76.9523, icon: '🚏' },
  { name: 'Ukkadam',               area: 'South Coimbatore',   lat: 11.0001, lng: 76.9700, icon: '🚏' },
  { name: 'Sungam Circle',         area: 'South Coimbatore',   lat: 11.0080, lng: 76.9800, icon: '⭕' },
  { name: 'Singanallur',           area: 'East Coimbatore',    lat: 11.0000, lng: 77.0200, icon: '🚏' },
  { name: 'Brookefields',          area: 'East Coimbatore',    lat: 11.0150, lng: 77.0100, icon: '🛍️' },
  { name: 'Tidel Park',            area: 'East Coimbatore',    lat: 11.0230, lng: 77.0300, icon: '🏢' },
  { name: 'Hopes College',         area: 'West Coimbatore',    lat: 11.0250, lng: 76.9600, icon: '🎓' },
  { name: 'Ramanathapuram',        area: 'West Coimbatore',    lat: 11.0300, lng: 76.9650, icon: '🚏' },
  { name: 'Saibaba Colony',        area: 'West Coimbatore',    lat: 11.0350, lng: 76.9550, icon: '🚏' },
  { name: 'Race Course',           area: 'Central',            lat: 11.0290, lng: 76.9480, icon: '🏇' },
  { name: 'Peelamedu',             area: 'East Coimbatore',    lat: 11.0245, lng: 77.0076, icon: '🚏' },
];

const CITIES = [
  { name: 'Coimbatore',  area: 'Tamil Nadu', lat: 11.0168, lng: 76.9558, icon: '🏙️' },
  { name: 'Madurai',     area: 'Tamil Nadu', lat: 9.9252,  lng: 78.1198, icon: '🏙️' },
  { name: 'Chennai',     area: 'Tamil Nadu', lat: 13.0827, lng: 80.2707, icon: '🏙️' },
  { name: 'Tiruppur',    area: 'Tamil Nadu', lat: 11.1085, lng: 77.3411, icon: '🏙️' },
  { name: 'Salem',       area: 'Tamil Nadu', lat: 11.6643, lng: 78.1460, icon: '🏙️' },
  { name: 'Erode',       area: 'Tamil Nadu', lat: 11.3410, lng: 77.7172, icon: '🏙️' },
  { name: 'Trichy',      area: 'Tamil Nadu', lat: 10.7905, lng: 78.7047, icon: '🏙️' },
  { name: 'Dindigul',    area: 'Tamil Nadu', lat: 10.3624, lng: 77.9695, icon: '🏙️' },
  { name: 'Pollachi',    area: 'Tamil Nadu', lat: 10.6634, lng: 77.0075, icon: '🏙️' },
  { name: 'Palakkad',    area: 'Kerala',     lat: 10.7867, lng: 76.6548, icon: '🏙️' },
];

const QUICK = [
  { from: 'Coimbatore', to: 'Madurai',   icon: '🚌', label: 'CBE → MDA' },
  { from: 'Coimbatore', to: 'Chennai',   icon: '🚌', label: 'CBE → CHE' },
  { from: 'Coimbatore', to: 'Tiruppur',  icon: '🚌', label: 'CBE → TPR' },
  { from: 'Gandhipuram Bus Stand', to: 'RS Puram',  icon: '🏙️', label: 'Gandhi → RS Puram' },
  { from: 'Ukkadam', to: 'Tidel Park',   icon: '🏙️', label: 'Ukkadam → Tidel' },
];

function suggest(query, pool) {
  if (!query || query.length < 1) return [];
  const q = query.toLowerCase();
  return pool.filter(s =>
    s.name.toLowerCase().includes(q) || s.area.toLowerCase().includes(q)
  ).slice(0, 6);
}

export default function LocationSearch({ onStart }) {
  const [mode, setMode] = useState('intra'); // 'intra' | 'city'
  const [from, setFrom] = useState('');
  const [to,   setTo]   = useState('');
  const [fromCoords, setFromCoords] = useState(null);
  const [toCoords,   setToCoords]   = useState(null);
  const [fromDrop, setFromDrop] = useState([]);
  const [toDrop,   setToDrop]   = useState([]);
  const [showFrom, setShowFrom] = useState(false);
  const [showTo,   setShowTo]   = useState(false);

  const pool = mode === 'intra' ? STOPS : CITIES;

  const handleFrom = (val) => {
    setFrom(val); setFromCoords(null);
    setFromDrop(suggest(val, pool));
    setShowFrom(true);
  };

  const handleTo = (val) => {
    setTo(val); setToCoords(null);
    setToDrop(suggest(val, pool));
    setShowTo(true);
  };

  const pickFrom = (item) => {
    setFrom(item.name);
    setFromCoords({ lat: item.lat, lng: item.lng });
    setShowFrom(false);
  };

  const pickTo = (item) => {
    setTo(item.name);
    setToCoords({ lat: item.lat, lng: item.lng });
    setShowTo(false);
  };

  const swap = () => {
    setFrom(to);   setTo(from);
    setFromCoords(toCoords); setToCoords(fromCoords);
  };

  const applyQuick = (q) => {
    const isCity = CITIES.some(c => c.name === q.from);
    setMode(isCity ? 'city' : 'intra');
    setFrom(q.from); setTo(q.to);
    const fp = isCity ? CITIES : STOPS;
    const fc = fp.find(s => s.name === q.from);
    const tc = fp.find(s => s.name === q.to);
    if (fc) setFromCoords({ lat: fc.lat, lng: fc.lng });
    if (tc) setToCoords({ lat: tc.lat, lng: tc.lng });
  };

  const canGo = from.length > 1 && to.length > 1;

  const go = () => {
    if (!canGo) return;
    onStart({ fromLabel: from, toLabel: to, fromCoords, toCoords, mode });
  };

  return (
    <div className="search-screen">
      <div className="search-card">

        {/* Brand */}
        <div className="search-brand">
          <div className="brand-icon-lg">🚌</div>
          <div>
            <div className="brand-name-lg">IPTS</div>
            <div className="brand-sub-lg">Intelligent Public Transport System · Coimbatore</div>
          </div>
        </div>

        <div className="search-heading">Plan Your Journey</div>
        <div className="search-subtext">
          Live ETA · Real-time crowd · Traffic detection · Smart route advice
        </div>

        {/* Mode tabs */}
        <div className="mode-tabs">
          <button
            className={`mode-tab ${mode === 'intra' ? 'active' : ''}`}
            onClick={() => { setMode('intra'); setFrom(''); setTo(''); setFromCoords(null); setToCoords(null); }}
          >
            🚏 Within Coimbatore
          </button>
          <button
            className={`mode-tab ${mode === 'city' ? 'active' : ''}`}
            onClick={() => { setMode('city'); setFrom(''); setTo(''); setFromCoords(null); setToCoords(null); }}
          >
            🏙️ City to City
          </button>
        </div>

        {/* Location inputs */}
        <div className="loc-box">
          {/* FROM */}
          <div className="loc-row" style={{ position: 'relative' }}>
            <div className="loc-icon from"></div>
            <div className="loc-inner">
              <div className="loc-label-sm">From</div>
              <input
                className="loc-input"
                value={from}
                placeholder={mode === 'intra' ? 'Enter stop (e.g. Gandhipuram)…' : 'Enter city (e.g. Coimbatore)…'}
                onChange={e => handleFrom(e.target.value)}
                onFocus={() => { if (from) setShowFrom(true); }}
                onBlur={() => setTimeout(() => setShowFrom(false), 180)}
              />
            </div>
            {from && <button className="loc-clear" onClick={() => { setFrom(''); setFromCoords(null); }}>×</button>}

            {showFrom && fromDrop.length > 0 && (
              <div className="ac-drop">
                {fromDrop.map((item, i) => (
                  <div key={i} className="ac-item" onMouseDown={() => pickFrom(item)}>
                    <span className="ac-item-icon">{item.icon}</span>
                    <div>
                      <div className="ac-item-name">{item.name}</div>
                      <div className="ac-item-area">{item.area}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Swap */}
          <div style={{ position: 'relative', height: 0 }}>
            <button className="swap-btn" onClick={swap} title="Swap">⇅</button>
          </div>

          {/* TO */}
          <div className="loc-row" style={{ position: 'relative' }}>
            <div className="loc-icon to"></div>
            <div className="loc-inner">
              <div className="loc-label-sm">To</div>
              <input
                className="loc-input"
                value={to}
                placeholder={mode === 'intra' ? 'Enter stop (e.g. RS Puram)…' : 'Enter city (e.g. Madurai)…'}
                onChange={e => handleTo(e.target.value)}
                onFocus={() => { if (to) setShowTo(true); }}
                onBlur={() => setTimeout(() => setShowTo(false), 180)}
              />
            </div>
            {to && <button className="loc-clear" onClick={() => { setTo(''); setToCoords(null); }}>×</button>}

            {showTo && toDrop.length > 0 && (
              <div className="ac-drop">
                {toDrop.map((item, i) => (
                  <div key={i} className="ac-item" onMouseDown={() => pickTo(item)}>
                    <span className="ac-item-icon">{item.icon}</span>
                    <div>
                      <div className="ac-item-name">{item.name}</div>
                      <div className="ac-item-area">{item.area}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button className="go-btn" onClick={go} disabled={!canGo}>
          {canGo ? `🔍  FIND BUSES: ${from} → ${to}` : 'ENTER ORIGIN & DESTINATION'}
        </button>

        {/* Quick routes */}
        <div className="quick-section">
          <div className="quick-title">Popular routes</div>
          <div className="quick-chips">
            {QUICK.map((q, i) => (
              <button key={i} className="quick-chip" onClick={() => applyQuick(q)}>
                {q.icon} {q.label}
              </button>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="features">
          {[['📍','Live\nTracking'],['⏱️','Real-time\nETA'],['👥','Crowd\nPrediction'],['🚦','Traffic\nDetection'],['🧠','Smart\nAdvice']].map(([ic, lb], i) => (
            <div key={i} className="feature">
              <div className="feature-icon-box">{ic}</div>
              <div style={{ whiteSpace: 'pre-line' }}>{lb}</div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
