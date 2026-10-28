import React from 'react';

export function StatusPill({ status }) {
  const className = String(status || 'Unknown').toLowerCase().replaceAll(' ', '-');
  return <span className={`status-pill ${className}`}><i />{status || 'Unknown'}</span>;
}
