import React from 'react';

export function PriorityBadge({ value }) {
  const priority = value || 'Unassigned';
  return <span className={`priority ${priority.toLowerCase()}`}><span />{priority}</span>;
}
