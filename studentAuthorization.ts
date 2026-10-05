/**
 * BAC-240 Student Platform
 * Student Authorization Preparation & Firestore Ownership Contract (Prompt 4)
 * 
 * Central contract boundary responsible for:
 * 1. Defining the canonical Firestore Access Inventory for all Student-side collections.
 * 2. Enforcing student ownership contract for all Firestore mutations prior to upcoming Security Rules.
 * 3. Preventing client-side privilege escalation (blocking mutation of role, isAdmin, isPaid, etc.).
 * 4. Verifying that the authenticated Firebase Auth UID matches the student document ownership.
 * 5. Guaranteeing that localStorage or device ID cannot grant backend authorization on their own.
 */

import { StudentSession } from '../types';
import { 
  getCurrentStudentSession, 
  UnauthorizedStudentAccessError 
} from './studentSession';
import { 
  getCurrentStudentAuthUid 
} from './studentAuth';

/**
 * Access scope categories for Firestore collections used by the Student Portal
 */
export type StudentAccessScope = 
  | 'STUDENT_PRIVATE'     // Data owned by the student; read/write/delete restricted strictly to matching firebaseAuthUid
  | 'PUBLIC_READ'         // Shared educational and system content; read-only for students, writes strictly forbidden
  | 'COMMUNITY_READ'      // Public leaderboard query; read-only with non-sensitive fields
  | 'ACTIVATION_FLOW'     // Code verification and activation flow
  | 'ADMIN_EXCLUSIVE';    // Administrative collections; zero student access

/**
 * Typed Firestore Collection Inventory Item
 */
export interface StudentFirestoreInventoryItem {
  collection: string;
  pathPattern: string;
  description: string;
  scope: StudentAccessScope;
  allowedOperations: ('read' | 'create' | 'update' | 'delete' | 'listen')[];
  requiresFirebaseAuth: boolean;
  ownershipRule: string;
  mutableFieldsByStudent?: readonly string[];
  forbiddenFields?: readonly string[];
}

/**
 * Allowed mutable fields for student progress and profile self-updates
 */
export const STUDENT_ALLOWED_MUTABLE_FIELDS = [
  'points',
  'streak',
  'streakDays',
  'completedLessons',
  'completedLessonsCount',
  'completedTaskIds',
  'mistakesBank',
  'mistakesCount',
  'unresolvedMistakesCount',
  'lastActive',
  'updatedAt',
  'totalStudyHours',
  'lastLogin',
  'deviceId',
  'isDevicePaired',
  'studyPlan',
  'name',
  'avatar',
  'city',
  'branch',
  'phone',
  'phoneNumber'
] as const;

/**
 * Privileged fields that students are STRICTLY FORBIDDEN from modifying
 */
export const STUDENT_FORBIDDEN_MUTABLE_FIELDS = [
  'role',
  'isAdmin',
  'isPaid',
  'isOwner',
  'adminRole',
  'permissions',
  'activationCode',
  'studentCode',
  'registeredAt',
  'firebaseAuthUid' // Only the dedicated studentAuth persistence service may write this
] as const;

/**
 * Central Inventory of all Firestore collections and documents accessed by BAC-240 Student Platform
 */
