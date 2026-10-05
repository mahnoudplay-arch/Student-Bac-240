/**
 * BAC-240 Student Platform
 * Centralized Firebase Student Auth Service
 * 
 * Boundary responsible for:
 * 1. Providing technical Firebase Anonymous Authentication for the existing Student session.
 * 2. Managing the single source of truth for the active Firebase Auth UID.
 * 3. Preventing duplicate/unnecessary anonymous sign-ins.
 * 4. Binding the technical Firebase UID to the canonical StudentSession.
 * 5. Providing safe consistency checks between stored session and Firebase Auth state.
 * 6. Managing clean Firebase Auth logout.
 * 
 * IMPORTANT:
 * - This service establishes the Firebase Auth identity required for future Security Rules.
 * - Firebase Anonymous Authentication alone does NOT prove that Firebase UID X == Student Y.
 * - This boundary does NOT replace authoritative Firestore Security Rules.
 * - Compatible with Firebase Spark / free-tier (No Cloud Functions or paid services).
 */

import { 
  signInAnonymously, 
  signOut, 
  onAuthStateChanged, 
  User, 
  Auth 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  Firestore 
} from 'firebase/firestore';
import { auth as defaultAuth, db as defaultDb } from '../lib/firebase';
import { StudentSession, UserProfile } from '../types';
import { 
  getCurrentStudentSession, 
  saveStudentSession,
  getCanonicalStudentDocId,
  bindFirebaseAuthUidToCurrentSession,
  userProfileToSession
} from './studentSession';

// Configurable auth instance (defaults to Firebase singleton, allows mock injection in tests)
let activeAuth: Auth = defaultAuth;

// Configurable firestore instance (defaults to Firebase singleton, allows mock injection in tests)
let activeDb: Firestore = defaultDb;

// In-memory cache of `${canonicalDocId}:${authUid}` pairs already confirmed linked in Firestore
const persistedIdentities = new Set<string>();

/**
 * Pluggable adapter interface for Firestore operations (enables deterministic, isolated unit tests).
 */
export interface FirestoreIdentityAdapter {
  getStudentDoc: (docId: string) => Promise<{ exists: boolean; data?: Record<string, any> }>;
  updateStudentDoc: (docId: string, updates: Record<string, any>) => Promise<void>;
  updateUserDoc?: (docId: string, updates: Record<string, any>) => Promise<void>;
}

const defaultFirestoreAdapter: FirestoreIdentityAdapter = {
  getStudentDoc: async (docId: string) => {
    const snap = await getDoc(doc(activeDb, 'students', docId));
    return {
      exists: snap.exists(),
      data: snap.exists() ? snap.data() : undefined
    };
  },
  updateStudentDoc: async (docId: string, updates: Record<string, any>) => {
    await updateDoc(doc(activeDb, 'students', docId), updates);
  },
  updateUserDoc: async (docId: string, updates: Record<string, any>) => {
    await updateDoc(doc(activeDb, 'users', docId), updates);
  }
};

let activeAdapter: FirestoreIdentityAdapter = defaultFirestoreAdapter;

/**
 * Allows test suites to provide an in-memory Firestore adapter without network/emulator overhead.
 */
export function setFirestoreAdapterForTesting(adapter: FirestoreIdentityAdapter | null): void {
  activeAdapter = adapter || defaultFirestoreAdapter;
  persistedIdentities.clear();
}

/**
 * Allows test suites to provide a mocked or custom Auth instance without network dependencies.
 */
export function setAuthInstanceForTesting(customAuth: Auth | null): void {
  activeAuth = customAuth || defaultAuth;
  inFlightAuthPromise = null;
}

/**
 * Allows test suites to provide a mocked or custom Firestore instance without network dependencies.
 */
export function setFirestoreInstanceForTesting(customDb: Firestore | null): void {
  activeDb = customDb || defaultDb;
  persistedIdentities.clear();
}

/**
 * Clears the in-memory persisted identities cache (used by unit tests).
 */
export function clearPersistedIdentitiesCacheForTesting(): void {
  persistedIdentities.clear();
}

/**
 * Returns the currently active Auth instance.
 */
export function getAuthInstance(): Auth {
  return activeAuth;
}

/**
 * Returns the currently active Firestore instance.
 */
export function getFirestoreInstance(): Firestore {
  return activeDb;
}

// In-flight singleton promise to prevent concurrent/duplicated anonymous sign-in attempts
let inFlightAuthPromise: Promise<string | null> | null = null;

/**
 * Returns the current Firebase Auth UID from the Firebase SDK.
 * 
 * SECURITY GUARANTEES:
 * - Firebase Auth SDK is the single source of truth for the Firebase identity.
 * - Never accepts an arbitrary UID argument.
 * - Never reads UID from URL query parameters.
 * - Never reads UID from unverified localStorage as authoritative.
 */
