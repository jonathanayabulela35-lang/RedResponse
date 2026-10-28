import { Ambulance, CarFront, Flame, Shield } from 'lucide-react';

export const DEPARTMENTS = [
  { id: 'fire_rescue', label: 'Fire and Rescue', short: 'Fire & Rescue', description: 'Fire calls, rescue incidents, crew availability and fire appliance dispatch.', icon: Flame, incidentTypes: ['Fire / smoke', 'Rescue request', 'Hazardous materials', 'Building collapse'], color: 'red' },
  { id: 'medical', label: 'Ambulance and Medical Response', short: 'Ambulance & Medical', description: 'Medical emergency intake, ambulance allocation, crew acknowledgement and patient destination coordination.', icon: Ambulance, incidentTypes: ['Medical emergency', 'Medical transport', 'Trauma response', 'Patient transfer'], color: 'red' },
  { id: 'police', label: 'Police and Law Enforcement', short: 'Police', description: 'Public safety calls, patrol assignments, incident updates and law enforcement response.', icon: Shield, incidentTypes: ['Public safety', 'Crime report', 'Welfare check', 'Missing person'], color: 'red' },
  { id: 'road_response', label: 'Road Accident Response', short: 'Road Response', description: 'Road collisions, roadway hazards, traffic safety and incident scene coordination.', icon: CarFront, incidentTypes: ['Road collision', 'Road hazard', 'Traffic obstruction', 'Vehicle breakdown'], color: 'red' },
];

export const departmentById = (id) => DEPARTMENTS.find((item) => item.id === id) || null;

export const dashboardRoute = '/app';
