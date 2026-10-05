import { 
  Flashcard, 
  EducationalVideo, 
  LibraryDocument, 
  Announcement, 
  RoadmapMilestone, 
  TimeBlock,
  MindMap
} from '../types';

// Zero fake/mock data: Fully populated and managed exclusively by Admin via Firebase Firestore
export const INITIAL_ANNOUNCEMENTS: Announcement[] = [];

export const INITIAL_FLASHCARDS: Flashcard[] = [];

export const INITIAL_VIDEOS: EducationalVideo[] = [];

export const INITIAL_LIBRARY: LibraryDocument[] = [];

export const INITIAL_TIME_BLOCKS: TimeBlock[] = [];

export const INITIAL_ROADMAP: RoadmapMilestone[] = [];

export const INITIAL_MINDMAPS: MindMap[] = [];

export interface LeaderboardEntry {
  id: string;
  fullName: string;
  governorate: string;
  streakDays: number;
  studyHours: number;
  rank: number;
  badge: string;
}

export const SEED_LEADERBOARD: LeaderboardEntry[] = [];

export const SYRIAN_GOVERNORATES = [
  'دمشق',
  'ريف دمشق',
  'حلب',
  'حمص',
  'حماة',
  'اللاذقية',
  'طرطوس',
  'إدلب',
  'درعا',
  'السويداء',
  'القنيطرة',
  'دير الزور',
  'الحسكة',
  'الرقة'
];