export function getCurrentStudentAuthUid(): string | null {
  try {
    return activeAuth?.currentUser?.uid ?? null;
  } catch {
    return null;
  }
}

/**
 * Checks if the current Firebase Auth user is signed in anonymously.
 */
export function isStudentAuthAnonymous(): boolean {
  try {
    return Boolean(activeAuth?.currentUser?.isAnonymous);
  } catch {
    return false;
  }
}

/**
 * Establishes or reuses the Firebase Anonymous Auth identity for an authenticated student session.
 * 
 * BEHAVIOR:
 * 1. If an existing Firebase user is already active, reuses it immediately (no new sign-in).
 * 2. If an authentication call is already in progress, reuses that promise to prevent duplicate users.
 * 3. Otherwise, executes `signInAnonymously(auth)` once.
 * 4. Returns the Firebase Auth `uid` or `null` on failure.
 * 5. Handles errors safely without throwing, so network issues do not crash the app.
 * 6. Never stores ID tokens or access tokens manually in localStorage.
 */
export async function ensureStudentFirebaseAuth(): Promise<string | null> {
  try {
    // 1. If already authenticated in memory, return the existing UID immediately
    if (activeAuth?.currentUser?.uid) {
      return activeAuth.currentUser.uid;
    }

    // 2. If a sign-in operation is already in-flight, return the existing promise
    if (inFlightAuthPromise) {
      return inFlightAuthPromise;
    }

    // 3. Initiate anonymous sign-in with deduping lock
    inFlightAuthPromise = (async (): Promise<string | null> => {
      try {
        // Wait for Firebase Auth's persisted state to be ready if supported (Firebase 9.14+)
        if (typeof (activeAuth as any).authStateReady === 'function') {
          try {
            await (activeAuth as any).authStateReady();
            if (activeAuth?.currentUser?.uid) {
              return activeAuth.currentUser.uid;
            }
          } catch {
            // Ignore ready errors and proceed to sign in
          }
        }

        const cred = await signInAnonymously(activeAuth);
        const uid = cred.user.uid;
        return uid;
      } catch (err: any) {
        console.warn('[studentAuth] Firebase Anonymous Authentication failed:', err?.message || err);
        return null;
      } finally {
        inFlightAuthPromise = null;
      }
    })();

    return await inFlightAuthPromise;
  } catch (err) {
    console.warn('[studentAuth] Unexpected error during student auth initialization:', err);
    inFlightAuthPromise = null;
    return null;
  }
}

/**
 * Signs out the student from Firebase Auth.
 * Used during explicit student logout or account deletion.
 */
export async function signOutStudentFirebaseAuth(): Promise<void> {
  try {
    if (activeAuth?.currentUser) {
      await signOut(activeAuth);
    }
  } catch (err) {
    console.warn('[studentAuth] Error signing out Firebase Auth:', err);
  } finally {
    inFlightAuthPromise = null;
  }
}

/**
 * Subscribes to Firebase Auth state changes through a single centralized listener.
 * Avoids scattered onAuthStateChanged listeners throughout React components.
 */
export function subscribeToStudentAuthState(callback: (user: User | null) => void): () => void {
  try {
    return onAuthStateChanged(activeAuth, callback);
  } catch (err) {
    console.warn('[studentAuth] Failed to subscribe to auth state:', err);
    return () => {};
  }
}

/**
 * Consistency Check Result.
 */
export interface SessionAuthConsistencyResult {
  /** Whether the stored session matches the active Firebase Auth state */
  isConsistent: boolean;
  /** Authoritative Firebase Auth UID from Firebase SDK */
  authoritativeUid: string | null;
  /** UID stored in the session record, if any */
  sessionUid?: string;
  /** Informational reason if inconsistent */
  reason?: string;
}

/**
 * Consistency mechanism between stored StudentSession and Firebase Auth SDK.
 * 
 * RULES:
 * - If session.firebaseAuthUid and auth.currentUser?.uid differ,
 *   the Firebase Auth SDK UID is ALWAYS authoritative.
 * - Stored session UID is never permitted to spoof or override auth.currentUser.uid.
 * - Mismatches do NOT destructively log out the student; they are resolved by updating the session.
 */
