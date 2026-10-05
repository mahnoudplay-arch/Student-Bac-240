import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Award, 
  Bookmark, 
  Sparkles, 
  Scroll,
  HelpCircle,
  Check
} from 'lucide-react';
import { sound } from '../../services/sound';

interface VerseAnalysis {
  id: string;
  poem: string;
  poet: string;
  unit: string;
  verseText: string;
  wordParsings: Array<{ word: string; parsing: string }>;
  sentenceParsings: Array<{ sentence: string; status: string; reason: string }>;
  derivatives: Array<{ word: string; type: string; weight: string }>;
  morphologyRules: Array<{ word: string; ruleType: string; explanation: string }>;
}

const BAC_ARABIC_VERSES: VerseAnalysis[] = [
  {
    id: 'v1',
    poem: 'وطني',
    poet: 'خير الدين الزركلي',
    unit: 'الوحدة الأولى: الفكر القومي والأدب الوطني',
    verseText: 'وَطَني لَئِنْ عَبَثَتْ بِكَ الأَحْداثُ ... وَتَناوَحَتْ بِذُراكَ فيها الرّيحُ',
    wordParsings: [
      { word: 'وَطَني', parsing: 'منادى مضاف منصوب وعلامة نصبه الفتحة المقدرة على ما قبل ياء المتكلم، والياء ضمير متصل مبني في محل جر بالإضافة.' },
      { word: 'لَئِنْ', parsing: 'اللام موطئة للقسم، إن: حرف شرط جازم يجزم فعلين مضارعين.' },
      { word: 'عَبَثَتْ', parsing: 'فعل ماضٍ مبني على الفتح الظاهر لاتصاله بتاء التأنيث الساكنة، والتاء لا محل لها من الإعراب، وحُرّكت بالكسر منعاً لالتقاء الساكنين.' },
      { word: 'الأَحْداثُ', parsing: 'فاعل مرفوع وعلامة رفعه الضمة الظاهرة على آخره.' },
      { word: 'الرّيحُ', parsing: 'فاعل مؤخر للفعل (تناوحت) مرفوع وعلامة رفعه الضمة الظاهرة.' }
    ],
    sentenceParsings: [
      { sentence: '(عبثت بك الأحداث)', status: 'لا محل لها من الإعراب', reason: 'جملة صلة الموصول الحرفي (أو جملة فعل الشرط غير الظرفي)' },
      { sentence: '(وطني)', status: 'لا محل لها من الإعراب', reason: 'جملة النداء الاستئنافية' }
    ],
    derivatives: [
      { word: 'الأحداث', type: 'اسم جامد ذات / جمع تكسير', weight: 'أفْعال' }
    ],
    morphologyRules: [
      { word: 'تناوحت', ruleType: 'إعلال بالقلب', explanation: 'أصلها (تناوَحَت) تحركت الواو وانفتح ما قبلها فقُلبت ألفاً' }
    ]
  },
  {
    id: 'v2',
    poem: 'عرس المجد',
    poet: 'عمر أبو ريشة',
    unit: 'الوحدة الأولى: الفكر القومي وقضايا التحرر',
    verseText: 'يا عَروسَ المَجْدِ تيهي وَاسْحَبي ... في مَغانينا ذُيولَ الشَّمَمِ',
    wordParsings: [
      { word: 'عَروسَ', parsing: 'منادى مضاف منصوب وعلامة نصبه الفتحة الظاهرة على آخره.' },
      { word: 'المَجْدِ', parsing: 'مضاف إليه مجرور وعلامة جره الكسرة الظاهرة على آخره.' },
      { word: 'تيهي', parsing: 'فعل أمر مبني على حذف النون من آخره لأن مضارعه من الأفعال الخمسة، والياء ضمير متصل مبني في محل رفع فاعل.' },
      { word: 'ذُيولَ', parsing: 'مفعول به منصوب للفعل اسحبي وعلامة نصبه الفتحة الظاهرة.' }
    ],
    sentenceParsings: [
      { sentence: '(تيهي)', status: 'لا محل لها من الإعراب', reason: 'جواب النداء' },
      { sentence: '(اسحبي)', status: 'لا محل لها من الإعراب', reason: 'معطوفة على جملة (تيهي)' }
    ],
    derivatives: [
      { word: 'عروس', type: 'صفة مشبهة باسم الفاعل', weight: 'فَعول' },
      { word: 'مغانينا', type: 'اسم مكان (مغنى)', weight: 'مَفْعَل' }
    ],
    morphologyRules: [
      { word: 'تيهي', ruleType: 'إعلال بالقلب', explanation: 'أصلها (تَيَهَ) قُلبت الياء ألفاً لتحركها وانفتاح ما قبلها' }
    ]
  },
  {
    id: 'v3',
    poem: 'حتى ما تغفل',
    poet: 'جميل صدقي الزهاوي',
    unit: 'الوحدة الأولى: القضايا الوطنية ومقاومة الظلم',
    verseText: 'حَتّامَ نَغْفُلُ عَنْ دَهْرٍ يُجِدُّ بِنا ... وَنَحْنُ نَلْهو وَنَلْقا الأَمْرَ مَزّاحا',
    wordParsings: [
      { word: 'حَتّامَ', parsing: 'حتى: حرف جر، ما: اسم استفهام مبني في محل جر بحرف الجر، وحُذفت ألفها لدخول حرف الجر عليها.' },
      { word: 'نَغْفُلُ', parsing: 'فعل مضارع مرفوع وعلامة رفعه الضمة الظاهرة، والفاعل ضمير مستتر تقديره نحن.' },
      { word: 'وَنَحْنُ', parsing: 'الواو واو الحال، نحن: ضمير منفصل مبني على الضم في محل رفع مبتدأ.' },
      { word: 'نَلْهو', parsing: 'فعل مضارع مرفوع وعلامة رفعه الضمة المقدرة على الواو للثقل.' },
      { word: 'مَزّاحا', parsing: 'حال منصوبة وعلامة نصبها الفتحة الظاهرة على آخرها.' }
    ],
    sentenceParsings: [
      { sentence: '(يجدّ بنا)', status: 'في محل جر نعت (صفة)', reason: 'وقعت بعد نكرة (دهر) والجمل بعد النكرات صفات' },
      { sentence: '(نحن نلهو)', status: 'في محل نصب حال', reason: 'جملة اسمية بعد واو الحال' },
      { sentence: '(نلهو)', status: 'في محل رفع خبر', reason: 'خبر للمبتدأ (نحن)' }
    ],
    derivatives: [
      { word: 'مزّاحاً', type: 'صيغة مبالغة لاسم الفاعل', weight: 'فَعّال' }
    ],
    morphologyRules: [
      { word: 'نلهو', ruleType: 'إعلال بالتسكين', explanation: 'استُثقلت الضمة على الواو فسُكّنت' }
    ]
  },
  {
    id: 'v4',
    poem: 'فلسفة الحياة',
    poet: 'إيليا أبو ماضي',
    unit: 'الوحدة الثانية: الأدب الاجتماعي والإنساني',
    verseText: 'أَيُّهَذا الشّاكي وَما بِكَ داءٌ ... كَيْفَ تَغْدو إِذا غَدَوْتَ عَليلا؟',
    wordParsings: [
      { word: 'أيُّ', parsing: 'منادى نكرة مقصودة مبني على الضم في محل نصب بفعل النداء المحذوف، والهاء للتنبيه.' },
      { word: 'الشاكي', parsing: 'بدل (أو عطف بيان) مرفوع وعلامة رفعه الضمة المقدرة على الياء للثقل.' },
      { word: 'داءٌ', parsing: 'مبتدأ مؤخر مرفوع وعلامة رفعه الضمة الظاهرة على آخره.' },
      { word: 'كَيْفَ', parsing: 'اسم استفهام مبني على الفتح في محل نصب خبر مقدم لـ (تغدو).' },
      { word: 'عَليلا', parsing: 'خبر لـ (غدوت) منصوب وعلامة نصبه الفتحة الظاهرة.' }
    ],
    sentenceParsings: [
      { sentence: '(ما بك داء)', status: 'في محل نصب حال', reason: 'جملة اسمية مسبوقة بواو الحال' },
      { sentence: '(غدوت عليلاً)', status: 'في محل جر بالإضافة', reason: 'وقعت بعد الظرف (إذا)' }
    ],
    derivatives: [
      { word: 'الشاكي', type: 'اسم فاعل ثلاثي', weight: 'الفاعِل' },
      { word: 'عليلاً', type: 'صفة مشبهة باسم الفاعل', weight: 'فَعيل' }
    ],
    morphologyRules: [
      { word: 'الشاكي', ruleType: 'إعلال بالقلب', explanation: 'أصلها (الشاكو) قُلبت الواو ياءً لانكسار ما قبلها' }
    ]
  }
];

