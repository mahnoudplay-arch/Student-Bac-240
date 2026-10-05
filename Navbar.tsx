import React from 'react';
import { 
  Flame, 
  Moon, 
  Sun, 
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PWAInstallPrompt } from './PWAInstallPrompt';
import { WhatsAppIcon, OFFICIAL_SUPPORT_CHANNELS } from './SocialIcons';
import { sound } from '../services/sound';

export const Navbar: React.FC = () => {
  const { 
    setActiveTab, 
    user, 
    setIsAuthModalOpen, 
    theme,
    toggleTheme,
    showToast
  } = useApp();

  const handleLogoClick = () => {
    setActiveTab('home');
  };

  return (
    <header className={`sticky top-0 z-40 w-full border-b backdrop-blur-xl transition-colors duration-200 ${
      theme === 'light'
        ? 'bg-white/95 border-slate-200 shadow-xs'
        : 'bg-[#0c1017]/95 border-slate-800/70'
    }`}>
      <div className="mx-auto flex h-16 max-w-[1700px] items-center justify-between px-3 sm:px-6">
        
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-2.5 text-right group select-none"
          >
            {/* Logo Badge */}
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl p-0.5 shadow-sm transition-all border overflow-hidden shrink-0 ${
              theme === 'light'
                ? 'bg-slate-50 border-slate-200 group-hover:border-indigo-300'
                : 'bg-slate-900 border-slate-800 group-hover:border-slate-600'
            }`}>
              <img src="/favicon.svg" alt="BAC-240 Logo" className="w-full h-full object-contain" />
            </div>

            {/* Platform Title */}
            <div className="flex flex-col text-right">
              <div className="flex items-center gap-1.5">
                <span className={`text-base font-black tracking-tight transition-colors ${
                  theme === 'light'
                    ? 'text-slate-900 group-hover:text-indigo-600'
                    : 'text-slate-100 group-hover:text-indigo-300'
                }`}>
                  BAC - 240
                </span>
                <span 
                  className="w-1.5 h-1.5 rounded-full bg-emerald-500/90 shadow-sm" 
                  title="متصل بالقاعدة السحابية الحية"
                />
              </div>
              <span className={`text-[11px] font-normal ${
                theme === 'light' ? 'text-slate-500' : 'text-slate-400'
              }`}>
                بوابة البكالوريا العلمي 2026
              </span>
            </div>
          </button>

          {/* Quick Install Capsule (Desktop only) */}
          <div className="hidden xl:flex items-center mr-1">
            <PWAInstallPrompt variant="navbar" />
          </div>
        </div>

        {/* Zone 2: Actions & Identity */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Light / Dark Mode Toggle Button */}
          <button
            onClick={() => {
              toggleTheme();
              const nextTheme = theme === 'dark' ? 'light' : 'dark';
              showToast(nextTheme === 'light' ? '☀️ تم تفعيل الوضع النهاري (Light Theme)' : '🌙 تم تفعيل الوضع الليلي (Dark Theme)');
              sound.playTick();
            }}
            title={theme === 'dark' ? 'التبديل إلى الوضع النهاري (Light Theme)' : 'التبديل إلى الوضع الليلي (Dark Theme)'}
            className={`p-2 rounded-xl border transition-all active:scale-95 flex items-center justify-center ${
              theme === 'light'
                ? 'text-amber-600 bg-amber-50 hover:bg-amber-100 border-amber-200 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border-transparent hover:border-slate-800'
            }`}
            aria-label="تبديل نمط الإضاءة"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400/90 transition-transform duration-200 hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600 transition-transform duration-200 hover:-rotate-12" />
            )}
          </button>

          {/* Streak Indicator */}
          {user ? (
            <button 
              onClick={() => setActiveTab('challenge')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all active:scale-95 border ${
                theme === 'light'
                  ? 'bg-amber-50 border-amber-200/90 text-amber-800 hover:bg-amber-100 shadow-xs'
                  : 'bg-amber-950/20 border-amber-500/20 text-amber-300 hover:bg-amber-950/30'
              }`}
              title="سلسلة الالتزام الحقيقية"
            >
              <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className={`text-xs font-bold tabular-nums font-mono ${
                theme === 'light' ? 'text-amber-800' : 'text-amber-300'
              }`}>
                {user.streakDays} {user.streakDays === 1 ? 'يوم' : 'أيام'}
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <a
                href={OFFICIAL_SUPPORT_CHANNELS.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-semibold text-xs transition-all active:scale-95 border ${
                  theme === 'light'
                    ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700'
                    : 'bg-emerald-950/30 hover:bg-emerald-950/40 border-emerald-500/25 text-emerald-400'
                }`}
                title="طلب كود التفعيل عبر واتساب"
              >
                <WhatsAppIcon className="w-3.5 h-3.5" />
                <span>واتساب</span>
              </a>

              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm transition-all active:scale-95 whitespace-nowrap"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>تفعيل الكود</span>
              </button>
            </div>
          )}

          {/* Profile Shortcut */}
          {user && (
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 p-1 rounded-xl transition-all active:scale-95 border ${
                theme === 'light'
                  ? 'hover:bg-slate-100 border-transparent hover:border-slate-200'
                  : 'hover:bg-slate-900 border-transparent hover:border-slate-800'
              }`}
              title="إعدادات الحساب"
            >
              <div className={`w-8 h-8 rounded-lg border font-bold text-xs flex items-center justify-center shadow-xs ${
                theme === 'light'
                  ? 'bg-slate-100 border-slate-250 text-slate-800'
                  : 'bg-slate-800 border-slate-700 text-slate-200'
              }`}>
                {user.fullName ? user.fullName[0] : 'ط'}
              </div>
            </button>
          )}

        </div>
      </div>
    </header>
  );
};
