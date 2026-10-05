/**
 * BAC-240 Firebase Rules Emulator Real Validation Suite (Prompt 7)
 * 
 * Executes against the ACTUAL Firebase Firestore Emulator.
 * Validates real Security Rules evaluation in cloud.firestore runtime.
 * 
 * Covers all 6 primary requirement categories and 23+ core test specifications:
 * Group A: Admin & Owner Authorization
 * Group B: Student Profile & Ownership Protection
 * Group C: Secure Leaderboard (Public Read, Owner/Admin Write, Sensitive Field Guard)
 * Group D: Activation Codes (Enumeration Prevention, Safe Burning, Admin Exclusive)
 * Group E: System Settings (systemSettings vs system_settings isolation)
 * Group F: Educational Content Read-Only & Strict Default Deny
 */

import { 
  initializeTestEnvironment, 
  assertSucceeds, 
  assertFails,
  RulesTestEnvironment 
} from '@firebase/rules-unit-testing';
import * as fs from 'fs';
import * as path from 'path';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  getDocs 
} from 'firebase/firestore';

const PROJECT_ID = 'demo-bac240-test';
const RULES_PATH = path.resolve(process.cwd(), 'firestore.rules');

let testEnv: RulesTestEnvironment;

// Test Actor Identifiers
const OWNER_UID = 'owner-root-uid-001';
const ADMIN_UID = 'admin-officer-uid-002';
const INACTIVE_ADMIN_UID = 'admin-inactive-uid-003';
const STUDENT_A_UID = 'student-auth-uid-101';
const STUDENT_B_UID = 'student-auth-uid-202';
const STRANGER_UID = 'stranger-auth-uid-999';

interface TestResult {
  group: string;
  id: string;
  name: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

const results: TestResult[] = [];

async function runTestCase(
  group: string,
  id: string,
  name: string,
  fn: () => Promise<void>
): Promise<void> {
  const start = Date.now();
  try {
    await fn();
    const durationMs = Date.now() - start;
    results.push({ group, id, name, passed: true, durationMs });
    console.log(`  \x1b[32m✔\x1b[0m [${id}] ${name} (${durationMs}ms)`);
  } catch (err: any) {
    const durationMs = Date.now() - start;
    results.push({ 
      group, 
      id, 
      name, 
      passed: false, 
      error: err?.message || String(err), 
      durationMs 
    });
    console.error(`  \x1b[31m✖\x1b[0m [${id}] ${name} (${durationMs}ms)`);
    console.error(`    -> Error: ${err?.message || err}`);
  }
}

async function setupBaselineFixtures() {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const adminDb = context.firestore();

    // 1. Seed Owner Admin
    await setDoc(doc(adminDb, 'admins', OWNER_UID), {
      fullName: 'المالك المؤسس',
      role: 'owner',
      active: true,
      createdAt: '2026-09-01T00:00:00Z',
      email: 'owner@bac240.edu'
    });

    // 2. Seed Regular Active Admin
    await setDoc(doc(adminDb, 'admins', ADMIN_UID), {
      fullName: 'المشرف الأكاديمي',
      role: 'admin',
      active: true,
      createdAt: '2026-09-01T00:00:00Z',
      email: 'admin@bac240.edu'
    });

    // 3. Seed Inactive Admin
    await setDoc(doc(adminDb, 'admins', INACTIVE_ADMIN_UID), {
      fullName: 'مشرف معطّل',
      role: 'admin',
      active: false,
      createdAt: '2026-09-01T00:00:00Z',
      email: 'inactive@bac240.edu'
    });

    // 4. Seed Student A record
    await setDoc(doc(adminDb, 'students', 'student-doc-101'), {
      studentId: 'student-doc-101',
      studentCode: 'BAC-101',
      fullName: 'أحمد السوري',
      phoneNumber: '0911223344',
      governorate: 'دمشق',
      firebaseAuthUid: STUDENT_A_UID,
      role: 'student',
      activationCode: 'ACT-AAA-111',
      points: 150,
      streak: 5
    });

    // 5. Seed Student B record
    await setDoc(doc(adminDb, 'students', 'student-doc-202'), {
      studentId: 'student-doc-202',
      studentCode: 'BAC-202',
      fullName: 'سارة الحلبية',
      phoneNumber: '0922334455',
      governorate: 'حلب',
      firebaseAuthUid: STUDENT_B_UID,
      role: 'student',
      activationCode: 'ACT-BBB-222',
      points: 320,
      streak: 12
    });

    // 6. Seed Activation Codes
    // Code 1: Unused fresh code
    await setDoc(doc(adminDb, 'activationCodes', 'CODE-UNUSED-999'), {
      code: 'CODE-UNUSED-999',
      isUsed: false,
      usedBy: null,
      createdAt: '2026-09-01'
    });

    // Code 2: Used code by Student B
    await setDoc(doc(adminDb, 'activationCodes', 'CODE-USED-888'), {
      code: 'CODE-USED-888',
      isUsed: true,
      usedBy: STUDENT_B_UID,
      usedAt: '2026-09-02'
    });

    // 7. Seed System Settings
    await setDoc(doc(adminDb, 'systemSettings', 'platformStatus'), {
      isMaintenanceMode: false,
      maintenanceMessage: 'المنصة تعمل بصورة طبيعية'
    });

    await setDoc(doc(adminDb, 'system_settings', 'admin_config'), {
      maxAdminsAllowed: 10,
      rootAuditLogging: true
    });

    // 8. Seed Educational Content
    await setDoc(doc(adminDb, 'announcements', 'announcement-01'), {
      title: 'بدء التسجيل للمكثفة',
      content: 'نرحب بجميع الطلاب...',
      publishedAt: '2026-09-01'
    });

    await setDoc(doc(adminDb, 'exams', 'exam-published-01'), {
      title: 'امتحان الرياضيات النهائي',
      isPublished: true
    });

    await setDoc(doc(adminDb, 'exams', 'exam-draft-02'), {
      title: 'مسودة امتحان الفيزياء السري',
      isPublished: false
    });
  });
}

