import React from 'react';

export default function CrowdPanel({ data }) {
  if (!data) return null;
  const { crowdCount, maxCapacity, crowdPercentage, crowdLevel, isOvercrowded, recommendation } = data;
  const pct   = Math.round(crowdPercentage);
  const cl    = crowdLevel || 'LOW';
  const rcls  = isOvercrowded ? 'danger' : cl === 'MEDIUM' ? 'warn' : 'good';

  return (
    <div>
      <div className={`crowd-pct ${cl}`}>{pct}%</div>
      <div className="crowd-sub">{crowdCount} / {maxCapacity} passengers</div>
      <div className="crowd-bar-lg">
        <div className={`crowd-fill-lg ${cl}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="crowd-lbl">{cl} occupancy level</div>
      <div className={`rec ${rcls}`}>{recommendation}</div>
    </div>
  );
}
