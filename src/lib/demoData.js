import { Shield, HeartPulse, Flame, CarFront, Gauge, Siren, RadioTower, Map as MapIcon, Navigation, Layers, Building2, Users, FileText, Settings } from 'lucide-react';

const initialIncidents = [
 {id:'RR-24081',type:'Road collision',category:'road',priority:'Critical',status:'Dispatched',address:'Jan Smuts Avenue & Empire Road, Braamfontein',area:'Johannesburg Central',time:'21:18',elapsed:'04m 32s',coords:'-26.1908, 28.0312',units:['MED-04','POL-12','FIRE-02'],detail:'Two vehicles involved. Caller reports one person trapped and multiple injuries.',source:'Operator entered',shared:true},
 {id:'RR-24080',type:'Medical emergency',category:'medical',priority:'High',status:'En route',address:'18 Stiemens Street, Braamfontein',area:'Johannesburg Central',time:'21:14',elapsed:'08m 11s',coords:'-26.1885, 28.0251',units:['MED-02'],detail:'Adult experiencing breathing difficulty. Caller is with patient.',source:'Operator entered',shared:false},
 {id:'RR-24079',type:'Fire / smoke',category:'fire',priority:'High',status:'Acknowledged',address:'42 Juta Street, Johannesburg',area:'Johannesburg Central',time:'21:12',elapsed:'10m 06s',coords:'-26.1902, 28.0351',units:['FIRE-01'],detail:'Smoke reported from a commercial building. Occupancy not yet confirmed.',source:'Operator entered',shared:true},
 {id:'RR-24078',type:'Public safety',category:'police',priority:'Medium',status:'New',address:'Braamfontein Gate, De Korte Street',area:'Johannesburg Central',time:'21:10',elapsed:'12m 44s',coords:'-26.1922, 28.0293',units:[],detail:'Caller requests police assistance. Operator to confirm details.',source:'Operator entered',shared:false},
 {id:'RR-24077',type:'Road hazard',category:'road',priority:'Low',status:'Resolved',address:'M1 North, near the Empire Road exit',area:'Johannesburg Central',time:'20:52',elapsed:'28m 02s',coords:'-26.1858, 28.0317',units:['ROAD-03'],detail:'Debris reported in the left lane. Hazard cleared.',source:'Operator entered',shared:false}
];
const initialUnits = [
 {id:'MED-02',name:'Ambulance 02',dept:'Medical Services',type:'Ambulance',status:'En route',area:'Braamfontein',lat:-26.188,lon:28.025,cap:['Advanced life support','Patient transport'],crew:'2 paramedics',updated:'12 sec ago'},
 {id:'MED-04',name:'Ambulance 04',dept:'Medical Services',type:'Ambulance',status:'Responding',area:'Hillbrow',lat:-26.190,lon:28.030,cap:['Advanced life support','Patient transport'],crew:'2 paramedics',updated:'8 sec ago'},
 {id:'POL-12',name:'Patrol 12',dept:'Police',type:'Patrol vehicle',status:'Responding',area:'Braamfontein',lat:-26.195,lon:28.036,cap:['Public safety','Traffic control'],crew:'2 officers',updated:'15 sec ago'},
 {id:'POL-08',name:'Patrol 08',dept:'Police',type:'Patrol vehicle',status:'Available',area:'Parktown',lat:-26.177,lon:28.034,cap:['Public safety','Traffic control'],crew:'2 officers',updated:'10 sec ago'},
 {id:'FIRE-01',name:'Fire Engine 01',dept:'Fire & Rescue',type:'Fire engine',status:'Acknowledged',area:'Johannesburg CBD',lat:-26.203,lon:28.043,cap:['Fire suppression','Rescue'],crew:'4 firefighters',updated:'22 sec ago'},
 {id:'FIRE-02',name:'Rescue Unit 02',dept:'Fire & Rescue',type:'Rescue unit',status:'Responding',area:'Braamfontein',lat:-26.187,lon:28.031,cap:['Vehicle extrication','Technical rescue'],crew:'4 firefighters',updated:'7 sec ago'},
 {id:'ROAD-03',name:'Road Response 03',dept:'Road Response',type:'Road response vehicle',status:'Available',area:'Hillbrow',lat:-26.181,lon:28.045,cap:['Road hazards','Traffic safety'],crew:'2 responders',updated:'18 sec ago'},
 {id:'MED-01',name:'Ambulance 01',dept:'Medical Services',type:'Ambulance',status:'At station',area:'Parktown Base',lat:-26.174,lon:28.041,cap:['Basic life support','Patient transport'],crew:'2 paramedics',updated:'1 min ago'}
];
const departments = [
 {name:'Police',sub:'Public safety & law enforcement',icon:Shield,color:'blue',units:2,available:1,incidents:1},
 {name:'Medical Services',sub:'Ambulance & paramedic response',icon:HeartPulse,color:'red',units:3,available:1,incidents:1},
 {name:'Fire & Rescue',sub:'Fire suppression & rescue',icon:Flame,color:'orange',units:2,available:0,incidents:1},
 {name:'Road Response',sub:'Collision & roadway assistance',icon:CarFront,color:'green',units:1,available:1,incidents:1}
];
const navGroups = [
 {label:'OPERATIONS',items:[['Overview',Gauge],['Live incidents',Siren],['Dispatch board',RadioTower],['Live map',MapIcon],['Response units',Navigation]]},
 {label:'COORDINATION',items:[['Cross-department',Layers],['Departments',Building2],['Personnel',Users]]},
 {label:'MANAGEMENT',items:[['Reports & audit',FileText],['Settings',Settings]]}
];

export { initialIncidents, initialUnits, departments, navGroups };
