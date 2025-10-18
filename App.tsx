// FIX: Replaced placeholder content with the main application component implementation.
import React, { useState, useCallback } from 'react';
import type { Page, User, Report, Organization } from './types';
import { mockUsers } from './data/mockData';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import OrganizationAuthPage from './pages/OrganizationAuthPage';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import LeaderboardPage from './pages/LeaderboardPage';
import MapPage from './pages/MapPage';
import OrganizationPage from './pages/OrganizationPage';
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [activePage, setActivePage] = useState<Page>('home');

  const handleSelectUserType = (isOrg: boolean) => {
    setUserType(isOrg ? 'organization' : 'reporter');
  };

  const handleLogin = useCallback(() => {
    if (userType === 'reporter') {
      setCurrentUser(mockUsers[0]); // Log in as Alex Green
    } else if (userType === 'organization') {
      setCurrentOrg(mockOrganization);
    }
    setIsAuthenticated(true);
  }, [userType]);

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentOrg(null);
    setUserType(null); // Go back to landing page
    setActivePage('home');
  }, []);

  const handleNavigate = useCallback((page: Page) => {
    setActivePage(page);
  }, []);

  const handleReportSubmitted = useCallback((newReportData: Omit<Report, 'id' | 'userId' | 'timestamp' | 'status'>) => {
    setCurrentUser(prevUser => {
      if (!prevUser) return null;

      const newReport: Report = {
        ...newReportData,
        id: `report-${Date.now()}`,
        userId: prevUser.id,
        timestamp: new Date(),
        status: 'Pending',
      };
      
      return {
        ...prevUser,
        reports: [newReport, ...prevUser.reports],
        greenUnits: prevUser.greenUnits + 50, // Award 50 points
      };
    });
    setActivePage('dashboard'); // Navigate to dashboard to see the new report
  }, []);

  const renderReporterPage = () => {
    if (!currentUser) return null;
    switch (activePage) {
      case 'home':
        return <HomePage user={currentUser} onReportSubmitted={handleReportSubmitted} />;
      case 'dashboard':
        return <DashboardPage user={currentUser} />;
      case 'leaderboard':
        return <LeaderboardPage />;
      case 'map':
        return <MapPage />;
      default:
        return <HomePage user={currentUser} onReportSubmitted={handleReportSubmitted} />;
    }
  };

  if (!userType) {
    return <LandingPage onLogin={handleSelectUserType} />;
  }

  if (!isAuthenticated) {
    if (userType === 'reporter') {
      return <AuthPage onLogin={handleLogin} />;
    }
    if (userType === 'organization') {
      return <OrganizationAuthPage onLogin={handleLogin} />;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50">
      {userType === 'reporter' && currentUser && (
        <>
          <Header user={currentUser} activePage={activePage} onNavigate={handleNavigate} onLogout={handleLogout} />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {renderReporterPage()}
          </main>
        </>
      )}
      {userType === 'organization' && currentOrg && (
         <>
          <OrgHeader org={currentOrg} onLogout={handleLogout} />
           <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <OrganizationPage />
           </main>
         </>
      )}
    </div>
  );
};

export default App;