async function runAllTests() {
  console.log('\n============================================================');
  console.log('🚀 بدء اختبارات قواعد الحماية على Firebase Firestore Emulator');
  console.log('============================================================\n');

  const rulesContent = fs.readFileSync(RULES_PATH, 'utf8');

  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host: '127.0.0.1',
      port: 8085,
      rules: rulesContent
    }
  });

  await setupBaselineFixtures();

  // Helper context accessors
  const unauthDb = () => testEnv.unauthenticatedContext().firestore();
  const studentADb = () => testEnv.authenticatedContext(STUDENT_A_UID).firestore();
  const studentBDb = () => testEnv.authenticatedContext(STUDENT_B_UID).firestore();
  const strangerDb = () => testEnv.authenticatedContext(STRANGER_UID).firestore();
  const inactiveAdminDb = () => testEnv.authenticatedContext(INACTIVE_ADMIN_UID).firestore();
  const adminDb = () => testEnv.authenticatedContext(ADMIN_UID).firestore();
  const ownerDb = () => testEnv.authenticatedContext(OWNER_UID).firestore();

  // =========================================================================
  // GROUP A: ADMIN & OWNER AUTHORIZATION
  // =========================================================================
  console.log('\n--- المجموعة أ: مصادقة المشرفين والمالك (Admin & Owner Authorization) ---');

  await runTestCase('Admin & Owner', 'TC-A01', 'مستخدم غير مسجل لا يستطيع قراءة أو كتابة أي مستند إداري (admins/{uid})', async () => {
    await assertFails(getDoc(doc(unauthDb(), 'admins', OWNER_UID)));
    await assertFails(setDoc(doc(unauthDb(), 'admins', 'fake-admin'), { role: 'admin' }));
  });

  await runTestCase('Admin & Owner', 'TC-A02', 'مستخدم مسجل لكنه ليس مشرفاً لا يستطيع استعراض أو قراءة سجلات المشرفين الآخرين', async () => {
    await assertFails(getDoc(doc(studentADb(), 'admins', OWNER_UID)));
    await assertFails(getDocs(collection(studentADb(), 'admins')));
  });

  await runTestCase('Admin & Owner', 'TC-A03', 'مستخدم مسجل لا يستطيع ترقية نفسه إلى مشرف في admins/{uid} (منع الترقية الذاتية)', async () => {
    await assertFails(setDoc(doc(studentADb(), 'admins', STUDENT_A_UID), {
      fullName: 'هاكر متسلل',
      role: 'admin',
      active: true
    }));
  });

  await runTestCase('Admin & Owner', 'TC-A04', 'مشرف غير نشط (active == false) يتم رفض وصوله إلى الصلاحيات الإدارية', async () => {
    // Cannot list students
    await assertFails(getDocs(collection(inactiveAdminDb(), 'students')));
    // Cannot update educational content
    await assertFails(updateDoc(doc(inactiveAdminDb(), 'announcements', 'announcement-01'), {
      content: 'تعديل غير مصرح'
    }));
  });

  await runTestCase('Admin & Owner', 'TC-A05', 'مشرف نشط (role: admin) يستطيع قراءة وثائق الطلاب', async () => {
    await assertSucceeds(getDoc(doc(adminDb(), 'students', 'student-doc-101')));
    await assertSucceeds(getDocs(collection(adminDb(), 'students')));
  });

  await runTestCase('Admin & Owner', 'TC-A06', 'مشرف نشط (role: admin) يستطيع تحديث المحتوى التعليمي', async () => {
    await assertSucceeds(updateDoc(doc(adminDb(), 'announcements', 'announcement-01'), {
      content: 'تحديث معتمد من المشرف الأكاديمي'
    }));
  });

  await runTestCase('Admin & Owner', 'TC-A07', 'مشرف نشط (role: admin) لا يستطيع إنشاء مشرفين جدد (حصرية للمالك)', async () => {
    await assertFails(setDoc(doc(adminDb(), 'admins', 'new-admin-uid-999'), {
      fullName: 'مشرف جديد غير مصرح',
      role: 'admin',
      active: true
    }));
  });

  await runTestCase('Admin & Owner', 'TC-A08', 'مشرف نشط (role: admin) لا يستطيع حذف المشرفين الآخرين (حصرية للمالك)', async () => {
    await assertFails(deleteDoc(doc(adminDb(), 'admins', INACTIVE_ADMIN_UID)));
  });

  await runTestCase('Admin & Owner', 'TC-A09', 'مشرف نشط (role: admin) لا يستطيع ترقية نفسه إلى owner', async () => {
    await assertFails(updateDoc(doc(adminDb(), 'admins', ADMIN_UID), {
      role: 'owner'
    }));
  });

  await runTestCase('Admin & Owner', 'TC-A10', 'المالك المعتمد (role: owner) يستطيع إنشاء وتعديل وحذف المشرفين الآخرين', async () => {
    const tempAdminUid = 'temp-officer-uid-555';
    // Create
    await assertSucceeds(setDoc(doc(ownerDb(), 'admins', tempAdminUid), {
      fullName: 'مشرف مؤقت',
      role: 'admin',
      active: true,
      createdAt: '2026-10-01'
    }));
    // Update
    await assertSucceeds(updateDoc(doc(ownerDb(), 'admins', tempAdminUid), {
      fullName: 'مشرف مؤقت معدل'
    }));
    // Delete
    await assertSucceeds(deleteDoc(doc(ownerDb(), 'admins', tempAdminUid)));
  });

  await runTestCase('Admin & Owner', 'TC-A11', 'المالك المعتمد لا يستطيع حذف حسابه الجذري بنفسه (Self-Deletion Prevention)', async () => {
    await assertFails(deleteDoc(doc(ownerDb(), 'admins', OWNER_UID)));
  });

  // =========================================================================
  // GROUP B: STUDENT PROFILE & OWNERSHIP PROTECTION
  // =========================================================================
  console.log('\n--- المجموعة ب: وثائق الطلاب وحماية الملكية (Student Profile & Ownership) ---');

  await runTestCase('Student Ownership', 'TC-B01', 'طالب موثق يستطيع قراءة وتحديث ملفه الخاص المطابق لـ firebaseAuthUid', async () => {
    // Read own document
    await assertSucceeds(getDoc(doc(studentADb(), 'students', 'student-doc-101')));
    // Update own progress fields
    await assertSucceeds(updateDoc(doc(studentADb(), 'students', 'student-doc-101'), {
      points: 160,
      streak: 6
    }));
  });

  await runTestCase('Student Ownership', 'TC-B02', 'طالب موثق يستطيع إنشاء مستند طالب جديد لنفسه مع الحقول المسموحة', async () => {
    await assertSucceeds(setDoc(doc(strangerDb(), 'students', 'new-student-doc'), {
      studentId: 'new-student-doc',
      studentCode: 'BAC-NEW',
      fullName: 'طالب جديد',
      phoneNumber: '0988776655',
      governorate: 'حمص',
      firebaseAuthUid: STRANGER_UID,
      role: 'student',
      points: 0
    }));
  });

  await runTestCase('Student Ownership', 'TC-B03', 'طالب لا يستطيع قراءة أو استعراض مستندات الطلاب الآخرين', async () => {
    // Student A tries to read Student B
    await assertFails(getDoc(doc(studentADb(), 'students', 'student-doc-202')));
    // Student A tries to list all students
    await assertFails(getDocs(collection(studentADb(), 'students')));
  });

  await runTestCase('Student Ownership', 'TC-B04', 'طالب لا يستطيع تعديل مستند طالب آخر', async () => {
    await assertFails(updateDoc(doc(studentADb(), 'students', 'student-doc-202'), {
      points: 9999
    }));
  });

  await runTestCase('Student Ownership', 'TC-B05', 'طالب لا يستطيع تعديل حقل firebaseAuthUid لنقل ملكية المستند', async () => {
    await assertFails(updateDoc(doc(studentADb(), 'students', 'student-doc-101'), {
      firebaseAuthUid: STUDENT_B_UID
    }));
  });

  await runTestCase('Student Ownership', 'TC-B06', 'طالب لا يستطيع ترقية نفسه أمنياً بتعديل role أو isAdmin أو isOwner', async () => {
    await assertFails(updateDoc(doc(studentADb(), 'students', 'student-doc-101'), {
      role: 'admin'
    }));
    await assertFails(updateDoc(doc(studentADb(), 'students', 'student-doc-101'), {
      isAdmin: true
    }));
    await assertFails(updateDoc(doc(studentADb(), 'students', 'student-doc-101'), {
      isOwner: true
    }));
  });

  await runTestCase('Student Ownership', 'TC-B07', 'طالب لا يستطيع تعديل activationCode أو studentCode في ملفه', async () => {
    await assertFails(updateDoc(doc(studentADb(), 'students', 'student-doc-101'), {
      activationCode: 'HACKED-CODE'
    }));
    await assertFails(updateDoc(doc(studentADb(), 'students', 'student-doc-101'), {
      studentCode: 'BAC-HACK'
    }));
  });

  await runTestCase('Student Ownership', 'TC-B08', 'طالب يستطيع حذف حسابه الخاص، ولا يستطيع حذف حساب طالب آخر', async () => {
    // Delete another student: rejected
    await assertFails(deleteDoc(doc(studentADb(), 'students', 'student-doc-202')));
    // Delete own student: allowed
    await assertSucceeds(deleteDoc(doc(studentADb(), 'students', 'student-doc-101')));
  });

  // =========================================================================
  // GROUP C: SECURE LEADERBOARD
  // =========================================================================
  console.log('\n--- المجموعة ج: لائحة الشرف الآمنة (Secure Leaderboard) ---');

  await runTestCase('Leaderboard', 'TC-C01', 'أي مستخدم (حتى غير موثق) يستطيع قراءة سجلات leaderboard', async () => {
    await assertSucceeds(getDocs(collection(unauthDb(), 'leaderboard')));
    await assertSucceeds(getDoc(doc(unauthDb(), 'leaderboard', 'student-doc-202')));
  });

  await runTestCase('Leaderboard', 'TC-C02', 'طالب موثق يستطيع إنشاء سجله الخاص في leaderboard بحقول عامة فقط ومطابقة UID', async () => {
    await assertSucceeds(setDoc(doc(studentBDb(), 'leaderboard', 'student-doc-202'), {
      id: 'student-doc-202',
      studentId: 'student-doc-202',
      fullName: 'سارة الحلبية',
      governorate: 'حلب',
      streakDays: 12,
      points: 320,
      rankTitle: 'طالب متميز',
      badge: 'gold',
      completedLessonsCount: 45,
      studyHours: 80,
      updatedAt: '2026-10-01',
      firebaseAuthUid: STUDENT_B_UID
    }));
  });

  await runTestCase('Leaderboard', 'TC-C03', 'طالب لا يستطيع إنشاء أو تعديل سجل leaderboard لطالب آخر', async () => {
    // Student A tries to update Student B's leaderboard
    await assertFails(updateDoc(doc(studentADb(), 'leaderboard', 'student-doc-202'), {
      points: 10
    }));
    // Student A tries to create leaderboard entry for Student B's UID
    await assertFails(setDoc(doc(studentADb(), 'leaderboard', 'student-doc-fake'), {
      studentId: 'student-doc-fake',
      fullName: 'طالب مزور',
      firebaseAuthUid: STUDENT_B_UID,
      points: 100
    }));
  });

  await runTestCase('Leaderboard', 'TC-C04', 'طالب لا يستطيع حقن حقول خاصة أو حساسة (phone, activationCode, deviceId, role...) في leaderboard', async () => {
    // Injecting phone number
    await assertFails(updateDoc(doc(studentBDb(), 'leaderboard', 'student-doc-202'), {
      phoneNumber: '0922334455'
    }));
    // Injecting activationCode
    await assertFails(updateDoc(doc(studentBDb(), 'leaderboard', 'student-doc-202'), {
      activationCode: 'SECRET-CODE'
    }));
    // Injecting deviceId
    await assertFails(updateDoc(doc(studentBDb(), 'leaderboard', 'student-doc-202'), {
      deviceId: 'DEVICE-XXX'
    }));
    // Injecting email
    await assertFails(updateDoc(doc(studentBDb(), 'leaderboard', 'student-doc-202'), {
      email: 'sara@secret.com'
    }));
    // Injecting role / isAdmin
    await assertFails(updateDoc(doc(studentBDb(), 'leaderboard', 'student-doc-202'), {
      isAdmin: true
    }));
  });

  await runTestCase('Leaderboard', 'TC-C05', 'مشرف معتمد يستطيع تعديل أو حذف أي سجل في leaderboard', async () => {
    await assertSucceeds(updateDoc(doc(adminDb(), 'leaderboard', 'student-doc-202'), {
      points: 350
    }));
    await assertSucceeds(deleteDoc(doc(adminDb(), 'leaderboard', 'student-doc-202')));
  });

  // =========================================================================
  // GROUP D: ACTIVATION CODES
  // =========================================================================
  console.log('\n--- المجموعة د: أكواد التفعيل (Activation Codes) ---');

  await runTestCase('Activation Codes', 'TC-D01', 'مستخدم عادي أو غير موثق لا يستطيع استعراض (list) كولكشن activationCodes بالكامل', async () => {
    await assertFails(getDocs(collection(unauthDb(), 'activationCodes')));
    await assertFails(getDocs(collection(studentADb(), 'activationCodes')));
  });

  await runTestCase('Activation Codes', 'TC-D02', 'مستخدم يستطيع جلب (get) كود غير مستخدم محدد (isUsed == false)', async () => {
    await assertSucceeds(getDoc(doc(studentADb(), 'activationCodes', 'CODE-UNUSED-999')));
  });

  await runTestCase('Activation Codes', 'TC-D03', 'مستخدم يستطيع حرق الكود غير المستخدم بتعديل isUsed إلى true أثناء التفعيل', async () => {
    await assertSucceeds(updateDoc(doc(studentADb(), 'activationCodes', 'CODE-UNUSED-999'), {
      isUsed: true
    }));
  });

  await runTestCase('Activation Codes', 'TC-D04', 'مستخدم عادي لا يستطيع تعديل كود مستخدم مسبقاً لشخص آخر', async () => {
    await assertFails(updateDoc(doc(studentADb(), 'activationCodes', 'CODE-USED-888'), {
      usedBy: STUDENT_A_UID
    }));
  });

  await runTestCase('Activation Codes', 'TC-D05', 'مستخدم عادي لا يستطيع إنشاء أو حذف أكواد التفعيل', async () => {
    await assertFails(setDoc(doc(studentADb(), 'activationCodes', 'CODE-FAKE-777'), {
      code: 'CODE-FAKE-777',
      isUsed: false
    }));
    await assertFails(deleteDoc(doc(studentADb(), 'activationCodes', 'CODE-USED-888')));
  });

  await runTestCase('Activation Codes', 'TC-D06', 'مشرف معتمد يستطيع استعراض وإنشاء وتعديل وحذف أكواد التفعيل بالكامل', async () => {
    // List
    await assertSucceeds(getDocs(collection(adminDb(), 'activationCodes')));
    // Create
    await assertSucceeds(setDoc(doc(adminDb(), 'activationCodes', 'CODE-ADMIN-123'), {
      code: 'CODE-ADMIN-123',
      isUsed: false,
      createdAt: '2026-10-01'
    }));
    // Delete
    await assertSucceeds(deleteDoc(doc(adminDb(), 'activationCodes', 'CODE-ADMIN-123')));
  });

  // =========================================================================
  // GROUP E: SYSTEM SETTINGS (ISOLATION OF PUBLIC & PRIVATE)
  // =========================================================================
  console.log('\n--- المجموعة هـ: إعدادات النظام والعزل الأمني (System Settings) ---');

  await runTestCase('System Settings', 'TC-E01', 'كولكشن systemSettings العامة: القراءة مسموحة للجميع بما فيهم الزوار', async () => {
    await assertSucceeds(getDoc(doc(unauthDb(), 'systemSettings', 'platformStatus')));
    await assertSucceeds(getDoc(doc(studentADb(), 'systemSettings', 'platformStatus')));
  });

  await runTestCase('System Settings', 'TC-E02', 'كولكشن systemSettings العامة: الكتابة محصورة بالمشرفين وممنوعة على الطلاب', async () => {
    await assertFails(setDoc(doc(studentADb(), 'systemSettings', 'platformStatus'), {
      isMaintenanceMode: true
    }));
    await assertSucceeds(setDoc(doc(adminDb(), 'systemSettings', 'platformStatus'), {
      isMaintenanceMode: false,
      maintenanceMessage: 'تم التحديث بواسطة المشرف'
    }));
  });

  await runTestCase('System Settings', 'TC-E03', 'كولكشن system_settings الإدارية الخاصة: القراءة والكتابة ممنوعة على الطلاب والزوار ومحصورة بالمشرف', async () => {
    // Read fails for unauth & student
    await assertFails(getDoc(doc(unauthDb(), 'system_settings', 'admin_config')));
    await assertFails(getDoc(doc(studentADb(), 'system_settings', 'admin_config')));
    // Write fails for student
    await assertFails(setDoc(doc(studentADb(), 'system_settings', 'admin_config'), {
      hacked: true
    }));
    // Read & Write succeeds for admin
    await assertSucceeds(getDoc(doc(adminDb(), 'system_settings', 'admin_config')));
    await assertSucceeds(updateDoc(doc(adminDb(), 'system_settings', 'admin_config'), {
      maxAdminsAllowed: 12
    }));
  });

  // =========================================================================
  // GROUP F: EDUCATIONAL CONTENT & DEFAULT DENY
  // =========================================================================
  console.log('\n--- المجموعة و: المحتوى التعليمي ورفض المسارات غير المعرفة (Content & Default Deny) ---');

  await runTestCase('Educational Content', 'TC-F01', 'المحتوى التعليمي (الإعلانات، المناهج، الملفات): القراءة مسموحة والكتابة محصورة بالمشرف', async () => {
    // Public read
    await assertSucceeds(getDoc(doc(unauthDb(), 'announcements', 'announcement-01')));
    await assertSucceeds(getDoc(doc(studentADb(), 'announcements', 'announcement-01')));
    // Student write fails
    await assertFails(setDoc(doc(studentADb(), 'announcements', 'fake-news'), {
      title: 'إعلان مزيف'
    }));
    // Admin write succeeds
    await assertSucceeds(setDoc(doc(adminDb(), 'announcements', 'official-news'), {
      title: 'إعلان رسمي جديد',
      content: 'محتوى معتمد'
    }));
  });

  await runTestCase('Educational Content', 'TC-F02', 'الامتحانات: الطلاب يقرأون الامتحانات المنشورة فقط (isPublished: true) ويُمنع عنهم المسودات', async () => {
    // Published exam: read succeeds for student
    await assertSucceeds(getDoc(doc(studentADb(), 'exams', 'exam-published-01')));
    // Draft exam: read FAILS for student
    await assertFails(getDoc(doc(studentADb(), 'exams', 'exam-draft-02')));
    // Draft exam: read SUCCEEDS for admin
    await assertSucceeds(getDoc(doc(adminDb(), 'exams', 'exam-draft-02')));
  });

  await runTestCase('Educational Content', 'TC-F03', 'أي مسار أو كولكشن غير معرّف أو غير مصرح: يتم رفضه افتراضياً (Default Deny)', async () => {
    // Reading/Writing to secret/unlisted collections
    await assertFails(getDoc(doc(studentADb(), 'internal_secrets', 'key1')));
    await assertFails(setDoc(doc(studentADb(), 'internal_secrets', 'key1'), { token: '123' }));
    await assertFails(getDoc(doc(adminDb(), 'undefined_collection', 'doc1')));
    await assertFails(setDoc(doc(ownerDb(), 'unknown_store', 'doc1'), { val: 42 }));
  });

  // =========================================================================
  // SUMMARY REPORT
  // =========================================================================
  await testEnv.cleanup();

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;
  const totalCount = results.length;

  console.log('\n============================================================');
  console.log(`📊 ملخص نتائج اختبارات Firebase Rules Emulator:`);
  console.log(`   الإجمالي: ${totalCount}`);
  console.log(`   الناجحة: \x1b[32m${passedCount}\x1b[0m`);
  console.log(`   الفاشلة: ${failedCount > 0 ? `\x1b[31m${failedCount}\x1b[0m` : '0'}`);
  console.log('============================================================\n');

  if (failedCount > 0) {
    console.error('❌ توجد اختبارات فاشلة:');
    results.filter(r => !r.passed).forEach(r => {
      console.error(`   - [${r.id}] ${r.name}: ${r.error}`);
    });
    process.exit(1);
  } else {
    console.log('🎉 جميع اختبارات Firebase Rules Emulator اجتازت بنجاح 100%!');
  }
}

runAllTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
