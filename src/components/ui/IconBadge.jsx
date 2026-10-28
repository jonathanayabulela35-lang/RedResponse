import React from 'react';
import { AlertTriangle, CarFront, Flame, HeartPulse, Shield } from 'lucide-react';

export function IconBadge({ category, size = 16 }) {
  const Icon = { medical: HeartPulse, police: Shield, fire: Flame, road: CarFront }[category] || AlertTriangle;
  return <span className={`incident-icon ${category}`}><Icon size={size} /></span>;
}