export const STUDENT_FIRESTORE_ACCESS_INVENTORY: Record<string, StudentFirestoreInventoryItem> = {
  students: {
    collection: 'students',
    pathPattern: 'students/{studentDocId}',
    description: 'Student private profile, progress counters, streaks, completed tasks, and mistakes bank',
    scope: 'STUDENT_PRIVATE',
    allowedOperations: ['read', 'create', 'update', 'delete', 'listen'],
    requiresFirebaseAuth: true,
    ownershipRule: 'request.auth != null && (request.auth.uid == resource.data.firebaseAuthUid || resource == null)',
    mutableFieldsByStudent: STUDENT_ALLOWED_MUTABLE_FIELDS,
    forbiddenFields: STUDENT_FORBIDDEN_MUTABLE_FIELDS
  },
  users: {
    collection: 'users',
    pathPattern: 'users/{studentDocId}',
    description: 'Mirrored student profile maintained for 100% backward compatibility with Admin portal',
    scope: 'STUDENT_PRIVATE',
    allowedOperations: ['read', 'create', 'update', 'delete', 'listen'],
    requiresFirebaseAuth: true,
    ownershipRule: 'request.auth != null && (request.auth.uid == resource.data.firebaseAuthUid || resource == null)',
    mutableFieldsByStudent: STUDENT_ALLOWED_MUTABLE_FIELDS,
    forbiddenFields: STUDENT_FORBIDDEN_MUTABLE_FIELDS
  },
  announcements: {
    collection: 'announcements',
    pathPattern: 'announcements/{announcementId}',
    description: 'Platform announcements and broadcasts published by administration',
    scope: 'PUBLIC_READ',
    allowedOperations: ['read', 'listen'],
    requiresFirebaseAuth: false,
    ownershipRule: 'read: true; write: false;'
  },
  flashcardDecks: {
    collection: 'flashcardDecks',
    pathPattern: 'flashcardDecks/{deckId}',
    description: 'Curriculum flashcard decks grouped by subject',
    scope: 'PUBLIC_READ',
    allowedOperations: ['read', 'listen'],
    requiresFirebaseAuth: false,
    ownershipRule: 'read: true; write: false;'
  },
  flashcard_decks: {
    collection: 'flashcard_decks',
    pathPattern: 'flashcard_decks/{deckId}',
    description: 'Legacy alternate flashcard decks collection for backward compatibility',
    scope: 'PUBLIC_READ',
    allowedOperations: ['read', 'listen'],
    requiresFirebaseAuth: false,
    ownershipRule: 'read: true; write: false;'
  },
  flashcards: {
    collection: 'flashcards',
    pathPattern: 'flashcards/{cardId}',
    description: 'Flashcards content items',
    scope: 'PUBLIC_READ',
    allowedOperations: ['read', 'listen'],
    requiresFirebaseAuth: false,
    ownershipRule: 'read: true; write: false;'
  },
  youtubeChannels: {
    collection: 'youtubeChannels',
    pathPattern: 'youtubeChannels/{channelId}',
    description: 'Curated educational YouTube channels recommended by teachers',
    scope: 'PUBLIC_READ',
    allowedOperations: ['read', 'listen'],
    requiresFirebaseAuth: false,
    ownershipRule: 'read: true; write: false;'
  },
  youtubePlaylists: {
    collection: 'youtubePlaylists',
    pathPattern: 'youtubePlaylists/{playlistId}',
    description: 'Curated educational video playlists',
    scope: 'PUBLIC_READ',
    allowedOperations: ['read', 'listen'],
    requiresFirebaseAuth: false,
    ownershipRule: 'read: true; write: false;'
  },
  videos: {
    collection: 'videos',
    pathPattern: 'videos/{videoId}',
    description: 'Legacy educational videos collection',
    scope: 'PUBLIC_READ',
    allowedOperations: ['read', 'listen'],
    requiresFirebaseAuth: false,
    ownershipRule: 'read: true; write: false;'
  },
  youtubeVideos: {
    collection: 'youtubeVideos',
    pathPattern: 'youtubeVideos/{videoId}',
    description: 'Educational YouTube video entries with subject tags',
    scope: 'PUBLIC_READ',
    allowedOperations: ['read', 'listen'],
    requiresFirebaseAuth: false,
    ownershipRule: 'read: true; write: false;'
  },
  studyFiles: {
    collection: 'studyFiles',
    pathPattern: 'studyFiles/{fileId}',
    description: 'Curriculum PDFs, summary sheets, and exam archives',
    scope: 'PUBLIC_READ',
    allowedOperations: ['read', 'listen'],
    requiresFirebaseAuth: false,
    ownershipRule: 'read: true; write: false;'
  },
  library: {
    collection: 'library',
    pathPattern: 'library/{fileId}',
    description: 'Legacy study library files collection',
    scope: 'PUBLIC_READ',
    allowedOperations: ['read', 'listen'],
    requiresFirebaseAuth: false,
    ownershipRule: 'read: true; write: false;'
  },
  roadmap: {
    collection: 'roadmap',
    pathPattern: 'roadmap/{subjectId}',
    description: 'Curriculum syllabus, subject roadmaps, and units',
    scope: 'PUBLIC_READ',
    allowedOperations: ['read', 'listen'],
    requiresFirebaseAuth: false,
    ownershipRule: 'read: true; write: false;'
  },
  curriculum: {
    collection: 'curriculum',
    pathPattern: 'curriculum/{itemId}',
    description: 'Legacy curriculum structure collection',
    scope: 'PUBLIC_READ',
    allowedOperations: ['read', 'listen'],
    requiresFirebaseAuth: false,
    ownershipRule: 'read: true; write: false;'
  },
  mindmaps: {
    collection: 'mindmaps',
    pathPattern: 'mindmaps/{mapId}',
    description: 'Visual mindmaps for visual summary of complex topics',
    scope: 'PUBLIC_READ',
    allowedOperations: ['read', 'listen'],
    requiresFirebaseAuth: false,
    ownershipRule: 'read: true; write: false;'
  },
  schedule: {
    collection: 'schedule',
    pathPattern: 'schedule/{slotId}',
    description: 'Weekly schedule template and broadcast timetable',
    scope: 'PUBLIC_READ',
    allowedOperations: ['read', 'listen'],
    requiresFirebaseAuth: false,
    ownershipRule: 'read: true; write: false;'
  },
  lesson_attachments: {
    collection: 'lesson_attachments',
    pathPattern: 'lesson_attachments/{docId}',
    description: 'Attachments associated with specific curriculum lessons',
    scope: 'PUBLIC_READ',
    allowedOperations: ['read', 'listen'],
    requiresFirebaseAuth: false,
    ownershipRule: 'read: true; write: false;'
  },
  examCountdowns: {
    collection: 'examCountdowns',
    pathPattern: 'examCountdowns/{examId}',
    description: 'Official Ministry of Education exam date timers and schedules',
    scope: 'PUBLIC_READ',
    allowedOperations: ['read', 'listen'],
    requiresFirebaseAuth: false,
    ownershipRule: 'read: true; write: false;'
  },
  exams: {
    collection: 'exams',
    pathPattern: 'exams/{examId}',
    description: 'Published interactive student practice exams',
    scope: 'PUBLIC_READ',
    allowedOperations: ['read', 'listen'],
    requiresFirebaseAuth: false,
    ownershipRule: 'read: resource.data.isPublished == true; write: false;'
  },
  systemSettings: {
    collection: 'systemSettings',
    pathPattern: 'systemSettings/{configDocId}',
    description: 'Platform operational flags, maintenance mode, and general system config',
    scope: 'PUBLIC_READ',
    allowedOperations: ['read', 'listen'],
    requiresFirebaseAuth: false,
    ownershipRule: 'read: true; write: false;'
  },
  planWeeks: {
    collection: 'planWeeks',
    pathPattern: 'planWeeks/{weekDocId}',
    description: 'Guided 36-week curriculum study plan contents and daily task definitions',
    scope: 'PUBLIC_READ',
    allowedOperations: ['read', 'listen'],
    requiresFirebaseAuth: false,
    ownershipRule: 'read: true; write: false;'
  },
  studyPlans: {
    collection: 'studyPlans',
    pathPattern: 'studyPlans/{planDocId}',
    description: 'Study plan metadata and configurations',
    scope: 'PUBLIC_READ',
    allowedOperations: ['read', 'listen'],
    requiresFirebaseAuth: false,
    ownershipRule: 'read: true; write: false;'
  },
  curriculumKnowledge: {
    collection: 'curriculumKnowledge',
    pathPattern: 'curriculumKnowledge/{knowledgeDocId}',
    description: 'AI grounding curriculum database for smart study explanations',
    scope: 'PUBLIC_READ',
    allowedOperations: ['read', 'listen'],
    requiresFirebaseAuth: false,
    ownershipRule: 'read: true; write: false;'
  },
  activationCodes: {
    collection: 'activationCodes',
    pathPattern: 'activationCodes/{codeDocId}',
    description: 'Student registration cards and activation codes',
    scope: 'ACTIVATION_FLOW',
    allowedOperations: ['read', 'update'],
    requiresFirebaseAuth: false,
    ownershipRule: 'read: true; update: resource.data.isUsed != true && request.resource.data.isUsed == true;'
  },
  leaderboard: {
    collection: 'leaderboard',
    pathPattern: 'leaderboard/{studentId}',
    description: 'Public student leaderboard entries containing only public ranking metrics',
    scope: 'COMMUNITY_READ',
    allowedOperations: ['read', 'create', 'update', 'delete', 'listen'],
    requiresFirebaseAuth: false,
    ownershipRule: 'read: true; write: isVerifiedAdmin() || (request.auth != null && resource.data.firebaseAuthUid == request.auth.uid);',
    mutableFieldsByStudent: [
      'id',
      'studentId',
      'fullName',
      'name',
      'governorate',
      'streakDays',
      'streak',
      'studyHours',
      'totalStudyHours',
      'rankTitle',
      'badge',
      'points',
      'completedLessonsCount',
      'updatedAt',
      'firebaseAuthUid'
    ],
    forbiddenFields: STUDENT_FORBIDDEN_MUTABLE_FIELDS
  },
  admins: {
    collection: 'admins',
    pathPattern: 'admins/{adminUid}',
    description: 'Administrative permissions and control center credentials',
    scope: 'ADMIN_EXCLUSIVE',
    allowedOperations: [],
    requiresFirebaseAuth: true,
    ownershipRule: 'read: false; write: false;'
  }
};

