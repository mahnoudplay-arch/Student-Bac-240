import React, { useState, useMemo } from 'react';
import katex from 'katex';
import { 
  AlertTriangle, 
  Lightbulb, 
  Compass, 
  Sparkles, 
  Check, 
  Copy, 
  Terminal, 
  Quote, 
  Sigma, 
  FileCheck,
  Play,
  ExternalLink,
  Youtube,
  ArrowLeft
} from 'lucide-react';
import { useApp, NavTab } from '../context/AppContext';
import { sound } from '../services/sound';

interface FormattedAIMessageProps {
  content: string;
  isStreaming?: boolean;
}

interface ParsedSection {
  type: 'concept' | 'math' | 'rubric' | 'general';
  title: string;
  body: string;
}

/**
 * Interactive YouTube Video Card inside AI response
 */
const InteractiveYouTubeCard: React.FC<{ url: string; ytId: string; customTitle?: string }> = ({ url, ytId, customTitle }) => {
  const { videos, setActiveTheaterVideo } = useApp();
  const matchedVideo = videos.find(v => v.youtubeId === ytId);

  const displayTitle = matchedVideo ? matchedVideo.title : (customTitle || 'فيديو شرح المنهاج السوري');
  const displayTeacher = matchedVideo?.teacherName || 'أستاذ المادة المعتمد';

  return (
    <div className="my-3 p-3 rounded-2xl bg-gradient-to-r from-[#0d1424] via-[#0f172a] to-[#1e1b4b] border border-rose-500/30 hover:border-rose-500/50 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs transition-all select-none">
      <div className="flex items-center gap-3 min-w-0">
        <div 
          className="relative w-20 h-13 rounded-xl overflow-hidden bg-slate-950 border border-slate-750 shrink-0 group cursor-pointer shadow-md"
          onClick={() => {
            if (matchedVideo) {
              setActiveTheaterVideo(matchedVideo);
            } else {
              window.open(url, '_blank');
            }
          }}
          title="مشاهدة الفيديو"
        >
          <img 
            src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} 
            alt="" 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-colors">
            <Play className="w-4 h-4 text-white fill-current" />
          </div>
        </div>

        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-1.5 text-rose-400 font-bold text-[10px]">
            <Youtube className="w-3.5 h-3.5" />
            <span>فيديو تعليمي معتمد في المنصة</span>
          </div>
          <h4 className="font-bold text-white text-xs truncate max-w-xs sm:max-w-md">
            {displayTitle}
          </h4>
          <p className="text-[10px] text-slate-300">
            إعداد وشرح: <strong className="text-white">{displayTeacher}</strong>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
        {matchedVideo ? (
          <button
            onClick={() => setActiveTheaterVideo(matchedVideo)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs shadow-md shadow-rose-900/40 transition-all active:scale-95"
            title="مشاهدة الفيديو داخل مسرح المنصة بدون تشتيت"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>مشاهدة في المسرح</span>
          </button>
        ) : (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
          >
            <ExternalLink className="w-3 h-3" />
            <span>فتح في يوتيوب</span>
          </a>
        )}
      </div>
    </div>
  );
};

/**
 * Interactive Code Block Component with 1-click Copy
 */
const CodeBlockCard: React.FC<{ code: string; language?: string }> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-2xl bg-[#060a11] border border-slate-800 overflow-hidden shadow-xl text-xs" dir="ltr">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-900/90 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
        <div className="flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-slate-300 font-bold">{language || 'code'}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white transition-all active:scale-95 shadow-sm"
          title="نسخ الكود"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'تم النسخ ✓' : 'نسخ'}</span>
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto font-mono text-slate-200 text-xs sm:text-[13px] leading-relaxed scrollbar-thin">
        <code>{code}</code>
      </pre>
    </div>
  );
};

/**
 * FormattedAIMessage Component
 * Fully renders Markdown, KaTeX STEM equations, code blocks, lists, and quotes
 * with zero raw syntax leakage (###, **, ---).
 */
