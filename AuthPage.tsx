import React, { useState } from 'react';
import Button from './components/Button';

export default function AuthPage({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    if (!email) return 'Please enter your email';
    // simple email regex
    if (!/^\S+@\S+\.\S+$/.test(email)) return 'Enter a valid email';
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
      // In this demo we don't have a backend — log credentials for dev debugging
      // eslint-disable-next-line no-console
      console.debug('[AuthPage] login attempt', { email, password });
      // call parent login handler (App.tsx currently accepts no args)
      onLogin();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white dark:bg-slate-800 rounded-lg shadow">
      <h1 className="text-2xl font-semibold mb-4">Sign in</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full p-2 border rounded bg-slate-50 dark:bg-slate-900"
            placeholder="you@example.com"
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
          <button type="button" className="text-sm text-slate-500" onClick={() => { setEmail(''); setPassword(''); setError(null); }}>
            Clear
          </button>
        </div>
      </form>
    </div>
  );
}
