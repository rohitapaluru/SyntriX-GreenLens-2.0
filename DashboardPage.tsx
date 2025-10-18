import React from 'react';
import type { User } from './types';
export default function DashboardPage({ user }: { user: User }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-600" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l2.09 6.26L20 9.27l-5 3.64L16.18 21 12 17.77 7.82 21 9 12.91l-5-3.64 5.91-.99L12 2z"/></svg>
          <span className="font-medium">{user.greenUnits} green units</span>
        </div>
      </div>
      <p>Reports submitted: {user.reports.length}</p>
      <div className="mt-4">
        {user.reports.length === 0 ? (
          <p className="text-sm text-slate-500">No reports yet — submit one to earn green units!</p>
        ) : (
          <ul className="space-y-3">
            {user.reports.map(r => (
              <li key={r.id} className="p-3 bg-white dark:bg-slate-800 rounded shadow-sm flex gap-4">
                {r.imageUrl ? (
                  <img src={r.imageUrl} alt="report" className="w-28 h-20 object-cover rounded" />
                ) : (
                  <div className="w-28 h-20 bg-slate-100 dark:bg-slate-700 rounded flex items-center justify-center text-xs text-slate-500">No image</div>
                )}
                <div className="flex-1">
                  <div className="text-sm text-slate-700 dark:text-slate-200">{r.description ?? 'Report'}</div>
                  <div className="text-xs text-slate-400">{new Date(r.timestamp).toLocaleString()}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}