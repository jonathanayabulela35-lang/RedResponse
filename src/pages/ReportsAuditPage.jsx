import React from 'react';
import { Activity, Ambulance, AlertTriangle, ArrowDownRight, ArrowUpRight, Bell, Check, CheckCheck, ChevronDown, ChevronRight, Clock3, Crosshair, Flame, Gauge, Globe2, Headphones, Layers, LocateFixed, LogOut, Map as MapIcon, MapPin, Menu, MoreHorizontal, Navigation, Plus, Radio, Search, Send, Settings, Shield, ShieldAlert, ShieldCheck, Siren, SlidersHorizontal, Smartphone, Users, X, CarFront, Building2, CalendarClock, CircleHelp, FileText, Filter, HeartPulse, Home, Info, LockKeyhole, MapPinned, MessageSquareWarning, PackageCheck, RadioTower, RefreshCw, Route, UserRound, Wifi, Zap } from 'lucide-react';
import { IconBadge, StatusPill, Priority, Metric, ActivityItem, TimelineItem, MaximizeIcon, OperationsMap, IncidentDetail, GenericPage } from '../components/operations/OperationalComponents.jsx';
import { departments } from '../lib/demoData.js';

export default function ReportsAuditPage(props) {
  const { page, setPage, incidents, setIncidents, units, setUnits, selected, setSelected, search, setSearch, filter, setFilter, showNew, setShowNew, showDispatch, setShowDispatch, showCross, setShowCross, mobileNav, setMobileNav, toast, setToast, newType, setNewType, newPriority, setNewPriority, newAddress, setNewAddress, newDetail, setNewDetail, departmentFilter, setDepartmentFilter, active, notify, filtered, go, dispatch, createIncident, changeStatus } = props;
  return (
<GenericPage icon={FileText} eyebrow="ACCOUNTABILITY" title="Reports & audit" subtitle="Review response activity, dispatch outcomes and security-relevant actions." cards={[['Incident activity','Chronological incident changes, dispatches, acknowledgements and resolution.'],['Dispatch performance','Acknowledgement delays, unit allocation and response-time measures.'],['Access audit','Review user actions and cross-department access events.']]} onAction={()=>notify('Report export will be connected to persisted operational records.')}/>
  );
}
