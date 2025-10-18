import React, { useState } from 'react';
import Button from './components/Button';

interface OrganizationAuthPageProps {
  onLogin: () => void;
}

const OrganizationAuthPage: React.FC<OrganizationAuthPageProps> = ({ onLogin }) => {
  const [orgEmail, setOrgEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    if (!orgEmail) return 'Please enter organization email';
    if (!/^\S+@\S+\.\S+$/.test(orgEmail)) return 'Enter a valid email';
    if (!password || password.length < 6) return 'Password must be at least 6 characters';
    return null;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      // eslint-disable-next-line no-console
      console.debug('[OrganizationAuthPage] login attempt', { orgEmail, password });
      onLogin();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white dark:bg-slate-800 rounded-lg shadow">
      <h1 className="text-2xl font-semibold mb-4">Organization Sign in</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Organization Email</label>
          <input
            type="email"
            value={orgEmail}
            onChange={e => setOrgEmail(e.target.value)}
            className="w-full p-2 border rounded bg-slate-50 dark:bg-slate-900"
            placeholder="org@example.org"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full p-2 border rounded bg-slate-50 dark:bg-slate-900"
            placeholder="Enter your password"
            required
          />
        </div>

        {error && <div className="text-sm text-rose-500">{error}</div>}

        <div className="flex items-center justify-between">
          <Button type="submit" isLoading={isSubmitting}>Sign in</Button>
          <button type="button" className="text-sm text-slate-500" onClick={() => { setOrgEmail(''); setPassword(''); setError(null); }}>
            Clear
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrganizationAuthPage;
