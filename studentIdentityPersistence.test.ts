/**
 * Targeted Unit Tests for Student Firebase UID Persistence & Identity Binding (Prompt 3)
 * 
 * Verifies all 8 required test specifications:
 * 1. Authenticated student + Firebase UID + student document without UID -> UID gets persisted
 * 2. Authenticated student + same UID already in Firestore -> no unnecessary overwrite (0 writes)
 * 3. Existing Firestore UID differs from Firebase Auth UID -> existing UID is NOT overwritten, conflict reported safely
 * 4. No Firebase Auth user -> no Firestore UID persistence (skipped safely)
 * 5. No valid StudentSession -> no Firestore UID persistence (skipped safely)
 * 6. Firestore/network failure -> student session remains intact, no fake UID generated
 * 7. Legacy student document without firebaseAuthUid -> backward-compatible migration behavior
 * 8. Repeated invocation -> in-memory idempotency prevents duplicate Firestore operations
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
  ensureStudentFirebaseIdentityPersisted,
  setAuthInstanceForTesting,
  setFirestoreAdapterForTesting,
  clearPersistedIdentitiesCacheForTesting,
  FirestoreIdentityAdapter
} from '../src/services/studentAuth';

import {
  saveStudentSession,
  clearStudentSession,
  getCurrentStudentSession
} from '../src/services/studentSession';

import { StudentSession } from '../src/types';

/**
 * In-Memory Mock Store for Firestore collections & documents
 */
class MockFirestoreDb {
  public docs: Map<string, Record<string, any>> = new Map();
  public updateCallsCount = 0;
  public getCallsCount = 0;
  public shouldFailNetwork = false;

  setDocument(collection: string, docId: string, data: Record<string, any>): void {
    this.docs.set(`${collection}/${docId}`, { ...data });
  }

  getDocument(collection: string, docId: string): Record<string, any> | undefined {
    return this.docs.get(`${collection}/${docId}`);
  }

  reset(): void {
    this.docs.clear();
    this.updateCallsCount = 0;
    this.getCallsCount = 0;
    this.shouldFailNetwork = false;
  }
}

/**
 * Mock Auth instance
 */
class MockFirebaseAuth {
  public currentUser: { uid: string; isAnonymous: boolean } | null = null;
}