export function verifySessionAuthConsistency(
  session?: StudentSession | null
): SessionAuthConsistencyResult {
  const authoritativeUid = getCurrentStudentAuthUid();
  const currentSession = session ?? getCurrentStudentSession();

  if (!currentSession) {
    return {
      isConsistent: true,
      authoritativeUid,
      reason: 'No active student session.'
    };
  }

  const sessionUid = currentSession.firebaseAuthUid;

  // Case A: Neither has a UID yet (pre-migration session or offline)
  if (!sessionUid && !authoritativeUid) {
    return {
      isConsistent: true,
      authoritativeUid: null,
      reason: 'Neither session nor Firebase Auth has a UID yet.'
    };
  }

  // Case B: Session has UID, Firebase Auth is not yet signed in (e.g. initial load or expired)
  if (sessionUid && !authoritativeUid) {
    return {
      isConsistent: false,
      authoritativeUid: null,
      sessionUid,
      reason: 'Session contains stored UID but Firebase Auth is not yet signed in.'
    };
  }

  // Case C: Firebase Auth is signed in, session did not have UID yet (initial migration)
  if (!sessionUid && authoritativeUid) {
    return {
      isConsistent: false,
      authoritativeUid,
      sessionUid: undefined,
      reason: 'Firebase Auth is active but session does not yet have the UID attached.'
    };
  }

  // Case D: Both exist — compare them
  if (sessionUid === authoritativeUid) {
    return {
      isConsistent: true,
      authoritativeUid,
      sessionUid,
      reason: 'Session UID matches active Firebase Auth UID.'
    };
  }

  // Case E: Mismatch
  return {
    isConsistent: false,
    authoritativeUid,
    sessionUid,
    reason: 'Mismatch: stored session UID differs from active Firebase Auth UID. Firebase SDK is authoritative.'
  };
}

/**
 * Synchronizes the canonical StudentSession with the authoritative Firebase Auth UID.
 * 
 * If the current session does not match the active Firebase Auth UID,
 * this function updates the session storage with the authoritative UID without disrupting the user.
 */
export function syncSessionAuthIdentity(
  session?: StudentSession | null
): StudentSession | null {
  const current = session ?? getCurrentStudentSession();
  if (!current) return null;

  const authUid = getCurrentStudentAuthUid();
  if (!authUid) return current;

  if (current.firebaseAuthUid !== authUid) {
    const updated: StudentSession = {
      ...current,
      firebaseAuthUid: authUid
    };
    return saveStudentSession(updated);
  }

  return current;
}

/**
 * Result of the Firebase UID Firestore persistence operation.
 */
export interface IdentityPersistenceResult {
  /** Whether the identity is successfully confirmed or persisted in Firestore */
  success: boolean;
  /** Status of the persistence operation */
  status: 'persisted' | 'already_linked' | 'conflict_prevented' | 'skipped' | 'failed';
  /** The authoritative Firebase Auth UID */
  authUid?: string;
  /** The canonical student Firestore document ID */
  studentDocId?: string;
  /** The UID already existing on the Firestore document (in case of conflict) */
  existingFirestoreUid?: string;
  /** Informational or error message */
  error?: string;
}

/**
 * Ensures that the authoritative Firebase Auth UID is persisted inside the student's Firestore record.
 * 
 * CORE ARCHITECTURAL PRINCIPLES:
 * 1. Authoritative Source: ONLY reads from `auth.currentUser.uid` via Firebase Auth SDK.
 *    Never trusts localStorage, URLs, deviceId, or phone as the authoritative UID.
 * 2. Preconditions: Requires an authenticated StudentSession AND an active Firebase Auth currentUser.
 * 3. Backward Compatibility: For existing students with no `firebaseAuthUid` in Firestore,
 *    updates the document without altering docId, studentId, or other existing fields.
 * 4. Conflict Prevention: If Firestore already contains a different `firebaseAuthUid`,
 *    DOES NOT OVERWRITE. Safely logs the conflict and returns `conflict_prevented`.
 * 5. Minimal & Idempotent: If the Firestore document already has the matching UID, no write occurs.
 *    In-memory cache prevents repeat reads during the active session.
 * 6. Dual-Collection Consistency: Updates both `students/{docId}` and `users/{docId}` (Admin mirror).
 * 7. Offline/Network Resilience: Catches network errors gracefully without breaking the student session.
 */
