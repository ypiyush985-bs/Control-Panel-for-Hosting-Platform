import { useState } from 'react';
import { useNavigation } from '../../contexts/NavigationContext';
import Sidebar from './Sidebar';
import Header from './Header';
import { NotificationStack } from '../shared/Notification';

import Dashboard        from '../sections/Dashboard/Dashboard';
import DeploymentPanel  from '../sections/DeploymentPanel/DeploymentPanel';
import DomainManager    from '../sections/DomainManager/DomainManager';
import FileManager      from '../sections/FileManager/FileManager';
import DatabaseManager  from '../sections/DatabaseManager/DatabaseManager';
import EmailManager     from '../sections/EmailManager/EmailManager';
import SSLManager       from '../sections/SSLManager/SSLManager';
import ServerMonitor    from '../sections/ServerMonitor/ServerMonitor';

import './AppShell.css';

const SECTIONS = {
  dashboard: Dashboard,
  deploy:    DeploymentPanel,
  domains:   DomainManager,
  files:     FileManager,
  databases: DatabaseManager,
  email:     EmailManager,
  ssl:       SSLManager,
  server:    ServerMonitor,
};

/**
 * AppShell — CSS Grid layout with collapsible sidebar.
 * Requirements: 1.1, 1.6–1.8, 12.1–12.4
 */
export default function AppShell() {
  const { activeSection } = useNavigation();
  const [expanded, setExpanded] = useState(() => window.innerWidth >= 1024);

  const ActiveSection = SECTIONS[activeSection] ?? Dashboard;

  return (
    <div className={`app-shell app-shell--${expanded ? 'expanded' : 'collapsed'}`}>
      <div className="app-shell__sidebar">
        <Sidebar expanded={expanded} onToggle={() => setExpanded((v) => !v)} />
      </div>
      <div className="app-shell__header">
        <Header />
      </div>
      <main className="app-shell__main">
        <ActiveSection />
      </main>
      <NotificationStack />
    </div>
  );
}
