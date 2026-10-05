/**
 * BAC-240 Smart AI Local Cache
 * Provides sub-millisecond (0ms) instant responses for repeated curriculum queries
 * and caches answers safely in LocalStorage to save API quota on Firebase Spark plan.
 */

import { AIToolAction, AIPerformanceMetrics } from '../types';

export interface AICachedResponse {
  reply: string;
  rubricWarning?: string;
  toolActions?: AIToolAction[];
  usedModel: string;
  timestamp: number;
  ttlMs: number;
  hitCount: number;
  charCount: number;
}

const CACHE_STORAGE_KEY = 'bac240_ai_query_cache';
const CACHE_STATS_KEY = 'bac240_ai_cache_stats';
const MAX_CACHE_ENTRIES = 60; // Max items to keep in LocalStorage
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours TTL

export class AICacheService {
  private static memoryCache: Map<string, AICachedResponse> = new Map();
  private static isInitialized = false;

  /**
   * Initializes cache from localStorage
   */
  private static init(): void {
    if (this.isInitialized || typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(CACHE_STORAGE_KEY);
      if (stored) {
        const parsed: Record<string, AICachedResponse> = JSON.parse(stored);
        const now = Date.now();
        for (const [k, v] of Object.entries(parsed)) {
          // Check TTL expiration
          if (v.timestamp + (v.ttlMs || DEFAULT_TTL_MS) > now) {
            this.memoryCache.set(k, v);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load AI query cache:', e);
    }
    this.isInitialized = true;
  }

  /**
   * Generates a normalized deterministic cache key for questions
   */
  static generateKey(params: {
    question?: string;
    subjectName?: string;
    lessonName?: string;
    explanationMode?: string;
    hasAttachments?: boolean;
  }): string | null {
    // Never cache attachment-based or image-based queries
    if (params.hasAttachments) return null;
    const q = (params.question || '').trim().toLowerCase();
    if (!q || q.length < 3) return null;

    // Do not cache imperative student tool action commands (like "ضع علامة إنجاز", "أضف لبنك الأخطاء")
    const isActionCommand = /(أضف|احفظ|علم|انجزت|أنهيت|انتقل|افتح|شغل|انشئ|أنشئ|فلاش كارد)/i.test(q);
    if (isActionCommand && q.length < 50) return null;

    const subject = (params.subjectName || '').trim();
    const lesson = (params.lessonName || '').trim();
    const mode = params.explanationMode || 'notebook';

    // Normalize spacing and Arabic diacritics
    const cleanQ = q
      .replace(/[\u064B-\u065F]/g, '') // remove tashkeel
      .replace(/[؟?.,!،]/g, '') // remove punctuation
      .replace(/\s+/g, ' ');

    return `q:${subject}::${lesson}::${mode}::${cleanQ}`;
  }

  /**
   * Retrieves a cached response if valid
   */
  static get(key: string | null): AICachedResponse | null {
    if (!key) return null;
    this.init();

    const cached = this.memoryCache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (cached.timestamp + (cached.ttlMs || DEFAULT_TTL_MS) <= now) {
      this.memoryCache.delete(key);
      this.persist();
      return null;
    }

    // Increment hit count
    cached.hitCount = (cached.hitCount || 0) + 1;
    this.incrementGlobalHitStat(cached.charCount || cached.reply.length);
    this.persist();
    return cached;
  }

  /**
   * Stores response in local cache
   */
  static set(
    key: string | null,
    data: {
      reply: string;
      rubricWarning?: string;
      toolActions?: AIToolAction[];
      usedModel: string;
      ttlMs?: number;
    }
  ): void {
    if (!key || !data.reply || data.reply.length < 10) return;
    // Don't cache error replies
    if (data.reply.includes('⚠️') && data.reply.includes('خطأ')) return;

    this.init();

    // Evict oldest entries if cache limit reached (LRU style)
    if (this.memoryCache.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = this.memoryCache.keys().next().value;
      if (oldestKey) this.memoryCache.delete(oldestKey);
    }

    const entry: AICachedResponse = {
      reply: data.reply,
      rubricWarning: data.rubricWarning,
      toolActions: data.toolActions,
      usedModel: data.usedModel,
      timestamp: Date.now(),
      ttlMs: data.ttlMs || DEFAULT_TTL_MS,
      hitCount: 0,
      charCount: data.reply.length
    };

    this.memoryCache.set(key, entry);
    this.persist();
  }

  /**
   * Persists cache Map to localStorage
   */
  private static persist(): void {
    if (typeof window === 'undefined') return;
    try {
      const obj: Record<string, AICachedResponse> = {};
      this.memoryCache.forEach((v, k) => {
        obj[k] = v;
      });
      localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(obj));
    } catch {
      // LocalStorage full, clear half
      this.memoryCache.clear();
    }
  }

  /**
   * Increments global hit statistics
   */
  private static incrementGlobalHitStat(chars: number): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(CACHE_STATS_KEY);
      const stats = raw ? JSON.parse(raw) : { totalHits: 0, savedChars: 0 };
      stats.totalHits = (stats.totalHits || 0) + 1;
      stats.savedChars = (stats.savedChars || 0) + chars;
      localStorage.setItem(CACHE_STATS_KEY, JSON.stringify(stats));
    } catch {}
  }

  /**
   * Retrieves overall stats for the Performance Monitor
   */
  static getStats(): {
    cachedQueriesCount: number;
    totalHits: number;
    savedTokensEstimate: number;
    storageUsedKb: number;
  } {
    this.init();
    let totalHits = 0;
    let savedChars = 0;

    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(CACHE_STATS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          totalHits = parsed.totalHits || 0;
          savedChars = parsed.savedChars || 0;
        }
      } catch {}
    }

    let approxBytes = 0;
    this.memoryCache.forEach((v) => {
      approxBytes += v.reply.length * 2 + 100;
    });

    return {
      cachedQueriesCount: this.memoryCache.size,
      totalHits,
      savedTokensEstimate: Math.round(savedChars / 3.5),
      storageUsedKb: Math.round(approxBytes / 1024)
    };
  }

  /**
   * Clears all local AI cache
   */
  static clear(): void {
    this.memoryCache.clear();
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(CACHE_STORAGE_KEY);
        localStorage.removeItem(CACHE_STATS_KEY);
      } catch {}
    }
  }
}
