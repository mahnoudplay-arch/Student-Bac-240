import React, { useState } from 'react';
import { 
  User, 
  Key, 
  Copy, 
  Check, 
  Moon, 
  Sun,
  LogOut, 
  ShieldCheck, 
  Cpu, 
  Save,
  Trash2,
  AlertTriangle,
  X,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SYRIAN_GOVERNORATES } from '../data/initialData';
import { getStudentDisplayId } from '../lib/studentUtils';
import { AppInstallSection } from './AppInstallSection';
import { sound } from '../services/sound';

export const ProfileSettings: React.FC = () => {
  const { 
    user, 
    deviceId, 
    logoutUser, 
    deleteAccount,
    updateUserProfile, 
    theme,
    setTheme,
    toggleTheme,
    showToast,
    setIsAuthModalOpen
  } = useApp();

  const [copiedDevId, setCopiedDevId] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedStudentId, setCopiedStudentId] = useState(false);

  const studentDisplayId = getStudentDisplayId(user);

  const [editName, setEditName] = useState(user?.fullName || '');
  const [editGov, setEditGov] = useState(user?.governorate || 'دمشق');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Delete account confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleCopyDeviceId = () => {
    navigator.clipboard.writeText(deviceId);
    setCopiedDevId(true);
    setTimeout(() => setCopiedDevId(false), 2000);
  };

  const handleCopyStudentId = () => {
    navigator.clipboard.writeText(studentDisplayId);
    setCopiedStudentId(true);
    setTimeout(() => setCopiedStudentId(false), 2000);
  };

  const handleCopyCode = () => {
    if (!user) return;
    navigator.clipboard.writeText(user.studentCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || isSaving) return;

    setIsSaving(true);
    setSaveMessage(null);

    const ok = await updateUserProfile({
      fullName: editName.trim(),
      governorate: editGov
    });

    setIsSaving(false);
    if (ok) {
      setSavedSuccess(true);
      setSaveMessage('تم حفظ التعديلات ومزامنتها بنجاح مع السحابة ومحافظات الجمهورية!');
      setTimeout(() => {
        setSavedSuccess(false);
        setSaveMessage(null);
      }, 3500);
    } else {
      setSaveMessage('تم حفظ التعديلات محلياً وتحديث واجهتك.');
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-8 pb-12 max-w-3xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          <User className="w-6 h-6 text-indigo-400" />
          <span>الملف الشخصي وإعدادات الحساب</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          إدارة هوية الطالب، بصمة الجهاز العتادية، والوضع الداكن الفائق
        </p>
      </div>

      {!user ? (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600/15 border border-indigo-500/30 text-indigo-400">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-base font-bold text-white">أنت مسجل حالياً كزائر</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              قم بتفعيل كود الاشتراك الخاص بك لربط التطبيق بجهازك وحفظ تقدمك في المنهاج وسلسلة الالتزام على السحابة.
            </p>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20"
            >
              تفعيل الكود والربط الآن
            </button>
          </div>

          {/* App Install Section for Visitor */}
          <AppInstallSection variant="settings" />
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Identity Card */}
          <div className="rounded-2xl border border-slate-800 bg-[#101622] p-6 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-slate-800 border border-slate-700 text-white font-bold text-lg flex items-center justify-center shadow-sm">
                  240
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span>{user.fullName}</span>
                    <span className="text-xs font-semibold text-slate-400">
                      · {user.rankTitle}
                    </span>
                  </h2>
                  <span className="text-xs text-slate-400">
                    رقم الهاتف: <span className="font-mono text-slate-300" dir="ltr">{user.phoneNumber}</span>
                  </span>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[10px] text-slate-400 block">سلسلة الالتزام</span>
                <span className="font-mono text-lg font-bold text-amber-400/90 tabular-nums">
                  {user.streakDays} يوم متتالي
                </span>
              </div>
            </div>

            {/* Student ID Card & Official Student Code Card with Copy */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Official Student ID */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs border border-slate-700">
                    ID
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">معرف الطالب (ID)</span>
                    <span className="font-mono text-sm font-bold text-slate-200 tracking-wider">
                      {studentDisplayId}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleCopyStudentId}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
                  title="نسخ معرف الطالب"
                >
                  {copiedStudentId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedStudentId ? 'تم' : 'نسخ'}</span>
                </button>
              </div>

              {/* Activation Code */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Key className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">كود التفعيل المرتبط</span>
                    <span className="font-mono text-sm font-bold text-slate-300 tracking-wider">
                      {user.studentCode}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'تم النسخ' : 'نسخ الكود'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Edit Profile Information Form */}
          <form onSubmit={handleSaveProfile} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <h3 className="text-xs font-bold text-indigo-300">تعديل بيانات الطالب والمحافظة</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  الاسم الكامل
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  المحافظة
                </label>
                <select
                  value={editGov}
                  onChange={(e) => setEditGov(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                >
                  {SYRIAN_GOVERNORATES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              {saveMessage ? (
                <span className={`text-xs flex items-center gap-1.5 ${savedSuccess ? 'text-emerald-400 font-semibold' : 'text-slate-300'}`}>
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{saveMessage}</span>
                </span>
              ) : <div />}

              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-sm self-end sm:self-auto"
              >
                {isSaving ? (
                  <>
                    <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>جارٍ المزامنة مع السحابة...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>حفظ ومزامنة التعديلات</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Hardware Device Fingerprint Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold text-white">بصمة العتاد المعتمدة (Hardware Device Fingerprint)</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              معرّف أمني مشفر يُولد برمجياً ويربط حسابك بهذا المتصفح لمنع فتح الحساب في أجهزة متزامنة. إذا قمت بتبديل هاتفك يمكنك تزويد أ. محمود صيبعة بهذا المعرف لفك الارتباط.
            </p>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 flex items-center justify-between">
              <span className="font-mono text-xs text-slate-300 font-semibold truncate max-w-sm" dir="ltr">
                {deviceId}
              </span>

              <button
                onClick={handleCopyDeviceId}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 transition-colors shrink-0"
              >
                {copiedDevId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedDevId ? 'تم النسخ' : 'نسخ المعرف'}</span>
              </button>
            </div>
          </div>

          {/* Theme Mode Setting (Light & Dark Theme) */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-bold text-white">مظهر المنصة (Theme Mode)</h3>
                </div>
                <p className="text-xs text-slate-400">
                  اختر بين الوضع الليلي المريح للمذاكرة المركزة أو الوضع النهاري المضيء
                </p>
              </div>

              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                {theme === 'dark' ? 'الوضع الليلي 🌙' : 'الوضع النهاري ☀️'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Dark Theme Card Option */}
              <button
                type="button"
                onClick={() => {
                  setTheme('dark');
                  sound.playTick();
                  showToast('🌙 تم تفعيل الوضع الليلي (Dark Theme)');
                }}
                className={`p-3.5 rounded-xl border text-right transition-all flex items-center justify-between ${
                  theme === 'dark'
                    ? 'border-indigo-500 bg-indigo-950/60 text-white shadow-md ring-1 ring-indigo-500'
                    : 'border-slate-800 bg-slate-950/70 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-indigo-300">
                    <Moon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block">الوضع الليلي (Dark)</span>
                    <span className="text-[10px] text-slate-400 block">المظهر الهادئ المعتمد</span>
                  </div>
                </div>
                {theme === 'dark' && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
              </button>

              {/* Light Theme Card Option */}
              <button
                type="button"
                onClick={() => {
                  setTheme('light');
                  sound.playTick();
                  showToast('☀️ تم تفعيل الوضع النهاري (Light Theme)');
                }}
                className={`p-3.5 rounded-xl border text-right transition-all flex items-center justify-between ${
                  theme === 'light'
                    ? 'border-amber-500 bg-amber-950/40 text-white shadow-md ring-1 ring-amber-500'
                    : 'border-slate-800 bg-slate-950/70 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-amber-950/60 border border-amber-500/30 text-amber-400">
                    <Sun className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block">الوضع النهاري (Light)</span>
                    <span className="text-[10px] text-slate-400 block">مضيء عالي التباين</span>
                  </div>
                </div>
                {theme === 'light' && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
              </button>
            </div>
          </div>

          {/* Dedicated PWA Mobile App Section */}
          <AppInstallSection variant="settings" />

          {/* Danger Zone: Permanent Account Deletion */}
          <div className="rounded-2xl border border-rose-500/25 bg-rose-950/15 p-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <h3 className="text-xs sm:text-sm font-bold text-rose-300">منطقة الحذر: حذف الحساب نهائياً</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                  حذف حسابك سيؤدي إلى مسح كود التفعيل وبياناتك الدراسية وساعات التركيز وبنك الأخطاء نهائياً من قاعدة بيانات الفايربيس ومن المتصفح. هذا الإجراء فوري وغير قابل للإلغاء.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setConfirmText('');
                  setShowDeleteModal(true);
                }}
                className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-950/50 active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف الحساب</span>
              </button>
            </div>
          </div>

          {/* Supervisor Information and Sign Out */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-800/80 pt-4">
            <div className="text-xs text-slate-500">
              الإشراف العام والتطوير: <span className="text-slate-400 font-semibold">أ. محمود صيبعة</span>
            </div>

            <button
              onClick={logoutUser}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-slate-800 text-xs font-bold transition-colors self-start sm:self-auto"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج</span>
            </button>
          </div>

        </div>
      )}

      {/* Modal: Permanent Account Deletion Warning & Confirmation */}
      {showDeleteModal && (
        <div 
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
          dir="rtl"
        >
          <div 
            className="w-full max-w-lg rounded-2xl border border-rose-500/40 bg-slate-900 p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white">
                    تأكيد حذف الحساب نهائياً
                  </h3>
                  <p className="text-[11px] text-rose-400 font-medium">
                    تحذير قانوني وإداري هام قبل المتابعة
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!isDeleting) setShowDeleteModal(false);
                }}
                disabled={isDeleting}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Warning Body */}
            <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed">
              <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-4 space-y-2">
                <p className="font-bold text-rose-200">
                  ⚠️ إخلاء مسؤولية كامل بخصوص الاشتراك واستعادة الحساب:
                </p>
                <p className="text-rose-100/90 text-xs leading-relaxed">
                  إذا قمت بحذف الحساب، <strong>فنحن غير مسؤولين إطلاقاً عن استعادة الحساب أو عن الاشتراك الخاص بك أو كود التفعيل السابق</strong>، وسيتوجب عليك تفعيل اشتراكك مجدداً من خلال التواصل مع الإدارة لإنشاء حساب جديد.
                </p>
              </div>

              <div className="space-y-1.5 text-slate-400 text-[11px] bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <p className="font-semibold text-slate-200">ما الذي سيحدث فور الحذف:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li>مسح ملفك الشخصي وجميع وثائقك من قاعدة بيانات Firebase السحابية.</li>
                  <li>حذف بنك أخطائك الشخصي وملاحظاتك ومؤقت دراستك وسلسلة التزامك.</li>
                  <li>تسجيل خروجك تلقائياً وترحيلك فوراً إلى واجهة تسجيل الدخول.</li>
                </ul>
              </div>

              {/* Confirmation Input */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-[11px] font-bold text-slate-300">
                  لتأكيد الحذف النهائي، اكتب الكلمة <span className="text-rose-400 font-black">"حذف"</span> في المربع أدناه:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder='اكتب "حذف" هنا للتأكيد'
                  disabled={isDeleting}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-rose-500/30 bg-slate-950 text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 text-xs font-bold text-center"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
              >
                تراجع وإلغاء
              </button>

              <button
                type="button"
                disabled={confirmText.trim() !== 'حذف' || isDeleting}
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    await deleteAccount();
                  } finally {
                    setIsDeleting(false);
                    setShowDeleteModal(false);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:hover:bg-rose-600 text-white font-bold text-xs transition-all shadow-lg shadow-rose-950/60 flex items-center justify-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>جارٍ الحذف والمسح الشامل...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>تأكيد الحذف نهائياً</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
