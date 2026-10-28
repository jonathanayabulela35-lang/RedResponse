import React from 'react';
import { Activity, Ambulance, AlertTriangle, ArrowDownRight, ArrowUpRight, Bell, Check, CheckCheck, ChevronDown, ChevronRight, Clock3, Crosshair, Flame, Gauge, Globe2, Headphones, Layers, LocateFixed, LogOut, Map as MapIcon, MapPin, Menu, MoreHorizontal, Navigation, Plus, Radio, Search, Send, Settings, Shield, ShieldAlert, ShieldCheck, Siren, SlidersHorizontal, Smartphone, Users, X, CarFront, Building2, CalendarClock, CircleHelp, FileText, Filter, HeartPulse, Home, Info, LockKeyhole, MapPinned, MessageSquareWarning, PackageCheck, RadioTower, RefreshCw, Route, UserRound, Wifi, Zap } from 'lucide-react';
import { IconBadge, StatusPill, Priority, Metric, ActivityItem, TimelineItem, MaximizeIcon, OperationsMap, IncidentDetail, GenericPage } from '../components/operations/OperationalComponents.jsx';
import { departments } from '../lib/demoData.js';

export default function PersonnelPage(props) {
  const { page, setPage, incidents, setIncidents, units, setUnits, selected, setSelected, search, setSearch, filter, setFilter, showNew, setShowNew, showDispatch, setShowDispatch, showCross, setShowCross, mobileNav, setMobileNav, toast, setToast, newType, setNewType, newPriority, setNewPriority, newAddress, setNewAddress, newDetail, setNewDetail, departmentFilter, setDepartmentFilter, active, notify, filtered, go, dispatch, createIncident, changeStatus } = props;
  return (
<GenericPage icon={Users} eyebrow="ACCESS & IDENTITY" title="Personnel" subtitle="Manage dispatch operators, supervisors and field responder access." cards={[['Dispatch operators','Create and manage dispatcher accounts, station assignments and dispatch permissions.'],['Field responders','Connect responders to registered units and authorized departments.'],['Access policies','Configure role-based permissions and cross-department access approvals.']]} onAction={()=>notify('Personnel invitation workflow is ready to be connected to authentication.')}/>
  );
}
