import React from 'react';
import { Activity, Ambulance, AlertTriangle, ArrowDownRight, ArrowUpRight, Bell, Check, CheckCheck, ChevronDown, ChevronRight, Clock3, Crosshair, Flame, Gauge, Globe2, Headphones, Layers, LocateFixed, LogOut, Map as MapIcon, MapPin, Menu, MoreHorizontal, Navigation, Plus, Radio, Search, Send, Settings, Shield, ShieldAlert, ShieldCheck, Siren, SlidersHorizontal, Smartphone, Users, X, CarFront, Building2, CalendarClock, CircleHelp, FileText, Filter, HeartPulse, Home, Info, LockKeyhole, MapPinned, MessageSquareWarning, PackageCheck, RadioTower, RefreshCw, Route, UserRound, Wifi, Zap } from 'lucide-react';
import { IconBadge, StatusPill, Metric, ActivityItem, TimelineItem, MaximizeIcon, OperationsMap, IncidentDetail, GenericPage } from '../components/operations/OperationalComponents.jsx';
import { departments } from '../lib/demoData.js';

export default function FallbackPage(props) {
  const { page, setPage, incidents, setIncidents, units, setUnits, selected, setSelected, search, setSearch, filter, setFilter, showNew, setShowNew, showDispatch, setShowDispatch, showCross, setShowCross, mobileNav, setMobileNav, toast, setToast, newType, setNewType, newPriority, setNewPriority, newAddress, setNewAddress, newDetail, setNewDetail, departmentFilter, setDepartmentFilter, active, notify, filtered, go, dispatch, createIncident, changeStatus } = props;
  return (
<GenericPage icon={CircleHelp} eyebrow="REDRESPONSE" title={page} subtitle="This area is part of the RedResponse workspace." cards={[]} onAction={()=>go('Overview')}/>
  );
}
