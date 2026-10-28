import OverviewPage from './OverviewPage.jsx';
import IncidentsPage from './IncidentsPage.jsx';
import DispatchBoardPage from './DispatchBoardPage.jsx';
import LiveMapPage from './LiveMapPage.jsx';
import ResponseUnitsPage from './ResponseUnitsPage.jsx';
import CoordinationPage from './CoordinationPage.jsx';
import DepartmentsPage from './DepartmentsPage.jsx';
import PersonnelPage from './PersonnelPage.jsx';
import ReportsAuditPage from './ReportsAuditPage.jsx';
import SettingsPage from './SettingsPage.jsx';
import FallbackPage from './FallbackPage.jsx';

export const pageRegistry = {
  'Overview': OverviewPage,
  'Live incidents': IncidentsPage,
  'Dispatch board': DispatchBoardPage,
  'Live map': LiveMapPage,
  'Response units': ResponseUnitsPage,
  'Cross-department': CoordinationPage,
  'Departments': DepartmentsPage,
  'Personnel': PersonnelPage,
  'Reports & audit': ReportsAuditPage,
  'Settings': SettingsPage,
};
export { FallbackPage };
