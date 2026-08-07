/**
 * Vacancy Parser
 * Extracts total vacancy, post-wise and category-wise counts from scraped job data.
 */

import { parseNumber, normalizeText } from './utils.js';

const CATEGORY_KEYWORDS = [
  'general', 'gen', 'ur', 'unreserved',
  'obc', 'other backward',
  'ews', 'economically weaker',
  'sc', 'scheduled caste',
  'st', 'scheduled tribe',
  'ph', 'pwd', 'pwbd', 'divyang', 'oh', 'hh', 'vh',
  'ex-serviceman', 'ex serviceman', 'esm',
  'female', 'women', 'male',
];

/**
 * Extract vacancy information.
 * @param {object} job - Scraped detail (must have posts[] and total_posts when available)
 * @returns {{
 *   total: number|null,
 *   posts: Array<{ post_name: string, total: number, eligibility?: string }>,
 *   byCategory: Object<string, number>|null
 * }}
 */
export function extractVacancy(job) {
  const result = {
    total: null,
    posts: [],
    byCategory: null,
  };

  if (!job || typeof job !== 'object') return result;

  // Prefer already-parsed posts from scraper
  if (Array.isArray(job.posts) && job.posts.length > 0) {
    result.posts = job.posts
      .filter((p) => p && p.post_name)
      .map((p) => ({
        post_name: String(p.post_name).trim(),
        total: parseNumber(p.total) || 0,
        eligibility: p.eligibility ? String(p.eligibility).trim() : '',
      }));

    const sum = result.posts.reduce((acc, p) => acc + (p.total || 0), 0);
    if (sum > 0) result.total = sum;
  }

  // Scraper may already provide total_posts
  if (job.total_posts != null) {
    const t = parseNumber(job.total_posts);
    if (t != null && t > 0) result.total = t;
  }

  // Fallback: try to find total from short_info / title
  if (result.total == null) {
    const text = `${job.title || ''} ${job.short_info || ''}`;
    const totalMatch =
      text.match(/total\s*(?:post|vacanc(?:y|ies)|seat)?s?\s*[:\-]?\s*(\d{1,6})/i) ||
      text.match(/(\d{1,6})\s*(?:post|vacanc(?:y|ies)|seat)s?\b/i);
    if (totalMatch) {
      const n = parseNumber(totalMatch[1]);
      if (n != null && n >= 1 && n <= 999999) result.total = n;
    }
  }

  // Category-wise extraction from posts eligibility or short_info
  const categoryMap = {};
  const searchText = [
    job.short_info || '',
    ...(result.posts.map((p) => p.eligibility || '')),
  ].join(' ');

  if (searchText) {
    // Patterns like "UR : 50", "OBC- 20", "SC:10"
    const catRe = /\b(UR|GEN|General|OBC|EWS|SC|ST|PH|PwBD|PwD|ESM|Ex[- ]?Serviceman|Female|Women)\s*[:\-–]?\s*(\d{1,5})\b/gi;
    let m;
    while ((m = catRe.exec(searchText)) !== null) {
      const key = normalizeCategory(m[1]);
      const val = parseNumber(m[2]);
      if (key && val != null) {
        categoryMap[key] = (categoryMap[key] || 0) + val;
      }
    }
  }

  if (Object.keys(categoryMap).length > 0) {
    result.byCategory = categoryMap;
  }

  return result;
}

function normalizeCategory(raw) {
  const t = normalizeText(raw);
  if (/^(ur|gen|general|unreserved)$/.test(t)) return 'UR';
  if (/^obc/.test(t)) return 'OBC';
  if (/^ews/.test(t)) return 'EWS';
  if (/^sc$/.test(t) || /scheduled caste/.test(t)) return 'SC';
  if (/^st$/.test(t) || /scheduled tribe/.test(t)) return 'ST';
  if (/^(ph|pwd|pwbd|divyang)/.test(t)) return 'PwBD';
  if (/ex.?serviceman|^esm$/.test(t)) return 'ESM';
  if (/female|women/.test(t)) return 'Female';
  return raw.trim().toUpperCase();
}

export default { extractVacancy };
