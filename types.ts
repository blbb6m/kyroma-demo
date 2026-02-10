
export enum UserRole {
  PHOTOGRAPHER = 'PHOTOGRAPHER',
  EVENT_OWNER = 'EVENT_OWNER',
  DEV = 'dev'
}

export enum ExperienceLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  PROFESSIONAL = 'PROFESSIONAL'
}

export enum PhotoPackageType {
  BASIC = 'BASIC',
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM'
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  experienceLevel?: ExperienceLevel;
  avatarUrl: string;
  city?: string;
  state?: string; 
  zipCode?: string;
  coordinates?: Coordinates;
  bio?: string;
  website?: string;
  instagram?: string;
  joinedDate?: string;
  // Strategic Fields
  skills: string[];
  targetRole?: string;
  careerGoals?: string;
  portfolioGaps?: string[];
}

export interface JobRole {
  id: string;
  title: string;
  description: string;
  minBudget: number;
  maxBudget: number;
  filled: boolean;
}

export interface ImageSubmission {
  id: string;
  url: string;
  object_key: string;
  photographerName: string;
  photographerId: string;
  type: 'OFFICIAL' | 'OPEN_SHOOT';
  submittedAt: string;
}

export interface Event {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  date: string;
  endDate?: string;
  isAllDay: boolean;
  location: string;
  zipCode?: string;
  coordinates?: Coordinates;
  imageUrl: string;
  isOpenShoot: boolean;
  openShootApprovalRequired?: boolean;
  roles: JobRole[];
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'PENDING_APPROVAL' | 'POTENTIAL';
  tags: string[];
  submissions?: ImageSubmission[];
  packageType: PhotoPackageType;
  photoLimit: number;
  sourceUrls?: string[];
}

export interface Bid {
  id: string;
  eventId: string;
  eventOwnerId: string;
  roleId?: string;
  photographerId: string;
  photographerName: string;
  amount: number;
  message: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED' | 'WITHDRAWN';
  submittedAt: string;
  type: 'PAID' | 'OPEN_SHOOT';
  rejectionReason?: string;
  counterOfferAmount?: number;
}
