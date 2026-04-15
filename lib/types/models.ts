export type UserRole = "player" | "captain" | "admin";
export type ExperienceLevel = "Beginner" | "Intermediate" | "Semi-Pro" | "Pro";
export type PreferredRole = "Assaulter" | "Support" | "IGL" | "Sniper" | "Flexible";
export type AuctionState = "waiting" | "player_reveal" | "selection" | "sold" | "complete";

export interface User {
  id: string;
  username: string;
  email: string;
  emailVerified: boolean;
  role: UserRole;
  createdAt: string;
}

export interface PlayerProfile {
  userId: string;
  avatarUrl?: string;
  bgmiName: string;
  bgmiId: string;
  preferredRoles: PreferredRole[];
  bio: string;
  region: string;
  experience: ExperienceLevel;
  completionPercent: number;
  approved: boolean;
  stats: {
    kd?: number;
    avgDamage?: number;
    matches?: number;
    finisherRate?: number;
  };
}

export interface Captain {
  id: string;
  name: string;
  tag: string;
  region: string;
  pursePoints?: number;
}

export interface Tournament {
  id: string;
  name: string;
  game: "BGMI";
  timezone: "Asia/Kolkata";
  launchAtIST: string;
  startsAtIST: string;
  registrationOpen: boolean;
  prizePoolINR: number;
  format: string;
}

export interface AuctionPlayer {
  id: string;
  name: string;
  role: PreferredRole;
  region: string;
  style: string;
  soldToCaptainId?: string;
}

export interface AuctionRound {
  id: string;
  roundNumber: number;
  playerId: string;
  captainId?: string;
  state: AuctionState;
}

export interface Team {
  id: string;
  captainId: string;
  name: string;
  playerIds: string[];
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  priority: "low" | "medium" | "high";
}