export const FormattedAIMessage: React.FC<FormattedAIMessageProps> = ({ content, isStreaming }) => {
  const { setActiveTab, videos, setActiveTheaterVideo } = useApp();

  /**
   * Helper to render inline content:
   * 1. Inline LaTeX ($...$ or \(...\))
   * 2. Inline Code (`...`)
   * 3. Bold (**...**)
   * 4. Italic (*...* or _..._)
   * 5. Interactive Section Navigation & Video Links ([text](url))
   * 6. Clean text without stray markdown symbols
   */
  const renderInlineContent = (rawText: string) => {
    if (!rawText) return null;

    // Pattern matches inline math ($...$ or \(...\)), inline code (`...`), bold (**...**), italic (*...* or _..._), links ([...](...))
    const regex = /(?:\$([^\$\n]+?)\$|\\\(([\s\S]*?)\\\)|`([^`\n]+?)`|\*\*([^\*]+?)\*\*|\*([^\*\n]+?)\*|_([^\n_]+?)_|\[([^\]]+?)\]\(([^\s\)]+)\))/g;

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(rawText)) !== null) {
      const start = match.index;
      if (start > lastIndex) {
        const plainText = rawText.slice(lastIndex, start);
        parts.push(sanitizePlainText(plainText, `plain_${lastIndex}`));
      }

      // 1. Inline Math: $...$ or \(...\)
      if (match[1] || match[2]) {
        const formula = (match[1] || match[2] || '').trim();
        let renderedHtml = '';
        try {
          renderedHtml = katex.renderToString(formula, {
            displayMode: false,
            throwOnError: false,
            strict: 'ignore'
          });
        } catch {
          renderedHtml = `<span class="font-mono text-cyan-300">${formula}</span>`;
        }

        parts.push(
          <span
            key={`math_${start}`}
            className="inline-block px-1.5 py-0.5 mx-1 rounded-md bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 text-xs font-mono align-middle shadow-xs"
            dir="ltr"
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        );
      }
      // 2. Inline Code: `...`
      else if (match[3]) {
        parts.push(
          <code
            key={`code_${start}`}
            className="px-1.5 py-0.5 mx-0.5 rounded-md bg-slate-900 border border-slate-750 text-amber-300 font-mono text-[11px] sm:text-xs dir-ltr inline-block align-middle"
          >
            {match[3]}
          </code>
        );
      }
      // 3. Bold: **...**
      else if (match[4]) {
        parts.push(
          <strong key={`bold_${start}`} className="font-bold text-white tracking-wide">
            {match[4]}
          </strong>
        );
      }
      // 4. Italic: *...* or _..._
      else if (match[5] || match[6]) {
        parts.push(
          <em key={`italic_${start}`} className="italic text-slate-200">
            {match[5] || match[6]}
          </em>
        );
      }
      // 5. Interactive Links: [label](target)
      else if (match[7] && match[8]) {
        const linkLabel = match[7].trim();
        const linkTarget = match[8].trim();

        // A. Section Navigation Target (e.g. section:mistakeBank, tab:writtenExams, #plan)
        const isSectionLink = linkTarget.startsWith('section:') || 
                              linkTarget.startsWith('tab:') || 
                              linkTarget.startsWith('#section:') || 
                              linkTarget.startsWith('#tab:') ||
                              ['mistakeBank', 'writtenExams', 'plan', 'curriculum', 'youtube', 'flashcards', 'mindmaps', 'timer', 'tools', 'challenge', 'journey', 'community', 'profile', 'dashboard'].includes(linkTarget);

        if (isSectionLink) {
          const tabId = linkTarget.replace(/^#?(?:section|tab):/, '') as NavTab;
          parts.push(
            <button
              key={`sec_${start}`}
              type="button"
              onClick={() => {
                setActiveTab(tabId);
                sound.playTick();
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 mx-1 my-0.5 rounded-xl bg-indigo-600/25 hover:bg-indigo-600/45 border border-indigo-500/40 text-indigo-200 hover:text-white font-bold text-xs transition-all active:scale-95 shadow-sm align-middle group cursor-pointer"
              title={`الانتقال المباشر إلى قسم: ${linkLabel}`}
            >
              <Compass className="w-3.5 h-3.5 text-indigo-400 group-hover:rotate-45 transition-transform shrink-0" />
              <span>{linkLabel}</span>
              <ArrowLeft className="w-3 h-3 text-indigo-300 group-hover:-translate-x-0.5 transition-transform shrink-0" />
            </button>
          );
        } else {
          // B. YouTube Video Link Target
          const ytMatch = linkTarget.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
          if (ytMatch) {
            const ytId = ytMatch[1];
            const matchedVid = videos.find(v => v.youtubeId === ytId);
            parts.push(
              <button
                key={`ytlink_${start}`}
                type="button"
                onClick={() => {
                  if (matchedVid) {
                    setActiveTheaterVideo(matchedVid);
                  } else {
                    window.open(linkTarget, '_blank');
                  }
                  sound.playTick();
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 mx-1 my-0.5 rounded-xl bg-rose-600/25 hover:bg-rose-600/45 border border-rose-500/40 text-rose-200 hover:text-white font-bold text-xs transition-all active:scale-95 shadow-sm align-middle group cursor-pointer"
                title="مشاهدة الفيديو في مسرح المنصة"
              >
                <Youtube className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>{linkLabel}</span>
                <Play className="w-3 h-3 text-white fill-current shrink-0" />
              </button>
            );
          } else {
            // C. Standard Web Link
            parts.push(
              <a
                key={`link_${start}`}
                href={linkTarget}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 underline font-semibold transition-colors inline-flex items-center gap-0.5"
              >
                <span>{linkLabel}</span>
                <ExternalLink className="w-2.5 h-2.5 inline-block opacity-70" />
              </a>
            );
          }
        }
      }

      lastIndex = start + match[0].length;
    }

    if (lastIndex < rawText.length) {
      parts.push(sanitizePlainText(rawText.slice(lastIndex), `plain_${lastIndex}`));
    }

    return parts;
  };

  /**
   * Cleans any orphaned or stray formatting tokens from plain text
   */
  const sanitizePlainText = (text: string, key: string): React.ReactNode => {
    // Strip orphaned stray hashtags or lone asterisks
    const cleaned = text.replace(/#{2,}/g, '').replace(/\*{2,}/g, '');
    return <span key={key}>{cleaned}</span>;
  };

  /**
   * Renders a block of content (extracting code blocks, display math, quotes, lists, headings, and paragraphs)
   */
  const renderSubBlock = (rawText: string, blockKey: string) => {
    // 1. Separate Multi-line Code Blocks (```lang ... ```)
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const segments: Array<{ type: 'code' | 'displayMath' | 'content'; val: string; lang?: string }> = [];
    let lastPos = 0;
    let codeMatch: RegExpExecArray | null;

    while ((codeMatch = codeBlockRegex.exec(rawText)) !== null) {
      if (codeMatch.index > lastPos) {
        segments.push({ type: 'content', val: rawText.slice(lastPos, codeMatch.index) });
      }
      segments.push({
        type: 'code',
        lang: codeMatch[1] || 'code',
        val: codeMatch[2]
      });
      lastPos = codeMatch.index + codeMatch[0].length;
    }
    if (lastPos < rawText.length) {
      segments.push({ type: 'content', val: rawText.slice(lastPos) });
    }

    // 2. Further split content segments for display math ($$...$$ or \[...\])
    const processedSegments: Array<{ type: 'code' | 'displayMath' | 'text'; val: string; lang?: string }> = [];
    const displayMathRegex = /(?:\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\])/g;

    for (const seg of segments) {
      if (seg.type === 'code') {
        processedSegments.push({
          type: 'code',
          val: seg.val,
          lang: seg.lang
        });
        continue;
      }

      let mPos = 0;
      let dMatch: RegExpExecArray | null;
      while ((dMatch = displayMathRegex.exec(seg.val)) !== null) {
        if (dMatch.index > mPos) {
          processedSegments.push({ type: 'text', val: seg.val.slice(mPos, dMatch.index) });
        }
        processedSegments.push({
          type: 'displayMath',
          val: dMatch[1] || dMatch[2] || ''
        });
        mPos = dMatch.index + dMatch[0].length;
      }
      if (mPos < seg.val.length) {
        processedSegments.push({ type: 'text', val: seg.val.slice(mPos) });
      }
    }

    return (
      <div key={blockKey} className="space-y-2.5">
        {processedSegments.map((segment, segIdx) => {
          // A. Code Block
          if (segment.type === 'code') {
            return (
              <CodeBlockCard
                key={`code_${segIdx}`}
                code={segment.val.trim()}
                language={segment.lang}
              />
            );
          }

          // B. Display Math ($$...$$)
          if (segment.type === 'displayMath') {
            let mathHtml = '';
            try {
              mathHtml = katex.renderToString(segment.val.trim(), {
                displayMode: true,
                throwOnError: false,
                strict: 'ignore'
              });
            } catch {
              mathHtml = `<pre class="font-mono text-cyan-300 text-xs">${segment.val}</pre>`;
            }

            return (
              <div
                key={`dm_${segIdx}`}
                className="my-3 p-3.5 sm:p-4 rounded-2xl bg-[#060a12] border border-cyan-500/30 overflow-x-auto text-center scrollbar-thin shadow-inner"
                dir="ltr"
              >
                <div
                  className="inline-block min-w-full text-cyan-100"
                  dangerouslySetInnerHTML={{ __html: mathHtml }}
                />
              </div>
            );
          }

          // C. Text Lines (Processing Markdown Headings, Horizontal Rules, Quotes, Lists, Paragraphs)
          const lines = segment.val.split('\n');
          const elements: React.ReactNode[] = [];
          let currentQuoteLines: string[] = [];

          const flushQuote = (qKey: string) => {
            if (currentQuoteLines.length > 0) {
              const quoteContent = currentQuoteLines.join(' ');
              elements.push(
                <div
                  key={qKey}
                  className="border-r-4 border-indigo-500 bg-indigo-950/30 p-3 rounded-l-2xl my-2.5 text-indigo-200 text-xs sm:text-sm leading-relaxed space-y-1 shadow-sm"
                >
                  <div className="flex items-center gap-1.5 text-indigo-400 font-bold text-xs mb-0.5">
                    <Quote className="w-3.5 h-3.5 shrink-0" />
                    <span>ملاحظة وتوجيه:</span>
                  </div>
                  <div>{renderInlineContent(quoteContent)}</div>
                </div>
              );
              currentQuoteLines = [];
            }
          };

          for (let l = 0; l < lines.length; l++) {
            const line = lines[l];
            const trimmed = line.trim();

            if (!trimmed) {
              flushQuote(`q_${l}`);
              continue;
            }

            // 1. Blockquote: starts with ">"
            if (trimmed.startsWith('>')) {
              currentQuoteLines.push(trimmed.replace(/^>\s*/, ''));
              continue;
            }
            flushQuote(`q_${l}`);

            // 2. Horizontal Divider: "---", "***", "___"
            if (/^[-*_]{3,}$/.test(trimmed)) {
              elements.push(
                <div key={`hr_${l}`} className="py-2">
                  <hr className="border-t border-slate-800/80 my-2" />
                </div>
              );
              continue;
            }

            // 2.5 YouTube Video URL Detection -> Render Interactive Card
            const ytMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
            if (ytMatch) {
              const ytId = ytMatch[1];
              const fullUrl = `https://www.youtube.com/watch?v=${ytId}`;
              const remainingLabel = trimmed.replace(ytMatch[0], '').replace(/^[-*•\s\(\)\[\]]+|[-*•\s\(\)\[\]]+$/g, '').trim();

              elements.push(
                <InteractiveYouTubeCard
                  key={`yt_${l}`}
                  url={fullUrl}
                  ytId={ytId}
                  customTitle={remainingLabel || undefined}
                />
              );
              continue;
            }

            // 3. Headings: "#", "##", "###", "####", "#####", "######"
            const headMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
            if (headMatch) {
              const level = headMatch[1].length;
              // Clean any asterisks or hashtags from the text
              const rawTitle = headMatch[2].replace(/^[*_#\s]+|[*_#\s]+$/g, '');
              
              if (level === 1) {
                elements.push(
                  <h2 key={`h_${l}`} className="text-sm sm:text-base font-black text-indigo-300 flex items-center gap-2 pt-3 pb-1 border-b border-indigo-500/20">
                    <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>{renderInlineContent(rawTitle)}</span>
                  </h2>
                );
              } else if (level === 2) {
                elements.push(
                  <h3 key={`h_${l}`} className="text-xs sm:text-sm font-bold text-sky-300 flex items-center gap-2 pt-2.5 pb-1">
                    <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
                    <span>{renderInlineContent(rawTitle)}</span>
                  </h3>
                );
              } else if (level === 3) {
                elements.push(
                  <h4 key={`h_${l}`} className="text-xs sm:text-sm font-bold text-emerald-300 flex items-center gap-1.5 pt-2 pb-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span>{renderInlineContent(rawTitle)}</span>
                  </h4>
                );
              } else {
                elements.push(
                  <h5 key={`h_${l}`} className="text-xs font-bold text-amber-300 flex items-center gap-1.5 pt-1.5 pb-0.5">
                    <span className="w-1 h-1 rounded-full bg-amber-400 shrink-0" />
                    <span>{renderInlineContent(rawTitle)}</span>
                  </h5>
                );
              }
              continue;
            }

            // 4. Numbered List: "1. ..." or "2) ..."
            const numMatch = trimmed.match(/^(\d+)[\.\)]\s+(.*)$/);
            if (numMatch) {
              elements.push(
                <div key={`nl_${l}`} className="flex items-start gap-2.5 my-1.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-[11px] font-bold text-indigo-300 font-mono mt-0.5 shadow-xs">
                    {numMatch[1]}
                  </span>
                  <div className="flex-1 min-w-0 text-slate-200 text-xs sm:text-sm leading-relaxed">
                    {renderInlineContent(numMatch[2])}
                  </div>
                </div>
              );
              continue;
            }

            // 5. Bullet List: "- ", "* ", "• "
            if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
              const itemText = trimmed.replace(/^[-*•]\s+/, '');
              elements.push(
                <div key={`bl_${l}`} className="flex items-start gap-2.5 my-1.5 pr-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 mt-2 shrink-0 shadow-xs" />
                  <div className="flex-1 min-w-0 text-slate-200 text-xs sm:text-sm leading-relaxed">
                    {renderInlineContent(itemText)}
                  </div>
                </div>
              );
              continue;
            }

            // 6. Regular Paragraph (Sanitizing any raw unclosed hashtags)
            elements.push(
              <p key={`p_${l}`} className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                {renderInlineContent(trimmed)}
              </p>
            );
          }

          flushQuote(`q_end`);

          return (
            <div key={`txt_${segIdx}`} className="space-y-1.5">
              {elements}
            </div>
          );
        })}
      </div>
    );
  };

  /**
   * Structure whole content into Syrian Baccalaureate Specialized Cards:
   * 💡 الفكرة والاستنتاج العلمي
   * 📐 القوانين والعمليات الرياضية
   * ⚠️ تنبيه السلم الوزاري 2026
   */
  const sections = useMemo(() => {
    if (!content) return [];

    const lines = content.split('\n');
    const result: ParsedSection[] = [];
    let currentType: 'concept' | 'math' | 'rubric' | 'general' = 'general';
    let currentTitle = '';
    let currentLines: string[] = [];

    const flushCurrent = () => {
      if (currentLines.length > 0 || currentTitle) {
        result.push({
          type: currentType,
          title: currentTitle,
          body: currentLines.join('\n').trim()
        });
        currentLines = [];
        currentTitle = '';
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Check header matches
      const isHeader = trimmed.startsWith('#') || (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length < 70);

      // Clean title helper: removes all #, **, and emoji duplicates
      const cleanHeaderTitle = (raw: string) => {
        return raw.replace(/^#+\s*|\*+|\b[💡📐⚠️]\b/g, '').trim();
      };

      // 1. Concept Card (💡 الفكرة والاستنتاج العلمي)
      if (
        isHeader && (trimmed.includes('الفكرة') || trimmed.includes('الاستنتاج') || trimmed.includes('المفهوم') || trimmed.includes('💡'))
      ) {
        flushCurrent();
        currentType = 'concept';
        currentTitle = cleanHeaderTitle(trimmed) || 'الفكرة والاستنتاج العلمي';
        continue;
      }

      // 2. Math/Physics Blackboard Card (📐 القوانين والعمليات الرياضية)
      if (
        isHeader && (trimmed.includes('القوانين') || trimmed.includes('العمليات الرياضية') || trimmed.includes('المعادلات') || trimmed.includes('الحساب') || trimmed.includes('📐'))
      ) {
        flushCurrent();
        currentType = 'math';
        currentTitle = cleanHeaderTitle(trimmed) || 'القوانين والعمليات الرياضية والفيزيائية';
        continue;
      }

      // 3. Rubric Card (⚠️ تنبيه السلم الوزاري 2026)
      if (
        trimmed.includes('تنبيه السلم الوزاري') || 
        trimmed.includes('سلم التصحيح') || 
        (isHeader && (trimmed.includes('السلم') || trimmed.includes('فخاخ السلم') || trimmed.includes('⚠️')))
      ) {
        flushCurrent();
        currentType = 'rubric';
        currentTitle = cleanHeaderTitle(trimmed) || 'تنبيه السلم الوزاري 2026';
        continue;
      }

      // 4. Any other Header: flush as general with title
      const genericHeaderMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (genericHeaderMatch) {
        flushCurrent();
        currentType = 'general';
        currentTitle = cleanHeaderTitle(genericHeaderMatch[2]);
        continue;
      }

      currentLines.push(line);
    }

    flushCurrent();
    return result;
  }, [content]);

  if (!content) return null;

  return (
    <div className="space-y-3.5 select-text leading-relaxed" dir="rtl">
      {sections.map((sec, idx) => {
        // 💡 1. Concept Card
        if (sec.type === 'concept') {
          return (
            <div
              key={`sec_${idx}`}
              className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-slate-900/70 to-slate-900/50 p-4 sm:p-5 shadow-sm space-y-2.5 transition-all hover:border-indigo-500/40"
            >
              <div className="flex items-center gap-2 font-bold text-indigo-300 text-xs sm:text-sm border-b border-indigo-500/20 pb-2">
                <Lightbulb className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>{sec.title || 'الفكرة والاستنتاج العلمي'}</span>
              </div>
              <div className="text-slate-200">
                {renderSubBlock(sec.body, `b_${idx}`)}
              </div>
            </div>
          );
        }

        // 📐 2. Math & Physics Blackboard Card
        if (sec.type === 'math') {
          return (
            <div
              key={`sec_${idx}`}
              className="rounded-2xl border border-cyan-500/30 bg-[#090f19] p-4 sm:p-5 shadow-inner space-y-2.5 transition-all hover:border-cyan-500/40"
            >
              <div className="flex items-center gap-2 font-bold text-cyan-300 text-xs sm:text-sm border-b border-cyan-500/20 pb-2">
                <Compass className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{sec.title || 'القوانين والعمليات الرياضية والفيزيائية'}</span>
              </div>
              <div className="text-cyan-100">
                {renderSubBlock(sec.body, `b_${idx}`)}
              </div>
            </div>
          );
        }

        // ⚠️ 3. Rubric Card
        if (sec.type === 'rubric') {
          return (
            <div
              key={`sec_${idx}`}
              className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-950/40 via-amber-950/20 to-slate-900/60 p-4 sm:p-5 shadow-sm space-y-2.5 transition-all hover:border-amber-500/50"
            >
              <div className="flex items-center gap-2 font-bold text-amber-300 text-xs sm:text-sm border-b border-amber-500/25 pb-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{sec.title || 'تنبيه السلم الوزاري 2026 ونقاط التدقيق'}</span>
              </div>
              <div className="text-amber-100/90 pr-1">
                {renderSubBlock(sec.body, `b_${idx}`)}
              </div>
            </div>
          );
        }

        // 4. General section / Title
        return (
          <div key={`sec_${idx}`} className="space-y-2">
            {sec.title && (
              <h3 className="text-xs sm:text-sm font-black text-indigo-300 flex items-center gap-1.5 pt-1.5 pb-1 border-b border-slate-800/80">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>{renderInlineContent(sec.title)}</span>
              </h3>
            )}
            {renderSubBlock(sec.body, `b_${idx}`)}
          </div>
        );
      })}

      {isStreaming && (
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 mt-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[11px] font-mono animate-pulse select-none">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
          <span>جاري البث الحي وتنسيق المعادلات... ▌</span>
        </div>
      )}
    </div>
  );
};
