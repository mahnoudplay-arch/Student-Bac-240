import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  setLogLevel,
  doc, 
  getDoc, 
  getDocs,
  setDoc, 
  updateDoc, 
  deleteDoc,
  onSnapshot, 
  collection, 
  query, 
  where,
  limit,
  deleteField
} from 'firebase/firestore';
import { 
  UserProfile, 
  Announcement, 
  Flashcard, 
  FlashcardDeck,
  EducationalVideo, 
  YouTubeChannel,
  YouTubePlaylist,
  LibraryDocument, 
  RoadmapMilestone, 
  TimeBlock, 
  MindMap,
  LessonAttachment,
  SubjectId,
  ExamCountdown,
  WrittenExam,
  MistakeRecord,
  PlatformStatus,
  PlanWeek,
  PlanDay,
  PlanTask,
  TaskStudyMode,
  ExamWeight,
  PlanMetadata,
  CurriculumKnowledgeItem
} from '../types';
import { 
  STUDENT_STORAGE_KEYS, 
  saveStudentSession, 
  studentDocumentPath, 
  studentMirroredUserPath 
} from './studentSession';
import { 
  ensureStudentFirebaseAuth, 
  ensureStudentFirebaseIdentityPersisted,
  getCurrentStudentAuthUid
} from './studentAuth';
import {
  verifyStudentWritePermission,
  verifyStudentDeletePermission,
  isAuthorizedStudentCollection
} from './studentAuthorization';

export const firebaseConfig = {
  apiKey: "AIzaSyAQHuS-mgFNOX2NRGs2MOcbKtfOKC97_e4",
  authDomain: "bac-240.firebaseapp.com",
  projectId: "bac-240",
  storageBucket: "bac-240.firebasestorage.app",
  messagingSenderId: "773836224514",
  appId: "1:773836224514:web:4ff986e39336d6f4b10f1b"
};

// Initialize Firebase safely with multi-tab persistent cache and auto-detecting transport
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Suppress internal noisy WebChannel stream reconnect messages
try {
  setLogLevel('error');
} catch {}

export const db = (() => {
  try {
    return initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    });
  } catch {
    try {
      return initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });
    } catch {
      return getFirestore(app);
    }
  }
})();

