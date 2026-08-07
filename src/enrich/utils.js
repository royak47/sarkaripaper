/**
 * Shared utility functions for the Sarkari Result Enrichment Engine.
 * Cloudflare Workers compatible. Zero external dependencies.
 */

/**
 * Normalize text for matching: lowercase, collapse whitespace, remove noise.
 * @param {string} text
 * @returns {string}
 */
export function normalizeText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .replace(/[^\w\s\-./+&]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Clean and collapse whitespace while preserving original casing for display.
 * @param {string} text
 * @returns {string}
 */
export function cleanDisplayText(text) {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Extract a searchable corpus from a scraped job object.
 * Combines title, short_info, description, posts, etc.
 * @param {object} job - Scraped job detail
 * @returns {string}
 */
export function buildSearchCorpus(job) {
  if (!job || typeof job !== 'object') return '';
  const parts = [
    job.title || '',
    job.short_info || '',
    job.description || '',
    job.post_date || '',
  ];

  if (Array.isArray(job.posts)) {
    for (const p of job.posts) {
      parts.push(p.post_name || '', p.eligibility || '');
    }
  }

  if (job.dates && typeof job.dates === 'object') {
    parts.push(...Object.values(job.dates));
  }

  if (job.fees && typeof job.fees === 'object') {
    parts.push(...Object.keys(job.fees), ...Object.values(job.fees));
  }

  if (job.age_limit && typeof job.age_limit === 'object') {
    parts.push(...Object.values(job.age_limit));
  }

  if (Array.isArray(job.official_links)) {
    for (const l of job.official_links) {
      parts.push(l.label || '');
    }
  }

  return parts.filter(Boolean).join(' ');
}

/**
 * Parse a number that may contain commas or currency symbols.
 * @param {string|number} value
 * @returns {number|null}
 */
export function parseNumber(value) {
  if (value == null) return null;
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  const cleaned = String(value).replace(/[^\d.]/g, '');
  if (!cleaned) return null;
  const num = parseFloat(cleaned);
  return Number.isNaN(num) ? null : num;
}

/**
 * Score a match based on how it was found.
 * Exact alias / short match > pattern match > fuzzy.
 * @param {'exact'|'alias'|'pattern'|'fuzzy'|'keyword'} type
 * @param {number} extra
 * @returns {number} 0–1 confidence
 */
export function confidenceFromType(type, extra = 0) {
  const base = {
    exact: 0.98,
    alias: 0.92,
    pattern: 0.85,
    keyword: 0.75,
    fuzzy: 0.6,
  };
  const score = (base[type] || 0.5) + extra;
  return Math.min(1, Math.max(0, Math.round(score * 100) / 100));
}

/**
 * Simple token-set intersection ratio for lightweight fuzzy matching.
 * @param {string} a
 * @param {string} b
 * @returns {number} 0–1
 */
export function tokenSimilarity(a, b) {
  const ta = new Set(normalizeText(a).split(' ').filter(Boolean));
  const tb = new Set(normalizeText(b).split(' ').filter(Boolean));
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  return inter / Math.max(ta.size, tb.size);
}

/**
 * Escape special regex characters.
 * @param {string} str
 * @returns {string}
 */
export function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Test if a compiled regex or string pattern matches text.
 * @param {RegExp|string} pattern
 * @param {string} text
 * @returns {boolean}
 */
export function matches(pattern, text) {
  if (!pattern || !text) return false;
  if (pattern instanceof RegExp) return pattern.test(text);
  return normalizeText(text).includes(normalizeText(pattern));
}

/**
 * Compile pattern strings into RegExp objects (case-insensitive).
 * @param {string[]} patterns
 * @returns {RegExp[]}
 */
export function compilePatterns(patterns) {
  if (!Array.isArray(patterns)) return [];
  return patterns
    .map((p) => {
      try {
        return new RegExp(p, 'i');
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

/**
 * Deduplicate array of objects by a key function.
 * @param {Array} items
 * @param {Function} keyFn
 * @returns {Array}
 */
export function uniqueBy(items, keyFn) {
  const seen = new Set();
  return items.filter((item) => {
    const k = keyFn(item);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/**
 * Safe year extraction from title or text (e.g. 2025, 2026).
 * @param {string} text
 * @returns {number|null}
 */
export function extractYear(text) {
  if (!text) return null;
  const m = String(text).match(/\b(20[2-3]\d)\b/);
  return m ? parseInt(m[1], 10) : null;
}

/**
 * Generate a URL-safe slug segment from text.
 * @param {string} text
 * @returns {string}
 */
export function slugify(text) {
  if (!text) return '';
  return String(text)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Clamp a value between min and max.
 * @param {number} n
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}
