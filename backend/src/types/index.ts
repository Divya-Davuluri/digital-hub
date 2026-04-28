export interface User {
  id: string;
  email: string;
  password?: string;
  role: 'user' | 'admin';
  two_factor_secret?: string | null;
  two_factor_enabled: number; // 0 or 1 for SQLite
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  created_at: string;
}

export interface UserOrganization {
  user_id: string;
  org_id: string;
  role: 'member' | 'admin';
}