/**
 * Runtime Student Authorization Context
 */
export interface StudentAuthorizationContext {
  isAuthenticated: boolean;
  authUid: string | null;
  session: StudentSession | null;
  canonicalDocId: string | null;
  isIdentityBound: boolean;
}

// Internal testing override hook
let testAuthContextOverride: StudentAuthorizationContext | null = null;

export function setStudentAuthContextOverrideForTesting(override: StudentAuthorizationContext | null): void {
  testAuthContextOverride = override;
}

/**
 * Resolves current Student Authorization Context using active session and Firebase Auth state
 */
export function getStudentAuthContext(): StudentAuthorizationContext {
  if (testAuthContextOverride) {
    return testAuthContextOverride;
  }

  const session = getCurrentStudentSession();
  const authUid = getCurrentStudentAuthUid();

  const isAuthenticated = !!(session && session.authenticated);
  const canonicalDocId = session ? (session.docId || session.studentCode || session.studentId) : null;
  
  // Identity is bound when both session and Firebase Auth exist and their UIDs are consistent
  const isIdentityBound = !!(
    isAuthenticated && 
    authUid && 
    session.firebaseAuthUid && 
    session.firebaseAuthUid === authUid
  );

  return {
    isAuthenticated,
    authUid,
    session,
    canonicalDocId,
    isIdentityBound
  };
}

