import React from 'react';

export default function BusList({ buses, selectedBus, onBusSelect }) {
  return (
    <div>
      {buses.map(bus => {
        const cl  = bus.crowdLevel || 'LOW';
        const pct = Math.round(bus.crowdPercentage || 0);
        return (
          <div
            key={bus.busId}
            className={`bus-card ${selectedBus === bus.busId ? 'sel' : ''} ${bus.isDelayed ? 'delayed' : ''}`}
            onClick={() => onBusSelect(bus.busId)}
          >
            <div className="bc-top">
              <span className="bc-id">Bus {bus.busId}</span>
              <span className="bc-route">{bus.routeId}</span>
              <span className={`bc-crowd ${cl}`}>{cl}</span>
            </div>

            <div className="bc-meta">
              <span>Speed: <span className="bc-val">{Math.round(bus.speedKmh)} km/h</span></span>
              <span>ETA: <span className="bc-val bc-eta">{Math.round(bus.etaToNextStop)} min</span></span>
              {bus.isDelayed && <span className="bc-delay">⚠ Delayed</span>}
            </div>

            <div className="bar">
              <div className={`bar-fill ${cl}`} style={{ width: `${pct}%` }} />
            </div>

            <div className="bc-foot">
              <span>Crowd: {pct}%</span>
              <span>{bus.currentStopName || `Stop #${bus.currentStopIndex + 1}`}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
