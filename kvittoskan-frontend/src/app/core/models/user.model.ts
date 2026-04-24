export interface User {
  id: string;
  email: string;
  displayName: string;
  initial: string;
  householdId?: string;
}

export interface HouseholdMember {
  id: string;
  displayName: string;
  initial: string;
  color: string;
  fg: string;
}

export interface Household {
  id: string;
  name: string;
  members: HouseholdMember[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}