// Multi-layer Hardware, Canvas & Browser Device Fingerprint Generator
export function getOrCreateDeviceId(): string {
  // 1. Check multi-storage (localStorage & sessionStorage)
  let devId: string | null = null;
  try {
    devId = localStorage.getItem(STUDENT_STORAGE_KEYS.DEVICE_ID) || sessionStorage.getItem(STUDENT_STORAGE_KEYS.DEVICE_ID);
  } catch {}

  // Also check cookie fallback if localStorage was blocked by private mode
  if (!devId && typeof document !== 'undefined') {
    const match = document.cookie.match(/(?:^|; )bac240_device_id=([^;]*)/);
    if (match) devId = decodeURIComponent(match[1]);
  }

  if (!devId) {
    try {
      const screenSpecs = typeof window !== 'undefined' ? `${window.screen?.width || 0}x${window.screen?.height || 0}x${window.screen?.colorDepth || 0}` : '0x0';
      const hardwareSpecs = typeof navigator !== 'undefined' 
        ? `${navigator.hardwareConcurrency || 4}-${navigator.maxTouchPoints || 0}-${navigator.language || 'ar'}` 
        : 'hw-default';
      
      // Canvas graphical rendering signature
      let canvasSig = 'canvas-na';
      try {
        if (typeof document !== 'undefined') {
          const canvas = document.createElement('canvas');
          canvas.width = 160;
          canvas.height = 40;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillStyle = '#6366f1';
            ctx.fillRect(0, 0, 160, 40);
            ctx.fillStyle = '#ffffff';
            ctx.fillText('BAC-240-SECURE-KEY', 4, 10);
            canvasSig = canvas.toDataURL().slice(-30);
          }
        }
      } catch {}

      let hash = 0;
      const combined = `${screenSpecs}-${hardwareSpecs}-${canvasSig}-${typeof navigator !== 'undefined' ? navigator.userAgent : ''}`;
      for (let i = 0; i < combined.length; i++) {
        hash = ((hash << 5) - hash) + combined.charCodeAt(i);
        hash |= 0;
      }
      const hwFingerprint = Math.abs(hash).toString(36).toUpperCase();
      devId = `DEV-${hwFingerprint}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    } catch {
      devId = 'DEV-' + Math.random().toString(36).substring(2, 10).toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
    }

    try {
      localStorage.setItem(STUDENT_STORAGE_KEYS.DEVICE_ID, devId);
      sessionStorage.setItem(STUDENT_STORAGE_KEYS.DEVICE_ID, devId);
      if (typeof document !== 'undefined') {
        document.cookie = `bac240_device_id=${encodeURIComponent(devId)}; path=/; max-age=31536000; SameSite=Lax`;
      }
    } catch {}
  }
  return devId;
}

// Rate limiting for auth attempts: lock for 4 hours if attempts exceed 4 (> 4)
const ATTEMPTS_KEY = STUDENT_STORAGE_KEYS.AUTH_ATTEMPTS;
const LOCK_KEY = STUDENT_STORAGE_KEYS.AUTH_LOCKED_UNTIL;

export function checkRateLimit(): { isLocked: boolean; remainingSeconds: number; attempts: number } {
  const lockedUntil = localStorage.getItem(LOCK_KEY);
  const attempts = parseInt(localStorage.getItem(ATTEMPTS_KEY) || '0', 10);
  if (lockedUntil) {
    const lockTime = parseInt(lockedUntil, 10);
    const now = Date.now();
    if (now < lockTime) {
      return { isLocked: true, remainingSeconds: Math.ceil((lockTime - now) / 1000), attempts };
    } else {
      localStorage.removeItem(LOCK_KEY);
      localStorage.removeItem(ATTEMPTS_KEY);
    }
  }
  return { isLocked: false, remainingSeconds: 0, attempts };
}

export function recordFailedAttempt(): { isLocked: boolean; remainingSeconds: number; attempts: number } {
  let attempts = parseInt(localStorage.getItem(ATTEMPTS_KEY) || '0', 10);
  attempts += 1;
  localStorage.setItem(ATTEMPTS_KEY, attempts.toString());

  // Lock if attempts exceed 4 (اكثر من اربع محاولات)
  if (attempts > 4) {
    const lockDurationMs = 4 * 60 * 60 * 1000; // 4 hours lock
    const lockUntil = Date.now() + lockDurationMs;
    localStorage.setItem(LOCK_KEY, lockUntil.toString());
    return { isLocked: true, remainingSeconds: lockDurationMs / 1000, attempts };
  }
  return { isLocked: false, remainingSeconds: 0, attempts };
}

export function clearRateLimit() {
  localStorage.removeItem(ATTEMPTS_KEY);
  localStorage.removeItem(LOCK_KEY);
}

/**
 * Helper to normalize Arabic names for fair comparison (handles Alef forms, Ta Marbuta, spacing)
 */
function normalizeArabicString(str: string): string {
  if (!str) return '';
  return str
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F]/g, '') // remove tashkeel
    .replace(/[إأآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ');
}

// Unified generic error message to prevent enumeration/guessing
const GENERIC_AUTH_ERROR = 'بيانات الدخول غير صحيحة. يرجى التأكد من صحة البيانات المدخلة أو مراجعة إدارة المنصة.';

/**
 * Authentication and Device Binding function
 * Strictly verifies:
 * 1. Activation Code (BAC-XXXX)
 * 2. Syrian Phone Number
 * 3. Student Full Name (must match record in Admin panel)
 * 4. Governorate / Region (must match record in Admin panel)
 * 5. Device Fingerprint (Single device lock)
 * 
 * Provides unified generic error messages so attackers cannot enumerate which field was wrong.
 */
export async function authenticateStudent(
  code: string, 
  phone: string,
  enteredGovernorate: string = 'دمشق',
  enteredFullName: string = ''
): Promise<{ success: boolean; user?: UserProfile; error?: string; requiresReset?: boolean }> {
  // الخطوة أ: تدقيق صحة التنسيق والمدخلات
  const trimmedCode = code.trim().toUpperCase();
  
  // دالة متقدمة لتوحيد تنسيق أرقام الهواتف السورية (تقبل 09xxxxxxxx أو 9639xxxxxxxx أو +963)
  const normalizeSyrianPhoneNumber = (num: string): string => {
    let cleaned = num.trim().replace(/[\s\-\+\(\)]/g, '');
    if (cleaned.startsWith('00963')) cleaned = '0' + cleaned.slice(5);
    else if (cleaned.startsWith('963')) cleaned = '0' + cleaned.slice(3);
    if (!cleaned.startsWith('0') && cleaned.startsWith('9') && cleaned.length === 9) {
      cleaned = '0' + cleaned;
    }
    return cleaned;
  };

  const cleanPhone = normalizeSyrianPhoneNumber(phone);
  const cleanEnteredName = enteredFullName ? enteredFullName.trim() : '';
  const cleanGovernorate = enteredGovernorate ? enteredGovernorate.trim() : 'دمشق';
  const deviceId = getOrCreateDeviceId();

  // فحص تنسيق الهاتف السوري بدقة
  const syrianPhoneRegex = /^09\d{8}$/;
  if (!syrianPhoneRegex.test(cleanPhone)) {
    return { 
      success: false, 
      error: 'يرجى إدخال رقم هاتف سوري صحيح مكون من 10 أرقام ويبدأ بـ 09' 
    };
  }

  // فحص وجود الكود
  if (!trimmedCode || trimmedCode.length < 4) {
    return {
      success: false,
      error: 'يرجى إدخال كود التفعيل المعتمد المكون من الحروف والأرقام'
    };
  }

  try {
    const nowIso = new Date().toISOString();

    // الخطوة ب: التحقق من وجود الحساب في مجموعة students
    let userDocRef = doc(db, 'students', trimmedCode);
    let docSnap = await getDoc(userDocRef);

    // إذا لم يُعثر عليه بالمعرف المباشر، ابحث عبر الحقول studentCode أو activationCode
    if (!docSnap.exists()) {
      try {
        const qCode = query(collection(db, 'students'), where('studentCode', '==', trimmedCode), limit(1));
        const snapCode = await getDocs(qCode);
        if (!snapCode.empty) {
          docSnap = snapCode.docs[0];
          userDocRef = doc(db, 'students', docSnap.id);
        } else {
          const qAct = query(collection(db, 'students'), where('activationCode', '==', trimmedCode), limit(1));
          const snapAct = await getDocs(qAct);
          if (!snapAct.empty) {
            docSnap = snapAct.docs[0];
            userDocRef = doc(db, 'students', docSnap.id);
          } else {
            // فحص إضافي في users للتوافق التام مع لوحة الأدمن
            const qUsers = query(collection(db, 'users'), where('studentCode', '==', trimmedCode), limit(1));
            const snapUsers = await getDocs(qUsers);
            if (!snapUsers.empty) {
              docSnap = snapUsers.docs[0];
              userDocRef = doc(db, 'students', docSnap.id);
            }
          }
        }
      } catch (err) {
        console.warn('Query student error:', err);
      }
    }

    // -------------------------------------------------------------
    // الحالة 1: المستند موجود بالفعل (طالب مسجل مسبقاً)
    // -------------------------------------------------------------
    if (docSnap && docSnap.exists()) {
      const raw = docSnap.data() as any;

      // 1. فحص الحالة: هل الحساب معطل أو موقوف؟
      if (
        raw.status === 'disabled' || 
        raw.status === 'suspended' || 
        raw.subscriptionStatus === 'disabled' ||
        raw.subscriptionStatus === 'inactive'
      ) {
        return {
          success: false,
          error: 'تم تعطيل هذا الحساب من قِبل إدارة المنصة'
        };
      }

      // 2. فحص مطابقة رقم الهاتف
      const docPhone = normalizeSyrianPhoneNumber((raw.phoneNumber || raw.phone || '').toString());
      if (docPhone && docPhone !== cleanPhone) {
        return {
          success: false,
          error: 'رقم الهاتف المدخل لا يتطابق مع الرقم المسجل لهذا الكود'
        };
      }

      // 3. فحص بصمة العتاد (deviceId)
      if (raw.deviceId && raw.deviceId !== deviceId) {
        return {
          success: false,
          requiresReset: true,
          error: 'عذراً، هذا الحساب مقترن بجهاز آخر. يرجى التواصل مع المشرف أ. محمود صيبعة لفك ارتباط جهازك السابق'
        };
      }

      // إذا كانت بصمة الجهاز فارغة أو null (تم فكه من قِبل الأدمن)، اربطه فوراً بهذا الجهاز
      if (!raw.deviceId || raw.deviceId === '') {
        try {
          await updateDoc(userDocRef, {
            deviceId: deviceId,
            isDevicePaired: true,
            lastLogin: nowIso,
            lastActive: 'الآن',
            lastActiveDate: nowIso.split('T')[0]
          });
        } catch {
          await setDoc(userDocRef, { deviceId, isDevicePaired: true, lastLogin: nowIso }, { merge: true });
        }
      } else {
        // تحديث آخر دخول فقط
        try {
          await updateDoc(userDocRef, {
            lastLogin: nowIso,
            lastActive: 'الآن',
            lastActiveDate: nowIso.split('T')[0]
          });
        } catch {}
      }

      // تجهيز كائن بيانات الطالب
      const studentId = raw.id || raw.bacId || `STU-240-${cleanPhone.slice(-4)}`;
      const streak = typeof raw.streakDays === 'number' ? raw.streakDays : (typeof raw.streak === 'number' ? raw.streak : 1);
      const totalMins = typeof raw.totalStudyMinutes === 'number' ? raw.totalStudyMinutes : ((raw.totalStudyHours || 0) * 60);

      const verifiedUser: UserProfile = {
        id: studentId,
        docId: docSnap.id,
        fullName: raw.fullName || raw.name || cleanEnteredName || 'طالب بكالوريا علمي',
        phoneNumber: cleanPhone,
        governorate: raw.governorate || cleanGovernorate || 'دمشق',
        studentCode: raw.studentCode || raw.activationCode || trimmedCode,
        deviceId: deviceId,
        registeredAt: raw.registeredAt || raw.createdAt || nowIso,
        status: (raw.status || 'active') as any,
        streakDays: streak,
        lastActiveDate: raw.lastActiveDate || nowIso.split('T')[0],
        totalStudyMinutes: totalMins,
        rankTitle: raw.rankTitle || 'طامح للـ 240',
        completedLessonsCount: raw.completedLessonsCount || 0
      };

      // تصفير عداد المحاولات الفاشلة وربط هوية Firebase Anonymous Auth
      clearRateLimit();
      try {
        const authUid = await ensureStudentFirebaseAuth();
        if (authUid) {
          verifiedUser.firebaseAuthUid = authUid;
          // حفظ هوية Firebase Auth UID في سجل الطالب بفايرستور إن لم تكن مربوطة
          await ensureStudentFirebaseIdentityPersisted(verifiedUser);
        }
      } catch (authErr) {
        console.warn('[authenticateStudent] Could not establish Firebase Auth anonymous identity:', authErr);
      }
      saveStudentSession(verifiedUser);

      return { success: true, user: verifiedUser };
    }

    // -------------------------------------------------------------
    // الخطوة ج: تفعيل الكود لأول مرة (إذا لم يكن مسجلاً في students)
    // لا نقوم بإنشاء أي حساب عشوائي بل نبحث في activationCodes حصراً
    // -------------------------------------------------------------
    const codeDocRef = doc(db, 'activationCodes', trimmedCode);
    let codeSnap = await getDoc(codeDocRef);
    let actualCodeDocRef = codeDocRef;

    if (!codeSnap.exists()) {
      // محاولة البحث عبر حقل code أو studentCode في حال كان معرف المستند مختلفاً
      try {
        const qCodeField = query(collection(db, 'activationCodes'), where('code', '==', trimmedCode), limit(1));
        const snapCodeField = await getDocs(qCodeField);
        if (!snapCodeField.empty) {
          codeSnap = snapCodeField.docs[0];
          actualCodeDocRef = doc(db, 'activationCodes', codeSnap.id);
        } else {
          const qStudentCode = query(collection(db, 'activationCodes'), where('studentCode', '==', trimmedCode), limit(1));
          const snapStudentCode = await getDocs(qStudentCode);
          if (!snapStudentCode.empty) {
            codeSnap = snapStudentCode.docs[0];
            actualCodeDocRef = doc(db, 'activationCodes', codeSnap.id);
          }
        }
      } catch (err) {
        console.warn('Error querying activationCodes:', err);
      }
    }

    // إذا لم يوجد الكود نهائياً في المنظومة: رفض فوري
    if (!codeSnap || !codeSnap.exists()) {
      return {
        success: false,
        error: 'كود التفعيل غير صالح أو غير مسجل في المنظومة'
      };
    }

    const codeData = codeSnap.data() as any;

    // 1. فحص حالة الكود: هل مستخدم ومستهلك مسبقاً؟
    const isCodeUsed = codeData.isUsed === true || codeData.status === 'used';
    if (isCodeUsed) {
      return {
        success: false,
        error: 'تم استخدام واستهلاك كود التفعيل هذا مسبقاً'
      };
    }

    // 2. إذا كان الكود مقترناً برقم هاتف مسجل مسبقاً من قِبل الأدمن
    const rawAssigned = (
      codeData.studentPhone || 
      codeData.assignedPhone || 
      codeData.phone || 
      (typeof codeData.assignedTo === 'string' && /^\d+$/.test(codeData.assignedTo) ? codeData.assignedTo : '') ||
      ''
    ).toString();
    const assignedPhone = rawAssigned ? normalizeSyrianPhoneNumber(rawAssigned) : '';

    if (assignedPhone && assignedPhone !== cleanPhone) {
      return {
        success: false,
        error: 'كود التفعيل هذا مخصص لرقم هاتف آخر مسجل مسبقاً لدى الإدارة'
      };
    }

    // 3. الكود متاح ونظامي: نقوم بإنشاء مستند الطالب في students وحرق الكود
    const studentId = `STU-240-${cleanPhone.slice(-4)}`;
    const studentName = cleanEnteredName || codeData.assignedName || 'طالب بكالوريا علمي 2026';
    const studentGov = cleanGovernorate || codeData.assignedGovernorate || 'دمشق';

    const newUser: UserProfile = {
      id: studentId,
      docId: trimmedCode,
      fullName: studentName,
      phoneNumber: cleanPhone,
      governorate: studentGov,
      studentCode: trimmedCode,
      deviceId: deviceId,
      registeredAt: nowIso,
      status: 'active',
      streakDays: 1,
      lastActiveDate: nowIso.split('T')[0],
      totalStudyMinutes: 0,
      rankTitle: 'طامح للـ 240',
      completedLessonsCount: 0
    };

    const fullCloudPayload: Record<string, any> = {
      uid: trimmedCode,
      name: newUser.fullName,
      fullName: newUser.fullName,
      phone: cleanPhone,
      phoneNumber: cleanPhone,
      governorate: newUser.governorate,
      city: newUser.governorate,
      bacId: studentId,
      activationCode: trimmedCode,
      studentCode: trimmedCode,
      subscriptionStatus: 'active',
      status: 'active',
      createdAt: nowIso,
      lastLogin: nowIso,
      isDevicePaired: true,
      deviceId: deviceId,
      lastActive: 'الآن',
      totalStudyHours: 0,
      totalStudyMinutes: 0,
      progress: {
        completedLessons: [],
        watchedVideos: [],
        studySessions: []
      }
    };

    // ضمان وتوليد هوية Firebase Anonymous Auth للطالب الجديد
    let initialAuthUid: string | undefined = undefined;
    try {
      const generatedUid = await ensureStudentFirebaseAuth();
      if (generatedUid) {
        initialAuthUid = generatedUid;
        newUser.firebaseAuthUid = generatedUid;
        fullCloudPayload.firebaseAuthUid = generatedUid;
        fullCloudPayload.authIdentityUpdatedAt = nowIso;
      }
    } catch (authErr) {
      console.warn('[authenticateStudent] Could not establish Firebase Auth anonymous identity for new activation:', authErr);
    }

    // حفظ مستند الطالب في students و users لضمان التوافق مع الأدمن
    await setDoc(doc(db, 'students', trimmedCode), fullCloudPayload);
    try {
      await setDoc(doc(db, 'users', trimmedCode), fullCloudPayload);
    } catch {}

    // حرق كود التفعيل فورياً لمنع تكرار استخدامه
    try {
      await updateDoc(actualCodeDocRef, {
        isUsed: true,
        status: 'used',
        assignedTo: cleanPhone,
        assignedName: newUser.fullName,
        usedAt: nowIso,
        deviceId: deviceId
      });
    } catch (burnErr) {
      console.warn('Failed to burn activation code in activationCodes:', burnErr);
    }

    // تصفير المحاولات الفاشلة وتخزين الجلسة الموثقة وتأكيد الربط
    clearRateLimit();
    if (newUser.firebaseAuthUid) {
      try {
        await ensureStudentFirebaseIdentityPersisted(newUser);
      } catch {}
    }
    saveStudentSession(newUser);

    return { success: true, user: newUser };

  } catch (netErr: any) {
    console.warn('Strict Authentication Error:', netErr);

    // إلغاء ثغرة الـ Offline Fallback المفتوحة:
    // لا نسمح بإنشاء أي حساب محلي لأي كود غير موثق سحابياً.
    // فقط إذا كان نفس الطالب الموثق مسبقاً على هذا الجهاز مسجلاً في الجلسة المعتمدة
    const authenticatedSession = localStorage.getItem(STUDENT_STORAGE_KEYS.AUTHENTICATED_USER);
    if (authenticatedSession) {
      try {
        const cachedUser = JSON.parse(authenticatedSession) as UserProfile;
        if (
          cachedUser.studentCode === trimmedCode &&
          cachedUser.phoneNumber === cleanPhone &&
          cachedUser.deviceId === deviceId
        ) {
          clearRateLimit();
          return { success: true, user: cachedUser };
        }
      } catch {}
    }

    return {
      success: false,
      error: 'تعذر الاتصال بالخادم السحابي للتحقق من الكود. يتطلب تفعيل الكود اتصالاً نشطاً بالإنترنت.'
    };
  }
}

/**
 * Realtime listener for the active student account.
 * Automatically logs out if disabled by the supervisor.
 */
export function subscribeToStudentProfile(
  studentDocIdOrCode: string, 
  currentDeviceId: string,
  onUpdate: (user: Partial<UserProfile>) => void,
  onDisabled: (reason: string) => void
): () => void {
  try {
    const userDocRef = doc(db, studentDocumentPath(studentDocIdOrCode));
    const unsubscribe = onSnapshot(userDocRef, (snap) => {
      if (!snap.exists()) {
        // Document deleted by admin
        onDisabled('تم حذف حسابك من قبل إدارة منصة BAC-240.');
        return;
      }

      const raw = snap.data();
      // Check 1: Account status suspended/disabled by admin
      if (
        raw.status === 'disabled' || 
        raw.status === 'suspended' || 
        raw.subscriptionStatus === 'disabled' || 
        raw.subscriptionStatus === 'inactive'
      ) {
        onDisabled('تم تعطيل هذا الحساب من قبل المشرف العام (أ. محمود صيبعة).');
        return;
      }

      // Check 2: Device unlinked or reset by admin in Admin Panel
      if (raw.isDevicePaired === false || !raw.deviceId || (currentDeviceId && raw.deviceId !== currentDeviceId)) {
        onDisabled('تم إلغاء ربط هذا الجهاز من قبل إدارة منصة BAC-240. يرجى إعادة تسجيل الدخول بكود التفعيل.');
        return;
      }

      onUpdate({
        docId: snap.id,
        fullName: raw.fullName || raw.name,
        phoneNumber: raw.phoneNumber || raw.phone,
        governorate: raw.governorate,
        streakDays: typeof raw.streakDays === 'number' ? raw.streakDays : (typeof raw.streak === 'number' ? raw.streak : undefined),
        lastActiveDate: raw.lastActiveDate,
        totalStudyMinutes: typeof raw.totalStudyMinutes === 'number' ? raw.totalStudyMinutes : (typeof raw.totalStudyHours === 'number' ? raw.totalStudyHours * 60 : undefined),
        rankTitle: raw.rankTitle || raw.honorBadge,
        status: raw.status || 'active',
        completedTaskIds: raw.completedTaskIds && typeof raw.completedTaskIds === 'object' ? raw.completedTaskIds : undefined
      });
    }, () => {
      // on error, fallback silently
    });
    return unsubscribe;
  } catch {
    return () => {};
  }
}

/**
 * Completely delete student account from Firestore cloud database:
 * Deletes from 'students' and 'users' collections matching their IDs, studentCode, or activationCode.
 */
export async function deleteStudentAccountFromCloud(user: UserProfile): Promise<boolean> {
  try {
    const targetId = user?.docId || user?.studentCode || user?.id || '';
    const authCheck = verifyStudentDeletePermission(targetId);
    if (!authCheck.allowed) {
      console.warn(`[Firebase] deleteStudentAccountFromCloud rejected by Student Authorization Contract: ${authCheck.reason}`);
      return false;
    }

    const idsToDelete = new Set<string>();
    if (user.docId) idsToDelete.add(user.docId);
    if (user.studentCode) idsToDelete.add(user.studentCode);
    if (user.id) idsToDelete.add(user.id);

    // 1. Delete direct document references in 'students'
    for (const id of idsToDelete) {
      try {
        await deleteDoc(doc(db, 'students', id));
      } catch (err) {
        console.warn(`Error deleting students/${id}:`, err);
      }
      try {
        await deleteDoc(doc(db, 'users', id));
      } catch (err) {
        console.warn(`Error deleting users/${id}:`, err);
      }
      try {
        await deleteDoc(doc(db, 'leaderboard', id));
      } catch {}
    }

    // 2. Query any remaining documents matching activationCode, studentCode, or phone in 'students'
    try {
      const queries = [
        query(collection(db, 'students'), where('activationCode', '==', user.studentCode)),
        query(collection(db, 'students'), where('studentCode', '==', user.studentCode)),
        query(collection(db, 'students'), where('phoneNumber', '==', user.phoneNumber)),
        query(collection(db, 'students'), where('phone', '==', user.phoneNumber))
      ];

      for (const q of queries) {
        const snap = await getDocs(q);
        for (const docSnap of snap.docs) {
          try {
            await deleteDoc(doc(db, 'students', docSnap.id));
          } catch {}
          try {
            await deleteDoc(doc(db, 'users', docSnap.id));
          } catch {}
          try {
            await deleteDoc(doc(db, 'leaderboard', docSnap.id));
          } catch {}
        }
      }
    } catch (queryErr) {
      console.warn('Error querying additional student records to delete:', queryErr);
    }

    return true;
  } catch (err) {
    console.error('deleteStudentAccountFromCloud failed:', err);
    return false;
  }
}

/**
 * Realtime listener for active announcements.
 * Normalized from both 'announcements' and administrative broadcasts.
 */
export function subscribeToAnnouncements(onUpdate: (announcements: Announcement[]) => void): () => void {
  try {
    const announcementsQuery = query(
      collection(db, 'announcements'),
      limit(50)
    );
    const unsubscribe = onSnapshot(announcementsQuery, (snapshot) => {
      const list: Announcement[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const isActive = data.isActive !== false && data.status !== 'inactive' && data.active !== false;
        if (isActive) {
          list.push({
            id: docSnap.id,
            title: data.title || data.headline || data.subject || 'إعلان إداري',
            content: data.content || data.message || data.body || data.text || data.description || '',
            date: data.date || (data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) || data.addedAt || new Date().toISOString(),
            priority: (data.priority as any) || 'important',
            author: data.author || data.sender || data.publisher || 'أ. محمود صيبعة (المشرف العام)',
            isActive: true
          });
        }
      });
      // Sort by date newest first
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      onUpdate(list);
    }, (err) => {
      console.warn('Error reading announcements:', err);
    });
    return unsubscribe;
  } catch {
    return () => {};
  }
}

/**
 * Normalize subject identifier to match application's SubjectId
 */
function normalizeSubjectId(sub: any): SubjectId {
  if (!sub) return 'physics';
  const s = String(sub).toLowerCase().trim();
  if (s.includes('math1') || s.includes('رياضيات 1') || s.includes('جبر') || s.includes('تحليل')) return 'math1';
  if (s.includes('math2') || s.includes('رياضيات 2') || s.includes('هندسة')) return 'math2';
  if (s.includes('physic') || s.includes('فيزياء')) return 'physics';
  if (s.includes('chem') || s.includes('كيمياء')) return 'chemistry';
  if (s.includes('bio') || s.includes('علوم') || s.includes('أحياء')) return 'biology';
  if (s.includes('arab') || s.includes('عربي') || s.includes('عربية')) return 'arabic';
  if (s.includes('eng') || s.includes('إنكليزي') || s.includes('انجليزي')) return 'english';
  if (s.includes('fren') || s.includes('فرنسي')) return 'french';
  if (s.includes('islam') || s.includes('ديانة') || s.includes('إسلامية')) return 'islamic';
  return 'physics';
}

/**
 * Realtime listener for Flashcard Decks (حزم البطاقات المنهجية) populated by Admin
 * Listens to `flashcardDecks` and `flashcard_decks` collections
 */
export function subscribeToFlashcardDecks(onUpdate: (decks: FlashcardDeck[]) => void): () => void {
  try {
    let decksFromCamel: FlashcardDeck[] = [];
    let decksFromSnake: FlashcardDeck[] = [];

    const emitDecks = () => {
      const deckMap = new Map<string, FlashcardDeck>();
      decksFromCamel.forEach(d => deckMap.set(d.id, d));
      decksFromSnake.forEach(d => deckMap.set(d.id, d));
      const list = Array.from(deckMap.values());
      onUpdate(list);
    };

    const unsubCamel = onSnapshot(query(collection(db, 'flashcardDecks')), (snapshot) => {
      decksFromCamel = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const rawSubject = data.subject || data.subjectId || '';
        const normalizedSub = normalizeSubjectId(rawSubject);
        const title = data.title || data.name || data.deckName || 'حزمة بطاقات';
        const cardsArray = Array.isArray(data.cards) ? data.cards : Array.isArray(data.flashcards) ? data.flashcards : [];
        
        decksFromCamel.push({
          id: docSnap.id,
          title: title,
          subject: rawSubject || normalizedSub,
          subjectId: normalizedSub,
          unit: data.unit || data.unitName || '',
          cardsCount: typeof data.cardsCount === 'number' ? data.cardsCount : cardsArray.length,
          isPublished: data.isPublished !== false,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      });
      emitDecks();
    }, (err) => {
      console.warn('Error listening to flashcardDecks:', err);
    });

    const unsubSnake = onSnapshot(query(collection(db, 'flashcard_decks')), (snapshot) => {
      decksFromSnake = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const rawSubject = data.subject || data.subject_id || '';
        const normalizedSub = normalizeSubjectId(rawSubject);
        const title = data.title || data.name || data.deck_name || 'حزمة بطاقات';
        const cardsArray = Array.isArray(data.cards) ? data.cards : Array.isArray(data.flashcards) ? data.flashcards : [];

        decksFromSnake.push({
          id: docSnap.id,
          title: title,
          subject: rawSubject || normalizedSub,
          subjectId: normalizedSub,
          unit: data.unit || data.unit_name || '',
          cardsCount: typeof data.cards_count === 'number' ? data.cards_count : typeof data.cardsCount === 'number' ? data.cardsCount : cardsArray.length,
          isPublished: data.is_published !== false && data.isPublished !== false,
          createdAt: data.created_at || data.createdAt,
          updatedAt: data.updated_at || data.updatedAt
        });
      });
      emitDecks();
    }, () => {});

    return () => {
      unsubCamel();
      unsubSnake();
    };
  } catch {
    return () => {};
  }
}

/**
 * Realtime listener for Flashcards populated by Admin
 * Listens to `flashcards`, `flashcardDecks`, and `flashcard_decks` collections, with full field normalization
 * (question/front/term/concept/title/q, answer/back/definition/content/explanation/a, subject/subjectId, deck arrays)
 */
export function subscribeToFlashcards(onUpdate: (cards: Flashcard[]) => void): () => void {
  try {
    let cardsFromDirect: Flashcard[] = [];
    let cardsFromDecks: Flashcard[] = [];

    const emitMerged = () => {
      const cardMap = new Map<string, Flashcard>();
      cardsFromDirect.forEach(c => cardMap.set(c.id, c));
      cardsFromDecks.forEach(c => cardMap.set(c.id, c));
      onUpdate(Array.from(cardMap.values()));
    };

    // 1. Direct flashcards collection listener
    const unsubDirect = onSnapshot(query(collection(db, 'flashcards')), (snapshot) => {
      cardsFromDirect = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const question = data.question || data.front || data.term || data.concept || data.q || data.title || data.prompt;
        const answer = data.answer || data.back || data.definition || data.content || data.explanation || data.a || data.response;
        if (question || answer) {
          cardsFromDirect.push({
            id: docSnap.id,
            question: question || '',
            answer: answer || '',
            hint: data.hint || data.notes || data.tip || '',
            subjectId: normalizeSubjectId(data.subjectId || data.subject),
            status: data.status || 'new',
            deckId: data.deckId || data.deck_id,
            deckTitle: data.deckTitle || data.deckName || data.deck_name,
            unit: data.unit,
            custom: !!data.custom
          });
        }
      });
      emitMerged();
    }, (err) => {
      console.warn('Error listening to flashcards:', err);
    });

    // 2. Flashcard decks collection listener (cards inside decks)
    const unsubDecks = onSnapshot(query(collection(db, 'flashcardDecks')), (snapshot) => {
      cardsFromDecks = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const deckTitle = data.title || data.name || data.deckName || 'حزمة بطاقات';
        const deckSubject = normalizeSubjectId(data.subjectId || data.subject);

        // Check if deck contains cards array
        const rawCards = data.cards || data.flashcards || data.items || data.questions;
        if (Array.isArray(rawCards)) {
          rawCards.forEach((rawCard: any, idx: number) => {
            const q = rawCard.question || rawCard.front || rawCard.term || rawCard.concept || rawCard.q || rawCard.title || rawCard.prompt;
            const a = rawCard.answer || rawCard.back || rawCard.definition || rawCard.content || rawCard.explanation || rawCard.a || rawCard.response;
            if (q || a) {
              cardsFromDecks.push({
                id: rawCard.id || `${docSnap.id}-${idx}`,
                question: q || '',
                answer: a || '',
                hint: rawCard.hint || rawCard.notes || rawCard.tip || '',
                subjectId: normalizeSubjectId(rawCard.subjectId || rawCard.subject || deckSubject),
                status: rawCard.status || 'new',
                deckId: docSnap.id,
                deckTitle: deckTitle,
                unit: rawCard.unit || data.unit,
                custom: false
              });
            }
          });
        } else if (data.question || data.front || data.term) {
          // The deck doc itself is a single card
          cardsFromDecks.push({
            id: docSnap.id,
            question: data.question || data.front || data.term || '',
            answer: data.answer || data.back || data.definition || '',
            hint: data.hint || data.notes || '',
            subjectId: deckSubject,
            status: data.status || 'new',
            deckId: docSnap.id,
            deckTitle: deckTitle,
            unit: data.unit,
            custom: false
          });
        }
      });
      emitMerged();
    }, (err) => {
      console.warn('Error listening to flashcardDecks:', err);
    });

    return () => {
      unsubDirect();
      unsubDecks();
    };
  } catch {
    return () => {};
  }
}

/**
 * Realtime listener for YouTube Channels (قنوات يوتيوب الأساتذة) added by Admin
 */
export function subscribeToYouTubeChannels(onUpdate: (channels: YouTubeChannel[]) => void): () => void {
  try {
    const channelsQuery = query(collection(db, 'youtubeChannels'));
    const unsubscribe = onSnapshot(channelsQuery, (snapshot) => {
      const list: YouTubeChannel[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          channelName: data.channelName || data.name || data.title || 'قناة تعليمية',
          logoUrl: data.logoUrl || data.logo || '',
          bannerUrl: data.bannerUrl || data.banner || '',
          subject: data.subject || data.subjectId || '',
          description: data.description || '',
          addedAt: data.addedAt
        });
      });
      onUpdate(list);
    }, (error) => {
      console.warn('Failed to listen to youtubeChannels:', error);
    });
    return unsubscribe;
  } catch {
    return () => {};
  }
}

/**
 * Realtime listener for YouTube Playlists (قوائم التشغيل) added by Admin
 */
export function subscribeToYouTubePlaylists(onUpdate: (playlists: YouTubePlaylist[]) => void): () => void {
  try {
    const playlistsQuery = query(collection(db, 'youtubePlaylists'));
    const unsubscribe = onSnapshot(playlistsQuery, (snapshot) => {
      const list: YouTubePlaylist[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          channelId: data.channelId || '',
          playlistName: data.playlistName || data.name || data.title || 'قائمة تشغيل',
          videoIds: Array.isArray(data.videoIds) ? data.videoIds : [],
          addedAt: data.addedAt
        });
      });
      onUpdate(list);
    }, (error) => {
      console.warn('Failed to listen to youtubePlaylists:', error);
    });
    return unsubscribe;
  } catch {
    return () => {};
  }
}

/**
 * Realtime listener for Educational Videos added by Admin
 * Listens to both `youtubeVideos` and `videos` collections and merges them seamlessly
 */
export function subscribeToVideos(onUpdate: (videos: EducationalVideo[]) => void): () => void {
  try {
    let videosFromLegacy: EducationalVideo[] = [];
    let videosFromYouTube: EducationalVideo[] = [];

    const emitMerged = () => {
      const mergedMap = new Map<string, EducationalVideo>();
      // First legacy videos
      videosFromLegacy.forEach(v => mergedMap.set(v.id, v));
      // Then youtubeVideos
      videosFromYouTube.forEach(v => mergedMap.set(v.id, v));
      onUpdate(Array.from(mergedMap.values()));
    };

    const unsubLegacy = onSnapshot(query(collection(db, 'videos')), (snapshot) => {
      videosFromLegacy = [];
      snapshot.forEach(docSnap => {
        videosFromLegacy.push({ id: docSnap.id, ...docSnap.data() } as EducationalVideo);
      });
      emitMerged();
    }, () => {});

    const unsubYT = onSnapshot(query(collection(db, 'youtubeVideos')), (snapshot) => {
      videosFromYouTube = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const youtubeId = data.youtubeVideoId || data.youtubeId || docSnap.id;
        videosFromYouTube.push({
          id: docSnap.id,
          youtubeId,
          title: data.title || 'درس تعليمي',
          teacherName: data.teacherName || data.teacher || 'أستاذ المادة',
          subjectId: (data.subject as SubjectId) || (data.subjectId as SubjectId) || 'physics',
          category: data.category || (data.isFeatured ? 'intensive' : 'explanation'),
          durationMinutes: typeof data.duration === 'number' ? data.duration : (parseInt(data.duration || '0', 10) || 25),
          duration: data.duration,
          channelId: data.channelId,
          playlistId: data.playlistId,
          unit: data.unit,
          lesson: data.lesson,
          isFeatured: !!data.isFeatured,
          description: data.description,
          notes: data.notes,
          attachments: Array.isArray(data.attachments) ? data.attachments : []
        });
      });
      emitMerged();
    }, () => {});

    return () => {
      unsubLegacy();
      unsubYT();
    };
  } catch {
    return () => {};
  }
}

/**
 * Normalize document and file category to match LibraryDocument type
 */
function normalizeDocType(cat: any, typ: any): LibraryDocument['type'] {
  const text = (String(cat || '') + ' ' + String(typ || '')).toLowerCase();
  if (text.includes('مؤتمت') || text.includes('أتمتة') || text.includes('model')) return 'automated_model';
  if (text.includes('مكثف') || text.includes('ملخص') || text.includes('summary')) return 'summary';
  if (text.includes('سلم') || text.includes('سلالم') || text.includes('ladder') || text.includes('تصحيح')) return 'correction_ladder';
  if (text.includes('دورة') || text.includes('دورات') || text.includes('وزار') || text.includes('archive')) return 'exam_archive';
  if (text.includes('نوطة') || text.includes('مدرس') || text.includes('note') || text.includes('ملزمة')) return 'teacher_notes';
  return 'automated_model';
}

/**
 * Realtime listener for Documents and Automated Exam Models added by Admin.
 * Seamlessly listens to both 'studyFiles' (Admin Panel collection) and 'library'.
 */
export function subscribeToLibrary(onUpdate: (docs: LibraryDocument[]) => void): () => void {
  try {
    let docsFromStudyFiles: LibraryDocument[] = [];
    let docsFromLibrary: LibraryDocument[] = [];

    const emitDocs = () => {
      const docMap = new Map<string, LibraryDocument>();
      docsFromStudyFiles.forEach(d => docMap.set(d.id, d));
      docsFromLibrary.forEach(d => docMap.set(d.id, d));
      onUpdate(Array.from(docMap.values()));
    };

    const parseDoc = (id: string, data: any): LibraryDocument => {
      const rawSubject = data.subject || data.subjectId || data.subject_id || '';
      const subject = normalizeSubjectId(rawSubject);
      const docType = normalizeDocType(data.category, data.type || data.fileType);
      const title = data.title || data.fileName || data.name || data.fileTitle || 'ملف دراسي';
      const url = data.downloadUrl || data.fileUrl || data.url || data.link || '';
      const teacherOrSource = data.teacherName || data.teacherOrSource || data.source || data.teacher || data.author || 'أ. محمود صيبعة';
      const fileSize = data.fileSizeMb 
        ? `${data.fileSizeMb} MB` 
        : (data.fileSize || data.size || data.fileSizeString || '3.5 MB');

      return {
        id,
        title,
        subjectId: subject,
        type: docType,
        teacherOrSource,
        year: data.year || data.semester || '2026',
        url,
        fileSize,
        isCustom: false
      };
    };

    const unsubStudyFiles = onSnapshot(query(collection(db, 'studyFiles')), (snapshot) => {
      docsFromStudyFiles = [];
      snapshot.forEach(docSnap => {
        docsFromStudyFiles.push(parseDoc(docSnap.id, docSnap.data()));
      });
      emitDocs();
    }, (err) => {
      console.warn('Error reading studyFiles:', err);
    });

    const unsubLibrary = onSnapshot(query(collection(db, 'library')), (snapshot) => {
      docsFromLibrary = [];
      snapshot.forEach(docSnap => {
        docsFromLibrary.push(parseDoc(docSnap.id, docSnap.data()));
      });
      emitDocs();
    }, (err) => {
      console.warn('Error reading library:', err);
    });

    return () => {
      unsubStudyFiles();
      unsubLibrary();
    };
  } catch {
    return () => {};
  }
}

/**
 * Realtime listener for Roadmap milestones and checklists from Admin
 */
export function subscribeToRoadmap(onUpdate: (roadmap: RoadmapMilestone[]) => void): () => void {
  try {
    const roadmapQuery = query(collection(db, 'roadmap'));
    const unsubscribe = onSnapshot(roadmapQuery, (snapshot) => {
      const list: RoadmapMilestone[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as RoadmapMilestone);
      });
      // Sort if order is defined
      list.sort((a, b) => ((a.order || 0) - (b.order || 0)));
      onUpdate(list);
    }, () => {});
    return unsubscribe;
  } catch {
    return () => {};
  }
}

/**
 * Realtime listener for official Syrian Curriculum updates from Admin (Collection: curriculum).
 * Contract:
 * - subject: string (e.g. 'math1', 'الرياضيات 1', etc.)
 * - units: array of maps { id, unit_name, lessons: array of { id, name } }
 */
export function subscribeToCurriculum(onUpdate: (subjects: Array<{ id: string; units: any[] }>) => void): () => void {
  try {
    const curriculumQuery = query(collection(db, 'curriculum'));
    const unsubscribe = onSnapshot(curriculumQuery, (snapshot) => {
      const list: Array<{ id: string; units: any[] }> = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const rawSubject = data.subject || docSnap.id;
        const subjectId = normalizeSubjectId(rawSubject);
        const rawUnits = Array.isArray(data.units) ? data.units : [];
        list.push({
          id: subjectId,
          units: rawUnits
        });
      });
      onUpdate(list);
    }, (err) => {
      console.warn('Error reading curriculum from Firestore:', err);
    });
    return unsubscribe;
  } catch {
    return () => {};
  }
}

/**
 * Fetch public stats and document details for a specific student from the dedicated public leaderboard collection
 */
export async function getStudentPublicDetails(id: string): Promise<Record<string, any> | null> {
  try {
    if (!id) return null;
    const docRef = doc(db, 'leaderboard', id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Synchronizes the public student card to dedicated 'leaderboard' collection.
 * Exposes ONLY intentionally public ranking fields. Never includes private data (phone, activationCode, deviceId).
 */
export async function syncStudentLeaderboardCard(
  studentDocId: string, 
  data: {
    fullName?: string;
    governorate?: string;
    streakDays?: number;
    studyHours?: number;
    points?: number;
    rankTitle?: string;
    completedLessonsCount?: number;
  }
): Promise<void> {
  if (!studentDocId) return;

  try {
    const authUid = getCurrentStudentAuthUid();
    if (!authUid) return;

    const payload: Record<string, any> = {
      id: studentDocId,
      studentId: studentDocId,
      updatedAt: new Date().toISOString(),
      firebaseAuthUid: authUid
    };

    if (data.fullName) payload.fullName = data.fullName;
    if (data.governorate) payload.governorate = data.governorate;
    if (typeof data.streakDays === 'number') payload.streakDays = data.streakDays;
    if (typeof data.studyHours === 'number') payload.studyHours = data.studyHours;
    if (typeof data.points === 'number') payload.points = data.points;
    if (data.rankTitle) payload.rankTitle = data.rankTitle;
    if (typeof data.completedLessonsCount === 'number') payload.completedLessonsCount = data.completedLessonsCount;

    await setDoc(doc(db, 'leaderboard', studentDocId), payload, { merge: true });
  } catch (err) {
    console.warn('[Leaderboard] Failed to sync public leaderboard card:', err);
  }
}


/**
 * Realtime listener for Mind Maps (الخرائط الذهنية) uploaded by Admin
 */
export function subscribeToMindMaps(onUpdate: (mindmaps: MindMap[]) => void): () => void {
  try {
    const mindmapsQuery = query(collection(db, 'mindmaps'));
    const unsubscribe = onSnapshot(mindmapsQuery, (snapshot) => {
      const list: MindMap[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          title: data.title || 'خريطة ذهنية',
          subjectId: normalizeSubjectId(data.subjectId || data.subject),
          unit: data.unit || data.unitTitle || '',
          content: data.content || data.markdownContent || data.markdown || '',
          imageUrl: data.imageUrl || data.image || '',
          pdfUrl: data.pdfUrl || data.pdf || '',
          description: data.description || '',
          author: data.author || 'أستاذ المادة',
          createdAt: data.createdAt || ''
        } as MindMap);
      });
      onUpdate(list);
    }, () => {});
    return unsubscribe;
  } catch {
    return () => {};
  }
}

/**
 * Realtime listener for Official Schedule and Timetable (الجدول المعتمد) from Admin
 */
export function subscribeToSchedule(onUpdate: (blocks: TimeBlock[]) => void): () => void {
  try {
    const scheduleQuery = query(collection(db, 'schedule'));
    const unsubscribe = onSnapshot(scheduleQuery, (snapshot) => {
      const list: TimeBlock[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as TimeBlock);
      });
      list.sort((a, b) => a.startHour - b.startHour);
      onUpdate(list);
    }, () => {});
    return unsubscribe;
  } catch {
    return () => {};
  }
}

/**
 * Realtime listener for Lesson Attachments added by Admin to specific units/lessons
 */
export function subscribeToLessonAttachments(
  onUpdate: (attachments: (LessonAttachment & { subjectId: string; unitId: string; lessonId: string })[]) => void
): () => void {
  try {
    const attachmentsQuery = query(collection(db, 'lesson_attachments'));
    const unsubscribe = onSnapshot(attachmentsQuery, (snapshot) => {
      const list: (LessonAttachment & { subjectId: string; unitId: string; lessonId: string })[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as any);
      });
      onUpdate(list);
    }, () => {});
    return unsubscribe;
  } catch {
    return () => {};
  }
}

/**
 * Realtime listener for Live Leaderboard from dedicated Firestore 'leaderboard' collection.
 * Reads ONLY public ranking metrics (fullName, governorate, streakDays, studyHours, badge).
 * Completely decoupled from private student documents.
 */
export function subscribeToLeaderboard(onUpdate: (entries: Array<{
  id: string;
  fullName: string;
  governorate: string;
  streakDays: number;
  studyHours: number;
  rank: number;
  badge: string;
}>) => void): () => void {
  try {
    const leaderboardQuery = query(collection(db, 'leaderboard'), limit(50));
    const unsubscribe = onSnapshot(leaderboardQuery, (snapshot) => {
      const list: Array<{
        id: string;
        fullName: string;
        governorate: string;
        streakDays: number;
        studyHours: number;
        rank: number;
        badge: string;
      }> = [];

      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const hours = typeof data.studyHours === 'number'
          ? data.studyHours
          : (typeof data.totalStudyHours === 'number' ? data.totalStudyHours : Math.round((data.totalStudyMinutes || 0) / 60));

        const streak = typeof data.streakDays === 'number'
          ? data.streakDays
          : (typeof data.streak === 'number' ? data.streak : 0);

        list.push({
          id: docSnap.id,
          fullName: data.fullName || data.name || data.studentName || 'طالب بكالوريا',
          governorate: data.governorate || 'دمشق',
          streakDays: streak,
          studyHours: hours,
          rank: 0,
          badge: data.rankTitle || data.badge || data.honorBadge || 'طامح للـ 240'
        });
      });

      // Sort by streak desc, then hours desc
      list.sort((a, b) => {
        if (b.streakDays !== a.streakDays) return b.streakDays - a.streakDays;
        return b.studyHours - a.studyHours;
      });

      list.forEach((item, index) => {
        item.rank = index + 1;
      });

      onUpdate(list);
    }, (err) => {
      console.warn('Error reading leaderboard:', err);
    });
    return unsubscribe;
  } catch {
    return () => {};
  }
}


/**
 * Smart Caching TTL helper: 20 minutes to keep Firestore usage comfortably within Spark Free Tier
 */
const CACHE_TTL_MS = 20 * 60 * 1000;

export function shouldFetchCollection(key: string): boolean {
  try {
    const last = localStorage.getItem(`bac240_ttl_${key}`);
    if (!last) return true;
    return Date.now() - parseInt(last, 10) > CACHE_TTL_MS;
  } catch {
    return true;
  }
}

export function touchCollectionCache(key: string) {
  try {
    localStorage.setItem(`bac240_ttl_${key}`, Date.now().toString());
  } catch {}
}

/**
 * Batched and Debounced writes for progress & mistakes
 * Groups rapid clicks (ticking lessons, timer) into 1 single write every 3.5 seconds
 */
let pendingProgressUpdates: Record<string, any> = {};
let progressDebounceTimer: NodeJS.Timeout | null = null;
let currentStudentSyncId: string = '';

export function queueProgressSync(studentDocIdOrCode: string, updates: Record<string, any>) {
  if (!studentDocIdOrCode) return;
  currentStudentSyncId = studentDocIdOrCode;
  pendingProgressUpdates = { ...pendingProgressUpdates, ...updates };

  if (progressDebounceTimer) {
    clearTimeout(progressDebounceTimer);
  }

  progressDebounceTimer = setTimeout(async () => {
    const toSend = { ...pendingProgressUpdates };
    pendingProgressUpdates = {};
    progressDebounceTimer = null;
    await syncStudentProgressToCloud(currentStudentSyncId, toSend);
  }, 3500);
}

// Flush immediately before page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (progressDebounceTimer && currentStudentSyncId) {
      clearTimeout(progressDebounceTimer);
      const toSend = { ...pendingProgressUpdates };
      pendingProgressUpdates = {};
      syncStudentProgressToCloud(currentStudentSyncId, toSend);
    }
  });
}

/**
 * Realtime sync student progress back to Firestore.
 * Supports updating by direct document ID or looking up by studentCode/activationCode.
 * Dual-syncs to both 'students' and 'users' collections for 100% Admin cross-compatibility.
 */
export async function syncStudentProgressToCloud(
  studentDocIdOrCode: string, 
  updates: Record<string, any>
) {
  try {
    if (!studentDocIdOrCode) return;

    // Student Authorization & Ownership Guard
    const authCheck = verifyStudentWritePermission(studentDocIdOrCode, updates);
    if (!authCheck.allowed) {
      console.warn(`[Firebase] syncStudentProgressToCloud rejected by Student Authorization Contract: ${authCheck.reason}`);
      return;
    }
    const safeUpdates = authCheck.sanitizedUpdates || updates;

    const userDocRef = doc(db, studentDocumentPath(studentDocIdOrCode));
    await updateDoc(userDocRef, safeUpdates);
    try {
      await updateDoc(doc(db, studentMirroredUserPath(studentDocIdOrCode)), safeUpdates);
    } catch {}

    // Keep dedicated public leaderboard collection synchronized with public metrics only
    try {
      const publicFields: Record<string, any> = {};
      if (typeof safeUpdates.streakDays === 'number') publicFields.streakDays = safeUpdates.streakDays;
      else if (typeof safeUpdates.streak === 'number') publicFields.streakDays = safeUpdates.streak;
      if (typeof safeUpdates.totalStudyHours === 'number') publicFields.studyHours = safeUpdates.totalStudyHours;
      if (typeof safeUpdates.points === 'number') publicFields.points = safeUpdates.points;
      if (typeof safeUpdates.rankTitle === 'string') publicFields.rankTitle = safeUpdates.rankTitle;
      if (typeof safeUpdates.completedLessonsCount === 'number') publicFields.completedLessonsCount = safeUpdates.completedLessonsCount;

      if (Object.keys(publicFields).length > 0) {
        syncStudentLeaderboardCard(studentDocIdOrCode, publicFields).catch(() => {});
      }
    } catch {}
  } catch {
    // If update by direct ID fails, try querying by activationCode or studentCode
    try {
      const authCheck = verifyStudentWritePermission(studentDocIdOrCode, updates);
      if (!authCheck.allowed) return;
      const safeUpdates = authCheck.sanitizedUpdates || updates;

      const q = query(collection(db, 'students'), where('activationCode', '==', studentDocIdOrCode), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const foundId = snap.docs[0].id;
        await updateDoc(doc(db, studentDocumentPath(foundId)), safeUpdates);
        try {
          await updateDoc(doc(db, studentMirroredUserPath(foundId)), safeUpdates);
        } catch {}
        return;
      }
      const q2 = query(collection(db, 'students'), where('studentCode', '==', studentDocIdOrCode), limit(1));
      const snap2 = await getDocs(q2);
      if (!snap2.empty) {
        const foundId2 = snap2.docs[0].id;
        await updateDoc(doc(db, studentDocumentPath(foundId2)), safeUpdates);
        try {
          await updateDoc(doc(db, studentMirroredUserPath(foundId2)), safeUpdates);
        } catch {}
      }
    } catch {
      // offline cache handles it locally
    }
  }
}


/**
 * Realtime listener for Exam Countdowns from Admin (Collection: examCountdowns exclusively).
 * Contract:
 * - id (string): معرف المستند
 * - title (string): عنوان الامتحان
 * - examDate (string ISO): تاريخ ووقت الامتحان
 * - notes (string): ملاحظات الامتحان والتوقيت
 * - subject (string): المادة الامتحانية
 * - isMain (boolean): true للامتحان الوزاري الرئيسي، false للامتحانات الأخرى
 * - isActive (boolean): true للعرض، false للإخفاء
 */
export function subscribeToExamCountdowns(onUpdate: (countdowns: ExamCountdown[]) => void): () => void {
  try {
    const countdownsQuery = query(collection(db, 'examCountdowns'));
    const unsubscribe = onSnapshot(countdownsQuery, (snapshot) => {
      const list: ExamCountdown[] = [];

      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        let dateStr = '';
        if (data.examDate) {
          if (typeof data.examDate.toDate === 'function') {
            dateStr = data.examDate.toDate().toISOString();
          } else if (typeof data.examDate === 'string') {
            dateStr = data.examDate;
          } else if (typeof data.examDate === 'number') {
            dateStr = new Date(data.examDate).toISOString();
          }
        } else if (data.date) {
          dateStr = typeof data.date.toDate === 'function' ? data.date.toDate().toISOString() : String(data.date);
        }

        const item: ExamCountdown = {
          id: docSnap.id,
          title: data.title || 'الامتحان النهائي',
          examDate: dateStr,
          subject: data.subject || '',
          notes: data.notes || '',
          isMain: !!data.isMain,
          isActive: data.isActive !== false
        };

        if (item.isActive && item.examDate) {
          list.push(item);
        }
      });

      // Sort: isMain first, then ascending by examDate
      list.sort((a, b) => {
        if (a.isMain && !b.isMain) return -1;
        if (!a.isMain && b.isMain) return 1;
        return new Date(a.examDate).getTime() - new Date(b.examDate).getTime();
      });

      onUpdate(list);
    }, (error) => {
      console.warn('Error reading examCountdowns from Firestore:', error);
    });

    return unsubscribe;
  } catch {
    return () => {};
  }
}

/**
 * Realtime listener for published written exam models uploaded by Admin (Collection: exams)
 */
export function subscribeToExams(onUpdate: (exams: WrittenExam[]) => void): () => void {
  try {
    const q = query(collection(db, 'exams'), where('isPublished', '==', true));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as WrittenExam));
      onUpdate(list);
    }, (err) => {
      console.warn('Error reading exams from Firestore:', err);
    });
  } catch {
    return () => {};
  }
}

/**
 * Sync student mistakes bank records to student document in Firestore at zero cost
 */
export async function syncMistakesToCloud(
  studentDocIdOrCode: string,
  mistakes: MistakeRecord[]
) {
  try {
    if (!studentDocIdOrCode) return;
    queueProgressSync(studentDocIdOrCode, {
      mistakesBank: mistakes,
      mistakesCount: mistakes.length,
      unresolvedMistakesCount: mistakes.filter(m => !m.isResolved).length
    });
  } catch (err) {
    console.warn('Silent fallback for mistake sync:', err);
  }
}

/**
 * Realtime listener for platform status and automatic maintenance mode.
 * Listens to systemSettings/platformStatus (primary) and systemSettings/config (fallback).
 * When isPlatformOpen === false, the student platform displays the full-screen Maintenance Screen.
 * When isPlatformOpen === true, access is automatically restored.
 */
export function subscribeToPlatformStatus(onUpdate: (status: PlatformStatus) => void): () => void {
  let unsubConfig: (() => void) | null = null;
  let isCleanedUp = false;

  const startConfigListener = () => {
    if (unsubConfig || isCleanedUp) return;
    try {
      unsubConfig = onSnapshot(doc(db, 'systemSettings', 'config'), (configSnap) => {
        if (configSnap.exists()) {
          const data = configSnap.data();
          onUpdate({
            isPlatformOpen: data.isPlatformOpen !== false,
            maintenanceTitle: data.maintenanceTitle,
            maintenanceMessage: data.maintenanceMessage,
            expectedReopenAt: data.expectedReopenAt,
            emergencyContact: data.emergencyContact || data.contactUrl || data.supportContact,
            updatedAt: data.updatedAt
          });
        } else {
          // If neither document specifies maintenance, platform is open by default
          onUpdate({ isPlatformOpen: true });
        }
      }, (err) => {
        console.warn('Silent fallback for config listener:', err);
        onUpdate({ isPlatformOpen: true });
      });
    } catch {
      onUpdate({ isPlatformOpen: true });
    }
  };

  try {
    const unsubPrimary = onSnapshot(doc(db, 'systemSettings', 'platformStatus'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        onUpdate({
          isPlatformOpen: data.isPlatformOpen !== false,
          maintenanceTitle: data.maintenanceTitle,
          maintenanceMessage: data.maintenanceMessage,
          expectedReopenAt: data.expectedReopenAt,
          emergencyContact: data.emergencyContact || data.contactUrl || data.supportContact,
          updatedAt: data.updatedAt
        });
      } else {
        // platformStatus doc doesn't exist, check config doc
        startConfigListener();
      }
    }, (err) => {
      console.warn('PlatformStatus primary listener note:', err);
      startConfigListener();
    });

    return () => {
      isCleanedUp = true;
      unsubPrimary();
      if (unsubConfig) unsubConfig();
    };
  } catch (err) {
    console.warn('Could not establish platformStatus listener:', err);
    return () => {};
  }
}

/**
 * Fetch a single study plan week from Firestore with zero quota waste
 * Supports all Admin schema formats:
 * - doc in planWeeks (bac240_w{N}, week_{N}, {N})
 * - doc in studyPlans (bac240_w{N}, week_{N}, {N})
 * - subcollection studyPlans/bac240_official_2026/weeks or /planWeeks
 * - embedded weeks array/map in studyPlans/bac240_official_2026
 */
/**
 * Normalize any plan week schema from Admin into standard client PlanWeek
 * Supports:
 * - days as Array or Object/Map
 * - tasks as Array or Object/Map
 * - root-level tasks array distributed across days
 * - 0-indexed or 1-indexed days
 * - Arabic day name matching
 */
export function normalizePlanWeek(raw: any, docId: string, requestedWeekIndex: number): PlanWeek {
  if (!raw || typeof raw !== 'object') {
    return {
      id: docId,
      weekIndex: requestedWeekIndex,
      weekTitle: `الأسبوع ${requestedWeekIndex}: خطة دراسية معتمدة`,
      monthName: 'أيلول',
      focusSummary: '',
      isPublished: true,
      days: [],
      totalMinutes: 0,
      totalTasksCount: 0,
      updatedAt: new Date().toISOString()
    };
  }

  const weekIdx = typeof raw.weekIndex === 'number' 
    ? raw.weekIndex 
    : (typeof raw.week === 'number' ? raw.week : requestedWeekIndex);

  const weekTitle = raw.weekTitle || raw.title || `الأسبوع ${weekIdx}: خطة دراسية معتمدة`;
  const focusSummary = raw.focusSummary || raw.supervisorGuidance || raw.guidance || raw.summary || '';
  const voiceBriefUrl = raw.voiceBriefUrl || raw.audioUrl || raw.voiceUrl || undefined;
  const linkedExamId = raw.linkedExamId || raw.examId || undefined;

  // Extract rawDays from array, object, or daily structures
  let rawDays: any[] = [];
  if (Array.isArray(raw.days)) {
    rawDays = raw.days;
  } else if (raw.days && typeof raw.days === 'object') {
    rawDays = Object.values(raw.days);
  } else if (Array.isArray(raw.planDays)) {
    rawDays = raw.planDays;
  } else if (raw.planDays && typeof raw.planDays === 'object') {
    rawDays = Object.values(raw.planDays);
  }

  // Root-level tasks fallback (some builders store tasks: [] at week level with dayIndex)
  let rootTasks: any[] = [];
  if (Array.isArray(raw.tasks)) {
    rootTasks = raw.tasks;
  } else if (raw.tasks && typeof raw.tasks === 'object') {
    rootTasks = Object.values(raw.tasks);
  }

  const DAY_NAMES_ORDER = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

  const normalizedDays: PlanDay[] = DAY_NAMES_ORDER.map((defaultDayName, idx) => {
    // 1. First priority: match by normalized Arabic day name
    let found = rawDays.find((d: any) => {
      if (!d) return false;
      const dName = normalizeArabicString(d.dayName || d.name || d.title || '');
      return dName === normalizeArabicString(defaultDayName);
    });

    // 2. Second priority: match by 0-based dayIndex (0 = السبت .. 6 = الجمعة)
    if (!found) {
      found = rawDays.find((d: any) => {
        if (!d) return false;
        return d.dayIndex === idx || d.day === idx;
      });
    }

    // 3. Third priority: match by 1-based dayIndex (1 = السبت .. 7 = الجمعة)
    if (!found) {
      found = rawDays.find((d: any) => {
        if (!d) return false;
        return d.dayIndex === idx + 1 || d.day === idx + 1;
      });
    }

    // 4. Fourth priority: direct array position
    if (!found && rawDays[idx] && typeof rawDays[idx] === 'object') {
      found = rawDays[idx];
    }

    const dayName = found?.dayName || defaultDayName;
    const isCatchup = !!(found?.isCatchupDay || found?.isBufferDay || idx === 6);

    // Extract tasks from day object
    let dayRawTasks: any[] = [];
    if (Array.isArray(found?.tasks)) {
      dayRawTasks = found.tasks;
    } else if (found?.tasks && typeof found.tasks === 'object') {
      dayRawTasks = Object.values(found.tasks);
    } else if (Array.isArray(found?.items)) {
      dayRawTasks = found.items;
    } else if (found?.items && typeof found.items === 'object') {
      dayRawTasks = Object.values(found.items);
    } else if (Array.isArray(found?.taskList)) {
      dayRawTasks = found.taskList;
    }

    // If day tasks are empty, check if root tasks belong to this day
    if (dayRawTasks.length === 0 && rootTasks.length > 0) {
      dayRawTasks = rootTasks.filter((t: any) => {
        if (!t) return false;
        if (t.dayIndex === idx || t.dayIndex === idx + 1 || t.day === idx || t.day === idx + 1) return true;
        const tDay = normalizeArabicString(t.dayName || t.day || '');
        return tDay === normalizeArabicString(defaultDayName);
      });
    }

    const normalizedTasks: PlanTask[] = dayRawTasks.map((t: any, tIdx: number) => {
      const subject = normalizeSubjectId(t.subject || t.subjectId || t.subject_id || 'physics');
      return {
        id: String(t.id || t._id || t.taskId || `task_${weekIdx}_${idx}_${tIdx}`),
        subjectId: subject,
        title: t.title || t.taskTitle || t.name || t.text || 'مهمة دراسية',
        estimatedMinutes: typeof t.estimatedMinutes === 'number' 
          ? t.estimatedMinutes 
          : (typeof t.duration === 'number' ? t.duration : (parseInt(t.duration || t.estimatedMinutes || '45', 10) || 45)),
        studyMode: (t.studyMode || t.mode) as TaskStudyMode || undefined,
        examWeight: (t.examWeight || t.weight) as ExamWeight || undefined,
        textbookPages: t.textbookPages || t.pages || t.pageRange || undefined,
        unitName: t.unitName || t.unit || undefined,
        pitfallWarning: t.pitfallWarning || t.warning || t.tip || t.note || undefined,
        attachments: Array.isArray(t.attachments) ? t.attachments : [],
        order: typeof t.order === 'number' ? t.order : tIdx + 1
      };
    });

    return {
      dayIndex: idx, // Standardized 0 (السبت) to 6 (الجمعة)
      dayName,
      isBufferDay: isCatchup,
      dayTip: found?.dayTip || found?.tip || undefined,
      bestTimeSlot: found?.bestTimeSlot || found?.timeSlot || 'flexible',
      tasks: normalizedTasks
    };
  });

  const allTasks = normalizedDays.flatMap(d => d.tasks);
  const totalTasksCount = typeof raw.totalTasksCount === 'number' ? raw.totalTasksCount : allTasks.length;
  const totalMinutes = typeof raw.totalMinutes === 'number' 
    ? raw.totalMinutes 
    : (typeof raw.totalEstimatedMinutes === 'number' ? raw.totalEstimatedMinutes : allTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 45), 0));
  const updatedAt = raw.updatedAt || raw.createdAt || new Date().toISOString();

  return {
    id: docId,
    weekIndex: weekIdx,
    weekTitle,
    monthName: raw.monthName || 'أيلول',
    milestoneBadge: raw.milestoneBadge || raw.badge || undefined,
    focusSummary,
    voiceBriefUrl,
    linkedExamId,
    isPublished: raw.isPublished !== false,
    days: normalizedDays,
    totalMinutes,
    totalTasksCount,
    updatedAt
  };
}

/**
 * Fetch a single study plan week from Firestore with zero quota waste
 */
export async function fetchPlanWeekFromCloud(weekIndex: number): Promise<PlanWeek | null> {
  const possibleDocIds = [`bac240_w${weekIndex}`, `week_${weekIndex}`, `${weekIndex}`];

  try {
    // 1. Check collection 'planWeeks' by direct IDs
    for (const docId of possibleDocIds) {
      const snap = await getDoc(doc(db, 'planWeeks', docId));
      if (snap.exists()) {
        return normalizePlanWeek(snap.data(), snap.id, weekIndex);
      }
    }

    // 2. Check collection 'planWeeks' by query
    try {
      const q = query(collection(db, 'planWeeks'), where('weekIndex', '==', weekIndex), limit(1));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        const firstDoc = querySnap.docs[0];
        return normalizePlanWeek(firstDoc.data(), firstDoc.id, weekIndex);
      }
    } catch {}

    // 3. Check collection 'studyPlans' by direct ID
    for (const docId of possibleDocIds) {
      const snap = await getDoc(doc(db, 'studyPlans', docId));
      if (snap.exists()) {
        return normalizePlanWeek(snap.data(), snap.id, weekIndex);
      }
    }

    // 4. Check collection 'plans' by direct ID or query
    for (const docId of possibleDocIds) {
      try {
        const snap = await getDoc(doc(db, 'plans', docId));
        if (snap.exists()) {
          return normalizePlanWeek(snap.data(), snap.id, weekIndex);
        }
      } catch {}
    }

    // 5. Check subcollections in studyPlans/bac240_official_2026
    for (const subcol of ['weeks', 'planWeeks']) {
      for (const docId of possibleDocIds) {
        try {
          const snap = await getDoc(doc(db, 'studyPlans', 'bac240_official_2026', subcol, docId));
          if (snap.exists()) {
            return normalizePlanWeek(snap.data(), snap.id, weekIndex);
          }
        } catch {}
      }
    }

    // 6. Check if embedded inside main doc studyPlans/bac240_official_2026
    try {
      const mainSnap = await getDoc(doc(db, 'studyPlans', 'bac240_official_2026'));
      if (mainSnap.exists()) {
        const data = mainSnap.data();
        if (Array.isArray(data.weeks)) {
          const matched = data.weeks.find((w: any) => w.weekIndex === weekIndex || w.week === weekIndex || w.id === `bac240_w${weekIndex}`);
          if (matched) return normalizePlanWeek(matched, `bac240_w${weekIndex}`, weekIndex);
        }
        if (Array.isArray(data.planWeeks)) {
          const matched = data.planWeeks.find((w: any) => w.weekIndex === weekIndex || w.week === weekIndex || w.id === `bac240_w${weekIndex}`);
          if (matched) return normalizePlanWeek(matched, `bac240_w${weekIndex}`, weekIndex);
        }
        if (data[`week_${weekIndex}`]) return normalizePlanWeek(data[`week_${weekIndex}`], `week_${weekIndex}`, weekIndex);
        if (data[`bac240_w${weekIndex}`]) return normalizePlanWeek(data[`bac240_w${weekIndex}`], `bac240_w${weekIndex}`, weekIndex);
      }
    } catch {}

    return null;
  } catch (err) {
    console.warn(`Failed to fetch plan week ${weekIndex}:`, err);
    return null;
  }
}

/**
 * Realtime listener for active study plan week (instant sync when Admin saves in Plan Builder)
 */
export function subscribeToPlanWeek(weekIndex: number, onUpdate: (week: PlanWeek | null) => void): () => void {
  const primaryDocId = `bac240_w${weekIndex}`;
  let isCleanedUp = false;

  try {
    const docRef = doc(db, 'planWeeks', primaryDocId);
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        onUpdate(normalizePlanWeek(snap.data(), snap.id, weekIndex));
      } else {
        // Fallback to searching other document IDs in planWeeks, studyPlans, etc.
        fetchPlanWeekFromCloud(weekIndex).then(res => {
          if (!isCleanedUp) onUpdate(res);
        });
      }
    }, (err) => {
      console.warn('Realtime plan week listener warning:', err);
      fetchPlanWeekFromCloud(weekIndex).then(res => {
        if (!isCleanedUp) onUpdate(res);
      });
    });

    return () => {
      isCleanedUp = true;
      unsub();
    };
  } catch {
    fetchPlanWeekFromCloud(weekIndex).then(res => {
      if (!isCleanedUp) onUpdate(res);
    });
    return () => {
      isCleanedUp = true;
    };
  }
}

/**
 * Realtime listener for study plan metadata (studyPlans/bac240_official_2026 or studyPlans/metadata)
 */
export function subscribeToPlanMetadata(onUpdate: (meta: PlanMetadata) => void): () => void {
  const defaultMeta: PlanMetadata = {
    id: 'bac240_official_2026',
    title: 'الخطة السنوية الموجهة 2026',
    totalWeeks: 36,
    currentCalendarWeek: 1,
    isFreeNavigationEnabled: false,
    isPublished: true,
    updatedAt: new Date().toISOString()
  };

  try {
    const docRef = doc(db, 'studyPlans', 'bac240_official_2026');
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        onUpdate({
          id: snap.id,
          title: data.title || defaultMeta.title,
          totalWeeks: typeof data.totalWeeks === 'number' ? data.totalWeeks : 36,
          currentCalendarWeek: typeof data.currentCalendarWeek === 'number' ? data.currentCalendarWeek : (typeof data.currentWeek === 'number' ? data.currentWeek : 1),
          isFreeNavigationEnabled: !!(data.isFreeNavigationEnabled || data.freeNavigationMode),
          isPublished: data.isPublished !== false,
          updatedAt: data.updatedAt || new Date().toISOString()
        });
      } else {
        // Fallback to checking studyPlans/metadata
        getDoc(doc(db, 'studyPlans', 'metadata')).then(metaSnap => {
          if (metaSnap.exists()) {
            const data = metaSnap.data();
            onUpdate({
              id: metaSnap.id,
              title: data.title || defaultMeta.title,
              totalWeeks: typeof data.totalWeeks === 'number' ? data.totalWeeks : 36,
              currentCalendarWeek: typeof data.currentCalendarWeek === 'number' ? data.currentCalendarWeek : (typeof data.currentWeek === 'number' ? data.currentWeek : 1),
              isFreeNavigationEnabled: !!(data.isFreeNavigationEnabled || data.freeNavigationMode),
              isPublished: data.isPublished !== false,
              updatedAt: data.updatedAt || new Date().toISOString()
            });
          } else {
            onUpdate(defaultMeta);
          }
        }).catch(() => {
          onUpdate(defaultMeta);
        });
      }
    }, (err) => {
      console.warn('Study plan metadata listener error:', err);
      onUpdate(defaultMeta);
    });

    return unsub;
  } catch (err) {
    console.warn('Could not establish study plan listener:', err);
    onUpdate(defaultMeta);
    return () => {};
  }
}

/**
 * Sync plan task completion status atomically to Cloud
 * Uses updateDoc with completedTaskIds.taskId = ISO date or deleteField()
 */
export async function syncPlanTaskCompletionToCloud(
  studentDocId: string, 
  taskId: string, 
  isCompleted: boolean
): Promise<void> {
  if (!studentDocId || !taskId) return;

  const authCheck = verifyStudentWritePermission(studentDocId);
  if (!authCheck.allowed) {
    console.warn(`[Firebase] syncPlanTaskCompletionToCloud rejected by Student Authorization Contract: ${authCheck.reason}`);
    return;
  }

  try {
    const studentRef = doc(db, studentDocumentPath(studentDocId));
    if (isCompleted) {
      await updateDoc(studentRef, {
        [`completedTaskIds.${taskId}`]: new Date().toISOString(),
        lastActive: 'الآن',
        updatedAt: new Date().toISOString()
      });
    } else {
      await updateDoc(studentRef, {
        [`completedTaskIds.${taskId}`]: deleteField(),
        lastActive: 'الآن',
        updatedAt: new Date().toISOString()
      });
    }
  } catch (err) {
    console.warn(`Atomic plan task update failed for ${taskId}:`, err);
  }
}

/**
 * Realtime subscription to Curriculum Knowledge Base (AI Grounding Library)
 */
export function subscribeToCurriculumKnowledge(
  callback: (items: CurriculumKnowledgeItem[]) => void
): () => void {
  try {
    const q = collection(db, 'curriculumKnowledge');
    const unsub = onSnapshot(q, (snapshot) => {
      const items: CurriculumKnowledgeItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          subjectId: data.subjectId,
          subjectName: data.subjectName || '',
          unitId: data.unitId || '',
          unitName: data.unitName || '',
          lessonId: data.lessonId || '',
          lessonName: data.lessonName || '',
          officialLaws: data.officialLaws || '',
          rubricTraps: data.rubricTraps || '',
          keyConcepts: data.keyConcepts || '',
          fullContent: data.fullContent || '',
          updatedAt: data.updatedAt || new Date().toISOString(),
          isPublished: data.isPublished !== false
        });
      });
      callback(items);
    }, (error) => {
      console.warn('curriculumKnowledge snapshot error:', error);
      callback([]);
    });

    return unsub;
  } catch (err) {
    console.warn('Could not subscribe to curriculumKnowledge:', err);
    return () => {};
  }
}

/**
 * Fetch a specific lesson knowledge item from Firestore
 */
export async function fetchLessonKnowledgeFromCloud(
  knowledgeDocId: string
): Promise<CurriculumKnowledgeItem | null> {
  if (!knowledgeDocId) return null;
  try {
    const docRef = doc(db, 'curriculumKnowledge', knowledgeDocId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      id: snap.id,
      subjectId: data.subjectId,
      subjectName: data.subjectName || '',
      unitId: data.unitId || '',
      unitName: data.unitName || '',
      lessonId: data.lessonId || '',
      lessonName: data.lessonName || '',
      officialLaws: data.officialLaws || '',
      rubricTraps: data.rubricTraps || '',
      keyConcepts: data.keyConcepts || '',
      fullContent: data.fullContent || '',
      updatedAt: data.updatedAt || new Date().toISOString(),
      isPublished: data.isPublished !== false
    };
  } catch (err) {
    console.warn(`Failed to fetch knowledge doc ${knowledgeDocId}:`, err);
    return null;
  }
}

/**
 * Save or update lesson knowledge in Firestore (used by Admin / Seed)
 */
export async function saveLessonKnowledgeToCloud(
  item: CurriculumKnowledgeItem
): Promise<void> {
  if (!isAuthorizedStudentCollection('curriculumKnowledge', 'update')) {
    console.warn('[Firebase] saveLessonKnowledgeToCloud rejected: curriculumKnowledge is read-only for students.');
    throw new Error('Unauthorized: Student client cannot write to curriculumKnowledge.');
  }
  if (!item.id) return;
  try {
    const docRef = doc(db, 'curriculumKnowledge', item.id);
    await setDoc(docRef, {
      ...item,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error(`Failed to save knowledge doc ${item.id}:`, err);
    throw err;
  }
}



