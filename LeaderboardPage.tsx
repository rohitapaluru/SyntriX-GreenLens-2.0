import React from 'react';

type Entry = {
  id: string;
  name: string;
  points: number;
  avatarUrl?: string;
};

export default function LeaderboardPage() {
  const leaderboard: Entry[] = [
    { id: 'u1', name: 'sriram', points: 980, avatarUrl: '/assets/avatar1.png' },
    { id: 'u2', name: 'chandu', points: 870, avatarUrl: '/assets/avatar2.png' },
    { id: 'u3', name: 'mahesh', points: 820, avatarUrl: '/assets/avatar3.png' },
    { id: 'u4', name: 'tilak', points: 740 },
    { id: 'u5', name: 'rohitha', points: 690 },
    { id: 'u6', name: 'shiva', points: 640 },
  ];

  const sorted = [...leaderboard].sort((a, b) => b.points - a.points);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Leaderboard</h2>
        <p className="text-sm text-slate-500">{sorted.length} participants</p>
      </div>

      <ul className="space-y-3">
        {sorted.map((entry, idx) => (
          <li key={entry.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-sm font-medium">
                {entry.avatarUrl ? (
                  <img src={entry.avatarUrl} alt={entry.name} className="w-full h-full object-cover" />
                ) : (
                  entry.name.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase()
                )}
              </div>
              <div>
                <div className="font-medium capitalize">{entry.name}</div>
                <div className="text-xs text-slate-400">Rank #{idx + 1}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {idx === 0 && <span className="text-amber-500">🏆</span>}
              {idx === 1 && <span className="text-slate-400">🥈</span>}
              {idx === 2 && <span className="text-amber-700">🥉</span>}
              <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-full text-sm font-medium">
                {entry.points} pts
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}