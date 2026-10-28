# RedResponse Web Platform

A responsive React + Vite web application prototype for emergency dispatch and cross-department response coordination.

## Included screens

- Operations overview dashboard
- Live incident queue and incident details
- Incident creation flow
- Dispatch board and unit assignment interaction
- Regional operations map (illustrative demo map, not live geospatial data)
- Response unit directory and demo availability toggles
- Cross-department assistance request flow
- Department directory
- Personnel, reports/audit, and settings workspace screens
- Responsive navigation and mobile layouts

## Run locally

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run dev
```

To build for production:

```bash
npm run build
npm run preview
```

## Important implementation note

This is a fully navigable front-end prototype with in-memory demo data. Changes made during a session are not persisted after refresh. The map uses illustrative Johannesburg Central positioning and is not connected to GPS, a geocoding service, or a routing provider. No real emergency call systems, push notification delivery, authentication provider, database, or emergency dispatch infrastructure is connected.

Before any operational or live emergency use, connect a secure backend and persistent database, implement organization-scoped authorization and audit logging, integrate a verified mapping/routing provider, add reliable dispatch delivery and acknowledgement, and conduct security, privacy, reliability, and operational validation with participating emergency services. This prototype must not be used to dispatch real emergency responses.


## Source structure

```text
src/
├── App.jsx                         # App shell, navigation and workflow orchestration
├── main.jsx                        # React entry point
├── pages/                          # Independent operational page components
│   ├── OverviewPage.jsx
│   ├── IncidentsPage.jsx
│   ├── DispatchBoardPage.jsx
│   ├── LiveMapPage.jsx
│   ├── ResponseUnitsPage.jsx
│   ├── CoordinationPage.jsx
│   ├── DepartmentsPage.jsx
│   ├── PersonnelPage.jsx
│   ├── ReportsAuditPage.jsx
│   ├── SettingsPage.jsx
│   └── index.js                    # Page registry
├── components/
│   ├── operations/                 # Incident details, map, status and operational components
│   ├── layout/                     # Shared layout components (brand and shell pieces)
│   │   └── AppBrand.jsx
│   ├── operations/                 # Incident details, maps and operational components
│   └── ui/                         # Reusable badges, metric cards and status components
│       ├── IconBadge.jsx
│       ├── StatusPill.jsx
│       ├── PriorityBadge.jsx
│       └── MetricCard.jsx
├── hooks/                          # Reusable React hooks
├── lib/                            # Demo data and shared app utilities
└── styles.css                      # Global design tokens and styles
```

### Direct page routes

- `/overview`
- `/incidents`
- `/dispatch`
- `/map`
- `/units`
- `/coordination`
- `/departments`
- `/personnel`
- `/reports`
- `/settings`

The current prototype uses the browser History API to keep the address bar in sync with navigation without resetting in-memory demo state. Hosting must be configured to serve `index.html` for these client-side routes.
