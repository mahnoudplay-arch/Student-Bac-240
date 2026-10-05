import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const GlobalToastBanner: React.FC = () => {
  const { toastMessage, theme } = useApp();

  return (
    <div 
      className="fixed top-4 inset-x-0 z-[100] flex justify-center pointer-events-none px-4"
      dir="rtl"
      aria-live="polite"
    >
      <AnimatePresence mode="wait">
        {toastMessage && (
          <motion.div
            key={toastMessage.id}
            initial={{ opacity: 0, y: -28, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.92 }}
            transition={{ type: 'spring', damping: 24, stiffness: 380 }}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl backdrop-blur-2xl border max-w-md w-auto text-xs font-bold shadow-2xl transition-all ${
              theme === 'light'
                ? 'bg-white/95 border-indigo-200/80 text-slate-900 shadow-[0_14px_38px_-4px_rgba(79,70,229,0.18)]'
                : 'bg-[#101622]/95 border-slate-700/90 text-slate-100 shadow-[0_16px_40px_rgba(0,0,0,0.8)]'
            }`}
          >
            <div className={`h-7 w-7 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
              theme === 'light'
                ? 'bg-indigo-50 border border-indigo-200/90 text-indigo-600'
                : 'bg-slate-800 border border-slate-700 text-indigo-400'
            }`}>
              {toastMessage.icon ? (
                <span className="text-sm">{toastMessage.icon}</span>
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              )}
            </div>

            <span className={`leading-relaxed text-xs sm:text-[13px] ${
              theme === 'light' ? 'text-slate-800' : 'text-slate-200'
            }`}>
              {toastMessage.text}
            </span>

            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0 mr-auto ml-1" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