describe('Student Firebase UID Persistence & Identity Binding (Prompt 3)', () => {
  let mockAuth: MockFirebaseAuth;
  let mockDb: MockFirestoreDb;

  beforeEach(() => {
    mockStorage.clear();
    clearStudentSession();
    clearPersistedIdentitiesCacheForTesting();

    mockAuth = new MockFirebaseAuth();
    mockDb = new MockFirestoreDb();

    setAuthInstanceForTesting(mockAuth as any);

    // Provide clean in-memory Firestore adapter
    const mockAdapter: FirestoreIdentityAdapter = {
      getStudentDoc: async (docId: string) => {
        mockDb.getCallsCount++;
        if (mockDb.shouldFailNetwork) {
          throw new Error('Network error: connection lost to Firestore');
        }
        const data = mockDb.getDocument('students', docId);
        return {
          exists: data !== undefined,
          data
        };
      },
      updateStudentDoc: async (docId: string, updates: Record<string, any>) => {
        mockDb.updateCallsCount++;
        if (mockDb.shouldFailNetwork) {
          throw new Error('Network error: updateDoc connection timed out');
        }
        const existing = mockDb.getDocument('students', docId) || {};
        mockDb.setDocument('students', docId, { ...existing, ...updates });
      },
      updateUserDoc: async (docId: string, updates: Record<string, any>) => {
        if (mockDb.shouldFailNetwork) {
          throw new Error('Network error: user mirror update failed');
        }
        const existing = mockDb.getDocument('users', docId) || {};
        mockDb.setDocument('users', docId, { ...existing, ...updates });
      }
    };

    setFirestoreAdapterForTesting(mockAdapter);
  });

  test('Test 1: Authenticated student + Firebase UID + student doc without UID -> UID gets persisted', async () => {
    const studentDocId = 'BAC-2026-TEST01';
    const authUid = 'firebase-anon-uid-101';

    // 1. Establish authenticated session
    const session: StudentSession = {
      studentId: 'STU-240-0001',
      docId: studentDocId,
      studentCode: studentDocId,
      phoneNumber: '0933111222',
      deviceId: 'DEV-001',
      fullName: 'أحمد المتفوق',
      governorate: 'دمشق',
      authenticated: true
    };
    saveStudentSession(session);

    // 2. Establish Firebase Auth currentUser
    mockAuth.currentUser = { uid: authUid, isAnonymous: true };

    // 3. Set existing student document in mock DB (without firebaseAuthUid)
    mockDb.setDocument('students', studentDocId, {
      id: 'STU-240-0001',
      studentCode: studentDocId,
      fullName: 'أحمد المتفوق',
      phoneNumber: '0933111222'
    });
    mockDb.setDocument('users', studentDocId, {
      id: 'STU-240-0001',
      studentCode: studentDocId
    });

    const result = await ensureStudentFirebaseIdentityPersisted(session);

    // Verifications:
    assert.equal(result.success, true);
    assert.equal(result.status, 'persisted');
    assert.equal(result.authUid, authUid);
    assert.equal(result.studentDocId, studentDocId);

    // Verify student document in mock DB received the UID
    const studentInDb = mockDb.getDocument('students', studentDocId);
    assert.ok(studentInDb);
    assert.equal(studentInDb.firebaseAuthUid, authUid);
    assert.ok(studentInDb.authIdentityUpdatedAt);

    // Verify dual-write to users/{docId}
    const userInDb = mockDb.getDocument('users', studentDocId);
    assert.ok(userInDb);
    assert.equal(userInDb.firebaseAuthUid, authUid);

    // Verify session storage also bound the UID
    const updatedSession = getCurrentStudentSession();
    assert.equal(updatedSession?.firebaseAuthUid, authUid);
  });

  test('Test 2: Authenticated student + same UID already in Firestore -> no unnecessary overwrite', async () => {
    const studentDocId = 'BAC-2026-TEST02';
    const authUid = 'firebase-anon-uid-102';

    const session: StudentSession = {
      studentId: 'STU-240-0002',
      docId: studentDocId,
      studentCode: studentDocId,
      phoneNumber: '0944111222',
      deviceId: 'DEV-002',
      fullName: 'سارة المتفوقة',
      governorate: 'حلب',
      authenticated: true,
      firebaseAuthUid: authUid
    };
    saveStudentSession(session);
    mockAuth.currentUser = { uid: authUid, isAnonymous: true };

    // Already linked in Firestore
    mockDb.setDocument('students', studentDocId, {
      id: 'STU-240-0002',
      studentCode: studentDocId,
      firebaseAuthUid: authUid
    });

    const initialUpdateCount = mockDb.updateCallsCount;

    const result = await ensureStudentFirebaseIdentityPersisted(session);

    assert.equal(result.success, true);
    assert.equal(result.status, 'already_linked');
    assert.equal(result.authUid, authUid);
    // 0 writes occurred
    assert.equal(mockDb.updateCallsCount, initialUpdateCount);
  });

  test('Test 3: Existing Firestore UID differs from Firebase Auth UID -> existing UID is NOT overwritten and conflict reported', async () => {
    const studentDocId = 'BAC-2026-TEST03';
    const legitimateExistingUid = 'original-owner-uid-999';
    const imposterAuthUid = 'attacker-or-new-device-uid-111';

    const session: StudentSession = {
      studentId: 'STU-240-0003',
      docId: studentDocId,
      studentCode: studentDocId,
      phoneNumber: '0955111222',
      deviceId: 'DEV-003',
      fullName: 'عمر',
      governorate: 'حمص',
      authenticated: true
    };
    saveStudentSession(session);

    // Current Firebase Auth user has imposterAuthUid
    mockAuth.currentUser = { uid: imposterAuthUid, isAnonymous: true };

    // Firestore record is ALREADY BOUND to legitimateExistingUid
    mockDb.setDocument('students', studentDocId, {
      id: 'STU-240-0003',
      studentCode: studentDocId,
      firebaseAuthUid: legitimateExistingUid
    });

    const initialUpdateCount = mockDb.updateCallsCount;

    const result = await ensureStudentFirebaseIdentityPersisted(session);

    assert.equal(result.success, false);
    assert.equal(result.status, 'conflict_prevented');
    assert.equal(result.existingFirestoreUid, legitimateExistingUid);
    assert.equal(result.authUid, imposterAuthUid);
    assert.ok(result.error?.includes('conflict'));

    // Existing Firestore document MUST NOT have been overwritten
    const docInDb = mockDb.getDocument('students', studentDocId);
    assert.equal(docInDb?.firebaseAuthUid, legitimateExistingUid);
    // 0 writes occurred
    assert.equal(mockDb.updateCallsCount, initialUpdateCount);
  });

  test('Test 4: No Firebase Auth user -> no Firestore UID persistence (skipped safely)', async () => {
    const session: StudentSession = {
      studentId: 'STU-240-0004',
      docId: 'BAC-TEST-04',
      studentCode: 'BAC-TEST-04',
      phoneNumber: '0966111222',
      deviceId: 'DEV-004',
      fullName: 'خالد',
      governorate: 'اللاذقية',
      authenticated: true
    };
    saveStudentSession(session);

    // currentUser is NULL
    mockAuth.currentUser = null;

    mockDb.setDocument('students', 'BAC-TEST-04', {
      studentCode: 'BAC-TEST-04'
    });

    const result = await ensureStudentFirebaseIdentityPersisted(session);

    assert.equal(result.success, false);
    assert.equal(result.status, 'skipped');
    assert.ok(result.error?.includes('No active Firebase Auth'));

    // No UID added to Firestore
    const docInDb = mockDb.getDocument('students', 'BAC-TEST-04');
    assert.equal(docInDb?.firebaseAuthUid, undefined);
    assert.equal(mockDb.updateCallsCount, 0);
  });

  test('Test 5: No valid StudentSession -> no Firestore UID persistence (skipped safely)', async () => {
    mockStorage.clear();
    mockAuth.currentUser = { uid: 'some-uid-555', isAnonymous: true };

    const result = await ensureStudentFirebaseIdentityPersisted(null);

    assert.equal(result.success, false);
    assert.equal(result.status, 'skipped');
    assert.ok(result.error?.includes('No authenticated student session'));
    assert.equal(mockDb.updateCallsCount, 0);
  });

  test('Test 6: Firestore/network failure -> student session remains intact, no fake UID generated', async () => {
    const studentDocId = 'BAC-TEST-06';
    const authUid = 'valid-real-uid-666';

    const session: StudentSession = {
      studentId: 'STU-240-0006',
      docId: studentDocId,
      studentCode: studentDocId,
      phoneNumber: '0977111222',
      deviceId: 'DEV-006',
      fullName: 'ريم',
      governorate: 'حماة',
      authenticated: true
    };
    saveStudentSession(session);
    mockAuth.currentUser = { uid: authUid, isAnonymous: true };

    // Set document in DB, but inject network failure
    mockDb.setDocument('students', studentDocId, { studentCode: studentDocId });
    mockDb.shouldFailNetwork = true;

    const result = await ensureStudentFirebaseIdentityPersisted(session);

    assert.equal(result.success, false);
    assert.equal(result.status, 'failed');
    assert.ok(result.error?.includes('Network error'));

    // Student session in localStorage MUST remain completely intact!
    const preservedSession = getCurrentStudentSession();
    assert.ok(preservedSession);
    assert.equal(preservedSession.docId, studentDocId);
    assert.equal(preservedSession.studentCode, studentDocId);
    assert.equal(preservedSession.authenticated, true);
  });

  test('Test 7: Legacy student document without firebaseAuthUid -> backward-compatible migration behavior', async () => {
    const legacyDocId = 'BAC-LEGACY-07';
    const authUid = 'migration-auth-uid-707';

    const legacySession: StudentSession = {
      studentId: 'STU-240-0007',
      docId: legacyDocId,
      studentCode: legacyDocId,
      phoneNumber: '0988111222',
      deviceId: 'DEV-007',
      fullName: 'طالب قديم',
      governorate: 'دمشق',
      authenticated: true
    };
    saveStudentSession(legacySession);
    mockAuth.currentUser = { uid: authUid, isAnonymous: true };

    // Legacy Firestore document has all old fields (streak, study hours, progress) but no firebaseAuthUid
    const legacyFirestoreRecord = {
      id: 'STU-240-0007',
      bacId: 'STU-240-0007',
      studentCode: legacyDocId,
      activationCode: legacyDocId,
      fullName: 'طالب قديم',
      phoneNumber: '0988111222',
      totalStudyHours: 120,
      streakDays: 14,
      status: 'active'
    };
    mockDb.setDocument('students', legacyDocId, legacyFirestoreRecord);

    const result = await ensureStudentFirebaseIdentityPersisted(legacySession);

    // Verification:
    assert.equal(result.success, true);
    assert.equal(result.status, 'persisted');
    assert.equal(result.authUid, authUid);
    assert.equal(result.studentDocId, legacyDocId);

    // Old fields preserved!
    const docInDb = mockDb.getDocument('students', legacyDocId);
    assert.ok(docInDb);
    assert.equal(docInDb.totalStudyHours, 120);
    assert.equal(docInDb.streakDays, 14);
    assert.equal(docInDb.studentCode, legacyDocId);
    assert.equal(docInDb.firebaseAuthUid, authUid);
  });

  test('Test 8: Repeated invocation -> in-memory idempotency prevents duplicate Firestore operations', async () => {
    const studentDocId = 'BAC-REPEAT-08';
    const authUid = 'idempotent-uid-808';

    const session: StudentSession = {
      studentId: 'STU-240-0008',
      docId: studentDocId,
      studentCode: studentDocId,
      phoneNumber: '0999111222',
      deviceId: 'DEV-008',
      fullName: 'نور',
      governorate: 'طرطوس',
      authenticated: true,
      firebaseAuthUid: authUid
    };
    saveStudentSession(session);
    mockAuth.currentUser = { uid: authUid, isAnonymous: true };

    mockDb.setDocument('students', studentDocId, {
      studentCode: studentDocId,
      firebaseAuthUid: authUid
    });

    // First call: reads Firestore, finds match (getCallsCount = 1, updateCallsCount = 0), marks in memory cache
    const firstCall = await ensureStudentFirebaseIdentityPersisted(session);
    assert.equal(firstCall.status, 'already_linked');
    assert.equal(mockDb.getCallsCount, 1);
    assert.equal(mockDb.updateCallsCount, 0);

    // Second call: in-memory cache immediately returns without reading or writing Firestore!
    const secondCall = await ensureStudentFirebaseIdentityPersisted(session);
    assert.equal(secondCall.status, 'already_linked');
    assert.equal(mockDb.getCallsCount, 1); // unchanged!
    assert.equal(mockDb.updateCallsCount, 0); // unchanged!

    // Third call: still zero additional Firestore calls
    const thirdCall = await ensureStudentFirebaseIdentityPersisted(session);
    assert.equal(thirdCall.status, 'already_linked');
    assert.equal(mockDb.getCallsCount, 1);
    assert.equal(mockDb.updateCallsCount, 0);
  });
});
