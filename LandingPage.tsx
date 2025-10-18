import React from 'react';
import Button from '../components/Button';

interface LandingPageProps {
  onLogin: (isOrg: boolean) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-2xl animate-slide-in-up">
        <h1 className="text-5xl md:text-7xl font-extrabold text-emerald-600 dark:text-emerald-400">
          GreenGuard
        </h1>
        <p className="mt-4 text-lg md:text-xl text-slate-600 dark:text-slate-300">
          Join the movement. Report environmental waste, earn GreenUnits, and help us build a cleaner planet, one picture at a time.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" onClick={() => onLogin(false)}>
            I'm a Reporter
          </Button>
          <Button size="lg" variant="secondary" onClick={() => onLogin(true)}>
            I'm an Organization
          </Button>
        </div>
      </div>
      <footer className="absolute bottom-4 text-slate-500 dark:text-slate-400 text-sm">
        <p>Powered by AI, driven by community.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
