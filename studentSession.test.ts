/**
 * Targeted Tests for Student Identity & Access Foundation
 * 
 * Tests:
 * 1. No current session: getCurrentStudentSession() -> null
 * 2. Valid existing student session: getCurrentStudentSession() -> normalized StudentSession
 * 3. Invalid/malformed stored session: Malformed or incomplete JSON rejected safely
 * 4. Student path generation: studentDocumentPath, studentMirroredUserPath, studentSubcollectionPath
 * 5. Missing student identity: requireStudentSession() throws StudentSessionError safely
 * 6. Legacy compatibility: Reads existing legacy keys without breaking existing flow
 * 7. Student access guard: assertStudentOwnership() passes for owner, throws for mismatch/unauthenticated
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
  STUDENT_STORAGE_KEYS,
  getCurrentStudentSession,
  requireStudentSession,
  hasActiveStudentSession,
  saveStudentSession,
  clearStudentSession,
  studentDocumentPath,
  studentMirroredUserPath,
  studentSubcollectionPath,
  getCanonicalStudentDocId,
  assertStudentOwnership,
  StudentSessionError,
  UnauthorizedStudentAccessError,
  validateStudentSession
} from '../src/services/studentSession';
import { UserProfile } from '../src/types';

describe('StudentSession Access Layer', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  test('Test 1: No current session returns null', () => {
    assert.equal(getCurrentStudentSession(), null);
    assert.equal(hasActiveStudentSession(), false);
  });

  test('Test 2: Valid existing student session returns normalized StudentSession', () => {
    const validProfile: UserProfile = {
      id: 'STU-240-4102',
      docId: 'BAC-2026-DEMO',
      fullName: 'أحمد السوري',
      phoneNumber: '0933112233',
      governorate: 'دمشق',
      studentCode: 'BAC-2026-DEMO',
      deviceId: 'DEV-HW123-ABC',
      registeredAt: '2026-09-01T12:00:00.000Z',
      status: 'active',
      streakDays: 5,
      lastActiveDate: '2026-10-02',
      totalStudyMinutes: 120,
      rankTitle: 'محارب الـ 240',
      completedLessonsCount: 8
    };

    saveStudentSession(validProfile);

    const session = getCurrentStudentSession();
    assert.ok(session !== null, 'Session should not be null');
    assert.equal(session.studentId, 'STU-240-4102');
    assert.equal(session.docId, 'BAC-2026-DEMO');
    assert.equal(session.studentCode, 'BAC-2026-DEMO');
    assert.equal(session.phoneNumber, '0933112233');
    assert.equal(session.deviceId, 'DEV-HW123-ABC');
    assert.equal(session.fullName, 'أحمد السوري');
    assert.equal(session.governorate, 'دمشق');
    assert.equal(session.authenticated, true);
    assert.equal(hasActiveStudentSession(), true);
  });

  test('Test 3: Malformed or invalid stored session is handled safely', () => {
    // 3a. Invalid JSON
    mockStorage.setItem(STUDENT_STORAGE_KEYS.CURRENT_USER, '{{invalid-json');
    assert.equal(getCurrentStudentSession(), null);

    // 3b. Empty object without required identity fields
    mockStorage.setItem(STUDENT_STORAGE_KEYS.CURRENT_USER, JSON.stringify({}));
    assert.equal(getCurrentStudentSession(), null);

    // 3c. Non-object string
    mockStorage.setItem(STUDENT_STORAGE_KEYS.CURRENT_USER, JSON.stringify('plain-string'));
    assert.equal(getCurrentStudentSession(), null);

    // 3d. Direct validator with null/undefined/numbers
    assert.equal(validateStudentSession(null), null);
    assert.equal(validateStudentSession(undefined), null);
    assert.equal(validateStudentSession(12345), null);
  });

  test('Test 4: Student document and subcollection path generation', () => {
    const studentId = 'BAC-2026-XYZ';

    // Canonical document path
    assert.equal(studentDocumentPath(studentId), 'students/BAC-2026-XYZ');

    // Mirrored user document path
    assert.equal(studentMirroredUserPath(studentId), 'users/BAC-2026-XYZ');

    // Subcollection path
    assert.equal(
      studentSubcollectionPath(studentId, 'mistakes'), 
      'students/BAC-2026-XYZ/mistakes'
    );
    assert.equal(
      studentSubcollectionPath(studentId, 'sessions'), 
      'students/BAC-2026-XYZ/sessions'
    );

    // Error on empty identifier
    assert.throws(() => studentDocumentPath(''), StudentSessionError);
    assert.throws(() => studentDocumentPath('   '), StudentSessionError);
    assert.throws(() => studentSubcollectionPath('BAC-1', ''), StudentSessionError);
  });

  test('Test 5: requireStudentSession() fails safely when unauthenticated', () => {
    assert.throws(
      () => requireStudentSession(),
      (err: any) => {
        return err instanceof StudentSessionError && err.name === 'StudentSessionError';
      }
    );
  });

  test('Test 6: Legacy compatibility with existing storage keys', () => {
    // Simulate existing authenticated user key set by earlier versions of authenticateStudent
    const legacyUser = {
      id: 'STU-240-9999',
      docId: 'BAC-LEGACY-CODE',
      studentCode: 'BAC-LEGACY-CODE',
      phoneNumber: '0988776655',
      deviceId: 'DEV-LEGACY-1',
      fullName: 'طالب قديم',
      governorate: 'حلب'
    };

    // Stored only under legacy AUTHENTICATED_USER key
    mockStorage.setItem(STUDENT_STORAGE_KEYS.AUTHENTICATED_USER, JSON.stringify(legacyUser));

    const session = getCurrentStudentSession();
    assert.ok(session !== null, 'Legacy session should be read successfully');
    assert.equal(session.studentId, 'STU-240-9999');
    assert.equal(session.docId, 'BAC-LEGACY-CODE');
    assert.equal(session.phoneNumber, '0988776655');
    assert.equal(session.authenticated, true);
  });

  test('Test 7: Frontend Student Access Guard (assertStudentOwnership)', () => {
    const validProfile: UserProfile = {
      id: 'STU-240-5555',
      docId: 'BAC-STUDENT-A',
      fullName: 'عمر',
      phoneNumber: '0944556677',
      governorate: 'حمص',
      studentCode: 'BAC-STUDENT-A',
      deviceId: 'DEV-X',
      registeredAt: '2026-09-01',
      status: 'active',
      streakDays: 1,
      lastActiveDate: '2026-10-02',
      totalStudyMinutes: 30,
      rankTitle: 'طامح للـ 240',
      completedLessonsCount: 1
    };

    saveStudentSession(validProfile);

    // Should succeed when target matches docId, studentCode, or studentId
    assert.doesNotThrow(() => assertStudentOwnership('BAC-STUDENT-A'));
    assert.doesNotThrow(() => assertStudentOwnership('STU-240-5555'));

    // Should throw UnauthorizedStudentAccessError when target is different student
    assert.throws(
      () => assertStudentOwnership('BAC-ANOTHER-STUDENT'),
      (err: any) => {
        return (
          err instanceof UnauthorizedStudentAccessError && 
          err.name === 'UnauthorizedStudentAccessError' &&
          err.targetDocId === 'BAC-ANOTHER-STUDENT'
        );
      }
    );

    // Clear session and test unauthenticated guard failure
    clearStudentSession('BAC-STUDENT-A');
    assert.throws(() => assertStudentOwnership('BAC-STUDENT-A'), StudentSessionError);
  });

  test('Test 8: Canonical student document ID resolution', () => {
    const session = saveStudentSession({
      id: 'STU-240-1234',
      docId: 'DOC-5678',
      studentCode: 'CODE-9999',
      phoneNumber: '0911223344',
      deviceId: 'DEV-1',
      fullName: 'مريم',
      governorate: 'اللاذقية',
      registeredAt: '2026-09-01',
      status: 'active',
      streakDays: 2,
      lastActiveDate: '2026-10-02',
      totalStudyMinutes: 45,
      rankTitle: 'طامح للـ 240',
      completedLessonsCount: 3
    });

    // Resolves from active session
    assert.equal(getCanonicalStudentDocId(), 'DOC-5678');

    // Resolves from passed session/user
    assert.equal(getCanonicalStudentDocId(session), 'DOC-5678');
  });
});
