/**
 * Targeted Unit Tests for Student Authorization Preparation & Firestore Ownership Contract (Prompt 4)
 * 
 * Verifies all 8 required test specifications:
 * 1. Inventory Completeness: All collections are cataloged with appropriate access scopes and operations
 * 2. Authorized Student Write: Permitted when authenticated session matches target document and Firebase Auth UID
 * 3. Cross-Student Write Guard: Attempting to update another student's document is blocked
 * 4. Auth UID Mismatch Guard: Mismatch between session.firebaseAuthUid and Firebase Auth UID is blocked
 * 5. Unauthenticated Access Guard: Guest or unauthenticated users cannot perform student document writes or deletes
 * 6. Privilege Escalation Prevention: Forbidden fields (role, isAdmin, isPaid, isOwner, etc.) are stripped from updates
 * 7. Student Account Deletion Guard: Verifies ownership and auth identity before allowing deletion
 * 8. Collection Policy Enforcement: Writing to read-only collections (curriculumKnowledge, systemSettings) is blocked
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
  STUDENT_FIRESTORE_ACCESS_INVENTORY,
  STUDENT_ALLOWED_MUTABLE_FIELDS,
  STUDENT_FORBIDDEN_MUTABLE_FIELDS,
  getStudentAuthContext,
  verifyStudentWritePermission,
  assertStudentWritePermission,
  verifyStudentDeletePermission,
  assertStudentDeletePermission,
  sanitizeStudentUpdates,
  isAuthorizedStudentCollection,
  setStudentAuthContextOverrideForTesting
} from '../src/services/studentAuthorization';

import {
  saveStudentSession,
  clearStudentSession,
  UnauthorizedStudentAccessError
} from '../src/services/studentSession';

describe('Student Authorization Preparation & Firestore Ownership Contract (Prompt 4)', () => {
  beforeEach(() => {
    mockStorage.clear();
    clearStudentSession();
    setStudentAuthContextOverrideForTesting(null);
  });

  test('Test 1: Inventory completeness and access scope classifications', () => {
    assert.ok(STUDENT_FIRESTORE_ACCESS_INVENTORY['students'], 'students collection must be cataloged');
    assert.equal(STUDENT_FIRESTORE_ACCESS_INVENTORY['students'].scope, 'STUDENT_PRIVATE');
    assert.ok(STUDENT_FIRESTORE_ACCESS_INVENTORY['students'].requiresFirebaseAuth);

    assert.ok(STUDENT_FIRESTORE_ACCESS_INVENTORY['announcements'], 'announcements must be cataloged');
    assert.equal(STUDENT_FIRESTORE_ACCESS_INVENTORY['announcements'].scope, 'PUBLIC_READ');

    assert.ok(STUDENT_FIRESTORE_ACCESS_INVENTORY['systemSettings'], 'systemSettings must be cataloged');
    assert.equal(STUDENT_FIRESTORE_ACCESS_INVENTORY['systemSettings'].scope, 'PUBLIC_READ');

    assert.ok(STUDENT_FIRESTORE_ACCESS_INVENTORY['admins'], 'admins collection must be cataloged as ADMIN_EXCLUSIVE');
    assert.equal(STUDENT_FIRESTORE_ACCESS_INVENTORY['admins'].scope, 'ADMIN_EXCLUSIVE');
    assert.equal(STUDENT_FIRESTORE_ACCESS_INVENTORY['admins'].allowedOperations.length, 0);

    // Verify key fields exist in allowed and forbidden lists
    assert.ok(STUDENT_ALLOWED_MUTABLE_FIELDS.includes('points'));
    assert.ok(STUDENT_ALLOWED_MUTABLE_FIELDS.includes('completedLessonsCount'));
    assert.ok(STUDENT_FORBIDDEN_MUTABLE_FIELDS.includes('role'));
    assert.ok(STUDENT_FORBIDDEN_MUTABLE_FIELDS.includes('isAdmin'));
    assert.ok(STUDENT_FORBIDDEN_MUTABLE_FIELDS.includes('isPaid'));
  });

  test('Test 2: Authorized student write succeeds when session and Firebase Auth UID match', () => {
    const studentDocId = 'BAC-2026-STU01';
    const authUid = 'auth-uid-student-01';

    // Set up active authenticated session with bound UID
    saveStudentSession({
      id: 'stu-id-01',
      docId: studentDocId,
      studentCode: studentDocId,
      phoneNumber: '0911223344',
      fullName: 'أحمد السوري',
      governorate: 'دمشق',
      deviceId: 'DEV-1',
      registeredAt: '2026-09-01',
      status: 'active',
      streakDays: 5,
      lastActiveDate: '2026-10-03',
      totalStudyMinutes: 120,
      rankTitle: 'طامح للـ 240',
      completedLessonsCount: 10,
      firebaseAuthUid: authUid
    });

    // Provide matching runtime auth context
    setStudentAuthContextOverrideForTesting({
      isAuthenticated: true,
      authUid: authUid,
      session: {
        studentId: 'stu-id-01',
        docId: studentDocId,
        studentCode: studentDocId,
        phoneNumber: '0911223344',
        fullName: 'أحمد السوري',
        governorate: 'دمشق',
        deviceId: 'DEV-1',
        authenticated: true,
        firebaseAuthUid: authUid
      },
      canonicalDocId: studentDocId,
      isIdentityBound: true
    });


    const check = verifyStudentWritePermission(studentDocId, {
      points: 250,
      streakDays: 6
    });

    assert.equal(check.allowed, true);
    assert.deepEqual(check.sanitizedUpdates, {
      points: 250,
      streakDays: 6
    });

    // assertStudentWritePermission should return sanitized updates without throwing
    const sanitized = assertStudentWritePermission(studentDocId, { points: 260 });
    assert.equal(sanitized.points, 260);
  });

  test('Test 3: Cross-student write attempt is blocked', () => {
    const myDocId = 'MY-STUDENT-DOC-123';
    const targetVictimDocId = 'VICTIM-STUDENT-DOC-456';
    const authUid = 'auth-uid-attacker';

    setStudentAuthContextOverrideForTesting({
      isAuthenticated: true,
      authUid: authUid,
      session: {
        studentId: 'my-stu-id',
        docId: myDocId,
        studentCode: myDocId,
        phoneNumber: '0911223344',
        fullName: 'طالب مهاجم',
        governorate: 'دمشق',
        deviceId: 'DEV-1',
        authenticated: true,
        firebaseAuthUid: authUid
      },
      canonicalDocId: myDocId,
      isIdentityBound: true
    });

    const check = verifyStudentWritePermission(targetVictimDocId, { points: 9999 });
    assert.equal(check.allowed, false);
    assert.ok(check.reason?.includes('Unauthorized cross-student modification'));

    // assertStudentWritePermission should throw UnauthorizedStudentAccessError
    assert.throws(
      () => assertStudentWritePermission(targetVictimDocId, { points: 9999 }),
      (err: any) => err instanceof UnauthorizedStudentAccessError
    );
  });

  test('Test 4: Firebase Auth UID mismatch is blocked', () => {
    const studentDocId = 'BAC-2026-STU02';
    const sessionAuthUid = 'session-uid-original';
    const activeAuthUid = 'different-active-auth-uid';

    setStudentAuthContextOverrideForTesting({
      isAuthenticated: true,
      authUid: activeAuthUid,
      session: {
        studentId: 'stu-02',
        docId: studentDocId,
        studentCode: studentDocId,
        phoneNumber: '0922334455',
        fullName: 'طالب حقيقي',
        governorate: 'حلب',
        deviceId: 'DEV-2',
        authenticated: true,
        firebaseAuthUid: sessionAuthUid // Mismatch!
      },
      canonicalDocId: studentDocId,
      isIdentityBound: false
    });

    const check = verifyStudentWritePermission(studentDocId, { points: 50 });
    assert.equal(check.allowed, false);
    assert.ok(check.reason?.includes('Firebase Auth UID mismatch'));

    assert.throws(
      () => assertStudentWritePermission(studentDocId, { points: 50 }),
      (err: any) => err instanceof UnauthorizedStudentAccessError
    );
  });

  test('Test 5: Unauthenticated guest cannot perform student writes or deletes', () => {
    // No active session, no auth UID
    setStudentAuthContextOverrideForTesting({
      isAuthenticated: false,
      authUid: null,
      session: null,
      canonicalDocId: null,
      isIdentityBound: false
    });

    const writeCheck = verifyStudentWritePermission('ANY-DOC-ID', { points: 10 });
    assert.equal(writeCheck.allowed, false);
    assert.ok(writeCheck.reason?.includes('No active authenticated student session'));

    const deleteCheck = verifyStudentDeletePermission('ANY-DOC-ID');
    assert.equal(deleteCheck.allowed, false);

    assert.throws(
      () => assertStudentWritePermission('ANY-DOC-ID', { points: 10 }),
      (err: any) => err instanceof UnauthorizedStudentAccessError
    );

    assert.throws(
      () => assertStudentDeletePermission('ANY-DOC-ID'),
      (err: any) => err instanceof UnauthorizedStudentAccessError
    );
  });

  test('Test 6: Privilege escalation prevention: forbidden fields are stripped safely', () => {
    const maliciousPayload = {
      points: 150,
      streak: 3,
      role: 'admin',
      isAdmin: true,
      isPaid: true,
      isOwner: true,
      adminRole: 'super_admin',
      activationCode: 'STOLEN-CODE',
      firebaseAuthUid: 'fake-injected-uid',
      'role.admin': true
    };

    const sanitized = sanitizeStudentUpdates(maliciousPayload);

    // Allowed fields preserved
    assert.equal(sanitized.points, 150);
    assert.equal(sanitized.streak, 3);

    // Privileged and forbidden fields stripped
    assert.equal(sanitized.role, undefined);
    assert.equal(sanitized.isAdmin, undefined);
    assert.equal(sanitized.isPaid, undefined);
    assert.equal(sanitized.isOwner, undefined);
    assert.equal(sanitized.adminRole, undefined);
    assert.equal(sanitized.activationCode, undefined);
    assert.equal(sanitized.firebaseAuthUid, undefined);
    assert.equal(sanitized['role.admin'], undefined);
  });

  test('Test 7: Student account deletion verifies ownership and auth identity', () => {
    const studentDocId = 'DOC-TO-DELETE-77';
    const authUid = 'auth-uid-77';

    // Authorized case
    setStudentAuthContextOverrideForTesting({
      isAuthenticated: true,
      authUid: authUid,
      session: {
        studentId: 'id-77',
        docId: studentDocId,
        studentCode: studentDocId,
        phoneNumber: '0977889900',
        fullName: 'طالب سيتم حذفه',
        governorate: 'حماة',
        deviceId: 'DEV-77',
        authenticated: true,
        firebaseAuthUid: authUid
      },
      canonicalDocId: studentDocId,
      isIdentityBound: true
    });

    const allowedCheck = verifyStudentDeletePermission(studentDocId);
    assert.equal(allowedCheck.allowed, true);
    assert.doesNotThrow(() => assertStudentDeletePermission(studentDocId));

    // Attempting to delete another student's account
    const forbiddenCheck = verifyStudentDeletePermission('ANOTHER-STUDENT-DOC');
    assert.equal(forbiddenCheck.allowed, false);
    assert.ok(forbiddenCheck.reason?.includes('Unauthorized account deletion'));
    assert.throws(
      () => assertStudentDeletePermission('ANOTHER-STUDENT-DOC'),
      (err: any) => err instanceof UnauthorizedStudentAccessError
    );
  });

  test('Test 8: Student writing to read-only educational collections is blocked by policy', () => {
    // Reading public collections is allowed
    assert.equal(isAuthorizedStudentCollection('announcements', 'read'), true);
    assert.equal(isAuthorizedStudentCollection('announcements', 'listen'), true);
    assert.equal(isAuthorizedStudentCollection('planWeeks', 'read'), true);
    assert.equal(isAuthorizedStudentCollection('curriculumKnowledge', 'read'), true);

    // Writing to public collections is blocked
    assert.equal(isAuthorizedStudentCollection('announcements', 'update'), false);
    assert.equal(isAuthorizedStudentCollection('systemSettings', 'update'), false);
    assert.equal(isAuthorizedStudentCollection('planWeeks', 'create'), false);
    assert.equal(isAuthorizedStudentCollection('curriculumKnowledge', 'update'), false);

    // Writing or reading admins collection is completely blocked
    assert.equal(isAuthorizedStudentCollection('admins', 'read'), false);
    assert.equal(isAuthorizedStudentCollection('admins', 'update'), false);
    assert.equal(isAuthorizedStudentCollection('admins', 'delete'), false);
  });
});
