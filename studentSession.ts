/**
 * BAC-240 Student Platform
 * Centralized Student Identity & Session Access Layer
 * 
 * Boundary responsible for:
 * 1. Managing student identity and session state.
 * 2. Centralizing storage keys and safe storage access.
 * 3. Building safe, canonical Firestore student document and subcollection paths.
 * 4. Providing a frontend-level ownership guard for student-owned operations.
 * 
 * NOTE: This is a frontend architectural boundary preparing for Firebase Auth / Rules.
 * It does NOT replace authoritative Firestore Security Rules.
 */

import { StudentSession, UserProfile } from '../types';

/**
 * Centralized localStorage and sessionStorage keys for student identity and session data.
 */
export const STUDENT_STORAGE_KEYS = {
  CURRENT_USER: 'bac240_current_user',
  AUTHENTICATED_USER: 'bac240_authenticated_user',
  LOCAL_USER_PREFIX: 'bac240_local_user_',
  DEVICE_ID: 'bac240_device_id',
  AUTH_ATTEMPTS: 'bac240_auth_attempts',
  AUTH_LOCKED_UNTIL: 'bac240_auth_locked_until',
  STREAKS_RESET_MIGRATION: 'bac240_streaks_reset_2026',
  CURRENT_SESSION: 'bac240_current_session',
} as const;

export type StudentStorageKey = typeof STUDENT_STORAGE_KEYS[keyof typeof STUDENT_STORAGE_KEYS];

/**
 * Base error for student session operations.
 */
export class StudentSessionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StudentSessionError';
    Object.setPrototypeOf(this, StudentSessionError.prototype);
  }
}

/**
 * Error thrown when a student attempts an operation on data not owned by their active session.
 */
export class UnauthorizedStudentAccessError extends StudentSessionError {
  public readonly targetDocId: string;
  public readonly activeStudentId?: string;

  constructor(targetDocId: string, activeStudentId?: string) {
    super(`Unauthorized student operation: Target [${targetDocId}] does not match active student session [${activeStudentId || 'unauthenticated'}].`);
    this.name = 'UnauthorizedStudentAccessError';
    this.targetDocId = targetDocId;
    this.activeStudentId = activeStudentId;
    Object.setPrototypeOf(this, UnauthorizedStudentAccessError.prototype);
  }
}

/**
 * Safe storage helper that handles SSR, unavailable storage, and JSON errors gracefully.
 */
