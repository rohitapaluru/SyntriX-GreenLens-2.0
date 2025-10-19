import React from 'react';
import Button from '../components/Button';

interface AuthPageProps {
  onLogin: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center animate-slide-in-up">
        <h1 className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 mb-2">
          Welcome Reporter!
        </h1>
        <p className="text-slate-600 dark:text-slate-300 mb-8">
          Ready to make a difference? Log in to start reporting.
        </p>
        <Button size="lg" onClick={onLogin} className="w-full">
          Log In
        </Button>
        <p className="text-sm text-slate-500 mt-6">
            This is a demo. Clicking "Log In" will sign you in with a mock account.
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
