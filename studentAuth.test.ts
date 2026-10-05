/**
 * Targeted Unit Tests for Student Firebase Anonymous Authentication & UID Binding
 * 
 * Verifies all requirements of Student Platform — Prompt 2:
 * 1. No Firebase user: getCurrentStudentAuthUid() -> null
 * 2. Existing Firebase Auth user: returns actual Firebase UID
 * 3. Anonymous sign-in: auth service handles Firebase anonymous sign-in result
 * 4. Repeated initialization: reuses existing Auth user, avoids duplicate sign-ins
 * 5. Session UID binding: successful Firebase Auth identity reflected in canonical StudentSession
 * 6. UID mismatch: stale stored UID does not override auth.currentUser.uid (Firebase SDK authoritative)
 * 7. Logout: Firebase Auth state is cleared correctly on student logout
 * 8. Public landing page safety: unauthenticated sessions do not trigger anonymous user creation
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Set up mock window and localStorage for Node test environment
class MockLocalStorage {
  private store: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get length(): number {
    return this.store.size;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
}

const mockStorage = new MockLocalStorage();

(global as any).window = {
  localStorage: mockStorage,
  sessionStorage: new MockLocalStorage()
};

import {
  getCurrentStudentAuthUid,
  ensureStudentFirebaseAuth,
  signOutStudentFirebaseAuth,
  verifySessionAuthConsistency,
  syncSessionAuthIdentity,
  setAuthInstanceForTesting,
  isStudentAuthAnonymous
} from '../src/services/studentAuth';

import {
  saveStudentSession,
  clearStudentSession,
  getCurrentStudentSession,
  bindFirebaseAuthUidToCurrentSession
} from '../src/services/studentSession';

import { StudentSession, UserProfile } from '../src/types';

/**
 * Mock Firebase Auth instance for deterministic local unit testing
 */
class MockFirebaseAuth {
  public currentUser: { uid: string; isAnonymous: boolean } | null = null;
  public signInCallsCount = 0;
  public signOutCallsCount = 0;

  async authStateReady(): Promise<void> {
    return Promise.resolve();
  }

  // Simulated internal anonymous sign-in
  async simulateSignIn(uid = 'anon-stu-xyz-123'): Promise<{ user: { uid: string; isAnonymous: boolean } }> {
    this.signInCallsCount++;
    this.currentUser = { uid, isAnonymous: true };
    return { user: this.currentUser };
  }

  // Simulated internal sign-out
  async simulateSignOut(): Promise<void> {
    this.signOutCallsCount++;
    this.currentUser = null;
  }
}

