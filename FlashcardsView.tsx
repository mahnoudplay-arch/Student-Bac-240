import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RotateCw, 
  Volume2, 
  Lightbulb, 
  Check, 
  Plus, 
  RotateCcw, 
  Filter, 
  Sparkles,
  Layers,
  FolderOpen,
  ArrowRight,
  BookOpen,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  Play
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Flashcard, SubjectId, FlashcardDeck } from '../types';
import { sound } from '../services/sound';

export const FlashcardsView: React.FC = () => {
  const { 
    flashcards, 
    flashcardDecks,
    markFlashcardStatus, 
    addCustomFlashcard, 
    resetFlashcardSession, 
    curriculum,
    showToast
  } = useApp();

  const [activeViewMode, setActiveViewMode] = useState<'decks' | 'study'>('decks');
  const [selectedSubject, setSelectedSubject] = useState<SubjectId | 'all'>('all');
  const [selectedDeckId, setSelectedDeckId] = useState<string | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sessionBatch, setSessionBatch] = useState<number | 'all'>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isNewCardModalOpen, setIsNewCardModalOpen] = useState(false);

  // New card form state
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [newHint, setNewHint] = useState('');
  const [newSubject, setNewSubject] = useState<SubjectId>('physics');
  const [newDeckId, setNewDeckId] = useState<string>('');

  // Automatically switch to 'study' if user has no decks but has cards
  useEffect(() => {
    if (flashcardDecks.length === 0 && flashcards.length > 0 && activeViewMode === 'decks') {
      // Keep on decks or let student explore, but if they want direct study they can switch
    }
  }, [flashcardDecks.length, flashcards.length]);

  // Filter Decks by subject & search query
  const filteredDecks = useMemo(() => {
    return flashcardDecks.filter(d => {
      if (selectedSubject !== 'all' && d.subjectId !== selectedSubject) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = d.title.toLowerCase().includes(q);
        const matchUnit = d.unit?.toLowerCase().includes(q);
        if (!matchTitle && !matchUnit) return false;
      }
      return true;
    });
  }, [flashcardDecks, selectedSubject, searchQuery]);

  // Filter Cards by subject, deck, and search
  const filteredCards = useMemo(() => {
    return flashcards.filter(c => {
      if (selectedSubject !== 'all') {
        const cardSub = c.subjectId || (c as any).subject;
        if (cardSub !== selectedSubject) return false;
      }
      if (selectedDeckId !== 'all') {
        if (c.deckId !== selectedDeckId) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchQ = c.question.toLowerCase().includes(q);
        const matchA = c.answer.toLowerCase().includes(q);
        const matchHint = c.hint?.toLowerCase().includes(q);
        if (!matchQ && !matchA && !matchHint) return false;
      }
      return true;
    });
  }, [flashcards, selectedSubject, selectedDeckId, searchQuery]);

  const activeDeck = sessionBatch === 'all' 
    ? filteredCards 
    : filteredCards.slice(0, sessionBatch);

  const currentCard: Flashcard | undefined = activeDeck[currentIndex];

  // Flip card
  const handleFlip = useCallback(() => {
    sound.playTick();
    setIsFlipped(prev => !prev);
  }, []);

  const handleNext = useCallback(() => {
    if (currentIndex < activeDeck.length - 1) {
      sound.playTick();
      setIsFlipped(false);
      setShowHint(false);
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, activeDeck.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      sound.playTick();
      setIsFlipped(false);
      setShowHint(false);
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const handleMastered = useCallback(() => {
    if (!currentCard) return;
    markFlashcardStatus(currentCard.id, 'mastered');
    showToast('رائع! تم تصنيف البطاقة: متقن ومثبت بنجاح ⭐');
    handleNext();
  }, [currentCard, markFlashcardStatus, handleNext, showToast]);

  const handleReview = useCallback(() => {
    if (!currentCard) return;
    markFlashcardStatus(currentCard.id, 'review');
    showToast('تمت جدولة البطاقة للمراجعة لاحقاً 🔁');
    handleNext();
  }, [currentCard, markFlashcardStatus, handleNext, showToast]);

  // Start studying a specific deck
  const handleStartDeck = (deck: FlashcardDeck) => {
    setSelectedDeckId(deck.id);
    setSelectedSubject(deck.subjectId);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    setActiveViewMode('study');
  };

  // Text to Speech
  const handleSpeak = (text: string, isEnglish: boolean = false) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = isEnglish ? 'en-US' : 'ar-SA';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      if (activeViewMode !== 'study') return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === '1') {
        e.preventDefault();
        handleMastered();
      } else if (e.key === '2') {
        e.preventDefault();
        handleReview();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlip, handleNext, handlePrev, handleMastered, handleReview, activeViewMode]);

  const handleAddCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim()) return;

    addCustomFlashcard({
      subjectId: newSubject,
      question: newQuestion.trim(),
      answer: newAnswer.trim(),
      hint: newHint.trim() || undefined,
      deckId: newDeckId || undefined
    });

    setNewQuestion('');
    setNewAnswer('');
    setNewHint('');
    setIsNewCardModalOpen(false);
  };

  // Calculate master rates
  const masteredCount = activeDeck.filter(c => c.status === 'mastered').length;
  const reviewCount = activeDeck.filter(c => c.status === 'review').length;

  const activeSelectedDeck = flashcardDecks.find(d => d.id === selectedDeckId);

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto" dir="rtl">
      
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-850 border border-slate-750 flex items-center justify-center text-slate-300 shadow-sm">
              <Layers className="w-4 h-4" />
            </div>
            <span>البطاقات الذكية</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            مراجعة المفاهيم والقوانين بالاسترجاع النشط.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewCardModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-100 text-xs font-semibold transition-colors shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة بطاقة</span>
          </button>

          {activeDeck.length > 0 && activeViewMode === 'study' && (
            <button
              onClick={resetFlashcardSession}
              title="إعادة ضبط حالة الرزمة"
              className="p-2 rounded-xl border border-slate-750 bg-slate-850 text-slate-300 hover:text-white transition-colors active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Navigation: Decks vs Study Mode */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveViewMode('decks')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeViewMode === 'decks'
                ? 'bg-slate-800 text-slate-100 border border-slate-700/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 bg-[#101622] border border-slate-800'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span>حزم البطاقات المنهجية ({flashcardDecks.length})</span>
          </button>

          <button
            onClick={() => setActiveViewMode('study')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeViewMode === 'study'
                ? 'bg-slate-800 text-slate-100 border border-slate-700/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 bg-[#101622] border border-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>المذاكرة والتقليب 3D ({flashcards.length})</span>
          </button>
        </div>

        {/* Quick Search */}
        <div className="relative hidden sm:block w-56">
          <input
            type="text"
            placeholder="بحث في البطاقات والحزم..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-8 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-slate-600 transition-colors"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Filter by Subject Bar (All Subjects) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-800/80">
        <button
          onClick={() => { setSelectedSubject('all'); setCurrentIndex(0); setIsFlipped(false); }}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
            selectedSubject === 'all'
              ? 'bg-slate-800 text-slate-100 border border-slate-700/60 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 bg-[#101622] border border-slate-800'
          }`}
        >
          كافة المواد
        </button>

        {curriculum.map(s => {
          const cardsCount = flashcards.filter(c => c.subjectId === s.id).length;
          const decksCount = flashcardDecks.filter(d => d.subjectId === s.id).length;

          return (
            <button
              key={s.id}
              onClick={() => { setSelectedSubject(s.id); setCurrentIndex(0); setIsFlipped(false); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                selectedSubject === s.id
                  ? 'bg-slate-800 text-slate-100 border border-slate-700/60 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 bg-[#101622] border border-slate-800'
              }`}
            >
              <span>{s.name}</span>
              {(activeViewMode === 'decks' ? decksCount : cardsCount) > 0 && (
                <span className="text-[10px] opacity-75 font-mono">
                  ({activeViewMode === 'decks' ? decksCount : cardsCount})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Deck Selector Banner (in Study Mode) */}
      {activeViewMode === 'study' && selectedDeckId !== 'all' && activeSelectedDeck && (
        <div className="flex items-center justify-between rounded-xl bg-indigo-950/40 border border-indigo-500/30 p-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-indigo-400 font-bold">الحزمة الحالية:</span>
            <span className="text-white font-bold">{activeSelectedDeck.title}</span>
            {activeSelectedDeck.unit && (
              <span className="text-slate-400 text-[11px]">({activeSelectedDeck.unit})</span>
            )}
          </div>
          <button
            onClick={() => { setSelectedDeckId('all'); setCurrentIndex(0); }}
            className="text-xs text-indigo-300 hover:text-white underline font-semibold"
          >
            عرض كافة الحزم والبطاقات
          </button>
        </div>
      )}

      {/* VIEW MODE 1: DECKS BROWSER (حزم البطاقات المنهجية) */}
      {activeViewMode === 'decks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-400">
              حزم البطاقات المعتمدة من قبل المشرف العام (أ. محمود صيبعة):
            </div>
            {filteredDecks.length > 0 && (
              <span className="text-xs font-mono text-indigo-400">
                {filteredDecks.length} حزمة متاحة
              </span>
            )}
          </div>

          {filteredDecks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 p-12 text-center text-xs text-slate-400 space-y-3">
              <div className="flex items-center justify-center gap-2 text-indigo-400 text-sm font-bold">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <span>لا توجد حزم بطاقات في هذا الفلتر حالياً</span>
              </div>
              <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
                تتزامن حزم البطاقات المنهجية فور رفعها وتحديثها من المشرف في لوحة التحكم الإدارية. يمكنك البدء في دراسة البطاقات الفردية عبر وضع "المذاكرة والتقليب 3D".
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => { setSelectedSubject('all'); setSearchQuery(''); }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                >
                  إلغاء الفلتر
                </button>
                <button
                  onClick={() => setActiveViewMode('study')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30"
                >
                  الانتقال للمذاكرة الشاملة
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDecks.map((deck) => {
                const subject = curriculum.find(s => s.id === deck.subjectId);
                const deckCards = flashcards.filter(c => c.deckId === deck.id);
                const totalCards = deck.cardsCount || deckCards.length;

                return (
                  <div
                    key={deck.id}
                    className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-indigo-500/40 hover:bg-slate-900/90 transition-all shadow-sm group"
                  >
                    <div className="space-y-3">
                      {/* Top Header */}
                      <div className="flex items-center justify-between gap-2">
                        <span 
                          className="font-bold text-[10px] px-2.5 py-0.5 rounded-full border"
                          style={{ 
                            backgroundColor: `${subject?.color || '#6366f1'}15`, 
                            color: subject?.color || '#818cf8',
                            borderColor: `${subject?.color || '#6366f1'}30`
                          }}
                        >
                          {subject?.name || deck.subject}
                        </span>

                        <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/25 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                          <Check className="w-2.5 h-2.5" />
                          <span>معتمدة</span>
                        </span>
                      </div>

                      {/* Title & Unit */}
                      <div>
                        <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                          {deck.title}
                        </h3>
                        {deck.unit && (
                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-slate-500" />
                            <span>الوحدة: {deck.unit}</span>
                          </p>
                        )}
                      </div>

                      {/* Card Count Status */}
                      <div className="rounded-xl bg-slate-950/60 border border-slate-800/80 p-2.5 flex items-center justify-between text-xs">
                        <span className="text-slate-400">عدد البطاقات:</span>
                        <span className="font-mono font-bold text-white">
                          {totalCards} بطاقة
                        </span>
                      </div>

                      {totalCards === 0 && (
                        <p className="text-[11px] text-amber-400/90 bg-amber-950/30 border border-amber-500/20 rounded-lg p-2 leading-relaxed">
                          حزمة جديدة منشورة من الإدارة. بانتظار استكمال رفع البطاقات من المشرف أو يمكنك إضافة بطاقات إليها.
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2">
                      <button
                        onClick={() => handleStartDeck(deck)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 active:scale-95"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>بدء مذاكرة الحزمة</span>
                      </button>

                      <button
                        onClick={() => {
                          setNewSubject(deck.subjectId);
                          setNewDeckId(deck.id);
                          setIsNewCardModalOpen(true);
                        }}
                        className="p-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:border-indigo-500/40 text-xs transition-colors"
                        title="إضافة بطاقة لهذه الحزمة"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 2: 3D INTERACTIVE FLASHCARD PLAYER */}
      {activeViewMode === 'study' && (
        <div className="space-y-6">
          
          {/* Batch Selector & Counter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>إجمالي البطاقات المطابقة:</span>
              <span className="font-mono font-bold text-white">{filteredCards.length}</span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-400">
              <span>وجبة الجلسة:</span>
              {[20, 50, 'all'].map((b) => (
                <button
                  key={b.toString()}
                  onClick={() => { setSessionBatch(b as number | 'all'); setCurrentIndex(0); setIsFlipped(false); }}
                  className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-colors ${
                    sessionBatch === b
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
                  }`}
                >
                  {b === 'all' ? 'الكل' : `${b} بطاقة`}
                </button>
              ))}
            </div>
          </div>

          {/* Flashcard Simulator Stage */}
          {activeDeck.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center text-xs text-slate-400 space-y-3">
              <div className="flex items-center justify-center gap-2 text-indigo-400 text-sm font-bold">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>لا توجد بطاقات في هذا التصنيف حالياً</span>
              </div>
              <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
                تتزامن البطاقات الذكية والمصطلحات والقوانين تلقائياً ولحظياً بمجرد إضافتها من المشرف العام (أ. محمود صيبعة) عبر لوحة الإدارة في Firebase.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => { setSelectedSubject('all'); setSelectedDeckId('all'); setSearchQuery(''); }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
                >
                  إظهار كافة المواد
                </button>
                <button
                  onClick={() => setIsNewCardModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md shadow-indigo-600/30"
                >
                  إضافة بطاقة ذكية الآن
                </button>
              </div>
            </div>
          ) : currentCard && (
            <div className="space-y-4">
              
              {/* Card Meta Indicator */}
              <div className="flex items-center justify-between text-xs text-slate-400 px-2">
                <span className="font-mono tabular-nums">
                  البطاقة {currentIndex + 1} من {activeDeck.length}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span>أتقنتها: {masteredCount}</span>
                  </span>
                  <span className="text-amber-400 flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    <span>تحتاج مراجعة: {reviewCount}</span>
                  </span>
                </div>
              </div>

              {/* 3D Perspective Card Container */}
              <div 
                className="perspective-1000 w-full min-h-[320px] sm:min-h-[360px] cursor-pointer"
                onClick={handleFlip}
              >
                <div 
                  className={`relative w-full h-full min-h-[320px] sm:min-h-[360px] transition-transform duration-500 transform-style-3d rounded-3xl border ${
                    isFlipped 
                      ? 'rotate-y-180 border-indigo-500/40 bg-slate-900 shadow-2xl shadow-indigo-500/10' 
                      : 'border-slate-800 glass-card shadow-2xl'
                  }`}
                  style={{
                    backgroundImage: !isFlipped ? 'radial-gradient(circle at top center, rgba(99, 102, 241, 0.08), transparent 75%)' : undefined
                  }}
                >
                  
                  {/* FRONT FACE (Question) */}
                  <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-between backface-hidden">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-indigo-300 bg-indigo-950/70 border border-indigo-500/30 px-3 py-1 rounded-full shadow-sm">
                        الوجه الأمامي (السؤال / المصطلح)
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSpeak(currentCard.question, currentCard.subjectId === 'english');
                        }}
                        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="نطق السؤال صوتياً (TTS)"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="my-auto text-center px-4">
                      <h2 className="text-lg sm:text-2xl font-bold text-white leading-relaxed">
                        {currentCard.question}
                      </h2>
                      {currentCard.deckTitle && (
                        <span className="inline-block mt-3 text-[11px] text-indigo-400/80 bg-indigo-950/50 border border-indigo-500/20 px-3 py-0.5 rounded-full">
                          الحزمة: {currentCard.deckTitle}
                        </span>
                      )}
                    </div>

                    {/* Bottom hint or flip prompt */}
                    <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/80 pt-3">
                      {currentCard.hint ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowHint(!showHint);
                          }}
                          className="text-amber-400/90 hover:text-amber-300 flex items-center gap-1.5 text-[11px] font-semibold"
                        >
                          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                          <span>{showHint ? currentCard.hint : 'إظهار التلميح الذهبي'}</span>
                        </button>
                      ) : <div />}

                      <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <RotateCw className="w-3.5 h-3.5 text-indigo-400" />
                        <span>انقر أو اضغط مسافة للقلب</span>
                      </span>
                    </div>
                  </div>

                  {/* BACK FACE (Answer) */}
                  <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-between backface-hidden rotate-y-180">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-3 py-1 rounded-full shadow-sm">
                        الوجه الخلفي (الجواب والشرح النموذجي)
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSpeak(currentCard.answer, currentCard.subjectId === 'english');
                        }}
                        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="نطق الإجابة صوتياً (TTS)"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="my-auto text-center px-4">
                      <p className="text-base sm:text-xl font-medium text-slate-100 leading-relaxed">
                        {currentCard.answer}
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-2 border-t border-slate-800/80 pt-3 text-[11px] text-slate-400">
                      <span>قيّم مدى استيعابك لتحديث سجل التكرار المتباعد</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Action Decision Deck (Mastered vs Review) */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleMastered}
                  className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-bold text-sm transition-all active:scale-95 shadow-sm"
                >
                  <Check className="w-5 h-5 text-emerald-400" />
                  <span>أتقنتها تماماً (اضغط 1)</span>
                </button>

                <button
                  onClick={handleReview}
                  className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-sm transition-all active:scale-95 shadow-sm"
                >
                  <RotateCw className="w-5 h-5 text-amber-400" />
                  <span>تحتاج مراجعة (اضغط 2)</span>
                </button>
              </div>

              {/* Navigation Arrows */}
              <div className="flex items-center justify-between text-xs text-slate-400 px-1 pt-1">
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 transition-colors ${
                    currentIndex === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>السابقة (سهم يسار)</span>
                </button>

                <button
                  onClick={handleNext}
                  disabled={currentIndex === activeDeck.length - 1}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 transition-colors ${
                    currentIndex === activeDeck.length - 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  <span>التالية (سهم يمين)</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}

        </div>
      )}

      {/* New Card Modal */}
      <AnimatePresence>
        {isNewCardModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-400" />
                  <span>إضافة بطاقة ذكية جديدة</span>
                </h3>
                <button
                  onClick={() => setIsNewCardModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddCardSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">المادة الدراسية:</label>
                  <select
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value as SubjectId)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  >
                    {curriculum.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {flashcardDecks.length > 0 && (
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">الحزمة التابعة لها (اختياري):</label>
                    <select
                      value={newDeckId}
                      onChange={(e) => setNewDeckId(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="">بدون حزمة محددة (بطاقة عامة)</option>
                      {flashcardDecks.map(d => (
                        <option key={d.id} value={d.id}>{d.title} ({d.unit || 'عام'})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">الوجه الأمامي (السؤال / المصطلح):</label>
                  <textarea
                    rows={2}
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="مثال: عرّف النواس المرن واذكر شرط الحركة التوافقية البسيطة..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">الوجه الخلفي (الجواب / الشرح):</label>
                  <textarea
                    rows={3}
                    value={newAnswer}
                    onChange={(e) => setNewAnswer(e.target.value)}
                    placeholder="نص الإجابة النموذجية..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">تلميح ذهبي (اختياري):</label>
                  <input
                    type="text"
                    value={newHint}
                    onChange={(e) => setNewHint(e.target.value)}
                    placeholder="كلمة مفتاحية أو معادلة مساعدة..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsNewCardModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:text-white"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                  >
                    حفظ البطاقة
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