export const ArabicGrammarEngine: React.FC = () => {
  const [selectedVerseId, setSelectedVerseId] = useState<string>('v1');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'words' | 'sentences' | 'derivatives' | 'morphology'>('words');

  const filteredVerses = BAC_ARABIC_VERSES.filter(v => 
    v.verseText.includes(searchQuery) || 
    v.poem.includes(searchQuery) ||
    v.poet.includes(searchQuery)
  );

  const currentVerse = BAC_ARABIC_VERSES.find(v => v.id === selectedVerseId) || BAC_ARABIC_VERSES[0];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4" dir="rtl">
      {/* Header Banner */}
      <div className="p-4 sm:p-6 rounded-3xl glass-card border border-amber-500/20 bg-gradient-to-r from-slate-900/90 via-amber-950/20 to-slate-900/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-600/10">
            <Scroll className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>بنك إعراب وشواهد وقواعد اللغة العربية</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono">
                بكالوريا سوريا 2026
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              إعراب المفردات والجمل الوزارية، المشتقات، والعلل الصرفية لنصوص وقصائد المنهاج
            </p>
          </div>
        </div>
      </div>

      {/* Search & Verse Selectors */}
      <div className="p-4 rounded-3xl glass-card border border-slate-800 bg-slate-950/80 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute right-3 top-3 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن بيت شعري أو اسم القصيدة أو الشاعر..."
            className="w-full bg-slate-900 border border-slate-750 rounded-2xl pr-9 pl-4 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500/50"
          />
        </div>

        {/* Verse Cards Carousel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-1">
          {filteredVerses.map(v => (
            <button
              key={v.id}
              onClick={() => { setSelectedVerseId(v.id); sound.button(); }}
              className={`p-3 rounded-2xl border text-right transition-all ${
                selectedVerseId === v.id
                  ? 'bg-amber-950/40 border-amber-500/50 shadow-lg shadow-amber-500/10'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-amber-300">{v.poem}</span>
                <span className="text-[10px] text-slate-500">{v.poet}</span>
              </div>
              <div className="text-[11px] text-slate-300 truncate mt-1 font-serif">
                {v.verseText}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Verse Display Card */}
      <div className="p-5 sm:p-6 rounded-3xl glass-card border border-amber-500/30 bg-slate-950/90 space-y-5">
        
        {/* Poem Info Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">قصيدة: {currentVerse.poem}</span>
              <span className="text-xs text-amber-400 font-serif">({currentVerse.poet})</span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">{currentVerse.unit}</div>
          </div>
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 self-start sm:self-auto font-bold">
            شاهد وزاري متكرر
          </span>
        </div>

        {/* Verse Text Callout */}
        <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/20 text-center">
          <div className="font-serif text-base sm:text-xl font-bold text-amber-200 tracking-wide leading-relaxed">
            {currentVerse.verseText}
          </div>
        </div>

        {/* Analysis Sub-Tabs */}
        <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2">
          <button
            onClick={() => { setActiveSubTab('words'); sound.button(); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'words'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            إعراب المفردات ({currentVerse.wordParsings.length})
          </button>
          <button
            onClick={() => { setActiveSubTab('sentences'); sound.button(); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'sentences'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            إعراب الجمل ({currentVerse.sentenceParsings.length})
          </button>
          <button
            onClick={() => { setActiveSubTab('derivatives'); sound.button(); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'derivatives'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            المشتقات
          </button>
          <button
            onClick={() => { setActiveSubTab('morphology'); sound.button(); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'morphology'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            العلل الصرفية
          </button>
        </div>

        {/* Tab 1: Word Parsings */}
        {activeSubTab === 'words' && (
          <div className="space-y-2.5">
            {currentVerse.wordParsings.map((wp, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/30 transition-all flex flex-col sm:flex-row sm:items-start gap-2"
              >
                <div className="font-bold text-amber-300 text-sm sm:w-28 shrink-0 font-serif">
                  {wp.word}:
                </div>
                <div className="text-xs text-slate-200 leading-relaxed">
                  {wp.parsing}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Sentence Parsings */}
        {activeSubTab === 'sentences' && (
          <div className="space-y-2.5">
            {currentVerse.sentenceParsings.map((sp, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm font-serif">{sp.sentence}</span>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold">
                    {sp.status}
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  <span className="font-bold text-slate-300">التعليل: </span>
                  {sp.reason}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Derivatives */}
        {activeSubTab === 'derivatives' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentVerse.derivatives.map((dev, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300 text-sm font-serif">{dev.word}</span>
                  <span className="font-mono text-xs text-slate-400">وزنه: {dev.weight}</span>
                </div>
                <div className="text-xs text-white">
                  <span className="text-slate-400">نوع المشتق: </span>
                  {dev.type}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 4: Morphology Rules */}
        {activeSubTab === 'morphology' && (
          <div className="space-y-2.5">
            {currentVerse.morphologyRules.map((mr, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300 text-sm font-serif">{mr.word}</span>
                  <span className="text-xs px-2 py-0.5 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-bold">
                    {mr.ruleType}
                  </span>
                </div>
                <div className="text-xs text-slate-300 leading-relaxed">
                  <span className="font-bold text-slate-400">الشرح والتوضيح: </span>
                  {mr.explanation}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
