import React, { useState, useEffect } from 'react';

export default function SmartAdvice({ advice, defaultFrom, defaultTo, onSubmit }) {
  const [from, setFrom] = useState(defaultFrom || '');
  const [to,   setTo]   = useState(defaultTo   || '');

  useEffect(() => { if (defaultFrom) setFrom(defaultFrom); }, [defaultFrom]);
  useEffect(() => { if (defaultTo)   setTo(defaultTo);     }, [defaultTo]);

  const recColor = (rec = '') => {
    if (rec.includes('⚠'))      return 'var(--amber)';
    if (rec.includes('Crowded') || rec.includes('crowded')) return 'var(--red)';
    return 'var(--accent)';
  };

  return (
    <div>
      <div className="adv-inputs">
        <input className="adv-input" value={from} onChange={e => setFrom(e.target.value)} placeholder="From stop or city…" />
        <input className="adv-input" value={to}   onChange={e => setTo(e.target.value)}   placeholder="To stop or city…"   />
        <button className="adv-btn" onClick={() => from && to && onSubmit(from, to)}>
          FIND BEST BUS →
        </button>
      </div>

      {advice && (
        <div>
          <div className="adv-best">🏆 Best: {advice.bestChoice}</div>

          {(advice.options || []).map((opt, i) => (
            <div key={i} className="adv-opt">
              <div className="adv-opt-top">
                <span className="adv-opt-id">Bus {opt.busId}</span>
                <span className="adv-opt-rt">{opt.routeName}</span>
              </div>
              <div className="adv-opt-meta">
                <span>ETA: <span style={{ color: 'var(--accent)' }}>{Math.round(opt.etaMinutes)} min</span></span>
                <span>Crowd: <span style={{ color: opt.crowdLevel === 'HIGH' ? 'var(--red)' : opt.crowdLevel === 'MEDIUM' ? 'var(--amber)' : 'var(--accent)' }}>{opt.crowdLevel}</span></span>
                {opt.isDelayed && <span style={{ color: 'var(--amber)' }}>⚠ Delayed</span>}
              </div>
              <div className="adv-opt-rec" style={{ color: recColor(opt.recommendation) }}>
                {opt.recommendation}
              </div>
            </div>
          ))}

          {advice.options?.length === 0 && (
            <div className="empty">No buses found for this route</div>
          )}
        </div>
      )}
    </div>
  );
}
