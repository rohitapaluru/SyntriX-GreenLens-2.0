
export type WasteType = 'Plastic' | 'Organic' | 'E-waste' | 'Metal' | 'Glass' | 'Paper' | 'Other';

export interface Report {
  id: string;
  userId: string;
  imageUrl: string;
  location: {
    lat: number;
    lng: number;
  };
  wasteType: WasteType;
  confidence: number;
  note?: string;
  timestamp: Date;
  status: 'Pending' | 'Verified' | 'Cleaned';
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  greenUnits: number;
  reports: Report[];
}

export interface LeaderboardUser {
  id: string;
  name: string;
  avatarUrl: string;
  greenUnits: number;
  rank: number;
}

export interface Organization {
  id: string;
  name: string;
  email: string;
}

export type Page = 'home' | 'dashboard' | 'leaderboard' | 'organization' | 'map';
