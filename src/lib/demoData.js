import { Shield, HeartPulse, Flame, CarFront, Gauge, Siren, RadioTower, Map as MapIcon, Navigation, Layers, Building2, Users, FileText, Settings } from 'lucide-react';

const departments = [
 {name:'Police',sub:'Public safety & law enforcement',icon:Shield,color:'blue',units:0,available:0,incidents:0},
 {name:'Medical Services',sub:'Ambulance & paramedic response',icon:HeartPulse,color:'red',units:0,available:0,incidents:0},
 {name:'Fire & Rescue',sub:'Fire suppression & rescue',icon:Flame,color:'orange',units:0,available:0,incidents:0},
 {name:'Road Response',sub:'Collision & roadway assistance',icon:CarFront,color:'green',units:0,available:0,incidents:0}
];
const navGroups = [
 {label:'OPERATIONS',items:[['Overview',Gauge],['Live incidents',Siren],['Dispatch board',RadioTower],['Live map',MapIcon],['Response units',Navigation]]},
 {label:'COORDINATION',items:[['Cross-department',Layers],['Departments',Building2],['Personnel',Users]]},
 {label:'MANAGEMENT',items:[['Reports & audit',FileText],['Settings',Settings]]}
];

export { departments, navGroups };
