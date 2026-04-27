import React from 'react';

function trafficInfo(speedKmh) {
  if (speedKmh < 15) return { level: 'Heavy',    color: 'var(--red)',    pct: 92, desc: 'Severe congestion — major jam' };
  if (speedKmh < 25) return { level: 'Moderate', color: 'var(--amber)',  pct: 62, desc: 'Moderate traffic slowdown' };
  if (speedKmh < 40) return { level: 'Light',    color: '#f5c842',       pct: 32, desc: 'Light traffic conditions' };
  return               { level: 'Free',     color: 'var(--accent)', pct: 8,  desc: 'Free-flow — clear roads' };
}

export default function TrafficPanel({ bus }) {
  if (!bus) return null;

  const t         = trafficInfo(bus.speedKmh);
  const speedPct  = Math.min(100, Math.round((bus.speedKmh / 60) * 100));
  const delayMin  = bus.isDelayed ? Math.round(bus.etaToNextStop * 0.3) : 0;

  return (
    <div>
      <div className="intel-grid">
        <div className="intel-card">
          <div className="intel-ico">🚀</div>
          <div className="intel-val" style={{ color: t.color }}>{Math.round(bus.speedKmh)}</div>
          <div className="intel-lbl">km / h</div>
        </div>
        <div className="intel-card">
          <div className="intel-ico">🚦</div>
          <div className="intel-val" style={{ color: t.color, fontSize: 12 }}>{t.level}</div>
          <div className="intel-lbl">Traffic</div>
        </div>
      </div>

      <div className="tbar-wrap">
        <div className="tbar-lbl">
          <span>Bus speed</span>
          <span style={{ color: t.color }}>{Math.round(bus.speedKmh)} / 60 km/h</span>
        </div>
        <div className="tbar">
          <div className="tbar-fill" style={{ width: `${speedPct}%`, background: t.color }}></div>
        </div>
      </div>

      <div className="tbar-wrap">
        <div className="tbar-lbl">
          <span>Congestion</span>
          <span style={{ color: t.color }}>{t.pct}%</span>
        </div>
        <div className="tbar">
          <div className="tbar-fill" style={{ width: `${t.pct}%`, background: `linear-gradient(90deg, var(--accent), ${t.color})` }}></div>
        </div>
      </div>

      {bus.isDelayed ? (
        <div className="status-warn">
          ⚠ {t.desc}<br />
          <span style={{ fontSize: 10, fontFamily: 'var(--mono)' }}>+{delayMin} min penalty applied to ETA (30% extra)</span>
        </div>
      ) : (
        <div className="status-ok">✓ On schedule — {t.desc}</div>
      )}
    </div>
  );
}