/**
 * Sanitizes student update payloads to prevent privilege escalation
 * Automatically removes forbidden fields (role, isAdmin, isPaid, activationCode, firebaseAuthUid, etc.)
 */
export function sanitizeStudentUpdates(updates: Record<string, any>): Record<string, any> {
  if (!updates || typeof updates !== 'object') {
    return {};
  }

  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(updates)) {
    // Check top-level forbidden keys
    if (STUDENT_FORBIDDEN_MUTABLE_FIELDS.includes(key as any)) {
      console.warn(`[StudentAuthorization] Blocked attempt to mutate protected field "${key}".`);
      continue;
    }

    // Check nested keys or atomic paths (e.g. "role.admin" or "completedTaskIds.xxx")
    const topLevelKey = key.split('.')[0];
    if (STUDENT_FORBIDDEN_MUTABLE_FIELDS.includes(topLevelKey as any)) {
      console.warn(`[StudentAuthorization] Blocked attempt to mutate protected path "${key}".`);
      continue;
    }

    sanitized[key] = value;
  }

  return sanitized;
}

/**
 * Verifies whether an update operation on a student document is authorized
 * 
 * Enforces:
 * 1. An active, authenticated student session must exist.
 * 2. An active Firebase Auth identity must exist.
 * 3. The target student document ID must match the authenticated student.
 * 4. If the session has a bound firebaseAuthUid, it must match the active Firebase Auth currentUser.
 */
