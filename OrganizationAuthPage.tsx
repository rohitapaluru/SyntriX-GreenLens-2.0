import React from 'react';
import Button from '../components/Button';

interface OrganizationAuthPageProps {
  onLogin: () => void;
}

const OrganizationAuthPage: React.FC<OrganizationAuthPageProps> = ({ onLogin }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center animate-slide-in-up">
        <h1 className="text-4xl font-extrabold text-sky-600 dark:text-sky-400 mb-2">
          Organization Portal
        </h1>
        <p className="text-slate-600 dark:text-slate-300 mb-8">
          Access your dashboard to manage and verify waste reports.
        </p>
        <Button size="lg" onClick={onLogin} className="w-full bg-sky-500 hover:bg-sky-600 focus:ring-sky-500">
          Log In
        </Button>
         <p className="text-sm text-slate-500 mt-6">
            This is a demo. Clicking "Log In" will sign you in with a mock organization account.
        </p>
      </div>
    </div>
  );
};

export default OrganizationAuthPage;
