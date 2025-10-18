export type WasteType = 'Plastic' | 'Glass' | 'Metal' | 'Organic' | 'Other';

export type Report = {
  id: string;
  userId: string;
  timestamp: string | Date;
  status: 'Pending' | 'Accepted' | 'Rejected';
  description?: string;
  location?: { lat: number; lng: number };
  wasteType?: WasteType;
  // image for submitted report (data URL or hosted URL)
  imageUrl?: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  // avatar url (can be empty string)
  avatarUrl?: string;
  greenUnits: number;
  reports: Report[];
};

export type Organization = {
  id: string;
  name: string;
  email?: string;
};

export type Page = 'home' | 'dashboard' | 'leaderboard' | 'map';
