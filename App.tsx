// FIX: Replaced placeholder content with the main application component implementation.
import React, { useState, useCallback } from 'react';
import type { Page, User, Report, Organization } from './types';
import { mockUsers } from './data/mockData';
import LandingPage from './LandingPage';
import AuthPage from './AuthPage';
import OrganizationAuthPage from './OrganizationAuthPage';
import HomePage from './HomePage';
import DashboardPage from './DashboardPage';
import LeaderboardPage from './LeaderboardPage';
import MapPage from './MapPage';
import OrganizationPage from './OrganizationPage';
import Header from './components/Header';
import OrgHeader from './components/OrgHeader';

const mockOrganization: Organization = {
  id: 'org-1',
  name: 'Clean Earth Foundation',
  email: 'contact@cleaneart.org',
};

const App: React.FC = () => {
  const [userType, setUserType] = useState<'reporter' | 'organization' | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(mockUsers?.[0] ?? null);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(mockOrganization);
  const [activePage, setActivePage] = useState<Page>('home');

  const handleSelectUserType = (isOrg: boolean) => {
    setUserType(isOrg ? 'organization' : 'reporter');
  };

  const handleLogin = useCallback(() => {
    setIsAuthenticated(true);
    if (userType === 'organization') setActivePage('dashboard');
    else setActivePage('home');
  }, [userType]);

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
    setUserType(null);
    setActivePage('home');
  }, []);

  const handleNavigate = useCallback((page: Page) => {
    setActivePage(page);
  }, []);

  const handleReportSubmitted = useCallback((newReportData: Omit<Report, 'id' | 'userId' | 'timestamp' | 'status'>) => {
    if (!currentUser) return;
    const r: Report = {
      id: `r-${Date.now()}`,
      userId: currentUser.id,
      timestamp: new Date().toISOString(),
      status: 'Pending',
      ...newReportData,
    };
    const updated: User = { ...currentUser, reports: [...(currentUser.reports ?? []), r], greenUnits: (currentUser.greenUnits ?? 0) + 50 };
    setCurrentUser(updated);
  }, [currentUser]);

  // render flows
  if (!userType) {
    return <LandingPage onLogin={(isOrg) => handleSelectUserType(isOrg)} />;
  }

  if (!isAuthenticated) {
    return userType === 'organization' ? <OrganizationAuthPage onLogin={handleLogin} /> : <AuthPage onLogin={handleLogin} />;
  }

  if (userType === 'organization') {
    return (
      <div style={{ maxWidth: 1100, margin: '24px auto' }}>
        <OrgHeader org={currentOrg!} onLogout={handleLogout} />
        <div style={{ marginTop: 16 }}>
          <OrganizationPage />
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: '24px auto' }}>
      {currentUser && <Header user={currentUser} activePage={activePage} onNavigate={(p) => handleNavigate(p)} onLogout={handleLogout} />}
      <main style={{ marginTop: 16 }}>
        {activePage === 'home' && currentUser && <HomePage user={currentUser} onReportSubmitted={handleReportSubmitted} />}
        {activePage === 'dashboard' && currentUser && <DashboardPage user={currentUser} />}
        {activePage === 'leaderboard' && <LeaderboardPage />}
        {activePage === 'map' && <MapPage />}
      </main>
    </div>
  );
};

export default App;