export function readStudentStorage<T = unknown>(key: string): T | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw || raw === 'undefined' || raw === 'null') {
      return null;
    }
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[StudentSession] Failed to read or parse storage key "${key}":`, err);
    return null;
  }
}

/**
 * Safe storage writer.
 */
export function writeStudentStorage(key: string, value: unknown): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  try {
    if (value === undefined || value === null) {
      window.localStorage.removeItem(key);
      return true;
    }
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    window.localStorage.setItem(key, serialized);
    return true;
  } catch (err) {
    console.warn(`[StudentSession] Failed to write storage key "${key}":`, err);
    return false;
  }
}

/**
 * Safe storage remover.
 */
export function removeStudentStorage(key: string): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates and normalizes raw data into a strictly typed StudentSession.
 * Returns null if the data is malformed or missing essential identity attributes.
 */
export function validateStudentSession(raw: unknown): StudentSession | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const obj = raw as Record<string, unknown>;

  // A valid session must have at least one usable identifier: docId, studentCode, or id
  const rawDocId = typeof obj.docId === 'string' && obj.docId.trim() ? obj.docId.trim() : '';
  const rawCode = typeof obj.studentCode === 'string' && obj.studentCode.trim() ? obj.studentCode.trim() : '';
  const rawId = typeof obj.id === 'string' && obj.id.trim() ? obj.id.trim() : '';
  const rawBacId = typeof obj.bacId === 'string' && obj.bacId.trim() ? obj.bacId.trim() : '';

  const docId = rawDocId || rawCode || rawId || rawBacId;
  const studentCode = rawCode || rawDocId || rawId || rawBacId;
  const studentId = rawId || rawBacId || (rawCode ? `STU-240-${rawCode.slice(-4)}` : docId);

  if (!docId || !studentCode) {
    return null;
  }

  const phoneNumber = typeof obj.phoneNumber === 'string' 
    ? obj.phoneNumber.trim() 
    : (typeof obj.phone === 'string' ? obj.phone.trim() : '');

  const deviceId = typeof obj.deviceId === 'string' ? obj.deviceId.trim() : '';
  const fullName = typeof obj.fullName === 'string' 
    ? obj.fullName.trim() 
    : (typeof obj.name === 'string' ? obj.name.trim() : 'طالب بكالوريا علمي');

  const governorate = typeof obj.governorate === 'string' && obj.governorate.trim() 
    ? obj.governorate.trim() 
    : 'دمشق';

  const registeredAt = typeof obj.registeredAt === 'string' 
    ? obj.registeredAt 
    : (typeof obj.createdAt === 'string' ? obj.createdAt : undefined);

  const firebaseAuthUid = typeof obj.firebaseAuthUid === 'string' && obj.firebaseAuthUid.trim()
    ? obj.firebaseAuthUid.trim()
    : undefined;

  return {
    studentId,
    docId,
    studentCode,
    phoneNumber,
    deviceId,
    fullName,
    governorate,
    authenticated: true,
    registeredAt,
    firebaseAuthUid
  };
}

/**
 * Converts a UserProfile to a normalized StudentSession.
 */
export function userProfileToSession(profile: UserProfile | null | undefined): StudentSession | null {
  if (!profile) return null;
  return validateStudentSession(profile);
}

/**
 * Maps a StudentSession back to UserProfile format preserving existing UI conventions.
 */
export function sessionToUserProfile(
  session: StudentSession, 
  existingProfile?: Partial<UserProfile>
): UserProfile {
  return {
    id: session.studentId,
    docId: session.docId,
    fullName: session.fullName,
    phoneNumber: session.phoneNumber,
    governorate: session.governorate,
    studentCode: session.studentCode,
    deviceId: session.deviceId,
    registeredAt: session.registeredAt || existingProfile?.registeredAt || new Date().toISOString(),
    status: (existingProfile?.status || 'active') as any,
    streakDays: typeof existingProfile?.streakDays === 'number' ? existingProfile.streakDays : 0,
    lastActiveDate: existingProfile?.lastActiveDate || new Date().toISOString().split('T')[0],
    totalStudyMinutes: typeof existingProfile?.totalStudyMinutes === 'number' ? existingProfile.totalStudyMinutes : 0,
    rankTitle: existingProfile?.rankTitle || 'طامح للـ 240',
    completedLessonsCount: typeof existingProfile?.completedLessonsCount === 'number' ? existingProfile.completedLessonsCount : 0,
    completedTaskIds: existingProfile?.completedTaskIds,
    firebaseAuthUid: session.firebaseAuthUid || existingProfile?.firebaseAuthUid
  };
}

/**
 * Attaches a validated Firebase Auth UID to the currently stored StudentSession.
 */
export function bindFirebaseAuthUidToCurrentSession(firebaseAuthUid: string): StudentSession | null {
  const current = getCurrentStudentSession();
  if (!current) return null;

  const cleanUid = firebaseAuthUid?.trim();
  if (!cleanUid) return current;

  const updated: StudentSession = {
    ...current,
    firebaseAuthUid: cleanUid
  };
  return saveStudentSession(updated);
}

/**
 * Returns the currently active student session, or null if unauthenticated.
 * Reads from centralized storage and validates schema.
 */
export function getCurrentStudentSession(): StudentSession | null {
  // 1. Check primary current user key
  const currentUserRaw = readStudentStorage<unknown>(STUDENT_STORAGE_KEYS.CURRENT_USER);
  const validatedCurrent = validateStudentSession(currentUserRaw);
  if (validatedCurrent) {
    return validatedCurrent;
  }

  // 2. Fallback to authenticated user key (written during strict login)
  const authUserRaw = readStudentStorage<unknown>(STUDENT_STORAGE_KEYS.AUTHENTICATED_USER);
  const validatedAuth = validateStudentSession(authUserRaw);
  if (validatedAuth) {
    return validatedAuth;
  }

  return null;
}

/**
 * Returns the current valid student session or throws StudentSessionError.
 * Use for operations that strictly require an authenticated student.
 */
export function requireStudentSession(): StudentSession {
  const session = getCurrentStudentSession();
  if (!session) {
    throw new StudentSessionError('يتطلب هذا الإجراء تسجيل الدخول بحساب طالب نشط.');
  }
  return session;
}

/**
 * Checks whether an active student session exists without throwing.
 */
export function hasActiveStudentSession(): boolean {
  return getCurrentStudentSession() !== null;
}

/**
 * Saves a student session into centralized storage.
 * Synchronizes both CURRENT_USER and AUTHENTICATED_USER for complete compatibility.
 */
export function saveStudentSession(sessionOrUser: StudentSession | UserProfile): StudentSession {
  const session = validateStudentSession(sessionOrUser);
  if (!session) {
    throw new StudentSessionError('Cannot save invalid or malformed student session.');
  }

  // Preserve full UserProfile shape in CURRENT_USER for UI backward compatibility
  const userPayload = 'status' in sessionOrUser 
    ? sessionOrUser 
    : sessionToUserProfile(session);

  writeStudentStorage(STUDENT_STORAGE_KEYS.CURRENT_USER, userPayload);
  writeStudentStorage(STUDENT_STORAGE_KEYS.AUTHENTICATED_USER, userPayload);

  if (session.studentCode) {
    writeStudentStorage(`${STUDENT_STORAGE_KEYS.LOCAL_USER_PREFIX}${session.studentCode}`, userPayload);
  }
  if (session.docId && session.docId !== session.studentCode) {
    writeStudentStorage(`${STUDENT_STORAGE_KEYS.LOCAL_USER_PREFIX}${session.docId}`, userPayload);
  }

  return session;
}

/**
 * Clears the active student session from storage.
 */
export function clearStudentSession(studentCodeOrDocId?: string): void {
  removeStudentStorage(STUDENT_STORAGE_KEYS.CURRENT_USER);
  removeStudentStorage(STUDENT_STORAGE_KEYS.AUTHENTICATED_USER);

  if (studentCodeOrDocId) {
    removeStudentStorage(`${STUDENT_STORAGE_KEYS.LOCAL_USER_PREFIX}${studentCodeOrDocId}`);
  }

  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      window.sessionStorage.removeItem(STUDENT_STORAGE_KEYS.CURRENT_SESSION);
    } catch {}
  }
}

/**
 * Extracts the canonical Firestore document ID for a student using established platform precedence.
 */
export function getCanonicalStudentDocId(sessionOrUser?: StudentSession | UserProfile | null): string {
  if (!sessionOrUser) {
    const current = getCurrentStudentSession();
    if (!current) {
      throw new StudentSessionError('Cannot resolve canonical student document ID: No active session.');
    }
    return current.docId || current.studentCode || current.studentId;
  }

  const docId = 'docId' in sessionOrUser && sessionOrUser.docId ? sessionOrUser.docId : '';
  const studentCode = sessionOrUser.studentCode || '';
  const studentId = 'studentId' in sessionOrUser ? sessionOrUser.studentId : ('id' in sessionOrUser ? sessionOrUser.id : '');

  const resolved = docId || studentCode || studentId;
  if (!resolved) {
    throw new StudentSessionError('Cannot resolve canonical student document ID: Object has no valid identifier.');
  }
  return resolved;
}

/**
 * Builds the canonical Firestore path for a student document: `students/{studentDocId}`.
 */
export function studentDocumentPath(studentDocId: string): string {
  if (!studentDocId || typeof studentDocId !== 'string' || !studentDocId.trim()) {
    throw new StudentSessionError('Invalid studentDocId for document path generation.');
  }
  return `students/${studentDocId.trim()}`;
}

/**
 * Builds the mirrored Admin-compatible Firestore path: `users/{studentDocId}`.
 */
export function studentMirroredUserPath(studentDocId: string): string {
  if (!studentDocId || typeof studentDocId !== 'string' || !studentDocId.trim()) {
    throw new StudentSessionError('Invalid studentDocId for mirrored user path generation.');
  }
  return `users/${studentDocId.trim()}`;
}

/**
 * Builds a path for a student subcollection: `students/{studentDocId}/{subcollectionName}`.
 */
export function studentSubcollectionPath(studentDocId: string, subcollectionName: string): string {
  if (!studentDocId || !studentDocId.trim()) {
    throw new StudentSessionError('Invalid studentDocId for subcollection path.');
  }
  if (!subcollectionName || !subcollectionName.trim()) {
    throw new StudentSessionError('Invalid subcollectionName for subcollection path.');
  }
  return `students/${studentDocId.trim()}/${subcollectionName.trim()}`;
}

/**
 * Frontend Student Access Guard:
 * Asserts that an intended operation on `targetStudentDocId` belongs to the currently authenticated student.
 * 
 * Future security phases will enforce this at the Firestore Rules layer.
 * In this phase, this guard prevents unintentional client-side cross-student mutations.
 */
export function assertStudentOwnership(
  targetStudentDocId: string, 
  explicitSession?: StudentSession | null
): StudentSession {
  const session = explicitSession || requireStudentSession();
  const cleanTarget = targetStudentDocId?.trim();

  if (!cleanTarget) {
    throw new UnauthorizedStudentAccessError(targetStudentDocId, session.studentId);
  }

  const isOwner = 
    cleanTarget === session.docId || 
    cleanTarget === session.studentCode || 
    cleanTarget === session.studentId;

  if (!isOwner) {
    throw new UnauthorizedStudentAccessError(cleanTarget, session.studentId);
  }

  return session;
}

// Re-export canonical Student Authorization Contract and Inventory (Prompt 4)
export {
  STUDENT_FIRESTORE_ACCESS_INVENTORY,
  STUDENT_ALLOWED_MUTABLE_FIELDS,
  STUDENT_FORBIDDEN_MUTABLE_FIELDS,
  getStudentAuthContext,
  verifyStudentWritePermission,
  assertStudentWritePermission,
  verifyStudentDeletePermission,
  assertStudentDeletePermission,
  sanitizeStudentUpdates,
  isAuthorizedStudentCollection
} from './studentAuthorization';
export type {
  StudentAccessScope,
  StudentFirestoreInventoryItem,
  StudentAuthorizationContext
} from './studentAuthorization';

