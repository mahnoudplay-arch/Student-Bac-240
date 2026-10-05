import React, { useState, useEffect } from 'react';
import { 
  Languages, 
  Volume2, 
  Copy, 
  Check, 
  ArrowLeftRight, 
  Bookmark, 
  BookmarkCheck, 
  Trash2, 
  Search, 
  BookMarked,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { sound } from '../../services/sound';

type LangPair = 'en-ar' | 'ar-en' | 'fr-ar' | 'ar-fr';

interface SavedWord {
  id: string;
  sourceText: string;
  translatedText: string;
  lang: string;
  date: string;
}

// Baccalaureate Syllabus Core Vocabulary
const BAC_CURRICULUM_VOCAB = [
  // English Unit 1: Science & Innovation
  { id: 'en1', word: 'Breakthrough', translation: 'إنجاز علمي خارق / قفزة نوعية', partOfSpeech: 'noun', example: 'Scientists made a major breakthrough in gene therapy.', subject: 'english', unit: 'Unit 1: Science' },
  { id: 'en2', word: 'Artificial', translation: 'اصطناعي / غير طبيعي', partOfSpeech: 'adj', example: 'Artificial intelligence is changing modern medicine.', subject: 'english', unit: 'Unit 1: Science' },
  { id: 'en3', word: 'Hypothesis', translation: 'فرضية علمية', partOfSpeech: 'noun', example: 'The researcher tested the hypothesis rigorously.', subject: 'english', unit: 'Unit 1: Science' },
  { id: 'en4', word: 'Pioneer', translation: 'رائد / يبتكر مساراً جديداً', partOfSpeech: 'noun/verb', example: 'Ibn al-Nafis was a pioneer in medicine.', subject: 'english', unit: 'Unit 1: Science' },
  { id: 'en5', word: 'Radiation', translation: 'إشعاع', partOfSpeech: 'noun', example: 'Electromagnetic radiation travels at the speed of light.', subject: 'english', unit: 'Unit 1: Science' },
  // English Unit 2: The Environment
  { id: 'en6', word: 'Biodiversity', translation: 'التنوع الحيوي / الحيواني والنباتي', partOfSpeech: 'noun', example: 'Protecting biodiversity preserves the global ecosystem.', subject: 'english', unit: 'Unit 2: Environment' },
  { id: 'en7', word: 'Conservation', translation: 'حماية الطبيعة / ترشيد الاستهلاك', partOfSpeech: 'noun', example: 'Water conservation is vital in drought regions.', subject: 'english', unit: 'Unit 2: Environment' },
  { id: 'en8', word: 'Drought', translation: 'جفاف / قحط', partOfSpeech: 'noun', example: 'Severe drought damaged agricultural crops.', subject: 'english', unit: 'Unit 2: Environment' },
  { id: 'en9', word: 'Renewable', translation: 'متجدد (كالطاقة الشمسية والريحية)', partOfSpeech: 'adj', example: 'Solar and wind are key renewable energy sources.', subject: 'english', unit: 'Unit 2: Environment' },
  { id: 'en10', word: 'Erosion', translation: 'انجراف التربة / تآكل', partOfSpeech: 'noun', example: 'Planting trees prevents severe soil erosion.', subject: 'english', unit: 'Unit 2: Environment' },
  // English Unit 3: Health & Medicine
  { id: 'en11', word: 'Diagnosis', translation: 'تشخيص المرض', partOfSpeech: 'noun', example: 'Early diagnosis is essential for effective treatment.', subject: 'english', unit: 'Unit 3: Health' },
  { id: 'en12', word: 'Epidemic', translation: 'وباء متفشي', partOfSpeech: 'noun', example: 'Health authorities worked quickly to curb the epidemic.', subject: 'english', unit: 'Unit 3: Health' },
  { id: 'en13', word: 'Therapy', translation: 'علاج / معالجة', partOfSpeech: 'noun', example: 'Physical therapy restored the patient’s mobility.', subject: 'english', unit: 'Unit 3: Health' },
  { id: 'en14', word: 'Immunity', translation: 'مناعة الجسم', partOfSpeech: 'noun', example: 'Vaccines enhance the body’s natural immunity.', subject: 'english', unit: 'Unit 3: Health' },
  // French Core Units
  { id: 'fr1', word: 'Environnement', translation: 'البيئة والمحيط الطبيعي', partOfSpeech: 'nom', example: 'La protection de l’environnement est une priorité.', subject: 'french', unit: 'Module 1: Environnement' },
  { id: 'fr2', word: 'Patrimoine', translation: 'تراث / إرث حضاري', partOfSpeech: 'nom', example: 'Damas possède un riche patrimoine historique.', subject: 'french', unit: 'Module 2: Culture' },
  { id: 'fr3', word: 'Progrès scientifique', translation: 'التقدم العلمي', partOfSpeech: 'expression', example: 'Le progrès scientifique améliore la vie quotidienne.', subject: 'french', unit: 'Module 3: Science' },
  { id: 'fr4', word: 'Développement durable', translation: 'التنمية المستدامة', partOfSpeech: 'expression', example: 'L’énergie solaire soutient le développement durable.', subject: 'french', unit: 'Module 1: Environnement' },
  { id: 'fr5', word: 'Santé publique', translation: 'الصحة العامة', partOfSpeech: 'expression', example: 'La prévention est la base de la santé publique.', subject: 'french', unit: 'Module 4: Santé' },
  { id: 'fr6', word: 'Pollution sonore', translation: 'التلوث السمعي / الضجيج', partOfSpeech: 'expression', example: 'La pollution sonore nuit à la concentration.', subject: 'french', unit: 'Module 1: Environnement' },
];

// Rapid offline dictionary for high-frequency conversational & academic words
const COMMON_DICTIONARY: Record<string, { en: string; fr: string }> = {
  'مرحبا': { en: 'Hello', fr: 'Bonjour' },
  'مرحباً': { en: 'Hello', fr: 'Bonjour' },
  'أهلا': { en: 'Welcome', fr: 'Bienvenue' },
  'اهلا': { en: 'Welcome', fr: 'Bienvenue' },
  'أهلا وسهلا': { en: 'Welcome', fr: 'Bienvenue' },
  'صباح الخير': { en: 'Good morning', fr: 'Bonjour' },
  'مساء الخير': { en: 'Good evening', fr: 'Bonsoir' },
  'شكرا': { en: 'Thank you', fr: 'Merci' },
  'شكراً': { en: 'Thank you', fr: 'Merci' },
  'شكرا جزيلا': { en: 'Thank you very much', fr: 'Merci beaucoup' },
  'عفوا': { en: "You're welcome", fr: 'De rien' },
  'مع السلامة': { en: 'Goodbye', fr: 'Au revoir' },
  'إلى اللقاء': { en: 'See you later', fr: 'À bientôt' },
  'نعم': { en: 'Yes', fr: 'Oui' },
  'لا': { en: 'No', fr: 'Non' },
  'كيف حالك': { en: 'How are you?', fr: 'Comment allez-vous ?' },
  'كيف حالك؟': { en: 'How are you?', fr: 'Comment allez-vous ?' },
  'طالب': { en: 'Student', fr: 'Étudiant' },
  'طالبة': { en: 'Female student', fr: 'Étudiante' },
  'مدرسة': { en: 'School', fr: 'École' },
  'جامعة': { en: 'University', fr: 'Université' },
  'امتحان': { en: 'Exam', fr: 'Examen' },
  'اختبار': { en: 'Test', fr: 'Test' },
  'كتاب': { en: 'Book', fr: 'Livre' },
  'دفتر': { en: 'Notebook', fr: 'Cahier' },
  'قلم': { en: 'Pen', fr: 'Stylo' },
  'معلم': { en: 'Teacher', fr: 'Enseignant' },
  'أستاذ': { en: 'Teacher / Professor', fr: 'Professeur' },
  'فيزياء': { en: 'Physics', fr: 'Physique' },
  'كيمياء': { en: 'Chemistry', fr: 'Chimie' },
  'رياضيات': { en: 'Mathematics', fr: 'Mathématiques' },
  'علوم': { en: 'Science / Biology', fr: 'Sciences' },
  'درس': { en: 'Lesson', fr: 'Leçon' },
  'دراسة': { en: 'Study', fr: 'Étude' },
  'مسألة': { en: 'Problem', fr: 'Problème' },
  'قانون': { en: 'Law / Rule', fr: 'Loi' },
  'سؤال': { en: 'Question', fr: 'Question' },
  'جواب': { en: 'Answer', fr: 'Réponse' },
};

// Reverse dictionary for English & French to Arabic
const REVERSE_COMMON_DICTIONARY: Record<string, string> = {
  'hello': 'مرحباً / أهلاً',
  'hi': 'مرحباً',
  'welcome': 'أهلاً وسهلاً',
  'good morning': 'صباح الخير',
  'good evening': 'مساء الخير',
  'thank you': 'شكراً جزيلاً',
  'thanks': 'شكراً',
  'please': 'من فضلك / رجاءً',
  'yes': 'نعم',
  'no': 'لا',
  'student': 'طالب',
  'teacher': 'أستاذ / معلم',
  'school': 'مدرسة',
  'exam': 'امتحان',
  'test': 'اختبار',
  'book': 'كتاب',
  'physics': 'الفيزياء',
  'chemistry': 'الكيمياء',
  'mathematics': 'الرياضيات',
  'math': 'الرياضيات',
  'science': 'العلوم',
  'bonjour': 'صباح الخير / مرحباً',
  'merci': 'شكراً',
  'oui': 'نعم',
  'non': 'لا',
  'livre': 'كتاب',
  'école': 'مدرسة',
  'examen': 'امتحان'
};

export const SmartTranslator: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [langPair, setLangPair] = useState<LangPair>('ar-en');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'translate' | 'curriculum' | 'saved'>('translate');
  const [vocabSearch, setVocabSearch] = useState<string>('');
  const [vocabLangFilter, setVocabLangFilter] = useState<'all' | 'english' | 'french'>('all');
  const [autoDetectedNotice, setAutoDetectedNotice] = useState<string>('');

  const [savedWords, setSavedWords] = useState<SavedWord[]>(() => {
    try {
      const saved = localStorage.getItem('bac240_saved_vocabulary');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('bac240_saved_vocabulary', JSON.stringify(savedWords));
    } catch {}
  }, [savedWords]);

  // Intelligent language auto-direction on text change
  const handleInputChange = (val: string) => {
    setInputText(val);
    const trimmed = val.trim();
    if (!trimmed) {
      setAutoDetectedNotice('');
      return;
    }

    const hasArabic = /[\u0600-\u06FF]/.test(trimmed);
    const hasLatin = /[a-zA-Z]/.test(trimmed);

    if (hasArabic && !hasLatin) {
      if (langPair === 'en-ar') {
        setLangPair('ar-en');
        setAutoDetectedNotice('تم التعرف التلقائي: العربية ← الإنجليزية');
      } else if (langPair === 'fr-ar') {
        setLangPair('ar-fr');
        setAutoDetectedNotice('تم التعرف التلقائي: العربية ← الفرنسية');
      }
    } else if (hasLatin && !hasArabic) {
      if (langPair === 'ar-en') {
        setLangPair('en-ar');
        setAutoDetectedNotice('تم التعرف التلقائي: الإنجليزية ← العربية');
      } else if (langPair === 'ar-fr') {
        setLangPair('fr-ar');
        setAutoDetectedNotice('تم التعرف التلقائي: الفرنسية ← العربية');
      }
    }
  };

  // Translate handler using multiple resilient strategies
  const handleTranslate = async () => {
    const text = inputText.trim();
    if (!text) {
      setTranslatedText('');
      return;
    }

    setIsLoading(true);
    setError('');
    sound.button();

    // 1. Check Common Instant Dictionary first
    const cleanKey = text.toLowerCase().replace(/[؟?!.,]/g, '').trim();
    const commonMatch = COMMON_DICTIONARY[cleanKey];
    if (commonMatch) {
      const isFrenchMode = langPair.includes('fr');
      setTranslatedText(isFrenchMode ? commonMatch.fr : commonMatch.en);
      setIsLoading(false);
      return;
    }

    const reverseMatch = REVERSE_COMMON_DICTIONARY[cleanKey];
    if (reverseMatch) {
      setTranslatedText(reverseMatch);
      setIsLoading(false);
      return;
    }

    // 2. Check offline curriculum vocabulary
    const localMatch = BAC_CURRICULUM_VOCAB.find(
      v => v.word.toLowerCase() === cleanKey || v.translation.includes(text)
    );
    if (localMatch) {
      if (langPair === 'en-ar' || langPair === 'fr-ar') {
        setTranslatedText(localMatch.translation);
        setIsLoading(false);
        return;
      } else {
        setTranslatedText(localMatch.word);
        setIsLoading(false);
        return;
      }
    }

    // 3. Smart Script Direction Detection
    // If text is Arabic, source is 'ar' regardless of what the user selected!
    const hasArabic = /[\u0600-\u06FF]/.test(text);
    const isFrench = langPair.includes('fr');

    let sourceLang = '';
    let targetLang = '';

    if (hasArabic) {
      sourceLang = 'ar';
      targetLang = isFrench ? 'fr' : 'en';
      // Sync langPair
      setLangPair(isFrench ? 'ar-fr' : 'ar-en');
    } else {
      sourceLang = isFrench ? 'fr' : 'en';
      targetLang = 'ar';
      // Sync langPair
      setLangPair(isFrench ? 'fr-ar' : 'en-ar');
    }

    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('فشل استجابة مخدم الترجمة');
      const data = await res.json();

      let translated = data?.responseData?.translatedText;

      // Critical fix: If API returns identical text (e.g. "مرحبا" -> "مرحبا"), check data.matches
      if (!translated || translated.trim().toLowerCase() === text.toLowerCase()) {
        if (data?.matches && Array.isArray(data.matches)) {
          const betterMatch = data.matches.find(
            (m: any) => m.translation && m.translation.trim().toLowerCase() !== text.toLowerCase()
          );
          if (betterMatch) {
            translated = betterMatch.translation;
          }
        }
      }

      // If still identical, try reversing the query direction
      if (!translated || translated.trim().toLowerCase() === text.toLowerCase()) {
        const reverseUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${targetLang}|${sourceLang}`;
        const reverseRes = await fetch(reverseUrl);
        if (reverseRes.ok) {
          const revData = await reverseRes.json();
          if (revData?.responseData?.translatedText && revData.responseData.translatedText.trim().toLowerCase() !== text.toLowerCase()) {
            translated = revData.responseData.translatedText;
          } else if (revData?.matches) {
            const revMatch = revData.matches.find(
              (m: any) => m.translation && m.translation.trim().toLowerCase() !== text.toLowerCase()
            );
            if (revMatch) translated = revMatch.translation;
          }
        }
      }

      if (translated && translated.trim().toLowerCase() !== text.toLowerCase()) {
        setTranslatedText(translated);
      } else {
        // Fallback: If still matching, provide clear translation
        if (cleanKey.includes('مرحبا') || cleanKey.includes('اهلا')) {
          setTranslatedText(targetLang === 'fr' ? 'Bonjour' : 'Hello');
        } else {
          setTranslatedText(translated || text);
        }
      }
    } catch (err: any) {
      console.warn('Translation API error:', err);
      // Fallback to offline check
      if (cleanKey.includes('مرحبا')) {
        setTranslatedText(isFrench ? 'Bonjour' : 'Hello');
      } else {
        setError('تعذر جلب الترجمة من الخادم السحابي، تأكد من الاتصال بالإنترنت.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Text-To-Speech Pronunciation
  const handleSpeak = (text: string, langCode: string) => {
    if (!text || typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      if (langCode === 'en') utterance.lang = 'en-US';
      else if (langCode === 'fr') utterance.lang = 'fr-FR';
      else if (langCode === 'ar') utterance.lang = 'ar-SA';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } catch {}
  };

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    sound.success();
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSwapLang = () => {
    sound.button();
    if (langPair === 'en-ar') setLangPair('ar-en');
    else if (langPair === 'ar-en') setLangPair('en-ar');
    else if (langPair === 'fr-ar') setLangPair('ar-fr');
    else if (langPair === 'ar-fr') setLangPair('fr-ar');

    setInputText(translatedText);
    setTranslatedText(inputText);
  };

  const isCurrentSaved = savedWords.some(
    w => w.sourceText.toLowerCase() === inputText.trim().toLowerCase()
  );

  const handleToggleSave = () => {
    if (!inputText.trim() || !translatedText.trim()) return;
    sound.button();
    const cleanSource = inputText.trim();

    if (isCurrentSaved) {
      setSavedWords(prev => prev.filter(w => w.sourceText.toLowerCase() !== cleanSource.toLowerCase()));
    } else {
      const newWord: SavedWord = {
        id: Date.now().toString(),
        sourceText: cleanSource,
        translatedText: translatedText.trim(),
        lang: langPair,
        date: new Date().toLocaleDateString('ar-SY')
      };
      setSavedWords(prev => [newWord, ...prev]);
      sound.success();
    }
  };

  const filteredCurriculumVocab = BAC_CURRICULUM_VOCAB.filter(v => {
    const matchesSearch = 
      v.word.toLowerCase().includes(vocabSearch.toLowerCase()) || 
      v.translation.includes(vocabSearch);
    const matchesLang = vocabLangFilter === 'all' || v.subject === vocabLangFilter;
    return matchesSearch && matchesLang;
  });

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5" dir="rtl">
      {/* Top Banner */}
      <div className="p-4 sm:p-6 rounded-3xl glass-card border border-violet-500/20 bg-gradient-to-r from-slate-900/90 via-violet-950/20 to-slate-900/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0 shadow-lg shadow-violet-600/10">
            <Languages className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>المترجم وقاموس منهاج البكالوريا</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300">
                إنجليزي & فرنسي
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              ترجمة النصوص والمصطلحات، النطق الصوتي الصحيح، وحفظ المفردات الصعبة للمراجعة
            </p>
          </div>
        </div>

        {/* Sub-Tabs Switcher */}
        <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-1 text-xs">
          <button
            onClick={() => { setActiveTab('translate'); sound.button(); }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'translate'
                ? 'bg-violet-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            المترجم الفوري
          </button>
          <button
            onClick={() => { setActiveTab('curriculum'); sound.button(); }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'curriculum'
                ? 'bg-violet-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            قاموس الكتاب الوزاري
          </button>
          <button
            onClick={() => { setActiveTab('saved'); sound.button(); }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'saved'
                ? 'bg-violet-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            كلماتي المحفوظة ({savedWords.length})
          </button>
        </div>
      </div>

      {/* Main Tab 1: Direct Translator */}
      {activeTab === 'translate' && (
        <div className="space-y-4">
          
          {/* Language Selector Bar */}
          <div className="p-3 rounded-2xl glass-card border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <span className="text-slate-400">لغة المصدر:</span>
              <span className="text-violet-400">
                {langPair.startsWith('en') ? 'الإنجليزية (EN)' : langPair.startsWith('fr') ? 'الفرنسية (FR)' : 'العربية (AR)'}
              </span>
            </div>

            {/* Language Pairs Pills */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => { setLangPair('en-ar'); sound.button(); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                  langPair === 'en-ar' 
                    ? 'bg-violet-600/25 border-violet-500/50 text-violet-300' 
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                EN → AR
              </button>
              <button
                onClick={() => { setLangPair('ar-en'); sound.button(); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                  langPair === 'ar-en' 
                    ? 'bg-violet-600/25 border-violet-500/50 text-violet-300' 
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                AR → EN
              </button>
              <button
                onClick={() => { setLangPair('fr-ar'); sound.button(); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                  langPair === 'fr-ar' 
                    ? 'bg-violet-600/25 border-violet-500/50 text-violet-300' 
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                FR → AR
              </button>
              <button
                onClick={() => { setLangPair('ar-fr'); sound.button(); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                  langPair === 'ar-fr' 
                    ? 'bg-violet-600/25 border-violet-500/50 text-violet-300' 
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                AR → FR
              </button>
              <button
                onClick={handleSwapLang}
                title="عكس اللغات"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all ml-1"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Dual Textareas Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Input Box */}
            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4 space-y-3 flex flex-col justify-between h-[280px]">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span>أدخل الكلمة أو الجملة المراد ترجمتها:</span>
                    {autoDetectedNotice && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-bold border border-violet-500/30">
                        {autoDetectedNotice}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-[11px]">{inputText.length} حرف</span>
                </div>
                <textarea
                  value={inputText}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      handleTranslate();
                    }
                  }}
                  placeholder={langPair.startsWith('ar') ? 'اكتب النص بالعربية هنا...' : 'Type word or sentence here...'}
                  className="w-full h-40 bg-transparent resize-none outline-none text-slate-200 placeholder-slate-600 text-sm sm:text-base leading-relaxed"
                  dir={langPair.startsWith('ar') ? 'rtl' : 'ltr'}
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5">
                  {inputText && (
                    <button
                      onClick={() => handleSpeak(inputText, langPair.split('-')[0])}
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-violet-300 transition-all text-xs flex items-center gap-1"
                      title="استماع للنطق"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span className="text-[11px]">نطق</span>
                    </button>
                  )}
                  {inputText && (
                    <button
                      onClick={() => setInputText('')}
                      className="text-[11px] text-slate-500 hover:text-rose-400 font-bold px-2 py-1"
                    >
                      مسح
                    </button>
                  )}
                </div>

                <button
                  onClick={handleTranslate}
                  disabled={isLoading || !inputText.trim()}
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-violet-600/20 transition-all flex items-center gap-1.5"
                >
                  {isLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>جاري الترجمة...</span>
                    </>
                  ) : (
                    <span>ترجم الآن</span>
                  )}
                </button>
              </div>
            </div>

            {/* Output Box */}
            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4 space-y-3 flex flex-col justify-between h-[280px]">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>نتيجة الترجمة:</span>
                  {translatedText && (
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                      <Sparkles className="w-3 h-3" />
                      جاهزة
                    </span>
                  )}
                </div>

                {error ? (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                    {error}
                  </div>
                ) : (
                  <div 
                    className="w-full h-40 overflow-y-auto text-slate-100 text-sm sm:text-base leading-relaxed"
                    dir={langPair.endsWith('ar') ? 'rtl' : 'ltr'}
                  >
                    {translatedText || (
                      <span className="text-slate-600 italic">ستظهر نتيجة الترجمة المعتمدة هنا...</span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5">
                  {translatedText && (
                    <button
                      onClick={() => handleSpeak(translatedText, langPair.split('-')[1])}
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-violet-300 transition-all text-xs flex items-center gap-1"
                      title="استماع للترجمة"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span className="text-[11px]">نطق</span>
                    </button>
                  )}
                  {translatedText && (
                    <button
                      onClick={() => handleCopy(translatedText)}
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-violet-300 transition-all text-xs flex items-center gap-1"
                      title="نسخ الترجمة"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="text-[11px]">{copied ? 'تم النسخ' : 'نسخ'}</span>
                    </button>
                  )}
                </div>

                {translatedText && (
                  <button
                    onClick={handleToggleSave}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                      isCurrentSaved
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-amber-300'
                    }`}
                  >
                    {isCurrentSaved ? <BookmarkCheck className="w-3.5 h-3.5 text-amber-400" /> : <Bookmark className="w-3.5 h-3.5" />}
                    <span>{isCurrentSaved ? 'محفوظة في قائمتي' : 'حفظ الكلمة'}</span>
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* Quick Curriculum Chips Bar */}
          <div className="p-3.5 rounded-2xl glass-card border border-slate-800/80 bg-slate-950/40">
            <div className="text-[11px] text-slate-400 mb-2 font-bold flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-violet-400" />
              <span>كلمات نموذجية متكررة بامتحانات البكالوريا (اضغط للترجمة الفورية):</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {BAC_CURRICULUM_VOCAB.slice(0, 8).map(v => (
                <button
                  key={v.id}
                  onClick={() => {
                    setInputText(v.word);
                    setLangPair(v.subject === 'french' ? 'fr-ar' : 'en-ar');
                    setTranslatedText(v.translation);
                    sound.button();
                  }}
                  className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-violet-950/40 border border-slate-800 hover:border-violet-500/30 text-slate-300 text-xs font-mono transition-all"
                >
                  {v.word}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Tab 2: Curriculum Vocabulary Bank */}
      {activeTab === 'curriculum' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute right-3 top-3 text-slate-500" />
              <input
                type="text"
                value={vocabSearch}
                onChange={(e) => setVocabSearch(e.target.value)}
                placeholder="ابحث بالإنجليزية أو الفرنسية أو العربية..."
                className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl pr-9 pl-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-violet-500/50"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => { setVocabLangFilter('all'); sound.button(); }}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                  vocabLangFilter === 'all'
                    ? 'bg-violet-600 text-white border-violet-500'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                الكل
              </button>
              <button
                onClick={() => { setVocabLangFilter('english'); sound.button(); }}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                  vocabLangFilter === 'english'
                    ? 'bg-violet-600 text-white border-violet-500'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                الإنجليزية (English)
              </button>
              <button
                onClick={() => { setVocabLangFilter('french'); sound.button(); }}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                  vocabLangFilter === 'french'
                    ? 'bg-violet-600 text-white border-violet-500'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                الفرنسية (Français)
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredCurriculumVocab.map(item => (
              <div
                key={item.id}
                className="p-4 rounded-2xl glass-card border border-slate-800/80 bg-slate-950/60 hover:border-violet-500/40 transition-all space-y-2 group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-white font-mono group-hover:text-violet-300 transition-colors">
                        {item.word}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                        {item.partOfSpeech}
                      </span>
                    </div>
                    <div className="text-xs text-emerald-400 font-bold mt-1">
                      {item.translation}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleSpeak(item.word, item.subject === 'french' ? 'fr' : 'en')}
                      title="استماع للنطق"
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-violet-300 transition-all"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setInputText(item.word);
                        setTranslatedText(item.translation);
                        setLangPair(item.subject === 'french' ? 'fr-ar' : 'en-ar');
                        setActiveTab('translate');
                        sound.button();
                      }}
                      title="فتح في المترجم"
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-violet-300 transition-all"
                    >
                      <Languages className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/60 text-xs text-slate-300 font-mono italic dir-ltr text-left">
                  "{item.example}"
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>{item.unit}</span>
                  <span className="uppercase">{item.subject}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Tab 3: Saved Words Deck */}
      {activeTab === 'saved' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>الكلمات التي قمت بحفظها أثناء الدراسة:</span>
            {savedWords.length > 0 && (
              <button
                onClick={() => { setSavedWords([]); sound.button(); }}
                className="text-rose-400 hover:text-rose-300 font-bold"
              >
                مسح الكل
              </button>
            )}
          </div>

          {savedWords.length === 0 ? (
            <div className="p-12 rounded-3xl glass-card border border-slate-800 text-center space-y-3">
              <BookMarked className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-white">لم تقم بحفظ أي كلمات بعد</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                أثناء استخدام المترجم، اضغط على زر "حفظ الكلمة" لتكوين قائمة مفرداتك الخاصة لمراجعتها قبل الامتحان.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {savedWords.map(word => (
                <div
                  key={word.id}
                  className="p-4 rounded-2xl glass-card border border-slate-800 bg-slate-950/70 space-y-2 relative group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-sm text-white font-mono">{word.sourceText}</div>
                      <div className="text-xs text-emerald-400 font-bold mt-0.5">{word.translatedText}</div>
                    </div>

                    <button
                      onClick={() => {
                        setSavedWords(prev => prev.filter(w => w.id !== word.id));
                        sound.button();
                      }}
                      className="p-1 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                      title="حذف من المحفوظات"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-800">
                    <span className="uppercase font-mono">{word.lang}</span>
                    <span>{word.date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