export async function ensureStudentFirebaseIdentityPersisted(
  explicitSession?: StudentSession | UserProfile | null,
  options?: {
    forceCheck?: boolean;
    adapter?: FirestoreIdentityAdapter;
    customAuth?: any;
  }
): Promise<IdentityPersistenceResult> {
  // 1. Session verification & normalization
  const rawSession = explicitSession || getCurrentStudentSession();
  const session = rawSession 
    ? ('authenticated' in rawSession ? rawSession : userProfileToSession(rawSession))
    : null;

  if (!session || !session.authenticated) {
    return {
      success: false,
      status: 'skipped',
      error: 'No authenticated student session.'
    };
  }

  // 2. Canonical docId resolution
  let canonicalDocId: string;
  try {
    canonicalDocId = getCanonicalStudentDocId(session);
  } catch (err: any) {
    return {
      success: false,
      status: 'skipped',
      error: `Could not resolve canonical student document ID: ${err?.message || err}`
    };
  }

  if (!canonicalDocId || !canonicalDocId.trim()) {
    return {
      success: false,
      status: 'skipped',
      error: 'Canonical student document ID is empty.'
    };
  }

  const cleanDocId = canonicalDocId.trim();

  // 3. Authoritative Firebase Auth UID check (FROM FIREBASE AUTH SDK ONLY)
  const authToUse = options?.customAuth || activeAuth;
  const authoritativeUid = authToUse?.currentUser?.uid;

  if (!authoritativeUid || typeof authoritativeUid !== 'string' || !authoritativeUid.trim()) {
    return {
      success: false,
      status: 'skipped',
      error: 'No active Firebase Auth currentUser.uid available.'
    };
  }

  const cleanAuthUid = authoritativeUid.trim();
  const cacheKey = `${cleanDocId}:${cleanAuthUid}`;

  // 4. Memory idempotency: avoid repeating reads/writes if already verified
  if (!options?.forceCheck && persistedIdentities.has(cacheKey)) {
    return {
      success: true,
      status: 'already_linked',
      authUid: cleanAuthUid,
      studentDocId: cleanDocId
    };
  }

  // 5. Read existing document from Firestore adapter
  const adapterToUse = options?.adapter || activeAdapter;
  try {
    const docResult = await adapterToUse.getStudentDoc(cleanDocId);

    if (!docResult.exists) {
      return {
        success: false,
        status: 'failed',
        authUid: cleanAuthUid,
        studentDocId: cleanDocId,
        error: `Student document students/${cleanDocId} does not exist in Firestore.`
      };
    }

    const data = (docResult.data || {}) as Record<string, any>;
    const existingFirestoreUid = typeof data.firebaseAuthUid === 'string' && data.firebaseAuthUid.trim()
      ? data.firebaseAuthUid.trim()
      : undefined;

    // 6. Check existing UID:
    // Case A: Exact match -> already linked, zero write needed
    if (existingFirestoreUid === cleanAuthUid) {
      persistedIdentities.add(cacheKey);
      if (session.firebaseAuthUid !== cleanAuthUid) {
        bindFirebaseAuthUidToCurrentSession(cleanAuthUid);
      }
      return {
        success: true,
        status: 'already_linked',
        authUid: cleanAuthUid,
        studentDocId: cleanDocId
      };
    }

    // Case B: Conflict -> Existing UID differs from active Firebase Auth UID
    // DO NOT OVERWRITE! Log and report safely.
    if (existingFirestoreUid && existingFirestoreUid !== cleanAuthUid) {
      console.warn(
        `[studentAuth] Identity conflict for student [${cleanDocId}]: ` +
        `Firestore record is already bound to UID [${existingFirestoreUid}], ` +
        `which differs from active Auth UID [${cleanAuthUid}]. Overwrite prevented.`
      );
      return {
        success: false,
        status: 'conflict_prevented',
        authUid: cleanAuthUid,
        studentDocId: cleanDocId,
        existingFirestoreUid,
        error: 'Identity conflict: Firestore student document is already bound to a different Firebase Auth UID. Overwrite prevented.'
      };
    }

    // Case C: No existing UID in Firestore (legacy student or fresh activation)
    // Perform deterministic dual-write to students/{docId} and users/{docId}
    const nowIso = new Date().toISOString();
    const updatePayload = {
      firebaseAuthUid: cleanAuthUid,
      authIdentityUpdatedAt: nowIso
    };

    await adapterToUse.updateStudentDoc(cleanDocId, updatePayload);

    // Dual-write to users/{docId} for Admin compatibility
    if (adapterToUse.updateUserDoc) {
      try {
        await adapterToUse.updateUserDoc(cleanDocId, updatePayload);
      } catch (mirrorErr) {
        // Non-fatal if users mirror record is missing or failed
        console.warn(`[studentAuth] Mirrored users/${cleanDocId} update warning:`, mirrorErr);
      }
    }

    // Mark as persisted in memory cache and session
    persistedIdentities.add(cacheKey);
    bindFirebaseAuthUidToCurrentSession(cleanAuthUid);

    return {
      success: true,
      status: 'persisted',
      authUid: cleanAuthUid,
      studentDocId: cleanDocId
    };

  } catch (netErr: any) {
    console.warn(`[studentAuth] Failed to persist Firebase Auth UID to Firestore (network/offline):`, netErr);
    // Student session remains completely intact, no fake UID is generated
    return {
      success: false,
      status: 'failed',
      authUid: cleanAuthUid,
      studentDocId: cleanDocId,
      error: netErr?.message || String(netErr)
    };
  }
}

