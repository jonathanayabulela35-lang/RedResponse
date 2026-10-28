import React from 'react';
import { ArrowDownRight } from 'lucide-react';

export function MetricCard({ label, value, note, icon: Icon, tone, trend }) {
  return <div className="metric-card"><div className={`metric-icon ${tone}`}><Icon size={19} /></div><div className="metric-trend">{trend === '−8.4%' ? <><ArrowDownRight size={13} />{trend}</> : trend}</div><div className="metric-value">{value}</div><div className="metric-label">{label}</div><div className="metric-note">{note}</div></div>;
}