export function verifyStudentWritePermission(
  targetStudentDocId: string,
  updates?: Record<string, any>
): { allowed: boolean; reason?: string; sanitizedUpdates?: Record<string, any> } {
  const context = getStudentAuthContext();

  if (!context.isAuthenticated || !context.session) {
    return {
      allowed: false,
      reason: 'No active authenticated student session found.'
    };
  }

  if (!context.authUid) {
    return {
      allowed: false,
      reason: 'No authenticated Firebase Auth user found. Anonymous Auth is required for Firestore operations.'
    };
  }

  // Verify target document matches current session identity
  const cleanTarget = targetStudentDocId?.trim();
  if (!cleanTarget) {
    return {
      allowed: false,
      reason: 'Target student document identifier is empty.'
    };
  }

  const ownsDocument = 
    cleanTarget === context.session.docId ||
    cleanTarget === context.session.studentCode ||
    cleanTarget === context.session.studentId;

  if (!ownsDocument) {
    return {
      allowed: false,
      reason: `Unauthorized cross-student modification: Session (${context.session.studentCode || context.session.studentId}) does not own target (${cleanTarget}).`
    };
  }

  // Verify Firebase Auth UID consistency
  if (context.session.firebaseAuthUid && context.session.firebaseAuthUid !== context.authUid) {
    return {
      allowed: false,
      reason: `Firebase Auth UID mismatch: Session bound to [${context.session.firebaseAuthUid}] but active Auth UID is [${context.authUid}].`
    };
  }

  // Sanitize updates if provided
  const sanitizedUpdates = updates ? sanitizeStudentUpdates(updates) : undefined;

  return {
    allowed: true,
    sanitizedUpdates
  };
}

/**
 * Asserts student write permission, throwing UnauthorizedStudentAccessError if not permitted
 */
export function assertStudentWritePermission(
  targetStudentDocId: string,
  updates?: Record<string, any>
): Record<string, any> {
  const check = verifyStudentWritePermission(targetStudentDocId, updates);
  if (!check.allowed) {
    throw new UnauthorizedStudentAccessError(targetStudentDocId, check.reason || 'Unauthorized student mutation');
  }
  return check.sanitizedUpdates || {};
}

/**
 * Verifies whether account deletion is permitted for the target student
 */
export function verifyStudentDeletePermission(
  targetStudentDocId: string
): { allowed: boolean; reason?: string } {
  const context = getStudentAuthContext();

  if (!context.isAuthenticated || !context.session) {
    return {
      allowed: false,
      reason: 'No active authenticated student session found.'
    };
  }

  if (!context.authUid) {
    return {
      allowed: false,
      reason: 'No authenticated Firebase Auth user found. Anonymous Auth is required for account deletion.'
    };
  }

  const cleanTarget = targetStudentDocId?.trim();
  if (!cleanTarget) {
    return {
      allowed: false,
      reason: 'Target student document identifier is empty.'
    };
  }

  const ownsDocument = 
    cleanTarget === context.session.docId ||
    cleanTarget === context.session.studentCode ||
    cleanTarget === context.session.studentId;

  if (!ownsDocument) {
    return {
      allowed: false,
      reason: `Unauthorized account deletion: Caller does not own target student record (${cleanTarget}).`
    };
  }

  if (context.session.firebaseAuthUid && context.session.firebaseAuthUid !== context.authUid) {
    return {
      allowed: false,
      reason: `Firebase Auth UID mismatch: Session bound to [${context.session.firebaseAuthUid}] but active Auth UID is [${context.authUid}].`
    };
  }

  return { allowed: true };
}

/**
 * Asserts student delete permission, throwing if unauthorized
 */
export function assertStudentDeletePermission(targetStudentDocId: string): void {
  const check = verifyStudentDeletePermission(targetStudentDocId);
  if (!check.allowed) {
    throw new UnauthorizedStudentAccessError(targetStudentDocId, check.reason || 'Unauthorized student deletion');
  }
}

/**
 * Verifies whether a given operation on a Firestore collection is permitted under the Student contract
 */
export function isAuthorizedStudentCollection(
  collectionName: string,
  operation: 'read' | 'create' | 'update' | 'delete' | 'listen'
): boolean {
  const item = STUDENT_FIRESTORE_ACCESS_INVENTORY[collectionName];
  if (!item) {
    return false;
  }

  if (item.scope === 'ADMIN_EXCLUSIVE') {
    return false;
  }

  if (item.scope === 'PUBLIC_READ') {
    // Only read and listen operations are allowed on public educational collections
    return operation === 'read' || operation === 'listen';
  }

  if (item.scope === 'COMMUNITY_READ') {
    return operation === 'read' || operation === 'listen';
  }

  return item.allowedOperations.includes(operation);
}