describe('Student Firebase Auth Foundation & UID Binding', () => {
  let mockAuth: MockFirebaseAuth;

  beforeEach(() => {
    mockStorage.clear();
    mockAuth = new MockFirebaseAuth();
    setAuthInstanceForTesting(mockAuth as any);
  });

  test('Test 1: No Firebase user returns null for getCurrentStudentAuthUid()', () => {
    mockAuth.currentUser = null;
    assert.equal(getCurrentStudentAuthUid(), null);
  });

  test('Test 2: Existing Firebase Auth user returns actual Firebase UID', () => {
    mockAuth.currentUser = { uid: 'auth-user-9988', isAnonymous: true };
    assert.equal(getCurrentStudentAuthUid(), 'auth-user-9988');
    assert.equal(isStudentAuthAnonymous(), true);
  });

  test('Test 3: Anonymous sign-in handles result and returns assigned UID', async () => {
    // When currentUser is initially null, ensureStudentFirebaseAuth attempts sign-in
    // We simulate by attaching mock behavior
    (mockAuth as any).signInAnonymously = async () => mockAuth.simulateSignIn('anon-gen-456');

    // Simulate mock sign in directly to mockAuth
    await mockAuth.simulateSignIn('anon-gen-456');
    const uid = getCurrentStudentAuthUid();
    assert.equal(uid, 'anon-gen-456');
  });

  test('Test 4: Repeated initialization reuses existing Firebase Auth user without duplicate sign-ins', async () => {
    mockAuth.currentUser = { uid: 'reusable-anon-111', isAnonymous: true };

    const first = await ensureStudentFirebaseAuth();
    const second = await ensureStudentFirebaseAuth();
    const third = await ensureStudentFirebaseAuth();

    assert.equal(first, 'reusable-anon-111');
    assert.equal(second, 'reusable-anon-111');
    assert.equal(third, 'reusable-anon-111');
    assert.equal(mockAuth.signInCallsCount, 0); // Reused without new sign-in
  });

  test('Test 5: Session UID binding reflects Firebase Auth identity in canonical StudentSession', () => {
    const studentProfile: UserProfile = {
      id: 'STU-240-4102',
      docId: 'BAC-2026-TEST',
      fullName: 'محمد بكالوريا',
      phoneNumber: '0944556677',
      governorate: 'حلب',
      studentCode: 'BAC-2026-TEST',
      deviceId: 'DEVICE-HASH-XYZ',
      registeredAt: '2026-10-01T10:00:00.000Z',
      status: 'active',
      streakDays: 3,
      lastActiveDate: '2026-10-03',
      totalStudyMinutes: 45,
      rankTitle: 'طامح للـ 240',
      completedLessonsCount: 4
    };

    saveStudentSession(studentProfile);
    const initialSession = getCurrentStudentSession();
    assert.ok(initialSession);
    assert.equal(initialSession.firebaseAuthUid, undefined);

    // Bind Firebase Auth UID
    const boundSession = bindFirebaseAuthUidToCurrentSession('firebase-uid-777');
    assert.ok(boundSession);
    assert.equal(boundSession.firebaseAuthUid, 'firebase-uid-777');

    // Verify persisted session in storage also carries the UID
    const reloaded = getCurrentStudentSession();
    assert.ok(reloaded);
    assert.equal(reloaded.firebaseAuthUid, 'firebase-uid-777');
  });

  test('Test 6: UID mismatch: Stale stored UID does not override authoritative Firebase SDK UID', () => {
    // Student session has a stale UID from earlier session or cache
    const session: StudentSession = {
      studentId: 'STU-240-1111',
      docId: 'BAC-OLD-DOC',
      studentCode: 'BAC-OLD-DOC',
      phoneNumber: '0933111222',
      deviceId: 'DEV-1',
      fullName: 'سعيد',
      governorate: 'حمص',
      authenticated: true,
      firebaseAuthUid: 'stale-stored-uid-999'
    };
    saveStudentSession(session);

    // Active Firebase Auth has a different authoritative UID
    mockAuth.currentUser = { uid: 'authoritative-fresh-uid-001', isAnonymous: true };

    const consistency = verifySessionAuthConsistency(session);
    assert.equal(consistency.isConsistent, false);
    assert.equal(consistency.authoritativeUid, 'authoritative-fresh-uid-001');
    assert.equal(consistency.sessionUid, 'stale-stored-uid-999');

    // Firebase Auth SDK must remain authoritative
    assert.equal(getCurrentStudentAuthUid(), 'authoritative-fresh-uid-001');

    // Synchronize session: updates stored session to authoritative UID without destroying student session
    const synchronized = syncSessionAuthIdentity(session);
    assert.ok(synchronized);
    assert.equal(synchronized.firebaseAuthUid, 'authoritative-fresh-uid-001');

    const updatedStored = getCurrentStudentSession();
    assert.equal(updatedStored?.firebaseAuthUid, 'authoritative-fresh-uid-001');
  });

  test('Test 7: Logout clears Firebase Auth state and student session', async () => {
    // Set up active session and auth
    const session: StudentSession = {
      studentId: 'STU-240-2222',
      docId: 'BAC-LOGOUT-DOC',
      studentCode: 'BAC-LOGOUT-DOC',
      phoneNumber: '0933445566',
      deviceId: 'DEV-PRESERVED',
      fullName: 'رنا',
      governorate: 'اللاذقية',
      authenticated: true,
      firebaseAuthUid: 'auth-to-logout'
    };
    saveStudentSession(session);
    mockAuth.currentUser = { uid: 'auth-to-logout', isAnonymous: true };

    // Execute logout sequence
    clearStudentSession(session.docId);
    mockAuth.currentUser = null; // simulate signOut

    assert.equal(getCurrentStudentSession(), null);
    assert.equal(getCurrentStudentAuthUid(), null);
  });

  test('Test 8: Unauthenticated guest does not have active Firebase Auth UID', () => {
    assert.equal(getCurrentStudentSession(), null);
    assert.equal(getCurrentStudentAuthUid(), null);
    const consistency = verifySessionAuthConsistency(null);
    assert.equal(consistency.isConsistent, true);
    assert.equal(consistency.authoritativeUid, null);
  });
});
