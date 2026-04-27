import React from 'react';

export default function ETAPanel({ data }) {
  if (!data) return null;
  const { busId, etaToNextStop, etaToAllStops, currentSpeed, isDelayed } = data;
  return (
    <div>
      <div className="eta-hdr">
        <span className="eta-bid">Bus {busId}</span>
        {isDelayed && <span className="tag-delay">⚠ DELAYED</span>}
      </div>
      <div className="eta-box">
        <div className="eta-num">{Math.round(etaToNextStop)}</div>
        <div className="eta-unit">min to next stop</div>
        <div className="eta-spd">{Math.round(currentSpeed)} km/h</div>
      </div>
      {etaToAllStops && Object.keys(etaToAllStops).length > 0 && (
        <div>
          <div className="stops-hdr">Upcoming Stops</div>
          {Object.entries(etaToAllStops).map(([stop, eta]) => (
            <div key={stop} className="stop-row">
              <span className="stop-name">{stop}</span>
              <span className="stop-eta">{Math.round(eta)} min</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
